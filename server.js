const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

// Armazenamento em memória das salas (suficiente para uma instância única no Render).
// Cada sala expira depois de 6 horas sem atividade para não vazar memória.
const rooms = {};
const ROOM_TTL_MS = 6 * 60 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const code of Object.keys(rooms)) {
    if (now - rooms[code].updatedAt > ROOM_TTL_MS) delete rooms[code];
  }
}, 15 * 60 * 1000);

app.get('/api/room/:code', (req, res) => {
  const r = rooms[req.params.code.toUpperCase()];
  if (!r) return res.status(404).json({ error: 'room_not_found' });
  res.json(r.data);
});

app.post('/api/room/:code', (req, res) => {
  const code = req.params.code.toUpperCase();
  rooms[code] = { data: req.body, updatedAt: Date.now() };
  res.json({ ok: true });
});

// Proxy para a API da Anthropic — mantém a chave no servidor, nunca no navegador.
app.post('/api/judge', async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY não configurada no servidor.' });
  }
  try {
    const { content } = req.body;
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        messages: [{ role: 'user', content }]
      })
    });
    const data = await resp.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`BoiVerso rodando na porta ${PORT}`));
