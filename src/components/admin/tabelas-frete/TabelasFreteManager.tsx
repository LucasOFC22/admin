import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { toast } from 'sonner';
import { Plus, Search, FileSpreadsheet, Trash2, Download, History, Loader2, Upload, X, Files, Users, Building2, Edit3, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import PageHeader from '@/components/admin/PageHeader';
import TabelaFreteLogs from './TabelaFreteLogs';
import ContratoEditor, { type ContratoSaveData } from './ContratoEditor';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface TabelaFrete {
  id: string;
  nome: string;
  descricao: string | null;
  cliente_nome: string | null;
  cnpj: string | null;
  telefone: string | null;
  forma_pagamento: string | null;
  pessoa_responsavel: string | null;
  tabela_config_id: string | null;
  sequencia: string | null;
  dados: any;
  arquivo_url: string | null;
  arquivo_nome: string | null;
  arquivo_tipo: string | null;
  arquivo_tamanho: number | null;
  criado_por: string | null;
  criado_em: string;
  atualizado_em: string;
  atualizado_por: string | null;
  ativo: boolean;
}

interface TabelaFreteConfigOption {
  id: string;
  sequencia: string | null;
  dados: { nome?: string; faixas?: any[] } | null;
  colunas: unknown;
}

const formatCpfCnpj = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 11) {
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
};

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const PAYMENT_OPTIONS = ['Carteira', 'Boleto Mensal', 'Quinzenal'] as const;

const TabelasFreteManager = () => {
  const [search, setSearch] = useState('');
  const [showLogs, setShowLogs] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editorTabela, setEditorTabela] = useState<TabelaFrete | null>(null);
  const [editorSaving, setEditorSaving] = useState(false);
  const [editingTabela, setEditingTabela] = useState<TabelaFrete | null>(null);
  const [formNome, setFormNome] = useState('');
  const [formCliente, setFormCliente] = useState('');
  const [formCnpj, setFormCnpj] = useState('');
  const [formTelefone, setFormTelefone] = useState('');
  const [formFormaPagamento, setFormFormaPagamento] = useState('');
  const [formPessoaResponsavel, setFormPessoaResponsavel] = useState('');
  const [formTabelaConfigId, setFormTabelaConfigId] = useState('');
  const [formDescricao, setFormDescricao] = useState('');
  const [uploading, setUploading] = useState(false);

  const { user } = useUnifiedAuth();
  const { canAccess } = usePermissionGuard();
  const queryClient = useQueryClient();

  const canView = canAccess('admin.tabelas-frete.visualizar');
  const canCreate = canAccess('admin.tabelas-frete.criar');
  const canEdit = canAccess('admin.tabelas-frete.editar');
  const canDelete = canAccess('admin.tabelas-frete.excluir');

  const { data: tabelas = [], isLoading } = useQuery({
    queryKey: ['tabelas-frete'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tabelas_frete' as any)
        .select('*')
        .eq('ativo', true)
        .not('nome', 'like', '__CONFIG_TABELA_%')
        .order('criado_em', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as TabelaFrete[];
    },
    enabled: canView,
  });

  const { data: tabelasConfig = [] } = useQuery({
    queryKey: ['tabelas-frete-config-options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tabelas_frete' as any)
        .select('id, sequencia, dados, colunas')
        .eq('ativo', true)
        .like('nome', '__CONFIG_TABELA_%')
        .order('sequencia', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as TabelaFreteConfigOption[];
    },
    enabled: canView,
  });

  const configLabelsById = new Map(
    tabelasConfig.map((c) => [c.id, `${c.sequencia ? `Tabela ${c.sequencia}` : 'Tabela'}${c.dados?.nome ? ` • ${c.dados.nome}` : ''}`])
  );

  const filtered = tabelas.filter((t) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (t.nome || '').toLowerCase().includes(s) ||
      (t.cliente_nome || '').toLowerCase().includes(s) ||
      (t.pessoa_responsavel || '').toLowerCase().includes(s) ||
      (t.telefone || '').replace(/\D/g, '').includes(s.replace(/\D/g, '')) ||
      (t.forma_pagamento || '').toLowerCase().includes(s) ||
      (t.cnpj || '').replace(/\D/g, '').includes(s.replace(/\D/g, '')) ||
      (t.cnpj || '').toLowerCase().includes(s)
    );
  });

  // Stats
  const totalTabelas = tabelas.length;
  const uniqueClients = new Set(tabelas.map(t => t.cnpj).filter(Boolean)).size;

  const openCreate = () => {
    setEditingTabela(null); setFormNome(''); setFormCliente(''); setFormCnpj('');
    setFormTelefone(''); setFormFormaPagamento(''); setFormPessoaResponsavel('');
    setFormTabelaConfigId(''); setFormDescricao(''); setShowDialog(true);
  };

  const openEdit = (t: TabelaFrete) => {
    setEditingTabela(t); setFormNome(t.nome); setFormCliente(t.cliente_nome || '');
    setFormCnpj(t.cnpj ? formatCpfCnpj(t.cnpj) : '');
    setFormTelefone(t.telefone ? formatPhone(t.telefone) : '');
    setFormFormaPagamento(t.forma_pagamento || '');
    setFormPessoaResponsavel(t.pessoa_responsavel || '');
    setFormTabelaConfigId(t.tabela_config_id || '');
    setFormDescricao(t.descricao || ''); setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formNome.trim()) { toast.error('Nome é obrigatório'); return; }
    if (!formCliente.trim()) { toast.error('Razão social é obrigatória'); return; }
    if (!formCnpj.trim()) { toast.error('CNPJ/CPF é obrigatório'); return; }
    if (!formTelefone.trim()) { toast.error('Número de contato é obrigatório'); return; }
    if (!formFormaPagamento) { toast.error('Selecione a forma de pagamento'); return; }
    if (!formTabelaConfigId) { toast.error('Selecione uma tabela de frete base'); return; }

    const selectedConfig = tabelasConfig.find((c) => c.id === formTabelaConfigId);
    const cnpjCpf = formCnpj.replace(/\D/g, '') || null;
    const telefone = formTelefone.replace(/\D/g, '') || null;

    setUploading(true);
    try {
      if (editingTabela) {
        const { error } = await supabase.from('tabelas_frete' as any).update({
          nome: formNome, cliente_nome: formCliente, cnpj: cnpjCpf, telefone,
          forma_pagamento: formFormaPagamento, pessoa_responsavel: formPessoaResponsavel || null,
          tabela_config_id: formTabelaConfigId, sequencia: null,
          dados: selectedConfig?.dados || {}, colunas: selectedConfig?.colunas || [],
          descricao: formDescricao || null, atualizado_por: user?.id || null,
        } as any).eq('id', editingTabela.id);
        if (error) throw error;
        await supabase.from('logs_tabelas_frete' as any).insert({
          tabela_frete_id: editingTabela.id, usuario_id: user?.id || null,
          usuario_nome: user?.nome || 'Sistema', acao: 'edicao',
          detalhes: { nome: formNome, cliente_nome: formCliente },
        } as any);
        toast.success('Tabela atualizada!');
      } else {
        const { data, error } = await supabase.from('tabelas_frete' as any).insert({
          nome: formNome, cliente_nome: formCliente, cnpj: cnpjCpf, telefone,
          forma_pagamento: formFormaPagamento, pessoa_responsavel: formPessoaResponsavel || null,
          tabela_config_id: formTabelaConfigId, sequencia: null,
          dados: selectedConfig?.dados || {}, colunas: selectedConfig?.colunas || [],
          descricao: formDescricao || null, criado_por: user?.id || null, atualizado_por: user?.id || null,
        } as any).select().single();
        if (error) throw error;
        await supabase.from('logs_tabelas_frete' as any).insert({
          tabela_frete_id: (data as any).id, usuario_id: user?.id || null,
          usuario_nome: user?.nome || 'Sistema', acao: 'criacao',
          detalhes: { nome: formNome, cliente_nome: formCliente },
        } as any);

        const newTabela: TabelaFrete = {
          ...(data as any), nome: formNome, cliente_nome: formCliente, cnpj: cnpjCpf,
          telefone, forma_pagamento: formFormaPagamento, pessoa_responsavel: formPessoaResponsavel || null,
          tabela_config_id: formTabelaConfigId, sequencia: null, dados: selectedConfig?.dados || {},
          descricao: formDescricao || null, ativo: true,
        };

        toast.success('Tabela criada! Abrindo editor de contrato...');
        queryClient.invalidateQueries({ queryKey: ['tabelas-frete'] });
        setShowDialog(false);
        openContratoEditor(newTabela);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['tabelas-frete'] });
      setShowDialog(false);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar tabela');
    } finally {
      setUploading(false);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tabelas_frete' as any).update({ ativo: false, atualizado_por: user?.id } as any).eq('id', id);
      if (error) throw error;
      await supabase.from('logs_tabelas_frete' as any).insert({
        tabela_frete_id: id, usuario_id: user?.id || null, usuario_nome: user?.nome || 'Sistema', acao: 'exclusao', detalhes: {},
      } as any);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tabelas-frete'] }); toast.success('Tabela excluída'); },
    onError: () => toast.error('Erro ao excluir tabela'),
  });

  const openContratoEditor = (tabela: TabelaFrete) => { setEditorTabela(tabela); setShowEditor(true); };

  const handleContratoSave = async (dados: ContratoSaveData) => {
    if (!editorTabela) return;
    setEditorSaving(true);
    try {
      const updatedDados = { ...(editorTabela.dados || {}), contrato: dados };
      const { error } = await supabase.from('tabelas_frete' as any)
        .update({ dados: updatedDados, atualizado_por: user?.id || null } as any).eq('id', editorTabela.id);
      if (error) throw error;
      await supabase.from('logs_tabelas_frete' as any).insert({
        tabela_frete_id: editorTabela.id, usuario_id: user?.id || null,
        usuario_nome: user?.nome || 'Sistema', acao: 'edicao_contrato', detalhes: { contrato_salvo: true },
      } as any);
      setEditorTabela(prev => prev ? { ...prev, dados: updatedDados } : null);
      queryClient.invalidateQueries({ queryKey: ['tabelas-frete'] });
      toast.success('Contrato salvo com sucesso!');
    } catch (err) { console.error(err); toast.error('Erro ao salvar contrato'); }
    finally { setEditorSaving(false); }
  };

  if (showEditor && editorTabela) {
    const cfgData = tabelasConfig.find(c => c.id === editorTabela.tabela_config_id);
    const faixas = cfgData?.dados?.faixas || editorTabela.dados?.faixas || [];
    const contratoSalvo = editorTabela.dados?.contrato;
    return (
      <ContratoEditor
        clienteNome={editorTabela.cliente_nome || editorTabela.nome}
        cnpj={editorTabela.cnpj || ''} telefone={editorTabela.telefone || ''}
        formaPagamento={editorTabela.forma_pagamento || ''}
        contatoNome={editorTabela.pessoa_responsavel || undefined}
        tabelaSequencia={cfgData?.sequencia || editorTabela.sequencia || null}
        tabelaNome={cfgData?.dados?.nome || null} faixas={faixas}
        percursos={contratoSalvo?.percursos}
        onSave={handleContratoSave}
        onBack={() => { setShowEditor(false); setEditorTabela(null); }}
        saving={editorSaving}
      />
    );
  }

  if (showLogs) {
    return (
      <div className="space-y-4">
        <PageHeader title="Logs da Tabela de Frete" breadcrumbs={[
          { label: 'Dashboard', href: '/' }, { label: 'Tabelas de Frete', href: '/tabelas-frete' }, { label: 'Logs' },
        ]} />
        <TabelaFreteLogs tabelaId={showLogs} onBack={() => setShowLogs(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Tabelas de Frete" breadcrumbs={[
        { label: 'Dashboard', href: '/' }, { label: 'Operacional' }, { label: 'Tabelas de Frete' },
      ]} />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-primary/70">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Files className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Tabelas</p>
              <p className="text-2xl font-bold text-foreground">{totalTabelas}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500/70">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Building2 className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Clientes</p>
              <p className="text-2xl font-bold text-foreground">{uniqueClients}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500/70">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Tabelas Config</p>
              <p className="text-2xl font-bold text-foreground">{tabelasConfig.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, cliente, CNPJ/CPF, responsável..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        {canCreate && (
          <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Nova Tabela</Button>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Carregando tabelas...</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <FileSpreadsheet className="h-8 w-8 opacity-40" />
            </div>
            <p className="text-lg font-semibold text-foreground/70">{search ? 'Nenhum resultado encontrado' : 'Nenhuma tabela de frete'}</p>
            <p className="text-sm mt-1">{search ? 'Tente outro termo de busca' : 'Crie uma nova tabela para começar'}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-semibold">Nome</TableHead>
                  <TableHead className="font-semibold">Cliente</TableHead>
                  <TableHead className="font-semibold">CNPJ/CPF</TableHead>
                  <TableHead className="font-semibold">Responsável</TableHead>
                  <TableHead className="font-semibold">Pagamento</TableHead>
                  <TableHead className="font-semibold">Tabela Base</TableHead>
                  <TableHead className="font-semibold">Criado em</TableHead>
                  <TableHead className="text-right font-semibold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((tabela) => (
                  <TableRow key={tabela.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="font-medium">{tabela.nome}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Building2 className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <span>{tabela.cliente_nome || '—'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm bg-muted/50 px-1.5 py-0.5 rounded">
                        {tabela.cnpj ? formatCpfCnpj(tabela.cnpj) : '—'}
                      </span>
                    </TableCell>
                    <TableCell>{tabela.pessoa_responsavel || '—'}</TableCell>
                    <TableCell>
                      {tabela.forma_pagamento ? (
                        <Badge variant="outline" className="text-xs">{tabela.forma_pagamento}</Badge>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {tabela.tabela_config_id
                        ? <Badge variant="secondary" className="text-xs">{configLabelsById.get(tabela.tabela_config_id) || 'N/A'}</Badge>
                        : tabela.sequencia ? `Tabela ${tabela.sequencia}` : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(tabela.criado_em), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" title="Abrir Contrato" onClick={() => openContratoEditor(tabela)}>
                          <FileText className="h-4 w-4" />
                        </Button>
                        {canEdit && (
                          <Button variant="ghost" size="icon" title="Editar" onClick={() => openEdit(tabela)}>
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" title="Logs" onClick={() => setShowLogs(tabela.id)}>
                          <History className="h-4 w-4" />
                        </Button>
                        {canDelete && (
                          <Button variant="ghost" size="icon" title="Excluir" className="text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(tabela.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Dialog criar/editar */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileSpreadsheet className="h-4 w-4 text-primary" />
              </div>
              {editingTabela ? 'Editar Tabela de Frete' : 'Nova Tabela de Frete'}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            <div className="space-y-2">
              <Label>Nome da Tabela *</Label>
              <Input placeholder="Ex: Tabela Comercial 2026" value={formNome} onChange={(e) => setFormNome(e.target.value)} />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Razão Social do Cliente *</Label>
              <Input placeholder="Ex: R Costa Ltda" value={formCliente} onChange={(e) => setFormCliente(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CNPJ/CPF *</Label>
                <Input placeholder="00.000.000/0000-00" value={formCnpj} onChange={(e) => setFormCnpj(formatCpfCnpj(e.target.value))} maxLength={18} />
              </div>
              <div className="space-y-2">
                <Label>Número de Contato *</Label>
                <Input placeholder="(00) 00000-0000" value={formTelefone} onChange={(e) => setFormTelefone(formatPhone(e.target.value))} maxLength={15} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Pessoa Responsável</Label>
              <Input placeholder="Nome do responsável pelo contrato" value={formPessoaResponsavel} onChange={(e) => setFormPessoaResponsavel(e.target.value)} />
            </div>

            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Forma de Pagamento *</Label>
                <Select value={formFormaPagamento || undefined} onValueChange={setFormFormaPagamento}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_OPTIONS.map((opt) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tabela de Frete Base *</Label>
                <Select value={formTabelaConfigId || undefined} onValueChange={setFormTabelaConfigId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {tabelasConfig.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {`${c.sequencia ? `Tabela ${c.sequencia}` : 'Tabela'}${c.dados?.nome ? ` • ${c.dados.nome}` : ''}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Input placeholder="Observações sobre a tabela..." value={formDescricao} onChange={(e) => setFormDescricao(e.target.value)} />
            </div>
          </div>

          <DialogFooter className="shrink-0 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={uploading}>Cancelar</Button>
            <Button onClick={handleSave} disabled={uploading} className="gap-2">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {uploading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TabelasFreteManager;
