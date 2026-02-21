import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Copy } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/lib/toast';

interface LogDetailsModalProps {
  log: Record<string, unknown> | null;
  open: boolean;
  onClose: () => void;
}

export const LogDetailsModal: React.FC<LogDetailsModalProps> = ({
  log,
  open,
  onClose
}) => {
  if (!log) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    toast.success('Dados copiados para a área de transferência');
  };

  const getNivelBadge = (nivel: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      info: 'secondary',
      warning: 'outline',
      error: 'destructive',
      critical: 'destructive'
    };
    return variants[nivel] || 'secondary';
  };

  const formatDate = (dateStr: unknown) => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr as string), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR });
    } catch {
      return String(dateStr);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Detalhes do Log</span>
            <Button variant="ghost" size="icon" onClick={handleCopy}>
              <Copy className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações básicas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">ID</p>
              <p className="font-mono text-sm">{String(log.id || '-')}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Data/Hora</p>
              <p className="text-sm">{formatDate(log.created_at || log.data_ocorrencia || log.timestamp)}</p>
            </div>
          </div>

          {/* Nível */}
          {log.nivel && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Nível</p>
              <Badge variant={getNivelBadge(String(log.nivel))}>
                {String(log.nivel).toUpperCase()}
              </Badge>
            </div>
          )}

          {/* Título/Ação */}
          {(log.titulo || log.acao) && (
            <div>
              <p className="text-xs text-muted-foreground">Título/Ação</p>
              <p className="text-sm font-medium">{String(log.titulo || log.acao)}</p>
            </div>
          )}

          {/* Descrição */}
          {log.descricao && (
            <div>
              <p className="text-xs text-muted-foreground">Descrição</p>
              <p className="text-sm">{String(log.descricao)}</p>
            </div>
          )}

          {/* Usuário */}
          {(log.usuario_nome || log.usuarios) && (
            <div>
              <p className="text-xs text-muted-foreground">Usuário</p>
              <p className="text-sm">
                {String((log.usuarios as Record<string, unknown>)?.nome || log.usuario_nome || '-')}
              </p>
            </div>
          )}

          {/* IP */}
          {log.ip_address && (
            <div>
              <p className="text-xs text-muted-foreground">IP</p>
              <p className="font-mono text-sm">{String(log.ip_address)}</p>
            </div>
          )}

          {/* Módulo/Categoria */}
          {(log.modulo || log.categoria) && (
            <div>
              <p className="text-xs text-muted-foreground">Módulo/Categoria</p>
              <Badge variant="outline">{String(log.modulo || log.categoria)}</Badge>
            </div>
          )}

          {/* Página */}
          {log.pagina && (
            <div>
              <p className="text-xs text-muted-foreground">Página</p>
              <p className="font-mono text-sm">{String(log.pagina)}</p>
            </div>
          )}

          {/* Detalhes/Dados Extra */}
          {(log.detalhes || log.dados_extra) && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Detalhes</p>
              <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-60">
                {typeof (log.detalhes || log.dados_extra) === 'string'
                  ? String(log.detalhes || log.dados_extra)
                  : JSON.stringify(log.detalhes || log.dados_extra, null, 2)}
              </pre>
            </div>
          )}

          {/* User Agent */}
          {log.user_agent && (
            <div>
              <p className="text-xs text-muted-foreground">User Agent</p>
              <p className="font-mono text-xs break-all">{String(log.user_agent)}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LogDetailsModal;
