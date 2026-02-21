// Serviço centralizado para comunicação com o backend Node.js
// URL Base: https://api.fptranscargas.com.br

import { BACKEND_CONFIG, getBackendUrl } from '@/config/backend.config';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { ColetaPayload, ColetaResponse } from '@/types/coleta.types';
import {
  DREFiltros,
  DRELancamento,
  DRESummary,
  CalendarioFiltros,
  DayData,
  DayDetailItem,
  FinancialSummary
} from '@/types/financeiro.types';

interface BackendResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class BackendService {
  private requestId: string = '';

  private isWhatsAppDebugEnabled(): boolean {
    return import.meta.env.DEV &&
      typeof window !== 'undefined' &&
      window.localStorage?.getItem('debug_whatsapp') === '1';
  }
  private async makeRequest<T>(endpoint: string, payload: any): Promise<BackendResponse<T>> {
    try {
      this.requestId = crypto.randomUUID();
      const url = getBackendUrl(endpoint);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), BACKEND_CONFIG.timeout);

      const headers = {
        ...BACKEND_CONFIG.headers,
        'X-Request-ID': this.requestId,
        'X-Timestamp': new Date().toISOString()
      };

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      
      if (!text || text.trim() === '') {
        return { success: true };
      }

      const result = JSON.parse(text);
      
      // Normalizar resposta (suporta formato N8N com wrapper .json)
      let normalizedResult = result;
      if (Array.isArray(result) && result.length > 0 && result[0]?.json !== undefined) {
        normalizedResult = result.map((item: any) => item.json);
      }

      return {
        success: true,
        data: normalizedResult?.data || normalizedResult,
        message: normalizedResult?.message
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  // Proxy genérico para N8N (substitui chamadas diretas ao N8N)
  async n8nProxy<T>(payload: any): Promise<BackendResponse<T>> {
    return this.makeRequest<T>('/n8n-proxy', payload);
  }

  // Rastrear mercadoria
  async rastrearMercadoria(cpfcnpj: string, nro_nf: string): Promise<BackendResponse<any>> {
    return this.makeRequest('/rastrear-mercadoria', {
      eventType: 'rastrear-mercadoria',
      cpfcnpj: cpfcnpj.replace(/\D/g, ''),
      nro_nf: nro_nf.trim()
    });
  }

  // Consultar NF-e
  async consultarNfe(filtros: Record<string, any>): Promise<BackendResponse<any>> {
    return this.makeRequest('/consultar-nfe', {
      eventType: 'consulta-nfe',
      filtros
    });
  }

  // Listar manifestos
  async getManifestos(): Promise<BackendResponse<any>> {
    return this.makeRequest('/manifestos', {
      eventType: 'manifestos',
      acao: 'listar'
    });
  }

  // Buscar cidades
  async buscarCidades(filtros: { nome?: string; uf?: string }): Promise<BackendResponse<any>> {
    return this.makeRequest('/buscar/cidades', {
      eventType: 'buscar-cidades',
      filtros
    });
  }

  // Buscar tabelas de preço
  async buscarTabelas(filtros?: { nome?: string }): Promise<BackendResponse<any>> {
    return this.makeRequest('/buscar/tabelas', {
      nome: filtros?.nome || ''
    });
  }

  // Evento de frete
  async sendFreteEvent(tempo: 30 | 15 | 7, cnpjcpf?: string): Promise<BackendResponse<any>> {
    return this.makeRequest('/frete', {
      eventType: 'frete',
      tempo,
      cnpjcpf,
      timestamp: new Date().toISOString()
    });
  }

  // Enviar mensagem WhatsApp
  async enviarMensagemWhatsApp(numero: string, mensagem: string): Promise<BackendResponse<any>> {
    return this.makeRequest('/whatsapp/enviar', {
      numero,
      mensagem
    });
  }

  // Enviar mensagem WhatsApp direto (via Cloud API)
  // O backend Node.js busca automaticamente token e phoneId da tabela conexoes
  // Token NUNCA é enviado pelo frontend para maior segurança
  async enviarMensagemWhatsAppDireto(params: {
    numero: string;
    mensagem: string;
    conexaoId?: string;
  }): Promise<BackendResponse<any>> {
    if (this.isWhatsAppDebugEnabled()) {
      console.debug('📤 [WhatsApp] Enviando mensagem segura (sem token no frontend):', {
        numero: params.numero.substring(0, 5) + '***',
        mensagemLength: params.mensagem.length,
        conexaoId: params.conexaoId || 'default'
      });
    }

    return this.makeRequest('/whatsapp/enviar-direto', {
      numero: params.numero,
      mensagem: params.mensagem,
      conexaoId: params.conexaoId
    });
  }

  // Assumir conversa WhatsApp (IA)
  async assumirConversaWhatsApp(numero: string, nomeAtendente: string): Promise<BackendResponse<any>> {
    return this.makeRequest('/whatsapp/assumir', {
      numero,
      nomeAtendente
    });
  }

  // Atualizar foto de perfil WhatsApp
  async atualizarPerfilWhatsApp(id: string, telefone: string): Promise<BackendResponse<any>> {
    return this.makeRequest('/whatsapp/perfil', {
      id,
      telefone: telefone.replace(/\D/g, '')
    });
  }

  // Enviar contato
  async sendContact(formData: any, referenceId: string): Promise<BackendResponse<any>> {
    return this.makeRequest('/send-contact', {
      ...formData,
      _metadata: {
        referenceId,
        timestamp: new Date().toISOString(),
        source: 'fp-transcargas-frontend',
        version: import.meta.env.VITE_APP_VERSION || '2.0.0'
      }
    });
  }

  // ==================== COTAÇÃO ====================
  
  // Criar nova cotação
  async criarCotacao(cotacaoData: {
    remetente: any;
    destinatario: any;
    coleta: any;
    carga: any;
    contato: any;
    tipoFrete?: string;
    observacoes?: string;
  }): Promise<BackendResponse<any>> {
    return this.makeRequest('/cotacao/criar', {
      ...cotacaoData,
      timestamp: new Date().toISOString(),
      origem: 'fp_transportes_public_form'
    });
  }

  // Buscar cotações (admin)
  async buscarCotacoes(filtros?: Record<string, any>): Promise<BackendResponse<any>> {
    return this.makeRequest('/cotacao/buscar', {
      filtros: filtros || {}
    });
  }

  // Buscar cotação do cliente
  async buscarCotacaoCliente(params: {
    cpfcnpj?: string;
    nro_orcamento?: string;
    email?: string;
  }): Promise<BackendResponse<any>> {
    return this.makeRequest('/cotacao/cliente', {
      cpfcnpj: params.cpfcnpj?.replace(/\D/g, ''),
      nro_orcamento: params.nro_orcamento,
      email: params.email
    });
  }

  // Cotação genérico (para compatibilidade)
  async cotacao(acao: 'nova_cotacao' | 'buscar' | 'buscar-cotacao-cliente', data: any): Promise<BackendResponse<any>> {
    return this.makeRequest('/cotacao', {
      eventType: 'cotacao',
      acao,
      ...data
    });
  }

  // Buscar detalhes da cotação (apenas leitura - para abrir modal de edição)
  async buscarDetalhesCotacao(idOrcamento: number): Promise<BackendResponse<any>> {
    return this.makeRequest('/cotacao/detalhes', { idOrcamento });
  }

  // Buscar dados completos para edição de cotação (via DB Frete API) - DEPRECATED: use buscarDetalhesCotacao
  async buscarCotacaoParaEditar(idOrcamento: number): Promise<BackendResponse<any>> {
    return this.buscarDetalhesCotacao(idOrcamento);
  }

  // Salvar edição de cotação (via edge function editar-cotacao)
  async salvarEdicaoCotacao(cotacaoData: any): Promise<BackendResponse<any>> {
    return this.makeRequest('/cotacao/editar', cotacaoData);
  }

  // ==================== MALOTE ====================

  // Enviar link de assinatura do malote via WhatsApp
  async enviarAssinaturaMalote(maloteId: string, telefone: string): Promise<BackendResponse<any>> {
    return this.makeRequest('/malote/enviar-assinatura', {
      malote_id: maloteId,
      telefone: telefone.replace(/\D/g, '')
    });
  }

  // Buscar cadastro
  async buscarCadastro(termo: string, eventType: string = 'cadastro'): Promise<BackendResponse<any>> {
    return this.makeRequest('/buscar/cadastro', { termo, eventType });
  }

  // Criar contato (formulário de contato)
  async criarContato(data: {
    eventType: string,
    name: string;
    email: string;
    phone: string;
    department: string;
    subject: string;
    message: string;
    status?: string;
  }): Promise<BackendResponse<any>> {
    return this.makeRequest('/contato', {
      eventType: "contato",
      name: data.name,
      email: data.email,
      phone: data.phone,
      department: data.department,
      subject: data.subject,
      message: data.message,
      status: data.status || 'novo'
    });
  }

  // Deletar usuário do Supabase Auth (self-hosted)
  async deletarUsuario(supabaseId: string): Promise<BackendResponse<any>> {
    return this.makeRequest('/usuario/deletar', {
      supabase_id: supabaseId,
      eventType: 'usuario'
    });
  }

  // Buscar usuário do Supabase Auth (self-hosted)
  async buscarUsuario(supabaseId: string): Promise<BackendResponse<any>> {
    return this.makeRequest('/usuario/buscar', {
      supabase_id: supabaseId,
      eventType: 'usuario'
    });
  }

  // Buscar múltiplos usuários do Supabase Auth
  async buscarUsuarios(supabaseIds: string[]): Promise<BackendResponse<any>> {
    return this.makeRequest('/usuario/buscar', {
      supabase_ids: supabaseIds,
      eventType: 'usuario'
    });
  }

  // Obter informações do WhatsApp
  async getWhatsAppInfo(): Promise<BackendResponse<any>> {
    return this.makeRequest('/whatsapp/info', {
      eventType: 'whatsapp-info'
    });
  }

  // Validar token WhatsApp via backend (sem expor token no frontend)
  // O backend Node.js busca as credenciais do Supabase internamente
  async validarTokenWhatsApp(conexaoId: string): Promise<BackendResponse<{
    success: boolean;
    display_phone_number?: string;
    verified_name?: string;
    quality_rating?: string;
  }>> {
    if (this.isWhatsAppDebugEnabled()) {
      console.debug('🔐 [WhatsApp] Validando token via backend seguro:', { conexaoId });
    }
    return this.makeRequest('/whatsapp/validar-token', {
      conexaoId
    });
  }

  // Buscar modelos/templates do WhatsApp via Edge Function
  async buscarModelosWhatsApp(conexaoId: string): Promise<BackendResponse<any>> {
    try {
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase.functions.invoke('whatsapp-modelos-buscar', {
        body: { conexaoId }
      });

      if (error) {
        console.error('Erro ao buscar modelos WhatsApp:', error);
        return { success: false, error: error.message };
      }

      return { 
        success: true, 
        data: data?.data || [],
        message: `${data?.total || 0} modelos encontrados`
      };
    } catch (error) {
      console.error('Erro ao buscar modelos WhatsApp:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  // Criar modelo/template do WhatsApp via Edge Function
  async criarModeloWhatsApp(params: {
    conexaoId: string;
    name: string;
    category: string;
    language: string;
    components: any[];
  }): Promise<BackendResponse<any>> {
    try {
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase.functions.invoke('whatsapp-modelos-criar', {
        body: params
      });

      if (error) {
        console.error('Erro ao criar modelo WhatsApp:', error);
        return { success: false, error: error.message };
      }

      if (data?.error) {
        return { success: false, error: data.error, data: data.details };
      }

      return { 
        success: true, 
        data: data?.data,
        message: data?.message || 'Template criado com sucesso!'
      };
    } catch (error) {
      console.error('Erro ao criar modelo WhatsApp:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  // Editar modelo WhatsApp
  async editarModeloWhatsApp(params: {
    conexaoId: string;
    templateId: string;
    components: any[];
  }): Promise<BackendResponse<any>> {
    try {
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase.functions.invoke('whatsapp-modelos-editar', {
        body: params
      });

      if (error) {
        console.error('Erro ao editar modelo WhatsApp:', error);
        return { success: false, error: error.message };
      }

      if (data?.error) {
        return { success: false, error: data.error, data: data.details };
      }

      return { 
        success: true, 
        data: data?.data,
        message: data?.message || 'Template editado com sucesso!'
      };
    } catch (error) {
      console.error('Erro ao editar modelo WhatsApp:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  // ==================== CONTAS A RECEBER ====================

  // Buscar contas a receber
  async buscarContasReceber(filtros: Record<string, any>): Promise<BackendResponse<any>> {
    return this.makeRequest('/contas-receber', {
      eventType: 'contas-receber',
      acao: 'buscar',
      filtros
    });
  }

  // ==================== FINANCEIRO CLIENTE ====================

  // Buscar financeiro do cliente
  async buscarFinanceiroCliente(cnpjcpf: string, filtros?: {
    periodo?: number;
    status?: string;
  }): Promise<BackendResponse<any>> {
    return this.makeRequest('/cliente/financeiro', {
      cnpjcpf: cnpjcpf.replace(/\D/g, ''),
      ...filtros
    });
  }

  // ==================== COLETA ====================

  // Criar nova coleta
  async criarColeta(coletaData: ColetaPayload): Promise<BackendResponse<ColetaResponse>> {
    return this.makeRequest('/coleta/criar', coletaData);
  }

  // Atualizar coleta existente
  async atualizarColeta(idColeta: number, coletaData: ColetaPayload): Promise<BackendResponse<ColetaResponse>> {
    return this.makeRequest('/coleta/editar', { idColeta, ...coletaData });
  }

  // Buscar detalhes da coleta (apenas leitura - para abrir modal de edição)
  async buscarDetalhesColeta(idColeta: number): Promise<BackendResponse<any>> {
    return this.makeRequest('/coleta/detalhes', { idColeta });
  }

  // Buscar dados completos para edição de coleta (via DB Frete API) - DEPRECATED: use buscarDetalhesColeta
  async buscarColetaParaEditar(idColeta: number): Promise<BackendResponse<any>> {
    return this.buscarDetalhesColeta(idColeta);
  }

  // Salvar edição de coleta (via edge function editar-coleta)
  async salvarEdicaoColeta(coletaData: any): Promise<BackendResponse<any>> {
    return this.makeRequest('/coleta/editar', coletaData);
  }

  // Buscar coletas (admin - envia em filtros com empresas)
  async buscarColetas(filtros: {
    empresas?: string;
    idColeta?: number;
    idRemetente?: number;
    idDestinatario?: number;
    dataInicio?: string;
    dataFim?: string;
    status?: string;
    cidadeOrigem?: string;
    cidadeDestino?: string;
    solicitante?: string;
    coleta_inicio?: string;
    coleta_fim?: string;
    nro_coleta_inicio?: string;
    nro_coleta_fim?: string;
    id_remetente?: string;
    id_destinatario?: string;
    coleta_id_cidade?: string;
    DEST_ID_CIDADE?: string;
    coleta_uf?: string;
    emissao_inicio?: string;
    emissao_fim?: string;
    tipo_registro?: string;
  }): Promise<BackendResponse<any>> {
    return this.makeRequest('/coleta/buscar', { filtros });
  }

  // Buscar coletas do cliente (área cliente - envia cnpjcpf direto)
  async buscarColetasCliente(cnpjcpf: string): Promise<BackendResponse<any>> {
    return this.makeRequest('/coleta/buscar', { 
      cnpjcpf: cnpjcpf.replace(/\D/g, ''),
      idEmpresa: 2
    });
  }

  // Gerar PDF de coleta
  async gerarPdfColeta(idColeta: number): Promise<BackendResponse<Blob>> {
    try {
      this.requestId = crypto.randomUUID();
      const url = getBackendUrl('/coleta/pdf');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), BACKEND_CONFIG.timeout);

      const headers = {
        ...BACKEND_CONFIG.headers,
        'X-Request-ID': this.requestId,
        'X-Timestamp': new Date().toISOString()
      };

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ idColeta }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type');

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      
      // Se retornar PDF
      if (contentType?.includes('application/pdf')) {
        const blob = await response.blob();
        return { success: true, data: blob };
      }

      // Se retornar JSON com URL do PDF ou base64
      const result = await response.json();
      
      if (result.pdfUrl) {
        const pdfResponse = await fetch(result.pdfUrl);
        const blob = await pdfResponse.blob();
        return { success: true, data: blob };
      }
      
      if (result.pdfBase64) {
        const byteCharacters = atob(result.pdfBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        return { success: true, data: blob };
      }

      return { success: false, error: result.error || 'Formato de resposta não suportado' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao gerar PDF'
      };
    }
  }

  // Health check
  async healthCheck(): Promise<BackendResponse<{ status: string; timestamp: string }>> {
    try {
      const url = getBackendUrl('/health');
      const response = await fetch(url);
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Backend indisponível' };
    }
  }

  // ==================== DRE ====================

  // Buscar dados DRE via API externa
  async buscarDRE(filtros: DREFiltros): Promise<BackendResponse<{
    lancamentos: DRELancamento[];
    resumo: DRESummary;
  }>> {
    try {
      const result = await this.makeRequest<any>('/financeiro/dre', {
        filtros: {
          empresas: filtros.empresas || [1, 2],
          regime: filtros.regime || 'competencia-cte',
          dataInicial: filtros.dataInicial,
          dataFinal: filtros.dataFinal
        },
        acao: 'buscar'
      });

      if (!result.success) {
        return { success: false, error: result.error || 'Erro ao buscar DRE' };
      }

      const data = result.data;

      return {
        success: true,
        data: {
          lancamentos: data?.lancamentos || [],
          resumo: data?.resumo || {
            totalReceitas: 0,
            totalDespesas: 0,
            qtdReceitas: 0,
            qtdDespesas: 0,
            resultado: 0,
            margem: 0,
          }
        }
      };
    } catch (error) {
      console.error('Erro ao buscar DRE:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  // ==================== CALENDÁRIO FINANCEIRO ====================

  // Buscar dados do calendário financeiro via API externa
  async buscarCalendarioFinanceiro(filtros: CalendarioFiltros): Promise<BackendResponse<{
    dias: DayData[];
    resumo: FinancialSummary;
    items?: DayDetailItem[];
  }>> {
    try {
      const result = await this.makeRequest<any>('/financeiro/calendario-financeiro', {
        filtros: {
          empresa: filtros.empresa || '',
          status: filtros.status || 'todos',
          contrato: filtros.contrato || 'todos',
          dataEmissaoInicio: filtros.dataEmissaoInicio || null,
          dataEmissaoFim: filtros.dataEmissaoFim || null,
          dataVencimentoInicio: filtros.dataVencimentoInicio || null,
          dataVencimentoFim: filtros.dataVencimentoFim || null,
          dataPagamentoInicio: filtros.dataPagamentoInicio || null,
          dataPagamentoFim: filtros.dataPagamentoFim || null,
          mes: filtros.mes,
          ano: filtros.ano
        },
        modoVisualizacao: filtros.modoVisualizacao || 'titulos',
        acao: 'buscar'
      });

      if (!result.success) {
        return { success: false, error: result.error || 'Erro ao buscar calendário financeiro' };
      }

      const data = result.data;

      return {
        success: true,
        data: {
          dias: data?.dias || [],
          resumo: data?.resumo || {
            totalReceitas: 0,
            receitasRecebidas: 0,
            receitasAReceber: 0,
            totalDespesas: 0,
            despesasPagas: 0,
            despesasAPagar: 0,
          },
          items: data?.items,
        }
      };
    } catch (error) {
      console.error('Erro ao buscar calendário financeiro:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  // Buscar detalhes de um dia específico via API externa
  async buscarDetalheDia(params: {
    data: string;
    tipo: 'receita' | 'despesa';
    empresa?: string;
  }): Promise<BackendResponse<DayDetailItem[]>> {
    try {
      const result = await this.makeRequest<any>('/financeiro/calendario-financeiro', {
        filtros: {
          empresa: params.empresa || ''
        },
        acao: 'detalhe-dia',
        data: params.data,
        tipo: params.tipo
      });

      if (!result.success) {
        return { success: false, error: result.error || 'Erro ao buscar detalhes' };
      }

      return {
        success: true,
        data: result.data?.items || []
      };
    } catch (error) {
      console.error('Erro ao buscar detalhe do dia:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  // ==================== DRE IA ====================

  // Análise inteligente do DRE com IA
  async analisarDREComIA(params: {
    prompt: string;
    contexto: string;
    nivel: 'simples' | 'medio' | 'completo';
  }): Promise<BackendResponse<{
    data: any;
    raw: string;
  }>> {
    try {
      const result = await this.makeRequest<any>('/financeiro/dre/ia', {
        prompt: params.prompt,
        contexto: params.contexto,
        nivel: params.nivel
      });

      if (!result.success) {
        return { success: false, error: result.error || 'Erro na análise com IA' };
      }

      return {
        success: true,
        data: {
          data: result.data?.data || result.data,
          raw: result.data?.raw || ''
        }
      };
    } catch (error) {
      console.error('Erro na análise DRE com IA:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }
}

export const backendService = new BackendService();
