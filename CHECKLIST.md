# 部署检查清单

在部署前，请确保完成以下配置：

## ✅ 后端（Render）配置

- [ ] 连接到 GitHub 仓库
- [ ] 设置根目录为 `backend`
- [ ] 构建命令：留空或 `npm install`
- [ ] 启动命令：`npm start`
- [ ] 添加环境变量：
  - [ ] `BACKEND_URL` = `https://your-app.onrender.com`（Render会自动生成）
  - [ ] `FRONTEND_URL` = `https://your-app.vercel.app`（你的Vercel地址）
  - [ ] `SESSION_SECRET` = 随机字符串（建议32位以上）
  - [ ] `NODE_ENV` = `production`

## ✅ 前端（Vercel）配置

- [ ] 连接到 GitHub 仓库
- [ ] 设置根目录为 `frontend`
- [ ] 框架预设：Vite
- [ ] 构建命令：`npm run build`
- [ ] 输出目录：`dist`
- [ ] 添加环境变量：
  - [ ] `VITE_BACKEND_URL` = `https://your-app.onrender.com`（你的Render地址）

## ✅ Steam 开发者设置

- [ ] 访问 [Steam Web API Key](https://steamcommunity.com/dev/apikey)
- [ ] 设置域名：
  - [ ] 回调 URL：`https://your-backend.onrender.com/auth/steam/return`
  - [ ] Realm：`https://your-backend.onrender.com/`

## ✅ 测试清单

部署完成后，测试以下功能：

- [ ] 访问前端地址，页面正常加载
- [ ] 点击 "Steam 登录" 按钮，能跳转到 Steam 登录页面
- [ ] 登录后能正确跳转回前端
- [ ] 前端能正确显示 Steam ID
- [ ] 输入 Steam Web API Key 后能加载库存
- [ ] 库存物品能正确显示 Buff 价格

## 🔧 常见问题排查

### CORS 错误
- 检查后端的 `FRONTEND_URL` 是否与实际的 Vercel 地址完全一致（包括协议 https）
- 检查前端的 `VITE_BACKEND_URL` 是否与实际的 Render 地址完全一致

### Session 不工作
- 确保 `SESSION_SECRET` 已设置且不为空
- 确保 `NODE_ENV=production` 已设置
- 检查 Render 的代理设置

### Steam 登录失败
- 检查 Steam 开发者设置中的回调 URL 和 Realm 是否正确
- 确保 URL 使用 https 协议
- 检查后端日志查看具体错误信息

### 库存加载失败
- 确保 Steam Web API Key 有效
- 确保 Steam 库存设置为公开
- 检查浏览器控制台是否有错误信息

