import { Search, Hash, User, MapPin, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CotacoesFiltersProps {
  filtros: {
    remetente: string;
    destinatario: string;
    status: string;
    id: string;
    emissao_inicio: string;
    emissao_fim: string;
    nro_cte?: string;
    id_tomador?: string;
    id_tabela_preco?: string;
  };
  onFilterChange: (field: string, value: string) => void;
  onClearFilters: () => void;
  cotacoesCount: number;
}

export const CotacoesFilters = ({ 
  filtros, 
  onFilterChange, 
  onClearFilters, 
  cotacoesCount 
}: CotacoesFiltersProps) => {
  return (
    <Card className="border border-border/60">
      <CardHeader className="pb-4 border-b border-border/40">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <Search className="h-4 w-4 text-muted-foreground" />
          Filtros de Busca
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="id" className="flex items-center gap-2 text-xs text-muted-foreground">
              <Hash className="h-3 w-3" />
              ID da Cotação
            </Label>
            <Input
              id="id"
              placeholder="Digite o ID..."
              value={filtros.id}
              onChange={(e) => onFilterChange('id', e.target.value)}
              className="h-9 text-sm border-border/60"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="remetente" className="flex items-center gap-2 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              Remetente
            </Label>
            <Input
              id="remetente"
              placeholder="Nome do remetente..."
              value={filtros.remetente}
              onChange={(e) => onFilterChange('remetente', e.target.value)}
              className="h-9 text-sm border-border/60"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="destinatario" className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              Destinatário
            </Label>
            <Input
              id="destinatario"
              placeholder="Nome do destinatário..."
              value={filtros.destinatario}
              onChange={(e) => onFilterChange('destinatario', e.target.value)}
              className="h-9 text-sm border-border/60"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-xs text-muted-foreground">
              <Activity className="h-3 w-3" />
              Status
            </Label>
            <Select value={filtros.status} onValueChange={(value) => onFilterChange('status', value)}>
              <SelectTrigger className="h-9 text-sm border-border/60">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Proposta Enviada">Proposta Enviada</SelectItem>
                <SelectItem value="Aprovado">Aprovado</SelectItem>
                <SelectItem value="Recusado">Recusado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-4 border-t border-border/40">
          <p className="text-xs text-muted-foreground">
            {cotacoesCount > 0 && (
              <>
                {cotacoesCount} cotação{cotacoesCount !== 1 ? 'ões' : ''} encontrada{cotacoesCount !== 1 ? 's' : ''}
              </>
            )}
          </p>
          <Button 
            onClick={onClearFilters} 
            variant="outline" 
            size="sm"
            className="shrink-0 h-8 text-xs"
          >
            Limpar Filtros
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
