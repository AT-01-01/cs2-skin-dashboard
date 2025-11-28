# CS2 Skin Dashboard

半自动 CS2 皮肤仪表盘：Steam 登录 → 实时库存总值/价差 → 低价警报 → 一键复制售价/跳转买入

功能全开，零封号风险，纯 API 查询

→ 立刻部署：Vercel（前端）+ Render（后端）

## 快速开始

### 部署说明

详细部署步骤请查看 [DEPLOYMENT.md](./DEPLOYMENT.md)

### 环境变量配置

**后端（Render）需要配置：**
- `BACKEND_URL` - 后端服务地址（如：https://your-app.onrender.com）
- `FRONTEND_URL` - 前端部署地址（如：https://your-app.vercel.app）
- `SESSION_SECRET` - Session密钥（建议使用随机字符串）
- `NODE_ENV` - 设置为 `production`

**前端（Vercel）需要配置：**
- `VITE_BACKEND_URL` - 后端API地址（如：https://your-app.onrender.com）

### Steam 开发者设置

在 [Steam 开发者设置](https://steamcommunity.com/dev/apikey) 中：
- 回调 URL 设置为：`https://your-backend.onrender.com/auth/steam/return`
- Realm 设置为：`https://your-backend.onrender.com/`
