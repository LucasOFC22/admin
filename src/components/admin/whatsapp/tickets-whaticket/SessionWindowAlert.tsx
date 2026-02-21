import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, Send, Loader2, Lock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { whatsappConfigService, WhatsAppConfig } from '@/services/supabase/whatsappConfigService';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { toast } from '@/lib/toast';
import { replaceMessageVariables, MessageVariablesContext } from '@/utils/messageVariables';

interface SessionWindowAlertProps {
  isExpired: boolean;
  isNearExpiry: boolean;
  hoursRemaining: number | null;
  minutesRemaining: number | null;
  chatId: string;
  phoneNumber: string;
  contactName?: string;
  contactPhone?: string;
  queueName?: string;
  attendantName?: string;
  onMessageSent?: () => void;
}

export const SessionWindowAlert: React.FC<SessionWindowAlertProps> = ({
  isExpired,
  isNearExpiry,
  hoursRemaining,
  minutesRemaining,
  chatId,
  phoneNumber,
  contactName,
  contactPhone,
  queueName,
  attendantName,
  onMessageSent,
}) => {
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const configData = await whatsappConfigService.getConfig();
        setConfig(configData);
      } catch (error) {
        console.error('[SessionWindowAlert] Erro ao carregar config:', error);
      } finally {
        setIsLoadingConfig(false);
      }
    };
    loadConfig();
  }, []);

  const handleSendContinuationMessage = async () => {
    if (!config || !chatId || !phoneNumber) {
      toast.error('Configuração não disponível ou chat inválido');
      return;
    }

    if (!config.send_msg_continuacao) {
      toast.error('Mensagem de continuação não está configurada. Configure em Configurações > WhatsApp.');
      return;
    }

    setIsSending(true);

    try {
      const supabaseAuth = requireAuthenticatedClient();
      // Buscar conexão para enviar
      const { data: conexao } = await supabaseAuth
        .from('conexoes')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (!conexao?.id) {
        toast.error('Conexão WhatsApp não encontrada');
        return;
      }

      // Preparar contexto para variáveis
      const context: MessageVariablesContext = {
        nomeCliente: contactName,
        telefoneCliente: contactPhone || phoneNumber,
        nomeAtendente: attendantName,
        filaNome: queueName,
        chatId: chatId,
        ticketId: chatId,
      };

      if (config.continuacao_use_template && config.continuacao_template_name) {
        // Enviar como template - usar nome correto da função
        const { data, error } = await supabaseAuth.functions.invoke('whatsapp-enviar-template', {
          body: {
            conexaoId: conexao.id,
            telefone: phoneNumber,
            templateName: config.continuacao_template_name,
            templateLanguage: config.continuacao_template_language || 'pt_BR',
            bodyVariables: config.continuacao_template_variables || [],
          }
        });

        if (error) throw error;

        // Atualizar atualizadoem para renovar a janela de 24h
        await supabaseAuth
          .from('chats_whatsapp')
          .update({ atualizadoem: new Date().toISOString() })
          .eq('id', parseInt(chatId, 10));

        // Log apenas no console - NÃO salvar mensagem de sistema no banco
        console.log(`[SessionWindowAlert] Template "${config.continuacao_template_name}" enviado para reabrir janela de 24h`);
        
        toast.success('Mensagem de continuação enviada com sucesso!');
        onMessageSent?.();
      } else if (config.continuacao_message) {
        // Enviar como mensagem normal (só funciona se a sessão ainda não expirou de verdade na API)
        const processedMessage = replaceMessageVariables(config.continuacao_message, context);
        
        // Usar nova API direta
        const response = await fetch('https://api.fptranscargas.com.br/whatsapp/enviar-direto', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            numero: phoneNumber,
            mensagem: processedMessage
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Erro ao enviar mensagem');
        }
        // Atualizar atualizadoem para renovar a janela de 24h
        await supabaseAuth
          .from('chats_whatsapp')
          .update({ atualizadoem: new Date().toISOString() })
          .eq('id', parseInt(chatId, 10));

        // Salvar registro no histórico
        await supabaseAuth
          .from('mensagens_whatsapp')
          .insert({
            chatId: parseInt(chatId, 10),
            message_type: 'text',
            message_text: `[Sistema] Mensagem de continuação enviada para reabrir janela de 24h`,
            send: 'sistema',
            received_at: new Date().toISOString(),
            created_at: new Date().toISOString()
          });
        
        toast.success('Mensagem de continuação enviada!');
        onMessageSent?.();
      } else {
        toast.error('Configure uma mensagem de continuação em Configurações > WhatsApp.');
      }
    } catch (error: any) {
      console.error('[SessionWindowAlert] Erro ao enviar mensagem:', error);
      toast.error(error.message || 'Erro ao enviar mensagem de continuação');
    } finally {
      setIsSending(false);
    }
  };

  // Se não está expirado nem próximo da expiração, não mostrar nada
  if (!isExpired && !isNearExpiry) {
    return null;
  }

  const formatTimeRemaining = () => {
    if (hoursRemaining === null || minutesRemaining === null) return '';
    
    if (hoursRemaining > 0) {
      return `${hoursRemaining}h ${minutesRemaining}min`;
    }
    return `${minutesRemaining} minutos`;
  };

  const hasTemplateConfigured = config?.send_msg_continuacao && (
    (config.continuacao_use_template && config.continuacao_template_name) ||
    config.continuacao_message
  );

  if (isExpired) {
    return (
      <div className="flex flex-col gap-2 px-3 py-3 bg-destructive/10 border-b border-destructive/20">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-destructive" />
          <span className="text-sm font-medium text-destructive">
            Janela de 24 horas expirada
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Para continuar a conversa, envie uma mensagem modelo (template) aprovada pelo WhatsApp.
        </p>
        <Button
          size="sm"
          variant="destructive"
          className="w-full mt-1"
          onClick={handleSendContinuationMessage}
          disabled={isSending || isLoadingConfig || !hasTemplateConfigured}
        >
          {isSending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Enviar Mensagem de Continuação
            </>
          )}
        </Button>
        {!hasTemplateConfigured && !isLoadingConfig && (
          <p className="text-xs text-destructive/80 text-center">
            Configure a mensagem de continuação em Configurações → WhatsApp
          </p>
        )}
      </div>
    );
  }

  // Near expiry warning (12h+)
  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2 bg-yellow-500/10 border-b border-yellow-500/20">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-medium text-yellow-700 dark:text-yellow-500">
            Sessão expira em {formatTimeRemaining()}
          </span>
          <span className="text-[11px] text-yellow-600/80 dark:text-yellow-500/80 truncate">
            Considere enviar mensagem de continuação
          </span>
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="text-yellow-700 border-yellow-500/50 hover:bg-yellow-500/20 flex-shrink-0"
        onClick={handleSendContinuationMessage}
        disabled={isSending || isLoadingConfig || !hasTemplateConfigured}
      >
        {isSending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Send className="h-4 w-4 mr-1" />
            Enviar Template
          </>
        )}
      </Button>
    </div>
  );
};
