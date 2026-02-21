import React, { useState } from 'react';
import { List, X, Circle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';

interface InteractiveData {
  type?: 'list' | 'button';
  header?: { text?: string; type?: string } | string;
  body?: { text?: string } | string;
  footer?: { text?: string } | string;
  action?: {
    button?: string;
    buttons?: Array<{ reply?: { title?: string; id?: string }; title?: string }>;
    sections?: Array<{
      title?: string;
      rows?: Array<{ id?: string; title?: string; description?: string }>;
    }>;
  };
}

interface InteractiveMessageProps {
  data: InteractiveData;
  messageText?: string;
}

export const InteractiveMessage: React.FC<InteractiveMessageProps> = ({ data, messageText }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Extrair header
  const getHeader = (): string => {
    if (!data.header) return '';
    if (typeof data.header === 'string') return data.header;
    return data.header.text || '';
  };

  // Extrair body
  const getBody = (): string => {
    if (!data.body) return messageText || '';
    if (typeof data.body === 'string') return data.body;
    return data.body.text || messageText || '';
  };

  // Extrair footer
  const getFooter = (): string => {
    if (!data.footer) return '';
    if (typeof data.footer === 'string') return data.footer;
    return data.footer.text || '';
  };

  // Extrair opções (lista ou botões)
  const getOptions = (): Array<{ id?: string; title: string; description?: string }> => {
    if (data.type === 'list' && data.action?.sections) {
      return data.action.sections.flatMap(section =>
        (section.rows || []).map(row => ({
          id: row.id,
          title: row.title || '',
          description: row.description
        }))
      ).filter(opt => opt.title);
    }

    if (data.type === 'button' && data.action?.buttons) {
      return data.action.buttons.map(btn => ({
        id: btn.reply?.id,
        title: btn.reply?.title || btn.title || ''
      })).filter(opt => opt.title);
    }

    return [];
  };

  // Extrair seções (para listas com múltiplas seções)
  const getSections = () => {
    if (data.type === 'list' && data.action?.sections) {
      return data.action.sections;
    }
    return [];
  };

  const header = getHeader();
  const body = getBody();
  const footer = getFooter();
  const options = getOptions();
  const sections = getSections();
  const actionButton = data.action?.button;
  const isListType = data.type === 'list';

  return (
    <>
      <div className="flex flex-col max-w-[280px]">
        {/* Header */}
        {header && (
          <div className="font-semibold text-sm mb-2 text-foreground">
            {header}
          </div>
        )}

        {/* Body */}
        {body && (
          <div className="text-sm text-foreground/90 mb-3 whitespace-pre-wrap">
            {body}
          </div>
        )}

        {/* Botões (para type === 'button') - exibir inline */}
        {data.type === 'button' && options.length > 0 && (
          <div className="border-t border-border/30 pt-2 mb-2 space-y-1.5">
            {options.map((option, index) => (
              <div
                key={option.id || index}
                className="flex items-center justify-center py-2 text-sm text-primary/60 font-medium bg-muted/30 rounded cursor-not-allowed"
              >
                {option.title}
              </div>
            ))}
          </div>
        )}

        {/* Botão de ação (para listas) - clicável para abrir Dialog */}
        {isListType && actionButton && (
          <div className="border-t border-border/30 pt-2">
            <button
              onClick={() => setIsDialogOpen(true)}
              className="w-full flex items-center justify-center gap-1 text-primary text-sm font-medium py-2 hover:bg-primary/5 rounded transition-colors"
            >
              <List className="h-4 w-4" />
              <span>{actionButton}</span>
            </button>
          </div>
        )}

        {/* Footer */}
        {footer && (
          <div className="text-xs text-muted-foreground mt-2 pt-1 border-t border-border/20">
            {footer}
          </div>
        )}
      </div>

      {/* Dialog de opções no estilo WhatsApp */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="p-0 gap-0 max-w-[280px] overflow-hidden rounded-lg">
          {/* Header do Dialog - estilo WhatsApp escuro */}
          <div className="bg-[#1f2c34] px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => setIsDialogOpen(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <DialogTitle className="text-sm font-medium text-white">
              {header || actionButton || 'Ver opções'}
            </DialogTitle>
          </div>

          {/* Lista de opções - fundo branco */}
          <div className="bg-white max-h-[60vh] overflow-y-auto">
            {sections.length > 0 ? (
              // Renderizar por seções
              sections.map((section, sectionIndex) => (
                <div key={sectionIndex}>
                  {section.title && (
                    <div className="px-4 py-2 text-xs font-semibold text-emerald-600 uppercase tracking-wide bg-gray-50">
                      {section.title}
                    </div>
                  )}
                  {(section.rows || []).map((row, rowIndex) => (
                    <div
                      key={row.id || rowIndex}
                      className="px-4 py-4 border-b border-gray-100 flex items-center justify-between cursor-not-allowed"
                    >
                      <span className="text-sm text-gray-900">
                        {row.title}
                      </span>
                      <Circle className="h-5 w-5 text-gray-300" />
                    </div>
                  ))}
                </div>
              ))
            ) : (
              // Renderizar opções simples
              options.map((option, index) => (
                <div
                  key={option.id || index}
                  className="px-4 py-4 border-b border-gray-100 flex items-center justify-between cursor-not-allowed"
                >
                  <span className="text-sm text-gray-900">
                    {option.title}
                  </span>
                  <Circle className="h-5 w-5 text-gray-300" />
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
