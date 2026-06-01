import React from 'react';
import { MilkdownEditor } from './MilkdownEditor';
import { SourceEditor } from './SourceEditor';
import { LoadingSkeleton } from './LoadingSkeleton';

interface EditorAreaProps {
  isLoading: boolean;
  isSourceMode: boolean;
  content: string;
  lastExternalUpdate: number;
  onChange: (content: string) => void;
}

export const EditorArea: React.FC<EditorAreaProps> = ({
  isLoading,
  isSourceMode,
  content,
  lastExternalUpdate,
  onChange,
}) => {
  if (isLoading) {
    return (
      <main className="editor-container">
        <LoadingSkeleton type="editor" />
      </main>
    );
  }

  return (
    <main className="editor-container">
      {isSourceMode ? (
        <SourceEditor content={content} onChange={onChange} />
      ) : (
        <MilkdownEditor 
          content={content} 
          onChange={onChange} 
          forceSync={lastExternalUpdate}
        />
      )}
    </main>
  );
};
