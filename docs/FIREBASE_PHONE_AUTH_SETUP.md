# Validação de telefone — Firebase Phone Auth

Substitui o Twilio Verify. O Firebase é usado **só para validar o número** do
usuário (não é provedor de login do app).

## Fluxo

1. App: `GET /api/user/phone` → pega o telefone do cadastro em E.164.
2. App: `firebasePhoneAuth.startPhoneVerification(phone)` → SDK nativo manda o SMS.
3. App: usuário digita o código → `confirmPhoneCode()` devolve o **ID token** do Firebase e faz `signOut`.
4. App: `POST /api/user/verify-phone-firebase { idToken }`.
5. Backend: `firebase-admin` valida o token, confere que `phone_number` do token == telefone do cadastro e marca `phone_verified = TRUE`.

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
- Env var **`FIREBASE_SERVICE_ACCOUNT`** = JSON do service account (Project Settings → Service accounts → Generate new private key), colado como string única.
- Remover as env vars antigas do Twilio (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID`).
- `firebase-admin` já está no `package.json`; rodar deploy.

### 4. App — rebuild nativo
Os módulos `@react-native-firebase/*` são nativos → **não rodam em Expo Go**.
Precisa de um novo dev build / EAS build:

```
eas build --profile development --platform android   # ou ios
```

(rodar manualmente — não disparado automaticamente).
