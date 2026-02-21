/**
 * Utilitários para manipulação de arquivos
 */

export interface AttachmentData {
  nome: string;
  tipo: string;
  conteudo: string; // base64
  tamanho: number;
}

/**
 * Converte um File para o formato base64 esperado pela edge function
 */
export async function fileToBase64(file: File): Promise<AttachmentData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      const result = reader.result as string;
      // Remover prefixo data:...;base64,
      const base64 = result.includes(',') 
        ? result.split(',')[1] 
        : result;
      
      resolve({
        nome: file.name,
        tipo: file.type || 'application/octet-stream',
        conteudo: base64,
        tamanho: file.size
      });
    };
    
    reader.onerror = () => {
      reject(new Error(`Erro ao ler arquivo: ${file.name}`));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Converte múltiplos Files para base64
 * Reporta progresso através de callback opcional
 */
export async function filesToBase64(
  files: File[], 
  onProgress?: (current: number, total: number) => void
): Promise<AttachmentData[]> {
  const results: AttachmentData[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress?.(i + 1, files.length);
    
    const converted = await fileToBase64(file);
    results.push(converted);
  }
  
  return results;
}

/**
 * Valida tamanho máximo de arquivo
 */
export function validateFileSize(file: File, maxSizeMB: number = 25): boolean {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxBytes;
}

/**
 * Formata tamanho de arquivo para exibição
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Calcula tamanho total de arquivos
 */
export function getTotalSize(files: File[]): number {
  return files.reduce((total, file) => total + file.size, 0);
}

/**
 * Verifica se arquivo é uma imagem
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Lista de tipos MIME permitidos (opcional, para validação)
 */
export const ALLOWED_ATTACHMENT_TYPES = [
  'image/*',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'application/x-rar-compressed',
  'text/plain',
  'text/csv',
];
