import { useState, useEffect } from 'react';
import { useSupabaseCargos } from '@/hooks/useSupabaseCargos';
import { CargoComDepartamento } from '@/types/database';
import { CargoFormData } from '@/types/forms';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';

export const useCargosData = () => {
  const { 
    cargos, 
    isLoading, 
    createCargo, 
    updateCargo, 
    deleteCargo, 
    getStats, 
    refetch 
  } = useSupabaseCargos();

  const [selectedCargo, setSelectedCargo] = useState<CargoComDepartamento | null>(null);
  const [uniqueDepartments, setUniqueDepartments] = useState<string[]>([]);

  const stats = getStats();
  
  // Buscar departamentos diretamente do banco
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const supabase = requireAuthenticatedClient();
        const { data, error } = await supabase
          .from('cargos_departamento')
          .select('nome')
          .order('nome');
        
        if (error) {
          console.error('Erro ao buscar departamentos:', error);
          return;
        }
        
        const departmentNames = (data || []).map(d => d.nome).filter(Boolean);
        setUniqueDepartments(departmentNames);
      } catch (error) {
        console.error('Erro ao buscar departamentos:', error);
      }
    };
    
    fetchDepartments();
  }, []);

  const handleSave = async (cargoData: CargoFormData) => {
    try {
      let result;
      if (selectedCargo) {
        result = await updateCargo(selectedCargo.id, {
          nome: cargoData.nome,
          descricao: cargoData.descricao,
          departamento: cargoData.departamento,
          permissoes: cargoData.permissoes,
          level: cargoData.level,
          ativo: cargoData.ativo
        });
      } else {
        result = await createCargo({
          nome: cargoData.nome,
          descricao: cargoData.descricao,
          departamento: cargoData.departamento,
          permissoes: cargoData.permissoes,
          level: cargoData.level,
          ativo: cargoData.ativo
        });
      }
      setSelectedCargo(null);
      return result;
    } catch (error) {
      console.error('Error saving cargo:', error);
      throw error;
    }
  };

  const handleDelete = async (cargoId: number) => {
    try {
      await deleteCargo(cargoId);
      setSelectedCargo(null);
    } catch (error) {
      console.error('Erro ao excluir cargo:', error);
      throw error;
    }
  };

  return {
    cargos,
    isLoading,
    stats,
    uniqueDepartments,
    selectedCargo,
    setSelectedCargo,
    handleSave,
    handleDelete,
    refetch
  };
};
