// Crée (ou retrouve) le service web Elite Football Academy sur Render par l'API publique, puis suit
// le déploiement jusqu'à l'état « live ». Reflète render.yaml : si l'un change, mettre l'autre à jour.
//
// Usage : RENDER_API_KEY=rnd_xxx node tools/render-deploy.mjs
//     ou  RENDER_KEY_FILE=chemin/vers/fichier node tools/render-deploy.mjs   (fichier hors du dépôt)
// La clé se crée dans Render → Account Settings → API Keys. Elle n'est jamais écrite dans le dépôt.
// Le mot de passe initial de la direction est passé par ADMIN_PASSWORD (ou généré, puis affiché une fois).
// Un push sur main ne redéploie pas forcément : relancer cet outil après chaque mise à jour.
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

const API = "https://api.render.com/v1";
const KEY = (process.env.RENDER_API_KEY || (process.env.RENDER_KEY_FILE ? readFileSync(process.env.RENDER_KEY_FILE, "utf8") : "")).trim();
if (!KEY) { console.error("RENDER_API_KEY (ou RENDER_KEY_FILE) manquante."); process.exit(1); }
const REPO = "https://github.com/mihindouange9-wq/elite-football-academy";
const NAME = "elite-football-academy";
const ADMIN = process.env.ADMIN_PASSWORD || randomBytes(9).toString("base64url");

const SERVICE = {
  type: "web_service", name: NAME, repo: REPO, branch: "main", autoDeploy: "yes",
  envVars: [
    { key: "NODE_VERSION", value: "22.12.0" },
    { key: "ADMIN_PASSWORD", value: ADMIN },
    // DATA_DIR n'est pas fixé : sans disque persistant (plan gratuit), la base vit dans ./data et repart
    // de zéro à chaque redéploiement. Avec un disque monté sur /var/data, ajouter DATA_DIR=/var/data.
  ],
  serviceDetails: { env: "node", plan: "free", region: "frankfurt", envSpecificDetails: { buildCommand: "", startCommand: "node --no-warnings server.js" }, healthCheckPath: "/api/public", pullRequestPreviewsEnabled: "no" },
};

async function api(method, path, body) {
  const res = await fetch(`${API}${path}`, { method, headers: { Authorization: `Bearer ${KEY}`, Accept: "application/json", "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text(); let data; try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${typeof data === "object" && data && data.message ? data.message : text}`);
  return data;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const owners = (await api("GET", "/owners?limit=20")).map((o) => o.owner);
  if (!owners.length) throw new Error("Aucun espace de travail visible avec cette clé.");
  const owner = owners.find((o) => o.type === "user") || owners[0];
  console.log(`Espace de travail : ${owner.name} (${owner.id})`);
  const existing = (await api("GET", `/services?name=${NAME}&ownerId=${owner.id}&limit=20`)).map((s) => s.service);
  let service = existing.find((s) => s.name === NAME && s.type === "web_service");
  let deployId, nouveau = false;
  if (service) {
    console.log(`Service existant : ${service.id} → ${service.serviceDetails?.url ?? ""}`);
    if (process.env.ADMIN_PASSWORD) { await api("PUT", `/services/${service.id}/env-vars`, SERVICE.envVars); console.log("Variables mises à jour (ADMIN_PASSWORD remplacé)."); }
    const deploy = await api("POST", `/services/${service.id}/deploys`, { clearCache: "do_not_clear" });
    deployId = deploy.id; console.log(`Nouveau déploiement demandé : ${deployId}`);
  } else {
    console.log(`Création du service web « ${NAME} » depuis ${REPO}…`);
    const created = await api("POST", "/services", { ...SERVICE, ownerId: owner.id });
    service = created.service; deployId = created.deployId; nouveau = true;
    console.log(`Service créé : ${service.id}\nAdresse : ${service.serviceDetails?.url ?? "(en attente)"}`);
  }
  const started = Date.now(); let status = "";
  while (Date.now() - started < 15 * 60 * 1000) {
    const deploy = await api("GET", `/services/${service.id}/deploys/${deployId}`);
    if (deploy.status !== status) { status = deploy.status; console.log(`  ${new Date().toLocaleTimeString("fr-FR")}  ${status}`); }
    if (status === "live") break;
    if (/failed|canceled|deactivated/.test(status)) throw new Error(`Déploiement en état « ${status} ». Journal : https://dashboard.render.com/web/${service.id}/deploys/${deployId}`);
    await sleep(8000);
  }
  if (status !== "live") throw new Error("Délai dépassé : pas d'état « live » en 15 minutes.");
  console.log(`\nEn ligne : ${service.serviceDetails?.url}\nTableau de bord : https://dashboard.render.com/web/${service.id}`);
  if (nouveau && !process.env.ADMIN_PASSWORD) console.log(`\nMot de passe initial de la direction (identifiant « direction ») : ${ADMIN}\nÀ changer à la première connexion ; il n'est affiché qu'ici.`);
}
main().catch((e) => { console.error(`\nÉchec : ${e.message}`); if (/repo|github|access|permission/i.test(e.message)) console.error("Render n'a pas accès au dépôt : le rendre public ou autoriser l'application GitHub de Render (https://github.com/apps/render/installations/new)."); process.exit(1); });
