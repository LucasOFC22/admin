import React, { useState, createContext, useContext, ReactNode } from "react";

interface Message {
  id: string;
  body: string;
  [key: string]: any;
}

interface EditMessageContextData {
  editingMessage: Message | null;
  setEditingMessage: (message: Message | null) => void;
}

const EditMessageContext = createContext<EditMessageContextData>({
  editingMessage: null,
  setEditingMessage: () => {},
});

interface EditMessageProviderProps {
  children: ReactNode;
}

export const EditMessageProvider: React.FC<EditMessageProviderProps> = ({ children }) => {
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);

  return (
    <EditMessageContext.Provider value={{ editingMessage, setEditingMessage }}>
      {children}
    </EditMessageContext.Provider>
  );
};

export const useEditMessage = () => useContext(EditMessageContext);
export { EditMessageContext };
