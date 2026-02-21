import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';
import { useMentionAutocomplete, MentionUser, insertMention } from '@/hooks/useMentionAutocomplete';
import { cn } from '@/lib/utils';

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  minRows?: number;
}

export const MentionTextarea: React.FC<MentionTextareaProps> = ({
  value,
  onChange,
  placeholder = 'Escreva sua nota... Use @ para mencionar usuários',
  disabled = false,
  className,
  minRows = 3,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [mentionQuery, setMentionQuery] = useState('');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  const { filteredUsers, isLoading, setSearchTerm } = useMentionAutocomplete();

  // Detectar quando o usuário digita @
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    onChange(newValue);
    setCursorPosition(cursorPos);
    
    // Verificar se está digitando uma menção
    const textBeforeCursor = newValue.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      // Se não houver espaço após o @, estamos digitando uma menção
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        setMentionQuery(textAfterAt);
        setSearchTerm(textAfterAt);
        setShowSuggestions(true);
        setSelectedIndex(0);
        return;
      }
    }
    
    setShowSuggestions(false);
    setMentionQuery('');
  }, [onChange, setSearchTerm]);

  // Inserir menção selecionada
  const handleSelectUser = useCallback((user: MentionUser) => {
    const { newText, newCursorPos } = insertMention(value, cursorPosition, user);
    onChange(newText);
    setShowSuggestions(false);
    setMentionQuery('');
    
    // Focar de volta no textarea e posicionar o cursor
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  }, [value, cursorPosition, onChange]);

  // Navegação com teclado
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions || filteredUsers.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredUsers.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredUsers.length) % filteredUsers.length);
        break;
      case 'Enter':
        if (showSuggestions) {
          e.preventDefault();
          handleSelectUser(filteredUsers[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        break;
      case 'Tab':
        if (showSuggestions) {
          e.preventDefault();
          handleSelectUser(filteredUsers[selectedIndex]);
        }
        break;
    }
  }, [showSuggestions, filteredUsers, selectedIndex, handleSelectUser]);

  // Fechar sugestões ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll para item selecionado
  useEffect(() => {
    if (suggestionsRef.current && showSuggestions) {
      const selectedElement = suggestionsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, showSuggestions]);

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={cn('min-h-[80px]', className)}
        style={{ minHeight: `${minRows * 24}px` }}
      />
      
      {/* Popup de sugestões */}
      {showSuggestions && (
        <Card 
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto shadow-lg border"
        >
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Carregando...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground text-center">
              {mentionQuery 
                ? `Nenhum usuário encontrado para "${mentionQuery}"`
                : 'Digite para buscar usuários'
              }
            </div>
          ) : (
            <div className="py-1">
              {filteredUsers.slice(0, 10).map((user, index) => (
                <button
                  key={user.id}
                  type="button"
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent transition-colors',
                    index === selectedIndex && 'bg-accent'
                  )}
                  onClick={() => handleSelectUser(user)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default MentionTextarea;
