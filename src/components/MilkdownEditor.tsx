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

    const container = editorRef.current;
    let destroyed = false;
    let crepeInstance: Crepe | null = null;

    const init = async () => {
      container.innerHTML = '';

      crepeInstance = new Crepe({
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
                    if (target) {
                      target.innerText = originalText;
                      target.classList.remove('copied');
                    }
                  }, 2000);
                }
              }
            }
          }
        },
      });

      crepeInstance.on((listener) => {
        listener.markdownUpdated((_, markdown) => {
          if (markdown !== lastMarkdownRef.current) {
            lastMarkdownRef.current = markdown;
            onChange(markdown);
          }
        });
      });

      await crepeInstance.create();

      if (destroyed) {
        crepeInstance.destroy();
      } else {
        crepeRef.current = crepeInstance;
      }
    };

    init();

    return () => {
      destroyed = true;
      if (crepeRef.current) {
        crepeRef.current.destroy();
        crepeRef.current = null;
      } else if (crepeInstance) {
        crepeInstance.destroy();
      }
      container.innerHTML = '';
    };
  }, []);

  // Sync content only when forceSync changes (external triggers)
  // We explicitly remove 'content' from dependencies to prevent typing loops
  useEffect(() => {
    if (!crepeRef.current || !forceSync) return;
    
    const crepe = crepeRef.current;
    const timer = setTimeout(() => {
      if (!crepe.editor) return;
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
