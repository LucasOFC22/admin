import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import PageHeader from '@/components/admin/PageHeader';
import { Workflow, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useFlowBuilders } from '@/hooks/useFlowBuilders';
import { useFlowBuilder } from '@/hooks/useFlowBuilder';
import { FlowCard } from '@/components/flowbuilder/FlowCard';
import { CreateFlowModal } from '@/components/flowbuilder/CreateFlowModal';
import { DeleteFlowDialog } from '@/components/flowbuilder/DeleteFlowDialog';
import { ImportFlowButton } from '@/components/flowbuilder/ImportFlowButton';
import { FlowBuilderData } from '@/hooks/useFlowBuilder';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import PermissionGuard from '@/components/admin/permissions/PermissionGuard';

const FlowBuilders = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissionGuard();
  const { flows, loading, fetchFlows, toggleActive, exportFlow } = useFlowBuilders();
  const { createFlow, updateFlow, deleteFlow, duplicateFlow } = useFlowBuilder();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingFlow, setEditingFlow] = useState<FlowBuilderData | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [flowToDelete, setFlowToDelete] = useState<FlowBuilderData | null>(null);

  const canCreate = hasPermission('admin.flowbuilders.criar');
  const canEdit = hasPermission('admin.flowbuilders.editar');
  const canDelete = hasPermission('admin.flowbuilders.excluir');
  const canExecute = hasPermission('admin.flowbuilders.executar');

  const handleCreateFlow = async (data: { name: string; description?: string; active: boolean }) => {
    const newFlow = await createFlow(data.name, data.description);
    if (newFlow) {
      await fetchFlows();
      navigate(`/flowbuilders/${newFlow.id}`);
    }
  };

  const handleUpdateFlow = async (data: { name: string; description?: string; active: boolean }) => {
    if (!editingFlow) return;
    
    const updated = await updateFlow(editingFlow.id, {
      name: data.name,
      description: data.description,
      active: data.active
    });
    
    if (updated) {
      await fetchFlows();
      setEditingFlow(null);
    }
  };

  const handleEdit = (flow: FlowBuilderData) => {
    navigate(`/flowbuilders/${flow.id}`);
  };

  const handleEditInfo = (flow: FlowBuilderData) => {
    setEditingFlow(flow);
    setCreateModalOpen(true);
  };

  const handleDuplicate = async (flowId: string) => {
    const duplicated = await duplicateFlow(flowId);
    if (duplicated) {
      await fetchFlows();
    }
  };

  const handleDelete = (flow: FlowBuilderData) => {
    setFlowToDelete(flow);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!flowToDelete) return;
    
    const success = await deleteFlow(flowToDelete.id);
    if (success) {
      await fetchFlows();
      setFlowToDelete(null);
    }
  };

  const handleImport = async (flowData: any) => {
    const imported = await createFlow(
      `${flowData.name} (Importado)`,
      flowData.description
    );
    
    if (imported) {
      // Atualizar com os dados do fluxo importado
      await updateFlow(imported.id, {
        flow_data: flowData.flow_data,
        active: false
      });
      await fetchFlows();
    }
  };

  return (
    <>
      <PermissionGuard 
        permissions="admin.flowbuilders.visualizar"
        showMessage={true}
      >
        <div>
          <PageHeader
            title="FlowBuilders"
            subtitle="Crie e gerencie fluxos automatizados de conversas"
            icon={Workflow}
            actions={
              canCreate ? (
                <div className="flex gap-2">
                  <ImportFlowButton onImport={handleImport} />
                  <Button onClick={() => {
                    setEditingFlow(null);
                    setCreateModalOpen(true);
                  }} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Novo Fluxo
                  </Button>
                </div>
              ) : null
            }
          />

          <div className="p-6 space-y-6">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-3/4" />
                          <Skeleton className="h-4 w-full" />
                        </div>
                      </div>
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : flows.length === 0 ? (
              <Card className="p-12">
                <div className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Workflow className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Nenhum fluxo criado ainda
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Comece criando seu primeiro fluxo automatizado ou importe um fluxo existente.
                    </p>
                    <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Criar Primeiro Fluxo
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {flows.map((flow) => (
                  <FlowCard
                    key={flow.id}
                    flow={flow}
                    onEdit={canEdit ? handleEdit : undefined}
                    onDuplicate={canCreate ? handleDuplicate : undefined}
                    onExport={exportFlow}
                    onToggleActive={canExecute ? toggleActive : undefined}
                    onDelete={canDelete ? handleDelete : undefined}
                  />
                ))}
              </div>
            )}

            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Workflow className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">Sobre FlowBuilders</h3>
                </div>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>
                    O FlowBuilder permite criar fluxos automatizados de conversas para WhatsApp com recursos avançados:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Mensagens de texto personalizadas</li>
                    <li>Direcionamento para filas específicas</li>
                    <li>Integração com Typebot para bots avançados</li>
                    <li>Randomizadores para distribuição de mensagens</li>
                    <li>Condições lógicas para fluxos dinâmicos</li>
                    <li>Perguntas interativas com captura de respostas</li>
                    <li>Integração com OpenAI para respostas inteligentes</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <CreateFlowModal
          open={createModalOpen}
          onClose={() => {
            setCreateModalOpen(false);
            setEditingFlow(null);
          }}
          onSave={editingFlow ? handleUpdateFlow : handleCreateFlow}
          editingFlow={editingFlow}
        />

        <DeleteFlowDialog
          open={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setFlowToDelete(null);
          }}
          onConfirm={confirmDelete}
          flowName={flowToDelete?.name || ''}
        />
      </PermissionGuard>
    </>
  );
};

export default FlowBuilders;
