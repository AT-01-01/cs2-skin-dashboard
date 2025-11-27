// backend/server.js —— 最终公共版（任何人都能登录）
const express = require('express');
const passport = require('passport');
const SteamStrategy = require('passport-steam').Strategy;
const session = require('express-session');
const cors = require('cors');

const app = express();

const FRONTEND_URL = 'https://cs2-skin-dashboard.vercel.app';  // 改成你的前端地址

app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(session({
  secret: 'cs2public2025',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: true, sameSite: 'none' }
}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// 完全不传 apiKey！纯 OpenID 登录
passport.use(new SteamStrategy({
  returnURL: 'https://cs2-skin-dashboard.onrender.com/auth/steam/return',
  realm: 'https://cs2-skin-dashboard.onrender.com/',
}, (identifier, profile, done) => {
  const steamid = identifier.split('/').pop();
  done(null, { steamid });
}));

app.get('/auth/steam', passport.authenticate('steam'));
app.get('/auth/steam/return',
  passport.authenticate('steam', { failureRedirect: FRONTEND_URL }),
  (req, res) => res.redirect(`${FRONTEND_URL}/?loggedIn=true`)
);

app.get('/api/me', (req, res) => {
  if (!req.user) return res.status(401).json({ error: '未登录' });
  res.json({ steamid: req.user.steamid });
});

app.get('/api/logout', (req, res) => {
  req.logout(() => {});
  res.redirect(FRONTEND_URL);
});

app.get('/', (req, res) => res.send('后端正常运行'));

app.listen(process.env.PORT || 3001);
