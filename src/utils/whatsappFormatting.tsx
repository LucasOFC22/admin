import React from 'react';

/**
 * Formata texto com formatações do WhatsApp:
 * *texto* = negrito
 * _texto_ = itálico
 * ~texto~ = tachado
 * ```texto``` = monospace
 * Preserva quebras de linha
 */

// Processa uma linha de texto para formatação WhatsApp
const formatLine = (line: string, lineIndex: number): React.ReactNode[] => {
  if (!line) return [];

  // Regex para capturar formatações do WhatsApp
  const regex = /(```[\s\S]*?```|\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~)/g;
  
  const parts = line.split(regex);
  
  return parts.map((part, partIndex) => {
    if (!part) return null;
    
    const key = `${lineIndex}-${partIndex}`;
    
    // Monospace ```texto```
    if (part.startsWith('```') && part.endsWith('```')) {
      const content = part.slice(3, -3);
      return (
        <code 
          key={key} 
          className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded font-mono text-xs"
        >
          {content}
        </code>
      );
    }
    
    // Negrito *texto*
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      const content = part.slice(1, -1);
      return <strong key={key}>{content}</strong>;
    }
    
    // Itálico _texto_
    if (part.startsWith('_') && part.endsWith('_') && part.length > 2) {
      const content = part.slice(1, -1);
      return <em key={key}>{content}</em>;
    }
    
    // Tachado ~texto~
    if (part.startsWith('~') && part.endsWith('~') && part.length > 2) {
      const content = part.slice(1, -1);
      return <del key={key}>{content}</del>;
    }
    
    return <React.Fragment key={key}>{part}</React.Fragment>;
  }).filter(Boolean);
};

export const formatWhatsAppText = (text: string): React.ReactNode[] => {
  if (!text) return [];

  // Dividir por quebras de linha e processar cada linha
  const lines = text.split('\n');
  
  return lines.flatMap((line, lineIndex) => {
    const formattedLine = formatLine(line, lineIndex);
    
    // Adicionar <br> após cada linha, exceto a última
    if (lineIndex < lines.length - 1) {
      return [...formattedLine, <br key={`br-${lineIndex}`} />];
    }
    
    return formattedLine;
  });
};

interface FormattedWhatsAppTextProps {
  text: string;
  className?: string;
}

export const FormattedWhatsAppText: React.FC<FormattedWhatsAppTextProps> = ({ 
  text, 
  className = '' 
}) => {
  return (
    <span className={`whitespace-pre-wrap ${className}`}>
      {formatWhatsAppText(text)}
    </span>
  );
};
