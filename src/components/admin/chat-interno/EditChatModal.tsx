import React, { useState, useEffect, useCallback, memo } from 'react';
import { Pencil } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { chatInternoService, ChatInterno } from '@/services/chatInterno/chatInternoService';
import { toast } from '@/lib/toast';

interface EditChatModalProps {
  isOpen: boolean;
  chat: ChatInterno | null;
  onClose: () => void;
  onEdit: (chatId: string, titulo: string, userIds: string[]) => Promise<void>;
  buscarParticipantes: (chatId: string) => Promise<string[]>;
}

const EditChatModal: React.FC<EditChatModalProps> = memo(({
  isOpen,
  chat,
  onClose,
  onEdit,
  buscarParticipantes
}) => {
  const [titulo, setTitulo] = useState('');
  const [usuarios, setUsuarios] = useState<Array<{ id: string; nome: string; email: string }>>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      if (!isOpen || !chat) return;
      
      try {
        setIsLoadingData(true);
        setTitulo(chat.titulo);
        
        const [usuariosData, participantes] = await Promise.all([
          chatInternoService.buscarUsuarios(),
          buscarParticipantes(chat.id)
        ]);
        
        if (mounted) {
          setUsuarios(usuariosData);
          setSelectedUsers(participantes);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        if (mounted) {
          toast.error('Não foi possível carregar os dados do chat');
        }
      } finally {
        if (mounted) {
          setIsLoadingData(false);
        }
      }
    };

    loadData();
    
    return () => {
      mounted = false;
    };
  }, [isOpen, chat]);

  const handleToggleUser = useCallback((userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!chat) return;

    if (!titulo.trim()) {
      toast.warning('Digite um título para o chat');
      return;
    }

    if (selectedUsers.length === 0) {
      toast.warning('Selecione pelo menos um usuário');
      return;
    }

    setIsLoading(true);
    try {
      await onEdit(chat.id, titulo, selectedUsers);
      toast.success('Chat atualizado com sucesso');
      onClose();
    } catch (error) {
      console.error('Erro ao editar chat:', error);
      toast.error('Não foi possível atualizar o chat');
    } finally {
      setIsLoading(false);
    }
  }, [chat, titulo, selectedUsers, onEdit, onClose]);

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setTitulo('');
      setSelectedUsers([]);
      onClose();
    }
  }, [onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Editar Chat
          </DialogTitle>
          <DialogDescription>
            Altere o título e os participantes do chat
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título do Chat</Label>
            <Input
              id="titulo"
              placeholder="Ex: Equipe de Vendas"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              disabled={isLoading || isLoadingData}
            />
          </div>

          <div className="space-y-2">
            <Label>Participantes</Label>
            <ScrollArea className="h-64 border rounded-md p-4">
              {isLoadingData ? (
                <div className="text-center py-4 text-muted-foreground">
                  Carregando...
                </div>
              ) : usuarios.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  Nenhum usuário disponível
                </div>
              ) : (
                <div className="space-y-3">
                  {usuarios.map((usuario) => (
                    <div
                      key={usuario.id}
                      className="flex items-center space-x-3 p-2 rounded hover:bg-muted/50"
                    >
                      <Checkbox
                        id={`edit-user-${usuario.id}`}
                        checked={selectedUsers.includes(usuario.id)}
                        onCheckedChange={() => handleToggleUser(usuario.id)}
                      />
                      <label
                        htmlFor={`edit-user-${usuario.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        <p className="text-sm font-medium">{usuario.nome}</p>
                        <p className="text-xs text-muted-foreground">{usuario.email}</p>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            {selectedUsers.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {selectedUsers.length} participante(s) selecionado(s)
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || isLoadingData}>
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
});

EditChatModal.displayName = 'EditChatModal';

export default EditChatModal;
