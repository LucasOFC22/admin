import { toast as shadcnToast } from '@/hooks/use-toast';

type ToastVariant = 'default' | 'destructive' | 'success' | 'warning' | 'info';

interface ToastOptions {
  description?: string;
  duration?: number;
}

/**
 * Utilitário de toast para uso fora de componentes React
 * Para uso em hooks e funções utilitárias
 * API compatível com sonner para facilitar migração
 * 
 * @example
 * import { toast } from '@/lib/toast';
 * toast.success('Operação realizada');
 * toast.error('Falha ao processar');
 * toast.error('Erro', { description: 'Detalhes do erro', duration: 6000 });
 */
export const toast = {
  default: (message: string, options?: string | ToastOptions) => {
    const opts = typeof options === 'string' ? { description: options } : options;
    return shadcnToast({
      title: message,
      description: opts?.description,
      variant: 'default' as ToastVariant,
      duration: opts?.duration ?? 5000,
    });
  },

  success: (message: string, options?: string | ToastOptions) => {
    const opts = typeof options === 'string' ? { description: options } : options;
    return shadcnToast({
      title: message,
      description: opts?.description,
      variant: 'success' as ToastVariant,
      duration: opts?.duration ?? 5000,
    });
  },

  error: (message: string, options?: string | ToastOptions) => {
    const opts = typeof options === 'string' ? { description: options } : options;
    return shadcnToast({
      title: message,
      description: opts?.description,
      variant: 'destructive' as ToastVariant,
      duration: opts?.duration ?? 5000,
    });
  },

  warning: (message: string, options?: string | ToastOptions) => {
    const opts = typeof options === 'string' ? { description: options } : options;
    return shadcnToast({
      title: message,
      description: opts?.description,
      variant: 'warning' as ToastVariant,
      duration: opts?.duration ?? 5000,
    });
  },

  info: (message: string, options?: string | ToastOptions) => {
    const opts = typeof options === 'string' ? { description: options } : options;
    return shadcnToast({
      title: message,
      description: opts?.description,
      variant: 'info' as ToastVariant,
      duration: opts?.duration ?? 5000,
    });
  },

  loading: (message: string) => {
    return shadcnToast({
      title: message,
      description: 'Aguarde...',
      duration: Infinity,
    });
  },
};
