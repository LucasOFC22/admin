import { toast } from '@/lib/toast';

interface DownloadOptions {
  url: string;
  fileName: string;
  onStart?: () => void;
  onEnd?: () => void;
}

export const downloadPdf = async ({ url, fileName, onStart, onEnd }: DownloadOptions) => {
  try {
    onStart?.();
    
    // Ensure HTTPS to prevent mixed content errors
    const secureUrl = url.replace(/^http:\/\//i, 'https://');
    const response = await fetch(secureUrl);

    if (!response.ok) {
      throw new Error('Erro ao buscar arquivo');
    }

    // Verificar o content-type da resposta
    const contentType = response.headers.get('content-type') || '';
    
    let blob: Blob;
    
    if (contentType.includes('application/json')) {
      // A API retornou JSON com base64
      const data = await response.json();
      
      if (data.base64) {
        // Converter base64 para blob
        const byteCharacters = atob(data.base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        blob = new Blob([byteArray], { type: 'application/pdf' });
        
        // Usar filename da resposta se disponível
        if (data.filename && !fileName) {
          fileName = data.filename;
        }
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        throw new Error('Resposta inválida da API');
      }
    } else {
      // A resposta já é um blob binário
      blob = await response.blob();
    }
    
    const blobUrl = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Cleanup blob URL
    URL.revokeObjectURL(blobUrl);
    
    toast.success('Download iniciado');
  } catch (error) {
    console.error('Erro ao fazer download:', error);
    toast.error('Erro ao fazer download do arquivo');
  } finally {
    onEnd?.();
  }
};

export const downloadXml = async ({ url, fileName, onStart, onEnd }: DownloadOptions) => {
  try {
    onStart?.();
    
    const secureUrl = url.replace(/^http:\/\//i, 'https://');
    const response = await fetch(secureUrl);

    if (!response.ok) {
      throw new Error('Erro ao buscar arquivo');
    }

    const data = await response.json();
    
    if (data.data) {
      // Decodificar base64 para texto XML
      const xmlContent = decodeURIComponent(escape(atob(data.data)));
      
      // Criar blob com o conteúdo XML
      const blob = new Blob([xmlContent], { type: 'application/xml' });
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = data.fileName || fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(blobUrl);
      toast.success('Download do XML concluído');
    } else if (data.error) {
      throw new Error(data.error);
    } else {
      throw new Error('Resposta inválida da API');
    }
  } catch (error) {
    console.error('Erro ao fazer download:', error);
    toast.error('Erro ao fazer download do XML');
  } finally {
    onEnd?.();
  }
};

export const downloadFromApi = async (
  apiUrl: string, 
  fileName: string,
  options?: { method?: string; onStart?: () => void; onEnd?: () => void }
) => {
  try {
    options?.onStart?.();
    
    const response = await fetch(apiUrl, {
      method: options?.method || 'GET'
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar arquivo');
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(blobUrl);
    
    toast.success('Download iniciado');
  } catch (error) {
    console.error('Erro ao fazer download:', error);
    toast.error('Erro ao fazer download do arquivo');
  } finally {
    options?.onEnd?.();
  }
};
