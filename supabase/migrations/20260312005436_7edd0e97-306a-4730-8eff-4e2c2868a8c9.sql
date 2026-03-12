-- Habilitar RLS na tabela campanhas_envios_pendentes
ALTER TABLE public.campanhas_envios_pendentes ENABLE ROW LEVEL SECURITY;

-- Política: apenas usuários autenticados com acesso admin podem gerenciar
CREATE POLICY "Admin full access on campanhas_envios_pendentes"
ON public.campanhas_envios_pendentes
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Política de leitura para service role (edge functions)
CREATE POLICY "Service role access on campanhas_envios_pendentes"
ON public.campanhas_envios_pendentes
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);