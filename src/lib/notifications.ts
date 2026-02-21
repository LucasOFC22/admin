
export const notifications = {
  success: {
    created: (entity: string) => `${entity} criado com sucesso`,
    updated: (entity: string) => `${entity} atualizado com sucesso`,
    deleted: (entity: string) => `${entity} excluído com sucesso`,
    saved: (entity: string) => `${entity} salvo com sucesso`,
    sent: (entity: string) => `${entity} enviado com sucesso`,
    loaded: (entity: string) => `${entity} carregado com sucesso`,
    exported: (entity: string) => `${entity} exportado com sucesso`,
    imported: (entity: string) => `${entity} importado com sucesso`
  },
  error: {
    create: (entity: string) => `Erro ao criar ${entity}`,
    update: (entity: string) => `Erro ao atualizar ${entity}`,
    delete: (entity: string) => `Erro ao excluir ${entity}`,
    save: (entity: string) => `Erro ao salvar ${entity}`,
    send: (entity: string) => `Erro ao enviar ${entity}`,
    load: (entity: string) => `Erro ao carregar ${entity}`,
    export: (entity: string) => `Erro ao exportar ${entity}`,
    import: (entity: string) => `Erro ao importar ${entity}`,
    invalid: (field: string) => `${field} inválido`,
    required: (field: string) => `${field} é obrigatório`,
    notFound: (entity: string) => `${entity} não encontrado`,
    unauthorized: 'Acesso não autorizado',
    network: 'Erro de conexão. Tente novamente.',
    generic: 'Ocorreu um erro inesperado. Tente novamente.'
  },
  info: {
    loading: (entity: string) => `Carregando ${entity}...`,
    processing: (action: string) => `Processando ${action}...`,
    saving: (entity: string) => `Salvando ${entity}...`,
    deleting: (entity: string) => `Excluindo ${entity}...`,
    sending: (entity: string) => `Enviando ${entity}...`
  },
  warning: {
    unsaved: 'Há alterações não salvas',
    confirmDelete: (entity: string) => `Tem certeza que deseja excluir ${entity}?`,
    confirmAction: (action: string) => `Tem certeza que deseja ${action}?`,
    dataLoss: 'Esta ação pode resultar em perda de dados'
  }
};

export type NotificationKey = keyof typeof notifications;
export type NotificationSubKey<T extends NotificationKey> = keyof typeof notifications[T];
