
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 30,
    paddingLeft: 40,
    paddingRight: 40,
    paddingBottom: 30,
    lineHeight: 1.4,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 25,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
  },
  logo: {
    width: 80,
    height: 80,
    marginRight: 20,
  },
  companyInfo: {
    flex: 1,
    marginRight: 20,
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  companyDetails: {
    fontSize: 9,
    color: '#6b7280',
    lineHeight: 1.3,
  },
  documentInfo: {
    alignItems: 'flex-end',
  },
  documentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 5,
  },
  documentNumber: {
    fontSize: 12,
    color: '#1f2937',
    marginBottom: 3,
  },
  documentDate: {
    fontSize: 9,
    color: '#6b7280',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  column: {
    flex: 1,
    marginRight: 15,
  },
  label: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#4b5563',
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
    color: '#1f2937',
    marginBottom: 5,
  },
  highlight: {
    backgroundColor: '#eff6ff',
    padding: 8,
    borderRadius: 4,
    marginBottom: 10,
  },
  highlightText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  twoColumns: {
    flexDirection: 'row',
    gap: 20,
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    flex: 1,
  },
  footer: {
    marginTop: 30,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 8,
    color: '#6b7280',
  },
  signature: {
    marginTop: 40,
    alignItems: 'center',
  },
  signatureLine: {
    width: 200,
    borderBottomWidth: 1,
    borderBottomColor: '#9ca3af',
    marginBottom: 5,
  },
  signatureText: {
    fontSize: 9,
    color: '#6b7280',
  },
});

interface ColetaPDFProps {
  coleta: any;
}

export const FormalColetaPDF: React.FC<ColetaPDFProps> = ({ coleta }) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const { formatDateLongOnly } = require('@/utils/dateFormatters');
    return formatDateLongOnly(dateString);
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    const { formatDateTime: fdt } = require('@/utils/dateFormatters');
    return fdt(dateString);
  };

  const calculateVolume = () => {
    const comprimento = Number(coleta.mercadoria_comprimento) || 0;
    const largura = Number(coleta.mercadoria_largura) || 0;
    const altura = Number(coleta.mercadoria_altura) || 0;
    const quantidade = Number(coleta.mercadoria_quantidade) || 0;
    
    if (comprimento > 0 && largura > 0 && altura > 0 && quantidade > 0) {
      const volumeUnitario = (comprimento * largura * altura) / 1000000;
      const volumeTotal = volumeUnitario * quantidade;
      return volumeTotal.toFixed(6);
    }
    return 'N/A';
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>FP TRANSPORTES</Text>
            <Text style={styles.companyDetails}>
              CNPJ: 05.805.337/0001-90{'\n'}
              Endereço: Rua Principal, 123 - Centro{'\n'}
              Cidade - Estado, CEP: 12345-678{'\n'}
              Telefone: (75) 3614-4323{'\n'}
              Email: contato@fptransportes.com.br
            </Text>
          </View>
          <View style={styles.documentInfo}>
            <Text style={styles.documentTitle}>ORDEM DE COLETA</Text>
            <Text style={styles.documentNumber}>#{coleta.id}</Text>
            <Text style={styles.documentDate}>
              Emitida em: {formatDateTime(coleta.criado_em)}
            </Text>
          </View>
        </View>

        {/* Status e NFe */}
        <View style={styles.section}>
          <View style={styles.row}>
            <View style={styles.column}>
              <View style={styles.highlight}>
                <Text style={styles.highlightText}>Status: {coleta.status}</Text>
              </View>
            </View>
            {coleta.nota_fiscal && (
              <View style={styles.column}>
                <View style={styles.highlight}>
                  <Text style={styles.highlightText}>NFe: {coleta.nota_fiscal}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Solicitante */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DADOS DO SOLICITANTE</Text>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Nome:</Text>
              <Text style={styles.value}>{coleta.solicitante_nome || 'N/A'}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Telefone:</Text>
              <Text style={styles.value}>{coleta.solicitante_telefone || 'N/A'}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>E-mail:</Text>
              <Text style={styles.value}>{coleta.solicitante_email || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Endereços */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ENDEREÇOS</Text>
          <View style={styles.twoColumns}>
            <View style={styles.leftColumn}>
              <Text style={styles.label}>ORIGEM (Remetente):</Text>
              <Text style={styles.value}>{coleta.remetente}</Text>
              <Text style={styles.value}>Doc: {coleta.remetente_documento || 'N/A'}</Text>
              <Text style={styles.value}>
                {coleta.remetente_rua}, {coleta.remetente_numero}{'\n'}
                {coleta.remetente_bairro} - {coleta.remetente_cidade}{'\n'}
                CEP: {coleta.remetente_cep}
              </Text>
            </View>
            <View style={styles.rightColumn}>
              <Text style={styles.label}>DESTINO (Destinatário):</Text>
              <Text style={styles.value}>{coleta.destinatario}</Text>
              <Text style={styles.value}>Doc: {coleta.destinatario_documento || 'N/A'}</Text>
              <Text style={styles.value}>
                {coleta.destinatario_rua}, {coleta.destinatario_numero}{'\n'}
                {coleta.destinatario_bairro} - {coleta.destinatario_cidade}{'\n'}
                CEP: {coleta.destinatario_cep}
              </Text>
            </View>
          </View>
        </View>

        {/* Mercadoria */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DETALHES DA MERCADORIA</Text>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Descrição:</Text>
              <Text style={styles.value}>{coleta.mercadoria_descricao || 'N/A'}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Peso:</Text>
              <Text style={styles.value}>{coleta.mercadoria_peso || 0} kg</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Quantidade:</Text>
              <Text style={styles.value}>{coleta.mercadoria_quantidade || 0}</Text>
            </View>
          </View>
          
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Dimensões (cm):</Text>
              <Text style={styles.value}>
                {coleta.mercadoria_comprimento || 0} x {coleta.mercadoria_largura || 0} x {coleta.mercadoria_altura || 0}
              </Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Volume Total:</Text>
              <Text style={styles.value}>{calculateVolume()} m³</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Valor Declarado:</Text>
              <Text style={styles.value}>R$ {Number(coleta.mercadoria_valor || 0).toLocaleString('pt-BR')}</Text>
            </View>
          </View>
        </View>

        {/* Observações */}
        {coleta.observacoes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>OBSERVAÇÕES</Text>
            <Text style={styles.value}>{coleta.observacoes}</Text>
          </View>
        )}

        {/* Assinatura */}
        <View style={styles.signature}>
          <View style={styles.signatureLine}></View>
          <Text style={styles.signatureText}>Assinatura do Responsável</Text>
          <Text style={styles.signatureText}>FP Transportes</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            FP Transportes • CNPJ: 05.805.337/0001-90 • (75) 3614-4323
          </Text>
          <Text style={styles.footerText}>
            Página 1 de 1 • Gerado em {formatDateTime(new Date().toISOString())}
          </Text>
        </View>
      </Page>
    </Document>
  );
};
