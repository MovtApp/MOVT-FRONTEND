// Configuração da API
// Para trocar entre Local e Vercel, basta alterar a variável EXPO_PUBLIC_API_URL no arquivo .env
// ou definir a URL aqui diretamente.

export const API_CONFIG = {
  // URL de desenvolvimento (local)
  // localhost funciona para Web e iOS Simulator
  // 10.0.2.2 é o endereço do host para o Android Emulator
  LOCAL: "http://localhost:3000/api",
  ANDROID_EMULATOR: "http://10.0.2.2:3000/api",

  // URL de produção (Vercel) - Substitua após o deploy
  PRODUCTION: "https://movt-backend.vercel.app/api",
};

// Determina qual URL usar
export const getApiBaseUrl = (): string => {
  // 1. Sempre respeita a variável de ambiente se ela estiver definida explicitamente
  if (process.env.EXPO_PUBLIC_API_URL) {
    const url = process.env.EXPO_PUBLIC_API_URL;
    return url.endsWith('/api') ? url : `${url}/api`;
  }

  // 2. Se estiver em produção (ex: rodando na Vercel Web), usa a URL de produção automaticamente
  if (process.env.NODE_ENV === 'production' || !__DEV__) {
    return API_CONFIG.PRODUCTION;
  }

  // 3. Em desenvolvimento local, usa o localhost
  return API_CONFIG.LOCAL;
};

// Exporta a URL base atual
export const API_BASE_URL = getApiBaseUrl();
