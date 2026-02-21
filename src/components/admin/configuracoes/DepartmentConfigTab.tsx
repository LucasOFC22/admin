import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  Users,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabaseDepartmentService, Department, DepartmentFormData } from '@/services/supabase/departmentService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreateDepartmentDialog } from '@/components/admin/departments/CreateDepartmentDialog';
import { EditDepartmentDialog } from '@/components/admin/departments/EditDepartmentDialog';
import { DeleteDepartmentDialog } from '@/components/admin/departments/DeleteDepartmentDialog';

const DepartmentConfigTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null);

  // Query para buscar departamentos
  const { data: departments = [], isLoading, error, refetch } = useQuery({
    queryKey: ['departments'],
    queryFn: () => supabaseDepartmentService.getDepartments(),
  });

  // Mutation para toggle status
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      supabaseDepartmentService.toggleDepartmentStatus(id, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast({
        title: "Sucesso",
        description: "Status do departamento alterado com sucesso!"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao alterar status do departamento",
        variant: "destructive"
      });
    }
  });

  const handleToggleStatus = (department: Department) => {
    toggleStatusMutation.mutate({
      id: department.id,
      active: !department.active
    });
  };

  const handleDelete = (department: Department) => {
    setDepartmentToDelete(department);
    setIsDeleteDialogOpen(true);
  };

  const handleDepartmentDeleted = () => {
    queryClient.invalidateQueries({ queryKey: ['departments'] });
    setDepartmentToDelete(null);
  };

  const handleEdit = (department: Department) => {
    setSelectedDepartment(department);
    setIsEditDialogOpen(true);
  };

  const handleDepartmentUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ['departments'] });
    setSelectedDepartment(null);
  };

  const stats = {
    total: departments.length,
    active: departments.filter(d => d.active).length,
    inactive: departments.filter(d => !d.active).length,
    totalUsers: departments.reduce((acc, d) => acc + d.userCount, 0)
  };


  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>Erro ao carregar departamentos</p>
              <Button onClick={() => refetch()} className="mt-4">
                Tentar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Gestão de Departamentos
              </CardTitle>
              <CardDescription>
                Configure os departamentos da organização
              </CardDescription>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Novo Departamento
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-blue-500">Total de Departamentos</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <div className="text-sm text-green-500">Departamentos Ativos</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
              <div className="text-sm text-red-500">Departamentos Inativos</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{stats.totalUsers}</div>
              <div className="text-sm text-purple-500">Total de Usuários</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Departamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Departamentos Cadastrados</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <div className="p-6 space-y-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Carregando departamentos...</p>
                </div>
              ) : departments.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum departamento encontrado</p>
                  <Button onClick={() => setIsCreateDialogOpen(true)} className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Departamento
                  </Button>
                </div>
              ) : (
                <AnimatePresence>
                  {departments.map((department, index) => (
                    <motion.div
                      key={department.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className={`p-2 rounded-lg ${department.active ? 'bg-blue-100' : 'bg-gray-100'}`}>
                            <Building2 className={`h-5 w-5 ${department.active ? 'text-blue-600' : 'text-gray-600'}`} />
                          </div>
                          
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-lg">{department.name}</h3>
                              <Badge variant={department.active ? 'default' : 'secondary'}>
                                {department.active ? 'Ativo' : 'Inativo'}
                              </Badge>
                              {department.userCount > 0 && (
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {department.userCount} usuários
                                </Badge>
                              )}
                            </div>
                            
                            {department.description && (
                              <p className="text-gray-600 text-sm">{department.description}</p>
                            )}
                            
                            {department.createdAt && (
                              <div className="text-xs text-gray-500">
                                Criado em: {new Date(department.createdAt).toLocaleDateString('pt-BR')}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(department)}
                          >
                            {department.active ? (
                              <ToggleRight className="h-4 w-4 text-green-600" />
                            ) : (
                              <ToggleLeft className="h-4 w-4 text-gray-600" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(department)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(department)}
                            className="text-red-600 hover:text-red-700"
                            
                            disabled={toggleStatusMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Modais */}
      <CreateDepartmentDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onDepartmentCreated={() => queryClient.invalidateQueries({ queryKey: ['departments'] })}
      />

      <EditDepartmentDialog
        department={selectedDepartment}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onDepartmentUpdated={handleDepartmentUpdated}
      />

      <DeleteDepartmentDialog
        department={departmentToDelete}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onDepartmentDeleted={handleDepartmentDeleted}
      />
    </div>
  );
};

export default DepartmentConfigTab;