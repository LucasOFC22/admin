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
import { toast } from '@/lib/toast';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { filterEmpresasByPermissions, hasAllEmpresasPermissions } from '@/utils/empresaPermissions';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { empresasConfigService, EmpresaConfig } from '@/services/empresasConfigService';

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
  const { user } = useUnifiedAuth();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresasFiltradas, setEmpresasFiltradas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [canSelectAll, setCanSelectAll] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchEmpresas = async () => {
      try {
        setLoading(true);
        const empresasData = await empresasConfigService.getEmpresas();
        setEmpresas(empresasData);
      } catch (err) {
        console.error('Erro ao buscar empresas:', err);
        toast.error('Não foi possível obter a lista de empresas');
      } finally {
        setLoading(false);
      }
    };

    fetchEmpresas();
  }, [user]);

  // Filtrar empresas baseado nas permissões do usuário
  useEffect(() => {
    if (!loading && empresas.length > 0) {
      const userPermissions = cargoPermissions || [];
      
      if (bypassEmpresaPermissions) {
        setEmpresasFiltradas(empresas);
        setCanSelectAll(true);
        return;
      }
      
      const filtered = filterEmpresasByPermissions(empresas, userPermissions);
      setEmpresasFiltradas(filtered);
      
      const hasAll = hasAllEmpresasPermissions(userPermissions);
      setCanSelectAll(hasAll);
      
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
