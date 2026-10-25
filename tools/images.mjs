// Convertit les photos de public/assets en WebP (1600 et 800 px) dans Chrome headless : node tools/images.mjs
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { spawn } from "node:child_process";
import { setTimeout as attendre } from "node:timers/promises";
const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const port = 9700 + Math.floor(Math.random() * 200);
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${port}`, "--user-data-dir=" + process.env.TEMP + "/efa-img-" + port, "about:blank"], { stdio: "ignore" });
let cible; for (let i = 0; i < 60 && !cible; i++) { await attendre(250); try { cible = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === "page"); } catch {} }
const ws = new WebSocket(cible.webSocketDebuggerUrl); await new Promise((ok) => (ws.onopen = ok));
let n = 0; const att = new Map(); ws.onmessage = (m) => { const t = JSON.parse(m.data); if (t.id && att.has(t.id)) { att.get(t.id)(t); att.delete(t.id); } };
const evaluer = (expression) => new Promise((ok) => { const id = ++n; att.set(id, (t) => ok(t.result?.result?.value)); ws.send(JSON.stringify({ id, method: "Runtime.evaluate", params: { expression, awaitPromise: true, returnByValue: true } })); });
for (const f of readdirSync("public/assets").filter((f) => /\.jpe?g$/i.test(f))) {
  const b64 = readFileSync("public/assets/" + f).toString("base64");
  const out = await evaluer(`(async () => { const img = new Image(); img.src = "data:image/jpeg;base64,${b64}"; await img.decode(); const res = {}; for (const w of [1600, 800]) { const s = Math.min(1, w / img.naturalWidth); const c = document.createElement("canvas"); c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s); const x = c.getContext("2d"); x.imageSmoothingQuality = "high"; x.drawImage(img, 0, 0, c.width, c.height); res[w] = { w: c.width, h: c.height, data: c.toDataURL("image/webp", 0.82).split(",")[1] }; } return res; })()`);
  for (const w of [1600, 800]) { const name = f.replace(/\.jpe?g$/i, "") + "-" + w + ".webp"; writeFileSync("public/assets/" + name, Buffer.from(out[w].data, "base64")); console.log(name, out[w].w + "x" + out[w].h, Math.round(Buffer.from(out[w].data, "base64").length / 1024) + " Ko"); }
}
ws.close(); chrome.kill();
