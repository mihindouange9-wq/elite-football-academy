// Captures du récit au défilement (ouverture, galerie, sections) sur ordinateur et mobile.
// node tools/shoot-recit.mjs [url] [dossier] [largeurs]
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const url = process.argv[2] ?? "http://127.0.0.1:5620";
const out = process.argv[3] ?? ".impeccable/review/recit";
const widths = (process.argv[4] ?? "1440,390").split(",").map(Number);
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const HEIGHTS = { 1440: 900, 390: 844 };
let browser;
for (let i = 0; i < 3 && !browser; i++) { try { browser = await puppeteer.launch({ executablePath: process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--hide-scrollbars", "--use-gl=angle", "--enable-webgl", "--ignore-gpu-blocklist"] }); } catch { /* nouvel essai */ } }
const erreurs = [];
for (const width of widths) {
  const height = HEIGHTS[width] ?? 900, mobile = width < 800;
  const page = await browser.newPage();
  await page.setViewport({ width, height, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => erreurs.push(`[${width}] ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error") erreurs.push(`[${width}] console : ${m.text()}`); });
  await page.goto(url, { waitUntil: "networkidle0", timeout: 90000 });
  await page.evaluate(() => document.fonts.ready);
  await sleep(3600);
  await page.screenshot({ path: path.join(out, `${width}-00-ouverture.png`) });
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  const positions = [];
  const introH = await page.evaluate(() => document.querySelector(".intro-wrap").offsetHeight);
  const galH = await page.evaluate(() => document.querySelector(".galerie-wrap").offsetHeight);
  for (let k = 1; k <= 5; k++) positions.push({ nom: `intro-${k}`, y: Math.round((introH - height) * k / 5) });
  for (let k = 0; k <= 7; k++) positions.push({ nom: `galerie-${k}`, y: Math.round(introH + (galH - height) * k / 7) });
  const ids = ["academie", "axes", "parcours", "sport-etudes", "detection", "equipe", "inscription", "contact"];
  for (const id of ids) { const y = await page.evaluate((i) => Math.round(document.getElementById(i).getBoundingClientRect().top + window.scrollY - 20), id); positions.push({ nom: id, y }); }
  let n = 1;
  for (const p of positions) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), Math.min(p.y, total - height));
    await sleep(p.nom.startsWith("galerie") || p.nom.startsWith("intro") ? 900 : 1300);
    await page.screenshot({ path: path.join(out, `${width}-${String(n++).padStart(2, "0")}-${p.nom}.png`) });
  }
  const debord = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (debord > 0) erreurs.push(`[${width}] débordement horizontal de ${debord}px`);
  console.log(`${width} px : hauteur ${total}, ${positions.length + 1} captures`);
  await page.close();
}
await browser.close();
if (erreurs.length) { console.log("Problèmes :"); erreurs.forEach((e) => console.log(" -", e)); process.exitCode = 1; } else console.log("Aucune erreur de page.");
