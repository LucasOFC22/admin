import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { FlowBuilderData } from '@/hooks/useFlowBuilder';

interface CreateFlowModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { name: string; description?: string; active: boolean }) => Promise<void>;
  editingFlow?: FlowBuilderData | null;
}

export const CreateFlowModal: React.FC<CreateFlowModalProps> = ({
  open,
  onClose,
  onSave,
  editingFlow
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingFlow) {
      setName(editingFlow.name);
      setDescription(editingFlow.description || '');
      setActive(editingFlow.active);
    } else {
      setName('');
      setDescription('');
      setActive(true);
    }
  }, [editingFlow, open]);

  const handleSave = async () => {
    if (!name.trim()) return;

    setSaving(true);
    try {
      await onSave({ name: name.trim(), description: description.trim(), active });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingFlow ? 'Editar Fluxo' : 'Criar Novo Fluxo'}
          </DialogTitle>
          <DialogDescription>
            {editingFlow 
              ? 'Atualize as informações do fluxo'
              : 'Preencha os dados para criar um novo fluxo automatizado'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Fluxo *</Label>
            <Input
              id="name"
              placeholder="Ex: Fluxo de Boas-vindas"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva o objetivo deste fluxo..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="active">Status</Label>
              <p className="text-sm text-muted-foreground">
                {active ? 'Fluxo ativo' : 'Fluxo inativo'}
              </p>
            </div>
            <Switch
              id="active"
              checked={active}
              onCheckedChange={setActive}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || saving}>
            {saving ? 'Salvando...' : editingFlow ? 'Atualizar' : 'Criar Fluxo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
