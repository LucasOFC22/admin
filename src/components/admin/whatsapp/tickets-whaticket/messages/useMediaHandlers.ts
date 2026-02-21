import { useState, useCallback } from 'react';
import { Message } from '@/services/ticketService';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { toast } from '@/lib/toast';

export interface MediaState {
  failedMediaIds: Set<string>;
  loadingMediaIds: Set<string>;
  loadedMediaUrls: Map<string, string>;
}

export const useMediaHandlers = () => {
  const [failedMediaIds, setFailedMediaIds] = useState<Set<string>>(new Set());
  const [loadingMediaIds, setLoadingMediaIds] = useState<Set<string>>(new Set());
  const [loadedMediaUrls, setLoadedMediaUrls] = useState<Map<string, string>>(new Map());

  const fetchMediaUrl = useCallback(async (message: Message): Promise<string | null> => {
    const mediaId = (message as any).mediaId || (message as any).rawData?.message_data?.media_id;
    
    if (!mediaId) {
      toast.error('ID da mídia não encontrado');
      return null;
    }

    if (loadedMediaUrls.has(message.id)) {
      return loadedMediaUrls.get(message.id) || null;
    }

    setLoadingMediaIds(prev => new Set(prev).add(message.id));

    try {
      console.log(`[useMediaHandlers] Buscando URL para media_id: ${mediaId}`);
      
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase.functions.invoke('get-whatsapp-media-url', {
        body: { mediaId }
      });

      if (error) {
        console.error('[useMediaHandlers] Erro ao buscar URL:', error);
        toast.error('Erro ao carregar mídia');
        return null;
      }

      if (data?.success && data?.url) {
        console.log(`[useMediaHandlers] URL obtida para ${message.id}`);
        setLoadedMediaUrls(prev => new Map(prev).set(message.id, data.url));
        return data.url;
      } else {
        toast.error(data?.error || 'Erro ao obter URL da mídia');
        return null;
      }
    } catch (err) {
      console.error('[useMediaHandlers] Erro:', err);
      toast.error('Erro ao carregar mídia');
      return null;
    } finally {
      setLoadingMediaIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(message.id);
        return newSet;
      });
    }
  }, [loadedMediaUrls]);

  const handleMediaError = useCallback((messageId: string) => {
    console.error(`[useMediaHandlers] Erro ao carregar mídia da mensagem ${messageId}`);
    setFailedMediaIds(prev => new Set(prev).add(messageId));
  }, []);

  const handleRetryMedia = useCallback(async (message: Message) => {
    const rawData = (message as any).rawData;
    if (!rawData?.message_data?.media_id && !rawData?.message_id) {
      toast.error('Não foi possível identificar a mídia para download');
      return;
    }

    setLoadingMediaIds(prev => new Set(prev).add(message.id));
    
    try {
      console.log('[useMediaHandlers] Tentando baixar mídia:', {
        messageId: rawData.message_id,
        mediaUrl: rawData.message_data?.mediaUrl,
        mediaType: message.mediaType
      });

      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase.functions.invoke('download-whatsapp-media', {
        body: {
          messageId: rawData.message_id,
          mediaUrl: rawData.message_data?.mediaUrl,
          mediaType: message.mediaType,
          chatId: rawData.chatId,
          fileName: rawData.message_data?.caption
        }
      });

      if (error) {
        console.error('[useMediaHandlers] Erro ao baixar mídia:', error);
        toast.error('Erro ao baixar mídia: ' + error.message);
      } else if (data?.success) {
        console.log('[useMediaHandlers] Mídia baixada com sucesso:', data);
        toast.success('Mídia baixada com sucesso! Recarregue a página.');
        setFailedMediaIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(message.id);
          return newSet;
        });
      } else {
        toast.error(data?.error || 'Erro desconhecido ao baixar mídia');
      }
    } catch (err) {
      console.error('[useMediaHandlers] Erro:', err);
      toast.error('Erro ao tentar baixar mídia');
    } finally {
      setLoadingMediaIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(message.id);
        return newSet;
      });
    }
  }, []);

  const needsLazyLoad = useCallback((message: Message): boolean => {
    const mediaTypes = ['image', 'audio', 'video', 'document', 'sticker'];
    const hasMediaType = mediaTypes.includes(message.mediaType || '');
    const hasStorageUrl = !!message.mediaUrl;
    const hasMediaId = !!(message as any).mediaId || !!(message as any).rawData?.message_data?.media_id;
    
    return hasMediaType && !hasStorageUrl && hasMediaId;
  }, []);

  const getEffectiveMediaUrl = useCallback((message: Message): string | undefined => {
    if (loadedMediaUrls.has(message.id)) {
      return loadedMediaUrls.get(message.id);
    }
    
    if (message.mediaUrl) {
      return message.mediaUrl;
    }
    
    const mediaTypes = ['image', 'audio', 'video', 'document', 'sticker'];
    if (mediaTypes.includes(message.mediaType || '') && message.body?.startsWith('http')) {
      return message.body;
    }
    
    const rawData = (message as any).rawData || {};
    const messageData = rawData.message_data || {};
    const metadata = rawData.metadata || {};
    
    const storageUrl = messageData.storageUrl || metadata.storageUrl;
    if (storageUrl) return storageUrl;
    
    const messageText = rawData.message_text;
    if (messageText && messageText.startsWith('http')) return messageText;
    
    return undefined;
  }, [loadedMediaUrls]);

  return {
    failedMediaIds,
    loadingMediaIds,
    loadedMediaUrls,
    fetchMediaUrl,
    handleMediaError,
    handleRetryMedia,
    needsLazyLoad,
    getEffectiveMediaUrl,
  };
};
