import { useState, useEffect, useCallback } from 'react';
import { useImprovedAsyncOperation } from './useImprovedAsyncOperation';
import { useFormValidation } from './useFormValidation';

interface UseModalFormOptions<T> {
  initialData?: T;
  validationSchema?: any;
  onSuccess?: () => void;
  resetOnClose?: boolean;
}

export const useModalForm = <T extends Record<string, any>>(
  defaultFormData: T,
  options: UseModalFormOptions<T> = {}
) => {
  const {
    initialData,
    validationSchema,
    onSuccess,
    resetOnClose = true
  } = options;

  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<T>(initialData || defaultFormData);

  // Form validation
  const validation = validationSchema 
    ? useFormValidation(validationSchema) 
    : null;

  // Async operations
  const asyncOp = useImprovedAsyncOperation({
    onSuccess: () => {
      if (resetOnClose) {
        setOpen(false);
        resetForm();
      }
      onSuccess?.();
    }
  });

  // Update form data when initial data changes
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  // Reset form to default state
  const resetForm = useCallback(() => {
    setFormData(initialData || defaultFormData);
    validation?.clearErrors();
  }, [defaultFormData, initialData, validation]);

  // Handle modal close
  const handleClose = useCallback(() => {
    setOpen(false);
    if (resetOnClose) {
      resetForm();
    }
  }, [resetOnClose, resetForm]);

  // Handle form field changes
  const updateField = useCallback((name: keyof T, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field error on change
    if (validation) {
      validation.clearFieldError(name as string);
    }
  }, [validation]);

  // Handle form submission
  const handleSubmit = useCallback(async (
    e: React.FormEvent,
    operation: (data: T) => Promise<any>,
    successMessage?: string,
    customValidation?: (data: T) => string | null
  ) => {
    e.preventDefault();

    // Custom validation first
    if (customValidation) {
      const customError = customValidation(formData);
      if (customError) {
        validation?.clearErrors();
        // Show custom error via toast
        asyncOp.execute(
          () => Promise.reject(new Error(customError)),
          { errorMessage: customError }
        );
        return;
      }
    }

    // Schema validation
    if (validation && !validation.validateForm(formData)) {
      return;
    }

    // Execute the operation
    await asyncOp.execute(
      () => operation(formData),
      { successMessage }
    );
  }, [formData, validation, asyncOp]);

  return {
    // Modal state
    open,
    setOpen,
    handleClose,

    // Form state  
    formData,
    setFormData,
    updateField,
    resetForm,

    // Form submission
    handleSubmit,
    loading: asyncOp.loading,

    // Validation
    errors: validation?.errors || {},
    hasErrors: validation?.hasErrors || false,
    validateForm: validation?.validateForm,

    // Utilities
    execute: asyncOp.execute
  };
};