export interface TemplateData {
  id: string;
  name: string;
  language: string;
  category: string;
  status: string;
}

export interface ContatoWhatsApp {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  perfil?: string;
}

export interface CampanhaFormData {
  nome: string;
  descricao: string;
  conexaoId: string;
  templateName: string;
  templateLanguage: string;
  flowId: string;
  agendarEnvio: boolean;
  dataAgendamento: string;
  horaAgendamento: string;
  enviarParaTodos: boolean;
  selectedContatos: Set<string>;
  searchContato: string;
}

export interface Conexao {
  id: string;
  nome: string;
  status: string;
  whatsapp_business_account_id?: string;
}

export interface Flow {
  id: string;
  name: string;
  description?: string;
}

export const INITIAL_FORM_DATA: CampanhaFormData = {
  nome: '',
  descricao: '',
  conexaoId: '',
  templateName: '',
  templateLanguage: 'pt_BR',
  flowId: 'none',
  agendarEnvio: false,
  dataAgendamento: '',
  horaAgendamento: '',
  enviarParaTodos: false,
  selectedContatos: new Set(),
  searchContato: ''
};

export const WIZARD_STEPS = [
  { id: 1, title: 'Informações', description: 'Nome e conexão' },
  { id: 2, title: 'Template', description: 'Mensagem a enviar' },
  { id: 3, title: 'Contatos', description: 'Destinatários' },
  { id: 4, title: 'Confirmar', description: 'Revisar e criar' }
] as const;

export type WizardStep = 1 | 2 | 3 | 4;
