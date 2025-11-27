// backend/server.js
const express = require('express');
const axios = require('axios');
const helmet = require('helmet');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(helmet());
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || '*',
  credentials: true
}));

const STEAM_BASE = 'https://api.steampowered.com/IEconItems_730/GetPlayerItems/v0001/';

/**
 * POST /api/inventory
 * body: { steamid: string, key?: string }
 *
 * If key is provided in body, use it for this request only (not saved).
 * Else if process.env.STEAM_API_KEY is set, use that.
 */
app.post('/api/inventory', async (req, res) => {
  try {
    const { steamid, key } = req.body || {};
    if (!steamid) return res.status(400).json({ error: 'missing steamid' });

    const apiKey = key || process.env.STEAM_API_KEY;
    if (!apiKey) return res.status(400).json({ error: 'no api key provided; set STEAM_API_KEY in server env or pass key in body' });

    const params = {
      key: apiKey,
      steamid: steamid,
    };

    const resp = await axios.get(STEAM_BASE, { params, timeout: 15000 });
    const items = resp.data?.result?.items || [];

    // Map / normalize minimal fields for frontend
    const normalized = items.map(item => {
      const icon = item.icon_url ? `https://community.akamai.steamstatic.com/economy/image/${item.icon_url}/360fx360f` : null;
      return {
        id: item.id || `${item.defindex || 'unk'}_${Math.random().toString(36).slice(2,8)}`,
        name: item.market_hash_name || item.name || item.market_name || '未知名称',
        icon_url: icon,
        paintwear: typeof item.paintwear === 'number' ? item.paintwear : (item.paintwear ? parseFloat(item.paintwear) : null),
        floatvalue: item.floatvalue || null,
        defindex: item.defindex || null,
        // keep raw for debugging if needed
        raw: item
      };
    });

    return res.json({ items: normalized });
  } catch (err) {
    console.error('proxy error', err?.message || err);
    // provide helpful error message to frontend
    const msg = err.response?.data || err.message || 'unknown error';
    return res.status(500).json({ error: 'failed to fetch inventory', detail: msg });
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Inventory proxy running on ${port}`);
});
