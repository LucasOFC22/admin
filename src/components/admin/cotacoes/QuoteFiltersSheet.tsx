import { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Filter, RotateCcw } from 'lucide-react';

interface FilterOptions {
  id?: string;
  remetente?: string;
  destinatario?: string;
  emissao_inicio?: string;
  emissao_fim?: string;
  nro_orcamento_inicio?: string;
  nro_orcamento_fim?: string;
  nro_cte?: string;
  id_cliente?: string;
  id_remetente?: string;
  id_destinatario?: string;
  id_tomador?: string;
  id_cidade_origem?: string;
  id_cidade_destino?: string;
  id_tabela_preco?: string;
  vlr_total?: string;
  empresas?: string;
  uf_origem?: string;
  uf_destino?: string;
}

interface QuoteFiltersSheetProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onClearFilters: () => void;
}

export default function QuoteFiltersSheet({ filters, onFiltersChange, onClearFilters }: QuoteFiltersSheetProps) {
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);
  const [isOpen, setIsOpen] = useState(false);

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  const handleClearFilters = () => {
    setLocalFilters({});
    onClearFilters();
    setIsOpen(false);
  };

  const activeFiltersCount = Object.values(filters).filter(value => value && value.trim() !== '').length;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant={activeFiltersCount > 0 ? "default" : "outline"}
          size="icon"
          className={`relative h-9 w-9 transition-all duration-200 ${
            activeFiltersCount > 0 
              ? 'bg-primary text-primary-foreground shadow-md' 
              : 'hover:bg-muted/80'
          }`}
          title="Filtros avançados"
        >
          <Filter className="h-4 w-4" />
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent side="bottom" className="h-[95vh] sm:h-auto max-h-[95vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle>Filtros Avançados</SheetTitle>
          <SheetDescription>
            Use os filtros abaixo para refinar sua busca por cotações
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-6 py-6">
          {/* ID da Cotação */}
          <div className="space-y-2">
            <Label htmlFor="filter-id">ID da Cotação</Label>
            <Input
              id="filter-id"
              placeholder="Digite o ID completo ou parcial"
              value={localFilters.id || ''}
              onChange={(e) => setLocalFilters(prev => ({ ...prev, id: e.target.value }))}
            />
          </div>

          <Separator />

          {/* Remetente e Destinatário */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filter-remetente">Remetente</Label>
              <Input
                id="filter-remetente"
                placeholder="Nome do remetente"
                value={localFilters.remetente || ''}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, remetente: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-destinatario">Destinatário</Label>
              <Input
                id="filter-destinatario"
                placeholder="Nome do destinatário"
                value={localFilters.destinatario || ''}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, destinatario: e.target.value }))}
              />
            </div>
          </div>

          <Separator />

          {/* Período de Emissão */}
          <div className="space-y-4">
            <Label>Período de Emissão</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="filter-emissao-inicio" className="text-sm text-muted-foreground">
                  Data Emissão (Início)
                </Label>
                <Input
                  id="filter-emissao-inicio"
                  type="date"
                  value={localFilters.emissao_inicio || ''}
                  onChange={(e) => setLocalFilters(prev => ({ ...prev, emissao_inicio: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-emissao-fim" className="text-sm text-muted-foreground">
                  Data Emissão (Fim)
                </Label>
                <Input
                  id="filter-emissao-fim"
                  type="date"
                  value={localFilters.emissao_fim || ''}
                  onChange={(e) => setLocalFilters(prev => ({ ...prev, emissao_fim: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Número CTE */}
          <div className="space-y-2">
            <Label htmlFor="filter-nro-cte">Número CTE</Label>
            <Input
              id="filter-nro-cte"
              placeholder="Digite o número do CTE"
              value={localFilters.nro_cte || ''}
              onChange={(e) => setLocalFilters(prev => ({ ...prev, nro_cte: e.target.value }))}
            />
          </div>

          <Separator />

          {/* Número de Orçamento */}
          <div className="space-y-4">
            <Label>Número de Orçamento</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="filter-orcamento-inicio" className="text-sm text-muted-foreground">
                  Nº Inicial
                </Label>
                <Input
                  id="filter-orcamento-inicio"
                  placeholder="Número inicial"
                  value={localFilters.nro_orcamento_inicio || ''}
                  onChange={(e) => setLocalFilters(prev => ({ ...prev, nro_orcamento_inicio: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-orcamento-fim" className="text-sm text-muted-foreground">
                  Nº Final
                </Label>
                <Input
                  id="filter-orcamento-fim"
                  placeholder="Número final"
                  value={localFilters.nro_orcamento_fim || ''}
                  onChange={(e) => setLocalFilters(prev => ({ ...prev, nro_orcamento_fim: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* IDs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filter-id-cliente">ID Cliente</Label>
              <Input
                id="filter-id-cliente"
                placeholder="ID do cliente"
                value={localFilters.id_cliente || ''}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, id_cliente: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-id-tomador">ID Tomador</Label>
              <Input
                id="filter-id-tomador"
                placeholder="ID do tomador"
                value={localFilters.id_tomador || ''}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, id_tomador: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-id-remetente">ID Remetente</Label>
              <Input
                id="filter-id-remetente"
                placeholder="ID do remetente"
                value={localFilters.id_remetente || ''}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, id_remetente: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-id-destinatario">ID Destinatário</Label>
              <Input
                id="filter-id-destinatario"
                placeholder="ID do destinatário"
                value={localFilters.id_destinatario || ''}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, id_destinatario: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-id-tabela-preco">ID Tabela de Preço</Label>
              <Input
                id="filter-id-tabela-preco"
                placeholder="ID da tabela de preço"
                value={localFilters.id_tabela_preco || ''}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, id_tabela_preco: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-vlr-total">Valor Total</Label>
              <Input
                id="filter-vlr-total"
                type="number"
                placeholder="Valor total"
                value={localFilters.vlr_total || ''}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, vlr_total: e.target.value }))}
              />
            </div>
          </div>

          <Separator />

          {/* Cidades */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filter-cidade-origem">ID Cidade Origem</Label>
              <Input
                id="filter-cidade-origem"
                placeholder="ID da cidade origem"
                value={localFilters.id_cidade_origem || ''}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, id_cidade_origem: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-cidade-destino">ID Cidade Destino</Label>
              <Input
                id="filter-cidade-destino"
                placeholder="ID da cidade destino"
                value={localFilters.id_cidade_destino || ''}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, id_cidade_destino: e.target.value }))}
              />
            </div>
          </div>

          <Separator />

          {/* UF e Empresas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filter-uf-origem">UF Origem</Label>
              <Input
                id="filter-uf-origem"
                placeholder="Ex: SP, RJ, MG"
                maxLength={2}
                value={localFilters.uf_origem || ''}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, uf_origem: e.target.value.toUpperCase() }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-uf-destino">UF Destino</Label>
              <Input
                id="filter-uf-destino"
                placeholder="Ex: SP, RJ, MG"
                maxLength={2}
                value={localFilters.uf_destino || ''}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, uf_destino: e.target.value.toUpperCase() }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-empresas">Empresas</Label>
              <Input
                id="filter-empresas"
                placeholder="Ex: 1,2,3"
                value={localFilters.empresas || ''}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, empresas: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-6 border-t">
          <Button 
            variant="outline" 
            onClick={handleClearFilters}
            className="flex-1 sm:flex-none"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Limpar Tudo
          </Button>
          <Button 
            onClick={handleApplyFilters}
            className="flex-1"
          >
            Aplicar Filtros
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}