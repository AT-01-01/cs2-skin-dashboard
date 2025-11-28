# 修改说明

本次修改将项目调整为可部署状态，支持 Render（后端）和 Vercel（前端）部署。

## 主要修改

### 1. 后端代码优化 (`backend/server.js`)

- ✅ 添加环境变量支持
  - `BACKEND_URL` - 后端服务地址
  - `FRONTEND_URL` - 前端部署地址
  - `SESSION_SECRET` - Session密钥
  - `NODE_ENV` - 环境标识

- ✅ 修复 CORS 配置
  - 使用环境变量动态设置允许的前端地址
  - 支持跨域凭证传递

- ✅ 优化 Session 配置
  - 生产环境使用 secure cookie
  - 根据环境自动调整 sameSite 设置

- ✅ 修复 Steam ID 提取逻辑
  - 正确从 OpenID 标识符中提取 Steam ID
  - 支持标准格式：`https://steamcommunity.com/openid/id/76561198012345678`

### 2. 前端代码优化 (`frontend/src/App.jsx`)

- ✅ 添加环境变量支持
  - `VITE_BACKEND_URL` - 后端API地址（Vite要求使用VITE_前缀）

- ✅ 修复 API Key 输入框显示逻辑
  - 首次登录且无API Key时自动显示输入框
  - 优化用户体验

### 3. 新增配置文件

- ✅ `frontend/vercel.json` - Vercel 部署配置
- ✅ `.gitignore` - Git忽略文件配置
- ✅ `DEPLOYMENT.md` - 详细部署说明
- ✅ `CHECKLIST.md` - 部署检查清单

### 4. 文档更新

- ✅ 更新 `README.md` - 添加快速开始和配置说明

## 部署前必做

1. **在 Render 配置环境变量：**
   ```
   BACKEND_URL=https://your-app.onrender.com
   FRONTEND_URL=https://your-app.vercel.app
   SESSION_SECRET=你的随机密钥
   NODE_ENV=production
   ```

2. **在 Vercel 配置环境变量：**
   ```
   VITE_BACKEND_URL=https://your-app.onrender.com
   ```

3. **在 Steam 开发者设置中配置：**
   - 回调 URL: `https://your-backend.onrender.com/auth/steam/return`
   - Realm: `https://your-backend.onrender.com/`

## 测试建议

部署后按以下顺序测试：
1. 访问前端，确认页面加载正常
2. 点击 Steam 登录，确认能跳转
3. 登录后确认能正确返回并显示 Steam ID
4. 输入 API Key 并加载库存
5. 确认库存和价格显示正常

