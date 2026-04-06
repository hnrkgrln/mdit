import React, { useEffect, useRef } from 'react';
import { Crepe } from '@milkdown/crepe';

// Import Crepe styles
import '@milkdown/crepe/theme/common/style.css';
import '@milkdown/crepe/theme/frame.css';

interface MilkdownEditorProps {
  content: string;
  onChange: (markdown: string) => void;
  forceSync: number;
}

export const MilkdownEditor: React.FC<MilkdownEditorProps> = ({ content, onChange, forceSync: _forceSync }) => {
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
      
      const crepe = new Crepe({
        root: container,
        defaultValue: content,
        features: {
          [Crepe.Feature.Latex]: false,
        },
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

      crepe.on((listener) => {
        listener.markdownUpdated((_, markdown) => {
          const cleanMarkdown = markdown.replace(/<br\s*\/?>/gi, '\n');
          if (cleanMarkdown !== lastMarkdownRef.current) {
            lastMarkdownRef.current = cleanMarkdown;
            onChange(cleanMarkdown);
          }
        });
      });

      try {
        await crepe.create();
        if (destroyed) {
          await crepe.destroy();
        } else {
          crepeInstance = crepe;
          crepeRef.current = crepe;
        }
      } catch (e) {
        console.error('Failed to create Crepe editor:', e);
      }
    };

    init();

    return () => {
      destroyed = true;
      if (crepeInstance) {
        crepeInstance.destroy();
      }
      if (container) {
        container.innerHTML = '';
      }
    };
  }, []);

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
