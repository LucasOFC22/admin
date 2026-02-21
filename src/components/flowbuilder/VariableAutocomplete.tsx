import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Variable } from 'lucide-react';

interface VariableAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  forceShowSuggestions?: boolean;
}

export const VariableAutocomplete: React.FC<VariableAutocompleteProps> = ({
  value,
  onChange,
  placeholder,
  id,
  forceShowSuggestions = false
}) => {
  const [open, setOpen] = useState(false);
  const [variables, setVariables] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [cursorPosition, setCursorPosition] = useState(0);

  useEffect(() => {
    // Carregar variáveis do localStorage
    const loadVariables = () => {
      const storedVariables = localStorage.getItem('variables');
      if (storedVariables) {
        try {
          const parsed = JSON.parse(storedVariables);
          setVariables(Array.isArray(parsed) ? parsed : []);
        } catch {
          setVariables([]);
        }
      }
    };

    loadVariables();
    // Atualizar quando houver mudanças
    window.addEventListener('storage', loadVariables);
    return () => window.removeEventListener('storage', loadVariables);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const position = e.target.selectionStart || 0;
    setCursorPosition(position);
    onChange(newValue);

    const textBeforeCursor = newValue.substring(0, position);
    
    // Check for {{ pattern first
    const braceMatch = textBeforeCursor.match(/\{\{([^}]*?)$/);
    if (braceMatch) {
      setOpen(true);
      return;
    }
    
    // Check for @ pattern
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      // Mostrar autocomplete se tiver @ e não tiver espaço depois
      if (!textAfterAt.includes(' ')) {
        setOpen(true);
      } else {
        setOpen(false);
      }
    } else {
      // Mostrar autocomplete ao digitar se houver variáveis que correspondam
      if (newValue.trim() && variables.length > 0) {
        const matchingVars = variables.filter(v => 
          v.toLowerCase().includes(newValue.toLowerCase())
        );
        setOpen(matchingVars.length > 0);
      } else {
        setOpen(false);
      }
    }
  };

  const insertVariable = (variable: string) => {
    const input = inputRef.current;
    if (!input) return;

    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);
    
    // Check for {{ pattern first
    const braceMatch = textBeforeCursor.match(/\{\{([^}]*?)$/);
    if (braceMatch) {
      const newValue = 
        textBeforeCursor.slice(0, -braceMatch[0].length) + 
        `{{${variable}}}` + 
        textAfterCursor;
      
      onChange(newValue);
      setOpen(false);

      setTimeout(() => {
        const newPosition = textBeforeCursor.length - braceMatch[0].length + variable.length + 4;
        input.setSelectionRange(newPosition, newPosition);
        input.focus();
      }, 0);
      return;
    }
    
    // Check for @ pattern
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      // Substituir @texto_parcial pela variável completa
      const newValue = 
        value.substring(0, lastAtIndex) + 
        `{{${variable}}}` + 
        textAfterCursor;
      
      onChange(newValue);
      setOpen(false);

      // Posicionar cursor após a variável inserida
      setTimeout(() => {
        const newPosition = lastAtIndex + variable.length + 4;
        input.setSelectionRange(newPosition, newPosition);
        input.focus();
      }, 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === '@' || e.key === '{') && !open) {
      setOpen(true);
      setCursorPosition((inputRef.current?.selectionStart || 0) + 1);
    }
  };

  const handleFocus = () => {
    if (forceShowSuggestions && variables.length > 0) {
      setOpen(true);
    }
  };

  const filteredVariables = variables.filter(v => {
    const textBeforeCursor = value.substring(0, cursorPosition);
    
    // Check for {{ pattern first
    const braceMatch = textBeforeCursor.match(/\{\{([^}]*?)$/);
    if (braceMatch) {
      const searchTerm = braceMatch[1].toLowerCase();
      return v.toLowerCase().includes(searchTerm);
    }
    
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex === -1) {
      // Se não houver @, filtrar pelo valor completo
      return value.trim() ? v.toLowerCase().includes(value.toLowerCase()) : true;
    }
    
    const searchTerm = textBeforeCursor.substring(lastAtIndex + 1).toLowerCase();
    return v.toLowerCase().includes(searchTerm);
  });

  return (
    <Popover open={open && filteredVariables.length > 0} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Input
            ref={inputRef}
            id={id}
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            placeholder={placeholder}
            autoComplete="off"
          />
          {variables.length > 0 && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Variable className="h-4 w-4" />
            </div>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[300px]" align="start">
        <Command>
          <CommandList>
            <CommandEmpty>Nenhuma variável encontrada</CommandEmpty>
            <CommandGroup heading="Variáveis disponíveis (digite @ ou {{)">
              {filteredVariables.map((variable) => (
                <CommandItem
                  key={variable}
                  value={variable}
                  onSelect={() => insertVariable(variable)}
                  className="cursor-pointer"
                >
                  <Variable className="mr-2 h-4 w-4" />
                  {`{{${variable}}}`}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
