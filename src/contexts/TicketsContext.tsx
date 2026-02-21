import React, { useState, useEffect, createContext, ReactNode, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";

interface Ticket {
  id: string;
  uuid: string;
}

interface TicketsContextData {
  currentTicket: Ticket;
  setCurrentTicket: (ticket: Ticket) => void;
  tabOpen: string;
  setTabOpen: (tab: string) => void;
}

const TicketsContext = createContext<TicketsContextData>({} as TicketsContextData);

interface TicketsContextProviderProps {
  children: ReactNode;
}

const TicketsContextProvider: React.FC<TicketsContextProviderProps> = ({ children }) => {
  const [currentTicket, setCurrentTicketState] = useState<Ticket>({ id: '', uuid: '' });
  const [tabOpen, setTabOpen] = useState("open");
  const navigate = useNavigate();

  const setCurrentTicket = useCallback((ticket: Ticket) => {
    setCurrentTicketState(ticket);
  }, []);

  useEffect(() => {
    if (currentTicket.uuid) {
      navigate(`/whatsapp/${currentTicket.uuid}`);
    }
  }, [currentTicket.uuid, navigate]);

  const contextValue = useMemo(() => ({
    currentTicket,
    setCurrentTicket,
    tabOpen,
    setTabOpen
  }), [currentTicket, setCurrentTicket, tabOpen]);

  return (
    <TicketsContext.Provider value={contextValue}>
      {children}
    </TicketsContext.Provider>
  );
};

export { TicketsContext, TicketsContextProvider };
