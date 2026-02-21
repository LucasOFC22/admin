import { useEffect } from 'react';
import { supabaseDepartmentService, Department, DepartmentFormData } from '@/services/supabase/departmentService';
import { useModalForm } from '@/hooks/useModalForm';
import { commonValidations } from '@/hooks/useFormValidation';
import { operationToasts } from '@/utils/toastHelpers';
import { FormModal } from '@/components/common/FormModal';
import { FormField } from '@/components/common/FormField';

interface EditDepartmentDialogProps {
  department: Department | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDepartmentUpdated: () => void;
}

const defaultFormData: DepartmentFormData = {
  name: '',
  description: '',
  active: true
};

const validationSchema = {
  name: commonValidations.name
};

export const EditDepartmentDialog = ({ department, open, onOpenChange, onDepartmentUpdated }: EditDepartmentDialogProps) => {
  const form = useModalForm(defaultFormData, {
    validationSchema,
    onSuccess: onDepartmentUpdated
  });

  // Update form data when department changes
  useEffect(() => {
    if (department) {
      form.setFormData({
        name: department.name,
        description: department.description || '',
        active: department.active
      });
    }
  }, [department]);

  // Sync modal state
  if (form.open !== open) {
    form.setOpen(open);
  }
  if (form.open !== open) {
    onOpenChange(form.open);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    if (!department?.id) {
      return;
    }

    await form.handleSubmit(
      e,
      async (data) => {
        const result = await supabaseDepartmentService.updateDepartment(department.id, data);
        operationToasts.department.update();
        return result;
      },
      undefined,
      (data) => {
        if (!data.name.trim()) {
          return "Nome do departamento é obrigatório";
        }
        return null;
      }
    );
  };

  return (
    <FormModal
      open={form.open}
      onOpenChange={form.handleClose}
      title="Editar Departamento"
      description={`Atualize as informações do departamento "${department?.name}".`}
      onSubmit={handleSubmit}
      loading={form.loading}
      submitText="Salvar Alterações"
      loadingText="Salvando..."
      size="lg"
    >
      <FormField
        type="input"
        name="name"
        label="Nome do Departamento"
        value={form.formData.name}
        onChange={(value) => form.updateField('name', value)}
        placeholder="Digite o nome do departamento"
        required
        error={form.errors.name}
      />

      <FormField
        type="textarea"
        name="description"
        label="Descrição"
        value={form.formData.description}
        onChange={(value) => form.updateField('description', value)}
        placeholder="Descreva a função e responsabilidades do departamento (opcional)"
        error={form.errors.description}
      />

      <FormField
        type="switch"
        name="active"
        label="Status do Departamento"
        checked={form.formData.active}
        onChange={(checked) => form.updateField('active', checked)}
        activeText="Departamento ficará ativo e visível no sistema"
        inactiveText="Departamento ficará inativo e oculto no sistema"
      />
    </FormModal>
  );
};