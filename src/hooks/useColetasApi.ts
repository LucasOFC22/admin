import { useState, useCallback } from 'react';
import { backendService } from '@/services/api/backendService';
import { ColetaApiData } from '@/types/coleta';

export interface ColetaFilterOptions {
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

// Mapear situação numérica para string (baseado nos valores da API)
// 0 = Pendente, 1 = Em Andamento, 2 = Realizada, etc.
export const getSituacaoLabel = (situacao: number | string | null | undefined): string => {
  if (situacao === null || situacao === undefined) return 'PENDENTE';
  if (typeof situacao === 'string') return situacao.toUpperCase();
  switch (situacao) {
    case 0: return 'PENDENTE';
    case 1: return 'ANDAMENTO';
    case 2: return 'REALIZADA';
    default: return 'PENDENTE';
  }
};

export const useColetasApi = () => {
  const [coletas, setColetas] = useState<ColetaApiData[]>([]);
  const [totalFromApi, setTotalFromApi] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarColetas = useCallback(async (filtros: ColetaFilterOptions) => {
    setIsLoading(true);
    setError(null);

    try {
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

      if (!response.success) {
        throw new Error(response.error || 'Erro ao buscar coletas');
      }

      // Extrair coletas da resposta - a API retorna estrutura aninhada
      let coletasData: ColetaApiData[] = [];
      let total = 0;
      
      if (Array.isArray(response.data)) {
        coletasData = response.data;
        total = response.data.length;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        coletasData = response.data.data;
        total = response.data.total ?? response.data.data.length;
      } else if (response.data?.coletas && Array.isArray(response.data.coletas)) {
        coletasData = response.data.coletas;
        total = response.data.total ?? response.data.coletas.length;
      }

      setColetas(coletasData);
      setTotalFromApi(total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar coletas');
      setColetas([]);
    } finally {
      setIsLoading(false);
    }
  }, []);


  const stats = {
    total: totalFromApi,
    pendentes: coletas.filter(c => getSituacaoLabel(c.situacao) === 'PENDENTE').length,
    realizadas: coletas.filter(c => getSituacaoLabel(c.situacao) === 'REALIZADA').length,
    andamento: coletas.filter(c => getSituacaoLabel(c.situacao) === 'ANDAMENTO').length,
  };

  return {
    coletas,
    isLoading,
    error,
    stats,
    buscarColetas,
  };
};
