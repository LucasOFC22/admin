
export const generateSQLScript = (): string => {
  return `
-- ============================================================
-- Script SQL para FP Transcargas
-- Schema: public
-- ============================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- TABELAS PRINCIPAIS
-- ============================================================

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS public.usuarios (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  telefone VARCHAR(50),
  cnpjcpf VARCHAR(50),
  cargo INTEGER NOT NULL,
  acesso_area_cliente BOOLEAN DEFAULT false,
  acesso_area_admin BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  supabase_id UUID UNIQUE,
  nivel_hierarquico INTEGER,
  data_criacao TIMESTAMPTZ DEFAULT NOW(),
  data_ultima_atividade TIMESTAMPTZ,
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de cargos
CREATE TABLE IF NOT EXISTS public.cargos (
  id BIGSERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  permissoes TEXT[] DEFAULT '{}',
  pode_excluir BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  level INTEGER,
  descricao TEXT,
  departamento INTEGER,
  ativo BOOLEAN DEFAULT true
);

-- Tabela de departamentos de cargos
CREATE TABLE IF NOT EXISTS public.cargos_departamento (
  id BIGSERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de permissões
CREATE TABLE IF NOT EXISTS public.permissions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  category TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  critical BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de cotações
CREATE TABLE IF NOT EXISTS public.cotacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id_cotacao VARCHAR(100) UNIQUE,
  status VARCHAR(50) DEFAULT 'pendente',
  origem VARCHAR(255),
  destino VARCHAR(255),
  descricao_carga TEXT,
  peso DECIMAL(10,2),
  valor_declarado DECIMAL(12,2),
  dimensoes JSONB,
  remetente JSONB,
  destinatario JSONB,
  contato JSONB,
  coleta JSONB,
  valor_proposta DECIMAL(12,2),
  data_proposta TIMESTAMPTZ,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de contatos
CREATE TABLE IF NOT EXISTS public.contatos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(50),
  empresa VARCHAR(255),
  departamento VARCHAR(100),
  assunto VARCHAR(255),
  mensagem TEXT,
  status VARCHAR(50) DEFAULT 'novo',
  respondido BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de logs de atividade
CREATE TABLE IF NOT EXISTS public.logs_atividade (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id BIGINT REFERENCES public.usuarios(id),
  acao VARCHAR(255) NOT NULL,
  modulo VARCHAR(100),
  detalhes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de configurações
CREATE TABLE IF NOT EXISTS public.configuracoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chave VARCHAR(255) UNIQUE NOT NULL,
  valor JSONB,
  categoria VARCHAR(100),
  descricao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON public.usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_cargo ON public.usuarios(cargo);
CREATE INDEX IF NOT EXISTS idx_usuarios_supabase_id ON public.usuarios(supabase_id);
CREATE INDEX IF NOT EXISTS idx_cargos_ativo ON public.cargos(ativo);
CREATE INDEX IF NOT EXISTS idx_permissions_category ON public.permissions(category);
CREATE INDEX IF NOT EXISTS idx_permissions_active ON public.permissions(active);
CREATE INDEX IF NOT EXISTS idx_cotacoes_status ON public.cotacoes(status);
CREATE INDEX IF NOT EXISTS idx_cotacoes_criado_em ON public.cotacoes(criado_em);
CREATE INDEX IF NOT EXISTS idx_contatos_status ON public.contatos(status);
CREATE INDEX IF NOT EXISTS idx_contatos_created_at ON public.contatos(created_at);
CREATE INDEX IF NOT EXISTS idx_logs_usuario_id ON public.logs_atividade(usuario_id);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON public.logs_atividade(created_at);
CREATE INDEX IF NOT EXISTS idx_configuracoes_chave ON public.configuracoes(chave);

-- ============================================================
-- SISTEMA DE ROLES (SEGURANÇA)
-- ============================================================

-- Criar enum para roles
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Função para verificar role usando tabela usuarios (SECURITY DEFINER para evitar recursão em RLS)
-- Usa as colunas acesso_area_admin e nivel_hierarquico da tabela usuarios
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN _role = 'admin' THEN 
      EXISTS (
        SELECT 1 FROM public.usuarios
        WHERE supabase_id = _user_id 
        AND acesso_area_admin = true
        AND ativo = true
      )
    WHEN _role = 'moderator' THEN 
      EXISTS (
        SELECT 1 FROM public.usuarios
        WHERE supabase_id = _user_id 
        AND nivel_hierarquico >= 5
        AND ativo = true
      )
    WHEN _role = 'user' THEN 
      EXISTS (
        SELECT 1 FROM public.usuarios
        WHERE supabase_id = _user_id 
        AND ativo = true
      )
    ELSE false
  END
$$;

-- Função auxiliar is_admin() para uso simplificado
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE supabase_id = auth.uid()
    AND acesso_area_admin = true
    AND ativo = true
  )
$$;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cargos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cargos_departamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_atividade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;
-- Nota: user_roles não é mais necessária, roles são gerenciados via tabela usuarios

-- ============================================================
-- POLÍTICAS RLS - USUARIOS
-- ============================================================

CREATE POLICY "usuarios_select_auth"
  ON public.usuarios FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "usuarios_update_owner_or_admin"
  ON public.usuarios FOR UPDATE
  TO authenticated
  USING (auth.uid() = supabase_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = supabase_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "usuarios_insert_admin"
  ON public.usuarios FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "usuarios_delete_admin"
  ON public.usuarios FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- POLÍTICAS RLS - CARGOS
-- ============================================================

CREATE POLICY "cargos_select_auth"
  ON public.cargos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "cargos_write_admin"
  ON public.cargos FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- POLÍTICAS RLS - PERMISSIONS
-- ============================================================

CREATE POLICY "permissions_select_auth"
  ON public.permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "permissions_write_admin"
  ON public.permissions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- POLÍTICAS RLS - OUTRAS TABELAS (básicas)
-- ============================================================

CREATE POLICY "select_authenticated_cotacoes"
  ON public.cotacoes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "write_admin_cotacoes"
  ON public.cotacoes FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "select_authenticated_contatos"
  ON public.contatos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "write_admin_contatos"
  ON public.contatos FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "select_authenticated_logs"
  ON public.logs_atividade FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "insert_authenticated_logs"
  ON public.logs_atividade FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "select_authenticated_config"
  ON public.configuracoes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "write_admin_config"
  ON public.configuracoes FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "departamentos_select_auth"
  ON public.cargos_departamento FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "departamentos_write_admin"
  ON public.cargos_departamento FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- DADOS INICIAIS
-- ============================================================

-- Configurações padrão do sistema
INSERT INTO public.configuracoes (chave, valor, categoria, descricao) VALUES
  ('sistema.nome', '"FP Transcargas"', 'sistema', 'Nome do sistema'),
  ('sistema.versao', '"1.0.0"', 'sistema', 'Versão do sistema'),
  ('notificacoes.email_habilitado', 'true', 'notificacoes', 'Habilitar notificações por email'),
  ('cotacoes.validade_padrao', '15', 'cotacoes', 'Validade padrão das cotações em dias')
ON CONFLICT (chave) DO NOTHING;

-- ============================================================
-- INSTRUÇÕES FINAIS
-- ============================================================

-- Execute este script no SQL Editor do Supabase
-- Após a execução, as tabelas estarão criadas com RLS ativo
-- Configure roles de admin diretamente na tabela usuarios via:
-- UPDATE public.usuarios SET acesso_area_admin = true WHERE email = 'admin@exemplo.com';
  `.trim();
};

export const testSupabaseConnection = async (url: string, key: string): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('🔧 Testando conexão real com Supabase:', url);
    
    if (!url || !key) {
      return { success: false, message: 'URL e chave são obrigatórios' };
    }

    // Import dinâmico para usar a configuração específica
    const { createClient } = await import('@supabase/supabase-js');
    const testClient = createClient(url, key, {
      db: { schema: 'public' }
    });

    // Teste real da conexão usando schema public explicitamente
    const { error } = await testClient
      .schema('public')
      .from('usuarios')
      .select('id')
      .limit(1);

    if (error) {
      // Se o erro for "relation does not exist" (42P01), a conexão está OK, apenas faltam tabelas
      if ((error as any).code === '42P01') {
        console.log('✅ Conexão OK - Tabelas ainda não criadas');
        return {
          success: true,
          message: 'Conexão estabelecida com sucesso! As tabelas ainda não existem. Clique em "Gerar SQL" e execute o script no SQL Editor do Supabase.'
        };
      }
      
      console.error('❌ Erro na conexão Supabase:', error);
      return {
        success: false,
        message: `Erro na conexão: ${error.message}`
      };
    }

    console.log('✅ Conexão Supabase testada com sucesso');
    return {
      success: true,
      message: 'Conexão estabelecida com sucesso! Supabase está funcionando.'
    };
  } catch (error) {
    console.error('❌ Erro ao testar conexão:', error);
    return {
      success: false,
      message: 'Erro inesperado ao testar conexão'
    };
  }
};

export const createSupabaseTables = async (url: string, key: string, sqlScript: string): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('🏗️ Verificando estrutura de tabelas no Supabase...');
    
    if (!url || !key || !sqlScript) {
      return { success: false, message: 'Configuração incompleta' };
    }

    // Import dinâmico para usar a configuração específica  
    const { createClient } = await import('@supabase/supabase-js');
    const testClient = createClient(url, key, {
      db: { schema: 'public' }
    });

    // Verificar se as tabelas principais existem (incluindo permissions, cargos, etc.)
    const tablesToCheck = [
      'usuarios', 
      'cargos', 
      'cargos_departamento',
      'permissions',
      'cotacoes', 
      'contatos', 
      'logs_atividade', 
      'configuracoes'
    ];
    const results = [];

    for (const tableName of tablesToCheck) {
      try {
        const { error } = await testClient
          .schema('public')
          .from(tableName)
          .select('*')
          .limit(0);
        
        if (error) {
          if ((error as any).code === '42P01') {
            results.push(`❌ public.${tableName}: Não existe`);
          } else {
            results.push(`⚠️ public.${tableName}: ${error.message}`);
          }
        } else {
          results.push(`✅ public.${tableName}: OK`);
        }
      } catch (err) {
        results.push(`❌ public.${tableName}: Erro na verificação`);
      }
    }

    const allTablesExist = results.every(r => r.startsWith('✅'));
    const message = allTablesExist
      ? `✅ Todas as tabelas existem e estão acessíveis!\n\n${results.join('\n')}`
      : `Verificação concluída. Algumas tabelas precisam ser criadas:\n\n${results.join('\n')}\n\n📋 Para criar as tabelas faltantes:\n1. Copie o script SQL gerado acima\n2. Abra o SQL Editor no painel do Supabase\n3. Cole e execute o script\n4. Volte aqui e clique em "Criar Tabelas" novamente para verificar`;

    console.log('✅ Verificação de estrutura concluída:', results);
    return {
      success: true,
      message
    };
  } catch (error) {
    console.error('❌ Erro ao verificar tabelas:', error);
    return {
      success: false,
      message: 'Erro inesperado ao verificar estrutura'
    };
  }
};
