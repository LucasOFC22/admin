import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageSquare, Plus, Lock } from 'lucide-react';
import PageHeader from '@/components/admin/PageHeader';
import { Button } from '@/components/ui/button';
import { useChatInterno } from '@/hooks/useChatInterno';
import { useIsMobile, useIsDesktop } from '@/hooks/use-mobile';
import ChatInternoList from '@/components/admin/chat-interno/ChatInternoList';
import ChatInternoMessages from '@/components/admin/chat-interno/ChatInternoMessages';
import CreateChatModal from '@/components/admin/chat-interno/CreateChatModal';
import EditChatModal from '@/components/admin/chat-interno/EditChatModal';
import { ChatInterno as ChatInternoType } from '@/services/chatInterno/chatInternoService';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import PermissionGuard from '@/components/admin/permissions/PermissionGuard';

const ChatInterno = () => {
  const { chatId } = useParams<{ chatId?: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingChat, setEditingChat] = useState<ChatInternoType | null>(null);
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
  const { hasPermission } = usePermissionGuard();

  const canSendMessage = hasPermission('admin.chat-interno.enviar');
  
  const { 
    chats, 
    messages, 
    isLoadingChats, 
    isLoadingMessages, 
    enviarMensagem, 
    criarChat,
    editarChat,
    excluirChat,
    buscarParticipantes
  } = useChatInterno(chatId);

  const selectedChat = chats.find(chat => chat.id === chatId);

  const handleSelectChat = (chatId: string) => {
    navigate(`/chatinterno/${chatId}`);
  };

  const handleBackToList = () => {
    navigate('/chatinterno');
  };

  const handleOpenCreateModal = () => {
    if (!canSendMessage) {
      toast({
        title: 'Sem permissão',
        description: 'Você não tem permissão para criar novas conversas',
        variant: 'destructive'
      });
      return;
    }
    setIsCreateModalOpen(true);
  };

  const handleCreateChat = async (titulo: string, userIds: string[]) => {
    if (!canSendMessage) {
      toast({
        title: 'Sem permissão',
        description: 'Você não tem permissão para criar novas conversas',
        variant: 'destructive'
      });
      return;
    }

    try {
      const newChat = await criarChat(titulo, userIds);
      if (newChat) {
        setIsCreateModalOpen(false);
        navigate(`/chatinterno/${newChat.id}`);
      }
    } catch (error) {
      // Error handled by service
    }
  };

  const handleEditChat = async (chatId: string, titulo: string, userIds: string[]) => {
    await editarChat(chatId, titulo, userIds);
    setEditingChat(null);
  };

  const handleDeleteChat = async () => {
    if (!deletingChatId) return;
    
    try {
      await excluirChat(deletingChatId);
      toast({
        title: 'Sucesso',
        description: 'Chat excluído com sucesso'
      });
      
      if (chatId === deletingChatId) {
        navigate('/chatinterno');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o chat',
        variant: 'destructive'
      });
    } finally {
      setDeletingChatId(null);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!canSendMessage) {
      toast({
        title: 'Sem permissão',
        description: 'Você não tem permissão para enviar mensagens',
        variant: 'destructive'
      });
      return;
    }
    await enviarMensagem(message);
  };

  // Em dispositivos menores que desktop (< 1024px), mostrar apenas lista OU chat
  const showChatArea = isDesktop ? true : !!chatId;
  const showChatList = isDesktop ? true : !chatId;
  const showBackButton = !isDesktop;

  return (
    <PermissionGuard 
      permissions="admin.chat-interno.visualizar"
      showMessage={true}
    >
      <div className="flex flex-col h-full">
          <PageHeader 
            title="Chat Interno" 
            subtitle="Comunicação entre membros da equipe"
            icon={MessageSquare}
            breadcrumbs={[
              { label: "Dashboard", href: "/" },
              { label: "Chat Interno" }
            ]}
            actions={
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button 
                        onClick={handleOpenCreateModal} 
                        size="sm"
                        disabled={!canSendMessage}
                      >
                        {canSendMessage ? <Plus className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                        Novo Chat
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {!canSendMessage && (
                    <TooltipContent>
                      <p>Você não tem permissão para criar novos chats</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            }
          />
          
          <div className="flex-1 min-h-0 p-4 md:p-6 overflow-hidden">
            <div className="h-full flex flex-col lg:flex-row gap-4 md:gap-6">
              {showChatList && (
                <div className="lg:w-80 xl:w-96 flex-shrink-0 h-full">
                  <ChatInternoList
                    chats={chats}
                    selectedChatId={chatId}
                    isLoading={isLoadingChats}
                    onSelectChat={handleSelectChat}
                    onEditChat={(chat) => setEditingChat(chat)}
                    onDeleteChat={(chatId) => setDeletingChatId(chatId)}
                  />
                </div>
              )}
              
              {showChatArea && (
                <div className="flex-1 min-w-0 h-full">
                  <ChatInternoMessages
                    chat={selectedChat}
                    messages={messages}
                    isLoading={isLoadingMessages}
                    onSendMessage={handleSendMessage}
                    onBack={showBackButton ? handleBackToList : undefined}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {canSendMessage && (
          <CreateChatModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onCreate={handleCreateChat}
          />
        )}

        <EditChatModal
          isOpen={!!editingChat}
          chat={editingChat}
          onClose={() => setEditingChat(null)}
          onEdit={handleEditChat}
          buscarParticipantes={buscarParticipantes}
        />

        <AlertDialog open={!!deletingChatId} onOpenChange={(open) => !open && setDeletingChatId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Chat</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este chat? Esta ação não pode ser desfeita e todas as mensagens serão perdidas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteChat} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </PermissionGuard>
  );
};

export default ChatInterno;
