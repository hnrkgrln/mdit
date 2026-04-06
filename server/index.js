const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Client } = require('ssh2');
const { nanoid } = require('nanoid');
const path = require('path');

const app = express();
const port = process.env.PORT || 3002;

app.use(cors());
app.use(bodyParser.json());

// Serve static files from the frontend dist directory if it exists
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Request logger for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'SSH Backend is running' });
});

// In-memory session storage
const sessions = new Map();

app.post('/api/ssh/connect', (req, res) => {
  const { host, port = 22, username, password, privateKey, passphrase } = req.body;
  
  if (!host || !username) {
    return res.status(400).json({ error: 'Host and username are required' });
  }

  try {
    const conn = new Client();
    const sessionId = nanoid();
    let hasResponded = false;

    const sshConfig = {
      host,
      port,
      username,
      readyTimeout: 20000,
    };

    if (password && password.trim()) sshConfig.password = password;
    if (privateKey && privateKey.trim()) sshConfig.privateKey = privateKey.trim();
    if (passphrase && passphrase.trim()) sshConfig.passphrase = passphrase.trim();

    console.log('SSH Config keys:', Object.keys(sshConfig));

    conn.on('ready', () => {
      console.log('SSH Connection Ready');
      conn.sftp((err, sftp) => {
        if (err) {
          console.error('SFTP Subsystem Error:', err);
          if (!hasResponded) {
            hasResponded = true;
            conn.end();
            return res.status(500).json({ error: 'Failed to start SFTP session (Is SFTP enabled on the server?): ' + err.message });
          }
          return;
        }
        
        sessions.set(sessionId, { conn, sftp, lastUsed: Date.now() });
        if (!hasResponded) {
          hasResponded = true;
          res.json({ sessionId });
        }
      });
    }).on('error', (err) => {
      console.error('SSH Connection Error:', err);
      if (!hasResponded) {
        hasResponded = true;
        res.status(500).json({ error: 'SSH Connection Error: ' + err.message });
      }
    }).on('end', () => {
      sessions.delete(sessionId);
    }).connect(sshConfig);
  } catch (err) {
    console.error('Synchronous Connection Error:', err);
    res.status(500).json({ error: 'Failed to initiate connection: ' + err.message });
  }
});

app.get('/api/ssh/ls', (req, res) => {
  const { sessionId, path = '.' } = req.query;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  session.lastUsed = Date.now();
  session.sftp.readdir(path, (err, list) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to list directory: ' + err.message });
    }
    
    const entries = list.map(item => ({
      name: item.filename,
      isDirectory: item.attrs.isDirectory(),
      size: item.attrs.size,
      mtime: item.attrs.mtime
    })).sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });

    res.json({ entries });
  });
});

app.get('/api/ssh/read', (req, res) => {
  const { sessionId, path } = req.query;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  if (!path) {
    return res.status(400).json({ error: 'Path is required' });
  }

  session.lastUsed = Date.now();
  const stream = session.sftp.createReadStream(path);
  let content = '';

  stream.on('data', (chunk) => {
    content += chunk;
  }).on('end', () => {
    res.json({ content });
  }).on('error', (err) => {
    res.status(500).json({ error: 'Failed to read file: ' + err.message });
  });
});

app.post('/api/ssh/write', (req, res) => {
  const { sessionId, path, content } = req.body;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  if (!path) {
    return res.status(400).json({ error: 'Path is required' });
  }

  session.lastUsed = Date.now();
  session.sftp.writeFile(path, content, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to write file: ' + err.message });
    }
    res.json({ success: true });
  });
});

app.post('/api/ssh/disconnect', (req, res) => {
  const { sessionId } = req.body;
  const session = sessions.get(sessionId);

  if (session) {
    session.conn.end();
    sessions.delete(sessionId);
  }
  res.json({ success: true });
});

// Catch-all 404 handler
app.use((req, res) => {
  console.log(`[404] ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error: ' + err.message });
});

// Periodic cleanup of stale sessions (sessions older than 30 mins)
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (now - session.lastUsed > 30 * 60 * 1000) {
      console.log(`Cleaning up stale session: ${id}`);
      session.conn.end();
      sessions.delete(id);
    }
  }
}, 5 * 60 * 1000);

app.listen(port, () => {
  console.log(`SSH Backend listening at http://localhost:${port}`);
});
