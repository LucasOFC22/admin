import React from 'react';
import { formatCurrency } from '@/lib/formatters';
import { Document, Page, View, Text, StyleSheet, Image } from '@react-pdf/renderer';
import { LOGO_IMAGE } from './constants';
import type { Coleta } from '@/types/coleta';

interface ModernColetaPDFProps {
  coleta: Coleta;
}

const modernStyles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    backgroundColor: '#ffffff',
    padding: 24,
  },
  
  // Header moderno
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    paddingBottom: 16,
    borderBottomWidth: 3,
    borderBottomColor: '#1e40af',
  },
  
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  
  logo: {
    width: 80,
    height: 50,
    objectFit: 'contain',
  },
  
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
    letterSpacing: 0.5,
  },
  
  headerInfo: {
    alignItems: 'flex-end',
  },
  
  documentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 4,
  },
  
  orderNumber: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  
  dateInfo: {
    fontSize: 10,
    color: '#64748b',
  },
  
  // Badge de status
  statusBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  
  statusText: {
    fontSize: 9,
    color: '#ffffff',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  
  // Grid layout moderno
  gridContainer: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 24,
  },
  
  gridColumn: {
    flex: 1,
  },
  
  // Cards modernos
  card: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#1e40af',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  cardIcon: {
    width: 16,
    height: 16,
    backgroundColor: '#1e40af',
    borderRadius: 8,
    marginRight: 8,
  },
  
  cardTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e40af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  
  fieldLabel: {
    fontSize: 9,
    color: '#64748b',
    width: 80,
    fontWeight: 'bold',
  },
  
  fieldValue: {
    fontSize: 9,
    color: '#1e293b',
    flex: 1,
  },
  
  // Card de mercadoria destacado
  cargoCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#3b82f6',
    padding: 16,
    marginBottom: 20,
  },
  
  cargoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  cargoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e40af',
    textTransform: 'uppercase',
  },
  
  urgentBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  
  urgentText: {
    fontSize: 8,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  
  cargoContent: {
    flexDirection: 'row',
    gap: 16,
  },
  
  cargoDetails: {
    flex: 2,
  },
  
  cargoStats: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    padding: 12,
  },
  
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  
  statLabel: {
    fontSize: 8,
    color: '#64748b',
  },
  
  statValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  
  // Observações especiais
  notesCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f59e0b',
    padding: 16,
    marginBottom: 20,
  },
  
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  notesIcon: {
    width: 12,
    height: 12,
    backgroundColor: '#f59e0b',
    borderRadius: 6,
    marginRight: 6,
  },
  
  notesTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#92400e',
  },
  
  notesText: {
    fontSize: 10,
    color: '#92400e',
    lineHeight: 1.4,
  },
  
  // Endereços em timeline
  addressTimeline: {
    marginBottom: 24,
  },
  
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  
  timelineMarker: {
    width: 24,
    alignItems: 'center',
    marginRight: 16,
  },
  
  timelineCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1e40af',
    marginBottom: 4,
  },
  
  timelineLine: {
    width: 2,
    height: 40,
    backgroundColor: '#e2e8f0',
  },
  
  timelineContent: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    padding: 12,
  },
  
  timelineTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 6,
  },
  
  addressText: {
    fontSize: 9,
    color: '#475569',
    lineHeight: 1.3,
  },
  
  // Footer moderno
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  footerCompany: {
    fontSize: 8,
    color: '#64748b',
    lineHeight: 1.3,
  },
  
  footerQr: {
    width: 40,
    height: 40,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
  },
  
  // Assinatura
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    marginBottom: 24,
  },
  
  signatureBox: {
    width: '45%',
    borderTopWidth: 1,
    borderTopColor: '#9ca3af',
    paddingTop: 8,
    alignItems: 'center',
  },
  
  signatureLabel: {
    fontSize: 9,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export const ModernColetaPDF: React.FC<ModernColetaPDFProps> = ({ coleta }) => {
  // formatCurrency imported from @/lib/formatters

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Data não informada';
    const { formatTimestamp } = require('@/utils/dateFormatters');
    return formatTimestamp(dateString);
  };

  const serviceNumber = String(coleta.id || '000000').padStart(6, '0');
  const currentDate = new Date();
  
  const fullRemetenteAddress = [
    coleta.remetente_rua || coleta.coleta_rua,
    coleta.remetente_numero || coleta.coleta_numero,
    coleta.remetente_bairro || coleta.coleta_bairro,
    coleta.remetente_cidade || coleta.coleta_cidade,
    coleta.remetente_cep || coleta.coleta_cep
  ].filter(Boolean).join(', ');

  const fullDestinatarioAddress = [
    coleta.destinatario_rua,
    coleta.destinatario_numero,
    coleta.destinatario_bairro,
    coleta.destinatario_cidade,
    coleta.destinatario_cep
  ].filter(Boolean).join(', ');

  return (
    <Document>
      <Page size="A4" style={modernStyles.page}>
        {/* Header moderno */}
        <View style={modernStyles.header}>
          <View style={modernStyles.logoSection}>
            <Image src={LOGO_IMAGE} style={modernStyles.logo} />
            <Text style={modernStyles.companyName}>FP TRANSCARGAS</Text>
          </View>
          
          <View style={modernStyles.headerInfo}>
            <Text style={modernStyles.documentTitle}>ORDEM DE COLETA</Text>
            <Text style={modernStyles.orderNumber}>Nº {serviceNumber}</Text>
            <Text style={modernStyles.dateInfo}>
              Emitido em: {formatDate(currentDate.toISOString())}
            </Text>
            <View style={modernStyles.statusBadge}>
              <Text style={modernStyles.statusText}>{coleta.status || 'Pendente'}</Text>
            </View>
          </View>
        </View>

        {/* Informações do solicitante */}
        <View style={modernStyles.card}>
          <View style={modernStyles.cardHeader}>
            <View style={modernStyles.cardIcon} />
            <Text style={modernStyles.cardTitle}>Solicitante</Text>
          </View>
          
          <View style={modernStyles.fieldRow}>
            <Text style={modernStyles.fieldLabel}>Nome:</Text>
            <Text style={modernStyles.fieldValue}>{coleta.solicitante_nome || 'Não informado'}</Text>
          </View>
          
          <View style={modernStyles.fieldRow}>
            <Text style={modernStyles.fieldLabel}>Telefone:</Text>
            <Text style={modernStyles.fieldValue}>{coleta.solicitante_telefone || 'Não informado'}</Text>
          </View>
          
          <View style={modernStyles.fieldRow}>
            <Text style={modernStyles.fieldLabel}>E-mail:</Text>
            <Text style={modernStyles.fieldValue}>{coleta.solicitante_email || 'Não informado'}</Text>
          </View>
        </View>

        {/* Timeline de endereços */}
        <View style={modernStyles.addressTimeline}>
          {/* Ponto de coleta */}
          <View style={modernStyles.timelineItem}>
            <View style={modernStyles.timelineMarker}>
              <View style={modernStyles.timelineCircle} />
              <View style={modernStyles.timelineLine} />
            </View>
            <View style={modernStyles.timelineContent}>
              <Text style={modernStyles.timelineTitle}>🏭 PONTO DE COLETA</Text>
              <Text style={modernStyles.addressText}>
                <Text style={{ fontWeight: 'bold' }}>Remetente: </Text>
                {coleta.remetente || 'Não informado'}
              </Text>
              <Text style={modernStyles.addressText}>
                <Text style={{ fontWeight: 'bold' }}>Endereço: </Text>
                {fullRemetenteAddress || 'Endereço não informado'}
              </Text>
              <Text style={modernStyles.addressText}>
                <Text style={{ fontWeight: 'bold' }}>Telefone: </Text>
                {coleta.remetente_telefone || 'Não informado'}
              </Text>
            </View>
          </View>

          {/* Ponto de entrega */}
          <View style={modernStyles.timelineItem}>
            <View style={modernStyles.timelineMarker}>
              <View style={modernStyles.timelineCircle} />
            </View>
            <View style={modernStyles.timelineContent}>
              <Text style={modernStyles.timelineTitle}>🎯 PONTO DE ENTREGA</Text>
              <Text style={modernStyles.addressText}>
                <Text style={{ fontWeight: 'bold' }}>Destinatário: </Text>
                {coleta.destinatario || 'Não informado'}
              </Text>
              <Text style={modernStyles.addressText}>
                <Text style={{ fontWeight: 'bold' }}>Endereço: </Text>
                {fullDestinatarioAddress || 'Endereço não informado'}
              </Text>
              <Text style={modernStyles.addressText}>
                <Text style={{ fontWeight: 'bold' }}>Telefone: </Text>
                {coleta.destinatario_telefone || 'Não informado'}
              </Text>
            </View>
          </View>
        </View>

        {/* Card de mercadoria */}
        <View style={modernStyles.cargoCard}>
          <View style={modernStyles.cargoHeader}>
            <Text style={modernStyles.cargoTitle}>📦 DETALHES DA MERCADORIA</Text>
            {coleta.mercadoria_valor > 10000 && (
              <View style={modernStyles.urgentBadge}>
                <Text style={modernStyles.urgentText}>ALTO VALOR</Text>
              </View>
            )}
          </View>
          
          <View style={modernStyles.cargoContent}>
            <View style={modernStyles.cargoDetails}>
              <View style={modernStyles.fieldRow}>
                <Text style={modernStyles.fieldLabel}>Descrição:</Text>
                <Text style={modernStyles.fieldValue}>{coleta.mercadoria_descricao || 'Não informado'}</Text>
              </View>
              
              <View style={modernStyles.fieldRow}>
                <Text style={modernStyles.fieldLabel}>Quantidade:</Text>
                <Text style={modernStyles.fieldValue}>{coleta.mercadoria_quantidade || 1} unidade(s)</Text>
              </View>
              
              <View style={modernStyles.fieldRow}>
                <Text style={modernStyles.fieldLabel}>Dimensões:</Text>
                <Text style={modernStyles.fieldValue}>
                  {coleta.mercadoria_comprimento || 0} x {coleta.mercadoria_largura || 0} x {coleta.mercadoria_altura || 0} cm
                </Text>
              </View>
            </View>
            
            <View style={modernStyles.cargoStats}>
              <View style={modernStyles.statRow}>
                <Text style={modernStyles.statLabel}>Peso:</Text>
                <Text style={modernStyles.statValue}>{coleta.mercadoria_peso || 0} kg</Text>
              </View>
              
              <View style={modernStyles.statRow}>
                <Text style={modernStyles.statLabel}>Valor:</Text>
                <Text style={modernStyles.statValue}>{formatCurrency(coleta.mercadoria_valor || 0)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Observações se houver */}
        {coleta.observacoes && (
          <View style={modernStyles.notesCard}>
            <View style={modernStyles.notesHeader}>
              <View style={modernStyles.notesIcon} />
              <Text style={modernStyles.notesTitle}>OBSERVAÇÕES IMPORTANTES</Text>
            </View>
            <Text style={modernStyles.notesText}>{coleta.observacoes}</Text>
          </View>
        )}

        {/* Seção de assinaturas */}
        <View style={modernStyles.signatureSection}>
          <View style={modernStyles.signatureBox}>
            <Text style={modernStyles.signatureLabel}>Assinatura do Solicitante</Text>
          </View>
          
          <View style={modernStyles.signatureBox}>
            <Text style={modernStyles.signatureLabel}>Assinatura do Motorista</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={modernStyles.footer}>
          <View style={modernStyles.footerContent}>
            <Text style={modernStyles.footerCompany}>
              FP TRANSCARGAS LTDA{'\n'}
              CNPJ: 43.688.885/0001-70{'\n'}
              Av. Dom Helder Camara, 5555 - Cachambi - Rio de Janeiro/RJ{'\n'}
              Tel: (21) 3195-6500 | contato@fptranscargas.com.br
            </Text>
            
            <View style={modernStyles.footerQr}>
              {/* QR Code placeholder */}
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};