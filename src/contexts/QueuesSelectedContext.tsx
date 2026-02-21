import React, { useState, createContext, ReactNode } from "react";

interface QueuesSelectedContextData {
  selectedQueueIds: string[];
  setSelectedQueueIds: (queueIds: string[]) => void;
}

const QueuesSelectedContext = createContext<QueuesSelectedContextData>({} as QueuesSelectedContextData);

interface QueuesSelectedProviderProps {
  children: ReactNode;
}

const QueuesSelectedProvider: React.FC<QueuesSelectedProviderProps> = ({ children }) => {
  const [selectedQueueIds, setSelectedQueueIds] = useState<string[]>([]);

  return (
    <QueuesSelectedContext.Provider
      value={{ selectedQueueIds, setSelectedQueueIds }}
    >
      {children}
    </QueuesSelectedContext.Provider>
  );
};

export { QueuesSelectedContext, QueuesSelectedProvider };
