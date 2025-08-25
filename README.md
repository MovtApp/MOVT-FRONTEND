# Movt App - App Mobile de Fitness e Bem-estar

Este é um projeto React Native com Expo que utiliza TypeScript, NativeWind (Tailwind CSS), e várias bibliotecas modernas para desenvolvimento mobile. O app é focado em fitness, treinos e acompanhamento de saúde.

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** (versão 18 ou superior)
- **npm** ou **yarn**
- **Expo CLI** (`npm install -g @expo/cli`)
- **Git**

## 🚀 Como executar o projeto

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd Movt
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Executar o projeto

```bash
# Iniciar com tunnel (para desenvolvimento remoto)
npx expo start --tunnel

# Iniciar com rede local
npx expo start --lan

# Iniciar apenas localhost
npx expo start --localhost
```

## 📁 Estrutura de Pastas

```
Movt/
├── assets/                    # Assets do Expo (ícones, splash)
├── src/
│   ├── __MOCK__/            # Dados mock para desenvolvimento
│   │   └── login_mock.json
│   ├── @types/              # Definições de tipos TypeScript
│   │   ├── authContextData.d.ts
│   │   ├── global.d.ts
│   │   ├── images.d.ts
│   │   ├── LoginDTOResponse.d.ts
│   │   └── routes.d.ts
│   ├── assets/              # Imagens e assets do app
│   │   ├── Background.png
│   │   ├── bulb.png
│   │   ├── document.png
│   │   ├── icon.png
│   │   ├── insights.png
│   │   ├── logo.png
│   │   ├── map-pin.png
│   │   ├── motion.png
│   │   ├── Navigation.png
│   │   ├── qrcode.png
│   │   └── woman-training.svg
│   ├── components/          # Componentes reutilizáveis
│   │   ├── BackButton.tsx
│   │   ├── Button.tsx
│   │   ├── ContainerX.tsx
│   │   ├── CustomInput.tsx
│   │   ├── Input.tsx
│   │   ├── SearchInput.tsx
│   │   ├── SelectInput.tsx
│   │   ├── Sidebar.tsx
│   │   ├── SocialButton.tsx
│   │   ├── Text.tsx
│   │   └── Typography.tsx
│   ├── config/             # Configurações do app
│   │   └── api.ts
│   ├── contexts/           # Contextos React
│   │   └── AuthContext.tsx
│   ├── hooks/              # Hooks customizados
│   │   └── useAuth.tsx
│   ├── lib/                # Utilitários e funções
│   │   └── utils.ts
│   ├── routes/             # Configuração de navegação
│   │   ├── App.routes.tsx
│   │   ├── Auth.routes.tsx
│   │   ├── Info.routes.tsx
│   │   ├── Verify.routes.tsx
│   │   └── index.tsx
│   ├── screens/            # Telas do aplicativo
│   │   ├── App/
│   │   │   └── HomeScreen.tsx
│   │   ├── Auth/
│   │   │   ├── signinScreen.tsx
│   │   │   ├── signupScreen.tsx
│   │   │   └── startupScreen.tsx
│   │   ├── Info/
│   │   │   ├── AgeScreen.tsx
│   │   │   ├── GenderScreen.tsx
│   │   │   ├── HeightScreen.tsx
│   │   │   ├── LevelScreen.tsx
│   │   │   ├── ObjectivesScreen.tsx
│   │   │   ├── WeightScreen.tsx
│   │   │   └── WidthScreen.tsx
│   │   ├── Verify/
│   │   │   ├── RecoveryScreen.tsx
│   │   │   ├── verifyAccountScreen.tsx
│   │   │   ├── VerifyCNPJScreen.tsx
│   │   │   ├── verifyCompanyScreen.tsx
│   │   │   ├── VerifyCrefScreen.tsx
│   │   │   └── verifyPhoneScreen.tsx
│   │   └── splashScreen.tsx
│   ├── services/           # Serviços e APIs
│   │   ├── api.ts
│   │   ├── services.ts
│   │   └── supabaseClient.ts
│   └── styles/             # Estilos e configurações de design
│       ├── colors.ts
│       ├── global.css
│       └── spacings.ts
├── .gitignore
├── .prettierrc
├── .eslintignore
├── .eslintrc.js
├── app.json                # Configuração do Expo
├── App.tsx                 # Componente principal
├── babel.config.js
├── eas.json                # Configuração do EAS Build
├── eslint.config.js
├── global.css              # Estilos globais
├── index.ts                # Ponto de entrada
├── metro.config.js
├── nativewind-env.d.ts     # Tipos do NativeWind
├── package.json
├── tailwind.config.js      # Configuração do Tailwind CSS
└── tsconfig.json           # Configuração do TypeScript
```

## 🎯 Funcionalidades do App

### **Autenticação e Onboarding**

- Tela de startup
- Login e cadastro
- Verificação de conta
- Recuperação de senha
- Coleta de informações do usuário (idade, gênero, peso, altura, etc.)

### **Tela Principal (Home)**

- Dashboard com cards informativos
- Sidebar de navegação
- Acesso rápido às funcionalidades

### **Navegação**

- Sistema de rotas organizado por contexto
- Navegação entre telas de autenticação, informações e app principal
- Sidebar responsivo

## 🛠️ Tecnologias Utilizadas

### **Core**

- **React Native** 0.79.2 - Framework mobile
- **Expo** 53.0.9 - Plataforma de desenvolvimento
- **TypeScript** 5.8.3 - Linguagem de programação
- **React** 19.0.0 - Biblioteca de interface

### **Estilização**

- **NativeWind** 4.1.23 - Tailwind CSS para React Native
- **Tailwind CSS** 3.4.17 - Framework CSS utilitário
- **Expo Google Fonts (Rubik)** - Fontes personalizadas

### **Navegação**

- **React Navigation** 7.x - Navegação entre telas
- **React Native Screens** - Otimizações de performance

### **Formulários e Validação**

- **React Hook Form** 7.60.0 - Gerenciamento de formulários
- **Zod** 3.25.76 - Validação de schemas
- **@hookform/resolvers** - Integração entre React Hook Form e Zod

### **Backend e APIs**

- **Supabase** 2.50.3 - Backend as a Service
- **Axios** 1.9.0 - Cliente HTTP

### **UI/UX**

- **Lucide React Native** 0.541.0 - Ícones
- **React Native Paper** 5.14.5 - Componentes Material Design
- **React Native Reanimated** 3.17.4 - Animações
- **React Native Gesture Handler** - Gestos

### **Utilitários**

- **React Native SVG** 13.14.0 - Suporte a SVG
- **Expo Image Picker** - Seleção de imagens
- **Expo Document Picker** - Seleção de documentos
- **AsyncStorage** - Armazenamento local
- **React Native Phone Number Input** - Input de telefone

### **Desenvolvimento**

- **ESLint** 9.0.0 - Linting de código
- **Prettier** 3.5.3 - Formatação de código
- **Babel** - Transpilador JavaScript

## ⚙️ Configurações

### **Expo**

- Versão: 53.0.9
- Plataformas: iOS, Android, Web
- Suporte a novas arquiteturas do React Native

### **TypeScript**

- Configuração estrita
- Path mapping para imports
- Suporte a tipos avançados

### **Tailwind CSS**

- Configuração customizada
- Suporte a NativeWind
- Animações e transições

### **ESLint e Prettier**

- Configuração do Rocketseat
- Regras específicas para React Native
- Formatação automática

## 🚀 Scripts Disponíveis

```bash
npm start          # Inicia o servidor de desenvolvimento
npm run android    # Executa no Android
npm run ios        # Executa no iOS
npm run web        # Executa na web
npm run lint       # Executa o linter
```

## 📱 Como Testar

### **1. Instalar Expo Go**

- **Android**: Google Play Store
- **iOS**: App Store

### **2. Executar o projeto**

```bash
npm start
```

### **3. Escanear o QR Code**

- Use o Expo Go para escanear o QR code
- Ou digite a URL manualmente

### **4. Modos de desenvolvimento**

- **Tunnel**: Para desenvolvimento remoto (pode ser instável)
- **LAN**: Para desenvolvimento na mesma rede WiFi
- **Localhost**: Para desenvolvimento local

## 🔧 Configurações de Desenvolvimento

### **Variáveis de Ambiente**

- Configure as variáveis do Supabase em `src/services/supabaseClient.ts`
- Adicione chaves de API necessárias

### **Configuração do Metro**

- Suporte a SVG
- Resolução de módulos
- Cache otimizado

### **Babel**

- Plugin de resolução de módulos
- Suporte a decorators
- Otimizações para React Native

## 📝 Notas Importantes

- **Node.js**: Versão 18+ recomendada
- **Expo CLI**: Instale globalmente para melhor experiência
- **Tunnel**: Pode falhar em algumas redes corporativas
- **Dependências**: Use `--legacy-peer-deps` se necessário
- **Cache**: Use `--clear` se houver problemas de build

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

Se encontrar problemas:

1. Verifique se todas as dependências estão instaladas
2. Limpe o cache: `npx expo start --clear`
3. Verifique a versão do Node.js
4. Consulte a documentação do Expo
5. Abra uma issue no repositório

---

**Desenvolvido com ❤️ usando React Native e Expo**
