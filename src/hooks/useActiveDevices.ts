import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { getOrCreateDeviceId } from '@/utils/deviceInfo';

export interface ActiveDevice {
  id: string;
  device_id: string | null;
  device_name: string | null;
  ip_address: string | null;
  user_agent: string | null;
  last_used_at: string | null;
  created_at: string | null;
  revoked: boolean | null;
  isCurrentDevice: boolean;
  parsed: {
    browser: string;
    os: string;
    deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  };
  location: {
    city: string | null;
    region: string | null;
    country: string | null;
    loading: boolean;
  };
}

// Parse user agent string
const parseUserAgent = (ua: string | null): { browser: string; os: string; deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown' } => {
  if (!ua) return { browser: 'Desconhecido', os: 'Desconhecido', deviceType: 'unknown' };

  let browser = 'Navegador';
  let os = 'Sistema';
  let deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown' = 'desktop';

  // Browser detection
  if (ua.includes('Edg/')) browser = 'Microsoft Edge';
  else if (ua.includes('OPR/') || ua.includes('Opera')) browser = 'Opera';
  else if (ua.includes('Chrome/') && !ua.includes('Edg/')) browser = 'Google Chrome';
  else if (ua.includes('Firefox/')) browser = 'Mozilla Firefox';
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('MSIE') || ua.includes('Trident/')) browser = 'Internet Explorer';

  // OS detection
  if (ua.includes('Windows NT 10')) os = 'Windows 10/11';
  else if (ua.includes('Windows NT')) os = 'Windows';
  else if (ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('CrOS')) os = 'Chrome OS';

  // Device type
  const uaLower = ua.toLowerCase();
  if (uaLower.includes('mobile') || uaLower.includes('android') || uaLower.includes('iphone')) deviceType = 'mobile';
  else if (uaLower.includes('tablet') || uaLower.includes('ipad')) deviceType = 'tablet';

  return { browser, os, deviceType };
};

// Fetch IP geolocation
const fetchGeoLocation = async (ip: string): Promise<{ city: string | null; region: string | null; country: string | null }> => {
  if (!ip || ip === 'unknown' || ip === '127.0.0.1' || ip.startsWith('192.168') || ip.startsWith('10.')) {
    return { city: null, region: null, country: 'Rede Local' };
  }
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return { city: null, region: null, country: null };
    const data = await res.json();
    return {
      city: data.city || null,
      region: data.region || null,
      country: data.country_name || null,
    };
  } catch {
    return { city: null, region: null, country: null };
  }
};

export const useActiveDevices = (userId: string | undefined) => {
  const queryClient = useQueryClient();
  const currentDeviceId = getOrCreateDeviceId();

  const query = useQuery({
    queryKey: ['active-devices', userId],
    queryFn: async (): Promise<ActiveDevice[]> => {
      if (!userId) return [];
      const client = requireAuthenticatedClient();
      const { data, error } = await client
        .from('usuarios_dispositivos')
        .select('*')
        .eq('usuario_id', userId)
        .eq('revoked', false)
        .order('last_used_at', { ascending: false });

      if (error) throw error;

      const devices: ActiveDevice[] = (data || []).map((d) => ({
        id: d.id,
        device_id: d.device_id,
        device_name: d.device_name,
        ip_address: d.ip_address,
        user_agent: d.user_agent,
        last_used_at: d.last_used_at,
        created_at: d.created_at,
        revoked: d.revoked,
        isCurrentDevice: d.device_id === currentDeviceId,
        parsed: parseUserAgent(d.user_agent),
        location: { city: null, region: null, country: null, loading: true },
      }));

      // Fetch geolocation for unique IPs in background
      const uniqueIPs = [...new Set(devices.map(d => d.ip_address).filter(Boolean))] as string[];
      const geoCache: Record<string, Awaited<ReturnType<typeof fetchGeoLocation>>> = {};
      
      await Promise.allSettled(
        uniqueIPs.map(async (ip) => {
          geoCache[ip] = await fetchGeoLocation(ip);
        })
      );

      return devices.map(d => ({
        ...d,
        location: {
          ...(d.ip_address && geoCache[d.ip_address] ? geoCache[d.ip_address] : { city: null, region: null, country: null }),
          loading: false,
        },
      }));
    },
    enabled: !!userId,
    staleTime: 60000,
  });

  // Revogar um dispositivo específico
  const revokeMutation = useMutation({
    mutationFn: async (deviceId: string) => {
      const client = requireAuthenticatedClient();
      const { error } = await client
        .from('usuarios_dispositivos')
        .update({ revoked: true })
        .eq('id', deviceId)
        .eq('usuario_id', userId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-devices', userId] });
    },
  });

  // Revogar todos os outros dispositivos
  const revokeAllMutation = useMutation({
    mutationFn: async () => {
      const client = requireAuthenticatedClient();
      const { error } = await client
        .from('usuarios_dispositivos')
        .update({ revoked: true })
        .eq('usuario_id', userId!)
        .neq('device_id', currentDeviceId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-devices', userId] });
    },
  });

  return {
    devices: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    revokeDevice: revokeMutation.mutateAsync,
    isRevoking: revokeMutation.isPending,
    revokeAllOthers: revokeAllMutation.mutateAsync,
    isRevokingAll: revokeAllMutation.isPending,
    refetch: query.refetch,
  };
};
