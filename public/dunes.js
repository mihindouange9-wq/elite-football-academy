/* ============================================================
   Dunes de pelouse au premier plan de la galerie : trois reliefs superposés,
   dessinés en 2D, qui glissent avec le défilement horizontal des écrans.
   ============================================================ */
window.DUNES = (() => {
  const canvas = document.getElementById("dunes");
  if (!canvas) return null;
  const ctx = canvas.getContext("2d", { alpha: true });
  const etat = { pan: 0, alpha: 0, actif: false, t: 0 };
  let W = 0, H = 0, dpr = 1;
  const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const noise = (x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return hash(i) * (1 - u) + hash(i + 1) * u; };
  const COUCHES = [
    { base: .78, amp: .07, freq: .9, vitesse: .55, teinte: [26, 58, 36], crete: [96, 150, 86], ombre: [8, 18, 12] },
    { base: .86, amp: .06, freq: 1.3, vitesse: .8, teinte: [20, 46, 29], crete: [82, 128, 72], ombre: [6, 13, 9] },
    { base: .93, amp: .05, freq: 1.8, vitesse: 1.1, teinte: [14, 32, 21], crete: [64, 100, 56], ombre: [4, 9, 6] },
  ];
  function taille() { dpr = Math.min(window.devicePixelRatio || 1, 1.5); W = Math.round(window.innerWidth * dpr); H = Math.round(window.innerHeight * dpr); if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; } }
  taille(); window.addEventListener("resize", taille);
  function hauteur(c, x, k) { const u = x / W * 3.2 * c.freq + k * 10 - etat.pan * c.vitesse * 2.2; return H * (c.base + c.amp * (Math.sin(u * 1.1) * .55 + (noise(u * 1.7) - .5) * 1.4 + (noise(u * 4.3 + 3) - .5) * .35)); }
  function dessiner() {
    ctx.clearRect(0, 0, W, H);
    if (etat.alpha <= 0.001) return;
    ctx.globalAlpha = etat.alpha;
    const pas = Math.max(2, Math.round(3 * dpr));
    COUCHES.forEach((c, k) => {
      ctx.beginPath(); ctx.moveTo(0, H);
      const pts = [];
      for (let x = 0; x <= W + pas; x += pas) { const y = hauteur(c, x, k); pts.push([x, y]); ctx.lineTo(x, y); }
      ctx.lineTo(W, H); ctx.closePath();
      const g = ctx.createLinearGradient(0, H * (c.base - c.amp), 0, H);
      g.addColorStop(0, `rgb(${c.crete.join(",")})`); g.addColorStop(.35, `rgb(${c.teinte.join(",")})`); g.addColorStop(1, `rgb(${c.ombre.join(",")})`);
      ctx.fillStyle = g; ctx.fill();
      /* éclairage de crête selon la pente, et ondulations fines */
      ctx.lineWidth = 1.2 * dpr;
      for (let i = 1; i < pts.length - 1; i++) {
        const pente = (pts[i + 1][1] - pts[i - 1][1]) / (2 * pas);
        const lum = Math.max(0, .45 - pente * 2.2);
        if (lum <= 0) continue;
        ctx.strokeStyle = `rgba(214, 190, 110, ${lum * .55})`;
        ctx.beginPath(); ctx.moveTo(pts[i - 1][0], pts[i - 1][1]); ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke();
      }
      ctx.strokeStyle = `rgba(230, 220, 190, ${.07 - k * .015})`;
      for (let j = 1; j <= 7; j++) {
        ctx.beginPath();
        for (let i = 0; i < pts.length; i += 2) { const [x, y] = pts[i]; const yy = y + j * 9 * dpr + Math.sin(x / (34 * dpr) + j + etat.t * .3) * 2.2 * dpr; if (i === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy); }
        ctx.stroke();
      }
    });
    ctx.globalAlpha = 1;
  }
  let raf = 0;
  function boucle() { raf = 0; if (!etat.actif || document.hidden) return; etat.t += 1 / 60; dessiner(); raf = requestAnimationFrame(boucle); }
  const demarrer = () => { if (!raf && etat.actif) raf = requestAnimationFrame(boucle); };
  document.addEventListener("visibilitychange", demarrer);
  return { etat, set(o) { Object.assign(etat, o); if (etat.actif) demarrer(); else { ctx.clearRect(0, 0, W, H); } }, canvas };
})();
