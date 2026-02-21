import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, User, X, Loader2 } from 'lucide-react';
import { Queue, User as UserType } from '@/services/ticketService';
import { useUsuarios, Usuario } from '@/hooks/useUsuarios';
import { useUserFilas } from '@/hooks/useUserFilas';

interface TransferTicketModalProps {
  open: boolean;
  onClose: () => void;
  onTransfer: (options: { queueId?: string; userId?: string; message?: string }) => void;
  queues: Queue[];
  ticket?: any;
}

export const TransferTicketModal: React.FC<TransferTicketModalProps> = ({
  open,
  onClose,
  onTransfer,
  queues,
  ticket
}) => {
  const [queueId, setQueueId] = useState('');
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [message, setMessage] = useState('');
  const [showUserResults, setShowUserResults] = useState(false);

  // Filtrar apenas usuários que têm permissão de visualizar WhatsApp
  const { usuarios, loading: loadingUsers, searchUsuarios, clearUsuarios } = useUsuarios({
    requiredPermission: 'admin.whatsapp.visualizar'
  });
  const { filasPermitidas, hasFilasRestriction } = useUserFilas();

  // Filtrar filas baseado nas permissões
  const filasDisponiveis = useMemo(() => {
    if (!hasFilasRestriction || filasPermitidas.length === 0) {
      return queues;
    }
    return queues.filter(queue => filasPermitidas.includes(Number(queue.id)));
  }, [queues, filasPermitidas, hasFilasRestriction]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (userSearch.length >= 2) {
        searchUsuarios(userSearch);
        setShowUserResults(true);
      } else {
        clearUsuarios();
        setShowUserResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [userSearch, searchUsuarios, clearUsuarios]);

  const handleSelectUser = useCallback((user: Usuario) => {
    setSelectedUser(user);
    setUserSearch('');
    setShowUserResults(false);
    clearUsuarios();
  }, [clearUsuarios]);

  const handleRemoveUser = useCallback(() => {
    setSelectedUser(null);
  }, []);

  const handleSubmit = () => {
    if (!queueId && !selectedUser) return;

    onTransfer({
      queueId: queueId && queueId !== 'none' ? queueId : undefined,
      userId: selectedUser?.id || undefined,
      message: message || undefined
    });

    // Reset form
    setQueueId('');
    setSelectedUser(null);
    setUserSearch('');
    setMessage('');
    onClose();
  };

  const handleClose = () => {
    setQueueId('');
    setSelectedUser(null);
    setUserSearch('');
    setMessage('');
    onClose();
  };

  const canSubmit = (queueId && queueId !== 'none') || selectedUser;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transferir Ticket</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* User Search */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Transferir para usuário
            </Label>
            
            {selectedUser ? (
              <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                <div className="flex-1">
                  <p className="font-medium text-sm">{selectedUser.nome}</p>
                  <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleRemoveUser}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Digite para buscar usuários..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-9"
                />
                
                {/* Search Results */}
                {showUserResults && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg">
                    <ScrollArea className="max-h-48">
                      {loadingUsers ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="ml-2 text-sm">Buscando...</span>
                        </div>
                      ) : usuarios.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          Nenhum usuário encontrado com esse nome
                        </div>
                      ) : (
                        <div className="p-1">
                          {usuarios.map((user) => (
                            <button
                              key={user.id}
                              className="w-full flex items-center gap-3 p-2 hover:bg-accent rounded-sm text-left"
                              onClick={() => handleSelectUser(user)}
                            >
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-4 w-4 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{user.nome}</p>
                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Queue Select */}
          <div className="space-y-2">
            <Label>Transferir para fila</Label>
            <Select value={queueId} onValueChange={setQueueId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma fila" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma fila</SelectItem>
                {filasDisponiveis.map((queue) => (
                  <SelectItem key={queue.id} value={queue.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: queue.color || '#888' }}
                      />
                      {queue.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasFilasRestriction && (
              <p className="text-xs text-muted-foreground">
                Apenas filas permitidas para seu cargo são exibidas.
              </p>
            )}
          </div>

          {/* Message / Notes */}
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              placeholder="Mensagem interna, não vai para o cliente..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Esta mensagem é apenas para uso interno e não será enviada ao cliente.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            Transferir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
