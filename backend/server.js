const express = require('express');
const passport = require('passport');
const SteamStrategy = require('passport-steam').Strategy;
const session = require('express-session');
const cors = require('cors');

const app = express();

// 全部写死，永不依赖环境变量
const BACKEND_URL  = 'https://cs2-skin-dashboard.onrender.com';
const FRONTEND_URL = 'https://cs2-skin-dashboard.vercel.app';   // ←←←←← 如果你用的是新部署的地址，改成那个！！！

app.use(cors({
  origin: "https://cs2-skin-dashboard.vercel.app",
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: 'cs2dashboard2025',
  resave: false,
  saveUninitialized: false,
  proxy: true,
  cookie: { secure: true, sameSite: 'none', httpOnly: true }
}));
app.set('trust proxy', 1);   // ←←← 加上这行！超级关键！
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// 强制使用公共测试 Key + 写死地址
passport.use(new SteamStrategy({
  returnURL: BACKEND_URL + '/auth/steam/return',
  realm: BACKEND_URL + '/',
  apiKey: 'E52516A5831FC64508B65C6453D61CF1'   // 公共 Key，绝对能用
}, (identifier, profile, done) => {
  process.nextTick(() => {
    const steamid = identifier.match(/\/id\/([^\/]+)/)?.[1] || identifier.split('/').pop();
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
