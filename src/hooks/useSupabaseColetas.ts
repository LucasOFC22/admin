import { useState, useCallback } from 'react';
import { backendService } from '@/services/api/backendService';

export interface ColetaData {
  id: number;
  idColeta?: number;
  nroColeta?: number;
  solicitante_nome: string;
  solicitante_telefone: string;
  solicitante_email: string;
  coleta_rua: string;
  coleta_numero: string;
  coleta_complemento?: string;
  coleta_cidade: string;
  coleta_bairro: string;
  coleta_cep: string;
  coleta_uf?: string;
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
  condutor?: string;
  placa?: string;
  dias?: number;
  data_entrega?: string;
}

export interface FilterOptions {
  empresa?: string;
  numeroColetaInicial?: string;
  numeroColetaFinal?: string;
  situacao?: string;
  tipoRegistro?: string;
  dataColetaInicio?: string;
  dataColetaFim?: string;
  dataEmissaoInicio?: string;
  dataEmissaoFim?: string;
  remetente?: string;
  destinatario?: string;
  cidadeOrigem?: string;
  cidadeDestino?: string;
  ufColeta?: string;
}

// Mapeia situação da API para status interno
const mapSituacaoToStatus = (situacao: string): 'Pendente' | 'Implantado' => {
  const situacaoUpper = situacao?.toUpperCase()?.trim();
  if (situacaoUpper === 'REALIZADA' || situacaoUpper === 'IMPLANTADO' || situacaoUpper === 'IMPLANTADA') {
    return 'Implantado';
  }
  return 'Pendente';
};

// Mapeia dados da API para o formato interno
const mapApiToColetaData = (item: any): ColetaData => {
  return {
    id: item.idColeta || item.id || 0,
    idColeta: item.idColeta,
    nroColeta: item.nroColeta,
    solicitante_nome: item.solicitante || '',
    solicitante_telefone: item.telefone || '',
    solicitante_email: item.email || '',
    coleta_rua: item.coletaEnd || item.localColeta?.endereco || '',
    coleta_numero: '',
    coleta_complemento: '',
    coleta_cidade: item.coletaCidade || item.localColeta?.cidade || '',
    coleta_bairro: item.coletaBairro || item.localColeta?.bairro || '',
    coleta_cep: item.localColeta?.cep || '',
    coleta_uf: item.coletaUf || '',
    coleta_ponto_referencia: '',
    coleta_horario_funcionamento_inicio: item.horaColeta || item.horarioInicioAtendimento || '',
    coleta_horario_funcionamento_fim: item.horarioFimAtendimento || '',
    coleta_horario_almoco_inicio: '',
    coleta_horario_almoco_fim: '',
    mercadoria_descricao: item.obs || item.itens?.[0]?.un || 'Mercadoria',
    mercadoria_peso: item.tPeso || item.itens?.[0]?.peso || 0,
    mercadoria_valor: item.tVlrMerc || item.itens?.[0]?.vlrMerc || 0,
    mercadoria_comprimento: item.itens?.[0]?.c || 0,
    mercadoria_largura: item.itens?.[0]?.b || 0,
    mercadoria_altura: item.itens?.[0]?.a || 0,
    mercadoria_quantidade: item.itens?.[0]?.vol || 1,
    remetente: item.remetente || item.nomeRemetente || '',
    remetente_telefone: '',
    remetente_documento: '',
    remetente_rua: item.coletaEnd || '',
    remetente_numero: '',
    remetente_complemento: '',
    remetente_cidade: item.coletaCidade || item.cidadeOrigem || '',
    remetente_bairro: item.coletaBairro || '',
    remetente_cep: '',
    destinatario: item.nomeDestinatario || '',
    destinatario_telefone: '',
    destinatario_documento: '',
    destinatario_rua: item.localEntrega?.endereco || '',
    destinatario_numero: '',
    destinatario_complemento: '',
    destinatario_cidade: item.localEntrega?.cidade || '',
    destinatario_bairro: item.localEntrega?.bairro || '',
    destinatario_cep: item.localEntrega?.cep || '',
    observacoes: item.obs || item.itens?.[0]?.obs || '',
    nota_fiscal: item.itens?.[0]?.notas || '',
    status: mapSituacaoToStatus(item.situacao),
    criado_em: item.emissao || item.diaColeta || item.dataColetar || new Date().toISOString(),
    implantada_em: item.dataImplantacao || undefined,
    condutor: item.condutor || item.condutor1 || '',
    placa: item.placa || item.placa1 || '',
    dias: item.dias || 0,
    data_entrega: item.dataEntrega || ''
  };
};

export const useSupabaseColetas = () => {
  const [coletas, setColetas] = useState<ColetaData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarColetas = useCallback(async (filtros: FilterOptions) => {
    setIsLoading(true);
    setError(null);

    try {
      // Monta os filtros para a API DB Frete
      const apiFilters: Record<string, any> = {};

      // Empresas: se for 'all' ou vazio, enviar "1,2"
      if (!filtros.empresa || filtros.empresa === 'all') {
        apiFilters.empresas = '1,2';
      } else {
        apiFilters.empresas = filtros.empresa;
      }

      // Número da coleta (início e fim)
      if (filtros.numeroColetaInicial) {
        apiFilters.nro_coleta_inicio = filtros.numeroColetaInicial;
      }
      if (filtros.numeroColetaFinal) {
        apiFilters.nro_coleta_fim = filtros.numeroColetaFinal;
      }
      
      // Remetente e destinatário por ID
      if (filtros.remetente) {
        apiFilters.id_remetente = filtros.remetente;
      }
      if (filtros.destinatario) {
        apiFilters.id_destinatario = filtros.destinatario;
      }
      
      // Cidades
      if (filtros.cidadeOrigem) {
        apiFilters.coleta_id_cidade = filtros.cidadeOrigem;
      }
      if (filtros.cidadeDestino) {
        apiFilters.DEST_ID_CIDADE = filtros.cidadeDestino;
      }
      
      // UF
      if (filtros.ufColeta) {
        apiFilters.coleta_uf = filtros.ufColeta;
      }
      
      // Datas de coleta
      if (filtros.dataColetaInicio) {
        apiFilters.coleta_inicio = filtros.dataColetaInicio;
      }
      if (filtros.dataColetaFim) {
        apiFilters.coleta_fim = filtros.dataColetaFim;
      }
      
      // Datas de emissão
      if (filtros.dataEmissaoInicio) {
        apiFilters.emissao_inicio = filtros.dataEmissaoInicio;
      }
      if (filtros.dataEmissaoFim) {
        apiFilters.emissao_fim = filtros.dataEmissaoFim;
      }
      
      // Status/Situação como tipo de registro
      if (filtros.situacao && filtros.situacao !== 'todos') {
        apiFilters.tipo_registro = filtros.situacao;
      }
      
      // Tipo de registro
      if (filtros.tipoRegistro && filtros.tipoRegistro !== 'todos') {
        apiFilters.tipo_registro = filtros.tipoRegistro;
      }

      const response = await backendService.buscarColetas(apiFilters);
      
      console.log('📦 [useSupabaseColetas] Resposta bruta:', response);

      if (!response.success) {
        throw new Error(response.error || 'Erro ao buscar coletas');
      }

      // A API retorna estrutura aninhada: response.data.data contém o array
      let rawData: any[] = [];
      
      if (Array.isArray(response.data)) {
        rawData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        // Estrutura aninhada: { success: true, data: { success: true, data: [...] } }
        rawData = response.data.data;
      } else if (response.data?.coletas && Array.isArray(response.data.coletas)) {
        rawData = response.data.coletas;
      }

      console.log('📦 [useSupabaseColetas] Dados extraídos:', rawData.length, 'registros');
      console.log('📦 [useSupabaseColetas] Primeiro item:', rawData[0]);

      // Mapear dados da API para o formato esperado
      const coletasData = rawData.map((item: any) => mapApiToColetaData(item));

      console.log('📦 [useSupabaseColetas] Coletas mapeadas:', coletasData.length, 'registros');
      console.log('📦 [useSupabaseColetas] Primeira coleta mapeada:', coletasData[0]);
      
      setColetas(coletasData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar coletas');
      setColetas([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateStatus = async (id: number, novoStatus: 'Pendente' | 'Implantado') => {
    // TODO: Implementar atualização de status
    console.log('Atualização de status pendente:', id, novoStatus);
  };

  const stats = {
    total: coletas.length,
    pendentes: coletas.filter(c => c.status === 'Pendente').length,
    implantadas: coletas.filter(c => c.status === 'Implantado').length,
  };

  return {
    coletas,
    isLoading,
    error,
    stats,
    buscarColetas,
    updateStatus
  };
};
