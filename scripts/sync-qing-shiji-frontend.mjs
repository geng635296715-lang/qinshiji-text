import { mkdir, readdir, readFile, stat, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "..");
const sourceRoot = path.join(workspaceRoot, "qing-shiji-frontend");
const publicRoot = path.join(workspaceRoot, "public");
const sourceAssetsRoot = path.join(sourceRoot, "assets");
const publicAssetsRoot = path.join(publicRoot, "assets");

async function main() {
  await mkdir(publicAssetsRoot, { recursive: true });
  await syncAssets(sourceAssetsRoot, publicAssetsRoot);

  const [sourceHtml, sourceCss, sourceOrbJs] = await Promise.all([
    readFile(path.join(sourceRoot, "index.html"), "utf8"),
    readFile(path.join(sourceRoot, "styles.css"), "utf8"),
    readFile(path.join(sourceRoot, "ai-chat-orb.js"), "utf8")
  ]);

  const mappedHtml = buildHomepageHtml(sourceHtml);
  const mappedCss = buildHomepageCss(sourceCss);

  await Promise.all([
    writeFile(path.join(publicRoot, "index.html"), mappedHtml, "utf8"),
    writeFile(path.join(publicRoot, "home.css"), mappedCss, "utf8"),
    writeFile(path.join(publicRoot, "home-ai-chat-orb.js"), sourceOrbJs, "utf8")
  ]);

  const mapping = [
    ["qing-shiji-frontend/index.html", "public/index.html", "首页主入口，已接入站内路由与账号菜单容器"],
    ["qing-shiji-frontend/styles.css", "public/home.css", "首页专属视觉样式，追加了账号菜单兼容层"],
    ["qing-shiji-frontend/ai-chat-orb.js", "public/home-ai-chat-orb.js", "首页 AI 光球交互脚本"],
    ["qing-shiji-frontend/assets/*", "public/assets/*", "首页 logo、星盘、视频等静态资源"]
  ];

  const mappingLines = mapping
    .map(([source, target, note]) => `- \`${source}\` -> \`${target}\`：${note}`)
    .join("\n");

  const mappingDoc = `# 青筮记首页前端接入映射

本文件由 \`npm run sync:frontend\` 对应的同步脚本维护，用于说明 \`qing-shiji-frontend\` 与当前 Fastify 后端静态站点的映射关系。

## 当前映射

${mappingLines}

## 当前首页功能对应

- 品牌 Logo：\`/index.html\`
- 顶部导航「占卜」：\`/divination.html\`
- 顶部导航「AI命理师」：\`/qingzhi.html\`
- 顶部导航「课程」：\`/courses.html\`
- 顶部导航「记录」：\`/profile.html\`
- 顶部导航「关于」：\`/about.html\`
- 主按钮「开始占卜」：\`/bazi.html\`
- 服务卡片「八字命理」：\`/bazi.html\`
- 服务卡片「金钱六爻课」：\`/liuyao.html\`
- 服务卡片「梅花易数」：\`/meihua.html\`
- 右上角账号入口：\`/api/v1/auth/me\` + \`/auth.html\` + \`/profile.html\`

## 接入说明

- 后端静态托管目录：\`public/\`
- 后端入口：\`src/app.ts\`
- 静态托管插件：\`@fastify/static\`
- 首页源目录：\`qing-shiji-frontend/\`
- 同步命令：\`npm run sync:frontend\`
`;

  await writeFile(path.join(workspaceRoot, "docs", "frontend-integration-map.md"), mappingDoc, "utf8");

  process.stdout.write("Synced qing-shiji-frontend into public/ and updated docs/frontend-integration-map.md\n");
}

function buildHomepageHtml(sourceHtml) {
  let html = sourceHtml;

  html = html.replace("./styles.css", "./home.css");
  html = html.replace("./ai-chat-orb.js", "./home-ai-chat-orb.js");
  html = html.replace(/<a class="brand-lockup layer" href="#"/, '<a class="brand-lockup layer" href="/index.html"');

  const navTargets = [
    "/index.html",
    "/divination.html",
    "/qingzhi.html",
    "/courses.html",
    "/profile.html",
    "/about.html"
  ];

  let navIndex = 0;
  html = html.replace(/<a class="nav-link(?: active)?" href="#">/g, (match) => {
    const target = navTargets[navIndex] ?? "#";
    navIndex += 1;
    return match.replace('href="#"', `href="${target}"`);
  });

  html = html.replace(
    /<button class="login-button layer" type="button">[\s\S]*?<\/button>/,
    '<div class="login-button layer home-login-entry rebuilt-home-account" data-account-entry></div>'
  );
  html = html.replace(
    /<button class="start-button" type="button">([\s\S]*?)<\/button>/,
    '<a class="start-button" href="/bazi.html">$1</a>'
  );

  const serviceTargets = ["/bazi.html", "/liuyao.html", "/meihua.html"];
  let serviceIndex = 0;
  html = html.replace(/<a class="card-arrow" href="#" /g, (match) => {
    const target = serviceTargets[serviceIndex] ?? "#";
    serviceIndex += 1;
    return match.replace('href="#"', `href="${target}"`);
  });

  html = html.replace(
    '</body>',
    '  <script type="module" src="/account-menu.js"></script>\n</body>'
  );

  return html;
}

function buildHomepageCss(sourceCss) {
  const bridgeCss = `

.home-login-entry {
  display: flex;
  align-items: center;
  justify-content: center;
}

.home-login-entry .outline-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 147px;
  height: 43px;
  border: 1px solid rgba(231, 183, 91, 0.78);
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.2);
  color: var(--gold-bright);
  font-size: 15px;
  letter-spacing: 0.03em;
}

.home-login-entry .account-menu {
  position: relative;
}

.home-login-entry .account-menu-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-width: 147px;
  height: 43px;
  padding: 0 14px 0 8px;
  border: 1px solid rgba(231, 183, 91, 0.78);
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.2);
  color: var(--gold-bright);
  box-shadow: none;
}

.home-login-entry .account-avatar {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(231, 183, 91, 0.96), rgba(128, 91, 36, 0.96));
  color: #130d05;
  font-size: 12px;
  line-height: 1;
}

.home-login-entry .account-name {
  max-width: 78px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--gold-bright);
}

.home-login-entry .account-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  min-width: 220px;
  padding: 10px;
  border: 1px solid rgba(194, 135, 42, 0.32);
  border-radius: 20px;
  background: rgba(8, 8, 8, 0.94);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.34);
  display: grid;
  gap: 6px;
  z-index: 8;
}

.home-login-entry .account-dropdown[hidden] {
  display: none !important;
}

.home-login-entry .account-dropdown-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 42px;
  padding: 10px 14px;
  border: 1px solid transparent;
  border-radius: 14px;
  background: rgba(19, 17, 13, 0.92);
  color: #e6d7bd;
}

.home-login-entry .account-dropdown-link:hover {
  border-color: rgba(231, 183, 91, 0.3);
}

.home-login-entry .account-dropdown-link span {
  color: rgba(231, 183, 91, 0.72);
  font-size: 12px;
}

.home-login-entry .account-dropdown-action {
  cursor: pointer;
}
`;

  return `${sourceCss.trimEnd()}\n${bridgeCss}`;
}

async function syncAssets(sourceDir, targetDir) {
  const entries = await readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      await mkdir(targetPath, { recursive: true });
      await syncAssets(sourcePath, targetPath);
      continue;
    }

    if (entry.isFile()) {
      const [sourceInfo, targetInfo] = await Promise.all([
        stat(sourcePath),
        stat(targetPath).catch(() => null)
      ]);

      if (!targetInfo || sourceInfo.size !== targetInfo.size || sourceInfo.mtimeMs !== targetInfo.mtimeMs) {
        await copyFile(sourcePath, targetPath);
      }
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
