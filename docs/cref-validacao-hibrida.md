# Validação de CREF — estratégia híbrida (sem IA)

> Substitui a etapa de IA (que hoje está quebrada e sempre cai em
> "pendente / não reconheceu a FRENTE") por uma verificação **best-effort no
> registro oficial CONFEF/CREF** com **fallback de revisão manual**.
> **Nunca faz hard-gate**: se a fonte falhar, o usuário vai pra fila manual, não é bloqueado.

## Diagnóstico que motivou (já comprovado)

- O upload de frente/verso funciona (`PUT /api/user/document` retorna 200 e grava no storage).
- A IA está em **fallback constante**: testes via `scripts/test-cref-upload.mjs` com upload limpo
  (igual ao Insomnia) deram **o mesmo veredito** ("não reconheceu a FRENTE") mesmo invertendo os
  lados — inclusive enviando o lado CONFEF como frente. `validade` sempre `null`. Assinatura clara
  de exceção mascarada (provável `GEMINI_API_KEY` ausente/sem quota no `movt-backend`).
- Spike de viabilidade do CONFEF: nacional (`confef.org.br`) está atrás de **anti-bot** (429 →
  `/challenge`); regional SP (`crefsp.gov.br`) é **JS-rendered**, sem API documentada. Por isso a
  consulta automática é **best-effort**, nunca um gate rígido.

## Máquina de estados (`status_verificacao`)

| Estado | Significado | Acesso ao app |
|---|---|---|
| `nao_enviado` | ainda não enviou documento | bloqueado (trainer CNPJ) |
| `pendente` | enviado; auto indeterminado/falhou → fila manual | bloqueado até decisão |
| `aprovado` | confirmado (auto ou admin) → `cref_verified = true` | liberado |
| `reprovado` | rejeitado (situação inativa, divergência clara, ou admin) | bloqueado; permite reenvio |

## Fluxo backend — `PUT /api/user/document` (movt-backend)

1. Recebe `document_front`, `document_back`; grava no storage (já faz hoje).
2. Lê `cref` (número) e `nome` do titular.
3. **Tenta** consulta CONFEF/CREF best-effort, com timeout curto (~8s):
   - Normaliza o número `NNNNNN-C/UF`; deduz o regional pela UF (`SP → CREF4`).
   - Extrai do registro: **nome** + **situação** (+ validade, se houver).
   - **Match** = nome do registro ≈ nome do titular (normalizado/fuzzy, ver §Segurança) **E**
     situação ∈ {ativo, regular, adimplente}.
   - Resultado:
     - match → `aprovado`, `cref_verified = true`, grava `validade` e `fonte = "confef"`.
     - número inexistente / situação inativa → `reprovado` + motivo.
     - **qualquer falha** (anti-bot, timeout, layout mudou, indeterminado) → `pendente`, `fonte = "manual"`.
4. Responde:
   ```json
   { "success": true, "url": "...", "back_url": "...",
     "status_verificacao": "aprovado|pendente|reprovado",
     "fonte": "confef|manual", "observation": "texto pro usuário", "validade": "YYYY-MM-DD|null" }
   ```

> **Recomendação de robustez:** se a consulta for lenta/instável, gravar `pendente` na hora e rodar a
> verificação **assíncrona** (job/fila) que atualiza o status; o app já faz poll de `session-status`.
> Para uma v1 mais simples, best-effort síncrono com timeout + fallback `pendente` é aceitável.

## Conector CONFEF/CREF (best-effort)

- Preferir descobrir o **XHR interno** que a página de consulta dispara (DevTools → Network):
  costuma existir um endpoint JSON não documentado, **bem mais estável** que raspar o DOM.
- Se só houver DOM (JS-rendered): usar **browser headless** (ex.: browserless) — mais frágil.
- **Cache** por número (TTL de dias) para reduzir chamadas e absorver instabilidade.
- **Circuit breaker:** após N falhas seguidas da fonte, mandar tudo pra manual até reabrir.
- Tratar o número por **UF** (cada regional tem sua consulta). Começar por SP (maioria) e expandir.

## Endpoints admin novos (fallback manual)

- `GET  /api/admin/cref-verifications?status=pendente`
  → `[{ id_us, nome, cref, document_front_url, document_back_url, submitted_at }]`
- `POST /api/admin/cref-verifications/:id/approve` → `cref_verified=true`, `status=aprovado`
- `POST /api/admin/cref-verifications/:id/reject { reason }` → `status=reprovado`, guarda motivo
- Auth: somente `role = admin`.

## Frontend (este repo: MOVT-FRONTEND)

1. `VerifyCrefScreen.tsx`: já trata `aprovado` vs `pendente`. Ajustar a mensagem do `pendente` para
   deixar claro que está **em análise** (auto + curadoria), sem prometer aprovação imediata.
2. **Nova tela/sheet admin "Verificações de CREF"** (reusar o padrão dos sheets do `AdminDashboardScreen`):
   lista pendentes → mostra as 2 fotos + número + nome → botões **Aprovar** / **Reprovar (com motivo)**.
3. `session-status` já devolve `cref_verified`/`status_verificacao`; o app libera ao aprovar
   (poll ao focar a tela de verificação).

## Segurança

- `cref_verified` **só** é setado pelo backend; nunca confiar no cliente.
- Normalizar nome (sem acentos, caixa, espaços) e usar **similaridade** (ex.: Jaro-Winkler ≥ 0.85)
  para evitar falso negativo por acento/abreviação.
- Rate-limit em `PUT /api/user/document`.

## Ferramenta de teste

`scripts/test-cref-upload.mjs` — reproduz o upload do app contra o backend (login + professional-data
+ document) e imprime o veredito. Serve para o time backend reproduzir e validar a nova lógica.
Credenciais via env (`MOVT_EMAIL`, `MOVT_SENHA`), nunca commitadas.
