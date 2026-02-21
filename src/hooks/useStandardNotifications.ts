
import { toast } from '@/lib/toast';
import { notifications } from '@/lib/notifications';

export const useStandardNotifications = () => {
  const notifySuccess = (action: keyof typeof notifications.success, entity: string) => {
    const messageFunction = notifications.success[action];
    if (typeof messageFunction === 'function') {
      toast.success(messageFunction(entity));
    }
  };

  const notifyError = (action: keyof typeof notifications.error, entity?: string) => {
    const messageFunction = notifications.error[action];
    if (typeof messageFunction === 'function' && entity) {
      toast.error(messageFunction(entity));
    } else if (typeof messageFunction === 'string') {
      toast.error(messageFunction);
    }
  };

  const notifyInfo = (action: keyof typeof notifications.info, entity: string) => {
    const messageFunction = notifications.info[action];
    if (typeof messageFunction === 'function') {
      toast.info(messageFunction(entity));
    }
  };

  const notifyWarning = (action: keyof typeof notifications.warning, entity?: string) => {
    const messageFunction = notifications.warning[action];
    if (typeof messageFunction === 'function' && entity) {
      toast.warning(messageFunction(entity));
    } else if (typeof messageFunction === 'string') {
      toast.warning(messageFunction);
    }
  };

  const notifyPromise = async <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ): Promise<T> => {
    try {
      toast.info(messages.loading);
      const result = await promise;
      toast.success(messages.success);
      return result;
    } catch (error) {
      toast.error(messages.error);
      throw error;
    }
  };

  return {
    success: notifySuccess,
    error: notifyError,
    info: notifyInfo,
    warning: notifyWarning,
    promise: notifyPromise
  };
};
