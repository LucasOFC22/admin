import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Workflow, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useFlowBuilder } from '@/hooks/useFlowBuilder';
import { FlowBuilderGroupEditor } from '@/components/flowbuilder/FlowBuilderGroupEditor';
import { FlowVariablesSidebar } from '@/components/flowbuilder/FlowVariablesSidebar';
import { useToast } from '@/hooks/use-toast';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import PermissionGuard from '@/components/admin/permissions/PermissionGuard';

const FlowBuilderEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermissionGuard();
  const { flow, loading, saveFlowData } = useFlowBuilder(id);
  const [variablesModalOpen, setVariablesModalOpen] = useState(false);

  const canEdit = hasPermission('admin.flowbuilders.editar');

  useEffect(() => {
    if (!id) {
      navigate('/flowbuilders');
    }
  }, [id, navigate]);

  const handleSave = async (nodes: any[], edges: any[], groups?: any[]) => {
    if (!id || !canEdit) return;
    await saveFlowData(id, { nodes, edges, groups });
  };

  const handleAutoSave = async (nodes: any[], edges: any[], groups?: any[]) => {
    if (!id || !canEdit) return;
    await saveFlowData(id, { nodes, edges, groups });
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="space-y-4 w-full max-w-md p-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  if (!flow) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Card className="p-12 max-w-md">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <Workflow className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Fluxo não encontrado
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                O fluxo que você está tentando acessar não existe ou foi removido.
              </p>
              <Button onClick={() => navigate('/flowbuilders')}>
                Voltar para Fluxos
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <PermissionGuard 
      permissions="admin.flowbuilders.visualizar"
      showMessage={true}
    >
      <div className="relative w-full h-[calc(100vh-4rem)] overflow-hidden">
        {!canEdit && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
            <Badge variant="outline" className="gap-1 bg-background/90 backdrop-blur-sm">
              <Eye className="h-3 w-3" />
              Modo Somente Leitura
            </Badge>
          </div>
        )}
        <FlowBuilderGroupEditor
          initialNodes={flow.flow_data?.nodes || []}
          initialEdges={flow.flow_data?.edges || []}
          initialGroups={flow.flow_data?.groups}
          flowId={id}
          onSave={canEdit ? handleSave : undefined}
          onAutoSave={canEdit ? handleAutoSave : undefined}
          onOpenVariables={() => setVariablesModalOpen(true)}
          onBack={() => navigate('/flowbuilders')}
        />

        {id && (
          <FlowVariablesSidebar
            open={variablesModalOpen}
            onClose={() => setVariablesModalOpen(false)}
            flowId={id}
          />
        )}
      </div>
    </PermissionGuard>
  );
};

export default FlowBuilderEdit;
