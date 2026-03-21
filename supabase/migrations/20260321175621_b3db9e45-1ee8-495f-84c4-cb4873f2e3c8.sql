
-- Tabela para configurações SMTP de cotação
CREATE TABLE public.config_smtp (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  host text NOT NULL DEFAULT '',
  port integer NOT NULL DEFAULT 587,
  secure boolean NOT NULL DEFAULT true,
  usuario text NOT NULL DEFAULT '',
  senha text NOT NULL DEFAULT '',
  from_name text NOT NULL DEFAULT 'FP Transcargas',
  from_email text NOT NULL DEFAULT 'noreply@fptranscargas.com.br',
  validade_dias integer NOT NULL DEFAULT 15,
  tamanho_max_arquivo integer NOT NULL DEFAULT 10,
  notificar_nova_cotacao boolean NOT NULL DEFAULT true,
  notificar_proposta_enviada boolean NOT NULL DEFAULT true,
  notificacoes_email boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.config_smtp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ler config_smtp"
  ON public.config_smtp FOR SELECT TO authenticated
  USING (public.is_active_user());

CREATE POLICY "Admins podem inserir config_smtp"
  ON public.config_smtp FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins podem atualizar config_smtp"
  ON public.config_smtp FOR UPDATE TO authenticated
  USING (public.is_admin());

CREATE TRIGGER update_config_smtp_updated_at
  BEFORE UPDATE ON public.config_smtp
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

INSERT INTO public.config_smtp (host, usuario, senha, from_name, from_email)
VALUES ('', '', '', 'FP Transcargas', 'noreply@fptranscargas.com.br');
