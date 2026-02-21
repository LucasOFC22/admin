export interface ValeViagemItem {
  id: string;
  descricao: string;
  valor: number;
}

export interface Viagem {
  id: string;
  data: string;
  origem: string;
  destino: string;
  adiantamento: number;
  valorFrete: number;
  valorMotorista: number;
}

export interface Despesas {
  combustivel: number;
  quantLitros: number;
  notas: number;
  quantArla: number;
  extra: number;
  pedagio: number;
  motorista: number;
}

export interface TipoCaminhao {
  id: string;
  nome: string;
  descricao?: string;
  percentual: number;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Malote {
  id: string;
  numero?: number;
  motorista: string;
  motoristaId?: number;
  telefoneMotorista?: string;
  percentual: number;
  valeViagem: number;
  valeViagemItens: ValeViagemItem[];
  viagens: Viagem[];
  despesas: Despesas;
  createdAt: string;
  updatedAt: string;
  // Tipo de caminhão
  tipoCaminhaoId?: string;
  tipoCaminhaoNome?: string;
  // Assinatura digital
  assinado: boolean;
  assinaturaData?: string;
  assinaturaIp?: string;
  assinaturaUserAgent?: string;
  assinaturaImagem?: string;
  tokenAssinatura?: string;
  tokenValidoAte?: string;
}

export interface MaloteTotais {
  totalFaturamento: number;
  totalAdiantamento: number;
  totalMotorista: number;
  soma: number;
  vale: number;
}

export const createEmptyViagem = (): Omit<Viagem, 'id'> => ({
  data: new Date().toISOString().split('T')[0],
  origem: '',
  destino: '',
  adiantamento: 0,
  valorFrete: 0,
  valorMotorista: 0,
});

export const createEmptyMalote = (): Omit<Malote, 'id' | 'createdAt' | 'updatedAt' | 'assinado'> => ({
  motorista: '',
  motoristaId: undefined,
  telefoneMotorista: '',
  percentual: 30,
  valeViagem: 0,
  valeViagemItens: [],
  tipoCaminhaoId: undefined,
  tipoCaminhaoNome: undefined,
  viagens: [],
  despesas: {
    combustivel: 0,
    quantLitros: 0,
    notas: 0,
    quantArla: 0,
    extra: 0,
    pedagio: 0,
    motorista: 0,
  },
});

export const calcularTotais = (malote: Partial<Malote>): MaloteTotais => {
  const viagens = malote.viagens || [];
  const despesas = malote.despesas || createEmptyMalote().despesas;
  const valeViagem = malote.valeViagem || 0;

  const totalFaturamento = viagens.reduce((acc, v) => acc + (v.valorFrete || 0), 0);
  const totalAdiantamento = viagens.reduce((acc, v) => acc + (v.adiantamento || 0), 0);
  const totalMotorista = viagens.reduce((acc, v) => acc + (v.valorMotorista || 0), 0);

  const soma = 
    (despesas.combustivel || 0) +
    (despesas.notas || 0) +
    (despesas.extra || 0) +
    (despesas.pedagio || 0) +
    (despesas.motorista || 0) +
    totalAdiantamento;

  const vale = valeViagem - soma;

  return {
    totalFaturamento,
    totalAdiantamento,
    totalMotorista,
    soma,
    vale,
  };
};

// Helpers para converter entre formato Supabase e formato local
export const maloteFromSupabase = (data: any, viagens: any[], valeViagemItens: any[] = []): Malote => ({
  id: data.id,
  numero: data.numero,
  motorista: data.motorista,
  motoristaId: data.motorista_id,
  telefoneMotorista: data.telefone_motorista,
  percentual: Number(data.percentual) || 0,
  valeViagem: Number(data.vale_viagem) || 0,
  valeViagemItens: valeViagemItens.map((item: any) => ({
    id: item.id,
    descricao: item.descricao || '',
    valor: Number(item.valor) || 0,
  })),
  tipoCaminhaoId: data.tipo_caminhao_id,
  tipoCaminhaoNome: data.tipos_caminhao?.nome,
  viagens: viagens.map((v: any) => ({
    id: v.id,
    data: v.data,
    origem: v.origem,
    destino: v.destino,
    adiantamento: Number(v.adiantamento) || 0,
    valorFrete: Number(v.valor_frete) || 0,
    valorMotorista: Number(v.valor_motorista) || 0,
  })),
  despesas: {
    combustivel: Number(data.combustivel) || 0,
    quantLitros: Number(data.quant_litros) || 0,
    notas: Number(data.notas) || 0,
    quantArla: Number(data.quant_arla) || 0,
    extra: Number(data.extra) || 0,
    pedagio: Number(data.pedagio) || 0,
    motorista: Number(data.despesa_motorista) || 0,
  },
  createdAt: data.created_at,
  updatedAt: data.updated_at,
  assinado: data.assinado || false,
  assinaturaData: data.assinatura_data,
  assinaturaIp: data.assinatura_ip,
  assinaturaUserAgent: data.assinatura_user_agent,
  assinaturaImagem: data.assinatura_imagem,
  tokenAssinatura: data.token_assinatura,
  tokenValidoAte: data.token_valido_ate,
});

export const tipoCaminhaoFromSupabase = (data: any): TipoCaminhao => ({
  id: data.id,
  nome: data.nome,
  descricao: data.descricao,
  percentual: Number(data.percentual) || 0,
  ativo: data.ativo ?? true,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

export const maloteToSupabase = (malote: Omit<Malote, 'id' | 'createdAt' | 'updatedAt' | 'assinado'>) => {
  const totais = calcularTotais(malote);
  
  return {
    motorista: malote.motorista,
    motorista_id: malote.motoristaId,
    telefone_motorista: malote.telefoneMotorista,
    percentual: malote.percentual,
    vale_viagem: malote.valeViagem,
    tipo_caminhao_id: malote.tipoCaminhaoId || null,
    combustivel: malote.despesas.combustivel,
    quant_litros: malote.despesas.quantLitros,
    notas: malote.despesas.notas,
    quant_arla: malote.despesas.quantArla,
    extra: malote.despesas.extra,
    pedagio: malote.despesas.pedagio,
    despesa_motorista: malote.despesas.motorista,
    total_faturamento: totais.totalFaturamento,
    total_adiantamento: totais.totalAdiantamento,
    total_motorista: totais.totalMotorista,
    soma_despesas: totais.soma,
    saldo_vale: totais.vale,
  };
};

export const viagemToSupabase = (viagem: Viagem, maloteId: string) => ({
  malote_id: maloteId,
  data: viagem.data,
  origem: viagem.origem,
  destino: viagem.destino,
  adiantamento: viagem.adiantamento,
  valor_frete: viagem.valorFrete,
  valor_motorista: viagem.valorMotorista,
});

export const valeViagemItemToSupabase = (item: ValeViagemItem, maloteId: string) => ({
  malote_id: maloteId,
  descricao: item.descricao,
  valor: item.valor,
});
