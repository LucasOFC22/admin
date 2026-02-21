import React from 'react';
import { Image, Film, Music, FileText, Loader2, Download } from 'lucide-react';

type MediaType = 'image' | 'video' | 'audio' | 'document' | 'sticker';

interface MediaPlaceholderProps {
  type: MediaType;
  fileName?: string;
  isLoading?: boolean;
  onClick: () => void;
}

const getIconAndLabel = (type: MediaType) => {
  switch (type) {
    case 'image':
      return { Icon: Image, label: 'Clique para carregar imagem' };
    case 'video':
      return { Icon: Film, label: 'Clique para carregar vídeo' };
    case 'audio':
      return { Icon: Music, label: 'Clique para carregar áudio' };
    case 'document':
      return { Icon: FileText, label: 'Clique para baixar' };
    case 'sticker':
      return { Icon: Image, label: 'Carregar sticker' };
    default:
      return { Icon: FileText, label: 'Carregar mídia' };
  }
};

export const MediaPlaceholder: React.FC<MediaPlaceholderProps> = ({
  type,
  fileName,
  isLoading,
  onClick
}) => {
  const { Icon, label } = getIconAndLabel(type);
  
  // Layout mais compacto para áudio
  if (type === 'audio') {
    return (
      <div 
        className="bg-gray-100/80 rounded-lg p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-200/80 transition-colors max-w-[280px]"
        onClick={onClick}
      >
        {isLoading ? (
          <Loader2 className="h-8 w-8 text-gray-500 animate-spin" />
        ) : (
          <div className="h-10 w-10 rounded-full bg-[#25d366] flex items-center justify-center">
            <Icon className="h-5 w-5 text-white" />
          </div>
        )}
        <div className="flex-1">
          <span className="text-sm text-gray-600">
            {isLoading ? 'Carregando áudio...' : label}
          </span>
        </div>
      </div>
    );
  }
  
  // Layout para documento
  if (type === 'document') {
    return (
      <div 
        className="bg-gray-100/80 border border-gray-200 rounded-lg p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-200/80 transition-colors min-w-[200px] max-w-[300px]"
        onClick={onClick}
      >
        {isLoading ? (
          <Loader2 className="h-8 w-8 text-gray-500 animate-spin" />
        ) : (
          <Icon className="h-8 w-8 text-gray-500" />
        )}
        <div className="flex-1 min-w-0">
          <span className="text-sm text-gray-700 block truncate">{fileName || 'Documento'}</span>
          <span className="text-xs text-gray-500">
            {isLoading ? 'Baixando...' : label}
          </span>
        </div>
        {!isLoading && <Download className="h-5 w-5 text-gray-400" />}
      </div>
    );
  }
  
  // Layout para sticker (compacto)
  if (type === 'sticker') {
    return (
      <div 
        className="bg-gray-100/80 rounded-lg p-3 flex items-center justify-center cursor-pointer hover:bg-gray-200/80 transition-colors"
        style={{ width: '120px', height: '120px' }}
        onClick={onClick}
      >
        {isLoading ? (
          <Loader2 className="h-6 w-6 text-gray-500 animate-spin" />
        ) : (
          <Icon className="h-8 w-8 text-gray-400" />
        )}
      </div>
    );
  }
  
  // Layout padrão para imagem/vídeo (card maior)
  return (
    <div 
      className="bg-gray-200/80 rounded-lg p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-300/80 transition-colors"
      style={{ minWidth: '200px', minHeight: '120px' }}
      onClick={onClick}
    >
      {isLoading ? (
        <Loader2 className="h-10 w-10 text-gray-500 animate-spin" />
      ) : (
        <>
          <Icon className="h-10 w-10 text-gray-500" />
          <span className="text-sm text-gray-600">{label}</span>
        </>
      )}
      {isLoading && <span className="text-sm text-gray-600">Carregando...</span>}
    </div>
  );
};
