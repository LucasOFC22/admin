
import { SupabaseCotacao } from '@/types/supabase-cotacao';
import { format } from 'date-fns';

export interface MappedQuote {
  id: string;
  quoteId: string;
  senderName: string;
  senderDocument: string;
  recipientName: string;
  recipientDocument: string;
  origin: string;
  destination: string;
  cargoType: string;
  weight: string;
  value: number;
  status: string;
  createdAt: string;
  validUntil: string;
  // Estrutura correta para o modal
  contato: {
    nome: string;
    email: string;
    telefone?: string;
  };
  remetente: {
    nome: string;
    documento: string;
    endereco: {
      rua: string;
      numero: string;
      cidade: string;
      estado: string;
      cep: string;
      bairro?: string;
      complemento?: string;
    };
  };
  destinatario: {
    nome: string;
    documento: string;
    endereco: {
      rua: string;
      numero: string;
      cidade: string;
      estado: string;
      cep: string;
      bairro?: string;
      complemento?: string;
    };
  };
  carga: {
    descricao: string;
    peso: number;
    valorDeclarado: number;
    altura?: number;
    comprimento?: number;
    profundidade?: number;
  };
  coleta?: {
    endereco: {
      rua: string;
      numero: string;
      cidade: string;
      estado: string;
      cep: string;
      bairro?: string;
      complemento?: string;
    };
    horarios: {
      inicio?: string;
      fim?: string;
      almocoInicio?: string;
      almocoFim?: string;
    };
    necessita: boolean;
  };
  observacoes?: string;
  adminQuoteLink?: string;
  criadoEm: Date | string;
}

export const mapSupabaseCotacao = (cotacao: SupabaseCotacao): MappedQuote => {
  const legacyId = (cotacao as any).idOrcamento ?? (cotacao as any).nroOrcamento;
  const primaryId = cotacao.id ?? legacyId ?? 'sem-id';
  const quoteNumber = (cotacao as any).nroOrcamento ?? primaryId;
  
  // Formatar data para exibição
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const { formatDateTime } = require('@/utils/dateFormatters');
    return formatDateTime(dateString);
  };

  // Montar endereço origem e destino para exibição simples (Supabase ou legado)
  const origemCidade = cotacao.remetente_cidade || cotacao.coleta_cidade || (cotacao as any).cidadeOrigem || 'N/A';
  const origemEstado = cotacao.remetente_estado || cotacao.coleta_estado || (cotacao as any).uf_origem || (cotacao as any).ufOrigem || 'N/A';
  const destinoCidade = cotacao.destinatario_cidade || (cotacao as any).cidadeDestino || 'N/A';
  const destinoEstado = cotacao.destinatario_estado || (cotacao as any).uf_destino || (cotacao as any).ufDestino || 'N/A';

  const origem = `${origemCidade}, ${origemEstado}`;
  const destino = `${destinoCidade}, ${destinoEstado}`;

  const mappedQuote = {
    id: String(primaryId),
    quoteId: String(quoteNumber).substring(0, 8),
    senderName: cotacao.remetente_nome || cotacao.contato_nome || (cotacao as any).remetenteNome || (cotacao as any).solicitante || 'N/A',
    senderDocument: cotacao.remetente_documento || (cotacao as any).remetenteDocumento || 'N/A',
    recipientName: cotacao.destinatario_nome || (cotacao as any).destinatarioNome || 'N/A',
    recipientDocument: cotacao.destinatario_documento || (cotacao as any).destinatarioDocumento || 'N/A',
    origin: origem,
    destination: destino,
    cargoType: cotacao.tipo_frete === 'fob'
      ? 'FOB'
      : cotacao.tipo_frete === 'cif'
      ? 'CIF'
      : (cotacao.tipo_frete || (cotacao as any).descTabela || cotacao.descricao || 'N/A'),
    weight: cotacao.peso ? `${cotacao.peso} kg` : 'N/A',
    value: cotacao.valor_declarado ?? (cotacao as any).vlrTotal ?? 0,
    status: cotacao.status || 'pendente',
    createdAt: formatDate(cotacao.criado_em || (cotacao as any).emissao),
    validUntil: 'N/A',
    criadoEm: cotacao.criado_em || (cotacao as any).emissao || new Date().toISOString(),
    
    // Estrutura detalhada para o modal
    contato: {
      nome: cotacao.contato_nome || 'N/A',
      email: cotacao.contato_email || 'N/A',
      telefone: cotacao.contato_telefone,
    },
    
    remetente: {
      nome: cotacao.remetente_nome || 'N/A',
      documento: cotacao.remetente_documento || 'N/A',
      endereco: {
        rua: cotacao.remetente_rua || 'N/A',
        numero: cotacao.remetente_numero || 'N/A',
        cidade: cotacao.remetente_cidade || 'N/A',
        estado: cotacao.remetente_estado || 'N/A',
        cep: cotacao.remetente_cep || 'N/A',
        bairro: cotacao.remetente_bairro,
        complemento: cotacao.remetente_complemento,
      },
    },
    
    destinatario: {
      nome: cotacao.destinatario_nome || 'N/A',
      documento: cotacao.destinatario_documento || 'N/A',
      endereco: {
        rua: cotacao.destinatario_rua || 'N/A',
        numero: cotacao.destinatario_numero || 'N/A',
        cidade: cotacao.destinatario_cidade || 'N/A',
        estado: cotacao.destinatario_estado || 'N/A',
        cep: cotacao.destinatario_cep || 'N/A',
        bairro: cotacao.destinatario_bairro,
        complemento: cotacao.destinatario_complemento,
      },
    },
    
    carga: {
      descricao: cotacao.descricao || cotacao.tipo_frete || 'N/A',
      peso: cotacao.peso || 0,
      valorDeclarado: cotacao.valor_declarado || 0,
      altura: cotacao.altura,
      comprimento: cotacao.comprimento,
      profundidade: cotacao.profundidade,
    },
    
    coleta: cotacao.necessita_coleta ? {
      endereco: {
        rua: cotacao.coleta_rua || 'N/A',
        numero: cotacao.coleta_numero || 'N/A',
        cidade: cotacao.coleta_cidade || 'N/A',
        estado: cotacao.coleta_estado || 'N/A',
        cep: cotacao.coleta_cep || 'N/A',
        bairro: cotacao.coleta_bairro,
        complemento: cotacao.coleta_complemento,
      },
      horarios: {
        inicio: cotacao.horario_inicio,
        fim: cotacao.horario_fim,
        almocoInicio: cotacao.almoco_inicio,
        almocoFim: cotacao.almoco_fim,
      },
      necessita: cotacao.necessita_coleta || false,
    } : undefined,
    
    observacoes: cotacao.contato_mensagem || cotacao.descricao,
    adminQuoteLink: cotacao.adminQuoteLink,
  };
  
  return mappedQuote;
};

export const mapSupabaseCotacoes = (cotacoes: SupabaseCotacao[]): MappedQuote[] => {
  return cotacoes.map(mapSupabaseCotacao);
};
