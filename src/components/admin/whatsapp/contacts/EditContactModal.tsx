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
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Loader2, EyeOff } from 'lucide-react';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { toast } from '@/lib/toast';
import { usePhoneVisibility } from '@/hooks/usePhoneVisibility';

interface AdditionalInfo {
  key: string;
  value: string;
}

interface ContactData {
  id: string;
  nome: string;
  telefone: string;
  email: string | null;
  chatbot_desabilitado: boolean;
  informacoes_adicionais: AdditionalInfo[];
}

interface EditContactModalProps {
  open: boolean;
  onClose: () => void;
  contactId: string | null;
  onSuccess?: () => void;
}

export const EditContactModal: React.FC<EditContactModalProps> = ({
  open,
  onClose,
  contactId,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { canViewFullPhone, displayPhone } = usePhoneVisibility();
  const [formData, setFormData] = useState<ContactData>({
    id: '',
    nome: '',
    telefone: '',
    email: '',
    chatbot_desabilitado: false,
    informacoes_adicionais: [],
  });

  useEffect(() => {
    if (open && contactId) {
      loadContact();
    }
  }, [open, contactId]);

  const loadContact = async () => {
    if (!contactId) return;

    setLoading(true);
    try {
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase
        .from('contatos_whatsapp')
        .select('*')
        .eq('id', contactId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFormData({
          id: data.id,
          nome: data.nome || '',
          telefone: data.telefone || '',
          email: data.email || '',
          chatbot_desabilitado: data.chatbot_desabilitado || false,
          informacoes_adicionais: data.informacoes_adicionais || [],
        });
      }
    } catch (error) {
      console.error('Erro ao carregar contato:', error);
      toast.error('Erro ao carregar dados do contato');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.nome.trim() || !formData.telefone.trim()) {
      toast.error('Nome e telefone são obrigatórios');
      return;
    }

    setSaving(true);
    try {
      const supabase = requireAuthenticatedClient();
      if (contactId) {
        // Atualizar contato existente
        const { error } = await supabase
          .from('contatos_whatsapp')
          .update({
            nome: formData.nome,
            telefone: formData.telefone,
            email: formData.email || null,
            chatbot_desabilitado: formData.chatbot_desabilitado,
            informacoes_adicionais: formData.informacoes_adicionais,
          })
          .eq('id', contactId);

        if (error) throw error;
        toast.success('Contato atualizado com sucesso!');
      } else {
        // Criar novo contato
        const { error } = await supabase
          .from('contatos_whatsapp')
          .insert({
            nome: formData.nome,
            telefone: formData.telefone,
            email: formData.email || null,
            chatbot_desabilitado: formData.chatbot_desabilitado,
            informacoes_adicionais: formData.informacoes_adicionais,
          });

        if (error) throw error;
        toast.success('Contato criado com sucesso!');
      }

      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error('Erro ao salvar contato:', error);
      toast.error('Erro ao salvar contato');
    } finally {
      setSaving(false);
    }
  };

  const addAdditionalInfo = () => {
    setFormData((prev) => ({
      ...prev,
      informacoes_adicionais: [
        ...prev.informacoes_adicionais,
        { key: '', value: '' },
      ],
    }));
  };

  const removeAdditionalInfo = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      informacoes_adicionais: prev.informacoes_adicionais.filter(
        (_, i) => i !== index
      ),
    }));
  };

  const updateAdditionalInfo = (
    index: number,
    field: 'key' | 'value',
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      informacoes_adicionais: prev.informacoes_adicionais.map((info, i) =>
        i === index ? { ...info, [field]: value } : info
      ),
    }));
  };

  const handleClose = () => {
    setFormData({
      id: '',
      nome: '',
      telefone: '',
      email: '',
      chatbot_desabilitado: false,
      informacoes_adicionais: [],
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{contactId ? 'Editar Contato' : 'Criar Contato'}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Nome e Telefone na mesma linha */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, nome: e.target.value }))
                  }
                  placeholder="Nome do contato"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  {!canViewFullPhone && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <EyeOff className="h-3 w-3" />
                      Mascarado
                    </span>
                  )}
                </div>
                <Input
                  id="telefone"
                  value={canViewFullPhone ? formData.telefone : displayPhone(formData.telefone)}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, telefone: e.target.value }))
                  }
                  placeholder="5511999999999"
                  disabled={!canViewFullPhone}
                  className={!canViewFullPhone ? 'bg-muted cursor-not-allowed' : ''}
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="email@exemplo.com"
              />
            </div>

            {/* Desabilitar Chatbot */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="chatbot">Desabilitar Chatbot</Label>
                <p className="text-sm text-muted-foreground">
                  Desativa respostas automáticas para este contato
                </p>
              </div>
              <Switch
                id="chatbot"
                checked={formData.chatbot_desabilitado}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    chatbot_desabilitado: checked,
                  }))
                }
              />
            </div>

            {/* Informações Adicionais */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Informações Adicionais</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addAdditionalInfo}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </div>

              {formData.informacoes_adicionais.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Nenhuma informação adicional
                </p>
              ) : (
                <div className="space-y-2">
                  {formData.informacoes_adicionais.map((info, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <Input
                        placeholder="Campo"
                        value={info.key}
                        onChange={(e) =>
                          updateAdditionalInfo(index, 'key', e.target.value)
                        }
                        className="flex-1"
                      />
                      <Input
                        placeholder="Valor"
                        value={info.value}
                        onChange={(e) =>
                          updateAdditionalInfo(index, 'value', e.target.value)
                        }
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAdditionalInfo(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading || saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
