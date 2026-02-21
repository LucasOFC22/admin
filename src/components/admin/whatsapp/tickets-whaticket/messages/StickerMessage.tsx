import React, { useState } from 'react';
import { Loader2, ImageOff } from 'lucide-react';

interface StickerMessageProps {
  url: string;
  isSaved?: boolean;
  onError?: () => void;
}

export const StickerMessage: React.FC<StickerMessageProps> = ({
  url,
  isSaved,
  onError
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const handleError = () => {
    setError(true);
    onError?.();
  };

  if (error) {
    return (
      <div className="w-[120px] h-[120px] flex items-center justify-center bg-gray-100 rounded-lg">
        <ImageOff className="h-8 w-8 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="relative inline-block">
      {/* Loading */}
      {!loaded && (
        <div className="w-[120px] h-[120px] flex items-center justify-center">
          <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
        </div>
      )}
      
      {/* Sticker - sem background para preservar transparência */}
      <img
        src={url}
        alt="Sticker"
        className={`${loaded ? 'block' : 'hidden'}`}
        style={{
          maxWidth: '150px',
          maxHeight: '150px',
          objectFit: 'contain'
        }}
        onLoad={() => setLoaded(true)}
        onError={handleError}
      />
      
      {/* Badge de salvo */}
      {isSaved && loaded && (
        <div className="absolute -top-1 -right-1 bg-green-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-medium shadow-sm">
          ✓
        </div>
      )}
    </div>
  );
};
