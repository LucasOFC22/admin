/**
 * CookieStorage - Adaptador de storage baseado em cookies para o Supabase Auth.
 * Substitui localStorage/sessionStorage para persistência de sessão.
 * 
 * Usa cookies HTTP com suporte cross-domain para *.fptranscargas.com.br
 */

const getCookieDomain = (): string => {
  const hostname = window.location.hostname;
  if (hostname.includes('fptranscargas.com.br')) {
    return '.fptranscargas.com.br';
  }
  return '';
};

const COOKIE_MAX_AGE = 2592000; // 30 dias (alinhado com refresh token do backend)

/**
 * Implementação de SupportedStorage usando cookies.
 * Compatível com a interface esperada pelo Supabase JS client.
 */
export const cookieStorage: Storage = {
  get length(): number {
    return document.cookie.split(';').filter(c => c.trim().length > 0).length;
  },

  key(index: number): string | null {
    const cookies = document.cookie.split(';').map(c => c.trim());
    if (index >= 0 && index < cookies.length) {
      return cookies[index].split('=')[0] || null;
    }
    return null;
  },

  getItem(key: string): string | null {
    try {
      const cookies = document.cookie.split(';');
      
      // Para chaves do Supabase que podem ter dados grandes,
      // verificar se os dados foram fragmentados em múltiplos cookies
      const chunks: string[] = [];
      let chunkIndex = 0;
      let hasChunks = false;

      for (const cookie of cookies) {
        const trimmed = cookie.trim();
        if (trimmed.startsWith(`${key}.${chunkIndex}=`)) {
          hasChunks = true;
          const value = trimmed.substring(`${key}.${chunkIndex}=`.length);
          chunks.push(decodeURIComponent(value));
          chunkIndex++;
        }
      }

      // Se encontrou chunks, recombinar
      if (hasChunks) {
        // Continuar buscando mais chunks
        let moreChunks = true;
        while (moreChunks) {
          moreChunks = false;
          for (const cookie of cookies) {
            const trimmed = cookie.trim();
            if (trimmed.startsWith(`${key}.${chunkIndex}=`)) {
              const value = trimmed.substring(`${key}.${chunkIndex}=`.length);
              chunks.push(decodeURIComponent(value));
              chunkIndex++;
              moreChunks = true;
            }
          }
        }
        return chunks.join('');
      }

      // Busca simples (cookie não fragmentado)
      for (const cookie of cookies) {
        const trimmed = cookie.trim();
        if (trimmed.startsWith(`${key}=`)) {
          const value = trimmed.substring(`${key}=`.length);
          return decodeURIComponent(value);
        }
      }

      return null;
    } catch {
      return null;
    }
  },

  setItem(key: string, value: string): void {
    try {
      const isSecure = window.location.protocol === 'https:';
      const domain = getCookieDomain();
      
      const buildCookieString = (cookieKey: string, cookieValue: string): string => {
        let str = `${cookieKey}=${encodeURIComponent(cookieValue)}; max-age=${COOKIE_MAX_AGE}; path=/; SameSite=Lax`;
        if (domain) str += `; domain=${domain}`;
        if (isSecure) str += '; Secure';
        return str;
      };

      // Se o valor é grande (> 3KB), fragmentar em múltiplos cookies
      const MAX_CHUNK_SIZE = 3000; // 3KB por cookie (margem de segurança)
      const encodedValue = value;

      if (encodedValue.length > MAX_CHUNK_SIZE) {
        // Limpar cookies antigos (fragmentados ou não)
        cookieStorage.removeItem(key);

        // Fragmentar em chunks
        const totalChunks = Math.ceil(encodedValue.length / MAX_CHUNK_SIZE);
        for (let i = 0; i < totalChunks; i++) {
          const chunk = encodedValue.substring(i * MAX_CHUNK_SIZE, (i + 1) * MAX_CHUNK_SIZE);
          document.cookie = buildCookieString(`${key}.${i}`, chunk);
        }
      } else {
        // Limpar fragmentos antigos se existirem
        cookieStorage.removeItem(key);
        
        // Armazenar em cookie único
        document.cookie = buildCookieString(key, encodedValue);
      }
    } catch (error) {
      console.warn('[CookieStorage] Erro ao salvar cookie:', error);
    }
  },

  removeItem(key: string): void {
    try {
      const domain = getCookieDomain();
      
      const expireCookie = (cookieKey: string) => {
        let str = `${cookieKey}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
        if (domain) str += `; domain=${domain}`;
        document.cookie = str;
        // Também expirar sem domain para limpar cookies locais
        document.cookie = `${cookieKey}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
      };

      // Remover cookie principal
      expireCookie(key);

      // Remover chunks (até 20 possíveis)
      for (let i = 0; i < 20; i++) {
        expireCookie(`${key}.${i}`);
      }
    } catch (error) {
      console.warn('[CookieStorage] Erro ao remover cookie:', error);
    }
  },

  clear(): void {
    // Não implementado - não queremos limpar todos os cookies do domínio
    console.warn('[CookieStorage] clear() não é suportado');
  }
};
