// Film Elite Football Academy 40 s : capture image par image de video/scene.html dans Chrome (ligne de temps GSAP placée à chaque instant),
// puis encodage MP4 H.264 + AAC par WebCodecs (video/encodeur.html). Tout est servi depuis la racine du projet.
// node tools/video-render.mjs --apercu   → video/apercu.jpg (planche-contact)
// node tools/video-render.mjs            → livrables/ELITE-film-36s-1080p.mp4 et -720p.mp4 (+ affiche)

// Options : --ips 30  --debit 10000  --debit-mobile 4500  --sans-mobile  --reprendre
import http from "node:http";
import { spawn } from "node:child_process";
import { mkdir, writeFile, readFile, rm, stat, access } from "node:fs/promises";
import { dirname, join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as attendre } from "node:timers/promises";

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..");
const VIDEO = join(RACINE, "video");
const args = process.argv.slice(2);
const option = (nom, defaut) => { const i = args.indexOf("--" + nom); return i >= 0 ? Number(args[i + 1]) : defaut; };
const APERCU = args.includes("--apercu");
const FR = false;
const SCENE = (() => { const i = args.indexOf("--scene"); return i >= 0 ? args[i + 1] : "scene"; })();
const NOM = (() => { const i = args.indexOf("--nom"); return i >= 0 ? args[i + 1] : "ELITE-film"; })();
const REPRENDRE = args.includes("--reprendre");
const IPS = option("ips", 30);
const DEBIT = option("debit", 10000) * 1000;
const DEBIT_MOBILE = option("debit-mobile", 4500) * 1000;
const SANS_MOBILE = args.includes("--sans-mobile");
const L = 1920, H = 1080;
const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const DOSSIER = join(VIDEO, ".rendu");
await mkdir(join(DOSSIER, "frames"), { recursive: true });

/* ---------- serveur local : tout le projet (scène, polices, photos, encodeur) + images capturées ---------- */
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".wav": "audio/wav", ".json": "application/json" };
const serveur = http.createServer(async (q, r) => {
  const p = decodeURIComponent(q.url.split("?")[0]);
  const fichier = p.startsWith("/frames/") ? join(DOSSIER, p) : join(RACINE, p);
  try { const d = await readFile(fichier); r.writeHead(200, { "Content-Type": TYPES[extname(fichier)] || "application/octet-stream", "Cache-Control": "no-store" }); r.end(d); }
  catch { r.writeHead(404); r.end(); }
});
await new Promise((ok) => serveur.listen(0, "127.0.0.1", ok));
const BASE = `http://127.0.0.1:${serveur.address().port}`;

/* ---------- Chrome piloté par le protocole DevTools ---------- */
async function ouvrirChrome(taille) {
  const port = 9500 + Math.floor(Math.random() * 400);
  const chrome = spawn(CHROME, ["--headless=new", "--hide-scrollbars", "--no-first-run", "--disable-extensions", "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--force-device-scale-factor=1", `--remote-debugging-port=${port}`, `--user-data-dir=${DOSSIER}/profil-${port}`, `--window-size=${taille}`, "about:blank"], { stdio: "ignore" });
  let cible = null;
  for (let i = 0; i < 80 && !cible; i++) { await attendre(250); try { cible = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === "page"); } catch { /* attente */ } }
  if (!cible) throw new Error("Chrome injoignable");
  const ws = new WebSocket(cible.webSocketDebuggerUrl);
  await new Promise((ok) => { ws.onopen = ok; });
  let n = 0; const attentes = new Map(); const erreurs = [];
  ws.onmessage = (m) => { const t = JSON.parse(m.data); if (t.id && attentes.has(t.id)) { attentes.get(t.id)(t); attentes.delete(t.id); return; } if (t.method === "Runtime.exceptionThrown") erreurs.push((t.params.exceptionDetails?.exception?.description || "").split("\n")[0]); if (t.method === "Runtime.consoleAPICalled" && t.params.type === "error") erreurs.push(t.params.args.map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 200)); if (t.method === "Network.loadingFailed") erreurs.push("chargement échoué " + t.params.errorText); };
  const envoyer = (method, params = {}) => new Promise((ok) => { const id = ++n; attentes.set(id, ok); ws.send(JSON.stringify({ id, method, params })); });
  const evaluer = async (expression, timeout = 60000) => { const r = await envoyer("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true, timeout }); if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || "erreur"); return r.result?.result?.value; };
  await envoyer("Page.enable"); await envoyer("Runtime.enable"); await envoyer("Network.enable");
  return { envoyer, evaluer, erreurs, fermer: () => { try { ws.close(); } catch { /* fermé */ } chrome.kill(); } };
}

/* ---------- 1. capture ---------- */
const scene = await ouvrirChrome(`${L},${H}`);
await scene.envoyer("Emulation.setDeviceMetricsOverride", { width: L, height: H, deviceScaleFactor: 1, mobile: false });
await scene.envoyer("Page.navigate", { url: `${BASE}/video/${SCENE}.html` });
for (let i = 0; i < 120; i++) { if (await scene.evaluer("window.pret === true")) break; await attendre(250); }
if (!(await scene.evaluer("window.pret === true"))) { console.error("scène non prête", scene.erreurs); process.exit(1); }
await attendre(800);
const DUREE = await scene.evaluer("window.DUREE");
const total = Math.round(DUREE * IPS);
const image = async (t, format = "jpeg") => {
  await scene.evaluer(`new Promise((ok) => { window.seek(${t}); requestAnimationFrame(() => requestAnimationFrame(ok)); })`);
  const { data } = (await scene.envoyer("Page.captureScreenshot", format === "png" ? { format, captureBeyondViewport: false } : { format, quality: 92, captureBeyondViewport: false })).result;
  return Buffer.from(data, "base64");
};

if (APERCU) {
  const temps = Array.from({ length: 28 }, (_, i) => +((i + .5) * DUREE / 28).toFixed(1));
  const vignettes = [];
  for (const t of temps) vignettes.push({ t, data: (await image(t)).toString("base64") });
  const planche = await scene.evaluer(`(async () => {
    const vignettes = ${JSON.stringify(vignettes)};
    const vw = 480, vh = 270, cols = 4, rows = Math.ceil(vignettes.length / cols);
    const c = document.createElement('canvas'); c.width = vw * cols; c.height = vh * rows; const g = c.getContext('2d');
    g.fillStyle = '#222'; g.fillRect(0, 0, c.width, c.height);
    for (let i = 0; i < vignettes.length; i++) { const img = new Image(); img.src = 'data:image/jpeg;base64,' + vignettes[i].data; await img.decode(); const x = (i % cols) * vw, y = Math.floor(i / cols) * vh; g.drawImage(img, x + 2, y + 2, vw - 4, vh - 4); g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(x + 2, y + 2, 70, 26); g.fillStyle = '#fff'; g.font = '600 15px sans-serif'; g.fillText(vignettes[i].t.toFixed(1) + ' s', x + 10, y + 21); }
    return c.toDataURL('image/jpeg', 0.86).split(',')[1];
  })()`, 120000);
  await writeFile(join(VIDEO, `apercu-${SCENE}.jpg`), Buffer.from(planche, "base64"));
  console.log(`video/apercu.jpg : ${temps.length} images clés · erreurs page : ${scene.erreurs.length ? scene.erreurs.join(" | ") : "aucune"}`);
  scene.fermer(); serveur.close(); await attendre(600); await rm(DOSSIER, { recursive: true, force: true }).catch(() => {});
  process.exit(0);
}

console.log(`Film Elite Football · ${L}×${H} · ${IPS} i/s · ${total} images`);
const debut = Date.now();
const journal = join(DOSSIER, "journal.txt");
for (let i = 0; i < total; i++) {
  const f = join(DOSSIER, "frames", `i${String(i).padStart(5, "0")}.png`);
  if (REPRENDRE) { try { await access(f); continue; } catch { /* à capturer */ } }
  await writeFile(f, await image(i / IPS, "png"));
  if (i % 30 === 0) await writeFile(journal, `capture ${i}/${total} (${((Date.now() - debut) / 1000).toFixed(0)} s)\n`);
}
console.log(`  capture ${total}/${total} en ${((Date.now() - debut) / 1000).toFixed(0)} s · erreurs page : ${scene.erreurs.length ? scene.erreurs.join(" | ") : "aucune"}`);
const affiche = await image(DUREE - 3.4, "jpeg");
scene.fermer();

/* ---------- 2. encodage : 1080p puis 720p ---------- */
const enc = await ouvrirChrome("800,600");
await enc.envoyer("Page.navigate", { url: `${BASE}/video/encodeur.html` });
for (let i = 0; i < 80; i++) { if (await enc.evaluer("window.pret === true")) break; await attendre(250); }
const cibles = [{ nom: "1080p", largeur: 1920, hauteur: 1080, debit: DEBIT }];
if (!SANS_MOBILE) cibles.push({ nom: "720p", largeur: 1280, hauteur: 720, debit: DEBIT_MOBILE });
await mkdir(join(RACINE, "livrables"), { recursive: true });
let audio = false;
const sorties = [];
for (const c of cibles) {
  await writeFile(journal, `encodage ${c.nom}…\n`);
  console.log(`  encodage H.264 ${c.largeur}×${c.hauteur} à ${c.debit / 1000} kb/s…`);
  const taille = await enc.evaluer(`window.encoder(${JSON.stringify({ dossier: `${BASE}/frames`, total, ips: IPS, largeur: c.largeur, hauteur: c.hauteur, debit: c.debit, scene: SCENE, base: BASE })})`, 3600000);
  const erreur = await enc.evaluer("window.erreur || ''");
  if (erreur) { console.error("échec :", erreur); enc.fermer(); process.exit(1); }
  audio = await enc.evaluer("window.audio");
  const morceaux = [];
  for (let d = 0; d < taille; d += 8_000_000) morceaux.push(Buffer.from(await enc.evaluer(`window.tranche(${d}, ${Math.min(taille, d + 8_000_000)})`, 120000), "base64"));
  const sortie = join(RACINE, "livrables", `${NOM}-${DUREE}s-${c.nom}.mp4`);
  await writeFile(sortie, Buffer.concat(morceaux));
  sorties.push({ sortie, taille: (await stat(sortie)).size });
}
enc.fermer();
await writeFile(join(RACINE, "livrables", `${NOM}-affiche.jpg`), affiche);
serveur.close();
await attendre(600); await rm(DOSSIER, { recursive: true, force: true }).catch(() => {});
console.log(`\n${sorties.map((s) => `  ${s.sortie} · ${(s.taille / 1048576).toFixed(1)} Mo`).join("\n")}\n  ${DUREE} s · audio AAC : ${audio ? "oui" : "non"} · affiche : livrables/${NOM}-affiche.jpg`);
