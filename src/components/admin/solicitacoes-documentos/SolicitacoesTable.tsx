import { SolicitacaoDocumento } from '@/types/database';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Trash2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SolicitacoesTableProps {
  solicitacoes: SolicitacaoDocumento[];
  onUpdateStatus: (params: { id: string; status: string }) => void;
  onDelete: (id: string) => void;
  onViewDetails: (solicitacao: SolicitacaoDocumento) => void;
}

const statusMap = {
  pendente: { label: 'Pendente', variant: 'secondary' as const },
  em_processamento: { label: 'Em Processamento', variant: 'default' as const },
  finalizado: { label: 'Finalizado', variant: 'default' as const },
  erro: { label: 'Erro', variant: 'destructive' as const },
};

const tipoMap = {
  comprovante_entrega: 'Comprovante Entrega',
  cte: 'CT-e',
  boleto: 'Boleto',
};

export const SolicitacoesTable = ({
  solicitacoes,
  onUpdateStatus,
  onDelete,
  onViewDetails,
}: SolicitacoesTableProps) => {
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Dados</TableHead>
            <TableHead>Origem</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {solicitacoes.map((solicitacao) => (
            <TableRow key={solicitacao.id}>
              <TableCell className="font-medium">
                <Badge variant="outline">
                  {tipoMap[solicitacao.tipo_documento]}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">{solicitacao.email_resposta}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {solicitacao.tipo_documento === 'comprovante_entrega' && solicitacao.numero_cte && (
                  <span>CT-e: {solicitacao.numero_cte}</span>
                )}
                {solicitacao.tipo_documento === 'cte' && (
                  <div className="space-y-1">
                    {solicitacao.numero_nfe && <div>NF-e: {solicitacao.numero_nfe}</div>}
                    {solicitacao.cpf_cnpj && <div>CPF/CNPJ: {solicitacao.cpf_cnpj}</div>}
                  </div>
                )}
                {solicitacao.tipo_documento === 'boleto' && solicitacao.numero_cte && (
                  <span>CT-e: {solicitacao.numero_cte}</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {solicitacao.origem}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={statusMap[solicitacao.status].variant}>
                  {statusMap[solicitacao.status].label}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {solicitacao.criado_em && format(new Date(solicitacao.criado_em), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails(solicitacao)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          onUpdateStatus({ id: solicitacao.id, status: 'pendente' })
                        }
                      >
                        Marcar como Pendente
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          onUpdateStatus({ id: solicitacao.id, status: 'em_processamento' })
                        }
                      >
                        Marcar como Em Processamento
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          onUpdateStatus({ id: solicitacao.id, status: 'finalizado' })
                        }
                      >
                        Marcar como Finalizado
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          onUpdateStatus({ id: solicitacao.id, status: 'erro' })
                        }
                      >
                        Marcar como Erro
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(solicitacao.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
