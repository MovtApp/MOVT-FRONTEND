# Configuração do ProfileScreen

## ✅ Implementação Completa

A tela de perfil foi totalmente integrada ao aplicativo e é acessível através de múltiplos pontos de entrada.

## Arquivo Principal

**Localização:** `src/screens/App/profile/profileScreen.tsx`

## Pontos de Acesso

### 1. **Sidebar (Menu Lateral)**
- Clique no avatar ou nome do usuário no topo do sidebar
- Navega automaticamente para ProfileScreen
- O sidebar fecha após a navegação

**Código:**
```typescript
const handleProfilePress = () => {
  navigation.navigate("ProfileScreen");
  close();
};

<TouchableOpacity style={styles.profileInfo} onPress={handleProfilePress}>
  {/* Avatar e Nome */}
</TouchableOpacity>
```

### 2. **Rotas Registradas**

O ProfileScreen foi adicionado ao arquivo `src/routes/App.routes.tsx`:

```typescript
<Stack.Screen name="ProfileScreen" component={ProfileScreen} />
```

### 3. **Tipos TypeScript**

O ProfileScreen foi adicionado ao arquivo `src/@types/routes.d.ts`:

```typescript
export type AppStackParamList = {
  ...
  ProfileScreen: undefined;
  ...
};
```

## Funcionalidades

A tela de ProfileScreen exibe:

✅ **Avatar do Usuário**
- Foto de perfil se disponível
- Ícone de usuário como fallback

✅ **Informações Pessoais**
- Nome completo
- Username
- Email
- Status de verificação (verificado/não verificado)
- ID do usuário

✅ **Ações**
- **Editar Perfil** - Botão roxo (funcionalidade futura)
- **Sair da Aplicação** - Botão vermelho com confirmação

✅ **Design Responsivo**
- Cards informativos com ícones
- Bordas destacadas em verde (#BBF246)
- Scroll automático para conteúdo extenso
- Safe area respeitada

## Fluxo de Navegação

```
Sidebar (Menu)
    ↓
Clique no Avatar/Nome
    ↓
handleProfilePress()
    ↓
navigation.navigate("ProfileScreen")
    ↓
ProfileScreen
    ├─ Exibir dados do usuário
    ├─ Opção de editar
    └─ Opção de sair
```

## Dados do Usuário

Os dados exibidos vêm do `useAuth()` hook:

```typescript
const { user, signOut } = useAuth();

// Usuário contém:
interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  isVerified: boolean;
  photo?: string | null;
  sessionId?: string;
}
```

## Logout

Ao clicar em "Sair da Aplicação":

1. Mostra um Alert de confirmação
2. Opção para cancelar ou confirmar
3. Se confirmado, executa `signOut()`
4. Remove dados do AsyncStorage
5. Redireciona para tela de login

## Como Expandir

### Adicionar mais campos
Edite o arquivo `src/screens/App/profile/profileScreen.tsx` e adicione cards informativos:

```typescript
<View style={styles.infoCard}>
  <View style={styles.infoIconContainer}>
    <Icon size={20} color="#192126" />
  </View>
  <View style={styles.infoContent}>
    <Text style={styles.infoLabel}>Novo Campo</Text>
    <Text style={styles.infoValue}>{user.newField}</Text>
  </View>
</View>
```

### Implementar edição
1. Criar tela de edição: `EditProfileScreen.tsx`
2. Adicionar ao arquivo de rotas
3. Conectar ao botão "Editar Perfil"

### Adicionar mais ações
Adicione novos TouchableOpacity buttons na seção actionSection:

```typescript
<TouchableOpacity style={styles.customButton}>
  <Icon size={18} color="#fff" />
  <Text style={styles.customButtonText}>Ação</Text>
</TouchableOpacity>
```

## Testes

Para testar a integração:

1. ✅ Abrir o sidebar
2. ✅ Clicar no avatar/nome
3. ✅ Verificar se exibe os dados corretos
4. ✅ Testar o botão "Sair da Aplicação"
5. ✅ Verificar se volta ao login após confirmar

## Status

- ✅ Componente criado
- ✅ Rotas registradas
- ✅ Tipos TypeScript atualizados
- ✅ Sidebar integrado
- ✅ Dados dinâmicos funcionando
- ✅ Logout funcional
- ✅ ESLint validado
