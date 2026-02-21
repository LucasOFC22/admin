import { Eye } from 'lucide-react';
import { replaceMessageVariables, getExampleContext, MessageVariablesContext } from '@/utils/messageVariables';
import { useMemo } from 'react';

interface MessagePreviewProps {
  message: string;
  className?: string;
}

export const MessagePreview = ({ message, className }: MessagePreviewProps) => {
  const exampleContext = useMemo(() => getExampleContext(), []);
  
  const previewText = useMemo(() => {
    if (!message) return '';
    return replaceMessageVariables(message, exampleContext);
  }, [message, exampleContext]);

  if (!message?.trim()) return null;

  return (
    <div className={`bg-muted/30 rounded-lg p-3 border ${className || ''}`}>
      <div className="flex items-center gap-2 mb-2">
        <Eye className="h-4 w-4 text-muted-foreground" />
        <p className="text-xs text-muted-foreground font-medium">Prévia</p>
      </div>
      <p className="text-sm whitespace-pre-wrap text-foreground">
        {previewText}
      </p>
    </div>
  );
};
