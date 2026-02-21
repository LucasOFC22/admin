import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Workflow,
  Edit,
  Copy,
  Download,
  Power,
  Trash2,
  MoreVertical
} from 'lucide-react';
import { FlowBuilderData } from '@/hooks/useFlowBuilder';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FlowCardProps {
  flow: FlowBuilderData;
  onEdit?: (flow: FlowBuilderData) => void;
  onDuplicate?: (flowId: string) => void;
  onExport?: (flow: FlowBuilderData) => void;
  onToggleActive?: (flowId: string, active: boolean) => void;
  onDelete?: (flow: FlowBuilderData) => void;
}

export const FlowCard: React.FC<FlowCardProps> = ({
  flow,
  onEdit,
  onDuplicate,
  onExport,
  onToggleActive,
  onDelete
}) => {
  const nodeCount = flow.flow_data?.nodes?.length || 0;
  const formattedDate = format(new Date(flow.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 rounded-lg bg-primary/10">
              <Workflow className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground truncate">
                  {flow.name}
                </h3>
                <Badge variant={flow.active ? "default" : "secondary"}>
                  {flow.active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              {flow.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {flow.description}
                </p>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(flow)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
              )}
              {onDuplicate && (
                <DropdownMenuItem onClick={() => onDuplicate(flow.id)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicar
                </DropdownMenuItem>
              )}
              {onExport && (
                <DropdownMenuItem onClick={() => onExport(flow)}>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </DropdownMenuItem>
              )}
              {onToggleActive && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onToggleActive(flow.id, !flow.active)}>
                    <Power className="mr-2 h-4 w-4" />
                    {flow.active ? 'Desativar' : 'Ativar'}
                  </DropdownMenuItem>
                </>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDelete(flow)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center justify-between pt-4 border-t text-xs text-muted-foreground">
          <div>
            {nodeCount} {nodeCount === 1 ? 'node' : 'nodes'}
          </div>
          <div>
            Atualizado em {formattedDate}
          </div>
        </div>
      </div>
    </Card>
  );
};
