import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { toast } from 'sonner';
import { Plus, Search, AlertTriangle, Trash2, Eye, Loader2, X, PackageMinus, TrendingDown, FileWarning, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
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
    return a.mdfe.toLowerCase().includes(s) || a.motorista_nome.toLowerCase().includes(s);
  });

  // Stats
  const totalAvarias = avarias.length;
  const totalValor = avarias.reduce((sum, a) => sum + (a.avaria_itens || []).reduce((s, i) => s + Number(i.valor), 0), 0);
  const totalItens = avarias.reduce((sum, a) => sum + (a.avaria_itens || []).length, 0);

  const addItem = () => setItens([...itens, { nfe: '', valor: '', descricao: '' }]);
  const removeItem = (idx: number) => { if (itens.length <= 1) return; setItens(itens.filter((_, i) => i !== idx)); };
  const updateItem = (idx: number, field: keyof AvariaItem, value: string) => {
    const updated = [...itens];
    updated[idx] = { ...updated[idx], [field]: value };
    setItens(updated);
  };

  const resetForm = () => { setFormMdfe(''); setFormMotorista(''); setFormObs(''); setItens([{ nfe: '', valor: '', descricao: '' }]); };

  const handleSave = async () => {
    if (!formMdfe.trim() || !formMotorista.trim()) { toast.error('MDF-e e nome do motorista são obrigatórios'); return; }
    const validItens = itens.filter((i) => i.nfe.trim() && i.valor.trim());
    if (validItens.length === 0) { toast.error('Adicione ao menos um item com NF-e e valor'); return; }

    setSaving(true);
    try {
      const { data: avaria, error } = await supabase
        .from('avarias' as any)
        .insert({ mdfe: formMdfe.trim(), motorista_nome: formMotorista.trim(), observacoes: formObs.trim() || null, criado_por: user?.id || null } as any)
        .select().single();
      if (error) throw error;

      const itensPayload = validItens.map((i) => ({
        avaria_id: (avaria as any).id,
        nfe: i.nfe.trim(),
        valor: parseFloat(i.valor.replace(',', '.')) || 0,
        descricao: i.descricao.trim() || null,
      }));
      const { error: itensError } = await supabase.from('avaria_itens' as any).insert(itensPayload as any);
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
      const { error } = await supabase.from('avarias' as any).update({ ativo: false } as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['avarias'] }); toast.success('Avaria removida'); },
    onError: () => toast.error('Erro ao remover avaria'),
  });

  if (!canView) return <AccessDenied />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Avarias"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Operacional' },
          { label: 'Avarias' },
        ]}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-destructive/70">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Avarias</p>
              <p className="text-2xl font-bold text-foreground">{totalAvarias}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500/70">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
              <TrendingDown className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Prejuízo Total</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(totalValor)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500/70">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <FileWarning className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">NF-e Afetadas</p>
              <p className="text-2xl font-bold text-foreground">{totalItens}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por MDF-e ou motorista..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        {canCreate && (
          <Button onClick={() => { resetForm(); setShowCreateDialog(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            Registrar Avaria
          </Button>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Carregando avarias...</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <PackageMinus className="h-8 w-8 opacity-40" />
            </div>
            <p className="text-lg font-semibold text-foreground/70">
              {search ? 'Nenhum resultado encontrado' : 'Nenhuma avaria registrada'}
            </p>
            <p className="text-sm mt-1">
              {search ? 'Tente outro termo de busca' : 'Clique em "Registrar Avaria" para começar'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-semibold">MDF-e</TableHead>
                  <TableHead className="font-semibold">Motorista</TableHead>
                  <TableHead className="font-semibold">Itens</TableHead>
                  <TableHead className="font-semibold">Valor Total</TableHead>
                  <TableHead className="font-semibold">Data</TableHead>
                  <TableHead className="text-right font-semibold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((avaria) => {
                  const totalValor = (avaria.avaria_itens || []).reduce((sum, i) => sum + Number(i.valor), 0);
                  return (
                    <TableRow key={avaria.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell>
                        <span className="font-mono font-semibold text-sm bg-muted/50 px-2 py-0.5 rounded">{avaria.mdfe}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Truck className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <span className="font-medium">{avaria.motorista_nome}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono">{(avaria.avaria_itens || []).length} NF-e</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-destructive">{formatCurrency(totalValor)}</span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(avaria.criado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="icon" title="Detalhes" onClick={() => setShowDetailDialog(avaria)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canCreate && (
                            <Button variant="ghost" size="icon" title="Excluir" className="text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(avaria.id)}>
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
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              Registrar Avaria
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-5 pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">MDF-e *</Label>
                <Input placeholder="Número do MDF-e" value={formMdfe} onChange={(e) => setFormMdfe(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Motorista *</Label>
                <Input placeholder="Nome do motorista" value={formMotorista} onChange={(e) => setFormMotorista(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Observações</Label>
              <Textarea placeholder="Descrição geral da avaria..." value={formObs} onChange={(e) => setFormObs(e.target.value)} rows={2} />
            </div>

            <Separator />

            {/* Itens */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-semibold">Itens Avariados</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Adicione as NF-e afetadas e seus respectivos valores</p>
                </div>
                <Button variant="outline" size="sm" onClick={addItem} className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar
                </Button>
              </div>

              <div className="space-y-2">
                {itens.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-start p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors">
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold mt-5 shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">NF-e *</Label>
                        <Input placeholder="Nº NF-e" value={item.nfe} onChange={(e) => updateItem(idx, 'nfe', e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Valor (R$) *</Label>
                        <Input placeholder="0,00" value={item.valor} onChange={(e) => updateItem(idx, 'valor', e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Descrição</Label>
                        <Input placeholder="Detalhes do dano" value={item.descricao} onChange={(e) => updateItem(idx, 'descricao', e.target.value)} />
                      </div>
                    </div>
                    {itens.length > 1 && (
                      <Button variant="ghost" size="icon" className="mt-5 text-destructive hover:text-destructive h-8 w-8" onClick={() => removeItem(idx)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
              {saving ? 'Salvando...' : 'Registrar Avaria'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Detalhes */}
      <Dialog open={!!showDetailDialog} onOpenChange={() => setShowDetailDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                <Eye className="h-4 w-4 text-muted-foreground" />
              </div>
              Detalhes da Avaria
            </DialogTitle>
          </DialogHeader>
          {showDetailDialog && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-muted/30 border-0">
                  <CardContent className="p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">MDF-e</p>
                    <p className="font-mono font-bold text-lg mt-0.5">{showDetailDialog.mdfe}</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30 border-0">
                  <CardContent className="p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Motorista</p>
                    <p className="font-semibold text-lg mt-0.5">{showDetailDialog.motorista_nome}</p>
                  </CardContent>
                </Card>
              </div>

              {showDetailDialog.observacoes && (
                <div className="p-3 rounded-lg bg-muted/20 border">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1">Observações</p>
                  <p className="text-sm">{showDetailDialog.observacoes}</p>
                </div>
              )}

              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-2">Itens Avariados</p>
                <div className="space-y-1.5">
                  {(showDetailDialog.avaria_itens || []).map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 rounded-lg border bg-card hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">NF-e {item.nfe}</Badge>
                        {item.descricao && <span className="text-xs text-muted-foreground">— {item.descricao}</span>}
                      </div>
                      <span className="font-bold text-destructive">{formatCurrency(Number(item.valor))}</span>
                    </div>
                  ))}
                </div>
                <Separator className="my-3" />
                <div className="flex justify-between items-center px-1">
                  <span className="font-semibold text-muted-foreground">Total</span>
                  <span className="font-bold text-destructive text-xl">
                    {formatCurrency((showDetailDialog.avaria_itens || []).reduce((s, i) => s + Number(i.valor), 0))}
                  </span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-right">
                Registrado em {format(new Date(showDetailDialog.criado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AvariasManager;
