const canvas = document.querySelector("[data-start-galaxy]");

if (canvas instanceof HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");

  if (ctx) {
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const pointer = { x: 0.5, y: 0.5, active: 0 };
    let width = 0;
    let height = 0;
    let centerX = 0;
    let centerY = 0;
    let radiusBase = 0;

    const palette = [
      "rgba(247,246,243,0.95)",
      "rgba(231,183,91,0.9)",
      "rgba(255,150,72,0.82)"
    ];

    const stars = [];
    const STAR_COUNT = 260;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(width * DPR);
      canvas.height = Math.floor(height * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      centerX = width * 0.5;
      centerY = height * 0.5;
      radiusBase = Math.max(width, height) * 0.48;
    }

    function createStar(index) {
      const layer = 1 + (index % 4);
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.pow(Math.random(), 0.88) * radiusBase * (0.96 + layer * 0.22);
      const orbitSpeed = (0.00016 + Math.random() * 0.00026) * (1 / layer);
      const radius = 0.5 + Math.random() * (layer < 3 ? 1.2 : 2.2);
      const alpha = 0.35 + Math.random() * 0.55;
      const twinkleOffset = Math.random() * Math.PI * 2;
      const drift = 12 + Math.random() * 28;
      return {
        angle,
        distance,
        orbitSpeed,
        radius,
        alpha,
        twinkleOffset,
        drift,
        layer,
        color: palette[index % palette.length]
      };
    }

    function seedStars() {
      stars.length = 0;
      for (let i = 0; i < STAR_COUNT; i += 1) {
        stars.push(createStar(i));
      }
    }

    function drawGlow(x, y, radius, color, alpha) {
      const glow = ctx.createRadialGradient(x, y, 0, x, y, radius * 7);
      glow.addColorStop(0, color.replace(/[\d.]+\)$/u, `${alpha})`));
      glow.addColorStop(0.2, color.replace(/[\d.]+\)$/u, `${alpha * 0.55})`));
      glow.addColorStop(1, color.replace(/[\d.]+\)$/u, "0)"));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, radius * 7, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawStar(x, y, radius, color, alpha) {
      drawGlow(x, y, radius, color, alpha * 0.6);
      ctx.fillStyle = color.replace(/[\d.]+\)$/u, `${alpha})`);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    function animate(time) {
      ctx.clearRect(0, 0, width, height);

      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        radiusBase * 0.08,
        centerX,
        centerY,
        radiusBase * 1.55
      );
      gradient.addColorStop(0, "rgba(231,183,91,0.036)");
      gradient.addColorStop(0.22, "rgba(255,150,72,0.024)");
      gradient.addColorStop(0.5, "rgba(255,255,255,0.009)");
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      const px = pointer.x * width;
      const py = pointer.y * height;

      for (const star of stars) {
        const orbitAngle = star.angle + time * star.orbitSpeed;
        const wobble = Math.sin(time * 0.00055 + star.twinkleOffset) * star.drift;
        const orbitRadius = star.distance + wobble;
        let x = centerX + Math.cos(orbitAngle) * orbitRadius;
        let y = centerY + Math.sin(orbitAngle) * orbitRadius * 0.78;

        if (pointer.active > 0.001) {
          const dx = x - px;
          const dy = y - py;
          const dist = Math.hypot(dx, dy) || 1;
          const influence = Math.max(0, 1 - dist / 180) * 20 * pointer.active;
          x += (dx / dist) * influence;
          y += (dy / dist) * influence;
        }

        const twinkle = 0.72 + ((Math.sin(time * 0.0022 + star.twinkleOffset) + 1) * 0.5) * 0.58;
        drawStar(x, y, star.radius, star.color, star.alpha * twinkle);
      }

      pointer.active += (0 - pointer.active) * 0.04;
      requestAnimationFrame(animate);
    }

    function handlePointerMove(event) {
      const rect = canvas.getBoundingClientRect();
      pointer.x = (event.clientX - rect.left) / rect.width;
      pointer.y = (event.clientY - rect.top) / rect.height;
      pointer.active = 1;
    }

    function handlePointerLeave() {
      pointer.active = 0;
    }

    resize();
    seedStars();
    window.addEventListener("resize", () => {
      resize();
      seedStars();
    });
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerleave", handlePointerLeave);
    requestAnimationFrame(animate);
  }
}
