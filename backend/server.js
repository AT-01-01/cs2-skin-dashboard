const express = require('express');
const passport = require('passport');
const SteamStrategy = require('passport-steam').Strategy;
const SteamCommunity = require('steamcommunity');
const session = require('express-session');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const app = express();
const community = new SteamCommunity();
const bot = process.env.TELEGRAM_TOKEN ? new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true }) : null;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// Steam 策略
passport.use(new SteamStrategy({
  returnURL: `${process.env.BACKEND_URL || 'http://localhost:3001'}/auth/steam/return`,
  realm: process.env.BACKEND_URL || 'http://localhost:3001/',
  apiKey: process.env.STEAM_API_KEY
}, (identifier, profile, done) => {
  return done(null, { steamid: identifier });
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// 路由
app.get('/auth/steam', passport.authenticate('steam'));
app.get('/auth/steam/return', 
  passport.authenticate('steam', { failureRedirect: '/' }), 
  (req, res) => res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?loggedIn=true`)
);

app.get('/api/logout', (req, res) => {
  req.logout((err) => { if (err) return next(err); res.redirect('/'); });
});

// 获取库存 & 价格 (CS2 appid=730, contextid=2)
app.get('/api/inventory', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: '未登录' });
  try {
    const inventory = await new Promise((resolve, reject) => {
      community.getUserInventoryContents(req.user.steamid, 730, 2, true, (err, inv) => err ? reject(err) : resolve(inv));
    });
    const prices = {};
    for (const item of inventory) {
      if (item.market_hash_name) {
        await new Promise(resolve => setTimeout(resolve, 300)); // 限速 2s/item
        const priceData = await fetch(`https://steamcommunity.com/market/priceoverview/?appid=730&currency=18&market_hash_name=${encodeURIComponent(item.market_hash_name)}`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        }).then(r => r.json());
        prices[item.market_hash_name] = priceData.median_price || 'N/A';
      }
    }
    const totalValue = inventory.reduce((sum, item) => {
      const p = prices[item.market_hash_name];
      return sum + (p && p !== 'N/A' ? parseFloat(p.replace('¥', '')) * (item.amount || 1) || 0 : 0);
    }, 0);
    res.json({ inventory, prices, totalValue });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 市场价差 (低价狙击)
app.get('/api/market/:hashName', async (req, res) => {
  const hashName = req.params.hashName;
  const url = `https://steamcommunity.com/market/itemordershistogram?country=CN&language=schinese&currency=18&appid=730&market_hash_name=${encodeURIComponent(hashName)}`;
  try {
    const data = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    }).then(r => r.json());
    const buyMax = data.buy_order_table?.[0]?.price_per_unit / 100 || 0; // Steam 单位分
    const sellMin = data.sell_order_table?.[0]?.price_per_unit / 100 || 0;
    const spread = sellMin - buyMax;
    res.json({ spread, buyMax: (buyMax).toFixed(2), sellMin: (sellMin).toFixed(2) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Telegram 警报 (简单轮询示例，用户需扩展)
app.post('/api/alert', (req, res) => {
  const { message, chatId } = req.body;
  if (bot && chatId) {
    bot.sendMessage(chatId, message).then(() => res.json({ success: true })).catch(err => res.status(500).json({ error: err }));
  } else {
    res.json({ success: false, note: '未配置 Telegram' });
  }
});

app.listen(3001, () => console.log('后端运行: http://localhost:3001'));
