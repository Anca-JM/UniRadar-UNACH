require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
// En tu frontend, asegúrate de llamar a esta URL
const API_URL = 'https://uniradar-unach.onrender.com/api/notify';
const app = express();
const PORT = Number(process.env.PORT || 10000);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5500';
const CLICKATELL_API_KEY = process.env.CLICKATELL_API_KEY;
const CLICKATELL_BASE_URL = process.env.CLICKATELL_BASE_URL || 'https://platform.clickatell.com/messages/http/send';
const CLICKATELL_ENABLED = process.env.CLICKATELL_ENABLED === 'true';

app.use(helmet());
app.use(express.json({ limit: '20kb' }));

app.use(cors({
  origin(origin, callback) {
    if (!origin || origin === FRONTEND_ORIGIN) return callback(null, true);
    return callback(new Error('CORS bloqueado: origen no autorizado'));
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false
}));

function sanitizeText(value, max = 180) {
  if (typeof value !== 'string') return '';
  return value.replace(/[<>`$\\]/g, '').trim().slice(0, max);
}

function isValidEcuadorPhone(phone) {
  return /^5939\d{8}$/.test(String(phone));
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'UniRadar Backend', mode: CLICKATELL_ENABLED ? 'live' : 'demo' });
});

app.post('/api/notify', async (req, res) => {
  try {
    const phone = String(req.body.phone || '').replace(/[^0-9]/g, '');
    const message = sanitizeText(req.body.message, 220);

    if (!isValidEcuadorPhone(phone)) {
      return res.status(400).json({ ok: false, error: 'Número inválido. Usa formato Ecuador: 5939XXXXXXXX' });
    }

    if (message.length < 10) {
      return res.status(400).json({ ok: false, error: 'Mensaje demasiado corto.' });
    }

    if (!CLICKATELL_ENABLED) {
      return res.json({ ok: true, demo: true, message: 'Modo demo: validación correcta, no se envió SMS real.' });
    }

    if (!CLICKATELL_API_KEY) {
      return res.status(500).json({ ok: false, error: 'Falta configurar CLICKATELL_API_KEY en el servidor.' });
    }

    const url = new URL(CLICKATELL_BASE_URL);
    url.searchParams.set('apiKey', CLICKATELL_API_KEY);
    url.searchParams.set('to', phone);
    url.searchParams.set('content', message);

    const response = await fetch(url.toString(), { method: 'GET' });
    const data = await response.text();

    if (!response.ok) {
      return res.status(502).json({ ok: false, error: 'Error del proveedor Clickatell', detail: data.slice(0, 200) });
    }

    return res.json({ ok: true, provider: 'clickatell', detail: data.slice(0, 200) });
  } catch (error) {
    return res.status(500).json({ ok: false, error: 'Error interno controlado.' });
  }
});

app.use((_req, res) => {
  res.status(404).json({ ok: false, error: 'Ruta no encontrada.' });
});

app.listen(PORT, () => {
  console.log(`UniRadar backend activo en puerto ${PORT}`);
});
