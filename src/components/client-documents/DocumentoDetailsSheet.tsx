import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { FileText, Download, Calendar, HardDrive, Info } from 'lucide-react';
import { documentoStorageService } from '@/services/documentoStorageService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { DocumentoRepositorio } from '@/types/documentos';
import { motion, AnimatePresence } from 'framer-motion';

interface DocumentoDetailsSheetProps {
  documento: DocumentoRepositorio | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: () => void;
  isDownloading?: boolean;
}

const contentVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94],
      staggerChildren: 0.06,
      delayChildren: 0.1
    }
  },
  exit: { 
    opacity: 0, 
    x: 20,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  exit: { 
    opacity: 0, 
    y: -10,
    transition: {
      duration: 0.15
    }
  }
};

const DocumentoDetailsSheet = ({
  documento,
  open,
  onOpenChange,
  onDownload,
  isDownloading
}: DocumentoDetailsSheetProps) => {
  if (!documento) return null;

  const fileIcon = documentoStorageService.getFileIcon(documento.mime_type);

  const getFileIconStyles = () => {
    switch (fileIcon) {
      case 'pdf':
        return { bg: 'bg-red-500/10', text: 'text-red-500' };
      case 'doc':
        return { bg: 'bg-blue-500/10', text: 'text-blue-500' };
      case 'xls':
        return { bg: 'bg-green-500/10', text: 'text-green-500' };
      default:
        return { bg: 'bg-primary/10', text: 'text-primary' };
    }
  };

  const iconStyles = getFileIconStyles();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col overflow-hidden">
        <SheetHeader className="text-left">
          <SheetTitle className="sr-only">Detalhes do documento</SheetTitle>
        </SheetHeader>

        <AnimatePresence mode="wait">
          {open && (
            <motion.div
              key="content"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex-1 flex flex-col"
            >
              <div className="flex-1 space-y-6 py-4">
                {/* Header com ícone */}
                <motion.div variants={itemVariants} className="flex items-start gap-4">
                  <motion.div 
                    className={`flex items-center justify-center w-14 h-14 rounded-2xl ${iconStyles.bg} shrink-0`}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <FileText className={`w-7 h-7 ${iconStyles.text}`} />
                  </motion.div>
                  <div className="flex-1 min-w-0 pt-1">
                    <h2 className="font-semibold text-lg text-foreground leading-tight">
                      {documento.titulo}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1 truncate">
                      {documento.nome_arquivo}
                    </p>
                  </div>
                </motion.div>

                {/* Descrição */}
                {documento.descricao && (
                  <motion.p 
                    variants={itemVariants}
                    className="text-sm text-muted-foreground leading-relaxed"
                  >
                    {documento.descricao}
                  </motion.p>
                )}

                {/* Instruções */}
                {documento.instrucoes && (
                  <motion.div 
                    variants={itemVariants}
                    className="rounded-xl bg-accent/50 p-4 space-y-2"
                  >
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Info className="w-4 h-4 text-primary" />
                      Instruções
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {documento.instrucoes}
                    </p>
                  </motion.div>
                )}

                {/* Meta info */}
                <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-muted/50 p-3 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      Disponibilizado
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {format(new Date(documento.criado_em), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-3 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <HardDrive className="w-3.5 h-3.5" />
                      Tamanho
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {documento.tamanho_bytes 
                        ? documentoStorageService.formatFileSize(documento.tamanho_bytes)
                        : '-'
                      }
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Footer */}
              <motion.div 
                variants={itemVariants}
                className="pt-4 border-t"
              >
                <Button
                  className="w-full h-12 rounded-xl text-base"
                  onClick={onDownload}
                  disabled={isDownloading}
                >
                  <Download className="w-5 h-5 mr-2" />
                  Baixar Documento
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </SheetContent>
    </Sheet>
  );
};

export default DocumentoDetailsSheet;
