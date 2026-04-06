import React, { useEffect, useRef } from 'react';

interface SourceEditorProps {
  content: string;
  onChange: (markdown: string) => void;
}

export const SourceEditor: React.FC<SourceEditorProps> = ({ content, onChange }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      // Set cursor to start
      textareaRef.current.setSelectionRange(0, 0);
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;

      // Insert 2 spaces for tab
      const newValue = content.substring(0, start) + '  ' + content.substring(end);
      onChange(newValue);

      // Re-position cursor after state update
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  return (
    <div className="source-editor-wrapper">
      <textarea
        ref={textareaRef}
        className="source-editor"
        value={content}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        placeholder="Type your markdown here..."
      />
    </div>
  );
};
