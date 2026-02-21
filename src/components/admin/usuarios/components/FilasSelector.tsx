import { memo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Radio } from 'lucide-react';
import { useFilasWhatsApp } from '@/hooks/useFilasWhatsApp';

interface FilasSelectorProps {
  selectedFilas: number[];
  onFilasChange: (filaIds: number[]) => void;
  disabled?: boolean;
}

const FilasSelector = memo(({ selectedFilas, onFilasChange, disabled }: FilasSelectorProps) => {
  const { filas, loading, error } = useFilasWhatsApp();

  const filasDisponiveis = filas;
  const isLoading = loading;

  const handleToggleFila = (filaId: number) => {
    const newSelected = selectedFilas.includes(filaId)
      ? selectedFilas.filter(id => id !== filaId)
      : [...selectedFilas, filaId];
    
    onFilasChange(newSelected);
  };

  const handleSelectAll = () => {
    onFilasChange(filasDisponiveis.map(f => f.id));
  };

  const handleDeselectAll = () => {
    onFilasChange([]);
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
        Erro ao carregar filas: {error}
      </p>
    );
  }

  if (filasDisponiveis.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg bg-muted/20">
        Nenhuma fila de WhatsApp disponível
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
          disabled={disabled || selectedFilas.length === filasDisponiveis.length}
        >
          Selecionar Todas
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleDeselectAll}
          disabled={disabled || selectedFilas.length === 0}
        >
          Limpar Seleção
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 p-4 border rounded-lg bg-muted/30">
        {filasDisponiveis.map((fila) => (
          <div key={fila.id} className="flex items-center space-x-2">
            <Checkbox
              id={`fila-${fila.id}`}
              checked={selectedFilas.includes(fila.id)}
              onCheckedChange={() => handleToggleFila(fila.id)}
              disabled={disabled}
            />
            <Label
              htmlFor={`fila-${fila.id}`}
              className="text-sm font-normal cursor-pointer flex-1 flex items-center gap-2"
            >
              {fila.color && (
                <div
                  className="h-3 w-3 rounded-full border"
                  style={{ backgroundColor: fila.color }}
                />
              )}
              <span>{fila.name}</span>
              {fila.description && (
                <span className="text-xs text-muted-foreground">
                  ({fila.description})
                </span>
              )}
            </Label>
          </div>
        ))}
      </div>

      {selectedFilas.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Radio className="h-3 w-3" />
            {selectedFilas.length} fila(s) selecionada(s)
          </Badge>
        </div>
      )}
    </div>
  );
});

FilasSelector.displayName = 'FilasSelector';

export default FilasSelector;
