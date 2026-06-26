/* eslint-disable no-console */
/**
 * Puxa o histórico de corrida/ciclismo de UMA conta via BACKEND do MOVT
 * (auth próprio: POST /api/login -> sessionId; GET /api/user/workouts com Bearer).
 *
 * A senha NUNCA fica no código — é lida de variável de ambiente.
 *
 * Uso (bash / git-bash):
 *   MOVT_EMAIL="comercial.tglsolutions@gmail.com" MOVT_PWD="..." node scripts/fetch-route.js
 *
 * Uso (PowerShell):
 *   $env:MOVT_EMAIL="comercial.tglsolutions@gmail.com"; $env:MOVT_PWD="..."; node scripts/fetch-route.js
 *
 * Opcional: MOVT_DATE="2026-06-22"  (default = ontem)
 */

const fs = require("fs");
const path = require("path");

const API_BASE = (process.env.EXPO_PUBLIC_API_URL || "https://movt-backend.vercel.app").replace(
  /\/api$/,
  ""
) + "/api";

function localDateStr(d) {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

async function main() {
  const email = process.env.MOVT_EMAIL || "comercial.tglsolutiions@gmail.com";
  const senha = process.env.MOVT_PWD;
  if (!senha) {
    console.error('❌ Defina a senha em MOVT_PWD. Ex: MOVT_PWD="..." node scripts/fetch-route.js');
    process.exit(1);
  }

  // ── 1) Login no backend ──────────────────────────────────────────────────────
  console.log(`🔐 Login em ${API_BASE}/login como ${email}...`);
  const loginRes = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha }),
  });
  const loginText = await loginRes.text();
  if (!loginRes.ok) {
    console.error(`❌ Login falhou (HTTP ${loginRes.status}): ${loginText}`);
    process.exit(1);
  }
  let login;
  try {
    login = JSON.parse(loginText);
  } catch {
    console.error("❌ Resposta de login não é JSON:", loginText.slice(0, 300));
    process.exit(1);
  }
  const sessionId = login.sessionId || login.session_id;
  if (!sessionId) {
    console.error("❌ Login OK mas sem sessionId na resposta:", JSON.stringify(login).slice(0, 300));
    process.exit(1);
  }
  console.log(`✅ Logado. usuario: ${login.user?.nome || login.user?.email || "?"}\n`);

  // ── 2) Busca os treinos ──────────────────────────────────────────────────────
  const wRes = await fetch(`${API_BASE}/user/workouts`, {
    headers: { Authorization: `Bearer ${sessionId}` },
  });
  const wText = await wRes.text();
  if (!wRes.ok) {
    console.error(`❌ /user/workouts falhou (HTTP ${wRes.status}): ${wText.slice(0, 300)}`);
    process.exit(1);
  }
  const payload = JSON.parse(wText);
  const rows = payload.workouts || [];
  if (!rows.length) {
    console.log("⚠️  Nenhum treino encontrado para esta conta.");
    process.exit(0);
  }

  rows.sort((a, b) => new Date(b.data) - new Date(a.data));

  const target = process.env.MOVT_DATE || localDateStr(new Date(Date.now() - 864e5));
  console.log(`📅 Alvo: ${target}\n`);

  console.log("=== Treinos recentes ===");
  for (const r of rows.slice(0, 10)) {
    const pts = Array.isArray(r.rota) ? r.rota.length : 0;
    console.log(
      `#${r.id} | ${r.tipo} | ${r.data} | ${r.distancia_km}km | ${r.duracao_seg}s | pace ${r.pace_medio} | rota ${pts}pts`
    );
  }

  const ofDay = rows.filter((r) => String(r.data).slice(0, 10) === target);
  const picked = ofDay.length ? ofDay : [rows[0]];

  for (const r of picked) {
    console.log(`\n================ TREINO #${r.id} (${r.tipo}) ================`);
    console.log(
      JSON.stringify(
        {
          id: r.id,
          tipo: r.tipo,
          data: r.data,
          distancia_km: r.distancia_km,
          duracao_seg: r.duracao_seg,
          pace_medio: r.pace_medio,
          velocidade_media_kmh: r.velocidade_media_kmh,
          kcal: r.kcal,
          pontos_rota: Array.isArray(r.rota) ? r.rota.length : 0,
        },
        null,
        2
      )
    );

    const rota = Array.isArray(r.rota) ? r.rota : [];
    if (rota.length) {
      const a = rota[0];
      const b = rota[rota.length - 1];
      console.log(`\nInício: ${a.latitude}, ${a.longitude}`);
      console.log(`Fim:    ${b.latitude}, ${b.longitude}`);
      console.log(`Mapa (início): https://www.google.com/maps?q=${a.latitude},${a.longitude}`);

      // Amostra de pontos intermediários (até 12) p/ inferir o traçado no chat
      const step = Math.max(1, Math.floor(rota.length / 12));
      console.log(`\nAmostra da rota (1 a cada ${step} pts):`);
      for (let i = 0; i < rota.length; i += step) {
        const p = rota[i];
        console.log(`  [${i}] ${p.latitude}, ${p.longitude}`);
      }

      const geo = {
        type: "Feature",
        properties: { id: r.id, tipo: r.tipo, data: r.data },
        geometry: {
          type: "LineString",
          coordinates: rota.map((p) => [p.longitude, p.latitude]),
        },
      };
      const outFile = path.join(__dirname, `rota-${r.id}.geojson`);
      fs.writeFileSync(outFile, JSON.stringify(geo, null, 2));
      console.log(`\nRota completa salva em: ${outFile}`);
      console.log(`(arraste em https://geojson.io para ver o traçado)`);
    } else {
      console.log("\n⚠️  Este treino não tem pontos de rota salvos (rota vazia).");
    }
  }
}

main().catch((e) => {
  console.error("Erro:", e);
  process.exit(1);
});
