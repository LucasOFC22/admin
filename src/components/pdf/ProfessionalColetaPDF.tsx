import React from 'react';
import { formatCurrency } from '@/lib/formatters';
import { Document, Page, View, Text, StyleSheet, Image } from '@react-pdf/renderer';
import { CORES, LOGO_IMAGE } from './constants';

interface ProfessionalColetaPDFProps {
  coleta: any;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    padding: 15,
    backgroundColor: '#FFFFFF',
    lineHeight: 1.2,
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
  },
  
  logoSection: {
    alignItems: 'flex-start',
  },
  
  logo: {
    width: 60,
    height: 40,
    objectFit: 'contain',
  },
  
  companyInfo: {
    fontSize: 7,
    lineHeight: 1.1,
    color: '#000000',
    marginTop: 2,
  },
  
  contactInfo: {
    alignItems: 'flex-end',
    fontSize: 8,
  },
  
  phoneNumbers: {
    textAlign: 'right',
    fontSize: 8,
    fontWeight: 'bold',
  },
  
  serviceNumber: {
    textAlign: 'right',
    fontSize: 7,
    marginTop: 2,
  },
  
  // Title styles
  titleSection: {
    marginBottom: 8,
  },
  
  mainTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#000000',
    marginBottom: 4,
  },
  
  serviceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#000000',
    paddingHorizontal: 8,
  },
  
  // Form styles
  formRow: {
    flexDirection: 'row',
    marginBottom: 3,
    borderWidth: 1,
    borderColor: '#000000',
    minHeight: 15,
  },
  
  formField: {
    borderRightWidth: 1,
    borderRightColor: '#000000',
    paddingHorizontal: 4,
    paddingVertical: 2,
    justifyContent: 'center',
  },
  
  lastField: {
    borderRightWidth: 0,
  },
  
  fieldLabel: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#000000',
  },
  
  fieldValue: {
    fontSize: 8,
    color: '#000000',
    marginTop: 1,
  },
  
  // Specific field widths
  clientField: { width: '25%' },
  contactField: { width: '20%' },
  addressField: { width: '25%' },
  complementField: { width: '15%' },
  neighborhoodField: { width: '15%' },
  
  cityField: { width: '25%' },
  stateField: { width: '10%' },
  cepField: { width: '15%' },
  
  plateField: { width: '15%' },
  modelField: { width: '20%' },
  driverField: { width: '65%' },
  
  materialField: { width: '30%' },
  nfField: { width: '15%' },
  valueField: { width: '15%' },
  weightField: { width: '15%' },
  volumeField: { width: '25%' },
  
  transportInfoField: { width: '100%' },
  
  locationField: { width: '30%' },
  dateField: { width: '20%' },
  
  observationsField: { width: '70%' },
  driverInfoField: { width: '30%' },
  
  situationField: { width: '35%' },
  receiverField: { width: '65%' },
  
  // Value table
  valueTable: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#000000',
  },
  
  valueRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    minHeight: 12,
  },
  
  lastValueRow: {
    borderBottomWidth: 0,
  },
  
  valueLabel: {
    width: '70%',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRightWidth: 1,
    borderRightColor: '#000000',
    justifyContent: 'center',
  },
  
  valueAmount: {
    width: '15%',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRightWidth: 1,
    borderRightColor: '#000000',
    justifyContent: 'center',
    textAlign: 'right',
  },
  
  valueAmountLast: {
    width: '15%',
    paddingHorizontal: 4,
    paddingVertical: 2,
    justifyContent: 'center',
    textAlign: 'right',
  },
  
  valueLabelText: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  
  valueAmountText: {
    fontSize: 8,
    textAlign: 'right',
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 15,
    left: 15,
    right: 15,
    fontSize: 6,
    textAlign: 'center',
    color: '#666666',
  },
});

export const ProfessionalColetaPDF: React.FC<ProfessionalColetaPDFProps> = ({ coleta }) => {
  // formatCurrency imported from @/lib/formatters

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const { formatDateOnly } = require('@/utils/dateFormatters');
    return formatDateOnly(dateString) || '';
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const currentDate = new Date();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoSection}>
            <Image src={LOGO_IMAGE} style={styles.logo} />
            <Text style={styles.companyInfo}>
              SEU ENDEREÇO - SEU BAIRRO - SUA CIDADE-UF
            </Text>
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.phoneNumbers}>(99) 9999-9999</Text>
            <Text style={styles.phoneNumbers}>(99) 9999-9999</Text>
            <Text style={styles.serviceNumber}>CEL ENDEREÇO - SEU BAIRRO - SUA CIDADE-UF</Text>
          </View>
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>
            DEMONSTRAÇÃO COLETA ENTREGA v2.0 {String(coleta.id).padStart(6, '0')} {String(coleta.id).padStart(6, '0')}
          </Text>
          <View style={styles.serviceInfo}>
            <Text>SERVIÇO DE TRANSPORTE Nº {String(coleta.id).padStart(6, '0')}</Text>
            <Text>Hora: {formatTime(currentDate.toISOString())} Data: {formatDate(currentDate.toISOString())}</Text>
          </View>
        </View>

        {/* Cliente Row */}
        <View style={styles.formRow}>
          <View style={[styles.formField, styles.clientField]}>
            <Text style={styles.fieldLabel}>Cliente:</Text>
            <Text style={styles.fieldValue}>{coleta.solicitante_nome || 'NOME DO CLIENTE'}</Text>
          </View>
          <View style={[styles.formField, styles.contactField]}>
            <Text style={styles.fieldLabel}>Contato:</Text>
            <Text style={styles.fieldValue}>{coleta.solicitante_telefone || ''}</Text>
          </View>
          <View style={[styles.formField, styles.addressField]}>
            <Text style={styles.fieldLabel}>Endereço:</Text>
            <Text style={styles.fieldValue}>
              {[coleta.remetente_rua, coleta.remetente_numero].filter(Boolean).join(', ') || 'ENDEREÇO DE EXEMPLO'}
            </Text>
          </View>
          <View style={[styles.formField, styles.complementField]}>
            <Text style={styles.fieldLabel}>Complemento:</Text>
            <Text style={styles.fieldValue}></Text>
          </View>
          <View style={[styles.formField, styles.neighborhoodField, styles.lastField]}>
            <Text style={styles.fieldLabel}>Bairro:</Text>
            <Text style={styles.fieldValue}>{coleta.remetente_bairro || ''}</Text>
          </View>
        </View>

        {/* Cidade Row */}
        <View style={styles.formRow}>
          <View style={[styles.formField, styles.cityField]}>
            <Text style={styles.fieldLabel}>Cidade:</Text>
            <Text style={styles.fieldValue}>{coleta.remetente_cidade || 'SÃO PAULO'}</Text>
          </View>
          <View style={[styles.formField, styles.stateField]}>
            <Text style={styles.fieldLabel}>UF:</Text>
            <Text style={styles.fieldValue}>SP</Text>
          </View>
          <View style={[styles.formField, styles.cepField, styles.lastField]}>
            <Text style={styles.fieldLabel}>CEP:</Text>
            <Text style={styles.fieldValue}>{coleta.remetente_cep || ''}</Text>
          </View>
        </View>

        {/* Placa/Modelo/Motorista Row */}
        <View style={styles.formRow}>
          <View style={[styles.formField, styles.plateField]}>
            <Text style={styles.fieldLabel}>PLACA:</Text>
            <Text style={styles.fieldValue}>ABC1234</Text>
          </View>
          <View style={[styles.formField, styles.modelField]}>
            <Text style={styles.fieldLabel}>MODELO:</Text>
            <Text style={styles.fieldValue}></Text>
          </View>
          <View style={[styles.formField, styles.driverField, styles.lastField]}>
            <Text style={styles.fieldLabel}>MOTORISTA:</Text>
            <Text style={styles.fieldValue}>JOÃO DA SILVA</Text>
          </View>
        </View>

        {/* Material Row */}
        <View style={styles.formRow}>
          <View style={[styles.formField, styles.materialField]}>
            <Text style={styles.fieldLabel}>Material:</Text>
            <Text style={styles.fieldValue}>{coleta.mercadoria_descricao || 'PACOTE'}</Text>
          </View>
          <View style={[styles.formField, styles.volumeField]}>
            <Text style={styles.fieldLabel}>Volume:</Text>
            <Text style={styles.fieldValue}>{coleta.mercadoria_quantidade || ''}</Text>
          </View>
          <View style={[styles.formField, styles.nfField]}>
            <Text style={styles.fieldLabel}>NF:</Text>
            <Text style={styles.fieldValue}>123/45</Text>
          </View>
          <View style={[styles.formField, styles.valueField]}>
            <Text style={styles.fieldLabel}>Valor:</Text>
            <Text style={styles.fieldValue}>{formatCurrency(coleta.mercadoria_valor || 1200)}</Text>
          </View>
          <View style={[styles.formField, styles.weightField, styles.lastField]}>
            <Text style={styles.fieldLabel}>Peso:</Text>
            <Text style={styles.fieldValue}>{coleta.mercadoria_peso || '23,7'}</Text>
          </View>
        </View>

        {/* Informações do Transporte */}
        <View style={styles.formRow}>
          <View style={[styles.formField, styles.transportInfoField, styles.lastField]}>
            <Text style={styles.fieldLabel}>Informações do Transporte:</Text>
            <Text style={styles.fieldValue}>Coletar o mais rápido possível</Text>
          </View>
        </View>

        {/* Local da Coleta / Data da Coleta */}
        <View style={styles.formRow}>
          <View style={[styles.formField, styles.locationField]}>
            <Text style={styles.fieldLabel}>Local da Coleta:</Text>
            <Text style={styles.fieldValue}>
              {[coleta.coleta_rua, coleta.coleta_numero].filter(Boolean).join(', ') || 'RUA DOS CANÁRIOS 630'}
            </Text>
          </View>
          <View style={[styles.formField, styles.dateField]}>
            <Text style={styles.fieldLabel}>Data da Coleta:</Text>
            <Text style={styles.fieldValue}>{formatDate(coleta.criado_em) || '06/04/2011'}</Text>
          </View>
          <View style={[styles.formField, styles.dateField, styles.lastField]}>
            <Text style={styles.fieldLabel}>Hora:</Text>
            <Text style={styles.fieldValue}></Text>
          </View>
        </View>

        {/* Local da Entrega / Data da Entrega */}
        <View style={styles.formRow}>
          <View style={[styles.formField, styles.locationField]}>
            <Text style={styles.fieldLabel}>Local da Entrega:</Text>
            <Text style={styles.fieldValue}>
              {[coleta.destinatario_rua, coleta.destinatario_numero].filter(Boolean).join(', ') || ''}
            </Text>
          </View>
          <View style={[styles.formField, styles.dateField]}>
            <Text style={styles.fieldLabel}>Data da Entrega:</Text>
            <Text style={styles.fieldValue}>___/___/___</Text>
          </View>
          <View style={[styles.formField, styles.dateField, styles.lastField]}>
            <Text style={styles.fieldLabel}>Hora:</Text>
            <Text style={styles.fieldValue}></Text>
          </View>
        </View>

        {/* Observações Gerais */}
        <View style={styles.formRow}>
          <View style={[styles.formField, styles.observationsField, styles.lastField]}>
            <Text style={styles.fieldLabel}>Observações Gerais:</Text>
            <Text style={styles.fieldValue}>{coleta.observacoes || 'cliente quer urgência'}</Text>
          </View>
        </View>

        {/* Motorista / Situação / Nome do Recebedor */}
        <View style={styles.formRow}>
          <View style={[styles.formField, styles.driverInfoField]}>
            <Text style={styles.fieldLabel}>Motorista:</Text>
            <Text style={styles.fieldValue}>JOÃO DA SILVA</Text>
          </View>
          <View style={[styles.formField, styles.situationField]}>
            <Text style={styles.fieldLabel}>Situação:</Text>
            <Text style={styles.fieldValue}>Aguardando confirmação</Text>
          </View>
          <View style={[styles.formField, styles.receiverField, styles.lastField]}>
            <Text style={styles.fieldLabel}>Nome do Recebedor:</Text>
            <Text style={styles.fieldValue}>quadrado</Text>
          </View>
        </View>

        {/* Observação importante */}
        <View style={styles.formRow}>
          <View style={[styles.formField, styles.transportInfoField, styles.lastField]}>
            <Text style={styles.fieldValue}>
              ***ESTE DOCUMENTO NÃO VALE COMO RECIBO DE PAGAMENTO***
            </Text>
          </View>
        </View>

        {/* Value Table */}
        <View style={styles.valueTable}>
          <View style={styles.valueRow}>
            <View style={styles.valueLabel}>
              <Text style={styles.valueLabelText}>FRETE</Text>
            </View>
            <View style={styles.valueAmount}>
              <Text style={styles.valueAmountText}>R$</Text>
            </View>
            <View style={styles.valueAmountLast}>
              <Text style={styles.valueAmountText}>125,00</Text>
            </View>
          </View>
          
          <View style={styles.valueRow}>
            <View style={styles.valueLabel}>
              <Text style={styles.valueLabelText}>Outros Custos</Text>
            </View>
            <View style={styles.valueAmount}>
              <Text style={styles.valueAmountText}>R$</Text>
            </View>
            <View style={styles.valueAmountLast}>
              <Text style={styles.valueAmountText}>35,00</Text>
            </View>
          </View>
          
          <View style={styles.valueRow}>
            <View style={styles.valueLabel}>
              <Text style={styles.valueLabelText}>VALOR DESCONTO</Text>
            </View>
            <View style={styles.valueAmount}>
              <Text style={styles.valueAmountText}>R$</Text>
            </View>
            <View style={styles.valueAmountLast}>
              <Text style={styles.valueAmountText}></Text>
            </View>
          </View>
          
          <View style={[styles.valueRow, styles.lastValueRow]}>
            <View style={styles.valueLabel}>
              <Text style={styles.valueLabelText}>VALOR TOTAL</Text>
            </View>
            <View style={styles.valueAmount}>
              <Text style={styles.valueAmountText}>R$</Text>
            </View>
            <View style={styles.valueAmountLast}>
              <Text style={styles.valueAmountText}>160,00</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Impresso em 1 via - 1ª VIA (1)</Text>
        </View>
      </Page>
    </Document>
  );
};