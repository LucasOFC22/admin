import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface EncryptRequest {
  senha?: string;
  carddav_senha?: string;
  caldav_senha?: string;
}

interface EncryptResponse {
  senha_criptografada?: string;
  carddav_senha_criptografada?: string;
  caldav_senha_criptografada?: string;
}

// Helper para converter ArrayBuffer para base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper para converter Uint8Array para base64
function uint8ArrayToBase64(arr: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < arr.byteLength; i++) {
    binary += String.fromCharCode(arr[i]);
  }
  return btoa(binary);
}

// Função simples de criptografia usando AES-GCM
async function encryptPassword(password: string): Promise<string> {
  const encryptionKey = Deno.env.get('EMAIL_ENCRYPTION_KEY') || 'default-key-change-me-in-production';
  
  // Criar uma chave derivada do secret
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(encryptionKey.padEnd(32, '0').slice(0, 32)),
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  // Gerar IV aleatório
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Criptografar
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    keyMaterial,
    encoder.encode(password)
  );

  // Combinar IV + dados criptografados e converter para base64
  const encryptedArray = new Uint8Array(encrypted);
  const combined = new Uint8Array(iv.length + encryptedArray.length);
  combined.set(iv);
  combined.set(encryptedArray, iv.length);
  
  return uint8ArrayToBase64(combined);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { senha, carddav_senha, caldav_senha }: EncryptRequest = await req.json();
    
    console.log('Criptografando senhas de email...');
    
    const response: EncryptResponse = {};

    if (senha) {
      response.senha_criptografada = await encryptPassword(senha);
      console.log('Senha principal criptografada');
    }

    if (carddav_senha) {
      response.carddav_senha_criptografada = await encryptPassword(carddav_senha);
      console.log('Senha CardDAV criptografada');
    }

    if (caldav_senha) {
      response.caldav_senha_criptografada = await encryptPassword(caldav_senha);
      console.log('Senha CalDAV criptografada');
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro ao criptografar:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
