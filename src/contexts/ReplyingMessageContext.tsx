import React, { useState, createContext, useContext, ReactNode } from "react";

interface Message {
  id: string;
  body: string;
  [key: string]: any;
}

interface ReplyMessageContextData {
  replyingMessage: Message | null;
  setReplyingMessage: (message: Message | null) => void;
}

const ReplyMessageContext = createContext<ReplyMessageContextData>({
  replyingMessage: null,
  setReplyingMessage: () => {},
});

interface ReplyMessageProviderProps {
  children: ReactNode;
}

export const ReplyMessageProvider: React.FC<ReplyMessageProviderProps> = ({ children }) => {
  const [replyingMessage, setReplyingMessage] = useState<Message | null>(null);

  return (
    <ReplyMessageContext.Provider value={{ replyingMessage, setReplyingMessage }}>
      {children}
    </ReplyMessageContext.Provider>
  );
};

export const useReplyMessage = () => useContext(ReplyMessageContext);
export { ReplyMessageContext };
