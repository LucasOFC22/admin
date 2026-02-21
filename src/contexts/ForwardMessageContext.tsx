import React, { useState, createContext, useContext, ReactNode } from "react";

interface ForwardMessageContextData {
  showSelectMessageCheckbox: boolean;
  setShowSelectMessageCheckbox: (show: boolean) => void;
  selectedMessages: string[];
  setSelectedMessages: (messages: string[]) => void;
  forwardMessageModalOpen: boolean;
  setForwardMessageModalOpen: (open: boolean) => void;
}

const ForwardMessageContext = createContext<ForwardMessageContextData>({
  showSelectMessageCheckbox: false,
  setShowSelectMessageCheckbox: () => {},
  selectedMessages: [],
  setSelectedMessages: () => {},
  forwardMessageModalOpen: false,
  setForwardMessageModalOpen: () => {},
});

interface ForwardMessageProviderProps {
  children: ReactNode;
}

export const ForwardMessageProvider: React.FC<ForwardMessageProviderProps> = ({ children }) => {
  const [showSelectMessageCheckbox, setShowSelectMessageCheckbox] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [forwardMessageModalOpen, setForwardMessageModalOpen] = useState(false);

  return (
    <ForwardMessageContext.Provider
      value={{
        showSelectMessageCheckbox,
        setShowSelectMessageCheckbox,
        selectedMessages,
        setSelectedMessages,
        forwardMessageModalOpen,
        setForwardMessageModalOpen,
      }}
    >
      {children}
    </ForwardMessageContext.Provider>
  );
};

export const useForwardMessage = () => useContext(ForwardMessageContext);
export { ForwardMessageContext };
