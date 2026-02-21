import React, { createContext, useContext, useState, useCallback } from 'react';

interface ScrollToMessageContextType {
  messageIdToScrollTo: string | null;
  setMessageIdToScrollTo: (id: string | null) => void;
  clearScrollTarget: () => void;
}

const ScrollToMessageContext = createContext<ScrollToMessageContextType>({
  messageIdToScrollTo: null,
  setMessageIdToScrollTo: () => {},
  clearScrollTarget: () => {},
});

export const useScrollToMessage = () => useContext(ScrollToMessageContext);

interface ScrollToMessageProviderProps {
  children: React.ReactNode;
}

export const ScrollToMessageProvider: React.FC<ScrollToMessageProviderProps> = ({ children }) => {
  const [messageIdToScrollTo, setMessageIdToScrollTo] = useState<string | null>(null);

  const clearScrollTarget = useCallback(() => {
    setMessageIdToScrollTo(null);
  }, []);

  return (
    <ScrollToMessageContext.Provider value={{ messageIdToScrollTo, setMessageIdToScrollTo, clearScrollTarget }}>
      {children}
    </ScrollToMessageContext.Provider>
  );
};
