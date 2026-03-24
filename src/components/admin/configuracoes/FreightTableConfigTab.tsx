import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Plus, Trash2, RefreshCw, PackageOpen } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
  id?: string;
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

const FreightTableConfigTab = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tabela, setTabela] = useState<TabelaFreteConfig>({
    nome: 'Tabela de Preços Padrão',
    faixas: DEFAULT_FAIXAS,
  });

  const loadTabela = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tabelas_frete')
        .select('*')
        .eq('nome', '__CONFIG_TABELA_PADRAO__')
        .eq('ativo', true)
        .maybeSingle();

      if (error) throw error;

      if (data && data.dados) {
        const dados = data.dados as { nome?: string; faixas?: FaixaPreco[] };
        setTabela({
          id: data.id,
          nome: dados.nome || 'Tabela de Preços Padrão',
          faixas: dados.faixas || DEFAULT_FAIXAS,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar tabela:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTabela();
  }, [loadTabela]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const dados = JSON.parse(JSON.stringify({ nome: tabela.nome, faixas: tabela.faixas }));
      const colunas = JSON.parse(JSON.stringify(['Faixa de Peso', 'Valor Fixo (R$)', 'Frete Peso (R$/kg)', 'Frete Valor (%)', 'Taxa (R$)', 'Outros (%)']));
      
      const payload = {
        nome: '__CONFIG_TABELA_PADRAO__' as string,
        descricao: 'Tabela de preços padrão do sistema',
        dados,
        colunas,
        ativo: true,
        atualizado_em: new Date().toISOString(),
      };

      if (tabela.id) {
        const { error } = await supabase
          .from('tabelas_frete')
          .update(payload)
          .eq('id', tabela.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tabelas_frete')
          .insert({ ...payload, nome: '__CONFIG_TABELA_PADRAO__' });
        if (error) throw error;
      }

      toast({ title: 'Sucesso', description: 'Tabela de frete salva com sucesso!' });
      await loadTabela();
    } catch (error) {
      console.error('Erro ao salvar tabela:', error);
      toast({ title: 'Erro', description: 'Não foi possível salvar a tabela.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const updateFaixa = (id: string, field: keyof FaixaPreco, value: string | number) => {
    setTabela(prev => ({
      ...prev,
      faixas: prev.faixas.map(f => f.id === id ? { ...f, [field]: value } : f),
    }));
  };

  const addFaixa = () => {
    const lastFaixa = tabela.faixas[tabela.faixas.length - 1];
    const novaDe = lastFaixa ? lastFaixa.ate + 1 : 1;
    const novaAte = novaDe + 49;
    setTabela(prev => ({
      ...prev,
      faixas: [
        ...prev.faixas,
        {
          id: Date.now().toString(),
          de: novaDe,
          ate: novaAte,
          valor_fixo: '',
          frete_peso: '',
          frete_valor: '',
          taxa: '',
          outros: '',
        },
      ],
    }));
  };

  const removeFaixa = (id: string) => {
    if (tabela.faixas.length <= 1) return;
    setTabela(prev => ({
      ...prev,
      faixas: prev.faixas.filter(f => f.id !== id),
    }));
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
      <div className="border-b pb-4">
        <h2 className="text-xl font-semibold text-foreground">Tabela de Frete</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure as faixas de preço padrão para cotações de frete
        </p>
      </div>

      {/* Nome da Tabela */}
      <div className="space-y-2">
        <Label htmlFor="nome-tabela">Nome da Tabela</Label>
        <Input
          id="nome-tabela"
          value={tabela.nome}
          onChange={(e) => setTabela(prev => ({ ...prev, nome: e.target.value }))}
          placeholder="Ex: Tabela de Preços de 01 a 200 Kg"
        />
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
              {tabela.faixas.map((faixa, index) => (
                <TableRow key={faixa.id} className={index % 2 === 0 ? '' : 'bg-muted/20'}>
                  <TableCell className="p-1">
                    <Input
                      type="number"
                      value={faixa.de}
                      onChange={(e) => updateFaixa(faixa.id, 'de', Number(e.target.value))}
                      className="h-8 text-center text-sm"
                      min={0}
                    />
                  </TableCell>
                  <TableCell className="p-1">
                    <Input
                      type="number"
                      value={faixa.ate}
                      onChange={(e) => updateFaixa(faixa.id, 'ate', Number(e.target.value))}
                      className="h-8 text-center text-sm"
                      min={0}
                    />
                  </TableCell>
                  <TableCell className="p-1">
                    <Input
                      value={faixa.valor_fixo}
                      onChange={(e) => updateFaixa(faixa.id, 'valor_fixo', e.target.value)}
                      className="h-8 text-center text-sm"
                      placeholder="0,00"
                    />
                  </TableCell>
                  <TableCell className="p-1">
                    <Input
                      value={faixa.frete_peso}
                      onChange={(e) => updateFaixa(faixa.id, 'frete_peso', e.target.value)}
                      className="h-8 text-center text-sm"
                      placeholder="0,00"
                    />
                  </TableCell>
                  <TableCell className="p-1">
                    <Input
                      value={faixa.frete_valor}
                      onChange={(e) => updateFaixa(faixa.id, 'frete_valor', e.target.value)}
                      className="h-8 text-center text-sm"
                      placeholder="0,0"
                    />
                  </TableCell>
                  <TableCell className="p-1">
                    <Input
                      value={faixa.taxa}
                      onChange={(e) => updateFaixa(faixa.id, 'taxa', e.target.value)}
                      className="h-8 text-center text-sm"
                      placeholder="0,00"
                    />
                  </TableCell>
                  <TableCell className="p-1">
                    <Input
                      value={faixa.outros}
                      onChange={(e) => updateFaixa(faixa.id, 'outros', e.target.value)}
                      className="h-8 text-center text-sm"
                      placeholder="0,0"
                    />
                  </TableCell>
                  <TableCell className="p-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => removeFaixa(faixa.id)}
                      disabled={tabela.faixas.length <= 1}
                    >
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

      {/* Save */}
      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Salvar Tabela de Frete
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default FreightTableConfigTab;
