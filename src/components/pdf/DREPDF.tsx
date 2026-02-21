import React from 'react';
import { formatCurrency } from '@/lib/formatters';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DRELancamento, DRESummary } from '@/types/financeiro.types';

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
  colData: { width: '10%' },
  colTipo: { width: '8%' },
  colConta: { width: '15%' },
  colNome: { width: '25%' },
  colDocumento: { width: '12%' },
  colBanco: { width: '12%' },
  colValor: { width: '12%', textAlign: 'right' },
  colClasse: { width: '6%' },
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

interface DREPDFProps {
  lancamentos: DRELancamento[];
  resumo: DRESummary;
  dataInicial: string;
  dataFinal: string;
}

// formatCurrency imported from @/lib/formatters

const formatDateStr = (dateStr: string | undefined): string => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return format(date, 'dd/MM/yy');
  } catch {
    return '-';
  }
};

const ITEMS_PER_PAGE = 30;

export const DREPDF: React.FC<DREPDFProps> = ({
  lancamentos,
  resumo,
  dataInicial,
  dataFinal,
}) => {
  const generatedAt = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  const startDateFormatted = format(new Date(dataInicial), "dd/MM/yyyy", { locale: ptBR });
  const endDateFormatted = format(new Date(dataFinal), "dd/MM/yyyy", { locale: ptBR });
  
  // Paginar itens
  const pages: DRELancamento[][] = [];
  for (let i = 0; i < lancamentos.length; i += ITEMS_PER_PAGE) {
    pages.push(lancamentos.slice(i, i + ITEMS_PER_PAGE));
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
                <Text style={styles.title}>DRE - Demonstrativo de Resultado</Text>
                <Text style={styles.subtitle}>Relatório de Receitas e Despesas</Text>
                <Text style={styles.periodText}>
                  Período: {startDateFormatted} a {endDateFormatted}
                </Text>
              </View>

              {/* Summary Cards */}
              <View style={styles.summarySection}>
                <Text style={styles.summaryTitle}>Resumo Financeiro</Text>
                <View style={styles.summaryGrid}>
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryCardLabel}>Total Receitas ({resumo.qtdReceitas})</Text>
                    <Text style={styles.summaryCardValueGreen}>
                      {formatCurrency(resumo.totalReceitas)}
                    </Text>
                  </View>
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryCardLabel}>Total Despesas ({resumo.qtdDespesas})</Text>
                    <Text style={styles.summaryCardValueRed}>
                      {formatCurrency(resumo.totalDespesas)}
                    </Text>
                  </View>
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryCardLabel}>Resultado</Text>
                    <Text style={resumo.resultado >= 0 ? styles.summaryCardValueGreen : styles.summaryCardValueRed}>
                      {formatCurrency(resumo.resultado)}
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
                Lançamentos ({lancamentos.length} {lancamentos.length === 1 ? 'item' : 'itens'})
              </Text>
            )}
            
            <View style={styles.table}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.headerText, styles.colData]}>Data</Text>
                <Text style={[styles.headerText, styles.colTipo]}>Tipo</Text>
                <Text style={[styles.headerText, styles.colConta]}>Conta</Text>
                <Text style={[styles.headerText, styles.colNome]}>Nome/Fornecedor</Text>
                <Text style={[styles.headerText, styles.colDocumento]}>Documento</Text>
                <Text style={[styles.headerText, styles.colBanco]}>Banco</Text>
                <Text style={[styles.headerText, styles.colValor]}>Valor</Text>
                <Text style={[styles.headerText, styles.colClasse]}>Classe</Text>
              </View>

              {/* Table Rows */}
              {pageItems.length === 0 && pageIndex === 0 ? (
                <View style={styles.tableRow}>
                  <Text style={[styles.cellText, { width: '100%', textAlign: 'center' }]}>
                    Nenhum lançamento encontrado
                  </Text>
                </View>
              ) : (
                pageItems.map((item, index) => (
                  <View 
                    key={item.id} 
                    style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
                  >
                    <Text style={[styles.cellText, styles.colData]}>
                      {formatDateStr(item.data)}
                    </Text>
                    <Text style={[
                      item.tipo === 'RECEITA' ? styles.cellTextGreen : styles.cellTextRed,
                      styles.colTipo
                    ]}>
                      {item.tipo === 'RECEITA' ? 'Rec' : 'Desp'}
                    </Text>
                    <Text style={[styles.cellText, styles.colConta]}>
                      {item.conta && item.conta.length > 20 ? item.conta.substring(0, 20) + '...' : item.conta || '-'}
                    </Text>
                    <Text style={[styles.cellText, styles.colNome]}>
                      {item.nome && item.nome.length > 35 ? item.nome.substring(0, 35) + '...' : item.nome || '-'}
                    </Text>
                    <Text style={[styles.cellText, styles.colDocumento]}>
                      {item.documento || '-'}
                    </Text>
                    <Text style={[styles.cellText, styles.colBanco]}>
                      {item.banco && item.banco.length > 15 ? item.banco.substring(0, 15) + '...' : item.banco || '-'}
                    </Text>
                    <Text style={[
                      item.tipo === 'RECEITA' ? styles.cellTextGreen : styles.cellTextRed,
                      styles.colValor
                    ]}>
                      {formatCurrency(item.valor)}
                    </Text>
                    <Text style={[styles.cellText, styles.colClasse]}>
                      {item.classe || '-'}
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

export default DREPDF;
