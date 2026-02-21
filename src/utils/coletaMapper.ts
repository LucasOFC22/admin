// Mapper para converter dados do formulário para o formato da API /coleta/criar

import { PickupFormData } from "@/schemas/pickupFormSchema";
import { ColetaPayload, ColetaItemPayload } from "@/types/coleta.types";

interface MapperOptions {
  idEmpresa?: number;
  idRemetente?: number;
  idDestinatario?: number;
  idCidadeOrigem?: number;
  idCidadeDestino?: number;
  notasFiscais?: string[];
}

export function mapPickupFormToColetaPayload(
  data: PickupFormData,
  options: MapperOptions = {}
): ColetaPayload {
  const {
    idEmpresa = 2,
    idRemetente = 0,
    idDestinatario = 0,
    idCidadeOrigem = 0,
    idCidadeDestino = 0,
    notasFiscais = []
  } = options;

  // Extrair UF da cidade (formato esperado: "Cidade - UF" ou só "Cidade")
  const extractUf = (cidade: string): string => {
    const match = cidade.match(/\s*-\s*([A-Z]{2})$/i);
    return match ? match[1].toUpperCase() : '';
  };

  const extractCidade = (cidade: string): string => {
    return cidade.replace(/\s*-\s*[A-Z]{2}$/i, '').trim();
  };

  // Calcular dimensões em m³ (comprimento x largura x altura x volumes)
  const altura = parseFloat(data.mercadoria.dimensoes.altura) || 0;
  const largura = parseFloat(data.mercadoria.dimensoes.largura) || 0;
  const comprimento = parseFloat(data.mercadoria.dimensoes.comprimento) || 0;
  const volumes = parseFloat(data.mercadoria.quantidade) || 1;
  const m3 = comprimento * largura * altura * volumes;
  const pesoCubado = m3 * 300; // Fator cubagem padrão

  // Criar item da mercadoria
  const item: ColetaItemPayload = {
    peso: parseFloat(data.mercadoria.peso) || 0,
    valorMercadoria: parseFloat(data.mercadoria.valor.replace(/\D/g, '')) / 100 || 0,
    tipoMercadoria: data.mercadoria.descricao || '',
    natureza: data.mercadoria.natureza || '',
    volume: volumes,
    altura,
    largura,
    profundidade: comprimento,
    m3: parseFloat(m3.toFixed(4)),
    pesoCubado: parseFloat(pesoCubado.toFixed(2)),
    observacoes: data.observacoes || '',
    chaveAcessoNfe: notasFiscais[0] || '',
    numeroNf: notasFiscais.join(', '),
    un: 'kg'
  };

  return {
    idEmpresa,
    tipoRegistro: 'coleta',
    status: 'PENDENTE',
    idRemetente,
    idDestinatario,
    idCidadeOrigem,
    idCidadeDestino,
    nomeSolicitante: data.solicitante.nome,
    dataColeta: new Date().toISOString().split('T')[0],
    dataPrevisaoEntrega: null,
    horarioColeta: data.coleta.horarioFuncionamento?.inicio || '',
    horarioInicioAtendimento: data.coleta.horarioFuncionamento?.inicio || '',
    horarioFimAtendimento: data.coleta.horarioFuncionamento?.fim || '',
    paraAlmoco: false,
    horarioInicioAlmoco: data.coleta.horarioAlmoco?.inicio || '',
    horarioFimAlmoco: data.coleta.horarioAlmoco?.fim || '',
    observacoes: '',
    localColeta: {
      cep: data.coleta.cep.replace(/\D/g, ''),
      endereco: `${data.coleta.rua}, ${data.coleta.numero}${data.coleta.complemento ? ` - ${data.coleta.complemento}` : ''}`,
      bairro: data.coleta.bairro,
      cidade: extractCidade(data.coleta.cidade),
      uf: extractUf(data.coleta.cidade),
      idCidade: idCidadeOrigem
    },
    localEntrega: {
      cep: data.destinatario.cep.replace(/\D/g, ''),
      endereco: `${data.destinatario.rua}, ${data.destinatario.numero}${data.destinatario.complemento ? ` - ${data.destinatario.complemento}` : ''}`,
      bairro: data.destinatario.bairro,
      cidade: extractCidade(data.destinatario.cidade),
      uf: extractUf(data.destinatario.cidade),
      idCidade: idCidadeDestino
    },
    itens: [item]
  };
}
