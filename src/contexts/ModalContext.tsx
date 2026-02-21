import React, { createContext, useContext, useState, useCallback } from 'react';

interface ModalContextType {
  activeModals: string[];
  openModal: (modalId: string) => void;
  closeModal: (modalId: string) => void;
  isModalOpen: (modalId: string) => boolean;
  closeAllModals: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

interface ModalProviderProps {
  children: React.ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [activeModals, setActiveModals] = useState<string[]>([]);

  const openModal = useCallback((modalId: string) => {
    setActiveModals(prev => 
      prev.includes(modalId) ? prev : [...prev, modalId]
    );
  }, []);

  const closeModal = useCallback((modalId: string) => {
    setActiveModals(prev => prev.filter(id => id !== modalId));
  }, []);

  const isModalOpen = useCallback((modalId: string) => {
    return activeModals.includes(modalId);
  }, [activeModals]);

  const closeAllModals = useCallback(() => {
    setActiveModals([]);
  }, []);

  return (
    <ModalContext.Provider value={{
      activeModals,
      openModal,
      closeModal,
      isModalOpen,
      closeAllModals
    }}>
      {children}
    </ModalContext.Provider>
  );
};