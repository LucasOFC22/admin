import { requireAuthenticatedClient } from '@/config/supabaseAuth';

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

interface SupabaseDepartment {
  id: string;
  nome: string;
  descricao: string;
  status: boolean;
  criado_em: string;
  atualizado_em?: string;
}

class SupabaseDepartmentService {
  async getDepartments(): Promise<Department[]> {
    try {
      const supabase = requireAuthenticatedClient();
      const { data: departments, error: deptError } = await supabase
        .from('cargos_departamento')
        .select('*')
        .order('nome');

      if (deptError) {
        console.error('Erro ao buscar departamentos:', deptError);
        throw new Error('Erro ao buscar departamentos');
      }

      const { data: allUsers, error: userError } = await supabase
        .from('usuarios')
        .select('cargo');

      if (userError) {
        console.warn('Erro ao buscar contagem de usuários:', userError);
      }

      const userCountMap = new Map<string, number>();
      if (allUsers) {
        allUsers.forEach((user: any) => {
          if (user.cargo) {
            const cargoStr = user.cargo.toString();
            userCountMap.set(cargoStr, (userCountMap.get(cargoStr) || 0) + 1);
          }
        });
      }

      return (departments || []).map((dept: SupabaseDepartment) => ({
        id: dept.id,
        name: dept.nome,
        description: dept.descricao || '',
        active: dept.status,
        userCount: userCountMap.get(dept.id) || 0,
        createdAt: dept.criado_em
      }));

    } catch (error) {
      console.error('Erro no serviço de departamentos:', error);
      throw error;
    }
  }

  async createDepartment(departmentData: DepartmentFormData): Promise<Department> {
    try {
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase
        .from('cargos_departamento')
        .insert({
          nome: departmentData.name,
          descricao: departmentData.description,
          status: departmentData.active
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar departamento:', error);
        throw new Error(error.message || 'Erro ao criar departamento');
      }

      return {
        id: data.id,
        name: data.nome,
        description: data.descricao || '',
        active: data.status,
        userCount: 0,
        createdAt: data.criado_em
      };

    } catch (error) {
      console.error('Erro ao criar departamento:', error);
      throw error;
    }
  }

  async updateDepartment(id: string, departmentData: Partial<DepartmentFormData>): Promise<Department> {
    try {
      const supabase = requireAuthenticatedClient();
      const updateData: any = {};
      
      if (departmentData.name !== undefined) {
        updateData.nome = departmentData.name;
      }
      if (departmentData.description !== undefined) {
        updateData.descricao = departmentData.description;
      }
      if (departmentData.active !== undefined) {
        updateData.status = departmentData.active;
      }

      const { data, error } = await supabase
        .from('cargos_departamento')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar departamento:', error);
        throw new Error(error.message || 'Erro ao atualizar departamento');
      }

      const { data: userCount } = await supabase
        .from('usuarios')
        .select('id', { count: 'exact' })
        .eq('cargo', id);

      return {
        id: data.id,
        name: data.nome,
        description: data.descricao || '',
        active: data.status,
        userCount: userCount?.length || 0,
        createdAt: data.criado_em
      };

    } catch (error) {
      console.error('Erro ao atualizar departamento:', error);
      throw error;
    }
  }

  async deleteDepartment(id: string): Promise<void> {
    try {
      const supabase = requireAuthenticatedClient();
      const { data: users, error: userCheckError } = await supabase
        .from('usuarios')
        .select('id')
        .eq('cargo', id)
        .limit(1);

      if (userCheckError) {
        console.error('Erro ao verificar usuários:', userCheckError);
        throw new Error('Erro ao verificar usuários associados');
      }

      if (users && users.length > 0) {
        throw new Error('Não é possível excluir departamento com usuários associados');
      }

      const { error } = await supabase
        .from('cargos_departamento')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir departamento:', error);
        throw new Error(error.message || 'Erro ao excluir departamento');
      }

    } catch (error) {
      console.error('Erro ao excluir departamento:', error);
      throw error;
    }
  }

  async toggleDepartmentStatus(id: string, active: boolean): Promise<Department> {
    try {
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase
        .from('cargos_departamento')
        .update({ status: active })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao alterar status:', error);
        throw new Error(error.message || 'Erro ao alterar status do departamento');
      }

      const { data: userCount } = await supabase
        .from('usuarios')
        .select('id', { count: 'exact' })
        .eq('cargo', id);

      return {
        id: data.id,
        name: data.nome,
        description: data.descricao || '',
        active: data.status,
        userCount: userCount?.length || 0,
        createdAt: data.criado_em
      };

    } catch (error) {
      console.error('Erro ao alterar status:', error);
      throw error;
    }
  }
}

export const supabaseDepartmentService = new SupabaseDepartmentService();
