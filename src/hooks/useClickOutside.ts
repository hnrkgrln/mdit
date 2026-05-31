import { useEffect } from 'react';

/**
 * Hook that closes dropdowns/modals when clicking outside
 */
export function useClickOutside(
  refs: Array<React.RefObject<HTMLElement> | null>,
  onClickOutside: () => void
): void {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const isOutside = refs.every(ref => 
        !ref?.current?.contains(event.target as Node)
      );
      
      if (isOutside) {
        onClickOutside();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [refs, onClickOutside]);
}
