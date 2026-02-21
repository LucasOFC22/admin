import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, Loader2 } from 'lucide-react';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { toast } from '@/lib/toast';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { filterEmpresasByPermissions, hasAllEmpresasPermissions } from '@/utils/empresaPermissions';

export interface Empresa {
  id: number;
  nome: string;
  cnpj: string;
}

interface EmpresaSelectorProps {
  value: string;
  onChange: (value: string) => void;
  showAllOption?: boolean;
  disabled?: boolean;
  label?: string;
  required?: boolean;
  /** Quando true, ignora o filtro de permissões por empresa e mostra todas */
  bypassEmpresaPermissions?: boolean;
}

export const EmpresaSelector = ({ 
  value, 
  onChange, 
  showAllOption = true,
  disabled = false,
  label = 'Empresa',
  required = false,
  bypassEmpresaPermissions = false
}: EmpresaSelectorProps) => {
  const { cargoPermissions } = usePermissionGuard();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresasFiltradas, setEmpresasFiltradas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [canSelectAll, setCanSelectAll] = useState(false);

  useEffect(() => {
    const fetchEmpresas = async () => {
      try {
        setLoading(true);
        // Usar cliente autenticado para enviar JWT
        const client = requireAuthenticatedClient();
        
        const { data, error: fetchError } = await client
          .from('dbfrete_token')
          .select('empresas')
          .limit(1)
          .maybeSingle();

        if (fetchError) throw fetchError;
        if (!data) {
          console.warn('[EmpresaSelector] Nenhum token encontrado');
          return;
        }

        if (data?.empresas) {
          // Transformar empresas para o formato padrão
          const empresasData = (data.empresas as any[]).map(emp => ({
            id: emp.id_empresa || emp.id,
            nome: emp.fantasia || emp.nome,
            cnpj: emp.cnpj
          }));
          setEmpresas(empresasData);
        }
      } catch (err) {
        console.error('Erro ao buscar empresas:', err);
        toast.error('Não foi possível obter a lista de empresas');
      } finally {
        setLoading(false);
      }
    };

    fetchEmpresas();
  }, []);

  // Filtrar empresas baseado nas permissões do usuário
  useEffect(() => {
    if (!loading && empresas.length > 0) {
      const userPermissions = cargoPermissions || [];
      
      // Se bypassEmpresaPermissions for true, mostrar todas as empresas
      if (bypassEmpresaPermissions) {
        setEmpresasFiltradas(empresas);
        setCanSelectAll(true);
        return;
      }
      
      const filtered = filterEmpresasByPermissions(empresas, userPermissions);
      setEmpresasFiltradas(filtered);
      
      // Verificar se o usuário tem acesso a todas as empresas
      const hasAll = hasAllEmpresasPermissions(userPermissions);
      setCanSelectAll(hasAll);
      
      // Se o usuário não tem permissão para todas e 'all' está selecionado, 
      // selecionar a primeira empresa disponível
      if (!hasAll && value === 'all' && filtered.length > 0) {
        onChange(filtered[0].id.toString());
      }
    }
  }, [empresas, loading, cargoPermissions, value, onChange, bypassEmpresaPermissions]);

  return (
    <div className="space-y-2">
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Select value={value} onValueChange={onChange} disabled={disabled || loading}>
        <SelectTrigger className="w-full">
          <div className="flex items-center gap-2">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Building2 className="h-4 w-4" />
            )}
            <SelectValue placeholder={loading ? "Carregando..." : "Selecione uma empresa"}>
              {value === 'all' 
                ? `Todas as empresas (${empresasFiltradas.length})`
                : empresasFiltradas.find(e => e.id.toString() === value)?.nome || 'Selecione uma empresa'
              }
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent>
          {showAllOption && canSelectAll && (
            <SelectItem value="all">
              Todas as empresas ({empresasFiltradas.length})
            </SelectItem>
          )}
          {empresasFiltradas.map((empresa) => (
            <SelectItem key={empresa.id} value={empresa.id.toString()}>
              {empresa.nome} - {empresa.cnpj}
            </SelectItem>
          ))}
          {empresasFiltradas.length === 0 && !loading && (
            <div className="px-2 py-4 text-sm text-muted-foreground text-center">
              Nenhuma empresa disponível
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};
