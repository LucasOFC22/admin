
import { useForm, UseFormReturn, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ZodSchema } from 'zod';
import { useState } from 'react';
import { useStandardNotifications } from './useStandardNotifications';

interface UseStandardFormOptions<T extends FieldValues> {
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
  defaultValues?: Partial<T>;
}

interface UseStandardFormReturn<T extends FieldValues> {
  form: UseFormReturn<T>;
  isSubmitting: boolean;
  handleSubmit: (onSubmit: (data: T) => Promise<void>) => (e?: React.BaseSyntheticEvent) => Promise<void>;
  reset: () => void;
}

export const useStandardForm = <T extends FieldValues>(
  schema: ZodSchema<T>,
  options: UseStandardFormOptions<T> = {}
): UseStandardFormReturn<T> => {
  const {
    successMessage,
    errorMessage,
    onSuccess,
    onError,
    defaultValues
  } = options;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const notifications = useStandardNotifications();

  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as any
  });

  const handleSubmit = (onSubmit: (data: T) => Promise<void>) => {
    return form.handleSubmit(async (data: T) => {
      try {
        setIsSubmitting(true);
        await onSubmit(data);
        
        if (successMessage) {
          notifications.success('saved', successMessage);
        }
        
        if (onSuccess) {
          onSuccess(data);
        }
      } catch (error: any) {
        console.error('Form submission error:', error);
        
        if (errorMessage) {
          notifications.error('save', errorMessage);
        } else {
          notifications.error('generic');
        }
        
        if (onError) {
          onError(error);
        }
      } finally {
        setIsSubmitting(false);
      }
    });
  };

  const reset = () => {
    form.reset();
    setIsSubmitting(false);
  };

  return {
    form,
    isSubmitting,
    handleSubmit,
    reset
  };
};
