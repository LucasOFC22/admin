import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Mail, Phone, Building2, FileText } from 'lucide-react';
import { SolicitacaoAcesso } from '@/services/supabase/solicitacaoAcessoService';
import { formatTimestamp } from '@/utils/dateFormatters';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface SolicitacoesAcessosTableProps {
  solicitacoes: SolicitacaoAcesso[];
  onDelete: (id: string) => void;
}

export const SolicitacoesAcessosTable = ({
  solicitacoes,
  onDelete,
}: SolicitacoesAcessosTableProps) => {
  const { hasPermission } = usePermissionGuard();
  const canDelete = hasPermission('admin.solicitacoes-acessos.excluir');

  const formatDate = (date: Date | undefined) => formatTimestamp(date);

  return (
    <Card>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead>Origem</TableHead>
              {canDelete && <TableHead className="text-right">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {solicitacoes.map((solicitacao) => (
              <TableRow key={solicitacao.id}>
                <TableCell className="whitespace-nowrap">
                  {formatDate(solicitacao.timestamp)}
                </TableCell>
                <TableCell className="font-medium">{solicitacao.nome}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{solicitacao.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {solicitacao.empresa ? (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{solicitacao.empresa}</span>
                    </div>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>{solicitacao.cnpj || '-'}</TableCell>
                <TableCell>
                  {solicitacao.telefone ? (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{solicitacao.telefone}</span>
                    </div>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>{solicitacao.cargo || '-'}</TableCell>
                <TableCell>
                  {solicitacao.motivo ? (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm max-w-xs truncate">
                        {solicitacao.motivo}
                      </span>
                    </div>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-xs px-2 py-1 bg-muted rounded-full">
                    {solicitacao.source || 'N/A'}
                  </span>
                </TableCell>
                {canDelete && (
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir a solicitação de {solicitacao.nome}?
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => solicitacao.id && onDelete(solicitacao.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};
