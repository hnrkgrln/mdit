import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { Client } from 'ssh2';
import { nanoid } from 'nanoid';
import path from 'path';
import crypto from 'crypto';

const serverSecret = crypto.randomBytes(32).toString('hex');

const app: Express = express();
const port = process.env.PORT || 3002;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3002'] }));
app.use(bodyParser.json());

// Request logger for debugging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Security: Sanitize path to prevent directory traversal
const sanitizePath = (p: string | undefined): string | undefined => {
  if (!p) return p;
  return p.replace(/\.\.\//g, '').replace(/\.\./g, '').replace(/\x00/g, '');
};

// API Routes - Define these BEFORE static serving to avoid 404s
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'SSH Backend is running' });
});

// In-memory session storage
const sessions = new Map<string, { conn: Client; sftp: any; lastUsed: number }>();

function verifySessionToken(token: any): string | null {
  if (typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [sessionId, signature] = parts;
  
  const expectedSignature = crypto.createHmac('sha256', serverSecret).update(sessionId).digest('hex');
  
  try {
    const signatureBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    
    if (signatureBuffer.length !== expectedBuffer.length) {
      return null;
    }
    
    if (crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
      return sessionId;
    }
  } catch (e) {
    return null;
  }
  
  return null;
}

// SSH Types
interface SshConfig {
  host: string;
  port?: number;
  username: string;
  password?: string;
  privateKey?: string;
  passphrase?: string;
}

interface SshConnectionError extends Error {
  code?: string;
}

app.post('/api/ssh/connect', (req: Request, res: Response) => {
  const { host, port = 22, username, password, privateKey, passphrase } = req.body as SshConfig;
  
  if (!host || !username) {
    return res.status(400).json({ error: 'Host and username are required' });
  }

  try {
    const conn = new Client();
    const sessionId = nanoid();
    let hasResponded = false;

    const sshConfig: SshConfig = {
      host,
      port,
      username,
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
            return res.status(500).json({ 
              error: 'Failed to start SFTP session (Is SFTP enabled on the server?): ' + err.message 
            });
          }
          return;
        }
        
        sessions.set(sessionId, { conn, sftp, lastUsed: Date.now() });
        if (!hasResponded) {
          hasResponded = true;
          const signature = crypto.createHmac('sha256', serverSecret).update(sessionId).digest('hex');
          const sessionToken = `${sessionId}.${signature}`;
          res.json({ sessionId: sessionToken });
        }
      });
    }).on('error', (err: SshConnectionError) => {
      console.error('SSH Connection Error:', err);
      if (!hasResponded) {
        hasResponded = true;
        res.status(500).json({ error: 'SSH Connection Error: ' + err.message });
      }
    }).on('end', () => {
      sessions.delete(sessionId);
    }).connect(sshConfig);
  } catch (err: unknown) {
    console.error('Synchronous Connection Error:', err);
    const error = err as Error;
    res.status(500).json({ error: 'Failed to initiate connection: ' + error.message });
  }
});

app.get('/api/ssh/ls', (req: Request, res: Response) => {
  const { sessionId: token, path: dirPath = '.' } = req.query;
  const sessionId = verifySessionToken(token);

  if (!sessionId) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  session.lastUsed = Date.now();
  const safePath = sanitizePath(dirPath as string) as string;
  session.sftp.readdir(safePath, (err: Error | null, list: any[]) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to list directory: ' + err.message });
    }
    
    const entries = list.map(item => ({
      name: item.filename,
      isDirectory: item.attrs.isDirectory(),
      size: item.attrs.size,
      mtime: item.attrs.mtime
    })).sort((a: any, b: any) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });

    res.json({ entries });
  });
});

app.get('/api/ssh/read', (req: Request, res: Response) => {
  const { sessionId: token, path: filePath } = req.query;
  const sessionId = verifySessionToken(token);

  if (!sessionId) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  if (!filePath) {
    return res.status(400).json({ error: 'Path is required' });
  }

  session.lastUsed = Date.now();
  const safePath = sanitizePath(filePath as string) as string;
  const stream = session.sftp.createReadStream(safePath);
  let content = '';

  stream.on('data', (chunk: Buffer) => {
    content += chunk;
  }).on('end', () => {
    res.json({ content });
  }).on('error', (err: Error) => {
    res.status(500).json({ error: 'Failed to read file: ' + err.message });
  });
});

app.post('/api/ssh/write', (req: Request, res: Response) => {
  const { sessionId: token, path: filePath, content } = req.body;
  const sessionId = verifySessionToken(token);

  if (!sessionId) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  if (!filePath) {
    return res.status(400).json({ error: 'Path is required' });
  }

  session.lastUsed = Date.now();
  const safePath = sanitizePath(filePath as string) as string;
  session.sftp.writeFile(safePath, content, (err: Error | null) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to write file: ' + err.message });
    }
    res.json({ success: true });
  });
});

app.post('/api/ssh/disconnect', (req: Request, res: Response) => {
  const { sessionId: token } = req.body;
  const sessionId = verifySessionToken(token);

  if (sessionId) {
    const session = sessions.get(sessionId);
    if (session) {
      session.conn.end();
      sessions.delete(sessionId);
    }
  }
  res.json({ success: true });
});

// Serve static files from the frontend dist directory
const distPath = path.join(__dirname, '../../dist');
app.use(express.static(distPath));

// Fallback for SPA: Send index.html for any non-API routes
app.get(/^(?!\/api).+/, (req: Request, res: Response) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error: ' + err.message });
});

// Periodic cleanup of stale sessions
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
  console.log(`MDit Production Server listening at http://localhost:${port}`);
});

export default app;
