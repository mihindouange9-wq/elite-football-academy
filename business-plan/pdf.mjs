// Imprime business-plan.html en PDF A4 avec Chrome (protocole DevTools), avec pied de page numéroté.
// node pdf.mjs [entrée.html] [sortie.pdf]
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { setTimeout as attendre } from "node:timers/promises";

const entree = resolve(process.argv[2] ?? "business-plan.html");
const sortie = resolve(process.argv[3] ?? "../livrables/Elite_Football_BusinessPlan_v1.pdf");
const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const port = 9700 + Math.floor(Math.random() * 200);
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${port}`, "--user-data-dir=" + process.env.TEMP + "/efa-pdf-" + port, "--no-first-run", "about:blank"], { stdio: "ignore" });
let cible; for (let i = 0; i < 60 && !cible; i++) { await attendre(250); try { cible = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === "page"); } catch {} }
const ws = new WebSocket(cible.webSocketDebuggerUrl); await new Promise((ok) => (ws.onopen = ok));
let n = 0; const att = new Map(); ws.onmessage = (m) => { const t = JSON.parse(m.data); if (t.id && att.has(t.id)) { att.get(t.id)(t); att.delete(t.id); } };
const envoyer = (method, params = {}) => new Promise((ok) => { const id = ++n; att.set(id, ok); ws.send(JSON.stringify({ id, method, params })); });
await envoyer("Page.enable");
await envoyer("Page.navigate", { url: "file:///" + entree.replace(/\\/g, "/") });
await attendre(2500);
await envoyer("Runtime.evaluate", { expression: "document.fonts.ready", awaitPromise: true });
const pied = `<div style="width:100%;font-family:Manrope,Calibri,sans-serif;font-size:7.5pt;color:#555;padding:0 18mm;display:flex;justify-content:space-between;border-top:.4pt solid #BFBFBF;padding-top:2mm"><span>Elite Football Academy SARL — Business plan — Octobre 2026</span><span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`;
const r = await envoyer("Page.printToPDF", { printBackground: true, preferCSSPageSize: true, displayHeaderFooter: true, headerTemplate: "<span></span>", footerTemplate: pied, marginTop: 0.79, marginBottom: 0.79, marginLeft: 0.71, marginRight: 0.71, paperWidth: 8.27, paperHeight: 11.69 });
writeFileSync(sortie, Buffer.from(r.result.data, "base64"));
console.log("écrit :", sortie, Math.round(readFileSync(sortie).length / 1024), "Ko");
ws.close(); chrome.kill();
