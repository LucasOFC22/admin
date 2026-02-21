/**
 * DeviceService - Gerencia informações do dispositivo para o sistema usuarios_dispositivos.
 */

import { getOrCreateDeviceId, getDeviceInfo } from '@/utils/deviceInfo';
import { devLog } from '@/utils/logger';

class DeviceService {
  /**
   * Retorna o device_id persistente do dispositivo.
   */
  getDeviceId(): string {
    return getOrCreateDeviceId();
  }

  /**
   * Retorna informações completas do dispositivo.
   */
  getInfo() {
    return {
      device_id: getOrCreateDeviceId(),
      ...getDeviceInfo(),
    };
  }
}

export const deviceService = new DeviceService();
