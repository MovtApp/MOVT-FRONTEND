# Monitoramento de Dispositivo Wear OS

## Resumo

O sistema agora possui um mecanismo automático de monitoramento para detectar quando um dispositivo Wear OS é conectado ou desconectado.

## Logs Removidos

Os seguintes logs foram removidos do console para evitar poluição:
- ❌ "Nenhum dispositivo Wear OS encontrado para o usuário"
- ❌ "Iniciando poll para dados de saúde..."
- ❌ "Buscando dispositivos Wear OS para o usuário"
- ❌ "Nenhum dispositivo Wear OS ativo encontrado"
- ❌ "Nenhum dado recebido no poll"
- ❌ "Polling cancelado"

## Nova Função: `monitorWearOsDeviceConnection`

Localização: `src/services/wearOsHealthService.ts`

### Descrição
Monitora em tempo real a conexão/desconexão de dispositivos Wear OS do usuário.

### Sintaxe
```typescript
const unmonitor = monitorWearOsDeviceConnection(
  userId: number,
  onDeviceConnected: (device: WearOsDeviceData) => void,
  onDeviceDisconnected: () => void
): () => void
```

### Parâmetros
- **userId**: ID do usuário a monitorar
- **onDeviceConnected**: Callback chamado quando um dispositivo Wear OS é conectado
- **onDeviceDisconnected**: Callback chamado quando um dispositivo é desconectado
- **Retorna**: Função para parar o monitoramento

### Como Funciona
1. Verifica a cada 5 segundos se há um dispositivo Wear OS conectado
2. Monitora mudanças na tabela `dispositivos` em tempo real (Supabase)
3. Ativa callbacks automaticamente quando há conexão/desconexão
4. Continua tentando mesmo após erros

## Novo Hook: `useWearOsConnection`

Localização: `src/hooks/useWearOsConnection.ts`

### Descrição
Hook React para gerenciar o estado de conexão do Wear OS de forma simples.

### Sintaxe
```typescript
const { isConnected, connectedDevice, isLoading } = useWearOsConnection(userId);
```

### Retorno
```typescript
{
  isConnected: boolean;           // Se há dispositivo conectado
  connectedDevice: WearOsDeviceData | null;  // Dados do dispositivo
  isLoading: boolean;             // Se ainda está verificando
}
```

## Exemplo de Uso

### Em um componente simples
```typescript
import { useWearOsConnection } from '../hooks/useWearOsConnection';
import { useAuth } from '../contexts/AuthContext';

const MyComponent = () => {
  const { user } = useAuth();
  const { isConnected, connectedDevice, isLoading } = useWearOsConnection(
    user?.id ? parseInt(user.id) : null
  );

  if (isLoading) return <Text>Verificando conexão...</Text>;

  if (isConnected) {
    return (
      <View>
        <Text>✅ Conectado: {connectedDevice?.nome}</Text>
        <Text>Modelo: {connectedDevice?.modelo}</Text>
      </View>
    );
  }

  return <Text>❌ Nenhum dispositivo Wear OS conectado</Text>;
};
```

### Com a função de monitoramento direto
```typescript
import { monitorWearOsDeviceConnection } from '../services/wearOsHealthService';

React.useEffect(() => {
  if (!user?.id) return;

  const userId = parseInt(user.id);
  
  const unmonitor = monitorWearOsDeviceConnection(
    userId,
    (device) => {
      console.log('✅ Dispositivo conectado:', device.nome);
      // Ativar funcionalidades que dependem do Wear OS
      startWearOsFeatures();
    },
    () => {
      console.log('❌ Dispositivo desconectado');
      // Desativar funcionalidades que dependem do Wear OS
      stopWearOsFeatures();
    }
  );

  return unmonitor;
}, [user?.id]);
```

## Casos de Uso

### 1. Desativar/Ativar Features
```typescript
const [wearOsEnabled, setWearOsEnabled] = useState(false);

monitorWearOsDeviceConnection(
  userId,
  () => {
    setWearOsEnabled(true);
    // Ativar leitura de batimentos, pressão, etc
  },
  () => {
    setWearOsEnabled(false);
    // Desativar features Wear OS
  }
);
```

### 2. Mostrar Status Visual
```typescript
const { isConnected, connectedDevice } = useWearOsConnection(userId);

<View style={styles.statusContainer}>
  {isConnected ? (
    <View style={styles.connectedStatus}>
      <Wifi size={20} color="#22C55E" />
      <Text>{connectedDevice?.nome} conectado</Text>
    </View>
  ) : (
    <View style={styles.disconnectedStatus}>
      <AlertTriangle size={20} color="#EF4444" />
      <Text>Dispositivo desconectado</Text>
    </View>
  )}
</View>
```

### 3. Condicionar Funcionalidades
```typescript
<TouchableOpacity 
  disabled={!isConnected}
  style={[
    styles.button,
    !isConnected && styles.buttonDisabled
  ]}
>
  <Text>Ler Dados do Wear OS</Text>
</TouchableOpacity>
```

## Melhorias Implementadas

✅ **Remoção de Logs Verbosos**: Console mais limpo, apenas erros críticos são logados
✅ **Monitoramento em Tempo Real**: Detecta conexão/desconexão automaticamente
✅ **Hook Reutilizável**: Fácil integração em múltiplos componentes
✅ **Callbacks Flexíveis**: Permite lógica personalizada por componente
✅ **Tratamento de Erros**: Continua tentando mesmo após falhas
✅ **Limpeza Automática**: Remove listeners quando componente é desmontado

## Próximos Passos

1. Integrar `useWearOsConnection` em componentes que precisam de Wear OS
2. Desativar visualmente botões/features quando sem dispositivo
3. Mostrar notificações quando dispositivo é conectado/desconectado
4. Armazenar preferência do usuário sobre aviso de desconexão
