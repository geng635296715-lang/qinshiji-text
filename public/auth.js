import { fetchCurrentUser, setSessionToken } from "/session.js";

const loginForm = document.querySelector("#login-form");
const registerForm = document.querySelector("#register-form");
const loginMessage = document.querySelector("#login-message");
const registerMessage = document.querySelector("#register-message");

loginForm.addEventListener("submit", onLogin);
registerForm.addEventListener("submit", onRegister);

bootstrap();

async function bootstrap() {
  const user = await fetchCurrentUser();
  if (user) {
    window.location.href = "/profile.html";
  }
}

async function onLogin(event) {
  event.preventDefault();

  const payload = {
    account: document.querySelector("#login-account").value.trim(),
    password: document.querySelector("#login-password").value
  };

  try {
    const response = await fetch("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();

    if (!response.ok) {
      loginMessage.textContent = data.message || "登录失败。";
      return;
    }

    setSessionToken(data.session.token);
    loginMessage.textContent = "登录成功，正在进入个人中心。";
    window.location.href = "/profile.html";
  } catch (error) {
    loginMessage.textContent = error instanceof Error ? error.message : "登录失败。";
  }
}

async function onRegister(event) {
  event.preventDefault();

  const payload = {
    email: document.querySelector("#register-email").value.trim(),
    username: document.querySelector("#register-username").value.trim(),
    displayName: document.querySelector("#register-display-name").value.trim() || undefined,
    password: document.querySelector("#register-password").value
  };

  try {
    const response = await fetch("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();

    if (!response.ok) {
      registerMessage.textContent = data.message || "注册失败。";
      return;
    }

    setSessionToken(data.session.token);
    registerMessage.textContent = "注册成功，正在进入个人中心。";
    window.location.href = "/profile.html";
  } catch (error) {
    registerMessage.textContent = error instanceof Error ? error.message : "注册失败。";
  }
}
