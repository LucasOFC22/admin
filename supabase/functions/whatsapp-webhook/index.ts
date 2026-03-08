// Edge Function: whatsapp-webhook
// Recebe mensagens do backend VPS com formato customizado
// Fix: Encerrar chats anteriores quando responde a campanha

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Declaração do EdgeRuntime para Supabase Edge Functions
declare const EdgeRuntime: {
  waitUntil: (promise: Promise<any>) => void;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// URL do webhook n8n para processar mídia
const N8N_MEDIA_WEBHOOK_URL = "https://n8n.fptranscargas.com.br/webhook/546c51d7-e082-481b-8819-16236d901700";

// URL base do Storage
const STORAGE_BASE_URL = `https://kong.fptranscargas.com.br/storage/v1/object/public/whatsapp-media`;

// ============================================
// 🔤 UTF-8 ENCODING HELPER (ROBUST VERSION)
// ============================================
function normalizeUtf8(text: string): string {
  if (!text || typeof text !== 'string') return text;
  
  const mojibakePatterns: [RegExp, string][] = [
    [/\xC3\xA1/g, 'á'], [/\xC3\xA0/g, 'à'], [/\xC3\xA2/g, 'â'], [/\xC3\xA3/g, 'ã'],
    [/\xC3\xA7/g, 'ç'], [/\xC3\xA9/g, 'é'], [/\xC3\xAA/g, 'ê'], [/\xC3\xA8/g, 'è'],
    [/\xC3\xAD/g, 'í'], [/\xC3\xAE/g, 'î'], [/\xC3\xAC/g, 'ì'],
    [/\xC3\xB3/g, 'ó'], [/\xC3\xB4/g, 'ô'], [/\xC3\xB5/g, 'õ'], [/\xC3\xB2/g, 'ò'],
    [/\xC3\xBA/g, 'ú'], [/\xC3\xBB/g, 'û'], [/\xC3\xB9/g, 'ù'], [/\xC3\xB1/g, 'ñ'],
    [/\xC3\x81/g, 'Á'], [/\xC3\x80/g, 'À'], [/\xC3\x82/g, 'Â'], [/\xC3\x83/g, 'Ã'],
    [/\xC3\x87/g, 'Ç'], [/\xC3\x89/g, 'É'], [/\xC3\x8A/g, 'Ê'], [/\xC3\x8D/g, 'Í'],
    [/\xC3\x93/g, 'Ó'], [/\xC3\x94/g, 'Ô'], [/\xC3\x95/g, 'Õ'], [/\xC3\x9A/g, 'Ú'],
    [/\xC3\x82\xC2\xA1/g, 'á'], [/\xC3\x82\xC2\xA3/g, 'ã'], [/\xC3\x82\xC2\xA7/g, 'ç'],
    [/\xC3\x82\xC2\xA9/g, 'é'], [/\xC3\x82\xC2\xAA/g, 'ê'], [/\xC3\x82\xC2\xAD/g, 'í'],
    [/\xC3\x82\xC2\xB3/g, 'ó'], [/\xC3\x82\xC2\xB4/g, 'ô'], [/\xC3\x82\xC2\xBA/g, 'ú'],
    [/\xE2\x80\x9C/g, '"'], [/\xE2\x80\x9D/g, '"'], [/\xE2\x80\x99/g, "'"],
    [/\xE2\x80\x93/g, '–'], [/\xE2\x80\xA6/g, '…'],
  ];
  
  let fixed = text;
  for (const [pattern, replacement] of mojibakePatterns) {
    fixed = fixed.replace(pattern, replacement);
  }
  
  try {
    if (/[\xC0-\xDF][\x80-\xBF]|[\xE0-\xEF][\x80-\xBF]{2}/.test(fixed)) {
      const bytes = new Uint8Array([...fixed].map(c => c.charCodeAt(0)));
      const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
      if (decoded && !decoded.includes('\uFFFD')) {
        fixed = decoded;
      }
    }
  } catch {}
  
  try { fixed = fixed.normalize('NFC'); } catch {}
  return fixed.replace(/\uFFFD/g, '');
}

// ============================================
// 📁 GERAR URL DO STORAGE PREVISÍVEL
// ============================================
function getMediaExtension(messageType: string): string {
  switch (messageType) {
    case 'audio': return 'mp3';
    case 'image': return 'jpg';
    case 'video': return 'mp4';
    case 'sticker': return 'webp';
    case 'document': return 'pdf';
    default: return 'bin';
  }
}

function generateStorageUrl(chatId: number | string, messageId: string, messageType: string): string {
  const ext = getMediaExtension(messageType);
  return `${STORAGE_BASE_URL}/${chatId}/${messageId}.${ext}`;
}

// ============================================
// 📁 EXTRAIR URL DA MÍDIA DO PAYLOAD
// ============================================
function extractMediaUrl(body: any, messageType: string): string | null {
  const media = body.media || {};
  
  switch (messageType) {
    case 'audio': return media.audio?.url || body.audio?.url || null;
    case 'image': return media.image?.url || body.image?.url || null;
    case 'video': return media.video?.url || body.video?.url || null;
    case 'document': return media.document?.url || body.document?.url || null;
    case 'sticker': return media.sticker?.url || body.sticker?.url || null;
    default: return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    if (req.method === "GET") {
      const url = new URL(req.url);
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");
      const verifyToken = Deno.env.get("WHATSAPP_VERIFY_TOKEN") || "fp_transcargas_2025";

      if (mode === "subscribe" && token === verifyToken) {
        return new Response(challenge, {
          headers: { ...corsHeaders, "Content-Type": "text/plain" },
        });
      }
      return new Response("Forbidden", { status: 403, headers: corsHeaders });
    }

    if (req.method === "POST") {
      const body = await req.json();

      const from = body.from;
      const messageType = body.type || "text";
      const messageId = body.messageId || crypto.randomUUID();

      const isReaction = messageType === 'reaction';
      const reactionData = isReaction ? body.reaction : null;

      if (!from) {
        return new Response(
          JSON.stringify({ success: false, error: "Campo 'from' obrigatorio" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Proteção contra webhooks duplicados
      const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
      const { data: existingMessage } = await supabase
        .from("mensagens_whatsapp")
        .select("id, created_at")
        .eq("message_id", messageId)
        .gte("created_at", oneMinuteAgo)
        .maybeSingle();

      if (existingMessage) {
        return new Response(
          JSON.stringify({ success: true, message: "Mensagem duplicada ignorada" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      

      const { data: whatsappConfig } = await supabase
        .from("config_whatsapp")
        .select("*")
        .limit(1)
        .maybeSingle();

      // Buscar conexão
      const entryIdValue = body.entryId;
      let conexao = null;
      let conexaoError = null;

      if (entryIdValue) {
        const result = await supabase
          .from("conexoes")
          .select("*, whatsapp_token, whatsapp_phone_id")
          .eq("whatsapp_business_account_id", entryIdValue)
          .maybeSingle();
        conexao = result.data;
        conexaoError = result.error;
      }

      if (!conexao) {
        const result = await supabase
          .from("conexoes")
          .select("*, whatsapp_token, whatsapp_phone_id")
          .eq("is_default", true)
          .maybeSingle();
        conexao = result.data;
        conexaoError = result.error;
      }

      if (!conexao) {
        const result = await supabase
          .from("conexoes")
          .select("*, whatsapp_token, whatsapp_phone_id")
          .eq("ativo", true)
          .limit(1)
          .maybeSingle();
        conexao = result.data;
        conexaoError = result.error;
        if (conexao) console.log(`[Webhook] ⚠️ Conexão encontrada (fallback ativo): ${conexao.id}`);
      }

      if (conexaoError) console.error("[Webhook] Erro ao buscar conexao:", conexaoError);
      if (!conexao) console.error(`[Webhook] ❌ Nenhuma conexão encontrada! entryId: ${entryIdValue}`);
      const conexaoId = conexao?.id || null;

      // Rejeitar ligação
      if (messageType === 'call' && whatsappConfig && !whatsappConfig.accept_call_whatsapp) {
        if (conexao?.whatsapp_token && conexao?.whatsapp_phone_id && whatsappConfig.accept_call_whatsapp_message) {
          try {
            await fetch(`https://graph.facebook.com/v21.0/${conexao.whatsapp_phone_id}/messages`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${conexao.whatsapp_token}`, 'Content-Type': 'application/json; charset=utf-8' },
              body: JSON.stringify({ messaging_product: 'whatsapp', to: from, type: 'text', text: { body: normalizeUtf8(whatsappConfig.accept_call_whatsapp_message) } })
            });
          } catch (err) { console.error("[Webhook] Erro:", err); }
        }
        return new Response(JSON.stringify({ success: true, message: "Ligacao rejeitada" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const timestamp = body.timestamp || Math.floor(Date.now() / 1000).toString();
      const contactName = body.contacts?.[0]?.profile?.name || from;
      
      let messageText = body.text || body.caption || null;
      let interactiveId: string | null = null;
      let interactiveType: string | null = null;
      
      const contextData = body.context || null;
      const replyToMessageId = contextData?.message_id || null;
      
      if (messageType === 'interactive' && body.interactive) {
        if (body.interactive.type === 'list_reply') {
          messageText = body.interactive.list_reply.title;
          interactiveId = body.interactive.list_reply.id;
          interactiveType = 'list_reply';
        } else if (body.interactive.type === 'button_reply') {
          messageText = body.interactive.button_reply.title;
          interactiveId = body.interactive.button_reply.id;
          interactiveType = 'button_reply';
        }
      }
      
      // Detecção de mensagem deletada
      if (messageType === 'unsupported' && body.errors?.[0]?.code === 131051) {
        const deletedMsgId = contextData?.id;
        if (deletedMsgId) {
          console.log(`[Webhook] 🗑️ Mensagem deletada pelo cliente: ${deletedMsgId}`);
          
          await supabase
            .from("mensagens_whatsapp")
            .update({
              is_deleted: true,
              deleted_at: new Date().toISOString()
            })
            .eq("message_id", deletedMsgId);
          
          return new Response(
            JSON.stringify({ success: true, type: "message_deleted" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
      
      // Detecção de mensagem editada
      if (body.message?.edited_message) {
        const editedMsgId = body.message.edited_message.id;
        const newText = body.message.edited_message.text?.body || body.message.edited_message.caption;
        
        if (editedMsgId && newText) {
          console.log(`[Webhook] ✏️ Mensagem editada pelo cliente: ${editedMsgId}`);
          
          await supabase
            .from("mensagens_whatsapp")
            .update({
              message_text: normalizeUtf8(newText),
              is_edited: true,
              edited_at: new Date().toISOString()
            })
            .eq("message_id", editedMsgId);
          
          return new Response(
            JSON.stringify({ success: true, type: "message_edited" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
      
      const mediaData = body.media || {};
      const entryId = body.entryId;

      // Contato
      let contato = null;
      const { data: existingContact, error: searchError } = await supabase
        .from("contatos_whatsapp").select("*").eq("telefone", from).maybeSingle();

      if (searchError) {
        console.error("[Webhook] Erro ao buscar contato:", searchError);
      } else if (existingContact) {
        contato = existingContact;
        // Nome NÃO é mais atualizado automaticamente - mantém apenas o do cadastro inicial
      } else {
        const { data: newContact, error: createError } = await supabase
          .from("contatos_whatsapp").insert({ telefone: from, nome: contactName }).select().single();
        if (!createError) contato = newContact;
      }

      // Chat - buscar apenas chats NÃO resolvidos
      let chat: { id: number; mododeatendimento?: string; [key: string]: any } | null = null;
      let isNewChat = false;
      if (contato) {
        const { data: existingChat } = await supabase
          .from("chats_whatsapp")
          .select("*")
          .eq("usuarioid", contato.id)
          .eq("ativo", true)
          .eq("resolvido", false)
          .maybeSingle();

        if (existingChat) {
          chat = existingChat;
          await supabase.from("chats_whatsapp").update({ atualizadoem: new Date().toISOString() }).eq("id", existingChat.id);
        } else {
          // ============================================
          // 📢 VERIFICAR RESPOSTA DE CAMPANHA
          // ============================================
          const cleanPhone = from.replace(/\D/g, '');
          const { data: envioPendente } = await supabase
            .from("campanhas_envios_pendentes")
            .select("id, campanha_id, flow_id")
            .eq("telefone", cleanPhone)
            .eq("status", "pendente")
            .order("enviado_em", { ascending: false })
            .limit(1)
            .maybeSingle();
          
          let origemCampanhaId = null;
          let campanhaFlowId = null;
          
          if (envioPendente) {
            console.log(`[Webhook] 📢 Resposta de campanha detectada! Campanha: ${envioPendente.campanha_id}, Flow: ${envioPendente.flow_id}`);
            origemCampanhaId = envioPendente.campanha_id;
            campanhaFlowId = envioPendente.flow_id;
            
            // Marcar como respondido
            await supabase
              .from("campanhas_envios_pendentes")
              .update({ 
                status: "respondido",
                respondido_em: new Date().toISOString()
              })
              .eq("id", envioPendente.id);
            
            // 🆕 ENCERRAR QUALQUER CHAT ANTERIOR DO MESMO CONTATO
            // (Isso garante que não há conflitos com sessões antigas)
            const { data: chatsAnteriores } = await supabase
              .from("chats_whatsapp")
              .update({
                ativo: false,
                resolvido: true,
                encerradoem: new Date().toISOString()
              })
              .eq("usuarioid", contato.id)
              .eq("ativo", true)
              .select("id");
            
            if (chatsAnteriores && chatsAnteriores.length > 0) {
              console.log(`[Webhook] 🔒 Encerrados ${chatsAnteriores.length} chat(s) anteriores antes de criar novo (campanha)`);
            }
            
            // 🆕 INVALIDAR SESSÕES DE FLUXO ANTIGAS
            const { data: sessoesAntigas } = await supabase
              .from("flow_sessions")
              .update({
                status: 'completed',
                updated_at: new Date().toISOString()
              })
              .eq("phone_number", cleanPhone)
              .in("status", ["running", "waiting_input"])
              .select("id");
            
            if (sessoesAntigas && sessoesAntigas.length > 0) {
              console.log(`[Webhook] 🔒 Invalidadas ${sessoesAntigas.length} sessão(ões) de fluxo antigas (campanha)`);
            }
          }
          
          // ============================================
          // 🕐 VERIFICAR HORÁRIO DE ATENDIMENTO (apenas para novos chats)
          // ============================================
          let isOutsideBusinessHours = false;
          let absenceMessage = '';
          
          try {
            const { data: businessHoursData } = await supabase
              .from("whatsapp_business_hours")
              .select("*")
              .is("fila_id", null)
              .limit(1)
              .maybeSingle();
            
            if (businessHoursData) {
              const bhConfig = {
                ...businessHoursData,
                days: typeof businessHoursData.days === 'string' 
                  ? JSON.parse(businessHoursData.days) 
                  : businessHoursData.days
              };
              
              // Verificar feriados
              const now = new Date();
              const dateStr = now.toISOString().split('T')[0];
              const { data: holidaysData } = await supabase
                .from("whatsapp_holidays")
                .select("*")
                .eq("date", dateStr);
              
              const holidays = holidaysData || [];
              const todayHoliday = holidays.find((h: any) => h.date === dateStr);
              
              if (todayHoliday) {
                if (todayHoliday.start_time && todayHoliday.end_time) {
                  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                  if (currentTime >= todayHoliday.start_time && currentTime <= todayHoliday.end_time) {
                    isOutsideBusinessHours = true;
                    absenceMessage = todayHoliday.message || bhConfig.absence_message || '';
                  }
                } else {
                  isOutsideBusinessHours = true;
                  absenceMessage = todayHoliday.message || bhConfig.absence_message || '';
                }
              }
              
              if (!isOutsideBusinessHours && bhConfig.days) {
                const dayIndex = now.getDay();
                const dayConfig = bhConfig.days[dayIndex];
                
                if (dayConfig) {
                  if (dayConfig.status === 'closed') {
                    isOutsideBusinessHours = true;
                    absenceMessage = bhConfig.absence_message || '';
                  } else if (dayConfig.status === 'hours') {
                    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                    const inPeriod1 = currentTime >= dayConfig.start1 && currentTime <= dayConfig.end1;
                    const inPeriod2 = currentTime >= dayConfig.start2 && currentTime <= dayConfig.end2;
                    if (!inPeriod1 && !inPeriod2) {
                      isOutsideBusinessHours = true;
                      absenceMessage = bhConfig.absence_message || '';
                    }
                  }
                }
              }
            }
          } catch (bhError) {
            console.error("[Webhook] Erro ao verificar horário de atendimento:", bhError);
            // Em caso de erro, prossegue normalmente (não bloqueia)
          }
          
          // Se estiver fora do horário, envia mensagem de ausência e NÃO cria chat
          if (isOutsideBusinessHours && absenceMessage && conexao?.whatsapp_token && conexao?.whatsapp_phone_id) {
            try {
              await fetch(`https://graph.facebook.com/v21.0/${conexao.whatsapp_phone_id}/messages`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${conexao.whatsapp_token}`, 'Content-Type': 'application/json; charset=utf-8' },
                body: JSON.stringify({ messaging_product: 'whatsapp', to: from, type: 'text', text: { body: normalizeUtf8(absenceMessage) } })
              });
              console.log(`[Webhook] 🕐 Fora do horário de atendimento. Mensagem de ausência enviada para ${from}`);
            } catch (err) {
              console.error("[Webhook] Erro ao enviar mensagem de ausência:", err);
            }
            
            // Salvar mensagem recebida e resposta no banco mesmo fora do horário
            // Criar chat temporário para registrar a mensagem
          }

          // Cria novo chat
          const { data: newChat } = await supabase
            .from("chats_whatsapp")
            .insert({ 
              usuarioid: contato.id, 
              ativo: true, 
              resolvido: false,
              mododeatendimento: "bot", 
              origem_campanha_id: origemCampanhaId,
              campanha_flow_id: campanhaFlowId,
              criadoem: new Date().toISOString(), 
              atualizadoem: new Date().toISOString() 
            })
            .select().single();
          if (newChat) {
            chat = newChat;
            isNewChat = true;
            console.log(`[Webhook] 🆕 Novo chat criado: ${newChat.id}, campanha_flow_id: ${campanhaFlowId || 'nenhum'}`);
            
            // Buscar foto de perfil via Meta Graph API (apenas se contato não tiver foto)
            if (contato && !contato.perfil && conexao?.whatsapp_token) {
              try {
                console.log(`[Webhook] 📷 Buscando foto de perfil para: ${from}`);
                
                // Buscar profile picture URL do contato via Meta Graph API
                const profileResponse = await fetch(
                  `https://graph.facebook.com/v21.0/${from}?fields=profile_pic`,
                  {
                    method: 'GET',
                    headers: { 
                      'Authorization': `Bearer ${conexao.whatsapp_token}` 
                    }
                  }
                );
                
                if (profileResponse.ok) {
                  const profileData = await profileResponse.json();
                  console.log(`[Webhook] 📷 Resposta da API de perfil:`, JSON.stringify(profileData));
                  
                  if (profileData.profile_pic) {
                    await supabase
                      .from("contatos_whatsapp")
                      .update({ perfil: profileData.profile_pic })
                      .eq("id", contato.id);
                    console.log(`[Webhook] ✅ Foto de perfil salva para contato ${contato.id}`);
                  }
                } else {
                  const errorText = await profileResponse.text();
                  console.log(`[Webhook] ⚠️ Não foi possível buscar foto de perfil (${profileResponse.status}): ${errorText}`);
                }
              } catch (perfilErr) {
                console.error("[Webhook] ❌ Erro ao buscar foto de perfil:", perfilErr);
              }
            }
          }
        }
      }

      const modoDeAtendimento = (chat?.mododeatendimento || 'bot').toLowerCase().trim();
      const isAtendimentoHumano = modoDeAtendimento === 'atendimento humano';

      // Processar reações no atendimento humano
      if (isReaction && reactionData) {
        if (!isAtendimentoHumano) {
          console.log(`[Webhook] ⏭️ Reação ignorada - Chat não está em Atendimento Humano`);
          return new Response(
            JSON.stringify({ success: true, message: "Reação ignorada - modo bot" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`[Webhook] 🎯 Reação recebida no Atendimento Humano: ${reactionData.emoji} para mensagem ${reactionData.message_id}`);
        
        const { data: originalMessage, error: msgError } = await supabase
          .from("mensagens_whatsapp")
          .select("id, message_data, metadata")
          .eq("message_id", reactionData.message_id)
          .maybeSingle();
        
        if (originalMessage && !msgError) {
          const currentReactions = originalMessage.message_data?.reactions || [];
          const newReaction = {
            emoji: reactionData.emoji,
            from: from,
            timestamp: new Date().toISOString()
          };
          
          const existingIndex = currentReactions.findIndex((r: any) => r.from === from);
          if (existingIndex >= 0) {
            if (reactionData.emoji) {
              currentReactions[existingIndex] = newReaction;
            } else {
              currentReactions.splice(existingIndex, 1);
            }
          } else if (reactionData.emoji) {
            currentReactions.push(newReaction);
          }
          
          await supabase
            .from("mensagens_whatsapp")
            .update({
              message_data: {
                ...originalMessage.message_data,
                reactions: currentReactions
              }
            })
            .eq("id", originalMessage.id);
          
          console.log(`[Webhook] ✅ Reação ${reactionData.emoji || '(removida)'} salva na mensagem ${originalMessage.id}`);
        } else {
          console.log(`[Webhook] ⚠️ Mensagem original não encontrada para reação: ${reactionData.message_id}`);
        }
        
        return new Response(
          JSON.stringify({ success: true, type: "reaction", emoji: reactionData.emoji }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Processar mídia
      const mediaTypes = ['audio', 'image', 'video', 'document', 'sticker'];
      const isMediaMessage = mediaTypes.includes(messageType);
      const mediaUrl = extractMediaUrl(body, messageType);
      
      const storageUrl = isMediaMessage && chat?.id 
        ? generateStorageUrl(chat.id, messageId, messageType)
        : null;
      
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      if (isMediaMessage && mediaUrl && chat?.id) {
        try {
          const n8nResponse = await fetch(N8N_MEDIA_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              telefone: from,
              urldamedia: mediaUrl,
              messageId: messageId,
              chatId: chat.id,
              mediaType: messageType
            })
          });
          
          if (!n8nResponse.ok) {
            console.error(`[Webhook] ❌ Erro ao enviar mídia para n8n:`, await n8nResponse.text());
          }
        } catch (err) {
          console.error("[Webhook] ❌ Erro ao enviar mídia para n8n:", err);
        }
      }

      // Audio - tratamento especial
      if (messageType === 'audio') {
        const acceptAudio = whatsappConfig?.accept_audio_message_contact ?? true;
        if (!acceptAudio && !isAtendimentoHumano) {
          if (conexao?.whatsapp_token && conexao?.whatsapp_phone_id && whatsappConfig?.accept_audio_message_contact_message) {
            try {
              await fetch(`https://graph.facebook.com/v21.0/${conexao.whatsapp_phone_id}/messages`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${conexao.whatsapp_token}`, 'Content-Type': 'application/json; charset=utf-8' },
                body: JSON.stringify({ messaging_product: 'whatsapp', to: from, type: 'text', text: { body: normalizeUtf8(whatsappConfig.accept_audio_message_contact_message) } })
              });
            } catch (err) { console.error("[Webhook] Erro:", err); }
          }
          return new Response(JSON.stringify({ success: true, message: "Audio rejeitado" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      }

      let finalMessageType = messageType;
      if (isMediaMessage) {
        finalMessageType = messageType;
      } else if (messageType === 'interactive') {
        finalMessageType = 'interactive';
      } else if (!messageType || messageType === 'unknown') {
        finalMessageType = 'text';
      }
      
      const finalMessageText = isMediaMessage ? storageUrl : messageText;

      // Buscar conteúdo da mensagem citada
      let quotedMessageData = null;
      if (replyToMessageId) {
        const { data: quotedMsg } = await supabase
          .from("mensagens_whatsapp")
          .select("message_text, message_type, send")
          .eq("message_id", replyToMessageId)
          .maybeSingle();
        
        if (quotedMsg) {
          quotedMessageData = {
            body: quotedMsg.message_text,
            type: quotedMsg.message_type,
            fromMe: quotedMsg.send !== 'cliente'
          };
        }
      }

      // Salvar mensagem
      const { error: insertError } = await supabase.from("mensagens_whatsapp").insert({
        message_id: messageId,
        chatId: chat?.id || null,
        message_type: finalMessageType,
        message_text: finalMessageText,
        interactive_id: interactiveId,
        reply_to_message_id: replyToMessageId,
        send: 'cliente',
        message_data: {
          ...body,
          storageUrl: storageUrl,
          interactiveType: interactiveType,
          context: replyToMessageId ? { quoted_message: quotedMessageData } : undefined
        },
        metadata: { 
          conexaoId, 
          contatoId: contato?.id, 
          entryId, 
          hasMedia: isMediaMessage,
          storageUrl: storageUrl,
          modoDeAtendimento, 
          phone_number: from, 
          contact_name: contactName,
          interactiveType: interactiveType
        },
        received_at: new Date(parseInt(timestamp) * 1000).toISOString(),
        media_permanent: false,
        media_expires_at: isMediaMessage ? expiresAt.toISOString() : null
      });
      if (insertError) {
        console.error("[Webhook] Erro ao inserir:", insertError);
        
        if (insertError.code === '23505') {
          return new Response(
            JSON.stringify({ success: true, message: "Mensagem duplicada ignorada" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Processamento assíncrono do flow
      if (!isAtendimentoHumano) {
        const flowPayload = { 
          phoneNumber: from, 
          messageText, 
          messageType, 
          conexaoId, 
          contactName, 
          chatId: chat?.id, 
          contatoId: contato?.id, 
          interactiveId 
        };
        
        const flowPromise = supabase.functions.invoke("flow-processor-main", {
          body: flowPayload
        }).then((result: any) => {
          if (result.error) {
            console.error("[Webhook] ❌ Erro no flow:", result.error);
          }
        }).catch((err: any) => {
          console.error("[Webhook] ❌ Erro ao chamar flow:", err);
        });
        
        EdgeRuntime.waitUntil(flowPromise);
      }

      // Notificar N8N em background
      const n8nWebhookUrl = Deno.env.get("N8N_WEBHOOK_URL");
      if (n8nWebhookUrl) {
        const n8nPromise = fetch(n8nWebhookUrl, {
          method: "POST", 
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            eventType: "whatsapp-message-received", 
            from, 
            contactName, 
            messageText, 
            messageType, 
            messageId, 
            timestamp, 
            chatId: chat?.id, 
            contatoId: contato?.id, 
            modoDeAtendimento, 
            interactiveId 
          })
        }).catch((err: any) => console.error("[Webhook] Erro N8N:", err));
        
        EdgeRuntime.waitUntil(n8nPromise);
      }

      return new Response(JSON.stringify({ success: true, async: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: corsHeaders });
  } catch (error) {
    console.error("[Webhook] Erro:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro" }), { status: 500, headers: corsHeaders });
  }
});
