# 青筮记前端对照表

这份对照表把 `D:\AI体\”青筮记“2.0\qing-shiji-frontend` 的静态前端，接到了当前框架的 `public/` 目录里。

## 文件对应

| 外部前端 | 当前框架 |
| --- | --- |
| `index.html` | `public/index.html` |
| `styles.css` | `public/home.css` |
| `ai-chat-orb.js` | `public/home-ai-chat-orb.js` |
| `assets/applogo.png` | `public/assets/applogo.png` |
| `assets/logo-horizontal.png` | `public/assets/logo-horizontal.png` |
| `assets/logo-vertical.png` | `public/assets/logo-vertical.png` |
| `assets/astrolabe.png` | `public/assets/astrolabe.png` |
| `assets/astrolabe-transparent.png` | `public/assets/astrolabe-transparent.png` |
| `assets/ai-orb-gold.png` | `public/assets/ai-orb-gold.png` |
| `assets/qing-shiji-loop.mp4` | `public/assets/qing-shiji-loop.mp4` |

## 页面对应

| 页面入口 | 当前页面 | 说明 |
| --- | --- | --- |
| 首页 | `public/index.html` | 黑金首页，保留主品牌、AI 命理师和服务入口 |
| 占卜总入口 | `public/divination.html` | 只做分流，不再承载具体起卦功能 |
| 六爻页 | `public/liuyao.html` | 六爻金钱课的真实功能页 |
| 梅花页 | `public/meihua.html` | 梅花易数的真实功能页 |
| 八字页 | `public/bazi.html` | 八字命理功能页 |
| 青知页 | `public/qingzhi.html` | 青知/咨询类页面 |

## 模块对应

| 模块 | 当前承载页 | 说明 |
| --- | --- | --- |
| `brand-lockup` | 首页左上角品牌区 | 直接使用外部 logo 组合 |
| `site-header` | 首页顶部导航 | 链接到当前项目的真实页面 |
| `login-button` | 首页右上角入口 | 指向 `/auth.html` |
| `hero-copy` | 首页主视觉文案 | 保留外部文案结构 |
| `center-sigil` | 首页中部主视觉 | 使用 `astrolabe` 和竖排 logo |
| `ai-card` | 首页右侧 AI 卡片 | 接入 `home-ai-chat-orb.js` |
| `service-cards` | 首页底部三卡片 | 分别指向 `bazi`、`liuyao`、`meihua` 页面 |
| `divination-portal` | `public/divination.html` | 六爻与梅花的分流入口 |
| `liuyao-page` | `public/liuyao.html` | 6 爻手动/自动起卦与 AI 追问 |
| `meihua-page` | `public/meihua.html` | 数字、时间、外应三类起卦入口 |

## 当前接入方式

- 首页直接由 `public/index.html` 渲染。
- 首页样式由 `public/home.css` 提供。
- AI 悬浮与交互特效由 `public/home-ai-chat-orb.js` 提供。
- 黑金主题扩展样式由 `public/dark-theme.css` 提供。
- 占卜模块已经拆成 `public/divination.html`、`public/liuyao.html`、`public/meihua.html` 三个层级。
- 后端对应接口已经按六爻和梅花分别提供 `cast`、`cast-view`、`ai-context` 三组能力。
