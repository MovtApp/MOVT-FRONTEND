/**
 * seedChallenges.mjs — cria OFICIALMENTE os desafios da Home pelo mesmo caminho
 * do admin (POST /admin/workouts com secao_home="desafio"). É exatamente como se
 * o admin os criasse pela interface: passam pelo backend, persistem no banco e
 * aparecem na seção "Desafios" da Home.
 *
 * São os 8 desafios que antes eram mock hardcoded no ChallengesSection.
 *
 * ── Como rodar (Node 18+) ──────────────────────────────────────────────────────
 *   Windows PowerShell:
 *     $env:ADMIN_EMAIL="seu-email-admin"; $env:ADMIN_PASSWORD="sua-senha"; node scripts/seedChallenges.mjs
 *   bash:
 *     ADMIN_EMAIL="seu-email-admin" ADMIN_PASSWORD="sua-senha" node scripts/seedChallenges.mjs
 *
 * Variáveis opcionais:
 *   API_URL   (default: https://movt-backend.vercel.app/api)
 *   DRY_RUN=1 (só mostra o que faria, sem criar nada)
 *
 * SEGURANÇA: nunca escreva email/senha/token dentro deste arquivo nem cole no
 * chat. Use variáveis de ambiente; o token de sessão fica só em memória aqui.
 * O script é idempotente: pula desafios cujo nome já existe (secao_home="desafio").
 */

const API_URL = (process.env.API_URL || "https://movt-backend.vercel.app/api").replace(/\/+$/, "");
const EMAIL = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;
const DRY_RUN = process.env.DRY_RUN === "1";

// Os 8 desafios originais (nome + imagem). As URLs do freepik foram normalizadas
// para o caminho base, sem a query assinada que expirava — assim ficam estáveis.
const CHALLENGES = [
  {
    nome: "Prancha",
    descricao: "Desafio de prancha isométrica para fortalecer o core e a estabilidade.",
    duracao: "5 min",
    calorias: "40 Kcal",
    nivel: "Iniciante",
    categoria: "Desafio",
    image_url: "https://img.freepik.com/free-photo/full-shot-man-doing-plank_23-2149036348.jpg",
  },
  {
    nome: "Corrida",
    descricao: "Desafio de corrida para ganhar resistência cardiovascular e fôlego.",
    duracao: "20 min",
    calorias: "200 Kcal",
    nivel: "Intermediário",
    categoria: "Desafio",
    image_url: "https://img.freepik.com/free-photo/sportsman-runs-jump-into-sky_158595-5930.jpg",
  },
  {
    nome: "Salto box",
    descricao: "Desafio de saltos no box para potência e explosão das pernas.",
    duracao: "10 min",
    calorias: "120 Kcal",
    nivel: "Intermediário",
    categoria: "Desafio",
    image_url:
      "https://img.freepik.com/free-photo/full-shot-man-exercising-with-box_23-2149324736.jpg",
  },
  {
    nome: "Burpee",
    descricao: "Desafio de burpees para condicionamento físico de corpo inteiro.",
    duracao: "10 min",
    calorias: "150 Kcal",
    nivel: "Avançado",
    categoria: "Desafio",
    image_url:
      "https://img.freepik.com/free-photo/full-shot-fit-woman-training-indoors_23-2149324736.jpg",
  },
  {
    nome: "Flexões",
    descricao: "Desafio de flexões para fortalecer peito, ombros e tríceps.",
    duracao: "8 min",
    calorias: "80 Kcal",
    nivel: "Iniciante",
    categoria: "Desafio",
    image_url: "https://img.freepik.com/free-photo/full-shot-sporty-man-exercising_23-2149326162.jpg",
  },
  {
    nome: "Corda",
    descricao: "Desafio de pular corda para coordenação, ritmo e cardio.",
    duracao: "12 min",
    calorias: "140 Kcal",
    nivel: "Intermediário",
    categoria: "Desafio",
    image_url: "https://img.freepik.com/free-photo/athletic-woman-working-out-gym_52683-117192.jpg",
  },
  {
    nome: "Afundo",
    descricao: "Desafio de afundos para fortalecer pernas e glúteos.",
    duracao: "10 min",
    calorias: "100 Kcal",
    nivel: "Iniciante",
    categoria: "Desafio",
    image_url:
      "https://img.freepik.com/free-photo/close-up-woman-doing-crossfit-workout_23-2149080458.jpg",
  },
  {
    nome: "Barra Fixa",
    descricao: "Desafio de barra fixa para fortalecer costas e bíceps.",
    duracao: "8 min",
    calorias: "90 Kcal",
    nivel: "Avançado",
    categoria: "Desafio",
    image_url: "https://img.freepik.com/free-photo/fitness-boy-stretching_23-2148017323.jpg",
  },
];

function die(msg) {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}

async function login() {
  let res;
  try {
    res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: EMAIL, senha: PASSWORD }),
    });
  } catch (e) {
    die(`Não foi possível conectar em ${API_URL}/login: ${e.message}`);
  }
  if (!res.ok) {
    die(`Login falhou (HTTP ${res.status}). Confira ADMIN_EMAIL/ADMIN_PASSWORD e a conta admin.`);
  }
  const data = await res.json();
  if (!data?.sessionId) die("Login OK mas a resposta não trouxe 'sessionId'.");
  return data.sessionId;
}

async function existingChallengeNames(token) {
  try {
    const res = await fetch(`${API_URL}/treinos`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return new Set();
    const json = await res.json();
    const list = json?.data || json;
    const arr = Array.isArray(list) ? list : [];
    return new Set(
      arr
        .filter((t) => t?.secao_home === "desafio")
        .map((t) => String(t?.nome || "").trim().toLowerCase())
    );
  } catch {
    return new Set();
  }
}

async function createChallenge(token, c) {
  const fd = new FormData();
  fd.append("nome", c.nome);
  fd.append("descricao", c.descricao);
  fd.append("duracao", c.duracao);
  fd.append("calorias", c.calorias);
  fd.append("nivel", c.nivel);
  fd.append("categoria", c.categoria);
  fd.append("secao_home", "desafio");
  fd.append("exercicios", "[]");
  fd.append("image_url", c.image_url);

  // Sem Content-Type manual: o fetch define o boundary do multipart sozinho.
  const res = await fetch(`${API_URL}/admin/workouts`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${body.slice(0, 250)}`);
  return body;
}

(async () => {
  if (!EMAIL || !PASSWORD) {
    die("Defina ADMIN_EMAIL e ADMIN_PASSWORD nas variáveis de ambiente antes de rodar.");
  }

  console.log(`→ API:     ${API_URL}`);
  console.log(`→ Modo:    ${DRY_RUN ? "DRY-RUN (não cria)" : "criação real"}`);
  console.log("→ Autenticando como admin...");
  const token = await login();
  console.log("✓ Autenticado.\n");

  const existing = await existingChallengeNames(token);

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const c of CHALLENGES) {
    const key = c.nome.trim().toLowerCase();
    if (existing.has(key)) {
      console.log(`• Pulando "${c.nome}" — já existe como desafio.`);
      skipped++;
      continue;
    }
    if (DRY_RUN) {
      console.log(`• [dry-run] Criaria "${c.nome}".`);
      continue;
    }
    try {
      await createChallenge(token, c);
      console.log(`✓ Criado "${c.nome}".`);
      created++;
    } catch (e) {
      console.error(`✖ Falha em "${c.nome}": ${e.message}`);
      failed++;
    }
  }

  console.log(`\nResumo: ${created} criados, ${skipped} pulados, ${failed} falhas.`);
  if (!DRY_RUN && created > 0) {
    console.log('Abra a Home no app — os desafios aparecem na seção "Desafios".');
  }
  process.exit(failed > 0 ? 1 : 0);
})();
