
import { n8nApi } from './apiService';

export interface Department {
  id: string;
  name: string;
  description: string;
  active: boolean;
  userCount: number;
  createdAt: string;
}

export interface DepartmentFormData {
  name: string;
  description: string;
  active: boolean;
}

interface N8nDepartmentResponse {
  id: string | number; // bigint can come as number or string
  nome: string;
  descricao: string;
  status: boolean;
  userCount?: number;
  criado_em: string; // timestamp with time zone
  atualizado_em?: string; // timestamp with time zone (nullable)
}

class N8nDepartmentService {
  async getDepartments(): Promise<Department[]> {
    const response = await n8nApi.post('departamento', {
      eventType: 'cargos',
      acao: 'departamento',
      tipo: 'buscar'
    });

    if (response.success && response.data) {
      // Check if data is an empty object
      if (typeof response.data === 'object' && !Array.isArray(response.data) && Object.keys(response.data).length === 0) {
        return [];
      }
      
      const rawData = Array.isArray(response.data) ? response.data : [response.data];
      
      // Filter out empty objects and items without required fields
      const validItems = rawData.filter((item: any) => {
        return item && typeof item === 'object' && (item.id || item.nome);
      });
      
      if (validItems.length === 0) {
        return [];
      }
      
      return validItems.map((item: N8nDepartmentResponse) => {
        return {
          id: String(item.id), // Convert bigint to string
          name: item.nome || '',
          description: item.descricao || '',
          active: item.status,
          userCount: item.userCount || 0,
          createdAt: item.criado_em || '' // Map criado_em to createdAt
        };
      });
    }
    
    return [];
  }

  async createDepartment(departmentData: DepartmentFormData): Promise<Department> {
    const response = await n8nApi.post('departamento', {
      eventType: 'cargos',
      acao: 'departamento',
      tipo: 'salvar',
      nome: departmentData.name,
      descricao: departmentData.description,
      status: departmentData.active
    });

    if (response.success && response.data) {
      const data = response.data as N8nDepartmentResponse;
      return {
        id: String(data.id), // Convert bigint to string
        name: data.nome || '',
        description: data.descricao || '',
        active: data.status,
        userCount: data.userCount || 0,
        createdAt: data.criado_em || '' // Map criado_em to createdAt
      };
    }
    
    throw new Error(response.error || 'Erro ao criar departamento');
  }

  async updateDepartment(id: string, departmentData: Partial<DepartmentFormData>): Promise<Department> {
    const response = await n8nApi.post('departamento', {
      eventType: 'cargos',
      acao: 'departamento',
      tipo: 'editar',
      id,
      ...(departmentData.name && { nome: departmentData.name }),
      ...(departmentData.description && { descricao: departmentData.description }),
      ...(departmentData.active !== undefined && { status: departmentData.active })
    });

    if (response.success && response.data) {
      const data = response.data as N8nDepartmentResponse;
      return {
        id: String(data.id), // Convert bigint to string
        name: data.nome || '',
        description: data.descricao || '',
        active: data.status,
        userCount: data.userCount || 0,
        createdAt: data.criado_em || '' // Map criado_em to createdAt
      };
    }
    
    throw new Error(response.error || 'Erro ao atualizar departamento');
  }

  async deleteDepartment(id: string): Promise<void> {
    const response = await n8nApi.post('departamento', {
      eventType: 'cargos',
      acao: 'departamento',
      tipo: 'excluir',
      id
    });

    if (!response.success) {
      throw new Error(response.error || 'Erro ao excluir departamento');
    }
  }

  async toggleDepartmentStatus(id: string, active: boolean): Promise<Department> {
    const response = await n8nApi.post('departamento', {
      eventType: 'cargos',
      acao: 'departamento',
      tipo: 'editar',
      id,
      status: active
    });

    if (response.success && response.data) {
      const data = response.data as N8nDepartmentResponse;
      return {
        id: String(data.id), // Convert bigint to string
        name: data.nome || '',
        description: data.descricao || '',
        active: data.status,
        userCount: data.userCount || 0,
        createdAt: data.criado_em || '' // Map criado_em to createdAt
      };
    }
    
    throw new Error(response.error || 'Erro ao alterar status do departamento');
  }
}

export const n8nDepartmentService = new N8nDepartmentService();
