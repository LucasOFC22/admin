-- Inserir configuração de empresas na tabela configuracoes
INSERT INTO configuracoes (chave, valor, descricao, tipo)
VALUES (
  'empresas_sistema',
  '[{"id":1,"nome":"FP TRANSCARGAS","cnpj":"05805337000190"},{"id":2,"nome":"FP TRANSCARGAS * GRU *","cnpj":"05805337000270"}]',
  'Lista de empresas do sistema disponíveis para seleção',
  'json'
)
ON CONFLICT (chave) DO NOTHING;