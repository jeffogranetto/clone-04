# LP UAG — Fundações Sem Complicações

Landing page de captação para a pós-graduação em Engenharia de Unidades Armazenadoras de Grãos.

## Stack

- HTML/CSS/JS estático
- Formulário de captura de lead via modal (com máscara de telefone, validação nativa)
- Cloudflare Pages Functions (`functions/api/lead.js`) — integração server-side com ActiveCampaign e Clint Digital
- Typebot na página de obrigado (`obrigado.html`) com variáveis pré-preenchidas via URL
- Google Tag Manager em ambas as páginas

## Estrutura

```
.
├── index.html              ← Landing page principal
├── obrigado.html           ← Thank-you page com Typebot
├── customize.js            ← Script de build (idempotente) — aplica customizações no index.html
├── functions/
│   └── api/
│       └── lead.js         ← POST /api/lead — recebe o submit e dispara AC + Clint em paralelo
├── assets/                 ← Assets estáticos (CSS, JS, imagens, fontes)
├── .dev.vars.example       ← Template de variáveis de ambiente locais
└── .gitignore
```

## Fluxo de captura

1. Usuário clica em qualquer CTA "QUERO MAIS INFORMAÇÕES"
2. Modal abre com 4 campos: **Nome**, **E-mail**, **Telefone** (com máscara), **Formação** (select)
3. No submit:
   - POST → `/api/lead` (Cloudflare Function)
   - Se a Function falhar → `navigator.sendBeacon` direto para o webhook Clint (fallback)
   - Redirect para `/obrigado.html?nome=...&email=...&whatsapp=...&formacao=...&utm_*=...`
4. Página de obrigado carrega Typebot `pos-uag-aplicacao-perpetuo` com dados pré-preenchidos

## Variáveis de ambiente

Configure em **Cloudflare Pages → Settings → Environment Variables → Production**:

| Variável | Descrição |
|---|---|
| `AC_API_URL` | URL da sua conta ActiveCampaign (ex.: `https://suaorg.api-us1.com`) |
| `AC_API_KEY` | API Key do ActiveCampaign (Settings → Developer) |
| `AC_TAG_NAME` | Nome exato da tag a ser aplicada nos leads |
| `CLINT_WEBHOOK_URL` | URL completa do webhook Clint |

### Desenvolvimento local

```bash
cp .dev.vars.example .dev.vars
# edite .dev.vars com os valores reais
```

## Rodar localmente

```bash
# Instala wrangler globalmente (uma vez)
npm install -g wrangler

# Sobe dev server (serve estáticos + executa /api/lead)
wrangler pages dev . --port 8099 --compatibility-date 2026-04-22
```

Acesse http://localhost:8099

## Reaplicar customizações no index.html

O `index.html` é um clone pixel-perfect do servidor original + injeções via `customize.js`. Se precisar re-aplicar (após editar o script):

```bash
node customize.js
```

O script é idempotente — limpa injeções anteriores antes de aplicar de novo.

## Deploy

### Opção 1: Git-based (recomendado)

1. Conecte o repositório no painel Cloudflare Pages
2. **Framework preset**: None
3. **Build command**: (vazio — é estático)
4. **Build output directory**: `/`
5. Configure as env vars na aba Settings
6. Todo push na branch `main` faz deploy automático

### Opção 2: Direct upload via wrangler

```bash
wrangler pages deploy . --project-name lp-uag
```

## Integrações

### ActiveCampaign

A Function `functions/api/lead.js` cria/atualiza o contato via `POST /api/3/contact/sync` e aplica a tag configurada em `AC_TAG_NAME`.

### Clint Digital

Webhook acionado em paralelo com AC via `CLINT_WEBHOOK_URL`. Payload em português (`nome`, `email`, `phone`, `formacao`, `utm_*`).

### Typebot

Página de obrigado carrega o Typebot `pos-uag-aplicacao-perpetuo` com todas as variáveis coletadas no form + UTMs pré-preenchidas.

## Google Tag Manager

Eventos disparados no `dataLayer`:

| Evento | Quando |
|---|---|
| `lead_modal_open` | Usuário abre o modal (clique em qualquer CTA) |
| `lead_submit` | Form submetido (inclui `lead_formacao`, `utm_source`, `utm_campaign`) |
| `thank_you_view` | Página `obrigado.html` carregada |
