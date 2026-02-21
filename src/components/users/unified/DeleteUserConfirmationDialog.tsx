import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { UsuarioComCargo } from '@/hooks/useUnifiedUsers';
import { AlertTriangle, User, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DeleteUserConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: UsuarioComCargo | null;
  onConfirm: (userId: number) => Promise<void>;
}

const DeleteUserConfirmationDialog = ({
  isOpen,
  onClose,
  user,
  onConfirm
}: DeleteUserConfirmationDialogProps) => {
  if (!user) return null;

  const handleConfirm = async () => {
    await onConfirm(user.id);
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <AlertDialogContent className="sm:max-w-[500px]">
        <AlertDialogHeader className="space-y-4">
          <div className="flex items-start gap-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="p-3 rounded-full bg-amber-500/10"
            >
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            </motion.div>
            <div className="flex-1 space-y-2">
              <AlertDialogTitle className="text-xl">Desativar Usuário</AlertDialogTitle>
              <AlertDialogDescription className="text-base">
                O usuário será desativado e perderá todos os acessos ao sistema.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <p className="text-sm text-muted-foreground">
            Você está prestes a desativar o seguinte usuário:
          </p>

          <div className="border rounded-lg p-4 bg-gradient-to-br from-muted/50 to-muted/20 space-y-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold text-foreground">{user.nome}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{user.email}</span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3"
          >
            <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
              ⚠️ O usuário será desativado e terá removido: cargo, filas, tags e acesso ao painel admin/cliente. O histórico de logs será preservado.
            </p>
          </motion.div>
        </motion.div>

        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-amber-500 text-white hover:bg-amber-600"
          >
            Desativar Usuário
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteUserConfirmationDialog;
