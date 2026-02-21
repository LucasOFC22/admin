import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { useAuthState } from '@/hooks/useAuthState';

interface SoundNotificationContextType {
  soundEnabled: boolean;
  toggleSound: () => Promise<void>;
  playNotificationSound: () => void;
  isLoading: boolean;
  isAudioUnlocked: boolean;
}

const SoundNotificationContext = createContext<SoundNotificationContextType | undefined>(undefined);

// Função global para tocar som (acessível de qualquer lugar)
let globalPlaySound: (() => void) | null = null;

export const playGlobalNotificationSound = () => {
  if (globalPlaySound) {
    globalPlaySound();
  }
};

export const SoundNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthState();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const soundEnabledRef = useRef(true);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Carregar preferência do usuário ao montar
  useEffect(() => {
    if (user?.id) {
      loadSoundPreference();
    }
  }, [user?.id]);

  // Pré-carregar o áudio e configurar unlock
  useEffect(() => {
    // Criar elemento de áudio
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = 0.5;
    audio.preload = 'auto';
    audioRef.current = audio;

    // Tentar criar AudioContext
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      // AudioContext não disponível
    }

    // Função para desbloquear áudio na primeira interação
    const unlockAudio = async () => {
      try {
        // Resumir AudioContext se estiver suspenso
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }

        // Tocar som silencioso para "desbloquear" o elemento de áudio
        if (audioRef.current) {
          audioRef.current.volume = 0;
          await audioRef.current.play();
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          audioRef.current.volume = 0.5;
        }

        setIsAudioUnlocked(true);
        
        // Remover listeners após desbloquear
        document.removeEventListener('click', unlockAudio);
        document.removeEventListener('touchstart', unlockAudio);
        document.removeEventListener('keydown', unlockAudio);
      } catch (e) {
        // Erro ao desbloquear áudio
      }
    };

    // Adicionar listeners para primeira interação do usuário
    document.addEventListener('click', unlockAudio, { once: false });
    document.addEventListener('touchstart', unlockAudio, { once: false });
    document.addEventListener('keydown', unlockAudio, { once: false });

    // Tentar desbloquear imediatamente (pode funcionar em alguns casos)
    unlockAudio();

    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
      
      if (audioRef.current) {
        audioRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  // Atualizar ref quando soundEnabled mudar
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const loadSoundPreference = async () => {
    if (!user?.id) return;
    
    try {
      const client = requireAuthenticatedClient();
      const { data, error } = await client
        .from('usuarios')
        .select('som')
        .eq('id', user.id)
        .maybeSingle();

      if (!error && data) {
        const enabled = data.som ?? true;
        setSoundEnabled(enabled);
        soundEnabledRef.current = enabled;
      }
    } catch (error) {
      // Erro ao carregar preferência
    }
  };

  const toggleSound = useCallback(async () => {
    if (!user?.id || isLoading) return;

    setIsLoading(true);
    const newValue = !soundEnabled;

    try {
      const client = requireAuthenticatedClient();
      const { error } = await client
        .from('usuarios')
        .update({ som: newValue })
        .eq('id', user.id);

      if (error) throw error;

      setSoundEnabled(newValue);
      soundEnabledRef.current = newValue;
    } catch (error) {
      // Erro ao atualizar preferência
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, soundEnabled, isLoading]);

  const playNotificationSound = useCallback(() => {
    if (!soundEnabledRef.current) {
      return;
    }

    // Método 1: Usar elemento Audio HTML5
    const playWithAudioElement = async () => {
      try {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.volume = 0.5;
          await audioRef.current.play();
          return true;
        }
      } catch (err) {
        // Falha no Audio element
      }
      return false;
    };

    // Método 2: Criar novo elemento Audio como fallback
    const playWithNewAudio = async () => {
      try {
        const newAudio = new Audio('/sounds/notification.mp3');
        newAudio.volume = 0.5;
        await newAudio.play();
        return true;
      } catch (err) {
        // Falha no novo Audio element
      }
      return false;
    };

    // Tentar métodos em sequência
    playWithAudioElement().then(success => {
      if (!success) {
        playWithNewAudio();
      }
    });
  }, [isAudioUnlocked]);

  // Registrar função global
  useEffect(() => {
    globalPlaySound = playNotificationSound;
    return () => {
      globalPlaySound = null;
    };
  }, [playNotificationSound]);

  return (
    <SoundNotificationContext.Provider value={{ soundEnabled, toggleSound, playNotificationSound, isLoading, isAudioUnlocked }}>
      {children}
    </SoundNotificationContext.Provider>
  );
};

export const useSoundNotification = () => {
  const context = useContext(SoundNotificationContext);
  if (context === undefined) {
    throw new Error('useSoundNotification must be used within a SoundNotificationProvider');
  }
  return context;
};
