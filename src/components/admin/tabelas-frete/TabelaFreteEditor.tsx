import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';
import { ArrowLeft, Save, Plus, Trash2, History, Download, Upload, Copy, ClipboardPaste } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/admin/PageHeader';
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
  const [editingHeader, setEditingHeader] = useState<number | null>(null);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [hasChanges, setHasChanges] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editingCell && inputRef.current) inputRef.current.focus();
  }, [editingCell]);

  useEffect(() => {
    if (editingHeader !== null && headerRef.current) headerRef.current.focus();
  }, [editingHeader]);

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

  const addRow = useCallback(() => {
    setDados(prev => [...prev, new Array(colunas.length).fill('')]);
    markChanged();
  }, [colunas.length]);

  const addRowAt = useCallback((index: number) => {
    setDados(prev => {
      const newDados = [...prev];
      newDados.splice(index + 1, 0, new Array(colunas.length).fill(''));
      return newDados;
    });
    markChanged();
  }, [colunas.length]);

  const removeRow = useCallback((index: number) => {
    if (dados.length <= 1) return;
    setDados(prev => prev.filter((_, i) => i !== index));
    markChanged();
  }, [dados.length]);

  const addColumn = useCallback(() => {
    setColunas(prev => [...prev, `Col ${prev.length + 1}`]);
    setDados(prev => prev.map(row => [...row, '']));
    markChanged();
  }, []);

  const removeColumn = useCallback((index: number) => {
    if (colunas.length <= 1) return;
    setColunas(prev => prev.filter((_, i) => i !== index));
    setDados(prev => prev.map(row => row.filter((_, i) => i !== index)));
    markChanged();
  }, [colunas.length]);

  const duplicateRow = useCallback((index: number) => {
    setDados(prev => {
      const newDados = [...prev];
      newDados.splice(index + 1, 0, [...prev[index]]);
      return newDados;
    });
    markChanged();
  }, []);

  const exportToExcel = () => {
    const wsData = [colunas, ...dados];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, nome.substring(0, 31));
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
        setDados(jsonData.slice(1).map(row => {
          const mapped = row.map(String);
          while (mapped.length < jsonData[0].length) mapped.push('');
          return mapped;
        }));
        markChanged();
        toast.success(`Importado: ${jsonData.length - 1} linhas`);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent, row: number, col: number) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const nextCol = e.shiftKey ? col - 1 : col + 1;
      if (nextCol >= 0 && nextCol < colunas.length) {
        setEditingCell({ row, col: nextCol });
      } else if (!e.shiftKey && nextCol >= colunas.length && row + 1 < dados.length) {
        setEditingCell({ row: row + 1, col: 0 });
      } else if (e.shiftKey && nextCol < 0 && row > 0) {
        setEditingCell({ row: row - 1, col: colunas.length - 1 });
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        if (row > 0) setEditingCell({ row: row - 1, col });
      } else {
        if (row + 1 < dados.length) {
          setEditingCell({ row: row + 1, col });
        } else {
          addRow();
          setTimeout(() => setEditingCell({ row: row + 1, col }), 50);
        }
      }
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    } else if (e.key === 'ArrowUp' && !editingCell) {
      e.preventDefault();
      if (row > 0) setEditingCell({ row: row - 1, col });
    } else if (e.key === 'ArrowDown' && !editingCell) {
      e.preventDefault();
      if (row + 1 < dados.length) setEditingCell({ row: row + 1, col });
    }
  }, [colunas.length, dados.length, addRow, editingCell]);

  // Column letter helper (A, B, C...)
  const getColLetter = useMemo(() => {
    return (index: number) => {
      let letter = '';
      let n = index;
      while (n >= 0) {
        letter = String.fromCharCode(65 + (n % 26)) + letter;
        n = Math.floor(n / 26) - 1;
      }
      return letter;
    };
  }, []);

  const stats = useMemo(() => ({
    totalLinhas: dados.length,
    totalColunas: colunas.length,
    celulasPreenchidas: dados.reduce((acc, row) => acc + row.filter(c => c && c.trim()).length, 0),
    totalCelulas: dados.length * colunas.length,
  }), [dados, colunas]);

  return (
    <div className="space-y-4">
      <PageHeader
        title={nome}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Tabelas de Frete', href: '/tabelas-frete' },
          { label: nome },
        ]}
      />

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-2 items-center">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
          <div className="hidden md:flex items-center gap-3 ml-2 text-xs text-muted-foreground">
            <span>{stats.totalLinhas} linhas</span>
            <span>•</span>
            <span>{stats.totalColunas} colunas</span>
            <span>•</span>
            <span>{stats.celulasPreenchidas}/{stats.totalCelulas} preenchidas</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onShowLogs}>
            <History className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Logs</span>
          </Button>
          <Button variant="outline" size="sm" onClick={exportToExcel}>
            <Download className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>
          <label>
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={importFromExcel} />
            <Button variant="outline" size="sm" asChild>
              <span>
                <Upload className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Importar</span>
              </span>
            </Button>
          </label>
          {canEdit && (
            <Button size="sm" onClick={() => saveMutation.mutate()} disabled={!hasChanges || saveMutation.isPending}>
              <Save className="h-4 w-4 mr-1" />
              {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
              {hasChanges && <Badge variant="destructive" className="ml-1 text-[10px] px-1 py-0">●</Badge>}
            </Button>
          )}
        </div>
      </div>

      {/* Nome e Descrição compacto */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-1">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Nome da Tabela</label>
          <Input value={nome} onChange={(e) => { setNome(e.target.value); markChanged(); }} disabled={!canEdit} className="h-9" />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Observações / Condições Gerais</label>
          <Input value={descricao} onChange={(e) => { setDescricao(e.target.value); markChanged(); }} disabled={!canEdit} placeholder="Ex: Cubagem 240kg/m³, validade 45 dias..." className="h-9" />
        </div>
      </div>

      {/* Spreadsheet Editor */}
      <Card className="overflow-hidden border-2">
        <CardHeader className="py-2 px-3 bg-muted/40 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">Planilha</CardTitle>
              {hasChanges && (
                <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-400 bg-amber-50">
                  Alterações não salvas
                </Badge>
              )}
            </div>
            {canEdit && (
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={addColumn}>
                  <Plus className="h-3 w-3 mr-1" />
                  Coluna
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={addRow}>
                  <Plus className="h-3 w-3 mr-1" />
                  Linha
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div ref={tableRef} className="overflow-auto max-h-[calc(100vh-340px)]" style={{ minHeight: '300px' }}>
            <table className="w-full text-sm border-collapse select-none">
              {/* Column Letters Row */}
              <thead className="sticky top-0 z-20">
                <tr className="bg-muted/60">
                  <th className="w-12 min-w-[48px] px-1 py-1 text-center text-[10px] text-muted-foreground font-normal border-b border-r bg-muted/80" />
                  {colunas.map((_, i) => (
                    <th key={`letter-${i}`} className="px-1 py-0.5 text-center text-[10px] text-muted-foreground font-normal border-b border-r bg-muted/60 min-w-[130px]">
                      {getColLetter(i)}
                    </th>
                  ))}
                  {canEdit && <th className="w-8 border-b bg-muted/60" />}
                </tr>
                {/* Header Row */}
                <tr className="bg-muted/90 backdrop-blur">
                  <th className="w-12 min-w-[48px] px-1 py-1 text-center text-[10px] text-muted-foreground font-semibold border-b-2 border-r bg-muted/80">
                    #
                  </th>
                  {colunas.map((col, i) => (
                    <th
                      key={i}
                      className="px-0 py-0 border-b-2 border-r min-w-[130px] group"
                      onDoubleClick={() => canEdit && setEditingHeader(i)}
                    >
                      {editingHeader === i ? (
                        <input
                          ref={headerRef}
                          value={col}
                          onChange={(e) => updateColuna(i, e.target.value)}
                          onBlur={() => setEditingHeader(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === 'Escape') setEditingHeader(null);
                            if (e.key === 'Tab') {
                              e.preventDefault();
                              setEditingHeader(e.shiftKey ? Math.max(0, i - 1) : Math.min(colunas.length - 1, i + 1));
                            }
                          }}
                          className="w-full h-8 px-2 text-xs font-bold border-2 border-primary outline-none bg-background text-foreground"
                        />
                      ) : (
                        <div className="flex items-center justify-between px-2 h-8">
                          <span className="text-xs font-bold text-foreground truncate">{col}</span>
                          {canEdit && colunas.length > 1 && (
                            <button
                              onClick={(e) => { e.stopPropagation(); removeColumn(i); }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-destructive/10 rounded"
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </button>
                          )}
                        </div>
                      )}
                    </th>
                  ))}
                  {canEdit && <th className="w-8 border-b-2" />}
                </tr>
              </thead>
              <tbody>
                {dados.map((row, rowIdx) => (
                  <tr
                    key={rowIdx}
                    className={`group/row ${rowIdx % 2 === 0 ? 'bg-background' : 'bg-muted/15'} hover:bg-primary/5`}
                  >
                    {/* Row Number */}
                    <td className="px-1 py-0 text-center text-[11px] text-muted-foreground border-r border-b bg-muted/30 font-mono select-none">
                      <div className="flex items-center justify-center gap-0.5">
                        <span>{rowIdx + 1}</span>
                      </div>
                    </td>
                    {/* Data Cells */}
                    {colunas.map((_, colIdx) => {
                      const isEditing = editingCell?.row === rowIdx && editingCell?.col === colIdx;
                      const value = row[colIdx] || '';
                      return (
                        <td
                          key={colIdx}
                          className={`px-0 py-0 border-r border-b cursor-cell transition-colors ${
                            isEditing ? 'ring-2 ring-primary ring-inset' : ''
                          }`}
                          onClick={() => canEdit && setEditingCell({ row: rowIdx, col: colIdx })}
                          onDoubleClick={() => canEdit && setEditingCell({ row: rowIdx, col: colIdx })}
                        >
                          {isEditing ? (
                            <input
                              ref={inputRef}
                              value={value}
                              onChange={(e) => updateCell(rowIdx, colIdx, e.target.value)}
                              onBlur={() => setEditingCell(null)}
                              onKeyDown={(e) => handleKeyDown(e, rowIdx, colIdx)}
                              className="w-full h-8 px-2 text-sm outline-none bg-background text-foreground"
                              style={{ minWidth: '100%' }}
                            />
                          ) : (
                            <div className="w-full h-8 px-2 flex items-center text-sm truncate">
                              {value || <span className="text-muted-foreground/20">—</span>}
                            </div>
                          )}
                        </td>
                      );
                    })}
                    {/* Row Actions */}
                    {canEdit && (
                      <td className="px-0 py-0 border-b">
                        <div className="flex opacity-0 group-hover/row:opacity-100 transition-opacity">
                          <button
                            onClick={() => duplicateRow(rowIdx)}
                            className="h-8 w-6 flex items-center justify-center hover:bg-muted/60"
                            title="Duplicar linha"
                          >
                            <Copy className="h-3 w-3 text-muted-foreground" />
                          </button>
                          {dados.length > 1 && (
                            <button
                              onClick={() => removeRow(rowIdx)}
                              className="h-8 w-6 flex items-center justify-center hover:bg-destructive/10"
                              title="Remover linha"
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer bar */}
          {canEdit && (
            <div className="flex items-center justify-between px-3 py-1.5 bg-muted/30 border-t text-[11px] text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>Tab: próxima célula</span>
                <span>•</span>
                <span>Enter: próxima linha</span>
                <span>•</span>
                <span>Esc: cancelar</span>
                <span>•</span>
                <span>Duplo clique no cabeçalho: editar</span>
              </div>
              <span>{editingCell ? `Célula ${getColLetter(editingCell.col)}${editingCell.row + 1}` : 'Pronto'}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TabelaFreteEditor;
