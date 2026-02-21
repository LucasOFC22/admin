import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabaseDepartmentService, Department } from '@/services/supabase/departmentService';

interface DeleteDepartmentDialogProps {
  department: Department | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDepartmentDeleted: () => void;
}

export const DeleteDepartmentDialog = ({ department, open, onOpenChange, onDepartmentDeleted }: DeleteDepartmentDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!department?.id) {
      toast({
        title: "Erro",
        description: "Departamento inválido",
        variant: "destructive"
      });
      return;
    }

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
      toast({
        title: "Erro",
        description: "Erro ao excluir departamento",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Excluir Departamento</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir o departamento "{department?.name}"? Esta ação não pode ser desfeita.
            {department && department.userCount > 0 && (
              <span className="block mt-2 text-amber-600 font-medium">
                ⚠️ Este departamento possui {department.userCount} usuário(s) associado(s).
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? 'Excluindo...' : 'Excluir'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};