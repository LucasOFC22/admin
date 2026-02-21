import { centralLogger } from './centralLogger';

/**
 * Loggers específicos por módulo para facilitar uso
 */

export const cotacoesLogger = {
  logCreate: (data: any) => 
    centralLogger.logInput('Cotacoes', 'create', data, 'business'),
  
  logUpdate: (id: string, data: any) => 
    centralLogger.logInput('Cotacoes', 'update', { id, ...data }, 'business'),
  
  logDelete: (id: string) => 
    centralLogger.logInput('Cotacoes', 'delete', { id }, 'business'),
  
  logList: (filters: any, count: number) => 
    centralLogger.logProcessing('Cotacoes', 'list', `${count} cotações listadas`, { filters }),
  
  logStatusChange: (id: string, from: string, to: string) => 
    centralLogger.logProcessing('Cotacoes', 'changeStatus', `Status alterado de ${from} para ${to}`, { id, from, to }),
};

export const manifestosLogger = {
  logCreate: (data: any) => 
    centralLogger.logInput('Manifestos', 'create', data, 'business'),
  
  logUpdate: (id: string, data: any) => 
    centralLogger.logInput('Manifestos', 'update', { id, ...data }, 'business'),
  
  logDelete: (id: string) => 
    centralLogger.logInput('Manifestos', 'delete', { id }, 'business'),
  
  logList: (filters: any, count: number) => 
    centralLogger.logProcessing('Manifestos', 'list', `${count} manifestos listados`, { filters }),
  
  logDownload: (id: string, format: string) => 
    centralLogger.logProcessing('Manifestos', 'download', `Download em formato ${format}`, { id, format }),
};

export const nfeLogger = {
  logConsult: (chave: string) => 
    centralLogger.logInput('ConsultarNFe', 'consult', { chave }, 'api'),
  
  logConsultSuccess: (chave: string, result: any, duration: number) => 
    centralLogger.logProcessing('ConsultarNFe', 'consult', 'Consulta realizada com sucesso', { chave, ...result }, duration, 'api'),
  
  logConsultError: (chave: string, error: Error) => 
    centralLogger.logError('ConsultarNFe', 'consult', error, { chave }),
};

export const contatosLogger = {
  logCreate: (data: any) => 
    centralLogger.logInput('Contatos', 'create', data, 'business'),
  
  logUpdate: (id: string, data: any) => 
    centralLogger.logInput('Contatos', 'update', { id, ...data }, 'business'),
  
  logDelete: (id: string) => 
    centralLogger.logInput('Contatos', 'delete', { id }, 'business'),
  
  logList: (filters: any, count: number) => 
    centralLogger.logProcessing('Contatos', 'list', `${count} contatos listados`, { filters }),
};

export const contasReceberLogger = {
  logCreate: (data: any) => 
    centralLogger.logInput('ContasReceber', 'create', data, 'business'),
  
  logUpdate: (id: string, data: any) => 
    centralLogger.logInput('ContasReceber', 'update', { id, ...data }, 'business'),
  
  logDelete: (id: string) => 
    centralLogger.logInput('ContasReceber', 'delete', { id }, 'business'),
  
  logPayment: (id: string, valor: number, data: string) => 
    centralLogger.logProcessing('ContasReceber', 'payment', `Pagamento de R$ ${valor} registrado`, { id, valor, data }),
  
  logList: (filters: any, count: number) => 
    centralLogger.logProcessing('ContasReceber', 'list', `${count} contas listadas`, { filters }),
};

export const usuariosLogger = {
  logCreate: (email: string, cargo: string) => 
    centralLogger.logInput('GerenciarUsuarios', 'create', { email, cargo }, 'auth'),
  
  logUpdate: (id: string, data: any) => 
    centralLogger.logInput('GerenciarUsuarios', 'update', { id, ...data }, 'auth'),
  
  logDelete: (id: string, email: string) => 
    centralLogger.logInput('GerenciarUsuarios', 'delete', { id, email }, 'auth'),
  
  logPasswordReset: (email: string) => 
    centralLogger.logInput('GerenciarUsuarios', 'passwordReset', { email }, 'auth'),
  
  logList: (filters: any, count: number) => 
    centralLogger.logProcessing('GerenciarUsuarios', 'list', `${count} usuários listados`, { filters }),
};

export const cargosLogger = {
  logCreate: (nome: string, permissoes: any) => 
    centralLogger.logInput('Cargos', 'create', { nome, permissoes }, 'auth'),
  
  logUpdate: (id: string, data: any) => 
    centralLogger.logInput('Cargos', 'update', { id, ...data }, 'auth'),
  
  logDelete: (id: string, nome: string) => 
    centralLogger.logInput('Cargos', 'delete', { id, nome }, 'auth'),
  
  logPermissionChange: (cargoId: string, permissao: string, value: boolean) => 
    centralLogger.logProcessing('Cargos', 'changePermission', `Permissão ${permissao} ${value ? 'concedida' : 'removida'}`, { cargoId, permissao, value }),
  
  logList: (count: number) => 
    centralLogger.logProcessing('Cargos', 'list', `${count} cargos listados`, {}),
};

