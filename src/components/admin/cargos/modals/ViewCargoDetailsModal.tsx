import { lazy, Suspense, memo } from 'react';
import {
  AdminDialog,
  AdminDialogContent,
  AdminDialogHeader,
  AdminDialogTitle,
  AdminDialogDescription,
} from '@/components/admin/ui/AdminDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  X, 
  Shield, 
  Building2, 
  Users, 
  Calendar,
  Crown,
  Star,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { CargoComDepartamento } from '@/types/database';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ViewCargoDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cargo: CargoComDepartamento | null;
}

// Memoized components for performance
const HierarchyIcon = memo(({ level }: { level?: number }) => {
  const hierarchy = level || 1;
  if (hierarchy >= 9) return <Crown className="h-5 w-5 text-yellow-500" />;
  if (hierarchy >= 7) return <Star className="h-5 w-5 text-blue-500" />;
  if (hierarchy >= 5) return <Shield className="h-5 w-5 text-green-500" />;
  return <Users className="h-5 w-5 text-gray-500" />;
});

HierarchyIcon.displayName = 'HierarchyIcon';

const PermissionsList = memo(({ permissoes }: { permissoes?: string[] }) => {
  if (!permissoes || permissoes.length === 0) {
    return (
      <div className="text-center py-8 bg-slate-50 rounded-lg">
        <Shield className="h-8 w-8 text-slate-400 mx-auto mb-2" />
        <p className="text-sm text-slate-500">Nenhuma permissão atribuída</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {permissoes.map((permissao, idx) => (
        <div 
          key={idx} 
          className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <span className="text-sm text-blue-900 truncate">{permissao}</span>
        </div>
      ))}
    </div>
  );
});

PermissionsList.displayName = 'PermissionsList';

const ViewCargoDetailsModal = memo(({ open, onOpenChange, cargo }: ViewCargoDetailsModalProps) => {
  // Don't render at all when closed for better performance
  if (!open || !cargo) return null;

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <AdminDialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <AdminDialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Detalhes do Cargo
            </AdminDialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <AdminDialogDescription>
            Visualização completa das informações do cargo
          </AdminDialogDescription>
        </AdminDialogHeader>

        <ScrollArea className="flex-1 overflow-auto pr-4">
          <div className="space-y-6 py-4">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-bold text-xl text-slate-800">{cargo.nome}</h3>
                    <Badge variant={cargo.ativo !== false ? 'default' : 'secondary'}>
                      {cargo.ativo !== false ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  {cargo.descricao && (
                    <p className="text-slate-600 leading-relaxed">{cargo.descricao}</p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Hierarquia e Departamento */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Nível Hierárquico</label>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                  <HierarchyIcon level={cargo.level} />
                  <span className="font-semibold text-slate-800">Nível {cargo.level || 1}</span>
                </div>
              </div>

              {cargo.departamento_info && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Departamento</label>
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-slate-800">{cargo.departamento_info.nome}</span>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Permissões */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Permissões ({cargo.permissoes?.length || 0})
                </label>
              </div>
              <PermissionsList permissoes={cargo.permissoes} />
            </div>

            <Separator />

            {/* Data de Criação */}
            {cargo.created_at && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data de Criação
                </label>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-700">
                    {format(new Date(cargo.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Fechar
          </Button>
        </div>
      </AdminDialogContent>
    </AdminDialog>
  );
});

ViewCargoDetailsModal.displayName = 'ViewCargoDetailsModal';

export default ViewCargoDetailsModal;
