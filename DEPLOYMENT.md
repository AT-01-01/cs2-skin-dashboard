# 部署说明

本项目使用 Render（后端）+ Vercel（前端）进行部署。

## 环境变量配置

### 后端（Render）

在 Render 项目设置中添加以下环境变量：

```
BACKEND_URL=https://your-app.onrender.com
FRONTEND_URL=https://your-app.vercel.app
SESSION_SECRET=你的随机密钥（建议使用长随机字符串）
NODE_ENV=production
```

**注意：**
- `BACKEND_URL` 通常是 Render 自动生成的，格式为 `https://your-service-name.onrender.com`
- `FRONTEND_URL` 是你的 Vercel 部署地址
- `SESSION_SECRET` 建议使用强随机字符串，可以使用在线生成器生成

### 前端（Vercel）

在 Vercel 项目设置中添加以下环境变量：

```
VITE_BACKEND_URL=https://your-app.onrender.com
```

**注意：**
- Vite 要求环境变量必须以 `VITE_` 开头才能在前端代码中访问
- 修改环境变量后需要重新部署才能生效

## Render 部署配置

1. 连接到 GitHub 仓库
2. 设置根目录为 `backend`
3. 构建命令：留空（或 `npm install`）
4. 启动命令：`npm start`
5. 添加上述环境变量

## Vercel 部署配置

1. 连接到 GitHub 仓库
2. 设置根目录为 `frontend`
3. 框架预设：Vite
4. 构建命令：`npm run build`
5. 输出目录：`dist`
6. 添加上述环境变量

## 本地开发

### 后端

```bash
cd backend
npm install
# 创建 .env 文件并配置环境变量
npm run dev
```

### 前端

```bash
cd frontend
npm install
# 创建 .env 文件并配置环境变量
npm run dev
```

## 常见问题

### CORS 错误

确保：
1. 后端的 `FRONTEND_URL` 环境变量与实际的 Vercel 地址一致
2. 前端的 `VITE_BACKEND_URL` 环境变量与实际的 Render 地址一致

### Session 不工作

确保：
1. `SESSION_SECRET` 已设置
2. `NODE_ENV=production` 已设置
3. Render 的代理设置正确（`app.set('trust proxy', 1)` 已在代码中）

### Steam 登录回调失败

确保：
1. Steam 开发者设置中的回调 URL 设置为：`https://your-backend.onrender.com/auth/steam/return`
2. 域名设置中的 Realm 设置为：`https://your-backend.onrender.com/`

