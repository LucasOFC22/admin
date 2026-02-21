// Sistema de variáveis dinâmicas para mensagens automáticas do WhatsApp

export interface MessageVariablesContext {
  // Dados do cliente
  nomeCliente?: string;
  telefoneCliente?: string;
  emailCliente?: string;
  
  // Dados do atendente
  nomeAtendente?: string;
  emailAtendente?: string;
  
  // Dados do ticket/chat
  chatId?: string | number;
  ticketId?: string | number;
  protocolo?: string;
  filaNome?: string;
  filaDestino?: string;
  
  // Tempo
  tempoAtendimento?: string; // formato: "2h 30min"
  inicioAtendimento?: Date;
  
  // Informações adicionais
  empresaNome?: string;
}

export interface VariableInfo {
  variable: string;
  description: string;
  example: string;
}

// Lista de todas as variáveis disponíveis
export const availableVariables: VariableInfo[] = [
  // Dados do cliente
  { variable: '{{nome_cliente}}', description: 'Nome do contato/cliente', example: 'João Silva' },
  { variable: '{{telefone_cliente}}', description: 'Telefone do cliente', example: '+55 11 99999-9999' },
  { variable: '{{email_cliente}}', description: 'E-mail do cliente', example: 'joao@email.com' },
  
  // Dados do atendente
  { variable: '{{nome_atendente}}', description: 'Nome do atendente logado', example: 'Maria Santos' },
  { variable: '{{email_atendente}}', description: 'E-mail do atendente', example: 'maria@empresa.com' },
  
  // Dados do ticket
  { variable: '{{chat_id}}', description: 'ID do chat', example: '12345' },
  { variable: '{{ticket_id}}', description: 'ID do ticket (mesmo que chat_id)', example: '12345' },
  { variable: '{{protocolo}}', description: 'Número do protocolo formatado', example: '#2024121112345' },
  { variable: '{{fila_nome}}', description: 'Nome da fila atual', example: 'Suporte Técnico' },
  { variable: '{{fila_destino}}', description: 'Nome da fila de destino (transferência)', example: 'Vendas' },
  
  // Data e hora
  { variable: '{{data}}', description: 'Data atual (dd/mm/yyyy)', example: '11/12/2024' },
  { variable: '{{hora}}', description: 'Hora atual (hh:mm)', example: '14:30' },
  { variable: '{{data_hora}}', description: 'Data e hora completa', example: '11/12/2024 às 14:30' },
  { variable: '{{dia_semana}}', description: 'Dia da semana', example: 'Quarta-feira' },
  { variable: '{{mes}}', description: 'Nome do mês', example: 'Dezembro' },
  { variable: '{{ano}}', description: 'Ano atual', example: '2024' },
  
  // Tempo de atendimento
  { variable: '{{tempo_atendimento}}', description: 'Tempo desde início do atendimento', example: '2h 30min' },
  
  // Saudação
  { variable: '{{saudacao}}', description: 'Saudação automática baseada na hora', example: 'Bom dia' },
  
  // Empresa
  { variable: '{{empresa_nome}}', description: 'Nome da empresa', example: 'FP Transcargas' },
];

// Dias da semana em português
const diasSemana = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 
  'Quinta-feira', 'Sexta-feira', 'Sábado'
];

// Meses em português
const meses = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// Função para obter saudação baseada na hora
const getSaudacao = (): string => {
  const hora = new Date().getHours();
  if (hora >= 5 && hora < 12) return 'Bom dia';
  if (hora >= 12 && hora < 18) return 'Boa tarde';
  return 'Boa noite';
};

// Função para calcular tempo de atendimento
const calcularTempoAtendimento = (inicio?: Date): string => {
  if (!inicio) return '-';
  
  const agora = new Date();
  const diffMs = agora.getTime() - inicio.getTime();
  const diffMinutos = Math.floor(diffMs / 60000);
  
  if (diffMinutos < 60) {
    return `${diffMinutos}min`;
  }
  
  const horas = Math.floor(diffMinutos / 60);
  const minutos = diffMinutos % 60;
  
  if (minutos === 0) {
    return `${horas}h`;
  }
  
  return `${horas}h ${minutos}min`;
};

// Função para gerar protocolo
const gerarProtocolo = (chatId?: string | number): string => {
  const data = new Date();
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  const id = chatId || Math.floor(Math.random() * 100000);
  return `#${ano}${mes}${dia}${id}`;
};

/**
 * Substitui as variáveis na mensagem pelos valores reais
 */
export const replaceMessageVariables = (
  message: string,
  context: MessageVariablesContext
): string => {
  if (!message) return message;
  
  const now = new Date();
  
  const replacements: Record<string, string> = {
    // Dados do cliente
    '{{nome_cliente}}': context.nomeCliente || 'Cliente',
    '{{telefone_cliente}}': context.telefoneCliente || '-',
    '{{email_cliente}}': context.emailCliente || '-',
    
    // Dados do atendente
    '{{nome_atendente}}': context.nomeAtendente || 'Atendente',
    '{{email_atendente}}': context.emailAtendente || '-',
    
    // Dados do ticket
    '{{chat_id}}': String(context.chatId || '-'),
    '{{ticket_id}}': String(context.ticketId || context.chatId || '-'),
    '{{protocolo}}': context.protocolo || gerarProtocolo(context.chatId),
    '{{fila_nome}}': context.filaNome || '-',
    '{{fila_destino}}': context.filaDestino || '-',
    
    // Data e hora
    '{{data}}': now.toLocaleDateString('pt-BR'),
    '{{hora}}': now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    '{{data_hora}}': `${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
    '{{dia_semana}}': diasSemana[now.getDay()],
    '{{mes}}': meses[now.getMonth()],
    '{{ano}}': String(now.getFullYear()),
    
    // Tempo
    '{{tempo_atendimento}}': context.tempoAtendimento || calcularTempoAtendimento(context.inicioAtendimento),
    
    // Saudação
    '{{saudacao}}': getSaudacao(),
    
    // Empresa
    '{{empresa_nome}}': context.empresaNome || 'FP Transcargas',
    
    // Compatibilidade com formato antigo ${variable}
    '${queue.name}': context.filaDestino || context.filaNome || '-',
  };
  
  let result = message;
  
  // Substituir todas as variáveis
  for (const [variable, value] of Object.entries(replacements)) {
    result = result.split(variable).join(value);
  }
  
  return result;
};

/**
 * Valida se uma mensagem contém variáveis válidas
 */
export const validateMessageVariables = (message: string): { valid: boolean; invalidVariables: string[] } => {
  const variablePattern = /\{\{([^}]+)\}\}/g;
  const foundVariables: string[] = [];
  let match;
  
  while ((match = variablePattern.exec(message)) !== null) {
    foundVariables.push(`{{${match[1]}}}`);
  }
  
  const validVariableNames = availableVariables.map(v => v.variable);
  const invalidVariables = foundVariables.filter(v => !validVariableNames.includes(v));
  
  return {
    valid: invalidVariables.length === 0,
    invalidVariables
  };
};

/**
 * Retorna um contexto de exemplo para prévias de mensagens
 */
export const getExampleContext = (): MessageVariablesContext => ({
  nomeCliente: 'João Silva',
  telefoneCliente: '+55 11 99999-9999',
  emailCliente: 'joao@email.com',
  nomeAtendente: 'Maria Santos',
  emailAtendente: 'maria@empresa.com',
  chatId: '12345',
  ticketId: '12345',
  protocolo: '#2024121512345',
  filaNome: 'Suporte Técnico',
  filaDestino: 'Vendas',
  tempoAtendimento: '15min',
  empresaNome: 'Sua Empresa',
});
