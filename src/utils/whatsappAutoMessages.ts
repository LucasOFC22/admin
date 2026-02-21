import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { supabaseWhatsAppService } from '@/services/whatsapp/supabaseIntegration';
import { replaceMessageVariables, MessageVariablesContext } from '@/utils/messageVariables';
import { whatsappDebug } from '@/utils/whatsappDebug';

export interface TemplateVariable {
  name: string;           // Nome da variável: "1", "2", "nome_cliente", etc.
  position?: number;      // Para variáveis numéricas {{1}}, {{2}}
  value: string;
  autoMapped?: boolean;
  type?: 'header' | 'body'; // Tipo do componente onde a variável está
}

export interface SendAutoMessageParams {
  chatId: string;
  contatoId: string;
  telefone: string;
  messageText: string;
  useTemplate: boolean;
  templateName?: string;
  templateLanguage?: string;
  templateVariables?: (string | TemplateVariable)[];
  context: MessageVariablesContext;
}

/**
 * Envia mensagem automática, seja como texto normal ou template Meta
 */
export async function sendAutoMessage(params: SendAutoMessageParams): Promise<void> {
  const {
    chatId,
    contatoId,
    telefone,
    messageText,
    useTemplate,
    templateName,
    templateLanguage = 'pt_BR',
    templateVariables = [],
    context
  } = params;

  if (useTemplate && templateName) {
    // Buscar conexão para enviar template
    const supabase = requireAuthenticatedClient();
    const { data: conexao } = await supabase
      .from('conexoes')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (!conexao?.id) {
      console.error('❌ [AutoMsg] Conexão não encontrada para envio de template');
      throw new Error('Conexão não encontrada');
    }

    // Processar e separar variáveis por tipo (header vs body), ordenando por position
    // Agora preservamos o name para enviar parameter_name à Meta API
    const headerVarsWithPosition: { position: number; name: string; value: string }[] = [];
    const bodyVarsWithPosition: { position: number; name: string; value: string }[] = [];

    templateVariables.forEach((variable, index) => {
      if (!variable) return;
      
      let processedValue = '-';
      let varType: 'header' | 'body' = 'body'; // Default é body
      let position = index; // Fallback: usar índice original
      let varName = `${index + 1}`; // Default: posição numérica como nome
      
      // Se for objeto com type e value (novo formato)
      if (typeof variable === 'object' && variable !== null && 'value' in variable) {
        const typedVar = variable as TemplateVariable;
        varType = typedVar.type || 'body';
        position = typedVar.position ?? index;
        varName = typedVar.name || `${position + 1}`;
        const val = typedVar.value;
        
        if (val && val.startsWith('{{') && val.endsWith('}}')) {
          const varNameContext = val.slice(2, -2).trim();
          processedValue = getContextValue(varNameContext, context);
        } else {
          processedValue = val || '-';
        }
      } else if (typeof variable === 'string') {
        // Se a variável começa com {{ e termina com }}, é uma variável de contexto
        if (variable.startsWith('{{') && variable.endsWith('}}')) {
          const varNameContext = variable.slice(2, -2).trim();
          processedValue = getContextValue(varNameContext, context);
        } else {
          processedValue = variable;
        }
      }
      
      // Adicionar na lista correta baseado no tipo, com position e name
      if (varType === 'header') {
        headerVarsWithPosition.push({ position, name: varName, value: processedValue });
      } else {
        bodyVarsWithPosition.push({ position, name: varName, value: processedValue });
      }
    });

    // Ordenar por position e manter objetos com name e value
    const headerVariables = headerVarsWithPosition
      .sort((a, b) => a.position - b.position)
      .map(v => ({ name: v.name, value: v.value }));
    
    const bodyVariables = bodyVarsWithPosition
      .sort((a, b) => a.position - b.position)
      .map(v => ({ name: v.name, value: v.value }));

    whatsappDebug('📋 [AutoMsg] Variáveis ordenadas por position:', {
      header: headerVarsWithPosition.sort((a, b) => a.position - b.position),
      body: bodyVarsWithPosition.sort((a, b) => a.position - b.position)
    });

    whatsappDebug('📧 [AutoMsg] Enviando template:', {
      templateName,
      templateLanguage,
      headerVariables: headerVariables.length > 0 ? headerVariables : undefined,
      bodyVariables: bodyVariables.length > 0 ? bodyVariables : undefined
    });

    // Enviar via edge function de template com header e body separados
    const { error } = await supabase.functions.invoke('whatsapp-enviar-template', {
      body: {
        conexaoId: conexao.id,
        telefone,
        templateName,
        templateLanguage,
        headerVariables: headerVariables.length > 0 ? headerVariables : undefined,
        bodyVariables: bodyVariables.length > 0 ? bodyVariables : undefined
      }
    });

    if (error) {
      console.error('❌ [AutoMsg] Erro ao enviar template:', error);
      throw error;
    }

    whatsappDebug('✅ [AutoMsg] Template enviado com sucesso!');
    
    // Apenas log de debug - NÃO salvar mensagem de sistema no chat (é apenas visual/debug)
    whatsappDebug('📋 [AutoMsg] Template enviado - não salva mensagem de sistema no chat');
  } else {
    // Enviar como mensagem normal
    const mensagemProcessada = replaceMessageVariables(messageText, context);
    
    whatsappDebug('📧 [AutoMsg] Enviando mensagem normal:', mensagemProcessada);
    
    await supabaseWhatsAppService.sendMessage({
      chatId,
      usuarioId: contatoId,
      mensagem: mensagemProcessada,
      tipo: 'sistema'
    });

    whatsappDebug('✅ [AutoMsg] Mensagem normal enviada com sucesso!');
  }
}

/**
 * Obtém valor do contexto baseado no nome da variável
 */
function getContextValue(varName: string, context: MessageVariablesContext): string {
  // Função para obter saudação baseada na hora
  const getSaudacao = () => {
    const hora = new Date().getHours();
    if (hora < 12) return 'Bom dia';
    if (hora < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  // Função para obter data/hora atual formatada
  const getDataHora = () => {
    return new Date().toLocaleString('pt-BR');
  };

  const mapping: Record<string, keyof MessageVariablesContext | (() => string)> = {
    'nome_cliente': 'nomeCliente',
    'telefone_cliente': 'telefoneCliente',
    'email_cliente': 'emailCliente',
    'nome_atendente': 'nomeAtendente',
    'email_atendente': 'emailAtendente',
    'chat_id': 'chatId',
    'ticket_id': 'ticketId',
    'fila_nome': 'filaNome',
    'fila_destino': 'filaDestino',
    'protocolo': () => context.chatId?.toString() || '-',
    'saudacao': getSaudacao,
    'data_hora': getDataHora,
    'data': () => new Date().toLocaleDateString('pt-BR'),
    'hora': () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    '1': 'nomeCliente', // Padrão para {{1}} é nome do cliente
    '2': 'nomeAtendente', // Padrão para {{2}} é nome do atendente
  };

  const mappedKey = mapping[varName];
  
  if (typeof mappedKey === 'function') {
    return mappedKey();
  }
  
  if (mappedKey && context[mappedKey] !== undefined) {
    const value = context[mappedKey];
    if (value instanceof Date) {
      return value.toLocaleString('pt-BR');
    }
    return String(value);
  }

  return '-';
}

/**
 * Helper para criar contexto de mensagem a partir de dados do ticket
 */
export function createMessageContext(params: {
  ticket: {
    nome?: string;
    telefone?: string;
    email?: string;
    chatId?: number;
    criadoEm?: string;
  };
  userData?: {
    nome?: string;
    email?: string;
  };
  filaAtual?: {
    name?: string;
  };
  filaDestino?: {
    name?: string;
  };
}): MessageVariablesContext {
  const { ticket, userData, filaAtual, filaDestino } = params;
  
  return {
    nomeCliente: ticket.nome,
    telefoneCliente: ticket.telefone,
    emailCliente: ticket.email,
    nomeAtendente: userData?.nome || 'Atendente',
    emailAtendente: userData?.email,
    chatId: ticket.chatId,
    ticketId: ticket.chatId,
    filaNome: filaAtual?.name,
    filaDestino: filaDestino?.name,
    inicioAtendimento: ticket.criadoEm ? new Date(ticket.criadoEm) : undefined,
  };
}
