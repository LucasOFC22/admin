// Sistema de tradução simplificado
const translations = {
  pt: {
    messagesInput: {
      placeholderOpen: "Digite uma mensagem",
      placeholderClosed: "Reabra ou aceite esse ticket para enviar uma mensagem.",
    },
    messageOptionsMenu: {
      reply: "Responder",
      forward: "Encaminhar",
      edit: "Editar",
      delete: "Deletar",
    },
    messagesList: {
      header: {
        assignedTo: "Atribuído à:",
        buttons: {
          return: "Retornar",
          resolve: "Resolver",
          reopen: "Reabrir",
          accept: "Aceitar",
        },
      },
    },
    ticketsQueueSelect: {
      placeholder: "Filas",
    },
  },
};

export const i18n = {
  t: (key: string) => {
    const keys = key.split(".");
    let value: any = translations.pt;
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  },
};
