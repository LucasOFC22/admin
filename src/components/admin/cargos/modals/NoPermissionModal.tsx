import {
  AdminDialog,
  AdminDialogContent,
  AdminDialogHeader,
  AdminDialogTitle,
  AdminDialogDescription,
} from '@/components/admin/ui/AdminDialog';
import { Button } from '@/components/ui/button';
import { ShieldAlert, X } from 'lucide-react';

interface NoPermissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action?: string;
}

const NoPermissionModal = ({ open, onOpenChange, action = 'realizar esta ação' }: NoPermissionModalProps) => {
  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent className="sm:max-w-md">
        <AdminDialogHeader>
          <div className="flex items-center justify-between">
            <AdminDialogTitle className="flex items-center gap-2 text-orange-600">
              <ShieldAlert className="h-5 w-5" />
              Sem Permissão
            </AdminDialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <AdminDialogDescription>
            Você não possui permissão suficiente
          </AdminDialogDescription>
        </AdminDialogHeader>

        <div className="space-y-6 py-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex gap-3">
              <ShieldAlert className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-orange-900">
                  Acesso Restrito
                </p>
                <p className="text-sm text-orange-700">
                  Você não tem permissão para {action}. Entre em contato com o administrador do sistema para solicitar acesso.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => onOpenChange(false)} variant="default">
              Entendi
            </Button>
          </div>
        </div>
      </AdminDialogContent>
    </AdminDialog>
  );
};

export default NoPermissionModal;
