# BoiVerso 🐂

Jogo multiplayer de festival de boi-bumbá: crie uma sala, monte duas agremiações, desenhe os itens do festival e receba notas de três jurados de IA.

## Estrutura do projeto

```
boiverso/
├── server.js          # backend Express: estado das salas + proxy da API da Anthropic
├── package.json
├── render.yaml         # blueprint para deploy automático no Render
├── .env.example
├── .gitignore
└── public/
    └── index.html      # front-end (o jogo em si)
```

**Importante:** o jogo precisa de um back-end porque duas coisas não funcionam fora do ambiente de artifacts do Claude.ai:
1. Sincronizar o estado da sala entre os jogadores (aqui isso vira uma API REST simples com estado em memória).
2. Chamar a IA para julgar os desenhos (aqui a chave da API fica só no servidor, nunca no navegador).

---

## 1. Subir no GitHub

```bash
cd boiverso
git init
git add .
git commit -m "BoiVerso inicial"
gh repo create boiverso --public --source=. --push
# ou, sem o gh cli:
git remote add origin https://github.com/SEU_USUARIO/boiverso.git
git branch -M main
git push -u origin main
```

## 2. Deploy no Render (back-end + jogo completo)

Opção A — pelo painel:
1. Acesse [render.com](https://render.com) → **New > Web Service**.
2. Conecte o repositório `boiverso` do GitHub.
3. Render detecta o `render.yaml` automaticamente (Node, `npm install` / `npm start`).
4. Em **Environment**, adicione a variável `ANTHROPIC_API_KEY` com sua chave da [console.anthropic.com](https://console.anthropic.com).
5. Deploy. Sua URL final será algo como `https://boiverso.onrender.com` — o jogo completo (com API) já funciona direto nela.

Opção B — CLI, se preferir usar o blueprint diretamente: basta apontar o "Blueprint" do Render para o repositório; ele lê o `render.yaml` sozinho.

## 3. Cloudflare (duas formas de usar)

**Forma simples — Cloudflare só como DNS/CDN:**
Se quiser um domínio próprio (ex. `boiverso.com`) na frente do Render, aponte o domínio para a Cloudflare, crie um registro CNAME para `boiverso.onrender.com` e ative o proxy (nuvem laranja). Nenhuma mudança de código é necessária.

**Forma alternativa — Cloudflare Pages hospedando só o front-end:**
Se preferir separar front-end (Cloudflare Pages) do back-end (Render):
1. No Cloudflare Pages, crie um projeto apontando para o mesmo repositório GitHub, com diretório de build `public/` (sem build command, é só HTML estático).
2. Antes da tag `<script>` no `public/index.html`, adicione:
   ```html
   <script>window.API_BASE = "https://boiverso.onrender.com";</script>
   ```
3. O `server.js` já tem CORS liberado, então o front-end no Cloudflare Pages consegue chamar a API no Render normalmente.

---

## Rodando localmente

```bash
npm install
cp .env.example .env   # cole sua ANTHROPIC_API_KEY no .env
npm start
# abra http://localhost:3000
```

## Limitações desta versão

- Estado das salas fica em memória no processo do Render — se o serviço reiniciar (ex. plano free "dorme" por inatividade), as salas ativas são perdidas. Para produção séria, troque o objeto `rooms` em `server.js` por Redis, um banco de dados, ou o KV do Cloudflare.
- Um único servidor: se escalar para múltiplas instâncias, o estado em memória não é compartilhado entre elas — nesse caso também vale migrar para um armazenamento externo.
