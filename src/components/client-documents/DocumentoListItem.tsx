import { forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Download, ChevronRight } from 'lucide-react';
import { documentoStorageService } from '@/services/documentoStorageService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { DocumentoRepositorio } from '@/types/documentos';

interface DocumentoListItemProps {
  documento: DocumentoRepositorio;
  onDownload: () => void;
  onViewDetails: () => void;
  isDownloading?: boolean;
}

const DocumentoListItem = forwardRef<HTMLDivElement, DocumentoListItemProps>(
  ({ documento, onDownload, onViewDetails, isDownloading }, ref) => {
    const fileIcon = documentoStorageService.getFileIcon(documento.mime_type);

    const getFileIconStyles = () => {
      switch (fileIcon) {
        case 'pdf':
          return { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/20' };
        case 'doc':
          return { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20' };
        case 'xls':
          return { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/20' };
        default:
          return { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' };
      }
    };

    const iconStyles = getFileIconStyles();

    return (
      <div 
        ref={ref}
        className="group flex items-center gap-4 p-4 rounded-2xl bg-background border border-border/20 hover:border-border/50 hover:shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] active:scale-[0.995] transition-all duration-300 cursor-pointer"
        onClick={onViewDetails}
      >
        {/* Icon */}
        <div className={`flex items-center justify-center w-11 h-11 rounded-xl ${iconStyles.bg} shrink-0 transition-all duration-300 group-hover:scale-[1.03]`}>
          <FileText className={`w-[18px] h-[18px] ${iconStyles.text}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground/90 truncate text-sm">
            {documento.titulo}
          </h3>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground/70">
            <span>
              {format(new Date(documento.atualizado_em || documento.criado_em), "dd MMM yyyy", { locale: ptBR })}
            </span>
            {documento.tamanho_bytes && (
              <>
                <span className="text-muted-foreground/30">·</span>
                <span>{documentoStorageService.formatFileSize(documento.tamanho_bytes)}</span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-primary/8 hover:text-primary transition-all duration-200"
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            disabled={isDownloading}
          >
            <Download className="w-4 h-4" />
          </Button>
          <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 group-hover:translate-x-0.5 transition-all duration-300" />
        </div>
      </div>
    );
  }
);

DocumentoListItem.displayName = 'DocumentoListItem';

export default DocumentoListItem;
