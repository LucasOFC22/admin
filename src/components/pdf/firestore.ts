// Type definitions for Firestore documents
export interface Address {
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipcode?: string;
}

export interface PartyDetails {
  name?: string;
  document?: string;
  address?: Address;
}

export interface CargoDetails {
  description?: string;
  declaredValue?: number | string;
  weight?: number | string;
  height?: number | string;
  length?: number | string;
  depth?: number | string;
  notes?: string;
}

export interface ContactDetails {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  requestorType?: string;
}

export interface Cotacao {
  id?: string;
  quoteId?: string;
  status?: string;
  criadoEm?: any; // Firebase timestamp
  remetente?: PartyDetails;
  destinatario?: PartyDetails;
  carga?: CargoDetails;
  contato?: ContactDetails;
  // Other fields might be here
  [key: string]: any;
}
