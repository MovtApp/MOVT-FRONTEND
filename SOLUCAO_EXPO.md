# 🚀 Como Resolver o Erro do Expo no Windows

Se você está lendo o QR Code e nada acontece no seu celular, siga este guia passo a passo.

---

### **1. O Problema Mais Comum: Firewall do Windows**
O Windows costuma bloquear a porta do Metro Bundler. Para testar se o problema é o Firewall, tente alternar para o modo **Tunnel**:

🛑 **Pare o comando atual (Ctrl + C)** e rode:
```bash
npm run start:tunnel
```
*O modo Tunnel cria um endereço na internet (tipo `ngrok.io`) que ignora o roteador e o firewall. Se funcionar assim, o problema é na sua rede local.*

---

### **2. O Erro do IP Errado (LAN)**
Se você quer usar o modo **LAN** (mais rápido), o Expo precisa usar o seu IP real da Wi-Fi (`192.168.15.45`). No Windows, ele às vezes pega o IP do WSL ou VirtualBox.

Para forçar o IP correto, use:
```bash
npx expo start --lan --host 192.168.15.45
```

---

### **3. IMPORTANTE: Você tem Módulos Nativos!**
Seu projeto usa `google-signin` e `ble-plx`. O aplicativo **Expo Go** (da Google Play / App Store) **NÃO CONSEGUE RODAR ISSO**.

Para testar no celular com módulos nativos, você precisa de um **Development Build**:

1.  Se você tiver o Gradle instalado no PC, tente rodar direto no cabo USB:
    ```bash
    npm run android
    ```
2.  Se quiser usar o celular sem fio com tudo funcionando, você deve primeiro gerar o APK de desenvolvimento:
    ```bash
    npx eas build --profile development --platform android
    ```
    *E depois instalar o APK gerado no seu celular.*

---

### **Sumário de Comandos Criados:**

- `npm start`: Inicia limpando o cache (Rede Local).
- `npm run start:tunnel`: Inicia via Tunnel (Garante conexão se a rede local falhar).
- `npm run dev-client`: Inicia para uso com **Development Build** instalado no celular.

---
**Dica Final:** Certifique-se que o celular e o PC estão no **MESMO Wi-Fi (mesma banda 2.4GHz ou 5GHz)**. Se estiver no PC via cabo e no celular via Wi-Fi, o roteador pode estar bloqueando a comunicação interna.
