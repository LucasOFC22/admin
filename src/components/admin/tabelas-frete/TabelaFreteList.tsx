import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, History, FileSpreadsheet, Loader2 } from 'lucide-react';
import { TabelaFrete } from './TabelasFreteManager';

interface TabelaFreteListProps {
  tabelas: TabelaFrete[];
  isLoading: boolean;
  onSelect: (t: TabelaFrete) => void;
  onDelete?: (id: string) => void;
  onShowLogs: (id: string) => void;
}

const TabelaFreteList = ({ tabelas, isLoading, onSelect, onDelete, onShowLogs }: TabelaFreteListProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (tabelas.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <FileSpreadsheet className="h-12 w-12 mb-4 opacity-30" />
          <p className="text-lg font-medium">Nenhuma tabela de frete</p>
          <p className="text-sm">Crie uma nova tabela para começar</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Colunas</TableHead>
              <TableHead>Linhas</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead>Última alteração</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tabelas.map((tabela) => (
              <TableRow key={tabela.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onSelect(tabela)}>
                <TableCell className="font-medium">{tabela.nome}</TableCell>
                <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                  {tabela.descricao || '—'}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{(tabela.colunas || []).length}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{(tabela.dados || []).length}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(tabela.criado_em), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(tabela.atualizado_em), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" onClick={() => onSelect(tabela)} title="Editar">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onShowLogs(tabela.id)} title="Logs">
                      <History className="h-4 w-4" />
                    </Button>
                    {onDelete && (
                      <Button variant="ghost" size="icon" onClick={() => onDelete(tabela.id)} title="Excluir" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default TabelaFreteList;
