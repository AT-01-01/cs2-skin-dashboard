const express = require('express');
const passport = require('passport');
const SteamStrategy = require('passport-steam').Strategy;
const session = require('express-session');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const app = express();

// 重要：这里三行全部写死你的真实地址
const BACKEND_URL = 'https://cs2-skin-dashboard.onrender.com';
const FRONTEND_URL = 'https://cs2-skin-dashboard.vercel.app';  // 如果你用了新部署的地址，就改成那个

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(session({
  secret: process.env.SESSION_SECRET || 'cs2dashboard123',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new SteamStrategy({
  returnURL: `${BACKEND_URL}/auth/steam/return`,
  realm: BACKEND_URL + '/',
  apiKey: process.env.STEAM_API_KEY
}, (identifier, profile, done) => {
  return done(null, { steamid: identifier.split('/').pop() });
}));

app.get('/auth/steam', passport.authenticate('steam'));

app.get('/auth/steam/return', passport.authenticate('steam', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect(`${FRONTEND_URL}/?loggedIn=true`);
  }
);

app.get('/api/inventory', (req, res) => {
  if (!req.user) return res.status(401).json({ error: '未登录' });
  res.json({ message: '登录成功', steamid: req.user.steamid });
});

app.get('/api/logout', (req, res) => {
  req.logout(() => {});
  res.redirect(FRONTEND_URL);
});

app.get('/', (req, res) => res.send('CS2 Skin Dashboard 后端运行中'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`后端运行在 ${BACKEND_URL}:${PORT}`);
});
