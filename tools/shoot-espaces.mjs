// Captures des trois espaces connectés (direction, coach, parents) sur des données de démonstration
// créées dans un dossier temporaire ; ne touche jamais aux vraies données.
// node tools/shoot-espaces.mjs [dossier de sortie] [largeurs]
import { spawn } from "node:child_process";
import fs from "node:fs";
import { mkdtemp, copyFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path, { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as attendre } from "node:timers/promises";
import puppeteer from "puppeteer-core";

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 5612, BASE = `http://127.0.0.1:${PORT}`;
const out = process.argv[2] ?? ".impeccable/review/espaces";
const widths = (process.argv[3] ?? "1440,390").split(",").map(Number);
const DATA = await mkdtemp(join(tmpdir(), "elite-espaces-"));
await mkdir(DATA, { recursive: true });
for (const f of ["categories.json", "seances.json", "settings.json"]) await copyFile(join(RACINE, "data", f), join(DATA, f)).catch(() => {});
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });

const serveur = spawn(process.execPath, ["--no-warnings", "server.js"], { cwd: RACINE, env: { ...process.env, DATA_DIR: DATA, PORT: String(PORT), ADMIN_PASSWORD: "DemoAdmin2026" }, stdio: "ignore" });
for (let i = 0; i < 40; i++) { try { if ((await fetch(BASE + "/api/public")).ok) break; } catch { /* attente */ } await attendre(250); }
function client() {
  let cookie = "";
  const call = async (method, p, body) => { const r = await fetch(BASE + p, { method, headers: { "Content-Type": "application/json", "X-Requested-With": "fetch", Cookie: cookie }, body: body ? JSON.stringify(body) : undefined }); const sc = r.headers.get("set-cookie"); if (sc) cookie = sc.split(";")[0]; let data = null; try { data = await r.json(); } catch { /* vide */ } if (r.status >= 400) console.log("API", method, p, r.status, data?.error ?? ""); return data; };
  return { call, get: (p) => call("GET", p), post: (p, b) => call("POST", p, b), put: (p, b) => call("PUT", p, b), patch: (p, b) => call("PATCH", p, b), token: () => cookie.split("=")[1] };
}
const mois = new Date().toISOString().slice(0, 7);
const jour = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

/* ---- données de démonstration (fictives, uniquement pour les captures) ---- */
const dir = client(), coach = client(), parent = client(), anon = client();
await dir.post("/api/auth/login", { login: "direction", password: "DemoAdmin2026" });
await dir.post("/api/auth/password", { current: "DemoAdmin2026", next: "DemoAdmin2026!" });
const c = await dir.post("/api/direction/utilisateurs", { name: "Coach Démo", phone: "074000003", role: "coach" });
const cats = await dir.get("/api/direction/categories");
await dir.put(`/api/direction/categories/${cats[0].id}`, { ...cats[0], coach_id: c.id });
await dir.put(`/api/direction/categories/${cats[1].id}`, { ...cats[1], coach_id: c.id });
for (const s of await dir.get("/api/direction/seances")) if ([cats[0].id, cats[1].id].includes(s.categorie_id)) await dir.put(`/api/direction/seances/${s.id}`, { ...s, coach_id: c.id });
const noms = [["Awa Démo", 2014, "Sport-Études", "Milieu", "Marie Démo", "077000001"], ["Yann Démo", 2013, "Loisirs", "Gardien", "Paul Démo", "066000002"], ["Léa Démo", 2014, "Sport-Études", "Ailier", "Marie Démo", "077000001"], ["Idriss Démo", 2012, "Loisirs", "Défenseur", "Sarah Démo", "062000004"], ["Noé Démo", 2015, "Loisirs", "Attaquant", "Jean Démo", "065000005"]];
const J = [];
for (const [i, [name, by, fil, poste, pn, pt]] of noms.entries()) J.push((await dir.post("/api/direction/joueurs", { name, birth_year: by, categorie_id: i % 2 ? cats[1].id : cats[0].id, filiere: fil, poste, parent_name: pn, parent_phone: pt, autorisation: i < 3, medical_until: i < 4 ? jour(-200) : "" })).id);
await anon.post("/api/inscriptions", { enfant: { nom: "Enfant Démo", age: "11", filiere: "Loisirs", poste: "Ailier" }, parent: { nom: "Parent Démo", tel: "077 00 00 09", quartier: "Angondjé" }, message: "Disponible le samedi matin", consent: true });
await anon.post("/api/inscriptions", { enfant: { nom: "Second Démo", age: "9", filiere: "Sport-Études" }, parent: { nom: "Autre Démo", tel: "066 00 00 08" }, consent: true });
const cp = await dir.post(`/api/direction/joueurs/${J[0]}/compte-parent`, { name: "Marie Démo", phone: "077000001" });
await dir.post(`/api/direction/joueurs/${J[2]}/compte-parent`, { name: "Marie Démo", phone: "077000001" });
await dir.post(`/api/direction/echeancier/${mois}`);
const ech = await dir.get(`/api/direction/echeancier/${mois}`);
await dir.patch(`/api/direction/echeances/${ech.fees.find((f) => f.player_id === J[1]).id}`, { status: "paid", method: "Espèces" });
const det = await dir.post("/api/direction/detections", { date: jour(-12), heure: "09:00", titre: "Journée de détection", lieu: "Terrain d'Akanda", places: 40, open_public: true });
await anon.post(`/api/detections/${det.id}/candidats`, { nom: "Candidat Démo", age: 12, parent_nom: "Parent Démo", parent_tel: "077000010", poste: "Milieu", consent: true });
await anon.post(`/api/detections/${det.id}/candidats`, { nom: "Candidate Démo", age: 11, parent_nom: "Parent Démo", parent_tel: "077000011", poste: "Gardien", consent: true });
await dir.post("/api/direction/actualites", { type: "convocation", title: "Match amical samedi", body: "Rendez-vous à 8 h 30 au terrain, tenue complète.", categorie_id: cats[0].id, date: jour(0), public: false });
await dir.post("/api/direction/actualites", { type: "information", title: "Reprise des entraînements", body: "La saison reprend cette semaine.", date: jour(2), public: true });
await dir.post("/api/direction/depenses", { label: "Ballons taille 4", amount: 45000, category: "Matériel", date: jour(3) });
await dir.put("/api/direction/parametres", { charges_fixes: "250000", mobile_money: "Airtel Money 074 00 00 00 au nom de Elite Football Academy" });
await coach.post("/api/auth/login", { login: "074000003", password: c.password });
await coach.post("/api/auth/password", { current: c.password, next: "CoachDemo2026" });
const esp = await coach.get("/api/coach/espace");
for (const n of [1, 3, 5, 8]) await coach.post("/api/presences", { date: jour(n), presences: esp.joueurs.map((j, i) => ({ player_id: j.id, status: n === 3 && i === 1 ? "absent" : n === 5 && i === 2 ? "retard" : "présent" })) });
await coach.post(`/api/joueurs/${J[0]}/evaluations`, { technique: 7, physique: 6, tactique: 6.5, mental: 8, scolaire: 7, commentaire: "Très bonne vision du jeu, à renforcer physiquement." });
await coach.post(`/api/joueurs/${J[0]}/evaluations`, { trimestre: "2025-2026-T3", technique: 6, physique: 5.5, tactique: 5, mental: 7, scolaire: 6.5 });
await coach.post(`/api/joueurs/${J[0]}/observations`, { texte: "Pied gauche très sûr, prend des initiatives." });
await coach.post(`/api/joueurs/${J[0]}/scolaire`, { moyenne: 12.5, commentaire: "Bulletin du premier trimestre" });
await parent.post("/api/auth/login", { login: "077000001", password: cp.password });
await parent.post("/api/auth/password", { current: cp.password, next: "ParentDemo2026" });
await parent.post(`/api/parents/enfants/${J[0]}/paiements`, { fee_id: ech.fees.find((f) => f.player_id === J[0]).id, amount: 50000, method: "Airtel Money", reference: "AM-123456" });

/* ---- captures ---- */
const vues = {
  direction: { token: dir.token(), url: "/admin", hashes: ["tableau", "demandes", "joueurs", `joueurs/${J[0]}`, "groupes", "detections", `detections/${det.id}`, "finances", "rapport", "actualites", "comptes", "parametres", "journal"] },
  coach: { token: coach.token(), url: "/coach", hashes: ["semaine", "presences", "joueurs", `joueurs/${J[0]}`, "absences", "detections"] },
  parents: { token: parent.token(), url: "/parents", hashes: ["resume", "planning", "passeport", "cotisations"] },
};
const HEIGHTS = { 1440: 900, 390: 844 };
let browser;
for (let i = 0; i < 3 && !browser; i++) { try { browser = await puppeteer.launch({ executablePath: process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--hide-scrollbars"] }); } catch { /* nouvel essai */ } }
const erreurs = [];
for (const [role, v] of Object.entries(vues)) {
  for (const width of widths) {
    const page = await browser.newPage();
    const mobile = width < 800;
    await page.setViewport({ width, height: HEIGHTS[width] ?? 900, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 });
    await page.setCookie({ name: "efa_session", value: v.token, domain: "127.0.0.1", path: "/", httpOnly: true });
    page.on("pageerror", (e) => erreurs.push(`[${role} ${width}] ${e.message}`));
    page.on("console", (m) => m.type() === "error" && erreurs.push(`[${role} ${width}] console : ${m.text()}`));
    for (const [i, h] of v.hashes.entries()) {
      await page.goto(`${BASE}${v.url}#${h}`, { waitUntil: "networkidle0", timeout: 60000 });
      await page.evaluate(() => document.fonts.ready); await attendre(500);
      const nom = `${width}-${role}-${String(i).padStart(2, "0")}-${h.replace(/[^a-z0-9]+/gi, "-").slice(0, 24)}.png`;
      await page.screenshot({ path: path.join(out, nom), fullPage: true });
      const debord = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (debord > 0) erreurs.push(`[${role} ${width}] #${h} déborde horizontalement de ${debord}px`);
    }
    if (mobile) { await page.goto(`${BASE}${v.url}#${v.hashes[0]}`, { waitUntil: "networkidle0" }); await page.click("#burgerApp"); await attendre(400); await page.screenshot({ path: path.join(out, `${width}-${role}-menu.png`) }); }
    await page.close();
  }
}
/* lien de partage public */
{
  const pp = await parent.post(`/api/parents/enfants/${J[0]}/partage`, { scope: "complet" });
  const page = await browser.newPage(); await page.setViewport({ width: 1440, height: 900 });
  page.on("pageerror", (e) => erreurs.push(`[partage] ${e.message}`));
  await page.goto(`${BASE}/passeport/${pp.token}`, { waitUntil: "networkidle0" }); await attendre(400);
  await page.screenshot({ path: path.join(out, "1440-partage-passeport.png"), fullPage: true });
  await page.goto(`${BASE}/connexion`, { waitUntil: "networkidle0" }); await page.screenshot({ path: path.join(out, "1440-connexion.png") });
  await page.close();
}
await browser.close(); serveur.kill(); await attendre(800);
try { fs.rmSync(DATA, { recursive: true, force: true }); } catch { /* verrou SQLite encore tenu */ }
console.log(`${fs.readdirSync(out).length} captures dans ${out}`);
if (erreurs.length) { console.log("Problèmes :"); erreurs.forEach((e) => console.log(" -", e)); process.exitCode = 1; } else console.log("Aucune erreur de page, aucun débordement.");
