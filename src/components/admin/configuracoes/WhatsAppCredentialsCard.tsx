import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Eye, EyeOff, Save, Loader2, CheckCircle, XCircle, HelpCircle, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/lib/toast';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { backendService } from '@/services/api/backendService';
import { conexoesService } from '@/services/conexoesService';
import { cn } from '@/lib/utils';

interface Credentials {
  token: string;
  phoneId: string;
  verifyToken: string;
  webhookUrl: string;
}

interface ConnectionData {
  id: string;
  whatsapp_token?: string;
  whatsapp_phone_id?: string;
  whatsapp_verify_token?: string;
  whatsapp_webhook_url?: string;
  status?: string;
}

const WhatsAppCredentialsCard = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [showVerifyToken, setShowVerifyToken] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('');
  const [credentials, setCredentials] = useState<Credentials>({
    token: '',
    phoneId: '',
    verifyToken: '',
    webhookUrl: '',
  });

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    setLoading(true);
    try {
      const supabase = requireAuthenticatedClient();
      const { data: conexao, error } = await supabase
        .from('conexoes')
        .select('id, whatsapp_token, whatsapp_phone_id, whatsapp_verify_token, whatsapp_webhook_url, status')
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (conexao) {
        setConnectionId(conexao.id);
        setConnectionStatus(conexao.status || '');
        setCredentials({
          token: conexao.whatsapp_token || '',
          phoneId: conexao.whatsapp_phone_id || '',
          verifyToken: conexao.whatsapp_verify_token || '',
          webhookUrl: conexao.whatsapp_webhook_url || '',
        });
      }
    } catch (error) {
      console.error('Erro ao buscar credenciais:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!connectionId) {
      toast.error('Nenhuma conexão encontrada');
      return;
    }

    setSaving(true);
    try {
      const supabase = requireAuthenticatedClient();
      const { error } = await supabase
        .from('conexoes')
        .update({
          whatsapp_token: credentials.token,
          whatsapp_phone_id: credentials.phoneId,
          whatsapp_verify_token: credentials.verifyToken,
          whatsapp_webhook_url: credentials.webhookUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', connectionId);

      if (error) throw error;

      toast.success('Credenciais salvas com sucesso');
    } catch (error) {
      toast.error((error as Error).message || 'Erro ao salvar credenciais');
    } finally {
      setSaving(false);
    }
  };

  // Validação via backend - token nunca exposto no frontend
  const handleValidate = async () => {
    if (!connectionId) {
      toast.error('Nenhuma conexão encontrada para validar');
      return;
    }

    if (!credentials.phoneId) {
      toast.warning('Phone ID é obrigatório para validar');
      return;
    }

    setValidating(true);
    try {
      // Chama o backend Node.js que busca as credenciais do Supabase internamente
      const result = await backendService.validarTokenWhatsApp(connectionId);

      if (result.success && result.data?.success) {
        await conexoesService.updateConnectionStatus(connectionId, 'CONNECTED');
        setConnectionStatus('CONNECTED');
        toast.success(`Conexão validada! Número: ${result.data?.display_phone_number}`);
      } else {
        await conexoesService.updateConnectionStatus(connectionId, 'INVALID_TOKEN');
        setConnectionStatus('INVALID_TOKEN');
        toast.error(result.error || 'Token ou Phone ID inválido');
      }
    } catch (error) {
      toast.error((error as Error).message || 'Erro ao validar conexão');
    } finally {
      setValidating(false);
    }
  };

  const getStatusIcon = () => {
    if (connectionStatus === 'CONNECTED') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (connectionStatus === 'INVALID_TOKEN' || connectionStatus === 'DISCONNECTED') {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  const getStatusText = () => {
    const statusMap: Record<string, string> = {
      'CONNECTED': 'Conectado',
      'INVALID_TOKEN': 'Token inválido',
      'DISCONNECTED': 'Desconectado',
    };
    return statusMap[connectionStatus] || connectionStatus;
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-4">
      <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
        <CollapsibleTrigger asChild>
          <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Key className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-medium text-foreground">Credenciais da API</h3>
                <p className="text-sm text-muted-foreground">Token, Phone ID, Verify Token e Webhook URL</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              {connectionStatus && (
                <span className={cn(
                  "text-sm font-medium",
                  connectionStatus === 'CONNECTED' ? 'text-green-600' : 'text-red-600'
                )}>
                  {getStatusText()}
                </span>
              )}
              {isOpen ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-6 py-5 border-t border-border/50 space-y-5">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Token de Acesso */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="token" className="text-sm font-medium">
                      Token de Acesso
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Token de acesso permanente do WhatsApp Business API. Encontre no Meta for Developers.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="relative">
                    <Input
                      id="token"
                      type={showToken ? 'text' : 'password'}
                      value={credentials.token}
                      onChange={(e) => setCredentials(prev => ({ ...prev, token: e.target.value }))}
                      placeholder="EAAG..."
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Phone Number ID */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="phoneId" className="text-sm font-medium">
                      Phone Number ID
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>ID do número de telefone do WhatsApp Business. Encontre no Meta for Developers.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="phoneId"
                    value={credentials.phoneId}
                    onChange={(e) => setCredentials(prev => ({ ...prev, phoneId: e.target.value }))}
                    placeholder="123456789012345"
                  />
                </div>

                {/* Verify Token */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="verifyToken" className="text-sm font-medium">
                      Verify Token
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Token de verificação usado na configuração do webhook. Você define este valor.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="relative">
                    <Input
                      id="verifyToken"
                      type={showVerifyToken ? 'text' : 'password'}
                      value={credentials.verifyToken}
                      onChange={(e) => setCredentials(prev => ({ ...prev, verifyToken: e.target.value }))}
                      placeholder="seu_token_de_verificacao"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowVerifyToken(!showVerifyToken)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showVerifyToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Webhook URL */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="webhookUrl" className="text-sm font-medium">
                      Webhook URL
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>URL do webhook para receber mensagens do WhatsApp. Configure no Meta for Developers.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="webhookUrl"
                    value={credentials.webhookUrl}
                    onChange={(e) => setCredentials(prev => ({ ...prev, webhookUrl: e.target.value }))}
                    placeholder="https://seu-dominio.com/webhook/whatsapp"
                  />
                </div>

                {/* Botões */}
                <div className="flex items-center gap-3 pt-2">
                  <Button
                    onClick={handleValidate}
                    variant="outline"
                    disabled={validating || !credentials.token || !credentials.phoneId}
                    className="flex-1"
                  >
                    {validating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Validando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Validar Conexão
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Credenciais
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

export default WhatsAppCredentialsCard;
