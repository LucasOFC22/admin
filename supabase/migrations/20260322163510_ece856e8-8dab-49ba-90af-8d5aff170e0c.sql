
ALTER TABLE public.tabelas_frete 
  ADD COLUMN IF NOT EXISTS cliente_nome text,
  ADD COLUMN IF NOT EXISTS cnpj text,
  ADD COLUMN IF NOT EXISTS arquivo_url text,
  ADD COLUMN IF NOT EXISTS arquivo_nome text,
  ADD COLUMN IF NOT EXISTS arquivo_tipo text,
  ADD COLUMN IF NOT EXISTS arquivo_tamanho bigint;

INSERT INTO storage.buckets (id, name, public)
VALUES ('tabelas-frete', 'tabelas-frete', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload freight files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'tabelas-frete');

CREATE POLICY "Authenticated users can read freight files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'tabelas-frete');

CREATE POLICY "Authenticated users can delete freight files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'tabelas-frete');

CREATE POLICY "Public can read freight files"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'tabelas-frete');
