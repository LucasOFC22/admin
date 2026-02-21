// Schemas de validação seguros com proteção contra ataques
import { z } from 'zod';
import { validators, sanitizeInput, VALIDATION_LIMITS } from '@/utils/validators';

// Transformadores seguros para sanitização automática
const secureStringTransform = z.string().transform((val) => sanitizeInput.text(val));
const secureEmailTransform = z.string().transform((val) => sanitizeInput.email(val));
const securePhoneTransform = z.string().transform((val) => sanitizeInput.phone(val));
const secureNumericTransform = z.string().transform((val) => sanitizeInput.numeric(val));

// Validações customizadas seguras
const createSecureString = (minLength: number = 1, maxLength: number = VALIDATION_LIMITS.MESSAGE_MAX_LENGTH) =>
  z.string()
    .min(minLength, `Deve ter pelo menos ${minLength} caracteres`)
    .max(maxLength, `Deve ter no máximo ${maxLength} caracteres`)
    .transform((val) => sanitizeInput.text(val))
    .refine((val) => val.length >= minLength, {
      message: `Campo obrigatório (mínimo ${minLength} caracteres após sanitização)`
    });

const createSecureEmail = () =>
  z.string()
    .max(VALIDATION_LIMITS.EMAIL_MAX_LENGTH, `Email muito longo (máximo ${VALIDATION_LIMITS.EMAIL_MAX_LENGTH} caracteres)`)
    .transform((val) => sanitizeInput.email(val))
    .refine((val) => validators.email(val), {
      message: "Email inválido"
    });

const createSecureCPFCNPJ = () =>
  z.string()
    .min(11, "CPF/CNPJ deve ter pelo menos 11 dígitos")
    .max(18, "CPF/CNPJ muito longo")
    .transform((val) => sanitizeInput.numeric(val))
    .refine((val) => validators.cpf(val) || validators.cnpj(val), {
      message: "CPF ou CNPJ inválido"
    });

const createSecurePhone = () =>
  z.string()
    .min(10, "Telefone deve ter pelo menos 10 dígitos")
    .max(VALIDATION_LIMITS.PHONE_MAX_LENGTH, `Telefone muito longo (máximo ${VALIDATION_LIMITS.PHONE_MAX_LENGTH} caracteres)`)
    .transform((val) => sanitizeInput.phone(val))
    .refine((val) => validators.phone(val), {
      message: "Telefone inválido"
    });

const createSecureCEP = () =>
  z.string()
    .min(8, "CEP deve ter 8 dígitos")
    .max(9, "CEP muito longo")
    .transform((val) => sanitizeInput.numeric(val))
    .refine((val) => validators.cep(val), {
      message: "CEP inválido"
    });

const createSecureWeight = () =>
  secureNumericTransform
    .refine((val) => validators.weight(val), {
      message: `Peso inválido (máximo ${VALIDATION_LIMITS.WEIGHT_MAX}kg)`
    });

const createSecureDimension = () =>
  secureNumericTransform
    .refine((val) => validators.dimension(val), {
      message: `Dimensão inválida (máximo ${VALIDATION_LIMITS.DIMENSION_MAX}cm)`
    });

const createSecureMonetaryValue = () =>
  secureNumericTransform
    .refine((val) => validators.monetaryValue(val), {
      message: `Valor inválido (máximo R$ ${VALIDATION_LIMITS.VALUE_MAX.toLocaleString()})`
    });

// Schema seguro para endereço
export const secureAddressSchema = z.object({
  zipcode: createSecureCEP(),
  street: createSecureString(3, VALIDATION_LIMITS.ADDRESS_MAX_LENGTH),
  number: createSecureString(1, 10),
  complement: createSecureString(0, 100).optional(),
  neighborhood: createSecureString(2, 100),
  city: createSecureString(2, 100),
  state: createSecureString(2, 50),
});

// Schema seguro para informações de contato
export const secureContactInfoSchema = z.object({
  name: createSecureString(2, VALIDATION_LIMITS.NAME_MAX_LENGTH),
  email: createSecureEmail(),
  phone: createSecurePhone().optional(),
});

// Schema seguro para horário de funcionamento
export const secureWorkingHoursSchema = z.object({
  from: z.string()
    .min(1, "Horário de início obrigatório")
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de horário inválido (HH:MM)"),
  to: z.string()
    .min(1, "Horário de fim obrigatório")
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de horário inválido (HH:MM)"),
}).refine((data) => data.to > data.from, {
  message: "Horário de fim deve ser posterior ao horário de início",
  path: ["to"],
});

// Schema seguro para informações de pessoa/empresa
export const securePartyInfoSchema = z.object({
  name: createSecureString(2, VALIDATION_LIMITS.NAME_MAX_LENGTH),
  document: createSecureCPFCNPJ(),
  address: secureAddressSchema,
});

// Schema seguro para informações de carga
export const secureCargoSchema = z.object({
  description: createSecureString(5, VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH),
  weight: createSecureWeight(),
  height: createSecureDimension(),
  length: createSecureDimension(),
  depth: createSecureDimension(),
  declaredValue: createSecureMonetaryValue(),
  freightType: z.enum(["fob", "cif"], {
    errorMap: () => ({ message: "Tipo de frete deve ser FOB ou CIF" })
  }).default("fob"),
  notes: createSecureString(0, VALIDATION_LIMITS.MESSAGE_MAX_LENGTH).optional(),
});

// Schema seguro para coleta
export const securePickupSchema = z.object({
  needsPickup: z.boolean().default(false),
  contactName: createSecureString(2, VALIDATION_LIMITS.NAME_MAX_LENGTH).optional(),
  address: secureAddressSchema.optional(),
  workingHours: secureWorkingHoursSchema.optional(),
  lunchBreak: secureWorkingHoursSchema.optional(),
}).superRefine((data, ctx) => {
  // Validação condicional quando needsPickup é true
  if (!data.needsPickup) return;
  
  if (!data.contactName) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Nome ou empresa no local da coleta é obrigatório",
      path: ["contactName"],
    });
  }
  
  if (!data.address) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Endereço é obrigatório para coleta",
      path: ["address"],
    });
  }
  
  if (!data.workingHours) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Horário de funcionamento é obrigatório para coleta",
      path: ["workingHours"],
    });
  }
});

// Schema seguro para contato
export const secureContactFormSchema = z.object({
  name: createSecureString(2, VALIDATION_LIMITS.NAME_MAX_LENGTH),
  email: createSecureEmail(),
  phone: createSecurePhone(),
  message: createSecureString(0, VALIDATION_LIMITS.MESSAGE_MAX_LENGTH).optional(),
  requestorType: z.enum(["Remetente", "Destinatario", "Outros"], {
    errorMap: () => ({ message: "Tipo de solicitante inválido" })
  }).default("Outros"),
});

// Schema seguro completo para cotação
export const secureQuoteFormSchema = z.object({
  cargo: secureCargoSchema,
  pickup: securePickupSchema,
  sender: securePartyInfoSchema,
  recipient: securePartyInfoSchema,
  contact: secureContactFormSchema,
});

// Schema seguro para formulário de pickup
export const securePickupFormSchema = z.object({
  solicitante: secureContactInfoSchema,
  coleta: z.object({
    rua: createSecureString(3, VALIDATION_LIMITS.ADDRESS_MAX_LENGTH),
    numero: createSecureString(1, 10),
    complemento: createSecureString(0, 100).optional(),
    cidade: createSecureString(2, 100),
    bairro: createSecureString(2, 100),
    cep: createSecureCEP(),
    pontoReferencia: createSecureString(0, 200).optional(),
    horarioFuncionamento: secureWorkingHoursSchema,
    horarioAlmoco: secureWorkingHoursSchema.optional(),
  }),
  mercadoria: z.object({
    descricao: createSecureString(5, VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH),
    peso: createSecureWeight(),
    valor: createSecureMonetaryValue(),
    quantidade: createSecureString(1, 20),
    dimensoes: z.object({
      comprimento: createSecureDimension(),
      largura: createSecureDimension(),
      altura: createSecureDimension(),
    }),
  }),
  remetente: securePartyInfoSchema.extend({
    empresa: createSecureString(2, VALIDATION_LIMITS.NAME_MAX_LENGTH),
  }),
  destinatario: securePartyInfoSchema.extend({
    empresa: createSecureString(2, VALIDATION_LIMITS.NAME_MAX_LENGTH),
  }),
  observacoes: createSecureString(0, VALIDATION_LIMITS.MESSAGE_MAX_LENGTH).optional(),
});

// Schema seguro para proposta
export const securePropostaSchema = z.object({
  valorProposta: createSecureMonetaryValue(),
  prazoEntrega: createSecureString(1, 100),
  validade: createSecureString(1, 100),
  detalhes: createSecureString(0, VALIDATION_LIMITS.MESSAGE_MAX_LENGTH).optional(),
  responsavel: createSecureString(0, VALIDATION_LIMITS.NAME_MAX_LENGTH).optional(),
  templateText: createSecureString(0, VALIDATION_LIMITS.MESSAGE_MAX_LENGTH).optional(),
});

// Schema seguro para chat de contato simples
export const secureChatContactSchema = z.object({
  name: createSecureString(2, VALIDATION_LIMITS.NAME_MAX_LENGTH),
  email: createSecureEmail().optional(),
  phone: createSecurePhone().optional(),
}).refine((data) => data.email || data.phone, {
  message: "Email ou telefone deve ser fornecido",
  path: ["email"],
});

// Tipos TypeScript derivados dos schemas seguros
export type SecureQuoteFormData = z.infer<typeof secureQuoteFormSchema>;
export type SecurePickupFormData = z.infer<typeof securePickupFormSchema>;
export type SecureContactFormData = z.infer<typeof secureContactFormSchema>;
export type SecurePropostaFormData = z.infer<typeof securePropostaSchema>;
export type SecureChatContactData = z.infer<typeof secureChatContactSchema>;
export type SecureAddressData = z.infer<typeof secureAddressSchema>;
export type SecureCargoData = z.infer<typeof secureCargoSchema>;

// Função auxiliar para validação segura com log de tentativas suspeitas
export const validateSecurely = <T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): { success: boolean; data?: T; errors?: z.ZodError; warnings?: string[] } => {
  const warnings: string[] = [];
  
  try {
    // Log tentativas suspeitas
    if (typeof data === 'object' && data !== null) {
      const jsonString = JSON.stringify(data);
      
      // Detectar tentativas de injection
      const suspiciousPatterns = [
        /<script|javascript:|vbscript:/gi,
        /union\s+select|drop\s+table|insert\s+into/gi,
        /alert\s*\(|confirm\s*\(|prompt\s*\(/gi
      ];
      
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(jsonString)) {
          console.warn(`🚨 Tentativa suspeita detectada em ${context || 'formulário'}:`, {
            pattern: pattern.source,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
          });
          warnings.push('Entrada suspeita detectada e sanitizada');
          break;
        }
      }
    }
    
    const result = schema.parse(data);
    return { success: true, data: result, warnings };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error, warnings };
    }
    throw error;
  }
};