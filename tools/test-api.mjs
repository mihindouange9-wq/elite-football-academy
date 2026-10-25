// Test de bout en bout de l'API : rôles, parcours complets des neuf piliers, persistance après redémarrage.
// Lance son propre serveur sur un dossier de données temporaire ; ne touche jamais aux vraies données.
// node tools/test-api.mjs
import { spawn } from "node:child_process";
import { mkdtemp, rm, copyFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as attendre } from "node:timers/promises";

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 5699;
const BASE = `http://127.0.0.1:${PORT}`;
const DATA = await mkdtemp(join(tmpdir(), "elite-api-"));
/* on part des JSON de la v1 pour vérifier la reprise */
await mkdir(DATA, { recursive: true });
for (const f of ["categories.json", "seances.json", "settings.json"]) await copyFile(join(RACINE, "data", f), join(DATA, f)).catch(() => {});

const results = [];
const ok = (name, pass, detail = "") => { results.push(`${pass ? "OK   " : "ÉCHEC"} ${name}${detail ? " — " + detail : ""}`); };
let serveur;
function demarrer() { serveur = spawn(process.execPath, ["--no-warnings", "server.js"], { cwd: RACINE, env: { ...process.env, DATA_DIR: DATA, PORT: String(PORT), ADMIN_PASSWORD: "TestAdmin2026" }, stdio: "ignore" }); }
async function pret() { for (let i = 0; i < 40; i++) { try { if ((await fetch(BASE + "/api/public")).ok) return; } catch { /* attente */ } await attendre(250); } throw new Error("serveur injoignable"); }
function client() {
  let cookie = "";
  const call = async (method, path, body) => {
    const r = await fetch(BASE + path, { method, headers: { "Content-Type": "application/json", "X-Requested-With": "fetch", Cookie: cookie }, body: body ? JSON.stringify(body) : undefined });
    const sc = r.headers.get("set-cookie"); if (sc) cookie = sc.split(";")[0];
    let data = null; try { data = await r.json(); } catch { /* vide */ }
    return { status: r.status, data };
  };
  return { call, get: (p) => call("GET", p), post: (p, b) => call("POST", p, b), put: (p, b) => call("PUT", p, b), patch: (p, b) => call("PATCH", p, b), del: (p) => call("DELETE", p) };
}

try {
  demarrer(); await pret();
  const dir = client(), coach = client(), parent = client(), anon = client();

  /* reprise v1 + accès public */
  const pub = (await anon.get("/api/public")).data;
  ok("reprise v1 : quatre catégories et cinq séances", pub.categories.length === 4 && pub.seances.length === 5, `${pub.categories.length} cat, ${pub.seances.length} séances`);
  ok("public : aucun compte ni donnée sensible exposée", !("adminPassword" in pub) && !("users" in pub));
  /* protections */
  ok("API direction refusée sans session", (await anon.get("/api/direction/dashboard")).status === 401);
  ok("mutation refusée sans en-tête X-Requested-With", (await fetch(BASE + "/api/inscriptions", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })).status === 403);
  ok("mauvais mot de passe refusé", (await dir.post("/api/auth/login", { login: "direction", password: "faux" })).status === 401);
  /* direction */
  const login = await dir.post("/api/auth/login", { login: "direction", password: "TestAdmin2026" });
  ok("connexion direction (ADMIN_PASSWORD) et cookie HttpOnly", login.status === 200 && login.data.user.role === "direction");
  const dash0 = (await dir.get("/api/direction/dashboard")).data;
  ok("tableau de bord vide : indicateurs à zéro ou absents, jamais inventés", dash0.kpis.joueurs === 0 && dash0.kpis.conversion === null && dash0.kpis.presence30 === null && dash0.finances.pointMort === null);
  /* demande d'inscription publique → conversion en joueur */
  const insKo = await anon.post("/api/inscriptions", { enfant: { nom: "Test Enfant" }, parent: { nom: "Parent", tel: "077000001" } });
  ok("inscription sans consentement refusée", insKo.status === 400);
  const ins = await anon.post("/api/inscriptions", { enfant: { nom: "Awa Nzé", age: "12", filiere: "Sport-Études", poste: "Milieu" }, parent: { nom: "Marie Nzé", tel: "077 00 00 01", quartier: "Akanda" }, message: "Disponible le samedi", consent: true });
  ok("inscription publique enregistrée", ins.status === 201 && ins.data.id);
  const conv = await dir.post(`/api/direction/inscriptions/${ins.data.id}/convertir`, { categorie_id: "u10_u12" });
  ok("demande convertie en joueur", conv.status === 201 && conv.data.player_id);
  const J1 = conv.data.player_id;
  const j2 = await dir.post("/api/direction/joueurs", { name: "Yann Obame", birth_year: 2011, categorie_id: "u13_u15", filiere: "Loisirs", parent_name: "Paul Obame", parent_phone: "066000002" });
  ok("joueur créé directement", j2.status === 201);
  const J2 = j2.data.id;
  /* coach */
  const c = await dir.post("/api/direction/utilisateurs", { role: "coach", name: "Coach Test", phone: "074000003" });
  ok("compte coach créé avec mot de passe temporaire", c.status === 201 && c.data.password && c.data.password.length === 8);
  await dir.put("/api/direction/categories/u10_u12", { coach_id: c.data.id });
  const cl = await coach.post("/api/auth/login", { login: "074000003", password: c.data.password });
  ok("connexion coach par numéro de téléphone", cl.status === 200 && cl.data.user.must_change === true);
  ok("coach : espace direction interdit", (await coach.get("/api/direction/dashboard")).status === 403);
  const esp = (await coach.get("/api/coach/espace")).data;
  ok("coach : ne voit que ses groupes et leurs joueurs", esp.categories.length === 1 && esp.joueurs.length === 1 && esp.joueurs[0].id === J1, `${esp.categories.length} groupe, ${esp.joueurs.length} joueur`);
  ok("coach : joueur d'un autre groupe inaccessible", (await coach.get(`/api/joueurs/${J2}/passeport`)).status === 403);
  const pr = await coach.post("/api/presences", { date: "2026-10-20", seance_id: esp.seances[0]?.id, presences: [{ player_id: J1, status: "présent" }, { player_id: J2, status: "présent" }] });
  ok("présences : seuls les joueurs du coach sont enregistrés", pr.status === 200 && pr.data.n === 1, `n=${pr.data.n}`);
  await coach.post("/api/presences", { date: "2026-10-22", presences: [{ player_id: J1, status: "absent", note: "malade" }] });
  const ev = await coach.post(`/api/joueurs/${J1}/evaluations`, { technique: 7, physique: 6.5, tactique: 6, mental: 8, scolaire: 7, commentaire: "Bon trimestre" });
  ok("évaluation trimestrielle saisie par le coach", ev.status === 200 && /T1|T2|T3/.test(ev.data.trimestre));
  ok("note hors barème refusée", (await coach.post(`/api/joueurs/${J1}/evaluations`, { technique: 12 })).status === 400);
  const sc = await coach.post(`/api/joueurs/${J1}/scolaire`, { moyenne: 8.5 });
  ok("suivi scolaire : moyenne sous le seuil → non éligible au tournoi (règle active)", sc.status === 200 && sc.data.statut.sousSeuil === true && sc.data.statut.eligibleTournoi === false);
  await dir.put("/api/direction/parametres", { regle_tournoi: "non" });
  const pp = (await dir.get(`/api/joueurs/${J1}/passeport`)).data;
  ok("règle désactivée par la direction → éligible malgré la moyenne", pp.scolaireStatut.eligibleTournoi === true && pp.scolaireStatut.regleActive === false);
  await dir.put("/api/direction/parametres", { regle_tournoi: "oui" });
  ok("passeport : radar, présences et scolaire cohérents", pp.evaluations.length === 1 && pp.presence.n === 2 && pp.presence.taux === 50 && pp.scolaire.length === 1);
  /* parent */
  const cp = await dir.post(`/api/direction/joueurs/${J1}/compte-parent`, {});
  ok("compte parent créé depuis le joueur (numéro normalisé 241…)", cp.status === 200 && cp.data.phone === "24177000001" && cp.data.password);
  const pl = await parent.post("/api/auth/login", { login: "077 00 00 01", password: cp.data.password });
  ok("connexion parent", pl.status === 200 && pl.data.user.role === "parent");
  ok("parent : espace coach interdit", (await parent.get("/api/coach/espace")).status === 403);
  const pw = await parent.post("/api/auth/password", { current: cp.data.password, next: "NouveauMdp2026" });
  ok("parent : changement de mot de passe (8 caractères minimum)", pw.status === 200 && (await parent.post("/api/auth/password", { current: "NouveauMdp2026", next: "court" })).status === 400);
  /* échéancier et paiements */
  const month = new Date().toISOString().slice(0, 7);
  const gen = await dir.post(`/api/direction/echeancier/${month}`);
  ok("échéancier mensuel généré pour les joueurs actifs", gen.status === 200 && gen.data.created === 2);
  const esp2 = (await parent.get("/api/parents/espace")).data;
  const enfant = esp2.enfants[0];
  ok("parent : voit son enfant, ses présences, son échéancier, ses documents", esp2.enfants.length === 1 && enfant.id === J1 && enfant.presences.length === 2 && enfant.fees.length === 1 && enfant.fees[0].amount === 50000 && enfant.documents.length === 3);
  const decl = await parent.post(`/api/parents/enfants/${J1}/paiements`, { fee_id: enfant.fees[0].id, amount: 50000, method: "Airtel Money", reference: "AM123456" });
  ok("parent : déclaration Mobile Money enregistrée EN ATTENTE (jamais confirmée seule)", decl.status === 201 && (await dir.get(`/api/direction/echeancier/${month}`)).data.fees.find((f) => f.player_id === J1).status === "due");
  const val = await dir.patch(`/api/direction/paiements/${decl.data.id}`, { status: "validated" });
  const fees2 = (await dir.get(`/api/direction/echeancier/${month}`)).data.fees;
  ok("direction : validation → échéance payée + numéro de reçu", val.status === 200 && /^R\d{4}-0001$/.test(val.data.receipt_no) && fees2.find((f) => f.player_id === J1).status === "paid");
  ok("parent : échéance d'un autre enfant inaccessible", (await parent.post(`/api/parents/enfants/${J2}/paiements`, { amount: 1000 })).status === 403);
  const dash = (await dir.get("/api/direction/dashboard")).data;
  ok("pilotage : conversion, présence, encaissé et impayés calculés sur les données réelles", dash.kpis.conversion === 100 && dash.kpis.presence30 === 50 && dash.kpis.encaisse === 50000 && dash.kpis.impayes === 1 && dash.kpis.occupation === 3);
  await dir.post("/api/direction/depenses", { label: "Ballons", category: "Matériel", amount: 20000 });
  await dir.put("/api/direction/parametres", { charges_fixes: "300000" });
  const rap = (await dir.get(`/api/direction/rapport/${month}`)).data;
  const dash2 = (await dir.get("/api/direction/dashboard")).data;
  const attendu = Math.ceil(300000 / dash2.finances.cotisationMoyenne);
  ok("rapport mensuel : recettes, dépenses, solde ; point mort = charges fixes / cotisation moyenne", rap.totaux.recettes === 50000 && rap.totaux.depenses === 20000 && rap.totaux.solde === 30000 && dash2.finances.cotisationMoyenne === 37500 && dash2.finances.pointMort === attendu, `moyenne ${dash2.finances.cotisationMoyenne}, point mort ${dash2.finances.pointMort}`);
  /* détection en ligne */
  const det = await dir.post("/api/direction/detections", { date: "2027-01-15", heure: "09:00", lieu: "Terrain d'Akanda", titre: "Détection de janvier", places: 2 });
  const cand = await anon.post(`/api/detections/${det.data.id}/candidats`, { nom: "Kevin Mba", age: "11", parent_nom: "Jean Mba", parent_tel: "062000004", consent: true });
  const doublon = await anon.post(`/api/detections/${det.data.id}/candidats`, { nom: "kevin mba", age: "11", parent_nom: "Jean Mba", parent_tel: "062000004", consent: true });
  await anon.post(`/api/detections/${det.data.id}/candidats`, { nom: "Second", parent_nom: "P", parent_tel: "062000005", consent: true });
  const plein = await anon.post(`/api/detections/${det.data.id}/candidats`, { nom: "Trois", parent_nom: "P", parent_tel: "062000006", consent: true });
  ok("détection : dossard attribué, doublon détecté, places limitées", cand.data.dossard === 1 && doublon.data.deja === true && doublon.data.dossard === 1 && plein.status === 409);
  const cands = (await coach.get(`/api/coach/detections/${det.data.id}/candidats`)).data;
  const note = await coach.put(`/api/candidats/${cands[0].id}`, { note_tech: 7, note_phys: 6, note_jeu: 8, note_mental: 7, present: true, decision: "retenu", commentaire: "Bon pied gauche" });
  ok("coach : grille de notation du jour J", note.status === 200);
  const conv2 = await dir.post(`/api/candidats/${cands[0].id}/convertir`, { categorie_id: "u10_u12", filiere: "Loisirs" });
  ok("candidat retenu converti en joueur en un clic, historique conservé", conv2.status === 201 && (await dir.get(`/api/direction/detections/${det.data.id}/candidats`)).data[0].player_id === conv2.data.player_id);
  /* passeport partagé */
  ok("partage refusé sans autorisation parentale", (await dir.post(`/api/direction/joueurs/${J1}/partage`, { scope: "evaluations" })).status === 400);
  const sh = await parent.post(`/api/parents/enfants/${J1}/partage`, { scope: "evaluations" });
  const shared = (await anon.get(`/api/passeport/${sh.data.token}`)).data;
  ok("lien de partage : évaluations visibles, scolaire et observations exclus", sh.status === 200 && shared.evaluations.length === 1 && shared.scolaire.length === 0 && shared.observations.length === 0 && !("parent_phone" in shared));
  await parent.del(`/api/parents/enfants/${J1}/partage`);
  ok("lien révoqué → 404", (await anon.get(`/api/passeport/${sh.data.token}`)).status === 404);
  /* journal et sauvegarde */
  const journal = (await dir.get("/api/direction/journal")).data;
  ok("journal des actions sensibles alimenté", journal.some((a) => a.action === "paiement-validé") && journal.some((a) => a.action === "partage-révoqué-parent"));
  const exp = (await dir.get("/api/direction/export")).data;
  ok("export de sauvegarde complet", exp.version === 2 && exp.players.length === 3 && exp.payments.length === 1);
  /* persistance après redémarrage */
  serveur.kill(); await attendre(800); demarrer(); await pret();
  const dir2 = client(); await dir2.post("/api/auth/login", { login: "direction", password: "TestAdmin2026" });
  const after = (await dir2.get("/api/direction/dashboard")).data;
  ok("persistance : données intactes après redémarrage du serveur", after.kpis.joueurs === 3 && after.kpis.encaisse === 50000);
  ok("sessions : le cookie d'avant redémarrage est toujours valable", (await parent.get("/api/parents/espace")).status === 200);
  const imp = await dir2.post("/api/direction/import", exp);
  ok("restauration depuis l'export", imp.status === 200 && (await dir2.get("/api/direction/dashboard")).data.kpis.joueurs === 3);
} catch (e) { results.push("ÉCHEC exception : " + e.message); }
finally { if (serveur) serveur.kill(); await attendre(500); await rm(DATA, { recursive: true, force: true }).catch(() => {}); }

console.log(results.join("\n"));
const failed = results.filter((r) => r.startsWith("ÉCHEC")).length;
console.log(`\n${results.length - failed}/${results.length} contrôles réussis`);
process.exit(failed ? 1 : 0);
