// WhatsApp Kanban Config Component
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Save, RefreshCw, User, FileText, Settings, Check, X, Phone, Plus, MoreVertical, MessageCircle, Copy, ExternalLink, ShieldCheck, AlertCircle, CheckCircle2, Pencil, Variable, Info, Clock } from 'lucide-react';
import { whatsappConfigService, WhatsAppConfig, TemplateVariableMapping } from '@/services/supabase/whatsappConfigService';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import WhatsAppAccountCard from './WhatsAppAccountCard';
import WhatsAppCredentialsCard from './WhatsAppCredentialsCard';
import CreateTemplatePage from './CreateTemplatePage';
import { backendService } from '@/services/api/backendService';
import { availableVariables } from '@/utils/messageVariables';
import { MessageTemplateSelector } from './WhatsAppTemplateSelector';
import { MessagePreview } from './MessagePreview';
import { MessageConfigCard } from './MessageConfigCard';
import { InactivityConfigCard } from './InactivityConfigCard';
import { WhatsAppBusinessHoursConfig } from './WhatsAppBusinessHoursConfig';

type TabType = 'perfil' | 'templates' | 'config' | 'horario' | 'create' | 'edit';

interface Conexao {
  id: string;
  nome: string;
  canal: string;
  status: string;
  telefone: string;
  is_default: boolean;
  whatsapp_business_account_id?: string;
}

interface WhatsAppBusinessInfo {
  phone: {
    id: string;
    display_phone_number: string;
    verified_name: string;
    quality_rating: string;
    platform_type: string;
    name_status: string;
    code_verification_status: string;
    is_official_business_account: boolean;
    messaging_limit_tier: string;
    messaging_limit_display: string;
    throughput: { level: string };
  };
  profile_picture_url: string | null;
  account: {
    id: string;
    name: string;
    currency: string;
    timezone_id: string;
    account_review_status: string;
    business_verification_status: string;
    ownership_type: string;
    credit_line_status: string;
  } | null;
  connection: {
    id: string;
    nome: string;
    status: string;
    telefone: string;
    is_default: boolean;
  };
}

interface MessageTemplate {
  id: string;
  name: string;
  category: string;
  language: string;
  status: 'approved' | 'pending' | 'rejected';
  components?: any[];
  quality_score?: any;
  rejected_reason?: string;
}

const validSubTabs: TabType[] = ['perfil', 'templates', 'config', 'horario', 'create', 'edit'];

const WhatsAppKanbanConfig = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extrair sub-aba do hash (ex: #whatsapp-conta -> conta)
  const getActiveTab = (): TabType => {
    const hash = location.hash.replace('#', '');
    if (hash.startsWith('whatsapp-')) {
      const subTab = hash.replace('whatsapp-', '') as TabType;
      if (validSubTabs.includes(subTab)) return subTab;
    }
    return 'perfil';
  };

  const activeTab = getActiveTab();
  
  const handleTabChange = (tabId: TabType) => {
    navigate(`#whatsapp-${tabId}`, { replace: true });
  };

  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [conexao, setConexao] = useState<Conexao | null>(null);
  const [businessInfo, setBusinessInfo] = useState<WhatsAppBusinessInfo | null>(null);
  const [loadingBusinessInfo, setLoadingBusinessInfo] = useState(false);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshingTemplates, setRefreshingTemplates] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);

  const tabs = [
    { id: 'perfil' as TabType, label: 'Perfil', icon: User },
    { id: 'templates' as TabType, label: 'Templates', icon: FileText },
    { id: 'config' as TabType, label: 'Configurações', icon: Settings },
    { id: 'horario' as TabType, label: 'Horário', icon: Clock },
  ];

  const fetchBusinessInfo = async (conexaoId: string) => {
    setLoadingBusinessInfo(true);
    try {
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase.functions.invoke('whatsapp-business-info', {
        body: { conexaoId }
      });

      if (error) {
        console.error('Erro ao buscar info do WhatsApp Business:', error);
        return;
      }

      if (data) {
        setBusinessInfo(data);
      }
    } catch (error) {
      console.error('Erro ao buscar info do WhatsApp Business:', error);
    } finally {
      setLoadingBusinessInfo(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load WhatsApp config
      const configData = await whatsappConfigService.getConfig();
      setConfig(configData);

      // Load conexao (single record)
      const supabase = requireAuthenticatedClient();
      const { data: conexaoData } = await supabase
        .from('conexoes')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (conexaoData) {
        const conexaoInfo: Conexao = {
          id: conexaoData.id,
          nome: conexaoData.nome || 'WhatsApp',
          canal: conexaoData.canal || 'whatsapp',
          status: conexaoData.status || 'disconnected',
          telefone: conexaoData.telefone || '',
          is_default: conexaoData.is_default ?? true,
          whatsapp_business_account_id: conexaoData.whatsapp_business_account_id,
        };
        setConexao(conexaoInfo);
        
        // Load business info from API
        await fetchBusinessInfo(conexaoInfo.id);
      }

      // Load message templates via Edge Function
      if (conexaoData) {
        const templatesResponse = await backendService.buscarModelosWhatsApp(conexaoData.id);
        
        if (templatesResponse.success && templatesResponse.data) {
          setTemplates(templatesResponse.data.map((t: any) => ({
            id: t.id,
            name: t.name,
            category: t.category || 'UTILITY',
            language: t.language || 'pt_BR',
            status: t.status || 'pending',
            components: t.components,
            quality_score: t.quality_score,
            rejected_reason: t.rejected_reason
          })));
        } else {
          console.warn('Erro ao buscar templates:', templatesResponse.error);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Não foi possível carregar as configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (field: keyof WhatsAppConfig, value: boolean) => {
    if (!config) return;
    setConfig(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleTextChange = (field: keyof WhatsAppConfig, value: string) => {
    if (!config) return;
    setConfig(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleVariablesChange = (field: keyof WhatsAppConfig, value: TemplateVariableMapping[]) => {
    if (!config) return;
    setConfig(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSave = async () => {
    if (!config) return;

    setSaving(true);
    try {
      await whatsappConfigService.saveConfig(config);
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Não foi possível salvar as configurações');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const renderSettingRow = (
    label: string, 
    description: string, 
    action: React.ReactNode,
    disabled?: boolean
  ) => (
    <div className={cn(
      "flex items-center justify-between py-4 border-b border-border/50 last:border-b-0",
      disabled && "opacity-50"
    )}>
      <div className="flex-1 min-w-0 pr-4">
        <Label className="text-sm font-medium text-foreground">{label}</Label>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="flex-shrink-0">
        {action}
      </div>
    </div>
  );

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.info(`${label} copiado para a área de transferência`);
  };

  const getStatusColor = (status: string) => {
    const normalizedStatus = status?.toLowerCase();
    if (normalizedStatus === 'connected' || normalizedStatus === 'approved' || normalizedStatus === 'verified') {
      return 'text-green-600';
    }
    if (normalizedStatus === 'pending' || normalizedStatus === 'in_review') {
      return 'text-yellow-600';
    }
    return 'text-red-600';
  };

  const renderContaTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Conta WhatsApp</h2>
          <p className="text-sm text-muted-foreground mt-1">Informações da conexão configurada</p>
        </div>
      </div>

      <WhatsAppAccountCard />
      
      <WhatsAppCredentialsCard />
    </div>
  );


  const handleRefreshTemplates = async () => {
    if (!conexao?.id) return;
    
    setRefreshingTemplates(true);
    try {
      const templatesResponse = await backendService.buscarModelosWhatsApp(conexao.id);
      
      if (templatesResponse.success && templatesResponse.data) {
        setTemplates(templatesResponse.data.map((t: any) => ({
          id: t.id,
          name: t.name,
          category: t.category || 'UTILITY',
          language: t.language || 'pt_BR',
          status: t.status || 'pending',
          components: t.components,
          quality_score: t.quality_score,
          rejected_reason: t.rejected_reason
        })));
        toast.success(`${templatesResponse.data.length} modelos carregados`);
      } else {
        toast.error(templatesResponse.error || 'Erro ao atualizar modelos');
      }
    } catch (error) {
      console.error('Erro ao atualizar templates:', error);
      toast.error('Não foi possível atualizar os modelos');
    } finally {
      setRefreshingTemplates(false);
    }
  };

  const renderModelosTab = () => (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Meus Modelos</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Os modelos do WhatsApp são mensagens pré-aprovadas necessárias para transmissões. Geralmente, o Meta aprova esses modelos em questão de minutos, mas em algumas situações pode levar até 24 horas. Você também pode utilizar modelos dentro do chat ao vivo e em outras automações. <a href="#" className="text-primary hover:underline">Saiba mais</a>
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleRefreshTemplates}
            disabled={refreshingTemplates}
            title="Atualizar modelos"
          >
            <RefreshCw className={cn("h-4 w-4", refreshingTemplates && "animate-spin")} />
          </Button>
          <Button className="gap-2" onClick={() => navigate('#whatsapp-create', { replace: true })}>
            <Plus className="h-4 w-4" />
            Criar modelo
          </Button>
        </div>
      </div>

      {/* Templates Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="w-10 p-3">
                <Checkbox />
              </th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Nome</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Categoria</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Idioma</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Status</th>
              <th className="w-10 p-3"></th>
            </tr>
          </thead>
          <tbody>
            {templates.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-muted-foreground">
                  Nenhum modelo cadastrado ainda
                </td>
              </tr>
            ) : (
              templates.map((template) => (
                <tr key={template.id} className="border-t hover:bg-muted/30 transition-colors">
                  <td className="p-3">
                    <Checkbox />
                  </td>
                  <td className="p-3 text-sm font-medium text-foreground">
                    {template.name}
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {template.category}
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {template.language}
                  </td>
                  <td className="p-3">
                    <span className={cn(
                      "inline-flex items-center gap-1 text-sm",
                      template.status === 'approved' && "text-green-600",
                      template.status === 'pending' && "text-yellow-600",
                      template.status === 'rejected' && "text-red-600"
                    )}>
                      {template.status === 'approved' && <Check className="h-4 w-4" />}
                      {template.status === 'approved' ? 'Aprovado' : 
                       template.status === 'pending' ? 'Pendente' : 'Rejeitado'}
                    </span>
                  </td>
                  <td className="p-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => {
                            setEditingTemplate(template);
                            navigate('#whatsapp-edit', { replace: true });
                          }}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );

  const renderConfigTab = () => (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h2 className="text-xl font-semibold text-foreground">Configurações Gerais</h2>
        <p className="text-sm text-muted-foreground mt-1">Opções de comportamento e mensagens automáticas</p>
      </div>

      <div className="space-y-1">
        {renderSettingRow(
          "Avaliações de Atendimento",
          "Permitir que clientes avaliem o atendimento após finalizar",
          <Switch
            checked={config?.user_rating ?? false}
            onCheckedChange={(checked) => handleToggle('user_rating', checked)}
          />
        )}

        {renderSettingRow(
          "Enviar Assinatura",
          "Permite que atendentes enviem assinatura nas mensagens",
          <Switch
            checked={config?.send_sign_message ?? true}
            onCheckedChange={(checked) => handleToggle('send_sign_message', checked)}
          />
        )}

        {renderSettingRow(
          "Aceitar Áudio",
          "Aceitar mensagens de áudio de todos os contatos",
          <Switch
            checked={config?.accept_audio_message_contact ?? true}
            onCheckedChange={(checked) => handleToggle('accept_audio_message_contact', checked)}
          />
        )}

        {renderSettingRow(
          "Aceitar Ligações",
          "Permitir receber ligações pelo WhatsApp",
          <Switch
            checked={config?.accept_call_whatsapp ?? true}
            onCheckedChange={(checked) => handleToggle('accept_call_whatsapp', checked)}
          />
        )}

        {renderSettingRow(
          "Desativar Assinatura",
          "Permite ao atendente desativar assinaturas nas mensagens",
          <Switch
            checked={config?.disable_signature ?? false}
            onCheckedChange={(checked) => handleToggle('disable_signature', checked)}
          />
        )}

        {renderSettingRow(
          "Ocultar Tickets ChatBot",
          "Somente admins (cargo ID 1) visualizam tickets em interação com bots",
          <Switch
            checked={config?.hide_chatbot_tickets ?? false}
            onCheckedChange={(checked) => handleToggle('hide_chatbot_tickets', checked)}
          />
        )}
      </div>

      {/* Messages Section */}
      <div className="border-t pt-6">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
          Mensagens Automáticas
        </h3>

        <div className="space-y-1">
          {/* Transferência */}
          <MessageConfigCard
            title="Mensagem de Transferência"
            description="Enviada quando um ticket é transferido para outra fila"
            enabled={config?.send_msg_transf_ticket ?? false}
            onEnabledChange={(checked) => handleToggle('send_msg_transf_ticket', checked)}
            message={config?.transfer_message ?? ''}
            onMessageChange={(value) => handleTextChange('transfer_message', value)}
            useTemplate={config?.transfer_use_template ?? false}
            onUseTemplateChange={(checked) => handleToggle('transfer_use_template', checked)}
            templateName={config?.transfer_template_name ?? ''}
            onTemplateNameChange={(value) => handleTextChange('transfer_template_name', value)}
            templateLanguage={config?.transfer_template_language ?? 'pt_BR'}
            onTemplateLanguageChange={(value) => handleTextChange('transfer_template_language', value)}
            templateVariables={config?.transfer_template_variables ?? []}
            onTemplateVariablesChange={(vars) => handleVariablesChange('transfer_template_variables', vars)}
            templates={templates}
            placeholder="Ex: Você foi transferido para ${queue.name}"
            variableHint="${'{queue.name}'}"
          />

          {/* Novo Ticket */}
          <MessageConfigCard
            title="Mensagem de Novo Ticket"
            description="Enviada ao criar um novo ticket manualmente"
            enabled={config?.send_msg_new_ticket ?? false}
            onEnabledChange={(checked) => handleToggle('send_msg_new_ticket', checked)}
            message={config?.new_ticket_message ?? ''}
            onMessageChange={(value) => handleTextChange('new_ticket_message', value)}
            useTemplate={config?.new_ticket_use_template ?? false}
            onUseTemplateChange={(checked) => handleToggle('new_ticket_use_template', checked)}
            templateName={config?.new_ticket_template_name ?? ''}
            onTemplateNameChange={(value) => handleTextChange('new_ticket_template_name', value)}
            templateLanguage={config?.new_ticket_template_language ?? 'pt_BR'}
            onTemplateLanguageChange={(value) => handleTextChange('new_ticket_template_language', value)}
            templateVariables={config?.new_ticket_template_variables ?? []}
            onTemplateVariablesChange={(vars) => handleVariablesChange('new_ticket_template_variables', vars)}
            templates={templates}
            placeholder="Ex: Olá! Um novo ticket foi criado para você."
          />

          {/* Aceitar Ticket */}
          <MessageConfigCard
            title="Saudação ao Aceitar Ticket"
            description="Mensagem enviada automaticamente ao aceitar um atendimento"
            enabled={config?.send_greeting_accepted ?? false}
            onEnabledChange={(checked) => handleToggle('send_greeting_accepted', checked)}
            message={config?.greeting_accepted_message ?? ''}
            onMessageChange={(value) => handleTextChange('greeting_accepted_message', value)}
            useTemplate={config?.greeting_use_template ?? false}
            onUseTemplateChange={(checked) => handleToggle('greeting_use_template', checked)}
            templateName={config?.greeting_template_name ?? ''}
            onTemplateNameChange={(value) => handleTextChange('greeting_template_name', value)}
            templateLanguage={config?.greeting_template_language ?? 'pt_BR'}
            onTemplateLanguageChange={(value) => handleTextChange('greeting_template_language', value)}
            templateVariables={config?.greeting_template_variables ?? []}
            onTemplateVariablesChange={(vars) => handleVariablesChange('greeting_template_variables', vars)}
            templates={templates}
            placeholder="Ex: Olá! Seu atendimento foi aceito. Como posso ajudar?"
          />

          {/* Reabrir Ticket */}
          <MessageConfigCard
            title="Mensagem ao Reabrir Ticket"
            description="Enviada quando um ticket é reaberto"
            enabled={config?.send_msg_reopen_ticket ?? false}
            onEnabledChange={(checked) => handleToggle('send_msg_reopen_ticket', checked)}
            message={config?.reopen_ticket_message ?? ''}
            onMessageChange={(value) => handleTextChange('reopen_ticket_message', value)}
            useTemplate={config?.reopen_use_template ?? false}
            onUseTemplateChange={(checked) => handleToggle('reopen_use_template', checked)}
            templateName={config?.reopen_template_name ?? ''}
            onTemplateNameChange={(value) => handleTextChange('reopen_template_name', value)}
            templateLanguage={config?.reopen_template_language ?? 'pt_BR'}
            onTemplateLanguageChange={(value) => handleTextChange('reopen_template_language', value)}
            templateVariables={config?.reopen_template_variables ?? []}
            onTemplateVariablesChange={(vars) => handleVariablesChange('reopen_template_variables', vars)}
            templates={templates}
            placeholder="Ex: Seu ticket foi reaberto. Em breve um atendente irá auxiliá-lo."
          />

          {/* Encerrar Ticket */}
          <MessageConfigCard
            title="Mensagem ao Encerrar Ticket"
            description="Enviada automaticamente ao finalizar um atendimento"
            enabled={config?.send_msg_close_ticket ?? false}
            onEnabledChange={(checked) => handleToggle('send_msg_close_ticket', checked)}
            message={config?.close_ticket_message ?? ''}
            onMessageChange={(value) => handleTextChange('close_ticket_message', value)}
            useTemplate={config?.close_use_template ?? false}
            onUseTemplateChange={(checked) => handleToggle('close_use_template', checked)}
            templateName={config?.close_template_name ?? ''}
            onTemplateNameChange={(value) => handleTextChange('close_template_name', value)}
            templateLanguage={config?.close_template_language ?? 'pt_BR'}
            onTemplateLanguageChange={(value) => handleTextChange('close_template_language', value)}
            templateVariables={config?.close_template_variables ?? []}
            onTemplateVariablesChange={(vars) => handleVariablesChange('close_template_variables', vars)}
            templates={templates}
            placeholder="Ex: Seu atendimento foi encerrado. Obrigado pelo contato!"
          />

          {/* Cancelar/Ignorar Ticket */}
          <MessageConfigCard
            title="Mensagem ao Cancelar/Ignorar Ticket"
            description="Enviada quando um ticket é cancelado ou ignorado"
            enabled={config?.send_msg_cancel_ticket ?? false}
            onEnabledChange={(checked) => handleToggle('send_msg_cancel_ticket', checked)}
            message={config?.cancel_ticket_message ?? ''}
            onMessageChange={(value) => handleTextChange('cancel_ticket_message', value)}
            useTemplate={config?.cancel_use_template ?? false}
            onUseTemplateChange={(checked) => handleToggle('cancel_use_template', checked)}
            templateName={config?.cancel_template_name ?? ''}
            onTemplateNameChange={(value) => handleTextChange('cancel_template_name', value)}
            templateLanguage={config?.cancel_template_language ?? 'pt_BR'}
            onTemplateLanguageChange={(value) => handleTextChange('cancel_template_language', value)}
            templateVariables={config?.cancel_template_variables ?? []}
            onTemplateVariablesChange={(vars) => handleVariablesChange('cancel_template_variables', vars)}
            templates={templates}
            placeholder="Ex: Este ticket foi cancelado. Se precisar de ajuda, abra um novo atendimento."
          />

          {/* Rejeição de Ligação */}
          <MessageConfigCard
            title="Mensagem de Rejeição de Ligação"
            description="Enviada quando alguém tenta ligar e ligações estão desativadas"
            enabled={config?.accept_call_whatsapp ?? true}
            onEnabledChange={(checked) => handleToggle('accept_call_whatsapp', checked)}
            message={config?.accept_call_whatsapp_message ?? ''}
            onMessageChange={(value) => handleTextChange('accept_call_whatsapp_message', value)}
            useTemplate={config?.call_rejection_use_template ?? false}
            onUseTemplateChange={(checked) => handleToggle('call_rejection_use_template', checked)}
            templateName={config?.call_rejection_template_name ?? ''}
            onTemplateNameChange={(value) => handleTextChange('call_rejection_template_name', value)}
            templateLanguage={config?.call_rejection_template_language ?? 'pt_BR'}
            onTemplateLanguageChange={(value) => handleTextChange('call_rejection_template_language', value)}
            templateVariables={config?.call_rejection_template_variables ?? []}
            onTemplateVariablesChange={(vars) => handleVariablesChange('call_rejection_template_variables', vars)}
            templates={templates}
            placeholder="Ex: Desculpe, não aceitamos ligações..."
            inverted={true}
          />

          {/* Mensagem de Continuação - Janela 24h */}
          <MessageConfigCard
            title="Mensagem de Continuação de Atendimento"
            description="Enviada para reativar conversas quando a janela de 24h do WhatsApp expirar"
            enabled={config?.send_msg_continuacao ?? false}
            onEnabledChange={(checked) => handleToggle('send_msg_continuacao', checked)}
            message={config?.continuacao_message ?? ''}
            onMessageChange={(value) => handleTextChange('continuacao_message', value)}
            useTemplate={config?.continuacao_use_template ?? false}
            onUseTemplateChange={(checked) => handleToggle('continuacao_use_template', checked)}
            templateName={config?.continuacao_template_name ?? ''}
            onTemplateNameChange={(value) => handleTextChange('continuacao_template_name', value)}
            templateLanguage={config?.continuacao_template_language ?? 'pt_BR'}
            onTemplateLanguageChange={(value) => handleTextChange('continuacao_template_language', value)}
            templateVariables={config?.continuacao_template_variables ?? []}
            onTemplateVariablesChange={(vars) => handleVariablesChange('continuacao_template_variables', vars)}
            templates={templates}
            placeholder="Ex: Olá! Gostaríamos de continuar o seu atendimento. Podemos ajudá-lo?"
          />
        </div>
      </div>

      {/* Encerramento por Inatividade Section */}
      <div className="border-t pt-6">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
          Encerramento Automático
        </h3>

        <InactivityConfigCard
          enabled={config?.inactivity_enabled ?? false}
          onEnabledChange={(checked) => handleToggle('inactivity_enabled', checked)}
          timeoutMinutes={config?.inactivity_timeout_minutes ?? 30}
          onTimeoutChange={(minutes) => setConfig(prev => prev ? { ...prev, inactivity_timeout_minutes: minutes } : null)}
          message={config?.inactivity_message ?? ''}
          onMessageChange={(value) => handleTextChange('inactivity_message', value)}
          useTemplate={config?.inactivity_use_template ?? false}
          onUseTemplateChange={(checked) => handleToggle('inactivity_use_template', checked)}
          templateName={config?.inactivity_template_name ?? ''}
          onTemplateNameChange={(value) => handleTextChange('inactivity_template_name', value)}
          templateLanguage={config?.inactivity_template_language ?? 'pt_BR'}
          onTemplateLanguageChange={(value) => handleTextChange('inactivity_template_language', value)}
          templateVariables={config?.inactivity_template_variables ?? []}
          onTemplateVariablesChange={(vars) => handleVariablesChange('inactivity_template_variables', vars)}
          templates={templates}
        />
      </div>

      {/* Variáveis Disponíveis Section */}
      <div className="border-t pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Variable className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Variáveis Disponíveis
          </h3>
        </div>
        
        <div className="bg-muted/30 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-2 mb-3">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Use essas variáveis nas suas mensagens automáticas. Elas serão substituídas automaticamente pelos valores reais no momento do envio.
            </p>
          </div>
          
          <div className="bg-background rounded-md p-3 border">
            <p className="text-sm font-medium mb-1">Exemplo de uso:</p>
            <code className="text-xs text-muted-foreground">
              Olá {'{{nome_cliente}}'}, sou {'{{nome_atendente}}'} e vou atender você hoje. {'{{saudacao}}'}!
            </code>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {availableVariables.map((variable) => (
            <div 
              key={variable.variable}
              className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border/50 hover:border-primary/30 transition-colors group"
            >
              <div className="flex-1 min-w-0 mr-2">
                <code className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                  {variable.variable}
                </code>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {variable.description}
                </p>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => copyToClipboard(variable.variable, variable.variable)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copiar variável</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-xs text-yellow-600 dark:text-yellow-500">
            <strong>Dica:</strong> Variáveis não encontradas ou sem valor serão substituídas por "-" ou pelo valor padrão.
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Configurações
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'conta':
        return renderContaTab();
      case 'modelos':
        return renderModelosTab();
      case 'config':
        return renderConfigTab();
      case 'horario':
        return <WhatsAppBusinessHoursConfig />;
      case 'create':
        return (
          <CreateTemplatePage 
            businessInfo={{
              name: businessInfo?.phone?.verified_name || businessInfo?.connection?.nome,
              profilePicture: businessInfo?.profile_picture_url || undefined,
            }}
            onBack={() => navigate('#whatsapp-modelos', { replace: true })}
          />
        );
      case 'edit':
        return (
          <CreateTemplatePage 
            businessInfo={{
              name: businessInfo?.phone?.verified_name || businessInfo?.connection?.nome,
              profilePicture: businessInfo?.profile_picture_url || undefined,
            }}
            onBack={() => {
              setEditingTemplate(null);
              navigate('#whatsapp-modelos', { replace: true });
            }}
            editMode={true}
            templateToEdit={editingTemplate}
            conexaoId={conexao?.id}
          />
        );
      default:
        return null;
    }
  };

  // Se estiver na página de criar ou editar, renderiza sem as tabs
  if (activeTab === 'create' || activeTab === 'edit') {
    return (
      <div className="space-y-6">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {renderContent()}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Tabs */}
      <div className="border-b">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {renderContent()}
      </motion.div>
    </div>
  );
};

export default WhatsAppKanbanConfig;
