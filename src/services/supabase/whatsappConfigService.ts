import { requireAuthenticatedClient } from '@/config/supabaseAuth';

export interface TemplateVariableMapping {
  name: string;           // Nome da variável: "1", "2", "nome_cliente", etc.
  position?: number;      // Para variáveis numéricas {{1}}, {{2}}
  value: string;          // Valor fixo ou variável do sistema como {{nome_cliente}}
  autoMapped?: boolean;   // Se foi auto-mapeada (variável do sistema)
  type?: 'header' | 'body'; // Tipo do componente onde a variável está
}

export interface WhatsAppConfig {
  id?: number;
  user_rating: boolean;
  send_msg_transf_ticket: boolean;
  send_greeting_accepted: boolean;
  accept_call_whatsapp: boolean;
  send_sign_message: boolean;
  accept_audio_message_contact: boolean;
  transfer_message: string;
  greeting_accepted_message: string;
  accept_call_whatsapp_message: string;
  accept_audio_message_contact_message: string;
  // Configurações de mensagens automáticas
  send_msg_close_ticket: boolean;
  close_ticket_message: string;
  send_msg_cancel_ticket: boolean;
  cancel_ticket_message: string;
  // Reabrir ticket
  send_msg_reopen_ticket: boolean;
  reopen_ticket_message: string;
  // Novo ticket
  send_msg_new_ticket: boolean;
  new_ticket_message: string;
  // Template configs - Transferência
  transfer_use_template: boolean;
  transfer_template_name: string;
  transfer_template_language: string;
  transfer_template_variables: TemplateVariableMapping[];
  // Template configs - Aceitar
  greeting_use_template: boolean;
  greeting_template_name: string;
  greeting_template_language: string;
  greeting_template_variables: TemplateVariableMapping[];
  // Template configs - Encerrar
  close_use_template: boolean;
  close_template_name: string;
  close_template_language: string;
  close_template_variables: TemplateVariableMapping[];
  // Template configs - Cancelar
  cancel_use_template: boolean;
  cancel_template_name: string;
  cancel_template_language: string;
  cancel_template_variables: TemplateVariableMapping[];
  // Template configs - Reabrir
  reopen_use_template: boolean;
  reopen_template_name: string;
  reopen_template_language: string;
  reopen_template_variables: TemplateVariableMapping[];
  // Template configs - Novo Ticket
  new_ticket_use_template: boolean;
  new_ticket_template_name: string;
  new_ticket_template_language: string;
  new_ticket_template_variables: TemplateVariableMapping[];
  // Template configs - Rejeição de ligação
  call_rejection_use_template: boolean;
  call_rejection_template_name: string;
  call_rejection_template_language: string;
  call_rejection_template_variables: TemplateVariableMapping[];
  // Template configs - Continuação de Atendimento (Janela 24h)
  send_msg_continuacao: boolean;
  continuacao_message: string;
  continuacao_use_template: boolean;
  continuacao_template_name: string;
  continuacao_template_language: string;
  continuacao_template_variables: TemplateVariableMapping[];
  // Encerramento por inatividade do cliente
  inactivity_enabled: boolean;
  inactivity_timeout_minutes: number;
  inactivity_message: string;
  inactivity_use_template: boolean;
  inactivity_template_name: string;
  inactivity_template_language: string;
  inactivity_template_variables: TemplateVariableMapping[];
  // Configurações extras
  disable_signature: boolean;
  hide_chatbot_tickets: boolean;
  created_at?: string;
  updated_at?: string;
}

const DEFAULT_CONFIG: Omit<WhatsAppConfig, 'id' | 'created_at' | 'updated_at'> = {
  user_rating: false,
  send_msg_transf_ticket: false,
  send_greeting_accepted: false,
  accept_call_whatsapp: true,
  send_sign_message: true,
  accept_audio_message_contact: true,
  transfer_message: 'Você foi transferido para ${queue.name}',
  greeting_accepted_message: 'Olá! Seu atendimento foi aceito. Como posso ajudar?',
  accept_call_whatsapp_message: 'Desculpe, não aceitamos ligações por WhatsApp. Por favor, envie uma mensagem de texto.',
  accept_audio_message_contact_message: 'Desculpe, não aceitamos mensagens de áudio. Por favor, envie uma mensagem de texto.',
  // Configurações de mensagens automáticas
  send_msg_close_ticket: false,
  close_ticket_message: 'Seu atendimento foi encerrado. Obrigado pelo contato!',
  send_msg_cancel_ticket: false,
  cancel_ticket_message: 'Este ticket foi cancelado. Se precisar de ajuda, abra um novo atendimento.',
  // Reabrir ticket
  send_msg_reopen_ticket: false,
  reopen_ticket_message: 'Seu ticket foi reaberto. Em breve um atendente irá auxiliá-lo.',
  // Novo ticket
  send_msg_new_ticket: false,
  new_ticket_message: 'Olá! Um novo ticket foi criado para você. Em breve um atendente irá atendê-lo.',
  // Template configs - Transferência
  transfer_use_template: false,
  transfer_template_name: '',
  transfer_template_language: 'pt_BR',
  transfer_template_variables: [],
  // Template configs - Aceitar
  greeting_use_template: false,
  greeting_template_name: '',
  greeting_template_language: 'pt_BR',
  greeting_template_variables: [],
  // Template configs - Encerrar
  close_use_template: false,
  close_template_name: '',
  close_template_language: 'pt_BR',
  close_template_variables: [],
  // Template configs - Cancelar
  cancel_use_template: false,
  cancel_template_name: '',
  cancel_template_language: 'pt_BR',
  cancel_template_variables: [],
  // Template configs - Reabrir
  reopen_use_template: false,
  reopen_template_name: '',
  reopen_template_language: 'pt_BR',
  reopen_template_variables: [],
  // Template configs - Novo Ticket
  new_ticket_use_template: false,
  new_ticket_template_name: '',
  new_ticket_template_language: 'pt_BR',
  new_ticket_template_variables: [],
  // Template configs - Rejeição de ligação
  call_rejection_use_template: false,
  call_rejection_template_name: '',
  call_rejection_template_language: 'pt_BR',
  call_rejection_template_variables: [],
  // Template configs - Continuação de Atendimento (Janela 24h)
  send_msg_continuacao: false,
  continuacao_message: 'Olá! Gostaríamos de continuar o seu atendimento. Podemos ajudá-lo?',
  continuacao_use_template: false,
  continuacao_template_name: '',
  continuacao_template_language: 'pt_BR',
  continuacao_template_variables: [],
  // Encerramento por inatividade do cliente
  inactivity_enabled: false,
  inactivity_timeout_minutes: 30,
  inactivity_message: 'Seu atendimento foi encerrado por inatividade. Se precisar de ajuda, é só enviar uma nova mensagem!',
  inactivity_use_template: false,
  inactivity_template_name: '',
  inactivity_template_language: 'pt_BR',
  inactivity_template_variables: [],
};

export const whatsappConfigService = {
  async getConfig(): Promise<WhatsAppConfig> {
    const supabase = requireAuthenticatedClient();
    const { data, error } = await supabase
      .from('config_whatsapp')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar config WhatsApp:', error);
      throw error;
    }

    if (!data) {
      // Cria configuração padrão se não existir
      const newConfig = await this.saveConfig(DEFAULT_CONFIG);
      return newConfig;
    }

    // Merge with defaults for any missing fields and parse JSON fields
    const merged = { ...DEFAULT_CONFIG, ...data } as WhatsAppConfig;
    
    // Parse JSON fields that come as strings from DB
    const jsonFields = [
      'transfer_template_variables',
      'greeting_template_variables', 
      'close_template_variables',
      'cancel_template_variables',
      'reopen_template_variables',
      'new_ticket_template_variables',
      'call_rejection_template_variables',
      'continuacao_template_variables',
      'inactivity_template_variables'
    ] as const;
    
    jsonFields.forEach(field => {
      if (typeof merged[field] === 'string') {
        try {
          (merged as any)[field] = JSON.parse(merged[field] as any);
        } catch {
          (merged as any)[field] = [];
        }
      }
    });
    
    return merged;
  },

  async saveConfig(config: Partial<WhatsAppConfig>): Promise<WhatsAppConfig> {
    const supabase = requireAuthenticatedClient();
    const { data: existing } = await supabase
      .from('config_whatsapp')
      .select('id')
      .limit(1)
      .maybeSingle();

    // Prepare data - stringify JSON fields
    const preparedConfig = { ...config };
    const jsonFields = [
      'transfer_template_variables',
      'greeting_template_variables',
      'close_template_variables', 
      'cancel_template_variables',
      'reopen_template_variables',
      'new_ticket_template_variables',
      'call_rejection_template_variables',
      'continuacao_template_variables',
      'inactivity_template_variables'
    ] as const;
    
    jsonFields.forEach(field => {
      if (preparedConfig[field] && Array.isArray(preparedConfig[field])) {
        (preparedConfig as any)[field] = JSON.stringify(preparedConfig[field]);
      }
    });

    if (existing?.id) {
      // Update
      const { data, error } = await supabase
        .from('config_whatsapp')
        .update({
          ...preparedConfig,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data as WhatsAppConfig;
    } else {
      // Insert
      const defaultPrepared = { ...DEFAULT_CONFIG };
      jsonFields.forEach(field => {
        (defaultPrepared as any)[field] = JSON.stringify(defaultPrepared[field]);
      });
      
      const { data, error } = await supabase
        .from('config_whatsapp')
        .insert({
          ...defaultPrepared,
          ...preparedConfig,
        })
        .select()
        .single();

      if (error) throw error;
      return data as WhatsAppConfig;
    }
  },

  async updateField<K extends keyof WhatsAppConfig>(
    field: K,
    value: WhatsAppConfig[K]
  ): Promise<void> {
    const supabase = requireAuthenticatedClient();
    const { data: existing } = await supabase
      .from('config_whatsapp')
      .select('id')
      .limit(1)
      .maybeSingle();

    // Prepare value for JSON fields
    let preparedValue = value;
    const jsonFields = [
      'transfer_template_variables',
      'greeting_template_variables',
      'close_template_variables',
      'cancel_template_variables', 
      'reopen_template_variables',
      'new_ticket_template_variables',
      'call_rejection_template_variables',
      'continuacao_template_variables',
      'inactivity_template_variables'
    ];
    
    if (jsonFields.includes(field) && Array.isArray(value)) {
      preparedValue = JSON.stringify(value) as any;
    }

    if (existing?.id) {
      const { error } = await supabase
        .from('config_whatsapp')
        .update({
          [field]: preparedValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      // Cria com valor default e o campo especificado
      await this.saveConfig({ [field]: value } as Partial<WhatsAppConfig>);
    }
  }
};
