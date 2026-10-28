// Vérification finale du site public : pages, erreurs de console, liens internes, triple clic sur le logo.
// node tools/verif-finale.mjs [url]
import puppeteer from "puppeteer-core";
const url = process.argv[2] ?? "http://127.0.0.1:5620";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--hide-scrollbars"] });
const res = []; const ok = (n, p, d = "") => res.push(`${p ? "OK   " : "ÉCHEC"} ${n}${d ? " — " + d : ""}`);
const page = await browser.newPage(); await page.setViewport({ width: 1440, height: 900 });
const erreurs = []; page.on("pageerror", (e) => erreurs.push(e.message)); page.on("console", (m) => { if (m.type() === "error" && !/401|404/.test(m.text())) erreurs.push(m.text()); });
/* attendus : 401 sur la vérification de session sans connexion, 404 sur un passeport inexistant */
const attendu = (t) => /api\/auth\/me|passeport\/inexistant/.test(t);
page.on("response", (r) => { if (r.status() >= 400 && r.url().startsWith(url) && !attendu(r.url())) erreurs.push(`HTTP ${r.status()} ${r.url()}`); });
/* pages */
for (const p of ["/", "/connexion", "/mentions-legales", "/confidentialite", "/admin", "/coach", "/parents", "/passeport/inexistant"]) {
  await page.goto(url + p, { waitUntil: "networkidle0", timeout: 60000 }); await sleep(600);
  const titre = await page.title();
  ok(`page ${p} se charge (${page.url().replace(url, "")})`, !!titre, titre);
}
ok("aucune erreur de console ni requête en échec sur les pages", erreurs.length === 0, erreurs.join(" | "));
/* liens internes du site public */
await page.goto(url + "/", { waitUntil: "networkidle0" }); await sleep(3500);
const ancres = await page.evaluate(() => [...document.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute("href")).filter((h) => h.length > 1));
const manquantes = [...new Set(ancres)].filter((h) => { try { return !document.querySelector(h); } catch { return true; } });
const manq = await page.evaluate((hs) => hs.filter((h) => !document.querySelector(h)), [...new Set(ancres)]);
ok(`ancres internes valides (${new Set(ancres).size})`, manq.length === 0, manq.join(", "));
void manquantes;
const apiPub = await page.evaluate(() => fetch("/api/public").then((r) => r.ok));
ok("API publique répond", apiPub);
const tarif = await page.$eval('[data-tarif-ecran="sport_etudes"]', (e) => e.textContent.trim());
ok("tarif réel affiché dans l'écran Sport-Études", /\d/.test(tarif), tarif);
/* ouverture : chargeur terminé, marque visible */
const chargeurFini = await page.$eval("#chargeur", (e) => e.classList.contains("fini"));
const marqueVisible = await page.$eval(".intro__marque", (e) => +getComputedStyle(e).opacity > .9);
ok("chargeur terminé et marque ELITE visible", chargeurFini && marqueVisible);
/* galerie : sept écrans, premier chapitre courant */
const ecrans = await page.$$eval(".ecran", (l) => l.length);
ok("galerie : sept écrans", ecrans === 7, String(ecrans));
await page.evaluate(() => { const g = document.querySelector(".galerie-wrap"); window.scrollTo(0, g.offsetTop + 10); }); await sleep(900);
const courant = await page.$eval(".ecran.courant .ecran__titre", (e) => e.textContent.trim());
ok("premier écran courant = L'académie", courant === "L'académie", courant);
/* triple clic sur le logo → espace direction (redirigé vers la connexion sans session) */
await page.evaluate(() => window.scrollTo(0, 0)); await sleep(800);
const marque = await page.$(".entete .marque");
await marque.click(); await sleep(120); await marque.click(); await sleep(120);
await Promise.all([page.waitForNavigation({ waitUntil: "networkidle0", timeout: 15000 }).catch(() => null), marque.click()]);
await sleep(800);
ok("trois clics sur le logo ouvrent l'espace direction (page de connexion sans session)", /\/(admin|connexion)/.test(page.url()), page.url().replace(url, ""));
/* un seul clic ne quitte pas la page */
await page.goto(url + "/", { waitUntil: "networkidle0" }); await sleep(3000);
await (await page.$(".entete .marque")).click(); await sleep(1500);
ok("un clic simple sur le logo reste sur le site", page.url().replace(url, "").replace(/#.*/, "") === "/", page.url().replace(url, ""));
/* mobile : galerie empilée, pas de débordement */
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
await page.goto(url + "/", { waitUntil: "networkidle0" }); await sleep(3000);
const debord = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
ok("mobile : aucun débordement horizontal", debord <= 0, `${debord}px`);
const burger = await page.$("#burger"); await burger.click(); await sleep(700);
const menuOuvert = await page.$eval("#menuMobile", (m) => m.classList.contains("ouvert"));
ok("mobile : le menu s'ouvre", menuOuvert);
await browser.close();
console.log(res.join("\n"));
const echecs = res.filter((r) => r.startsWith("ÉCHEC")).length;
console.log(`\n${res.length - echecs}/${res.length} contrôles réussis`);
process.exitCode = echecs ? 1 : 0;
