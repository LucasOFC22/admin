
-- Tabela principal de tabelas de frete
CREATE TABLE public.tabelas_frete (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  dados JSONB NOT NULL DEFAULT '[]'::jsonb,
  colunas JSONB NOT NULL DEFAULT '[]'::jsonb,
  criado_por UUID REFERENCES public.usuarios(id),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_por UUID REFERENCES public.usuarios(id),
  ativo BOOLEAN NOT NULL DEFAULT true
);

-- Logs de alterações nas tabelas de frete
CREATE TABLE public.logs_tabelas_frete (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tabela_frete_id UUID REFERENCES public.tabelas_frete(id) ON DELETE CASCADE NOT NULL,
  usuario_id UUID REFERENCES public.usuarios(id),
  usuario_nome TEXT,
  acao TEXT NOT NULL,
  detalhes JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.tabelas_frete ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_tabelas_frete ENABLE ROW LEVEL SECURITY;

-- Policies tabelas_frete
CREATE POLICY "Admins podem ver tabelas_frete" ON public.tabelas_frete
  FOR SELECT TO authenticated USING (public.is_active_user());

CREATE POLICY "Admins podem inserir tabelas_frete" ON public.tabelas_frete
  FOR INSERT TO authenticated WITH CHECK (public.is_active_user());

CREATE POLICY "Admins podem atualizar tabelas_frete" ON public.tabelas_frete
  FOR UPDATE TO authenticated USING (public.is_active_user());

CREATE POLICY "Admins podem deletar tabelas_frete" ON public.tabelas_frete
  FOR DELETE TO authenticated USING (public.is_active_user());

-- Policies logs_tabelas_frete
CREATE POLICY "Admins podem ver logs_tabelas_frete" ON public.logs_tabelas_frete
  FOR SELECT TO authenticated USING (public.is_active_user());

CREATE POLICY "Admins podem inserir logs_tabelas_frete" ON public.logs_tabelas_frete
  FOR INSERT TO authenticated WITH CHECK (public.is_active_user());

-- Trigger para atualizar atualizado_em
CREATE TRIGGER update_tabelas_frete_updated_at
  BEFORE UPDATE ON public.tabelas_frete
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- Indexes
CREATE INDEX idx_tabelas_frete_ativo ON public.tabelas_frete(ativo);
CREATE INDEX idx_logs_tabelas_frete_tabela ON public.logs_tabelas_frete(tabela_frete_id);
CREATE INDEX idx_logs_tabelas_frete_created ON public.logs_tabelas_frete(created_at DESC);
