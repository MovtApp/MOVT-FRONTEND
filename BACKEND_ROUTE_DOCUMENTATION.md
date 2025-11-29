# Documentação de Rota Backend - Editar Email e Username

## Objetivo
Atualizar o email e/ou username do usuário autenticado no banco de dados.

## Dados Necessários (do Frontend)

### Informações do Usuário Disponíveis:
- **User ID** (`user.id`) - Identificador único do usuário
- **Session ID** (`user.sessionId`) - Token de autenticação
- **Email Atual** (`user.email`) - Email armazenado
- **Username Atual** (`user.username`) - Username armazenado

### Dados a Enviar na Requisição:
```json
{
  "username": "novo_username" (opcional),
  "email": "novo_email@example.com" (opcional)
}
```

---

## Endpoint Esperado

### Requisição
```
PUT /api/user/update-profile
Content-Type: application/json
Authorization: Bearer {sessionId}

Body:
{
  "username": "novo_username",
  "email": "novo_email@example.com"
}
```

**Nota:** É possível enviar apenas um dos campos (username ou email), ou ambos.

---

## Headers Necessários
- `Authorization: Bearer {user.sessionId}` - Token de autenticação obrigatório
- `Content-Type: application/json`

---

## Validações Esperadas no Backend

1. **Autenticação**: Validar se o sessionId é válido
2. **Email**:
   - Verificar se o novo email já existe no banco de dados
   - Validar formato de email (regex ou validador)
   - Não permitir emails vazios ou apenas espaços
3. **Username**:
   - Verificar se o novo username já existe no banco de dados
   - Validar caracteres permitidos (alfanuméricos, underscores, hífens)
   - Validar comprimento mínimo e máximo (sugestão: 3-20 caracteres)
   - Não permitir usernames vazios ou apenas espaços
4. **Duplicação**: Verificar se o email/username já está associado a outro usuário

---

## Resposta Esperada (Sucesso)

### Status: 200 OK
```json
{
  "success": true,
  "message": "Perfil atualizado com sucesso",
  "data": {
    "id": "uuid-do-usuario",
    "name": "Nome do Usuário",
    "email": "novo_email@example.com",
    "username": "novo_username",
    "isVerified": true,
    "photo": "url-da-foto-ou-null",
    "updatedAt": "2024-11-19T10:30:00Z"
  }
}
```

---

## Resposta Esperada (Erro)

### Status: 400 Bad Request (Validação)
```json
{
  "success": false,
  "error": "O email já está registrado",
  "field": "email"
}
```

### Status: 409 Conflict (Duplicado)
```json
{
  "success": false,
  "error": "O username já está em uso",
  "field": "username"
}
```

### Status: 401 Unauthorized (Não Autenticado)
```json
{
  "success": false,
  "error": "Token inválido ou expirado"
}
```

### Status: 500 Internal Server Error
```json
{
  "success": false,
  "error": "Erro ao atualizar o perfil"
}
```

---

## Exemplo de Requisição (cURL)

```bash
curl -X PUT http://localhost:3000/api/user/update-profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer seu_session_id_aqui" \
  -d '{
    "username": "novo_username",
    "email": "novo_email@example.com"
  }'
```

---

## Exemplo de Requisição (JavaScript/TypeScript)

```typescript
const response = await fetch('http://10.0.2.2:3000/api/user/update-profile', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${user.sessionId}`
  },
  body: JSON.stringify({
    username: 'novo_username',
    email: 'novo_email@example.com'
  })
});

const data = await response.json();
```

---

## Banco de Dados

### Tabela: users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  photo TEXT,
  isVerified BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_email ON users(email);
CREATE UNIQUE INDEX idx_username ON users(username);
```

---

## Implementação no Backend (Sugestão)

### Node.js/Express com TypeScript

```typescript
router.put('/api/user/update-profile', authenticateToken, async (req, res) => {
  try {
    const { username, email } = req.body;
    const userId = req.user.id; // Obtido do middleware de autenticação

    // Validações
    if (!username && !email) {
      return res.status(400).json({
        success: false,
        error: 'Pelo menos um campo deve ser fornecido (username ou email)'
      });
    }

    // Se email foi fornecido, validar
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Email inválido',
          field: 'email'
        });
      }

      const existingEmail = await User.findOne({ 
        where: { email, id: { [Op.ne]: userId } } 
      });
      
      if (existingEmail) {
        return res.status(409).json({
          success: false,
          error: 'O email já está registrado',
          field: 'email'
        });
      }
    }

    // Se username foi fornecido, validar
    if (username) {
      if (username.length < 3 || username.length > 20) {
        return res.status(400).json({
          success: false,
          error: 'Username deve ter entre 3 e 20 caracteres',
          field: 'username'
        });
      }

      const existingUsername = await User.findOne({ 
        where: { username, id: { [Op.ne]: userId } } 
      });
      
      if (existingUsername) {
        return res.status(409).json({
          success: false,
          error: 'O username já está em uso',
          field: 'username'
        });
      }
    }

    // Atualizar usuário
    const updateData: any = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;

    const user = await User.findByPk(userId);
    await user.update(updateData);

    res.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      data: user
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar o perfil'
    });
  }
});
```

---

## Resumo dos Dados

| Campo | Tipo | Obrigatório | Exemplo |
|-------|------|-------------|---------|
| username | string | Não | "novo_username" |
| email | string | Não | "novo_email@example.com" |
| Authorization | header | Sim | "Bearer session_id_123..." |

