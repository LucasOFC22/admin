import { memo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Edit, Trash2, Shield, Users, Eye } from 'lucide-react';
import { CargoComDepartamento } from '@/types/database';
import { useUserHierarchy } from '@/hooks/useUserHierarchy';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
interface CargosGridViewProps {
  cargos: CargoComDepartamento[];
  isLoading: boolean;
  hasFilters: boolean;
  onEdit: (cargo: CargoComDepartamento) => void;
  onDelete: (cargo: CargoComDepartamento) => void;
  onView: (cargo: CargoComDepartamento) => void;
  onCreateNew: () => void;
  onClearFilters: () => void;
}

const CargoCard = memo(({ 
  cargo, 
  onEdit, 
  onDelete, 
  onView,
  canEdit 
}: { 
  cargo: CargoComDepartamento; 
  onEdit: (cargo: CargoComDepartamento) => void;
  onDelete: (cargo: CargoComDepartamento) => void;
  onView: (cargo: CargoComDepartamento) => void;
  canEdit: boolean;
}) => {
  return (
    <Card className="p-6 hover:shadow-lg transition-all duration-200 border-border/50 bg-card">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-lg text-foreground truncate">
                {cargo.nome}
              </h3>
              {cargo.descricao && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {cargo.descricao}
                </p>
              )}
            </div>
          </div>
          <Badge variant={cargo.ativo !== false ? 'default' : 'secondary'}>
            {cargo.ativo !== false ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>

        {/* Info */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Nível {cargo.level || 1}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{cargo.userCount || 0} usuários</span>
          </div>
        </div>

        {/* Departamento */}
        {cargo.departamento_info && (
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{cargo.departamento_info.nome}</span>
          </div>
        )}


        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(cargo)}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-2" />
            Ver
          </Button>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(cargo)}
                  disabled={!canEdit}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </TooltipTrigger>
              {!canEdit && (
                <TooltipContent>
                  Você só pode editar cargos de nível igual ou inferior ao seu
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(cargo)}
                  disabled={!canEdit}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              {!canEdit && (
                <TooltipContent>
                  Você só pode excluir cargos de nível igual ou inferior ao seu
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </Card>
  );
});

CargoCard.displayName = 'CargoCard';

const CargosGridView = memo(({
  cargos,
  isLoading,
  hasFilters,
  onEdit,
  onDelete,
  onView,
  onCreateNew,
  onClearFilters,
}: CargosGridViewProps) => {
  const { canEditCargo } = useUserHierarchy();
  const { hasPermission } = usePermissionGuard();
  const canEditPermission = hasPermission('admin.cargos.editar');

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="space-y-4">
              <div className="h-6 bg-muted rounded" />
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (cargos.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {hasFilters ? 'Nenhum cargo encontrado' : 'Nenhum cargo cadastrado'}
        </h3>
        <p className="text-muted-foreground mb-6">
          {hasFilters 
            ? 'Tente ajustar os filtros para ver mais resultados'
            : 'Comece criando seu primeiro cargo'
          }
        </p>
        <Button onClick={hasFilters ? onClearFilters : onCreateNew}>
          {hasFilters ? 'Limpar Filtros' : 'Criar Primeiro Cargo'}
        </Button>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cargos.map((cargo) => (
        <CargoCard
          key={cargo.id}
          cargo={cargo}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
          canEdit={canEditPermission && canEditCargo(cargo.level || 1)}
        />
      ))}
    </div>
  );
});

CargosGridView.displayName = 'CargosGridView';

export default CargosGridView;
