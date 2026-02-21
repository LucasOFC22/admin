
import { useQuery } from '@tanstack/react-query';
import { n8nApi } from '@/services/n8n/apiService';
import { JobTitleN8n } from '@/services/n8n/jobTitleService';

export const useAdminCargosN8n = () => {
  const { 
    data: rawData, 
    isLoading, 
    error: queryError,
    refetch 
  } = useQuery({
    queryKey: ['admin-cargos-n8n'],
    queryFn: async () => {
      try {
        const requestBody = {
          eventType: 'cargos',
          acao: 'Buscar',
          timestamp: new Date().toISOString(),
          origem: 'fp_transportes_admin_system'
        };

        const response = await n8nApi.makeN8nRequest(requestBody, false);

        if (!response.success) {
          throw new Error(response.error || 'Erro na comunicação com N8N');
        }

        // Return the data directly
        return response.data;
      } catch (error) {
        console.error('❌ Erro ao buscar cargos do N8N:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Process the data more carefully to preserve all object properties
  let cargos: JobTitleN8n[] = [];
  
  if (rawData) {
    if (Array.isArray(rawData)) {
      cargos = rawData.map(cargo => {
        const cargoData = cargo as any;
        return {
          id: cargoData.id || cargoData._id || String(Math.random()),
          name: cargoData.name || cargoData.nome || cargoData.titulo || 'Cargo sem nome',
          description: cargoData.description || cargoData.descricao || cargoData.desc || '',
          level: cargoData.level || cargoData.nivel || 1,
          permissions: cargoData.permissions || cargoData.permissoes || [],
          ativo: cargoData.ativo !== false && cargoData.active !== false,
          createdAt: cargoData.createdAt || cargoData.criadoEm || cargoData.created_at || '',
          updatedAt: cargoData.updatedAt || cargoData.atualizadoEm || cargoData.updated_at || '',
          // Preserve any additional properties
          ...cargoData
        };
      });
    } else if (typeof rawData === 'object' && rawData !== null) {
      const cargoData = rawData as any;
      cargos = [{
        id: cargoData.id || cargoData._id || String(Math.random()),
        name: cargoData.name || cargoData.nome || cargoData.titulo || 'Cargo sem nome',
        description: cargoData.description || cargoData.descricao || cargoData.desc || '',
        level: cargoData.level || cargoData.nivel || 1,
        permissions: cargoData.permissions || cargoData.permissoes || [],
        ativo: cargoData.ativo !== false && cargoData.active !== false,
        createdAt: cargoData.createdAt || cargoData.criadoEm || cargoData.created_at || '',
        updatedAt: cargoData.updatedAt || cargoData.atualizadoEm || cargoData.updated_at || '',
        // Preserve any additional properties
        ...cargoData
      }];
    }
  }
  
  // Calculate stats with more defensive programming
  const stats = {
    total: cargos.length,
    active: cargos.filter(cargo => cargo.ativo !== false).length,
    inactive: cargos.filter(cargo => cargo.ativo === false).length,
    admin: cargos.filter(cargo => {
      const name = cargo.name || '';
      return name.toLowerCase().includes('admin');
    }).length,
    custom: cargos.filter(cargo => {
      const name = cargo.name || '';
      return !name.toLowerCase().includes('admin');
    }).length
  };

  const error = queryError ? 'Erro ao carregar cargos' : null;

  return {
    cargos,
    isLoading,
    error,
    stats,
    refetch
  };
};
