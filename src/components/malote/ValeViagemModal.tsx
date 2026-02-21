import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';

export interface ValeViagemItem {
  id: string;
  descricao: string;
  valor: number;
}

interface ValeViagemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itens: ValeViagemItem[];
  onSave: (itens: ValeViagemItem[]) => void;
}

export const ValeViagemModal = ({
  open,
  onOpenChange,
  itens,
  onSave,
}: ValeViagemModalProps) => {
  const [localItens, setLocalItens] = useState<ValeViagemItem[]>([]);

  useEffect(() => {
    if (open) {
      // Carregar itens quando abrir o modal
      if (itens.length === 0) {
        // Adicionar um item vazio inicial
        setLocalItens([{ id: crypto.randomUUID(), descricao: '', valor: 0 }]);
      } else {
        setLocalItens([...itens]);
      }
    }
  }, [open, itens]);

  const handleAddItem = () => {
    setLocalItens(prev => [
      ...prev,
      { id: crypto.randomUUID(), descricao: '', valor: 0 }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (localItens.length <= 1) return;
    setLocalItens(prev => prev.filter(item => item.id !== id));
  };

  const handleItemChange = (id: string, field: keyof ValeViagemItem, value: string | number) => {
    setLocalItens(prev =>
      prev.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const total = localItens.reduce((acc, item) => acc + (item.valor || 0), 0);

  const handleSave = () => {
    // Filtrar itens vazios (sem descrição e valor zero)
    const itensValidos = localItens.filter(item => item.descricao.trim() || item.valor > 0);
    onSave(itensValidos);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Itens do Vale Viagem</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
          {localItens.map((item, index) => (
            <div key={item.id} className="flex gap-2 items-end">
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">Descrição</Label>
                <Input
                  value={item.descricao}
                  onChange={(e) => handleItemChange(item.id, 'descricao', e.target.value)}
                  placeholder={`Item ${index + 1}`}
                  className="mt-1"
                />
              </div>
              <div className="w-32">
                <Label className="text-xs text-muted-foreground">Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={item.valor || ''}
                  onChange={(e) => handleItemChange(item.id, 'valor', Number(e.target.value))}
                  className="mt-1 text-right"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveItem(item.id)}
                disabled={localItens.length <= 1}
                className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleAddItem}
          className="w-full gap-2"
        >
          <Plus className="w-4 h-4" />
          Adicionar Item
        </Button>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="text-lg font-semibold">
            Total: <span className="text-primary">{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
