import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SolicitacaoDocumento } from '@/types/database';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Mail, FileText, Calendar, MapPin, Hash, User } from 'lucide-react';

interface SolicitacaoDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  solicitacao: SolicitacaoDocumento | null;
}

const statusMap = {
  pendente: { label: 'Pendente', variant: 'secondary' as const, color: 'text-yellow-600' },
  em_processamento: { label: 'Em Processamento', variant: 'default' as const, color: 'text-blue-600' },
  finalizado: { label: 'Finalizado', variant: 'default' as const, color: 'text-green-600' },
  erro: { label: 'Erro', variant: 'destructive' as const, color: 'text-red-600' },
};

const tipoMap = {
  comprovante_entrega: 'Comprovante de Entrega',
  cte: 'Conhecimento de Transporte Eletrônico (CT-e)',
  boleto: 'Boleto',
};

const origemMap = {
  site: 'Site',
  whatsapp: 'WhatsApp',
  email: 'Email',
};

export const SolicitacaoDetailsDialog = ({
  open,
  onOpenChange,
  solicitacao,
}: SolicitacaoDetailsDialogProps) => {
  if (!solicitacao) return null;

  const status = statusMap[solicitacao.status];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            Detalhes da Solicitação
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-8rem)] pr-4">
          <div className="space-y-6">
            {/* Status e Tipo */}
            <div className="flex flex-wrap gap-3">
              <Badge variant={status.variant} className="text-sm px-3 py-1">
                {status.label}
              </Badge>
              <Badge variant="outline" className="text-sm px-3 py-1">
                {tipoMap[solicitacao.tipo_documento]}
              </Badge>
              <Badge variant="outline" className="text-sm px-3 py-1 capitalize">
                <MapPin className="h-3 w-3 mr-1" />
                {origemMap[solicitacao.origem]}
              </Badge>
            </div>

            {/* Informações Principais */}
            <div className="grid gap-4">
              <div className="rounded-lg border bg-card p-4">
                <h4 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Informações de Contato
                </h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Email para Resposta</p>
                    <p className="text-sm font-medium">{solicitacao.email_resposta}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-card p-4">
                <h4 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Dados do Documento
                </h4>
                <div className="space-y-3">
                  {solicitacao.numero_cte && (
                    <div>
                      <p className="text-xs text-muted-foreground">Número CT-e</p>
                      <p className="text-sm font-medium">{solicitacao.numero_cte}</p>
                    </div>
                  )}
                  {solicitacao.numero_nfe && (
                    <div>
                      <p className="text-xs text-muted-foreground">Número NF-e</p>
                      <p className="text-sm font-medium">{solicitacao.numero_nfe}</p>
                    </div>
                  )}
                  {solicitacao.cpf_cnpj && (
                    <div>
                      <p className="text-xs text-muted-foreground">CPF/CNPJ</p>
                      <p className="text-sm font-medium">{solicitacao.cpf_cnpj}</p>
                    </div>
                  )}
                  {!solicitacao.numero_cte && !solicitacao.numero_nfe && !solicitacao.cpf_cnpj && (
                    <p className="text-sm text-muted-foreground italic">Nenhum dado adicional fornecido</p>
                  )}
                </div>
              </div>

              <div className="rounded-lg border bg-card p-4">
                <h4 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Informações de Data
                </h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Data de Criação</p>
                    <p className="text-sm font-medium">
                      {format(new Date(solicitacao.criado_em), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Última Atualização</p>
                    <p className="text-sm font-medium">
                      {format(new Date(solicitacao.atualizado_em), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-card p-4">
                <h4 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Informações do Sistema
                </h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">ID da Solicitação</p>
                    <p className="text-xs font-mono bg-muted px-2 py-1 rounded">{solicitacao.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">ID do Usuário</p>
                    <p className="text-xs font-mono bg-muted px-2 py-1 rounded">{solicitacao.usuario_id}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
