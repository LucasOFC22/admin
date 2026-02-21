// Serviço para envio de mídias via WhatsApp pelo atendente
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { CookieAuth } from '@/lib/auth/cookieAuth';
import { isWhatsAppDebugEnabled } from '@/utils/whatsappDebug';

interface MediaSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

type MediaType = 'image' | 'video' | 'document';

// Mapear extensão para tipo de mídia
// Nota: arquivos de áudio são enviados como documento (não como mensagem de voz)
const getMediaTypeFromFile = (file: File): MediaType => {
  const mimeType = file.type.toLowerCase();
  
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  // audio/* e outros tipos são enviados como documento
  return 'document';
};

// Converter arquivo para base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
  });
};

export const whatsappMediaService = {
  /**
   * Faz upload do arquivo usando a edge function whatsapp-upload-media
   * Retorna a URL pública do arquivo
   */
  async uploadToStorage(file: File, chatId: string, conexaoId: string, caption?: string): Promise<{ url: string; path: string; messageId?: string }> {
    const supabase = requireAuthenticatedClient();
    
    // Converter arquivo para base64
    const base64 = await fileToBase64(file);
    
    // Obter usuário atual do cookie
    const userId = CookieAuth.getUserId();
    
    // Chamar edge function whatsapp-upload-media
    const { data, error } = await supabase.functions.invoke('whatsapp-upload-media', {
      body: {
        file: base64,
        fileName: file.name,
        fileType: file.type,
        chatId: parseInt(chatId, 10),
        conexaoId,
        usuarioId: userId,
        caption: caption || ''
      }
    });
    
    if (error) {
      console.error('[MediaService] Edge function error:', error);
      throw new Error(`Erro no upload: ${error.message}`);
    }
    
    if (!data?.success) {
      console.error('[MediaService] Upload failed:', data?.error);
      throw new Error(data?.error || 'Erro no upload do arquivo');
    }
    
    return { 
      url: data.url, 
      path: data.filePath,
      messageId: data.messageId
    };
  },

  /**
   * Envia mídia via WhatsApp usando a edge function flow-whatsapp-sender
   * SEGURANÇA: Agora passa apenas conexaoId, credenciais são buscadas no backend
   */
  async sendMediaToWhatsApp(params: {
    mediaType: MediaType;
    mediaUrl: string;
    phoneNumber: string;
    caption?: string;
    filename?: string;
    chatId: number;
    conexaoId: string;
  }): Promise<MediaSendResult> {
    const supabase = requireAuthenticatedClient();
    const { mediaType, mediaUrl, phoneNumber, caption, filename, chatId, conexaoId } = params;
    
    // Montar payload conforme o tipo de mídia - APENAS conexaoId, sem tokens
    let payload: Record<string, any> = {
      action: mediaType,
      conexaoId,
      phoneNumber,
      chatId
    };
    
    switch (mediaType) {
      case 'image':
        payload.imageData = { url: mediaUrl, caption };
        break;
      case 'video':
        payload.videoUrl = mediaUrl;
        payload.caption = caption;
        break;
      case 'document':
        payload.docData = { 
          url: mediaUrl, 
          filename: filename || 'documento',
          caption 
        };
        break;
    }
    
    const { data, error } = await supabase.functions.invoke('flow-whatsapp-sender', {
      body: payload
    });
    
    if (error) {
      console.error('[MediaService] Edge function error:', error);
      return { success: false, error: error.message };
    }
    
    if (!data?.success) {
      console.error('[MediaService] Send failed:', data?.error);
      return { success: false, error: data?.error || 'Erro ao enviar mídia' };
    }
    
    return { success: true, messageId: data.messageId };
  },

  /**
   * Fluxo completo: Upload via edge function -> Enviar via WhatsApp
   * A edge function whatsapp-upload-media já salva a mensagem no banco
   */
  async sendMedia(params: {
    file: File;
    chatId: string;
    phoneNumber: string;
    caption?: string;
  }): Promise<MediaSendResult> {
    const { file, chatId, phoneNumber, caption } = params;
    
    // Validação de parâmetros
    if (!chatId) {
      console.error('[MediaService] ERRO: chatId não fornecido');
      return { success: false, error: 'Chat ID não fornecido' };
    }
    
    if (!phoneNumber) {
      console.error('[MediaService] ERRO: phoneNumber não fornecido');
      return { success: false, error: 'Telefone do contato não fornecido' };
    }
    
    const numericChatId = parseInt(chatId, 10);
    if (isNaN(numericChatId)) {
      console.error('[MediaService] ERRO: chatId inválido:', chatId);
      return { success: false, error: 'Chat ID inválido' };
    }
    
    const mediaType = getMediaTypeFromFile(file);
    
    try {
      const supabase = requireAuthenticatedClient();
      
      // Buscar conexão WhatsApp - APENAS ID, sem tokens
      const { data: conexao, error: conexaoError } = await supabase
        .from('conexoes')
        .select('id')
        .limit(1)
        .maybeSingle();
      
      if (conexaoError || !conexao) {
        console.error('[MediaService] No connection found:', conexaoError);
        return { success: false, error: 'Nenhuma conexão WhatsApp configurada' };
      }
      
      if (isWhatsAppDebugEnabled()) {
        console.debug('[MediaService] Conexão encontrada:', conexao.id);
      }
      
      // 1. Upload via edge function whatsapp-upload-media (já salva no banco)
      if (isWhatsAppDebugEnabled()) {
        console.debug('[MediaService] Passo 1: Upload via edge function...');
      }
      const { url: mediaUrl, messageId: uploadMessageId } = await this.uploadToStorage(file, chatId, conexao.id, caption);
      if (isWhatsAppDebugEnabled()) {
        console.debug('[MediaService] Upload concluído, URL:', mediaUrl);
      }
      
      // 2. Enviar via WhatsApp - passa apenas conexaoId, credenciais são buscadas no backend
      if (isWhatsAppDebugEnabled()) {
        console.debug('[MediaService] Passo 2: Enviando via WhatsApp...');
      }
      const sendResult = await this.sendMediaToWhatsApp({
        mediaType,
        mediaUrl,
        phoneNumber,
        caption,
        filename: file.name,
        chatId: numericChatId,
        conexaoId: conexao.id
      });
      
      if (!sendResult.success) {
        return sendResult;
      }
      
      return { success: true, messageId: sendResult.messageId || uploadMessageId };
    } catch (error) {
      console.error('[MediaService] Send media error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  },

};
