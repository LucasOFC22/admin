import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '@/utils/dateFormatters';
import { Badge } from '@/components/ui/badge';

interface NFeResult {
  doc: string;
  emissao: string;
  vencimento: string;
  dataPagamento?: string;
  valorPago?: number;
  juros?: number;
  valorTitulo: number;
  pago: string;
  saldo: number;
  docCliente: string;
  cliente: string;
  boleto: string;
  idBoleto: number;
  status: string;
  idTitulo: number;
}

interface NFeTableProps {
  results: NFeResult[];
}

export const NFeTable = ({ results }: NFeTableProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // formatDate imported from @/utils/dateFormatters

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'liquidado':
        return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'pendente':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      case 'vencido':
        return 'bg-red-500/10 text-red-700 dark:text-red-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Doc</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Emissão</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead className="text-right">Valor Título</TableHead>
            <TableHead className="text-right">Saldo</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                Nenhum resultado encontrado
              </TableCell>
            </TableRow>
          ) : (
            results.map((result) => (
              <TableRow key={result.idTitulo}>
                <TableCell className="font-mono">{result.doc}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{result.cliente}</div>
                    <div className="text-xs text-muted-foreground">{result.docCliente}</div>
                  </div>
                </TableCell>
                <TableCell>{formatDate(result.emissao)}</TableCell>
                <TableCell>{formatDate(result.vencimento)}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(result.valorTitulo)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(result.saldo)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getStatusColor(result.status)}>
                    {result.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
