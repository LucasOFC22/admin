
import React from 'react';
import { Document, Page, View } from '@react-pdf/renderer';
import { Cotacao } from './firestore';
import { styles } from './styles';
import { Header } from './components/Header';
import { PartiesInfo } from './components/PartiesInfo';
import { CargoDetails } from './components/CargoDetails';
import { Notes } from './components/Notes';
import { Footer } from './components/Footer';

interface ProfessionalQuotationPDFProps {
  cotacao: Cotacao;
}

export const ProfessionalQuotationPDF: React.FC<ProfessionalQuotationPDFProps> = ({ cotacao }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Header cotacao={cotacao} />
        
        {/* Content section */}
        <View style={styles.content}>
          <PartiesInfo cotacao={cotacao} />
          <CargoDetails cotacao={cotacao} />
          <Notes cotacao={cotacao} />
        </View>

        <Footer />
      </Page>
    </Document>
  );
};
