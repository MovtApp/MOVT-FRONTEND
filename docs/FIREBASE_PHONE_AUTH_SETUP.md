# Validação de telefone — Firebase Phone Auth

Substitui o Twilio Verify. O Firebase é usado **só para validar o número** do
usuário (não é provedor de login do app).

## Fluxo

1. App: `GET /api/user/phone` → pega o telefone do cadastro em E.164.
2. App: `firebasePhoneAuth.startPhoneVerification(phone)` → SDK nativo manda o SMS.
3. App: usuário digita o código → `confirmPhoneCode()` devolve o **ID token** do Firebase e faz `signOut`.
4. App: `POST /api/user/verify-phone-firebase { idToken }`.
5. Backend: valida a assinatura do token contra as **chaves públicas do Google** (sem service account key), confere que `phone_number` do token == telefone do cadastro e marca `phone_verified = TRUE`.

## ⚠️ O que falta fazer manualmente (config — não dá pra gerar por código)

### 1. Firebase Console
- Criar/usar um projeto Firebase.
- **Authentication → Sign-in method → Phone**: habilitar.
- Registrar os apps:
  - **Android** package `com.dsvmTechnology.movtapp` → baixar `google-services.json`.
  - **iOS** bundle `com.dsvmTechnology.movtapp` → baixar `GoogleService-Info.plist`.
- Android: adicionar o **SHA-1 e SHA-256** das chaves de assinatura (debug + EAS/Play) em Project Settings → Your apps → Android → SHA. Sem isso o reCAPTCHA/Play Integrity falha e o SMS não chega.
- (Recomendado) habilitar **App Check** / Play Integrity.

### 2. Arquivos no repo do app (`MOVT/`)
Colocar na raiz (já referenciados no `app.json`, e devem ficar no `.gitignore`):
- `./google-services.json`
- `./GoogleService-Info.plist`

### 3. Backend (Vercel `movt-backend`)
Validação **keyless** (sem service account key — evita a política `iam.disableServiceAccountKeyCreation`). O token é verificado contra as chaves públicas do Google usando só o Project ID (público).
- Env var **`FIREBASE_PROJECT_ID`** = `project-90fe8125-2ee6-4141-a10` (NÃO é segredo).
- Remover as env vars antigas do Twilio (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID`).
- Não usa mais `firebase-admin`; o backend valida o JWT com `jsonwebtoken` + `axios`. Rodar deploy.

### 4. App — rebuild nativo
Os módulos `@react-native-firebase/*` são nativos → **não rodam em Expo Go**.
Precisa de um novo dev build / EAS build:

```
eas build --profile development --platform android   # ou ios
```

(rodar manualmente — não disparado automaticamente).
