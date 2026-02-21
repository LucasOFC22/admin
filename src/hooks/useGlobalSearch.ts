
import { useState, useEffect, useMemo } from 'react';
import { useAdminQuotes } from './useAdminQuotes';
import { useAdminContacts } from './useAdminContacts';

interface SearchResult {
  id: string;
  type: 'quote' | 'contact' | 'chat';
  title: string;
  subtitle: string;
  description: string;
  data: any;
}

export const useGlobalSearch = (searchTerm: string) => {
  const [isSearching, setIsSearching] = useState(false);
  const { quotes } = useAdminQuotes();
  const { contacts } = useAdminContacts();

  const searchResults = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) {
      return [];
    }

    setIsSearching(true);
    const results: SearchResult[] = [];
    const term = searchTerm.toLowerCase();

    // Buscar em cotações
    quotes.forEach(quote => {
      const searchableText = `${quote.clientName} ${quote.clientEmail} ${quote.origin} ${quote.destination} ${quote.cargoType} ${quote.quoteId}`.toLowerCase();
      
      if (searchableText.includes(term)) {
        results.push({
          id: quote.id,
          type: 'quote',
          title: `Cotação #${quote.quoteId}`,
          subtitle: quote.clientName,
          description: `${quote.origin} → ${quote.destination}`,
          data: quote
        });
      }
    });

    // Buscar em contatos
    contacts.forEach(contact => {
      const searchableText = `${contact.name} ${contact.email} ${contact.phone || ''} ${contact.message}`.toLowerCase();
      
      if (searchableText.includes(term)) {
        results.push({
          id: String(contact.contact_id),
          type: 'contact',
          title: contact.name,
          subtitle: contact.email,
          description: contact.message.substring(0, 100) + '...',
          data: contact
        });
      }
    });

    setIsSearching(false);
    return results.slice(0, 10); // Limitar a 10 resultados
  }, [searchTerm, quotes, contacts]);

  return { searchResults, isSearching };
};
