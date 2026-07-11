import { Mesh, Program, Renderer, Triangle, Vec3 } from "https://cdn.jsdelivr.net/npm/ogl@1.0.11/+esm";

const card = document.querySelector(".ai-card");
const orbHost = document.querySelector(".ai-card-orb");
const input = document.querySelector(".ask-box input");

if (card && orbHost) {
  initOrb(orbHost, {
    hoverIntensity: 0.42,
    rotateOnHover: true,
    backgroundColor: "#000000",
  });

  let pinnedActive = false;

  const setActive = (active) => {
    card.classList.toggle("is-active", active || pinnedActive);
  };

  card.addEventListener("pointerenter", () => setActive(true));
  card.addEventListener("pointerleave", () => {
    if (document.activeElement !== input) {
      setActive(false);
    }
  });

  card.addEventListener("click", () => {
    pinnedActive = true;
    setActive(true);
  });

  input?.addEventListener("focus", () => {
    pinnedActive = true;
    setActive(true);
  });

  input?.addEventListener("blur", () => {
    pinnedActive = false;
    if (!card.matches(":hover")) {
      setActive(false);
    }
  });
}

function initOrb(container, config) {
  const renderer = new Renderer({ alpha: true, premultipliedAlpha: false, antialias: true });
  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 0);
  gl.canvas.style.position = "absolute";
  gl.canvas.style.inset = "0";
  gl.canvas.style.display = "block";
  gl.canvas.style.width = "100%";
  gl.canvas.style.height = "100%";
  container.appendChild(gl.canvas);

  const geometry = new Triangle(gl);
  const program = new Program(gl, {
    vertex,
    fragment,
    uniforms: {
      iTime: { value: 0 },
      iResolution: { value: new Vec3(1, 1, 1) },
      hover: { value: 0 },
      rot: { value: 0 },
      hoverIntensity: { value: config.hoverIntensity },
      backgroundColor: { value: hexToVec3(config.backgroundColor) },
    },
  });

  const mesh = new Mesh(gl, { geometry, program });

  const resize = () => {
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    renderer.setSize(width * dpr, height * dpr);
    program.uniforms.iResolution.value.set(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height);
  };

  window.addEventListener("resize", resize);
  const resizeObserver = new ResizeObserver(() => resize());
  resizeObserver.observe(container);
  resize();

  let rafId = 0;
  let lastTime = 0;
  let targetHover = 0;
  let currentRot = 0;

  const tick = (time) => {
    rafId = requestAnimationFrame(tick);

    const dt = (time - lastTime) * 0.001;
    lastTime = time;

    targetHover = card?.classList.contains("is-active") ? 1 : 0.35;
    program.uniforms.iTime.value = time * 0.001;
    program.uniforms.hover.value += (targetHover - program.uniforms.hover.value) * 0.08;

    currentRot += dt * (targetHover > 0.5 ? 0.22 : 0.08);
    program.uniforms.rot.value = currentRot;

    renderer.render({ scene: mesh });
  };

  rafId = requestAnimationFrame(tick);

  window.addEventListener("beforeunload", () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener("resize", resize);
    resizeObserver.disconnect();
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  });
}

const vertex = /* glsl */ `
  precision highp float;
  attribute vec2 position;
  attribute vec2 uv;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragment = /* glsl */ `
  precision highp float;

  uniform float iTime;
  uniform vec3 iResolution;
  uniform float hover;
  uniform float rot;
  uniform float hoverIntensity;
  uniform vec3 backgroundColor;
  varying vec2 vUv;

  vec3 hash33(vec3 p3) {
    p3 = fract(p3 * vec3(0.1031, 0.11369, 0.13787));
    p3 += dot(p3, p3.yxz + 19.19);
    return -1.0 + 2.0 * fract(vec3(
      p3.x + p3.y,
      p3.x + p3.z,
      p3.y + p3.z
    ) * p3.zyx);
  }

  float snoise3(vec3 p) {
    const float K1 = 0.333333333;
    const float K2 = 0.166666667;
    vec3 i = floor(p + (p.x + p.y + p.z) * K1);
    vec3 d0 = p - (i - (i.x + i.y + i.z) * K2);
    vec3 e = step(vec3(0.0), d0 - d0.yzx);
    vec3 i1 = e * (1.0 - e.zxy);
    vec3 i2 = 1.0 - e.zxy * (1.0 - e);
    vec3 d1 = d0 - (i1 - K2);
    vec3 d2 = d0 - (i2 - K1);
    vec3 d3 = d0 - 0.5;
    vec4 h = max(0.6 - vec4(dot(d0, d0), dot(d1, d1), dot(d2, d2), dot(d3, d3)), 0.0);
    vec4 n = h * h * h * h * vec4(
      dot(d0, hash33(i)),
      dot(d1, hash33(i + i1)),
      dot(d2, hash33(i + i2)),
      dot(d3, hash33(i + 1.0))
    );
    return dot(vec4(31.316), n);
  }

  vec4 extractAlpha(vec3 colorIn) {
    float a = max(max(colorIn.r, colorIn.g), colorIn.b);
    return vec4(colorIn.rgb / (a + 1e-5), a);
  }

  const vec3 baseColor1 = vec3(0.98, 0.96, 0.92);
  const vec3 baseColor2 = vec3(0.93, 0.73, 0.38);
  const vec3 baseColor3 = vec3(0.28, 0.18, 0.05);
  const float innerRadius = 0.56;
  const float noiseScale = 0.72;

  float light1(float intensity, float attenuation, float dist) {
    return intensity / (1.0 + dist * attenuation);
  }

  float light2(float intensity, float attenuation, float dist) {
    return intensity / (1.0 + dist * dist * attenuation);
  }

  vec4 draw(vec2 uv) {
    float ang = atan(uv.y, uv.x);
    float len = length(uv);
    float invLen = len > 0.0 ? 1.0 / len : 0.0;
    float bgLuminance = dot(backgroundColor, vec3(0.299, 0.587, 0.114));

    float n0 = snoise3(vec3(uv * noiseScale, iTime * 0.45)) * 0.5 + 0.5;
    float r0 = mix(mix(innerRadius, 1.0, 0.42), mix(innerRadius, 1.0, 0.64), n0);
    float d0 = distance(uv, (r0 * invLen) * uv);
    float v0 = light1(1.0, 10.0, d0);

    v0 *= smoothstep(r0 * 1.05, r0, len);
    float innerFade = smoothstep(r0 * 0.8, r0 * 0.95, len);
    v0 *= mix(innerFade, 1.0, bgLuminance * 0.7);
    float cl = cos(ang + iTime * 2.0) * 0.5 + 0.5;

    float a = iTime * -0.85;
    vec2 pos = vec2(cos(a), sin(a)) * r0;
    float d = distance(uv, pos);
    float v1 = light2(1.4, 5.0, d);
    v1 *= light1(1.0, 50.0, d0);

    float v2 = smoothstep(1.0, mix(innerRadius, 1.0, n0 * 0.5), len);
    float v3 = smoothstep(innerRadius, mix(innerRadius, 1.0, 0.5), len);

    vec3 colBase = mix(baseColor1, baseColor2, cl);
    float fadeAmount = mix(1.0, 0.12, bgLuminance);

    vec3 darkCol = mix(baseColor3, colBase, v0);
    darkCol = (darkCol + v1) * v2 * v3;
    darkCol = clamp(darkCol, 0.0, 1.0);

    vec3 lightCol = (colBase + v1) * mix(1.0, v2 * v3, fadeAmount);
    lightCol = mix(backgroundColor, lightCol, v0);
    lightCol = clamp(lightCol, 0.0, 1.0);

    vec3 finalCol = mix(darkCol, lightCol, bgLuminance);
    return extractAlpha(finalCol);
  }

  vec4 mainImage(vec2 fragCoord) {
    vec2 center = iResolution.xy * vec2(0.5, 0.34);
    float size = min(iResolution.x, iResolution.y) * 0.95;
    vec2 uv = (fragCoord - center) / size * 2.0;

    float angle = rot;
    float s = sin(angle);
    float c = cos(angle);
    uv = vec2(c * uv.x - s * uv.y, s * uv.x + c * uv.y);

    uv.x += hover * hoverIntensity * 0.1 * sin(uv.y * 10.0 + iTime);
    uv.y += hover * hoverIntensity * 0.1 * sin(uv.x * 10.0 + iTime);

    return draw(uv);
  }

  void main() {
    vec2 fragCoord = vUv * iResolution.xy;
    vec4 col = mainImage(fragCoord);
    gl_FragColor = vec4(col.rgb * col.a, col.a);
  }
`;

function hexToVec3(color) {
  const r = parseInt(color.slice(1, 3), 16) / 255;
  const g = parseInt(color.slice(3, 5), 16) / 255;
  const b = parseInt(color.slice(5, 7), 16) / 255;
  return new Vec3(r, g, b);
}
