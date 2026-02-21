import { backendService } from '@/services/api/backendService';

interface RastreamentoResponse {
  success: boolean;
  data?: any;
  error?: string;
  details?: string;
  consulta?: {
    cpfcnpj: string;
    nro_nf: string;
    timestamp: string;
  };
}

export async function rastrearMercadoria(cpfcnpj: string, nro_nf: string): Promise<RastreamentoResponse> {
  try {
    const response = await backendService.rastrearMercadoria(cpfcnpj, nro_nf);

    if (!response.success) {
      throw new Error(response.error || 'Erro ao rastrear mercadoria');
    }

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Erro ao rastrear mercadoria:', error);
    return {
      success: false,
      error: 'Erro de conexão ao tentar rastrear mercadoria'
    };
  }
}
