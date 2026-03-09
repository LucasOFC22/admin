import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { whatsappConfigService } from '@/services/supabase/whatsappConfigService';

interface TicketCountResult {
  canAccept: boolean;
  currentTickets: number;
  maxTickets: number;
  errorMessage?: string;
}

export const ticketLimitService = {
  /**
   * Verifica se o atendente pode aceitar um novo ticket baseado no limite configurado
   */
  async checkTicketLimit(adminId: string): Promise<TicketCountResult> {
    try {
      const supabase = requireAuthenticatedClient();
      
      // 1. Buscar configuração do limite
      const config = await whatsappConfigService.getConfig();
      const maxTickets = config.max_tickets_per_agent || 3; // fallback para 3 se não configurado
      
      // 2. Contar tickets ativos do atendente
      // Um ticket ativo é um chat onde:
      // - ativo = true
      // - resolvido = false  
      // - aceitoporadmin = true
      // - adminid = adminId do atendente
      const { data: activeTickets, error } = await supabase
        .from('chats_whatsapp')
        .select('id, usuarioid')
        .eq('ativo', true)
        .eq('resolvido', false)
        .eq('aceitoporadmin', true)
        .eq('adminid', adminId);

      if (error) {
        throw error;
      }

      const currentTickets = activeTickets?.length || 0;
      const canAccept = currentTickets < maxTickets;

      return {
        canAccept,
        currentTickets,
        maxTickets,
        errorMessage: canAccept 
          ? undefined 
          : `Você já atingiu o limite de ${maxTickets} ticket${maxTickets > 1 ? 's' : ''} simultâneo${maxTickets > 1 ? 's' : ''}. Finalize um atendimento antes de aceitar outro.`
      };

    } catch (error) {
      console.error('Erro ao verificar limite de tickets:', error);
      // Em caso de erro, permite aceitar (não bloqueia o sistema)
      return {
        canAccept: true,
        currentTickets: 0,
        maxTickets: 3,
        errorMessage: 'Erro ao verificar limite. Aceitando ticket...'
      };
    }
  },

  /**
   * Busca o limite atual configurado
   */
  async getMaxTicketsPerAgent(): Promise<number> {
    try {
      const config = await whatsappConfigService.getConfig();
      return config.max_tickets_per_agent || 3;
    } catch (error) {
      console.error('Erro ao buscar limite de tickets:', error);
      return 3; // fallback padrão
    }
  }
};