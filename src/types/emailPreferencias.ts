// Tipos para preferências de email do usuário

export interface EmailPreferenciasUsuario {
  id: string;
  usuario_id: string;
  email_conta_id: string | null;
  
  // Assinatura
  assinatura_ativa: boolean;
  assinatura_texto: string | null;
  assinatura_html: string | null;
  
  // Preferências de visualização
  mensagens_por_pagina: 20 | 50 | 100;
  marcar_lido_automatico: boolean;
  pasta_padrao: 'inbox' | 'sent' | 'drafts' | 'trash';
  view: 'list' | 'split';
  
  // Preferências de composição
  responder_com_citacao: boolean;
  formato_padrao: 'html' | 'texto';
  
  // Metadados
  created_at: string;
  updated_at: string;
}

export interface EmailPreferenciasForm {
  assinatura_ativa: boolean;
  assinatura_texto: string;
  assinatura_html: string;
  mensagens_por_pagina: 20 | 50 | 100;
  marcar_lido_automatico: boolean;
  pasta_padrao: 'inbox' | 'sent' | 'drafts' | 'trash';
  view: 'list' | 'split';
  responder_com_citacao: boolean;
  formato_padrao: 'html' | 'texto';
}

export interface EmailAssinatura {
  ativa: boolean;
  conteudo: string;
  is_html: boolean;
}

export type ComposeModo = 'new' | 'reply' | 'replyAll' | 'forward';

export interface ComposeEmailData {
  modo: ComposeModo;
  para: string[];
  cc: string[];
  assunto: string;
  corpo: string;
  emailOriginal?: {
    id: string;
    de: string;
    de_nome?: string;
    para: string[];
    cc?: string[];
    assunto: string;
    corpo: string;
    data: string;
  };
}

export const PASTAS_LABELS: Record<string, string> = {
  inbox: 'Caixa de Entrada',
  sent: 'Enviados',
  drafts: 'Rascunhos',
  trash: 'Lixeira',
  spam: 'Spam'
};
