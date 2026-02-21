import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/lib/toast';

interface UseAsyncDataOptions<T> {
  initialData?: T[];
  onSuccess?: (data: T[]) => void;
  onError?: (error: string) => void;
  autoLoad?: boolean;
}

interface UseAsyncDataReturn<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  reset: () => void;
  setData: (data: T[]) => void;
}

export const useAsyncData = <T>(
  fetchFn: () => Promise<T[]>,
  options: UseAsyncDataOptions<T> = {}
): UseAsyncDataReturn<T> => {
  const {
    initialData = [],
    onSuccess,
    onError,
    autoLoad = true
  } = options;

  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await fetchFn();
      setData(result);
      
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao carregar dados';
      setError(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchFn, onSuccess, onError]);

  const reset = useCallback(() => {
    setData(initialData);
    setError(null);
    setLoading(false);
  }, [initialData]);

  useEffect(() => {
    if (autoLoad) {
      fetchData();
    }
  }, [fetchData, autoLoad]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    reset,
    setData
  };
};
