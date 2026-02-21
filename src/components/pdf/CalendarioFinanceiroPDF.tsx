import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: '1 solid #e5e7eb',
    paddingBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  periodText: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 5,
  },
  summarySection: {
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#374151',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryCard: {
    width: '30%',
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
    marginBottom: 5,
  },
  summaryCardLabel: {
    fontSize: 8,
    color: '#6b7280',
    marginBottom: 3,
  },
  summaryCardValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  summaryCardValueGreen: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  summaryCardValueRed: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  tableSection: {
    marginTop: 10,
  },
  tableTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#374151',
  },
  table: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderBottom: '1 solid #e5e7eb',
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #f3f4f6',
    paddingVertical: 6,
    paddingHorizontal: 5,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottom: '1 solid #f3f4f6',
    paddingVertical: 6,
    paddingHorizontal: 5,
    backgroundColor: '#fafafa',
  },
  colCliente: { width: '35%' },
  colDocumento: { width: '15%' },
  colValor: { width: '15%', textAlign: 'right' },
  colTipo: { width: '10%' },
  colStatus: { width: '12%' },
  colData: { width: '13%' },
  headerText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#374151',
  },
  cellText: {
    fontSize: 8,
    color: '#4b5563',
  },
  cellTextGreen: {
    fontSize: 8,
    color: '#16a34a',
  },
  cellTextRed: {
    fontSize: 8,
    color: '#dc2626',
  },
  cellTextOrange: {
    fontSize: 8,
    color: '#ea580c',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#9ca3af',
    borderTop: '1 solid #e5e7eb',
    paddingTop: 10,
  },
  pageNumber: {
    fontSize: 8,
    color: '#9ca3af',
  },
});

interface FinancialItem {
  id: string;
  cliente: string;
  cpfCnpj: string;
  documento: string;
  valor: number;
  status: 'aberto' | 'atrasado' | 'liquidado';
  tipo: 'receita' | 'despesa';
  dataVencimento?: string;
  dataPagamento?: string;
}

interface FinancialSummary {
  totalReceitas: number;
  receitasRecebidas: number;
  receitasAReceber: number;
  totalDespesas: number;
  despesasPagas: number;
  despesasAPagar: number;
  qtdReceitas?: number;
  qtdDespesas?: number;
}

interface CalendarioFinanceiroPDFProps {
  items: FinancialItem[];
  summary: FinancialSummary;
  currentMonth: Date;
  viewMode: 'titulos' | 'pagamentos';
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatDateStr = (dateStr: string | undefined): string => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return format(date, 'dd/MM/yyyy');
  } catch {
    return '-';
  }
};

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'liquidado': return 'Liquidado';
    case 'atrasado': return 'Atrasado';
    case 'aberto': return 'Aberto';
    default: return status;
  }
};

const getTipoLabel = (tipo: string): string => {
  return tipo === 'receita' ? 'Receita' : 'Despesa';
};

const ITEMS_PER_PAGE = 25;

export const CalendarioFinanceiroPDF: React.FC<CalendarioFinanceiroPDFProps> = ({
  items,
  summary,
  currentMonth,
  viewMode,
}) => {
  const generatedAt = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  const monthYear = format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR });
  
  // Paginar itens
  const pages: FinancialItem[][] = [];
  for (let i = 0; i < items.length; i += ITEMS_PER_PAGE) {
    pages.push(items.slice(i, i + ITEMS_PER_PAGE));
  }

  // Se não houver itens, criar pelo menos uma página
  if (pages.length === 0) {
    pages.push([]);
  }

  return (
    <Document>
      {pages.map((pageItems, pageIndex) => (
        <Page key={pageIndex} size="A4" style={styles.page}>
          {/* Header - apenas na primeira página */}
          {pageIndex === 0 && (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>Relatório Financeiro</Text>
                <Text style={styles.subtitle}>
                  Modo: {viewMode === 'titulos' ? 'Títulos' : 'Pagamentos'}
                </Text>
                <Text style={styles.periodText}>Período: {monthYear}</Text>
              </View>

              {/* Summary Cards */}
              <View style={styles.summarySection}>
                <Text style={styles.summaryTitle}>Resumo</Text>
                <View style={styles.summaryGrid}>
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryCardLabel}>Total Receitas</Text>
                    <Text style={styles.summaryCardValueGreen}>
                      {formatCurrency(summary.totalReceitas)}
                    </Text>
                  </View>
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryCardLabel}>Receitas Recebidas</Text>
                    <Text style={styles.summaryCardValueGreen}>
                      {formatCurrency(summary.receitasRecebidas)}
                    </Text>
                  </View>
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryCardLabel}>Receitas a Receber</Text>
                    <Text style={styles.summaryCardValue}>
                      {formatCurrency(summary.receitasAReceber)}
                    </Text>
                  </View>
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryCardLabel}>Total Despesas</Text>
                    <Text style={styles.summaryCardValueRed}>
                      {formatCurrency(summary.totalDespesas)}
                    </Text>
                  </View>
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryCardLabel}>Despesas Pagas</Text>
                    <Text style={styles.summaryCardValueRed}>
                      {formatCurrency(summary.despesasPagas)}
                    </Text>
                  </View>
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryCardLabel}>Despesas a Pagar</Text>
                    <Text style={styles.summaryCardValue}>
                      {formatCurrency(summary.despesasAPagar)}
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}

          {/* Table */}
          <View style={styles.tableSection}>
            {pageIndex === 0 && (
              <Text style={styles.tableTitle}>
                Movimentações ({items.length} {items.length === 1 ? 'item' : 'itens'})
              </Text>
            )}
            
            <View style={styles.table}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.headerText, styles.colCliente]}>Cliente</Text>
                <Text style={[styles.headerText, styles.colDocumento]}>Documento</Text>
                <Text style={[styles.headerText, styles.colValor]}>Valor</Text>
                <Text style={[styles.headerText, styles.colTipo]}>Tipo</Text>
                <Text style={[styles.headerText, styles.colStatus]}>Status</Text>
                <Text style={[styles.headerText, styles.colData]}>Data</Text>
              </View>

              {/* Table Rows */}
              {pageItems.length === 0 && pageIndex === 0 ? (
                <View style={styles.tableRow}>
                  <Text style={[styles.cellText, { width: '100%', textAlign: 'center' }]}>
                    Nenhum item encontrado
                  </Text>
                </View>
              ) : (
                pageItems.map((item, index) => (
                  <View 
                    key={item.id} 
                    style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
                  >
                    <Text style={[styles.cellText, styles.colCliente]}>
                      {item.cliente.length > 40 ? item.cliente.substring(0, 40) + '...' : item.cliente}
                    </Text>
                    <Text style={[styles.cellText, styles.colDocumento]}>
                      {item.documento || '-'}
                    </Text>
                    <Text style={[
                      item.tipo === 'receita' ? styles.cellTextGreen : styles.cellTextRed,
                      styles.colValor
                    ]}>
                      {formatCurrency(item.valor)}
                    </Text>
                    <Text style={[styles.cellText, styles.colTipo]}>
                      {getTipoLabel(item.tipo)}
                    </Text>
                    <Text style={[
                      item.status === 'liquidado' ? styles.cellTextGreen :
                      item.status === 'atrasado' ? styles.cellTextRed :
                      styles.cellTextOrange,
                      styles.colStatus
                    ]}>
                      {getStatusLabel(item.status)}
                    </Text>
                    <Text style={[styles.cellText, styles.colData]}>
                      {formatDateStr(item.dataPagamento || item.dataVencimento)}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer} fixed>
            <Text>Gerado em: {generatedAt}</Text>
            <Text style={styles.pageNumber}>
              Página {pageIndex + 1} de {pages.length}
            </Text>
          </View>
        </Page>
      ))}
    </Document>
  );
};

export default CalendarioFinanceiroPDF;
