import { useState } from 'react';
import { Plus, Grid, List } from 'lucide-react';

import PageHeader from '@/components/admin/PageHeader';
import { Button } from '@/components/ui/button';
import { useMensagensRapidas } from '@/hooks/useMensagensRapidas';
import QuickMessagesGrid from '@/components/admin/mensagens-rapidas/QuickMessagesGrid';
import MensagensRapidasTable from '@/components/admin/mensagens-rapidas/MensagensRapidasTable';
import MensagemRapidaModal from '@/components/admin/mensagens-rapidas/MensagemRapidaModal';
import DeleteMensagemDialog from '@/components/admin/mensagens-rapidas/DeleteMensagemDialog';
import { MensagemRapida } from '@/services/mensagensRapidas/mensagensRapidasService';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PermissionGuard from '@/components/admin/permissions/PermissionGuard';

const MensagensRapidas = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMensagem, setSelectedMensagem] = useState<MensagemRapida | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { mensagens, isLoading } = useMensagensRapidas();
  const { hasPermission } = usePermissionGuard();

  const canCreate = hasPermission('admin.mensagens-rapidas.criar');
  const canEdit = hasPermission('admin.mensagens-rapidas.editar');
  const canDelete = hasPermission('admin.mensagens-rapidas.excluir');

  const handleEdit = (mensagem: MensagemRapida) => {
    setSelectedMensagem(mensagem);
    setIsModalOpen(true);
  };

  const handleDelete = (mensagem: MensagemRapida) => {
    setSelectedMensagem(mensagem);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMensagem(null);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedMensagem(null);
  };

  return (
    <>
      <PermissionGuard 
        permissions="admin.mensagens-rapidas.visualizar"
        showMessage={true}
      >
        <div className="flex flex-col h-full">
          <PageHeader
          title="Mensagens Rápidas" 
          subtitle="Gerencie mensagens prontas para agilizar o atendimento"
          icon={Plus}
          breadcrumbs={[
            { label: "Dashboard", href: "/" },
            { label: "Mensagens Rápidas" }
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'grid' | 'list')}>
                <TabsList>
                  <TabsTrigger value="grid">
                    <Grid className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="list">
                    <List className="h-4 w-4" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              {canCreate && (
                <Button onClick={() => setIsModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Mensagem
                </Button>
              )}
            </div>
          }
        />
        
        <div className="flex-1 overflow-auto p-6">
          {viewMode === 'grid' ? (
            <QuickMessagesGrid
              mensagens={mensagens}
              isLoading={isLoading}
              onEdit={canEdit ? handleEdit : undefined}
              onDelete={canDelete ? handleDelete : undefined}
            />
          ) : (
            <MensagensRapidasTable
              mensagens={mensagens}
              isLoading={isLoading}
              onEdit={canEdit ? handleEdit : undefined}
              onDelete={canDelete ? handleDelete : undefined}
            />
          )}
        </div>

        {canCreate && (
          <MensagemRapidaModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            mensagem={selectedMensagem}
          />
        )}

          {canDelete && (
            <DeleteMensagemDialog
              isOpen={isDeleteDialogOpen}
              onClose={handleCloseDeleteDialog}
              mensagem={selectedMensagem}
            />
          )}
        </div>
      </PermissionGuard>
    </>
  );
};

export default MensagensRapidas;
