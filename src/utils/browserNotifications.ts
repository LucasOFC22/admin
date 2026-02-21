// Gerenciamento de notificações do navegador

let notificationPermission: NotificationPermission = 'default';
let browserNotificationsEnabled = true;

if (typeof window !== 'undefined' && 'Notification' in window) {
  notificationPermission = Notification.permission;
}

if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('browserNotificationsEnabled');
  if (stored !== null) {
    browserNotificationsEnabled = stored === 'true';
  }
}

/**
 * Solicita permissão para notificações do navegador
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    notificationPermission = 'granted';
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    notificationPermission = permission;
    return permission;
  }

  notificationPermission = 'denied';
  return 'denied';
};

/**
 * Verifica se as notificações do navegador estão disponíveis e permitidas
 */
export const canShowBrowserNotifications = (): boolean => {
  return (
    'Notification' in window &&
    Notification.permission === 'granted' &&
    browserNotificationsEnabled
  );
};

/**
 * Retorna o status atual da permissão
 */
export const getNotificationPermission = (): NotificationPermission => {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
};

/**
 * Verifica se as notificações do navegador estão habilitadas pelo usuário
 */
export const isBrowserNotificationsEnabled = (): boolean => {
  return browserNotificationsEnabled;
};

/**
 * Habilita/desabilita notificações do navegador
 */
export const setBrowserNotificationsEnabled = async (enabled: boolean): Promise<boolean> => {
  if (enabled && Notification.permission !== 'granted') {
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      return false;
    }
  }
  
  browserNotificationsEnabled = enabled;
  localStorage.setItem('browserNotificationsEnabled', String(enabled));
  return true;
};

/**
 * Exibe uma notificação do navegador
 */
export const showBrowserNotification = (
  title: string,
  body: string,
  navigateTo?: string,
  icon?: string
): void => {
  if (!canShowBrowserNotifications()) {
    return;
  }

  try {
    const notification = new Notification(title, {
      body,
      icon: icon || '/favicon.ico',
      badge: '/favicon.ico',
      tag: `${title}-${Date.now()}`,
      requireInteraction: false,
      silent: true
    });

    notification.onclick = () => {
      window.focus();
      if (navigateTo) {
        window.location.href = navigateTo;
      }
      notification.close();
    };

    setTimeout(() => {
      notification.close();
    }, 5000);
  } catch {
    // Silent fail - notification errors are not critical
  }
};
