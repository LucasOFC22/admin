import { useState, useCallback } from 'react';

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  email?: boolean;
  custom?: (value: any) => string | null;
}

interface ValidationSchema {
  [key: string]: ValidationRule;
}

interface ValidationErrors {
  [key: string]: string;
}

export const useFormValidation = (schema: ValidationSchema) => {
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateField = useCallback((name: string, value: any): string | null => {
    const rule = schema[name];
    if (!rule) return null;

    // Required validation
    if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
      return `${name} é obrigatório`;
    }

    // Skip other validations if value is empty and not required
    if (!value || (typeof value === 'string' && !value.trim())) {
      return null;
    }

    // String validations
    if (typeof value === 'string') {
      const trimmedValue = value.trim();
      
      // Min length
      if (rule.minLength && trimmedValue.length < rule.minLength) {
        return `${name} deve ter pelo menos ${rule.minLength} caracteres`;
      }

      // Max length
      if (rule.maxLength && trimmedValue.length > rule.maxLength) {
        return `${name} deve ter no máximo ${rule.maxLength} caracteres`;
      }

      // Email validation
      if (rule.email && trimmedValue) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedValue)) {
          return `${name} deve ser um email válido`;
        }
      }
    }

    // Custom validation
    if (rule.custom) {
      return rule.custom(value);
    }

    return null;
  }, [schema]);

  const validateForm = useCallback((formData: any): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    Object.keys(schema).forEach(fieldName => {
      const error = validateField(fieldName, formData[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [schema, validateField]);

  const validateSingleField = useCallback((name: string, value: any) => {
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error || ''
    }));
    return !error;
  }, [validateField]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = useCallback((name: string) => {
    setErrors(prev => ({
      ...prev,
      [name]: ''
    }));
  }, []);

  const hasErrors = Object.values(errors).some(error => error);

  return {
    errors,
    validateForm,
    validateSingleField,
    clearErrors,
    clearFieldError,
    hasErrors
  };
};

// Common validation schemas
export const commonValidations = {
  required: { required: true },
  email: { required: true, email: true },
  optionalEmail: { email: true },
  name: { required: true, minLength: 2, maxLength: 100 },
  description: { maxLength: 500 },
  phone: { 
    custom: (value: string) => {
      if (!value) return null;
      const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
      return phoneRegex.test(value) ? null : 'Telefone deve estar no formato (XX) XXXXX-XXXX';
    }
  }
};