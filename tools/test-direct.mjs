// Vérifie que les modifications faites dans l'espace direction apparaissent sur le site public,
// y compris sur une page déjà ouverte. Serveur et données temporaires : node tools/test-direct.mjs
import { spawn } from "node:child_process";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as attendre } from "node:timers/promises";
import puppeteer from "puppeteer-core";

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 5613, BASE = `http://127.0.0.1:${PORT}`;
const DATA = await mkdtemp(join(tmpdir(), "elite-direct-"));
const serveur = spawn(process.execPath, ["--no-warnings", "server.js"], { cwd: RACINE, env: { ...process.env, DATA_DIR: DATA, PORT: String(PORT), ADMIN_PASSWORD: "DirectTest2026" }, stdio: "ignore" });
for (let i = 0; i < 40; i++) { try { if ((await fetch(BASE + "/api/public")).ok) break; } catch { /* attente */ } await attendre(250); }
let cookie = "";
const api = async (m, p, b) => { const r = await fetch(BASE + p, { method: m, headers: { "Content-Type": "application/json", "X-Requested-With": "fetch", Cookie: cookie }, body: b ? JSON.stringify(b) : undefined }); const sc = r.headers.get("set-cookie"); if (sc) cookie = sc.split(";")[0]; return r.json().catch(() => null); };
const res = []; const ok = (n, p, d = "") => res.push(`${p ? "OK   " : "ÉCHEC"} ${n}${d ? " — " + d : ""}`);
try {
  await api("POST", "/api/auth/login", { login: "direction", password: "DirectTest2026" });
  /* 1. modifications avant l'ouverture du site */
  await api("PUT", "/api/direction/parametres", { nom: "Académie Test", slogan: "Jouer juste, grandir vrai", presentation: "Texte de présentation modifié depuis l'espace direction.", age_min: "7", age_max: "17", horaires: "Mardi – Dimanche", lieu: "Terrain test, Akanda", tarif_sport_etudes: "60000", tarif_loisirs: "30000", saison: "2027-2028", fondateur: "Fondateur Test", email: "contact@test.ga", whatsapp: "24177000000" });
  const c = await api("POST", "/api/direction/utilisateurs", { name: "Coach Test", phone: "074000099", role: "coach" });
  const cats = await api("GET", "/api/direction/categories");
  await api("PUT", `/api/direction/categories/${cats[0].id}`, { ...cats[0], coach_id: c.id });
  await api("POST", "/api/direction/actualites", { type: "information", title: "Actualité test", body: "Visible sur le site.", date: new Date().toISOString().slice(0, 10), public: true });
  const det = await api("POST", "/api/direction/detections", { date: new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10), heure: "09:00", titre: "Détection test", lieu: "Terrain test", places: 30, open_public: true });
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--hide-scrollbars"] });
  const page = await browser.newPage(); await page.setViewport({ width: 1440, height: 900 });
  const erreurs = []; page.on("pageerror", (e) => erreurs.push(e.message));
  await page.goto(BASE + "/", { waitUntil: "networkidle0" }); await attendre(3500);
  const lire = () => page.evaluate(() => ({
    titre: document.title, nom: document.getElementById("nomPied").textContent, slogan: document.getElementById("sloganPied").textContent, presentation: document.getElementById("introTexte").textContent.replace(/\s+/g, " ").trim(),
    ages: document.querySelector("[data-ages]").textContent, horaires: document.getElementById("horairesPied").textContent, lieu: document.getElementById("lieuPied").textContent, saison: document.getElementById("introSous").textContent,
    tarif: document.querySelector('[data-tarif="sport_etudes"]').textContent, tarifEcran: document.querySelector('[data-tarif-ecran="loisirs"]').textContent, fondateur: document.getElementById("fondateurPied").textContent,
    email: document.getElementById("emailLien").querySelector("span").textContent, emailVisible: !document.getElementById("emailPied").hidden, coachs: document.getElementById("coachs").textContent, actus: document.getElementById("actusListe").textContent, detection: document.getElementById("detectionListe").textContent, wa: document.getElementById("waFloat").href,
  }));
  let v = await lire();
  ok("nom et titre de page", v.nom === "Académie Test" && v.titre.startsWith("Académie Test"), v.titre);
  ok("slogan en pied de page", v.slogan.includes("Jouer juste") && v.slogan.includes("grandir vrai"), v.slogan);
  ok("texte de présentation de l'ouverture", v.presentation.startsWith("Texte de présentation modifié"), v.presentation);
  ok("âges", v.ages === "de 7 à 17 ans", v.ages);
  ok("jours d'ouverture", v.horaires === "Mardi – Dimanche", v.horaires);
  ok("lieu", v.lieu === "Terrain test, Akanda", v.lieu);
  ok("saison", v.saison.includes("2027-2028"), v.saison);
  ok("tarifs (section et écran de la galerie)", /60\D?000/.test(v.tarif) && /30\D?000/.test(v.tarifEcran), `${v.tarif} / ${v.tarifEcran}`);
  ok("fondateur, e-mail, WhatsApp", v.fondateur === "Fondateur Test" && v.emailVisible && v.email === "contact@test.ga" && v.wa.includes("24177000000"));
  ok("coach affiché", v.coachs.includes("Coach Test"), v.coachs.trim());
  ok("actualité publique affichée", v.actus.includes("Actualité test"));
  ok("journée de détection affichée avec formulaire", v.detection.includes("Détection test") && (await page.$(".form-detection")) !== null);
  /* 2. modification pendant que la page est ouverte : elle doit se mettre à jour seule */
  await api("PUT", "/api/direction/parametres", { slogan: "Second slogan, en direct", age_min: "6", tarif_loisirs: "35000" });
  await api("DELETE", `/api/direction/detections/${det.id}`);
  await attendre(23000);
  v = await lire();
  ok("page ouverte : slogan mis à jour sans rechargement (≤ 20 s)", v.slogan.includes("Second slogan"), v.slogan);
  ok("page ouverte : âges et tarif mis à jour", v.ages === "de 6 à 17 ans" && /35\D?000/.test(v.tarifEcran), `${v.ages} / ${v.tarifEcran}`);
  ok("page ouverte : détection supprimée disparaît", !v.detection.includes("Détection test"));
  ok("aucune erreur JavaScript", erreurs.length === 0, erreurs.join(" | "));
  await browser.close();
} finally { serveur.kill(); }
console.log(res.join("\n"));
const echecs = res.filter((r) => r.startsWith("ÉCHEC")).length;
console.log(`\n${res.length - echecs}/${res.length} contrôles réussis`);
process.exitCode = echecs ? 1 : 0;
