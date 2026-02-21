
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

interface UIState {
  isMobile: boolean;
}

interface UIContextType {
  // Mobile detection
  isMobile: boolean;
  setIsMobile: (mobile: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<UIState>({
    isMobile: false
  });

  const setIsMobile = useCallback((mobile: boolean) => {
    setState(prev => ({ ...prev, isMobile: mobile }));
  }, []);

  const value = useMemo(() => ({
    isMobile: state.isMobile,
    setIsMobile
  }), [state.isMobile, setIsMobile]);

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
};
