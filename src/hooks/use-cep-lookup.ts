import { useEffect, useRef, useCallback, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { fetchAddressByCep, cleanCep, isValidCep } from '@/lib/cep-utils';

interface UseCepLookupOptions {
  debounceMs?: number;
}

interface UseCepLookupReturn {
  isLoading: boolean;
  error: string | null;
  lastFetchedCep: string | null;
}

/**
 * Hook que observa mudanças no campo CEP e preenche automaticamente
 * os campos de endereço quando um CEP válido é detectado.
 * 
 * Funciona tanto para preenchimento manual quanto por IA.
 * 
 * @param form - Instância do react-hook-form
 * @param fieldPath - Caminho base do campo (ex: 'coleta', 'remetente', 'destinatario')
 * @param options - Opções de configuração
 */
export function useCepLookup(
  form: UseFormReturn<any>,
  fieldPath: string,
  options: UseCepLookupOptions = {}
): UseCepLookupReturn {
  const { debounceMs = 500 } = options;
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedCep, setLastFetchedCep] = useState<string | null>(null);
  
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastCepRef = useRef<string>('');

  const cepFieldPath = `${fieldPath}.cep`;
  const ruaFieldPath = `${fieldPath}.rua`;
  const bairroFieldPath = `${fieldPath}.bairro`;
  const cidadeFieldPath = `${fieldPath}.cidade`;
  const estadoFieldPath = `${fieldPath}.estado`;

  const fetchAndFillAddress = useCallback(async (cep: string) => {
    const cleanedCep = cleanCep(cep);
    
    // Evita buscar o mesmo CEP novamente
    if (cleanedCep === lastCepRef.current) {
      return;
    }

    if (!isValidCep(cleanedCep)) {
      return;
    }

    lastCepRef.current = cleanedCep;
    setIsLoading(true);
    setError(null);

    try {
      const address = await fetchAddressByCep(cleanedCep);
      
      if (address) {
        // Preenche os campos automaticamente
        form.setValue(ruaFieldPath, address.rua, { shouldValidate: true });
        form.setValue(bairroFieldPath, address.bairro, { shouldValidate: true });
        form.setValue(cidadeFieldPath, address.cidade, { shouldValidate: true });
        form.setValue(estadoFieldPath, address.estado, { shouldValidate: true });
        
        setLastFetchedCep(cleanedCep);
        setError(null);
      } else {
        setError('CEP não encontrado');
      }
    } catch (err) {
      setError('Erro ao buscar CEP');
    } finally {
      setIsLoading(false);
    }
  }, [form, ruaFieldPath, bairroFieldPath, cidadeFieldPath, estadoFieldPath]);

  // Observa mudanças no campo CEP
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      // Verifica se o campo alterado é o CEP que estamos observando
      if (name === cepFieldPath || name?.startsWith(fieldPath)) {
        const cepValue = form.getValues(cepFieldPath);
        
        if (cepValue && typeof cepValue === 'string') {
          const cleanedCep = cleanCep(cepValue);
          
          // Só dispara a busca se o CEP tiver 8 dígitos
          if (cleanedCep.length === 8) {
            // Limpa timeout anterior
            if (debounceRef.current) {
              clearTimeout(debounceRef.current);
            }
            
            // Aplica debounce
            debounceRef.current = setTimeout(() => {
              fetchAndFillAddress(cepValue);
            }, debounceMs);
          }
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [form, cepFieldPath, fieldPath, debounceMs, fetchAndFillAddress]);

  return {
    isLoading,
    error,
    lastFetchedCep,
  };
}
