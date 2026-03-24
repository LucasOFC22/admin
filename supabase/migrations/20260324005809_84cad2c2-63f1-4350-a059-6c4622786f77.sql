-- Add new columns to tabelas_frete for client details
ALTER TABLE public.tabelas_frete 
  ADD COLUMN IF NOT EXISTS sequencia text,
  ADD COLUMN IF NOT EXISTS telefone text,
  ADD COLUMN IF NOT EXISTS forma_pagamento text,
  ADD COLUMN IF NOT EXISTS tabela_config_id text;

-- Add unique constraint on sequencia for active tables
CREATE UNIQUE INDEX IF NOT EXISTS idx_tabelas_frete_sequencia ON public.tabelas_frete (sequencia) WHERE sequencia IS NOT NULL AND ativo = true;