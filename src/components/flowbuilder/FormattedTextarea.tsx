import React, { useRef, useEffect, useCallback, useState } from 'react';
import { cn } from '@/lib/utils';
import { Bold, Italic, Underline } from 'lucide-react';

interface FormattedTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  id?: string;
}

// Função para converter texto com marcadores WhatsApp para HTML (para exibição)
const formatToHtml = (text: string): string => {
  if (!text) return '';
  
  let html = text
    // Escape HTML primeiro
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Converter marcadores para HTML mas manter os marcadores visíveis
    .replace(/\*([^*]+)\*/g, '<strong>*$1*</strong>')
    .replace(/_([^_]+)_/g, '<em>_$1_</em>')
    .replace(/~([^~]+)~/g, '<u>~$1~</u>')
    // Preservar quebras de linha
    .replace(/\n/g, '<br>');
  
  return html;
};

// Função para extrair texto puro do HTML preservando os marcadores e quebras de linha
const htmlToText = (html: string): string => {
  if (!html) return '';
  
  // Substituir <br>, <br/>, <br /> por marcador temporário
  let processed = html.replace(/<br\s*\/?>/gi, '\n');
  
  // Substituir </div><div> por quebra de linha (contentEditable cria divs)
  processed = processed.replace(/<\/div>\s*<div>/gi, '\n');
  
  // Substituir <div> inicial e </div> final
  processed = processed.replace(/<\/?div>/gi, '');
  
  // Criar elemento para extrair texto
  const div = document.createElement('div');
  div.innerHTML = processed;
  
  // Extrair texto preservando as quebras
  let text = div.textContent || '';
  
  return text;
};

interface FloatingMenuProps {
  position: { top: number; left: number };
  onFormat: (type: 'bold' | 'italic' | 'underline') => void;
}

const FloatingMenu: React.FC<FloatingMenuProps> = ({ position, onFormat }) => {
  return (
    <div 
      className="absolute z-50 bg-popover border border-border rounded-lg shadow-lg p-1 flex gap-1"
      style={{ top: position.top, left: position.left }}
    >
      <button
        type="button"
        className="p-1.5 hover:bg-accent rounded transition-colors"
        onClick={() => onFormat('bold')}
        title="Negrito (*texto*)"
      >
        <Bold className="h-4 w-4" />
      </button>
      <button
        type="button"
        className="p-1.5 hover:bg-accent rounded transition-colors"
        onClick={() => onFormat('italic')}
        title="Itálico (_texto_)"
      >
        <Italic className="h-4 w-4" />
      </button>
      <button
        type="button"
        className="p-1.5 hover:bg-accent rounded transition-colors"
        onClick={() => onFormat('underline')}
        title="Sublinhado (~texto~)"
      >
        <Underline className="h-4 w-4" />
      </button>
    </div>
  );
};

export const FormattedTextarea: React.FC<FormattedTextareaProps> = ({
  value,
  onChange,
  placeholder = '',
  className,
  rows = 7,
  id
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isComposing = useRef(false);
  const lastValue = useRef(value);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const selectionRef = useRef<{ start: number; end: number; text: string } | null>(null);

  // Atualizar o conteúdo quando o value externo mudar
  useEffect(() => {
    if (editorRef.current && value !== lastValue.current) {
      editorRef.current.innerHTML = formatToHtml(value);
      lastValue.current = value;
    }
  }, [value]);

  // Inicializar com valor
  useEffect(() => {
    if (editorRef.current && value) {
      editorRef.current.innerHTML = formatToHtml(value);
      lastValue.current = value;
    }
  }, []);

  const handleInput = useCallback(() => {
    if (isComposing.current) return;
    
    const editor = editorRef.current;
    if (!editor) return;

    // Extrair texto puro preservando os marcadores
    const newValue = htmlToText(editor.innerHTML);
    lastValue.current = newValue;
    onChange(newValue);
  }, [onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Permitir Enter para nova linha
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      document.execCommand('insertLineBreak');
      handleInput();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    handleInput();
  };

  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !editorRef.current) {
      setShowMenu(false);
      return;
    }

    // Verificar se a seleção está dentro do editor
    const range = selection.getRangeAt(0);
    if (!editorRef.current.contains(range.commonAncestorContainer)) {
      setShowMenu(false);
      return;
    }

    const selectedText = selection.toString();
    if (selectedText.length === 0) {
      setShowMenu(false);
      return;
    }

    // Salvar a seleção como offset de texto
    const fullText = htmlToText(editorRef.current.innerHTML);
    const beforeRange = document.createRange();
    beforeRange.setStart(editorRef.current, 0);
    beforeRange.setEnd(range.startContainer, range.startOffset);
    const beforeText = beforeRange.cloneContents();
    const tempDiv = document.createElement('div');
    tempDiv.appendChild(beforeText);
    const startOffset = htmlToText(tempDiv.innerHTML).length;
    
    selectionRef.current = {
      start: startOffset,
      end: startOffset + selectedText.length,
      text: selectedText
    };

    // Posicionar o menu acima da seleção - usando posição relativa ao container
    const rect = range.getBoundingClientRect();
    const editorRect = editorRef.current.getBoundingClientRect();
    
    // Calcular posição relativa ao editor
    const relativeTop = rect.top - editorRect.top - 45;
    const relativeLeft = rect.left - editorRect.left + (rect.width / 2) - 60;
    
    setMenuPosition({
      top: relativeTop,
      left: Math.max(0, relativeLeft) // Garantir que não saia pela esquerda
    });
    setShowMenu(true);
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [handleSelectionChange]);

  const applyFormat = useCallback((type: 'bold' | 'italic' | 'underline') => {
    if (!selectionRef.current || !editorRef.current) return;

    const { start, end, text } = selectionRef.current;
    const currentText = lastValue.current;
    
    const markers: Record<string, string> = {
      bold: '*',
      italic: '_',
      underline: '~'
    };
    
    const marker = markers[type];
    
    // Verificar se já tem o marcador
    const beforeSelection = currentText.slice(0, start);
    const afterSelection = currentText.slice(end);
    const selectedText = currentText.slice(start, end);
    
    let newText: string;
    
    // Verificar se o texto selecionado já está formatado
    if (selectedText.startsWith(marker) && selectedText.endsWith(marker)) {
      // Remover formatação
      newText = beforeSelection + selectedText.slice(1, -1) + afterSelection;
    } else {
      // Adicionar formatação
      newText = beforeSelection + marker + selectedText + marker + afterSelection;
    }
    
    onChange(newText);
    lastValue.current = newText;
    
    if (editorRef.current) {
      editorRef.current.innerHTML = formatToHtml(newText);
    }
    
    setShowMenu(false);
    selectionRef.current = null;
  }, [onChange]);

  const handleBlur = useCallback(() => {
    // Delay para permitir clique no menu
    setTimeout(() => {
      setShowMenu(false);
    }, 200);
  }, []);

  const minHeight = rows * 24;
  const maxHeight = Math.max(rows * 24, 300); // Max height for scrolling

  return (
    <div className="relative">
      {showMenu && (
        <FloatingMenu position={menuPosition} onFormat={applyFormat} />
      )}
      <div
        ref={editorRef}
        id={id}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onBlur={handleBlur}
        onCompositionStart={() => { isComposing.current = true; }}
        onCompositionEnd={() => { isComposing.current = false; handleInput(); }}
        className={cn(
          "w-full rounded-md border border-input bg-background px-3 py-2",
          "text-sm ring-offset-background",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "overflow-y-auto whitespace-pre-wrap",
          "[&_strong]:font-bold [&_em]:italic [&_u]:underline",
          "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground",
          className
        )}
        style={{ minHeight: `${minHeight}px`, maxHeight: `${maxHeight}px` }}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />
    </div>
  );
};
