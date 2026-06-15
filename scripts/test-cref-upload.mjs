// Teste de ponta-a-ponta do upload/IA do CREF, reproduzindo o caminho do app
// (mesmo fetch + multipart com campos document_front/document_back).
//
// Objetivo: isolar o gargalo da validação do CREF. Se ESTE script (upload limpo,
// igual ao Insomnia) for APROVADO mas o app falhar, o problema está no app. Se
// falhar aqui também, o problema é o backend/IA (ou o cross-check do número).
//
// Uso (PowerShell), credenciais só por env (nunca commitar/colar no chat):
//   $env:MOVT_EMAIL="seu@email"; $env:MOVT_SENHA="suaSenha"; `
//   node scripts/test-cref-upload.mjs assets/front.jpeg assets/back.jpeg
//
// Flags opcionais:
//   --swap            inverte qual imagem vai em document_front/document_back
//   --cref=171844-G/SP define o número do CREF cruzado pela IA (default abaixo)

import fs from "node:fs";
import path from "node:path";

const BASE = process.env.MOVT_API_URL || "https://movt-backend.vercel.app/api";
const EMAIL = process.env.MOVT_EMAIL;
const SENHA = process.env.MOVT_SENHA;

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
const positional = args.filter((a) => !a.startsWith("--"));
const crefArg = args.find((a) => a.startsWith("--cref="));
const CREF = (crefArg ? crefArg.split("=")[1] : process.env.CREF_CODE) || "171844-G/SP";

let frontPath = positional[0] || "assets/front.jpeg";
let backPath = positional[1] || "assets/back.jpeg";
if (flags.has("--swap")) [frontPath, backPath] = [backPath, frontPath];

if (!EMAIL || !SENHA) {
  console.error("❌ Defina MOVT_EMAIL e MOVT_SENHA no ambiente antes de rodar.");
  process.exit(1);
}
for (const p of [frontPath, backPath]) {
  if (!fs.existsSync(p)) {
    console.error(`❌ Arquivo não encontrado: ${p}`);
    process.exit(1);
  }
}

const fileBlob = (p) => new Blob([fs.readFileSync(p)], { type: "image/jpeg" });

async function main() {
  console.log("🌐 BASE:", BASE);
  console.log("🖼️  front:", frontPath, "| back:", backPath, "| cref:", CREF);

  // 1) Login → sessionId
  const loginRes = await fetch(`${BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, senha: SENHA }),
  });
  const loginBody = await loginRes.json().catch(() => ({}));
  if (!loginRes.ok || !loginBody.sessionId) {
    console.error("❌ Login falhou:", loginRes.status, loginBody);
    process.exit(1);
  }
  const token = loginBody.sessionId;
  console.log("✅ Login OK — user:", JSON.stringify(loginBody.user));

  const auth = { Authorization: `Bearer ${token}` };

  // 2) Garante o número do CREF salvo (a IA cruza com a frente)
  const pd = await fetch(`${BASE}/user/professional-data`, {
    method: "PUT",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ cref: CREF }),
  });
  console.log("📝 professional-data:", pd.status, await pd.text());

  // 3) Upload multipart (sem Content-Type: o fetch gera o boundary, igual ao app)
  const fd = new FormData();
  fd.append("document_front", fileBlob(frontPath), path.basename(frontPath));
  fd.append("document_back", fileBlob(backPath), path.basename(backPath));

  const res = await fetch(`${BASE}/user/document`, {
    method: "PUT",
    headers: auth,
    body: fd,
  });
  const text = await res.text();
  console.log("\n📥 /user/document:", res.status);
  console.log(text);

  try {
    const json = JSON.parse(text);
    const status = json?.ai_analysis?.status;
    console.log("\n🔎 Veredito da IA:", status, "—", json?.ai_analysis?.observation || "(sem observação)");
    process.exit(status === "aprovado" ? 0 : 2);
  } catch {
    process.exit(2);
  }
}

main().catch((e) => {
  console.error("❌ Erro:", e);
  process.exit(1);
});
