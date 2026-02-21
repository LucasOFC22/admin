export interface Manifesto {
  nroManifesto: number;
  nroMdfe: number;
  tPeso: number;
  tVlrMerc: number;
  nroManifesto1: number;
  veictracaoPlaca: string;
  emissao: string;
  condutor: string;
  tipoAquisicao: string;
  chaveMdfe: string;
  dataStatus: string;
  idEmpresa: number;
  emitente: string;
  ufOrigem: string;
  ufDestino: string;
  menos24h: string;
  nroContrato?: string | number;
  ciot?: string;
  ciotNro?: string;
}

export interface ManifestoStats {
  total: number;
  menos24h: number;
  pesoTotal: number;
  valorTotal: number;
}

export interface EstadoStat {
  estado: string;
  count: number;
}
