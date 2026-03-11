import { n8nApi } from './apiService';
import { backendService } from '@/services/api/backendService';
import { Manifesto } from '@/types/manifesto';

class N8nManifestosService {
  async getManifestos(): Promise<Manifesto[]> {
    const response = await backendService.getManifestos();

    if (!response.success) {
      return [];
    }

    const data = response.data;

    // Função para normalizar o manifesto (mapear ciotNro -> ciot)
    const normalizeManifesto = (item: any): Manifesto => {
      const manifesto = item.json || item;
      return {
        ...manifesto,
        ciot: manifesto.ciot || manifesto.ciotNro || '',
        nroContrato: manifesto.nroContrato?.toString() || ''
      };
    };

    // Se já vier como array direto
    if (Array.isArray(data)) {
      return data.map(normalizeManifesto);
    }
    
    // Se vier como objeto com array dentro
    if (data && typeof data === 'object') {
      const possibleArrays = [data.data, data.manifestos, data.items, data.json];
      for (const arr of possibleArrays) {
        if (Array.isArray(arr)) {
          return arr.map(normalizeManifesto);
        }
      }
      
      if (data.json) {
        const result = Array.isArray(data.json) ? data.json : [data.json];
        return result.map(normalizeManifesto);
      }
    }
    
    return [];
  }

  async imprimirManifesto(manifesto: Manifesto): Promise<void> {
    try {
      const baseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ulkppucdnmvyfsnarpth.supabase.co';
      const response = await fetch(
        `${baseUrl}/functions/v1/imprimir-mdfe/${manifesto.chaveMdfe}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.sucesso && !data.success) {
        throw new Error(data.error || 'Erro ao imprimir manifesto');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Erro ao imprimir manifesto');
    }
  }

  async encerrarManifesto(manifesto: Manifesto): Promise<void> {
    try {
      const response = await fetch(
        `https://kong.fptranscargas.com.br/functions/v1/encerrar-mdfe/${manifesto.chaveMdfe}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.sucesso && !data.success) {
        throw new Error(data.error || 'Erro ao encerrar manifesto');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Erro ao encerrar manifesto');
    }
  }

  async cancelarManifesto(manifesto: Manifesto): Promise<void> {
    const response = await n8nApi.makeN8nRequest({
      eventType: 'manifestos',
      acao: 'cancelar',
      nroManifesto: manifesto.nroManifesto,
      chaveMdfe: manifesto.chaveMdfe
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Erro ao cancelar manifesto');
    }
  }
}

export const n8nManifestosService = new N8nManifestosService();
