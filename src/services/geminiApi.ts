import { GoogleGenerativeAI } from "@google/generative-ai";

const SUPPORTED_MODELS_TRY_ORDER = [
  "gemini-1.5-flash-latest",
  "gemini-1.5-flash-002",
  "gemini-1.5-flash",
];

function safeParseJsonFromText(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error("Resposta da IA não pôde ser parseada como JSON.");
  }
}

const getGeminiAnalysis = async (
  imageBase64: string,
  mimeType: string = "image/jpeg",
) => {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) throw new Error("API key não configurada no .env");

  const genAI = new GoogleGenerativeAI(apiKey);
  const prompt =
    'Analise esta imagem de refeição e retorne APENAS um JSON válido com as chaves: { "calories": number, "carbs": number, "protein": number, "fat": number, "description": string }';

  let lastError: unknown;
  for (const modelName of SUPPORTED_MODELS_TRY_ORDER) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent([
        { inlineData: { data: imageBase64, mimeType } },
        { text: prompt },
      ]);
      const text = result.response.text();
      return safeParseJsonFromText(text);
    } catch (err) {
      lastError = err;
      // tenta próximo model
    }
  }
  throw lastError || new Error("Falha ao chamar a API do Gemini");
};

export default { getGeminiAnalysis };
