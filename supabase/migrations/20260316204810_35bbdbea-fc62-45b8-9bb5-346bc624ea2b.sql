-- FIX: Replace all overly permissive RLS policies with is_active_user() checks

-- LOG TABLES
DROP POLICY IF EXISTS "Usuários podem inserir logs_cargos" ON logs_cargos;
CREATE POLICY "Auth users insert logs_cargos" ON logs_cargos FOR INSERT TO authenticated WITH CHECK (public.is_active_user());

DROP POLICY IF EXISTS "Usuários podem inserir logs_chat_interno" ON logs_chat_interno;
CREATE POLICY "Auth users insert logs_chat_interno" ON logs_chat_interno FOR INSERT TO authenticated WITH CHECK (public.is_active_user());

DROP POLICY IF EXISTS "Usuários podem inserir logs_conexoes" ON logs_conexoes;
CREATE POLICY "Auth users insert logs_conexoes" ON logs_conexoes FOR INSERT TO authenticated WITH CHECK (public.is_active_user());

DROP POLICY IF EXISTS "Usuários podem inserir logs_configuracoes" ON logs_configuracoes;
CREATE POLICY "Auth users insert logs_configuracoes" ON logs_configuracoes FOR INSERT TO authenticated WITH CHECK (public.is_active_user());

DROP POLICY IF EXISTS "Usuários podem inserir logs_contatos" ON logs_contatos;
CREATE POLICY "Auth users insert logs_contatos" ON logs_contatos FOR INSERT TO authenticated WITH CHECK (public.is_active_user());

DROP POLICY IF EXISTS "Usuários podem inserir logs_documentos" ON logs_documentos;
CREATE POLICY "Auth users insert logs_documentos" ON logs_documentos FOR INSERT TO authenticated WITH CHECK (public.is_active_user());

DROP POLICY IF EXISTS "Usuários podem inserir logs_email" ON logs_email;
CREATE POLICY "Auth users insert logs_email" ON logs_email FOR INSERT TO authenticated WITH CHECK (public.is_active_user());

DROP POLICY IF EXISTS "Usuários podem inserir logs_filas" ON logs_filas;
CREATE POLICY "Auth users insert logs_filas" ON logs_filas FOR INSERT TO authenticated WITH CHECK (public.is_active_user());

DROP POLICY IF EXISTS "Usuários podem inserir logs_flow_builder" ON logs_flow_builder;
CREATE POLICY "Auth users insert logs_flow_builder" ON logs_flow_builder FOR INSERT TO authenticated WITH CHECK (public.is_active_user());

DROP POLICY IF EXISTS "Usuários podem inserir logs_malotes" ON logs_malotes;
CREATE POLICY "Auth users insert logs_malotes" ON logs_malotes FOR INSERT TO authenticated WITH CHECK (public.is_active_user());

DROP POLICY IF EXISTS "logs_mensagens_rapidas_insert_auth" ON logs_mensagens_rapidas;
DROP POLICY IF EXISTS "Usuários podem inserir logs_mensagens_rapidas" ON logs_mensagens_rapidas;
CREATE POLICY "Auth users insert logs_mensagens_rapidas" ON logs_mensagens_rapidas FOR INSERT TO authenticated WITH CHECK (public.is_active_user());

DROP POLICY IF EXISTS "Usuários podem inserir logs_ocorrencia" ON logs_ocorrencia;
DROP POLICY IF EXISTS "logs_ocorrencia_insert_auth" ON logs_ocorrencia;
CREATE POLICY "Auth users insert logs_ocorrencia" ON logs_ocorrencia FOR INSERT TO authenticated WITH CHECK (public.is_active_user());

DROP POLICY IF EXISTS "Usuários podem inserir logs_sistema" ON logs_sistema;
CREATE POLICY "Auth users insert logs_sistema" ON logs_sistema FOR INSERT TO authenticated WITH CHECK (public.is_active_user());

DROP POLICY IF EXISTS "Usuários podem inserir logs_tags" ON logs_tags;
CREATE POLICY "Auth users insert logs_tags" ON logs_tags FOR INSERT TO authenticated WITH CHECK (public.is_active_user());

DROP POLICY IF EXISTS "Usuários autenticados podem inserir logs_usuarios" ON logs_usuarios;
CREATE POLICY "Auth users insert logs_usuarios" ON logs_usuarios FOR INSERT TO authenticated WITH CHECK (public.is_active_user());

DROP POLICY IF EXISTS "System can insert logs_vagas" ON logs_vagas;
CREATE POLICY "Auth users insert logs_vagas" ON logs_vagas FOR INSERT TO authenticated WITH CHECK (public.is_active_user());

DROP POLICY IF EXISTS "Usuários podem inserir logs_whatsapp" ON logs_whatsapp;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir logs" ON logs_whatsapp;
CREATE POLICY "Auth users insert logs_whatsapp" ON logs_whatsapp FOR INSERT TO authenticated WITH CHECK (public.is_active_user());

-- NON-LOG TABLES
DROP POLICY IF EXISTS "authenticated_insert_messages" ON mensagens_whatsapp;
CREATE POLICY "active_users_insert_messages" ON mensagens_whatsapp FOR INSERT TO authenticated WITH CHECK (public.is_active_user());

DROP POLICY IF EXISTS "authenticated_update_messages" ON mensagens_whatsapp;
CREATE POLICY "active_users_update_messages" ON mensagens_whatsapp FOR UPDATE TO authenticated USING (public.is_active_user()) WITH CHECK (public.is_active_user());

DROP POLICY IF EXISTS "ocorrencias_insert_auth" ON ocorrencias;
CREATE POLICY "active_users_insert_ocorrencias" ON ocorrencias FOR INSERT TO authenticated WITH CHECK (public.is_active_user());

DROP POLICY IF EXISTS "solicitacao_acesso_insert_public" ON solicitacao_de_acesso;
CREATE POLICY "auth_users_insert_solicitacao_acesso" ON solicitacao_de_acesso FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Qualquer pessoa pode se candidatar" ON vagas_emprego_candidaturas;
CREATE POLICY "Public can apply to jobs" ON vagas_emprego_candidaturas FOR INSERT TO anon, authenticated WITH CHECK (true);

-- whatsapp_business_hours - consolidate duplicate policies
DROP POLICY IF EXISTS "Allow authenticated delete" ON whatsapp_business_hours;
DROP POLICY IF EXISTS "auth_delete_hours" ON whatsapp_business_hours;
DROP POLICY IF EXISTS "authenticated_delete_business_hours" ON whatsapp_business_hours;
DROP POLICY IF EXISTS "Allow authenticated insert" ON whatsapp_business_hours;
DROP POLICY IF EXISTS "auth_insert_hours" ON whatsapp_business_hours;
DROP POLICY IF EXISTS "authenticated_insert_business_hours" ON whatsapp_business_hours;
DROP POLICY IF EXISTS "Allow authenticated insert business_hours" ON whatsapp_business_hours;
DROP POLICY IF EXISTS "auth_update_hours" ON whatsapp_business_hours;
DROP POLICY IF EXISTS "Allow authenticated update business_hours" ON whatsapp_business_hours;
DROP POLICY IF EXISTS "authenticated_update_business_hours" ON whatsapp_business_hours;
DROP POLICY IF EXISTS "Allow authenticated update" ON whatsapp_business_hours;
CREATE POLICY "admin_insert_business_hours" ON whatsapp_business_hours FOR INSERT TO authenticated WITH CHECK (public.is_active_user());
CREATE POLICY "admin_update_business_hours" ON whatsapp_business_hours FOR UPDATE TO authenticated USING (public.is_active_user()) WITH CHECK (public.is_active_user());
CREATE POLICY "admin_delete_business_hours" ON whatsapp_business_hours FOR DELETE TO authenticated USING (public.is_active_user());

-- whatsapp_holidays - consolidate duplicate policies
DROP POLICY IF EXISTS "authenticated_delete_holidays" ON whatsapp_holidays;
DROP POLICY IF EXISTS "auth_delete_holidays" ON whatsapp_holidays;
DROP POLICY IF EXISTS "Allow authenticated delete holidays" ON whatsapp_holidays;
DROP POLICY IF EXISTS "Allow authenticated delete" ON whatsapp_holidays;
DROP POLICY IF EXISTS "Allow authenticated insert" ON whatsapp_holidays;
DROP POLICY IF EXISTS "authenticated_insert_holidays" ON whatsapp_holidays;
DROP POLICY IF EXISTS "auth_insert_holidays" ON whatsapp_holidays;
DROP POLICY IF EXISTS "Allow authenticated insert holidays" ON whatsapp_holidays;
DROP POLICY IF EXISTS "auth_update_holidays" ON whatsapp_holidays;
DROP POLICY IF EXISTS "authenticated_update_holidays" ON whatsapp_holidays;
DROP POLICY IF EXISTS "Allow authenticated update" ON whatsapp_holidays;
CREATE POLICY "admin_insert_holidays" ON whatsapp_holidays FOR INSERT TO authenticated WITH CHECK (public.is_active_user());
CREATE POLICY "admin_update_holidays" ON whatsapp_holidays FOR UPDATE TO authenticated USING (public.is_active_user()) WITH CHECK (public.is_active_user());
CREATE POLICY "admin_delete_holidays" ON whatsapp_holidays FOR DELETE TO authenticated USING (public.is_active_user());