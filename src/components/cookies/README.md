# Sistema de Gerenciamento de Cookies

Sistema completo de gerenciamento de cookies em conformidade com LGPD e GDPR para o site da FP Transcargas.

## 📋 Visão Geral

O sistema de cookies oferece:

- ✅ **Conformidade Legal**: LGPD e GDPR compliant
- 🎯 **Categorização Inteligente**: 5 categorias de cookies bem definidas
- 🎨 **Interface Elegante**: Design moderno e responsivo
- ⚡ **Performance**: Otimizado para não impactar a velocidade do site
- 🔒 **Privacidade**: Controle granular sobre dados pessoais
- 📱 **Responsivo**: Funciona perfeitamente em todos os dispositivos

## 🏗️ Arquitetura

### Componentes Principais

```
src/components/cookies/
├── CookieManager.tsx          # Componente principal que gerencia tudo
├── CookieConsentBanner.tsx    # Banner de consentimento inicial
├── CookiePreferencesModal.tsx # Modal detalhado de configurações
├── CookieSettingsButton.tsx   # Botão para acessar configurações
└── README.md                  # Esta documentação
```

### Stores e Serviços

```
src/stores/
└── cookieStore.ts            # Estado global dos cookies (Zustand)

src/services/
└── cookieService.ts          # Serviço para manipulação de cookies

src/hooks/
└── useCookieConsent.ts       # Hook para facilitar o uso
```

## 🍪 Categorias de Cookies

### 1. **Essenciais** (🛡️ Shield)
- **Obrigatórios**: Não podem ser desabilitados
- **Exemplos**: `auth_token`, `session_id`, `cookie_consent`
- **Finalidade**: Funcionamento básico do site

### 2. **Funcionais** (🔧 Wrench)
- **Opcionais**: Melhoram a experiência
- **Exemplos**: `theme_preference`, `language_preference`, `chat_preferences`
- **Finalidade**: Personalização da interface

### 3. **Analíticos** (👁️ Eye)
- **Opcionais**: Métricas e análises
- **Exemplos**: `_ga`, `_gid`, `_gat`
- **Finalidade**: Google Analytics e estatísticas

### 4. **Marketing** (🎯 Target)
- **Opcionais**: Publicidade direcionada
- **Exemplos**: `_fbp`, `ads_data`
- **Finalidade**: Remarketing e anúncios

### 5. **Personalização** (👤 User)
- **Opcionais**: Experiência personalizada
- **Exemplos**: `user_preferences`, `dashboard_layout`
- **Finalidade**: Preferências específicas do usuário

## 🚀 Como Usar

### Implementação Básica

```tsx
import { CookieManager } from '@/components/cookies/CookieManager';

function App() {
  return (
    <div>
      {/* Seu conteúdo */}
      <CookieManager />
    </div>
  );
}
```

### Usando o Hook

```tsx
import { useCookieConsent } from '@/hooks/useCookieConsent';

function MyComponent() {
  const { 
    hasConsented, 
    allowAnalytics, 
    allowMarketing,
    openPreferences 
  } = useCookieConsent();

  // Verificar se pode usar Google Analytics
  if (allowAnalytics()) {
    // Carregar GA
  }

  // Verificar se pode usar pixels de marketing
  if (allowMarketing()) {
    // Carregar Facebook Pixel, etc.
  }

  return (
    <div>
      {!hasConsented && <p>Por favor, configure seus cookies</p>}
      <button onClick={openPreferences}>
        Configurar Cookies
      </button>
    </div>
  );
}
```

### Verificações Condicionais

```tsx
import { useCookieStore } from '@/stores/cookieStore';

function AnalyticsComponent() {
  const { getCategory } = useCookieStore();

  // Só renderizar se analíticos estiverem permitidos
  if (!getCategory('analytics')) {
    return null;
  }

  return <GoogleAnalyticsComponent />;
}
```

## ⚙️ Configurações Avançadas

### Adicionando Novos Cookies

Edite `src/services/cookieService.ts`:

```typescript
private cookieDatabase: CookieInfo[] = [
  // ... cookies existentes
  {
    name: 'meu_novo_cookie',
    category: 'functional',
    description: 'Descrição do cookie',
    duration: '30 dias',
    provider: 'FP Transcargas',
    purpose: 'Finalidade específica'
  }
];
```

### Integrando com Analytics

O sistema já inclui integração automática com Google Analytics:

```typescript
// O sistema automaticamente atualiza o consent mode do GA
gtag('consent', 'update', {
  analytics_storage: consent.preferences.analytics ? 'granted' : 'denied',
  ad_storage: consent.preferences.marketing ? 'granted' : 'denied',
  // ... outras configurações
});
```

### Limpeza Automática

O sistema remove automaticamente cookies não autorizados:

```typescript
// Se analytics não estiver permitido, remove cookies do GA
if (!consent.preferences.analytics) {
  document.cookie = '_ga=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  document.cookie = '_gid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}
```

## 🎨 Personalização Visual

### Cores e Temas

As cores seguem o design system do projeto:

```css
/* Cores principais definidas em tailwind.config.ts */
--primary: 222.2 47.4% 11.2%;
--secondary: 210 40% 96%;
--muted: 210 40% 96%;
/* ... */
```

### Ícones por Categoria

Cada categoria tem um ícone específico do Lucide:

- Essenciais: `Shield` 🛡️
- Funcionais: `Wrench` 🔧  
- Analíticos: `Eye` 👁️
- Marketing: `Target` 🎯
- Personalização: `User` 👤

## 📱 Responsividade

O sistema é totalmente responsivo:

```tsx
// Classes responsivas usadas
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
className="text-sm sm:text-base md:text-lg"
className="p-4 sm:p-6 md:p-8"
```

## 🔒 Conformidade Legal

### LGPD (Lei Geral de Proteção de Dados)

- ✅ Consentimento explícito
- ✅ Categorização clara
- ✅ Direito ao esquecimento
- ✅ Portabilidade de dados
- ✅ Transparência total

### GDPR (General Data Protection Regulation)

- ✅ Consent mode
- ✅ Granular controls
- ✅ Data export
- ✅ Right to erasure
- ✅ Privacy by design

## 📊 Funcionalidades de Dados

### Exportação de Dados

```typescript
const { exportUserData } = cookieService;

const userData = exportUserData();
// Retorna JSON com todos os dados do usuário
```

### Relatório de Cookies

```typescript
const { generateCookieReport } = cookieService;

const report = generateCookieReport();
// Relatório completo dos cookies ativos
```

### Scanner de Cookies

```typescript
const { scanActiveCookies } = cookieService;

const activeCookies = scanActiveCookies();
// { essential: [...], functional: [...], ... }
```

## 🚨 Troubleshooting

### Banner não aparece
- Verifique se o `CookieManager` está sendo renderizado
- Confirme que não há consentimento anterior salvo

### Preferências não salvam
- Verifique se o localStorage está disponível
- Confirme que o Zustand persist está configurado

### Cookies não são removidos
- Verifique se o domínio está correto
- Confirme que o path está especificado

## 🔄 Atualizações Futuras

### Roadmap

1. **Integração com mais serviços**
   - Meta Pixel
   - Google Ads
   - Hotjar
   - Clarity

2. **Funcionalidades avançadas**
   - Histórico detalhado de consentimento
   - Auditoria de cookies
   - Alertas de novos cookies

3. **Melhorias UX**
   - Onboarding interativo
   - Explicações visuais
   - Modo escuro dedicado

## 📞 Suporte

Para dúvidas ou sugestões sobre o sistema de cookies:

- **Email**: dev@fptranscargas.com.br
- **Documentação**: Este arquivo README
- **Issues**: Reporte problemas no sistema de versionamento

---

*Sistema de Cookies FP Transcargas v1.0.0*  
*Desenvolvido com ❤️ e em conformidade com LGPD/GDPR*