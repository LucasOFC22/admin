import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { maskPhoneNumber, formatPhone } from '@/utils/phone';

/**
 * Hook para controle de visibilidade de telefones.
 * Usuários sem a permissão 'admin.whatsapp.ver_telefones_completos' veem
 * os números mascarados (ex: +55 (11) 9****-9999).
 */
export const usePhoneVisibility = () => {
  const { canAccess } = usePermissionGuard();

  const canViewFullPhone = canAccess('admin.whatsapp.ver_telefones_completos');

  /**
   * Retorna o telefone formatado ou mascarado conforme permissão do usuário.
   * @param phone - Número bruto ou formatado
   * @param formatted - Se true, aplica formatação antes de mascarar (padrão: true)
   */
  const displayPhone = (phone: string | undefined | null, formatted = true): string => {
    if (!phone) return '';
    if (canViewFullPhone) {
      return formatted ? formatPhone(phone) : phone;
    }
    return maskPhoneNumber(phone);
  };

  return {
    canViewFullPhone,
    displayPhone,
  };
};
