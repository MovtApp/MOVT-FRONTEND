/**
 * Retorna o tempo relativo de uma data em português.
 * Ex: "agora", "5m", "2h", "3 dias", "1 sem", "4 meses", "2 anos", "12 mar 2018"
 */
export function getRelativeTime(date: string | Date): string {
  const now = new Date();
  const past = new Date(date);

  if (isNaN(past.getTime())) return "";

  const diffMs = now.getTime() - past.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60) return "agora";
  if (diffMinutes < 60) return `${diffMinutes}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return diffDays === 1 ? "1 dia" : `${diffDays} dias`;
  if (diffWeeks < 5) return diffWeeks === 1 ? "1 sem" : `${diffWeeks} sem`;
  if (diffMonths < 12) return diffMonths === 1 ? "1 mês" : `${diffMonths} meses`;
  if (diffYears < 5) return diffYears === 1 ? "1 ano" : `${diffYears} anos`;

  // 5+ anos: exibe a data absoluta curta (ex: "12 mar 2018")
  // 5+ anos: exibe a data absoluta curta (ex: "12 mar 2018")
  try {
    return past.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch (e) {
    const monthsShort = [
      "jan",
      "fev",
      "mar",
      "abr",
      "mai",
      "jun",
      "jul",
      "ago",
      "set",
      "out",
      "nov",
      "dez",
    ];
    return `${past.getDate()} ${monthsShort[past.getMonth()]} ${past.getFullYear()}`;
  }
}
