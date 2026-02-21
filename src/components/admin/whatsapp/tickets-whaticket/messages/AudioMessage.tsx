import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

interface AudioMessageProps {
  url: string;
  fromMe: boolean;
  profilePicUrl?: string;
  contactName?: string;
  duration?: number; // duração em segundos se disponível
  onError?: () => void;
}

export const AudioMessage: React.FC<AudioMessageProps> = ({
  url,
  fromMe,
  profilePicUrl,
  contactName,
  duration: initialDuration,
  onError
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);
  const [currentTime, setCurrentTime] = useState(0);
  
  // Waveform bars simuladas (visual estático estilo WhatsApp)
  const waveformBars = [
    3, 5, 8, 4, 7, 10, 6, 8, 5, 9, 7, 4, 8, 6, 10, 5, 7, 9, 4, 6,
    8, 5, 7, 4, 9, 6, 8, 5, 7, 10, 4, 8, 6, 5, 9, 7, 4, 8, 5, 6
  ];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    const handleError = () => {
      onError?.();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [onError]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    audio.currentTime = percentage * audio.duration;
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Cor do player baseada em quem enviou
  const playButtonBg = fromMe ? 'bg-[#00a884]' : 'bg-[#00a884]';
  const progressedColor = fromMe ? '#34b7f1' : '#25d366';

  return (
    <div className="flex items-center gap-3 min-w-[200px] max-w-[280px] py-1">
      <audio ref={audioRef} src={url} preload="metadata" />
      
      {/* Botão Play/Pause */}
      <button
        onClick={togglePlay}
        className={`h-9 w-9 rounded-full ${playButtonBg} flex items-center justify-center hover:opacity-90 transition-opacity flex-shrink-0`}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4 text-white fill-white" />
        ) : (
          <Play className="h-4 w-4 text-white fill-white ml-0.5" />
        )}
      </button>

      {/* Waveform e Tempo */}
      <div className="flex-1 flex flex-col gap-0.5">
        {/* Waveform */}
        <div 
          className="flex items-center gap-[2px] h-5 cursor-pointer"
          onClick={handleWaveformClick}
        >
          {waveformBars.map((height, index) => {
            const barProgress = (index / waveformBars.length) * 100;
            const isProgressed = barProgress <= progress;
            
            return (
              <div
                key={index}
                className="w-[2px] rounded-full transition-all duration-100"
                style={{
                  height: `${Math.max(height * 1.5, 3)}px`,
                  backgroundColor: isProgressed ? progressedColor : '#b0b0b0',
                }}
              />
            );
          })}
        </div>

        {/* Tempo */}
        <div className="flex justify-between text-[10px] text-gray-500">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};
