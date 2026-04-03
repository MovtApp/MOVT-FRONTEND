# Documentação Completa — Feed Universal Instagram
> Documento de referência para construção de um feed social no estilo Instagram.
> Inclui: anatomia de UI, modelo de dados, APIs, funções e regras de negócio.

---

## 1. VISÃO GERAL DO SISTEMA

O feed universal exibe publicações de todos os usuários que o usuário logado segue, ordenadas por relevância ou recência. O sistema tem dois fluxos principais:

- **Write flow** — o usuário publica uma foto/vídeo/carrossel.
- **Read flow** — o usuário abre o app e consome o feed personalizado.

---

## 2. ANATOMIA DE UM POST (UI)

Cada card de publicação no feed é composto pelas seguintes seções, de cima para baixo:

### 2.1 Cabeçalho do post
| Elemento | Descrição |
|---|---|
| Avatar circular | Foto de perfil do autor (tap abre o perfil) |
| Username | Nome de usuário (@handle), negrito |
| Localização | Tag de localização opcional, fonte menor, abaixo do username |
| Botão "···" (more) | Menu de contexto com ações adicionais (canto superior direito) |
| Badge "Seguindo" | Exibido se o usuário ainda não segue (para sugestões no feed) |
| Badge "Patrocinado" | Exibido em posts de anúncio |

### 2.2 Mídia
| Elemento | Descrição |
|---|---|
| Imagem única | Proporções suportadas: 1:1 (quadrado), 4:5 (retrato), 1.91:1 (paisagem) |
| Carrossel | Múltiplas mídias com swipe horizontal; indicador de pontos na base |
| Vídeo | Reprodução automática silenciosa; tap ativa/desativa som |
| Reels | Vídeo vertical (9:16) |
| Double tap | Toque duplo curte o post com animação de coração |

### 2.3 Barra de ações
Ações da esquerda para a direita:

| Ícone | Ação | Estado ativo |
|---|---|---|
| Coração | Curtir / descurtir | Preenchido em vermelho (#E1306C) |
| Balão de fala | Abrir comentários | — |
| Avião de papel | Encaminhar (DM ou copiar link) | — |
| Marcador (bookmark) | Salvar / remover dos salvos | Preenchido em preto |

> O botão de salvar (bookmark) fica alinhado à **direita** da barra, separado dos demais.

### 2.4 Contador de curtidas
- Texto: `X curtidas` ou `Curtido por [username] e outras X pessoas`
- Clicável: abre lista de quem curtiu

### 2.5 Legenda
- Formato: **username** seguido do texto da legenda
- Exibe 3 linhas por padrão; botão "mais" para expandir
- Hashtags clicáveis (#)
- Menções clicáveis (@)

### 2.6 Comentários
- Link "Ver todos os X comentários" (clicável)
- Exibe 1–2 comentários mais relevantes inline
- Cada comentário: avatar, username em negrito + texto + tempo

### 2.7 Timestamp
- Tempo relativo: "há 2 horas", "há 3 dias"
- Clicável: abre post em tela dedicada

### 2.8 Campo de comentário rápido
- Avatar do usuário logado + input "Adicione um comentário..."
- Botão "Publicar" aparece ao digitar
- Sugestões de emoji rápido (😂 ❤️ 😮 😢 👏 🔥)

---

## 3. MENU DE CONTEXTO ("···")

O menu muda conforme o **dono do post**:

### 3.1 Post próprio (isOwner = true)
| Opção | Função |
|---|---|
| Editar | Abre modal para editar legenda, localização e tags |
| Arquivar | Remove do feed público; vai para "Arquivados" no perfil |
| Excluir | Abre confirmação; remove permanentemente |
| Fixar no perfil | Destaca o post no topo do grid de perfil |
| Ocultar curtidas | Alterna exibição pública da contagem de curtidas |
| Desativar comentários | Bloqueia novos comentários |
| Compartilhar como Story | Republica como story com link para o post |
| Copiar link | Copia URL do post |
| Ver estatísticas | Abre insights (alcance, impressões, saves, shares) |

### 3.2 Post de outro usuário (isOwner = false)
| Opção | Função |
|---|---|
| Denunciar | Abre fluxo de denúncia categorizado |
| Deixar de seguir | Unfollow do autor |
| Silenciar | Oculta posts/stories sem deixar de seguir |
| Copiar link | Copia URL do post |
| Sobre esta conta | Exibe informações da conta |
| Não tenho interesse | Sinaliza ao algoritmo para mostrar menos desse tipo de conteúdo |

---

## 4. MODELO DE DADOS

### 4.1 Tabela: users
```
user_id         UUID / BIGINT   PK
username        VARCHAR(30)     UNIQUE NOT NULL
full_name       VARCHAR(100)
email           VARCHAR(255)    UNIQUE
phone           VARCHAR(20)
bio             TEXT
avatar_url      VARCHAR(500)
is_private      BOOLEAN         DEFAULT false
is_verified     BOOLEAN         DEFAULT false
follower_count  INT             DEFAULT 0
following_count INT             DEFAULT 0
post_count      INT             DEFAULT 0
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### 4.2 Tabela: posts
```
post_id         UUID / BIGINT   PK
user_id         FK → users
type            ENUM(image, video, carousel, reel)
caption         TEXT
location        VARCHAR(255)
like_count      INT             DEFAULT 0
comment_count   INT             DEFAULT 0
share_count     INT             DEFAULT 0
save_count      INT             DEFAULT 0
view_count      INT             DEFAULT 0
is_archived     BOOLEAN         DEFAULT false
is_pinned       BOOLEAN         DEFAULT false
likes_hidden    BOOLEAN         DEFAULT false
comments_off    BOOLEAN         DEFAULT false
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### 4.3 Tabela: media (arquivos de um post)
```
media_id        UUID            PK
post_id         FK → posts
media_url       VARCHAR(500)
thumbnail_url   VARCHAR(500)
media_type      ENUM(image, video)
width           INT
height          INT
duration_sec    FLOAT           (para vídeos)
position        INT             (ordem no carrossel)
created_at      TIMESTAMP
```

### 4.4 Tabela: likes
```
like_id         UUID            PK
user_id         FK → users
post_id         FK → posts
created_at      TIMESTAMP
UNIQUE(user_id, post_id)
```

### 4.5 Tabela: comments
```
comment_id      UUID            PK
post_id         FK → posts
user_id         FK → users
parent_id       FK → comments   (NULL = comentário raiz; NOT NULL = resposta)
body            TEXT
like_count      INT             DEFAULT 0
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### 4.6 Tabela: comment_likes
```
like_id         UUID            PK
user_id         FK → users
comment_id      FK → comments
created_at      TIMESTAMP
UNIQUE(user_id, comment_id)
```

### 4.7 Tabela: saved_posts
```
save_id         UUID            PK
user_id         FK → users
post_id         FK → posts
collection_id   FK → collections (opcional)
created_at      TIMESTAMP
UNIQUE(user_id, post_id)
```

### 4.8 Tabela: followers
```
follower_id     FK → users      (quem segue)
following_id    FK → users      (quem é seguido)
status          ENUM(active, pending, blocked)
created_at      TIMESTAMP
PRIMARY KEY (follower_id, following_id)
```

### 4.9 Tabela: shares
```
share_id        UUID            PK
post_id         FK → posts
sender_id       FK → users
receiver_id     FK → users      (NULL = link externo)
share_type      ENUM(dm, link, story, external)
created_at      TIMESTAMP
```

### 4.10 Tabela: notifications
```
notification_id UUID            PK
user_id         FK → users      (destinatário)
actor_id        FK → users      (quem gerou a notificação)
type            ENUM(like, comment, follow, mention, share, tag)
entity_type     ENUM(post, comment, story)
entity_id       UUID
is_read         BOOLEAN         DEFAULT false
created_at      TIMESTAMP
```

### 4.11 Tabela: feed (cache pré-computado)
```
user_id         FK → users
post_id         FK → posts
score           FLOAT           (ranking do algoritmo)
inserted_at     TIMESTAMP
PRIMARY KEY (user_id, post_id)
```

---

## 5. APIs REST

### 5.1 Feed
```
GET  /api/v1/feed?cursor=<post_id>&limit=10
```
Retorna posts paginados com cursor. Resposta inclui:
- `posts[]` — array de objetos post com author, media, counters, is_liked, is_saved
- `next_cursor` — ID do último post retornado
- `has_more` — boolean

### 5.2 Posts
```
POST   /api/v1/posts              — criar post
GET    /api/v1/posts/:post_id     — detalhe do post
PATCH  /api/v1/posts/:post_id     — editar caption, location, tags
DELETE /api/v1/posts/:post_id     — excluir post
POST   /api/v1/posts/:post_id/archive    — arquivar
POST   /api/v1/posts/:post_id/unarchive  — desarquivar
POST   /api/v1/posts/:post_id/pin        — fixar no perfil
POST   /api/v1/posts/:post_id/unpin      — desafixar
PATCH  /api/v1/posts/:post_id/settings   — toggle likes_hidden, comments_off
```

### 5.3 Curtidas
```
POST   /api/v1/posts/:post_id/like    — curtir
DELETE /api/v1/posts/:post_id/like    — descurtir
GET    /api/v1/posts/:post_id/likes   — lista de quem curtiu (paginado)
```

### 5.4 Comentários
```
GET    /api/v1/posts/:post_id/comments             — lista comentários (paginado)
POST   /api/v1/posts/:post_id/comments             — adicionar comentário
DELETE /api/v1/posts/:post_id/comments/:comment_id — excluir comentário
POST   /api/v1/comments/:comment_id/like           — curtir comentário
DELETE /api/v1/comments/:comment_id/like           — descurtir comentário
GET    /api/v1/comments/:comment_id/replies        — respostas (paginado)
```

### 5.5 Encaminhar (Share)
```
POST   /api/v1/posts/:post_id/share
Body: { type: "dm" | "link" | "story", receiver_id?: string }
```

### 5.6 Salvar
```
POST   /api/v1/posts/:post_id/save
DELETE /api/v1/posts/:post_id/save
GET    /api/v1/users/me/saved          — posts salvos do usuário
```

### 5.7 Seguidores
```
POST   /api/v1/users/:user_id/follow
DELETE /api/v1/users/:user_id/follow
GET    /api/v1/users/:user_id/followers
GET    /api/v1/users/:user_id/following
```

### 5.8 Denúncia
```
POST   /api/v1/posts/:post_id/report
Body: { reason: "spam" | "hate" | "violence" | "nudity" | "false_info" | "other" }
```

---

## 6. OBJETO POST — PAYLOAD COMPLETO

```json
{
  "post_id": "abc123",
  "type": "image",
  "author": {
    "user_id": "u001",
    "username": "marina_vieira",
    "full_name": "Marina Vieira",
    "avatar_url": "https://cdn.example.com/avatars/u001.jpg",
    "is_verified": false,
    "is_following": true
  },
  "media": [
    {
      "media_id": "m001",
      "media_url": "https://cdn.example.com/posts/abc123_1.jpg",
      "thumbnail_url": "https://cdn.example.com/posts/abc123_1_thumb.jpg",
      "media_type": "image",
      "width": 1080,
      "height": 1080,
      "position": 0
    }
  ],
  "caption": "A vida é melhor perto do mar 🌊✨",
  "location": "Florianópolis, SC",
  "hashtags": ["#praia", "#verão"],
  "mentions": ["@joao"],
  "like_count": 1203,
  "comment_count": 48,
  "share_count": 12,
  "save_count": 87,
  "is_liked": false,
  "is_saved": false,
  "likes_hidden": false,
  "comments_off": false,
  "is_pinned": false,
  "is_archived": false,
  "created_at": "2026-04-01T10:00:00Z",
  "time_ago": "há 2 horas"
}
```

---

## 7. FUNÇÕES E REGRAS DE NEGÓCIO

### 7.1 Curtir
- Um usuário não pode curtir o próprio post (regra de negócio opcional).
- Cada par `(user_id, post_id)` é único: impede curtida dupla.
- `like_count` no post é derivado: `SELECT COUNT(*) FROM likes WHERE post_id = ?`
- Atualização otimista no cliente: UI reflete a curtida imediatamente antes da resposta do servidor.

### 7.2 Comentar
- Comentários suportam aninhamento de 1 nível (resposta a um comentário, não a uma resposta).
- `@menção` em comentários gera notificação para o usuário mencionado.
- O dono do post pode excluir qualquer comentário em seu post.
- O autor pode excluir seu próprio comentário.

### 7.3 Encaminhar
- **DM**: envia como mensagem direta para um ou mais usuários.
- **Copiar link**: gera URL pública `https://app.example.com/p/:post_id`.
- **Adicionar ao Story**: republica com sticker de link para o post original.

### 7.4 Salvar
- Salvos são visíveis **apenas para o próprio usuário**.
- O dono do post **não sabe** que alguém salvou seu post.
- Posts podem ser salvos em Coleções (pastas personalizadas).

### 7.5 Editar post
- Apenas o dono pode editar.
- Campos editáveis: `caption`, `location`, `tags de usuário na mídia`.
- Mídias **não podem** ser editadas; substituir mídia requer excluir e repostar.
- Deve marcar visualmente "Editado" ou registrar `updated_at`.

### 7.6 Arquivar
- O post sai do feed público e do grid de perfil.
- O dono ainda o vê em `Perfil > Arquivo`.
- Pode ser desarquivado a qualquer momento.
- Curtidas e comentários são preservados.

### 7.7 Excluir
- Ação irreversível.
- Remove post, mídias, curtidas e comentários associados.
- Deve exibir modal de confirmação antes de executar.
- Notificações existentes relacionadas ao post tornam-se inativas.

### 7.8 Fixar no perfil
- Máximo de 3 posts fixados simultaneamente.
- Exibidos no topo do grid de perfil.

### 7.9 Silenciar (mute)
- O usuário para de ver posts/stories de alguém sem deixar de segui-lo.
- Armazenado em tabela `mutes (user_id, muted_user_id)`.
- O usuário silenciado não é notificado.

### 7.10 Ocultar contagem de curtidas
- O dono pode ocultar a contagem de curtidas para outros (apenas ele vê).
- Campo `likes_hidden BOOLEAN` no post.
- Outros usuários veem "Curtido por [username]" sem número.

### 7.11 Desativar comentários
- Campo `comments_off BOOLEAN` no post.
- Já existentes continuam visíveis; novos são bloqueados.

---

## 8. ALGORITMO DE FEED

O feed não é puramente cronológico. Os fatores de ranking são:

| Sinal | Peso |
|---|---|
| Recência do post | Alto |
| Frequência de interação com o autor | Alto |
| Tipo de mídia preferida pelo usuário | Médio |
| Engajamento geral do post (likes, comments, shares) | Médio |
| Tempo de visualização (view time) | Médio |
| Frequência de abertura do app pelo usuário | Baixo |

**Estratégia de geração:**
- **Fanout on write (push)**: ao publicar, o post é inserido no feed pré-computado de todos os seguidores → baixa latência de leitura.
- **Fanout on read (pull)**: para contas com milhões de seguidores (celebridades), o feed é gerado sob demanda para evitar sobrecarga de escrita.
- **Híbrido**: usuários ativos recebem push; inativos recebem pull quando abrem o app.

**Paginação:** cursor-based com `post_id` do último item carregado.

---

## 9. STORIES BAR (barra acima do feed)

| Elemento | Descrição |
|---|---|
| Anel gradiente colorido | Story não visto (gradiente laranja/rosa) |
| Anel cinza | Story já visto |
| Avatar "+" | Story do próprio usuário; tap abre câmera/galeria |
| Ordem | Próprio usuário sempre primeiro; demais por relevância |
| Expiração | Stories expiram após 24 horas |

---

## 10. NOTIFICAÇÕES GERADAS PELO FEED

| Evento | Notificação para |
|---|---|
| Alguém curtiu seu post | Dono do post |
| Alguém comentou no seu post | Dono do post |
| Alguém respondeu seu comentário | Autor do comentário |
| Alguém te mencionou em comentário | Usuário mencionado |
| Alguém começou a te seguir | Seguido |
| Alguém encaminhou seu post | (sem notificação por padrão) |
| Alguém curtiu seu comentário | Autor do comentário |

---

## 11. ESTADOS DE UI POR AÇÃO

### Curtir
- Estado padrão: coração outline, cinza
- Estado ativo: coração preenchido, vermelho (#E1306C)
- Animação: scale up (1.0 → 1.35 → 1.0) em ~200ms
- Double tap na mídia: coração grande centralizado, fade in/out

### Salvar
- Estado padrão: bookmark outline
- Estado ativo: bookmark preenchido, preto/branco (segue o tema)
- Animação: scale + fill em ~150ms

### Comentário
- Botão "Publicar" visível apenas quando o campo tem texto
- Após publicar: input limpa, contador incrementa, comentário aparece inline

### Encaminhar
- Abre bottom sheet com: busca de usuários, sugestões recentes, "Copiar link", "Adicionar ao story"

---

## 12. ESTRUTURA DE TELAS RELACIONADAS

```
Feed (Home)
├── Post detail (tela dedicada ao post + todos os comentários)
├── Perfil do autor
│   ├── Grid de posts
│   ├── Posts arquivados (apenas dono)
│   ├── Posts salvos (apenas dono)
│   └── Posts fixados
├── Lista de curtidas do post
├── Tela de comentários
│   └── Respostas a comentário
├── Encaminhar (bottom sheet)
│   └── DM / Copiar link / Story
└── Denúncia (fluxo multi-step)
```

---

## 13. REGRAS DE PRIVACIDADE

| Regra | Comportamento |
|---|---|
| Conta privada | Posts visíveis apenas para seguidores aprovados |
| Conta pública | Posts visíveis para todos |
| Usuário bloqueado | Não vê posts, não pode comentar/curtir |
| Silenciado | Posts do silenciado não aparecem no feed, mas o canal segue ativo |
| Salvos | Privado; o dono do post não sabe |
| Like count oculto | Apenas o dono do post vê a contagem exata |

---

## 14. GLOSSÁRIO DE CAMPOS

| Campo | Tipo | Descrição |
|---|---|---|
| `is_liked` | bool | O usuário logado curtiu este post |
| `is_saved` | bool | O usuário logado salvou este post |
| `is_following` | bool | O usuário logado segue o autor |
| `is_owner` | bool | O usuário logado é o dono do post |
| `likes_hidden` | bool | Contagem de curtidas oculta para terceiros |
| `comments_off` | bool | Novos comentários desativados |
| `is_archived` | bool | Post arquivado (fora do feed público) |
| `is_pinned` | bool | Post fixado no topo do perfil |
| `time_ago` | string | Tempo formatado: "há 3 horas", "há 2 dias" |
| `next_cursor` | string | Cursor para próxima página do feed |
| `has_more` | bool | Indica se há mais posts para carregar |
