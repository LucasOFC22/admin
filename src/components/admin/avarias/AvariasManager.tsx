import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { toast } from 'sonner';
import { Plus, Search, AlertTriangle, Trash2, Eye, Loader2, X, PackageMinus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '@/components/admin/PageHeader';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AccessDenied from '@/components/admin/AccessDenied';

interface AvariaItem {
  id?: string;
  nfe: string;
  valor: string;
  descricao: string;
}

interface Avaria {
  id: string;
  mdfe: string;
  motorista_nome: string;
  observacoes: string | null;
  criado_em: string;
  ativo: boolean;
  avaria_itens?: { id: string; nfe: string; valor: number; descricao: string | null }[];
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const AvariasManager = () => {
  const [search, setSearch] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState<Avaria | null>(null);
  const [formMdfe, setFormMdfe] = useState('');
  const [formMotorista, setFormMotorista] = useState('');
  const [formObs, setFormObs] = useState('');
  const [itens, setItens] = useState<AvariaItem[]>([{ nfe: '', valor: '', descricao: '' }]);
  const [saving, setSaving] = useState(false);

  const { user } = useUnifiedAuth();
  const { canAccess } = usePermissionGuard();
  const queryClient = useQueryClient();

  const canView = canAccess('admin.avarias.visualizar');
  const canCreate = canAccess('admin.avarias.criar');

  const { data: avarias = [], isLoading } = useQuery({
    queryKey: ['avarias'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('avarias' as any)
        .select('*, avaria_itens(*)')
        .eq('ativo', true)
        .order('criado_em', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Avaria[];
    },
    enabled: canView,
  });

  const filtered = avarias.filter((a) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      a.mdfe.toLowerCase().includes(s) ||
      a.motorista_nome.toLowerCase().includes(s)
    );
  });

  const addItem = () => setItens([...itens, { nfe: '', valor: '', descricao: '' }]);

  const removeItem = (idx: number) => {
    if (itens.length <= 1) return;
    setItens(itens.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: keyof AvariaItem, value: string) => {
    const updated = [...itens];
    updated[idx] = { ...updated[idx], [field]: value };
    setItens(updated);
  };

  const resetForm = () => {
    setFormMdfe('');
    setFormMotorista('');
    setFormObs('');
    setItens([{ nfe: '', valor: '', descricao: '' }]);
  };

  const handleSave = async () => {
    if (!formMdfe.trim() || !formMotorista.trim()) {
      toast.error('MDF-e e nome do motorista são obrigatórios');
      return;
    }

    const validItens = itens.filter((i) => i.nfe.trim() && i.valor.trim());
    if (validItens.length === 0) {
      toast.error('Adicione ao menos um item com NF-e e valor');
      return;
    }

    setSaving(true);
    try {
      const { data: avaria, error } = await supabase
        .from('avarias' as any)
        .insert({
          mdfe: formMdfe.trim(),
          motorista_nome: formMotorista.trim(),
          observacoes: formObs.trim() || null,
          criado_por: user?.id || null,
        } as any)
        .select()
        .single();
      if (error) throw error;

      const itensPayload = validItens.map((i) => ({
        avaria_id: (avaria as any).id,
        nfe: i.nfe.trim(),
        valor: parseFloat(i.valor.replace(',', '.')) || 0,
        descricao: i.descricao.trim() || null,
      }));

      const { error: itensError } = await supabase
        .from('avaria_itens' as any)
        .insert(itensPayload as any);
      if (itensError) throw itensError;

      toast.success('Avaria registrada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['avarias'] });
      setShowCreateDialog(false);
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao registrar avaria');
    } finally {
      setSaving(false);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('avarias' as any)
        .update({ ativo: false } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avarias'] });
      toast.success('Avaria removida');
    },
    onError: () => toast.error('Erro ao remover avaria'),
  });

  if (!canView) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Avarias"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Operacional' },
          { label: 'Avarias' },
        ]}
      />

      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por MDF-e ou motorista..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {canCreate && (
          <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Registrar Avaria
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <PackageMinus className="h-12 w-12 mb-4 opacity-30" />
            <p className="text-lg font-medium">
              {search ? 'Nenhum resultado encontrado' : 'Nenhuma avaria registrada'}
            </p>
            <p className="text-sm">
              {search ? 'Tente outro termo de busca' : 'Clique em "Registrar Avaria" para começar'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>MDF-e</TableHead>
                  <TableHead>Motorista</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((avaria) => {
                  const totalValor = (avaria.avaria_itens || []).reduce((sum, i) => sum + Number(i.valor), 0);
                  return (
                    <TableRow key={avaria.id}>
                      <TableCell className="font-medium font-mono">{avaria.mdfe}</TableCell>
                      <TableCell>{avaria.motorista_nome}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{(avaria.avaria_itens || []).length} NF-e(s)</Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-destructive">
                        {formatCurrency(totalValor)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(avaria.criado_em), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="icon" title="Detalhes" onClick={() => setShowDetailDialog(avaria)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canCreate && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Excluir"
                              className="text-destructive hover:text-destructive"
                              onClick={() => deleteMutation.mutate(avaria.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Dialog Criar Avaria */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Registrar Avaria
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>MDF-e *</Label>
                <Input
                  placeholder="Número do MDF-e"
                  value={formMdfe}
                  onChange={(e) => setFormMdfe(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Motorista *</Label>
                <Input
                  placeholder="Nome do motorista"
                  value={formMotorista}
                  onChange={(e) => setFormMotorista(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                placeholder="Descrição geral da avaria..."
                value={formObs}
                onChange={(e) => setFormObs(e.target.value)}
                rows={2}
              />
            </div>

            {/* Itens */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Itens Avariados</Label>
                <Button variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-3 w-3 mr-1" />
                  Adicionar Item
                </Button>
              </div>

              {itens.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-start p-3 rounded-lg border bg-muted/30">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">NF-e *</Label>
                      <Input
                        placeholder="Nº NF-e"
                        value={item.nfe}
                        onChange={(e) => updateItem(idx, 'nfe', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Valor (R$) *</Label>
                      <Input
                        placeholder="0,00"
                        value={item.valor}
                        onChange={(e) => updateItem(idx, 'valor', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Descrição</Label>
                      <Input
                        placeholder="Detalhes"
                        value={item.descricao}
                        onChange={(e) => updateItem(idx, 'descricao', e.target.value)}
                      />
                    </div>
                  </div>
                  {itens.length > 1 && (
                    <Button variant="ghost" size="icon" className="mt-5 text-destructive" onClick={() => removeItem(idx)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Registrar Avaria'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Detalhes */}
      <Dialog open={!!showDetailDialog} onOpenChange={() => setShowDetailDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes da Avaria</DialogTitle>
          </DialogHeader>
          {showDetailDialog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">MDF-e</p>
                  <p className="font-mono font-semibold">{showDetailDialog.mdfe}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Motorista</p>
                  <p className="font-semibold">{showDetailDialog.motorista_nome}</p>
                </div>
              </div>
              {showDetailDialog.observacoes && (
                <div>
                  <p className="text-xs text-muted-foreground">Observações</p>
                  <p className="text-sm">{showDetailDialog.observacoes}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Itens Avariados</p>
                <div className="space-y-2">
                  {(showDetailDialog.avaria_itens || []).map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-2 rounded border bg-muted/30">
                      <div>
                        <span className="font-mono text-sm font-medium">NF-e {item.nfe}</span>
                        {item.descricao && <span className="text-xs text-muted-foreground ml-2">— {item.descricao}</span>}
                      </div>
                      <span className="font-semibold text-destructive">{formatCurrency(Number(item.valor))}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-3 mt-3 border-t">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-destructive text-lg">
                    {formatCurrency((showDetailDialog.avaria_itens || []).reduce((s, i) => s + Number(i.valor), 0))}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AvariasManager;
