import React from 'react';
import { formatCurrency } from '@/lib/formatters';
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
  summaryCardValueAmber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#d97706',
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
  colDoc: { width: '12%' },
  colCliente: { width: '22%' },
  colEmissao: { width: '11%' },
  colVencimento: { width: '11%' },
  colValorTitulo: { width: '12%', textAlign: 'right' },
  colValorPago: { width: '12%', textAlign: 'right' },
  colSaldo: { width: '10%', textAlign: 'right' },
  colStatus: { width: '10%' },
  headerText: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#374151',
  },
  cellText: {
    fontSize: 7,
    color: '#4b5563',
  },
  cellTextGreen: {
    fontSize: 7,
    color: '#16a34a',
  },
  cellTextRed: {
    fontSize: 7,
    color: '#dc2626',
  },
  cellTextAmber: {
    fontSize: 7,
    color: '#d97706',
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

export interface FinanceiroItem {
  doc: string;
  emissao: string;
  vencimento: string;
  dataPagamento: string;
  valorPago: number;
  juros: number;
  valorTitulo: number;
  pago: string;
  saldo: number;
  docCliente: string;
  cliente: string;
  boleto: string;
  idBoleto: number;
  status: string;
  ctes: string;
  idTitulo: number;
}

export interface FinanceiroSummary {
  totalTitulos: number;
  valorPago: number;
  valorPendente: number;
  qtdTitulos: number;
}

interface FinanceiroConsultarPDFProps {
  items: FinanceiroItem[];
  summary: FinanceiroSummary;
  periodo: string;
  documento?: string;
}

// formatCurrency imported from @/lib/formatters

const formatDateStr = (dateStr: string | undefined): string => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return format(date, 'dd/MM/yyyy');
  } catch {
    return '-';
  }
};

const getStatusLabel = (status?: string): string => {
  const statusMap: Record<string, string> = {
    Liquidado: 'Liquidado',
    Pago: 'Pago',
    Pendente: 'Pendente',
    Aberto: 'Em Aberto',
    'Em Aberto': 'Em Aberto',
    Atrasado: 'Atrasado',
    Vencido: 'Vencido'
  };
  return statusMap[status || 'Pendente'] || status || 'Pendente';
};

const ITEMS_PER_PAGE = 28;

export const FinanceiroConsultarPDF: React.FC<FinanceiroConsultarPDFProps> = ({
  items,
  summary,
  periodo,
  documento,
}) => {
  const generatedAt = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  
  // Paginar itens
  const pages: FinanceiroItem[][] = [];
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
        <Page key={pageIndex} size="A4" orientation="landscape" style={styles.page}>
          {/* Header - apenas na primeira página */}
          {pageIndex === 0 && (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>Consulta de Títulos Financeiros</Text>
                {documento && (
                  <Text style={styles.subtitle}>Documento: {documento}</Text>
                )}
                <Text style={styles.periodText}>Período: {periodo}</Text>
              </View>

              {/* Summary Cards */}
              <View style={styles.summarySection}>
                <Text style={styles.summaryTitle}>Resumo</Text>
                <View style={styles.summaryGrid}>
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryCardLabel}>Total em Títulos</Text>
                    <Text style={styles.summaryCardValue}>
                      {formatCurrency(summary.totalTitulos)}
                    </Text>
                  </View>
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryCardLabel}>Valor Pago</Text>
                    <Text style={styles.summaryCardValueGreen}>
                      {formatCurrency(summary.valorPago)}
                    </Text>
                  </View>
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryCardLabel}>Saldo Pendente</Text>
                    <Text style={styles.summaryCardValueAmber}>
                      {formatCurrency(summary.valorPendente)}
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
                Títulos ({items.length} {items.length === 1 ? 'registro' : 'registros'})
              </Text>
            )}
            
            <View style={styles.table}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.headerText, styles.colDoc]}>Documento</Text>
                <Text style={[styles.headerText, styles.colCliente]}>Cliente</Text>
                <Text style={[styles.headerText, styles.colEmissao]}>Emissão</Text>
                <Text style={[styles.headerText, styles.colVencimento]}>Vencimento</Text>
                <Text style={[styles.headerText, styles.colValorTitulo]}>Valor Título</Text>
                <Text style={[styles.headerText, styles.colValorPago]}>Valor Pago</Text>
                <Text style={[styles.headerText, styles.colSaldo]}>Saldo</Text>
                <Text style={[styles.headerText, styles.colStatus]}>Status</Text>
              </View>

              {/* Table Rows */}
              {pageItems.length === 0 && pageIndex === 0 ? (
                <View style={styles.tableRow}>
                  <Text style={[styles.cellText, { width: '100%', textAlign: 'center' }]}>
                    Nenhum título encontrado
                  </Text>
                </View>
              ) : (
                pageItems.map((item, index) => {
                  const statusLower = (item.status || '').toLowerCase();
                  const isAtrasado = statusLower === 'atrasado' || statusLower === 'vencido';
                  const isLiquidado = statusLower === 'liquidado' || statusLower === 'pago';
                  
                  return (
                    <View 
                      key={`${item.idTitulo}-${index}`} 
                      style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
                    >
                      <Text style={[styles.cellText, styles.colDoc]}>
                        {item.doc || '-'}
                      </Text>
                      <Text style={[styles.cellText, styles.colCliente]}>
                        {item.cliente && item.cliente.length > 30 
                          ? item.cliente.substring(0, 30) + '...' 
                          : item.cliente || '-'}
                      </Text>
                      <Text style={[styles.cellText, styles.colEmissao]}>
                        {formatDateStr(item.emissao)}
                      </Text>
                      <Text style={[styles.cellText, styles.colVencimento]}>
                        {formatDateStr(item.vencimento)}
                      </Text>
                      <Text style={[styles.cellText, styles.colValorTitulo]}>
                        {formatCurrency(item.valorTitulo || 0)}
                      </Text>
                      <Text style={[styles.cellTextGreen, styles.colValorPago]}>
                        {formatCurrency(item.valorPago || 0)}
                      </Text>
                      <Text style={[
                        item.saldo > 0 ? styles.cellTextAmber : styles.cellText, 
                        styles.colSaldo
                      ]}>
                        {formatCurrency(item.saldo || 0)}
                      </Text>
                      <Text style={[
                        isLiquidado ? styles.cellTextGreen :
                        isAtrasado ? styles.cellTextRed :
                        styles.cellTextAmber,
                        styles.colStatus
                      ]}>
                        {getStatusLabel(item.status)}
                      </Text>
                    </View>
                  );
                })
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

export default FinanceiroConsultarPDF;
