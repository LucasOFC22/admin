import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User } from "@/types/common";

interface ViewPermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null | undefined;
}

const ViewPermissionsDialog: React.FC<ViewPermissionsDialogProps> = ({ open, onOpenChange, user }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden">
        <DialogHeader className="pb-4">
          <DialogTitle>Permissões do Usuário</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[300px] w-full pr-6">
          <div className="grid gap-4">
            <div>
              <h4 className="font-medium leading-none">Informações do Usuário</h4>
              <p className="text-sm text-muted-foreground">
                Detalhes básicos sobre o usuário.
              </p>
              <div className="pl-2 pt-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Nome:</p>
                  <p className="text-sm text-muted-foreground">{user?.nome || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Email:</p>
                  <p className="text-sm text-muted-foreground">{user?.email || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Tipo:</p>
                  <p className="text-sm text-muted-foreground">{user?.tipo || 'N/A'}</p>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium leading-none">Acesso</h4>
              <p className="text-sm text-muted-foreground">
                Permissões detalhadas do usuário.
              </p>
              <div className="pl-2 pt-2">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">Admin</Badge>
                    <span>{user?.hasAdminAccess ? 'Sim' : 'Não'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">Cliente</Badge>
                    <span>{user?.hasClientAccess ? 'Sim' : 'Não'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">Ativo</Badge>
                    <span>{user?.ativo ? 'Sim' : 'Não'}</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium leading-none">Configurações</h4>
              <p className="text-sm text-muted-foreground">
                Outras configurações do usuário.
              </p>
              <div className="pl-2 pt-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Telefone:</p>
                  <p className="text-sm text-muted-foreground">{user?.telefone || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Empresa:</p>
                  <p className="text-sm text-muted-foreground">{user?.empresa || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ViewPermissionsDialog;
