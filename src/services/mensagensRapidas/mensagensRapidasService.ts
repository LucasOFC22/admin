import { requireAuthenticatedClient } from '@/config/supabaseAuth';

export interface MensagemRapida {
  id: string;
  comando: string;
  titulo: string;
  conteudo: string;
  created_at: string;
  updated_at: string;
}

export interface CreateMensagemRapidaData {
  comando: string;
  titulo: string;
  conteudo: string;
  usuario_id?: string;
}

export interface LogMensagemRapida {
  id: string;
  mensagem_id: string;
  usuario_responsavel: string;
  tipo_de_acao: 'created' | 'updated' | 'deleted' | 'used';
  dados_anteriores?: any;
  dados_novos?: any;
  timestamp: string;
}

class MensagensRapidasService {
  // Listar todas as mensagens rápidas
  async listar(): Promise<MensagemRapida[]> {
    const supabase = requireAuthenticatedClient();
    const { data, error } = await supabase
      .from('mensagens_rapidas')
      .select('*')
      .order('comando', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Buscar mensagem rápida por ID
  async buscarPorId(id: string): Promise<MensagemRapida | null> {
    const supabase = requireAuthenticatedClient();
    const { data, error } = await supabase
      .from('mensagens_rapidas')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  // Verificar se comando já existe
  async comandoExiste(comando: string, excludeId?: string): Promise<boolean> {
    const supabase = requireAuthenticatedClient();
    let query = supabase
      .from('mensagens_rapidas')
      .select('id')
      .eq('comando', comando);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data?.length || 0) > 0;
  }

  // Criar mensagem rápida
  async criar(
    data: CreateMensagemRapidaData,
    usuarioId: string
  ): Promise<MensagemRapida> {
    const supabase = requireAuthenticatedClient();
    
    // Verificar se comando já existe
    const existe = await this.comandoExiste(data.comando);
    if (existe) {
      throw new Error('Comando já existe. Escolha outro comando.');
    }

    const { data: mensagem, error } = await supabase
      .from('mensagens_rapidas')
      .insert([{
        ...data,
        usuario_id: usuarioId
      }])
      .select()
      .single();

    if (error) throw error;

    // Criar log
    await this.criarLog({
      mensagem_id: mensagem.id,
      usuario_responsavel: usuarioId,
      tipo_de_acao: 'created',
      dados_novos: mensagem
    });

    return mensagem;
  }

  // Atualizar mensagem rápida
  async atualizar(
    id: string,
    data: Partial<CreateMensagemRapidaData>,
    usuarioId: string
  ): Promise<MensagemRapida> {
    const supabase = requireAuthenticatedClient();
    
    // Buscar dados anteriores
    const dadosAnteriores = await this.buscarPorId(id);
    if (!dadosAnteriores) {
      throw new Error('Mensagem rápida não encontrada');
    }

    // Verificar se comando já existe (excluindo o próprio registro)
    if (data.comando) {
      const existe = await this.comandoExiste(data.comando, id);
      if (existe) {
        throw new Error('Comando já existe. Escolha outro comando.');
      }
    }

    const { data: mensagem, error } = await supabase
      .from('mensagens_rapidas')
      .update({
        ...data,
        usuario_id: usuarioId,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Criar log
    await this.criarLog({
      mensagem_id: id,
      usuario_responsavel: usuarioId,
      tipo_de_acao: 'updated',
      dados_anteriores: dadosAnteriores,
      dados_novos: mensagem
    });

    return mensagem;
  }

  // Deletar mensagem rápida
  async deletar(id: string, usuarioId: string): Promise<void> {
    const supabase = requireAuthenticatedClient();
    
    // Buscar dados antes de deletar
    const dadosAnteriores = await this.buscarPorId(id);
    if (!dadosAnteriores) {
      throw new Error('Mensagem rápida não encontrada');
    }

    // Criar log ANTES de deletar (devido à foreign key constraint)
    await this.criarLog({
      mensagem_id: id,
      usuario_responsavel: usuarioId,
      tipo_de_acao: 'deleted',
      dados_anteriores: dadosAnteriores
    });

    const { error } = await supabase
      .from('mensagens_rapidas')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Registrar uso de mensagem rápida
  async registrarUso(
    mensagemId: string,
    usuarioId: string,
    enviadoPara: string
  ): Promise<void> {
    const mensagem = await this.buscarPorId(mensagemId);
    if (!mensagem) return;

    await this.criarLog({
      mensagem_id: mensagemId,
      usuario_responsavel: usuarioId,
      tipo_de_acao: 'used',
      dados_novos: {
        comando: mensagem.comando,
        enviado_para: enviadoPara,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Criar log de ação
  private async criarLog(logData: Omit<LogMensagemRapida, 'id' | 'timestamp'>): Promise<void> {
    const supabase = requireAuthenticatedClient();
    const { error } = await supabase
      .from('logs_mensagens_rapidas')
      .insert([{
        ...logData,
        timestamp: new Date().toISOString()
      }]);

    if (error) {
      console.error('Erro ao criar log de mensagem rápida:', error);
    }
  }
}

export const mensagensRapidasService = new MensagensRapidasService();
