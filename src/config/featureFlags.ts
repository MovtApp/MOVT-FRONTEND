// Feature flags de produto.
//
// PHONE_VERIFICATION_ENABLED — validação de telefone por SMS (Firebase Phone Auth)
// como etapa do primeiro login. Desativada temporariamente: enquanto `false`, o
// funil pula a tela VerifyPhoneScreen e nenhum usuário é barrado por
// `phone_verified`. A tela e o serviço (src/services/firebasePhoneAuth.ts)
// continuam no código — para reativar o fluxo, basta voltar esta flag para `true`.
export const PHONE_VERIFICATION_ENABLED = false;

// CYCLING_ENABLED — modalidade Ciclismo na UI (card Dados, pill, tab em
// CyclingScreen). Desativada temporariamente: barreira de entrada alta para o
// momento atual do produto. A tela CyclingScreen continua existindo (é também
// a UI de Corrida) e o backend segue aceitando `tipo: "Ciclismo"` (histórico /
// sessão ativa). Para reativar: voltar esta flag para `true` + rebuild.
export const CYCLING_ENABLED = false;
