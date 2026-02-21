
import React from 'react';
import { View, Image, Text } from '@react-pdf/renderer';
import { styles } from '../styles';
import { Cotacao } from '../firestore';
import { CORES, LOGO_IMAGE } from '../constants';

interface HeaderProps {
  cotacao: Cotacao;
  isProposta?: boolean;
  qrCodeUrl?: string;
}

export const Header: React.FC<HeaderProps> = ({ cotacao, isProposta = false, qrCodeUrl }) => {
  // Format date for display with safety checks
  const formatDate = (date: any) => {
    if (!date) return 'Data não disponível';
    try {
      const { formatDateOnly } = require('@/utils/dateFormatters');
      return formatDateOnly(date) || 'Data inválida';
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'Data inválida';
    }
  };

  const today = new Date();
  
  return (
    <View style={styles.header}>
      <View style={styles.companyInfo}>
        <Image src={LOGO_IMAGE} style={styles.logo} />
        <Text style={styles.companyDetails}>
          FP Trans Cargas - CNPJ: 43.688.885/0001-70{'\n'}
          Av. Dom Helder Camara, 5555 - Cachambi{'\n'}
          Rio de Janeiro - RJ, 20771-001{'\n'}
          Tel: (21) 3195-6500 | contato@fptranscargas.com.br
        </Text>
      </View>
      
      <View style={styles.documentInfo}>
        <Text style={styles.documentTitle}>
          {isProposta ? 'Proposta' : 'Cotação'}
        </Text>
        <Text style={styles.documentMeta}>
          {isProposta ? `Data: ${formatDate(today)}` : `Data: ${formatDate(cotacao.criadoEm)}`}{'\n'}
          Referência: #{cotacao.id?.substring(0, 8) || 'N/A'}
        </Text>
        
        {isProposta && (
          <View style={{
            marginTop: 8,
            backgroundColor: CORES.primary,
            borderRadius: 4,
            padding: 6,
          }}>
            <Text style={{
              color: 'white',
              fontSize: 10,
              fontWeight: 'bold',
              textAlign: 'center',
            }}>
              DOCUMENTO OFICIAL
            </Text>
          </View>
        )}
        
        {qrCodeUrl && (
          <Image
            src={qrCodeUrl}
            style={{
              marginTop: 10,
              width: 80,
              height: 80,
            }}
          />
        )}
      </View>
    </View>
  );
};
