import React, { useState } from 'react';
import { Bell, MessageSquare, Phone, ChevronRight, CheckCheck, Wifi, WifiOff, AlertTriangle, Clock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotificationCenter } from '@/hooks/useNotificationCenter';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getPriorityColor, getPriorityLabel } from '@/hooks/useWhatsAppPriorityChats';
import { getPrioridadeDocColor, getPrioridadeDocLabel } from '@/hooks/useSolicitacoesPendentes';

const NotificationBell = () => {
  const { 
    whatsapp, 
    chatInterno, 
    pendingChats,
    priorityChats,
    solicitacoesPendentes,
    totalCount, 
    isLoading, 
    markAllAsRead, 
    realtimeStatus 
  } = useNotificationCenter();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleWhatsAppClick = (contactId: string) => {
    setOpen(false);
    navigate(`/whatsapp/${contactId}`);
  };

  const handleChatInternoClick = (chatId: string) => {
    setOpen(false);
    navigate(`/chatinterno/${chatId}`);
  };

  const handlePriorityClick = (contactId: string) => {
    setOpen(false);
    navigate(`/whatsapp/${contactId}`);
  };

  const handlePendingClick = (contactId: string) => {
    setOpen(false);
    navigate(`/whatsapp/${contactId}`);
  };

  const handleSolicitacaoClick = (id: string) => {
    setOpen(false);
    navigate(`/solicitacoes-documentos`);
  };

  const hasWhatsApp = whatsapp.length > 0;
  const hasChatInterno = chatInterno.length > 0;
  const hasPriorityChats = priorityChats.length > 0;
  const hasPendingChats = pendingChats.length > 0;
  const hasSolicitacoes = solicitacoesPendentes.length > 0;
  const hasNotifications = hasWhatsApp || hasChatInterno || hasPriorityChats || hasPendingChats || hasSolicitacoes;

  // Contar chats críticos para o badge
  const criticalCount = priorityChats.filter(c => c.priorityLevel === 'critico').length;
  const urgentSolicitacoes = solicitacoesPendentes.filter(s => s.prioridade === 'urgente').length;
  const displayCount = totalCount + criticalCount + pendingChats.length + solicitacoesPendentes.length;

  const formatWaitTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {displayCount > 0 && (
            <Badge 
              variant="destructive" 
              className={`absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs ${
                criticalCount > 0 ? 'animate-pulse' : ''
              }`}
            >
              {displayCount > 99 ? '99+' : displayCount}
            </Badge>
          )}
          {/* Indicador de status do realtime */}
          <span 
            className={`absolute bottom-0 right-0 h-2 w-2 rounded-full border border-background ${
              realtimeStatus === 'connected' 
                ? 'bg-green-500' 
                : realtimeStatus === 'connecting'
                ? 'bg-yellow-500 animate-pulse'
                : 'bg-red-500'
            }`}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Central de Notificações</h3>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help">
                  {realtimeStatus === 'connected' ? (
                    <Wifi className="h-3.5 w-3.5 text-green-500" />
                  ) : realtimeStatus === 'connecting' ? (
                    <Wifi className="h-3.5 w-3.5 text-yellow-500 animate-pulse" />
                  ) : (
                    <WifiOff className="h-3.5 w-3.5 text-red-500" />
                  )}
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {realtimeStatus === 'connected' 
                  ? 'Tempo real ativo' 
                  : realtimeStatus === 'connecting'
                  ? 'Conectando...'
                  : 'Desconectado'}
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-2">
            {displayCount > 0 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Marcar como lidas
                </Button>
                <Badge variant="secondary" className="text-xs">
                  {displayCount}
                </Badge>
              </>
            )}
          </div>
        </div>

        <ScrollArea className="h-[420px]">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : !hasNotifications ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                Nenhuma mensagem não lida
              </p>
            </div>
          ) : (
            <div>
              {/* Priority Chats Section */}
              {hasPriorityChats && (
                <div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 dark:bg-orange-950/30 border-b">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <span className="text-xs font-medium text-orange-700 dark:text-orange-400">
                      Atenção Prioritária
                    </span>
                    <Badge variant="outline" className="ml-auto text-xs h-5 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 border-orange-300">
                      {priorityChats.length}
                    </Badge>
                  </div>
                  <div className="divide-y">
                    {priorityChats.slice(0, 5).map((chat) => (
                      <button
                        key={chat.chatId}
                        onClick={() => handlePriorityClick(chat.contactId)}
                        className="w-full p-3 hover:bg-muted/50 transition-colors text-left flex items-start gap-3"
                      >
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                          <AlertTriangle className="h-5 w-5 text-orange-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-sm truncate">
                              {chat.contactName || chat.contactPhone}
                            </span>
                            <Badge className={`flex-shrink-0 h-5 text-[10px] ${getPriorityColor(chat.priorityLevel)}`}>
                              {getPriorityLabel(chat.priorityLevel)}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {chat.lastMessage || 'Aguardando resposta'}
                          </p>
                          <p className="text-[10px] text-muted-foreground/70 mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatWaitTime(chat.waitingMinutes)} de espera
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending Chats Section */}
              {hasPendingChats && (
                <div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-950/30 border-b border-t">
                    <Clock className="h-4 w-4 text-purple-600" />
                    <span className="text-xs font-medium text-purple-700 dark:text-purple-400">
                      Aguardando Atendimento
                    </span>
                    <Badge variant="outline" className="ml-auto text-xs h-5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 border-purple-300">
                      {pendingChats.length}
                    </Badge>
                  </div>
                  <div className="divide-y">
                    {pendingChats.slice(0, 5).map((chat) => (
                      <button
                        key={chat.chatId}
                        onClick={() => handlePendingClick(chat.contactId)}
                        className="w-full p-3 hover:bg-muted/50 transition-colors text-left flex items-start gap-3"
                      >
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                          <Clock className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-sm truncate">
                              {chat.contactName || chat.contactPhone}
                            </span>
                            <Badge variant="secondary" className="flex-shrink-0 h-5 text-xs">
                              {chat.messageCount} msgs
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {chat.lastMessage || 'Nova conversa'}
                          </p>
                          <p className="text-[10px] text-muted-foreground/70 mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatWaitTime(chat.waitingTimeMinutes)} aguardando
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Solicitações de Documentos Pendentes */}
              {hasSolicitacoes && (
                <div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border-b border-t">
                    <FileText className="h-4 w-4 text-amber-600" />
                    <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                      Documentos Pendentes
                    </span>
                    <Badge variant="outline" className="ml-auto text-xs h-5 bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 border-amber-300">
                      {solicitacoesPendentes.length}
                    </Badge>
                  </div>
                  <div className="divide-y">
                    {solicitacoesPendentes.slice(0, 5).map((sol) => (
                      <button
                        key={sol.id}
                        onClick={() => handleSolicitacaoClick(sol.id)}
                        className="w-full p-3 hover:bg-muted/50 transition-colors text-left flex items-start gap-3"
                      >
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-sm truncate">
                              {sol.tipo_documento || 'Documento'}
                            </span>
                            <Badge className={`flex-shrink-0 h-5 text-[10px] ${getPrioridadeDocColor(sol.prioridade)}`}>
                              {getPrioridadeDocLabel(sol.prioridade)}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {sol.numero_cte ? `CTE: ${sol.numero_cte}` : sol.numero_nfe ? `NFe: ${sol.numero_nfe}` : sol.cpf_cnpj || 'Sem identificação'}
                          </p>
                          <p className="text-[10px] text-muted-foreground/70 mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {sol.horas_pendente < 1 ? '<1h' : `${Math.floor(sol.horas_pendente)}h`} pendente
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* WhatsApp Section */}
              {hasWhatsApp && (
                <div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-950/30 border-b border-t">
                    <Phone className="h-4 w-4 text-green-600" />
                    <span className="text-xs font-medium text-green-700 dark:text-green-400">
                      WhatsApp
                    </span>
                    <Badge variant="outline" className="ml-auto text-xs h-5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-300">
                      {whatsapp.length}
                    </Badge>
                  </div>
                  <div className="divide-y">
                    {whatsapp.map((chat) => (
                      <button
                        key={chat.chatId}
                        onClick={() => handleWhatsAppClick(chat.contactId)}
                        className="w-full p-3 hover:bg-muted/50 transition-colors text-left flex items-start gap-3"
                      >
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                          <Phone className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-sm truncate">
                              {chat.contactName || chat.contactPhone}
                            </span>
                            <Badge variant="destructive" className="flex-shrink-0 h-5 min-w-[20px] text-xs">
                              {chat.unreadCount}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {chat.lastMessage || 'Nova mensagem'}
                          </p>
                          <p className="text-[10px] text-muted-foreground/70 mt-1">
                            Chat #{chat.chatId}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Interno Section */}
              {hasChatInterno && (
                <div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950/30 border-b border-t">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
                      Chat Interno
                    </span>
                    <Badge variant="outline" className="ml-auto text-xs h-5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-300">
                      {chatInterno.length}
                    </Badge>
                  </div>
                  <div className="divide-y">
                    {chatInterno.map((chat) => (
                      <button
                        key={chat.chatId}
                        onClick={() => handleChatInternoClick(chat.chatId)}
                        className="w-full p-3 hover:bg-muted/50 transition-colors text-left flex items-start gap-3"
                      >
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <MessageSquare className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-sm truncate">
                              {chat.titulo}
                            </span>
                            <Badge variant="destructive" className="flex-shrink-0 h-5 min-w-[20px] text-xs">
                              {chat.unreadCount}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {chat.senderName ? `${chat.senderName}: ` : ''}{chat.lastMessage || 'Nova mensagem'}
                          </p>
                          <p className="text-[10px] text-muted-foreground/70 mt-1">
                            {formatDistanceToNow(new Date(chat.updatedAt), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
