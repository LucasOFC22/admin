import { useState, useEffect, useCallback } from 'react';
import { formatCurrency as formatCurrencyFn } from '@/lib/formatters';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { 
  Users, Package, Calculator, FileText, ClipboardCheck, 
  MapPin, ChevronLeft, ChevronRight, Printer, Check, Search,
  Plus, Trash2, Loader2
} from 'lucide-react';
import { SelectRegisterModal } from '@/components/modals/SelectRegisterModal';
import { SelectCityModal } from '@/components/modals/SelectCityModal';
import { SelectTabelaPrecoModal } from '@/components/modals/SelectTabelaPrecoModal';
import { cn } from '@/lib/utils';
import { backendService } from '@/services/api/backendService';
import { toast } from 'sonner';
import { mapFormDataToEditPayload } from '@/utils/cotacaoEditMapper';

interface Cidade {
  idCidade: number;
  cidade: string;
  uf: string;
  ibge?: string;
}

interface Cadastro {
  idCliente: number;
  nome: string;
  fantasia?: string;
  cpfcgc: string;
  cidade: string;
  uf: string;
  bairro: string;
  idCidade?: number;
}

interface ItemCotacao {
  id: string;
  descricao: string;
  quantidade: number;
  peso: number;
  volume: number;
  valorUnitario: number;
  altura?: number;
  largura?: number;
  profundidade?: number;
  m3?: number;
  pesoCubado?: number;
  un?: string;
}

interface CotacaoFormData {
  // Step 1 - Clientes
  remetente: Cadastro | null;
  destinatario: Cadastro | null;
  tomador: Cadastro | null;
  remetenteEhTomador: boolean;
  destinatarioEhTomador: boolean;
  solicitante: string;
  telefoneSolicitante: string;
  emailSolicitante: string;
  
  // Origem e Destino
  cidadeOrigem: Cidade | null;
  cidadeDestino: Cidade | null;
  
  // Informações adicionais
  km: string;
  rota: string;
  validadeDias: number;
  diasPagamento: string;
  fatorCubagem: number;
  
  // Step 2 - Itens
  itens: ItemCotacao[];
  
  // Step 3 - Valores (Taxas e Cálculos)
  fretePeso: string;
  freteValor: string;
  secat: string;
  coleta: string;
  entrega: string;
  outros: string;
  pedagio: string;
  gris: string;
  tde: string;
  tas: string;
  agenda: string;
  restricao: string;
  tda: string;
  despacho: string;
  
  // Desconto e ICMS
  tipoDesconto: 'percentual' | 'valor';
  valorDesconto: string;
  percICMS: string;
  somarICM: boolean;
  percAcrescimo: string;
  
  // Tabela de preço
  idTabela: number;
  nomeTabela: string;
  
  // Valores legados (para compatibilidade)
  valorFrete: string;
  valorSeguro: string;
  valorAdValorem: string;
  valorPedagio: string;
  valorOutros: string;
  valorTotal: string;
  
  // Step 4 - Observações
  observacoes: string;
  observacoesInternas: string;
}

const STEPS = [
  { id: 1, label: 'Clientes', icon: Users },
  { id: 2, label: 'Itens', icon: Package },
  { id: 3, label: 'Valores', icon: Calculator },
  { id: 4, label: 'Observações', icon: FileText },
  { id: 5, label: 'Revisão', icon: ClipboardCheck },
];

interface EditCotacaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cotacao?: any;
  onSave?: (data: any) => void;
  onSaveSuccess?: () => void;
}

export const EditCotacaoModal = ({ 
  open, 
  onOpenChange, 
  cotacao,
  onSave,
  onSaveSuccess
}: EditCotacaoModalProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [cotacaoCompleta, setCotacaoCompleta] = useState<any>(null);
  const [fatorCubagem, setFatorCubagem] = useState(300);
  
  // Modal states
  const [remetenteModalOpen, setRemetenteModalOpen] = useState(false);
  const [destinatarioModalOpen, setDestinatarioModalOpen] = useState(false);
  const [tomadorModalOpen, setTomadorModalOpen] = useState(false);
  const [cidadeOrigemModalOpen, setCidadeOrigemModalOpen] = useState(false);
  const [cidadeDestinoModalOpen, setCidadeDestinoModalOpen] = useState(false);
  const [tabelaPrecoModalOpen, setTabelaPrecoModalOpen] = useState(false);
  
  const [formData, setFormData] = useState<CotacaoFormData>({
    remetente: null,
    destinatario: null,
    tomador: null,
    remetenteEhTomador: true,
    destinatarioEhTomador: false,
    solicitante: '',
    telefoneSolicitante: '',
    emailSolicitante: '',
    cidadeOrigem: null,
    cidadeDestino: null,
    km: '',
    rota: '',
    validadeDias: 7,
    diasPagamento: '',
    fatorCubagem: 300,
    itens: [],
    // Novos campos de valores
    fretePeso: '',
    freteValor: '',
    secat: '',
    coleta: '',
    entrega: '',
    outros: '',
    pedagio: '',
    gris: '',
    tde: '',
    tas: '',
    agenda: '',
    restricao: '',
    tda: '',
    despacho: '',
    tipoDesconto: 'percentual',
    valorDesconto: '',
    percICMS: '',
    somarICM: false,
    percAcrescimo: '',
    idTabela: 0,
    nomeTabela: '',
    // Campos legados
    valorFrete: '',
    valorSeguro: '',
    valorAdValorem: '',
    valorPedagio: '',
    valorOutros: '',
    valorTotal: '',
    observacoes: '',
    observacoesInternas: '',
  });

  // Carregar detalhes da cotação ao abrir o modal (apenas leitura)
  const loadCotacaoData = useCallback(async () => {
    if (!cotacao?.idOrcamento && !cotacao?.id) return;

    try {
      setIsLoadingData(true);
      
      const idOrcamento = cotacao.idOrcamento || cotacao.id;
      // Usar endpoint /cotacao/detalhes para buscar dados (apenas leitura)
      const response = await backendService.buscarDetalhesCotacao(Number(idOrcamento));
      
      if (response.success && response.data) {
        const dados = response.data;
        setCotacaoCompleta(dados);
        
        // Mapear dados da API para o formulário
        // API retorna: nomeRemetente, nomeDestinatario, nomeCliente, idCliente (tomador)
        // fretePeso, freteValor, secat, pedagio, gris, outros, vlrTotal
        // itens com: vol, obs, vlrMerc, peso, a, b, c, m3, pesoCubado
        setFormData({
          remetente: dados.idRemetente ? {
            idCliente: dados.idRemetente,
            nome: dados.nomeRemetente || '',
            cpfcgc: '',
            cidade: dados.cidadeOrigem || '',
            uf: dados.ufOrigem || '',
            bairro: '',
            idCidade: dados.idCidadeOrigem
          } : null,
          destinatario: dados.idDestinatario ? {
            idCliente: dados.idDestinatario,
            nome: dados.nomeDestinatario || '',
            cpfcgc: '',
            cidade: dados.cidadeDestino || '',
            uf: dados.ufDestino || '',
            bairro: '',
            idCidade: dados.idCidadeDestino
          } : null,
          tomador: dados.idCliente ? {
            idCliente: dados.idCliente,
            nome: dados.nomeCliente || '',
            cpfcgc: '',
            cidade: '',
            uf: '',
            bairro: ''
          } : null,
          remetenteEhTomador: dados.idRemetente === dados.idCliente,
          destinatarioEhTomador: dados.idDestinatario === dados.idCliente,
          solicitante: dados.solicitante || dados.contato || '',
          telefoneSolicitante: dados.telefoneSolicitante || '',
          emailSolicitante: dados.emailSolicitante || '',
          cidadeOrigem: dados.idCidadeOrigem ? {
            idCidade: dados.idCidadeOrigem,
            cidade: dados.cidadeOrigem || '',
            uf: dados.ufOrigem || ''
          } : null,
          cidadeDestino: dados.idCidadeDestino ? {
            idCidade: dados.idCidadeDestino,
            cidade: dados.cidadeDestino || '',
            uf: dados.ufDestino || ''
          } : null,
          km: String(dados.km || ''),
          rota: dados.rota || '',
          validadeDias: dados.validade || dados.validadeDias || 7,
          diasPagamento: String(dados.ddPgto || dados.diasPagamento || ''),
          fatorCubagem: dados.fatorCubagem || 300,
          itens: dados.itens?.map((item: any, index: number) => ({
            id: String(Date.now() + index),
            descricao: item.obs || '',
            quantidade: item.vol || 1,
            peso: item.peso || 0,
            volume: item.vol || 0,
            valorUnitario: item.vlrMerc || 0,
            altura: item.a || 0,
            largura: item.b || 0,
            profundidade: item.c || 0,
            m3: item.m3 || 0,
            pesoCubado: item.pesoCubado || 0,
            un: item.un || 'UN',
          })) || [],
          // Novos campos de valores
          fretePeso: String(dados.fretePeso || ''),
          freteValor: String(dados.freteValor || ''),
          secat: String(dados.secat || ''),
          coleta: String(dados.coleta || ''),
          entrega: String(dados.entrega || ''),
          outros: String(dados.outros || ''),
          pedagio: String(dados.pedagio || ''),
          gris: String(dados.gris || ''),
          tde: String(dados.tde || ''),
          tas: String(dados.tas || ''),
          agenda: String(dados.agenda || ''),
          restricao: String(dados.restricao || ''),
          tda: String(dados.tda || ''),
          despacho: String(dados.vlrDespacho || ''),
          tipoDesconto: dados.descontoPerc > 0 ? 'percentual' : 'valor',
          valorDesconto: String(dados.descontoPerc || dados.descontoValor || ''),
          percICMS: String(dados.percICM || ''),
          somarICM: dados.somarICM || false,
          percAcrescimo: String(dados.parceiroAcrescimo || ''),
          idTabela: dados.idTabela || 0,
          nomeTabela: dados.nomeTabela || '',
          // Campos legados para compatibilidade
          valorFrete: String(dados.fretePeso || dados.freteValor || ''),
          valorSeguro: String(dados.secat || ''),
          valorAdValorem: String(dados.gris || ''),
          valorPedagio: String(dados.pedagio || ''),
          valorOutros: String(dados.outros || ''),
          valorTotal: String(dados.valorTotal || dados.vlrTotal || ''),
          observacoes: dados.obs || '',
          observacoesInternas: dados.obsInterna || '',
        });
        
        toast.success('Dados carregados com sucesso');
      } else {
        console.warn('Usando dados básicos da cotação:', response.error);
        // Mantém formData inicial se não conseguir carregar dados completos
      }
    } catch (error) {
      console.error('Erro ao carregar dados da cotação:', error);
      toast.error('Erro ao carregar dados da cotação');
    } finally {
      setIsLoadingData(false);
    }
  }, [cotacao]);

  // Disparar carregamento quando o modal abrir e resetar para primeira seção
  useEffect(() => {
    if (open && cotacao) {
      setCurrentStep(1);
      loadCotacaoData();
    }
  }, [open, cotacao, loadCotacaoData]);

  // Handle tomador logic
  useEffect(() => {
    if (formData.remetenteEhTomador && formData.remetente) {
      setFormData(prev => ({ ...prev, tomador: prev.remetente }));
    } else if (formData.destinatarioEhTomador && formData.destinatario) {
      setFormData(prev => ({ ...prev, tomador: prev.destinatario }));
    }
  }, [formData.remetenteEhTomador, formData.destinatarioEhTomador, formData.remetente, formData.destinatario]);

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepId: number) => {
    setCurrentStep(stepId);
  };

  // Handlers de item agora são gerenciados dentro do Step2Itens

  const progress = (currentStep / STEPS.length) * 100;

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <Step1Clientes 
          formData={formData} 
          setFormData={setFormData}
          onOpenRemetenteModal={() => setRemetenteModalOpen(true)}
          onOpenDestinatarioModal={() => setDestinatarioModalOpen(true)}
          onOpenTomadorModal={() => setTomadorModalOpen(true)}
          onOpenCidadeOrigemModal={() => setCidadeOrigemModalOpen(true)}
          onOpenCidadeDestinoModal={() => setCidadeDestinoModalOpen(true)}
        />;
      case 2:
        return <Step2Itens 
          formData={formData}
          setFormData={setFormData}
          fatorCubagem={fatorCubagem}
          setFatorCubagem={setFatorCubagem}
        />;
      case 3:
        return <Step3Valores 
          formData={formData} 
          setFormData={setFormData} 
          onOpenTabelaModal={() => setTabelaPrecoModalOpen(true)}
        />;
      case 4:
        return <Step4Observacoes formData={formData} setFormData={setFormData} />;
      case 5:
        return <Step5Revisao formData={formData} onSave={handleSave} isSaving={isSaving} />;
      default:
        return null;
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setCurrentStep(1);
  };

  const handleSave = async (enviarEmail?: boolean) => {
    if (!cotacaoCompleta && !cotacao) {
      toast.error('Dados da cotação não carregados');
      return;
    }

    try {
      setIsSaving(true);
      
      // Mapear dados do formulário para o payload da API
      const payload = mapFormDataToEditPayload(formData, cotacaoCompleta || cotacao);
      
      console.log('Payload para /cotacao/editar:', payload);
      
      // Chamar API /cotacao/editar
      const response = await backendService.salvarEdicaoCotacao(payload);
      
      if (response.success) {
        toast.success('Cotação atualizada com sucesso!');
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
        
        // Enviar email ao cliente se checkbox marcado
        if (enviarEmail) {
          const emailCliente = formData.emailSolicitante || (cotacao as any)?.contato?.email;
          const idOrcamento = (cotacao as any)?.idOrcamento || cotacao?.id;
          const nroOrcamento = (cotacao as any)?.nroOrcamento || (cotacaoCompleta as any)?.nroOrcamento || idOrcamento;
          
          if (emailCliente && emailCliente !== 'N/A' && idOrcamento) {
            toast.info('Enviando email ao cliente...');
            try {
              const { supabase } = await import('@/integrations/supabase/client');
              const { data: emailResult, error: emailError } = await supabase.functions.invoke('email-enviar-cotacao', {
                body: {
                  idCotacao: idOrcamento,
                  nroOrcamento,
                  emailCliente,
                  nomeCliente: formData.solicitante || (cotacao as any)?.contato?.nome || 'Cliente',
                  valorTotal: formData.valorTotal || undefined,
                  origem: formData.cidadeOrigem ? `${formData.cidadeOrigem.cidade}/${formData.cidadeOrigem.uf}` : undefined,
                  destino: formData.cidadeDestino ? `${formData.cidadeDestino.cidade}/${formData.cidadeDestino.uf}` : undefined,
                },
              });
              
              if (emailError) {
                console.error('Erro ao enviar email:', emailError);
                toast.error('Cotação salva, mas houve erro ao enviar o email');
              } else if (emailResult?.success) {
                toast.success('Email enviado ao cliente com sucesso!');
              } else {
                toast.error(`Erro no envio: ${emailResult?.error || 'Erro desconhecido'}`);
              }
            } catch (emailErr) {
              console.error('Erro ao enviar email:', emailErr);
              toast.error('Cotação salva, mas houve erro ao enviar o email');
            }
          } else {
            toast.warning('Email do cliente não encontrado. Cotação salva sem envio de email.');
          }
        }
        
        // Callback opcional
        onSave?.(payload);
        onSaveSuccess?.();
        
        // Fechar modal após salvar
        setTimeout(() => {
          onOpenChange(false);
          setCurrentStep(1);
        }, 1500);
      } else {
        toast.error(response.error || 'Erro ao salvar cotação');
      }
    } catch (error) {
      console.error('Erro ao salvar cotação:', error);
      toast.error('Erro ao salvar cotação');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl w-[95vw] h-[95vh] md:h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
          {/* Header Card */}
          <Card className="rounded-none border-0 border-b flex-shrink-0">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between mb-3 md:mb-4 flex-wrap gap-2">
                <div className="min-w-0">
                  <h1 className="text-base sm:text-lg md:text-xl font-bold truncate">
                    {cotacao ? `Cotação #${(cotacao as any).nroOrcamento || (cotacao as any).quoteId || cotacao.id || ''}` : 'Nova Cotação'}
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Emissão: {new Date().toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-1 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3">
                    <Printer className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Imprimir</span>
                  </Button>
                  {isSaved && (
                    <div className="flex items-center gap-1 sm:gap-2 text-green-600">
                      <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="text-xs sm:text-sm">Salvo</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Step Navigation - Responsivo */}
              <div className="flex items-center justify-between mb-3 md:mb-4 overflow-x-auto scrollbar-hide">
                {STEPS.map((step, index) => (
                  <div key={step.id} className="flex items-center flex-1 min-w-0">
                    <button
                      onClick={() => handleStepClick(step.id)}
                      className="flex flex-col items-center gap-0.5 sm:gap-1 p-1 sm:p-2 rounded-lg transition-all w-full hover:bg-muted cursor-pointer min-w-[50px]"
                    >
                      <div className={cn(
                        "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all",
                        currentStep === step.id 
                          ? "bg-primary text-primary-foreground" 
                          : currentStep > step.id
                          ? "bg-green-500 text-white"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {currentStep > step.id ? (
                          <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                        ) : (
                          <step.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                        )}
                      </div>
                      <span className={cn(
                        "text-[10px] sm:text-xs font-medium text-center leading-tight",
                        currentStep === step.id ? "text-primary" : "text-muted-foreground"
                      )}>
                        {step.label}
                      </span>
                    </button>
                    {index < STEPS.length - 1 && (
                      <div className={cn(
                        "h-0.5 flex-1 mx-1 sm:mx-2 min-w-[8px]",
                        currentStep > step.id ? "bg-green-500" : "bg-muted"
                      )} />
                    )}
                  </div>
                ))}
              </div>

              <Progress value={progress} className="h-1.5 sm:h-2" />
              <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 sm:mt-2 text-center">
                Etapa {currentStep} de {STEPS.length}: {STEPS[currentStep - 1].label}
              </p>
            </CardContent>
          </Card>

          {/* Content Area - Responsivo */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 relative min-h-0">
            {isLoadingData && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-50 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
                  <span className="text-xs sm:text-sm text-muted-foreground">Carregando dados...</span>
                </div>
              </div>
            )}
            {renderStepContent()}
          </div>

          {/* Footer Navigation - Responsivo */}
          <Card className="rounded-none border-0 border-t flex-shrink-0">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex justify-between items-center gap-2">
                <Button variant="outline" onClick={handleClose} className="gap-1 sm:gap-2 h-9 sm:h-10 px-2 sm:px-4">
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Fechar</span>
                </Button>
                <div className="flex gap-2">
                  {currentStep > 1 && (
                    <Button variant="outline" onClick={handlePrev} className="gap-1 sm:gap-2 h-9 sm:h-10 px-2 sm:px-4">
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden xs:inline">Anterior</span>
                    </Button>
                  )}
                  {currentStep < STEPS.length ? (
                    <Button onClick={handleNext} className="gap-1 sm:gap-2 h-9 sm:h-10 px-3 sm:px-4">
                      <span>Próximo</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handleSave()} 
                      className="gap-1 sm:gap-2 h-9 sm:h-10 px-3 sm:px-4 bg-orange-500 hover:bg-orange-600"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                          <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/>
                          <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/>
                          <path d="M7 3v4a1 1 0 0 0 1 1h7"/>
                        </svg>
                      )}
                      <span>{isSaving ? 'Salvando...' : 'Salvar'}</span>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>

      {/* Modals */}
      <SelectRegisterModal
        open={remetenteModalOpen}
        onOpenChange={setRemetenteModalOpen}
        onSelect={(cadastro) => {
          setFormData(prev => ({ ...prev, remetente: cadastro }));
        }}
        title="Selecionar Remetente"
      />

      <SelectRegisterModal
        open={destinatarioModalOpen}
        onOpenChange={setDestinatarioModalOpen}
        onSelect={(cadastro) => {
          setFormData(prev => ({ ...prev, destinatario: cadastro }));
        }}
        title="Selecionar Destinatário"
      />

      <SelectRegisterModal
        open={tomadorModalOpen}
        onOpenChange={setTomadorModalOpen}
        onSelect={(cadastro) => {
          setFormData(prev => ({ ...prev, tomador: cadastro }));
        }}
        title="Selecionar Tomador"
      />

      <SelectCityModal
        open={cidadeOrigemModalOpen}
        onOpenChange={setCidadeOrigemModalOpen}
        onSelect={(cidade) => {
          setFormData(prev => ({ ...prev, cidadeOrigem: cidade }));
        }}
        title="Selecionar Cidade de Origem"
      />

      <SelectCityModal
        open={cidadeDestinoModalOpen}
        onOpenChange={setCidadeDestinoModalOpen}
        onSelect={(cidade) => {
          setFormData(prev => ({ ...prev, cidadeDestino: cidade }));
        }}
        title="Selecionar Cidade de Destino"
      />

      <SelectTabelaPrecoModal
        open={tabelaPrecoModalOpen}
        onOpenChange={setTabelaPrecoModalOpen}
        onSelect={(tabela) => {
          setFormData(prev => ({ 
            ...prev, 
            idTabela: tabela.idTabela,
            nomeTabela: tabela.descricao
          }));
        }}
        title="Selecionar Tabela de Preço"
      />
    </>
  );
};

// Step 1: Clientes
interface Step1Props {
  formData: CotacaoFormData;
  setFormData: React.Dispatch<React.SetStateAction<CotacaoFormData>>;
  onOpenRemetenteModal: () => void;
  onOpenDestinatarioModal: () => void;
  onOpenTomadorModal: () => void;
  onOpenCidadeOrigemModal: () => void;
  onOpenCidadeDestinoModal: () => void;
}

const Step1Clientes = ({ 
  formData, 
  setFormData, 
  onOpenRemetenteModal,
  onOpenDestinatarioModal,
  onOpenTomadorModal,
  onOpenCidadeOrigemModal,
  onOpenCidadeDestinoModal,
}: Step1Props) => {
  return (
    <div className="space-y-6">
      {/* Clientes Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Clientes
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Remetente */}
          <div className="space-y-2">
            <Label>Remetente *</Label>
            <div className="relative">
              <Input
                className="pr-10 cursor-pointer"
                placeholder="CNPJ/CPF ou clique na lupa"
                readOnly
                value={formData.remetente ? `${formData.remetente.nome} - ${formData.remetente.cpfcgc}` : ''}
                onClick={onOpenRemetenteModal}
              />
              <Search 
                className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 cursor-pointer hover:text-primary" 
                onClick={onOpenRemetenteModal}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox 
                id="remetenteEhTomador"
                checked={formData.remetenteEhTomador}
                onCheckedChange={(checked) => {
                  setFormData(prev => ({ 
                    ...prev, 
                    remetenteEhTomador: !!checked,
                    destinatarioEhTomador: checked ? false : prev.destinatarioEhTomador
                  }));
                }}
              />
              <Label htmlFor="remetenteEhTomador" className="text-sm">
                Remetente é o tomador
              </Label>
            </div>
          </div>

          {/* Destinatário */}
          <div className="space-y-2">
            <Label>Destinatário</Label>
            <div className="relative">
              <Input
                className="pr-10 cursor-pointer"
                placeholder="CNPJ/CPF ou clique na lupa"
                readOnly
                value={formData.destinatario ? `${formData.destinatario.nome} - ${formData.destinatario.cpfcgc}` : ''}
                onClick={onOpenDestinatarioModal}
              />
              <Search 
                className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 cursor-pointer hover:text-primary" 
                onClick={onOpenDestinatarioModal}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox 
                id="destinatarioEhTomador"
                checked={formData.destinatarioEhTomador}
                onCheckedChange={(checked) => {
                  setFormData(prev => ({ 
                    ...prev, 
                    destinatarioEhTomador: !!checked,
                    remetenteEhTomador: checked ? false : prev.remetenteEhTomador
                  }));
                }}
              />
              <Label htmlFor="destinatarioEhTomador" className="text-sm">
                Destinatário é o tomador
              </Label>
            </div>
          </div>

          {/* Tomador */}
          <div className="space-y-2">
            <Label>Tomador do Serviço *</Label>
            <div className="relative">
              <Input
                className="pr-10 cursor-pointer"
                placeholder="CNPJ/CPF ou clique na lupa"
                readOnly
                disabled={formData.remetenteEhTomador || formData.destinatarioEhTomador}
                value={formData.tomador ? `${formData.tomador.nome} - ${formData.tomador.cpfcgc}` : ''}
                onClick={(!formData.remetenteEhTomador && !formData.destinatarioEhTomador) ? onOpenTomadorModal : undefined}
              />
              <Search 
                className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 cursor-pointer hover:text-primary" 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Solicitante Card */}
      <Card>
        <CardHeader>
          <CardTitle>Solicitante</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <Label>Solicitante da Cotação *</Label>
              <Input
                placeholder="Nome do solicitante"
                value={formData.solicitante}
                onChange={(e) => setFormData(prev => ({ ...prev, solicitante: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Telefone Solicitante</Label>
                <Input
                  placeholder="Telefone do solicitante"
                  value={formData.telefoneSolicitante}
                  onChange={(e) => setFormData(prev => ({ ...prev, telefoneSolicitante: e.target.value }))}
                />
              </div>
              <div>
                <Label>Email Solicitante</Label>
                <Input
                  type="email"
                  placeholder="Email do solicitante"
                  value={formData.emailSolicitante}
                  onChange={(e) => setFormData(prev => ({ ...prev, emailSolicitante: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Origem e Destino Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Origem e Destino
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Origem */}
          <div className="space-y-4">
            <h4 className="font-medium">Origem</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Cidade</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Cidade"
                    readOnly
                    value={formData.cidadeOrigem?.cidade || ''}
                    className="cursor-pointer"
                    onClick={onOpenCidadeOrigemModal}
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={onOpenCidadeOrigemModal}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                {formData.cidadeOrigem && (
                  <p className="text-xs text-muted-foreground mt-1">
                    ID: {formData.cidadeOrigem.idCidade} | IBGE: {formData.cidadeOrigem.ibge || '-'}
                  </p>
                )}
              </div>
              <div>
                <Label>UF</Label>
                <Input
                  placeholder="UF"
                  maxLength={2}
                  readOnly
                  value={formData.cidadeOrigem?.uf || ''}
                />
              </div>
            </div>
          </div>

          {/* Destino */}
          <div className="space-y-4">
            <h4 className="font-medium">Destino</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Cidade</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Cidade"
                    readOnly
                    value={formData.cidadeDestino?.cidade || ''}
                    className="cursor-pointer"
                    onClick={onOpenCidadeDestinoModal}
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={onOpenCidadeDestinoModal}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                {formData.cidadeDestino && (
                  <p className="text-xs text-muted-foreground mt-1">
                    ID: {formData.cidadeDestino.idCidade} | IBGE: {formData.cidadeDestino.ibge || '-'}
                  </p>
                )}
              </div>
              <div>
                <Label>UF</Label>
                <Input
                  placeholder="UF"
                  maxLength={2}
                  readOnly
                  value={formData.cidadeDestino?.uf || ''}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações Adicionais Card */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Adicionais</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <Label>Km</Label>
            <Input
              type="number"
              placeholder="Quilometragem"
              value={formData.km}
              onChange={(e) => setFormData(prev => ({ ...prev, km: e.target.value }))}
            />
          </div>
          <div>
            <Label>Rota</Label>
            <Input
              placeholder="Ex: SP->RJ"
              value={formData.rota}
              onChange={(e) => setFormData(prev => ({ ...prev, rota: e.target.value }))}
            />
          </div>
          <div>
            <Label>Validade (dias)</Label>
            <Input
              type="number"
              placeholder="7"
              value={formData.validadeDias}
              onChange={(e) => setFormData(prev => ({ ...prev, validadeDias: parseInt(e.target.value) || 7 }))}
            />
          </div>
          <div>
            <Label>Dias Pagamento</Label>
            <Input
              type="number"
              placeholder="30"
              value={formData.diasPagamento}
              onChange={(e) => setFormData(prev => ({ ...prev, diasPagamento: e.target.value }))}
            />
          </div>
          <div>
            <Label>Fator Cubagem</Label>
            <Input
              type="number"
              placeholder="300"
              value={formData.fatorCubagem}
              onChange={(e) => setFormData(prev => ({ ...prev, fatorCubagem: parseInt(e.target.value) || 300 }))}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Step 2: Itens
interface Step2Props {
  formData: CotacaoFormData;
  setFormData: React.Dispatch<React.SetStateAction<CotacaoFormData>>;
  fatorCubagem: number;
  setFatorCubagem: React.Dispatch<React.SetStateAction<number>>;
}

interface NewItemForm {
  valorMercadoria: string;
  peso: string;
  volume: string;
  un: string;
  altura: string;
  largura: string;
  profundidade: string;
  m3: string;
  pesoCubado: string;
  observacoes: string;
}

interface ItemErrors {
  valorMercadoria?: string;
  peso?: string;
}

const UNIDADE_OPTIONS = ['KG', 'UN', 'CX', 'PC', 'L', 'M'];

const Step2Itens = ({ formData, setFormData, fatorCubagem, setFatorCubagem }: Step2Props) => {
  const [newItem, setNewItem] = useState<NewItemForm>({
    valorMercadoria: '',
    peso: '',
    volume: '1',
    un: 'KG',
    altura: '',
    largura: '',
    profundidade: '',
    m3: '',
    pesoCubado: '',
    observacoes: '',
  });
  const [errors, setErrors] = useState<ItemErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Recalcular M³ e Peso Cubado quando dimensões mudam
  useEffect(() => {
    const altura = parseFloat(newItem.altura) || 0;
    const largura = parseFloat(newItem.largura) || 0;
    const profundidade = parseFloat(newItem.profundidade) || 0;
    const volume = parseFloat(newItem.volume) || 1;
    
    const m3 = altura * largura * profundidade * volume;
    const pesoCubado = m3 * fatorCubagem;
    
    setNewItem(prev => ({
      ...prev,
      m3: m3 > 0 ? m3.toFixed(3) : '',
      pesoCubado: pesoCubado > 0 ? pesoCubado.toFixed(2) : '',
    }));
  }, [newItem.altura, newItem.largura, newItem.profundidade, newItem.volume, fatorCubagem]);

  const validateField = (field: keyof ItemErrors, value: string): string | undefined => {
    switch (field) {
      case 'valorMercadoria':
        if (!value || parseFloat(value) <= 0) {
          return 'Valor da mercadoria é obrigatório';
        }
        break;
      case 'peso':
        if (!value || parseFloat(value) <= 0) {
          return 'Peso é obrigatório';
        }
        break;
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: ItemErrors = {
      valorMercadoria: validateField('valorMercadoria', newItem.valorMercadoria),
      peso: validateField('peso', newItem.peso),
    };
    
    setErrors(newErrors);
    setTouched({ valorMercadoria: true, peso: true });
    
    return !newErrors.valorMercadoria && !newErrors.peso;
  };

  const handleFieldChange = (field: keyof NewItemForm, value: string) => {
    setNewItem(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro ao editar campo
    if (field in errors) {
      const error = validateField(field as keyof ItemErrors, value);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const handleBlur = (field: keyof ItemErrors) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, newItem[field]);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleAddItem = () => {
    if (!validateForm()) {
      return;
    }

    const item: ItemCotacao = {
      id: editingItemId || Date.now().toString(),
      descricao: newItem.observacoes,
      quantidade: parseInt(newItem.volume) || 1,
      peso: parseFloat(newItem.peso) || 0,
      volume: parseInt(newItem.volume) || 1,
      valorUnitario: parseFloat(newItem.valorMercadoria) || 0,
      altura: parseFloat(newItem.altura) || 0,
      largura: parseFloat(newItem.largura) || 0,
      profundidade: parseFloat(newItem.profundidade) || 0,
      m3: parseFloat(newItem.m3) || 0,
      pesoCubado: parseFloat(newItem.pesoCubado) || 0,
      un: newItem.un,
    };

    if (editingItemId) {
      setFormData(prev => ({
        ...prev,
        itens: prev.itens.map(i => i.id === editingItemId ? item : i),
      }));
      setEditingItemId(null);
    } else {
      setFormData(prev => ({
        ...prev,
        itens: [...prev.itens, item],
      }));
    }

    // Limpar formulário
    setNewItem({
      valorMercadoria: '',
      peso: '',
      volume: '1',
      un: 'KG',
      altura: '',
      largura: '',
      profundidade: '',
      m3: '',
      pesoCubado: '',
      observacoes: '',
    });
    setErrors({});
    setTouched({});
  };

  const handleEditItem = (item: ItemCotacao) => {
    setNewItem({
      valorMercadoria: String(item.valorUnitario || ''),
      peso: String(item.peso || ''),
      volume: String(item.volume || '1'),
      un: item.un || 'KG',
      altura: String(item.altura || ''),
      largura: String(item.largura || ''),
      profundidade: String(item.profundidade || ''),
      m3: String(item.m3 || ''),
      pesoCubado: String(item.pesoCubado || ''),
      observacoes: item.descricao || '',
    });
    setEditingItemId(item.id);
    setErrors({});
    setTouched({});
  };

  const handleRemoveItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      itens: prev.itens.filter(item => item.id !== id),
    }));
    if (editingItemId === id) {
      setEditingItemId(null);
      setNewItem({
        valorMercadoria: '',
        peso: '',
        volume: '1',
        un: 'KG',
        altura: '',
        largura: '',
        profundidade: '',
        m3: '',
        pesoCubado: '',
        observacoes: '',
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setNewItem({
      valorMercadoria: '',
      peso: '',
      volume: '1',
      un: 'KG',
      altura: '',
      largura: '',
      profundidade: '',
      m3: '',
      pesoCubado: '',
      observacoes: '',
    });
    setErrors({});
    setTouched({});
  };

  const totals = {
    peso: formData.itens.reduce((acc, item) => acc + (item.peso * item.quantidade), 0),
    volume: formData.itens.reduce((acc, item) => acc + item.quantidade, 0),
    m3: formData.itens.reduce((acc, item) => acc + (item.m3 || 0), 0),
    valor: formData.itens.reduce((acc, item) => acc + (item.valorUnitario * item.quantidade), 0),
  };

  const isFormValid = !!(newItem.valorMercadoria && parseFloat(newItem.valorMercadoria) > 0 && 
                        newItem.peso && parseFloat(newItem.peso) > 0);

  return (
    <div className="space-y-6">
      {/* Info de Cubagem */}
      <Card className="bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6 pt-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                <strong>Cálculo de Cubagem:</strong> M³ = Altura × Largura × Profundidade × Volumes | Peso Cubado = M³ × Fator
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Label className="whitespace-nowrap">Fator Cubagem:</Label>
              <Input
                type="number"
                className="w-24"
                placeholder="300"
                value={fatorCubagem}
                onChange={(e) => setFatorCubagem(parseInt(e.target.value) || 300)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulário Adicionar Item */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {editingItemId ? 'Editar Item' : 'Adicionar Item'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className={cn(touched.valorMercadoria && errors.valorMercadoria && "text-destructive")}>
                Valor Mercadoria *
              </Label>
              <Input
                type="number"
                className={cn(
                  touched.valorMercadoria && errors.valorMercadoria && "border-destructive focus-visible:ring-destructive"
                )}
                placeholder="0,00"
                value={newItem.valorMercadoria}
                onChange={(e) => handleFieldChange('valorMercadoria', e.target.value)}
                onBlur={() => handleBlur('valorMercadoria')}
              />
              {touched.valorMercadoria && errors.valorMercadoria && (
                <p className="text-xs text-destructive mt-1">{errors.valorMercadoria}</p>
              )}
            </div>
            <div>
              <Label className={cn(touched.peso && errors.peso && "text-destructive")}>
                Peso (kg) *
              </Label>
              <Input
                type="number"
                className={cn(
                  touched.peso && errors.peso && "border-destructive focus-visible:ring-destructive"
                )}
                placeholder="0,00"
                value={newItem.peso}
                onChange={(e) => handleFieldChange('peso', e.target.value)}
                onBlur={() => handleBlur('peso')}
              />
              {touched.peso && errors.peso && (
                <p className="text-xs text-destructive mt-1">{errors.peso}</p>
              )}
            </div>
            <div>
              <Label>Volume</Label>
              <Input
                type="number"
                placeholder="1"
                min="1"
                value={newItem.volume}
                onChange={(e) => handleFieldChange('volume', e.target.value)}
              />
            </div>
            <div>
              <Label>Unidade</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={newItem.un}
                onChange={(e) => handleFieldChange('un', e.target.value)}
              >
                {UNIDADE_OPTIONS.map((un) => (
                  <option key={un} value={un}>{un}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <Label>Altura (m)</Label>
              <Input
                type="number"
                placeholder="0,00"
                step="0.01"
                value={newItem.altura}
                onChange={(e) => handleFieldChange('altura', e.target.value)}
              />
            </div>
            <div>
              <Label>Largura (m)</Label>
              <Input
                type="number"
                placeholder="0,00"
                step="0.01"
                value={newItem.largura}
                onChange={(e) => handleFieldChange('largura', e.target.value)}
              />
            </div>
            <div>
              <Label>Profundidade (m)</Label>
              <Input
                type="number"
                placeholder="0,00"
                step="0.01"
                value={newItem.profundidade}
                onChange={(e) => handleFieldChange('profundidade', e.target.value)}
              />
            </div>
            <div>
              <Label>M³</Label>
              <Input
                type="number"
                placeholder="0,000"
                step="0.001"
                value={newItem.m3}
                readOnly
                className="bg-muted"
              />
            </div>
            <div>
              <Label>Peso Cubado</Label>
              <Input
                type="number"
                placeholder="0,00"
                value={newItem.pesoCubado}
                readOnly
                className="bg-muted"
              />
            </div>
          </div>
          
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label>Observações</Label>
              <Input
                placeholder="Observações do item"
                value={newItem.observacoes}
                onChange={(e) => handleFieldChange('observacoes', e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {editingItemId && (
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancelar
                </Button>
              )}
              <Button 
                onClick={handleAddItem} 
                disabled={!isFormValid}
                className="min-w-[140px]"
              >
                <Plus className="h-4 w-4 mr-2" />
                {editingItemId ? 'Salvar' : 'Adicionar'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Itens */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Itens da Carga ({formData.itens.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {formData.itens.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum item adicionado</p>
              <p className="text-sm">Preencha o formulário acima e clique em "Adicionar"</p>
            </div>
          ) : (
            <div className="space-y-2">
              {formData.itens.map((item, index) => (
                <div 
                  key={item.id} 
                  className={cn(
                    "flex items-center justify-between p-3 border rounded-lg transition-colors cursor-pointer",
                    editingItemId === item.id 
                      ? "bg-primary/10 border-primary" 
                      : "bg-muted/30 hover:bg-muted/50"
                  )}
                  onClick={() => handleEditItem(item)}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold font-mono">
                      #{index + 1}
                    </span>
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                      <span><strong>Peso:</strong> {item.peso} kg</span>
                      <span><strong>Valor:</strong> R$ {item.valorUnitario?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      <span><strong>Vol:</strong> {item.volume}</span>
                      {item.m3 && item.m3 > 0 && <span><strong>M³:</strong> {item.m3.toFixed(3)}</span>}
                      {item.descricao && <span className="text-muted-foreground italic">{item.descricao}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <p className="text-xs text-primary mr-2 flex items-center gap-1">
                      Clique para editar
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveItem(item.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumo dos Itens */}
      {formData.itens.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo dos Itens</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-muted p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Total Peso</p>
              <p className="text-2xl font-bold">{totals.peso.toFixed(2)} kg</p>
            </div>
            <div className="bg-muted p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Total Volume</p>
              <p className="text-2xl font-bold">{totals.volume}</p>
            </div>
            <div className="bg-muted p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Total M³</p>
              <p className="text-2xl font-bold">{totals.m3.toFixed(3)}</p>
            </div>
            <div className="bg-muted p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Valor Mercadoria</p>
              <p className="text-2xl font-bold">R$ {totals.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Step 3: Valores - Taxas e Cálculos
interface Step3Props {
  formData: CotacaoFormData;
  setFormData: React.Dispatch<React.SetStateAction<CotacaoFormData>>;
  onOpenTabelaModal: () => void;
}

const Step3Valores = ({ formData, setFormData, onOpenTabelaModal }: Step3Props) => {
  // Calcular totais dos itens
  const totals = {
    itens: formData.itens.length,
    peso: formData.itens.reduce((acc, item) => acc + (item.peso * (item.quantidade || 1)), 0),
    volume: formData.itens.reduce((acc, item) => acc + (item.quantidade || item.volume || 0), 0),
    m3: formData.itens.reduce((acc, item) => acc + (item.m3 || 0), 0),
    valorMerc: formData.itens.reduce((acc, item) => acc + (item.valorUnitario || 0), 0),
  };

  const km = parseFloat(formData.km) || 0;

  // Calcular subtotal e total
  const calcularSubtotal = () => {
    const fretePeso = parseFloat(formData.fretePeso) || 0;
    const freteValor = parseFloat(formData.freteValor) || 0;
    const secat = parseFloat(formData.secat) || 0;
    const coleta = parseFloat(formData.coleta) || 0;
    const entrega = parseFloat(formData.entrega) || 0;
    const outros = parseFloat(formData.outros) || 0;
    const pedagio = parseFloat(formData.pedagio) || 0;
    const gris = parseFloat(formData.gris) || 0;
    const tde = parseFloat(formData.tde) || 0;
    const tas = parseFloat(formData.tas) || 0;
    const agenda = parseFloat(formData.agenda) || 0;
    const restricao = parseFloat(formData.restricao) || 0;
    const tda = parseFloat(formData.tda) || 0;
    const despacho = parseFloat(formData.despacho) || 0;
    
    return fretePeso + freteValor + secat + coleta + entrega + outros + 
           pedagio + gris + tde + tas + agenda + restricao + tda + despacho;
  };

  const calcularTotal = () => {
    let subtotal = calcularSubtotal();
    const desconto = parseFloat(formData.valorDesconto) || 0;
    const percICMS = parseFloat(formData.percICMS) || 0;
    const percAcrescimo = parseFloat(formData.percAcrescimo) || 0;

    // Aplicar desconto
    if (formData.tipoDesconto === 'percentual' && desconto > 0) {
      subtotal -= subtotal * (desconto / 100);
    } else if (desconto > 0) {
      subtotal -= desconto;
    }

    // Aplicar ICMS se marcado
    if (formData.somarICM && percICMS > 0) {
      subtotal += subtotal * (percICMS / 100);
    }

    // Aplicar acréscimo
    if (percAcrescimo > 0) {
      subtotal += subtotal * (percAcrescimo / 100);
    }

    return subtotal;
  };

  const subtotal = calcularSubtotal();
  const total = calcularTotal();

  // Calcular valores por unidade
  const valorPorKm = km > 0 ? total / km : 0;
  const valorPorTonelada = totals.peso > 0 ? total / (totals.peso / 1000) : 0;
  const valorPorVolume = totals.volume > 0 ? total / totals.volume : 0;

  const handleRecalcular = () => {
    const novoTotal = calcularTotal();
    setFormData(prev => ({ ...prev, valorTotal: String(novoTotal.toFixed(2)) }));
  };

  const formatCurrency = (value: number) => formatCurrencyFn(value);

  return (
    <div className="space-y-6">
      {/* Resumo dos Itens */}
      <Card className="bg-muted/30">
        <CardContent className="py-3">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Itens:</span>
                <span className="font-semibold">{totals.itens}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Peso:</span>
                <span className="font-semibold">{totals.peso.toFixed(2)} kg</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Vol:</span>
                <span className="font-semibold">{totals.volume}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">M³:</span>
                <span className="font-semibold">{totals.m3.toFixed(3)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Mercadoria:</span>
                <span className="font-semibold">{formatCurrency(totals.valorMerc)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Km:</span>
              <span className="font-semibold">{km}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cálculo Rápido */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>
            </svg>
            Cálculo Rápido
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground mb-3">
            Preencha <strong>apenas um</strong> dos campos para calcular o frete
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-xs">Valor por Km</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  className="bg-white dark:bg-background"
                  placeholder="0,00"
                  onChange={(e) => {
                    const valorKm = parseFloat(e.target.value) || 0;
                    const novoFrete = valorKm * km;
                    setFormData(prev => ({ ...prev, fretePeso: String(novoFrete.toFixed(2)) }));
                  }}
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  × {km} km = {formatCurrency(parseFloat(formData.fretePeso) || 0)}
                </span>
              </div>
            </div>
            <div>
              <Label className="text-xs">Valor por Tonelada</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  className="bg-white dark:bg-background"
                  placeholder="0,00"
                  onChange={(e) => {
                    const valorTon = parseFloat(e.target.value) || 0;
                    const novoFrete = valorTon * (totals.peso / 1000);
                    setFormData(prev => ({ ...prev, fretePeso: String(novoFrete.toFixed(2)) }));
                  }}
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  × {(totals.peso / 1000).toFixed(2)} ton = {formatCurrency(parseFloat(formData.fretePeso) || 0)}
                </span>
              </div>
            </div>
            <div>
              <Label className="text-xs">Valor por Volume</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  className="bg-white dark:bg-background"
                  placeholder="0,00"
                  onChange={(e) => {
                    const valorVol = parseFloat(e.target.value) || 0;
                    const novoFrete = valorVol * totals.volume;
                    setFormData(prev => ({ ...prev, fretePeso: String(novoFrete.toFixed(2)) }));
                  }}
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  × {totals.volume} vol = {formatCurrency(parseFloat(formData.fretePeso) || 0)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Preço */}
      <Card>
        <CardHeader>
          <CardTitle>Tabela de Preço</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label>Tabela de Preço *</Label>
            <div className="flex gap-2">
              <Input
                className="cursor-pointer bg-muted/50"
                placeholder="Clique para selecionar a tabela"
                readOnly
                value={formData.nomeTabela ? `${formData.idTabela} - ${formData.nomeTabela}` : ''}
                onClick={onOpenTabelaModal}
              />
              <Button variant="outline" size="icon" onClick={onOpenTabelaModal}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            {formData.idTabela > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Código: {formData.idTabela}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Taxas e Cálculos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Taxas e Cálculos
          </CardTitle>
          <Button onClick={handleRecalcular}>
            <Calculator className="h-4 w-4 mr-2" />
            Recalcular
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div>
              <Label>Frete Peso</Label>
              <Input
                type="number"
                value={formData.fretePeso}
                onChange={(e) => setFormData(prev => ({ ...prev, fretePeso: e.target.value }))}
              />
            </div>
            <div>
              <Label>Frete Valor</Label>
              <Input
                type="number"
                value={formData.freteValor}
                onChange={(e) => setFormData(prev => ({ ...prev, freteValor: e.target.value }))}
              />
            </div>
            <div>
              <Label>Secat</Label>
              <Input
                type="number"
                value={formData.secat}
                onChange={(e) => setFormData(prev => ({ ...prev, secat: e.target.value }))}
              />
            </div>
            <div>
              <Label>Coleta</Label>
              <Input
                type="number"
                value={formData.coleta}
                onChange={(e) => setFormData(prev => ({ ...prev, coleta: e.target.value }))}
              />
            </div>
            <div>
              <Label>Entrega</Label>
              <Input
                type="number"
                value={formData.entrega}
                onChange={(e) => setFormData(prev => ({ ...prev, entrega: e.target.value }))}
              />
            </div>
            <div>
              <Label>Outros</Label>
              <Input
                type="number"
                value={formData.outros}
                onChange={(e) => setFormData(prev => ({ ...prev, outros: e.target.value }))}
              />
            </div>
            <div>
              <Label>Pedágio</Label>
              <Input
                type="number"
                value={formData.pedagio}
                onChange={(e) => setFormData(prev => ({ ...prev, pedagio: e.target.value }))}
              />
            </div>
            <div>
              <Label>GRIS</Label>
              <Input
                type="number"
                value={formData.gris}
                onChange={(e) => setFormData(prev => ({ ...prev, gris: e.target.value }))}
              />
            </div>
            <div>
              <Label>TDE</Label>
              <Input
                type="number"
                value={formData.tde}
                onChange={(e) => setFormData(prev => ({ ...prev, tde: e.target.value }))}
              />
            </div>
            <div>
              <Label>TAS</Label>
              <Input
                type="number"
                value={formData.tas}
                onChange={(e) => setFormData(prev => ({ ...prev, tas: e.target.value }))}
              />
            </div>
            <div>
              <Label>Agendamento</Label>
              <Input
                type="number"
                value={formData.agenda}
                onChange={(e) => setFormData(prev => ({ ...prev, agenda: e.target.value }))}
              />
            </div>
            <div>
              <Label>Restrição</Label>
              <Input
                type="number"
                value={formData.restricao}
                onChange={(e) => setFormData(prev => ({ ...prev, restricao: e.target.value }))}
              />
            </div>
            <div>
              <Label>TDA</Label>
              <Input
                type="number"
                value={formData.tda}
                onChange={(e) => setFormData(prev => ({ ...prev, tda: e.target.value }))}
              />
            </div>
            <div>
              <Label>Despacho</Label>
              <Input
                type="number"
                value={formData.despacho}
                onChange={(e) => setFormData(prev => ({ ...prev, despacho: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Desconto, ICMS e Acréscimo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <line x1="19" x2="5" y1="5" y2="19"/>
              <circle cx="6.5" cy="6.5" r="2.5"/>
              <circle cx="17.5" cy="17.5" r="2.5"/>
            </svg>
            Desconto, ICMS e Acréscimo
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <Label>Tipo Desconto</Label>
            <select
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              value={formData.tipoDesconto}
              onChange={(e) => setFormData(prev => ({ ...prev, tipoDesconto: e.target.value as 'percentual' | 'valor' }))}
            >
              <option value="percentual">%</option>
              <option value="valor">R$</option>
            </select>
          </div>
          <div>
            <Label>Valor Desconto</Label>
            <Input
              type="number"
              value={formData.valorDesconto}
              onChange={(e) => setFormData(prev => ({ ...prev, valorDesconto: e.target.value }))}
            />
          </div>
          <div>
            <Label>% ICMS</Label>
            <Input
              type="number"
              value={formData.percICMS}
              onChange={(e) => setFormData(prev => ({ ...prev, percICMS: e.target.value }))}
            />
          </div>
          <div className="flex items-end">
            <div className="flex items-center gap-2">
              <Checkbox
                id="somarICMS"
                checked={formData.somarICM}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, somarICM: checked as boolean }))}
              />
              <Label htmlFor="somarICMS">Somar ICMS</Label>
            </div>
          </div>
          <div>
            <Label>% Acréscimo</Label>
            <Input
              type="number"
              value={formData.percAcrescimo}
              onChange={(e) => setFormData(prev => ({ ...prev, percAcrescimo: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Resumo da Cotação */}
      <Card className="border-primary/50">
        <CardHeader className="pb-2">
          <CardTitle>Resumo da Cotação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Valores por unidade */}
          <div className="grid grid-cols-3 gap-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-center">
              <p className="text-xs text-blue-600 dark:text-blue-400">Valor/Km</p>
              <p className="font-bold text-blue-700 dark:text-blue-300">
                {km > 0 ? formatCurrency(valorPorKm) : '-'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-blue-600 dark:text-blue-400">Valor/Tonelada</p>
              <p className="font-bold text-blue-700 dark:text-blue-300">
                {totals.peso > 0 ? formatCurrency(valorPorTonelada) : '-'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-blue-600 dark:text-blue-400">Valor/Volume</p>
              <p className="font-bold text-blue-700 dark:text-blue-300">
                {totals.volume > 0 ? formatCurrency(valorPorVolume) : '-'}
              </p>
            </div>
          </div>

          {/* Subtotal e Total */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-muted p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Subtotal</p>
              <p className="text-xl font-bold">{formatCurrency(subtotal)}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center border border-green-300">
              <p className="text-sm text-green-600">Valor Total</p>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(total)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Step 4: Observações
interface Step4Props {
  formData: CotacaoFormData;
  setFormData: React.Dispatch<React.SetStateAction<CotacaoFormData>>;
}

const Step4Observacoes = ({ formData, setFormData }: Step4Props) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Observações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>Observações para o Cliente</Label>
            <Textarea
              placeholder="Observações que serão exibidas na cotação..."
              className="min-h-[120px]"
              value={formData.observacoes}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
            />
          </div>
          <div>
            <Label>Observações Internas</Label>
            <Textarea
              placeholder="Observações internas (não serão exibidas na cotação)..."
              className="min-h-[120px]"
              value={formData.observacoesInternas}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoesInternas: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Step 5: Revisão - Novo Layout Compacto
interface Step5Props {
  formData: CotacaoFormData;
  onSave?: (enviarEmail: boolean) => void;
  isSaving?: boolean;
}

const Step5Revisao = ({ formData, onSave, isSaving }: Step5Props) => {
  const [enviarEmail, setEnviarEmail] = useState(false);
  // Calcular totais
  const totals = {
    itens: formData.itens.length,
    peso: formData.itens.reduce((acc, item) => acc + ((item.peso || 0) * (item.quantidade || 1)), 0),
    volume: formData.itens.reduce((acc, item) => acc + (item.quantidade || item.volume || 0), 0),
  };

  const calcularTotal = () => {
    const fretePeso = parseFloat(formData.fretePeso) || 0;
    const freteValor = parseFloat(formData.freteValor) || 0;
    const secat = parseFloat(formData.secat) || 0;
    const coleta = parseFloat(formData.coleta) || 0;
    const entrega = parseFloat(formData.entrega) || 0;
    const outros = parseFloat(formData.outros) || 0;
    const pedagio = parseFloat(formData.pedagio) || 0;
    const gris = parseFloat(formData.gris) || 0;
    const tde = parseFloat(formData.tde) || 0;
    const tas = parseFloat(formData.tas) || 0;
    const agenda = parseFloat(formData.agenda) || 0;
    const restricao = parseFloat(formData.restricao) || 0;
    const tda = parseFloat(formData.tda) || 0;
    const despacho = parseFloat(formData.despacho) || 0;
    
    let subtotal = fretePeso + freteValor + secat + coleta + entrega + outros + 
                   pedagio + gris + tde + tas + agenda + restricao + tda + despacho;

    const desconto = parseFloat(formData.valorDesconto) || 0;
    if (formData.tipoDesconto === 'percentual' && desconto > 0) {
      subtotal -= subtotal * (desconto / 100);
    } else if (desconto > 0) {
      subtotal -= desconto;
    }

    if (formData.somarICM && parseFloat(formData.percICMS) > 0) {
      subtotal += subtotal * (parseFloat(formData.percICMS) / 100);
    }

    if (parseFloat(formData.percAcrescimo) > 0) {
      subtotal += subtotal * (parseFloat(formData.percAcrescimo) / 100);
    }

    return subtotal;
  };

  const formatCurrency = (value: number) => formatCurrencyFn(value);

  return (
    <div className="space-y-4">
      {/* Grid de Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card Clientes */}
        <Card className="col-span-1 sm:col-span-2">
          <CardHeader className="py-2 sm:py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Clientes
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
              <div className="min-w-0">
                <span className="text-muted-foreground text-xs">Remetente</span>
                <p className="font-medium truncate">{formData.remetente?.nome || 'Não informado'}</p>
              </div>
              <div className="min-w-0">
                <span className="text-muted-foreground text-xs">Destinatário</span>
                <p className="font-medium truncate">{formData.destinatario?.nome || 'Não informado'}</p>
              </div>
              <div className="min-w-0">
                <span className="text-muted-foreground text-xs">Tomador</span>
                <p className="font-medium truncate">{formData.tomador?.nome || 'Não informado'}</p>
              </div>
            </div>
            <div className="pt-2 border-t">
              <span className="text-muted-foreground text-xs">Solicitante</span>
              <p className="font-medium">{formData.solicitante || '-'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Card Rota */}
        <Card className="col-span-1 sm:col-span-2">
          <CardHeader className="py-2 sm:py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Rota
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-2 text-sm">
              <div className="flex-1 text-center p-2 bg-muted/50 rounded min-w-0">
                <span className="text-muted-foreground text-xs block">Origem</span>
                <p className="font-medium truncate">
                  {formData.cidadeOrigem 
                    ? `${formData.cidadeOrigem.cidade}/${formData.cidadeOrigem.uf}` 
                    : '-'}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 text-center p-2 bg-muted/50 rounded min-w-0">
                <span className="text-muted-foreground text-xs block">Destino</span>
                <p className="font-medium truncate">
                  {formData.cidadeDestino 
                    ? `${formData.cidadeDestino.cidade}/${formData.cidadeDestino.uf}` 
                    : '-'}
                </p>
              </div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Km: {formData.km || '0'}</span>
              <span>Rota: {formData.rota || '-'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Card Carga */}
        <Card>
          <CardHeader className="py-2 sm:py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Carga
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Itens:</span>
              <span className="font-medium">{totals.itens}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Peso total:</span>
              <span className="font-medium">{totals.peso.toFixed(2)} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Volumes:</span>
              <span className="font-medium">{totals.volume}</span>
            </div>
          </CardContent>
        </Card>

        {/* Card Valor Total */}
        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CardHeader className="py-2 sm:py-3">
            <CardTitle className="text-sm flex items-center gap-2 text-green-700 dark:text-green-400">
              <Calculator className="h-4 w-4" />
              Valor Total
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xl sm:text-2xl font-bold text-green-700 dark:text-green-400">
              {formatCurrency(calcularTotal())}
            </p>
            <div className="text-xs text-green-600 dark:text-green-500 mt-1 space-y-0.5">
              <p><span className="text-muted-foreground">Tabela:</span> {formData.nomeTabela || '-'}</p>
              <p><span className="text-muted-foreground">Código:</span> {formData.idTabela || '-'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Card Condições */}
        <Card>
          <CardHeader className="py-2 sm:py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Condições
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Validade:</span>
              <span className="font-medium">{formData.validadeDias || 7} dias</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Prazo pgto:</span>
              <span className="font-medium">{formData.diasPagamento || '0'} dias</span>
            </div>
          </CardContent>
        </Card>

        {/* Card Observações */}
        <Card className="col-span-1 sm:col-span-2">
          <CardHeader className="py-2 sm:py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Observações
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2 text-sm">
            {formData.observacoes || formData.observacoesInternas ? (
              <>
                {formData.observacoes && (
                  <div>
                    <span className="text-muted-foreground text-xs">Para o cliente:</span>
                    <p className="text-sm line-clamp-2">{formData.observacoes}</p>
                  </div>
                )}
                {formData.observacoesInternas && (
                  <div>
                    <span className="text-muted-foreground text-xs">Internas:</span>
                    <p className="text-sm text-muted-foreground line-clamp-2">{formData.observacoesInternas}</p>
                  </div>
                )}
              </>
            ) : (
              <span className="text-muted-foreground text-xs">Nenhuma observação</span>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Banner Pronto para Salvar */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm sm:text-base">Pronto para salvar?</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Revise os dados acima antes de confirmar.</p>
              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  id="enviar-email-cliente"
                  checked={enviarEmail}
                  onCheckedChange={(checked) => setEnviarEmail(checked === true)}
                />
                <Label htmlFor="enviar-email-cliente" className="text-sm cursor-pointer">
                  Enviar email ao cliente
                </Label>
              </div>
            </div>
            <Button 
              onClick={() => onSave?.(enviarEmail)}
              disabled={isSaving}
              className="gap-2 h-10 sm:h-11 px-4 sm:px-8 bg-orange-500 hover:bg-orange-600 w-full sm:w-auto"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 sm:h-5 sm:w-5">
                  <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/>
                  <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/>
                  <path d="M7 3v4a1 1 0 0 0 1 1h7"/>
                </svg>
              )}
              {isSaving ? 'Salvando...' : 'Salvar Cotação'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditCotacaoModal;
