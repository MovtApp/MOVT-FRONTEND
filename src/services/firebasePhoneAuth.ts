import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";

/**
 * Wrapper fino do Firebase Phone Auth usado SÓ para validar o telefone do usuário.
 *
 * Fluxo (substitui o Twilio Verify):
 *  1. `startPhoneVerification(phoneE164)` -> Firebase manda o SMS pelo SDK nativo
 *     (com reCAPTCHA/Play Integrity) e devolve um `confirmation`.
 *  2. `confirmPhoneCode(confirmation, code)` -> confere o código e devolve o
 *     ID token do Firebase, que o backend valida com firebase-admin e compara
 *     com o telefone do cadastro antes de marcar `phone_verified`.
 *
 * O Firebase NÃO é usado como provedor de login do app — apenas como verificador
 * de número. Por isso fazemos signOut do Firebase logo após pegar o token.
 */

export type PhoneConfirmation = FirebaseAuthTypes.ConfirmationResult;

/** Dispara o envio do SMS. `phoneE164` precisa estar no formato +55DDDNNNNNNNNN. */
export async function startPhoneVerification(phoneE164: string): Promise<PhoneConfirmation> {
  // forceResend=true evita reaproveitar uma sessão de verificação anterior ao reenviar.
  return auth().signInWithPhoneNumber(phoneE164, true);
}

/**
 * Confirma o código de 6 dígitos e devolve o ID token do Firebase.
 * Lança erro se o código for inválido/expirado (tratado pela tela).
 */
export async function confirmPhoneCode(
  confirmation: PhoneConfirmation,
  code: string
): Promise<string> {
  await confirmation.confirm(code);
  const current = auth().currentUser;
  if (!current) {
    throw new Error("Falha ao validar o telefone. Tente novamente.");
  }
  const idToken = await current.getIdToken(true);
  // Não mantemos sessão do Firebase — só queríamos validar o número.
  await auth().signOut().catch(() => {});
  return idToken;
}
