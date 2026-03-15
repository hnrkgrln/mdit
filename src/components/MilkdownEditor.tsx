import React, { useEffect, useRef } from 'react';
import { Crepe } from '@milkdown/crepe';
import { replaceAll } from '@milkdown/utils';

// Import Crepe styles
import '@milkdown/crepe/theme/common/style.css';
import '@milkdown/crepe/theme/frame.css';

interface MilkdownEditorProps {
  content: string;
  onChange: (markdown: string) => void;
  forceSync?: number;
}

export const MilkdownEditor: React.FC<MilkdownEditorProps> = ({ content, onChange, forceSync }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const crepeRef = useRef<Crepe | null>(null);
  const lastMarkdownRef = useRef(content);

  useEffect(() => {
    if (!editorRef.current) return;

    // 1. CLEAR the container immediately
    const container = editorRef.current;
    container.innerHTML = '';

    // 2. Create the instance
    const crepe = new Crepe({
      root: container,
      defaultValue: content,
      featureConfigs: {
        [Crepe.Feature.Placeholder]: {
          text: '...',
        },
        'code-mirror': {
          onCopy: () => {
            const button = document.activeElement as HTMLElement;
            if (button && (button.classList.contains('copy-button') || button.closest('.copy-button'))) {
              const target = button.classList.contains('copy-button') ? button : button.closest('.copy-button') as HTMLElement;
              if (target) {
                const originalText = target.innerText;
                target.innerText = 'Copied!';
                target.classList.add('copied');
                setTimeout(() => {
                  target.innerText = originalText;
                  target.classList.remove('copied');
                }, 2000);
              }
            }
          }
        }
      },
    });

    crepe.on((listener) => {
      listener.markdownUpdated((_, markdown) => {
        if (markdown !== lastMarkdownRef.current) {
          lastMarkdownRef.current = markdown;
          onChange(markdown);
        }
      });
    });

    crepe.create().then(() => {
      crepeRef.current = crepe;
    });

    // 3. CLEANUP: Ensure destruction and manual DOM clearing
    return () => {
      if (crepeRef.current) {
        crepeRef.current.destroy();
        crepeRef.current = null;
      }
      container.innerHTML = '';
    };
  }, []); // Strictly once on mount

  // Sync content only on external triggers (File Open, New File)
  useEffect(() => {
    if (!crepeRef.current || !forceSync) return;
    
    const crepe = crepeRef.current;
    const timer = setTimeout(() => {
      crepe.editor.action((ctx) => {
        lastMarkdownRef.current = content;
        replaceAll(content)(ctx);
      });
    }, 10);
    
    return () => clearTimeout(timer);
  }, [forceSync]);

  return (
    <div className="milkdown-wrapper">
      <div 
        ref={editorRef} 
        className="crepe-editor-container" 
        style={{ width: '100%', height: '100%', outline: 'none' }}
      />
    </div>
  );
};
