// Tipos para o sistema de contatos CardDAV

export interface CardDavContact {
  uid: string;
  etag?: string;
  href?: string;
  nome: string;
  sobrenome?: string;
  nomeCompleto: string;
  email: string;
  emailSecundario?: string;
  telefone?: string;
  celular?: string;
  empresa?: string;
  cargo?: string;
  notas?: string;
  foto?: string;
  atualizado?: string;
}

export interface CardDavContactFormData {
  nome: string;
  sobrenome?: string;
  email: string;
  emailSecundario?: string;
  telefone?: string;
  celular?: string;
  empresa?: string;
  cargo?: string;
  notas?: string;
}

export interface CardDavRequest {
  conta_id: string;
  action: 'list' | 'get' | 'create' | 'update' | 'delete' | 'search';
  contact?: CardDavContactFormData & { uid?: string };
  uid?: string;
  query?: string;
}

export interface CardDavResponse {
  success: boolean;
  contacts?: CardDavContact[];
  contact?: CardDavContact;
  error?: string;
}

export interface AutocompleteContact {
  uid: string;
  nome: string;
  email: string;
  tipo: 'carddav' | 'recente';
}
