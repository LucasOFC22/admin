/**
 * Mapper para converter CotacaoFormData para o payload esperado pela API /cotacao/editar
 */

interface CotacaoFormData {
  remetente: { idCliente: number; nome: string } | null;
  destinatario: { idCliente: number; nome: string } | null;
  tomador: { idCliente: number; nome: string } | null;
  remetenteEhTomador: boolean;
  destinatarioEhTomador: boolean;
  solicitante: string;
  cidadeOrigem: { idCidade: number; cidade: string; uf: string } | null;
  cidadeDestino: { idCidade: number; cidade: string; uf: string } | null;
  km: string;
  rota: string;
  validadeDias: number;
  diasPagamento: string;
  fatorCubagem: number;
  itens: Array<{
    id: string;
    descricao: string;
    quantidade: number;
    peso: number;
    volume: number;
    valorUnitario: number;
    altura?: number;
    largura?: number;
    profundidade?: number;
    m3?: number;
    pesoCubado?: number;
    un?: string;
  }>;
  // Novos campos de valores
  fretePeso: string;
  freteValor: string;
  secat: string;
  coleta: string;
  entrega: string;
  outros: string;
  pedagio: string;
  gris: string;
  tde: string;
  tas: string;
  agenda: string;
  restricao: string;
  tda: string;
  despacho: string;
  // Desconto e ICMS
  tipoDesconto: 'percentual' | 'valor';
  valorDesconto: string;
  percICMS: string;
  somarICM: boolean;
  percAcrescimo: string;
  // Tabela
  idTabela: number;
  nomeTabela: string;
  // Campos legados
  valorFrete: string;
  valorSeguro: string;
  valorAdValorem: string;
  valorPedagio: string;
  valorOutros: string;
  valorTotal: string;
  observacoes: string;
  observacoesInternas: string;
}

interface CotacaoEditPayload {
  pos: "U";
  idOrcamento: number;
  situacao: string;
  contato: string;
  idEmpresa: number;
  idCliente: number;
  idRemetente: number;
  idDestinatario: number;
  idConsignatario: number;
  idTabela: number;
  cidadeOrigem: string;
  ufOrigem: string;
  cidadeDestino: string;
  ufDestino: string;
  coleta: number;
  entrega: number;
  fretePeso: number;
  freteValor: number;
  secat: number;
  outros: number;
  pedagio: number;
  gris: number;
  tde: number;
  tas: number;
  agenda: number;
  restricao: number;
  tda: number;
  somarICM: boolean;
  km: number;
  percICM: number;
  valorTotal: number;
  ddPgto: number;
  validadeDias: number;
  obs: string;
  obsInterna: string;
  totPeso: number;
  totVolume: number;
  totM3: number;
  totValorMerc: number;
  totPesoCubado: number;
  descontoPerc: number;
  descontoValor: number;
  parceiroAcrescimo: number;
  parceiroValorAcrescimo: number;
  idCidadeOrigem: number;
  idCidadeDestino: number;
  rota: string;
  vlrDespacho: number;
  fatorCubagem: number;
  previsao: string | null;
  itens: Array<{
    vlrMerc: number;
    un: string;
    peso: number;
    vol: number;
    a: number;
    b: number;
    c: number;
    pesoCubado: number;
    m3: number;
    obs: string;
  }>;
}

/**
 * Mapeia os dados do formulário para o payload esperado pela API de edição de cotação
 */
export function mapFormDataToEditPayload(
  formData: CotacaoFormData,
  cotacaoOriginal: any
): CotacaoEditPayload {
  // Calcular totais dos itens
  const totPeso = formData.itens.reduce((sum, item) => sum + ((item.peso || 0) * (item.quantidade || 1)), 0);
  const totVolume = formData.itens.reduce((sum, item) => sum + (item.volume || item.quantidade || 0), 0);
  const totM3 = formData.itens.reduce((sum, item) => sum + (item.m3 || 0), 0);
  const totValorMerc = formData.itens.reduce((sum, item) => sum + (item.valorUnitario || 0), 0);
  const totPesoCubado = formData.itens.reduce((sum, item) => sum + (item.pesoCubado || 0), 0);

  // Mapear itens para o formato da API
  const itens = formData.itens.map(item => ({
    vlrMerc: item.valorUnitario || 0,
    un: item.un || 'UN',
    peso: item.peso || 0,
    vol: item.volume || item.quantidade || 0,
    a: item.altura || 0,
    b: item.largura || 0,
    c: item.profundidade || 0,
    pesoCubado: item.pesoCubado || 0,
    m3: item.m3 || 0,
    obs: item.descricao || ''
  }));

  // Parsear valores numéricos de strings
  const parseNumber = (value: string | number | undefined): number => {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    const parsed = parseFloat(String(value).replace(/[^\d.,]/g, '').replace(',', '.'));
    return isNaN(parsed) ? 0 : parsed;
  };

  // Calcular desconto
  const descontoPerc = formData.tipoDesconto === 'percentual' ? parseNumber(formData.valorDesconto) : 0;
  const descontoValor = formData.tipoDesconto === 'valor' ? parseNumber(formData.valorDesconto) : 0;

  // Calcular valor total
  const calcularTotal = () => {
    let subtotal = parseNumber(formData.fretePeso) + parseNumber(formData.freteValor) +
                   parseNumber(formData.secat) + parseNumber(formData.coleta) +
                   parseNumber(formData.entrega) + parseNumber(formData.outros) +
                   parseNumber(formData.pedagio) + parseNumber(formData.gris) +
                   parseNumber(formData.tde) + parseNumber(formData.tas) +
                   parseNumber(formData.agenda) + parseNumber(formData.restricao) +
                   parseNumber(formData.tda) + parseNumber(formData.despacho);

    // Aplicar desconto
    if (descontoPerc > 0) {
      subtotal -= subtotal * (descontoPerc / 100);
    } else if (descontoValor > 0) {
      subtotal -= descontoValor;
    }

    // Aplicar ICMS
    if (formData.somarICM && parseNumber(formData.percICMS) > 0) {
      subtotal += subtotal * (parseNumber(formData.percICMS) / 100);
    }

    // Aplicar acréscimo
    if (parseNumber(formData.percAcrescimo) > 0) {
      subtotal += subtotal * (parseNumber(formData.percAcrescimo) / 100);
    }

    return subtotal;
  };

  return {
    pos: "U",
    idOrcamento: cotacaoOriginal.idOrcamento || cotacaoOriginal.id,
    situacao: cotacaoOriginal.situacao || cotacaoOriginal.status || 'PENDENTE',
    contato: formData.solicitante || cotacaoOriginal.contato || '',
    idEmpresa: cotacaoOriginal.idEmpresa || 1,
    idCliente: formData.tomador?.idCliente || cotacaoOriginal.idCliente || 0,
    idRemetente: formData.remetente?.idCliente || cotacaoOriginal.idRemetente || 0,
    idDestinatario: formData.destinatario?.idCliente || cotacaoOriginal.idDestinatario || 0,
    idConsignatario: cotacaoOriginal.idConsignatario || 0,
    idTabela: formData.idTabela || cotacaoOriginal.idTabela || 0,
    cidadeOrigem: formData.cidadeOrigem?.cidade || cotacaoOriginal.cidadeOrigem || '',
    ufOrigem: formData.cidadeOrigem?.uf || cotacaoOriginal.ufOrigem || '',
    cidadeDestino: formData.cidadeDestino?.cidade || cotacaoOriginal.cidadeDestino || '',
    ufDestino: formData.cidadeDestino?.uf || cotacaoOriginal.ufDestino || '',
    coleta: parseNumber(formData.coleta),
    entrega: parseNumber(formData.entrega),
    fretePeso: parseNumber(formData.fretePeso),
    freteValor: parseNumber(formData.freteValor),
    secat: parseNumber(formData.secat),
    outros: parseNumber(formData.outros),
    pedagio: parseNumber(formData.pedagio),
    gris: parseNumber(formData.gris),
    tde: parseNumber(formData.tde),
    tas: parseNumber(formData.tas),
    agenda: parseNumber(formData.agenda),
    restricao: parseNumber(formData.restricao),
    tda: parseNumber(formData.tda),
    somarICM: formData.somarICM || false,
    km: parseNumber(formData.km),
    percICM: parseNumber(formData.percICMS),
    valorTotal: calcularTotal(),
    ddPgto: parseNumber(formData.diasPagamento),
    validadeDias: formData.validadeDias || 7,
    obs: formData.observacoes || '',
    obsInterna: formData.observacoesInternas || '',
    totPeso,
    totVolume,
    totM3,
    totValorMerc,
    totPesoCubado,
    descontoPerc,
    descontoValor,
    parceiroAcrescimo: parseNumber(formData.percAcrescimo),
    parceiroValorAcrescimo: 0,
    idCidadeOrigem: formData.cidadeOrigem?.idCidade || cotacaoOriginal.idCidadeOrigem || 0,
    idCidadeDestino: formData.cidadeDestino?.idCidade || cotacaoOriginal.idCidadeDestino || 0,
    rota: formData.rota || cotacaoOriginal.rota || '',
    vlrDespacho: parseNumber(formData.despacho),
    fatorCubagem: formData.fatorCubagem || 300,
    previsao: cotacaoOriginal.previsao || null,
    itens
  };
}
