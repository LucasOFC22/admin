import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FlowBlock } from '@/types/flowbuilder';
import type { FlowBlockData } from '@/types/flowbuilder-blocks';

interface BlockEditorModalProps {
  open: boolean;
  onClose: () => void;
  block: FlowBlock;
  onSave: (data: FlowBlockData) => void;
}

export const BlockEditorModal: React.FC<BlockEditorModalProps> = ({
  open,
  onClose,
  block,
  onSave,
}) => {
  const [data, setData] = useState(block.data || {});

  // Sync state when block changes
  useEffect(() => {
    setData(block.data || {});
  }, [block.id, block.data]);

  const handleSave = () => {
    console.log('=== BLOCK EDITOR MODAL SAVE ===', { blockId: block.id, data });
    onSave(data);
    onClose();
  };

  const renderFields = () => {
    switch (block.type) {
      case 'text':
        return (
          <div className="space-y-4">
            <div>
              <Label>Mensagem</Label>
              <Textarea
                value={data.message || ''}
                onChange={(e) => setData({ ...data, message: e.target.value })}
                placeholder="Digite a mensagem..."
                rows={4}
              />
            </div>
          </div>
        );

      case 'menu':
        return (
          <div className="space-y-4">
            <div>
              <Label>Título do Menu</Label>
              <Input
                value={data.menuData?.title || ''}
                onChange={(e) =>
                  setData({
                    ...data,
                    menuData: { ...data.menuData, title: e.target.value },
                  })
                }
                placeholder="Título..."
              />
            </div>
            <div>
              <Label>Corpo do Menu</Label>
              <Textarea
                value={data.menuData?.body || ''}
                onChange={(e) =>
                  setData({
                    ...data,
                    menuData: { ...data.menuData, body: e.target.value },
                  })
                }
                placeholder="Descrição..."
                rows={3}
              />
            </div>
          </div>
        );

      case 'question':
        return (
          <div className="space-y-4">
            <div>
              <Label>Pergunta</Label>
              <Textarea
                value={data.question || ''}
                onChange={(e) => setData({ ...data, question: e.target.value })}
                placeholder="Digite a pergunta..."
                rows={3}
              />
            </div>
            <div>
              <Label>Variável para salvar resposta</Label>
              <Input
                value={data.variable || ''}
                onChange={(e) => setData({ ...data, variable: e.target.value })}
                placeholder="nome_variavel"
              />
            </div>
          </div>
        );

      case 'condition':
        return (
          <div className="space-y-4">
            <div>
              <Label>Variável</Label>
              <Input
                value={data.conditions?.variable || ''}
                onChange={(e) =>
                  setData({
                    ...data,
                    conditions: { ...data.conditions, variable: e.target.value },
                  })
                }
                placeholder="nome_variavel"
              />
            </div>
            <div>
              <Label>Operador</Label>
              <Input
                value={data.conditions?.operator || ''}
                onChange={(e) =>
                  setData({
                    ...data,
                    conditions: { ...data.conditions, operator: e.target.value },
                  })
                }
                placeholder="igual, contém, maior..."
              />
            </div>
            <div>
              <Label>Valor</Label>
              <Input
                value={data.conditions?.value || ''}
                onChange={(e) =>
                  setData({
                    ...data,
                    conditions: { ...data.conditions, value: e.target.value },
                  })
                }
                placeholder="Valor para comparar"
              />
            </div>
          </div>
        );

      case 'ticket':
        return (
          <div className="space-y-4">
            <div>
              <Label>ID da Fila</Label>
              <Input
                value={data.queueIds?.join(', ') || ''}
                onChange={(e) =>
                  setData({
                    ...data,
                    queueIds: e.target.value.split(',').map((s) => s.trim()),
                  })
                }
                placeholder="ID1, ID2..."
              />
            </div>
          </div>
        );

      case 'randomizer':
        return (
          <div className="space-y-4">
            <div>
              <Label>Porcentagem (Caminho A)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={data.percent || 50}
                onChange={(e) =>
                  setData({ ...data, percent: parseInt(e.target.value) })
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Caminho B: {100 - (data.percent || 50)}%
              </p>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-sm text-muted-foreground">
            Editor para este tipo de bloco ainda não implementado.
          </div>
        );
    }
  };

  const getTitle = () => {
    const titles: Record<string, string> = {
      text: 'Editar Texto',
      menu: 'Editar Menu',
      question: 'Editar Pergunta',
      condition: 'Editar Condição',
      ticket: 'Editar Fila',
      tags: 'Editar Tags',
      typebot: 'Editar Typebot',
      openai: 'Editar OpenAI',
      randomizer: 'Editar Randomizador',
      interval: 'Editar Intervalo',
      location: 'Editar Localização',
    };
    return titles[block.type] || 'Editar Bloco';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>
        <div className="py-4">{renderFields()}</div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
