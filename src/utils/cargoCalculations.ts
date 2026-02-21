/**
 * Calcula o peso cubado de um item
 * Fórmula: (Altura x Comprimento x Largura x Quantidade) / 300
 * 
 * @param altura - Altura em cm
 * @param comprimento - Comprimento em cm
 * @param largura - Largura em cm
 * @param quantidade - Quantidade de volumes
 * @returns Peso cubado em kg
 */
export const calcularPesoCubado = (
  altura: number,
  comprimento: number,
  largura: number,
  quantidade: number
): number => {
  const FATOR_CUBAGEM = 300;
  const pesoCubado = (altura * comprimento * largura * quantidade) / FATOR_CUBAGEM;
  return Math.round(pesoCubado * 100) / 100; // Arredondar para 2 casas decimais
};

/**
 * Estrutura os dados de carga para envio ao N8N
 */
export interface ItemCarga {
  descricao: string;
  peso: number;
  quantidade: number;
  valor: number;
  dimensoes: {
    altura: number;
    comprimento: number;
    largura: number;
  };
  pesoCubado: number;
}

export interface CargaEstuturada {
  descricao: string;
  pesoTotal: number;
  quantidadeTotal: number;
  valorTotal: number;
  pesoCubadoTotal: number;
  itens: ItemCarga[];
}

/**
 * Cria estrutura de carga organizada para envio ao N8N
 */
export const estruturarCarga = (
  descricao: string,
  peso: number,
  quantidade: number,
  valor: number,
  dimensoes: {
    altura: number;
    comprimento: number;
    largura: number;
  }
): CargaEstuturada => {
  const pesoCubado = calcularPesoCubado(
    dimensoes.altura,
    dimensoes.comprimento,
    dimensoes.largura,
    quantidade
  );

  const item: ItemCarga = {
    descricao,
    peso,
    quantidade,
    valor,
    dimensoes,
    pesoCubado
  };

  return {
    descricao,
    pesoTotal: peso,
    quantidadeTotal: quantidade,
    valorTotal: valor,
    pesoCubadoTotal: pesoCubado,
    itens: [item]
  };
};
