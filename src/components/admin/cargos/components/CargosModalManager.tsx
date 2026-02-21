import CreateCargoModal from '../CreateCargoModal';
import DeleteCargoModal from '../DeleteCargoModal';
import { CargoComDepartamento } from '@/types/database';
import { CargoFormData } from '@/types/forms';

interface CargosModalManagerProps {
  createModalOpen: boolean;
  setCreateModalOpen: (open: boolean) => void;
  editModalOpen: boolean;
  setEditModalOpen: (open: boolean) => void;
  deleteModalOpen: boolean;
  setDeleteModalOpen: (open: boolean) => void;
  selectedCargo: CargoComDepartamento | null;
  onSave: (cargoData: CargoFormData) => Promise<void>;
  onConfirm: (cargoId: number) => Promise<void>;
}

const CargosModalManager = ({
  createModalOpen,
  setCreateModalOpen,
  editModalOpen,
  setEditModalOpen,
  deleteModalOpen,
  setDeleteModalOpen,
  selectedCargo,
  onSave,
  onConfirm
}: CargosModalManagerProps) => {
  return (
    <>
      {/* Create Modal - só renderiza quando aberto */}
      {createModalOpen && (
        <CreateCargoModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          onSave={async (cargoData) => {
            await onSave(cargoData);
            setCreateModalOpen(false);
          }}
        />
      )}

      {/* Edit Modal - só renderiza quando aberto e com cargo selecionado */}
      {editModalOpen && selectedCargo && (
        <CreateCargoModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          cargo={selectedCargo}
          onSave={async (cargoData) => {
            await onSave(cargoData);
            setEditModalOpen(false);
          }}
        />
      )}

      {/* Delete Modal - só renderiza quando aberto */}
      {deleteModalOpen && (
        <DeleteCargoModal
          open={deleteModalOpen}
          onOpenChange={setDeleteModalOpen}
          cargo={selectedCargo}
          onConfirm={async (cargoId) => {
            await onConfirm(cargoId);
            setDeleteModalOpen(false);
          }}
        />
      )}
    </>
  );
};

export default CargosModalManager;