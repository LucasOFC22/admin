export interface Candidatura {
  id: number;
  vaga_id: number | null;
  vaga_titulo: string | null;
  nome: string;
  email: string;
  telefone: string | null;
  cidade: string | null;
  mensagem: string | null;
  curriculo: string | null;
  created_at: string;
}

export interface CandidaturaMensagem {
  colaborador?: string;
  consentimento_whatsapp?: boolean;
  cpf?: string;
  data_nascimento?: string;
  nome_pai?: string;
  nome_mae?: string;
}
