import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BriefcaseIcon as Briefcase, 
  Plus, 
  Edit, 
  Trash2, 
  Shield,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSupabaseCargos } from '@/hooks/useSupabaseCargos';
import CreateCargoModal from '@/components/admin/cargos/CreateCargoModal';
import DeleteCargoModal from '@/components/admin/cargos/DeleteCargoModal';
import { CargoComDepartamento } from '@/types/database';

const CargosConfigTab = () => {
  const { 
    cargos, 
    isLoading, 
    error, 
    getStats, 
    refetch, 
    createCargo, 
    updateCargo, 
    deleteCargo 
  } = useSupabaseCargos();
  const stats = getStats();
  
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCargo, setSelectedCargo] = useState<CargoComDepartamento | null>(null);

  const handleCreate = () => {
    setCreateModalOpen(true);
  };

  const handleEdit = (cargo: CargoComDepartamento) => {
    setSelectedCargo(cargo);
    setEditModalOpen(true);
  };

  const handleDelete = (cargo: CargoComDepartamento) => {
    setSelectedCargo(cargo);
    setDeleteModalOpen(true);
  };

  const handleSave = async (cargoData: any) => {
    // Hook useSupabaseCargos já exibe notificações
    if (selectedCargo) {
      await updateCargo(selectedCargo.id, cargoData);
    } else {
      await createCargo(cargoData);
    }
    refetch();
  };

  const handleConfirmDelete = async (cargoId: number) => {
    // Hook useSupabaseCargos já exibe notificações
    await deleteCargo(cargoId);
    refetch();
  };

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>{error}</p>
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
        <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary/15 ring-1 ring-primary/30 flex items-center justify-center">
                <Briefcase className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Gestão de Cargos
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Configure os cargos da organização e suas permissões
                </CardDescription>
              </div>
            </div>
            <Button onClick={handleCreate} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Novo Cargo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-blue-500">Total de Cargos</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.ativos}</div>
              <div className="text-sm text-green-500">Cargos Ativos</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{stats.admin}</div>
              <div className="text-sm text-purple-500">Cargos Admin</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{stats.custom}</div>
              <div className="text-sm text-orange-500">Cargos Customizados</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Cargos */}
      <Card>
        <CardHeader>
          <CardTitle>Cargos Cadastrados</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <div className="p-6 space-y-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Carregando cargos...</p>
                </div>
              ) : cargos.length === 0 ? (
                <div className="text-center py-8">
                  <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum cargo encontrado</p>
                  <Button onClick={handleCreate} className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Cargo
                  </Button>
                </div>
              ) : (
                <AnimatePresence>
                  {cargos.map((cargo, index) => {
                    const isAdmin = cargo.nome === 'Administrador';
                    return (
                      <motion.div
                        key={cargo.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div className={`p-2 rounded-lg ${isAdmin ? 'bg-purple-100' : 'bg-blue-100'}`}>
                              {isAdmin ? (
                                <Shield className="h-5 w-5 text-purple-600" />
                              ) : (
                                <Briefcase className="h-5 w-5 text-blue-600" />
                              )}
                            </div>
                            
                            <div className="space-y-3 flex-1">
                              <div className="flex items-center gap-3">
                                <h3 className="font-semibold text-lg">{cargo.nome}</h3>
                                <Badge variant={cargo.ativo !== false ? 'default' : 'secondary'}>
                                  {cargo.ativo !== false ? 'Ativo' : 'Inativo'}
                                </Badge>
                                {isAdmin && (
                                  <Badge variant="outline" className="bg-purple-100 text-purple-800">
                                    Sistema
                                  </Badge>
                                )}
                                {cargo.level && (
                                  <Badge variant="outline">
                                    Nível {cargo.level}
                                  </Badge>
                                )}
                              </div>
                              
                              {cargo.descricao && (
                                <p className="text-gray-600 text-sm">{cargo.descricao}</p>
                              )}

                              
                              {/* Permissões */}
                              <div className="space-y-2">
                                <span className="text-sm font-medium text-muted-foreground">
                                  Permissões ({cargo.permissoes?.length || 0})
                                </span>
                                {cargo.permissoes && cargo.permissoes.length > 0 ? (
                                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                                    {cargo.permissoes.map((permission, idx) => (
                                      <div 
                                        key={idx} 
                                        className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg"
                                      >
                                        <CheckCircle2 className="h-3 w-3 text-blue-600 flex-shrink-0" />
                                        <span className="text-xs text-blue-900 truncate">{permission}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-xs text-muted-foreground italic">
                                    Nenhuma permissão atribuída
                                  </div>
                                )}
                              </div>
                              
                              {cargo.created_at && (
                                <div className="text-xs text-gray-500">
                                  Criado em: {new Date(cargo.created_at).toLocaleDateString('pt-BR')}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(cargo)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {!isAdmin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(cargo)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Modais */}
      <CreateCargoModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSave={handleSave}
      />

      <CreateCargoModal
        open={editModalOpen}
        onOpenChange={(open) => {
          setEditModalOpen(open);
          if (!open) setSelectedCargo(null);
        }}
        cargo={selectedCargo}
        onSave={handleSave}
      />

      <DeleteCargoModal
        open={deleteModalOpen}
        onOpenChange={(open) => {
          setDeleteModalOpen(open);
          if (!open) setSelectedCargo(null);
        }}
        cargo={selectedCargo}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default CargosConfigTab;