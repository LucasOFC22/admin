import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { OptimizedDialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/optimized-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/lib/toast';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import AdvancedPermissionSelector from '@/components/admin/permissions/AdvancedPermissionSelector';

import { Loader2, Briefcase, Building2, FileText, Layers, ToggleLeft } from 'lucide-react';
import { CargoComDepartamento } from '@/types/database';
import { CargoFormData, DepartmentData } from '@/types/forms';
import { EMPRESA_PERMISSIONS } from '@/utils/empresaPermissions';
import { Checkbox } from '@/components/ui/checkbox';
import { useHierarchyControl } from '@/hooks/useHierarchyControl';

interface CreateCargoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cargo?: CargoComDepartamento | null;
  onSave: (cargoData: CargoFormData) => Promise<void>;
}
const CreateCargoModal = ({
  open,
  onOpenChange,
  cargo,
  onSave
}: CreateCargoModalProps) => {
  
  const { maxAllowedLevel, isLoading: hierarchyLoading } = useHierarchyControl();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<DepartmentData[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [empresas, setEmpresas] = useState<Array<{id: string, nome: string}>>([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);
  const [selectedEmpresas, setSelectedEmpresas] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    departmentId: null as number | null,
    permissions: [] as string[],
    hierarchy: 1,
    active: true
  });
  const isEdit = !!cargo;


  // Buscar departamentos e empresas do banco de dados - memoizado
  useEffect(() => {
    if (!open) return;
    
    const fetchData = async () => {
      try {
        setLoadingDepartments(true);
        setLoadingEmpresas(true);
        
        // Usar cliente autenticado para enviar JWT
        const client = requireAuthenticatedClient();
        
        // Buscar em paralelo
        const [deptResult, tokenResult] = await Promise.all([
          client.from('cargos_departamento').select('*').order('nome'),
          client.from('dbfrete_token').select('empresas').limit(1).maybeSingle()
        ]);
        
        if (deptResult.error) {
          console.error('Erro ao buscar departamentos:', deptResult.error);
        } else {
          setDepartments(deptResult.data || []);
        }
        
        if (tokenResult.error) {
          console.error('Erro ao buscar empresas:', tokenResult.error);
        } else if (tokenResult.data?.empresas) {
          const empresasData = (tokenResult.data.empresas as any[]).map(emp => ({
            id: (emp.id_empresa || emp.id).toString(),
            nome: emp.fantasia || emp.nome
          }));
          setEmpresas(empresasData);
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        setLoadingDepartments(false);
        setLoadingEmpresas(false);
      }
    };
    
    fetchData();
  }, [open]);

  // Inicialização do form ao abrir modal
  useEffect(() => {
    if (!open) {
      setIsInitialized(false);
      return;
    }
    
    // Só inicializar uma vez quando modal abre
    if (isInitialized) return;
    
    if (cargo) {
      // Modo edição - usar permissões diretamente do cargo (já vem do banco)
      const permissions = cargo.permissoes || [];
      console.log('📝 Modo edição - Permissões do cargo:', permissions);
      
      const empresasIds = Object.entries(EMPRESA_PERMISSIONS)
        .filter(([_, permission]) => permissions.includes(permission))
        .map(([id]) => id);
      
      setFormData({
        name: cargo.nome || '',
        description: cargo.descricao || '',
        departmentId: cargo.departamento || null,
        permissions: permissions,
        hierarchy: cargo.level || 1,
        active: cargo.ativo ?? true
      });
      setSelectedEmpresas(empresasIds);
      setIsInitialized(true);
    } else {
      // Modo criação - resetar form
      setFormData({
        name: '',
        description: '',
        departmentId: null,
        permissions: [],
        hierarchy: 1,
        active: true
      });
      setSelectedEmpresas([]);
      setIsInitialized(true);
    }
  }, [open, cargo?.id]);

  // Memoizar handlers
  const handleInputChange = useCallback((field: string, value: string | number | boolean) => {
    if (field === 'hierarchy') {
      const numValue = typeof value === 'number' ? value : parseInt(String(value)) || 1;
      const clampedValue = Math.min(Math.max(numValue, 1), 10);
      setFormData(prev => ({
        ...prev,
        [field]: clampedValue
      }));
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);
  
  const handlePermissionsChange = useCallback((permissions: string[]) => {
    // Adicionar automaticamente as permissões de empresas selecionadas
    const empresaPermissions = selectedEmpresas.map(id => EMPRESA_PERMISSIONS[id as keyof typeof EMPRESA_PERMISSIONS]);
    const allPermissions = [...new Set([...permissions, ...empresaPermissions])];
    
    setFormData(prev => ({
      ...prev,
      permissions: allPermissions
    }));
  }, [selectedEmpresas]);
  
  const handleEmpresaToggle = useCallback((empresaId: string) => {
    setSelectedEmpresas(prev => {
      const newSelected = prev.includes(empresaId)
        ? prev.filter(id => id !== empresaId)
        : [...prev, empresaId];
      
      // Atualizar permissões usando o novo valor
      setFormData(prevForm => {
        const empresaPermissions = newSelected.map(id => EMPRESA_PERMISSIONS[id as keyof typeof EMPRESA_PERMISSIONS]);
        const currentPermissionsWithoutEmpresa = prevForm.permissions.filter(
          p => !Object.values(EMPRESA_PERMISSIONS).includes(p as any)
        );
        const allPermissions = [...new Set([...currentPermissionsWithoutEmpresa, ...empresaPermissions])];
        
        return {
          ...prevForm,
          permissions: allPermissions
        };
      });
      
      return newSelected;
    });
  }, []);
  
  const handleSelectAllEmpresas = useCallback(() => {
    const allIds = empresas.map(e => e.id);
    setSelectedEmpresas(allIds);
    
    // Atualizar permissões
    const empresaPermissions = allIds.map(id => EMPRESA_PERMISSIONS[id as keyof typeof EMPRESA_PERMISSIONS]);
    setFormData(prev => {
      const currentPermissionsWithoutEmpresa = prev.permissions.filter(
        p => !Object.values(EMPRESA_PERMISSIONS).includes(p as any)
      );
      const allPermissions = [...new Set([...currentPermissionsWithoutEmpresa, ...empresaPermissions])];
      
      return {
        ...prev,
        permissions: allPermissions
      };
    });
  }, [empresas]);
  
  const isFormValid = useCallback(() => {
    return formData.name.trim().length > 0 && formData.departmentId !== null && formData.permissions.length > 0;
  }, [formData.name, formData.departmentId, formData.permissions.length]);
  const handleSubmit = useCallback(async () => {
    if (!isFormValid()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    try {
      setLoading(true);

      const cargoData = {
        nome: formData.name.trim(),
        descricao: formData.description.trim(),
        departamento: formData.departmentId,
        permissoes: formData.permissions,
        level: formData.hierarchy,
        ativo: formData.active
      };

      // Salvar o cargo (hook já exibe notificação de sucesso)
      await onSave(cargoData);
      
      onOpenChange(false);
    } catch (error) {
      // Hook já exibe notificação de erro
      console.error('Error saving cargo:', error);
    } finally {
      setLoading(false);
    }
  }, [isFormValid, formData, onSave, onOpenChange]);
  
  return (
    <OptimizedDialog open={open} onOpenChange={onOpenChange} unmountOnClose={true} className="max-w-4xl p-0">
      <div className="w-full max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-primary/15 ring-1 ring-primary/30 flex items-center justify-center">
                <Briefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-semibold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  {isEdit ? 'Editar Cargo' : 'Criar Novo Cargo'}
                </DialogTitle>
                <DialogDescription className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                  Defina informações do cargo e selecione as permissões.
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 py-4 space-y-4 sm:space-y-5">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Briefcase className="h-4 w-4" />
                Informações Básicas
              </div>
              
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-xs font-medium flex items-center gap-2">
                      <Briefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                      Nome do Cargo *
                    </Label>
                    <Input id="name" value={formData.name} onChange={e => handleInputChange('name', e.target.value)} placeholder="Ex: Supervisor de Operações" disabled={loading} className="h-10 sm:h-9 text-sm" />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="department" className="text-xs font-medium flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                      Departamento *
                    </Label>
                    <Select value={formData.departmentId?.toString()} onValueChange={value => handleInputChange('departmentId', parseInt(value))} disabled={loading}>
                      <SelectTrigger className="h-10 sm:h-9 text-sm">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map(dept => <SelectItem key={dept.id} value={dept.id.toString()}>
                            {dept.nome}
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description" className="text-xs font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Descrição
                  </Label>
                  <Textarea id="description" value={formData.description} onChange={e => handleInputChange('description', e.target.value)} placeholder="Descreva as responsabilidades..." rows={2} disabled={loading} className="resize-none text-sm" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="hierarchy" className="text-xs font-medium flex items-center gap-2">
                      <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                      Nível Hierárquico
                    </Label>
                    <Select 
                      value={formData.hierarchy.toString()} 
                      onValueChange={value => handleInputChange('hierarchy', parseInt(value))} 
                      disabled={loading || hierarchyLoading}
                    >
                      <SelectTrigger className="h-10 sm:h-9 text-sm">
                        <SelectValue placeholder="Selecione o nível" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: maxAllowedLevel }, (_, i) => i + 1).map(level => (
                          <SelectItem key={level} value={level.toString()}>
                            Nível {level} {level === 10 ? '(Administrador)' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium flex items-center gap-2"><ToggleLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />Status</Label>
                    <div className="flex items-center gap-2 h-10 sm:h-9 px-3 border rounded-md bg-background">
                      <Switch checked={formData.active} onCheckedChange={checked => handleInputChange('active', checked)} disabled={loading} />
                      <span className="text-sm">
                        {formData.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Acesso a Empresas */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  Acesso a Empresas
                </div>
                {empresas.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllEmpresas}
                    disabled={loading || loadingEmpresas}
                  >
                    Selecionar Todas
                  </Button>
                )}
              </div>
              
              {loadingEmpresas ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : empresas.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 p-4 border rounded-lg bg-muted/30">
                  {empresas.map((empresa) => (
                    <div key={empresa.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`empresa-${empresa.id}`}
                        checked={selectedEmpresas.includes(empresa.id)}
                        onCheckedChange={() => handleEmpresaToggle(empresa.id)}
                        disabled={loading}
                      />
                      <Label
                        htmlFor={`empresa-${empresa.id}`}
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        {empresa.nome}
                      </Label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg bg-muted/20">
                  Nenhuma empresa disponível
                </p>
              )}
              
              {selectedEmpresas.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary">{selectedEmpresas.length} empresa(s) selecionada(s)</Badge>
                </div>
              )}
            </div>

            <Separator />

            {/* Permissões */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Layers className="h-4 w-4" />
                Permissões do Cargo
              </div>

              <AdvancedPermissionSelector selectedPermissions={formData.permissions} onPermissionsChange={handlePermissionsChange} disabled={loading} showCriticalWarnings={false} />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="px-4 sm:px-6 py-3 border-t bg-muted/30 flex-col-reverse sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="h-10 w-full sm:w-auto sm:h-9">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!isFormValid() || loading} className="h-10 w-full sm:w-auto sm:h-9">
            {loading ? <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </> : isEdit ? 'Salvar Alterações' : 'Criar Cargo'}
          </Button>
        </DialogFooter>
      </div>
    </OptimizedDialog>
  );
};
export default CreateCargoModal;