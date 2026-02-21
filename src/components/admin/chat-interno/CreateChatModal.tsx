import React, { useState, useEffect, useCallback, memo } from 'react';
import { Users } from 'lucide-react';
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
import { chatInternoService } from '@/services/chatInterno/chatInternoService';
import { useToast } from '@/hooks/use-toast';

interface CreateChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (titulo: string, userIds: string[]) => Promise<void>;
}

const CreateChatModal: React.FC<CreateChatModalProps> = memo(({
  isOpen,
  onClose,
  onCreate
}) => {
  const { toast } = useToast();
  const [titulo, setTitulo] = useState('');
  const [usuarios, setUsuarios] = useState<Array<{ id: string; nome: string; email: string }>>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const loadUsuarios = async () => {
      if (!isOpen) return;
      
      try {
        setIsLoadingUsers(true);
        const usuariosData = await chatInternoService.buscarUsuarios();
        if (mounted) {
          setUsuarios(usuariosData);
        }
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        if (mounted) {
          toast({
            title: 'Erro',
            description: 'Não foi possível carregar os usuários',
            variant: 'destructive'
          });
        }
      } finally {
        if (mounted) {
          setIsLoadingUsers(false);
        }
      }
    };

    loadUsuarios();
    
    return () => {
      mounted = false;
    };
  }, [isOpen]);

  const handleToggleUser = useCallback((userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titulo.trim()) {
      toast({
        title: 'Erro',
        description: 'Digite um título para o chat',
        variant: 'destructive'
      });
      return;
    }

    if (selectedUsers.length === 0) {
      toast({
        title: 'Erro',
        description: 'Selecione pelo menos um usuário',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      await onCreate(titulo, selectedUsers);
      toast({
        title: 'Sucesso',
        description: 'Chat criado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao criar chat:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o chat',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [titulo, selectedUsers, onCreate, toast]);

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
            <Users className="h-5 w-5" />
            Criar Novo Chat
          </DialogTitle>
          <DialogDescription>
            Crie uma conversa interna com membros da equipe
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
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label>Selecionar Participantes</Label>
            <ScrollArea className="h-64 border rounded-md p-4">
              {isLoadingUsers ? (
                <div className="text-center py-4 text-muted-foreground">
                  Carregando usuários...
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
                        id={`user-${usuario.id}`}
                        checked={selectedUsers.includes(usuario.id)}
                        onCheckedChange={() => handleToggleUser(usuario.id)}
                      />
                      <label
                        htmlFor={`user-${usuario.id}`}
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
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Criando...' : 'Criar Chat'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
});

CreateChatModal.displayName = 'CreateChatModal';

export default CreateChatModal;
