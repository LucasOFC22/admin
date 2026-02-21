import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Save, X, Tag, Check, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface TagItem {
  id: number;
  name: string;
  color: string;
}

interface FlowBuilderTagsModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { selectedTags: TagItem[] }) => void;
  onUpdate?: (data: any) => void;
  data?: any;
  mode?: 'create' | 'edit';
}

export const FlowBuilderTagsModal: React.FC<FlowBuilderTagsModalProps> = ({
  open,
  onClose,
  onSave,
  onUpdate,
  data,
  mode = 'create'
}) => {
  const { toast } = useToast();
  const [availableTags, setAvailableTags] = useState<TagItem[]>([]);
  const [selectedTags, setSelectedTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (open) {
      fetchTags();
    }
  }, [open]);

  const initialDataRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (!open) {
      initialDataRef.current = null;
      return;
    }
    
    const dataKey = JSON.stringify(data?.data || null);
    if (initialDataRef.current === dataKey) return;
    
    initialDataRef.current = dataKey;
    
    if (mode === 'edit' && data?.data?.selectedTags) {
      setSelectedTags(data.data.selectedTags || []);
    } else if (mode === 'create') {
      setSelectedTags([]);
    }
  }, [mode, data, open]);

  const fetchTags = async () => {
    setLoading(true);
    try {
      const { tagService } = await import('@/services/supabase/tagService');
      const tags = await tagService.getTags();
      setAvailableTags(tags.map(t => ({ id: t.id, name: t.name, color: t.color })));
    } catch (error) {
      console.error('Erro ao buscar tags:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as tags",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tag: TagItem) => {
    setSelectedTags(prev => {
      const isSelected = prev.some(t => t.id === tag.id);
      if (isSelected) {
        return prev.filter(t => t.id !== tag.id);
      }
      return [...prev, tag];
    });
  };

  const handleSave = () => {
    if (selectedTags.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos uma tag",
        variant: "destructive"
      });
      return;
    }

    if (mode === 'edit' && onUpdate) {
      onUpdate({
        ...data,
        data: { 
          ...data.data,
          selectedTags
        }
      });
    } else {
      onSave({ selectedTags });
    }
    // Não chamar onClose() aqui - handleModalSave já fecha o modal
  };

  const filteredTags = availableTags.filter(tag =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            {mode === 'create' ? 'Adicionar tags ao fluxo' : 'Editar tags'}
          </DialogTitle>
          <DialogDescription>
            Selecione as tags que serão aplicadas ao contato
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Buscar tags</Label>
            <Input
              placeholder="Digite para buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {selectedTags.length > 0 && (
            <div className="space-y-2">
              <Label>Tags selecionadas</Label>
              <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/30">
                {selectedTags.map((tag) => (
                  <Badge
                    key={tag.id}
                    style={{ backgroundColor: tag.color }}
                    className="text-white cursor-pointer hover:opacity-80 gap-1"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag.name}
                    <X className="h-3 w-3" />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Tags disponíveis</Label>
            <ScrollArea className="h-[200px] border rounded-lg p-2">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <span className="text-sm text-muted-foreground">Carregando...</span>
                </div>
              ) : filteredTags.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <span className="text-sm text-muted-foreground">Nenhuma tag encontrada</span>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredTags.map((tag) => {
                    const isSelected = selectedTags.some(t => t.id === tag.id);
                    return (
                      <div
                        key={tag.id}
                        onClick={() => toggleTag(tag)}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors",
                          isSelected ? "bg-primary/10" : "hover:bg-muted"
                        )}
                      >
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="flex-1 text-sm">{tag.name}</span>
                        {isSelected && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {mode === 'create' ? 'Adicionar' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
