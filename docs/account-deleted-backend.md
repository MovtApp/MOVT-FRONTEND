# Conta excluída — sinal dedicado do backend (opcional)

## Contexto

Quando um usuário é **excluído** do banco enquanto está logado no app, o token
deixa de mapear para um usuário válido e o backend responde **401** nos
endpoints de dados. O frontend já trata isso (logout limpo + alerta único —
ver `src/services/api.ts` e `src/contexts/AuthContext.tsx`), mas, como um 401
genérico também acontece em **sessão expirada**, o app mostra a mensagem
**neutra**:

> "Sua conta não está mais disponível. Ela pode ter sido removida ou sua sessão
> encerrada. Faça login novamente."

Para o app exibir a mensagem **precisa** ("Sua conta foi removida"), o backend
precisa devolver um código dedicado. O frontend **já está pronto** para
consumi-lo: ele procura por `error === "ACCOUNT_DELETED"` ou
`code === "ACCOUNT_DELETED"` no corpo da resposta (`api.ts`) e, ao encontrar,
usa `reason: "deleted"`.

## Mudança sugerida no `movt-backend`

No middleware `verifyToken` (ou no handler de `/api/user/session-status`),
distinguir "token válido mas usuário inexistente" de "token inválido/expirado".

```js
// Dentro de verifyToken, após validar/decodificar o token e ter o user id:
const { data: usuario, error } = await supabaseAdmin // service_role
  .from("usuarios")
  .select("id, status")
  .eq("id", sessionUserId)
  .maybeSingle();

if (error) {
  return res.status(500).json({ error: "Erro ao validar sessão." });
}

// Token era válido, mas a conta não existe mais → foi excluída.
if (!usuario) {
  return res.status(401).json({
    error: "ACCOUNT_DELETED",
    message: "Sua conta foi removida.",
  });
}

// (Opcional) conta desativada — já tratada hoje como "Conta inativa".
if (usuario.status === "inativo") {
  return res.status(403).json({
    error: "USER_INACTIVE",
    message: "Sua conta foi desativada pelo administrador.",
  });
}
```

## Resultado no app

| Cenário                       | Resposta backend                       | Alerta no app                                  |
| ----------------------------- | -------------------------------------- | ---------------------------------------------- |
| Conta excluída                | `401 { error: "ACCOUNT_DELETED" }`     | **"Conta removida"** (mensagem precisa)        |
| Conta desativada              | `403 { error: "USER_INACTIVE" }`       | "Conta inativa"                                |
| Sessão expirada / token ruim  | `401` genérico                         | "Sessão encerrada" (mensagem neutra)           |

Sem essa mudança, conta excluída cai no 401 genérico e exibe a mensagem neutra
— que continua correta, só menos específica.
