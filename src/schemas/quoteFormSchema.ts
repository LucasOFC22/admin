

import { z } from "zod";

export const priceTableSchema = z.object({
  idTabela: z.number().optional(),
  descricao: z.string().optional(),
  validade: z.string().optional(),
  somaIcm: z.enum(['S', 'N']).optional(),
});

export const cargoFormSchema = z.object({
  description: z.string().min(1, "Descrição da carga é obrigatória"),
  weight: z.string().min(1, "Peso é obrigatório").transform((val) => parseFloat(val) || 0),
  height: z.string().min(1, "Altura é obrigatória").transform((val) => parseFloat(val) || 0),
  length: z.string().min(1, "Comprimento é obrigatório").transform((val) => parseFloat(val) || 0),
  depth: z.string().min(1, "Profundidade é obrigatória").transform((val) => parseFloat(val) || 0),
  declaredValue: z.string().min(1, "Valor declarado é obrigatório").transform((val) => parseFloat(val) || 0),
  freightType: z.enum(["fob", "cif"]).default("fob"),
  notes: z.string().optional(),
  priceTable: priceTableSchema.optional(),
});

export const addressSchema = z.object({
  zipcode: z.string().min(1, "CEP obrigatório"),
  street: z.string().min(1, "Rua obrigatória"),
  number: z.string().min(1, "Número obrigatório"),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, "Bairro obrigatório"),
  city: z.string().min(1, "Cidade obrigatória"),
  state: z.string().min(1, "Estado obrigatório"),
});

export const workingHoursSchema = z.object({
  from: z.string().min(1, "Horário de início obrigatório"),
  to: z.string().min(1, "Horário de fim obrigatório"),
}).refine((data) => {
  if (!data.from || !data.to) return true;
  return data.to > data.from;
}, {
  message: "Horário de fim deve ser posterior ao horário de início",
  path: ["to"],
});

export const pickupSchema = z.object({
  needsPickup: z.boolean().default(false),
  contactName: z.string().optional(),
  address: z.object({
    zipcode: z.string().optional(),
    street: z.string().optional(),
    number: z.string().optional(),
    complement: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
  }).optional(),
  workingHours: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
  }).optional(),
  lunchBreak: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
  }).optional(),
}).superRefine((data, ctx) => {
  // Se needsPickup for false, não validar os outros campos
  if (!data.needsPickup) return;
  
  // Se needsPickup for true, validar os campos obrigatórios
  if (!data.contactName || data.contactName.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_small,
      minimum: 1,
      type: "string",
      inclusive: true,
      message: "Nome ou empresa no local da coleta é obrigatório",
      path: ["contactName"],
    });
  }
  
  if (!data.address) {
    ctx.addIssue({
      code: z.ZodIssueCode.invalid_type,
      expected: "object",
      received: "undefined",
      message: "Endereço é obrigatório para coleta",
      path: ["address"],
    });
    return;
  }
  
  // Validar campos do endereço
  if (!data.address.zipcode || data.address.zipcode.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_small,
      minimum: 1,
      type: "string",
      inclusive: true,
      message: "CEP obrigatório",
      path: ["address", "zipcode"],
    });
  }
  
  if (!data.address.street || data.address.street.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_small,
      minimum: 1,
      type: "string",
      inclusive: true,
      message: "Rua obrigatória",
      path: ["address", "street"],
    });
  }
  
  if (!data.address.number || data.address.number.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_small,
      minimum: 1,
      type: "string",
      inclusive: true,
      message: "Número obrigatório",
      path: ["address", "number"],
    });
  }
  
  if (!data.address.neighborhood || data.address.neighborhood.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_small,
      minimum: 1,
      type: "string",
      inclusive: true,
      message: "Bairro obrigatório",
      path: ["address", "neighborhood"],
    });
  }
  
  if (!data.address.city || data.address.city.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_small,
      minimum: 1,
      type: "string",
      inclusive: true,
      message: "Cidade obrigatória",
      path: ["address", "city"],
    });
  }
  
  if (!data.address.state || data.address.state.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_small,
      minimum: 1,
      type: "string",
      inclusive: true,
      message: "Estado obrigatório",
      path: ["address", "state"],
    });
  }
  
  // Validar horário de funcionamento
  if (!data.workingHours || !data.workingHours.from || data.workingHours.from.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_small,
      minimum: 1,
      type: "string",
      inclusive: true,
      message: "Horário de início obrigatório",
      path: ["workingHours", "from"],
    });
  }
  
  if (!data.workingHours || !data.workingHours.to || data.workingHours.to.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_small,
      minimum: 1,
      type: "string",
      inclusive: true,
      message: "Horário de fim obrigatório",
      path: ["workingHours", "to"],
    });
  }
  
  // Validar se horário de fim é posterior ao de início
  if (data.workingHours && data.workingHours.from && data.workingHours.to && data.workingHours.to <= data.workingHours.from) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Horário de fim deve ser posterior ao horário de início",
      path: ["workingHours", "to"],
    });
  }
});

export const senderFormSchema = z.object({
  name: z.string().min(1, "Nome/Razão social obrigatório"),
  document: z.string().min(1, "CPF/CNPJ obrigatório"),
  address: addressSchema,
});

export const recipientFormSchema = z.object({
  name: z.string().min(1, "Nome/Razão social obrigatório"),
  document: z.string().min(1, "CPF/CNPJ obrigatório"),
  address: addressSchema,
});

export const contactFormSchema = z.object({
  name: z.string().min(1, "Nome completo obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(1, "Telefone obrigatório"),
  message: z.string().optional(),
  requestorType: z.enum(["Remetente", "Destinatario", "Outros"]).default("Outros"),
});

export const quoteFormSchema = z.object({
  cargo: cargoFormSchema,
  pickup: pickupSchema,
  sender: senderFormSchema,
  recipient: recipientFormSchema,
  contact: contactFormSchema,
});

export type QuoteFormValues = z.infer<typeof quoteFormSchema>;
export type CargoFormValues = z.infer<typeof cargoFormSchema>;
export type PickupFormValues = z.infer<typeof pickupSchema>;
export type SenderFormValues = z.infer<typeof senderFormSchema>;
export type RecipientFormValues = z.infer<typeof recipientFormSchema>;
export type ContactFormValues = z.infer<typeof contactFormSchema>;
export type AddressValues = z.infer<typeof addressSchema>;
export type WorkingHoursValues = z.infer<typeof workingHoursSchema>;
export type PriceTableValues = z.infer<typeof priceTableSchema>;
