
import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { styles } from '../styles';

export const Footer: React.FC = () => {
  // Format date with error handling
  let dateFormatted = '';
  try {
    const now = new Date();
    dateFormatted = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(now);
  } catch (e) {
    console.error("Error formatting date in footer:", e);
    dateFormatted = new Date().toLocaleString('pt-BR');
  }
  
  return (
    <View style={styles.footer}>
      <Text style={styles.footerText}>
        FP Transportes • CNPJ: 05.805.337/0001-90 • (75) 3614-4323
      </Text>
      <Text style={styles.footerText}>
        Página 1 de 1 • Gerado em {dateFormatted}
      </Text>
    </View>
  );
};
