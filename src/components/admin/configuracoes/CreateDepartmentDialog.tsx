import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { AdminDialog, AdminDialogContent, AdminDialogHeader, AdminDialogTitle, AdminDialogDescription } from '@/components/admin/ui/AdminDialog';
import { supabaseDepartmentService, DepartmentFormData } from '@/services/supabase/departmentService';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Building2, Plus } from 'lucide-react';

interface CreateDepartmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDepartmentCreated: () => void;
}

export const CreateDepartmentDialog = ({ 
  open, 
  onOpenChange, 
  onDepartmentCreated 
}: CreateDepartmentDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<DepartmentFormData>({
    name: '',
    description: '',
    active: true
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Nome do departamento é obrigatório"
      });
      return;
    }

    try {
      setLoading(true);
      
      await supabaseDepartmentService.createDepartment(formData);
      
      toast({
        title: "Sucesso",
        description: "Departamento criado com sucesso!"
      });
      
      handleReset();
      onOpenChange(false);
      onDepartmentCreated();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao criar departamento"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      description: '',
      active: true
    });
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  return (
    <AdminDialog open={open} onOpenChange={handleClose}>
      <AdminDialogContent className="sm:max-w-lg max-h-[90vh]">
        <AdminDialogHeader>
          <AdminDialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-blue-600" />
            Novo Departamento
          </AdminDialogTitle>
          <AdminDialogDescription>
            Crie um novo departamento
          </AdminDialogDescription>
        </AdminDialogHeader>
        
        <ScrollArea className="max-h-[70vh] pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações básicas */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Departamento *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Digite o nome do departamento"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Digite uma descrição para o departamento"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="active">Status do Departamento</Label>
                  <p className="text-sm text-muted-foreground">
                    {formData.active ? 'Departamento ativo' : 'Departamento inativo'}
                  </p>
                </div>
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                />
              </div>
            </div>

            {/* Preview dos dados */}
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <h4 className="font-medium text-sm">Preview:</h4>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>Nome: {formData.name || 'Não informado'}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                <span>Descrição: {formData.description || 'Sem descrição'}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                <span>Status: {formData.active ? 'Ativo' : 'Inativo'}</span>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleReset}
                disabled={loading}
              >
                Limpar
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Criando...' : 'Criar Departamento'}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </AdminDialogContent>
    </AdminDialog>
  );
};