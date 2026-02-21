/**
 * Normaliza endereços IP removendo o prefixo IPv4-mapped IPv6
 * Exemplo: "::ffff:187.182.238.196" → "187.182.238.196"
 */
export const normalizeIpAddress = (ip: string | null | undefined): string => {
  if (!ip) return '';
  
  if (ip.startsWith('::ffff:')) {
    return ip.replace('::ffff:', '');
  }
  
  return ip;
};
