import { useState, useMemo } from 'react';
import { formatDate as formatDateOnly } from '@/utils/dateFormatters';
import { formatCurrency } from '@/lib/formatters';
import { 
  ChevronUp, ChevronDown, Eye, Edit, Printer, 
  Truck, User, MapPin, Calendar, Package, DollarSign,
  List, Grid3x3
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

interface ColetasDataTableProps {
  data: ColetaApiData[];
  onView: (coleta: ColetaApiData) => void;
  onEdit: (coleta: ColetaApiData) => void;
  onPrint: (coleta: ColetaApiData) => void;
  canEdit?: boolean;
  canPrint?: boolean;
}

type SortDirection = 'asc' | 'desc' | null;
type SortColumn = keyof ColetaApiData | null;

export const ColetasDataTable = ({ data, onView, onEdit, onPrint, canEdit = true, canPrint = true }: ColetasDataTableProps) => {
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

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
    const configs: Record<string, { color: string; label: string }> = {
      'REALIZADA': { color: 'bg-green-50 text-green-700 border-green-200', label: 'Realizada' },
      'PENDENTE': { color: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Pendente' },
      'ANDAMENTO': { color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Em Andamento' },
      'CANCELADA': { color: 'bg-red-50 text-red-700 border-red-200', label: 'Cancelada' },
    };
    const config = configs[situacaoStr] || configs['PENDENTE'];
    return (
      <Badge className={`${config.color} border font-medium text-xs`}>
        {config.label}
      </Badge>
    );
  };

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return <ChevronUp className="h-3 w-3 opacity-30" />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="h-3 w-3" /> 
      : <ChevronDown className="h-3 w-3" />;
  };

  const columns: { key: SortColumn; label: string; className?: string }[] = [
    { key: 'descTipoRegistro', label: 'Tipo' },
    { key: 'idEmpresa', label: 'Empresa' },
    { key: 'nroColeta', label: 'Nº Coleta' },
    { key: 'diaColeta', label: 'Data Coleta' },
    { key: 'horaColeta', label: 'Hora Coleta' },
    { key: 'emissao', label: 'Data Emissão' },
    { key: 'remetente', label: 'Remetente' },
    { key: 'coletaCidade', label: 'Origem' },
    { key: 'placa', label: 'Placa' },
    { key: 'condutor', label: 'Condutor' },
    { key: 'tPeso', label: 'Peso (kg)' },
    { key: 'tVlrMerc', label: 'Valor Total' },
    { key: 'situacao', label: 'Situação' },
  ];

  // Table View
  const renderTable = () => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead
                key={col.key}
                onClick={() => handleSort(col.key)}
                className="cursor-pointer select-none hover:bg-muted/50 whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  {col.label}
                  <SortIcon column={col.key} />
                </div>
              </TableHead>
            ))}
            <TableHead className="whitespace-nowrap">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((coleta) => (
            <TableRow key={coleta.idColeta} className="hover:bg-muted/30">
              <TableCell className="font-medium">{coleta.descTipoRegistro || '-'}</TableCell>
              <TableCell>{coleta.idEmpresa}</TableCell>
              <TableCell className="font-mono">{coleta.nroColeta || '-'}</TableCell>
              <TableCell>{formatDate(coleta.diaColeta)}</TableCell>
              <TableCell>{formatHora(coleta.horaColeta)}</TableCell>
              <TableCell>{formatDate(coleta.emissao)}</TableCell>
              <TableCell className="max-w-[200px] truncate" title={coleta.remetente}>
                {coleta.remetente || '-'}
              </TableCell>
              <TableCell>{coleta.coletaCidade}/{coleta.coletaUf}</TableCell>
              <TableCell className="font-mono">{coleta.placa || '-'}</TableCell>
              <TableCell className="max-w-[150px] truncate" title={coleta.condutor}>
                {coleta.condutor || '-'}
              </TableCell>
              <TableCell className="text-right">{coleta.tPeso?.toLocaleString('pt-BR') || 0}</TableCell>
              <TableCell className="text-right">{formatCurrency(coleta.tVlrMerc)}</TableCell>
              <TableCell>{getSituacaoBadge(coleta.situacao)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => onView(coleta)} title="Visualizar">
                    <Eye className="h-4 w-4" />
                  </Button>
                  {canEdit && (
                    <Button variant="ghost" size="icon" onClick={() => onEdit(coleta)} title="Editar">
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {canPrint && (
                    <Button variant="ghost" size="icon" onClick={() => onPrint(coleta)} title="Baixar PDF">
                      <Printer className="h-4 w-4" />
                    </Button>
                  )}
                </div>
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
        <Card key={coleta.idColeta} className="hover:shadow-lg transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Truck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <span className="font-semibold text-lg">#{coleta.nroColeta}</span>
                  <p className="text-xs text-muted-foreground">{coleta.descTipoRegistro}</p>
                </div>
              </div>
              {getSituacaoBadge(coleta.situacao)}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Remetente</p>
                  <p className="truncate font-medium">{coleta.remetente || '-'}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Origem</p>
                  <p className="truncate">{coleta.coletaCidade}/{coleta.coletaUf} - {coleta.coletaBairro}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Data Coleta</p>
                    <p>{formatDate(coleta.diaColeta)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Package className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Peso</p>
                    <p>{coleta.tPeso?.toLocaleString('pt-BR') || 0} kg</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Valor Mercadoria</p>
                  <p className="font-medium">{formatCurrency(coleta.tVlrMerc)}</p>
                </div>
              </div>

              {coleta.condutor && (
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Condutor</p>
                    <p className="truncate">{coleta.condutor} - {coleta.placa}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mt-4 pt-3 border-t">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => onView(coleta)}>
                <Eye className="h-4 w-4 mr-1" />
                Ver
              </Button>
              {canEdit && (
                <Button variant="outline" size="sm" className="flex-1" onClick={() => onEdit(coleta)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
              )}
              {canPrint && (
                <Button variant="outline" size="icon" onClick={() => onPrint(coleta)}>
                  <Printer className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Truck className="h-12 w-12 mb-4 opacity-30" />
        <p>Nenhuma coleta encontrada</p>
        <p className="text-sm">Use os filtros para buscar coletas</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toggle View Mode */}
      <div className="flex justify-end">
        <div className="flex items-center border rounded-lg p-1 bg-muted/30">
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('table')}
            className="gap-2"
          >
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">Linha</span>
          </Button>
          <Button
            variant={viewMode === 'cards' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('cards')}
            className="gap-2"
          >
            <Grid3x3 className="h-4 w-4" />
            <span className="hidden sm:inline">Card</span>
          </Button>
        </div>
      </div>

      {viewMode === 'table' ? renderTable() : renderCards()}
    </div>
  );
};
