import { authFetch, clearSessionToken, fetchCurrentUser } from "/session.js";

const BRAND_SLOGAN = "青衣筮卜，易断天机";

const NAV_ITEMS = [
  { key: "home", label: "首页", href: "/home.html" },
  { key: "divination", label: "占卜", href: "/divination.html" },
  { key: "bazi", label: "八字", href: "/bazi.html" },
  { key: "huangdao", label: "青筮黄道", href: "/huangdao.html" },
  { key: "courses", label: "课程", href: "/courses.html" },
  { key: "records", label: "记录", href: "/profile.html" },
  { key: "about", label: "关于", href: "/about.html" }
];

function normalizePathname(pathname = window.location.pathname) {
  if (!pathname || pathname === "/") return "/index.html";
  return pathname.endsWith("/") ? `${pathname}index.html` : pathname;
}

function getCurrentNavKey(pathname = normalizePathname()) {
  const path = normalizePathname(pathname);

  if (path === "/home.html") return "home";
  if (["/divination.html", "/liuyao.html", "/meihua.html"].includes(path)) return "divination";
  if (["/bazi.html", "/bazi-chart.html", "/compatibility.html"].includes(path)) return "bazi";
  if (["/huangdao.html", "/qingzhi.html"].includes(path)) return "huangdao";
  if (["/courses.html", "/baoce.html"].includes(path)) return "courses";
  if (["/profile.html", "/membership.html"].includes(path)) return "records";
  if (["/about.html"].includes(path)) return "about";
  return "";
}

function buildBrandCopyHtml() {
  return `
    <span class="brand-copy">
      <img class="brand-word-logo" src="/assets/logo-horizontal.png" alt="青筮记" />
      <span class="brand-slogan">${BRAND_SLOGAN}</span>
    </span>
  `;
}

function buildNavLinksHtml(activeKey = "") {
  return NAV_ITEMS.map(
    (item) => `<a class="nav-link${item.key === activeKey ? " active" : ""}" href="${item.href}">${item.label}</a>`
  ).join("");
}

function buildGlobalNavHtml(activeKey = "") {
  return `
    <a class="brand-lockup" href="/home.html" aria-label="青筮记首页">
      <img class="brand-app-logo" src="/assets/applogo.png" alt="" />
      ${buildBrandCopyHtml()}
    </a>
    <header class="site-header" aria-label="页面导航">
      ${buildNavLinksHtml(activeKey)}
    </header>
    <div class="login-button home-login-entry rebuilt-home-account" data-account-entry></div>
  `;
}

function ensureBrandSlogan(root = document) {
  root
    .querySelectorAll(".brand-lockup, .bazi-topbar-brand")
    .forEach((brand) => {
      if (!(brand instanceof HTMLElement)) return;
      if (brand.querySelector(".brand-copy")) return;

      const wordLogo = brand.querySelector(".brand-word-logo, .bazi-topbar-word-logo");
      if (!(wordLogo instanceof HTMLElement)) return;

      wordLogo.classList.remove("bazi-topbar-word-logo");
      wordLogo.classList.add("brand-word-logo");

      const wrap = document.createElement("span");
      wrap.className = "brand-copy";
      wordLogo.parentNode?.insertBefore(wrap, wordLogo);
      wrap.appendChild(wordLogo);

      const slogan = document.createElement("span");
      slogan.className = "brand-slogan";
      slogan.textContent = BRAND_SLOGAN;
      wrap.appendChild(slogan);
    });
}

function normalizeExistingNav() {
  const activeKey = getCurrentNavKey();

  const baziTopbar = document.querySelector(".bazi-topbar");
  if (baziTopbar instanceof HTMLElement) {
    baziTopbar.classList.add("bazi-home-nav");

    const brand = baziTopbar.querySelector(".bazi-topbar-brand");
    if (brand instanceof HTMLElement) {
      brand.classList.remove("bazi-topbar-brand");
      brand.classList.add("brand-lockup");
      const appLogo = brand.querySelector(".bazi-topbar-app-logo");
      if (appLogo instanceof HTMLElement) {
        appLogo.classList.remove("bazi-topbar-app-logo");
        appLogo.classList.add("brand-app-logo");
      }
    }

    const nav = baziTopbar.querySelector(".bazi-topbar-nav");
    if (nav instanceof HTMLElement) {
      nav.classList.remove("bazi-topbar-nav");
      nav.classList.add("site-header");
    }

    const account = baziTopbar.querySelector(".bazi-topbar-account");
    if (account instanceof HTMLElement) {
      account.classList.remove("bazi-topbar-account");
      account.classList.add("login-button", "home-login-entry", "rebuilt-home-account");
    }
  }

  document.querySelectorAll(".site-header, .qs-global-nav .site-header").forEach((nav) => {
    nav.querySelectorAll("a").forEach((link) => {
      if (!(link instanceof HTMLAnchorElement)) return;
      const navItem = NAV_ITEMS.find((item) => link.getAttribute("href") === item.href);
      if (navItem) {
        link.textContent = navItem.label;
        link.classList.add("nav-link");
        link.classList.toggle("active", navItem.key === activeKey);
      }
    });
  });

  document.querySelectorAll(".login-button, .bazi-topbar-account").forEach((entry) => {
    if (!(entry instanceof HTMLElement)) return;
    entry.classList.add("home-login-entry", "rebuilt-home-account");
  });

  ensureBrandSlogan();
}

function injectGlobalNavIfMissing() {
  if (document.querySelector(".site-header, .qs-global-nav, .bazi-home-nav, .bazi-topbar")) {
    return;
  }

  const shell = document.querySelector(".app-shell, .portal-shell");
  if (!(shell instanceof HTMLElement) || !shell.parentElement) return;

  const nav = document.createElement("div");
  nav.className = "qs-global-nav";
  nav.innerHTML = buildGlobalNavHtml(getCurrentNavKey());
  shell.parentElement.insertBefore(nav, shell);
  shell.classList.add("with-global-nav");
}

function buildInitials(user) {
  const source = (user?.displayName || user?.username || "访客").trim();
  return source.slice(0, 2).toUpperCase();
}

function buildNickname(user) {
  return user?.displayName || user?.username || "访客";
}

function buildAccountMenuHtml(user, container) {
  const nickname = escapeHtml(buildNickname(user));
  const initials = escapeHtml(buildInitials(user));
  const isHomeMode =
    container.classList.contains("home-reference-account") ||
    container.classList.contains("rebuilt-home-account");
  const menuClass = isHomeMode ? "account-menu account-menu-home" : "account-menu";

  return `
    <div class="${menuClass}">
      <button class="account-menu-trigger" type="button" aria-expanded="false">
        <span class="account-avatar" aria-hidden="true">${initials}</span>
        <span class="account-name">${nickname}</span>
      </button>
      <div class="account-dropdown" hidden>
        <a class="account-dropdown-link" href="/profile.html#account">我的账号</a>
        <a class="account-dropdown-link" href="/bazi-chart.html">我的档案</a>
        <a class="account-dropdown-link is-disabled" href="/baoce.html">青筮宝册<span>未开放</span></a>
        <button class="account-dropdown-link account-dropdown-action" type="button" data-action="logout">退出账号</button>
      </div>
    </div>
  `;
}

function buildGuestHtml(container) {
  if (container.dataset.accountGuest === "ghost-link") {
    return `<a class="account-ghost-link" href="/auth.html" aria-label="登录或注册"><span class="sr-only">登录 / 注册</span></a>`;
  }

  return `<a class="outline-pill" href="/auth.html">登录 / 注册</a>`;
}

function bindMenu(container) {
  const trigger = container.querySelector(".account-menu-trigger");
  const dropdown = container.querySelector(".account-dropdown");
  const logoutButton = container.querySelector('[data-action="logout"]');

  if (!trigger || !dropdown) return;

  const closeMenu = () => {
    trigger.setAttribute("aria-expanded", "false");
    dropdown.hidden = true;
  };

  const openMenu = () => {
    trigger.setAttribute("aria-expanded", "true");
    dropdown.hidden = false;
  };

  closeMenu();

  trigger.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = trigger.getAttribute("aria-expanded") === "true";
    if (isOpen) {
      closeMenu();
      return;
    }
    openMenu();
  });

  dropdown.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  document.addEventListener("click", (event) => {
    if (!container.contains(event.target)) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });

  logoutButton?.addEventListener("click", async () => {
    try {
      await authFetch("/api/v1/auth/logout", { method: "POST" });
    } finally {
      clearSessionToken();
      window.location.href = "/auth.html";
    }
  });
}

export async function initAccountMenus() {
  injectGlobalNavIfMissing();
  normalizeExistingNav();

  const containers = Array.from(document.querySelectorAll("[data-account-entry]"));
  if (!containers.length) return;

  let user = null;

  try {
    user = await fetchCurrentUser();
  } catch {
    user = null;
  }

  for (const container of containers) {
    container.innerHTML = user ? buildAccountMenuHtml(user, container) : buildGuestHtml(container);
    if (user) bindMenu(container);
  }
}

initAccountMenus();

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
