import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Filter, Search, Download, Sparkles, Calendar, HelpCircle, FileSpreadsheet, FileText } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subYears, subDays } from 'date-fns';
import { EmpresaSelector } from '@/components/admin/EmpresaSelector';

interface DREFiltersProps {
  empresa: string;
  setEmpresa: (value: string) => void;
  regime: string;
  setRegime: (value: string) => void;
  dataInicial: string;
  setDataInicial: (value: string) => void;
  dataFinal: string;
  setDataFinal: (value: string) => void;
  onSearch: () => void;
  onExportExcel: (format: 'csv' | 'pdf') => void;
  onAIAnalysis?: () => void;
  isLoading?: boolean;
}

export const DREFilters: React.FC<DREFiltersProps> = ({
  empresa,
  setEmpresa,
  regime,
  setRegime,
  dataInicial,
  setDataInicial,
  dataFinal,
  setDataFinal,
  onSearch,
  onExportExcel,
  onAIAnalysis,
  isLoading = false
}) => {
  const handleShortcut = (type: string) => {
    const today = new Date();
    let start: Date;
    let end: Date;

    switch (type) {
      case 'ultima-semana':
        start = startOfWeek(subDays(today, 7));
        end = endOfWeek(subDays(today, 7));
        break;
      case 'mes-atual':
        start = startOfMonth(today);
        end = endOfMonth(today);
        break;
      case 'mes-passado':
        start = startOfMonth(subMonths(today, 1));
        end = endOfMonth(subMonths(today, 1));
        break;
      case '6-meses':
        start = subMonths(today, 6);
        end = today;
        break;
      case '1-ano':
        start = subYears(today, 1);
        end = today;
        break;
      default:
        return;
    }

    setDataInicial(format(start, 'yyyy-MM-dd'));
    setDataFinal(format(end, 'yyyy-MM-dd'));
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Filter className="h-5 w-5" />
          Filtros
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Empresa */}
          <div className="sm:col-span-2">
            <EmpresaSelector
              value={empresa}
              onChange={setEmpresa}
              showAllOption={true}
              label="Empresa"
              required={true}
            />
          </div>

          {/* Regime */}
          <div>
            <Label className="flex items-center gap-2">
              Regime
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Competência: considera a data do fato gerador</p>
                    <p>Caixa: considera a data do pagamento/recebimento</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Select value={regime} onValueChange={setRegime}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="caixa">Caixa</SelectItem>
                <SelectItem value="competencia-titulos">Competência (Títulos)</SelectItem>
                <SelectItem value="competencia-cte">Competência (CTE)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Plano de Contas */}
          <div>
            <Label>Plano de Contas (Opcional)</Label>
            <Button variant="outline" className="w-full">
              <Search className="h-4 w-4 mr-2" />
              Filtrar por Plano
            </Button>
          </div>

          {/* Atalhos */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-4">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Atalhos
            </Label>
            <div className="flex flex-wrap gap-2 mt-2">
              <Button variant="outline" size="sm" onClick={() => handleShortcut('ultima-semana')}>
                Última Semana
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleShortcut('mes-atual')}>
                Mês Atual
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleShortcut('mes-passado')}>
                Mês Passado
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleShortcut('6-meses')}>
                6 Meses
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleShortcut('1-ano')}>
                1 Ano
              </Button>
            </div>
          </div>

          {/* Data Inicial */}
          <div>
            <Label>Data Inicial</Label>
            <Input
              type="date"
              value={dataInicial}
              onChange={(e) => setDataInicial(e.target.value)}
            />
          </div>

          {/* Data Final */}
          <div>
            <Label>Data Final</Label>
            <Input
              type="date"
              value={dataFinal}
              onChange={(e) => setDataFinal(e.target.value)}
            />
          </div>

          {/* Botões de ação */}
          <div className="col-span-1 sm:col-span-2 flex flex-col sm:flex-row items-stretch sm:items-end gap-2">
            <Button className="flex-1" onClick={onSearch} disabled={isLoading}>
              <Search className="h-4 w-4 mr-2" />
              {isLoading ? 'Buscando...' : 'Buscar'}
            </Button>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex-1 sm:flex-none">
                    <Download className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Exportar</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onExportExcel('csv')}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Exportar CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onExportExcel('pdf')}>
                    <FileText className="h-4 w-4 mr-2" />
                    Exportar PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {onAIAnalysis && (
                <Button variant="outline" onClick={onAIAnalysis} className="flex-1 sm:flex-none">
                  <Sparkles className="h-4 w-4 sm:mr-2" />
                  <span className="sm:inline">IA</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
