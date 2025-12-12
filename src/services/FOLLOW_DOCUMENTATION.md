# Documentação: Sistema de Follow de Múltiplos Trainers

## Overview
Este sistema implementa a funcionalidade de seguir/deixar de seguir múltiplos trainers de uma vez, tanto no frontend quanto no backend.

## Backend - Rotas Implementadas

### 1. Seguir Múltiplos Trainers
**Endpoint:** `POST /api/trainers/follow-multiple`

**Headers:**
```
Authorization: Bearer <session_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "trainerIds": [1, 2, 3, 4, 5]
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "5 trainer(s) adicionado(s) com sucesso.",
  "followedCount": 5
}
```

**Response (Error):**
```json
{
  "error": "trainerIds deve ser um array não vazio."
}
```

**Validações:**
- `trainerIds` deve ser um array
- Array deve ter pelo menos 1 elemento
- Máximo de 100 trainers por requisição
- Duplicatas são ignoradas (ON CONFLICT DO NOTHING)

---

### 2. Deixar de Seguir Múltiplos Trainers
**Endpoint:** `POST /api/trainers/unfollow-multiple`

**Headers:**
```
Authorization: Bearer <session_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "trainerIds": [1, 2, 3]
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "3 trainer(s) removido(s) com sucesso.",
  "unfollowedCount": 3
}
```

---

## Frontend - Serviços Implementados

### Arquivo: `src/services/followService.ts`

#### Funções Disponíveis:

##### 1. `followTrainer(trainerId, sessionToken)`
Segue um único trainer.

```typescript
import { followTrainer } from '@services/followService'

try {
  const result = await followTrainer('123', sessionToken)
  console.log('Seguindo:', result.following)
} catch (error) {
  console.error('Erro:', error.message)
}
```

##### 2. `unfollowTrainer(trainerId, sessionToken)`
Para de seguir um único trainer.

```typescript
import { unfollowTrainer } from '@services/followService'

try {
  const result = await unfollowTrainer('123', sessionToken)
  console.log('Deixou de seguir:', !result.following)
} catch (error) {
  console.error('Erro:', error.message)
}
```

##### 3. `followMultipleTrainers(trainerIds, sessionToken)`
Segue múltiplos trainers de uma vez.

```typescript
import { followMultipleTrainers } from '@services/followService'

try {
  const result = await followMultipleTrainers([1, 2, 3, 4, 5], sessionToken)
  console.log(`Seguindo ${result.followedCount} trainers!`)
} catch (error) {
  console.error('Erro:', error.message)
}
```

##### 4. `unfollowMultipleTrainers(trainerIds, sessionToken)`
Para de seguir múltiplos trainers de uma vez.

```typescript
import { unfollowMultipleTrainers } from '@services/followService'

try {
  const result = await unfollowMultipleTrainers([1, 2, 3], sessionToken)
  console.log(`Deixou de seguir ${result.unfollowedCount} trainers!`)
} catch (error) {
  console.error('Erro:', error.message)
}
```

---

## Frontend - Hook Customizado

### Arquivo: `src/hooks/useMultiFollow.ts`

Hook para gerenciar múltiplos follows com tratamento de erros e loading.

```typescript
import { useMultiFollow } from '@hooks/useMultiFollow'

export function MinhaTelaComSeguidores() {
  const { user } = useAuth()
  const { isLoading, followMultiple, unfollowMultiple } = useMultiFollow({
    sessionToken: user?.sessionId || ''
  })

  const handleSeguidoresEmMassa = async () => {
    const trainersASeGuir = [1, 2, 3, 4, 5]
    await followMultiple(trainersASeGuir)
  }

  const handleDeseguidoresEmMassa = async () => {
    const trainersADeixarDeSeguir = [1, 2, 3]
    await unfollowMultiple(trainersADeixarDeSeguir)
  }

  return (
    <View>
      <TouchableOpacity onPress={handleSeguidoresEmMassa} disabled={isLoading}>
        <Text>Seguir Múltiplos ({isLoading ? 'Carregando...' : 'Pronto'})</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={handleDeseguidoresEmMassa} disabled={isLoading}>
        <Text>Deixar de Seguir Múltiplos ({isLoading ? 'Carregando...' : 'Pronto'})</Text>
      </TouchableOpacity>
    </View>
  )
}
```

---

## Integração no TrainerProfileScreen

O arquivo `TrainerProfileScreen.tsx` foi atualizado para usar o novo serviço de follow:

```typescript
import { followTrainer, unfollowTrainer } from '../../../services/followService'

// Na função toggleFollow:
const toggleFollow = async () => {
  if (!trainerId || !user?.sessionId) {
    Alert.alert('Erro', 'ID do trainer ou sessão não disponível')
    return
  }
  try {
    if (!isFollowing) {
      await followTrainer(trainerId, user.sessionId)
      setIsFollowing(true)
      Alert.alert('Sucesso', 'Você está seguindo este trainer!')
    } else {
      await unfollowTrainer(trainerId, user.sessionId)
      setIsFollowing(false)
      Alert.alert('Sucesso', 'Você deixou de seguir este trainer.')
    }
  } catch (err: any) {
    Alert.alert('Erro', err?.message || 'Erro ao processar ação')
  }
}
```

---

## Exemplo de Uso em Uma Tela de Recomendações

```typescript
import React, { useState } from 'react'
import { View, FlatList, TouchableOpacity, Text, ActivityIndicator } from 'react-native'
import { useAuth } from '@contexts/AuthContext'
import { useMultiFollow } from '@hooks/useMultiFollow'

interface Trainer {
  id: number
  name: string
  avatar: string
}

export function RecomendadosScreen() {
  const { user } = useAuth()
  const { isLoading, followMultiple } = useMultiFollow({
    sessionToken: user?.sessionId || ''
  })
  const [selectedTrainers, setSelectedTrainers] = useState<number[]>([])

  const trainersRecomendados: Trainer[] = [
    { id: 1, name: 'Trainer A', avatar: 'url1' },
    { id: 2, name: 'Trainer B', avatar: 'url2' },
    { id: 3, name: 'Trainer C', avatar: 'url3' },
  ]

  const toggleTrainerSelection = (trainerId: number) => {
    setSelectedTrainers(prev =>
      prev.includes(trainerId)
        ? prev.filter(id => id !== trainerId)
        : [...prev, trainerId]
    )
  }

  const handleSeguirTodos = async () => {
    if (selectedTrainers.length === 0) {
      Alert.alert('Aviso', 'Selecione pelo menos um trainer')
      return
    }
    await followMultiple(selectedTrainers)
    setSelectedTrainers([])
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={trainersRecomendados}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => toggleTrainerSelection(item.id)}
            style={{
              padding: 16,
              backgroundColor: selectedTrainers.includes(item.id) ? '#10B981' : '#fff',
            }}
          >
            <Text>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
      
      <TouchableOpacity
        onPress={handleSeguirTodos}
        disabled={isLoading || selectedTrainers.length === 0}
        style={{
          padding: 16,
          backgroundColor: '#10B981',
          alignItems: 'center',
        }}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>
            Seguir {selectedTrainers.length} Trainer(s)
          </Text>
        )}
      </TouchableOpacity>
    </View>
  )
}
```

---

## Fluxo de Dados

```
Frontend (TrainerProfileScreen)
    ↓
followService.ts (followTrainer/followMultipleTrainers)
    ↓
Backend (POST /api/trainers/follow-multiple)
    ↓
Database (INSERT INTO follows)
    ↓
Response com sucesso/erro
    ↓
Frontend (atualizar UI)
```

---

## Tratamento de Erros

Todos os serviços incluem tratamento de erros:

```typescript
try {
  await followMultipleTrainers([1, 2, 3], token)
} catch (error) {
  // Erros comuns:
  // - "trainerIds deve ser um array não vazio."
  // - "Máximo de 100 trainers por vez"
  // - "Nenhum ID de trainer válido fornecido."
  // - "Erro interno ao seguir múltiplos trainers."
  console.error(error.message)
}
```

---

## Considerações de Performance

- **Máximo de 100 trainers por requisição**: Isso evita requisições muito grandes
- **ON CONFLICT DO NOTHING**: Garante idempotência (chamadas repetidas não causam erro)
- **Filtros de validação**: Elimina IDs inválidos antes de enviar ao banco
- **Loading state**: Previne múltiplos cliques durante requisição

---

## Próximos Passos

1. Criar tela de "Recomendações de Trainers" com seleção em massa
2. Adicionar animações ao seguir múltiplos trainers
3. Implementar histórico de follows
4. Adicionar notificações quando um trainer que você segue publica algo novo
