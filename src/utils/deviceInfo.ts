import { getBackendUrl } from '@/config/backend.config';

const SHARED_DEVICE_KEY = 'fp_device_id';
const SUPABASE_SESSION_COOKIE = 'fp_supabase_session';

const getCookieDomain = (): string => {
  const hostname = window.location.hostname;
  if (hostname.includes('fptranscargas.com.br')) {
    return '.fptranscargas.com.br';
  }
  return '';
};

const readCookie = (name: string): string | null => {
  const prefix = `${name}=`;
  const cookies = document.cookie.split(';');

  for (const cookie of cookies) {
    const trimmed = cookie.trim();
    if (trimmed.startsWith(prefix)) {
      try {
        return decodeURIComponent(trimmed.substring(prefix.length));
      } catch {
        return null;
      }
    }
  }

  return null;
};

const writeSharedDeviceCookie = (deviceId: string): void => {
  const isSecure = window.location.protocol === 'https:';
  const domain = getCookieDomain();

  let cookieString = `${SHARED_DEVICE_KEY}=${encodeURIComponent(deviceId)}; max-age=2592000; path=/; SameSite=Lax`;
  if (domain) cookieString += `; domain=${domain}`;
  if (isSecure) cookieString += '; Secure';

  document.cookie = cookieString;
};

const readDeviceIdFromSessionCookie = (): string | null => {
  try {
    const rawSession = readCookie(SUPABASE_SESSION_COOKIE);
    if (!rawSession) return null;

    const parsed = JSON.parse(rawSession) as { device_id?: string };
    return parsed.device_id || null;
  } catch {
    return null;
  }
};

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
  const sessionDeviceId = readDeviceIdFromSessionCookie();
  if (sessionDeviceId) {
    localStorage.setItem(SHARED_DEVICE_KEY, sessionDeviceId);
    writeSharedDeviceCookie(sessionDeviceId);
    return sessionDeviceId;
  }

  const cookieDeviceId = readCookie(SHARED_DEVICE_KEY);
  if (cookieDeviceId) {
    localStorage.setItem(SHARED_DEVICE_KEY, cookieDeviceId);
    return cookieDeviceId;
  }

  let deviceId = localStorage.getItem(SHARED_DEVICE_KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(SHARED_DEVICE_KEY, deviceId);
  }

  writeSharedDeviceCookie(deviceId);
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
