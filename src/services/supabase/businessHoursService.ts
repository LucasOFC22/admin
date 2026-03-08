import { requireAuthenticatedClient } from '@/config/supabaseAuth';

export type DayStatus = 'open' | 'closed' | 'hours';
export type ScheduleType = 'empresa' | 'fila';

export interface DaySchedule {
  status: DayStatus;
  start1: string;
  end1: string;
  start2: string;
  end2: string;
}

export interface BusinessHoursConfig {
  id?: number;
  schedule_type: ScheduleType;
  fila_id?: number | null;
  days: DaySchedule[]; // index 0 = domingo, 6 = sábado
  absence_message: string;
  created_at?: string;
  updated_at?: string;
}

export interface Holiday {
  id?: number;
  date: string;
  name: string;
  start_time?: string | null;
  end_time?: string | null;
  message?: string | null;
  created_at?: string;
}

const DEFAULT_DAYS: DaySchedule[] = [
  { status: 'closed', start1: '08:00', end1: '12:00', start2: '13:00', end2: '18:00' }, // Dom
  { status: 'open', start1: '08:00', end1: '12:00', start2: '13:00', end2: '18:00' }, // Seg
  { status: 'open', start1: '08:00', end1: '12:00', start2: '13:00', end2: '18:00' }, // Ter
  { status: 'open', start1: '08:00', end1: '12:00', start2: '13:00', end2: '18:00' }, // Qua
  { status: 'open', start1: '08:00', end1: '12:00', start2: '13:00', end2: '18:00' }, // Qui
  { status: 'open', start1: '08:00', end1: '12:00', start2: '13:00', end2: '18:00' }, // Sex
  { status: 'closed', start1: '08:00', end1: '12:00', start2: '13:00', end2: '18:00' }, // Sáb
];

export const businessHoursService = {
  async getConfig(filaId?: number | null): Promise<BusinessHoursConfig> {
    const supabase = requireAuthenticatedClient();
    
    let query = supabase
      .from('whatsapp_business_hours')
      .select('*');
    
    if (filaId) {
      query = query.eq('fila_id', filaId);
    } else {
      query = query.is('fila_id', null);
    }
    
    const { data, error } = await query.limit(1).maybeSingle();

    if (error) {
      console.error('Erro ao buscar horários:', error);
      throw error;
    }

    if (!data) {
      return {
        schedule_type: 'empresa',
        fila_id: filaId || null,
        days: [...DEFAULT_DAYS],
        absence_message: '',
      };
    }

    return {
      ...data,
      days: typeof data.days === 'string' ? JSON.parse(data.days) : (data.days || [...DEFAULT_DAYS]),
    };
  },

  async saveConfig(config: BusinessHoursConfig): Promise<void> {
    const supabase = requireAuthenticatedClient();
    
    const prepared = {
      schedule_type: config.schedule_type,
      fila_id: config.fila_id || null,
      days: JSON.stringify(config.days),
      absence_message: config.absence_message || '',
      updated_at: new Date().toISOString(),
    };

    let query = supabase
      .from('whatsapp_business_hours')
      .select('id');

    if (config.fila_id) {
      query = query.eq('fila_id', config.fila_id);
    } else {
      query = query.is('fila_id', null);
    }

    const { data: existing } = await query.limit(1).maybeSingle();

    if (existing?.id) {
      const { error } = await supabase
        .from('whatsapp_business_hours')
        .update(prepared)
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('whatsapp_business_hours')
        .insert(prepared);
      if (error) throw error;
    }
  },

  // Holidays
  async getHolidays(): Promise<Holiday[]> {
    const supabase = requireAuthenticatedClient();
    const { data, error } = await supabase
      .from('whatsapp_holidays')
      .select('*')
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createHoliday(holiday: Omit<Holiday, 'id' | 'created_at'>): Promise<void> {
    const supabase = requireAuthenticatedClient();
    const { error } = await supabase
      .from('whatsapp_holidays')
      .insert(holiday);
    if (error) throw error;
  },

  async deleteHoliday(id: number): Promise<void> {
    const supabase = requireAuthenticatedClient();
    const { error } = await supabase
      .from('whatsapp_holidays')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  /**
   * Verifica se está dentro do horário de atendimento
   * Retorna { isOpen, message } onde message é a mensagem de ausência se estiver fechado
   */
  isWithinBusinessHours(config: BusinessHoursConfig, holidays: Holiday[]): { isOpen: boolean; message: string } {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    
    // Verificar feriados
    const todayHoliday = holidays.find(h => h.date === dateStr);
    if (todayHoliday) {
      if (todayHoliday.start_time && todayHoliday.end_time) {
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        if (currentTime >= todayHoliday.start_time && currentTime <= todayHoliday.end_time) {
          return { isOpen: false, message: todayHoliday.message || config.absence_message || 'Estamos em feriado.' };
        }
      } else {
        return { isOpen: false, message: todayHoliday.message || config.absence_message || 'Estamos em feriado.' };
      }
    }
    
    const dayIndex = now.getDay(); // 0=dom
    const dayConfig = config.days[dayIndex];
    
    if (!dayConfig) return { isOpen: true, message: '' };
    
    if (dayConfig.status === 'open') return { isOpen: true, message: '' };
    if (dayConfig.status === 'closed') return { isOpen: false, message: config.absence_message };
    
    // status === 'hours'
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const inPeriod1 = currentTime >= dayConfig.start1 && currentTime <= dayConfig.end1;
    const inPeriod2 = currentTime >= dayConfig.start2 && currentTime <= dayConfig.end2;
    
    if (inPeriod1 || inPeriod2) {
      return { isOpen: true, message: '' };
    }
    
    return { isOpen: false, message: config.absence_message };
  },
};
