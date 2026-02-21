import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Copy,
  RefreshCw
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { toast } from '@/lib/toast';

interface CardDavTestModalProps {
  open: boolean;
  onClose: () => void;
  contaId: string;
  contaEmail: string;
  carddavUrl: string;
}

interface TestResult {
  success: boolean;
  message?: string;
  error?: string;
  details?: {
    contactCount?: number;
    serverResponse?: string;
    httpStatus?: number;
    authMethod?: string;
  };
}

interface DiagnosticHint {
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  action?: string;
  actionUrl?: string;
}

const CardDavTestModal: React.FC<CardDavTestModalProps> = ({
  open,
  onClose,
  contaId,
  contaEmail,
  carddavUrl
}) => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [hints, setHints] = useState<DiagnosticHint[]>([]);

  const analyzeError = (error: string, httpStatus?: number): DiagnosticHint[] => {
    const hints: DiagnosticHint[] = [];

    // 403 Forbidden
    if (httpStatus === 403 || error.includes('403')) {
      hints.push({
        type: 'error',
        title: 'Acesso negado (403 Forbidden)',
        description: 'O servidor recusou a requisição. Isso geralmente indica problema de autenticação ou URL incorreta.',
        action: 'Verificar credenciais'
      });

      // Verificar se a URL contém o email correto
      if (carddavUrl && !carddavUrl.includes(contaEmail.replace('@', '%40')) && !carddavUrl.includes(contaEmail)) {
        hints.push({
          type: 'warning',
          title: 'URL pode estar incorreta',
          description: `A URL não contém o email "${contaEmail}". No cPanel, cada usuário só pode acessar seu próprio addressbook.`,
          action: `Tentar URL: /addressbooks/${contaEmail}/addressbook`
        });
      }

      hints.push({
        type: 'info',
        title: 'Tente usar /principals',
        description: 'Alguns servidores cPanel usam o endpoint /principals para descoberta automática.',
        action: `Tentar: https://servidor:2080/principals/${contaEmail}`
      });
    }

    // 401 Unauthorized
    if (httpStatus === 401 || error.includes('401') || error.includes('Unauthorized')) {
      hints.push({
        type: 'error',
        title: 'Autenticação falhou (401)',
        description: 'Usuário ou senha incorretos. Verifique se está usando a senha da caixa de email.',
        action: 'Editar conta e verificar senha'
      });
    }

    // 404 Not Found
    if (httpStatus === 404 || error.includes('404') || error.includes('Not Found')) {
      hints.push({
        type: 'error',
        title: 'Endpoint não encontrado (404)',
        description: 'A URL do CardDAV não existe. Verifique o caminho do addressbook.',
        action: 'Verificar URL do CardDAV'
      });

      hints.push({
        type: 'info',
        title: 'URLs comuns do cPanel',
        description: 'Formato padrão: https://mail.dominio.com:2080/addressbooks/EMAIL/addressbook'
      });
    }

    // Network/Connection errors
    if (error.includes('ECONNREFUSED') || error.includes('ETIMEDOUT') || error.includes('network')) {
      hints.push({
        type: 'error',
        title: 'Erro de conexão',
        description: 'Não foi possível conectar ao servidor. Verifique se a porta 2080 está acessível.',
        action: 'Verificar firewall/porta'
      });
    }

    // SSL/TLS errors
    if (error.includes('SSL') || error.includes('certificate') || error.includes('TLS')) {
      hints.push({
        type: 'warning',
        title: 'Problema de certificado SSL',
        description: 'O certificado SSL do servidor pode ser inválido ou auto-assinado.',
        action: 'Verificar certificado'
      });
    }

    // Generic hint if no specific match
    if (hints.length === 0) {
      hints.push({
        type: 'warning',
        title: 'Erro desconhecido',
        description: error,
        action: 'Verificar logs do servidor'
      });
    }

    return hints;
  };

  const runTest = async () => {
    setTesting(true);
    setResult(null);
    setHints([]);

    try {
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase.functions.invoke('carddav-contacts', {
        body: {
          conta_id: contaId,
          action: 'test'
        }
      });

      if (error) {
        const testResult: TestResult = {
          success: false,
          error: error.message || 'Erro ao testar conexão'
        };
        setResult(testResult);
        setHints(analyzeError(error.message || '', undefined));
        return;
      }

      if (!data?.success) {
        const testResult: TestResult = {
          success: false,
          error: data?.error || 'Teste falhou',
          details: {
            httpStatus: data?.httpStatus,
            serverResponse: data?.serverResponse
          }
        };
        setResult(testResult);
        setHints(analyzeError(data?.error || '', data?.httpStatus));
        return;
      }

      // Success!
      const testResult: TestResult = {
        success: true,
        message: data.message || 'Conexão CardDAV funcionando!',
        details: {
          contactCount: data.contactCount ?? data.contacts?.length ?? 0
        }
      };
      setResult(testResult);
      setHints([{
        type: 'success',
        title: 'CardDAV configurado corretamente',
        description: `Encontrados ${testResult.details?.contactCount || 0} contatos no servidor.`
      }]);

    } catch (err: any) {
      console.error('[CardDAV Test] Error:', err);
      const testResult: TestResult = {
        success: false,
        error: err.message || 'Erro inesperado'
      };
      setResult(testResult);
      setHints(analyzeError(err.message || '', undefined));
    } finally {
      setTesting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência');
  };

  const getHintIcon = (type: DiagnosticHint['type']) => {
    switch (type) {
      case 'error':
        return <XCircle className="h-5 w-5 text-destructive shrink-0" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />;
      case 'info':
        return <ArrowRight className="h-5 w-5 text-blue-500 shrink-0" />;
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />;
    }
  };

  const getHintBg = (type: DiagnosticHint['type']) => {
    switch (type) {
      case 'error':
        return 'bg-destructive/10 border-destructive/20';
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/20';
      case 'info':
        return 'bg-blue-500/10 border-blue-500/20';
      case 'success':
        return 'bg-green-500/10 border-green-500/20';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Testar CardDAV
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Account Info */}
          <div className="p-3 rounded-lg bg-muted/50 space-y-1">
            <p className="text-sm font-medium">{contaEmail}</p>
            <p className="text-xs text-muted-foreground break-all">{carddavUrl || 'URL não configurada'}</p>
          </div>

          {/* Test Button */}
          <Button
            onClick={runTest}
            disabled={testing || !carddavUrl}
            className="w-full"
          >
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                {result ? 'Testar Novamente' : 'Iniciar Teste'}
              </>
            )}
          </Button>

          {!carddavUrl && (
            <p className="text-sm text-amber-600 text-center">
              Configure a URL do CardDAV para poder testar
            </p>
          )}

          {/* Results */}
          <AnimatePresence mode="wait">
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                <Separator />

                {/* Status Badge */}
                <div className="flex items-center justify-center">
                  {result.success ? (
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20 gap-1.5 py-1.5 px-3">
                      <CheckCircle2 className="h-4 w-4" />
                      Conexão OK
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1.5 py-1.5 px-3">
                      <XCircle className="h-4 w-4" />
                      Falha na Conexão
                    </Badge>
                  )}
                </div>

                {/* Contact count on success */}
                {result.success && result.details?.contactCount !== undefined && (
                  <p className="text-center text-sm text-muted-foreground">
                    {result.details.contactCount} contatos encontrados
                  </p>
                )}

                {/* Error message */}
                {result.error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-destructive font-mono break-all">
                      {result.error}
                    </p>
                  </div>
                )}

                {/* Diagnostic Hints */}
                {hints.length > 0 && (
                  <ScrollArea className="max-h-60">
                    <div className="space-y-2">
                      {hints.map((hint, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`p-3 rounded-lg border ${getHintBg(hint.type)}`}
                        >
                          <div className="flex gap-3">
                            {getHintIcon(hint.type)}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{hint.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {hint.description}
                              </p>
                              {hint.action && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="mt-2 h-7 text-xs gap-1"
                                  onClick={() => copyToClipboard(hint.action!)}
                                >
                                  <Copy className="h-3 w-3" />
                                  {hint.action}
                                </Button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CardDavTestModal;
