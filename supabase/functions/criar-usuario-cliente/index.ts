import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

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
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // ========== AUTENTICAÇÃO E AUTORIZAÇÃO ==========
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Não autorizado. Token ausente.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Verificar o JWT do chamador usando o anon key (valida o token do usuário logado)
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: callerUser }, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !callerUser) {
      console.error('[criar-usuario-cliente] Token inválido:', authError?.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Não autorizado. Token inválido.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Usar service role para operações administrativas
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verificar se o chamador é admin
    const { data: callerData, error: callerError } = await supabase
      .from('usuarios')
      .select('id, acesso_area_admin, ativo')
      .eq('supabase_id', callerUser.id)
      .single();

    if (callerError || !callerData || !callerData.acesso_area_admin || !callerData.ativo) {
      console.error('[criar-usuario-cliente] Acesso negado - usuário não é admin:', callerUser.id);
      return new Response(
        JSON.stringify({ success: false, error: 'Acesso negado. Apenas administradores podem criar usuários.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: RequestBody = await req.json();
    const { email, cnpjcpf, cargo, nome, telefone } = body;

    console.log('[criar-usuario-cliente] Admin', callerData.id, 'criando usuário:', { email, cargo, cnpjcpf_count: cnpjcpf?.length });

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

    // ========== CRIAR USUÁRIO COM SENHA ALEATÓRIA DE 8 DÍGITOS ==========

    // Gerar senha aleatória de 8 dígitos numéricos
    const randomPassword = Array.from(crypto.getRandomValues(new Uint32Array(8)))
      .map(v => (v % 10).toString())
      .join('');

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password: randomPassword,
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
    console.log('[criar-usuario-cliente] Usuário criado no Auth:', authData.user.id);

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
      nome: nomeClean || email.split('@')[0],
      email: email.toLowerCase(),
      telefone: telefoneClean,
      cnpjcpf: cnpjcpfData,
      cargo: cargo,
      acesso_area_cliente: true,
      acesso_area_admin: false,
      ativo: true,
      supabase_id: authData.user.id,
      nivel_hierarquico: cargoInfo.level || 10,
    };

    console.log('[criar-usuario-cliente] Dados do usuário preparados:', { 
      id: usuarioId,
      nome: usuarioData.nome, 
      telefone: usuarioData.telefone,
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
