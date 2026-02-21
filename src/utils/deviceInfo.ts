import { getBackendUrl } from '@/config/backend.config';

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  screenResolution: string;
  timezone: string;
  language: string;
  cookiesEnabled: boolean;
  onlineStatus: boolean;
}

export const getDeviceInfo = (): DeviceInfo => {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    cookiesEnabled: navigator.cookieEnabled,
    onlineStatus: navigator.onLine
  };
};

let cachedIP: string | null = null;

/**
 * Gera ou recupera um device_id persistente (localStorage).
 * Usado pelo sistema de usuarios_dispositivos para vincular refresh tokens ao dispositivo.
 */
export const getOrCreateDeviceId = (): string => {
  const KEY = 'fp_device_id';
  let deviceId = localStorage.getItem(KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(KEY, deviceId);
  }
  return deviceId;
};

export const getUserIP = async (): Promise<string> => {
  if (cachedIP) return cachedIP;

  // 1. Tentar backend próprio (preferido - headers reais)
  try {
    const response = await fetch(getBackendUrl('/buscar-ip'), {
      signal: AbortSignal.timeout(3000)
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.ip && data.ip !== 'unknown') {
        cachedIP = data.ip;
        return cachedIP;
      }
    }
  } catch {
    // Fallback para ipify
  }

  // 2. Fallback ipify
  try {
    const response = await fetch('https://api.ipify.org?format=json', {
      signal: AbortSignal.timeout(3000)
    });
    
    if (response.ok) {
      const data = await response.json();
      cachedIP = data.ip;
      return data.ip;
    }
  } catch {
    // Silenciar
  }
  
  return 'unknown';
};
