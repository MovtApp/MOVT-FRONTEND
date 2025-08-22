# Movt App - App Mobile

Este é um projeto React Native com Expo que utiliza TypeScript, NativeWind (Tailwind CSS), e várias bibliotecas modernas para desenvolvimento mobile.

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** (versão 18 ou superior)
- **npm** ou **yarn**
- **Expo CLI** (`npm install -g @expo/cli`)
- **Git**

## 🚀 Como criar o projeto

### 1. Criar o projeto Expo

```bash
npx create-expo-app@latest Movt --template blank-typescript
cd Movt
```

### 2. Instalar dependências

```bash
npm install @expo/metro-runtime@~5.0.4 @gorhom/bottom-sheet@^5.1.2 @react-native-async-storage/async-storage@2.1.2 @react-native-community/datetimepicker@^8.4.2 @react-navigation/bottom-tabs@^7.3.3 @react-navigation/elements@^2.3.1 @react-navigation/native@^7.0.19 @react-navigation/native-stack@^7.3.3 @rn-primitives/checkbox@^1.1.0 @rn-primitives/portal@^1.1.0 @rn-primitives/progress@^1.1.0 @rn-primitives/slot@^1.1.0 @rn-primitives/types@^1.1.0 axios@^1.9.0 class-variance-authority@^0.7.1 clsx@^2.1.1 expo-clipboard@~7.1.4 expo-document-picker@~13.1.6 expo-image-picker@^16.1.4 expo-linking@~7.1.4 expo-sharing@~13.1.5 expo-splash-screen@~0.30.8 expo-status-bar@~2.2.3 expo-updates@~0.28.12 fs-extra@^11.3.0 lucide-react-native@^0.486.0 nativewind@^4.1.23 react-dom@^19.0.0 react-native-gesture-handler@~2.24.0 react-native-mask-input@^1.2.3 react-native-modal-datetime-picker@^18.0.0 react-native-reanimated@~3.17.4 react-native-safe-area-context@5.4.0 react-native-screens@~4.10.0 react-native-svg@15.11.2 react-native-web@^0.20.0 tailwind-merge@^3.1.0 tailwindcss-animate@^1.0.7
```

### 3. Instalar dependências de desenvolvimento

```bash
npm install --save-dev @babel/core@^7.25.2 @rocketseat/eslint-config@^2.2.2 @types/react@~19.0.10 babel-plugin-module-resolver@^5.0.2 eslint@^9.0.0 eslint-config-expo@~9.2.0 eslint-config-prettier@^10.1.5 eslint-plugin-prettier@^5.4.0 prettier@^3.5.3 prettier-plugin-tailwindcss@^0.6.11 react-native-svg-transformer@^1.5.0 tailwindcss@^3.4.17 typescript@~5.8.3
```

## 📁 Estrutura de Pastas

```
Movt/
├── assets/
│   ├── icon.png
│   ├── icon@2x.png
│   ├── icon@3x.png
│   ├── logo.png
│   ├── logo@2x.png
│   └── logo@3x.png
├── src/
│   ├── __MOCK__/
│   │   ├── coleta_mock.json
│   │   ├── despacho_mock.json
│   │   ├── entrega_mock.json
│   │   ├── login_mock.json
│   │   ├── manifest_mock.json
│   │   ├── retirada_mock.json
│   │   ├── transferencia_mock.json
│   │   └── unidades_mock.json
│   ├── @types/
│   │   ├── authContextData.d.ts
│   │   ├── coletaDTO.d.ts
│   │   ├── deliveryDTO.d.ts
│   │   ├── despachoDTO.d.ts
│   │   ├── detalhesColetaDTO.d.ts
│   │   ├── detalhesDespachoDTO.d.ts
│   │   ├── detalhesEntregaDTO.d.ts
│   │   ├── detalhesRetiradaDTO.d.ts
│   │   ├── detalhesTransferenciaDTO.d.ts
│   │   ├── global.d.ts
│   │   ├── images.d.ts
│   │   ├── LoginDTOResponse.d.ts
│   │   ├── manifestDTO.d.ts
│   │   ├── retiradaDTO.d.ts
│   │   ├── routes.d.ts
│   │   ├── svgtransforms.d.ts
│   │   └── transferenciaDTO.d.ts
│   ├── assets/
│   │   ├── Arrow-down.png
│   │   ├── Arrow-down@2x.png
│   │   ├── Arrow-down@3x.png
│   │   ├── Arrow-left.png
│   │   ├── Arrow-left@2x.png
│   │   ├── Arrow-left@3x.png
│   │   ├── Arrow-right.png
│   │   ├── Arrow-right@2x.png
│   │   ├── Arrow-right@3x.png
│   │   ├── Arrow-up.png
│   │   ├── Arrow-up@2x.png
│   │   ├── Arrow-up@3x.png
│   │   ├── Background.png
│   │   ├── bulb.png
│   │   ├── bulb@2x.png
│   │   ├── bulb@3x.png
│   │   ├── Curved-Arrow.png
│   │   ├── Curved-Arrow@2x.png
│   │   ├── Curved-Arrow@3x.png
│   │   ├── document.png
│   │   ├── document@2x.png
│   │   ├── document@3x.png
│   │   ├── icon.png
│   │   ├── icon@2x.png
│   │   ├── icon@3x.png
│   │   ├── insights.png
│   │   ├── insights@2x.png
│   │   ├── insights@3x.png
│   │   ├── logo.png
│   │   ├── logo@2x.png
│   │   ├── logo@3x.png
│   │   ├── map.png
│   │   ├── map@2x.png
│   │   ├── map@3x.png
│   │   ├── Navigation.png
│   │   ├── Navigation@2x.png
│   │   └── Navigation@3x.png
│   ├── components/
│   │   ├── AutocompleteInput.tsx
│   │   ├── BackButton.tsx
│   │   ├── BottomSheetPicker.tsx
│   │   ├── Button.tsx
│   │   ├── Checkbox.tsx
│   │   ├── ContainerAppCpX.tsx
│   │   ├── ContainerX.tsx
│   │   ├── CustomModal.tsx
│   │   ├── DateTimePickerModal.tsx
│   │   ├── DetailsBottomSheet.tsx
│   │   ├── FileUpload.tsx
│   │   ├── GenericListCard.tsx
│   │   ├── InputField.tsx
│   │   ├── Progress.tsx
│   │   ├── Text.tsx
│   │   └── Typography.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── hooks/
│   │   └── useAuth.tsx
│   ├── lib/
│   │   └── utils.ts
│   ├── routes/
│   │   ├── App.routes.tsx
│   │   ├── Auth.routes.tsx
│   │   └── index.tsx
│   ├── screens/
│   │   ├── App/
│   │   │   ├── collectionScreen.tsx
│   │   │   ├── deliveryScreen.tsx
│   │   │   ├── dispatchScreen.tsx
│   │   │   ├── manifestScreen.tsx
│   │   │   ├── transferScreen.tsx
│   │   │   └── withDrawalScreen.tsx
│   │   ├── Auth/
│   │   │   ├── signInScreen.tsx
│   │   │   └── startupScreen.tsx
│   │   └── splashScreen.tsx
│   ├── service/
│   │   ├── api.ts
│   │   └── services.ts
│   └── styles/
│       ├── colors.ts
│       ├── global.css
│       └── spacings.ts
├── .gitignore
├── .prettierrc
├── .eslintignore
├── .eslintrc.js
├── app.json
├── App.tsx
├── babel.config.js
├── eas.json
├── eslint.config.js
├── global.css
├── index.ts
├── metro.config.js
├── nativewind-env.d.ts
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## ⚙️ Configuração dos Arquivos

Todos os arquivos de configuração já foram criados conforme especificado no README de referência:

- **package.json** - Dependências e scripts
- **app.json** - Configuração do Expo
- **tailwind.config.js** - Configuração do Tailwind CSS
- **tsconfig.json** - Configuração do TypeScript
- **babel.config.js** - Configuração do Babel
- **metro.config.js** - Configuração do Metro
- **eslint.config.js** - Configuração do ESLint
- **.prettierrc** - Configuração do Prettier
- **nativewind-env.d.ts** - Tipos do NativeWind
- **global.css** - Estilos globais
- **eas.json** - Configuração do EAS Build

## 🎯 Scripts Disponíveis

- `npm start` - Inicia o servidor de desenvolvimento
- `npm run android` - Executa no Android
- `npm run ios` - Executa no iOS
- `npm run web` - Executa na web
- `npm run lint` - Executa o linter

## 📱 Tecnologias Utilizadas

- **React Native** - Framework mobile
- **Expo** - Plataforma de desenvolvimento
- **TypeScript** - Linguagem de programação
- **NativeWind** - Tailwind CSS para React Native
- **React Navigation** - Navegação entre telas
- **Axios** - Cliente HTTP
- **React Native Reanimated** - Animações
- **React Native Gesture Handler** - Gestos
- **React Native SVG** - Suporte a SVG
- **Expo Image Picker** - Seleção de imagens
- **Expo Document Picker** - Seleção de documentos
- **AsyncStorage** - Armazenamento local

## 🔧 Configurações Adicionais

### Configuração do ESLint

O arquivo `.eslintrc.js` foi criado na raiz do projeto com as configurações do Rocketseat.

### Configuração do .gitignore

O arquivo `.gitignore` já está configurado para projetos Expo/React Native.

## 🚀 Executando o Projeto

1. Clone o repositório ou crie a estrutura conforme descrito acima
2. Instale as dependências: `npm install`
3. Execute o projeto: `npm start`
4. Use o Expo Go no seu dispositivo ou emulador para testar

## 📝 Notas Importantes

- Certifique-se de ter o Expo CLI instalado globalmente
- Para desenvolvimento iOS, você precisará do Xcode (apenas macOS)
- Para desenvolvimento Android, você precisará do Android Studio
- O projeto utiliza a nova arquitetura do React Native (newArchEnabled: true)
- Todas as imagens e assets devem ser colocados nas pastas correspondentes
- Os arquivos de mock devem ser criados na pasta `src/__MOCK__/`

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.
