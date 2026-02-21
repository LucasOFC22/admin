import { useState } from 'react';
import {
  AdminDialog,
  AdminDialogContent,
  AdminDialogDescription,
  AdminDialogFooter,
  AdminDialogHeader,
  AdminDialogTitle,
} from '@/components/admin/ui/AdminDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Users, Building2, Trash2, X } from 'lucide-react';
import { CargoComDepartamento } from '@/types/database';

interface DeleteCargoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cargo: CargoComDepartamento | null;
  onConfirm: (cargoId: number) => Promise<void>;
}

const DeleteCargoModal = ({ open, onOpenChange, cargo, onConfirm }: DeleteCargoModalProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!cargo) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Hook já exibe notificação de sucesso/erro
      await onConfirm(cargo.id);
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting cargo:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const hasUsers = cargo.userCount && cargo.userCount > 0;

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent className="max-w-full sm:max-w-md">
        <AdminDialogHeader className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <AdminDialogTitle className="text-xl">Excluir Cargo</AdminDialogTitle>
              <AdminDialogDescription className="text-sm text-gray-600 mt-1">
                Esta ação não pode ser desfeita
              </AdminDialogDescription>
            </div>
          </div>
        </AdminDialogHeader>

        <div className="space-y-4">
          {/* Informações do Cargo */}
          <div className="p-4 bg-gray-50 rounded-lg space-y-3">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-gray-600" />
              <div>
                <h3 className="font-semibold text-gray-900">{cargo.nome}</h3>
                {cargo.descricao && (
                  <p className="text-sm text-gray-600">{cargo.descricao}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant={cargo.ativo !== false ? 'default' : 'secondary'}>
                {cargo.ativo !== false ? 'Ativo' : 'Inativo'}
              </Badge>
              {cargo.departamento && (
                <Badge variant="outline">
                  Dept. {cargo.departamento}
                </Badge>
              )}
            </div>
          </div>

          {/* Aviso sobre usuários */}
          {hasUsers && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800">
                    Atenção: Usuários Vinculados
                  </h4>
                  <p className="text-sm text-amber-700 mt-1">
                    Este cargo possui <strong>{cargo.userCount}</strong> usuário(s) vinculado(s). 
                    Ao excluir este cargo, estes usuários perderão suas permissões e precisarão 
                    ser reatribuídos a outros cargos.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Confirmação */}
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">
              Tem certeza que deseja excluir o cargo <strong>"{cargo.nome}"</strong>? 
              Esta ação é irreversível.
            </p>
          </div>
        </div>

        <AdminDialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="w-full sm:w-auto flex items-center justify-center gap-2 min-h-[44px]"
          >
            <X className="h-4 w-4" />
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full sm:w-auto flex items-center justify-center gap-2 min-h-[44px]"
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? 'Excluindo...' : 'Excluir Cargo'}
          </Button>
        </AdminDialogFooter>
      </AdminDialogContent>
    </AdminDialog>
  );
};

export default DeleteCargoModal;