import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Paperclip, Smile, X, MessageSquare, Edit, Plus, Clock, Lock, FileText, Image, Headphones, Contact, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { ReplyMessageContext } from '@/contexts/ReplyingMessageContext';
import { EditMessageContext } from '@/contexts/EditingMessageContext';
import { i18n } from '@/translate/i18n';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { QuickMessagesMenu } from './QuickMessagesMenu';
import { MensagemRapida } from '@/services/mensagensRapidas/mensagensRapidasService';
import { useMensagensRapidas } from '@/hooks/useMensagensRapidas';
import { whatsappMediaService } from '@/services/whatsappMediaService';
import { toast } from '@/lib/toast';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { MediaPreviewModal } from './MediaPreviewModal';
import { replaceMessageVariables, MessageVariablesContext } from '@/utils/messageVariables';
import { useSessionWindow } from '@/hooks/useSessionWindow';
import { SessionWindowAlert } from './SessionWindowAlert';

export interface TicketContactInfo {
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  queueName?: string;
  chatCreatedAt?: string;
}

interface MessageInputProps {
  onSendMessage: (body: string, isPrivate: boolean) => void;
  disabled?: boolean;
  ticketStatus?: string;
  chatId?: string;
  ticketContact?: TicketContactInfo;
  attendantName?: string;
  attendantEmail?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({ 
  onSendMessage, 
  disabled,
  ticketStatus,
  chatId,
  ticketContact,
  attendantName,
  attendantEmail
}) => {
  // Estados de mensagem
  const [message, setMessage] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [mediaPreviewFiles, setMediaPreviewFiles] = useState<File[]>([]);
  const [showMediaPreview, setShowMediaPreview] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMoreFilesRef = useRef<HTMLInputElement>(null);
  const [currentFileType, setCurrentFileType] = useState<'document' | 'media' | 'audio'>('document');
  
  // Quick messages state
  const [showQuickMessages, setShowQuickMessages] = useState(false);
  const [quickMessageSearch, setQuickMessageSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [slashPosition, setSlashPosition] = useState<number | null>(null);
  
  const { mensagens } = useMensagensRapidas();
  
  const { replyingMessage, setReplyingMessage } = useContext(ReplyMessageContext);
  const { editingMessage, setEditingMessage } = useContext(EditMessageContext);
  const { hasPermission } = usePermissionGuard();
  
  // Hook para verificar janela de 24 horas do WhatsApp
  const sessionWindow = useSessionWindow(chatId);
  
  // Buscar telefone do contato para envio de mídia
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [isLoadingContact, setIsLoadingContact] = useState(false);
  
  useEffect(() => {
    const fetchPhoneNumber = async () => {
      if (!chatId) {
        console.log('[MessageInput] Sem chatId, não buscando telefone');
        setPhoneNumber('');
        return;
      }
      
      console.log('[MessageInput] Buscando telefone para chatId (bigint):', chatId);
      setIsLoadingContact(true);
      
      try {
        const supabase = requireAuthenticatedClient();
        // chatId é o ID bigint do chat (chats_whatsapp.id)
        // Primeiro buscar o chat para obter o usuarioid (UUID do contato)
        const { data: chatData, error: chatError } = await supabase
          .from('chats_whatsapp')
          .select('usuarioid')
          .eq('id', chatId)
          .maybeSingle();
        
        if (chatError) {
          console.error('[MessageInput] Erro ao buscar chat:', chatError);
          return;
        }
        
        if (!chatData?.usuarioid) {
          console.warn('[MessageInput] Chat não encontrado ou sem usuarioid');
          return;
        }
        
        console.log('[MessageInput] usuarioid encontrado:', chatData.usuarioid);
        
        // Agora buscar o telefone do contato pelo usuarioid
        const { data: contatoData, error: contatoError } = await supabase
          .from('contatos_whatsapp')
          .select('telefone')
          .eq('id', chatData.usuarioid)
          .maybeSingle();
        
        if (contatoError) {
          console.error('[MessageInput] Erro ao buscar contato:', contatoError);
          return;
        }
        
        if (contatoData?.telefone) {
          console.log('[MessageInput] Telefone encontrado:', contatoData.telefone);
          setPhoneNumber(contatoData.telefone);
        } else {
          console.warn('[MessageInput] Contato não encontrado ou sem telefone');
        }
      } catch (error) {
        console.error('[MessageInput] Erro inesperado:', error);
      } finally {
        setIsLoadingContact(false);
      }
    };
    
    fetchPhoneNumber();
  }, [chatId]);

  const canSendMessage = hasPermission('admin.whatsapp.enviar');

  // Calcula mensagens filtradas para navegação por teclado
  const filteredMensagens = mensagens
    .filter((m) => m.comando.toLowerCase().includes(quickMessageSearch.toLowerCase()))
    .slice(0, 10);

  useEffect(() => {
    inputRef.current?.focus();
    if (editingMessage) {
      setMessage(editingMessage.body);
    }
  }, [replyingMessage, editingMessage]);

  useEffect(() => {
    inputRef.current?.focus();
    return () => {
      setMessage("");
      setReplyingMessage(null);
      setIsPrivate(false);
      setEditingMessage(null);
    };
  }, [setReplyingMessage, setEditingMessage]);

  // Detecta "/" para ativar menu de mensagens rápidas
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    
    setMessage(value);
    
    // Procura por "/" antes do cursor
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastSlashIndex = textBeforeCursor.lastIndexOf('/');
    
    if (lastSlashIndex !== -1) {
      // Verifica se o "/" é o início ou tem espaço antes
      const charBeforeSlash = lastSlashIndex > 0 ? textBeforeCursor[lastSlashIndex - 1] : ' ';
      
      if (charBeforeSlash === ' ' || lastSlashIndex === 0) {
        const searchText = textBeforeCursor.substring(lastSlashIndex + 1);
        // Só ativa se não tiver espaço após o /
        if (!searchText.includes(' ')) {
          setShowQuickMessages(true);
          setQuickMessageSearch(searchText);
          setSlashPosition(lastSlashIndex);
          setSelectedIndex(0);
          return;
        }
      }
    }
    
    setShowQuickMessages(false);
    setQuickMessageSearch('');
    setSlashPosition(null);
  }, []);

  const handleQuickMessageSelect = useCallback((mensagem: MensagemRapida) => {
    if (slashPosition === null) return;
    
    // Preparar contexto para substituição de variáveis
    const context: MessageVariablesContext = {
      nomeCliente: ticketContact?.contactName,
      telefoneCliente: ticketContact?.contactPhone || phoneNumber,
      emailCliente: ticketContact?.contactEmail,
      nomeAtendente: attendantName,
      emailAtendente: attendantEmail,
      chatId: chatId,
      ticketId: chatId,
      filaNome: ticketContact?.queueName,
      inicioAtendimento: ticketContact?.chatCreatedAt ? new Date(ticketContact.chatCreatedAt) : undefined,
    };
    
    // Substitui variáveis no conteúdo da mensagem
    const conteudoProcessado = replaceMessageVariables(mensagem.conteudo, context);
    
    // Substitui /comando pelo conteúdo processado da mensagem
    const beforeSlash = message.substring(0, slashPosition);
    const afterCommand = message.substring(slashPosition + quickMessageSearch.length + 1);
    
    const newMessage = beforeSlash + conteudoProcessado + afterCommand;
    setMessage(newMessage);
    
    // Fecha o menu
    setShowQuickMessages(false);
    setQuickMessageSearch('');
    setSlashPosition(null);
    setSelectedIndex(0);
    
    // Foca no input e atualiza altura
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        // Força atualização da altura do textarea
        inputRef.current.style.height = 'auto';
        inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
      }
    }, 0);
  }, [message, slashPosition, quickMessageSearch, ticketContact, attendantName, attendantEmail, chatId, phoneNumber]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setMessage(prev => prev + emojiData.emoji);
    inputRef.current?.focus();
  };

  const handleSend = () => {
    if (!message.trim() || !canSendMessage) return;
    setShowEmojiPicker(false);
    setShowQuickMessages(false);
    onSendMessage(message, isPrivate);
    setMessage('');
    setReplyingMessage(null);
    setEditingMessage(null);
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  const isSessionExpired = sessionWindow.isExpired;
  const isDisabled = disabled || !canSendMessage || isUploadingMedia || isSessionExpired;
  const isAttachDisabled = isDisabled || isLoadingContact || !phoneNumber;


  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Se menu de mensagens rápidas está aberto
    if (showQuickMessages && filteredMensagens.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < filteredMensagens.length - 1 ? prev + 1 : 0
        );
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev > 0 ? prev - 1 : filteredMensagens.length - 1
        );
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredMensagens[selectedIndex]) {
          handleQuickMessageSelect(filteredMensagens[selectedIndex]);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowQuickMessages(false);
        setQuickMessageSearch('');
        setSlashPosition(null);
        return;
      }
    }
    
    // Comportamento normal do Enter (enviar mensagem)
    if (e.key === 'Enter' && !e.shiftKey && !showQuickMessages) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handler para seleção de arquivo de mídia - abre modal de preview
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    console.log('[MessageInput] handleFileSelect chamado', { 
      filesCount: files.length, 
      chatId, 
      phoneNumber,
      isLoadingContact 
    });
    
    if (files.length === 0) {
      console.log('[MessageInput] Nenhum arquivo selecionado');
      return;
    }
    
    if (!chatId) {
      console.error('[MessageInput] chatId não disponível');
      toast.error('Erro: Chat não identificado');
      return;
    }
    
    if (!phoneNumber) {
      console.error('[MessageInput] phoneNumber não disponível');
      toast.error('Telefone do contato não encontrado. Aguarde carregar os dados.');
      return;
    }
    
    setShowAttachMenu(false);
    setMediaPreviewFiles(files);
    setShowMediaPreview(true);
    
    // Limpar input para permitir reenvio do mesmo arquivo
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handler para adicionar mais arquivos ao preview
  const handleAddMoreFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    if (newFiles.length > 0) {
      setMediaPreviewFiles(prev => [...prev, ...newFiles]);
    }
    if (addMoreFilesRef.current) {
      addMoreFilesRef.current.value = '';
    }
  };

  // Handler para enviar mídia do modal de preview
  const handleSendMedia = async (files: File[], caption: string) => {
    setIsUploadingMedia(true);
    
    console.log('[MessageInput] Enviando mídia com caption:', {
      filesCount: files.length,
      caption,
      chatId,
      phoneNumber
    });
    
    try {
      // Enviar cada arquivo
      for (const file of files) {
        const result = await whatsappMediaService.sendMedia({
          file,
          chatId: chatId!,
          phoneNumber,
          caption: caption || undefined,
        });
        
        console.log('[MessageInput] Resultado do envio:', result);
        
        if (!result.success) {
          toast.error(result.error || `Erro ao enviar ${file.name}`);
        }
      }
      
      toast.success(files.length > 1 ? 'Mídias enviadas com sucesso!' : 'Mídia enviada com sucesso!');
      setShowMediaPreview(false);
      setMediaPreviewFiles([]);
    } catch (error) {
      console.error('[MessageInput] Erro ao enviar mídia:', error);
      toast.error('Erro ao enviar mídia');
    } finally {
      setIsUploadingMedia(false);
    }
  };

  // Fechar modal de preview
  const handleCloseMediaPreview = () => {
    setShowMediaPreview(false);
    setMediaPreviewFiles([]);
  };

  // Abrir seletor para adicionar mais arquivos
  const handleOpenAddMoreFiles = () => {
    if (addMoreFilesRef.current) {
      addMoreFilesRef.current.accept = 'image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv';
      addMoreFilesRef.current.click();
    }
  };

  // Abrir seletor de arquivo com filtro específico
  const openFileSelector = (type: 'document' | 'media' | 'audio') => {
    setCurrentFileType(type);
    setShowAttachMenu(false);
    
    if (fileInputRef.current) {
      // Definir tipos aceitos baseado na opção selecionada
      switch (type) {
        case 'document':
          fileInputRef.current.accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv';
          break;
        case 'media':
          fileInputRef.current.accept = 'image/*,video/*';
          break;
        case 'audio':
          fileInputRef.current.accept = 'audio/*';
          break;
      }
      fileInputRef.current.click();
    }
  };


  const placeholder = !canSendMessage 
    ? "Você não tem permissão para enviar mensagens"
    : isUploadingMedia
      ? "Enviando mídia..."
      : ticketStatus === "open" || ticketStatus === "group" 
        ? i18n.t("messagesInput.placeholderOpen")
        : i18n.t("messagesInput.placeholderClosed");

  return (
    <div className="flex flex-col w-full bg-background border-t border-border relative">
      {/* Quick Messages Menu */}
      {showQuickMessages && (
        <QuickMessagesMenu
          searchTerm={quickMessageSearch}
          onSelect={handleQuickMessageSelect}
          onClose={() => {
            setShowQuickMessages(false);
            setQuickMessageSearch('');
            setSlashPosition(null);
          }}
          selectedIndex={selectedIndex}
        />
      )}

      {/* Session Window Alert - Janela 24h (não mostrar se ticket está resolvido) */}
      {chatId && phoneNumber && ticketStatus !== 'closed' && (sessionWindow.isExpired || sessionWindow.isNearExpiry) && (
        <SessionWindowAlert
          isExpired={sessionWindow.isExpired}
          isNearExpiry={sessionWindow.isNearExpiry}
          hoursRemaining={sessionWindow.hoursRemaining}
          minutesRemaining={sessionWindow.minutesRemaining}
          chatId={chatId}
          phoneNumber={phoneNumber}
          contactName={ticketContact?.contactName}
          contactPhone={ticketContact?.contactPhone}
          queueName={ticketContact?.queueName}
          attendantName={attendantName}
          onMessageSent={sessionWindow.refresh}
        />
      )}

      {/* Permission Warning */}
      {!canSendMessage && (
        <div className="flex items-center gap-2 px-3 py-2 bg-destructive/10 text-destructive text-sm">
          <Lock className="h-4 w-4" />
          <span>Você não tem permissão para enviar mensagens</span>
        </div>
      )}

      {/* Reply/Edit Bar */}
      {(replyingMessage || editingMessage) && canSendMessage && (
        <div className="flex items-center gap-2 px-3 py-2 bg-muted/30">
          <div className="flex-1 flex items-start gap-2 bg-muted/50 rounded-lg p-2">
            <div className={`w-1 h-full rounded-full ${editingMessage ? 'bg-blue-400' : 'bg-green-400'}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 text-blue-400 font-medium text-xs mb-1">
                {editingMessage ? <Edit className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                {editingMessage ? 'Editando' : 'Respondendo'}
              </div>
              <div className="text-sm text-foreground/80 truncate">
                {(replyingMessage || editingMessage)?.body}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={() => {
              setReplyingMessage(null);
              setEditingMessage(null);
              setMessage('');
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-1.5 sm:py-2">
        {/* Left buttons */}
        <div className="flex items-center">
          <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-10 sm:w-10"
                disabled={isDisabled}
              >
                <Smile className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 border-none" align="start" side="top">
              <EmojiPicker 
                onEmojiClick={handleEmojiClick} 
                width="100%" 
                height={350}
                theme={Theme.AUTO}
                searchPlaceholder="Buscar emoji..."
                previewConfig={{ showPreview: false }}
              />
            </PopoverContent>
          </Popover>
          <Popover open={showAttachMenu} onOpenChange={setShowAttachMenu}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-10 sm:w-10"
                disabled={isAttachDisabled}
                title={isLoadingContact ? 'Carregando dados do contato...' : !phoneNumber ? 'Aguardando dados do contato' : 'Anexar arquivo'}
              >
                {isLoadingContact ? (
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-44 sm:w-48 p-1.5 sm:p-2" 
              align="start" 
              side="top"
              sideOffset={8}
            >
              <div className="flex flex-col gap-0.5 sm:gap-1">
                <button
                  className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-muted transition-colors text-left"
                  onClick={() => openFileSelector('document')}
                  disabled={isUploadingMedia}
                >
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                  <span className="text-xs sm:text-sm">Documentos</span>
                </button>
                <button
                  className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-muted transition-colors text-left"
                  onClick={() => openFileSelector('media')}
                  disabled={isUploadingMedia}
                >
                  <Image className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                  <span className="text-xs sm:text-sm">Fotos e Vídeos</span>
                </button>
                <button
                  className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-muted transition-colors text-left"
                  onClick={() => openFileSelector('audio')}
                  disabled={isUploadingMedia}
                >
                  <Headphones className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                  <span className="text-xs sm:text-sm">Áudio</span>
                </button>
                <button
                  className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-muted transition-colors text-left disabled:opacity-50"
                  onClick={() => setShowAttachMenu(false)}
                  disabled
                >
                  <Contact className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-500" />
                  <span className="text-xs sm:text-sm">Contato</span>
                  <span className="text-[10px] sm:text-xs text-muted-foreground ml-auto">(breve)</span>
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          multiple
        />
        
        {/* Hidden input for adding more files */}
        <input
          ref={addMoreFilesRef}
          type="file"
          className="hidden"
          onChange={handleAddMoreFiles}
          multiple
        />

        {/* Input field */}
        <div className="flex-1 mx-0.5 sm:mx-1 min-w-0">
          <Textarea
            ref={inputRef}
            placeholder={placeholder}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={isDisabled}
            rows={1}
            className="min-h-[36px] sm:min-h-[40px] max-h-[100px] sm:max-h-[120px] py-2 sm:py-2.5 px-3 sm:px-4 rounded-2xl bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-border resize-none overflow-y-auto text-sm"
            style={{ height: 'auto' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 120) + 'px';
            }}
          />
        </div>

        {/* Right buttons */}
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-10 sm:w-10 hidden sm:flex"
            disabled={isDisabled}
          >
            <Paperclip className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-10 sm:w-10 hidden sm:flex"
            disabled={isDisabled}
          >
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
          </Button>
          {isUploadingMedia ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 sm:h-10 sm:w-10"
              disabled
            >
              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary animate-spin" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 sm:h-10 sm:w-10"
              onClick={handleSend}
              disabled={isDisabled || !message.trim()}
            >
              <Send className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </Button>
          )}
        </div>
      </div>

      {/* Media Preview Modal */}
      {showMediaPreview && mediaPreviewFiles.length > 0 && (
        <MediaPreviewModal
          files={mediaPreviewFiles}
          onClose={handleCloseMediaPreview}
          onSend={handleSendMedia}
          onAddMoreFiles={handleOpenAddMoreFiles}
          isLoading={isUploadingMedia}
        />
      )}
    </div>
  );
};
