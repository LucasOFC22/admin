
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings, Mail, Eye, EyeOff, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from '@/lib/toast';
import { supabase } from '@/config/supabase';

interface QuoteSystemConfigProps {
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const QuoteSystemConfig: React.FC<QuoteSystemConfigProps> = ({ loading, setLoading }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [configId, setConfigId] = useState<number | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  const [quoteConfig, setQuoteConfig] = useState({
    defaultValidityDays: 15,
    maxFileSize: 10,
    notifyNewQuote: true,
    notifyProposalSent: true,
    emailNotifications: true,
  });

  const [smtpConfig, setSmtpConfig] = useState({
    host: '',
    port: 587,
    secure: true,
    user: '',
    password: '',
    fromName: 'FP Transcargas',
    fromEmail: 'noreply@fptranscargas.com.br',
  });

  // Carregar configurações do banco
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('config_smtp')
          .select('*')
          .maybeSingle();

        if (error) {
          console.error('Erro ao carregar config SMTP:', error);
          return;
        }

        if (data) {
          setConfigId(data.id);
          setSmtpConfig({
            host: data.host || '',
            port: data.port || 587,
            secure: data.secure ?? true,
            user: data.usuario || '',
            password: data.senha || '',
            fromName: data.from_name || 'FP Transcargas',
            fromEmail: data.from_email || 'noreply@fptranscargas.com.br',
          });
          setQuoteConfig({
            defaultValidityDays: data.validade_dias || 15,
            maxFileSize: data.tamanho_max_arquivo || 10,
            notifyNewQuote: data.notificar_nova_cotacao ?? true,
            notifyProposalSent: data.notificar_proposta_enviada ?? true,
            emailNotifications: data.notificacoes_email ?? true,
          });
        }
      } catch (err) {
        console.error('Erro ao carregar configurações:', err);
      } finally {
        setLoadingData(false);
      }
    };

    loadConfig();
  }, []);

  const handleSaveQuoteConfig = async () => {
    setLoading(true);
    try {
      const payload = {
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.secure,
        usuario: smtpConfig.user,
        senha: smtpConfig.password,
        from_name: smtpConfig.fromName,
        from_email: smtpConfig.fromEmail,
        validade_dias: quoteConfig.defaultValidityDays,
        tamanho_max_arquivo: quoteConfig.maxFileSize,
        notificar_nova_cotacao: quoteConfig.notifyNewQuote,
        notificar_proposta_enviada: quoteConfig.notifyProposalSent,
        notificacoes_email: quoteConfig.emailNotifications,
      };

      let result;
      if (configId) {
        result = await supabase
          .from('config_smtp')
          .update(payload)
          .eq('id', configId);
      } else {
        result = await supabase
          .from('config_smtp')
          .insert([payload])
          .select()
          .single();
        if (result.data) setConfigId(result.data.id);
      }

      if (result.error) throw new Error(result.error.message);
      toast.success('Configurações salvas com sucesso!');
    } catch (err: any) {
      toast.error(`Não foi possível salvar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestSmtp = async () => {
    if (!smtpConfig.host || !smtpConfig.user || !smtpConfig.password) {
      toast.error('Preencha host, usuário e senha para testar');
      return;
    }
    setTestingConnection(true);
    setConnectionStatus('idle');
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ulkppucdnmvyfsnarpth.supabase.co';
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsa3BwdWNkbm12eWZzbmFycHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNDEzNTQsImV4cCI6MjA4ODgxNzM1NH0.MCR1rdDr9CNgfzlpqPFp2sfLMpyfxFKeEcgFOFdTXVs';
      
      const response = await fetch(`${supabaseUrl}/functions/v1/email-test-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
        },
        body: JSON.stringify({
          smtp_host: smtpConfig.host,
          smtp_port: smtpConfig.port,
          smtp_ssl: smtpConfig.secure,
          email: smtpConfig.user,
          senha: smtpConfig.password,
        }),
      });

      if (!response.ok) throw new Error('Erro na requisição');
      const data = await response.json();

      if (data?.smtp_ok) {
        setConnectionStatus('success');
        toast.success('Conexão SMTP testada com sucesso!');
      } else {
        setConnectionStatus('error');
        toast.error(`Falha SMTP: ${data?.smtp_error || 'Erro desconhecido'}`);
      }
    } catch {
      setConnectionStatus('error');
      toast.error('Falha na conexão SMTP');
    } finally {
      setTestingConnection(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Carregando configurações...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Configurações Gerais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações Gerais
          </CardTitle>
          <CardDescription>
            Parâmetros gerais do sistema de cotações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="validityDays">Validade padrão (dias)</Label>
              <Input
                id="validityDays"
                type="number"
                value={quoteConfig.defaultValidityDays}
                onChange={(e) => setQuoteConfig(prev => ({
                  ...prev,
                  defaultValidityDays: parseInt(e.target.value) || 15
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxFileSize">Tamanho máximo de arquivo (MB)</Label>
              <Input
                id="maxFileSize"
                type="number"
                value={quoteConfig.maxFileSize}
                onChange={(e) => setQuoteConfig(prev => ({
                  ...prev,
                  maxFileSize: parseInt(e.target.value) || 10
                }))}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Notificar nova cotação</Label>
                <p className="text-sm text-muted-foreground">Receber notificação ao receber nova cotação</p>
              </div>
              <Switch
                checked={quoteConfig.notifyNewQuote}
                onCheckedChange={(checked) => setQuoteConfig(prev => ({ ...prev, notifyNewQuote: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Notificar proposta enviada</Label>
                <p className="text-sm text-muted-foreground">Receber notificação quando proposta for enviada</p>
              </div>
              <Switch
                checked={quoteConfig.notifyProposalSent}
                onCheckedChange={(checked) => setQuoteConfig(prev => ({ ...prev, notifyProposalSent: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Notificações por email</Label>
                <p className="text-sm text-muted-foreground">Enviar notificações também por email</p>
              </div>
              <Switch
                checked={quoteConfig.emailNotifications}
                onCheckedChange={(checked) => setQuoteConfig(prev => ({ ...prev, emailNotifications: checked }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuração SMTP */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Configuração SMTP
          </CardTitle>
          <CardDescription>
            Configure o servidor SMTP para envio de emails de cotação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtp_host">Host SMTP *</Label>
              <Input
                id="smtp_host"
                value={smtpConfig.host}
                onChange={(e) => setSmtpConfig(prev => ({ ...prev, host: e.target.value }))}
                placeholder="smtp.empresa.com.br"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp_port">Porta</Label>
              <Input
                id="smtp_port"
                type="number"
                value={smtpConfig.port}
                onChange={(e) => setSmtpConfig(prev => ({ ...prev, port: parseInt(e.target.value) || 587 }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtp_user">Usuário / Email *</Label>
              <Input
                id="smtp_user"
                value={smtpConfig.user}
                onChange={(e) => setSmtpConfig(prev => ({ ...prev, user: e.target.value }))}
                placeholder="noreply@empresa.com.br"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp_password">Senha *</Label>
              <div className="relative">
                <Input
                  id="smtp_password"
                  type={showPassword ? 'text' : 'password'}
                  value={smtpConfig.password}
                  onChange={(e) => setSmtpConfig(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from_name">Nome do remetente</Label>
              <Input
                id="from_name"
                value={smtpConfig.fromName}
                onChange={(e) => setSmtpConfig(prev => ({ ...prev, fromName: e.target.value }))}
                placeholder="FP Transcargas"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="from_email">Email do remetente</Label>
              <Input
                id="from_email"
                type="email"
                value={smtpConfig.fromEmail}
                onChange={(e) => setSmtpConfig(prev => ({ ...prev, fromEmail: e.target.value }))}
                placeholder="noreply@empresa.com.br"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="smtp_secure"
              checked={smtpConfig.secure}
              onCheckedChange={(checked) => setSmtpConfig(prev => ({ ...prev, secure: checked }))}
            />
            <Label htmlFor="smtp_secure" className="text-sm">Usar STARTTLS / SSL</Label>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleTestSmtp}
              disabled={testingConnection}
              className="gap-2"
            >
              {testingConnection ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : connectionStatus === 'success' ? (
                <CheckCircle className="h-4 w-4 text-emerald-500" />
              ) : connectionStatus === 'error' ? (
                <XCircle className="h-4 w-4 text-red-500" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              Testar Conexão
            </Button>
            {connectionStatus === 'success' && (
              <span className="text-sm text-emerald-600 dark:text-emerald-400">Conexão OK</span>
            )}
            {connectionStatus === 'error' && (
              <span className="text-sm text-red-600 dark:text-red-400">Falha na conexão</span>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSaveQuoteConfig} disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  );
};

export default QuoteSystemConfig;
