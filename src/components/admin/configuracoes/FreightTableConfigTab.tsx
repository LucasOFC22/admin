import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Plus, Trash2, RefreshCw, PackageOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface FaixaPreco {
  id: string;
  de: number;
  ate: number;
  valor_fixo: string;
  frete_peso: string;
  frete_valor: string;
  taxa: string;
  outros: string;
}

interface TabelaFreteConfig {
  dbId?: string;
  sequencia: string;
  nome: string;
  faixas: FaixaPreco[];
}

const DEFAULT_FAIXAS: FaixaPreco[] = [
  { id: '1', de: 1, ate: 10, valor_fixo: '110,00', frete_peso: '', frete_valor: '', taxa: '', outros: '' },
  { id: '2', de: 11, ate: 30, valor_fixo: '120,00', frete_peso: '', frete_valor: '', taxa: '', outros: '' },
  { id: '3', de: 31, ate: 50, valor_fixo: '130,00', frete_peso: '', frete_valor: '', taxa: '', outros: '' },
  { id: '4', de: 51, ate: 70, valor_fixo: '140,00', frete_peso: '', frete_valor: '', taxa: '', outros: '' },
  { id: '5', de: 71, ate: 100, valor_fixo: '160,00', frete_peso: '', frete_valor: '', taxa: '', outros: '' },
  { id: '6', de: 101, ate: 150, valor_fixo: '190,00', frete_peso: '', frete_valor: '', taxa: '', outros: '' },
  { id: '7', de: 151, ate: 200, valor_fixo: '220,00', frete_peso: '', frete_valor: '', taxa: '', outros: '' },
];

// Generate sequence: A, B, C, ..., Z, AA, AB, ...
const generateSequence = (index: number): string => {
  let seq = '';
  let n = index;
  do {
    seq = String.fromCharCode(65 + (n % 26)) + seq;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return seq;
};

const getNextSequence = (existingSequences: string[]): string => {
  if (existingSequences.length === 0) return 'A';
  // Find the highest sequence and get next
  const sorted = [...existingSequences].sort();
  const last = sorted[sorted.length - 1];
  // Convert letter sequence to index
  let index = 0;
  for (let i = 0; i < last.length; i++) {
    index = index * 26 + (last.charCodeAt(i) - 64);
  }
  return generateSequence(index);
};

const FreightTableConfigTab = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tabelas, setTabelas] = useState<TabelaFreteConfig[]>([]);
  const [editingTabela, setEditingTabela] = useState<TabelaFreteConfig | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const loadTabelas = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tabelas_frete')
        .select('*')
        .like('nome', '__CONFIG_TABELA_%')
        .eq('ativo', true)
        .order('sequencia', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const parsed = data.map((d: any) => {
          const dados = d.dados as { nome?: string; faixas?: FaixaPreco[] } | null;
          return {
            dbId: d.id,
            sequencia: d.sequencia || 'A',
            nome: dados?.nome || 'Tabela de Preços',
            faixas: dados?.faixas || DEFAULT_FAIXAS,
          };
        });
        setTabelas(parsed);
      }
    } catch (error) {
      console.error('Erro ao carregar tabelas:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTabelas();
  }, [loadTabelas]);

  const handleCreateNew = () => {
    const existingSeqs = tabelas.map(t => t.sequencia);
    const nextSeq = getNextSequence(existingSeqs);
    setEditingTabela({
      sequencia: nextSeq,
      nome: `Tabela de Preços ${nextSeq}`,
      faixas: [...DEFAULT_FAIXAS.map(f => ({ ...f, id: Date.now().toString() + Math.random() }))],
    });
    setShowDialog(true);
  };

  const handleEditTabela = (tabela: TabelaFreteConfig) => {
    setEditingTabela({ ...tabela, faixas: tabela.faixas.map(f => ({ ...f })) });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!editingTabela) return;
    setSaving(true);
    try {
      const dados = JSON.parse(JSON.stringify({ nome: editingTabela.nome, faixas: editingTabela.faixas }));
      const colunas = JSON.parse(JSON.stringify(['Faixa de Peso', 'Valor Fixo (R$)', 'Frete Peso (R$/kg)', 'Frete Valor (%)', 'Taxa (R$)', 'Outros (%)']));

      const payload = {
        nome: `__CONFIG_TABELA_${editingTabela.sequencia}__` as string,
        descricao: `Tabela de frete padrão ${editingTabela.sequencia}`,
        sequencia: editingTabela.sequencia,
        dados,
        colunas,
        ativo: true,
        atualizado_em: new Date().toISOString(),
      };

      if (editingTabela.dbId) {
        const { error } = await supabase
          .from('tabelas_frete')
          .update(payload)
          .eq('id', editingTabela.dbId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tabelas_frete')
          .insert(payload);
        if (error) throw error;
      }

      toast({ title: 'Sucesso', description: `Tabela ${editingTabela.sequencia} salva com sucesso!` });
      setShowDialog(false);
      setEditingTabela(null);
      await loadTabelas();
    } catch (error) {
      console.error('Erro ao salvar tabela:', error);
      toast({ title: 'Erro', description: 'Não foi possível salvar a tabela.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tabela: TabelaFreteConfig) => {
    if (!tabela.dbId) return;
    try {
      const { error } = await supabase
        .from('tabelas_frete')
        .update({ ativo: false } as any)
        .eq('id', tabela.dbId);
      if (error) throw error;
      toast({ title: 'Tabela excluída' });
      await loadTabelas();
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível excluir.', variant: 'destructive' });
    }
  };

  const updateFaixa = (id: string, field: keyof FaixaPreco, value: string | number) => {
    if (!editingTabela) return;
    setEditingTabela(prev => prev ? {
      ...prev,
      faixas: prev.faixas.map(f => f.id === id ? { ...f, [field]: value } : f),
    } : null);
  };

  const addFaixa = () => {
    if (!editingTabela) return;
    const lastFaixa = editingTabela.faixas[editingTabela.faixas.length - 1];
    const novaDe = lastFaixa ? lastFaixa.ate + 1 : 1;
    setEditingTabela(prev => prev ? {
      ...prev,
      faixas: [...prev.faixas, { id: Date.now().toString(), de: novaDe, ate: novaDe + 49, valor_fixo: '', frete_peso: '', frete_valor: '', taxa: '', outros: '' }],
    } : null);
  };

  const removeFaixa = (id: string) => {
    if (!editingTabela || editingTabela.faixas.length <= 1) return;
    setEditingTabela(prev => prev ? { ...prev, faixas: prev.faixas.filter(f => f.id !== id) } : null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Tabelas de Frete</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure as tabelas de preço padrão para cotações. Cada tabela recebe uma sequência automática (A, B, C...).
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Tabela
        </Button>
      </div>

      {/* Lista de tabelas criadas */}
      {tabelas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <PackageOpen className="h-12 w-12 mb-4 opacity-30" />
          <p className="text-lg font-medium">Nenhuma tabela de frete configurada</p>
          <p className="text-sm">Clique em "Nova Tabela" para criar a primeira</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {tabelas.map((tabela) => (
            <div
              key={tabela.dbId || tabela.sequencia}
              className="rounded-lg border bg-card p-4 flex items-center justify-between hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="text-lg font-bold px-3 py-1 bg-primary/10 text-primary border-primary/30">
                  {tabela.sequencia}
                </Badge>
                <div>
                  <p className="font-medium text-foreground">{tabela.nome}</p>
                  <p className="text-xs text-muted-foreground">{tabela.faixas.length} faixas de peso</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEditTabela(tabela)}>
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(tabela)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog editar/criar tabela */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {editingTabela && (
                <Badge variant="outline" className="text-lg font-bold px-3 py-1 bg-primary/10 text-primary border-primary/30">
                  {editingTabela.sequencia}
                </Badge>
              )}
              {editingTabela?.dbId ? 'Editar Tabela' : 'Nova Tabela'}
            </DialogTitle>
          </DialogHeader>

          {editingTabela && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sequência</Label>
                  <Input value={editingTabela.sequencia} disabled className="bg-muted font-bold text-lg" />
                </div>
                <div className="space-y-2">
                  <Label>Nome da Tabela</Label>
                  <Input
                    value={editingTabela.nome}
                    onChange={(e) => setEditingTabela(prev => prev ? { ...prev, nome: e.target.value } : null)}
                    placeholder="Ex: Tabela de Preços de 01 a 200 Kg"
                  />
                </div>
              </div>

              {/* Tabela de Faixas */}
              <div className="rounded-lg border bg-card overflow-hidden">
                <div className="bg-muted/50 px-4 py-3 border-b flex items-center gap-2">
                  <PackageOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Faixas de Peso e Preços</span>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="w-[80px] text-center">De (kg)</TableHead>
                        <TableHead className="w-[80px] text-center">Até (kg)</TableHead>
                        <TableHead className="text-center">Valor Fixo (R$)</TableHead>
                        <TableHead className="text-center">Frete Peso (R$/kg)</TableHead>
                        <TableHead className="text-center">Frete Valor (%)</TableHead>
                        <TableHead className="text-center">Taxa (R$)</TableHead>
                        <TableHead className="text-center">Outros (%)</TableHead>
                        <TableHead className="w-[50px]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {editingTabela.faixas.map((faixa, index) => (
                        <TableRow key={faixa.id} className={index % 2 === 0 ? '' : 'bg-muted/20'}>
                          <TableCell className="p-1">
                            <Input type="number" value={faixa.de} onChange={(e) => updateFaixa(faixa.id, 'de', Number(e.target.value))} className="h-8 text-center text-sm" min={0} />
                          </TableCell>
                          <TableCell className="p-1">
                            <Input type="number" value={faixa.ate} onChange={(e) => updateFaixa(faixa.id, 'ate', Number(e.target.value))} className="h-8 text-center text-sm" min={0} />
                          </TableCell>
                          <TableCell className="p-1">
                            <Input value={faixa.valor_fixo} onChange={(e) => updateFaixa(faixa.id, 'valor_fixo', e.target.value)} className="h-8 text-center text-sm" placeholder="0,00" />
                          </TableCell>
                          <TableCell className="p-1">
                            <Input value={faixa.frete_peso} onChange={(e) => updateFaixa(faixa.id, 'frete_peso', e.target.value)} className="h-8 text-center text-sm" placeholder="0,00" />
                          </TableCell>
                          <TableCell className="p-1">
                            <Input value={faixa.frete_valor} onChange={(e) => updateFaixa(faixa.id, 'frete_valor', e.target.value)} className="h-8 text-center text-sm" placeholder="0,0" />
                          </TableCell>
                          <TableCell className="p-1">
                            <Input value={faixa.taxa} onChange={(e) => updateFaixa(faixa.id, 'taxa', e.target.value)} className="h-8 text-center text-sm" placeholder="0,00" />
                          </TableCell>
                          <TableCell className="p-1">
                            <Input value={faixa.outros} onChange={(e) => updateFaixa(faixa.id, 'outros', e.target.value)} className="h-8 text-center text-sm" placeholder="0,0" />
                          </TableCell>
                          <TableCell className="p-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => removeFaixa(faixa.id)} disabled={editingTabela.faixas.length <= 1}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="px-4 py-3 border-t bg-muted/30">
                  <Button variant="outline" size="sm" onClick={addFaixa}>
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Faixa
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Tabela
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FreightTableConfigTab;
