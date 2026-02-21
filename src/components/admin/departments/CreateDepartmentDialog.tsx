import { supabaseDepartmentService, DepartmentFormData } from '@/services/supabase/departmentService';
import { useModalForm } from '@/hooks/useModalForm';
import { useEffect } from 'react';
import { commonValidations } from '@/hooks/useFormValidation';
import { operationToasts } from '@/utils/toastHelpers';
import { FormModal } from '@/components/common/FormModal';
import { FormField } from '@/components/common/FormField';
import { Building2 } from 'lucide-react';

interface CreateDepartmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDepartmentCreated: () => void;
}

const defaultFormData: DepartmentFormData = {
  name: '',
  description: '',
  active: true
};

const validationSchema = {
  name: commonValidations.name
};

export const CreateDepartmentDialog = ({ open, onOpenChange, onDepartmentCreated }: CreateDepartmentDialogProps) => {
  const form = useModalForm(defaultFormData, {
    validationSchema,
    onSuccess: onDepartmentCreated
  });

  // Sync modal state from parent prop
  useEffect(() => {
    form.setOpen(open);
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    await form.handleSubmit(
      e,
      async (data) => {
        const result = await supabaseDepartmentService.createDepartment(data);
        operationToasts.department.create();
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
      onOpenChange={(isOpen) => {
        form.setOpen(isOpen);
        if (!isOpen) {
          form.resetForm();
        }
        onOpenChange(isOpen);
      }}
      title="Criar Novo Departamento"
      description="Preencha as informações para criar um novo departamento no sistema."
      icon={Building2}
      onSubmit={handleSubmit}
      loading={form.loading}
      submitText="Criar Departamento"
      loadingText="Criando..."
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