import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Building2, Save, RefreshCw } from 'lucide-react';
import { empresasConfigService, EmpresaConfig } from '@/services/empresasConfigService';
import { toast } from '@/lib/toast';

const EmpresasConfigSection = () => {
  const [empresas, setEmpresas] = useState<EmpresaConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadEmpresas();
  }, []);

  const loadEmpresas = async () => {
    try {
      setLoading(true);
      const data = await empresasConfigService.getEmpresas();
      setEmpresas(data);
    } catch (err) {
      console.error('Erro ao carregar empresas:', err);
      toast.error('Erro ao carregar empresas');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validate
    const invalid = empresas.some(e => !e.nome.trim() || !e.cnpj.trim());
    if (invalid) {
      toast.error('Preencha nome e CNPJ de todas as empresas');
      return;
    }

    try {
      setSaving(true);
      await empresasConfigService.saveEmpresas(empresas);
      toast.success('Empresas salvas com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar empresas:', err);
      toast.error('Erro ao salvar empresas');
    } finally {
      setSaving(false);
    }
  };

  const addEmpresa = () => {
    const nextId = empresas.length > 0 ? Math.max(...empresas.map(e => e.id)) + 1 : 1;
    setEmpresas([...empresas, { id: nextId, nome: '', cnpj: '' }]);
  };

  const removeEmpresa = (id: number) => {
    setEmpresas(empresas.filter(e => e.id !== id));
  };

  const updateEmpresa = (id: number, field: keyof EmpresaConfig, value: string) => {
    setEmpresas(empresas.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Empresas do Sistema</CardTitle>
          </div>
          <Button size="sm" variant="outline" onClick={addEmpresa}>
            <Plus className="h-4 w-4 mr-1" />
            Adicionar
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Configure as empresas disponíveis para seleção no sistema
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {empresas.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma empresa cadastrada. Clique em "Adicionar" para começar.
          </p>
        )}
        {empresas.map((empresa) => (
          <div key={empresa.id} className="flex items-end gap-2 p-3 rounded-lg border bg-card">
            <div className="flex-1 space-y-1">
              <Label className="text-xs">Nome</Label>
              <Input
                value={empresa.nome}
                onChange={(e) => updateEmpresa(empresa.id, 'nome', e.target.value)}
                placeholder="Nome da empresa"
                className="h-8 text-sm"
              />
            </div>
            <div className="w-48 space-y-1">
              <Label className="text-xs">CNPJ</Label>
              <Input
                value={empresa.cnpj}
                onChange={(e) => updateEmpresa(empresa.id, 'cnpj', e.target.value)}
                placeholder="00.000.000/0000-00"
                className="h-8 text-sm"
              />
            </div>
            <div className="w-20 space-y-1">
              <Label className="text-xs">ID</Label>
              <Input
                value={empresa.id}
                disabled
                className="h-8 text-sm bg-muted"
              />
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              onClick={() => removeEmpresa(empresa.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        
        {empresas.length > 0 && (
          <div className="flex justify-end pt-3 border-t">
            <Button onClick={handleSave} disabled={saving} size="sm">
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  Salvar Empresas
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmpresasConfigSection;
