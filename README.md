# 青筮记后端首稿

这是“青筮记”网页应用的后端第一稿，先搭起可运行的服务骨架，覆盖：

- 八字命理详解
- 六爻金钱课
- 梅花易数占卜
- 青筮建议
- AI 咨询上下文整合

## 技术选型

- Node.js
- TypeScript
- Fastify
- Zod

## 当前目标

第一稿优先解决三件事：

1. 明确后端模块边界
2. 提供统一 API 前缀和基础路由
3. 为后续命理算法、数据库、AI 接入预留结构

## 目录结构

```text
src
├─ app.ts
├─ server.ts
├─ config
│  └─ env.ts
├─ modules
│  ├─ ai
│  ├─ bazi
│  ├─ divination
│  ├─ health
│  └─ qingzhi-advice
└─ shared
   ├─ http
   └─ types
```

## 本地启动

```bash
npm install
npm run dev
```

默认健康检查：

```text
GET /health
GET /api/v1/meta
```

## 下一步开发建议

1. 接入 PostgreSQL 和 Prisma
2. 完成八字排盘算法层
3. 完成六爻/梅花起卦服务层
4. 接入 AI provider 路由
5. 增加登录、历史记录与会员能力
