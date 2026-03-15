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
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="source-editor-wrapper">
      <textarea
        ref={textareaRef}
        className="source-editor"
        value={content}
        onChange={handleChange}
        spellCheck={false}
        placeholder="..."
      />
    </div>
  );
};
