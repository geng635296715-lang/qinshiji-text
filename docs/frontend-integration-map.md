# 青筮记首页前端接入映射

本文件由 `npm run sync:frontend` 对应的同步脚本维护，用于说明 `qing-shiji-frontend` 与当前 Fastify 后端静态站点的映射关系。

## 当前映射

- `qing-shiji-frontend/index.html` -> `public/index.html`：首页主入口，已接入站内路由与账号菜单容器
- `qing-shiji-frontend/styles.css` -> `public/home.css`：首页专属视觉样式，追加了账号菜单兼容层
- `qing-shiji-frontend/ai-chat-orb.js` -> `public/home-ai-chat-orb.js`：首页 AI 光球交互脚本
- `qing-shiji-frontend/assets/*` -> `public/assets/*`：首页 logo、星盘、视频等静态资源

## 当前首页功能对应

- 品牌 Logo：`/index.html`
- 顶部导航「占卜」：`/divination.html`
- 顶部导航「AI命理师」：`/qingzhi.html`
- 顶部导航「课程」：`/courses.html`
- 顶部导航「记录」：`/profile.html`
- 顶部导航「关于」：`/about.html`
- 主按钮「开始占卜」：`/bazi.html`
- 服务卡片「八字命理」：`/bazi.html`
- 服务卡片「金钱六爻课」：`/liuyao.html`
- 服务卡片「梅花易数」：`/meihua.html`
- 右上角账号入口：`/api/v1/auth/me` + `/auth.html` + `/profile.html`

## 接入说明

- 后端静态托管目录：`public/`
- 后端入口：`src/app.ts`
- 静态托管插件：`@fastify/static`
- 首页源目录：`qing-shiji-frontend/`
- 同步命令：`npm run sync:frontend`
