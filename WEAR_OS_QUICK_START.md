# ⚡ Wear OS - Início Rápido (5 Minutos)

## 🚀 Começar Agora

### 1. Iniciar Emulador
```bash
# Android Studio → Device Manager → Seu Wear OS → Play (▶️)
# OU terminal:
emulator -avd WearOSLargeRound -netdelay none -netspeed full
```
⏳ **Aguarde 1-2 minutos carregarem**

### 2. Verificar Conexão
```bash
adb devices
# Deve aparecer: emulator-5554   device
```

### 3. Rodar Projeto
```bash
cd seu-projeto
npx expo run:android
# OU
npx expo start
# (depois pressione 'a')
```

### 4. Abrir Tela de Teste
- Navegue no app até **TestWearScreen**
- Ou abre o menu e procura "Test"

### 5. Testar (Na Ordem)
```
1️⃣ Clique "Verificar Permissões"
   → Deve mostrar: Negadas ❌

2️⃣ Clique "Solicitar Autorização"
   → Clique Permitir no diálogo
   → Deve mostrar: ✅ Autorização bem-sucedida!

3️⃣ Clique "Verificar Dispositivo"
   → Deve mostrar dispositivo encontrado ✅

4️⃣ Clique "Buscar Dados de Saúde"
   → Primeira vez: N/A (normal!)
   → Aguarde 10 seg
   → Clique novamente
   → Deve mostrar BPM, Pressão, O2
```

---

## 🎯 Resultado Esperado

```
✅ Permissões: Concedidas ✅
✅ Autorização bem-sucedida!
   Dispositivo: Wear OS 10
   ID: 42

✅ Dispositivo encontrado!
   Nome: Wear OS 10
   Tipo: Wear OS
   Status: ativo

✅ Dados recebidos!
   Frequência Cardíaca: 72 bpm
   Pressão Arterial: 120 mmHg
   Saturação O2: 98%
```

**Se aparecer assim = SUCESSO! 🎉**

---

## 🆘 Se não funcionar

| Erro | Solução |
|------|---------|
| `emulator offline` | `adb kill-server && adb start-server` |
| `Permissões negadas` | Clique "Tentar novamente" |
| `Nenhum dispositivo` | Aguarde 30 seg e clique novamente |
| `Dados: N/A` | Normal! Aguarde 10 seg e retry |
| `App não abre` | `Press r` (reload) no Expo |

---

## 📚 Documentação Completa

- **Setup Detalhado:** `WEAR_OS_TESTING.md`
- **Código Fonte:** `src/services/wearOsPermissions.ts`
- **Hook:** `src/hooks/useWearOsAuthorization.ts`
- **Componente:** `src/components/WearOsAuthorizationCard.tsx`

---

## 💡 Dicas

✨ **Dados em Tempo Real:**
- Aparecem em `HeartbeatsScreen` após autorizar
- Atualizam a cada 5 segundos via polling

✨ **Para Integrar em Outras Telas:**
```typescript
import { WearOsAuthorizationCard } from '@/components/WearOsAuthorizationCard';

<WearOsAuthorizationCard />
```

✨ **Usar Hook em Componentes:**
```typescript
const { isAuthorized, requestAuthorization } = useWearOsAuthorization();
```

---

## ✅ Checklist

- [ ] Emulador aberto e respondendo
- [ ] `adb devices` mostra `device`
- [ ] App rodando no Expo
- [ ] TestWearScreen acessível
- [ ] Todos os 4 testes passando
- [ ] Dados aparecendo (ou N/A na primeira)

**Todos marcados? Parabéns! 🎊**

---

## 🔗 Links Úteis

- [Google Fit API](https://developers.google.com/fit)
- [Wear OS Docs](https://developer.android.com/wear)
- [Expo Docs](https://docs.expo.dev/)
- [React Native Sensors](https://github.com/react-native-sensors)

