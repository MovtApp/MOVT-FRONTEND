# Configuração Wear OS - Guia Completo

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Instalação](#instalação)
3. [Como Usar](#como-usar)
4. [Exemplos](#exemplos)
5. [Troubleshooting](#troubleshooting)

---

## Visão Geral

O app agora suporta sincronização de dados de saúde com dispositivos Wear OS do Android. Os arquivos criados são:

- **`wearOsPermissions.ts`** - Funções de autorização e permissões
- **`wearOsHealthService.ts`** (existente) - Funções de coleta e armazenamento de dados
- **`useWearOsAuthorization.ts`** (hook) - Gerenciador de estado da autorização
- **`WearOsAuthorizationCard.tsx`** - Componente visual de status

---

## Instalação

### 1. Permissões no AndroidManifest.xml

As permissões já devem estar configuradas:

```xml
<uses-permission android:name="android.permission.BODY_SENSORS" />
<uses-permission android:name="android.permission.ACTIVITY_RECOGNITION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

Se não estiverem, adicione em `android/app/src/main/AndroidManifest.xml`.

### 2. Pacotes necessários

```bash
# Já deve estar instalado
npm list react-native google-fit
```

---

## Como Usar

### Opção 1: Função Simples

```typescript
import { requestWearOsAuthorization } from '@/services/wearOsPermissions';

const handleAuthorize = async (userId: number) => {
  const result = await requestWearOsAuthorization(userId);
  
  if (result.success) {
    console.log('Autorizado!', result.deviceInfo);
  } else {
    console.log('Erro:', result.message);
  }
};
```

### Opção 2: Com UI (Recomendado)

```typescript
import { requestWearOsAuthorizationWithUI } from '@/services/wearOsPermissions';

const handleAuthorize = async (userId: number) => {
  const result = await requestWearOsAuthorizationWithUI(userId);
  // Mostra Alert nativo do dispositivo
};
```

### Opção 3: Inicialização Completa (Recomendado para primeira vez)

```typescript
import { initializeWearOsAuthorization } from '@/services/wearOsPermissions';

// Na tela de bem-vindo ou primeira inicialização
const handleInitialize = async (userId: number) => {
  const result = await initializeWearOsAuthorization(userId);
  // Mostra fluxo completo com feedback
};
```

### Opção 4: Usando o Hook (Melhor Prática)

```typescript
import { useWearOsAuthorization } from '@/hooks/useWearOsAuthorization';

function MyComponent() {
  const { isAuthorized, isLoading, error, requestAuthorization } = 
    useWearOsAuthorization();

  return (
    <View>
      {isAuthorized ? (
        <Text>Autorizado!</Text>
      ) : (
        <TouchableOpacity onPress={requestAuthorization} disabled={isLoading}>
          <Text>{isLoading ? 'Carregando...' : 'Autorizar'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
```

### Opção 5: Componente Pronto (Mais Fácil)

```typescript
import { WearOsAuthorizationCard } from '@/components/WearOsAuthorizationCard';

function MyScreen() {
  return (
    <ScrollView>
      <WearOsAuthorizationCard />
      {/* Resto do conteúdo */}
    </ScrollView>
  );
}
```

---

## Exemplos Completos

### Exemplo 1: Tela de Configurações

```typescript
import React from 'react';
import { ScrollView, View } from 'react-native';
import { WearOsAuthorizationCard } from '@/components/WearOsAuthorizationCard';
import { useAuth } from '@/hooks/useAuth';

export default function SettingsScreen() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <ScrollView>
      <View style={{ padding: 16 }}>
        <WearOsAuthorizationCard />
      </View>
    </ScrollView>
  );
}
```

### Exemplo 2: Tela de Home com Autorização Automática

```typescript
import React, { useEffect } from 'react';
import { View, Alert } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { initializeWearOsAuthorization } from '@/services/wearOsPermissions';

export default function HomeScreen() {
  const { user } = useAuth();

  useEffect(() => {
    // Solicitar autorização na primeira vez
    const requestAuth = async () => {
      if (user?.id) {
        // Apenas solicita se não foi autorizado antes
        const result = await initializeWearOsAuthorization(user.id);
      }
    };

    requestAuth();
  }, [user?.id]);

  return <View>{/* Conteúdo */}</View>;
}
```

### Exemplo 3: Button Customizado

```typescript
import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { useWearOsAuthorization } from '@/hooks/useWearOsAuthorization';

export function WearOsAuthButton() {
  const { isAuthorized, isLoading, requestAuthorization } = 
    useWearOsAuthorization();

  if (isAuthorized) {
    return <Text>✓ Wear OS Autorizado</Text>;
  }

  return (
    <TouchableOpacity 
      onPress={requestAuthorization} 
      disabled={isLoading}
    >
      <Text>{isLoading ? 'Carregando...' : 'Autorizar Wear OS'}</Text>
    </TouchableOpacity>
  );
}
```

---

## Fluxo de Autorização

```
┌─────────────────────────────────────────┐
│   Usuário Abre App                      │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│   Sistema Verifica Permissões           │
└────────────────┬────────────────────────┘
                 │
         ┌───────┴────────┐
         │                │
         ▼                ▼
    ✓ Concedidas    ✗ Negadas
         │                │
         │                ▼
         │      ┌──────────────────────┐
         │      │  Solicita ao Usuário │
         │      └──────────┬───────────┘
         │                 │
         │         ┌───────┴────────┐
         │         │                │
         │         ▼                ▼
         │     ✓ Aceita         ✗ Recusa
         │         │                │
         │         ▼                ▼
         │  ┌──────────────┐   Registrar
         │  │ Registrar    │   Negação
         │  │ Dispositivo  │
         │  └──────┬───────┘
         │         │
         ▼         ▼
    ┌──────────────────────┐
    │  Dados Sincronizados │
    └──────────────────────┘
```

---

## Dados Coletados

Após autorização, o app coleta:

- **Frequência Cardíaca** (BPM)
- **Pressão Arterial** (mmHg)
- **Saturação de Oxigênio** (%)
- **Passos**
- **Atividades**
- **Sono**

Todos armazenados em:
- Banco de dados: tabela `healthkit`
- Dispositivos: tabela `dispositivos`

---

## Troubleshooting

### "Permissões negadas"

```typescript
// Verificar quais permissões foram negadas
const { requestWearOsAuthorization } = require('@/services/wearOsPermissions');

const result = await requestWearOsAuthorization(userId);
console.log(result.message); // Mostra quais permissões faltam
```

**Solução:** Ir em Configurações > App > Permissões e ativar manualmente.

### "Nenhum dispositivo Wear OS encontrado"

Isso pode significar:

1. **Dispositivo não pareado**: Parear o Wear OS no telefone via Bluetooth
2. **App não instalado**: Instalar o app no Wear OS também
3. **Versão desatualizada**: Atualizar Wear OS para versão recente

### "Erro ao registrar dispositivo"

Possíveis causas:

1. **Usuário não autenticado**: Verificar login
2. **Erro de banco de dados**: Verificar conexão Supabase
3. **Permissões de rede**: Verificar internet

---

## Monitoramento em Tempo Real

Para receber dados em tempo real após autorização:

```typescript
import { subscribeToWearOsHealthRealtime } from '@/services/wearOsHealthService';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';

export function MonitorWearOS() {
  const { user } = useAuth();
  const [healthData, setHealthData] = useState(null);

  useEffect(() => {
    if (!user?.id) return;

    // Inscrever-se para atualizações em tempo real
    const unsubscribe = subscribeToWearOsHealthRealtime(
      user.id,
      (data) => {
        console.log('Novos dados:', data);
        setHealthData(data);
      }
    );

    return unsubscribe;
  }, [user?.id]);

  return null;
}
```

---

## Checklist de Implementação

- [ ] Permissões configuradas em AndroidManifest.xml
- [ ] Arquivos criados na pasta `services/`
- [ ] Hook criado na pasta `hooks/`
- [ ] Componente criado na pasta `components/`
- [ ] Integrado em pelo menos uma tela (ex: Settings ou Home)
- [ ] Testado no emulador ou dispositivo real
- [ ] Dados aparecem em "Heartbeats" após 5 segundos
- [ ] Sincronização em tempo real funcionando

---

## Próximos Passos

1. **Integrar em mais telas**: Adicione `WearOsAuthorizationCard` em telas relevantes
2. **Monitoramento visual**: Use dados para gráficos em tempo real
3. **Notificações**: Alertar usuário quando dados críticos chegarem
4. **Wear App nativo**: Desenvolver interface nativa para o Wear OS

---

## Suporte

Para dúvidas:
- Verificar logs: `adb logcat | grep WearOS`
- Testar permissões: `adb shell pm grant <package> <permission>`
- Documentação oficial: https://developer.android.com/wear/build

