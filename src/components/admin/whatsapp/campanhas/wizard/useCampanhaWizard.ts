import { useState, useCallback } from 'react';
import { CampanhaFormData, INITIAL_FORM_DATA, WizardStep } from './types';

export const useCampanhaWizard = () => {
  const [step, setStep] = useState<WizardStep>(1);
  const [formData, setFormData] = useState<CampanhaFormData>({ ...INITIAL_FORM_DATA, selectedContatos: new Set() });

  const updateField = useCallback(<K extends keyof CampanhaFormData>(
    field: K, 
    value: CampanhaFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateMultipleFields = useCallback((updates: Partial<CampanhaFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData({ ...INITIAL_FORM_DATA, selectedContatos: new Set() });
    setStep(1);
  }, []);

  const goToStep = useCallback((newStep: WizardStep) => {
    setStep(newStep);
  }, []);

  const nextStep = useCallback(() => {
    setStep(prev => Math.min(prev + 1, 4) as WizardStep);
  }, []);

  const prevStep = useCallback(() => {
    setStep(prev => Math.max(prev - 1, 1) as WizardStep);
  }, []);

  // Handler para seleção de template que já define o idioma automaticamente
  const selectTemplate = useCallback((templateName: string, language: string) => {
    setFormData(prev => ({
      ...prev,
      templateName,
      templateLanguage: language
    }));
  }, []);

  // Handler para mudança de conexão que limpa o template
  const selectConexao = useCallback((conexaoId: string) => {
    setFormData(prev => ({
      ...prev,
      conexaoId,
      templateName: '',
      templateLanguage: 'pt_BR'
    }));
  }, []);

  // Handler para toggle de contato
  const toggleContato = useCallback((contatoId: string) => {
    setFormData(prev => {
      const newSet = new Set(prev.selectedContatos);
      if (newSet.has(contatoId)) {
        newSet.delete(contatoId);
      } else {
        newSet.add(contatoId);
      }
      return { ...prev, selectedContatos: newSet };
    });
  }, []);

  // Handler para selecionar todos os contatos
  const selectAllContatos = useCallback((contatoIds: string[]) => {
    setFormData(prev => {
      const allSelected = contatoIds.every(id => prev.selectedContatos.has(id));
      if (allSelected) {
        return { ...prev, selectedContatos: new Set() };
      } else {
        return { ...prev, selectedContatos: new Set(contatoIds) };
      }
    });
  }, []);

  // Validações por step
  const canProceedStep1 = formData.nome.trim() !== '' && formData.conexaoId !== '';
  const canProceedStep2 = formData.templateName !== '';
  const canProceedStep3 = formData.enviarParaTodos || formData.selectedContatos.size > 0;

  return {
    step,
    formData,
    updateField,
    updateMultipleFields,
    resetForm,
    goToStep,
    nextStep,
    prevStep,
    selectTemplate,
    selectConexao,
    toggleContato,
    selectAllContatos,
    canProceedStep1,
    canProceedStep2,
    canProceedStep3
  };
};
