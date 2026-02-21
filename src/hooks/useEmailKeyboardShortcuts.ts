import { useEffect, useCallback } from 'react';

export interface EmailKeyboardActions {
  onNewEmail: () => void;
  onArchive: () => void;
  onToggleStar: () => void;
  onDelete: () => void;
  onReply: () => void;
  onReplyAll: () => void;
  onForward: () => void;
  onFocusSearch: () => void;
  onEscape: () => void;
}

interface UseEmailKeyboardShortcutsOptions {
  enabled?: boolean;
  actions: Partial<EmailKeyboardActions>;
  searchInputRef?: React.RefObject<HTMLInputElement>;
}

/**
 * Hook para gerenciar atalhos de teclado do email
 * Baseado nos atalhos listados no EmailHelpPopover
 */
export function useEmailKeyboardShortcuts({
  enabled = true,
  actions,
  searchInputRef
}: UseEmailKeyboardShortcutsOptions) {
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Não executar se estiver em input, textarea ou contenteditable
    const target = event.target as HTMLElement;
    const isInputField = 
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable ||
      target.closest('[contenteditable="true"]');
    
    // Permitir apenas Escape em campos de input
    if (isInputField && event.key !== 'Escape') {
      return;
    }

    // Não executar se modifier keys estão pressionadas (exceto Shift para #)
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    const key = event.key.toLowerCase();
    
    switch (key) {
      case 'c':
        event.preventDefault();
        actions.onNewEmail?.();
        break;
        
      case 'e':
        event.preventDefault();
        actions.onArchive?.();
        break;
        
      case 's':
        event.preventDefault();
        actions.onToggleStar?.();
        break;
        
      case '#':
        event.preventDefault();
        actions.onDelete?.();
        break;
        
      case 'r':
        event.preventDefault();
        actions.onReply?.();
        break;
        
      case 'a':
        event.preventDefault();
        actions.onReplyAll?.();
        break;
        
      case 'f':
        event.preventDefault();
        actions.onForward?.();
        break;
        
      case '/':
        event.preventDefault();
        if (searchInputRef?.current) {
          searchInputRef.current.focus();
        }
        actions.onFocusSearch?.();
        break;
        
      case 'escape':
        actions.onEscape?.();
        break;
    }
  }, [actions, searchInputRef]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
}

export default useEmailKeyboardShortcuts;
