import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SENHA_PADRAO = 'fpcargas';

interface RequestBody {
  email: string;
  cnpjcpf: string[];
  cargo: number;
  nome?: string;
  telefone?: string;
}

interface Cargo {
  id: number;
  nome: string;
  level?: number;
}

// Função para detectar templates não resolvidos como {{nome}} ou {{telefone}}
function isUnresolvedTemplate(value: any): boolean {
  if (typeof value !== 'string') return false;
  return value.includes('{{') && value.includes('}}');
}

// Função para limpar valores de template não resolvidos
function cleanTemplateValue(value: any, fallback: any = null): any {
  if (value === undefined || value === null || value === '' || isUnresolvedTemplate(value)) {
    return fallback;
  }
  return value;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const body: RequestBody = await req.json();
    const { email, cnpjcpf, cargo, nome, telefone } = body;

    console.log('[criar-usuario-cliente] Iniciando criação de usuário:', { email, cargo, cnpjcpf_count: cnpjcpf?.length });

    // ========== VALIDAÇÕES ==========

    // Validar email
    if (!email || typeof email !== 'string') {
      console.error('[criar-usuario-cliente] Email não fornecido ou inválido');
      return new Response(
        JSON.stringify({ success: false, error: 'Email é obrigatório.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('[criar-usuario-cliente] Formato de email inválido:', email);
      return new Response(
        JSON.stringify({ success: false, error: 'Formato de email inválido.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar cnpjcpf
    if (!cnpjcpf || !Array.isArray(cnpjcpf) || cnpjcpf.length === 0) {
      console.error('[criar-usuario-cliente] CNPJ/CPF não fornecido ou inválido');
      return new Response(
        JSON.stringify({ success: false, error: 'Pelo menos um CNPJ/CPF é obrigatório.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar cargo
    if (!cargo || typeof cargo !== 'number') {
      console.error('[criar-usuario-cliente] Cargo não fornecido ou inválido');
      return new Response(
        JSON.stringify({ success: false, error: 'Cargo (ID) é obrigatório.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se o cargo existe
    const { data: cargoData, error: cargoError } = await supabase
      .from('cargos')
      .select('id, nome, level')
      .eq('id', cargo)
      .single();

    if (cargoError || !cargoData) {
      console.error('[criar-usuario-cliente] Cargo não encontrado:', cargo, cargoError);
      return new Response(
        JSON.stringify({ success: false, error: `Cargo com ID ${cargo} não encontrado.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cargoInfo = cargoData as Cargo;
    console.log('[criar-usuario-cliente] Cargo encontrado:', cargoInfo);

    // ========== VERIFICAR EMAIL DUPLICADO ==========

    // Verificar no Supabase Auth
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('[criar-usuario-cliente] Erro ao verificar usuários existentes:', listError);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao verificar usuários existentes.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailExists = existingUsers.users.some(user => user.email?.toLowerCase() === email.toLowerCase());
    
    if (emailExists) {
      console.error('[criar-usuario-cliente] Email já cadastrado:', email);
      return new Response(
        JSON.stringify({ success: false, error: 'Este email já está cadastrado no sistema.' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar também na tabela usuarios
    const { data: existingUsuario } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (existingUsuario) {
      console.error('[criar-usuario-cliente] Email já existe na tabela usuarios:', email);
      return new Response(
        JSON.stringify({ success: false, error: 'Este email já está cadastrado no sistema.' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========== CRIAR USUÁRIO NO SUPABASE AUTH ==========

    // Criar usuário com signUp para enviar email de confirmação automaticamente
    // (igual ao fluxo de /admin/gerenciar-usuarios)
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password: SENHA_PADRAO,
      options: {
        emailRedirectTo: "https://fptranscargas.com.br/",
        data: {
          nome: nome || email.split('@')[0],
          cargo: cargo
        }
      }
    });

    if (signUpError) {
      console.error('[criar-usuario-cliente] Erro ao criar usuário no Auth:', signUpError);
      
      // Tratar erro de rate limit
      if (signUpError.status === 429 || signUpError.message?.includes('security purposes')) {
        const match = signUpError.message?.match(/after (\d+) seconds/);
        const seconds = match ? match[1] : '60';
        return new Response(
          JSON.stringify({ success: false, error: `Aguarde ${seconds} segundos antes de tentar criar outro usuário.` }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Tratar email duplicado
      if (signUpError.message?.includes('already registered')) {
        return new Response(
          JSON.stringify({ success: false, error: 'Este email já está cadastrado no sistema.' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: false, error: signUpError.message || 'Erro ao criar usuário.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!signUpData.user) {
      console.error('[criar-usuario-cliente] Usuário não retornado após signUp');
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao criar usuário: dados não retornados.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authData = { user: signUpData.user };
    console.log('[criar-usuario-cliente] Usuário criado no Auth com email de confirmação:', authData.user.id);

    // ========== CRIAR REGISTRO NA TABELA USUARIOS ==========

    // Limpar valores de template não resolvidos
    const nomeClean = cleanTemplateValue(nome, null);
    const telefoneClean = cleanTemplateValue(telefone, null);

    const cnpjcpfData = {
      cnpjcpf: cnpjcpf,
      cnpjcpf_atual: cnpjcpf[0] // Primeiro da lista como padrão
    };

    // Gerar ID único para o usuário
    const usuarioId = crypto.randomUUID();

    const usuarioData = {
      id: usuarioId,
      nome: nomeClean || email.split('@')[0], // Usa parte do email se nome não fornecido
      email: email.toLowerCase(),
      telefone: telefoneClean, // null se não fornecido ou template não resolvido
      cnpjcpf: cnpjcpfData,
      cargo: cargo,
      acesso_area_cliente: true,
      acesso_area_admin: false,
      ativo: true,
      supabase_id: authData.user.id,
      nivel_hierarquico: cargoInfo.level || 10, // Usa level do cargo ou 10 como padrão
    };

    console.log('[criar-usuario-cliente] Dados do usuário preparados:', { 
      id: usuarioId,
      nome: usuarioData.nome, 
      telefone: usuarioData.telefone,
      nome_original: nome,
      telefone_original: telefone
    });

    const { data: usuarioCreated, error: usuarioError } = await supabase
      .from('usuarios')
      .insert(usuarioData)
      .select('id')
      .single();

    if (usuarioError) {
      console.error('[criar-usuario-cliente] Erro ao criar registro na tabela usuarios:', usuarioError);
      
      // Rollback: deletar usuário do Auth
      await supabase.auth.admin.deleteUser(authData.user.id);
      console.log('[criar-usuario-cliente] Rollback: usuário removido do Auth');

      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao salvar dados do usuário.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[criar-usuario-cliente] Usuário criado com sucesso:', {
      usuario_id: usuarioCreated.id,
      supabase_id: authData.user.id,
      email: email
    });

    // ========== SUCESSO ==========

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          usuario_id: usuarioCreated.id,
          supabase_id: authData.user.id,
          email: email.toLowerCase(),
          cargo: cargoInfo.nome,
          mensagem: 'Usuário criado. Email de confirmação enviado.'
        }
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[criar-usuario-cliente] Erro inesperado:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro interno do servidor.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
