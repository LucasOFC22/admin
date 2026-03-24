-- Tabela principal de avarias (por MDF-e)
CREATE TABLE public.avarias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mdfe text NOT NULL,
  motorista_nome text NOT NULL,
  observacoes text,
  criado_por uuid REFERENCES public.usuarios(id),
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now(),
  ativo boolean DEFAULT true
);

-- Itens de avaria (NF-e + valor)
CREATE TABLE public.avaria_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  avaria_id uuid NOT NULL REFERENCES public.avarias(id) ON DELETE CASCADE,
  nfe text NOT NULL,
  valor numeric(12,2) NOT NULL DEFAULT 0,
  descricao text,
  criado_em timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.avarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaria_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view avarias" ON public.avarias
  FOR SELECT TO authenticated USING (public.is_active_user());

CREATE POLICY "Authenticated users can insert avarias" ON public.avarias
  FOR INSERT TO authenticated WITH CHECK (public.is_active_user());

CREATE POLICY "Authenticated users can update avarias" ON public.avarias
  FOR UPDATE TO authenticated USING (public.is_active_user());

CREATE POLICY "Authenticated users can view avaria_itens" ON public.avaria_itens
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert avaria_itens" ON public.avaria_itens
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update avaria_itens" ON public.avaria_itens
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete avaria_itens" ON public.avaria_itens
  FOR DELETE TO authenticated USING (true);

-- Trigger para atualizar timestamp
CREATE TRIGGER update_avarias_updated_at
  BEFORE UPDATE ON public.avarias
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();