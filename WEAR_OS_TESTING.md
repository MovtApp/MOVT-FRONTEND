# 🧪 Guia Completo: Testar Wear OS com Expo

## 📋 Pré-requisitos

✅ Android Studio instalado
✅ ADB configurado no PATH
✅ Node.js e npm instalados
✅ Projeto Expo atualizado

---

## ⚙️ **PASSO 1: Criar/Iniciar Emulador Wear OS**

### Opção A: Criar Novo Emulador (primeira vez)

1. **Abra Android Studio**
2. Vá em **Tools → Device Manager**
3. Clique em **Create Device**
4. Em "Category", selecione **Wear OS**
5. Escolha um modelo:
   - **Wear OS Large Round API 30** (recomendado)
   - Wear OS Small Square API 30
6. Clique **Next**
7. Selecione **API Level 30** (ou superior)
8. Clique **Next** e depois **Finish**

### Opção B: Usar Emulador Existente

Se você já tem um emulador:

```bash
# Listar todos os emuladores
emulator -list-avds
```

Procure por um que tenha "Wear" no nome.

---

## 🚀 **PASSO 2: Iniciar o Emulador**

### Via Android Studio (mais fácil)
1. Device Manager → Seu emulador Wear OS
2. Clique no botão ▶️ (Play/Start)
3. Aguarde ~1-2 minutos até carregar completamente

### Via Terminal
```bash
# Substitua WearOSLargeRound pelo seu emulador
emulator -avd WearOSLargeRound -netdelay none -netspeed full
```

**⏳ Aguarde completamente carregar!** Você verá a tela inicial do Wear OS.

---

## ✅ **PASSO 3: Verificar Conexão ADB**

Aguarde o emulador carregar e teste a conexão:

```bash
adb devices
```

**Saída esperada:**
```
List of devices attached
emulator-5554   device
```

Se aparecer `offline` ou vazio, aguarde mais um pouco e tente novamente.

---

## 🔨 **PASSO 4: Iniciar o App Expo**

Na pasta do projeto, execute:

```bash
# Versão 1: Com modo de desenvolvimento (RECOMENDADO)
npx expo run:android

# Versão 2: Expo Go (mais rápido, menos funcionalidades)
npx expo start
# Depois pressione 'a' para abrir no Android
```

O app será compilado e instalado automaticamente no emulador.

**Quando ver "Metro waiting on..." - sucesso!** ✅

---

## 🧪 **PASSO 5: Acessar Tela de Teste Wear OS**

Há duas formas:

### Opção 1: Via App Navigation
1. No app, abra o **Menu** (icon de menu)
2. Procure por **"Test Wear"** ou **"TestWearScreen"**
3. Clique para abrir

### Opção 2: Via Comando (debugging)
No terminal onde rodou `npx expo`:
```
Press w › open web
Press a › open Android
Press ? › show all commands
```

Se precisar recarregar:
```
Press r › reload app
```

---

## 📱 **PASSO 6: Executar Testes**

Na tela de teste, você verá 5 botões. Execute nesta ordem:

### 1️⃣ **Verificar Permissões**
- Clique: "1️⃣ Verificar Permissões"
- **Resultado esperado:** "Permissões: Negadas ❌" (na primeira vez)
- Se disser "Concedidas ✅", pule para passo 4

### 2️⃣ **Solicitar Autorização**
- Clique: "2️⃣ Solicitar Autorização"
- Vai aparecer um **diálogo solicitando permissões**
- **Selecione "Permitir tudo"** ou **"Permitir"** (Android 13+)
- Aguarde a mensagem "Dispositivo registrado com sucesso"

### 3️⃣ **Fluxo Completo** (opcional)
- Se quiser testar o fluxo UI completo
- Clique: "3️⃣ Fluxo Completo"
- Vai abrir diálogos amigáveis

### 4️⃣ **Verificar Dispositivo**
- Clique: "4️⃣ Verificar Dispositivo"
- **Resultado esperado:**
  ```
  ✅ Dispositivo encontrado!
  Nome: Wear OS 10
  Tipo: Wear OS
  Status: ativo
  ID: [número]
  ```

### 5️⃣ **Buscar Dados de Saúde**
- Clique: "5️⃣ Buscar Dados de Saúde"
- **Primeiro: Pode aparecer "N/A"** (é normal)
  - Os sensores precisam 5-10 segundos para iniciar
  - O banco de dados precisa receber dados
- **Aguarde e clique novamente**
- **Resultado esperado:**
  ```
  ✅ Dados recebidos!
  Frequência Cardíaca: 72 bpm
  Pressão Arterial: 120 mmHg
  Saturação O2: 98%
  ```

---

## 🐛 **Troubleshooting**

### ❌ "Permissões negadas"

**Causa:** Você clicou "Negar" ou o Android pediu novamente

**Solução:**
1. Abra **Configurações** do Wear OS (no emulador)
2. **Aplicativos → Permissões**
3. Procure por seu app
4. Ative:
   - ✅ Sensores do Corpo
   - ✅ Reconhecimento de Atividade

### ❌ "Nenhum dispositivo encontrado"

**Causa:** Dispositivo não registrado no banco

**Solução:**
1. Verifique internet no emulador
2. Verifique conexão com Supabase
3. Clique novamente em "Solicitar Autorização"

### ❌ "Dados: N/A" na busca de saúde

**Causa:** Sensores não geraram dados ainda

**Soluções:**
1. **Simule dados no Wear OS:**
   - Abra Settings no Wear OS
   - Busque "Health" ou "Fitness"
   - Ative dados simulados
   
2. **Ou aguarde 30 segundos e tente novamente**

3. **Ou instale app fitness no Wear** (como Google Fit)

### ❌ "emulator-5554 offline"

**Causa:** Emulador não respondendo ao ADB

**Solução:**
```bash
# Reiniciar ADB
adb kill-server
adb start-server

# Aguarde e tente novamente
adb devices
```

### ❌ "Não abre a tela de teste"

**Causa:** Rota não adicionada ou erro de navegação

**Solução:**
```bash
# Recarregar app
Press r › reload app

# Ou reconstruir
npm run prebuild -- --clean
npx expo run:android
```

---

## 📊 **Interpretar Resultados**

### ✅ Sucesso Completo
```
✅ Autorização bem-sucedida!
Dispositivo: Wear OS 10
ID: 42

✅ Dispositivo encontrado!
Status: ativo

✅ Dados recebidos!
Frequência Cardíaca: 72 bpm
Pressão Arterial: 120 mmHg
Saturação O2: 98%
```

### ⚠️ Aviso (Normal)
- "Dados: N/A" → Sensores não iniciaram, aguarde 30 seg
- "Permissões: Negadas" na primeira vez → Normal, autorize

### ❌ Erro (Investigar)
- "Erro ao registrar dispositivo" → Problema com banco/internet
- "Falha ao solicitar permissões" → Problema com Android/emulador

---

## 🔄 **Dados em Tempo Real** (Avançado)

Após autorizar, o app coleta dados em tempo real:

1. **Frequência Cardíaca** - Atualiza a cada pulso
2. **Pressão Arterial** - Atualiza conforme medições
3. **Saturação O2** - Atualiza com leituras

Visualize em **HeartbeatsScreen** após 5 segundos.

---

## 📈 **Monitorar Logs**

Para ver logs detalhados do Wear OS:

```bash
# Terminal 1: Rodando emulador
adb logcat -s WearOS

# Terminal 2: Seu projeto Expo
npx expo start
```

Procure por mensagens como:
```
[Wear OS Test] Verificando permissões...
[Wear OS Test] ✓ Permissões: Concedidas ✅
[Wear OS Test] Buscando dados...
```

---

## ✨ **Próximas Etapas**

1. **Integrar em Telas Reais:**
   - Adicione `WearOsAuthorizationCard` em ProfileScreen
   - Adicione em SettingsScreen

2. **Monitora em Tempo Real:**
   - Use `useWearOsAuthorization` hook
   - Implemente polling de dados

3. **Notificações:**
   - Alerte usuário quando BPM > 100
   - Alerte quando satO2 < 95%

4. **Gráficos:**
   - Mostre histórico no HeartbeatsScreen
   - Use Chart library para visualizar

---

## 🆘 **Suporte**

Se tudo falhar:

1. **Reiniciar Tudo:**
```bash
# Kill emulator
adb emu kill

# Kill ADB
adb kill-server

# Aguarde 5 segundos

# Reinicie do zero
```

2. **Limpar Cache Expo:**
```bash
npx expo prebuild --clean
npm install
npx expo run:android
```

3. **Checar Logs:**
```bash
adb logcat | grep -E "Wear|Permission|Error"
```

4. **Docs Oficiais:**
- https://developer.android.com/wear
- https://docs.expo.dev/
- https://reactnative.dev/

---

## 📝 **Checklist Final**

- [ ] Emulador Wear OS aberto
- [ ] ADB mostra `device` (não offline)
- [ ] App rodando no Expo
- [ ] Tela de teste acessível
- [ ] Botão 1 mostra status de permissões
- [ ] Botão 2 autoriza com sucesso
- [ ] Botão 4 encontra dispositivo registrado
- [ ] Botão 5 busca dados (ou mostra N/A após aguardar)
- [ ] Logs aparecem no terminal

**Se ✅ em todos = SUCESSO! 🎉**

