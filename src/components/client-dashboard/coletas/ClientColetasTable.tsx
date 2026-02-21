import { useState, useMemo } from 'react';
import { formatDate as formatDateOnly } from '@/utils/dateFormatters';
import { formatCurrency } from '@/lib/formatters';
import { 
  ChevronUp, ChevronDown, Eye, 
  Truck, User, MapPin, Calendar, Package, DollarSign,
  List, Grid3x3, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ColetaApiData } from '@/types/coleta';
import { getSituacaoLabel } from '@/hooks/useColetasApi';

interface ClientColetasTableProps {
  data: ColetaApiData[];
  onView: (coleta: ColetaApiData) => void;
}

type SortDirection = 'asc' | 'desc' | null;
type SortColumn = keyof ColetaApiData | null;

export const ClientColetasTable = ({ data, onView }: ClientColetasTableProps) => {
  const [sortColumn, setSortColumn] = useState<SortColumn>('diaColeta');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;

      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue, 'pt-BR');
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue), 'pt-BR');
      }

      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }, [data, sortColumn, sortDirection]);

  const formatDate = (dateString?: string) => formatDateOnly(dateString);

  // formatCurrency imported from @/lib/formatters

  const formatHora = (hora?: string) => {
    if (!hora || hora.trim() === ':' || hora.includes('AS') && hora.trim().startsWith(':')) return '-';
    return hora.trim();
  };

  const getSituacaoBadge = (situacao?: string | number) => {
    const situacaoStr = getSituacaoLabel(situacao);
    const configs: Record<string, { color: string; label: string; description: string }> = {
      'REALIZADA': { 
        color: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400', 
        label: 'Realizada',
        description: 'Coleta concluída com sucesso'
      },
      'PENDENTE': { 
        color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400', 
        label: 'Pendente',
        description: 'Aguardando agendamento'
      },
      'ANDAMENTO': { 
        color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400', 
        label: 'Em Andamento',
        description: 'Coleta em execução'
      },
      'CANCELADA': { 
        color: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400', 
        label: 'Cancelada',
        description: 'Coleta foi cancelada'
      },
    };
    const config = configs[situacaoStr] || configs['PENDENTE'];
    return (
      <Badge className={`${config.color} border font-medium text-xs`}>
        {config.label}
      </Badge>
    );
  };

  const getSituacaoDescription = (situacao?: string | number) => {
    const situacaoStr = getSituacaoLabel(situacao);
    const configs: Record<string, string> = {
      'REALIZADA': 'Sua coleta foi realizada com sucesso!',
      'PENDENTE': 'Aguardando confirmação da data e horário.',
      'ANDAMENTO': 'Nossa equipe está a caminho.',
      'CANCELADA': 'Esta coleta foi cancelada.',
    };
    return configs[situacaoStr] || configs['PENDENTE'];
  };

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return <ChevronUp className="h-3 w-3 opacity-30" />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="h-3 w-3" /> 
      : <ChevronDown className="h-3 w-3" />;
  };

  const columns: { key: SortColumn; label: string }[] = [
    { key: 'nroColeta', label: 'Nº Coleta' },
    { key: 'diaColeta', label: 'Data Coleta' },
    { key: 'coletaCidade', label: 'Origem' },
    { key: 'tPeso', label: 'Peso' },
    { key: 'tVlrMerc', label: 'Valor' },
    { key: 'situacao', label: 'Status' },
  ];

  // Table View
  const renderTable = () => (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            {columns.map((col) => (
              <TableHead
                key={col.key}
                onClick={() => handleSort(col.key)}
                className="cursor-pointer select-none hover:bg-muted/80 whitespace-nowrap font-semibold"
              >
                <div className="flex items-center gap-1">
                  {col.label}
                  <SortIcon column={col.key} />
                </div>
              </TableHead>
            ))}
            <TableHead className="whitespace-nowrap font-semibold">Detalhes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((coleta) => (
            <TableRow key={coleta.idColeta} className="hover:bg-muted/30">
              <TableCell className="font-mono font-medium">#{coleta.nroColeta || '-'}</TableCell>
              <TableCell>{formatDate(coleta.diaColeta)}</TableCell>
              <TableCell>{coleta.coletaCidade}/{coleta.coletaUf}</TableCell>
              <TableCell className="text-right">{coleta.tPeso?.toLocaleString('pt-BR') || 0} kg</TableCell>
              <TableCell className="text-right">{formatCurrency(coleta.tVlrMerc)}</TableCell>
              <TableCell>{getSituacaoBadge(coleta.situacao)}</TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" onClick={() => onView(coleta)}>
                  <Eye className="h-4 w-4 mr-1" />
                  Ver
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  // Cards View
  const renderCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {sortedData.map((coleta) => (
        <Card 
          key={coleta.idColeta} 
          className="hover:shadow-lg transition-all duration-200 cursor-pointer group"
          onClick={() => onView(coleta)}
        >
          <CardContent className="p-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                  <Truck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <span className="font-bold text-lg">#{coleta.nroColeta}</span>
                  <p className="text-xs text-muted-foreground">{coleta.descTipoRegistro || 'Coleta'}</p>
                </div>
              </div>
              {getSituacaoBadge(coleta.situacao)}
            </div>

            {/* Status Description */}
            <p className="text-sm text-muted-foreground mb-4 italic">
              {getSituacaoDescription(coleta.situacao)}
            </p>

            {/* Info Grid */}
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Origem</p>
                  <p className="text-sm font-medium truncate">{coleta.coletaCidade}/{coleta.coletaUf}</p>
                  {coleta.coletaBairro && (
                    <p className="text-xs text-muted-foreground truncate">{coleta.coletaBairro}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Data</p>
                    <p className="text-sm font-medium">{formatDate(coleta.diaColeta)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Horário</p>
                    <p className="text-sm font-medium">{formatHora(coleta.horaColeta)}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-start gap-2">
                  <Package className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Peso</p>
                    <p className="text-sm font-medium">{coleta.tPeso?.toLocaleString('pt-BR') || 0} kg</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Valor</p>
                    <p className="text-sm font-medium">{formatCurrency(coleta.tVlrMerc)}</p>
                  </div>
                </div>
              </div>

              {/* Motorista e Placa REMOVIDOS conforme solicitado */}
            </div>

            {/* Action */}
            <Button variant="outline" size="sm" className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Eye className="h-4 w-4 mr-2" />
              Ver Detalhes
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <div className="p-4 bg-muted/50 rounded-full mb-4">
          <Truck className="h-12 w-12 opacity-50" />
        </div>
        <p className="font-medium text-lg mb-1">Nenhuma coleta encontrada</p>
        <p className="text-sm text-center max-w-sm">
          Você ainda não possui coletas registradas ou nenhuma coleta corresponde aos filtros selecionados.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toggle View Mode */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {data.length} coleta{data.length !== 1 ? 's' : ''} encontrada{data.length !== 1 ? 's' : ''}
        </p>
        <div className="flex items-center border rounded-lg p-1 bg-muted/30">
          <Button
            variant={viewMode === 'cards' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('cards')}
            className="gap-2"
          >
            <Grid3x3 className="h-4 w-4" />
            <span className="hidden sm:inline">Cards</span>
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('table')}
            className="gap-2"
          >
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">Lista</span>
          </Button>
        </div>
      </div>

      {viewMode === 'cards' ? renderCards() : renderTable()}
    </div>
  );
};
