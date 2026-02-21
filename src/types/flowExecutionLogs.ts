// Types aligned with actual database schema
export interface FlowExecutionLog {
  id: string;
  execution_id: string | null;
  session_id: string | null;
  node_id: string | null;
  node_type: string | null;
  action: string;
  log_data: Record<string, any> | null;
  node_data: Record<string, any> | null;
  result: string | null;
  created_at: string;
}

export interface FlowSession {
  id: string;
  chat_id: string | null;
  flow_id: string;
  phone_number: string;
  contact_name: string | null;
  conexao_id: string | null;
  current_node_id: string | null;
  current_group_id: string | null;
  current_block_index: number;
  waiting_block_type: string | null;
  variables: Record<string, any>;
  status: 'running' | 'waiting_input' | 'completed' | 'error';
  created_at: string;
  updated_at: string;
}

export const BLOCK_TYPE_LABELS: Record<string, string> = {
  text: 'Texto',
  menu: 'Menu',
  question: 'Pergunta',
  condition: 'Condição',
  interval: 'Intervalo',
  randomizer: 'Randomizador',
  ticket: 'Ticket',
  tags: 'Tags',
  setVariable: 'Variável',
  httpRequest: 'HTTP Request',
  webhook: 'Webhook',
  location: 'Localização',
  openai: 'OpenAI',
  typebot: 'Typebot',
  end: 'Fim',
  flow_end: 'Fim do Fluxo'
};

export const ACTION_LABELS: Record<string, string> = {
  session_start: 'Sessão Iniciada',
  session_end: 'Sessão Finalizada',
  session_error: 'Erro na Sessão',
  block_start: 'Bloco Iniciado',
  block_end: 'Bloco Finalizado',
  block_error: 'Erro no Bloco',
  message_sent: 'Mensagem Enviada',
  message_received: 'Mensagem Recebida',
  navigation: 'Navegação',
  variable_set: 'Variável Definida',
  condition_evaluated: 'Condição Avaliada',
  http_request: 'Requisição HTTP',
  waiting_input: 'Aguardando Input',
  flow_completed: 'Fluxo Concluído'
};
