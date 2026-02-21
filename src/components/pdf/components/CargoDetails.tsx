
import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { Cotacao } from '../firestore';
import { styles } from '../styles';

interface CargoDetailsProps {
  cotacao: Cotacao;
}

export const CargoDetails: React.FC<CargoDetailsProps> = ({ cotacao }) => {
  // Safety check to prevent rendering errors
  if (!cotacao || !cotacao.carga) {
    return null;
  }
  
  // Safely access cargo fields with fallbacks
  const carga = cotacao.carga;
  
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Especificações da Carga</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, { flex: 2 }]}>Descrição</Text>
          <Text style={styles.headerCell}>Dimensões (cm)</Text>
          <Text style={styles.headerCell}>Peso (kg)</Text>
          <Text style={styles.headerCell}>Valor Declarado</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={[styles.tableCell, { flex: 2 }]}>
            {carga.description || 'Transporte de carga'}
          </Text>
          <Text style={styles.tableCell}>
            {`${carga.height || 0} × ${carga.length || 0} × ${carga.depth || 0}`}
          </Text>
          <Text style={styles.tableCell}>
            {carga.weight || 0}
          </Text>
          <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(Number(carga.declaredValue) || 0)}
          </Text>
        </View>
      </View>
    </View>
  );
};
