import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Download, User, Clock, Monitor } from 'lucide-react';
import { useDocumentoDownloads } from '@/hooks/useDocumentoDownloads';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AuditoriaDialogProps {
  documento: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AuditoriaDialog = ({ documento, open, onOpenChange }: AuditoriaDialogProps) => {
  const { downloads, stats, isLoading } = useDocumentoDownloads({ documentoId: documento?.id });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            Histórico de Downloads
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Documento info */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="font-medium">{documento?.titulo}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 bg-primary/10 rounded-lg text-center">
              <p className="text-2xl font-bold text-primary">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="p-3 bg-green-500/10 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-600">{stats.hoje}</p>
              <p className="text-xs text-muted-foreground">Hoje</p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-lg text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.esteMes}</p>
              <p className="text-xs text-muted-foreground">Este Mês</p>
            </div>
          </div>

          {/* Downloads list */}
          <div className="border rounded-lg">
            <div className="p-2 bg-muted text-sm font-medium">
              Últimos Downloads
            </div>
            <ScrollArea className="h-64">
              <div className="p-2 space-y-2">
                {downloads.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum download registrado
                  </p>
                ) : (
                  downloads.map((download) => (
                    <div key={download.id} className="p-3 rounded-lg border hover:bg-muted/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {download.usuario?.nome || 'Anônimo'}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {download.cnpj_cpf || 'N/A'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(download.baixado_em), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </span>
                        {download.ip_address && (
                          <span className="flex items-center gap-1">
                            <Monitor className="w-3 h-3" />
                            {download.ip_address}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuditoriaDialog;
