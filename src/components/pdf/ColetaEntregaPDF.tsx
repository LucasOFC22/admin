import React from 'react';
import { formatCurrency } from '@/lib/formatters';
import { Document, Page, View, Text, StyleSheet, Image } from '@react-pdf/renderer';
import { CORES, LOGO_IMAGE } from './constants';

interface ColetaEntregaPDFProps {
  coleta: any;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 30,
    backgroundColor: '#FFFFFF',
    lineHeight: 1.3,
  },
  
  // Header compacto
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: CORES.border,
  },
  
  logo: {
    width: 120,
    height: 60,
    objectFit: 'contain',
  },
  
  documentInfo: {
    alignItems: 'flex-end',
  },
  
  documentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: CORES.primary,
    marginBottom: 3,
  },
  
  documentMeta: {
    fontSize: 9,
    color: CORES.text,
    textAlign: 'right',
    lineHeight: 1.2,
  },
  
  // Layout em duas colunas
  twoColumns: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 15,
  },
  
  column: {
    flex: 1,
  },
  
  // Seções compactas
  section: {
    marginBottom: 15,
    borderWidth: 1,
    borderColor: CORES.border,
  },
  
  sectionHeader: {
    backgroundColor: CORES.primary,
    padding: 6,
  },
  
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
    textTransform: 'uppercase',
  },
  
  sectionContent: {
    padding: 10,
  },
  
  // Informações em grid compacto
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  
  infoLabel: {
    fontSize: 8,
    color: CORES.text,
    fontWeight: 'bold',
    width: 80,
  },
  
  infoValue: {
    fontSize: 9,
    color: CORES.text,
    flex: 1,
  },
  
  // Mercadoria destacada
  mercadoriaSection: {
    marginBottom: 15,
    borderWidth: 1,
    borderColor: CORES.accent,
  },
  
  mercadoriaHeader: {
    backgroundColor: CORES.accent,
    padding: 6,
  },
  
  mercadoriaTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
    textTransform: 'uppercase',
  },
  
  mercadoriaContent: {
    padding: 10,
  },
  
  mercadoriaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  
  mercadoriaInfo: {
    flex: 1,
    marginRight: 15,
  },
  
  mercadoriaStats: {
    flexDirection: 'row',
    gap: 10,
  },
  
  statItem: {
    alignItems: 'center',
    minWidth: 50,
  },
  
  statValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: CORES.primary,
  },
  
  statLabel: {
    fontSize: 7,
    color: CORES.text,
    marginTop: 1,
    textAlign: 'center',
  },
  
  // Observações compactas
  observacoesSection: {
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#f59e0b',
    backgroundColor: '#fffbeb',
  },
  
  observacoesHeader: {
    backgroundColor: '#f59e0b',
    padding: 6,
  },
  
  observacoesTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
    textTransform: 'uppercase',
  },
  
  observacoesText: {
    fontSize: 9,
    color: '#78350f',
    padding: 10,
    lineHeight: 1.3,
  },
  
  // Footer compacto
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: CORES.border,
  },
  
  footerText: {
    fontSize: 7,
    color: CORES.text,
    lineHeight: 1.2,
  },
});

export const ColetaEntregaPDF: React.FC<ColetaEntregaPDFProps> = ({ coleta }) => {
  // formatCurrency imported from @/lib/formatters

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Data não informada';
    const { formatDateOnly } = require('@/utils/dateFormatters');
    return formatDateOnly(dateString) || 'Data não informada';
  };

  const serviceNumber = String(coleta.id || '000000').padStart(6, '0');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header com logo */}
        <View style={styles.header}>
          <Image src={LOGO_IMAGE} style={styles.logo} />
          <View style={styles.documentInfo}>
            <Text style={styles.documentTitle}>ORDEM DE COLETA</Text>
            <Text style={styles.documentMeta}>
              Nº: {serviceNumber}{'\n'}
              Data: {formatDate(new Date().toISOString())}{'\n'}
              Status: {coleta.status || 'Pendente'}
            </Text>
          </View>
        </View>

        {/* Layout em duas colunas */}
        <View style={styles.twoColumns}>
          {/* Coluna Esquerda - Remetente */}
          <View style={styles.column}>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>REMETENTE</Text>
              </View>
              <View style={styles.sectionContent}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Nome:</Text>
                  <Text style={styles.infoValue}>{coleta.remetente || coleta.solicitante_nome || 'Não informado'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Telefone:</Text>
                  <Text style={styles.infoValue}>{coleta.remetente_telefone || coleta.solicitante_telefone || 'Não informado'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Documento:</Text>
                  <Text style={styles.infoValue}>{coleta.remetente_documento || 'Não informado'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Endereço:</Text>
                  <Text style={styles.infoValue}>
                    {[coleta.remetente_rua || coleta.coleta_rua, coleta.remetente_numero || coleta.coleta_numero].filter(Boolean).join(', ') || 'Não informado'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Bairro:</Text>
                  <Text style={styles.infoValue}>{coleta.remetente_bairro || coleta.coleta_bairro || 'Não informado'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Cidade:</Text>
                  <Text style={styles.infoValue}>{coleta.remetente_cidade || coleta.coleta_cidade || 'Não informado'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>CEP:</Text>
                  <Text style={styles.infoValue}>{coleta.remetente_cep || coleta.coleta_cep || 'Não informado'}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Coluna Direita - Destinatário */}
          <View style={styles.column}>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>DESTINATÁRIO</Text>
              </View>
              <View style={styles.sectionContent}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Nome:</Text>
                  <Text style={styles.infoValue}>{coleta.destinatario || 'Não informado'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Telefone:</Text>
                  <Text style={styles.infoValue}>{coleta.destinatario_telefone || 'Não informado'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Documento:</Text>
                  <Text style={styles.infoValue}>{coleta.destinatario_documento || 'Não informado'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Endereço:</Text>
                  <Text style={styles.infoValue}>
                    {[coleta.destinatario_rua, coleta.destinatario_numero].filter(Boolean).join(', ') || 'Não informado'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Bairro:</Text>
                  <Text style={styles.infoValue}>{coleta.destinatario_bairro || 'Não informado'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Cidade:</Text>
                  <Text style={styles.infoValue}>{coleta.destinatario_cidade || 'Não informado'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>CEP:</Text>
                  <Text style={styles.infoValue}>{coleta.destinatario_cep || 'Não informado'}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Mercadoria */}
        <View style={styles.mercadoriaSection}>
          <View style={styles.mercadoriaHeader}>
            <Text style={styles.mercadoriaTitle}>MERCADORIA</Text>
          </View>
          <View style={styles.mercadoriaContent}>
            <View style={styles.mercadoriaGrid}>
              <View style={styles.mercadoriaInfo}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Descrição:</Text>
                  <Text style={styles.infoValue}>{coleta.mercadoria_descricao || 'Não informado'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Valor:</Text>
                  <Text style={styles.infoValue}>{formatCurrency(coleta.mercadoria_valor || 0)}</Text>
                </View>
              </View>
              <View style={styles.mercadoriaStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{coleta.mercadoria_peso || '0'}</Text>
                  <Text style={styles.statLabel}>kg</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{coleta.mercadoria_quantidade || '1'}</Text>
                  <Text style={styles.statLabel}>und</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Observações (se houver) */}
        {coleta.observacoes && (
          <View style={styles.observacoesSection}>
            <View style={styles.observacoesHeader}>
              <Text style={styles.observacoesTitle}>OBSERVAÇÕES</Text>
            </View>
            <Text style={styles.observacoesText}>{coleta.observacoes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            CNPJ: 43.688.885/0001-70 - Av. Dom Helder Camara, 5555 - Cachambi - Rio de Janeiro/RJ{'\n'}
            Tel: (21) 3195-6500 - contato@fptranscargas.com.br - www.fptranscargas.com.br
          </Text>
        </View>
      </Page>
    </Document>
  );
};