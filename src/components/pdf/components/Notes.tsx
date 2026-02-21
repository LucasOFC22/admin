
import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { Cotacao } from '../firestore';
import { styles } from '../styles';

interface NotesProps {
  cotacao: Cotacao;
}

export const Notes: React.FC<NotesProps> = ({ cotacao }) => {
  // More robust checking for cotacao structure
  if (!cotacao || !cotacao.carga) {
    return null;
  }
  
  // Check if notes exist, and if not, return null or a default message
  const notes = cotacao.carga.notes || '';
  if (!notes.trim()) {
    return null;
  }
  
  return (
    <View style={styles.section}>
      <View style={styles.notesContainer}>
        <Text style={styles.notesTitle}>Observações</Text>
        <Text style={styles.value}>{notes}</Text>
      </View>
    </View>
  );
};
