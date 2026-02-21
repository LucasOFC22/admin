import { useState, useEffect } from 'react';
import { n8nManifestosService } from '@/services/n8n/manifestosService';
import { Manifesto } from '@/types/manifesto';
import { useNotification } from '@/hooks/useCustomNotifications';
import { useActivityLogger } from '@/hooks/useActivityLogger';

export const useManifestos = () => {
  const [manifestos, setManifestos] = useState<Manifesto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { success, error: showError } = useNotification();
  const { logActivity } = useActivityLogger();

  const fetchManifestos = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await n8nManifestosService.getManifestos();
      // Ensure data is always an array
      const manifestosArray = Array.isArray(data) ? data : [];
      setManifestos(manifestosArray);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar manifestos';
      setError(errorMessage);
      setManifestos([]); // Reset to empty array on error
      showError('Erro', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const imprimirManifesto = async (manifesto: Manifesto) => {
    try {
      await n8nManifestosService.imprimirManifesto(manifesto);
      
      await logActivity({
        acao: 'manifesto_impresso',
        modulo: 'manifestos',
        detalhes: {
          manifesto_numero: manifesto.nroManifesto,
          condutor: manifesto.condutor,
          placa: manifesto.veictracaoPlaca
        }
      });
      
      success('Sucesso', `Manifesto #${manifesto.nroManifesto} enviado para impressão`);
      await fetchManifestos(); // Atualizar lista
    } catch (err) {
      showError('Erro', err instanceof Error ? err.message : 'Erro ao imprimir manifesto');
    }
  };

  const encerrarManifesto = async (manifesto: Manifesto) => {
    try {
      await n8nManifestosService.encerrarManifesto(manifesto);
      
      await logActivity({
        acao: 'manifesto_encerrado',
        modulo: 'manifestos',
        detalhes: {
          manifesto_numero: manifesto.nroManifesto,
          condutor: manifesto.condutor,
          placa: manifesto.veictracaoPlaca
        }
      });
      
      success('Sucesso', `Manifesto #${manifesto.nroManifesto} encerrado com sucesso`);
      await fetchManifestos(); // Recarregar lista
    } catch (err) {
      showError('Erro', err instanceof Error ? err.message : 'Erro ao encerrar manifesto');
    }
  };

  const cancelarManifesto = async (manifesto: Manifesto) => {
    try {
      await n8nManifestosService.cancelarManifesto(manifesto);
      
      await logActivity({
        acao: 'manifesto_cancelado',
        modulo: 'manifestos',
        detalhes: {
          manifesto_numero: manifesto.nroManifesto,
          condutor: manifesto.condutor,
          placa: manifesto.veictracaoPlaca
        }
      });
      
      success('Sucesso', `Manifesto #${manifesto.nroManifesto} cancelado com sucesso`);
      await fetchManifestos(); // Recarregar lista
    } catch (err) {
      showError('Erro', err instanceof Error ? err.message : 'Erro ao cancelar manifesto');
    }
  };

  useEffect(() => {
    fetchManifestos();
  }, []);

  return {
    manifestos,
    isLoading,
    error,
    refetch: fetchManifestos,
    imprimirManifesto,
    encerrarManifesto,
    cancelarManifesto
  };
};
