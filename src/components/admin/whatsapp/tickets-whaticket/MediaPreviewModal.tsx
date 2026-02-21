import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Smile, Plus, FileText, Film, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { cn } from '@/lib/utils';

interface MediaPreviewModalProps {
  files: File[];
  onClose: () => void;
  onSend: (files: File[], caption: string) => void;
  onAddMoreFiles: () => void;
  isLoading?: boolean;
}

export const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({
  files,
  onClose,
  onSend,
  onAddMoreFiles,
  isLoading = false,
}) => {
  const [caption, setCaption] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentFile = files[selectedIndex];

  // Generate previews for files
  useEffect(() => {
    const generatePreviews = async () => {
      const urls: string[] = [];
      for (const file of files) {
        if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
          urls.push(URL.createObjectURL(file));
        } else {
          urls.push('');
        }
      }
      setPreviews(urls);
    };

    generatePreviews();

    return () => {
      previews.forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [files]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setCaption(prev => prev + emojiData.emoji);
    inputRef.current?.focus();
  };

  const handleSend = () => {
    if (!isLoading) {
      onSend(files, caption);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('video/')) return <Film className="h-16 w-16 text-muted-foreground" />;
    if (file.type.startsWith('audio/')) return <Music className="h-16 w-16 text-muted-foreground" />;
    return <FileText className="h-16 w-16 text-muted-foreground" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const isImage = currentFile?.type.startsWith('image/');
  const isVideo = currentFile?.type.startsWith('video/');
  const currentPreview = previews[selectedIndex];

  return (
    <div className="fixed inset-0 z-50 bg-[#0b141a] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#202c33]">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-10 w-10 text-[#aebac1] hover:text-white hover:bg-[#374045]"
          >
            <X className="h-6 w-6" />
          </Button>
          <span className="text-[#e9edef] font-medium truncate max-w-[300px]">
            {currentFile?.name || 'Arquivo'}
          </span>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        {isImage && currentPreview ? (
          <img
            src={currentPreview}
            alt={currentFile.name}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        ) : isVideo && currentPreview ? (
          <video
            src={currentPreview}
            controls
            className="max-w-full max-h-full rounded-lg"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            {getFileIcon(currentFile)}
            <div className="space-y-1">
              <p className="text-[#e9edef] font-medium">{currentFile?.name}</p>
              <p className="text-[#8696a0] text-sm">
                {formatFileSize(currentFile?.size || 0)} • {currentFile?.type || 'Arquivo'}
              </p>
              <p className="text-[#8696a0] text-xs mt-2">
                Prévia não disponível
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-[#202c33] px-4 py-3">
        {/* Thumbnails Row */}
        {files.length > 0 && (
          <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-2">
            {files.map((file, index) => (
              <button
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={cn(
                  "relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all",
                  selectedIndex === index
                    ? "border-[#00a884]"
                    : "border-transparent hover:border-[#374045]"
                )}
              >
                {file.type.startsWith('image/') && previews[index] ? (
                  <img
                    src={previews[index]}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                ) : file.type.startsWith('video/') && previews[index] ? (
                  <div className="w-full h-full bg-[#374045] flex items-center justify-center">
                    <Film className="h-6 w-6 text-[#8696a0]" />
                  </div>
                ) : (
                  <div className="w-full h-full bg-[#374045] flex items-center justify-center">
                    <FileText className="h-6 w-6 text-[#8696a0]" />
                  </div>
                )}
              </button>
            ))}
            
            {/* Add More Button */}
            <button
              onClick={onAddMoreFiles}
              className="flex-shrink-0 w-14 h-14 rounded-lg border-2 border-dashed border-[#374045] flex items-center justify-center hover:border-[#00a884] hover:bg-[#374045]/50 transition-all"
            >
              <Plus className="h-6 w-6 text-[#8696a0]" />
            </button>
          </div>
        )}

        {/* Input Row */}
        <div className="flex items-center gap-2">
          <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-[#8696a0] hover:text-white hover:bg-[#374045]"
              >
                <Smile className="h-6 w-6" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 border-none" align="start" side="top">
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                width="100%"
                height={350}
                theme={Theme.DARK}
                searchPlaceholder="Buscar emoji..."
                previewConfig={{ showPreview: false }}
              />
            </PopoverContent>
          </Popover>

          <Input
            ref={inputRef}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite uma mensagem"
            className="flex-1 bg-[#2a3942] border-none text-[#e9edef] placeholder:text-[#8696a0] h-10 rounded-lg focus-visible:ring-0 focus-visible:ring-offset-0"
            disabled={isLoading}
          />

          <Button
            onClick={handleSend}
            disabled={isLoading}
            className="h-10 w-10 rounded-full bg-[#00a884] hover:bg-[#00a884]/90 text-white"
            size="icon"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
