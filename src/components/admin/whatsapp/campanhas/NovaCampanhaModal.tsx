import React, { useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronLeft, ChevronRight, Clock, Send } from 'lucide-react';
import { useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { backendService } from '@/services/api/backendService';
import { toast } from '@/lib/toast';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { useDebounce } from '@/hooks/useDebounce';
import { useFlowSelect } from '@/hooks/useFlowSelect';
import { useCampanhas } from '@/hooks/useCampanhas';

import { useCampanhaWizard } from './wizard/useCampanhaWizard';
import { WizardProgress } from './wizard/WizardProgress';
import { Step1BasicInfo } from './wizard/Step1BasicInfo';
import { Step2Template } from './wizard/Step2Template';
import { Step3Contacts } from './wizard/Step3Contacts';
import { Step4Confirm } from './wizard/Step4Confirm';
import { TemplateData, Conexao, WizardStep } from './wizard/types';

interface NovaCampanhaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const PAGE_SIZE = 50;

const NovaCampanhaModal = ({ open, onOpenChange, onSuccess }: NovaCampanhaModalProps) => {
  const queryClient = useQueryClient();
  const { canAccess, isLoadingCargoPermissions } = usePermissionGuard();
  const { createCampanha, addContatos } = useCampanhas();
  const { flows, loading: loadingFlows } = useFlowSelect();
  
  const canCreate = canAccess('admin.campanhas.criar');

  // Wizard state - SINGLE SOURCE OF TRUTH
  const wizard = useCampanhaWizard();
  const debouncedSearch = useDebounce(wizard.formData.searchContato, 300);

  // Handle modal close - reset form on close
  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen) {
      wizard.resetForm();
    }
    onOpenChange(newOpen);
  }, [onOpenChange, wizard]);

  // Fetch conexões
  const { data: conexoes = [], isLoading: loadingConexoes } = useQuery({
    queryKey: ['conexoes-whatsapp-campanhas'],
    queryFn: async () => {
      const supabase = requireAuthenticatedClient();
      const { data } = await supabase
        .from('conexoes')
        .select('id, nome, status, whatsapp_business_account_id');
      return (data || []) as Conexao[];
    },
    enabled: open
  });

  // Fetch templates - ONLY when conexaoId is set
  const { 
    data: templates = [], 
    isLoading: loadingTemplates,
    refetch: refetchTemplates
  } = useQuery({
    queryKey: ['templates-whatsapp-campanha', wizard.formData.conexaoId],
    queryFn: async () => {
      if (!wizard.formData.conexaoId) return [];
      const response = await backendService.buscarModelosWhatsApp(wizard.formData.conexaoId);
      if (response.success && response.data) {
        return response.data.filter((t: any) => t.status === 'approved') as TemplateData[];
      }
      return [];
    },
    enabled: !!wizard.formData.conexaoId && open
  });

  // Fetch contatos with infinite scroll - ONLY when on step 3 or 4
  const {
    data: contatosData,
    isLoading: loadingContatos,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage
  } = useInfiniteQuery({
    queryKey: ['contatos-whatsapp-infinite', debouncedSearch],
    queryFn: async ({ pageParam = 0 }) => {
      const supabase = requireAuthenticatedClient();
      let query = supabase
        .from('contatos_whatsapp')
        .select('id, nome, telefone, email, perfil', { count: 'exact' });

      if (debouncedSearch.trim()) {
        query = query.or(`nome.ilike.%${debouncedSearch}%,telefone.ilike.%${debouncedSearch}%`);
      }

      const from = pageParam * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error, count } = await query
        .order('nome', { ascending: true })
        .range(from, to);

      if (error) throw error;
      return { 
        contatos: data || [], 
        total: count || 0,
        nextPage: data && data.length === PAGE_SIZE ? pageParam + 1 : undefined
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    enabled: open && (wizard.step === 3 || wizard.step === 4)
  });

  const contatosDisponiveis = useMemo(() => {
    return contatosData?.pages.flatMap(page => page.contatos) || [];
  }, [contatosData]);

  const totalContatos = contatosData?.pages?.[0]?.total ?? 0;

  // Scroll handler for infinite loading
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (!target) return;
    const bottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 100;
    if (bottom && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Submit handler
  const [saving, setSaving] = React.useState(false);
  
  const handleSubmit = async () => {
    if (!canCreate) {
      toast.error('Você não tem permissão para criar campanhas');
      return;
    }

    const { formData } = wizard;
    
    if (!formData.nome || !formData.conexaoId || !formData.templateName) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const contatosParaAdicionar = formData.enviarParaTodos 
      ? contatosDisponiveis 
      : contatosDisponiveis.filter(c => formData.selectedContatos.has(c.id));
    
    if (contatosParaAdicionar.length === 0) {
      toast.error('Selecione pelo menos um contato');
      return;
    }

    // Validate scheduling
    let agendadoPara: string | undefined;
    if (formData.agendarEnvio) {
      if (!formData.dataAgendamento || !formData.horaAgendamento) {
        toast.error('Preencha a data e hora do agendamento');
        return;
      }
      const dataHora = new Date(`${formData.dataAgendamento}T${formData.horaAgendamento}`);
      if (dataHora <= new Date()) {
        toast.error('A data de agendamento deve ser no futuro');
        return;
      }
      agendadoPara = dataHora.toISOString();
    }

    setSaving(true);
    
    const result = await createCampanha({
      nome: formData.nome,
      descricao: formData.descricao || undefined,
      conexao_id: formData.conexaoId,
      template_name: formData.templateName,
      template_language: formData.templateLanguage,
      agendado_para: agendadoPara,
      flow_id: formData.flowId && formData.flowId !== 'none' ? formData.flowId : undefined
    });

    if (result) {
      const records = contatosParaAdicionar.map(c => ({
        telefone: c.telefone,
        nome: c.nome,
        contato_id: c.id
      }));

      await addContatos(result.id, records);
      queryClient.invalidateQueries({ queryKey: ['campanhas'] });
      handleOpenChange(false);
      onSuccess();
    }
    
    setSaving(false);
  };

  // Navigation validation
  const canNavigateTo = useCallback((step: WizardStep): boolean => {
    if (step === 1) return true;
    if (step === 2) return wizard.canProceedStep1;
    if (step === 3) return wizard.canProceedStep1 && wizard.canProceedStep2;
    if (step === 4) return wizard.canProceedStep1 && wizard.canProceedStep2 && wizard.canProceedStep3;
    return false;
  }, [wizard.canProceedStep1, wizard.canProceedStep2, wizard.canProceedStep3]);

  const canProceedCurrent = useCallback((): boolean => {
    switch (wizard.step) {
      case 1: return wizard.canProceedStep1;
      case 2: return wizard.canProceedStep2;
      case 3: return wizard.canProceedStep3;
      case 4: return true;
      default: return false;
    }
  }, [wizard.step, wizard.canProceedStep1, wizard.canProceedStep2, wizard.canProceedStep3]);

  // Permission check
  if (!isLoadingCargoPermissions && !canCreate) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Acesso Negado</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <p className="text-muted-foreground">Você não tem permissão para criar campanhas.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Nova Campanha</DialogTitle>
        </DialogHeader>

        <WizardProgress 
          currentStep={wizard.step} 
          onStepClick={wizard.goToStep}
          canNavigateTo={canNavigateTo}
        />

        <div className="flex-1 overflow-auto min-h-0 py-2">
          {wizard.step === 1 && (
            <Step1BasicInfo
              formData={wizard.formData}
              onUpdateField={wizard.updateField}
              onSelectConexao={wizard.selectConexao}
              conexoes={conexoes}
              loadingConexoes={loadingConexoes}
            />
          )}

          {wizard.step === 2 && (
            <Step2Template
              formData={wizard.formData}
              onSelectTemplate={wizard.selectTemplate}
              templates={templates}
              loadingTemplates={loadingTemplates}
              onRefreshTemplates={() => refetchTemplates()}
            />
          )}

          {wizard.step === 3 && (
            <Step3Contacts
              formData={wizard.formData}
              onUpdateField={wizard.updateField}
              onToggleContato={wizard.toggleContato}
              onSelectAllContatos={wizard.selectAllContatos}
              contatos={contatosDisponiveis}
              totalContatos={totalContatos}
              loadingContatos={loadingContatos}
              isFetchingNextPage={isFetchingNextPage}
              hasNextPage={hasNextPage ?? false}
              onFetchNextPage={() => fetchNextPage()}
              onScroll={handleScroll}
            />
          )}

          {wizard.step === 4 && (
            <Step4Confirm
              formData={wizard.formData}
              onUpdateField={wizard.updateField}
              conexoes={conexoes}
              templates={templates}
              flows={flows}
              loadingFlows={loadingFlows}
              totalContatos={totalContatos}
            />
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-4 border-t flex-shrink-0">
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleOpenChange(false)} 
              className="flex-1 sm:flex-none"
            >
              Cancelar
            </Button>
            
            {wizard.step > 1 && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={wizard.prevStep}
                className="flex-1 sm:flex-none"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Voltar
              </Button>
            )}
          </div>

          <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
            {wizard.step < 4 ? (
              <Button 
                type="button"
                onClick={wizard.nextStep}
                disabled={!canProceedCurrent()}
                className="flex-1 sm:flex-none"
              >
                Próximo
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button 
                type="button"
                onClick={handleSubmit}
                disabled={saving || !canCreate}
                className="flex-1 sm:flex-none"
              >
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {wizard.formData.agendarEnvio ? (
                  <>
                    <Clock className="h-4 w-4 mr-2" />
                    Criar e Agendar
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Criar Campanha
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NovaCampanhaModal;
