import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Mail, Server, Lock, Globe, Calendar, Users, TestTube, RefreshCw, Check, AlertCircle, Lightbulb, Copy, ExternalLink } from 'lucide-react';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useEmailContas } from '@/hooks/useEmailContas';
import { EmailConta, CreateEmailContaData } from '@/types/email';
import { useToast } from '@/hooks/use-toast';

interface EmailContaFormModalProps {
  conta?: EmailConta | null;
  onClose: () => void;
  onSuccess: () => void;
}

const EmailContaFormModal: React.FC<EmailContaFormModalProps> = ({
  conta,
  onClose,
  onSuccess
}) => {
  const { createConta, updateConta, testConnection } = useEmailContas();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  // Estados para teste CardDAV/CalDAV
  const [testingCardDav, setTestingCardDav] = useState(false);
  const [cardDavResult, setCardDavResult] = useState<{
    success: boolean;
    message: string;
    hints?: string[];
    suggestedUrl?: string;
  } | null>(null);
  
  const [testingCalDav, setTestingCalDav] = useState(false);
  const [calDavResult, setCalDavResult] = useState<{
    success: boolean;
    message: string;
    hints?: string[];
  } | null>(null);
  
  const [formData, setFormData] = useState<CreateEmailContaData>({
    nome: conta?.nome || '',
    email: conta?.email || '',
    imap_host: conta?.imap_host || '',
    imap_port: conta?.imap_port || 993,
    imap_ssl: conta?.imap_ssl ?? true,
    smtp_host: conta?.smtp_host || '',
    smtp_port: conta?.smtp_port || 587,
    smtp_ssl: conta?.smtp_ssl ?? true,
    senha: '',
    ativo: conta?.ativo ?? true,
    carddav_url: conta?.carddav_url || '',
    carddav_usuario: conta?.carddav_usuario || '',
    carddav_senha: '',
    caldav_url: conta?.caldav_url || '',
    caldav_usuario: conta?.caldav_usuario || '',
    caldav_senha: '',
    suporta_carddav: conta?.suporta_carddav ?? false,
    suporta_caldav: conta?.suporta_caldav ?? false
  });

  const handleChange = (field: keyof CreateEmailContaData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    if (!formData.email || !formData.senha || !formData.imap_host || !formData.smtp_host) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha email, senha e servidores para testar',
        variant: 'destructive'
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    const result = await testConnection(formData);
    setTestResult(result);
    setTesting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.email || !formData.imap_host || !formData.smtp_host) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive'
      });
      return;
    }

    if (!conta && !formData.senha) {
      toast({
        title: 'Senha obrigatória',
        description: 'A senha é obrigatória para criar uma nova conta',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    let success = false;
    if (conta) {
      const result = await updateConta({ id: conta.id, ...formData });
      success = !!result;
    } else {
      const result = await createConta(formData);
      success = !!result;
    }

    setLoading(false);

    if (success) {
      onSuccess();
    }
  };

  const autoFillFromDomain = () => {
    if (formData.email) {
      const domain = formData.email.split('@')[1];
      if (domain) {
        const mailServer = `mail.${domain}`;
        handleChange('imap_host', mailServer);
        handleChange('smtp_host', mailServer);
        
        if (formData.suporta_carddav && !formData.carddav_url) {
          handleChange('carddav_url', `https://${mailServer}/SOGo/dav/${formData.email}/Contacts/`);
          handleChange('carddav_usuario', formData.email);
        }
        
        if (formData.suporta_caldav && !formData.caldav_url) {
          handleChange('caldav_url', `https://${mailServer}/SOGo/dav/${formData.email}/Calendar/`);
          handleChange('caldav_usuario', formData.email);
        }
      }
    }
  };

  // Função para testar CardDAV com dados do formulário
  const handleTestCardDav = async () => {
    if (!formData.carddav_url) {
      toast({
        title: 'URL obrigatória',
        description: 'Preencha a URL do CardDAV para testar',
        variant: 'destructive'
      });
      return;
    }

    setTestingCardDav(true);
    setCardDavResult(null);

    try {
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase.functions.invoke('carddav-contacts', {
        body: {
          action: 'test',
          carddav_url: formData.carddav_url,
          carddav_usuario: formData.carddav_usuario || formData.email,
          carddav_senha: formData.carddav_senha || formData.senha
        }
      });

      if (error) {
        setCardDavResult({
          success: false,
          message: `Erro ao chamar função: ${error.message}`,
          hints: ['Verifique se a edge function carddav-contacts está ativa']
        });
      } else if (data?.success) {
        setCardDavResult({
          success: true,
          message: data.message || 'Conexão CardDAV OK!',
          hints: data.hints
        });
      } else {
        // Gerar dicas baseadas no erro
        const hints: string[] = [];
        const errorMsg = data?.error || 'Erro desconhecido';
        
        if (errorMsg.includes('403') || errorMsg.includes('Forbidden')) {
          hints.push('Erro 403: Acesso negado. Verifique usuário/senha.');
          hints.push('Tente usar a URL com /principals/ no caminho.');
        } else if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
          hints.push('Erro 401: Credenciais inválidas.');
          hints.push('Verifique se o usuário e senha estão corretos.');
        } else if (errorMsg.includes('404') || errorMsg.includes('Not Found')) {
          hints.push('Erro 404: URL não encontrada.');
          hints.push('Verifique se o servidor suporta CardDAV.');
          hints.push('Tente URLs alternativas como /dav/ ou /.well-known/carddav');
        } else if (errorMsg.includes('301') || errorMsg.includes('302') || errorMsg.includes('redirect')) {
          hints.push('O servidor está redirecionando para outra URL.');
          if (data?.redirectUrl) {
            hints.push(`URL sugerida: ${data.redirectUrl}`);
          }
        } else if (errorMsg.includes('SSL') || errorMsg.includes('certificate')) {
          hints.push('Erro de certificado SSL.');
          hints.push('Verifique se o certificado do servidor é válido.');
        } else if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
          hints.push('Erro de rede. Verifique se a URL está acessível.');
        }

        setCardDavResult({
          success: false,
          message: errorMsg,
          hints: hints.length > 0 ? hints : ['Verifique a URL, usuário e senha.'],
          suggestedUrl: data?.redirectUrl
        });
      }
    } catch (err) {
      setCardDavResult({
        success: false,
        message: `Erro inesperado: ${err instanceof Error ? err.message : 'Desconhecido'}`,
        hints: ['Tente novamente ou verifique os logs']
      });
    }

    setTestingCardDav(false);
  };

  // Função para testar CalDAV com dados do formulário
  const handleTestCalDav = async () => {
    if (!formData.caldav_url) {
      toast({
        title: 'URL obrigatória',
        description: 'Preencha a URL do CalDAV para testar',
        variant: 'destructive'
      });
      return;
    }

    setTestingCalDav(true);
    setCalDavResult(null);

    try {
      // Por enquanto, fazemos uma requisição simples de teste
      // Podemos expandir para usar uma edge function caldav-events no futuro
      const response = await fetch(formData.caldav_url, {
        method: 'OPTIONS',
        headers: {
          'Authorization': 'Basic ' + btoa(`${formData.caldav_usuario || formData.email}:${formData.caldav_senha || formData.senha}`)
        }
      });

      if (response.ok || response.status === 200 || response.status === 207) {
        setCalDavResult({
          success: true,
          message: 'Conexão CalDAV OK!',
          hints: ['Servidor respondeu corretamente']
        });
      } else {
        const hints: string[] = [];
        if (response.status === 401) {
          hints.push('Credenciais inválidas');
        } else if (response.status === 403) {
          hints.push('Acesso negado');
        } else if (response.status === 404) {
          hints.push('URL não encontrada');
          hints.push('Tente /.well-known/caldav');
        }

        setCalDavResult({
          success: false,
          message: `Erro HTTP ${response.status}`,
          hints: hints.length > 0 ? hints : ['Verifique a configuração']
        });
      }
    } catch (err) {
      // CORS pode bloquear, mas isso não significa que não funciona
      setCalDavResult({
        success: false,
        message: 'Não foi possível testar diretamente (CORS)',
        hints: [
          'O teste direto do navegador pode ser bloqueado por CORS',
          'Salve a conta e teste via sincronização real'
        ]
      });
    }

    setTestingCalDav(false);
  };

  const applySuggestedUrl = (url: string) => {
    handleChange('carddav_url', url);
    setCardDavResult(null);
    toast({
      title: 'URL aplicada',
      description: 'A URL sugerida foi aplicada. Teste novamente.'
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            {conta ? 'Editar Conta de Email' : 'Nova Conta de Email'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <Tabs defaultValue="geral" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="geral">
                  <Mail className="h-4 w-4 mr-2" />
                  Geral
                </TabsTrigger>
                <TabsTrigger value="servidor">
                  <Server className="h-4 w-4 mr-2" />
                  Servidores
                </TabsTrigger>
                <TabsTrigger value="dav">
                  <Calendar className="h-4 w-4 mr-2" />
                  CardDAV/CalDAV
                </TabsTrigger>
              </TabsList>

              {/* Tab Geral */}
              <TabsContent value="geral" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome da Conta *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => handleChange('nome', e.target.value)}
                      placeholder="Ex: Comercial"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      onBlur={autoFillFromDomain}
                      placeholder="email@empresa.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senha">
                    Senha {conta ? '(deixe vazio para manter atual)' : '*'}
                  </Label>
                  <Input
                    id="senha"
                    type="password"
                    value={formData.senha}
                    onChange={(e) => handleChange('senha', e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label>Conta Ativa</Label>
                    <p className="text-sm text-muted-foreground">
                      Habilitar sincronização e envio de emails
                    </p>
                  </div>
                  <Switch
                    checked={formData.ativo}
                    onCheckedChange={(checked) => handleChange('ativo', checked)}
                  />
                </div>
              </TabsContent>

              {/* Tab Servidores */}
              <TabsContent value="servidor" className="space-y-4 mt-4">
                <Card className="p-4">
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Servidor IMAP (Recebimento)
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="imap_host">Host *</Label>
                      <Input
                        id="imap_host"
                        value={formData.imap_host}
                        onChange={(e) => handleChange('imap_host', e.target.value)}
                        placeholder="mail.empresa.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="imap_port">Porta</Label>
                      <Input
                        id="imap_port"
                        type="number"
                        value={formData.imap_port}
                        onChange={(e) => handleChange('imap_port', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Switch
                      id="imap_ssl"
                      checked={formData.imap_ssl}
                      onCheckedChange={(checked) => handleChange('imap_ssl', checked)}
                    />
                    <Label htmlFor="imap_ssl" className="text-sm">
                      Usar SSL/TLS
                    </Label>
                  </div>
                </Card>

                <Card className="p-4">
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    Servidor SMTP (Envio)
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtp_host">Host *</Label>
                      <Input
                        id="smtp_host"
                        value={formData.smtp_host}
                        onChange={(e) => handleChange('smtp_host', e.target.value)}
                        placeholder="mail.empresa.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp_port">Porta</Label>
                      <Input
                        id="smtp_port"
                        type="number"
                        value={formData.smtp_port}
                        onChange={(e) => handleChange('smtp_port', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Switch
                      id="smtp_ssl"
                      checked={formData.smtp_ssl}
                      onCheckedChange={(checked) => handleChange('smtp_ssl', checked)}
                    />
                    <Label htmlFor="smtp_ssl" className="text-sm">
                      Usar STARTTLS
                    </Label>
                  </div>
                </Card>

                {/* Test Connection */}
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Testar Conexão</h4>
                      <p className="text-sm text-muted-foreground">
                        Verificar se as configurações estão corretas
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleTestConnection}
                      disabled={testing}
                    >
                      {testing ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <TestTube className="h-4 w-4 mr-2" />
                      )}
                      Testar
                    </Button>
                  </div>
                  {testResult && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`mt-3 p-3 rounded-md flex items-start gap-2 ${
                        testResult.success 
                          ? 'bg-green-500/10 text-green-600' 
                          : 'bg-destructive/10 text-destructive'
                      }`}
                    >
                      {testResult.success ? (
                        <Check className="h-4 w-4 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-4 w-4 mt-0.5" />
                      )}
                      <span className="text-sm">{testResult.message}</span>
                    </motion.div>
                  )}
                </Card>
              </TabsContent>

              {/* Tab CardDAV/CalDAV */}
              <TabsContent value="dav" className="space-y-4 mt-4">
                <div className="bg-muted/50 p-4 rounded-lg text-sm text-muted-foreground mb-4">
                  <p>
                    <strong>WHM/cPanel com Roundcube:</strong> As URLs CardDAV/CalDAV 
                    geralmente seguem o padrão SOGo. Preencha o email e clique fora 
                    para autocompletar.
                  </p>
                </div>

                {/* CardDAV */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <h4 className="font-medium">CardDAV (Contatos)</h4>
                    </div>
                    <Switch
                      checked={formData.suporta_carddav}
                      onCheckedChange={(checked) => handleChange('suporta_carddav', checked)}
                    />
                  </div>
                  
                  {formData.suporta_carddav && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="carddav_url">URL CardDAV</Label>
                        <Input
                          id="carddav_url"
                          value={formData.carddav_url}
                          onChange={(e) => handleChange('carddav_url', e.target.value)}
                          placeholder="https://mail.empresa.com/SOGo/dav/usuario/Contacts/"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="carddav_usuario">Usuário</Label>
                          <Input
                            id="carddav_usuario"
                            value={formData.carddav_usuario}
                            onChange={(e) => handleChange('carddav_usuario', e.target.value)}
                            placeholder="email@empresa.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="carddav_senha">
                            Senha {conta ? '(vazio = manter)' : ''}
                          </Label>
                          <Input
                            id="carddav_senha"
                            type="password"
                            value={formData.carddav_senha}
                            onChange={(e) => handleChange('carddav_senha', e.target.value)}
                            placeholder="••••••••"
                          />
                        </div>
                      </div>
                      
                      {/* Botão Testar CardDAV */}
                      <div className="pt-2 border-t">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleTestCardDav}
                          disabled={testingCardDav || !formData.carddav_url}
                          className="w-full"
                        >
                          {testingCardDav ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <TestTube className="h-4 w-4 mr-2" />
                          )}
                          Testar CardDAV
                        </Button>
                        
                        {cardDavResult && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`mt-3 p-3 rounded-md ${
                              cardDavResult.success 
                                ? 'bg-green-500/10 border border-green-500/20' 
                                : 'bg-destructive/10 border border-destructive/20'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              {cardDavResult.success ? (
                                <Check className="h-4 w-4 mt-0.5 text-green-600" />
                              ) : (
                                <AlertCircle className="h-4 w-4 mt-0.5 text-destructive" />
                              )}
                              <div className="flex-1 text-sm">
                                <p className={cardDavResult.success ? 'text-green-600' : 'text-destructive'}>
                                  {cardDavResult.message}
                                </p>
                                
                                {cardDavResult.hints && cardDavResult.hints.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    {cardDavResult.hints.map((hint, i) => (
                                      <div key={i} className="flex items-start gap-1.5 text-muted-foreground">
                                        <Lightbulb className="h-3 w-3 mt-0.5 text-yellow-500" />
                                        <span className="text-xs">{hint}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                {cardDavResult.suggestedUrl && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="mt-2"
                                    onClick={() => applySuggestedUrl(cardDavResult.suggestedUrl!)}
                                  >
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    Usar URL sugerida
                                  </Button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  )}
                </Card>

                {/* CalDAV */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <h4 className="font-medium">CalDAV (Calendário)</h4>
                    </div>
                    <Switch
                      checked={formData.suporta_caldav}
                      onCheckedChange={(checked) => handleChange('suporta_caldav', checked)}
                    />
                  </div>
                  
                  {formData.suporta_caldav && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="caldav_url">URL CalDAV</Label>
                        <Input
                          id="caldav_url"
                          value={formData.caldav_url}
                          onChange={(e) => handleChange('caldav_url', e.target.value)}
                          placeholder="https://mail.empresa.com/SOGo/dav/usuario/Calendar/"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="caldav_usuario">Usuário</Label>
                          <Input
                            id="caldav_usuario"
                            value={formData.caldav_usuario}
                            onChange={(e) => handleChange('caldav_usuario', e.target.value)}
                            placeholder="email@empresa.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="caldav_senha">
                            Senha {conta ? '(vazio = manter)' : ''}
                          </Label>
                          <Input
                            id="caldav_senha"
                            type="password"
                            value={formData.caldav_senha}
                            onChange={(e) => handleChange('caldav_senha', e.target.value)}
                            placeholder="••••••••"
                          />
                        </div>
                      </div>
                      
                      {/* Botão Testar CalDAV */}
                      <div className="pt-2 border-t">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleTestCalDav}
                          disabled={testingCalDav || !formData.caldav_url}
                          className="w-full"
                        >
                          {testingCalDav ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <TestTube className="h-4 w-4 mr-2" />
                          )}
                          Testar CalDAV
                        </Button>
                        
                        {calDavResult && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`mt-3 p-3 rounded-md ${
                              calDavResult.success 
                                ? 'bg-green-500/10 border border-green-500/20' 
                                : 'bg-amber-500/10 border border-amber-500/20'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              {calDavResult.success ? (
                                <Check className="h-4 w-4 mt-0.5 text-green-600" />
                              ) : (
                                <AlertCircle className="h-4 w-4 mt-0.5 text-amber-600" />
                              )}
                              <div className="flex-1 text-sm">
                                <p className={calDavResult.success ? 'text-green-600' : 'text-amber-600'}>
                                  {calDavResult.message}
                                </p>
                                
                                {calDavResult.hints && calDavResult.hints.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    {calDavResult.hints.map((hint, i) => (
                                      <div key={i} className="flex items-start gap-1.5 text-muted-foreground">
                                        <Lightbulb className="h-3 w-3 mt-0.5 text-yellow-500" />
                                        <span className="text-xs">{hint}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              </TabsContent>
            </Tabs>
          </form>
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                {conta ? 'Atualizar' : 'Criar Conta'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailContaFormModal;
