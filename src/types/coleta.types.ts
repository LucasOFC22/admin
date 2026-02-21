// Tipos para integração com API /coleta/criar

export interface ColetaLocalPayload {
  cep: string;
  endereco: string;
  numero?: string;
  bairro: string;
  cidade: string;
  uf: string;
  idCidade: number | null;
}

export interface ColetaItemPayload {
  peso: number;
  valorMercadoria: number;
  tipoMercadoria: string;
  natureza?: string;
  volume: number;
  altura: number;
  largura: number;
  profundidade: number;
  m3: number;
  pesoCubado: number;
  observacoes: string;
  chaveAcessoNfe: string;
  numeroNf: string;
  un: string;
}

export interface ColetaPayload {
  idEmpresa: number;
  idColeta?: number;
  nroColeta?: number;
  tipoRegistro: 'coleta';
  status?: string;
  cidadeOrigem?: string;
  ufOrigem?: string;
  idCidadeOrigem: number;
  cidadeDestino?: string;
  ufDestino?: string;
  idCidadeDestino: number;
  idRemetente: number;
  nomeRemetente?: string;
  cpfCnpjRemetente?: string;
  cidadeRemetente?: string;
  ufRemetente?: string;
  bairroRemetente?: string;
  idCidadeRemetente?: number;
  idDestinatario: number;
  nomeDestinatario?: string;
  cpfCnpjDestinatario?: string;
  cidadeDestinatario?: string;
  ufDestinatario?: string;
  bairroDestinatario?: string;
  idCidadeDestinatario?: number;
  idCliente?: number;
  nomeCliente?: string;
  localColeta?: ColetaLocalPayload;
  localEntrega?: ColetaLocalPayload;
  // Campos de endereço diretos (compatibilidade)
  enderecoColeta?: string;
  numeroColeta?: string;
  bairroColeta?: string;
  cepColeta?: string;
  enderecoEntrega?: string;
  numeroEntrega?: string;
  bairroEntrega?: string;
  cepEntrega?: string;
  nomeSolicitante: string;
  dataColeta: string;
  dataPrevisaoEntrega?: string | null;
  horarioColeta: string;
  horarioInicioAtendimento: string;
  horarioFimAtendimento: string;
  paraAlmoco?: boolean;
  horarioInicioAlmoco?: string;
  horarioFimAlmoco?: string;
  observacoes: string;
  tipoVeiculo?: string;
  totPeso?: number;
  totVolume?: number;
  totM3?: number;
  totValorMerc?: number;
  totPesoCubado?: number;
  itens: ColetaItemPayload[];
}

export interface ColetaResponseData {
  ok?: boolean;
  idColeta: number;
  nroColeta?: number;
  operacao?: string;
}

export interface ColetaResponse {
  success?: boolean;
  data?: ColetaResponseData;
  idColeta?: number;
  nroColeta?: number;
}
