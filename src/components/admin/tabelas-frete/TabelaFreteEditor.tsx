import { useState, useCallback, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { toast } from 'sonner';
import { ArrowLeft, Save, Plus, Trash2, History, Download, Upload, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { TabelaFrete } from './TabelasFreteManager';
import * as XLSX from 'xlsx';

interface TabelaFreteEditorProps {
  tabela: TabelaFrete;
  canEdit: boolean;
  onBack: () => void;
  onShowLogs: () => void;
}

const TabelaFreteEditor = ({ tabela, canEdit, onBack, onShowLogs }: TabelaFreteEditorProps) => {
  const { user } = useUnifiedAuth();
  const [nome, setNome] = useState(tabela.nome);
  const [descricao, setDescricao] = useState(tabela.descricao || '');
  const [colunas, setColunas] = useState<string[]>(tabela.colunas || ['Col 1']);
  const [dados, setDados] = useState<string[][]>(tabela.dados || [['']]);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingCell]);

  const markChanged = () => setHasChanges(true);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('tabelas_frete' as any)
        .update({
          nome,
          descricao: descricao || null,
          colunas,
          dados,
          atualizado_por: user?.id,
        } as any)
        .eq('id', tabela.id);
      if (error) throw error;

      await supabase.from('logs_tabelas_frete' as any).insert({
        tabela_frete_id: tabela.id,
        usuario_id: user?.id || null,
        usuario_nome: user?.nome || 'Sistema',
        acao: 'edicao',
        detalhes: { nome, colunas_count: colunas.length, linhas_count: dados.length },
      } as any);
    },
    onSuccess: () => {
      setHasChanges(false);
      toast.success('Tabela salva com sucesso!');
    },
    onError: () => toast.error('Erro ao salvar tabela'),
  });

  const updateCell = useCallback((row: number, col: number, value: string) => {
    setDados(prev => {
      const newDados = prev.map(r => [...r]);
      if (!newDados[row]) newDados[row] = new Array(colunas.length).fill('');
      newDados[row][col] = value;
      return newDados;
    });
    markChanged();
  }, [colunas.length]);

  const updateColuna = useCallback((index: number, value: string) => {
    setColunas(prev => {
      const newColunas = [...prev];
      newColunas[index] = value;
      return newColunas;
    });
    markChanged();
  }, []);

  const addRow = () => {
    setDados(prev => [...prev, new Array(colunas.length).fill('')]);
    markChanged();
  };

  const removeRow = (index: number) => {
    if (dados.length <= 1) return;
    setDados(prev => prev.filter((_, i) => i !== index));
    markChanged();
  };

  const addColumn = () => {
    setColunas(prev => [...prev, `Col ${prev.length + 1}`]);
    setDados(prev => prev.map(row => [...row, '']));
    markChanged();
  };

  const removeColumn = (index: number) => {
    if (colunas.length <= 1) return;
    setColunas(prev => prev.filter((_, i) => i !== index));
    setDados(prev => prev.map(row => row.filter((_, i) => i !== index)));
    markChanged();
  };

  const exportToExcel = () => {
    const wsData = [colunas, ...dados];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, nome);
    XLSX.writeFile(wb, `${nome.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
    toast.success('Arquivo exportado!');
  };

  const importFromExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const jsonData: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
      if (jsonData.length > 0) {
        setColunas(jsonData[0].map(String));
        setDados(jsonData.slice(1).map(row => row.map(String)));
        markChanged();
        toast.success(`Importado: ${jsonData.length - 1} linhas`);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleKeyDown = (e: React.KeyboardEvent, row: number, col: number) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const nextCol = e.shiftKey ? col - 1 : col + 1;
      if (nextCol >= 0 && nextCol < colunas.length) {
        setEditingCell({ row, col: nextCol });
      } else if (!e.shiftKey && nextCol >= colunas.length && row + 1 < dados.length) {
        setEditingCell({ row: row + 1, col: 0 });
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (row + 1 < dados.length) {
        setEditingCell({ row: row + 1, col });
      } else {
        setEditingCell(null);
      }
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title={nome}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Tabelas de Frete', href: '/tabelas-frete' },
          { label: nome },
        ]}
      />

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onShowLogs}>
            <History className="h-4 w-4 mr-2" />
            Logs
          </Button>
          <Button variant="outline" onClick={exportToExcel}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
          <label>
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={importFromExcel} />
            <Button variant="outline" asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                Importar Excel
              </span>
            </Button>
          </label>
          {canEdit && (
            <Button onClick={() => saveMutation.mutate()} disabled={!hasChanges || saveMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
              {hasChanges && <Badge variant="destructive" className="ml-2 text-[10px] px-1">●</Badge>}
            </Button>
          )}
        </div>
      </div>

      {/* Nome e Descrição */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nome da Tabela</label>
              <Input value={nome} onChange={(e) => { setNome(e.target.value); markChanged(); }} disabled={!canEdit} />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Descrição</label>
              <Input value={descricao} onChange={(e) => { setDescricao(e.target.value); markChanged(); }} disabled={!canEdit} placeholder="Descrição opcional..." />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Spreadsheet Editor */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Editor de Dados</CardTitle>
            {canEdit && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={addColumn}>
                  <Plus className="h-3 w-3 mr-1" />
                  Coluna
                </Button>
                <Button variant="outline" size="sm" onClick={addRow}>
                  <Plus className="h-3 w-3 mr-1" />
                  Linha
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto max-h-[600px] border-t">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-muted/80 backdrop-blur">
                  <th className="w-10 px-2 py-2 text-center text-muted-foreground font-medium border-b border-r">#</th>
                  {colunas.map((col, i) => (
                    <th key={i} className="px-1 py-1 border-b border-r min-w-[120px]">
                      <div className="flex items-center gap-1">
                        <Input
                          value={col}
                          onChange={(e) => updateColuna(i, e.target.value)}
                          disabled={!canEdit}
                          className="h-7 text-xs font-semibold border-0 bg-transparent focus:bg-background"
                        />
                        {canEdit && colunas.length > 1 && (
                          <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={() => removeColumn(i)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </th>
                  ))}
                  {canEdit && <th className="w-10 border-b" />}
                </tr>
              </thead>
              <tbody>
                {dados.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-muted/30">
                    <td className="px-2 py-1 text-center text-muted-foreground text-xs border-r bg-muted/20 font-mono">
                      {rowIdx + 1}
                    </td>
                    {colunas.map((_, colIdx) => {
                      const isEditing = editingCell?.row === rowIdx && editingCell?.col === colIdx;
                      const value = row[colIdx] || '';
                      return (
                        <td
                          key={colIdx}
                          className="px-0 py-0 border-r border-b cursor-cell"
                          onClick={() => canEdit && setEditingCell({ row: rowIdx, col: colIdx })}
                        >
                          {isEditing ? (
                            <input
                              ref={inputRef}
                              value={value}
                              onChange={(e) => updateCell(rowIdx, colIdx, e.target.value)}
                              onBlur={() => setEditingCell(null)}
                              onKeyDown={(e) => handleKeyDown(e, rowIdx, colIdx)}
                              className="w-full h-8 px-2 text-sm border-2 border-primary outline-none bg-background"
                            />
                          ) : (
                            <div className="w-full h-8 px-2 flex items-center text-sm truncate">
                              {value || <span className="text-muted-foreground/30">—</span>}
                            </div>
                          )}
                        </td>
                      );
                    })}
                    {canEdit && (
                      <td className="px-1 py-0">
                        {dados.length > 1 && (
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeRow(rowIdx)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TabelaFreteEditor;
