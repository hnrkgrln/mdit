import React from 'react';
import { MilkdownEditor } from './MilkdownEditor';
import { SourceEditor } from './SourceEditor';
import { LoadingSkeleton } from './LoadingSkeleton';
import type { FileMode } from '../types';

interface EditorAreaProps {
  isLoading: boolean;
  isSourceMode: boolean;
  content: string;
  fileMode: FileMode;
  lastExternalUpdate: number;
  onChange: (content: string) => void;
}

export const EditorArea: React.FC<EditorAreaProps> = ({
  isLoading,
  isSourceMode,
  content,
  fileMode,
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
          key={`${lastExternalUpdate}-${fileMode}`}
          content={content} 
          onChange={onChange} 
          forceSync={lastExternalUpdate}
        />
      )}
    </main>
  );
};
