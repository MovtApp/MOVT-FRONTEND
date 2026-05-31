/* eslint-disable import/no-unresolved */
// @ts-nocheck
// Edge Function: analyze-meal
//
// Proxy server-side para a API do Gemini. A GEMINI_API_KEY fica APENAS no
// ambiente da função (Deno.env), nunca no bundle do cliente. O app chama esta
// função via supabase.functions.invoke("analyze-meal", { body: { imageBase64, mimeType } }).
//
// Deploy:
//   supabase secrets set GEMINI_API_KEY=xxxxx
//   supabase functions deploy analyze-meal --no-verify-jwt
// (verify-jwt off porque usuários de e-mail/senha não possuem sessão Supabase;
//  a proteção contra abuso deve vir de rate limiting nesta função.)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const SUPPORTED_MODELS_TRY_ORDER = [
  "gemini-1.5-flash-latest",
  "gemini-1.5-flash-002",
  "gemini-1.5-flash",
];

const PROMPT =
  'Analise esta imagem de refeição e retorne APENAS um JSON válido com as chaves: { "calories": number, "carbs": number, "protein": number, "fat": number, "description": string }';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function safeParseJsonFromText(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Resposta da IA não pôde ser parseada como JSON.");
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  // @ts-ignore
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ message: "GEMINI_API_KEY não configurada no servidor." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let imageBase64: string;
  let mimeType: string;
  try {
    const body = await req.json();
    imageBase64 = body.imageBase64;
    mimeType = body.mimeType || "image/jpeg";
  } catch {
    return new Response(JSON.stringify({ message: "Body inválido." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!imageBase64 || typeof imageBase64 !== "string") {
    return new Response(JSON.stringify({ message: "imageBase64 é obrigatório." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let lastError: unknown;
  for (const model of SUPPORTED_MODELS_TRY_ORDER) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { inline_data: { mime_type: mimeType, data: imageBase64 } },
                { text: PROMPT },
              ],
            },
          ],
        }),
      });

      if (!resp.ok) {
        lastError = new Error(`Gemini retornou status ${resp.status}`);
        continue;
      }

      const json = await resp.json();
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      const parsed = safeParseJsonFromText(text);

      return new Response(JSON.stringify(parsed), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err) {
      lastError = err;
      // tenta o próximo modelo
    }
  }

  return new Response(
    JSON.stringify({ message: (lastError as Error)?.message || "Falha ao chamar a API do Gemini." }),
    { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
