
import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { Cotacao } from '../firestore';
import { styles } from '../styles';

interface PartiesInfoProps {
  cotacao: Cotacao;
}

export const PartiesInfo: React.FC<PartiesInfoProps> = ({ cotacao }) => {
  // Safety checks to prevent null/undefined errors
  if (!cotacao || !cotacao.remetente || !cotacao.destinatario) {
    return null;
  }

  // Safely access address fields with fallbacks
  const remetendeAddress = cotacao.remetente.address || {
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipcode: ''
  };
  
  const destinatarioAddress = cotacao.destinatario.address || {
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipcode: ''
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Informações das Partes</Text>
      <View style={styles.twoColumn}>
        {/* Sender */}
        <View style={styles.column}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Remetente</Text>
            <View style={styles.infoItem}>
              <Text style={styles.label}>Nome/Razão Social</Text>
              <Text style={styles.value}>{cotacao.remetente.name || 'Não informado'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.label}>Documento</Text>
              <Text style={styles.value}>{cotacao.remetente.document || 'Não informado'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.label}>Endereço</Text>
              <Text style={styles.value}>
                {remetendeAddress.street || ''}{remetendeAddress.street ? ', ' : ''}{remetendeAddress.number || ''}
                {remetendeAddress.complement ? `, ${remetendeAddress.complement}` : ''}
              </Text>
              <Text style={styles.value}>
                {remetendeAddress.neighborhood || ''}{remetendeAddress.neighborhood ? ', ' : ''}
                {remetendeAddress.city || ''}{remetendeAddress.city && remetendeAddress.state ? ' - ' : ''}
                {remetendeAddress.state || ''}
              </Text>
              <Text style={styles.value}>{remetendeAddress.zipcode ? `CEP: ${remetendeAddress.zipcode}` : ''}</Text>
            </View>
          </View>
        </View>

        {/* Receiver */}
        <View style={styles.column}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Destinatário</Text>
            <View style={styles.infoItem}>
              <Text style={styles.label}>Nome/Razão Social</Text>
              <Text style={styles.value}>{cotacao.destinatario.name || 'Não informado'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.label}>Documento</Text>
              <Text style={styles.value}>{cotacao.destinatario.document || 'Não informado'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.label}>Endereço</Text>
              <Text style={styles.value}>
                {destinatarioAddress.street || ''}{destinatarioAddress.street ? ', ' : ''}{destinatarioAddress.number || ''}
                {destinatarioAddress.complement ? `, ${destinatarioAddress.complement}` : ''}
              </Text>
              <Text style={styles.value}>
                {destinatarioAddress.neighborhood || ''}{destinatarioAddress.neighborhood ? ', ' : ''}
                {destinatarioAddress.city || ''}{destinatarioAddress.city && destinatarioAddress.state ? ' - ' : ''}
                {destinatarioAddress.state || ''}
              </Text>
              <Text style={styles.value}>{destinatarioAddress.zipcode ? `CEP: ${destinatarioAddress.zipcode}` : ''}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};
