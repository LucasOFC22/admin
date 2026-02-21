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
import { useMensagensRapidas } from '@/hooks/useMensagensRapidas';
import { MensagemRapida } from '@/services/mensagensRapidas/mensagensRapidasService';

interface DeleteMensagemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mensagem: MensagemRapida | null;
}

const DeleteMensagemDialog = ({ isOpen, onClose, mensagem }: DeleteMensagemDialogProps) => {
  const { deletar, isDeletando } = useMensagensRapidas();

  const handleDelete = () => {
    if (mensagem) {
      deletar(mensagem.id, {
        onSuccess: () => {
          onClose();
        },
      });
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir a mensagem rápida "
            <strong>/{mensagem?.comando}</strong>" ({mensagem?.titulo})?
            <br />
            <br />
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeletando}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeletando}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeletando ? 'Excluindo...' : 'Excluir'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteMensagemDialog;
