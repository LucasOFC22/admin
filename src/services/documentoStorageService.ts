import { requireAuthenticatedClient } from '@/config/supabaseAuth';

const BUCKET_NAME = 'documentos-clientes';

export interface UploadResult {
  success: boolean;
  path?: string;
  error?: string;
}

export interface SignedUrlResult {
  success: boolean;
  url?: string;
  error?: string;
}

export const documentoStorageService = {
  async uploadDocumento(
    file: File,
    documentoId: string
  ): Promise<UploadResult> {
    try {
      const supabase = requireAuthenticatedClient();
      const fileName = `${Date.now()}_${file.name}`;
      const storagePath = `${documentoId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Erro no upload:', error);
        return { success: false, error: error.message };
      }

      return { success: true, path: data.path };
    } catch (error: any) {
      console.error('Erro no upload:', error);
      return { success: false, error: error.message };
    }
  },

  async getSignedUrl(
    storagePath: string,
    expiresIn: number = 3600
  ): Promise<SignedUrlResult> {
    try {
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(storagePath, expiresIn);

      if (error) {
        console.error('Erro ao gerar URL assinada:', error);
        return { success: false, error: error.message };
      }

      return { success: true, url: data.signedUrl };
    } catch (error: any) {
      console.error('Erro ao gerar URL assinada:', error);
      return { success: false, error: error.message };
    }
  },

  async deleteDocumento(storagePath: string): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = requireAuthenticatedClient();
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([storagePath]);

      if (error) {
        console.error('Erro ao deletar arquivo:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Erro ao deletar arquivo:', error);
      return { success: false, error: error.message };
    }
  },

  async deleteAllVersions(documentoId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = requireAuthenticatedClient();
      const { data: files, error: listError } = await supabase.storage
        .from(BUCKET_NAME)
        .list(documentoId, { limit: 1000 });

      if (listError) {
        console.error('Erro ao listar arquivos:', listError);
        return { success: false, error: listError.message };
      }

      if (!files || files.length === 0) {
        return { success: true };
      }

      const pathsToDelete = files.map(f => `${documentoId}/${f.name}`);

      if (pathsToDelete.length > 0) {
        const { error: deleteError } = await supabase.storage
          .from(BUCKET_NAME)
          .remove(pathsToDelete);

        if (deleteError) {
          console.error('Erro ao deletar arquivos:', deleteError);
          return { success: false, error: deleteError.message };
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error('Erro ao deletar todas as versões:', error);
      return { success: false, error: error.message };
    }
  },

  getMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg'
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
  },

  formatFileSize(bytes: number | null): string {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  },

  getFileIcon(mimeType: string | null): 'pdf' | 'doc' | 'xls' | 'image' | 'file' {
    if (!mimeType) return 'file';
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'doc';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'xls';
    if (mimeType.includes('image')) return 'image';
    return 'file';
  }
};
