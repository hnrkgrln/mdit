import React, { useEffect, useRef, useState } from 'react';
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
  const [isReady, setIsReady] = React.useState(false);

  useEffect(() => {
    if (!editorRef.current) return;

    const container = editorRef.current;
    let destroyed = false;
    let crepeInstance: Crepe | null = null;

    const init = async () => {
      setIsReady(false);
      container.innerHTML = '';

      const crepe = new Crepe({
        root: container,
        defaultValue: lastMarkdownRef.current,
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
          setIsReady(true);
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
      if (crepeRef.current === crepeInstance) {
        crepeRef.current = null;
      }
      if (container) {
        container.innerHTML = '';
      }
    };
  }, []);

  // Sync content only when forceSync changes (external triggers)
  // We explicitly remove 'content' from dependencies to prevent typing loops
  useEffect(() => {
    if (!isReady || !crepeRef.current || !forceSync) return;
    
    const crepe = crepeRef.current;
    if (!crepe.editor) return;
    
    try {
      crepe.editor.action((ctx) => {
        lastMarkdownRef.current = content;
        replaceAll(content)(ctx);
      });
    } catch (e) {
      console.warn('Sync failed:', e);
    }
  }, [forceSync, isReady]);

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
