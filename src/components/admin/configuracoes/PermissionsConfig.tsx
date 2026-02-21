import React, { useState } from 'react';
import { Shield, Search, Filter, Copy, Database, Trash2, UserPlus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { permissionsMap } from '@/config/permissionsMap';
import { sidebarPermissionCategories } from '@/config/permissionCategories';
import { Permission } from '@/types/permissions';
import PermissionGroup from './PermissionGroup';

const PermissionsConfig = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [permissions, setPermissions] = useState(permissionsMap);

  // Mapeamento de categorias de permissão para categorias do sidebar
  const categoryMapping: Record<string, string> = {
    // Principal
    'Dashboard': 'principal',
    // DB Frete
    'Cotações': 'db-frete',
    'Coletas': 'db-frete',
    'Manifestos': 'db-frete',
    'Consultar NF-e': 'db-frete',
    // Comunicação
    'Atendimento': 'comunicacao',
    'Kanban': 'comunicacao',
    'Filas': 'comunicacao',
    'Mensagens rápidas': 'comunicacao',
    'Contatos WhatsApp': 'comunicacao',
    'Tags': 'comunicacao',
    'Chat Interno': 'comunicacao',
    // Clientes
    'Contatos': 'clientes',
    'Solicitação Documentos': 'clientes',
    'Ocorrências': 'clientes',
    // Financeiro
    'Contas a Receber': 'financeiro',
    'Malotes': 'financeiro',
    // Sistema
    'Gerenciar Usuários': 'sistema',
    'Cargos': 'sistema',
    'Solicitações de Acesso': 'sistema',
    'FlowBuilders': 'sistema',
    'Conexões': 'sistema',
    'Configurações': 'sistema',
    // Programador
    'Erros': 'programador',
    'Backups': 'programador',
    'Logs de Atividade': 'programador',
    // Outros
    'Empresas': 'sistema',
    'Área do Cliente': 'clientes'
  };

  // Filtrar permissões baseado na busca e categoria do sidebar
  const filteredPermissions = permissions.map(group => ({
    ...group,
    permissions: group.permissions.filter(permission => {
      const matchesSearch = permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           permission.description.toLowerCase().includes(searchTerm.toLowerCase());
      const sidebarCategoryId = categoryMapping[group.category] || 'sistema';
      const matchesCategory = filterCategory === 'all' || sidebarCategoryId === filterCategory;
      return matchesSearch && matchesCategory;
    })
  })).filter(group => group.permissions.length > 0);

  // Obter todas as categorias únicas (mantido para compatibilidade)
  const categories = [...new Set(permissions.map(group => group.category))];


  // Contar permissões ativas
  const totalPermissions = permissions.reduce((total, group) => total + group.permissions.length, 0);
  const activePermissions = permissions.reduce((total, group) => 
    total + group.permissions.filter(p => p.enabled).length, 0
  );

  const handlePermissionToggle = (permissionId: string, enabled: boolean) => {
    setPermissions(prevPermissions => 
      prevPermissions.map(group => ({
        ...group,
        permissions: group.permissions.map(permission =>
          permission.id === permissionId 
            ? { ...permission, enabled }
            : permission
        )
      }))
    );
  };

  const [showSqlModal, setShowSqlModal] = useState(false);
  const [sqlOptions, setSqlOptions] = useState({
    createTables: true,
    deleteOldPermissions: false,
    createAdminRole: true,
    deleteTables: false
  });
  
  const generateSQLScript = () => {
    const activePermissions = permissions.flatMap(group =>
      group.permissions.filter(p => p.enabled)
    );
    
    let sql = `-- Script SQL para permissões do sistema FP Transcargas\n`;
    sql += `-- ⚡ Atualizado com Sistema de Hierarquia (Níveis 1-10)\n\n`;
    
    // Script de deleção de tabelas
    if (sqlOptions.deleteTables) {
      sql += `-- DELETAR TABELAS\n`;
      sql += `-- ⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL!\n\n`;
      sql += `-- Desabilitar RLS antes de deletar\n`;
      sql += `ALTER TABLE IF EXISTS public.permissions DISABLE ROW LEVEL SECURITY;\n`;
      sql += `ALTER TABLE IF EXISTS public.cargos DISABLE ROW LEVEL SECURITY;\n`;
      sql += `ALTER TABLE IF EXISTS public.usuarios DISABLE ROW LEVEL SECURITY;\n\n`;
      sql += `-- Deletar tabelas\n`;
      sql += `DROP TABLE IF EXISTS public.permissions CASCADE;\n`;
      sql += `DROP TABLE IF EXISTS public.cargos CASCADE;\n`;
      sql += `DROP TABLE IF EXISTS public.usuarios CASCADE;\n\n`;
      
      // Se só vai deletar, retorna aqui
      if (!sqlOptions.createTables) {
        sql += `-- Script executado com sucesso!\n`;
        return sql;
      }
    }
    
    // Apagar permissões antigas (sem deletar tabelas)
    // NOTA: NÃO resetamos o array de permissões dos cargos para preservar as associações existentes
    if (sqlOptions.deleteOldPermissions && !sqlOptions.deleteTables) {
      sql += `-- LIMPAR PERMISSÕES ANTIGAS\n`;
      sql += `-- ⚠️ Remove permissões da tabela permissions, mas PRESERVA as associações dos cargos\n\n`;
      sql += `-- Deletar todas as permissões antigas\n`;
      sql += `DELETE FROM public.permissions;\n\n`;
    }
    
    // Criar tabelas
    if (sqlOptions.createTables) {
      sql += `-- CRIAR TABELAS\n\n`;
      sql += `-- Tabela de permissões\n`;
      sql += `CREATE TABLE IF NOT EXISTS permissions (\n`;
      sql += `  id VARCHAR(255) PRIMARY KEY,\n`;
      sql += `  name VARCHAR(255) NOT NULL,\n`;
      sql += `  description TEXT,\n`;
      sql += `  category VARCHAR(100) NOT NULL,\n`;
      sql += `  action VARCHAR(100),\n`;
      sql += `  resource VARCHAR(100),\n`;
      sql += `  active BOOLEAN DEFAULT true,\n`;
      sql += `  critical BOOLEAN DEFAULT false,\n`;
      sql += `  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),\n`;
      sql += `  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()\n`;
      sql += `);\n\n`;
      
      // Criar tabela de departamentos primeiro (referência para cargos)
      sql += `-- Tabela de departamentos\n`;
      sql += `CREATE TABLE IF NOT EXISTS cargos_departamento (\n`;
      sql += `  id SERIAL PRIMARY KEY,\n`;
      sql += `  nome VARCHAR(255) NOT NULL,\n`;
      sql += `  ativo BOOLEAN DEFAULT true,\n`;
      sql += `  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),\n`;
      sql += `  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()\n`;
      sql += `);\n\n`;

      // Criar tabela de cargos
      sql += `-- Tabela de cargos\n`;
      sql += `CREATE TABLE IF NOT EXISTS cargos (\n`;
      sql += `  id SERIAL PRIMARY KEY,\n`;
      sql += `  nome VARCHAR(255) NOT NULL,\n`;
      sql += `  descricao TEXT,\n`;
      sql += `  departamento INTEGER REFERENCES cargos_departamento(id) ON DELETE SET NULL,\n`;
      sql += `  permissoes TEXT[] DEFAULT '{}',\n`;
      sql += `  level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 10),\n`;
      sql += `  pode_excluir BOOLEAN DEFAULT false,\n`;
      sql += `  ativo BOOLEAN DEFAULT true,\n`;
      sql += `  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),\n`;
      sql += `  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()\n`;
      sql += `);\n\n`;
      
      sql += `-- Comentários das colunas da tabela cargos\n`;
      sql += `COMMENT ON COLUMN cargos.level IS 'Nível hierárquico do cargo (1-10), onde 10 é Administrador';\n`;
      sql += `COMMENT ON COLUMN cargos.departamento IS 'Referência ao departamento do cargo';\n`;
      sql += `COMMENT ON COLUMN cargos.descricao IS 'Descrição detalhada do cargo';\n\n`;
      
      // Criar tabela de usuários
      sql += `-- Tabela de usuários\n`;
      sql += `CREATE TABLE IF NOT EXISTS usuarios (\n`;
      sql += `  id SERIAL PRIMARY KEY,\n`;
      sql += `  nome VARCHAR(255) NOT NULL,\n`;
      sql += `  email VARCHAR(255) UNIQUE NOT NULL,\n`;
      sql += `  telefone VARCHAR(20),\n`;
      sql += `  cnpjcpf VARCHAR(18),\n`;
      sql += `  cargo INTEGER REFERENCES cargos(id),\n`;
      sql += `  nivel_hierarquico INTEGER DEFAULT 1 CHECK (nivel_hierarquico >= 1 AND nivel_hierarquico <= 10),\n`;
      sql += `  acesso_area_cliente BOOLEAN DEFAULT false,\n`;
      sql += `  acesso_area_admin BOOLEAN DEFAULT false,\n`;
      sql += `  ativo BOOLEAN DEFAULT true,\n`;
      sql += `  supabase_id UUID UNIQUE,\n`;
      sql += `  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),\n`;
      sql += `  data_ultima_atividade TIMESTAMP WITH TIME ZONE,\n`;
      sql += `  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()\n`;
      sql += `);\n\n`;
      
      sql += `-- Comentários das colunas\n`;
      sql += `COMMENT ON COLUMN usuarios.nivel_hierarquico IS 'Nível hierárquico do usuário (1-10), derivado do cargo ou definido manualmente';\n`;
      sql += `COMMENT ON COLUMN usuarios.cargo IS 'Referência ao cargo do usuário';\n`;
      sql += `COMMENT ON COLUMN usuarios.supabase_id IS 'ID de autenticação do Supabase (auth.users)';\n\n`;
      
      // Atualizar nível dos usuários baseado no cargo
      sql += `-- Atualizar nível hierárquico dos usuários baseado no cargo\n`;
      sql += `UPDATE usuarios u\n`;
      sql += `SET nivel_hierarquico = COALESCE(\n`;
      sql += `  (SELECT c.level FROM cargos c WHERE c.id = u.cargo),\n`;
      sql += `  1\n`;
      sql += `)\n`;
      sql += `WHERE nivel_hierarquico IS NULL OR nivel_hierarquico = 1;\n\n`;
      
      // Funções para controle de hierarquia
      sql += `-- FUNÇÕES DE CONTROLE DE HIERARQUIA\n\n`;
      
      sql += `-- Função que retorna o nível hierárquico do usuário logado\n`;
      sql += `CREATE OR REPLACE FUNCTION get_user_hierarchy_level()\n`;
      sql += `RETURNS INTEGER\n`;
      sql += `LANGUAGE plpgsql\n`;
      sql += `SECURITY DEFINER\n`;
      sql += `SET search_path = public\n`;
      sql += `AS $$\n`;
      sql += `DECLARE\n`;
      sql += `  user_level INTEGER;\n`;
      sql += `BEGIN\n`;
      sql += `  -- Buscar nível do usuário\n`;
      sql += `  SELECT nivel_hierarquico INTO user_level\n`;
      sql += `  FROM usuarios\n`;
      sql += `  WHERE supabase_id = auth.uid();\n`;
      sql += `  \n`;
      sql += `  -- Se não encontrou usuário, retorna 0 (sem privilégios)\n`;
      sql += `  IF user_level IS NULL THEN\n`;
      sql += `    RETURN 0;\n`;
      sql += `  END IF;\n`;
      sql += `  \n`;
      sql += `  RETURN user_level;\n`;
      sql += `END;\n`;
      sql += `$$;\n\n`;
      
      sql += `-- Função que verifica se usuário pode gerenciar um registro com determinado nível\n`;
      sql += `CREATE OR REPLACE FUNCTION can_manage_hierarchy_level(target_level INTEGER)\n`;
      sql += `RETURNS BOOLEAN\n`;
      sql += `LANGUAGE plpgsql\n`;
      sql += `SECURITY DEFINER\n`;
      sql += `SET search_path = public\n`;
      sql += `AS $$\n`;
      sql += `DECLARE\n`;
      sql += `  user_level INTEGER;\n`;
      sql += `BEGIN\n`;
      sql += `  user_level := get_user_hierarchy_level();\n`;
      sql += `  \n`;
      sql += `  -- Usuário pode gerenciar níveis iguais ou inferiores ao seu\n`;
      sql += `  RETURN user_level >= target_level;\n`;
      sql += `END;\n`;
      sql += `$$;\n\n`;
      
      // Criar índices
      sql += `-- Criar índices para performance\n`;
      sql += `CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);\n`;
      sql += `CREATE INDEX IF NOT EXISTS idx_permissions_active ON permissions(active);\n`;
      sql += `CREATE INDEX IF NOT EXISTS idx_cargos_nome ON cargos(nome);\n`;
      sql += `CREATE INDEX IF NOT EXISTS idx_cargos_ativo ON cargos(ativo);\n`;
      sql += `CREATE INDEX IF NOT EXISTS idx_cargos_level ON cargos(level);\n`;
      sql += `CREATE INDEX IF NOT EXISTS idx_cargos_departamento ON cargos(departamento);\n`;
      sql += `CREATE INDEX IF NOT EXISTS idx_cargos_departamento_nome ON cargos_departamento(nome);\n`;
      sql += `CREATE INDEX IF NOT EXISTS idx_usuarios_nivel_hierarquico ON usuarios(nivel_hierarquico);\n\n`;
      
      // Habilitar RLS
      sql += `-- Habilitar Row Level Security\n`;
      sql += `ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;\n`;
      sql += `ALTER TABLE cargos ENABLE ROW LEVEL SECURITY;\n`;
      sql += `ALTER TABLE cargos_departamento ENABLE ROW LEVEL SECURITY;\n`;
      sql += `ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;\n\n`;
      
      // Políticas de RLS
      sql += `-- POLÍTICAS DE RLS COM CONTROLE DE HIERARQUIA\n\n`;
      
      // Políticas para permissions
      sql += `-- Permissões: todos autenticados podem visualizar\n`;
      sql += `DROP POLICY IF EXISTS "permissions_select_policy" ON permissions;\n`;
      sql += `CREATE POLICY "permissions_select_policy" ON permissions FOR SELECT USING (auth.uid() IS NOT NULL);\n\n`;
      
      // Políticas para cargos
      sql += `-- Cargos: todos autenticados podem visualizar\n`;
      sql += `DROP POLICY IF EXISTS "cargos_select_policy" ON cargos;\n`;
      sql += `CREATE POLICY "cargos_select_policy" ON cargos FOR SELECT USING (auth.uid() IS NOT NULL);\n\n`;
      
      sql += `-- Cargos: só pode atualizar se tiver nível igual ou superior\n`;
      sql += `DROP POLICY IF EXISTS "cargos_update_hierarchy" ON cargos;\n`;
      sql += `CREATE POLICY "cargos_update_hierarchy" ON cargos FOR UPDATE\n`;
      sql += `USING (level <= get_user_hierarchy_level())\n`;
      sql += `WITH CHECK (level <= get_user_hierarchy_level());\n\n`;
      
      sql += `-- Cargos: só pode deletar se tiver nível superior\n`;
      sql += `DROP POLICY IF EXISTS "cargos_delete_hierarchy" ON cargos;\n`;
      sql += `CREATE POLICY "cargos_delete_hierarchy" ON cargos FOR DELETE\n`;
      sql += `USING (level < get_user_hierarchy_level());\n\n`;
      
      sql += `-- Cargos: só pode criar se tiver nível igual ou superior\n`;
      sql += `DROP POLICY IF EXISTS "cargos_insert_hierarchy" ON cargos;\n`;
      sql += `CREATE POLICY "cargos_insert_hierarchy" ON cargos FOR INSERT\n`;
      sql += `WITH CHECK (\n`;
      sql += `  CASE \n`;
      sql += `    WHEN level IS NULL THEN true\n`;
      sql += `    ELSE level <= get_user_hierarchy_level()\n`;
      sql += `  END\n`;
      sql += `);\n\n`;
      
      // Políticas para departamentos
      sql += `-- Departamentos: todos autenticados podem visualizar\n`;
      sql += `DROP POLICY IF EXISTS "departamentos_select_policy" ON cargos_departamento;\n`;
      sql += `CREATE POLICY "departamentos_select_policy" ON cargos_departamento FOR SELECT USING (auth.uid() IS NOT NULL);\n\n`;
      
      sql += `-- Departamentos: usuários com nível >= 7 podem inserir\n`;
      sql += `DROP POLICY IF EXISTS "departamentos_insert_policy" ON cargos_departamento;\n`;
      sql += `CREATE POLICY "departamentos_insert_policy" ON cargos_departamento FOR INSERT\n`;
      sql += `WITH CHECK (get_user_hierarchy_level() >= 7);\n\n`;
      
      sql += `-- Departamentos: usuários com nível >= 7 podem atualizar\n`;
      sql += `DROP POLICY IF EXISTS "departamentos_update_policy" ON cargos_departamento;\n`;
      sql += `CREATE POLICY "departamentos_update_policy" ON cargos_departamento FOR UPDATE\n`;
      sql += `USING (get_user_hierarchy_level() >= 7);\n\n`;
      
      sql += `-- Departamentos: usuários com nível >= 8 podem deletar\n`;
      sql += `DROP POLICY IF EXISTS "departamentos_delete_policy" ON cargos_departamento;\n`;
      sql += `CREATE POLICY "departamentos_delete_policy" ON cargos_departamento FOR DELETE\n`;
      sql += `USING (get_user_hierarchy_level() >= 8);\n\n`;
      
      // Políticas para usuarios
      sql += `-- Usuários: todos autenticados podem visualizar (listagem)\n`;
      sql += `DROP POLICY IF EXISTS "usuarios_select_hierarchy" ON usuarios;\n`;
      sql += `CREATE POLICY "usuarios_select_hierarchy" ON usuarios FOR SELECT\n`;
      sql += `USING (auth.uid() IS NOT NULL);\n\n`;
      
      sql += `-- Usuários: só pode atualizar se tiver nível igual ou superior\n`;
      sql += `DROP POLICY IF EXISTS "usuarios_update_hierarchy" ON usuarios;\n`;
      sql += `CREATE POLICY "usuarios_update_hierarchy" ON usuarios FOR UPDATE\n`;
      sql += `USING (nivel_hierarquico <= get_user_hierarchy_level())\n`;
      sql += `WITH CHECK (nivel_hierarquico <= get_user_hierarchy_level());\n\n`;
      
      sql += `-- Usuários: só pode deletar se tiver nível superior\n`;
      sql += `DROP POLICY IF EXISTS "usuarios_delete_hierarchy" ON usuarios;\n`;
      sql += `CREATE POLICY "usuarios_delete_hierarchy" ON usuarios FOR DELETE\n`;
      sql += `USING (nivel_hierarquico < get_user_hierarchy_level());\n\n`;
      
      sql += `-- Usuários: não pode criar usuários com nível superior ao seu\n`;
      sql += `DROP POLICY IF EXISTS "usuarios_insert_hierarchy" ON usuarios;\n`;
      sql += `CREATE POLICY "usuarios_insert_hierarchy" ON usuarios FOR INSERT\n`;
      sql += `WITH CHECK (nivel_hierarquico <= get_user_hierarchy_level());\n\n`;
    }
    
    // Inserir permissões ativas
    if (activePermissions.length > 0 && (sqlOptions.createTables || sqlOptions.deleteOldPermissions)) {
      sql += `-- INSERIR PERMISSÕES\n`;
      sql += `INSERT INTO permissions (id, name, description, category, action, resource, active, critical) VALUES\n`;
      
      const permissionValues = activePermissions.map(p => 
        `('${p.id}', '${p.name.replace(/'/g, "''")}', '${p.description.replace(/'/g, "''")}', '${p.category}', '${p.action || ''}', '${p.resource || ''}', true, ${p.critical || false})`
      );
      
      sql += permissionValues.join(',\n');
      sql += `\nON CONFLICT (id) DO UPDATE SET\n`;
      sql += `  name = EXCLUDED.name,\n`;
      sql += `  description = EXCLUDED.description,\n`;
      sql += `  category = EXCLUDED.category,\n`;
      sql += `  action = EXCLUDED.action,\n`;
      sql += `  resource = EXCLUDED.resource,\n`;
      sql += `  active = EXCLUDED.active,\n`;
      sql += `  critical = EXCLUDED.critical,\n`;
      sql += `  updated_at = NOW();\n\n`;
    }
    
    // Criar cargo Administrador
    if (sqlOptions.createAdminRole) {
      sql += `-- CRIAR CARGO ADMINISTRADOR (Nível 10)\n`;
      
      // Obter todas as permissões ativas para o cargo Administrador
      const adminPermissions = activePermissions.map(p => p.id);
      const adminPermissionsString = `{${adminPermissions.join(', ')}}`;
      
      sql += `INSERT INTO cargos (nome, descricao, permissoes, level, pode_excluir) \n`;
      sql += `SELECT 'Administrador', 'Acesso completo ao sistema - Nível Hierárquico Máximo', '${adminPermissionsString}', 10, false\n`;
      sql += `WHERE NOT EXISTS (SELECT 1 FROM cargos WHERE nome = 'Administrador');\n\n`;
      
      // Atualizar permissões e nível do cargo Administrador se já existir
      sql += `UPDATE cargos SET permissoes = '${adminPermissionsString}', level = 10 WHERE nome = 'Administrador';\n\n`;
    }
    
    sql += `-- ✅ Script de hierarquia completo!\n`;
    sql += `-- 📊 Sistema com ${activePermissions.length} permissões e controle hierárquico (níveis 1-10)\n`;
    
    return sql;
  };

  const handleGenerateSQL = () => {
    setShowSqlModal(true);
  };

  const handleCopySQL = async () => {
    try {
      await navigator.clipboard.writeText(generateSQLScript());
      // Aqui você pode adicionar um toast de sucesso
      console.log('SQL copiado para a área de transferência');
    } catch (err) {
      console.error('Erro ao copiar SQL:', err);
    }
  };

  const handleSelectAll = () => {
    setPermissions(prevPermissions => 
      prevPermissions.map(group => ({
        ...group,
        permissions: group.permissions.map(permission => ({
          ...permission,
          enabled: true
        }))
      }))
    );
  };

  const handleDeselectAll = () => {
    setPermissions(prevPermissions => 
      prevPermissions.map(group => ({
        ...group,
        permissions: group.permissions.map(permission => ({
          ...permission,
          enabled: false
        }))
      }))
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Gerenciar Permissões do Sistema
          </CardTitle>
          <CardDescription>
            Configure permissões granulares para cada funcionalidade do sistema
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Estatísticas e Ações */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <Badge variant="outline" className="bg-blue-50">
                Total: {totalPermissions} permissões
              </Badge>
              <Badge variant="outline" className="bg-green-50">
                Ativas: {activePermissions} permissões
              </Badge>
              <Badge variant="outline" className="bg-gray-50">
                Inativas: {totalPermissions - activePermissions} permissões
              </Badge>
              <Badge variant="outline" className="bg-purple-50 border-purple-200">
                <Shield className="h-3 w-3 mr-1" />
                Sistema de Hierarquia (1-10)
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSelectAll}
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                Selecionar Todas
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleDeselectAll}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Desmarcar Todas
              </Button>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar permissões..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-56">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {sidebarPermissionCategories.map(sidebarCat => (
                  <SelectItem key={sidebarCat.id} value={sidebarCat.id}>
                    {sidebarCat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Botão de Gerar SQL */}
          <div className="flex justify-end">
            <Button onClick={handleGenerateSQL}>
              <Database className="h-4 w-4 mr-2" />
              Gerar SQL
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal do SQL */}
      <Dialog open={showSqlModal} onOpenChange={setShowSqlModal}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden backdrop-blur-sm bg-background/95">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Gerar Script SQL de Permissões
            </DialogTitle>
            <DialogDescription>
              Selecione as operações que deseja realizar no banco de dados
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[calc(85vh-8rem)] pr-4">
            <div className="space-y-4">
            {/* Opções de geração SQL */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <h4 className="font-medium text-sm">Opções de geração:</h4>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Checkbox 
                    id="createTables" 
                    checked={sqlOptions.createTables}
                    onCheckedChange={(checked) => setSqlOptions({...sqlOptions, createTables: checked as boolean})}
                  />
                   <div className="space-y-1 leading-none">
                    <Label htmlFor="createTables" className="cursor-pointer font-medium">
                      Criar tabelas de permissões e cargos com hierarquia
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Cria "permissions", "cargos" com RLS, funções de hierarquia e atualiza "usuarios"
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox 
                    id="deleteOldPermissions" 
                    checked={sqlOptions.deleteOldPermissions}
                    onCheckedChange={(checked) => setSqlOptions({...sqlOptions, deleteOldPermissions: checked as boolean})}
                  />
                  <div className="space-y-1 leading-none">
                    <Label htmlFor="deleteOldPermissions" className="cursor-pointer font-medium text-orange-600">
                      Limpar tabela de permissões
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Remove permissões da tabela antes de inserir. <strong className="text-green-600">Preserva as associações dos cargos.</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox 
                    id="createAdminRole" 
                    checked={sqlOptions.createAdminRole}
                    onCheckedChange={(checked) => setSqlOptions({...sqlOptions, createAdminRole: checked as boolean})}
                  />
                   <div className="space-y-1 leading-none">
                    <Label htmlFor="createAdminRole" className="cursor-pointer font-medium">
                      Criar cargo Administrador (Nível 10)
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Cria ou atualiza o cargo "Administrador" com todas as permissões e nível máximo
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox 
                    id="deleteTables" 
                    checked={sqlOptions.deleteTables}
                    onCheckedChange={(checked) => setSqlOptions({...sqlOptions, deleteTables: checked as boolean})}
                  />
                  <div className="space-y-1 leading-none">
                    <Label htmlFor="deleteTables" className="cursor-pointer font-medium text-destructive">
                      Deletar tabelas (ATENÇÃO!)
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      ⚠️ Remove permanentemente as tabelas e todos os seus dados
                    </p>
                  </div>
                </div>
              </div>
            </div>

              <p className="text-sm text-muted-foreground">
                {activePermissions} permissões ativas serão incluídas no script com controle de hierarquia (níveis 1-10).
              </p>
              
              <div className="relative w-full rounded border bg-muted/50 overflow-hidden">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleCopySQL}
                  className="absolute top-2 right-8 h-7 w-7 p-0 bg-background/80 hover:bg-background/95 backdrop-blur-sm z-10 border shadow-sm"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <div className="h-60 overflow-auto">
                  <pre className="p-4 pr-16 text-sm font-mono text-left whitespace-pre-wrap">
                    {generateSQLScript()}
                  </pre>
                </div>
              </div>
            
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 space-y-2">
                <p className="text-sm text-blue-800">
                  <strong>Como usar:</strong> Copie este script e execute no SQL Editor do seu projeto Supabase.
                </p>
                <p className="text-xs text-blue-700">
                  <strong>Sistema de Hierarquia:</strong> Este script inclui o sistema de níveis hierárquicos (1-10), 
                  permitindo controle granular de acesso baseado no nível do usuário. Nível 10 = Administrador.
                </p>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Grupos de Permissões organizados por categoria do Sidebar */}
      <div className="space-y-6">
        {filteredPermissions.length > 0 ? (
          sidebarPermissionCategories.map((sidebarCategory) => {
            // Encontrar grupos de permissões que pertencem a esta categoria do sidebar
            const categoryGroups = filteredPermissions.filter(group => {
              return categoryMapping[group.category] === sidebarCategory.id;
            });

            if (categoryGroups.length === 0) return null;

            return (
              <div key={sidebarCategory.id} className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <h3 className="text-lg font-semibold text-foreground">{sidebarCategory.label}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {sidebarCategory.pages.length} páginas
                  </Badge>
                </div>
                <div className="space-y-3 pl-2 border-l-2 border-muted">
                  {categoryGroups.map((group) => (
                    <PermissionGroup
                      key={group.category}
                      group={group}
                      onPermissionToggle={handlePermissionToggle}
                      defaultOpen={group.category === 'Dashboard'}
                    />
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-500">
                Nenhuma permissão encontrada com os filtros aplicados.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Nota sobre desenvolvimento */}
      <div className="mt-6 space-y-3">
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-purple-600 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-purple-900">
                Sistema de Hierarquia Implementado
              </p>
              <p className="text-xs text-purple-700">
                O sistema agora suporta controle hierárquico baseado em níveis (1-10). 
                Usuários só podem criar, editar ou excluir registros com níveis iguais ou inferiores ao seu. 
                O nível 10 é reservado para Administradores com acesso total.
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Nota:</strong> Para ativar a funcionalidade completa de gerenciamento de permissões, 
            é necessário conectar o projeto ao Supabase através da integração nativa do Lovable. 
            Clique no botão verde "Supabase" no topo da interface para configurar.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PermissionsConfig;