import React, { useState } from 'react';
import { formatTimestampFull } from '@/utils/dateFormatters';
import { Copy, Mail, AlertCircle, Eye, Code, User, Globe, Monitor, ChevronDown, Hash, FolderOpen, Clock, Settings } from 'lucide-react';
import DOMPurify from 'isomorphic-dompurify';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from '@/lib/toast';
import type { EmailLogDB } from '@/services/emailLogsService';
import { cn } from '@/lib/utils';

interface EmailLogDetailsModalProps {
  log: EmailLogDB | null;
  open: boolean;
  onClose: () => void;
}

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  defaultOpen = true,
  children,
  badge
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border rounded-lg">
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full flex items-center justify-between p-3 h-auto hover:bg-muted/50"
        >
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-medium text-sm">{title}</span>
            {badge}
          </div>
          <ChevronDown className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-3 pb-3 pt-0">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export const EmailLogDetailsModal: React.FC<EmailLogDetailsModalProps> = ({
  log,
  open,
  onClose
}) => {
  const [htmlTab, setHtmlTab] = useState<'preview' | 'source'>('preview');

  if (!log) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    toast.success('Dados copiados para a área de transferência');
  };

  const formatDate = (dateStr: string | null) => formatTimestampFull(dateStr);

  const getTipoAcaoBadge = (tipo: string | null) => {
    const tipoLower = (tipo || '').toLowerCase();
    
    if (tipoLower.includes('enviad') || tipoLower === 'send') {
      return <Badge className="bg-green-500/20 text-green-700 border-green-500/30">Enviado</Badge>;
    }
    if (tipoLower.includes('respond') || tipoLower === 'reply') {
      return <Badge className="bg-blue-500/20 text-blue-700 border-blue-500/30">Respondido</Badge>;
    }
    if (tipoLower === 'cc') {
      return <Badge className="bg-purple-500/20 text-purple-700 border-purple-500/30">CC</Badge>;
    }
    if (tipoLower === 'cco' || tipoLower === 'bcc') {
      return <Badge className="bg-orange-500/20 text-orange-700 border-orange-500/30">CCO</Badge>;
    }
    return <Badge variant="outline">{tipo || 'Desconhecido'}</Badge>;
  };

  const hasError = !!log.erro;
  const sanitizedHtml = log.html ? DOMPurify.sanitize(log.html) : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-4xl h-[90vh] max-h-[90vh] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0 p-4 sm:p-6 pb-2 border-b">
          <DialogTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Mail className="h-5 w-5 shrink-0" />
              <span className="text-base sm:text-lg">Detalhes do Email</span>
              {hasError && (
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Com Erro
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={handleCopy} className="shrink-0 self-end sm:self-auto">
              <Copy className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {/* Informações Básicas */}
          <CollapsibleSection
            title="Informações Básicas"
            icon={<Mail className="h-4 w-4 text-primary" />}
            defaultOpen={true}
          >
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Assunto</p>
                  <p className="font-medium text-sm break-words">{log.assunto || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Destinatário</p>
                  <p className="font-medium text-sm break-all">{log.destinatario || '-'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Data/Hora</p>
                  <p className="text-sm">{formatDate(log.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Tipo de Ação</p>
                  {getTipoAcaoBadge(log.tipo_de_acao)}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Pasta</p>
                  <Badge variant="outline">{log.pasta || '-'}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">UID</p>
                  <Badge variant="secondary" className="font-mono">{log.uid || '-'}</Badge>
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Detalhes da Conta */}
          <CollapsibleSection
            title="Detalhes da Conta"
            icon={<User className="h-4 w-4 text-blue-500" />}
            defaultOpen={true}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Conta de Email</p>
                  <p className="text-sm font-medium break-all">{log.conta_email?.email || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Usuário Responsável</p>
                  <p className="text-sm font-medium break-words">{log.usuario?.nome || '-'}</p>
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Erro (se houver) */}
          {hasError && (
            <CollapsibleSection
              title="Erro Registrado"
              icon={<AlertCircle className="h-4 w-4 text-destructive" />}
              defaultOpen={true}
              badge={<Badge variant="destructive" className="text-xs ml-2">Erro</Badge>}
            >
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 mt-2">
                <p className="text-xs sm:text-sm text-destructive/80 break-words">{log.erro}</p>
              </div>
            </CollapsibleSection>
          )}

          {/* Conteúdo do Email */}
          {sanitizedHtml && (
            <CollapsibleSection
              title="Conteúdo do Email"
              icon={<FolderOpen className="h-4 w-4 text-green-500" />}
              defaultOpen={false}
            >
              <div className="pt-2">
                <div className="flex justify-end mb-2">
                  <Tabs value={htmlTab} onValueChange={(v) => setHtmlTab(v as 'preview' | 'source')}>
                    <TabsList className="h-8">
                      <TabsTrigger value="preview" className="text-xs h-7 px-3">
                        <Eye className="h-3 w-3 mr-1" />
                        Preview
                      </TabsTrigger>
                      <TabsTrigger value="source" className="text-xs h-7 px-3">
                        <Code className="h-3 w-3 mr-1" />
                        Código
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {htmlTab === 'preview' ? (
                  <div 
                    className="border rounded-lg p-3 sm:p-4 bg-white dark:bg-background max-h-60 sm:max-h-80 overflow-auto text-sm"
                    dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                  />
                ) : (
                  <pre className="border rounded-lg p-3 sm:p-4 bg-muted text-xs overflow-auto max-h-60 sm:max-h-80 whitespace-pre-wrap break-words">
                    {log.html}
                  </pre>
                )}
              </div>
            </CollapsibleSection>
          )}

          {/* Informações Técnicas */}
          <CollapsibleSection
            title="Informações Técnicas"
            icon={<Settings className="h-4 w-4 text-orange-500" />}
            defaultOpen={false}
          >
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-start gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">UID do Email</p>
                    <p className="font-mono text-xs">{log.uid || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Endereço IP</p>
                    <p className="font-mono text-xs">{log.ip_address || '-'}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Monitor className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">User Agent</p>
                  <p className="font-mono text-xs break-all">{log.user_agent || '-'}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-2">
                <Hash className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">ID do Log</p>
                  <p className="font-mono text-xs break-all">{log.id}</p>
                </div>
              </div>
            </div>
          </CollapsibleSection>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailLogDetailsModal;
