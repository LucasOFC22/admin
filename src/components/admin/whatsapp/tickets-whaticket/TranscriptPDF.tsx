import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TranscriptData } from '@/services/whatsapp/transcriptService';

// Estilos do PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.4,
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#25d366',
    paddingBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#075e54',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#667781',
    marginBottom: 3,
  },
  dateInfo: {
    fontSize: 10,
    color: '#8696a0',
  },
  messagesContainer: {
    marginTop: 10,
  },
  messageRow: {
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e5e5',
  },
  messageHeader: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  timestamp: {
    fontSize: 9,
    color: '#8696a0',
    marginRight: 8,
    fontFamily: 'Courier',
  },
  senderName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#075e54',
  },
  senderNameClient: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e88e5',
  },
  messageContent: {
    fontSize: 10,
    color: '#1a1a1a',
    marginLeft: 60,
    marginTop: 2,
  },
  mediaInfo: {
    fontSize: 9,
    color: '#667781',
    marginLeft: 60,
    marginTop: 3,
    backgroundColor: '#f5f5f5',
    padding: 5,
    borderRadius: 3,
  },
  mediaUrl: {
    fontSize: 8,
    color: '#1e88e5',
    wordBreak: 'break-all',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 8,
    color: '#8696a0',
  },
  pageNumber: {
    fontSize: 8,
    color: '#8696a0',
  },
});

// Componente do documento PDF
const TranscriptDocument: React.FC<{ data: TranscriptData }> = ({ data }) => {
  const formattedStartDate = format(new Date(data.startDate), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR });
  const formattedEndDate = format(new Date(data.endDate), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR });
  const generatedAt = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getMediaLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'image': '📷 Imagem',
      'audio': '🎵 Áudio',
      'video': '🎬 Vídeo',
      'document': '📄 Documento',
      'sticker': '🎨 Sticker',
    };
    return labels[type] || '📎 Arquivo';
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Transcrição de Conversa</Text>
          <Text style={styles.subtitle}>
            {data.contactName} {data.contactPhone && `(${data.contactPhone})`}
          </Text>
          <Text style={styles.dateInfo}>
            Conversa #{data.chatId} • {data.messageCount} mensagens
          </Text>
          <Text style={styles.dateInfo}>
            Período: {formattedStartDate} até {formattedEndDate}
          </Text>
        </View>

        {/* Mensagens */}
        <View style={styles.messagesContainer}>
          {data.messages.map((msg, index) => {
            const time = format(new Date(msg.timestamp), 'HH:mm:ss');
            
            return (
              <View key={msg.id || index} style={styles.messageRow}>
                <View style={styles.messageHeader}>
                  <Text style={styles.timestamp}>({time})</Text>
                  <Text style={msg.isFromMe ? styles.senderName : styles.senderNameClient}>
                    {msg.senderName}:
                  </Text>
                </View>
                
                {msg.content && (
                  <Text style={styles.messageContent}>{msg.content}</Text>
                )}
                
                {msg.mediaUrl && (
                  <View style={styles.mediaInfo}>
                    <Text>
                      {getMediaLabel(msg.messageType)} - {msg.mediaFileName || 'arquivo'}
                      {msg.mediaSize && ` (${formatFileSize(msg.mediaSize)})`}
                    </Text>
                    <Text style={styles.mediaUrl}>URL: {msg.mediaUrl}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Gerado em {generatedAt} • FP Transcargas
          </Text>
          <Text 
            style={styles.pageNumber} 
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} 
          />
        </View>
      </Page>
    </Document>
  );
};

// Função para gerar e baixar PDF
export async function downloadPdfTranscript(data: TranscriptData): Promise<void> {
  const blob = await pdf(<TranscriptDocument data={data} />).toBlob();
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `transcricao_conversa_${data.chatId}_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default TranscriptDocument;
