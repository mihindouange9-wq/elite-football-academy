// Captures de vérification, section par section.
// node tools/shoot.mjs [url] [dossier] [largeurs séparées par des virgules]
//   ex. node tools/shoot.mjs http://127.0.0.1:5611 .impeccable/review/shots 1440,390
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const url = process.argv[2] ?? "http://127.0.0.1:5611";
const out = process.argv[3] ?? ".impeccable/review/shots";
const widths = (process.argv[4] ?? "1440,390").split(",").map(Number);
const only = process.argv[5]?.split(","); // identifiants de sections à capturer, sinon toutes
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const HEIGHTS = { 1440: 900, 1280: 800, 1024: 768, 768: 1024, 390: 844, 375: 667 };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let browser;
for (let i = 0; i < 3 && !browser; i++) {
  try {
    browser = await puppeteer.launch({
      executablePath: process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe",
      headless: "new",
      args: ["--hide-scrollbars"],
    });
  } catch {}
}

for (const width of widths) {
  const height = HEIGHTS[width] ?? 900;
  const mobile = width < 800;
  const page = await browser.newPage();
  await page.setViewport({ width, height, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => console.log(`[${width}] erreur page :`, e.message));
  page.on("console", (m) => m.type() === "error" && console.log(`[${width}] console :`, m.text()));
  await page.goto(url, { waitUntil: "networkidle0", timeout: 90000 });
  await page.evaluate(() => document.fonts.ready);
  await sleep(3800); // entrée du hero terminée
  if (!only || only.includes("accueil")) await page.screenshot({ path: path.join(out, `${width}-00-accueil.png`) });

  // un premier passage déclenche toutes les révélations, comme le ferait un visiteur
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total; y += height * 0.6) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y);
    await sleep(260);
  }

  const sections = await page.evaluate(() =>
    [...document.querySelectorAll("main > section, footer")].map((s) => ({
      id: s.id,
      top: s.getBoundingClientRect().top + window.scrollY,
      height: s.offsetHeight,
    })),
  );
  let n = 1;
  for (const s of sections.slice(1)) {
    const index = String(n++).padStart(2, "0");
    if (only && !only.includes(s.id)) continue;
    const parts = Math.min(3, Math.max(1, Math.round(s.height / height)));
    for (let p = 0; p < parts; p++) {
      const y = parts === 1 ? s.top - (height - Math.min(height, s.height)) / 2 : s.top + (p * (s.height - height)) / (parts - 1);
      await page.evaluate((y) => window.scrollTo({ top: Math.max(0, y), behavior: "instant" }), y);
      await sleep(1500);
      await page.screenshot({ path: path.join(out, `${width}-${index}-${s.id}${parts > 1 ? "-" + (p + 1) : ""}.png`) });
    }
  }

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  console.log(`${width} px : ${sections.length} sections, hauteur ${total} px, débordement horizontal ${overflow} px`);
  await page.close();
}
await browser.close();
