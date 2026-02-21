import { useCallback, useRef } from 'react';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { CardDavContactFormData, CardDavResponse } from '@/types/carddav';

interface AutoSaveContactOptions {
  contaId?: string;
  enabled?: boolean;
}

/**
 * Hook para salvar automaticamente emails como contatos CardDAV.
 * Similar ao comportamento do Gmail - salva apenas email e nome quando disponível.
 */
export function useAutoSaveContact({ contaId, enabled = true }: AutoSaveContactOptions = {}) {
  // Cache para evitar salvar o mesmo email múltiplas vezes na mesma sessão
  const savedEmailsCache = useRef<Set<string>>(new Set());

  /**
   * Extrai nome e email de uma string de email
   * Suporta formatos: "Nome <email@domain.com>" ou "email@domain.com"
   */
  const parseEmailString = useCallback((emailStr: string): { nome: string; email: string } | null => {
    const trimmed = emailStr.trim();
    
    // Formato: "Nome <email@domain.com>"
    const matchWithName = trimmed.match(/^(.+?)\s*<([^>]+)>$/);
    if (matchWithName) {
      return {
        nome: matchWithName[1].trim().replace(/^["']|["']$/g, ''),
        email: matchWithName[2].trim().toLowerCase()
      };
    }
    
    // Formato: "email@domain.com"
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(trimmed)) {
      // Gerar nome a partir do email
      const localPart = trimmed.split('@')[0];
      const nome = localPart
        .replace(/[._-]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
      return {
        nome,
        email: trimmed.toLowerCase()
      };
    }
    
    return null;
  }, []);

  /**
   * Verifica se um contato já existe no CardDAV
   */
  const checkContactExists = useCallback(async (email: string): Promise<boolean> => {
    if (!contaId) return false;

    try {
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase.functions.invoke<CardDavResponse>('carddav-contacts', {
        body: {
          conta_id: contaId,
          action: 'search',
          query: email
        }
      });

      if (error || !data?.success) return false;

      // Verificar se algum contato tem exatamente esse email
      return data.contacts?.some(c => 
        c.email?.toLowerCase() === email.toLowerCase() ||
        c.emailSecundario?.toLowerCase() === email.toLowerCase()
      ) || false;
    } catch {
      return false;
    }
  }, [contaId]);

  /**
   * Salva um único contato no CardDAV
   */
  const saveContact = useCallback(async (data: CardDavContactFormData): Promise<boolean> => {
    if (!contaId) return false;

    try {
      const supabase = requireAuthenticatedClient();
      const { data: result, error } = await supabase.functions.invoke<CardDavResponse>('carddav-contacts', {
        body: {
          conta_id: contaId,
          action: 'create',
          contact: data
        }
      });

      if (error || !result?.success) {
        console.warn('[useAutoSaveContact] Erro ao salvar contato:', result?.error || error);
        return false;
      }

      console.log('[useAutoSaveContact] Contato salvo:', data.email);
      return true;
    } catch (err) {
      console.error('[useAutoSaveContact] Erro:', err);
      return false;
    }
  }, [contaId]);

  /**
   * Salva automaticamente emails como contatos (se não existirem)
   * Executa em background, não bloqueia a UI
   */
  const autoSaveEmails = useCallback(async (emails: string[]) => {
    if (!enabled || !contaId || emails.length === 0) return;

    // Processar cada email em paralelo (mas sem bloquear)
    const uniqueEmails = [...new Set(emails)];
    
    for (const emailStr of uniqueEmails) {
      const parsed = parseEmailString(emailStr);
      if (!parsed) continue;

      const emailLower = parsed.email.toLowerCase();

      // Verificar cache local primeiro
      if (savedEmailsCache.current.has(emailLower)) {
        continue;
      }

      // Marcar como processado para evitar duplicatas
      savedEmailsCache.current.add(emailLower);

      // Executar em background (fire and forget)
      (async () => {
        try {
          // Verificar se já existe
          const exists = await checkContactExists(emailLower);
          if (exists) {
            console.log('[useAutoSaveContact] Contato já existe:', emailLower);
            return;
          }

          // Salvar novo contato
          await saveContact({
            nome: parsed.nome,
            email: emailLower
          });
        } catch (err) {
          console.warn('[useAutoSaveContact] Erro ao processar:', emailLower, err);
        }
      })();
    }
  }, [enabled, contaId, parseEmailString, checkContactExists, saveContact]);

  /**
   * Limpa o cache de emails salvos (útil para testes ou refresh manual)
   */
  const clearCache = useCallback(() => {
    savedEmailsCache.current.clear();
  }, []);

  return {
    autoSaveEmails,
    clearCache,
    parseEmailString
  };
}
