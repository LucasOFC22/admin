import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useUserFilas } from '@/hooks/useUserFilas';

export interface Tag {
  id: number;
  name: string;
  color: string;
}

interface TagsContainerProps {
  selectedTags: Tag[];
  availableTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  onCreateTag?: (name: string) => Promise<Tag | undefined>;
  placeholder?: string;
  className?: string;
}

export const TagsContainer: React.FC<TagsContainerProps> = ({
  selectedTags,
  availableTags,
  onTagsChange,
  onCreateTag,
  placeholder = 'Tags',
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Obter permissões de tags do usuário
  const { tagsPermitidas, hasTagsRestriction } = useUserFilas();

  // Update container width when it changes
  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
    }
  }, [open]);

  const handleSelect = (tag: Tag) => {
    if (!selectedTags.find(t => t.id === tag.id)) {
      onTagsChange([...selectedTags, tag]);
    }
    setInputValue('');
    inputRef.current?.focus();
  };

  const handleRemove = (tagId: number) => {
    onTagsChange(selectedTags.filter(t => t.id !== tagId));
  };

  const handleCreate = async () => {
    if (!inputValue.trim() || inputValue.length < 3) return;
    
    if (onCreateTag) {
      const newTag = await onCreateTag(inputValue.trim());
      if (newTag) {
        onTagsChange([...selectedTags, newTag]);
        setInputValue('');
      }
    }
  };

  // Filtrar tags baseado nas permissões do usuário
  const tagsPermitidasFiltradas = useMemo(() => {
    // Se o usuário tem restrição de tags, filtrar apenas as permitidas
    if (hasTagsRestriction) {
      return availableTags.filter(tag => tagsPermitidas.includes(tag.id));
    }
    // Se não tem restrição, mostrar todas
    return availableTags;
  }, [availableTags, tagsPermitidas, hasTagsRestriction]);

  // Filter and sort tags alphabetically
  const filteredTags = tagsPermitidasFiltradas
    .filter(tag => !selectedTags.find(t => t.id === tag.id))
    .filter(tag => inputValue.trim() === '' || tag.name.toLowerCase().includes(inputValue.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const showCreateOption = inputValue.trim().length >= 3 && 
    !tagsPermitidasFiltradas.find(t => t.name.toLowerCase() === inputValue.toLowerCase()) &&
    onCreateTag;

  return (
    <div className={cn('w-full', className)} ref={containerRef}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div 
            className="flex flex-wrap items-center gap-1 min-h-[32px] sm:min-h-[38px] px-2 sm:px-3 py-1 sm:py-1.5 border border-input rounded-md bg-background cursor-text"
            onClick={() => {
              setOpen(true);
              setTimeout(() => inputRef.current?.focus(), 0);
            }}
          >
            {selectedTags.map((tag) => (
              <Badge
                key={tag.id}
                className="text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5"
                style={{
                  backgroundColor: tag.color || '#7c7c7c',
                  color: '#FFF',
                  borderRadius: 3,
                }}
              >
                <span className="max-w-[60px] sm:max-w-none truncate">{tag.name}</span>
                <button
                  type="button"
                  className="ml-1 hover:opacity-70 flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(tag.id);
                  }}
                >
                  <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                </button>
              </Badge>
            ))}
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={() => setOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && showCreateOption) {
                  e.preventDefault();
                  handleCreate();
                }
              }}
              placeholder={selectedTags.length === 0 ? placeholder : ''}
              className="flex-1 min-w-[40px] sm:min-w-[60px] bg-transparent border-none outline-none text-xs sm:text-sm placeholder:text-muted-foreground"
            />
          </div>
        </PopoverTrigger>
        <PopoverContent 
          className="p-0 bg-popover border border-border shadow-lg z-50"
          style={{ width: containerWidth > 0 ? containerWidth : 'auto' }}
          align="start"
          sideOffset={4}
        >
          <div className="max-h-[200px] overflow-y-auto">
            {filteredTags.length === 0 && !showCreateOption ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                {inputValue.length > 0 && inputValue.length < 3 
                  ? 'Mínimo 3 caracteres para criar'
                  : 'Nenhuma tag encontrada'}
              </div>
            ) : (
              <div className="py-1">
                {filteredTags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center px-3 py-1.5 cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => handleSelect(tag)}
                  >
                    <Badge
                      className="text-xs font-bold px-2 py-0.5"
                      style={{
                        backgroundColor: tag.color || '#7c7c7c',
                        color: '#FFF',
                        borderRadius: 3,
                      }}
                    >
                      {tag.name}
                    </Badge>
                  </div>
                ))}
                {showCreateOption && (
                  <div
                    className="flex items-center px-3 py-1.5 cursor-pointer hover:bg-accent transition-colors border-t border-border"
                    onClick={handleCreate}
                  >
                    <span className="text-sm text-muted-foreground">
                      Criar tag "<span className="font-medium text-foreground">{inputValue}</span>"
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
