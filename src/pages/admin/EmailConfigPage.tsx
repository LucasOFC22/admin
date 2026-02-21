import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Signature, 
  FileText,
  Eye,
  Save,
  RefreshCw,
  AlertCircle,
  Check,
  Loader2,
  Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useEmailPreferencias } from '@/hooks/useEmailPreferencias';
import { useUserEmailAccess } from '@/hooks/useUserEmailAccess';
import { PASTAS_LABELS, type EmailPreferenciasForm } from '@/types/emailPreferencias';
import { cn } from '@/lib/utils';

const EmailConfigPage: React.FC = () => {
  const { accounts: contas, loading: loadingContas, hasAccess } = useUserEmailAccess();
  const [selectedContaId, setSelectedContaId] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState<'assinatura' | 'visualizacao' | 'composicao'>('assinatura');

  const { 
    preferencias, 
    loading: loadingPrefs, 
    saving, 
    savePreferencias, 
    getFormValues,
    refresh
  } = useEmailPreferencias(selectedContaId);
  
  const [formData, setFormData] = useState<EmailPreferenciasForm>({
    assinatura_ativa: false,
    assinatura_texto: '',
    assinatura_html: '',
    mensagens_por_pagina: 20 as const,
    marcar_lido_automatico: true,
    pasta_padrao: 'inbox' as const,
    view: 'list' as const,
    responder_com_citacao: true,
    formato_padrao: 'html' as const
  });

  const [hasChanges, setHasChanges] = useState(false);

  // Atualizar formulário quando preferências carregarem
  useEffect(() => {
    if (!loadingPrefs) {
      const values = getFormValues();
      setFormData(values);
      setHasChanges(false);
    }
  }, [loadingPrefs, getFormValues, preferencias]);

  // Selecionar primeira conta quando carregar
  useEffect(() => {
    if (contas.length > 0 && !selectedContaId) {
      setSelectedContaId(contas[0].id);
    }
  }, [contas, selectedContaId]);

  const handleSave = async () => {
    const success = await savePreferencias(formData);
    if (success) {
      setHasChanges(false);
    }
  };

  const handleRefresh = () => {
    refresh();
  };

  const updateField = <K extends keyof EmailPreferenciasForm>(
    field: K, 
    value: EmailPreferenciasForm[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const loading = loadingContas || loadingPrefs;

  const tabs = [
    { id: 'assinatura' as const, label: 'Assinatura', icon: Signature },
    { id: 'visualizacao' as const, label: 'Visualização', icon: Eye },
    { id: 'composicao' as const, label: 'Composição', icon: FileText }
  ];

  // Loading Skeleton
  if (loading) {
    return (
      <div className="flex-1 p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  // No accounts warning
  if (!loading && !hasAccess) {
    return (
      <div className="flex-1 p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acesso Restrito</AlertTitle>
          <AlertDescription className="mt-2">
            <p>
              Você não tem permissão para acessar esta página.
              Nenhuma conta de email foi vinculada ao seu usuário.
            </p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!loading && contas.length === 0) {
    return (
      <div className="flex-1 p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Nenhuma conta de email configurada</AlertTitle>
          <AlertDescription className="mt-2">
            <p>
              Você precisa configurar uma conta de email antes de poder definir preferências.
            </p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-auto bg-background">
      {/* Header interno */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center justify-between h-14 px-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <h1 className="font-semibold">Configurações de Email</h1>
            </div>
            <AnimatePresence>
              {hasChanges && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Badge variant="secondary" className="text-xs">
                    Alterações não salvas
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleRefresh}
              disabled={loading}
              className="shrink-0"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving || !hasChanges}
              size="sm"
              className="gap-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : hasChanges ? (
                <Save className="h-4 w-4" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {saving ? 'Salvando...' : hasChanges ? 'Salvar' : 'Salvo'}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        {/* Seletor de conta */}
        {contas.length > 1 ? (
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Conta</Label>
            <Select 
              value={selectedContaId} 
              onValueChange={setSelectedContaId}
            >
              <SelectTrigger className="w-full max-w-sm">
                <SelectValue placeholder="Selecione uma conta" />
              </SelectTrigger>
              <SelectContent>
                {contas.map(conta => (
                  <SelectItem key={conta.id} value={conta.id}>
                    {conta.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : contas.length === 1 && (
          <p className="text-sm text-muted-foreground">
            Configurando: <span className="text-foreground font-medium">{contas[0].email}</span>
          </p>
        )}

        {/* Navegação por abas */}
        <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-fit">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                activeTab === tab.id 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Conteúdo das abas */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            {/* Tab: Assinatura */}
            {activeTab === 'assinatura' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium">Assinatura de Email</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Configure sua assinatura que será adicionada automaticamente aos emails enviados
                  </p>
                </div>

                <div className="flex items-center justify-between py-3 px-4 rounded-lg border bg-card">
                  <div>
                    <Label className="font-medium">Ativar Assinatura</Label>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Adicionar assinatura automaticamente
                    </p>
                  </div>
                  <Switch
                    checked={formData.assinatura_ativa}
                    onCheckedChange={(checked) => updateField('assinatura_ativa', checked)}
                  />
                </div>

                <AnimatePresence>
                  {formData.assinatura_ativa && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <div className="space-y-2">
                        <Label>Texto da Assinatura</Label>
                        <Textarea
                          value={formData.assinatura_texto}
                          onChange={(e) => updateField('assinatura_texto', e.target.value)}
                          placeholder="Digite sua assinatura aqui..."
                          rows={5}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Tab: Visualização */}
            {activeTab === 'visualizacao' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium">Preferências de Visualização</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Configure como os emails serão exibidos
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 px-4 rounded-lg border bg-card">
                    <div>
                      <Label className="font-medium">Mensagens por página</Label>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Quantidade de emails exibidos por página
                      </p>
                    </div>
                    <Select 
                      value={String(formData.mensagens_por_pagina)} 
                      onValueChange={(value) => updateField('mensagens_por_pagina', Number(value) as 20 | 50 | 100)}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[10, 20, 25, 50, 100].map(n => (
                          <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between py-3 px-4 rounded-lg border bg-card">
                    <div>
                      <Label className="font-medium">Marcar como lido automaticamente</Label>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Marcar emails como lidos ao abrir
                      </p>
                    </div>
                    <Switch
                      checked={formData.marcar_lido_automatico}
                      onCheckedChange={(checked) => updateField('marcar_lido_automatico', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between py-3 px-4 rounded-lg border bg-card">
                    <div>
                      <Label className="font-medium">Pasta padrão</Label>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Pasta exibida ao abrir o email
                      </p>
                    </div>
                    <Select 
                      value={formData.pasta_padrao} 
                      onValueChange={(value) => updateField('pasta_padrao', value as 'inbox' | 'sent' | 'drafts' | 'trash')}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PASTAS_LABELS).filter(([key]) => ['inbox', 'sent', 'drafts', 'trash'].includes(key)).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between py-3 px-4 rounded-lg border bg-card">
                    <div>
                      <Label className="font-medium">Modo de visualização</Label>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Exibição da lista de emails
                      </p>
                    </div>
                    <Select 
                      value={formData.view} 
                      onValueChange={(value: 'list' | 'split') => updateField('view', value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="list">Lista</SelectItem>
                        <SelectItem value="split">Dividido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Composição */}
            {activeTab === 'composicao' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium">Preferências de Composição</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Configure como novos emails serão compostos
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 px-4 rounded-lg border bg-card">
                    <div>
                      <Label className="font-medium">Responder com citação</Label>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Incluir mensagem original ao responder
                      </p>
                    </div>
                    <Switch
                      checked={formData.responder_com_citacao}
                      onCheckedChange={(checked) => updateField('responder_com_citacao', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between py-3 px-4 rounded-lg border bg-card">
                    <div>
                      <Label className="font-medium">Formato padrão</Label>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Formato de composição dos emails
                      </p>
                    </div>
                    <Select 
                      value={formData.formato_padrao} 
                      onValueChange={(value: 'html' | 'texto') => updateField('formato_padrao', value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="html">HTML</SelectItem>
                        <SelectItem value="texto">Texto Simples</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default EmailConfigPage;
