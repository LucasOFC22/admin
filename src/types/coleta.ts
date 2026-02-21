// Tipo para dados da API de coletas
export interface ColetaApiData {
  descTipoRegistro?: string;
  idColeta: number;
  idEmpresa?: number;
  placa?: string;
  condutor?: string;
  emissao?: string;
  nroColeta?: number;
  dias?: number;
  solicitante?: string;
  remetente?: string;
  coletaCidade?: string;
  coletaUf?: string;
  coletaBairro?: string;
  coletaEnd?: string;
  diaColeta?: string;
  horaColeta?: string;
  almoco?: string;
  tPeso?: number;
  tVlrMerc?: number;
  obs?: string;
  dataEntrega?: string;
  situacao?: string | number;
  condutor1?: string;
  placa1?: string;
}

// Tipo para dados formatados internamente (legado)
export interface ColetaData {
  id: number;
  idColeta?: number;
  solicitante_nome: string;
  solicitante_telefone: string;
  solicitante_email: string;
  coleta_rua: string;
  coleta_numero: string;
  coleta_complemento?: string;
  coleta_cidade: string;
  coleta_bairro: string;
  coleta_cep: string;
  coleta_ponto_referencia?: string;
  coleta_horario_funcionamento_inicio?: string;
  coleta_horario_funcionamento_fim?: string;
  coleta_horario_almoco_inicio?: string;
  coleta_horario_almoco_fim?: string;
  mercadoria_descricao: string;
  mercadoria_peso: number;
  mercadoria_valor: number;
  mercadoria_comprimento: number;
  mercadoria_largura: number;
  mercadoria_altura: number;
  mercadoria_quantidade: number;
  remetente: string;
  remetente_telefone: string;
  remetente_documento: string;
  remetente_rua: string;
  remetente_numero: string;
  remetente_complemento?: string;
  remetente_cidade: string;
  remetente_bairro: string;
  remetente_cep: string;
  destinatario: string;
  destinatario_telefone: string;
  destinatario_documento: string;
  destinatario_rua: string;
  destinatario_numero: string;
  destinatario_complemento?: string;
  destinatario_cidade: string;
  destinatario_bairro: string;
  destinatario_cep: string;
  observacoes?: string;
  nota_fiscal?: string;
  status: 'Pendente' | 'Implantado';
  criado_em: string;
  implantada_em?: string;
}

/**
 * Generic Coleta type for PDF generation and other uses
 * Uses Record<string, any> for flexibility with legacy code
 */
export type Coleta = Record<string, any> & {
  id: string | number;
  status: string;
};
