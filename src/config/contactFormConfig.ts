
import { z } from "zod";

// Contact information
export const contactInfo = {
  title: "Matriz - BA",
  address: "Rua Comendador Gomes, 265 - Tomba",
  city: "Feira de Santana",
  state: "BA",
  zip: "44091-238",
  phone: "(75) 3614-4323 / 3616-6155",
  email: "atendimento@fptranscargas.com.br"
};

// Schema de validação melhorado
export const formSchema = z.object({
  name: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres" }).max(100),
  email: z.string().email({ message: "E-mail inválido" }).max(100),
  phone: z.string().min(10, { message: "Telefone deve ter pelo menos 10 caracteres" }).max(20),
  subject: z.string().min(3, { message: "Assunto é obrigatório" }).max(100),
  message: z.string().min(10, { message: "Mensagem deve ter pelo menos 10 caracteres" }).max(5000),
  department: z.string(),
});

export type FormValues = z.infer<typeof formSchema>;

export const departments = [
  { value: "comercial", label: "Comercial" },
  { value: "operacional", label: "Operacional" },
  { value: "financeiro", label: "Financeiro" },
  { value: "outro", label: "Outro Assunto" },
];

export const defaultFormValues: FormValues = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
  department: "comercial",
};
