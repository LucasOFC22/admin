import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Filter, UserSearch, Search } from 'lucide-react';
import { SelectRegisterModal } from '@/components/modals/SelectRegisterModal';
import { EmpresaSelector } from '@/components/admin/EmpresaSelector';
import { DateShortcuts } from '@/components/ui/date-shortcuts';

export interface ContasReceberFiltros {
  empresa: string;
  idCliente: string;
  clienteNome: string;
  dataEmissaoInicio: string;
  dataEmissaoFim: string;
  dataVencimentoInicio: string;
  dataVencimentoFim: string;
  dataPagamentoInicio: string;
  dataPagamentoFim: string;
  numeroFaturaInicio: string;
  numeroFaturaFim: string;
  numeroCTE: string;
  valorMinimo: string;
  valorMaximo: string;
  status: string;
  apenasBoleto: boolean;
}

interface ContasReceberFiltersProps {
  filtros: ContasReceberFiltros;
  setFiltros: (filtros: ContasReceberFiltros) => void;
  onSearch?: () => void;
  onClear?: () => void;
}

export const ContasReceberFilters = ({ filtros, setFiltros, onSearch, onClear }: ContasReceberFiltersProps) => {
  const [clienteModalOpen, setClienteModalOpen] = useState(false);

  const handleClear = () => {
    setFiltros({
      empresa: 'all',
      idCliente: '',
      clienteNome: '',
      dataEmissaoInicio: '',
      dataEmissaoFim: '',
      dataVencimentoInicio: '',
      dataVencimentoFim: '',
      dataPagamentoInicio: '',
      dataPagamentoFim: '',
      numeroFaturaInicio: '',
      numeroFaturaFim: '',
      numeroCTE: '',
      valorMinimo: '',
      valorMaximo: '',
      status: 'todos',
      apenasBoleto: false,
    });
    onClear?.();
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
          Filtros de Pesquisa
        </CardTitle>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Configure os filtros para buscar as contas a receber
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Empresas */}
          <div className="sm:col-span-2 lg:col-span-3">
            <EmpresaSelector
              value={filtros.empresa}
              onChange={(value) => setFiltros({...filtros, empresa: value})}
              showAllOption={true}
              label="Empresas"
            />
          </div>

          {/* Cliente */}
          <div className="space-y-2 sm:col-span-2 lg:col-span-1">
            <Label>Cliente</Label>
            <Button 
              variant="outline" 
              className="w-full justify-start text-left"
              onClick={() => setClienteModalOpen(true)}
            >
              <UserSearch className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">{filtros.clienteNome || 'Selecionar cliente'}</span>
            </Button>
          </div>

          {/* Data de Emissão - Início */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">Data de Emissão - Início</Label>
            <Input 
              type="date"
              value={filtros.dataEmissaoInicio}
              onChange={(e) => setFiltros({ ...filtros, dataEmissaoInicio: e.target.value })}
              className="text-sm"
            />
          </div>

          {/* Data de Emissão - Fim */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">Data de Emissão - Fim</Label>
            <Input 
              type="date"
              value={filtros.dataEmissaoFim}
              onChange={(e) => setFiltros({ ...filtros, dataEmissaoFim: e.target.value })}
              className="text-sm"
            />
          </div>

          {/* Atalhos Emissão */}
          <div className="space-y-2 sm:col-span-2 lg:col-span-1">
            <Label className="text-[10px] text-muted-foreground">Emissão</Label>
            <DateShortcuts 
              shortcuts={['mes-passado', 'mes-atual', 'semana-atual', 'prox-semana']}
              onSelect={(start, end) => setFiltros({...filtros, dataEmissaoInicio: start, dataEmissaoFim: end})}
            />
          </div>

          {/* Data de Vencimento - Início */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">Data de Vencimento - Início</Label>
            <Input 
              type="date"
              value={filtros.dataVencimentoInicio}
              onChange={(e) => setFiltros({ ...filtros, dataVencimentoInicio: e.target.value })}
              className="text-sm"
            />
          </div>

          {/* Data de Vencimento - Fim */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">Data de Vencimento - Fim</Label>
            <Input 
              type="date"
              value={filtros.dataVencimentoFim}
              onChange={(e) => setFiltros({ ...filtros, dataVencimentoFim: e.target.value })}
              className="text-sm"
            />
          </div>

          {/* Atalhos Vencimento */}
          <div className="space-y-2 sm:col-span-2 lg:col-span-1">
            <Label className="text-[10px] text-muted-foreground">Vencimento</Label>
            <DateShortcuts 
              shortcuts={['mes-passado', 'mes-atual', 'semana-atual', 'prox-semana']}
              onSelect={(start, end) => setFiltros({...filtros, dataVencimentoInicio: start, dataVencimentoFim: end})}
            />
          </div>

          {/* Data de Pagamento - Início */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">Data de Pagamento - Início</Label>
            <Input 
              type="date"
              value={filtros.dataPagamentoInicio}
              onChange={(e) => setFiltros({ ...filtros, dataPagamentoInicio: e.target.value })}
              className="text-sm"
            />
          </div>

          {/* Data de Pagamento - Fim */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">Data de Pagamento - Fim</Label>
            <Input 
              type="date"
              value={filtros.dataPagamentoFim}
              onChange={(e) => setFiltros({ ...filtros, dataPagamentoFim: e.target.value })}
              className="text-sm"
            />
          </div>

          {/* Atalhos Pagamento */}
          <div className="space-y-2 sm:col-span-2 lg:col-span-1">
            <Label className="text-[10px] text-muted-foreground">Pagamento</Label>
            <DateShortcuts 
              shortcuts={['mes-passado', 'mes-atual', 'semana-atual', 'prox-semana']}
              onSelect={(start, end) => setFiltros({...filtros, dataPagamentoInicio: start, dataPagamentoFim: end})}
            />
          </div>

          {/* Numero Fatura - Início */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">Numero Fatura - Início</Label>
            <Input placeholder="Número Fatura Inicio" value={filtros.numeroFaturaInicio} onChange={(e) => setFiltros({...filtros, numeroFaturaInicio: e.target.value})} className="text-sm" />
          </div>

          {/* Numero Fatura - Fim */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">Numero Fatura - Fim</Label>
            <Input placeholder="Número Fatura Fim" value={filtros.numeroFaturaFim} onChange={(e) => setFiltros({...filtros, numeroFaturaFim: e.target.value})} className="text-sm" />
          </div>

          {/* Número CTE */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">Número CTE</Label>
            <Input placeholder="Número do CTE" value={filtros.numeroCTE} onChange={(e) => setFiltros({...filtros, numeroCTE: e.target.value})} className="text-sm" />
          </div>

          {/* Valor Mínimo */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">Valor Mínimo</Label>
            <Input type="number" placeholder="0,00" step="0.01" value={filtros.valorMinimo} onChange={(e) => setFiltros({...filtros, valorMinimo: e.target.value})} className="text-sm" />
          </div>

          {/* Valor Máximo */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">Valor Máximo</Label>
            <Input type="number" placeholder="0,00" step="0.01" value={filtros.valorMaximo} onChange={(e) => setFiltros({...filtros, valorMaximo: e.target.value})} className="text-sm" />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">Status</Label>
            <Select value={filtros.status} onValueChange={(value) => setFiltros({...filtros, status: value})}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="aberto">Aberto</SelectItem>
                <SelectItem value="atrasado">Atrasado</SelectItem>
                <SelectItem value="liquidado">Liquidado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Apenas Boleto */}
          <div className="space-y-2 flex items-end pb-2">
            <div className="flex items-center space-x-2">
              <Checkbox id="apenas-boleto" checked={filtros.apenasBoleto} onCheckedChange={(checked) => setFiltros({...filtros, apenasBoleto: checked as boolean})} />
              <Label htmlFor="apenas-boleto" className="cursor-pointer text-xs sm:text-sm">Apenas Boleto</Label>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-6">
          <Button onClick={onSearch} className="flex-1 sm:flex-[2]">
            <Search className="mr-2 h-4 w-4" />
            Buscar
          </Button>
          <Button variant="outline" onClick={handleClear} className="flex-1">
            Limpar Filtros
          </Button>
        </div>
      </CardContent>

      <SelectRegisterModal
        open={clienteModalOpen}
        onOpenChange={setClienteModalOpen}
        onSelect={(cadastro) => {
          setFiltros({ 
            ...filtros, 
            idCliente: cadastro.idCliente.toString(),
            clienteNome: cadastro.nome
          });
        }}
        title="Selecionar Cliente"
      />
    </Card>
  );
};
