import React from 'react';
import { X } from 'lucide-react';

interface MarkdownHelpProps {
  onClose: () => void;
}

export const MarkdownHelp: React.FC<MarkdownHelpProps> = ({ onClose }) => {
  const reference = [
    { syntax: '# Header', desc: 'H1 Header' },
    { syntax: '## Header', desc: 'H2 Header' },
    { syntax: '### Header', desc: 'H3 Header' },
    { syntax: '**Bold**', desc: 'Bold text' },
    { syntax: '*Italic*', desc: 'Italic text' },
    { syntax: '[Link](url)', desc: 'Hyperlink' },
    { syntax: '![Alt](img_url)', desc: 'Image' },
    { syntax: '- Item', desc: 'Bullet list' },
    { syntax: '1. Item', desc: 'Numbered list' },
    { syntax: '> Quote', desc: 'Blockquote' },
    { syntax: '`Code`', desc: 'Inline code' },
    { syntax: '```\nCode block\n```', desc: 'Code block' },
    { syntax: '---', desc: 'Horizontal rule' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Markdown Reference</h3>
          <button className="close-btn" onClick={onClose} title="Close Help">
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          <h4 style={{ color: 'var(--nord9)', marginTop: '0', marginBottom: '10px' }}>Keyboard Shortcuts</h4>
          <table className="help-table" style={{ marginBottom: '30px' }}>
            <thead>
              <tr>
                <th>Action</th>
                <th>Shortcut</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>New File</td><td><code>Ctrl + Shift + N</code></td></tr>
              <tr><td>Open File</td><td><code>Ctrl + O</code></td></tr>
              <tr><td>Save File</td><td><code>Ctrl + S</code></td></tr>
              <tr><td>Toggle Auto-save</td><td><code>Ctrl + A</code></td></tr>
              <tr><td>Toggle Source Mode</td><td><code>Ctrl + M</code></td></tr>
              <tr><td>Toggle Help</td><td><code>Ctrl + H</code></td></tr>
              <tr><td>Toggle Theme</td><td><code>Ctrl + Shift + L</code></td></tr>
            </tbody>
          </table>

          <h4 style={{ color: 'var(--nord9)', marginBottom: '10px' }}>Markdown Syntax</h4>
          <table className="help-table">
            <thead>
              <tr>
                <th>Syntax</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {reference.map((item, i) => (
                <tr key={i}>
                  <td><code>{item.syntax}</code></td>
                  <td>{item.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
