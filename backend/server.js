require('dotenv').config();
const express = require('express');
const passport = require('passport');
const SteamStrategy = require('passport-steam').Strategy;
const session = require('express-session');
const cors = require('cors');

const app = express();

// 支持环境变量，如果没有则使用默认值（用于本地开发）
const BACKEND_URL  = process.env.BACKEND_URL || 'https://cs2-skin-dashboard.onrender.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://cs2-skin-dashboard.vercel.app';

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'cs2dashboard2025',
  resave: false,
  saveUninitialized: false,
  proxy: true,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // 生产环境使用secure
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    httpOnly: true 
  }
}));
app.set('trust proxy', 1);   // ←←← 加上这行！超级关键！
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// 关键：profile: false 完全不需要 apiKey，只验证身份
passport.use(new SteamStrategy({
  returnURL: BACKEND_URL + '/auth/steam/return',
  realm: BACKEND_URL + '/',
  profile: false  // ←←← 这行就是魔法！无需 apiKey
}, (identifier, profile, done) => {
  process.nextTick(() => {
    // Steam OpenID标识符格式: https://steamcommunity.com/openid/id/76561198012345678
    // 提取最后的数字ID
    const steamidMatch = identifier.match(/\/id\/(\d+)$/);
    const steamid = steamidMatch ? steamidMatch[1] : identifier.split('/').pop();
    return done(null, { steamid });
  });
}));

app.get('/auth/steam', passport.authenticate('steam'));

// 关键回调，加入双重保险
app.get('/auth/steam/return',
  passport.authenticate('steam', { failureRedirect: FRONTEND_URL }),
  (req, res) => {
    try {
      res.redirect(FRONTEND_URL + '/?loggedIn=true');
    } catch (e) {
      res.redirect(FRONTEND_URL + '/?loggedIn=true');
    }
  }
);

app.get('/api/me', (req, res) => {
  if (!req.user) return res.status(401).json({error: '未登录'});
  res.json({ steamid: req.user.steamid, message: '登录成功！库存加载中…' });
});

app.get('/api/logout', (req, res) => {
  req.logout(() => {});
  res.redirect(FRONTEND_URL);
});

app.get('/', (req, res) => res.send('CS2 Skin Dashboard 后端运行正常'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log('后端启动成功'));
