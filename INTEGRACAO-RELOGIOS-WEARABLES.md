# Integração de Relógios / Wearables — MOVT

> Documento de decisão técnica e estratégica sobre como o MOVT coleta dados de
> saúde de smartwatches (Galaxy, Apple, Amazfit, Huawei, etc.).
> Preparado para apresentação ao dono do projeto.
> Data: 2026-05-31.

---

## 1. Resumo executivo (TL;DR)

- **Apps profissionais NÃO conectam por Bluetooth direto a smartwatches de
  consumo.** Strava, Nike Run Club, MyFitnessPal — nenhum fala BLE com um Galaxy
  Watch. Os fabricantes não expõem dados de saúde por Bluetooth a terceiros.
- O padrão da indústria são os **agregadores nativos da plataforma**:
  **Health Connect (Android)** e **Apple HealthKit (iOS)**. São **gratuitos** e
  cobrem **~90% dos relógios** do mercado.
- **O MOVT já tem essa arquitetura implementada.** O trabalho não é "construir do
  zero", e sim **finalizar e estabilizar** o que existe (há um bug de permissão
  no Health Connect a resolver).
- Agregadores pagos de terceiros (Terra, Vital, Rook) só se justificam quando
  houver demanda real por **Garmin, Fitbit, Whoop ou Oura** — não é prioridade
  agora.

**Recomendação em uma linha:**
> Health Connect + HealthKit primeiro (grátis, cobre 90%). Bluetooth direto só
> para sensores genéricos (cinta peitoral). APIs de marca/agregadores pagos só
> quando um cliente exigir Garmin/Fitbit/Whoop.

---

## 2. O problema que descobrimos

A tela de "vincular dispositivo via Bluetooth" do app sugere que parear o relógio
ali traz os dados de saúde. **Isso é tecnicamente impossível para os relógios mais
comuns.**

Galaxy Watch, Apple Watch, Amazfit e Huawei **criptografam** os dados e usam
**protocolo proprietário** entre o relógio e o **app oficial do fabricante**
(Samsung Health, Zepp, Huawei Health, app Saúde da Apple). Um app de terceiros que
tente ler via Bluetooth direto:

- Pode até **parear** o dispositivo;
- Mas **nunca recebe** batimentos, passos, sono — o serviço de dados simplesmente
  não está exposto na interface Bluetooth.

A conexão Bluetooth direta (BLE) só entrega dados para **sensores genéricos** que
seguem o padrão aberto: cintas peitorais (Polar H10), algumas pulseiras simples.

---

## 3. Como os apps profissionais realmente fazem (3 camadas)

### Camada 1 — Agregadores nativos da plataforma  →  **GRÁTIS** ⭐ (base obrigatória)

| Plataforma | API oficial | Papel |
|---|---|---|
| **Android** | **Health Connect** (Google) | Hub único onde Samsung Health, Zepp, Mi Fitness, Fitbit etc. depositam os dados. O app lê de um lugar só. |
| **iOS** | **Apple HealthKit** | Mesma ideia. Apple Watch e apps de saúde escrevem aqui. |

Cobre ~90% dos casos. É o que toda app no topo da App Store usa como base.
**O MOVT já implementa isso** (`unifiedHealthService` no Android,
`appleHealthKitService` no iOS).

### Camada 2 — APIs cloud-to-cloud por marca  →  pago/complexo (sob demanda)

Para marcas de ecossistema fechado que não entregam bem no agregador nativo:

- **Garmin** → Garmin Health API
- **Fitbit** → Fitbit Web API
- **Polar** → Polar AccessLink
- **Huawei** → Huawei Health Kit
- **Samsung** → Samsung Health Data SDK (programa de parceiros)

Funciona via OAuth: o servidor da marca envia os dados direto para o servidor do
MOVT (não depende do celular ligado).

### Camada 3 — Agregadores unificados de terceiros  →  pago (atalho)

Empresas que mantêm TODAS as integrações da Camada 2 por você. Você integra **uma
API** e recebe Garmin + Fitbit + Polar + Oura + Whoop + Apple + Google
normalizados:

- **Terra** (tryterra.co), **Vital** (tryvital.io), **Rook** (tryrook.io),
  **Spike/Thryve**

Economiza meses de desenvolvimento, mas tem custo recorrente por usuário.

---

## 4. Quais relógios funcionam via Health Connect

**Importante:** o Health Connect não conecta ao relógio — conecta ao **app** do
relógio. A pergunta real é "qual app de fabricante escreve no Health Connect".

### ✅ Funcionam bem

| Relógio | App-ponte necessário | Qualidade |
|---|---|---|
| **Samsung Galaxy Watch** (4/5/6/7, Ultra) | Samsung Health | Excelente |
| **Amazfit** (GTR, GTS, T-Rex, Bip) | Zepp | Boa |
| **Xiaomi / Redmi / Mi Band** | Mi Fitness | Boa |
| **Fitbit** (Versa, Sense, Charge) | Fitbit | Boa |
| **Google Pixel Watch** | Fitbit / Google Fit | Excelente |
| **Oura Ring** | Oura | Boa |
| **Whoop** | Whoop | Boa |
| **Polar** (Vantage, Ignite, cintas) | Polar Flow | Boa |
| **Withings** (ScanWatch) | Health Mate | Boa |
| Wear OS genérico | Google Fit / Fitbit | Boa |

### ⚠️ Funcionam mal ou não funcionam

| Relógio | Situação |
|---|---|
| **Apple Watch** | ❌ Nunca no Health Connect — é iOS puro. Só via **HealthKit** no iPhone. |
| **Huawei** (Watch GT, Band) | ⚠️ Fraco — Huawei está fora do ecossistema Google (sem GMS). Suporte parcial; geralmente exige a Huawei Health API. |
| **Garmin** | ⚠️ Fraco no Health Connect. Caminho correto é a Garmin Health API (Camada 2). |
| **Coros / Suunto** | ⚠️ Suporte limitado/inconsistente. |

### Os 3 pré-requisitos no celular do usuário (todos obrigatórios)

1. **Health Connect instalado** (nativo no Android 14+; via Play Store no Android 9–13).
2. **App do fabricante instalado e sincronizando** (Samsung Health / Zepp / Mi Fitness…).
3. **Usuário autorizou esse app a escrever no Health Connect** (toggle dentro do
   Samsung Health/Zepp — muita gente não ativa; sem isso, nenhum dado chega).

> ⚠️ Este cenário muda a cada atualização dos apps dos fabricantes. As marcações
> "✅/⚠️" são o estado geral, não garantia por modelo específico.

---

## 5. Custos

### Caminho gratuito (recomendado para agora)

| Solução | Custo | Cobre |
|---|---|---|
| **Health Connect** (Android) | **R$ 0** para sempre | Galaxy, Amazfit, Xiaomi, Fitbit, Pixel, Oura, Whoop, Polar… |
| **Apple HealthKit** (iOS) | **R$ 0** para sempre | Apple Watch e apps de saúde do iPhone |

**Limitação:** os dados precisam estar no celular do usuário (o app do fabricante
tem que estar instalado e sincronizando). Não funciona "server-side" puro.

### Caminho pago (agregadores de terceiros — só se necessário)

Todos cobram por **usuário ativo conectado por mês** (MAU), com tier grátis para
desenvolvimento:

| Provedor | Modelo | Observação |
|---|---|---|
| **Terra** | Por usuário ativo/mês | ~US$ 0,50–1+ por usuário ativo, com mínimo mensal |
| **Vital** | Por usuário conectado/mês | Também faz integração de exames laboratoriais |
| **Rook** | Flat / por usuário | Costuma ser o mais econômico |
| **Spike/Thryve** | Por usuário/mês | Foco enterprise |

> ⚠️ Estes valores são **ordem de grandeza**, não cotação. Os planos sérios são
> "fale com vendas" e os preços mudam com frequência. Para orçamento real, é
> preciso solicitar proposta atual a cada provedor.

**Ponto-chave de custo:** 1.000 usuários ativos conectando relógio podem custar de
centenas a alguns milhares de reais/mês num agregador pago. Para o estágio atual,
isso normalmente **não se justifica** — o caminho gratuito já cobre 90%.

---

## 6. Recomendação para o MOVT

```
PRIORIDADE 1  →  Health Connect + HealthKit funcionando 100%   →  R$ 0   →  cobre 90%
PRIORIDADE 2  →  Reposicionar a tela "vincular Bluetooth"       →  baixo custo
PRIORIDADE 3  →  (futuro) Agregador pago p/ Garmin/Fitbit/Whoop →  só sob demanda
```

1. **Estabilizar a Camada 1.** Health Connect (Android) + HealthKit (iOS) com
   fluxo de permissão sólido. Há um bug conhecido de permissão do Health Connect a
   resolver. Isso sozinho entrega Galaxy/Amazfit/Apple/Xiaomi — **90% do valor com
   10% do esforço**.

2. **Reposicionar a tela de Bluetooth.** Hoje ela sugere que vincular o relógio
   ali traz dados (não traz, para os relógios de consumo). O padrão profissional é
   o botão "Conectar relógio" abrir o **fluxo de permissão do Health
   Connect/HealthKit**, não um scan Bluetooth. O BLE direto fica reservado a cintas
   peitorais (BPM ao vivo em treino), se desejado.

3. **Adiar agregadores pagos.** Só contratar Terra/Rook quando houver usuários
   reais pedindo Garmin/Fitbit/Whoop **e** necessidade de dados no servidor sem
   depender do celular. Antes disso, é gastar com um problema que o nativo grátis
   já resolve.

---

## 7. Glossário rápido

- **BLE (Bluetooth Low Energy):** padrão Bluetooth para sensores. Funciona para
  cintas/pulseiras genéricas, **não** para smartwatches de marca.
- **Health Connect:** hub de saúde do Android (Google) que centraliza dados de
  vários apps de saúde. Gratuito.
- **HealthKit:** equivalente da Apple no iOS. Gratuito.
- **App-ponte:** app oficial do fabricante (Samsung Health, Zepp, Mi Fitness) que
  lê do relógio e deposita no Health Connect.
- **Agregador unificado (Terra/Vital/Rook):** serviço pago que entrega dados de
  todas as marcas por uma única API.
- **Cloud-to-cloud:** integração servidor-a-servidor (OAuth) que não depende do
  celular do usuário estar ligado.
