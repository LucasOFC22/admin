import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusOcorrencia, STATUS_OCORRENCIA_LABELS } from '@/types/ocorrencias';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useState } from 'react';

interface OcorrenciaStatusSelectProps {
  currentStatus: StatusOcorrencia;
  onStatusChange: (newStatus: StatusOcorrencia) => void;
  disabled?: boolean;
}

const OcorrenciaStatusSelect = ({ currentStatus, onStatusChange, disabled }: OcorrenciaStatusSelectProps) => {
  const [pendingStatus, setPendingStatus] = useState<StatusOcorrencia | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleStatusSelect = (value: StatusOcorrencia) => {
    setPendingStatus(value);
    setShowConfirmDialog(true);
  };

  const handleConfirm = () => {
    if (pendingStatus) {
      onStatusChange(pendingStatus);
    }
    setShowConfirmDialog(false);
    setPendingStatus(null);
  };

  const handleCancel = () => {
    setShowConfirmDialog(false);
    setPendingStatus(null);
  };

  return (
    <>
      <Select 
        value={currentStatus} 
        onValueChange={handleStatusSelect}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(STATUS_OCORRENCIA_LABELS).map(([key, label]) => (
            <SelectItem key={key} value={key}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Alteração de Status</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a alterar o status de "{STATUS_OCORRENCIA_LABELS[currentStatus]}" 
              para "{pendingStatus && STATUS_OCORRENCIA_LABELS[pendingStatus]}".
              Esta ação será registrada no histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default OcorrenciaStatusSelect;
