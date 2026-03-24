import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { toast } from 'sonner';
import { Plus, Search, FileSpreadsheet, Trash2, Download, History, Loader2, Upload, X } from 'lucide-react';
import logoFpTranscargas from '@/assets/logo-fptransportes-2.png';
import logoAntt from '@/assets/logo-antt.png';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import PageHeader from '@/components/admin/PageHeader';
import TabelaFreteLogs from './TabelaFreteLogs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface TabelaFrete {
  id: string;
  nome: string;
  descricao: string | null;
  cliente_nome: string | null;
  cnpj: string | null;
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

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatCnpj = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
};

const TabelasFreteManager = () => {
  const [search, setSearch] = useState('');
  const [showLogs, setShowLogs] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingTabela, setEditingTabela] = useState<TabelaFrete | null>(null);
  const [formNome, setFormNome] = useState('');
  const [formCliente, setFormCliente] = useState('');
  const [formCnpj, setFormCnpj] = useState('');
  const [formDescricao, setFormDescricao] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
        .order('criado_em', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as TabelaFrete[];
    },
    enabled: canView,
  });

  const filtered = tabelas.filter((t) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (t.nome || '').toLowerCase().includes(s) ||
      (t.cliente_nome || '').toLowerCase().includes(s) ||
      (t.cnpj || '').replace(/\D/g, '').includes(s.replace(/\D/g, '')) ||
      (t.cnpj || '').toLowerCase().includes(s)
    );
  });

  const openCreate = () => {
    setEditingTabela(null);
    setFormNome('');
    setFormCliente('');
    setFormCnpj('');
    setFormDescricao('');
    setSelectedFile(null);
    setShowDialog(true);
  };

  const openEdit = (t: TabelaFrete) => {
    setEditingTabela(t);
    setFormNome(t.nome);
    setFormCliente(t.cliente_nome || '');
    setFormCnpj(t.cnpj || '');
    setFormDescricao(t.descricao || '');
    setSelectedFile(null);
    setShowDialog(true);
  };

  const uploadFile = async (file: File): Promise<{ url: string; path: string }> => {
    const ext = file.name.split('.').pop();
    const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('tabelas-frete').upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from('tabelas-frete').getPublicUrl(path);
    return { url: data.publicUrl, path };
  };

  const handleSave = async () => {
    if (!formNome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    if (!formCliente.trim()) {
      toast.error('Nome do cliente é obrigatório');
      return;
    }

    setUploading(true);
    try {
      let fileData: any = {};

      if (selectedFile) {
        const { url } = await uploadFile(selectedFile);
        fileData = {
          arquivo_url: url,
          arquivo_nome: selectedFile.name,
          arquivo_tipo: selectedFile.type,
          arquivo_tamanho: selectedFile.size,
        };
      }

      if (editingTabela) {
        const { error } = await supabase
          .from('tabelas_frete' as any)
          .update({
            nome: formNome,
            cliente_nome: formCliente,
            cnpj: formCnpj.replace(/\D/g, '') || null,
            descricao: formDescricao || null,
            atualizado_por: user?.id || null,
            ...fileData,
          } as any)
          .eq('id', editingTabela.id);
        if (error) throw error;

        await supabase.from('logs_tabelas_frete' as any).insert({
          tabela_frete_id: editingTabela.id,
          usuario_id: user?.id || null,
          usuario_nome: user?.nome || 'Sistema',
          acao: 'edicao',
          detalhes: { nome: formNome, cliente_nome: formCliente },
        } as any);

        toast.success('Tabela atualizada!');
      } else {
        if (!selectedFile) {
          toast.error('Anexe um arquivo para a tabela');
          setUploading(false);
          return;
        }

        const { data, error } = await supabase
          .from('tabelas_frete' as any)
          .insert({
            nome: formNome,
            cliente_nome: formCliente,
            cnpj: formCnpj.replace(/\D/g, '') || null,
            descricao: formDescricao || null,
            criado_por: user?.id || null,
            atualizado_por: user?.id || null,
            ...fileData,
          } as any)
          .select()
          .single();
        if (error) throw error;

        await supabase.from('logs_tabelas_frete' as any).insert({
          tabela_frete_id: (data as any).id,
          usuario_id: user?.id || null,
          usuario_nome: user?.nome || 'Sistema',
          acao: 'criacao',
          detalhes: { nome: formNome, cliente_nome: formCliente },
        } as any);

        toast.success('Tabela criada!');
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
      const { error } = await supabase
        .from('tabelas_frete' as any)
        .update({ ativo: false, atualizado_por: user?.id } as any)
        .eq('id', id);
      if (error) throw error;

      await supabase.from('logs_tabelas_frete' as any).insert({
        tabela_frete_id: id,
        usuario_id: user?.id || null,
        usuario_nome: user?.nome || 'Sistema',
        acao: 'exclusao',
        detalhes: {},
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tabelas-frete'] });
      toast.success('Tabela excluída');
    },
    onError: () => toast.error('Erro ao excluir tabela'),
  });

  if (showLogs) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Logs da Tabela de Frete"
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Tabelas de Frete', href: '/tabelas-frete' },
            { label: 'Logs' },
          ]}
        />
        <TabelaFreteLogs tabelaId={showLogs} onBack={() => setShowLogs(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Tabelas de Frete"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Operacional' },
          { label: 'Tabelas de Frete' },
        ]}
      />

      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, cliente ou CNPJ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {canCreate && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Tabela
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
            <FileSpreadsheet className="h-12 w-12 mb-4 opacity-30" />
            <p className="text-lg font-medium">
              {search ? 'Nenhum resultado encontrado' : 'Nenhuma tabela de frete'}
            </p>
            <p className="text-sm">
              {search ? 'Tente outro termo de busca' : 'Crie uma nova tabela para começar'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Arquivo</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((tabela) => (
                  <TableRow key={tabela.id}>
                    <TableCell className="font-medium">{tabela.nome}</TableCell>
                    <TableCell>{tabela.cliente_nome || '—'}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {tabela.cnpj ? formatCnpj(tabela.cnpj) : '—'}
                    </TableCell>
                    <TableCell>
                      {tabela.arquivo_nome ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {tabela.arquivo_nome.split('.').pop()?.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(tabela.arquivo_tamanho)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(tabela.criado_em), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        {tabela.arquivo_url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Baixar arquivo"
                            onClick={() => window.open(tabela.arquivo_url!, '_blank')}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        {canEdit && (
                          <Button variant="ghost" size="icon" title="Editar" onClick={() => openEdit(tabela)}>
                            <Upload className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" title="Logs" onClick={() => setShowLogs(tabela.id)}>
                          <History className="h-4 w-4" />
                        </Button>
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Excluir"
                            className="text-destructive hover:text-destructive"
                            onClick={() => deleteMutation.mutate(tabela.id)}
                          >
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTabela ? 'Editar Tabela de Frete' : 'Nova Tabela de Frete'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Tabela *</Label>
              <Input
                placeholder="Ex: Tabela Comercial 2026"
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Nome do Cliente *</Label>
              <Input
                placeholder="Ex: R Costa Ltda"
                value={formCliente}
                onChange={(e) => setFormCliente(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>CNPJ</Label>
              <Input
                placeholder="00.000.000/0000-00"
                value={formCnpj}
                onChange={(e) => setFormCnpj(formatCnpj(e.target.value))}
                maxLength={18}
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                placeholder="Observações sobre a tabela..."
                value={formDescricao}
                onChange={(e) => setFormDescricao(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>{editingTabela ? 'Substituir Arquivo' : 'Arquivo da Tabela *'}</Label>
              {editingTabela?.arquivo_nome && !selectedFile && (
                <div className="flex items-center gap-2 p-2 rounded-md bg-muted text-sm">
                  <FileSpreadsheet className="h-4 w-4" />
                  <span className="truncate">{editingTabela.arquivo_nome}</span>
                  <Badge variant="secondary" className="text-xs ml-auto">
                    {formatFileSize(editingTabela.arquivo_tamanho)}
                  </Badge>
                </div>
              )}
              {selectedFile && (
                <div className="flex items-center gap-2 p-2 rounded-md bg-primary/10 text-sm">
                  <FileSpreadsheet className="h-4 w-4 text-primary" />
                  <span className="truncate">{selectedFile.name}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto" onClick={() => setSelectedFile(null)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <Input
                type="file"
                accept=".pdf,.xlsx,.xls,.doc,.docx,.csv,.png,.jpg,.jpeg"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setSelectedFile(file);
                }}
              />
              <p className="text-xs text-muted-foreground">
                PDF, Excel, Word, CSV ou imagem (máx 10MB)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={uploading}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TabelasFreteManager;
