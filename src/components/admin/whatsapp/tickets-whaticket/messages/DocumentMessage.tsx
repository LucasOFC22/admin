import React from 'react';
import { 
  FileText, 
  FileSpreadsheet, 
  File,
  Download,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface DocumentMessageProps {
  url?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  caption?: string;
  isSaved?: boolean;
  onDownload?: () => void;
  isLoading?: boolean;
  hasFailed?: boolean;
  onRetry?: () => void;
  isFromMe?: boolean;
}

// Ícone baseado no tipo de arquivo
const getFileIcon = (mimeType?: string, fileName?: string): { icon: React.ReactNode; bgColor: string; label: string } => {
  const ext = fileName?.split('.').pop()?.toLowerCase();
  
  // Por extensão
  if (ext) {
    if (['pdf'].includes(ext)) {
      return { icon: <FileText className="h-8 w-8 text-white" />, bgColor: 'bg-red-500', label: 'PDF' };
    }
    if (['doc', 'docx', 'txt', 'rtf', 'odt'].includes(ext)) {
      return { icon: <FileText className="h-8 w-8 text-white" />, bgColor: 'bg-blue-500', label: ext.toUpperCase() };
    }
    if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) {
      return { icon: <FileSpreadsheet className="h-8 w-8 text-white" />, bgColor: 'bg-green-600', label: ext.toUpperCase() };
    }
    if (['ppt', 'pptx', 'odp'].includes(ext)) {
      return { icon: <FileText className="h-8 w-8 text-white" />, bgColor: 'bg-orange-500', label: ext.toUpperCase() };
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return { icon: <File className="h-8 w-8 text-white" />, bgColor: 'bg-yellow-600', label: ext.toUpperCase() };
    }
  }
  
  // Por MIME type
  if (mimeType) {
    if (mimeType.includes('pdf')) return { icon: <FileText className="h-8 w-8 text-white" />, bgColor: 'bg-red-500', label: 'PDF' };
    if (mimeType.includes('word') || mimeType.includes('document')) return { icon: <FileText className="h-8 w-8 text-white" />, bgColor: 'bg-blue-500', label: 'DOC' };
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return { icon: <FileSpreadsheet className="h-8 w-8 text-white" />, bgColor: 'bg-green-600', label: 'XLS' };
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return { icon: <FileText className="h-8 w-8 text-white" />, bgColor: 'bg-orange-500', label: 'PPT' };
  }
  
  return { icon: <File className="h-8 w-8 text-white" />, bgColor: 'bg-gray-500', label: 'FILE' };
};

// Formatar tamanho do arquivo
const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '';
  
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

// Truncar nome do arquivo
const truncateFileName = (name: string, maxLength: number = 25): string => {
  if (name.length <= maxLength) return name;
  const ext = name.split('.').pop() || '';
  const nameWithoutExt = name.slice(0, name.lastIndexOf('.'));
  const truncatedName = nameWithoutExt.slice(0, maxLength - ext.length - 4) + '...';
  return `${truncatedName}.${ext}`;
};

export const DocumentMessage: React.FC<DocumentMessageProps> = ({
  url,
  fileName,
  fileSize,
  mimeType,
  caption,
  isSaved,
  onDownload,
  isLoading,
  hasFailed,
  onRetry,
  isFromMe = false
}) => {
  const displayName = fileName || 'Documento';
  const sizeText = formatFileSize(fileSize);
  const { icon, bgColor, label } = getFileIcon(mimeType, fileName);

  if (hasFailed) {
    return (
      <div 
        className="flex items-center gap-3 p-3 rounded-lg cursor-pointer min-w-[240px] max-w-[300px]"
        onClick={onRetry}
      >
        <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-amber-500/20 flex items-center justify-center">
          <AlertCircle className="h-6 w-6 text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate opacity-90">{truncateFileName(displayName)}</p>
          <p className="text-xs opacity-60">Toque para tentar novamente</p>
        </div>
        {isLoading && <Loader2 className="h-5 w-5 animate-spin opacity-60" />}
      </div>
    );
  }

  return (
    <div className="max-w-[300px]">
      <div 
        className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-opacity hover:opacity-90 min-w-[240px]"
        style={{ 
          backgroundColor: isFromMe ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.03)'
        }}
        onClick={onDownload}
      >
        {/* Ícone do arquivo com cor */}
        <div className={`flex-shrink-0 w-11 h-11 rounded-lg ${bgColor} flex items-center justify-center`}>
          {isLoading ? (
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          ) : (
            icon
          )}
        </div>
        
        {/* Info do arquivo */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate leading-tight">{truncateFileName(displayName)}</p>
          <p className="text-xs opacity-60 mt-0.5">
            {label}{sizeText && ` • ${sizeText}`}
          </p>
        </div>

        {/* Ícone de download discreto */}
        {!isLoading && (
          <Download className="h-5 w-5 opacity-40 flex-shrink-0" />
        )}
      </div>
      
      {/* Caption */}
      {caption && (
        <p className="text-sm mt-1.5 break-words leading-relaxed">{caption}</p>
      )}
    </div>
  );
};
