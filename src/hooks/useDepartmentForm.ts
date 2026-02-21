import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabaseDepartmentService, DepartmentFormData } from '@/services/supabase/departmentService';
import { useToast } from '@/hooks/use-toast';

export const useDepartmentForm = (onSuccess?: () => void) => {
  const [formData, setFormData] = useState<DepartmentFormData>({
    name: '',
    description: '',
    active: true
  });
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: supabaseDepartmentService.createDepartment,
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Departamento criado com sucesso!"
      });
      resetForm();
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao criar departamento"
      });
    }
  });

  const updateFormData = useCallback((updates: Partial<DepartmentFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      description: '',
      active: true
    });
  }, []);

  const validateAndSubmit = useCallback(async () => {
    if (!formData.name.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Nome do departamento é obrigatório"
      });
      return false;
    }

    createMutation.mutate(formData);
    return true;
  }, [formData, createMutation, toast]);

  const isValid = formData.name.trim().length > 0;

  return {
    formData,
    updateFormData,
    resetForm,
    validateAndSubmit,
    isValid,
    isLoading: createMutation.isPending,
    error: createMutation.error
  };
};