
import { toast } from '@/hooks/use-toast';

export const useCustomNotifications = () => {
  return {
    notify: {
      success: (title: string, message: string) => {
        toast({
          title,
          description: message,
          variant: 'default',
        });
      },
      error: (title: string, message: string) => {
        toast({
          title,
          description: message,
          variant: 'destructive',
        });
      },
      warning: (title: string, message: string) => {
        toast({
          title,
          description: message,
          variant: 'default',
        });
      },
      info: (title: string, message: string) => {
        toast({
          title,
          description: message,
          variant: 'default',
        });
      },
      promise: async <T>(promise: Promise<T>, messages: { loading: string; success: string; error: string }): Promise<T> => {
        try {
          const result = await promise;
          toast({
            title: "Sucesso",
            description: messages.success,
            variant: 'default',
          });
          return result;
        } catch (error) {
          toast({
            title: "Erro",
            description: messages.error,
            variant: 'destructive',
          });
          throw error;
        }
      }
    }
  };
};

// Hook simplificado para uso direto do useNotification (compatibilidade)
type MessageOrOptions = string | { message?: string; duration?: number; onClick?: () => void };

export const useNotification = () => {
  const success = (title: string, messageOrOptions?: MessageOrOptions) => {
    const message = typeof messageOrOptions === 'string' ? messageOrOptions : messageOrOptions?.message;
    toast({
      title,
      description: message,
      variant: 'default',
    });
  };

  const error = (title: string, messageOrOptions?: MessageOrOptions) => {
    const message = typeof messageOrOptions === 'string' ? messageOrOptions : messageOrOptions?.message;
    toast({
      title,
      description: message,
      variant: 'destructive',
    });
  };

  const warning = (title: string, messageOrOptions?: MessageOrOptions) => {
    const message = typeof messageOrOptions === 'string' ? messageOrOptions : messageOrOptions?.message;
    toast({
      title,
      description: message,
      variant: 'default',
    });
  };

  const info = (title: string, messageOrOptions?: MessageOrOptions) => {
    const message = typeof messageOrOptions === 'string' ? messageOrOptions : messageOrOptions?.message;
    toast({
      title,
      description: message,
      variant: 'default',
    });
  };

  const showNotification = (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    messageOrOptions?: MessageOrOptions,
  ) => {
    const message = typeof messageOrOptions === 'string' ? messageOrOptions : messageOrOptions?.message;
    
    toast({
      title,
      description: message,
      variant: type === 'error' ? 'destructive' : 'default',
    });
  };

  return {
    success,
    error,
    warning,
    info,
    showNotification,
  };
};
