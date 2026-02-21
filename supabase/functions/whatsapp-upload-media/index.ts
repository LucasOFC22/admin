import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UploadRequest {
  file: string; // base64
  fileName: string;
  fileType: string;
  chatId: number;
  usuarioId: string;
  conexaoId: string;
  caption?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[whatsapp-upload-media] Iniciando processamento...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: UploadRequest = await req.json();
    
    console.log('[whatsapp-upload-media] Dados recebidos:', {
      fileName: body.fileName,
      fileType: body.fileType,
      chatId: body.chatId,
      usuarioId: body.usuarioId,
      conexaoId: body.conexaoId,
      fileSize: body.file?.length || 0
    });

    // Validar dados obrigatorios
    if (!body.file || !body.fileName || !body.chatId || !body.conexaoId) {
      console.error('[whatsapp-upload-media] Dados incompletos');
      return new Response(
        JSON.stringify({ error: 'Dados incompletos. Necessario: file, fileName, chatId, conexaoId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // VALIDACAO DO CHAT - Usa chatId (bigint) para buscar o chat
    console.log('[whatsapp-upload-media] Validando chat com id:', body.chatId);
    
    const { data: chatData, error: chatError } = await supabase
      .from('chats_whatsapp')
      .select('id, usuarioid, ativo')
      .eq('id', body.chatId)
      .maybeSingle();

    if (chatError) {
      console.error('[whatsapp-upload-media] Erro ao buscar chat:', chatError);
      return new Response(
        JSON.stringify({ error: 'Erro ao validar chat' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!chatData) {
      console.error('[whatsapp-upload-media] Chat nao encontrado:', body.chatId);
      return new Response(
        JSON.stringify({ error: `Chat nao encontrado: ${body.chatId}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[whatsapp-upload-media] Chat validado:', chatData);

    // Converter base64 para Uint8Array
    const binaryString = atob(body.file);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Gerar nome unico para o arquivo
    const timestamp = Date.now();
    const sanitizedFileName = body.fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${body.chatId}/${timestamp}_${sanitizedFileName}`;

    console.log('[whatsapp-upload-media] Fazendo upload para:', filePath);

    // Upload para o Supabase Storage - usar o MIME type original do arquivo
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('whatsapp-media')
      .upload(filePath, bytes, {
        contentType: body.fileType || 'application/octet-stream',
        upsert: false
      });

    if (uploadError) {
      console.error('[whatsapp-upload-media] Erro no upload:', uploadError);
      return new Response(
        JSON.stringify({ error: `Erro no upload: ${uploadError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[whatsapp-upload-media] Upload concluido:', uploadData);

    // Obter URL publica
    const { data: publicUrlData } = supabase.storage
      .from('whatsapp-media')
      .getPublicUrl(filePath);

    // Substituir URL interna pela URL publica externa
    let publicUrl = publicUrlData.publicUrl;
    publicUrl = publicUrl.replace('http://kong:8000', 'https://kong.fptranscargas.com.br');
    
    console.log('[whatsapp-upload-media] URL publica (corrigida):', publicUrl);

    // Determinar tipo de midia
    // Nota: arquivos de audio sao enviados como documento (nao como mensagem de voz)
    let messageType = 'document';
    if (body.fileType.startsWith('image/')) {
      messageType = 'image';
    } else if (body.fileType.startsWith('video/')) {
      messageType = 'video';
    }
    // audio/* permanece como 'document' para enviar como arquivo, nao como mensagem de voz

    console.log('[whatsapp-upload-media] Upload concluido com sucesso, tipo:', messageType);

    return new Response(
      JSON.stringify({
        success: true,
        url: publicUrl,
        filePath,
        messageType
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: unknown) {
    console.error('[whatsapp-upload-media] Erro geral:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
