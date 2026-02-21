import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CardDavRequest {
  conta_id?: string;
  action: 'list' | 'get' | 'create' | 'update' | 'delete' | 'search' | 'test';
  contact?: {
    uid?: string;
    nome: string;
    sobrenome?: string;
    email: string;
    emailSecundario?: string;
    telefone?: string;
    celular?: string;
    empresa?: string;
    cargo?: string;
    notas?: string;
  };
  uid?: string;
  query?: string;
  // Credenciais diretas para teste (quando não há conta_id)
  carddav_url?: string;
  carddav_usuario?: string;
  carddav_senha?: string;
}

interface CardDavContact {
  uid: string;
  etag?: string;
  href?: string;
  nome: string;
  sobrenome?: string;
  nomeCompleto: string;
  email: string;
  emailSecundario?: string;
  telefone?: string;
  celular?: string;
  empresa?: string;
  cargo?: string;
  notas?: string;
  atualizado?: string;
}

interface DavFetchResult {
  ok: boolean;
  status: number;
  statusText: string;
  headers: Headers;
  text: () => Promise<string>;
  redirectUrl?: string;
}

// Normalizar URL do CardDAV
function normalizeCardDavUrl(url: string): string {
  let normalized = url.trim();
  
  // Remover múltiplas barras no final
  normalized = normalized.replace(/\/+$/, '');
  
  // Adicionar barra final para URLs de coleção (addressbook)
  if (!normalized.endsWith('.vcf')) {
    normalized += '/';
  }
  
  // Remover espaços internos acidentais
  normalized = normalized.replace(/\s+/g, '');
  
  console.log('[CardDAV] URL normalizada:', url, '->', normalized);
  return normalized;
}

// Gerar variações de URL para cPanel e outros servidores
function generateUrlVariations(baseUrl: string): string[] {
  const variations: string[] = [];
  let url = baseUrl.trim().replace(/\/+$/, '');
  
  // URL original
  variations.push(url + '/');
  
  // Se contém @ na URL (email), tentar com %40
  if (url.includes('@') && !url.includes('%40')) {
    const urlWithEncodedAt = url.replace(/@/g, '%40');
    variations.push(urlWithEncodedAt + '/');
  }
  
  // Se termina com /addressbook, tentar /default também (cPanel alternativo)
  if (url.endsWith('/addressbook')) {
    const defaultUrl = url.replace('/addressbook', '/default');
    variations.push(defaultUrl + '/');
  }
  
  // Se termina com /default, tentar /addressbook
  if (url.endsWith('/default')) {
    const addressbookUrl = url.replace('/default', '/addressbook');
    variations.push(addressbookUrl + '/');
  }
  
  // Remover duplicatas
  return [...new Set(variations)];
}

// Helper para fazer requests DAV com tratamento de redirects
async function davFetch(
  url: string,
  options: RequestInit,
  maxRedirects: number = 5
): Promise<DavFetchResult> {
  let currentUrl = url;
  let redirectCount = 0;
  
  while (redirectCount < maxRedirects) {
    console.log(`[CardDAV] davFetch: ${options.method} ${currentUrl} (redirect ${redirectCount})`);
    
    const response = await fetch(currentUrl, {
      ...options,
      redirect: 'manual' // Seguir redirects manualmente para preservar método
    });
    
    // Logar headers importantes para debugging
    const locationHeader = response.headers.get('Location');
    const wwwAuthHeader = response.headers.get('WWW-Authenticate');
    
    if (locationHeader) {
      console.log('[CardDAV] Location header:', locationHeader);
    }
    if (wwwAuthHeader) {
      console.log('[CardDAV] WWW-Authenticate header:', wwwAuthHeader);
    }
    
    // Verificar se é redirect
    if ([301, 302, 307, 308].includes(response.status) && locationHeader) {
      redirectCount++;
      // Resolver URL relativa se necessário
      try {
        currentUrl = new URL(locationHeader, currentUrl).toString();
        console.log('[CardDAV] Seguindo redirect para:', currentUrl);
        continue;
      } catch (e) {
        console.error('[CardDAV] Erro ao resolver URL de redirect:', e);
        break;
      }
    }
    
    // Não é redirect, retornar resposta
    const responseText = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      text: async () => responseText,
      redirectUrl: redirectCount > 0 ? currentUrl : undefined
    };
  }
  
  throw new Error(`Muitos redirects (${maxRedirects}) ao acessar ${url}`);
}

// Verificar se erro indica que PROPFIND está bloqueado
function isPropfindBlocked(status: number): boolean {
  return [403, 405, 501].includes(status);
}

// Criar mensagem de erro detalhada
function createDetailedError(
  operation: string,
  status: number,
  statusText: string,
  responseBody: string,
  headers: Headers
): Error {
  const locationHeader = headers.get('Location');
  const wwwAuthHeader = headers.get('WWW-Authenticate');
  
  let message = `Erro ${operation}: ${status} ${statusText}`;
  
  if (status === 401) {
    message += '. Credenciais inválidas ou expiradas.';
    if (wwwAuthHeader) {
      message += ` Auth requerida: ${wwwAuthHeader}`;
    }
  } else if (status === 403) {
    message += '. Acesso negado - verifique permissões ou URL do addressbook.';
  } else if (status === 404) {
    message += '. Recurso não encontrado - verifique a URL do CardDAV.';
  } else if (status === 405) {
    message += '. Método não permitido pelo servidor.';
  } else if (locationHeader) {
    message += ` Redirect para: ${locationHeader}`;
  }
  
  // Adicionar trecho do body se existir
  if (responseBody && responseBody.length > 0) {
    const bodySnippet = responseBody.substring(0, 200);
    message += ` | Response: ${bodySnippet}${responseBody.length > 200 ? '...' : ''}`;
  }
  
  return new Error(message);
}

// Descriptografar senha
async function decryptPassword(encryptedPassword: string): Promise<string> {
  const encryptionKey = Deno.env.get('EMAIL_ENCRYPTION_KEY') || 'default-key-change-me-in-production';
  
  const combined = Uint8Array.from(atob(encryptedPassword), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const encryptedData = combined.slice(12);
  
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(encryptionKey.padEnd(32, '0').slice(0, 32)),
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    keyMaterial,
    encryptedData
  );
  
  return new TextDecoder().decode(decrypted);
}

// Parse vCard para objeto de contato
function parseVCard(vcardData: string, href?: string): CardDavContact | null {
  try {
    const lines = vcardData.split(/\r?\n/);
    const contact: Partial<CardDavContact> = {};
    
    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;
      
      const key = line.substring(0, colonIndex).toUpperCase();
      const value = line.substring(colonIndex + 1).trim();
      
      if (key === 'UID' || key.startsWith('UID;')) {
        contact.uid = value;
      } else if (key === 'FN' || key.startsWith('FN;')) {
        contact.nomeCompleto = value;
      } else if (key === 'N' || key.startsWith('N;')) {
        const parts = value.split(';');
        contact.sobrenome = parts[0] || '';
        contact.nome = parts[1] || '';
      } else if (key.startsWith('EMAIL') || key === 'EMAIL') {
        if (!contact.email) {
          contact.email = value;
        } else if (!contact.emailSecundario) {
          contact.emailSecundario = value;
        }
      } else if (key.startsWith('TEL') && (key.includes('CELL') || key.includes('MOBILE'))) {
        contact.celular = value;
      } else if (key.startsWith('TEL')) {
        if (!contact.telefone) {
          contact.telefone = value;
        }
      } else if (key === 'ORG' || key.startsWith('ORG;')) {
        contact.empresa = value.split(';')[0];
      } else if (key === 'TITLE' || key.startsWith('TITLE;')) {
        contact.cargo = value;
      } else if (key === 'NOTE' || key.startsWith('NOTE;')) {
        contact.notas = value;
      } else if (key === 'REV' || key.startsWith('REV;')) {
        contact.atualizado = value;
      }
    }
    
    if (!contact.uid || !contact.email) {
      return null;
    }
    
    contact.href = href;
    if (!contact.nomeCompleto) {
      contact.nomeCompleto = `${contact.nome || ''} ${contact.sobrenome || ''}`.trim() || contact.email;
    }
    if (!contact.nome) {
      contact.nome = contact.nomeCompleto.split(' ')[0] || contact.email.split('@')[0];
    }
    
    return contact as CardDavContact;
  } catch (error) {
    console.error('[CardDAV] Erro ao parsear vCard:', error);
    return null;
  }
}

// Gerar vCard a partir de contato
function generateVCard(contact: CardDavRequest['contact'], existingUid?: string): string {
  const uid = existingUid || `${crypto.randomUUID()}@carddav`;
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  const nome = contact?.nome || '';
  const sobrenome = contact?.sobrenome || '';
  const nomeCompleto = `${nome} ${sobrenome}`.trim() || contact?.email || '';
  
  let vcard = `BEGIN:VCARD
VERSION:3.0
UID:${uid}
FN:${nomeCompleto}
N:${sobrenome};${nome};;;
EMAIL:${contact?.email || ''}`;

  if (contact?.emailSecundario) {
    vcard += `\nEMAIL;TYPE=HOME:${contact.emailSecundario}`;
  }
  if (contact?.telefone) {
    vcard += `\nTEL;TYPE=WORK:${contact.telefone}`;
  }
  if (contact?.celular) {
    vcard += `\nTEL;TYPE=CELL:${contact.celular}`;
  }
  if (contact?.empresa) {
    vcard += `\nORG:${contact.empresa}`;
  }
  if (contact?.cargo) {
    vcard += `\nTITLE:${contact.cargo}`;
  }
  if (contact?.notas) {
    vcard += `\nNOTE:${contact.notas.replace(/\n/g, '\\n')}`;
  }
  
  vcard += `\nREV:${now}
END:VCARD`;

  return vcard;
}

// PROPFIND para listar hrefs dos vcards
async function propfindList(
  carddavUrl: string,
  authHeader: string,
  depth: string = '1'
): Promise<{ hrefs: string[]; response: DavFetchResult }> {
  console.log(`[CardDAV] PROPFIND Depth ${depth} em:`, carddavUrl);
  
  const propfindBody = `<?xml version="1.0" encoding="utf-8"?>
<d:propfind xmlns:d="DAV:" xmlns:cs="http://calendarserver.org/ns/">
  <d:prop>
    <d:getetag/>
    <d:getcontenttype/>
  </d:prop>
</d:propfind>`;

  const response = await davFetch(carddavUrl, {
    method: 'PROPFIND',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/xml; charset=utf-8',
      'Depth': depth
    },
    body: propfindBody
  });

  if (!response.ok) {
    const responseText = await response.text();
    console.error(`[CardDAV] PROPFIND Depth ${depth} falhou:`, response.status, responseText.substring(0, 200));
    return { hrefs: [], response };
  }

  const propfindXml = await response.text();
  console.log('[CardDAV] PROPFIND response length:', propfindXml.length);
  
  // Extrair hrefs dos vcards
  const vcardHrefs: string[] = [];
  
  // Tentar com .vcf primeiro
  const hrefMatches = propfindXml.matchAll(/<d:href[^>]*>([^<]+\.vcf)<\/d:href>/gi);
  for (const match of hrefMatches) {
    vcardHrefs.push(match[1]);
  }
  
  // Se não encontrou, tentar padrão mais genérico
  if (vcardHrefs.length === 0) {
    const allHrefs = propfindXml.matchAll(/<(?:d:)?href[^>]*>([^<]+)<\/(?:d:)?href>/gi);
    for (const match of allHrefs) {
      const href = match[1];
      if (href.includes('.vcf') || (href !== carddavUrl && !href.endsWith('/') && href.includes('/'))) {
        vcardHrefs.push(href);
      }
    }
  }
  
  console.log('[CardDAV] PROPFIND encontrou', vcardHrefs.length, 'hrefs');
  return { hrefs: vcardHrefs, response };
}

// REPORT addressbook-query para listar contatos (fallback RFC 6352)
async function addressbookQuery(
  carddavUrl: string,
  authHeader: string
): Promise<CardDavContact[]> {
  console.log('[CardDAV] Tentando REPORT addressbook-query em:', carddavUrl);
  
  const reportBody = `<?xml version="1.0" encoding="utf-8"?>
<c:addressbook-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:carddav">
  <d:prop>
    <d:getetag/>
    <c:address-data/>
  </d:prop>
</c:addressbook-query>`;

  const response = await davFetch(carddavUrl, {
    method: 'REPORT',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/xml; charset=utf-8',
      'Depth': '1'
    },
    body: reportBody
  });

  if (!response.ok) {
    const responseText = await response.text();
    console.error('[CardDAV] REPORT addressbook-query falhou:', response.status, responseText.substring(0, 200));
    throw createDetailedError('REPORT addressbook-query', response.status, response.statusText, responseText, response.headers);
  }

  const reportXml = await response.text();
  console.log('[CardDAV] REPORT response length:', reportXml.length);
  
  return parseMultigetResponse(reportXml);
}

// REPORT addressbook-multiget para obter dados de vcards específicos
async function addressbookMultiget(
  carddavUrl: string,
  authHeader: string,
  hrefs: string[]
): Promise<CardDavContact[]> {
  if (hrefs.length === 0) {
    return [];
  }
  
  console.log('[CardDAV] REPORT addressbook-multiget para', hrefs.length, 'vcards');
  
  const reportBody = `<?xml version="1.0" encoding="utf-8"?>
<c:addressbook-multiget xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:carddav">
  <d:prop>
    <d:getetag/>
    <c:address-data/>
  </d:prop>
  ${hrefs.map(href => `<d:href>${href}</d:href>`).join('\n  ')}
</c:addressbook-multiget>`;

  const response = await davFetch(carddavUrl, {
    method: 'REPORT',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/xml; charset=utf-8',
      'Depth': '1'
    },
    body: reportBody
  });

  if (!response.ok) {
    console.error('[CardDAV] REPORT multiget falhou:', response.status);
    return [];
  }

  const reportXml = await response.text();
  return parseMultigetResponse(reportXml);
}

// Parse do XML de resposta multiget/addressbook-query
function parseMultigetResponse(xml: string): CardDavContact[] {
  const contacts: CardDavContact[] = [];
  
  const responseMatches = xml.matchAll(/<d:response[^>]*>([\s\S]*?)<\/d:response>/gi);
  
  for (const responseMatch of responseMatches) {
    const responseContent = responseMatch[1];
    
    const hrefMatch = responseContent.match(/<d:href[^>]*>([^<]+)<\/d:href>/i);
    const href = hrefMatch ? hrefMatch[1] : undefined;
    
    const etagMatch = responseContent.match(/<d:getetag[^>]*>"?([^"<]+)"?<\/d:getetag>/i);
    const etag = etagMatch ? etagMatch[1] : undefined;
    
    const vcardMatch = responseContent.match(/<c:address-data[^>]*>([\s\S]*?)<\/c:address-data>/i);
    if (vcardMatch) {
      const vcardData = vcardMatch[1]
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .trim();
      
      const contact = parseVCard(vcardData, href);
      if (contact) {
        contact.etag = etag;
        contacts.push(contact);
      }
    }
  }
  
  return contacts;
}

// GET individual de vcards (último fallback)
async function fetchVcardsIndividually(
  carddavUrl: string,
  authHeader: string,
  hrefs: string[]
): Promise<CardDavContact[]> {
  console.log('[CardDAV] Tentando GET individual para', hrefs.length, 'vcards');
  
  const contacts: CardDavContact[] = [];
  const baseUrl = new URL(carddavUrl);
  
  for (const href of hrefs.slice(0, 100)) { // Limitar a 100
    try {
      const fullUrl = href.startsWith('http') ? href : `${baseUrl.origin}${href}`;
      
      const response = await davFetch(fullUrl, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Accept': 'text/vcard'
        }
      });
      
      if (response.ok) {
        const vcardData = await response.text();
        const contact = parseVCard(vcardData, href);
        if (contact) {
          contacts.push(contact);
        }
      }
    } catch (e) {
      console.error('[CardDAV] Erro ao buscar vcard:', href, e);
    }
  }
  
  return contacts;
}

// Listar todos os contatos com estratégia de fallback
async function listContacts(
  carddavUrl: string,
  username: string,
  password: string
): Promise<CardDavContact[]> {
  const normalizedUrl = normalizeCardDavUrl(carddavUrl);
  const authHeader = 'Basic ' + btoa(`${username}:${password}`);
  
  console.log('[CardDAV] Iniciando listagem de contatos...');
  
  // Estratégia 1: PROPFIND Depth 1 + REPORT multiget
  console.log('[CardDAV] Tentativa 1: PROPFIND Depth 1');
  let propfindResult = await propfindList(normalizedUrl, authHeader, '1');
  
  // Estratégia 2: Se PROPFIND Depth 1 bloqueado, tentar Depth 0
  if (isPropfindBlocked(propfindResult.response.status)) {
    console.log('[CardDAV] PROPFIND Depth 1 bloqueado, tentando Depth 0...');
    propfindResult = await propfindList(normalizedUrl, authHeader, '0');
  }
  
  // Se PROPFIND funcionou e temos hrefs
  if (propfindResult.response.ok && propfindResult.hrefs.length > 0) {
    console.log('[CardDAV] PROPFIND OK, usando REPORT multiget...');
    let contacts = await addressbookMultiget(normalizedUrl, authHeader, propfindResult.hrefs);
    
    // Se multiget não retornou contatos, tentar GET individual
    if (contacts.length === 0) {
      console.log('[CardDAV] Multiget vazio, tentando GET individual...');
      contacts = await fetchVcardsIndividually(normalizedUrl, authHeader, propfindResult.hrefs);
    }
    
    console.log('[CardDAV] Total de contatos:', contacts.length);
    return contacts;
  }
  
  // Estratégia 3: REPORT addressbook-query diretamente (RFC 6352)
  if (isPropfindBlocked(propfindResult.response.status) || propfindResult.hrefs.length === 0) {
    console.log('[CardDAV] Tentativa 3: REPORT addressbook-query direto');
    try {
      const contacts = await addressbookQuery(normalizedUrl, authHeader);
      console.log('[CardDAV] addressbook-query retornou', contacts.length, 'contatos');
      return contacts;
    } catch (e) {
      console.error('[CardDAV] addressbook-query também falhou:', e);
      
      // Se chegou aqui, todos os métodos falharam
      const responseText = await propfindResult.response.text();
      throw createDetailedError(
        'listar contatos',
        propfindResult.response.status,
        propfindResult.response.statusText,
        responseText,
        propfindResult.response.headers
      );
    }
  }
  
  // PROPFIND ok mas sem hrefs - retornar vazio
  console.log('[CardDAV] Nenhum contato encontrado');
  return [];
}

// Buscar contatos por query
async function searchContacts(
  carddavUrl: string,
  username: string,
  password: string,
  query: string
): Promise<CardDavContact[]> {
  console.log('[CardDAV] Buscando contatos com query:', query);
  
  const allContacts = await listContacts(carddavUrl, username, password);
  
  const queryLower = query.toLowerCase();
  return allContacts.filter(contact => 
    contact.nome?.toLowerCase().includes(queryLower) ||
    contact.sobrenome?.toLowerCase().includes(queryLower) ||
    contact.nomeCompleto?.toLowerCase().includes(queryLower) ||
    contact.email?.toLowerCase().includes(queryLower) ||
    contact.empresa?.toLowerCase().includes(queryLower)
  );
}

// Criar contato
async function createContact(
  carddavUrl: string,
  username: string,
  password: string,
  contact: CardDavRequest['contact']
): Promise<CardDavContact> {
  const normalizedUrl = normalizeCardDavUrl(carddavUrl);
  const uid = crypto.randomUUID();
  const vcard = generateVCard(contact, `${uid}@carddav`);
  const vcardUrl = `${normalizedUrl.replace(/\/$/, '')}/${uid}.vcf`;
  
  console.log('[CardDAV] Criando contato em:', vcardUrl);
  
  const authHeader = 'Basic ' + btoa(`${username}:${password}`);
  
  const response = await davFetch(vcardUrl, {
    method: 'PUT',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'text/vcard; charset=utf-8',
      'If-None-Match': '*'
    },
    body: vcard
  });

  if (!response.ok && response.status !== 201 && response.status !== 204) {
    const responseText = await response.text();
    throw createDetailedError('criar contato', response.status, response.statusText, responseText, response.headers);
  }

  console.log('[CardDAV] Contato criado com sucesso');
  
  const createdContact = parseVCard(vcard, vcardUrl);
  if (!createdContact) {
    throw new Error('Erro ao parsear contato criado');
  }
  
  return createdContact;
}

// Atualizar contato
async function updateContact(
  carddavUrl: string,
  username: string,
  password: string,
  uid: string,
  contact: CardDavRequest['contact']
): Promise<CardDavContact> {
  const allContacts = await listContacts(carddavUrl, username, password);
  const existingContact = allContacts.find(c => c.uid === uid);
  
  if (!existingContact) {
    throw new Error('Contato não encontrado');
  }
  
  const normalizedUrl = normalizeCardDavUrl(carddavUrl);
  const vcard = generateVCard(contact, uid);
  const baseUrl = new URL(normalizedUrl);
  const vcardUrl = existingContact.href 
    ? (existingContact.href.startsWith('http') ? existingContact.href : `${baseUrl.origin}${existingContact.href}`)
    : `${normalizedUrl.replace(/\/$/, '')}/${uid.replace('@carddav', '')}.vcf`;
  
  console.log('[CardDAV] Atualizando contato em:', vcardUrl);
  
  const authHeader = 'Basic ' + btoa(`${username}:${password}`);
  
  const response = await davFetch(vcardUrl, {
    method: 'PUT',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'text/vcard; charset=utf-8'
    },
    body: vcard
  });

  if (!response.ok && response.status !== 204) {
    const responseText = await response.text();
    throw createDetailedError('atualizar contato', response.status, response.statusText, responseText, response.headers);
  }

  console.log('[CardDAV] Contato atualizado com sucesso');
  
  const updatedContact = parseVCard(vcard, vcardUrl);
  if (!updatedContact) {
    throw new Error('Erro ao parsear contato atualizado');
  }
  
  return updatedContact;
}

// Deletar contato
async function deleteContact(
  carddavUrl: string,
  username: string,
  password: string,
  uid: string
): Promise<void> {
  const allContacts = await listContacts(carddavUrl, username, password);
  const existingContact = allContacts.find(c => c.uid === uid);
  
  if (!existingContact) {
    throw new Error('Contato não encontrado');
  }
  
  const normalizedUrl = normalizeCardDavUrl(carddavUrl);
  const baseUrl = new URL(normalizedUrl);
  const vcardUrl = existingContact.href 
    ? (existingContact.href.startsWith('http') ? existingContact.href : `${baseUrl.origin}${existingContact.href}`)
    : `${normalizedUrl.replace(/\/$/, '')}/${uid.replace('@carddav', '')}.vcf`;
  
  console.log('[CardDAV] Deletando contato:', vcardUrl);
  
  const authHeader = 'Basic ' + btoa(`${username}:${password}`);
  
  const response = await davFetch(vcardUrl, {
    method: 'DELETE',
    headers: {
      'Authorization': authHeader
    }
  });

  if (!response.ok && response.status !== 204 && response.status !== 404) {
    const responseText = await response.text();
    throw createDetailedError('deletar contato', response.status, response.statusText, responseText, response.headers);
  }

  console.log('[CardDAV] Contato deletado com sucesso');
}

// Testar conexão CardDAV com múltiplas variações de URL
async function testConnection(
  carddavUrl: string,
  username: string,
  password: string
): Promise<{ success: boolean; message: string; contactCount?: number; workingUrl?: string }> {
  console.log('[CardDAV] Testando conexão com URL:', carddavUrl);
  console.log('[CardDAV] Usuário:', username);
  
  // Validação básica da URL
  if (!carddavUrl || !carddavUrl.startsWith('http')) {
    return {
      success: false,
      message: 'URL inválida. Deve começar com http:// ou https://'
    };
  }
  
  // Validação de credenciais
  if (!username || !password) {
    return {
      success: false,
      message: 'Usuário e senha são obrigatórios'
    };
  }
  
  const authHeader = 'Basic ' + btoa(`${username}:${password}`);
  
  // Gerar variações de URL para tentar
  const urlVariations = generateUrlVariations(carddavUrl);
  console.log('[CardDAV] Tentando', urlVariations.length, 'variações de URL');
  
  let lastError = '';
  let lastStatus = 0;
  
  for (const testUrl of urlVariations) {
    console.log('[CardDAV] Testando variação:', testUrl);
    
    try {
      // Teste rápido de conectividade com PROPFIND Depth 0
      const testResponse = await davFetch(testUrl, {
        method: 'PROPFIND',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/xml; charset=utf-8',
          'Depth': '0'
        },
        body: `<?xml version="1.0" encoding="utf-8"?>
<d:propfind xmlns:d="DAV:">
  <d:prop>
    <d:displayname/>
    <d:resourcetype/>
  </d:prop>
</d:propfind>`
      });
      
      console.log('[CardDAV] Resposta para', testUrl, ':', testResponse.status);
      lastStatus = testResponse.status;
      
      // Se for 207 (Multi-Status) ou 200, a URL funciona!
      if (testResponse.status === 207 || testResponse.status === 200) {
        console.log('[CardDAV] URL funcionou! Tentando listar contatos...');
        
        try {
          // Tentar listar contatos com esta URL
          const contacts = await listContacts(testUrl.replace(/\/$/, ''), username, password);
          return {
            success: true,
            message: `Conexão OK! ${contacts.length} contato(s) encontrado(s).`,
            contactCount: contacts.length,
            workingUrl: testUrl.replace(/\/$/, '')
          };
        } catch (listError) {
          console.log('[CardDAV] Listar falhou, mas conexão OK:', listError);
          // Conexão OK, mas listar falhou - pode ser addressbook vazio
          return {
            success: true,
            message: 'Conexão OK! 0 contato(s) encontrado(s).',
            contactCount: 0,
            workingUrl: testUrl.replace(/\/$/, '')
          };
        }
      }
      
      // Guardar erro para mensagem final
      if (testResponse.status === 401) {
        lastError = 'Credenciais inválidas. Verifique usuário e senha.';
      } else if (testResponse.status === 403) {
        lastError = 'Acesso negado.';
      } else if (testResponse.status === 404) {
        lastError = 'URL não encontrada.';
      } else if (testResponse.status === 405) {
        lastError = 'Método não suportado pelo servidor.';
      } else {
        lastError = `Erro ${testResponse.status}: ${testResponse.statusText}`;
      }
      
    } catch (error: unknown) {
      console.error('[CardDAV] Erro ao testar', testUrl, ':', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        lastError = 'Erro de rede. Verifique se a URL está acessível.';
      } else if (error instanceof Error) {
        lastError = error.message;
      }
    }
  }
  
  // Nenhuma variação funcionou - dar dicas específicas para cPanel
  let message = lastError || 'Não foi possível conectar ao CardDAV.';
  
  if (lastStatus === 403) {
    message = `Acesso negado (403). Dicas para cPanel:
1. Acesse o webmail e crie um contato manualmente primeiro
2. Verifique se CardDAV está habilitado na conta
3. Tente a URL: https://mail.seudominio.com:2080/addressbooks/${encodeURIComponent(username)}/addressbook`;
  }
  
  return {
    success: false,
    message
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: CardDavRequest = await req.json();
    const { conta_id, action, contact, uid, query, carddav_url: directUrl, carddav_usuario: directUser, carddav_senha: directPass } = body;

    console.log('[CardDAV] Ação:', action, 'Conta:', conta_id || '(direto)');

    let carddavUrl: string;
    let carddavUsuario: string;
    let password: string;

    // Se for teste direto (sem conta_id), usar credenciais fornecidas
    if (action === 'test' && directUrl && directUser && directPass) {
      console.log('[CardDAV] Teste direto com credenciais fornecidas');
      carddavUrl = directUrl;
      carddavUsuario = directUser;
      password = directPass;
    } else if (conta_id) {
      // Buscar dados da conta no banco
      const { data: conta, error: contaError } = await supabase
        .from('email_contas')
        .select('carddav_url, carddav_usuario, carddav_senha_criptografada')
        .eq('id', conta_id)
        .single();

      if (contaError || !conta) {
        throw new Error('Conta de email não encontrada');
      }

      if (!conta.carddav_url || !conta.carddav_usuario || !conta.carddav_senha_criptografada) {
        throw new Error('CardDAV não configurado para esta conta');
      }

      carddavUrl = conta.carddav_url;
      carddavUsuario = conta.carddav_usuario;
      password = await decryptPassword(conta.carddav_senha_criptografada);
    } else {
      throw new Error('É necessário fornecer conta_id ou credenciais diretas para teste');
    }

    let result: { 
      success: boolean; 
      contacts?: CardDavContact[]; 
      contact?: CardDavContact; 
      error?: string;
      message?: string;
      contactCount?: number;
    };

    switch (action) {
      case 'list':
        const contacts = await listContacts(carddavUrl, carddavUsuario, password);
        result = { success: true, contacts };
        break;

      case 'search':
        if (!query) {
          throw new Error('Query de busca é obrigatória');
        }
        const searchResults = await searchContacts(carddavUrl, carddavUsuario, password, query);
        result = { success: true, contacts: searchResults };
        break;

      case 'create':
        if (!contact) {
          throw new Error('Dados do contato são obrigatórios');
        }
        const createdContact = await createContact(carddavUrl, carddavUsuario, password, contact);
        result = { success: true, contact: createdContact };
        break;

      case 'update':
        if (!uid || !contact) {
          throw new Error('UID e dados do contato são obrigatórios');
        }
        const updatedContact = await updateContact(carddavUrl, carddavUsuario, password, uid, contact);
        result = { success: true, contact: updatedContact };
        break;

      case 'delete':
        if (!uid) {
          throw new Error('UID do contato é obrigatório');
        }
        await deleteContact(carddavUrl, carddavUsuario, password, uid);
        result = { success: true };
        break;

      case 'get':
        if (!uid) {
          throw new Error('UID do contato é obrigatório');
        }
        const allContacts = await listContacts(carddavUrl, carddavUsuario, password);
        const foundContact = allContacts.find(c => c.uid === uid);
        if (!foundContact) {
          throw new Error('Contato não encontrado');
        }
        result = { success: true, contact: foundContact };
        break;

      case 'test':
        const testResult = await testConnection(carddavUrl, carddavUsuario, password);
        result = { 
          success: testResult.success, 
          message: testResult.message,
          contactCount: testResult.contactCount
        };
        break;

      default:
        throw new Error('Ação inválida');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[CardDAV] Erro:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 // Retornar 200 mesmo com erro para evitar problemas de CORS
      }
    );
  }
});
