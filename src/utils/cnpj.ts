/**
 * Validação e formatação de CNPJ (frontend).
 *
 * O `isValidCNPJ` (dígitos verificadores mód 11) é a primeira barreira de UX:
 * desabilita o avanço antes de qualquer chamada de rede. O backend revalida
 * tudo — esta camada é só experiência, nunca a fonte da verdade.
 */
export function onlyDigits(raw: string): string {
  return (raw || "").replace(/\D/g, "");
}

/** Máscara 00.000.000/0000-00. */
export function formatCNPJ(value: string): string {
  const cleaned = onlyDigits(value).slice(0, 14);
  let out = "";
  if (cleaned.length > 0) out = cleaned.slice(0, 2);
  if (cleaned.length >= 3) out += "." + cleaned.slice(2, 5);
  if (cleaned.length >= 6) out += "." + cleaned.slice(5, 8);
  if (cleaned.length >= 9) out += "/" + cleaned.slice(8, 12);
  if (cleaned.length >= 13) out += "-" + cleaned.slice(12, 14);
  return out;
}

/** Valida os dígitos verificadores do CNPJ (mód 11). */
export function isValidCNPJ(raw: string): boolean {
  const c = onlyDigits(raw);
  if (c.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(c)) return false; // rejeita sequências repetidas

  const calcDigit = (len: number): number => {
    let pos = len - 7;
    let sum = 0;
    for (let i = len; i >= 1; i--) {
      sum += Number(c[len - i]) * pos--;
      if (pos < 2) pos = 9;
    }
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };

  return calcDigit(12) === Number(c[12]) && calcDigit(13) === Number(c[13]);
}
