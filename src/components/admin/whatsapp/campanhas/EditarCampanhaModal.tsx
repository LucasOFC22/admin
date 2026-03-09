import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { backendService } from '@/services/api/backendService';
import { Campanha, useCampanhas } from '@/hooks/useCampanhas';
import { Loader2, RefreshCw, Users, UserPlus, X, CheckCircle2, Calendar, Clock, User, Workflow } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/lib/toast';
import { format } from 'date-fns';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { useDebounce } from '@/hooks/useDebounce';
import { useFlowSelect } from '@/hooks/useFlowSelect';
import { usePhoneVisibility } from '@/hooks/usePhoneVisibility';

interface EditarCampanhaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campanha: Campanha;
  onSuccess: () => void;
}

interface ContatoWhatsApp {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  perfil?: string;
}

interface TemplateData {
  id: string;
  name: string;
  language: string;
  category: string;
  status: string;
}

const PAGE_SIZE = 50;

// Componente de item de contato memoizado para evitar re-renders durante busca
const ContatoRow = React.memo(({ 
  contato, 
  isSelected,
  jaAdicionado,
  onToggle,
  displayPhone
}: { 
  contato: ContatoWhatsApp; 
  isSelected: boolean;
  jaAdicionado: boolean;
  onToggle: (id: string) => void;
  displayPhone: (phone: string | undefined | null) => string;
}) => {
  const handleToggle = useCallback(() => {
    if (!jaAdicionado) {
      onToggle(contato.id);
    }
  }, [contato.id, jaAdicionado, onToggle]);

  const handleCheckboxClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <div
      className={cn(
        "p-2 flex items-center gap-2 sm:gap-3 hover:bg-muted/50 cursor-pointer border-b border-border/30 transition-colors",
        jaAdicionado && 'opacity-50',
        isSelected && !jaAdicionado && 'bg-primary/10 border-l-2 border-l-primary'
      )}
      onClick={handleToggle}
    >
      <Checkbox
        checked={isSelected || jaAdicionado}
        disabled={jaAdicionado}
        onCheckedChange={handleToggle}
        onClick={handleCheckboxClick}
      />
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={contato.perfil} alt={contato.nome} />
        <AvatarFallback>
          {contato.nome ? contato.nome.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{contato.nome || 'Sem nome'}</p>
        <p className="text-xs text-muted-foreground">{displayPhone(contato.telefone)}</p>
      </div>
      {jaAdicionado && (
        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Comparação customizada: só re-renderiza se props relevantes mudarem
  return prevProps.contato.id === nextProps.contato.id &&
         prevProps.isSelected === nextProps.isSelected &&
         prevProps.jaAdicionado === nextProps.jaAdicionado;
});

ContatoRow.displayName = 'ContatoRow';

const EditarCampanhaModal = ({ open, onOpenChange, campanha, onSuccess }: EditarCampanhaModalProps) => {
  const queryClient = useQueryClient();
  const { updateCampanha, addContatos, removeContatos, getContatos } = useCampanhas();
  const { canAccess, isLoadingCargoPermissions } = usePermissionGuard();
  const { flows, loading: loadingFlows } = useFlowSelect();
  const { displayPhone } = usePhoneVisibility();
  
  // Verificar permissões
  const canEdit = canAccess('admin.campanhas.editar');
  
  // Form state
  const [nome, setNome] = useState(campanha.nome);
  const [descricao, setDescricao] = useState(campanha.descricao || '');
  const [templateName, setTemplateName] = useState(campanha.template_name);
  const [templateLanguage, setTemplateLanguage] = useState(campanha.template_language || 'pt_BR');
  const [flowId, setFlowId] = useState(campanha.flow_id || 'none');
  const [saving, setSaving] = useState(false);
  
  // Agendamento
  const [agendarEnvio, setAgendarEnvio] = useState(!!campanha.agendado_para);
  const [dataAgendamento, setDataAgendamento] = useState(
    campanha.agendado_para ? format(new Date(campanha.agendado_para), 'yyyy-MM-dd') : ''
  );
  const [horaAgendamento, setHoraAgendamento] = useState(
    campanha.agendado_para ? format(new Date(campanha.agendado_para), 'HH:mm') : ''
  );
  
  // Contact selection state
  const [searchContato, setSearchContato] = useState('');
  const [selectedContatos, setSelectedContatos] = useState<Set<string>>(new Set());
  const [enviarParaTodos, setEnviarParaTodos] = useState(false);
  const [addingContatos, setAddingContatos] = useState(false);
  const debouncedSearch = useDebounce(searchContato, 300);
  
  // Fetch conexões
  const { data: conexoes = [] } = useQuery({
    queryKey: ['conexoes-whatsapp-edit'],
    queryFn: async () => {
      const supabase = requireAuthenticatedClient();
      const { data } = await supabase
        .from('conexoes')
        .select('id, nome, status, whatsapp_business_account_id');
      return data || [];
    }
  });

  // Fetch templates
  const { data: templates = [], isLoading: loadingTemplates, refetch: refetchTemplates } = useQuery({
    queryKey: ['templates-whatsapp-edit', campanha.conexao_id],
    queryFn: async () => {
      if (!campanha.conexao_id) return [];
      const response = await backendService.buscarModelosWhatsApp(campanha.conexao_id);
      if (response.success && response.data) {
        return response.data.filter((t: any) => t.status === 'approved') as TemplateData[];
      }
      return [];
    },
    enabled: !!campanha.conexao_id
  });

  // Auto-selecionar idioma quando selecionar um template
  useEffect(() => {
    if (templateName && templates.length > 0) {
      const selectedTemplate = templates.find((t: TemplateData) => t.name === templateName);
      if (selectedTemplate?.language) {
        setTemplateLanguage(selectedTemplate.language);
      }
    }
  }, [templateName, templates]);

  // Fetch contatos com infinite scroll
  const {
    data: contatosData,
    isLoading: loadingContatos,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage
  } = useInfiniteQuery({
    queryKey: ['contatos-whatsapp-infinite-editar', debouncedSearch],
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
        contatos: (data || []) as ContatoWhatsApp[], 
        total: count || 0,
        nextPage: data && data.length === PAGE_SIZE ? pageParam + 1 : undefined
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0
  });

  // Flatten all pages into single array
  const contatosDisponiveis = useMemo(() => {
    return contatosData?.pages.flatMap(page => page.contatos) || [];
  }, [contatosData]);

  // Derive total directly from query (no state needed)
  const totalContatos = contatosData?.pages?.[0]?.total ?? 0;


  // Scroll handler for infinite loading
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const bottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 100;
    if (bottom && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const contatosFiltrados = contatosDisponiveis;

  // Fetch contatos já adicionados à campanha
  const { data: contatosCampanha = [], refetch: refetchContatosCampanha } = useQuery({
    queryKey: ['contatos-campanha', campanha.id],
    queryFn: async () => {
      const contatos = await getContatos(campanha.id);
      return contatos;
    }
  });

  // IDs já na campanha
  const contatosNaCampanhaIds = useMemo(() => {
    return new Set(contatosCampanha.map(c => c.contato_id).filter(Boolean));
  }, [contatosCampanha]);

  // Mapa de contatos disponíveis por ID para buscar perfil na lista "Na Campanha"
  const contatosById = useMemo(() => {
    return new Map(contatosDisponiveis.map(c => [c.id, c]));
  }, [contatosDisponiveis]);

  // Handler memoizado para toggle de contato
  const handleSelectContato = useCallback((contatoId: string) => {
    setSelectedContatos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(contatoId)) {
        newSet.delete(contatoId);
      } else {
        newSet.add(contatoId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedContatos(prev => {
      if (prev.size === contatosFiltrados.length) {
        return new Set();
      } else {
        return new Set(contatosFiltrados.map(c => c.id));
      }
    });
  }, [contatosFiltrados]);

  const handleAdicionarContatos = async () => {
    // Verificar permissão
    if (!canEdit) {
      toast.error('Você não tem permissão para editar campanhas');
      return;
    }
    
    if (selectedContatos.size === 0 && !enviarParaTodos) {
      toast.error('Selecione pelo menos um contato');
      return;
    }

    setAddingContatos(true);
    try {
      let contatosParaAdicionar: ContatoWhatsApp[];
      
      if (enviarParaTodos) {
        // Adicionar todos que ainda não estão na campanha
        contatosParaAdicionar = contatosDisponiveis.filter(c => !contatosNaCampanhaIds.has(c.id));
      } else {
        // Adicionar apenas os selecionados que ainda não estão
        contatosParaAdicionar = contatosDisponiveis.filter(c => 
          selectedContatos.has(c.id) && !contatosNaCampanhaIds.has(c.id)
        );
      }

      if (contatosParaAdicionar.length === 0) {
        toast.info('Todos os contatos selecionados já estão na campanha');
        setAddingContatos(false);
        return;
      }

      const records = contatosParaAdicionar.map(c => ({
        telefone: c.telefone,
        nome: c.nome,
        contato_id: c.id
      }));

      const success = await addContatos(campanha.id, records);
      if (success) {
        setSelectedContatos(new Set());
        setEnviarParaTodos(false);
        refetchContatosCampanha();
        queryClient.invalidateQueries({ queryKey: ['campanhas'] });
      }
    } catch (error) {
      console.error('Erro ao adicionar contatos:', error);
      const err = error as any;
      const details = err?.code ? `Código: ${err.code} - ${err.message}` : (err?.message || 'Erro desconhecido');
      toast.error('Erro ao adicionar contatos', { description: details, duration: 6000 });
    } finally {
      setAddingContatos(false);
    }
  };

  const handleRemoverContato = async (contatoCampanhaId: string) => {
    // Verificar permissão
    if (!canEdit) {
      toast.error('Você não tem permissão para editar campanhas');
      return;
    }
    
    const success = await removeContatos(campanha.id, [contatoCampanhaId]);
    if (success) {
      refetchContatosCampanha();
      queryClient.invalidateQueries({ queryKey: ['campanhas'] });
    }
  };

  const handleSalvar = async () => {
    // Verificar permissão
    if (!canEdit) {
      toast.error('Você não tem permissão para editar campanhas');
      return;
    }
    
    if (!nome || !templateName) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    // Validar agendamento
    let agendadoPara: string | undefined | null = null;
    if (agendarEnvio) {
      if (!dataAgendamento || !horaAgendamento) {
        toast.error('Preencha a data e hora do agendamento');
        return;
      }
      const dataHora = new Date(`${dataAgendamento}T${horaAgendamento}`);
      if (dataHora <= new Date()) {
        toast.error('A data de agendamento deve ser no futuro');
        return;
      }
      agendadoPara = dataHora.toISOString();
    }

    setSaving(true);
    const result = await updateCampanha(campanha.id, {
      nome,
      descricao: descricao || undefined,
      template_name: templateName,
      template_language: templateLanguage,
      agendado_para: agendadoPara,
      flow_id: flowId && flowId !== 'none' ? flowId : null
    });
    setSaving(false);

    if (result) {
      onSuccess();
    }
  };

  const conexaoAtual = conexoes.find(c => c.id === campanha.conexao_id);
  const selectedTemplate = templates.find((t: TemplateData) => t.name === templateName);
  const hoje = new Date().toISOString().split('T')[0];
  

  // Verificar se não tem permissão
  if (!isLoadingCargoPermissions && !canEdit) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Acesso Negado</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <p className="text-muted-foreground">Você não tem permissão para editar campanhas.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1rem)] sm:w-[95vw] md:max-w-5xl lg:max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col p-3 sm:p-6">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex flex-wrap items-center gap-2">
            Editar Campanha
            <Badge variant="outline">{campanha.status}</Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="dados" className="flex-1 overflow-hidden flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
            <TabsTrigger value="dados" className="text-xs sm:text-sm">Dados</TabsTrigger>
            <TabsTrigger value="contatos" className="text-xs sm:text-sm">
              Contatos ({contatosCampanha.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="flex-1 overflow-auto space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Campanha *</Label>
              <Input
                id="nome"
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Ex: Promoção de Natal"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                placeholder="Descrição opcional..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Conexão WhatsApp</Label>
              <div className="p-3 bg-muted rounded-md text-sm">
                {conexaoAtual?.nome || 'Conexão não encontrada'}
                <span className="text-xs text-muted-foreground ml-2">
                  (não pode ser alterada)
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Template de Mensagem *</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => refetchTemplates()}
                  disabled={loadingTemplates}
                  className="h-6 px-2"
                >
                  <RefreshCw className={`h-3 w-3 ${loadingTemplates ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <Select value={templateName} onValueChange={setTemplateName} disabled={loadingTemplates}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={loadingTemplates ? "Carregando..." : "Selecione"} />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t: TemplateData) => (
                    <SelectItem key={t.id} value={t.name}>
                      <div className="flex items-center gap-2">
                        <span>{t.name}</span>
                        <Badge variant="secondary" className="text-xs">{t.category}</Badge>
                        <Badge variant="outline" className="text-xs">{t.language}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTemplate && (
                <p className="text-xs text-muted-foreground">
                  Idioma: <span className="font-medium">{selectedTemplate.language}</span>
                </p>
              )}
            </div>

            {/* Agendamento */}
            <div className="space-y-3 border rounded-lg p-3 bg-muted/30">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="agendar-edit"
                  checked={agendarEnvio}
                  onCheckedChange={(checked) => setAgendarEnvio(!!checked)}
                />
                <Label htmlFor="agendar-edit" className="cursor-pointer flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Agendar envio para data específica
                </Label>
              </div>
              
              {agendarEnvio && (
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Data</Label>
                    <Input
                      type="date"
                      value={dataAgendamento}
                      onChange={e => setDataAgendamento(e.target.value)}
                      min={hoje}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Hora</Label>
                    <Input
                      type="time"
                      value={horaAgendamento}
                      onChange={e => setHoraAgendamento(e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Fluxo de Resposta */}
            <div className="space-y-2 border rounded-lg p-3 bg-muted/30">
              <div className="flex items-center gap-2">
                <Workflow className="h-4 w-4 text-primary" />
                <Label className="font-medium">Fluxo de Resposta (opcional)</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Quando um contato responder à campanha, o fluxo selecionado será iniciado automaticamente.
              </p>
              <Select value={flowId} onValueChange={setFlowId} disabled={loadingFlows}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={loadingFlows ? "Carregando..." : "Selecione um fluxo"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum fluxo</SelectItem>
                  {flows.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="contatos" className="flex-1 overflow-hidden flex flex-col mt-4 min-h-0">
            {/* Layout responsivo: stack no mobile, duas colunas a partir de md (768px) */}
            <div className="flex-1 flex flex-col md:flex-row gap-3 min-h-0 overflow-hidden">
              
              {/* Coluna 1: Contatos já na campanha - compacta quando vazia */}
              <div className={cn(
                "flex flex-col border rounded-lg overflow-hidden flex-shrink-0",
                contatosCampanha.length === 0 
                  ? "h-[80px] md:h-auto md:w-[200px]" 
                  : "h-[180px] md:h-auto md:w-[35%]"
              )}>
                <div className="px-3 py-2 border-b bg-muted/50 flex items-center gap-2 flex-shrink-0">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">Na Campanha</span>
                  <Badge variant="secondary" className="text-xs">{contatosCampanha.length}</Badge>
                </div>
                
                <ScrollArea className="flex-1 min-h-0">
                  {contatosCampanha.length === 0 ? (
                    <div className="p-3 text-center text-muted-foreground flex items-center justify-center gap-2 h-full">
                      <Users className="h-4 w-4 opacity-50" />
                      <span className="text-xs">Nenhum contato</span>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {contatosCampanha.map(contato => {
                        const contatoCompleto = contato.contato_id ? contatosById.get(contato.contato_id) : null;
                        return (
                          <div key={contato.id} className="px-2 py-1.5 flex items-center justify-between hover:bg-muted/50 gap-2 transition-colors">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <Avatar className="h-7 w-7 flex-shrink-0">
                                <AvatarImage src={contatoCompleto?.perfil} alt={contato.nome} />
                                <AvatarFallback className="text-[10px]">
                                  {contato.nome ? contato.nome.charAt(0).toUpperCase() : <User className="h-3 w-3" />}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{contato.nome || 'Sem nome'}</p>
                                <p className="text-[10px] text-muted-foreground">{contato.telefone}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Badge 
                                variant={contato.status === 'enviado' ? 'default' : contato.status === 'erro' ? 'destructive' : 'outline'} 
                                className="text-[9px] px-1 py-0"
                              >
                                {contato.status}
                              </Badge>
                              {contato.status === 'pendente' && canEdit && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
                                  onClick={() => handleRemoverContato(contato.id)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Coluna 2: Adicionar contatos - ocupa o espaço restante */}
              <div className="flex-1 flex flex-col border rounded-lg overflow-hidden min-h-0">
                {/* Header com busca */}
                <div className="p-3 border-b bg-muted/50 flex-shrink-0 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">Adicionar Contatos</span>
                      {selectedContatos.size > 0 && (
                        <Badge className="bg-primary text-primary-foreground text-xs">
                          {selectedContatos.size} selecionados
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {selectedContatos.size > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setSelectedContatos(new Set())}
                          className="h-7 text-xs px-2"
                        >
                          Limpar
                        </Button>
                      )}
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="enviar-todos"
                          checked={enviarParaTodos}
                          onCheckedChange={(checked) => setEnviarParaTodos(!!checked)}
                          disabled={!canEdit}
                        />
                        <Label htmlFor="enviar-todos" className="text-xs cursor-pointer whitespace-nowrap">
                          Todos ({totalContatos})
                        </Label>
                      </div>
                    </div>
                  </div>
                  
                  {/* Busca */}
                  <div className="relative">
                    <Input
                      placeholder="Buscar por nome ou telefone..."
                      value={searchContato}
                      onChange={e => setSearchContato(e.target.value)}
                      className="h-9 pl-9 pr-8"
                      disabled={enviarParaTodos}
                    />
                    <svg 
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <circle cx="11" cy="11" r="8"/>
                      <path d="m21 21-4.3-4.3"/>
                    </svg>
                    {searchContato && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                        onClick={() => setSearchContato('')}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  
                  {debouncedSearch && (
                    <p className="text-xs text-muted-foreground">
                      {totalContatos} resultado(s) para "{debouncedSearch}"
                    </p>
                  )}
                </div>

                {!enviarParaTodos && (
                  <>
                    {/* Barra de seleção */}
                    <div className="px-3 py-2 border-b flex items-center justify-between text-xs flex-shrink-0 bg-background">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleSelectAll} 
                        className="h-7 text-xs px-2" 
                        disabled={!canEdit}
                      >
                        {selectedContatos.size === contatosFiltrados.length && contatosFiltrados.length > 0 
                          ? 'Desmarcar todos' 
                          : 'Selecionar carregados'
                        }
                      </Button>
                      <span className="text-muted-foreground">
                        {selectedContatos.size} selecionados • {contatosFiltrados.length} de {totalContatos}
                      </span>
                    </div>

                    {/* Lista de contatos com infinite scroll */}
                    <ScrollArea className="flex-1" onScrollCapture={handleScroll}>
                      {loadingContatos && contatosFiltrados.length === 0 ? (
                        <div className="p-8 flex flex-col items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <p className="text-sm text-muted-foreground mt-2">Carregando contatos...</p>
                        </div>
                      ) : contatosFiltrados.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                          <svg 
                            className="h-10 w-10 mx-auto mb-3 opacity-30" 
                            xmlns="http://www.w3.org/2000/svg" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2"
                          >
                            <circle cx="11" cy="11" r="8"/>
                            <path d="m21 21-4.3-4.3"/>
                          </svg>
                          <p className="text-sm font-medium">Nenhum contato encontrado</p>
                          <p className="text-xs mt-1">Tente buscar com outro termo</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-border/50">
                          {contatosFiltrados.map(contato => {
                            const jaAdicionado = contatosNaCampanhaIds.has(contato.id);
                            return (
                              <ContatoRow
                                key={contato.id}
                                contato={contato}
                                isSelected={selectedContatos.has(contato.id)}
                                jaAdicionado={jaAdicionado}
                                onToggle={handleSelectContato}
                                displayPhone={displayPhone}
                              />
                            );
                          })}
                          {(isFetchingNextPage || hasNextPage) && (
                            <div className="p-4 flex items-center justify-center">
                              {isFetchingNextPage ? (
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                              ) : hasNextPage ? (
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => fetchNextPage()}
                                  className="text-xs"
                                >
                                  Carregar mais...
                                </Button>
                              ) : null}
                            </div>
                          )}
                        </div>
                      )}
                    </ScrollArea>
                  </>
                )}

                {enviarParaTodos && (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <CheckCircle2 className="h-12 w-12 text-primary mb-3" />
                    <p className="text-sm font-medium">Todos os contatos serão adicionados</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {contatosDisponiveis.length - contatosNaCampanhaIds.size} contatos novos serão incluídos
                    </p>
                  </div>
                )}

                {/* Footer sticky com botão de adicionar */}
                <div className="p-3 border-t flex-shrink-0 bg-background">
                  <Button
                    className="w-full"
                    onClick={handleAdicionarContatos}
                    disabled={addingContatos || (!enviarParaTodos && selectedContatos.size === 0) || !canEdit}
                  >
                    {addingContatos && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <UserPlus className="h-4 w-4 mr-2" />
                    {enviarParaTodos 
                      ? `Adicionar todos (${contatosDisponiveis.length - contatosNaCampanhaIds.size})`
                      : `Adicionar ${selectedContatos.size} contato${selectedContatos.size !== 1 ? 's' : ''}`
                    }
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4 flex-col sm:flex-row gap-2 flex-shrink-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Fechar
          </Button>
          <Button onClick={handleSalvar} disabled={saving || !nome || !templateName || !canEdit} className="w-full sm:w-auto">
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditarCampanhaModal;
