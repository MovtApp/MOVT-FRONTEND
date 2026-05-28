import { supabase } from "./supabaseClient";

/**
 * Analisa a imagem de uma refeição via Edge Function "analyze-meal".
 *
 * A chave do Gemini NÃO fica mais no cliente: a função no Supabase é que detém
 * a GEMINI_API_KEY (server-side) e faz a chamada. Mantém a mesma assinatura e o
 * mesmo formato de retorno do código anterior, então os callers não mudam.
 */
const getGeminiAnalysis = async (
  imageBase64: string,
  mimeType: string = "image/jpeg"
): Promise<{
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  description: string;
}> => {
  const { data, error } = await supabase.functions.invoke("analyze-meal", {
    body: { imageBase64, mimeType },
  });

  if (error) {
    throw new Error(error.message || "Falha ao analisar a imagem.");
  }
  if (!data) {
    throw new Error("Resposta vazia da análise de imagem.");
  }
  return data as any;
};

export default { getGeminiAnalysis };
