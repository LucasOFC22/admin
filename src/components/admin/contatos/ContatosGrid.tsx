import React, { useState, useEffect } from 'react';
import { Phone, Edit, MessageCircle, Search, User, RefreshCw, Image } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/lib/toast';
import { useNavigate } from 'react-router-dom';
import { contatosService, ContatoWhatsApp } from '@/services/contatos/contatosService';
import { backendService } from '@/services/api/backendService';
import { formatPhoneNumber } from '@/utils/phone';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';

interface ContatosGridProps {
  onEdit: (contato: ContatoWhatsApp) => void;
}

const ContatosGrid: React.FC<ContatosGridProps> = ({ onEdit }) => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissionGuard();
  
  // Permissões
  const canEdit = hasPermission('admin.whatsapp.contatos.editar');
  
  const [contatos, setContatos] = useState<ContatoWhatsApp[]>([]);
  const [filteredContatos, setFilteredContatos] = useState<ContatoWhatsApp[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingPictureId, setUpdatingPictureId] = useState<string | null>(null);

  useEffect(() => {
    loadContatos();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredContatos(contatos);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = contatos.filter(
      contato =>
        contato.nome.toLowerCase().includes(term) ||
        contato.telefone.includes(term)
    );
    setFilteredContatos(filtered);
  }, [searchTerm, contatos]);

  const loadContatos = async () => {
    try {
      setIsLoading(true);
      const data = await contatosService.listar();
      setContatos(data);
      setFilteredContatos(data);
    } catch (error) {
      console.error('Erro ao carregar contatos:', error);
      toast.error('Não foi possível carregar os contatos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartChat = (contato: ContatoWhatsApp) => {
    if (contato.ultimoChat) {
      navigate(`/whatsapp/${contato.ultimoChat.id}`);
    } else {
      toast.info('Este contato ainda não possui conversas');
    }
  };

  const handleUpdatePicture = async (contato: ContatoWhatsApp) => {
    setUpdatingPictureId(contato.id);
    try {
      await contatosService.atualizarFotoPerfil(contato.id, contato.telefone);
      toast.success('Solicitação de atualização da foto enviada');
      // Recarregar após um delay para dar tempo de atualizar
      setTimeout(() => loadContatos(), 2000);
    } catch (error) {
      console.error('Erro ao atualizar foto:', error);
      toast.error('Não foi possível atualizar a foto de perfil');
    } finally {
      setUpdatingPictureId(null);
    }
  };

  const handleAtualizarPerfilBackend = async (contato: ContatoWhatsApp) => {
    setUpdatingPictureId(contato.id);
    try {
      const response = await backendService.atualizarPerfilWhatsApp(contato.id, contato.telefone);
      if (response.success) {
        toast.success('Foto de perfil atualizada');
        await loadContatos();
      } else {
        // Silenciar erro quando não há foto de perfil (erro 500 esperado)
        const errorMessage = response.error || '';
        if (errorMessage.includes('500') || errorMessage.includes('perfil')) {
          // Sem foto de perfil - não é erro, apenas silenciar
          return;
        }
        throw new Error(response.error || 'Erro ao atualizar perfil');
      }
    } catch (error: unknown) {
      // Silenciar erros 500 que indicam ausência de foto de perfil
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('500')) {
        // Sem foto de perfil - comportamento esperado, não logar como erro
        return;
      }
      console.error('Erro ao atualizar perfil via backend:', error);
      toast.error('Não foi possível atualizar o perfil');
    } finally {
      setUpdatingPictureId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Badge variant="secondary">{filteredContatos.length} contatos</Badge>
        </div>

        {filteredContatos.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <User className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {searchTerm ? 'Nenhum contato encontrado' : 'Nenhum contato cadastrado'}
              </h3>
              <p className="text-muted-foreground text-sm">
                {searchTerm
                  ? 'Tente buscar com outros termos'
                  : 'Crie um novo contato ou importe contatos'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredContatos.map(contato => (
              <Card key={contato.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="relative group">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={contato.perfil} alt={contato.nome} />
                          <AvatarFallback className="bg-primary/10">
                            <User className="h-6 w-6 text-primary" />
                          </AvatarFallback>
                        </Avatar>
                        <Button
                          size="icon"
                          variant="secondary"
                          className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleUpdatePicture(contato)}
                          disabled={updatingPictureId === contato.id}
                        >
                          <RefreshCw className={`h-3 w-3 ${updatingPictureId === contato.id ? 'animate-spin' : ''}`} />
                        </Button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{contato.nome}</h4>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span className="truncate">{formatPhoneNumber(contato.telefone)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="text-xs text-muted-foreground">
                      Cadastrado em: {format(new Date(contato.criadoem), 'dd/MM/yyyy', { locale: ptBR })}
                    </div>
                    
                    {contato.ultimoChat && (
                      <div className="text-xs">
                        <span className="text-muted-foreground">Último chat: </span>
                        <span className="text-primary cursor-pointer hover:underline" onClick={() => handleStartChat(contato)}>
                          {format(new Date(contato.ultimoChat.data), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {contato.ultimoChat && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleStartChat(contato)}
                      >
                        <MessageCircle className="h-3 w-3 mr-1" />
                        Chat
                      </Button>
                    )}
                    {canEdit && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleAtualizarPerfilBackend(contato)}
                        disabled={updatingPictureId === contato.id}
                        title="Atualizar foto de perfil"
                      >
                        <Image className={`h-3 w-3 ${updatingPictureId === contato.id ? 'animate-pulse' : ''}`} />
                      </Button>
                    )}
                    {canEdit && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit(contato)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default ContatosGrid;
