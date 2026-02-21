import { memo, useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Tag } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';

interface TagData {
  id: number;
  name: string;
  color: string;
}

interface TagsSelectorProps {
  selectedTags: number[];
  onTagsChange: (tagIds: number[]) => void;
  disabled?: boolean;
}

const TagsSelector = memo(({ selectedTags, onTagsChange, disabled }: TagsSelectorProps) => {
  // Buscar todas as tags disponíveis
  const { data: tags = [], isLoading, error } = useQuery({
    queryKey: ['whatsapp-tags'],
    queryFn: async (): Promise<TagData[]> => {
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase
        .from('tags')
        .select('id, name, color')
        .order('name');

      if (error) throw error;
      return data || [];
    }
  });

  const handleToggleTag = (tagId: number) => {
    const newSelected = selectedTags.includes(tagId)
      ? selectedTags.filter(id => id !== tagId)
      : [...selectedTags, tagId];
    
    onTagsChange(newSelected);
  };

  const handleSelectAll = () => {
    onTagsChange(tags.map(t => t.id));
  };

  const handleDeselectAll = () => {
    onTagsChange([]);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-destructive py-4 text-center border rounded-lg bg-destructive/10">
        Erro ao carregar tags
      </p>
    );
  }

  if (tags.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg bg-muted/20">
        Nenhuma tag disponível
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSelectAll}
          disabled={disabled || selectedTags.length === tags.length}
        >
          Selecionar Todas
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleDeselectAll}
          disabled={disabled || selectedTags.length === 0}
        >
          Limpar Seleção
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 p-4 border rounded-lg bg-muted/30 max-h-[200px] overflow-y-auto">
        {tags.map((tag) => (
          <div key={tag.id} className="flex items-center space-x-2">
            <Checkbox
              id={`tag-${tag.id}`}
              checked={selectedTags.includes(tag.id)}
              onCheckedChange={() => handleToggleTag(tag.id)}
              disabled={disabled}
            />
            <Label
              htmlFor={`tag-${tag.id}`}
              className="text-sm font-normal cursor-pointer flex-1 flex items-center gap-2"
            >
              <div
                className="h-3 w-3 rounded-full border"
                style={{ backgroundColor: tag.color }}
              />
              <span>{tag.name}</span>
            </Label>
          </div>
        ))}
      </div>

      {selectedTags.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Tag className="h-3 w-3" />
            {selectedTags.length} tag(s) selecionada(s)
          </Badge>
        </div>
      )}
    </div>
  );
});

TagsSelector.displayName = 'TagsSelector';

export default TagsSelector;
