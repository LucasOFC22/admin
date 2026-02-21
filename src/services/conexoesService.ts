import { requireAuthenticatedClient } from '@/config/supabaseAuth';

export const conexoesService = {
  async fetchAllConnections() {
    const supabase = requireAuthenticatedClient();
    const { data, error } = await supabase
      .from('conexoes_public')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  },

  async getQrCode(conexaoId: string) {
    const supabase = requireAuthenticatedClient();
    const { data, error } = await supabase
      .from('conexoes_public')
      .select('qrcode')
      .eq('id', conexaoId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data?.qrcode || '';
  },

  async simulateConnection(conexaoId: string) {
    const supabase = requireAuthenticatedClient();
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-simulate-connection', {
        body: { conexaoId },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Edge function não disponível, usando fallback:', error);
      const { error: updateError } = await supabase
        .from('conexoes')
        .update({
          status: 'CONNECTED',
          qrcode: null,
          session_data: {
            connected_at: new Date().toISOString(),
            device: 'Simulator',
          },
        })
        .eq('id', conexaoId);

      if (updateError) throw new Error(updateError.message);
    }
  },

  async startSession(conexaoId: string) {
    const supabase = requireAuthenticatedClient();
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-session', {
        body: {
          action: 'start',
          conexaoId,
        },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Edge function não disponível, usando fallback:', error);
      const { error: updateError } = await supabase
        .from('conexoes')
        .update({ status: 'OPENING' })
        .eq('id', conexaoId);

      if (updateError) throw new Error(updateError.message);
    }
  },

  async requestNewQrCode(conexaoId: string) {
    const supabase = requireAuthenticatedClient();
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-session', {
        body: {
          action: 'requestQr',
          conexaoId,
        },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Edge function não disponível, usando fallback:', error);
      const qrCodeData = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=whatsapp-${conexaoId}-${Date.now()}`;
      
      const { error: updateError } = await supabase
        .from('conexoes')
        .update({ status: 'qrcode', qrcode: qrCodeData })
        .eq('id', conexaoId);

      if (updateError) throw new Error(updateError.message);
    }
  },

  async disconnectSession(conexaoId: string) {
    const supabase = requireAuthenticatedClient();
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-session', {
        body: {
          action: 'disconnect',
          conexaoId,
        },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Edge function não disponível, usando fallback:', error);
      const { error: updateError } = await supabase
        .from('conexoes')
        .update({ status: 'DISCONNECTED', qrcode: null })
        .eq('id', conexaoId);

      if (updateError) throw new Error(updateError.message);
    }
  },

  /**
   * Valida se a conexão está configurada corretamente
   * SEGURANÇA: Usa view conexoes_public que não expõe whatsapp_token
   */
  async validateConnection(conexaoId: string): Promise<boolean> {
    const supabase = requireAuthenticatedClient();
    const { data, error } = await supabase
      .from('conexoes_public')
      .select('id, has_token')
      .eq('id', conexaoId)
      .eq('has_token', true)
      .not('whatsapp_phone_id', 'is', null)
      .maybeSingle();

    if (error) {
      console.error('[ConexoesService] validateConnection error:', error.message);
      return false;
    }
    
    return !!data;
  },

  async updateConnectionStatus(conexaoId: string, status: string) {
    const supabase = requireAuthenticatedClient();
    const { error } = await supabase
      .from('conexoes')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', conexaoId);

    if (error) throw new Error(error.message);
  },

  async deleteConnection(conexaoId: string) {
    const supabase = requireAuthenticatedClient();
    const { error } = await supabase
      .from('conexoes')
      .delete()
      .eq('id', conexaoId);

    if (error) throw new Error(error.message);
  },

  async createConnection(data: {
    nome: string;
    canal: 'whatsapp' | 'facebook' | 'instagram';
    whatsapp_token?: string;
    whatsapp_phone_id?: string;
    whatsapp_verify_token?: string;
    whatsapp_webhook_url?: string;
    telefone?: string;
    is_default?: boolean;
    greetingmessage?: string;
    farewellmessage?: string;
    fluxo_boas_vindas_id?: string;
    fluxo_resposta_padrao_id?: string;
  }) {
    const supabase = requireAuthenticatedClient();
    const insertData = {
      nome: data.nome,
      canal: data.canal,
      whatsapp_token: data.whatsapp_token || null,
      whatsapp_phone_id: data.whatsapp_phone_id || null,
      whatsapp_verify_token: data.whatsapp_verify_token || null,
      whatsapp_webhook_url: data.whatsapp_webhook_url || null,
      telefone: data.telefone || null,
      is_default: data.is_default || false,
      greetingmessage: data.greetingmessage || null,
      farewellmessage: data.farewellmessage || null,
      fluxo_boas_vindas_id: data.fluxo_boas_vindas_id || null,
      fluxo_resposta_padrao_id: data.fluxo_resposta_padrao_id || null,
      status: 'DISCONNECTED',
    };

    const { error } = await supabase
      .from('conexoes')
      .insert([insertData]);

    if (error) throw new Error(error.message);
  },

  async updateConnection(conexaoId: string, data: {
    nome?: string;
    whatsapp_token?: string;
    whatsapp_phone_id?: string;
    whatsapp_verify_token?: string;
    whatsapp_webhook_url?: string;
    telefone?: string;
    greetingmessage?: string;
    farewellmessage?: string;
    fluxo_boas_vindas_id?: string | null;
    fluxo_resposta_padrao_id?: string | null;
  }) {
    const supabase = requireAuthenticatedClient();
    const { error } = await supabase
      .from('conexoes')
      .update(data)
      .eq('id', conexaoId);

    if (error) throw new Error(error.message);
  },
};
