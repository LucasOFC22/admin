
# Plano de Implementação: Ocultar Telefones para Usuários Não-Administradores

## Análise do Sistema Atual

Analisei o sistema de permissões existente e identifiquei os seguintes pontos:

1. **Sistema de Permissões**: O projeto usa um sistema baseado em `permissionsMap.ts` com permissões categorizadas
2. **Exibição de Telefones**: Números são exibidos principalmente em:
   - `TicketListItemCustom.tsx` (lista de tickets do WhatsApp) 
   - `EditContactModal.tsx` (modal de edição de contatos)
   - Outros componentes que mostram dados de contatos
3. **Gerador de SQL**: O arquivo `PermissionsConfig.tsx` já possui um sistema para gerar scripts SQL das permissões

## Solução Proposta

### 1. Nova Permissão no Sistema

**Adicionar nova permissão:**
```typescript
{
  id: 'admin.whatsapp.ver_telefones_completos',
  name: 'Ver Telefones Completos',
  description: 'Visualizar números de telefone completos (apenas admins e supervisores)',
  action: 'view',
  resource: 'whatsapp',
  category: 'Atendimento',
  enabled: true
}
```

### 2. Função Utilitária de Mascaramento

**Criar nova função em `src/utils/phone/index.ts`:**
```typescript
/**
 * Mascara telefone para usuários sem permissão
 * @example maskPhoneNumber("+55 (11) 99999-9999") => "+55 (11) 9****-****"
 */
export const maskPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  const formatted = formatPhone(phone);
  
  // Detectar formato e aplicar máscara
  if (formatted.includes('+55')) {
    // +55 (11) 99999-9999 → +55 (11) 9****-****
    return formatted.replace(/(\+55 \(\d{2}\) \d)[\d-]*(\d{4})$/, '$1****-$2');
  }
  
  // Outros formatos mantêm apenas primeiros e últimos dígitos
  return formatted.replace(/\d(?=.*\d{4})/g, '*');
};
```

### 3. Hook de Verificação de Permissão

**Criar `src/hooks/usePhoneVisibility.ts`:**
```typescript
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { maskPhoneNumber } from '@/utils/phone';

export const usePhoneVisibility = () => {
  const { canAccess } = usePermissionGuard();
  
  const canViewFullPhone = canAccess('admin.whatsapp.ver_telefones_completos');
  
  const displayPhone = (phone: string): string => {
    if (!phone) return '';
    return canViewFullPhone ? phone : maskPhoneNumber(phone);
  };
  
  return {
    canViewFullPhone,
    displayPhone
  };
};
```

### 4. Aplicar Mascaramento nos Componentes

**TicketListItemCustom.tsx:**
- Substituir `ticket.contact?.number` por `displayPhone(ticket.contact?.number)`
- Aplicar em qualquer lugar onde o telefone é exibido

**EditContactModal.tsx:**
- Aplicar máscara no campo de exibição do telefone
- Manter funcionalidade de edição apenas para usuários com permissão

### 5. Atualizar Gerador de SQL

**PermissionsConfig.tsx:**
- A nova permissão será automaticamente incluída no script SQL gerado
- Adicionar a permissão aos cargos de Administrador (ID 1) e Supervisor por padrão

### 6. Estrutura Técnica Detalhada

**Arquivos a modificar:**

1. `src/config/permissionsMap.ts` - Adicionar nova permissão
2. `src/utils/phone/index.ts` - Nova função de mascaramento
3. `src/hooks/usePhoneVisibility.ts` - Novo hook (criar)
4. `src/components/admin/whatsapp/tickets-whaticket/TicketListItemCustom.tsx` - Aplicar máscara
5. `src/components/admin/whatsapp/contacts/EditContactModal.tsx` - Aplicar máscara
6. Outros componentes que exibem telefones conforme necessário

**Script SQL Gerado:**
```sql
-- A permissão será incluída automaticamente no INSERT
INSERT INTO permissions (id, name, description, category, action, resource, active, critical) VALUES
('admin.whatsapp.ver_telefones_completos', 'Ver Telefones Completos', 'Visualizar números de telefone completos (apenas admins e supervisores)', 'Atendimento', 'view', 'whatsapp', true, false);

-- Adicionar aos cargos administrativos
UPDATE cargos SET permissoes = array_append(permissoes, 'admin.whatsapp.ver_telefones_completos') 
WHERE id IN (1) AND NOT ('admin.whatsapp.ver_telefones_completos' = ANY(permissoes));
```

## Benefícios

1. **Segurança**: Protege dados sensíveis de contatos
2. **Flexibilidade**: Sistema baseado em permissões, configurável
3. **Compatibilidade**: Não quebra funcionalidade existente
4. **Manutenibilidade**: Centraliza lógica de mascaramento
5. **Auditoria**: Integra com sistema de logs existente

## Considerações

- Telefones mascarados ainda permitem identificação do DDD e últimos dígitos
- Sistema mantém usabilidade para operações básicas
- Administradores e supervisores mantêm visibilidade completa
- Implementação progressiva permite ajustes por componente
