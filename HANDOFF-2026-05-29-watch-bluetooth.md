# Handoff — Conexão de watch / Bluetooth (2026-05-29)

> Doc de continuação. Objetivo do dia: **fazer o "vincular dispositivo (watch)" parar de dar erro.**

## TL;DR

O erro NÃO era Bluetooth. Era o app gravando o dispositivo **direto no Supabase**, onde a
tabela `dispositivos` está com **RLS em deny-all** → INSERT falhava com `42501`. O backend
**já tinha as rotas certas**; o fix foi apontar o app para elas. A conexão BLE em si funciona.

## Diagnóstico (a trilha que seguimos)

1. `event.json` (raiz do repo) = evento real do Sentry. Mostrou que o crash de "watch" era na
   verdade **Health Connect** (`lateinit requestPermission`), não BLE. → decidimos NÃO mexer nisso.
2. Log do usuário revelou o erro real do "vincular": `42501 new row violates row-level security
   policy for table "dispositivos"`.
3. Confirmado no banco: `dispositivos` com **RLS on + zero policies** (deny-all). Usuários de
   **e-mail/senha não têm sessão Supabase** (`auth.uid()` nulo) — só o login Google chama
   `supabase.auth.setSession`. Logo, INSERT/SELECT direto do cliente falha/volta vazio.
4. Tabela `usuarios` tem `id_us` (int), `auth_user_id` (uuid), `supabase_uid` (text).
5. Decisão: **rota backend (service_role)** em vez de reescrever RLS/sessão.
6. Achado final: o backend **já expõe** os endpoints corretos — bastava o app usá-los.

## O que foi feito (branch `fix/device-registration-backend`, commit `04bbc27`, NÃO pushado)

Arquivos no frontend (`MOVT/`):
- `src/services/wearOsHealthService.ts`
  - `registerWearOsDevice(deviceInfo)` → `POST /api/wearos/register` (sem `id_us` do cliente).
  - nova `getRegisteredDevices()` → `GET /api/wearos/devices`.
- `src/components/data/DeviceSelectorModal.tsx`
  - conecta via BLE **antes** de gravar; usa as funções token-based; mensagem distingue
    "falha de conexão" de "falha ao salvar"; registra **sem** `tipo: "Bluetooth BLE"`
    (senão não aparece na lista, que filtra `tipo='Wear OS'`).
- `src/services/bluetoothService.ts`
  - só monitora Heart Rate se o serviço `0x180D` existir de fato (Galaxy/Apple/Amazfit não
    expõem) — elimina o `ERROR BleError: Service 0000180d ... not found` que era falso alarme.

Backend (`../MOVT-BACKEND/index.js`) — **nada alterado, já estava pronto e deployado**:
- `verifyToken` (linha ~827): `usuarios WHERE session_id = Bearer` → `req.userId = id_us`.
- `POST /api/wearos/register` (~6924): dedup por usuário+modelo; `INSERT ... dispositivos` via `service_role`.
  body: `{ deviceName, deviceModel, deviceType?, deviceVersion?, tokenAcesso? }`; `modelo` é varchar(14).
- `GET /api/wearos/devices` (~6994): lista filtrando `tipo='Wear OS'`.

Banco Supabase: **nada a fazer** — RLS deny-all em `dispositivos` é o estado desejado
(service_role no servidor ignora a RLS).

## Estado atual

| Item | Status |
|---|---|
| App aponta pras rotas certas | ✅ feito (commit local) |
| Backend / Supabase | ✅ nada a fazer |
| Branch pushada | ❌ ainda local (`fix/device-registration-backend`) |
| Testado ponta-a-ponta em device real | ❌ pendente |

## Próximos passos (amanhã)

1. **Push + merge:** `git push -u origin fix/device-registration-backend` e mesclar na `main`
   (ou abrir PR). Histórico do projeto é direto na `main`.
2. **Testar no app** (device real): escanear → vincular → deve dar "Sucesso" e o relógio
   aparecer em "Dispositivos Salvos".
3. **Aviso #1 (opcional, afeta todos os usuários):** os reads de saúde ainda batem direto no
   Supabase e voltam **vazios** por causa da RLS deny-all:
   `getLatestWearOsHealthData`, `checkWearOsDeviceRegistered`, `getAllWearOsDevices`,
   realtime em `wearOsHealthService.ts`. Migrar para endpoints `/api/wearos/...` (alguns já
   existem: `GET /api/wearos/devicesON`, dados de saúde ~linha 7165). Sem isso, BPM/SpO2/sono
   podem vir zerados para usuários de e-mail/senha.
4. **Fora de escopo hoje, mas há crash em prod:** Health Connect `lateinit requestPermission`
   (ver `event.json` + memória `healthconnect-permission-crash`). O patch evita o crash mas
   não faz a permissão funcionar. Tratar quando voltar ao tema de Health Connect.

## Referências rápidas

- Frontend: `C:\Users\TGL Solutions\Desktop\MOVT APP\MOVT`
- Backend: `C:\Users\TGL Solutions\Desktop\MOVT APP\MOVT-BACKEND` (Express, `index.js` ~305KB)
- API base: prod `https://movt-backend.vercel.app/api`; dev via `EXPO_PUBLIC_API_URL` (`src/config/api.ts`)
- Supabase: `ypnpdjgsyzdwsmnxsoqj`
- Memórias relacionadas: `device-registration-backend`, `healthconnect-permission-crash`, `security-audit-completed`
