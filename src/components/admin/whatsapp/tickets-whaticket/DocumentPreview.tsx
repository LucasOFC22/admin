import React from 'react';
import { FileText, FileSpreadsheet, FileImage, File, Download } from 'lucide-react';

interface DocumentPreviewProps {
  url: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}

const formatFileSize = (bytes?: number): string => {
  if (!bytes || bytes === 0) return '';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const getFileIcon = (mimeType?: string, fileName?: string) => {
  const ext = fileName?.split('.').pop()?.toLowerCase();
  
  // Por extensão
  if (ext === 'pdf') return { icon: FileText, color: '#E53935' };
  if (['doc', 'docx'].includes(ext || '')) return { icon: FileText, color: '#2196F3' };
  if (['xls', 'xlsx', 'csv'].includes(ext || '')) return { icon: FileSpreadsheet, color: '#4CAF50' };
  if (['ppt', 'pptx'].includes(ext || '')) return { icon: FileText, color: '#FF9800' };
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return { icon: FileImage, color: '#9C27B0' };
  
  // Por mime type
  if (mimeType?.includes('pdf')) return { icon: FileText, color: '#E53935' };
  if (mimeType?.includes('word') || mimeType?.includes('document')) return { icon: FileText, color: '#2196F3' };
  if (mimeType?.includes('sheet') || mimeType?.includes('excel')) return { icon: FileSpreadsheet, color: '#4CAF50' };
  if (mimeType?.includes('presentation') || mimeType?.includes('powerpoint')) return { icon: FileText, color: '#FF9800' };
  if (mimeType?.includes('image')) return { icon: FileImage, color: '#9C27B0' };
  
  return { icon: File, color: '#607D8B' };
};

const getFileTypeLabel = (mimeType?: string, fileName?: string): string => {
  const ext = fileName?.split('.').pop()?.toUpperCase();
  if (ext) return ext;
  
  if (mimeType?.includes('pdf')) return 'PDF';
  if (mimeType?.includes('word')) return 'DOCX';
  if (mimeType?.includes('sheet') || mimeType?.includes('excel')) return 'XLSX';
  if (mimeType?.includes('presentation')) return 'PPTX';
  
  return 'Documento';
};

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  url,
  fileName,
  fileSize,
  mimeType
}) => {
  const { icon: IconComponent, color } = getFileIcon(mimeType, fileName);
  const fileTypeLabel = getFileTypeLabel(mimeType, fileName);
  const displayName = fileName || 'Documento';
  const sizeText = formatFileSize(fileSize);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 bg-[#f5f6f6] rounded-lg hover:bg-[#e9eaea] transition-colors min-w-[240px] max-w-[320px] no-underline"
    >
      <div 
        className="flex-shrink-0 w-11 h-11 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: color }}
      >
        <IconComponent className="h-6 w-6 text-white" />
      </div>
      
      <div className="flex-1 min-w-0 overflow-hidden">
        <p className="text-sm font-medium text-gray-800 truncate" title={displayName}>
          {displayName}
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{fileTypeLabel}</span>
          {sizeText && (
            <>
              <span>•</span>
              <span>{sizeText}</span>
            </>
          )}
        </div>
      </div>
      
      <Download className="h-5 w-5 text-gray-400 flex-shrink-0" />
    </a>
  );
};