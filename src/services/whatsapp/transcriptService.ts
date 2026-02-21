import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Helper para obter cliente Supabase autenticado
const getSupabase = () => requireAuthenticatedClient();

export interface TranscriptMessage {
  id: string;
  timestamp: string;
  senderName: string;
  content: string;
  messageType: string;
  mediaUrl?: string;
  mediaFileName?: string;
  mediaSize?: number;
  isFromMe: boolean;
}

export interface TranscriptData {
  chatId: number;
  contactName: string;
  contactPhone: string;
  startDate: string;
  endDate: string;
  messageCount: number;
  messages: TranscriptMessage[];
}

// Buscar mensagens do chat para transcrição
export async function fetchChatMessagesForTranscript(chatId: number): Promise<TranscriptData | null> {
  try {
    // Buscar dados do chat
    const { data: chatData, error: chatError } = await getSupabase()
      .from('chats_whatsapp')
      .select('*, contato:usuarioid(nome, telefone)')
      .eq('id', chatId)
      .maybeSingle();

    if (chatError || !chatData) {
      console.error('Erro ao buscar chat:', chatError);
      return null;
    }

    // Buscar mensagens do chat
    const { data: messages, error: messagesError } = await getSupabase()
      .from('mensagens_whatsapp')
      .select('*')
      .eq('chatId', chatId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Erro ao buscar mensagens:', messagesError);
      return null;
    }

    const contactName = chatData.contato?.nome || 'Cliente';
    const contactPhone = chatData.contato?.telefone || '';

    // Mapear mensagens para formato de transcrição
    const transcriptMessages: TranscriptMessage[] = (messages || []).map((msg: any) => {
      const isFromMe = msg.send !== 'cliente';
      const mediaTypes = ['image', 'audio', 'video', 'document', 'sticker'];
      const isMedia = mediaTypes.includes(msg.message_type);

      // Determinar URL da mídia
      let mediaUrl: string | undefined;
      if (isMedia) {
        const messageText = msg.message_text || '';
        if (messageText.startsWith('http')) {
          mediaUrl = messageText;
        } else {
          mediaUrl = msg.message_data?.storageUrl || msg.metadata?.storageUrl;
        }
      }

      // Determinar nome do arquivo de mídia
      const mediaFileName = msg.message_data?.fileName || 
                           msg.message_data?.media?.fileName ||
                           msg.metadata?.fileName ||
                           (isMedia ? `${msg.message_type}_${msg.id}` : undefined);

      // Determinar tamanho do arquivo
      const mediaSize = msg.message_data?.fileSize || 
                       msg.message_data?.media?.fileSize ||
                       msg.metadata?.fileSize;

      // Determinar conteúdo da mensagem
      let content = '';
      if (isMedia) {
        content = msg.message_data?.caption || msg.message_data?.media?.caption || '';
      } else if (msg.message_type === 'interactive') {
        content = msg.message_data?.interactive?.body?.text || msg.message_text || '';
      } else {
        content = msg.message_text || '';
      }

      // Determinar nome do remetente
      let senderName = contactName;
      if (isFromMe) {
        // Tentar pegar nome do admin/atendente
        senderName = msg.metadata?.senderName || 
                    msg.message_data?.senderName || 
                    'Atendente';
      }

      return {
        id: msg.id,
        timestamp: msg.created_at || msg.received_at,
        senderName,
        content,
        messageType: msg.message_type || 'text',
        mediaUrl,
        mediaFileName,
        mediaSize,
        isFromMe,
      };
    });

    // Determinar datas
    const startDate = messages?.[0]?.created_at || chatData.criadoem;
    const endDate = messages?.[messages.length - 1]?.created_at || chatData.atualizadoem;

    return {
      chatId,
      contactName,
      contactPhone,
      startDate,
      endDate,
      messageCount: transcriptMessages.length,
      messages: transcriptMessages,
    };
  } catch (error) {
    console.error('Erro ao buscar dados para transcrição:', error);
    return null;
  }
}

// Formatar tamanho do arquivo
function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Gerar transcrição em formato TXT
export function generateTxtTranscript(data: TranscriptData): string {
  const lines: string[] = [];

  // Header
  const formattedStartDate = format(new Date(data.startDate), "d 'de' MMM. 'de' yyyy, HH:mm 'BRT'", { locale: ptBR });
  
  lines.push(`Sistema (${data.contactName})`);
  lines.push('');
  lines.push(formattedStartDate);
  lines.push('');
  lines.push('─'.repeat(60));
  lines.push('');

  // Mensagens
  for (const msg of data.messages) {
    const time = format(new Date(msg.timestamp), 'HH:mm:ss');
    
    // Linha principal da mensagem
    if (msg.content) {
      lines.push(`(${time}) ${msg.senderName}: ${msg.content}`);
    }

    // Se tiver mídia, adicionar informações
    if (msg.mediaUrl) {
      const mediaTypes: Record<string, string> = {
        'image': 'carregou imagem',
        'audio': 'enviou áudio',
        'video': 'enviou vídeo',
        'document': 'carregou documento',
        'sticker': 'enviou sticker',
      };

      const action = mediaTypes[msg.messageType] || 'enviou arquivo';
      const fileName = msg.mediaFileName || 'arquivo';
      const size = formatFileSize(msg.mediaSize);

      if (!msg.content) {
        lines.push(`(${time}) ${msg.senderName} ${action}: ${fileName}`);
      } else {
        lines.push(`(${time}) ${msg.senderName} ${action}: ${fileName}`);
      }
      
      lines.push(`URL: ${msg.mediaUrl}`);
      if (msg.mediaSize) {
        lines.push(`Tipo: ${msg.messageType}`);
        lines.push(`Tamanho: ${size}`);
      }
    }
  }

  lines.push('');
  lines.push('─'.repeat(60));
  lines.push(`Total de mensagens: ${data.messageCount}`);
  lines.push(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`);

  return lines.join('\n');
}

// Download como arquivo TXT
export function downloadTxtTranscript(data: TranscriptData): void {
  const content = generateTxtTranscript(data);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `transcricao_conversa_${data.chatId}_${format(new Date(), 'yyyy-MM-dd_HHmm')}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Gerar e baixar PDF usando @react-pdf/renderer (componente separado)
export interface TranscriptPDFData extends TranscriptData {}
