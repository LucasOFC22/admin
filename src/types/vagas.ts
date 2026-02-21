export interface VagaEmprego {
  id: number;
  titulo: string;
  cidade: string;
  descricao: string;
  requisitos?: string;
  vagas?: number;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateVagaData {
  titulo: string;
  cidade: string;
  descricao: string;
  requisitos?: string;
  vagas?: number;
  ativo?: boolean;
}

export interface UpdateVagaData extends Partial<CreateVagaData> {
  updated_at?: string;
}
