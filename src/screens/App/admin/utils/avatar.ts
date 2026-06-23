// Resolve a foto de perfil de um usuário/personal vindo do admin.
// O backend pode devolver o campo sob nomes diferentes dependendo da rota/versão
// (`foto_url` é o alias atual de `usuarios.avatar_url`; `photo` aparece em alguns
// endpoints). Tentamos todos os aliases conhecidos antes de cair no placeholder,
// para a foto aparecer independentemente de qual nome o backend usar.
export const getAvatarUri = (item: any, fallback: string): string => {
  const candidate =
    item?.foto_url || item?.avatar_url || item?.photo || item?.user_avatar || null;

  // Ignora valores vazios/whitespace que não são URLs reais.
  if (typeof candidate === "string" && candidate.trim().length > 0) {
    return candidate;
  }

  return fallback;
};
