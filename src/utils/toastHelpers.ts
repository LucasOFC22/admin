import { toast } from '@/lib/toast';

// Tipos de toast padronizados
export const toastHelpers = {
  success: (message: string, title?: string) => {
    toast.success(title || "Sucesso", {
      description: message,
    });
  },

  error: (message: string, title?: string) => {
    toast.error(title || "Erro", {
      description: message,
    });
  },

  loading: (message: string) => {
    return toast.loading(message);
  },

  // Toasts específicos para operações comuns
  created: (entity: string) => {
    toast.success("Sucesso", {
      description: `${entity} criado com sucesso!`,
    });
  },

  updated: (entity: string) => {
    toast.success("Sucesso", {
      description: `${entity} atualizado com sucesso!`,
    });
  },

  deleted: (entity: string) => {
    toast.success("Sucesso", {
      description: `${entity} excluído com sucesso!`,
    });
  },

  validationError: (message: string = "Verifique os campos obrigatórios") => {
    toast.error("Erro de validação", {
      description: message,
    });
  },

  networkError: () => {
    toast.error("Erro de conexão", {
      description: "Verifique sua conexão com a internet e tente novamente",
    });
  },

  // Common business operations
  quoteSent: () => {
    toast.success("Cotação enviada", {
      description: "Sua cotação foi enviada com sucesso! Entraremos em contato em breve.",
    });
  },

  quoteError: () => {
    toast.error("Erro ao enviar cotação", {
      description: "Houve um problema ao processar sua cotação. Tente novamente.",
    });
  },

  invalidFields: () => {
    toast.error("Campos obrigatórios", {
      description: "Por favor, preencha todos os campos obrigatórios.",
    });
  },

  accessRemoved: () => {
    toast.success("Acesso removido", {
      description: "O acesso foi removido com sucesso.",
    });
  },

  accessSuspended: () => {
    toast.success("Acesso suspenso", {
      description: "O acesso foi suspenso com sucesso.",
    });
  },

  invalidKey: (keyType: string = "chave") => {
    toast.error("Chave inválida", {
      description: `A ${keyType} informada é inválida. Verifique e tente novamente.`,
    });
  },

  missingKey: (keyType: string = "chave") => {
    toast.error("Campo obrigatório", {
      description: `Por favor, digite a ${keyType}.`,
    });
  }
};

// Toast patterns for common operations
export const operationToasts = {
  department: {
    create: () => toastHelpers.created("Departamento"),
    update: () => toastHelpers.updated("Departamento"), 
    delete: () => toastHelpers.deleted("Departamento"),
  },
  user: {
    create: () => toastHelpers.created("Usuário"),
    update: () => toastHelpers.updated("Usuário"),
    delete: () => toastHelpers.deleted("Usuário"),
  },
  role: {
    create: () => toastHelpers.created("Cargo"),
    update: () => toastHelpers.updated("Cargo"),
    delete: () => toastHelpers.deleted("Cargo"),
  },
  client: {
    create: () => toastHelpers.created("Cliente"),
    update: () => toastHelpers.updated("Cliente"),
    delete: () => toastHelpers.deleted("Cliente"),
  }
};