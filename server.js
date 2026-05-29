const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '5mb' }));

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    })
  : null;

async function ensureDb() {
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cp_state (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

app.get('/api/health', async (req, res) => {
  try {
    if (pool) await ensureDb();
    res.json({ ok: true, database: !!pool });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Database non raggiungibile' });
  }
});

app.get('/api/state', async (req, res) => {
  try {
    if (!pool) return res.json({ state: {} });
    await ensureDb();
    const result = await pool.query('SELECT key, value FROM cp_state');
    const state = {};
    result.rows.forEach(r => { state[r.key] = r.value; });
    res.json({ state });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore caricamento dati cloud' });
  }
});

app.post('/api/state', async (req, res) => {
  try {
    if (!pool) return res.json({ ok: true, mode: 'local-only' });
    await ensureDb();
    const state = req.body && req.body.state ? req.body.state : {};
    const allowed = ['cp_v4', 'cp_taccuino_v1', 'cp_cassa_iniziale'];
    for (const key of allowed) {
      if (!Object.prototype.hasOwnProperty.call(state, key)) continue;
      const value = state[key];
      if (value === null || value === undefined) {
        await pool.query('DELETE FROM cp_state WHERE key=$1', [key]);
      } else {
        await pool.query(
          `INSERT INTO cp_state (key, value, updated_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=NOW()`,
          [key, String(value)]
        );
      }
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore salvataggio dati cloud' });
  }
});

app.use(express.static(path.join(__dirname)));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Colpo Perfetto online on port ${port}`);
});
