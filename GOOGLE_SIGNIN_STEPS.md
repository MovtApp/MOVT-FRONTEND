# Guia: Configuração Profissional do Google Login (MOVT)

Para que o login nativo funcione, você precisa configurar seu projeto no [Google Cloud Console](https://console.cloud.google.com/). Siga exatamente estes passos:

### 1. Criar Credenciais
No painel do Google Cloud (selecione o projeto MOVT):

#### **A. Cliente iOS (Obrigatório para iPhone)**
1.  Vá em **Credenciais** > **Criar Credenciais** > **ID do cliente OAuth**.
2.  Tipo de aplicativo: `iOS`.
3.  **Bundle ID**: `com.dsvmTechnology.movtapp` (conforme seu `app.json`).
4.  Crie e anote o **ID do cliente**.

#### **B. Cliente Android (Obrigatório para Android)**
1.  Vá em **Credenciais** > **Criar Credenciais** > **ID do cliente OAuth**.
2.  Tipo de aplicativo: `Android`.
3.  **Nome do pacote**: `com.dsvmTechnology.movtapp`.
4.  **Impressão digital SHA-1**:
    *   Se estiver usando EAS, rode `eas credentials -p android` no terminal para pegar a SHA-1 do certificado de build.
    *   Para desenvolvimento local (opcional), use a SHA-1 da sua `debug.keystore`.
5.  Crie e anote o **ID do cliente**.

#### **C. Cliente WEB (Obrigatório para o Supabase/Servidor)**
1.  Vá em **Credenciais** > **Criar Credenciais** > **ID do cliente OAuth**.
2.  Tipo de aplicativo: `Aplicativo da Web`.
3.  **Nome**: `MOVT Web/Backend`.
4.  **URIs de redirecionamento autorizados**: Adicione `https://ypnpdjgsyzdwsmnnhzbq.supabase.co/auth/v1/callback` (URL do seu Supabase).
5.  Crie e anote o **ID do cliente**. **Este é o ID mais importante que usaremos no código como `webClientId`**.

---

### 2. Configurar Tela de Consentimento OAuth
1.  Vá em **Tela de consentimento OAuth**.
2.  Certifique-se de que o app está em modo "Externo" (ou "Production" se já quiser liberar para todos).
3.  Adicione os escopos: `openid`, `https://www.googleapis.com/auth/userinfo.email`, `https://www.googleapis.com/auth/userinfo.profile`.
4.  Adicione seu e-mail como **Usuário de Teste** (ENQUANTO o app estiver em modo "Testing").

---

### 3. Gerar a Build de Desenvolvimento (Necessário!)
Como instalamos um módulo nativo, o **Expo Go não funcionará mais para o Google**. Você precisa gerar seu próprio "Expo Go" personalizado:

```bash
# Para Android
npx eas build --profile development --platform android

# Para iOS (requer macOS ou build na nuvem EAS)
npx eas build --profile development --platform ios
```

Depois de instalado no celular, rode com:
`npx expo start --dev-client`
