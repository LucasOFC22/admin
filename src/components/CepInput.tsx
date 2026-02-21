import { forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CepInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  isLoading?: boolean;
  isSuccess?: boolean;
  isError?: boolean;
  errorMessage?: string;
}

/**
 * Componente de input para CEP com máscara e feedback visual
 */
export const CepInput = forwardRef<HTMLInputElement, CepInputProps>(
  ({ className, isLoading, isSuccess, isError, errorMessage, onChange, ...props }, ref) => {
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value.replace(/\D/g, '');
      
      // Aplica máscara 00000-000
      if (value.length > 5) {
        value = `${value.slice(0, 5)}-${value.slice(5, 8)}`;
      }
      
      // Limita a 9 caracteres (00000-000)
      value = value.slice(0, 9);
      
      // Cria novo evento com valor formatado
      const newEvent = {
        ...e,
        target: {
          ...e.target,
          value,
        },
      };
      
      onChange?.(newEvent as React.ChangeEvent<HTMLInputElement>);
    };

    return (
      <div className="relative">
        <Input
          ref={ref}
          type="text"
          inputMode="numeric"
          placeholder="00000-000"
          maxLength={9}
          className={cn(
            'pr-10',
            isError && 'border-destructive focus-visible:ring-destructive',
            isSuccess && 'border-green-500 focus-visible:ring-green-500',
            className
          )}
          onChange={handleChange}
          {...props}
        />
        
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {isSuccess && !isLoading && (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
          {isError && !isLoading && (
            <XCircle className="h-4 w-4 text-destructive" />
          )}
        </div>
        
        {isError && errorMessage && (
          <p className="mt-1 text-xs text-destructive">{errorMessage}</p>
        )}
      </div>
    );
  }
);

CepInput.displayName = 'CepInput';
