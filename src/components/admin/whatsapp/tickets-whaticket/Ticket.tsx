import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { TicketHeader } from './TicketHeader';
import { TicketInfo } from './TicketInfo';
import { TicketActionButtons } from './TicketActionButtons';
import { MessagesList } from './MessagesList';
import { MessageInput, TicketContactInfo } from './MessageInput';
import { ContactDrawer } from './ContactDrawer';
import { TagsContainer, Tag } from './TagsContainer';
import { MediaPreviewModal } from './MediaPreviewModal';
import { Ticket as TicketType } from '@/services/ticketService';
import { ticketService } from '@/services/ticketService';
import { useToast } from '@/hooks/use-toast';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { useTicketAccessGuard } from '@/hooks/useTicketAccessGuard';
import { useTicketHistory } from '@/hooks/useTicketHistory';
import { logsWhatsAppService } from '@/services/whatsapp/logsWhatsAppService';
import { whatsappMediaService } from '@/services/whatsappMediaService';
import { AlertCircle, Lock, History, MessageSquare, StickyNote, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NotasWhatsappPanel from '@/components/whatsapp/NotasWhatsappPanel';
import { MessageSearchPanel } from './MessageSearchPanel';
import { useScrollToMessage } from '@/contexts/ScrollToMessageContext';
import { ReplyMessageContext } from '@/contexts/ReplyingMessageContext';

interface TicketProps {
  ticket: TicketType;
  queues: any[];
  onResolve: (silent: boolean) => void;
  onTransfer: (queueId: string, userId?: string) => void;
  onDelete?: () => void;
  isAdmin?: boolean;
  onBack?: () => void;
  onReopen?: () => void;
}

export const Ticket: React.FC<TicketProps> = ({
  ticket,
  queues,
  onResolve,
  onTransfer,
  onDelete,
  isAdmin,
  onBack,
  onReopen
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [droppedFiles, setDroppedFiles] = useState<File[]>([]);
  const [showMediaPreview, setShowMediaPreview] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [activeTab, setActiveTab] = useState<'conversa' | 'notas' | 'pesquisar'>('conversa');
  const dropFileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useUnifiedAuth();
  const { setMessageIdToScrollTo } = useScrollToMessage();
  const { replyingMessage, setReplyingMessage } = useContext(ReplyMessageContext);
  
  // Verificar acesso ao ticket baseado nas filas permitidas
  const { hasAccess, isLoading: isCheckingAccess } = useTicketAccessGuard(ticket.id, ticket.chatId);
  
  // Hook para carregar mensagens com suporte a histórico
  const { 
    messages, 
    isLoading: loadingMessages, 
    canSeeHistory, 
    totalChats,
    addOptimisticMessage,
    removeOptimisticMessage
  } = useTicketHistory(hasAccess ? ticket : null);

  // Load available tags and set selected tags from ticket
  useEffect(() => {
    const loadTags = async () => {
      try {
        const { tagService } = await import('@/services/supabase/tagService');
        const tags = await tagService.getTags(); // Load all tags without kanban filter
        setAvailableTags(tags.map(t => ({ id: t.id, name: t.name, color: t.color })));
      } catch (error) {
        console.error('Error loading tags:', error);
      }
    };
    loadTags();
  }, []);

  // Update selected tags when ticket changes
  useEffect(() => {
    if (ticket.tags) {
      setSelectedTags(ticket.tags.map(t => ({ 
        id: typeof t.id === 'string' ? parseInt(t.id, 10) : t.id, 
        name: t.name, 
        color: t.color 
      })));
    } else {
      setSelectedTags([]);
    }
  }, [ticket.id, ticket.tags]);

  const handleSendMessage = async (body: string, isPrivate: boolean) => {
    // Adicionar mensagem otimista ANTES de enviar (aparece instantaneamente)
    const tempId = addOptimisticMessage(body, isPrivate, user?.nome);
    
    // Capturar replyToMessageId antes de limpar o contexto
    const replyToId = replyingMessage?.id;
    
    try {
      const chatIdToUse = ticket.chatId ? String(ticket.chatId) : ticket.id;
      
      // Enviar nova mensagem (com ou sem reply)
      await ticketService.sendMessage(chatIdToUse, body, isPrivate, user?.nome, replyToId);
      setReplyingMessage(null);
      
      // Registrar log de mensagem enviada
      await logsWhatsAppService.registrarLog({
        acao: 'mensagem_enviada',
        contato_id: ticket.id,
        chat_id: ticket.chatId,
        detalhes: {
          contato_nome: ticket.contact?.name,
          contato_telefone: ticket.contact?.number,
          mensagem_preview: body.substring(0, 100),
          is_private: isPrivate,
          is_reply: !!replyToId
        }
      });
    } catch (error: any) {
      // Remover mensagem otimista em caso de erro
      removeOptimisticMessage(tempId);
      toast({
        title: "Erro ao enviar mensagem",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleTagsChange = async (tags: Tag[]) => {
    const oldTags = selectedTags.map(t => t.id);
    setSelectedTags(tags);
    try {
      await ticketService.updateTicketTags(ticket.id, tags.map(t => t.id));
      
      // Registrar log de tags atualizadas
      await logsWhatsAppService.registrarLog({
        acao: 'tags_atualizadas',
        contato_id: ticket.id,
        chat_id: ticket.chatId,
        detalhes: {
          contato_nome: ticket.contact?.name,
          tags_antigas: oldTags,
          tags_novas: tags.map(t => t.id)
        }
      });
    } catch (error) {
      console.error('Error updating tags:', error);
      toast({
        title: "Erro ao atualizar tags",
        description: "Não foi possível salvar as tags",
        variant: "destructive"
      });
    }
  };

  const handleCreateTag = async (name: string): Promise<Tag | undefined> => {
    try {
      const { tagService } = await import('@/services/supabase/tagService');
      const color = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
      const newTag = await tagService.createTag({ name, color, kanban: 0 });
      const tag = { id: newTag.id, name: newTag.name, color: newTag.color };
      setAvailableTags(prev => [...prev, tag]);
      return tag;
    } catch (error) {
      console.error('Error creating tag:', error);
      return undefined;
    }
  };

  // Handler para arquivos dropados na área de mensagens
  const handleFileDrop = useCallback((files: File[]) => {
    if (ticket.status !== 'open') {
      toast({
        title: "Ticket fechado",
        description: "Não é possível enviar arquivos em um ticket fechado",
        variant: "destructive"
      });
      return;
    }
    setDroppedFiles(files);
    setShowMediaPreview(true);
  }, [ticket.status, toast]);

  const handleCloseMediaPreview = useCallback(() => {
    setShowMediaPreview(false);
    setDroppedFiles([]);
  }, []);

  // Handler para enviar mídia do modal de preview
  const handleSendDroppedMedia = useCallback(async (files: File[], caption: string) => {
    if (!ticket.chatId) {
      toast({
        title: "Erro",
        description: "ChatId não encontrado",
        variant: "destructive"
      });
      return;
    }

    setIsUploadingMedia(true);
    
    try {
      const phoneNumber = ticket.contact?.number;
      if (!phoneNumber) {
        throw new Error('Número do contato não encontrado');
      }

      for (const file of files) {
        await whatsappMediaService.sendMedia({
          file,
          chatId: String(ticket.chatId),
          phoneNumber,
          caption: files.length === 1 ? caption : undefined,
        });
      }
      
      toast({
        title: "Mídia enviada",
        description: `${files.length} arquivo(s) enviado(s) com sucesso`
      });
      
      handleCloseMediaPreview();
    } catch (error: any) {
      console.error('[Ticket] Erro ao enviar mídia:', error);
      toast({
        title: "Erro ao enviar mídia",
        description: error.message || "Falha ao enviar arquivo",
        variant: "destructive"
      });
    } finally {
      setIsUploadingMedia(false);
    }
  }, [ticket, user, toast, handleCloseMediaPreview]);

  // Handler para adicionar mais arquivos
  const handleAddMoreFiles = useCallback(() => {
    dropFileInputRef.current?.click();
  }, []);

  const handleDropFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setDroppedFiles(prev => [...prev, ...files]);
    }
    e.target.value = '';
  }, []);

  // Se está verificando acesso, mostrar loading
  if (isCheckingAccess) {
    return (
      <div className="flex flex-col h-full overflow-hidden items-center justify-center">
        <p className="text-muted-foreground">Verificando permissões...</p>
      </div>
    );
  }

  // Se não tem acesso, mostrar mensagem de erro
  if (!hasAccess) {
    return (
      <div className="flex flex-col h-full overflow-hidden items-center justify-center gap-4 p-8">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10">
          <Lock className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Acesso Negado</h3>
        <p className="text-muted-foreground text-center max-w-md">
          Você não tem permissão para visualizar este ticket. 
          Este ticket pertence a uma fila à qual seu cargo não tem acesso.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TicketHeader tags={ticket.tags?.map(t => t.name)}>
        <TicketInfo ticket={ticket} onClickAvatar={() => setDrawerOpen(true)} />
        <TicketActionButtons
          ticket={ticket}
          queues={queues}
          onResolve={onResolve}
          onTransfer={onTransfer}
          onDelete={onDelete}
          isAdmin={isAdmin}
          onBack={onBack}
          onReopen={onReopen}
        />
      </TicketHeader>

      {/* Tags selection and history info below header */}
      <div className="px-2 py-1 border-b border-input bg-background flex items-center justify-between gap-2">
        <TagsContainer
          selectedTags={selectedTags}
          availableTags={availableTags}
          onTagsChange={handleTagsChange}
          onCreateTag={handleCreateTag}
          placeholder="Tags"
        />
        {canSeeHistory && totalChats > 1 && (
          <Badge variant="secondary" className="flex items-center gap-1 text-xs whitespace-nowrap">
            <History className="h-3 w-3" />
            {totalChats} conversas
          </Badge>
        )}
      </div>

      {/* Tabs: Conversa, Notas e Pesquisar */}
      <Tabs 
        value={activeTab} 
        onValueChange={(v) => setActiveTab(v as 'conversa' | 'notas' | 'pesquisar')} 
        className="flex-1 flex flex-col min-h-0"
      >
        <TabsList className="mx-2 mt-2 grid grid-cols-3 h-9">
          <TabsTrigger value="conversa" className="gap-1.5 text-xs sm:text-sm">
            <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Conversa</span>
            <span className="xs:hidden">Chat</span>
          </TabsTrigger>
          <TabsTrigger value="notas" className="gap-1.5 text-xs sm:text-sm">
            <StickyNote className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>Notas</span>
          </TabsTrigger>
          <TabsTrigger value="pesquisar" className="gap-1.5 text-xs sm:text-sm">
            <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>Pesquisar</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Conversa */}
        <TabsContent value="conversa" className="flex-1 flex flex-col min-h-0 mt-0 data-[state=inactive]:hidden">
          {loadingMessages ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-muted-foreground">Carregando mensagens...</p>
            </div>
          ) : (
            <>
              <MessagesList ticket={ticket} messages={messages} onFileDrop={handleFileDrop} />
              <MessageInput
                onSendMessage={handleSendMessage}
                disabled={
                  (ticket.status !== 'open' && ticket.status !== 'group') ||
                  (ticket.modoDeAtendimento?.toLowerCase() === 'bot' && ticket.aceitoPorAdmin !== true)
                }
                ticketStatus={ticket.status}
                chatId={ticket.chatId ? String(ticket.chatId) : undefined}
                ticketContact={{
                  contactName: ticket.contact?.name,
                  contactPhone: ticket.contact?.number,
                  queueName: ticket.queue?.name,
                  chatCreatedAt: ticket.createdAt,
                }}
                attendantName={user?.nome}
                attendantEmail={user?.email}
              />
              {/* Modal de preview de mídia para arquivos dropados */}
              {showMediaPreview && droppedFiles.length > 0 && (
                <MediaPreviewModal
                  files={droppedFiles}
                  onClose={handleCloseMediaPreview}
                  onSend={handleSendDroppedMedia}
                  onAddMoreFiles={handleAddMoreFiles}
                  isLoading={isUploadingMedia}
                />
              )}
              {/* Input hidden para adicionar mais arquivos */}
              <input
                type="file"
                ref={dropFileInputRef}
                onChange={handleDropFileInputChange}
                className="hidden"
                multiple
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              />
            </>
          )}
        </TabsContent>

        {/* Tab: Notas */}
        <TabsContent value="notas" className="flex-1 flex flex-col min-h-0 mt-0 p-2 data-[state=inactive]:hidden">
          <div className="flex-1 overflow-hidden">
            <NotasWhatsappPanel
              chatId={ticket.chatId || Number(ticket.id)}
              currentUserId={user?.id || null}
              currentUserName={user?.nome || user?.email || 'Usuário'}
              isAdmin={isAdmin}
              isChatActive={ticket.status !== 'closed'}
            />
          </div>
        </TabsContent>

        {/* Tab: Pesquisar */}
        <TabsContent value="pesquisar" className="flex-1 flex flex-col min-h-0 mt-0 data-[state=inactive]:hidden">
          <MessageSearchPanel
            messages={messages}
            onScrollToMessage={(messageId) => setMessageIdToScrollTo(messageId)}
            onSwitchToChat={() => setActiveTab('conversa')}
          />
        </TabsContent>
      </Tabs>

      <ContactDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        ticket={ticket}
      />
    </div>
  );
};
