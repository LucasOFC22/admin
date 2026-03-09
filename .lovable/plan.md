
# Remoção de Console.log do Projeto

## Resumo

Serão removidas todas as instruções `console.log` de debug/desenvolvimento que estão poluindo o console do navegador. O projeto possui um utilitário de logging condicional em `src/utils/logger.ts`, mas ele não está sendo usado - os logs estão diretamente no código.

## Escopo da Remoção

Total estimado: **mais de 1000 console.log** em **60+ arquivos**.

### Arquivos Principais (por categoria)

**Configuração e Auth (15 logs)**
- `src/config/supabaseAuth.ts` - 3 console.log do Realtime Auth

**Hooks (423 logs em 18 arquivos)**
- `src/hooks/useGlobalWhatsAppNotifications.ts` - ~15 logs de notificações
- `src/hooks/useWhatsAppMessages.ts` - ~10 logs de mensagens
- `src/hooks/useWhatsApp.ts` - ~10 logs de realtime
- `src/hooks/useEmailThread.ts` - logs de emails
- `src/hooks/use-supabase-pickup-submission.ts` - logs de coletas
- E outros 13 arquivos

**Services (114 logs em 10 arquivos)**
- `src/services/n8n/usersService.ts` - logs de debug de API
- `src/services/whatsappMediaService.ts` - logs de mídia
- `src/services/supabaseConfigService.ts` - logs de conexão
- E outros 7 arquivos

**Components (409 logs em 24 arquivos)**
- `src/components/admin/whatsapp/tickets-whaticket/MessageInput.tsx` - ~40 logs
- `src/components/admin/email/EmailInbox.tsx` - logs de email
- `src/components/flowbuilder/FlowBuilderGroupEditor.tsx` - logs de flowbuilder
- E outros 21 arquivos

**Pages (35 logs em 4 arquivos)**
- `src/pages/admin/WhatsAppKanban.tsx` - logs de Kanban
- `src/pages/WhatsAppKanban.tsx` - logs de movimentação
- E outros 2 arquivos

## Abordagem

Remover **todos** os `console.log` de cada arquivo. Manter apenas:
- `console.error` para erros reais de runtime
- `console.warn` em casos específicos de alerta ao desenvolvedor

## Arquivos Específicos a Modificar

1. `src/config/supabaseAuth.ts`
2. `src/hooks/useGlobalWhatsAppNotifications.ts`
3. `src/hooks/useWhatsAppMessages.ts`
4. `src/hooks/useWhatsApp.ts`
5. `src/hooks/useEmailThread.ts`
6. `src/hooks/use-supabase-pickup-submission.ts`
7. `src/hooks/useAdminSidebarNavigation.ts`
8. `src/hooks/useContatosActions.ts`
9. `src/services/n8n/usersService.ts`
10. `src/services/n8n/errorService.ts`
11. `src/services/whatsappMediaService.ts`
12. `src/services/supabaseConfigService.ts`
13. `src/services/ticketService.ts`
14. `src/services/logger/apiInterceptor.ts`
15. `src/services/kanbanWhatsAppService.ts`
16. `src/services/databasePermissionsService.ts`
17. `src/services/supabase/solicitacaoAcessoService.ts`
18. `src/components/admin/whatsapp/tickets-whaticket/MessageInput.tsx`
19. `src/components/admin/whatsapp/tickets-whaticket/SessionWindowAlert.tsx`
20. `src/components/admin/whatsapp/tickets-whaticket/NewTicketModal.tsx`
21. `src/components/admin/whatsapp/tickets-whaticket/MessageOptionsMenu.tsx`
22. `src/components/admin/email/EmailInbox.tsx`
23. `src/components/admin/cotacoes/CotacoesList.tsx`
24. `src/components/admin/cotacoes/CotacoesPageV3.tsx`
25. `src/components/admin/configuracoes/CreateTemplatePage.tsx`
26. `src/components/admin/configuracoes/PermissionsConfig.tsx`
27. `src/components/admin/cargos/CreateCargoModal.tsx`
28. `src/components/admin/kanban/KanbanBoard.tsx`
29. `src/components/flowbuilder/FlowBuilderGroupEditor.tsx`
30. `src/components/ui/sonner.tsx`
31. `src/pages/admin/WhatsAppKanban.tsx`
32. `src/pages/WhatsAppKanban.tsx`
33. `src/pages/admin/Coletas.tsx`
34. `src/pages/admin-content/CotacoesContent.tsx`
35. + ~26 arquivos adicionais identificados na busca

---

## Detalhes Técnicos

### Padrão de Remoção

Para cada arquivo, serão removidas linhas como:
```typescript
// REMOVER:
console.log('[Realtime:Auth] 🔐 getRealtimeClient chamado', {...});
console.log('[MessageInput] Buscando telefone...');
console.log('📤 Enviando dados...');

// MANTER:
console.error('[Component] Erro crítico:', error);
console.warn('[Component] Aviso importante');
```

### Arquivo logger.ts Existente

O projeto já possui `src/utils/logger.ts` com `isDevelopment = false`, então mesmo se usássemos `devLog.log()`, os logs seriam suprimidos. A estratégia é simplesmente remover os `console.log` ao invés de substituí-los.

### Impacto

- **Performance**: Leve melhoria por não serializar objetos para o console
- **Segurança**: Não expõe dados sensíveis (tokens, IDs, estruturas internas)
- **Manutenção**: Console mais limpo para debugging real em produção
