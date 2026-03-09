import React, { useMemo, useCallback, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Search, User, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePhoneVisibility } from '@/hooks/usePhoneVisibility';

interface Contato {
  id: string;
  nome: string;
  telefone: string;
}

interface ContatosSelectorVirtualizadoProps {
  contatos: Contato[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  maxHeight?: number;
  disabled?: boolean;
  emptyMessage?: string;
  searchPlaceholder?: string;
}

const ITEM_HEIGHT = 56;

// Componente de item memoizado para evitar re-renders
const ContatoItem = React.memo(({ 
  contato, 
  isSelected, 
  onToggle,
  disabled,
  displayPhone
}: { 
  contato: Contato; 
  isSelected: boolean; 
  onToggle: (id: string) => void;
  disabled: boolean;
  displayPhone: (phone: string | undefined | null) => string;
}) => (
  <div 
    className={cn(
      "flex items-center gap-3 px-3 py-2 border-b border-border/50 cursor-pointer hover:bg-muted/50 transition-colors",
      disabled && "opacity-50 cursor-not-allowed"
    )}
    onClick={() => !disabled && onToggle(contato.id)}
  >
    <Checkbox 
      checked={isSelected}
      disabled={disabled}
      onCheckedChange={() => !disabled && onToggle(contato.id)}
      onClick={(e) => e.stopPropagation()}
    />
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        <span className="text-sm font-medium truncate">{contato.nome}</span>
      </div>
      <div className="flex items-center gap-2 mt-0.5">
        <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
        <span className="text-xs text-muted-foreground">{displayPhone(contato.telefone)}</span>
      </div>
    </div>
  </div>
));

ContatoItem.displayName = 'ContatoItem';

export const ContatosSelectorVirtualizado: React.FC<ContatosSelectorVirtualizadoProps> = ({
  contatos,
  selectedIds,
  onSelectionChange,
  maxHeight = 300,
  disabled = false,
  emptyMessage = 'Nenhum contato encontrado',
  searchPlaceholder = 'Buscar contatos...'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { displayPhone } = usePhoneVisibility();

  // Filtrar contatos com debounce implícito via useMemo
  const filteredContatos = useMemo(() => {
    if (!searchTerm.trim()) return contatos;
    
    const termLower = searchTerm.toLowerCase();
    return contatos.filter(contato => 
      contato.nome.toLowerCase().includes(termLower) ||
      contato.telefone.includes(searchTerm)
    );
  }, [contatos, searchTerm]);

  // Set para lookup rápido O(1)
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  // Handler de toggle memoizado
  const handleToggle = useCallback((id: string) => {
    if (disabled) return;
    
    const newSelectedIds = selectedSet.has(id)
      ? selectedIds.filter(selectedId => selectedId !== id)
      : [...selectedIds, id];
    
    onSelectionChange(newSelectedIds);
  }, [selectedIds, selectedSet, onSelectionChange, disabled]);

  // Selecionar/deselecionar todos os filtrados
  const handleSelectAll = useCallback(() => {
    if (disabled) return;
    
    const filteredIds = filteredContatos.map(c => c.id);
    const allSelected = filteredIds.every(id => selectedSet.has(id));
    
    if (allSelected) {
      // Remover todos os filtrados da seleção
      const newSelection = selectedIds.filter(id => !filteredIds.includes(id));
      onSelectionChange(newSelection);
    } else {
      // Adicionar todos os filtrados à seleção
      const newSelection = [...new Set([...selectedIds, ...filteredIds])];
      onSelectionChange(newSelection);
    }
  }, [filteredContatos, selectedIds, selectedSet, onSelectionChange, disabled]);

  // Verificar se todos os filtrados estão selecionados
  const allFilteredSelected = useMemo(() => {
    if (filteredContatos.length === 0) return false;
    return filteredContatos.every(c => selectedSet.has(c.id));
  }, [filteredContatos, selectedSet]);

  // Renderizador de row para react-window
  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const contato = filteredContatos[index];
    return (
      <div style={style}>
        <ContatoItem
          contato={contato}
          isSelected={selectedSet.has(contato.id)}
          onToggle={handleToggle}
          disabled={disabled}
          displayPhone={displayPhone}
        />
      </div>
    );
  }, [filteredContatos, selectedSet, handleToggle, disabled, displayPhone]);

  const listHeight = Math.min(filteredContatos.length * ITEM_HEIGHT, maxHeight);

  return (
    <div className="space-y-3">
      {/* Barra de busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
          disabled={disabled}
        />
      </div>

      {/* Header com contagem e selecionar todos */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {selectedIds.length} de {contatos.length} selecionados
          {searchTerm && ` (${filteredContatos.length} visíveis)`}
        </span>
        <button
          type="button"
          onClick={handleSelectAll}
          disabled={disabled || filteredContatos.length === 0}
          className="text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {allFilteredSelected ? 'Desmarcar visíveis' : 'Selecionar visíveis'}
        </button>
      </div>

      {/* Lista virtualizada */}
      <div className="border rounded-md overflow-hidden bg-background">
        {filteredContatos.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
            {emptyMessage}
          </div>
        ) : (
          <List
            height={listHeight}
            width="100%"
            itemCount={filteredContatos.length}
            itemSize={ITEM_HEIGHT}
            overscanCount={5}
          >
            {Row}
          </List>
        )}
      </div>
    </div>
  );
};

export default ContatosSelectorVirtualizado;
