
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabaseDepartmentService, Department } from '@/services/supabase/departmentService';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteDepartmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: Department | null;
  onDepartmentDeleted: () => void;
}

export const DeleteDepartmentDialog = ({ 
  open, 
  onOpenChange, 
  department,
  onDepartmentDeleted 
}: DeleteDepartmentDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!department) return;

    try {
      setLoading(true);
      
      await supabaseDepartmentService.deleteDepartment(department.id);
      
      toast({
        title: "Sucesso",
        description: "Departamento excluído com sucesso!"
      });
      
      onOpenChange(false);
      onDepartmentDeleted();
    } catch (error) {
      console.error('Error deleting department:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao excluir departamento"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!department) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md z-[10000]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-destructive tracking-wide">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <span className="font-semibold text-lg" style={{ letterSpacing: '0.5px' }}>Confirmar Exclusão</span>
          </DialogTitle>
          <DialogDescription className="text-left">
            Esta ação não pode ser desfeita. O departamento será excluído permanentemente do sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações do departamento */}
          <div className="p-4 bg-muted/50 rounded-lg border-l-4 border-l-destructive">
            <div className="space-y-2">
              <p className="font-medium text-sm">Departamento a ser excluído:</p>
              <p className="font-semibold">{department.name}</p>
              {department.description && (
                <p className="text-sm text-muted-foreground">{department.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Status: {department.active ? 'Ativo' : 'Inativo'}</span>
                <span>Usuários: {department.userCount}</span>
              </div>
            </div>
          </div>

          {/* Aviso sobre usuários */}
          {department.userCount > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800">Atenção:</p>
                  <p className="text-amber-700">
                    Este departamento possui {department.userCount} usuário(s) associado(s). 
                    Verifique se é seguro prosseguir com a exclusão.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Botões de ação */}
          <div className="flex justify-end gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
              className="min-w-[120px]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Excluindo...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </span>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
