import React, { useState, useMemo, useCallback } from 'react';

import { 
  DREFilters, 
  DRESummaryCards, 
  DREViewTabs,
  DRETableGrid,
  DRECharts,
  DREGroupedView,
  DRECrossView,
  DRECalendarView,
  DREDayModal,
  DREViewMode,
  DREFilterType,
  DRELancamento,
  DREAIAnalysisModal,
  DREAIResultModal,
  AIAnalysisConfig,
  AIAnalysisResult
} from '@/components/admin/dre';
import { format, subDays } from 'date-fns';
import { toast } from '@/lib/toast';
import { backendService } from '@/services/api/backendService';
import { exportDREToCSV, exportDREToPDF } from '@/utils/dreExport';

const DRE: React.FC = () => {
  const [empresa, setEmpresa] = useState<string>('all');
  const [regime, setRegime] = useState('competencia-cte');
  const [dataInicial, setDataInicial] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [dataFinal, setDataFinal] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [viewMode, setViewMode] = useState<DREViewMode>('grid');
  const [filterType, setFilterType] = useState<DREFilterType>('todos');
  const [isLoading, setIsLoading] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showAIResultModal, setShowAIResultModal] = useState(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [aiRaw, setAiRaw] = useState<string>('');
  const [isAILoading, setIsAILoading] = useState(false);
  
  // Modal do dia
  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDayLancamentos, setSelectedDayLancamentos] = useState<DRELancamento[]>([]);
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
  // Estado para dados reais do backend
  const [lancamentos, setLancamentos] = useState<DRELancamento[]>([]);
  const [resumoBackend, setResumoBackend] = useState<{
    totalReceitas: number;
    totalDespesas: number;
    qtdReceitas: number;
    qtdDespesas: number;
    resultado: number;
    margem: number;
  } | null>(null);

  // Filtrar por tipo
  const filteredLancamentos = useMemo(() => {
    if (filterType === 'todos') return lancamentos;
    if (filterType === 'receitas') return lancamentos.filter(l => l.tipo === 'RECEITA');
    return lancamentos.filter(l => l.tipo === 'DESPESA');
  }, [lancamentos, filterType]);

  // Paginação
  const totalPages = Math.ceil(filteredLancamentos.length / itemsPerPage);
  const paginatedLancamentos = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLancamentos.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLancamentos, currentPage, itemsPerPage]);

  // Reset da página ao mudar filtros
  const handleFilterTypeChange = (value: DREFilterType) => {
    setFilterType(value);
    setCurrentPage(1);
  };

  // Calcular totais
  const totais = useMemo(() => {
    // Se tiver resumo do backend, usar
    if (resumoBackend) {
      const bancos = new Set(lancamentos.map(l => l.banco));
      const fornecedores = new Set(lancamentos.map(l => l.nome));
      return {
        totalReceitas: resumoBackend.totalReceitas,
        totalDespesas: resumoBackend.totalDespesas,
        qtdReceitas: resumoBackend.qtdReceitas,
        qtdDespesas: resumoBackend.qtdDespesas,
        qtdBancos: bancos.size,
        qtdFornecedores: fornecedores.size
      };
    }

    // Calcular localmente se não houver resumo
    const receitas = lancamentos.filter(l => l.tipo === 'RECEITA');
    const despesas = lancamentos.filter(l => l.tipo === 'DESPESA');
    const bancos = new Set(lancamentos.map(l => l.banco));
    const fornecedores = new Set(lancamentos.map(l => l.nome));

    return {
      totalReceitas: receitas.reduce((sum, l) => sum + l.valor, 0),
      totalDespesas: despesas.reduce((sum, l) => sum + l.valor, 0),
      qtdReceitas: receitas.length,
      qtdDespesas: despesas.length,
      qtdBancos: bancos.size,
      qtdFornecedores: fornecedores.size
    };
  }, [lancamentos, resumoBackend]);

  const handleSearch = useCallback(async () => {
    setIsLoading(true);
    setCurrentPage(1);
    try {
      // Converter empresa para array para o backendService
      const empresasArray = empresa === 'all' ? [1, 2] : [parseInt(empresa)];
      
      const response = await backendService.buscarDRE({
        empresas: empresasArray,
        regime: regime as 'caixa' | 'competencia-titulos' | 'competencia-cte',
        dataInicial,
        dataFinal
      });

      if (response.success && response.data) {
        setLancamentos(response.data.lancamentos);
        setResumoBackend(response.data.resumo);
        toast.success(`${response.data.lancamentos.length} lançamentos carregados!`);
      } else {
        toast.error(response.error || 'Erro ao carregar dados');
        setLancamentos([]);
        setResumoBackend(null);
      }
    } catch (error) {
      toast.error('Erro ao buscar DRE');
      setLancamentos([]);
      setResumoBackend(null);
    } finally {
      setIsLoading(false);
    }
  }, [empresa, regime, dataInicial, dataFinal]);

  const handleExportExcel = useCallback(async (format: 'csv' | 'pdf' = 'csv') => {
    if (lancamentos.length === 0) {
      toast.warning('Não há dados para exportar. Execute uma busca primeiro.');
      return;
    }

    try {
      if (format === 'csv') {
        exportDREToCSV(lancamentos, dataInicial, dataFinal);
        toast.success('Arquivo CSV exportado com sucesso!');
      } else {
        const resumo = {
          totalReceitas: totais.totalReceitas,
          totalDespesas: totais.totalDespesas,
          qtdReceitas: totais.qtdReceitas,
          qtdDespesas: totais.qtdDespesas,
          resultado: totais.totalReceitas - totais.totalDespesas,
          margem: totais.totalReceitas > 0 
            ? ((totais.totalReceitas - totais.totalDespesas) / totais.totalReceitas) * 100 
            : 0
        };
        await exportDREToPDF(lancamentos, resumo, dataInicial, dataFinal);
        toast.success('Arquivo PDF exportado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao exportar arquivo');
    }
  }, [lancamentos, dataInicial, dataFinal, totais]);

  const handleAIAnalysis = () => {
    setShowAIModal(true);
  };

  const handleGenerateAIAnalysis = async (config: AIAnalysisConfig) => {
    setShowAIModal(false);
    setShowAIResultModal(true);
    setIsAILoading(true);
    setAiResult(null);
    setAiRaw('');

    try {
      // Preparar contexto com dados financeiros
      const receitas = lancamentos.filter(l => l.tipo === 'RECEITA');
      const despesas = lancamentos.filter(l => l.tipo === 'DESPESA');
      
      // Agrupar por conta
      const receitasPorConta: Record<string, number> = {};
      const despesasPorConta: Record<string, number> = {};
      
      receitas.forEach(r => {
        receitasPorConta[r.conta] = (receitasPorConta[r.conta] || 0) + r.valor;
      });
      despesas.forEach(d => {
        despesasPorConta[d.conta] = (despesasPorConta[d.conta] || 0) + d.valor;
      });

      const contexto = `
Você é um analista financeiro especializado em transportadoras.
Analise os dados do DRE (Demonstrativo de Resultado do Exercício) abaixo:

PERÍODO: ${dataInicial} a ${dataFinal}
${config.compararPeriodo && config.periodo2Inicio ? `PERÍODO COMPARATIVO: ${config.periodo2Inicio} a ${config.periodo2Fim}` : ''}

RESUMO FINANCEIRO:
- Total de Receitas: R$ ${totais.totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Total de Despesas: R$ ${totais.totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Resultado: R$ ${(totais.totalReceitas - totais.totalDespesas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Margem: ${totais.totalReceitas > 0 ? (((totais.totalReceitas - totais.totalDespesas) / totais.totalReceitas) * 100).toFixed(2) : 0}%
- Quantidade de Receitas: ${totais.qtdReceitas}
- Quantidade de Despesas: ${totais.qtdDespesas}

RECEITAS POR CONTA:
${Object.entries(receitasPorConta).map(([conta, valor]) => `- ${conta}: R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`).join('\n')}

DESPESAS POR CONTA:
${Object.entries(despesasPorConta).map(([conta, valor]) => `- ${conta}: R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`).join('\n')}
`;

      // Definir prompt baseado no nível
      let prompt = '';
      if (config.nivel === 'simples') {
        prompt = `
Faça uma análise SIMPLES e RÁPIDA dos dados financeiros.
Retorne um JSON com:
{
  "resumo_executivo": "resumo em 2-3 frases",
  "indicadores": [{"nome": "string", "valor": "string", "tendencia": "alta|baixa|estavel"}],
  "pontos_positivos": ["array de 2-3 pontos"],
  "pontos_atencao": ["array de 1-2 pontos"],
  "recomendacoes": [{"acao": "string", "prioridade": "alta|media|baixa"}]
}`;
      } else if (config.nivel === 'medio') {
        prompt = `
Faça uma análise DETALHADA dos dados financeiros.
Retorne um JSON com:
{
  "resumo_executivo": "resumo executivo completo",
  "indicadores": [{"nome": "string", "valor": "string", "tendencia": "alta|baixa|estavel", "observacao": "string"}],
  "pontos_positivos": ["array de 3-5 pontos detalhados"],
  "pontos_atencao": ["array de 2-4 pontos com explicação"],
  "recomendacoes": [{"acao": "string detalhado", "prioridade": "alta|media|baixa", "impacto": "descrição do impacto"}],
  "conclusao": "conclusão detalhada"
}`;
      } else {
        prompt = `
Faça uma análise ESTRATÉGICA COMPLETA como um consultor financeiro sênior.
Retorne um JSON com:
{
  "resumo_executivo": "resumo executivo estratégico",
  "indicadores": [{"nome": "string", "valor": "string", "tendencia": "alta|baixa|estavel", "observacao": "análise detalhada"}],
  "pontos_positivos": ["array de 5+ pontos com análise profunda"],
  "pontos_atencao": ["array de 3+ pontos com análise de risco"],
  "recomendacoes": [{"acao": "ação estratégica detalhada", "prioridade": "alta|media|baixa", "impacto": "impacto quantificado quando possível"}],
  ${config.compararPeriodo ? '"comparativo": [{"item": "string", "periodo_atual": "string", "periodo_anterior": "string", "variacao": "string"}],' : ''}
  "conclusao": "conclusão estratégica com visão de futuro"
}`;
      }

      const response = await backendService.analisarDREComIA({
        prompt,
        contexto,
        nivel: config.nivel
      });

      if (response.success && response.data) {
        setAiResult(response.data.data);
        setAiRaw(response.data.raw);
        toast.success('Análise concluída!');
      } else {
        toast.error(response.error || 'Erro ao gerar análise');
        setAiRaw(response.error || 'Erro desconhecido');
      }
    } catch (error) {
      toast.error('Erro ao comunicar com a IA');
      console.error('Erro IA:', error);
    } finally {
      setIsAILoading(false);
    }
  };

  const handleFix = (id: string) => {
    toast.info(`Corrigir lançamento ${id}`);
  };

  const handleDayClick = useCallback((date: Date, items: DRELancamento[]) => {
    setSelectedDate(date);
    setSelectedDayLancamentos(items);
    setDayModalOpen(true);
  }, []);

  const handleDateChange = useCallback((newDate: Date) => {
    setSelectedDate(newDate);
    const dateKey = format(newDate, 'yyyy-MM-dd');
    const items = lancamentos.filter(l => l.data.split('T')[0] === dateKey);
    setSelectedDayLancamentos(items);
  }, [lancamentos]);

  const renderContent = () => {
    switch (viewMode) {
      case 'grid':
        return (
          <DRETableGrid 
            lancamentos={paginatedLancamentos} 
            onFix={handleFix}
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={filteredLancamentos.length}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(value) => {
              setItemsPerPage(value);
              setCurrentPage(1);
            }}
          />
        );
      case 'graficos':
        return <DRECharts lancamentos={filteredLancamentos} />;
      case 'calendario':
        return <DRECalendarView lancamentos={filteredLancamentos} onDayClick={handleDayClick} />;
      case 'bancos':
        return <DREGroupedView lancamentos={filteredLancamentos} groupBy="banco" title="Agrupado por Banco" />;
      case 'fornecedor':
        return <DREGroupedView lancamentos={filteredLancamentos} groupBy="fornecedor" title="Agrupado por Fornecedor" />;
      case 'contas':
        return <DREGroupedView lancamentos={filteredLancamentos} groupBy="conta" title="Agrupado por Conta" />;
      case 'operacao':
        return <DREGroupedView lancamentos={filteredLancamentos} groupBy="operacao" title="Agrupado por Operação" />;
      case 'grupos':
        return <DREGroupedView lancamentos={filteredLancamentos} groupBy="grupo" title="Agrupado por Grupos" />;
      case 'tipo-lancamento':
        return <DREGroupedView lancamentos={filteredLancamentos} groupBy="tipo-lancamento" title="Agrupado por Tipo de Lançamento" />;
      case 'fornecedor-conta':
        return <DRECrossView lancamentos={filteredLancamentos} />;
      default:
        return (
          <DRETableGrid 
            lancamentos={paginatedLancamentos} 
            onFix={handleFix}
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={filteredLancamentos.length}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(value) => {
              setItemsPerPage(value);
              setCurrentPage(1);
            }}
          />
        );
    }
  };

  return (
    
      <div className="p-2 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">DRE - Demonstrativo de Resultado</h1>
          <p className="text-sm text-muted-foreground">
            Análise detalhada de receitas e despesas
          </p>
        </div>

        {/* Filtros */}
        <DREFilters
          empresa={empresa}
          setEmpresa={setEmpresa}
          regime={regime}
          setRegime={setRegime}
          dataInicial={dataInicial}
          setDataInicial={setDataInicial}
          dataFinal={dataFinal}
          setDataFinal={setDataFinal}
          onSearch={handleSearch}
          onExportExcel={handleExportExcel}
          onAIAnalysis={handleAIAnalysis}
          isLoading={isLoading}
        />

        {/* Cards de Resumo */}
        <DRESummaryCards {...totais} />

        {/* Tabs de Visualização */}
        <DREViewTabs
          viewMode={viewMode}
          setViewMode={setViewMode}
          filterType={filterType}
          setFilterType={handleFilterTypeChange}
        />

        {/* Conteúdo baseado na aba selecionada */}
        {renderContent()}

        {/* Modal de Análise IA */}
        <DREAIAnalysisModal
          open={showAIModal}
          onOpenChange={setShowAIModal}
          dataInicial={dataInicial}
          dataFinal={dataFinal}
          onGenerate={handleGenerateAIAnalysis}
        />

        {/* Modal de Resultado IA */}
        <DREAIResultModal
          open={showAIResultModal}
          onOpenChange={setShowAIResultModal}
          data={aiResult}
          raw={aiRaw}
          isLoading={isAILoading}
        />

        {/* Modal do Dia */}
        <DREDayModal
          open={dayModalOpen}
          onOpenChange={setDayModalOpen}
          date={selectedDate}
          lancamentos={selectedDayLancamentos}
          allLancamentos={lancamentos}
          onDateChange={handleDateChange}
        />
      </div>
    
  );
};

export default DRE;
