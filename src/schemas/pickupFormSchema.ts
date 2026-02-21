import { z } from "zod";

export const pickupFormSchema = z.object({
  solicitante: z.object({
    nome: z.string().min(1, "Nome é obrigatório"),
    telefone: z.string().min(1, "Telefone é obrigatório"),
    email: z.string().email("Email inválido"),
  }),
  coleta: z.object({
    rua: z.string().min(1, "Rua é obrigatória"),
    numero: z.string().min(1, "Número é obrigatório"),
    complemento: z.string().optional(),
    cidade: z.string().min(1, "Cidade é obrigatória"),
    estado: z.string().min(1, "Estado é obrigatório"),
    bairro: z.string().min(1, "Bairro é obrigatório"),
    cep: z.string().min(1, "CEP é obrigatório"),
    pontoReferencia: z.string().optional(),
    horarioFuncionamento: z.object({
      inicio: z.string().min(1, "Horário de início é obrigatório"),
      fim: z.string().min(1, "Horário de fim é obrigatório"),
    }),
    horarioAlmoco: z.object({
      inicio: z.string().optional(),
      fim: z.string().optional(),
    }),
  }),
  mercadoria: z.object({
    descricao: z.string().min(1, "Descrição é obrigatória"),
    natureza: z.string().optional(),
    peso: z.string().min(1, "Peso é obrigatório"),
    valor: z.string().min(1, "Valor é obrigatório"),
    quantidade: z.string().min(1, "Quantidade é obrigatória"),
    dimensoes: z.object({
      comprimento: z.string().min(1, "Comprimento é obrigatório"),
      largura: z.string().min(1, "Largura é obrigatória"),
      altura: z.string().min(1, "Altura é obrigatória"),
    }),
  }),
  remetente: z.object({
    empresa: z.string().min(1, "Nome da empresa é obrigatório"),
    telefone: z.string().min(1, "Telefone é obrigatório"),
    documento: z.string().min(1, "CPF/CNPJ é obrigatório"),
    rua: z.string().min(1, "Rua é obrigatória"),
    numero: z.string().min(1, "Número é obrigatório"),
    complemento: z.string().optional(),
    cidade: z.string().min(1, "Cidade é obrigatória"),
    estado: z.string().min(1, "Estado é obrigatório"),
    bairro: z.string().min(1, "Bairro é obrigatório"),
    cep: z.string().min(1, "CEP é obrigatório"),
  }),
  destinatario: z.object({
    empresa: z.string().min(1, "Nome da empresa é obrigatório"),
    telefone: z.string().min(1, "Telefone é obrigatório"),
    documento: z.string().min(1, "CPF/CNPJ é obrigatório"),
    rua: z.string().min(1, "Rua é obrigatória"),
    numero: z.string().min(1, "Número é obrigatório"),
    complemento: z.string().optional(),
    cidade: z.string().min(1, "Cidade é obrigatória"),
    estado: z.string().min(1, "Estado é obrigatório"),
    bairro: z.string().min(1, "Bairro é obrigatório"),
    cep: z.string().min(1, "CEP é obrigatório"),
  }),
  observacoes: z.string().optional(),
});

export type PickupFormData = z.infer<typeof pickupFormSchema>;

// Valores padrão do formulário
export const pickupFormDefaultValues: PickupFormData = {
  solicitante: {
    nome: '',
    telefone: '',
    email: '',
  },
  coleta: {
    rua: '',
    numero: '',
    complemento: '',
    cidade: '',
    estado: '',
    bairro: '',
    cep: '',
    pontoReferencia: '',
    horarioFuncionamento: {
      inicio: '',
      fim: '',
    },
    horarioAlmoco: {
      inicio: '',
      fim: '',
    },
  },
  mercadoria: {
    descricao: '',
    natureza: '',
    peso: '',
    valor: '',
    quantidade: '',
    dimensoes: {
      comprimento: '',
      largura: '',
      altura: '',
    },
  },
  remetente: {
    empresa: '',
    telefone: '',
    documento: '',
    rua: '',
    numero: '',
    complemento: '',
    cidade: '',
    estado: '',
    bairro: '',
    cep: '',
  },
  destinatario: {
    empresa: '',
    telefone: '',
    documento: '',
    rua: '',
    numero: '',
    complemento: '',
    cidade: '',
    estado: '',
    bairro: '',
    cep: '',
  },
  observacoes: '',
};