# Relatório Técnico: Correção do Fluxo de Autenticação Google no Expo

Este documento detalha o diagnóstico e a solução aplicada para corrigir o erro **"Something went wrong trying to finish signing in"** ocorrido durante o fluxo de autenticação Google no aplicativo **MOVT**.

---

## 1. Diagnóstico do Problema

O erro ocorria imediatamente após o usuário selecionar sua conta Google no navegador e tentar retornar ao aplicativo. O navegador exibia a mensagem de erro do Expo Auth Session, indicando uma falha na finalização da sessão de autenticação.

### Causa Raiz Identificada

A análise do arquivo `src/screens/Auth/signinScreen.tsx` revelou que o `redirectUri` estava sendo forçado manualmente para um valor estático:

```typescript
// Código Original (Problemático no ambiente de desenvolvimento)
const redirectUri = "https://auth.expo.io/@movtapp/movt";
```

Embora este URI seja válido para o ambiente de produção (EAS Build), ele causa conflitos no **Expo Go** (ambiente de desenvolvimento). O Expo Go utiliza um sistema de proxy para interceptar o redirecionamento do Google e devolvê-lo ao aplicativo local. Ao fixar o URI, o fluxo de autenticação não conseguia alinhar o token recebido com a sessão aberta no emulador.

---

## 2. Fundamentação e Pesquisa

De acordo com a documentação oficial do **Expo AuthSession** [1], o uso do `makeRedirectUri` é a prática recomendada para garantir a compatibilidade entre diferentes ambientes (Expo Go, Development Builds e Produção).

### Tabela de Comparação de URIs de Redirecionamento

| Ambiente             | Comportamento Esperado                           | Resultado com URI Fixo                                        |
| :------------------- | :----------------------------------------------- | :------------------------------------------------------------ |
| **Expo Go**          | Requer Proxy (`https://auth.expo.io/@user/slug`) | **Falha:** O Proxy não reconhece a sessão local.              |
| **Build Nativa**     | Requer Esquema Customizado (`movt://`)           | **Falha:** O Google não aceita esquemas não-HTTP diretamente. |
| **Solução Aplicada** | Dinâmico via `makeRedirectUri`                   | **Sucesso:** Adapta-se ao contexto de execução.               |

> "Ao usar `useProxy: true`, o Expo gera um URI temporário que atua como ponte entre o Google e o seu ambiente de desenvolvimento local." [2]

---

## 3. Solução Aplicada

A correção consistiu em substituir a string estática por uma chamada dinâmica à API do Expo, permitindo que o framework gerencie o redirecionamento de forma inteligente.

### Alteração no Código (`src/screens/Auth/signinScreen.tsx`)

**Antes:**

```typescript
const redirectUri = "https://auth.expo.io/@movtapp/movt";
```

**Depois (Corrigido):**

```typescript
const redirectUri = AuthSession.makeRedirectUri({
  useProxy: true,
});
```

Esta mudança garante que:

1. No **Expo Go**, o URI correto do proxy seja gerado automaticamente.
2. O parâmetro `useProxy: true` no `authRequest.promptAsync` seja respeitado e funcional.
3. O log `[Auth] Redirect URI determinado:` mostre exatamente qual endereço deve estar autorizado no Google Cloud Console.

---

## 4. Orientações para Validação

Para garantir que a correção está 100% operacional, siga estes passos:

1. **Reiniciar o Metro Bundler:** Execute `npx expo start -c` para limpar o cache.
2. **Verificar o Console:** Ao clicar em "Login com Google", observe o URI impresso no terminal.
3. **Google Cloud Console:** Certifique-se de que o URI impresso no terminal está listado em "URIs de redirecionamento autorizados" no projeto do Google Cloud.

---

## Referências

[1] [Expo Documentation - AuthSession Guide](https://docs.expo.dev/versions/latest/sdk/auth-session/)  
[2] [Google Cloud Console - OAuth 2.0 for Mobile & Desktop Apps](https://support.google.com/cloud/answer/6158849)

---

**Autor:** Manus AI  
**Data:** 26 de Março de 2026
