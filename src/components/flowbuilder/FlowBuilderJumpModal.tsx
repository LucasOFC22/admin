import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SkipForward, ArrowRight } from 'lucide-react';
import { FlowGroup } from '@/types/flowbuilder';

interface FlowBuilderJumpModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  data?: any;
  mode: 'create' | 'edit';
  groups: FlowGroup[];
  currentGroupId?: string;
}

export const FlowBuilderJumpModal: React.FC<FlowBuilderJumpModalProps> = ({
  open,
  onClose,
  onSave,
  data,
  mode,
  groups,
  currentGroupId
}) => {
  const [targetGroupId, setTargetGroupId] = useState('');
  const [description, setDescription] = useState('');
  const initializedRef = useRef(false);

  // Filtrar grupos disponíveis (excluir o grupo atual)
  const availableGroups = groups.filter(g => g.id !== currentGroupId);

  useEffect(() => {
    if (open && !initializedRef.current) {
      initializedRef.current = true;
      if (data?.data) {
        setTargetGroupId(data.data.targetGroupId || '');
        setDescription(data.data.description || '');
      }
    }
    
    if (!open) {
      initializedRef.current = false;
      setTargetGroupId('');
      setDescription('');
    }
  }, [open, data]);

  const handleSave = () => {
    const targetGroup = groups.find(g => g.id === targetGroupId);
    onSave({
      targetGroupId,
      targetGroupTitle: targetGroup?.title || 'Grupo desconhecido',
      description
    });
  };

  const selectedGroup = groups.find(g => g.id === targetGroupId);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SkipForward className="h-5 w-5 text-amber-600" />
            {mode === 'edit' ? 'Editar Pulo' : 'Configurar Pulo'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Seleção do grupo de destino */}
          <div className="space-y-2">
            <Label>Pular para qual grupo?</Label>
            <Select value={targetGroupId} onValueChange={setTargetGroupId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o grupo de destino" />
              </SelectTrigger>
              <SelectContent>
                {availableGroups.length > 0 ? (
                  availableGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.title}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    Nenhum grupo disponível
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Preview do pulo */}
          {selectedGroup && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 text-amber-700">
                <ArrowRight className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Pular diretamente para: <strong>{selectedGroup.title}</strong>
                </span>
              </div>
              <p className="text-xs text-amber-600 mt-1">
                O fluxo irá pular para este grupo ignorando conexões normais.
              </p>
            </div>
          )}

          {/* Descrição opcional */}
          <div className="space-y-2">
            <Label>Descrição (opcional)</Label>
            <Textarea
              placeholder="Ex: Pular para atendimento após validação..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
            <p className="text-xs text-gray-500">
              Adicione uma nota para lembrar o motivo deste pulo.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!targetGroupId}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {mode === 'edit' ? 'Salvar' : 'Adicionar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
