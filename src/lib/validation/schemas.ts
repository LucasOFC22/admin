/**
 * Schemas de validação Zod centralizados
 * Usados para validação de formulários críticos
 */
import { z } from 'zod';

// ============================================
// SCHEMAS DE AUTENTICAÇÃO
// ============================================

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email é obrigatório" })
    .email({ message: "Digite um email válido" })
    .max(255, { message: "Email muito longo" })
    .transform(val => val.toLowerCase().trim()),
  password: z
    .string()
    .min(6, { message: "A senha deve ter pelo menos 6 caracteres" })
    .max(128, { message: "Senha muito longa" }),
  rememberMe: z.boolean().optional(),
});

export const signupSchema = z.object({
  nome: z
    .string()
    .min(2, { message: "Nome deve ter pelo menos 2 caracteres" })
    .max(100, { message: "Nome muito longo" })
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, { message: "Nome contém caracteres inválidos" })
    .transform(val => val.trim()),
  email: z
    .string()
    .min(1, { message: "Email é obrigatório" })
    .email({ message: "Digite um email válido" })
    .max(255, { message: "Email muito longo" })
    .transform(val => val.toLowerCase().trim()),
  password: z
    .string()
    .min(8, { message: "A senha deve ter pelo menos 8 caracteres" })
    .max(128, { message: "Senha muito longa" })
    .regex(/[A-Z]/, { message: "A senha deve conter pelo menos uma letra maiúscula" })
    .regex(/[a-z]/, { message: "A senha deve conter pelo menos uma letra minúscula" })
    .regex(/[0-9]/, { message: "A senha deve conter pelo menos um número" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export const resetPasswordSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email é obrigatório" })
    .email({ message: "Digite um email válido" })
    .max(255, { message: "Email muito longo" })
    .transform(val => val.toLowerCase().trim()),
});

export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(6, { message: "Senha atual é obrigatória" }),
  newPassword: z
    .string()
    .min(8, { message: "A nova senha deve ter pelo menos 8 caracteres" })
    .max(128, { message: "Senha muito longa" })
    .regex(/[A-Z]/, { message: "A senha deve conter pelo menos uma letra maiúscula" })
    .regex(/[a-z]/, { message: "A senha deve conter pelo menos uma letra minúscula" })
    .regex(/[0-9]/, { message: "A senha deve conter pelo menos um número" }),
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "As senhas não coincidem",
  path: ["confirmNewPassword"],
});

// ============================================
// SCHEMAS DE CONTATOS
// ============================================

export const contatoSchema = z.object({
  nome: z
    .string()
    .min(2, { message: "Nome deve ter pelo menos 2 caracteres" })
    .max(100, { message: "Nome muito longo" })
    .transform(val => val.trim()),
  email: z
    .string()
    .email({ message: "Email inválido" })
    .max(255, { message: "Email muito longo" })
    .optional()
    .or(z.literal(''))
    .transform(val => val?.toLowerCase().trim() || ''),
  telefone: z
    .string()
    .regex(/^[\d\s\-\+\(\)]+$/, { message: "Telefone contém caracteres inválidos" })
    .min(10, { message: "Telefone inválido" })
    .max(20, { message: "Telefone muito longo" })
    .optional()
    .or(z.literal('')),
  empresa: z
    .string()
    .max(100, { message: "Nome da empresa muito longo" })
    .optional(),
  observacoes: z
    .string()
    .max(1000, { message: "Observações muito longas" })
    .optional(),
});

// ============================================
// SCHEMAS DE CONFIGURAÇÕES
// ============================================

export const emailConfigSchema = z.object({
  smtp_host: z
    .string()
    .min(1, { message: "Host SMTP é obrigatório" })
    .max(255, { message: "Host muito longo" }),
  smtp_port: z
    .number()
    .min(1, { message: "Porta inválida" })
    .max(65535, { message: "Porta inválida" }),
  smtp_user: z
    .string()
    .min(1, { message: "Usuário SMTP é obrigatório" })
    .max(255, { message: "Usuário muito longo" }),
  smtp_password: z
    .string()
    .min(1, { message: "Senha SMTP é obrigatória" })
    .max(255, { message: "Senha muito longa" }),
  from_email: z
    .string()
    .email({ message: "Email de envio inválido" })
    .max(255, { message: "Email muito longo" }),
  from_name: z
    .string()
    .max(100, { message: "Nome muito longo" })
    .optional(),
});

export const userSettingsSchema = z.object({
  nome: z
    .string()
    .min(2, { message: "Nome deve ter pelo menos 2 caracteres" })
    .max(100, { message: "Nome muito longo" })
    .transform(val => val.trim()),
  email: z
    .string()
    .email({ message: "Email inválido" })
    .max(255, { message: "Email muito longo" })
    .transform(val => val.toLowerCase().trim()),
  assinatura_html: z
    .string()
    .max(5000, { message: "Assinatura muito longa" })
    .optional(),
  notificacoes_ativas: z.boolean().optional(),
});

// ============================================
// SCHEMAS DE MENSAGENS
// ============================================

export const mensagemSchema = z.object({
  destinatario: z
    .string()
    .min(1, { message: "Destinatário é obrigatório" })
    .max(255, { message: "Destinatário muito longo" }),
  assunto: z
    .string()
    .min(1, { message: "Assunto é obrigatório" })
    .max(255, { message: "Assunto muito longo" })
    .transform(val => val.trim()),
  corpo: z
    .string()
    .min(1, { message: "Mensagem é obrigatória" })
    .max(50000, { message: "Mensagem muito longa" }),
});

// ============================================
// HELPERS DE VALIDAÇÃO
// ============================================

/**
 * Valida CPF brasileiro
 */
export const cpfSchema = z
  .string()
  .transform(val => val.replace(/\D/g, ''))
  .refine(val => val.length === 11, { message: "CPF deve ter 11 dígitos" })
  .refine(val => {
    if (/^(\d)\1{10}$/.test(val)) return false;
    
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(val.charAt(i)) * (10 - i);
    }
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(val.charAt(9))) return false;
    
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(val.charAt(i)) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(val.charAt(10))) return false;
    
    return true;
  }, { message: "CPF inválido" });

/**
 * Valida CNPJ brasileiro
 */
export const cnpjSchema = z
  .string()
  .transform(val => val.replace(/\D/g, ''))
  .refine(val => val.length === 14, { message: "CNPJ deve ter 14 dígitos" })
  .refine(val => {
    if (/^(\d)\1{13}$/.test(val)) return false;
    
    const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    
    let soma = 0;
    for (let i = 0; i < 12; i++) {
      soma += parseInt(val.charAt(i)) * pesos1[i];
    }
    let resto = soma % 11;
    const digito1 = resto < 2 ? 0 : 11 - resto;
    if (digito1 !== parseInt(val.charAt(12))) return false;
    
    soma = 0;
    for (let i = 0; i < 13; i++) {
      soma += parseInt(val.charAt(i)) * pesos2[i];
    }
    resto = soma % 11;
    const digito2 = resto < 2 ? 0 : 11 - resto;
    if (digito2 !== parseInt(val.charAt(13))) return false;
    
    return true;
  }, { message: "CNPJ inválido" });

/**
 * Valida telefone brasileiro
 */
export const telefoneSchema = z
  .string()
  .transform(val => val.replace(/\D/g, ''))
  .refine(val => val.length >= 10 && val.length <= 11, { 
    message: "Telefone deve ter 10 ou 11 dígitos" 
  });

// Tipos exportados
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type ContatoFormData = z.infer<typeof contatoSchema>;
export type EmailConfigFormData = z.infer<typeof emailConfigSchema>;
export type UserSettingsFormData = z.infer<typeof userSettingsSchema>;
export type MensagemFormData = z.infer<typeof mensagemSchema>;
