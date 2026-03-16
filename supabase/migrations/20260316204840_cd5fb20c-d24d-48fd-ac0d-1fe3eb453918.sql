-- Fix remaining permissive policies

-- contatos: public contact form but add basic validation
DROP POLICY IF EXISTS "Public can insert contatos" ON contatos;
CREATE POLICY "Public can insert contatos" ON contatos
  FOR INSERT TO anon, authenticated 
  WITH CHECK (name IS NOT NULL AND email IS NOT NULL AND message IS NOT NULL);

-- logs_autenticacao: needs anon for login attempts, but add basic check
DROP POLICY IF EXISTS "Anyone can insert logs_autenticacao" ON logs_autenticacao;
CREATE POLICY "Anyone can insert logs_autenticacao" ON logs_autenticacao
  FOR INSERT TO anon, authenticated 
  WITH CHECK (tipo_de_acao IS NOT NULL);

-- vagas_emprego_candidaturas: public job applications
DROP POLICY IF EXISTS "Public can apply to jobs" ON vagas_emprego_candidaturas;
CREATE POLICY "Public can apply to jobs" ON vagas_emprego_candidaturas
  FOR INSERT TO anon, authenticated 
  WITH CHECK (telefone IS NOT NULL OR email IS NOT NULL);