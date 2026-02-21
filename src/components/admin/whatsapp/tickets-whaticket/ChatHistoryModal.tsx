import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  History,
  FileText,
  StickyNote,
  Calendar,
  MessageSquare,
  Loader2,
  Download,
  Eye,
  ChevronDown,
  FileType,
  File,
} from 'lucide-react';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { toast } from '@/lib/toast';
import { 
  fetchChatMessagesForTranscript, 
  downloadTxtTranscript 
} from '@/services/whatsapp/transcriptService';
import { downloadPdfTranscript } from './TranscriptPDF';

interface ChatHistoryModalProps {
  open: boolean;
  onClose: () => void;
  chatId: number;
  startDate: string;
  messageCount: number;
  onViewNotes?: () => void;
}

export const ChatHistoryModal: React.FC<ChatHistoryModalProps> = ({
  open,
  onClose,
  chatId,
  startDate,
  messageCount,
  onViewNotes,
}) => {
  const [notesCount, setNotesCount] = useState<number | null>(null);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [isGenerating, setIsGenerating] = useState<'txt' | 'pdf' | null>(null);
  
  const { hasPermission } = usePermissionGuard();
  const canViewHistoryNotes = hasPermission('admin.whatsapp.notas.ver_historico_contato');

  // Fetch notes count when modal opens
  useEffect(() => {
    if (open && canViewHistoryNotes) {
      fetchNotesCount();
    }
  }, [open, chatId, canViewHistoryNotes]);

  const fetchNotesCount = async () => {
    setIsLoadingNotes(true);
    try {
      const supabase = requireAuthenticatedClient();
      const { count, error } = await supabase
        .from('notas_whatsapp')
        .select('*', { count: 'exact', head: true })
        .eq('chat_id', chatId)
        .is('nota_pai_id', null);

      if (!error) {
        setNotesCount(count || 0);
      }
    } catch (err) {
      console.error('Erro ao buscar contagem de notas:', err);
    } finally {
      setIsLoadingNotes(false);
    }
  };

  const handleGenerateTranscript = async (format: 'txt' | 'pdf') => {
    setIsGenerating(format);
    try {
      const data = await fetchChatMessagesForTranscript(chatId);
      
      if (!data) {
        toast.error('Erro ao buscar mensagens para transcrição');
        return;
      }

      if (data.messages.length === 0) {
        toast.warning('Nenhuma mensagem encontrada nesta conversa');
        return;
      }

      if (format === 'txt') {
        downloadTxtTranscript(data);
        toast.success('Transcrição TXT gerada com sucesso!');
      } else {
        await downloadPdfTranscript(data);
        toast.success('Transcrição PDF gerada com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao gerar transcrição:', error);
      toast.error('Erro ao gerar transcrição');
    } finally {
      setIsGenerating(null);
    }
  };

  const formattedDate = format(new Date(startDate), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-muted">
              <History className="h-5 w-5 text-muted-foreground" />
            </div>
            <span>Conversa #{chatId}</span>
            <Badge variant="secondary" className="ml-auto">
              Histórico
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-muted/50 rounded-lg p-4 space-y-3"
          >
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Iniciada em</span>
              <span className="font-medium">{formattedDate}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Total de mensagens</span>
              <span className="font-medium">{messageCount}</span>
            </div>
            {canViewHistoryNotes && (
              <div className="flex items-center gap-3 text-sm">
                <StickyNote className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Notas internas</span>
                {isLoadingNotes ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <span className="font-medium">{notesCount ?? 0}</span>
                )}
              </div>
            )}
          </motion.div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {/* Dropdown para escolher formato */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  disabled={isGenerating !== null}
                  className="w-full justify-between gap-2"
                  variant="outline"
                >
                  <div className="flex items-center gap-2">
                    {isGenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    <span>
                      {isGenerating === 'txt' 
                        ? 'Gerando TXT...' 
                        : isGenerating === 'pdf' 
                          ? 'Gerando PDF...' 
                          : 'Gerar Transcrição'}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)] z-[10010]">
                <DropdownMenuItem 
                  onClick={() => handleGenerateTranscript('txt')}
                  disabled={isGenerating !== null}
                >
                  {isGenerating === 'txt' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileType className="h-4 w-4 mr-2" />
                  )}
                  <div className="flex flex-col">
                    <span>{isGenerating === 'txt' ? 'Gerando...' : 'Arquivo TXT'}</span>
                    <span className="text-xs text-muted-foreground">Texto simples, leve</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleGenerateTranscript('pdf')}
                  disabled={isGenerating !== null}
                >
                  {isGenerating === 'pdf' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <File className="h-4 w-4 mr-2 text-red-500" />
                  )}
                  <div className="flex flex-col">
                    <span>{isGenerating === 'pdf' ? 'Gerando...' : 'Arquivo PDF'}</span>
                    <span className="text-xs text-muted-foreground">Formatado, profissional</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {canViewHistoryNotes && (
              <Button
                onClick={() => {
                  onViewNotes?.();
                  onClose();
                }}
                disabled={notesCount === 0 || isLoadingNotes}
                className="w-full justify-start gap-2"
                variant="outline"
              >
                <Eye className="h-4 w-4" />
                <span>Ver Notas Internas</span>
                {notesCount !== null && notesCount > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {notesCount}
                  </Badge>
                )}
                {(notesCount === 0 || notesCount === null) && !isLoadingNotes && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    Sem notas
                  </span>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
