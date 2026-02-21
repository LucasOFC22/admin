import React, { useState, useEffect, useRef } from "react";
import { Reply, Forward, Loader2, ShieldCheck } from "lucide-react";
import { i18n } from "@/translate/i18n";
import { requireAuthenticatedClient } from "@/config/supabaseAuth";
import { toast } from '@/lib/toast';

interface MessageOptionsMenuProps {
  message: any;
  menuPosition: { x: number; y: number } | null;
  open: boolean;
  onClose: () => void;
  onReply: () => void;
  onForward?: () => void;
  canSaveMedia?: boolean;
  isMediaPermanent?: boolean;
  onMarkPermanent?: () => void;
}

export const MessageOptionsMenu: React.FC<MessageOptionsMenuProps> = ({
  message,
  menuPosition,
  open,
  onClose,
  onReply,
  onForward,
  canSaveMedia = false,
  isMediaPermanent = false,
  onMarkPermanent,
}) => {
  const [isMarkingPermanent, setIsMarkingPermanent] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fechar menu ao clicar fora
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, onClose]);

  const handleMarkPermanent = async () => {
    if (isMediaPermanent) return;

    setIsMarkingPermanent(true);
    try {
      const rawData = message.rawData || {};
      const messageId = rawData.message_id || message.id;

      console.log('[MarkPermanent] Marcando como permanente:', messageId);

      const supabase = requireAuthenticatedClient();
      const { error } = await supabase
        .from('mensagens_whatsapp')
        .update({ 
          media_permanent: true,
          media_expires_at: null 
        })
        .eq('message_id', messageId);

      if (error) {
        console.error('[MarkPermanent] Erro:', error);
        toast.error('Erro ao salvar permanente', {
          description: error.message
        });
        return;
      }

      toast.success('Mídia salva permanentemente', {
        description: 'Este arquivo não será mais excluído automaticamente'
      });

      if (onMarkPermanent) {
        onMarkPermanent();
      }

      window.location.reload();
    } catch (err) {
      console.error('[MarkPermanent] Erro:', err);
      toast.error('Erro ao salvar permanente');
    } finally {
      setIsMarkingPermanent(false);
      onClose();
    }
  };

  if (!open || !menuPosition) return null;

  // Calcular posição para não sair da tela
  const menuWidth = 200;
  const menuHeight = 200;
  const padding = 10;
  
  let x = menuPosition.x;
  let y = menuPosition.y;
  
  // Ajustar se sair pela direita
  if (x + menuWidth > window.innerWidth - padding) {
    x = window.innerWidth - menuWidth - padding;
  }
  
  // Ajustar se sair por baixo
  if (y + menuHeight > window.innerHeight - padding) {
    y = y - menuHeight;
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[180px]"
      style={{
        left: x,
        top: y,
      }}
    >
      {/* Responder */}
      <button
        onClick={onReply}
        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <Reply className="h-4 w-4" />
        {i18n.t("messageOptionsMenu.reply")}
      </button>

      {/* Encaminhar */}
      {onForward && (
        <button
          onClick={onForward}
          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <Forward className="h-4 w-4" />
          {i18n.t("messageOptionsMenu.forward")}
        </button>
      )}

      {/* Salvar permanente */}
      {canSaveMedia && (
        <>
          <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
          <button
            onClick={handleMarkPermanent}
            disabled={isMarkingPermanent || isMediaPermanent}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {isMarkingPermanent ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isMediaPermanent ? (
              <ShieldCheck className="h-4 w-4 text-green-500" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            {isMediaPermanent ? 'Permanente ✓' : 'Salvar Permanente'}
          </button>
        </>
      )}
    </div>
  );
};