/* ============================================================
   Elite Football Academy — serveur v2 (Node natif, zéro dépendance)
   Site public + API + trois espaces connectés : direction, coachs, parents.
   Lancer : node server.js   (DATA_DIR, PORT, ADMIN_PASSWORD, SECURE_COOKIES en variables d'environnement)
   ============================================================ */
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const D = require("./lib/db");
const A = require("./lib/auth");

const PORT = process.env.PORT || 5600;
const PUBLIC_DIR = path.join(__dirname, "public");
const SECURE = process.env.SECURE_COOKIES === "1" || !!process.env.RENDER;
const repris = D.bootstrap(A);

/* ---------- utilitaires HTTP ---------- */
const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".webp": "image/webp", ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml" };
const SECURITY = { "X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY", "Referrer-Policy": "strict-origin-when-cross-origin", "Permissions-Policy": "camera=(), microphone=(), geolocation=()" };
class HttpError extends Error { constructor(code, msg) { super(msg); this.code = code; } }
const bad = (msg) => { throw new HttpError(400, msg); };
function json(res, code, obj, extra = {}) { const b = JSON.stringify(obj); res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...SECURITY, ...extra }); res.end(b); }
function body(req) { return new Promise((resolve) => { let d = ""; req.on("data", (c) => { d += c; if (d.length > 2e6) req.destroy(); }); req.on("end", () => { try { resolve(JSON.parse(d || "{}")); } catch { resolve({}); } }); }); }
const S = (v, n = 120) => String(v == null ? "" : v).trim().slice(0, n);
const N = (v, d = 0) => { const n = Number(v); return Number.isFinite(n) ? n : d; };
const note10 = (v) => { if (v === "" || v == null) return null; const n = Number(v); if (!Number.isFinite(n) || n < 0 || n > 10) bad("Les notes vont de 0 à 10"); return Math.round(n * 2) / 2; };
const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v);
const isMonth = (v) => /^\d{4}-\d{2}$/.test(v);
const isTrim = (v) => /^\d{4}-\d{4}-T[123]$/.test(v);
const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const ip = (req) => (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").toString().split(",")[0].trim();

function serveStatic(req, res) {
  let u = decodeURIComponent(req.url.split("?")[0]);
  const routes = { "/": "/index.html", "/admin": "/admin/index.html", "/admin/": "/admin/index.html", "/direction": "/admin/index.html", "/coach": "/coach/index.html", "/coach/": "/coach/index.html", "/parents": "/parents/index.html", "/parents/": "/parents/index.html", "/connexion": "/connexion.html", "/mentions-legales": "/mentions-legales.html", "/confidentialite": "/confidentialite.html" };
  if (routes[u]) u = routes[u];
  if (/^\/passeport\/[A-Za-z0-9]+$/.test(u)) u = "/passeport.html";
  const fp = path.join(PUBLIC_DIR, path.normalize(u).replace(/^([/\\])+/, ""));
  if (!fp.startsWith(PUBLIC_DIR)) { res.writeHead(403, SECURITY); return res.end("Forbidden"); }
  fs.readFile(fp, (e, c) => {
    if (e) { res.writeHead(404, { "Content-Type": "text/html; charset=utf-8", ...SECURITY }); return res.end(`<!doctype html><meta charset="utf-8"><title>Page introuvable</title><body style="font-family:sans-serif;padding:3rem"><h1>Page introuvable</h1><p><a href="/">Retour à l'accueil</a></p>`); }
    const ext = path.extname(fp).toLowerCase();
    const cache = /\.(woff2|png|jpg|jpeg|webp|svg|ico)$/.test(ext) || fp.includes(`${path.sep}vendor${path.sep}`) ? "public, max-age=604800" : "no-cache";
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream", "Cache-Control": cache, ...SECURITY }); res.end(c);
  });
}

/* ---------- accès ---------- */
function currentUser(req) { return A.userFromToken(A.parseCookies(req).efa_session); }
function requireRole(user, ...roles) { if (!user) throw new HttpError(401, "Connexion requise"); if (!roles.includes(user.role)) throw new HttpError(403, "Accès réservé"); }
/** Les coachs ne voient que les catégories qui leur sont attribuées (ou dont ils assurent une séance). */
function coachCategoryIds(user) {
  if (user.role === "direction") return D.all("SELECT id FROM categories").map((c) => c.id);
  const ids = new Set(D.all("SELECT id FROM categories WHERE coach_id=?", user.id).map((c) => c.id));
  for (const s of D.all("SELECT categorie_id FROM seances WHERE coach_id=?", user.id)) if (s.categorie_id) ids.add(s.categorie_id);
  return [...ids];
}
function playerAccessible(user, player) {
  if (!player) throw new HttpError(404, "Joueur introuvable");
  if (user.role === "direction") return player;
  if (user.role === "parent") { if (player.parent_id !== user.id) throw new HttpError(403, "Accès réservé"); return player; }
  if (!coachCategoryIds(user).includes(player.categorie_id)) throw new HttpError(403, "Ce joueur n'est pas dans vos groupes");
  return player;
}
const player = (id) => D.get("SELECT * FROM players WHERE id=?", id);
const catName = (id) => (id && D.get("SELECT name FROM categories WHERE id=?", id)?.name) || "";

/* ---------- calculs métier ---------- */
function presenceRate(where = "", ...p) {
  const r = D.get(`SELECT SUM(CASE WHEN status IN ('présent','retard') THEN 1 ELSE 0 END) ok, COUNT(*) n FROM attendance ${where}`, ...p);
  return r && r.n ? { taux: Math.round((100 * r.ok) / r.n), n: r.n } : { taux: null, n: 0 };
}
function schoolStatus(p, s) {
  const trim = D.trimestreOf();
  const r = D.get("SELECT moyenne FROM school_results WHERE player_id=? AND trimestre=?", p.id, trim);
  const prev = D.get("SELECT moyenne FROM school_results WHERE player_id=? AND trimestre<? ORDER BY trimestre DESC LIMIT 1", p.id, trim);
  const min = N(s.moyenne_min, 10);
  const aJour = !!r && r.moyenne != null;
  const baisse = r && prev && prev.moyenne != null && r.moyenne < prev.moyenne - 1;
  const sousSeuil = r && r.moyenne != null && r.moyenne < min;
  const regle = s.regle_tournoi === "oui" && p.filiere === "Sport-Études";
  return { trimestre: trim, moyenne: r ? r.moyenne : null, precedente: prev ? prev.moyenne : null, aJour, baisse: !!baisse, sousSeuil: !!sousSeuil, regleActive: regle, eligibleTournoi: regle ? aJour && !sousSeuil : true };
}
function passport(p, scope = "complet") {
  const evals = D.all("SELECT trimestre, technique, physique, tactique, mental, scolaire, commentaire, created_at, updated_at FROM evaluations WHERE player_id=? ORDER BY trimestre", p.id);
  const school = scope === "complet" ? D.all("SELECT trimestre, moyenne, commentaire FROM school_results WHERE player_id=? ORDER BY trimestre", p.id) : [];
  const pres = presenceRate("WHERE player_id=?", p.id);
  const age = p.birth_year ? new Date().getFullYear() - p.birth_year : null;
  return { id: p.id, name: p.name, age, birth_year: p.birth_year, categorie: catName(p.categorie_id), filiere: p.filiere, poste: p.poste, statut: p.statut, saison: D.settings().saison, evaluations: evals, scolaire: school, presence: pres, observations: scope === "complet" ? D.all("SELECT date, texte FROM observations WHERE player_id=? ORDER BY date DESC LIMIT 20", p.id) : [] };
}
function dashboard() {
  const s = D.settings();
  const INS = D.all("SELECT status, created_at FROM inscriptions");
  const actifs = D.all("SELECT * FROM players WHERE statut='actif'");
  const month = D.monthOf();
  const fees = D.all("SELECT f.*, p.name FROM fees f JOIN players p ON p.id=f.player_id WHERE f.month=?", month);
  const attendus = fees.reduce((a, f) => a + (f.status === "waived" ? 0 : f.amount), 0);
  const encaisse = fees.filter((f) => f.status === "paid").reduce((a, f) => a + f.amount, 0);
  const impayes = fees.filter((f) => f.status === "due");
  const recettesMois = D.get("SELECT COALESCE(SUM(amount),0) t FROM payments WHERE status='validated' AND substr(validated_at,1,7)=?", month).t;
  const depensesMois = D.get("SELECT COALESCE(SUM(amount),0) t FROM expenses WHERE substr(date,1,7)=?", month).t;
  const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const pres30 = presenceRate("WHERE date>=?", since);
  const parStatut = {}; for (const st of ["nouveau", "contacté", "détection", "inscrit", "refusé"]) parStatut[st] = INS.filter((i) => i.status === st).length;
  const conversion = INS.length ? Math.round((100 * parStatut.inscrit) / INS.length) : null;
  const ins7 = []; for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const k = d.toISOString().slice(0, 10); ins7.push({ jour: d.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit" }), n: INS.filter((x) => String(x.created_at).slice(0, 10) === k).length }); }
  const cats = D.all("SELECT c.id, c.name, c.capacity, COUNT(p.id) n FROM categories c LEFT JOIN players p ON p.categorie_id=c.id AND p.statut='actif' GROUP BY c.id ORDER BY c.position");
  const capacite = N(s.capacite, 0);
  const chargesFixes = N(s.charges_fixes, 0);
  const cotisationMoyenne = actifs.length ? Math.round(actifs.reduce((a, p) => a + (p.exonere ? 0 : p.cotisation), 0) / actifs.length) : 0;
  const pointMort = chargesFixes > 0 && cotisationMoyenne > 0 ? Math.ceil(chargesFixes / cotisationMoyenne) : null;
  const paiementsEnAttente = D.get("SELECT COUNT(*) n FROM payments WHERE status='pending'").n;
  const detAvenir = D.all("SELECT d.*, (SELECT COUNT(*) FROM candidates c WHERE c.detection_id=d.id) inscrits FROM detections d WHERE statut='à venir' ORDER BY date");
  const scolaire = actifs.filter((p) => p.filiere === "Sport-Études").map((p) => ({ nom: p.name, ...schoolStatus(p, s) }));
  const alertesScolaires = scolaire.filter((x) => x.baisse || x.sousSeuil || !x.aJour);
  const medicalPerime = actifs.filter((p) => !p.medical_until || p.medical_until < D.today()).length;
  return {
    kpis: { demandes: INS.length, nouvelles: parStatut.nouveau, joueurs: actifs.length, sportEtudes: actifs.filter((p) => p.filiere === "Sport-Études").length, conversion, presence30: pres30.taux, presenceN: pres30.n, attendus, encaisse, impayes: impayes.length, impayesMontant: impayes.reduce((a, f) => a + f.amount, 0), paiementsEnAttente, capacite, occupation: capacite ? Math.round((100 * actifs.length) / capacite) : null, detections: detAvenir.length, medicalPerime, alertesScolaires: alertesScolaires.length },
    parStatut, ins7, categories: cats, month,
    finances: { recettesMois, depensesMois, solde: recettesMois - depensesMois, chargesFixes, cotisationMoyenne, pointMort, echeancierGenere: fees.length > 0 },
    impayes: impayes.slice(0, 12).map((f) => ({ player_id: f.player_id, nom: f.name, montant: f.amount })),
    detections: detAvenir, alertesScolaires: alertesScolaires.slice(0, 10),
    dernieres: D.all("SELECT id, created_at, status, enfant_nom, enfant_age, filiere, parent_nom, parent_tel FROM inscriptions ORDER BY created_at DESC LIMIT 6"),
    demarrage: { categories: cats.length, joueurs: actifs.length, seances: D.get("SELECT COUNT(*) n FROM seances").n, coachs: D.get("SELECT COUNT(*) n FROM users WHERE role='coach' AND active=1").n, echeancier: fees.length > 0 },
  };
}
function monthReport(month) {
  const fees = D.all("SELECT f.*, p.name, p.filiere FROM fees f JOIN players p ON p.id=f.player_id WHERE f.month=? ORDER BY p.name", month);
  const payments = D.all("SELECT pay.*, p.name FROM payments pay JOIN players p ON p.id=pay.player_id WHERE pay.status='validated' AND substr(pay.validated_at,1,7)=? ORDER BY pay.validated_at", month);
  const expenses = D.all("SELECT * FROM expenses WHERE substr(date,1,7)=? ORDER BY date", month);
  const att = presenceRate("WHERE substr(date,1,7)=?", month);
  const ins = D.get("SELECT COUNT(*) n FROM inscriptions WHERE substr(created_at,1,7)=?", month).n;
  const recettes = payments.reduce((a, p) => a + p.amount, 0), depenses = expenses.reduce((a, e) => a + e.amount, 0);
  return { month, saison: D.settings().saison, joueursActifs: D.get("SELECT COUNT(*) n FROM players WHERE statut='actif'").n, demandes: ins, presence: att, fees, payments, expenses, totaux: { attendus: fees.filter((f) => f.status !== "waived").reduce((a, f) => a + f.amount, 0), encaisse: fees.filter((f) => f.status === "paid").reduce((a, f) => a + f.amount, 0), impayes: fees.filter((f) => f.status === "due").reduce((a, f) => a + f.amount, 0), recettes, depenses, solde: recettes - depenses } };
}
function generateFees(month) {
  const s = D.settings();
  let created = 0;
  D.tx(() => {
    for (const p of D.all("SELECT * FROM players WHERE statut='actif'")) {
      if (D.get("SELECT id FROM fees WHERE player_id=? AND month=?", p.id, month)) continue;
      const amount = p.cotisation || N(p.filiere === "Sport-Études" ? s.tarif_sport_etudes : s.tarif_loisirs);
      D.run("INSERT INTO fees(id,player_id,month,amount,status) VALUES(?,?,?,?,?)", D.uid("F-"), p.id, month, amount, p.exonere ? "waived" : "due"); created++;
    }
  });
  return created;
}
function nextReceiptNo() { const y = new Date().getFullYear(); const n = D.get("SELECT COUNT(*) n FROM payments WHERE receipt_no LIKE ?", `R${y}-%`).n + 1; return `R${y}-${String(n).padStart(4, "0")}`; }
function validatePayment(pay, user) {
  D.tx(() => {
    D.run("UPDATE payments SET status='validated', validated_at=?, validated_by=?, receipt_no=? WHERE id=?", D.now(), user.id, nextReceiptNo(), pay.id);
    if (pay.fee_id) D.run("UPDATE fees SET status='paid', paid_at=? WHERE id=?", D.today(), pay.fee_id);
  });
}
function playerOut(p) { return { ...p, categorie: catName(p.categorie_id), age: p.birth_year ? new Date().getFullYear() - p.birth_year : null, parent_compte: !!p.parent_id }; }

/* ---------- routeur ---------- */
async function api(req, res, url, m, user) {
  const seg = url.split("/").filter(Boolean); // ['api', ...]
  const b = m === "GET" || m === "DELETE" ? {} : await body(req);
  if (m !== "GET" && req.headers["x-requested-with"] !== "fetch") throw new HttpError(403, "Requête refusée");
  const s = D.settings();
  const R = (route, methods) => seg.join("/") === route && methods.includes(m);
  const M = (pattern) => { const parts = pattern.split("/").filter(Boolean); if (parts.length !== seg.length) return null; const params = {}; for (let i = 0; i < parts.length; i++) { if (parts[i].startsWith(":")) params[parts[i].slice(1)] = seg[i]; else if (parts[i] !== seg[i]) return null; } return params; };
  let p;

  /* ===== public ===== */
  if (R("api/public", ["GET"])) {
    const pub = { nom: s.nom, slogan: s.slogan, whatsapp: s.whatsapp, facebook: s.facebook, instagram: s.instagram, lieu: s.lieu, saison: s.saison, tarif_sport_etudes: N(s.tarif_sport_etudes), tarif_loisirs: N(s.tarif_loisirs), fondateur: s.fondateur, email: s.email, mobile_money: s.mobile_money, moyenne_min: N(s.moyenne_min), regle_tournoi: s.regle_tournoi };
    const categories = D.all("SELECT id, name, tranche, jours, capacity FROM categories ORDER BY position");
    const seances = D.all("SELECT s.jour, s.debut, s.fin, s.type, s.lieu, c.name categorie FROM seances s LEFT JOIN categories c ON c.id=s.categorie_id");
    const detections = D.all("SELECT d.id, d.date, d.heure, d.lieu, d.titre, d.description, d.places, d.open_public, (SELECT COUNT(*) FROM candidates c WHERE c.detection_id=d.id) inscrits FROM detections d WHERE statut='à venir' AND date>=? ORDER BY date", D.today());
    const news = D.all("SELECT n.id, n.date, n.type, n.title, n.body, c.name categorie FROM news n LEFT JOIN categories c ON c.id=n.categorie_id WHERE n.public=1 ORDER BY n.date DESC LIMIT 6");
    const coachs = D.all("SELECT u.name, GROUP_CONCAT(c.name, ' · ') groupes FROM users u LEFT JOIN categories c ON c.coach_id=u.id WHERE u.role='coach' AND u.active=1 GROUP BY u.id ORDER BY u.name");
    return json(res, 200, { ...pub, categories, seances, detections, news, coachs, effectif: D.get("SELECT COUNT(*) n FROM players WHERE statut='actif'").n });
  }
  if (R("api/inscriptions", ["POST"])) {
    const e = b.enfant || {}, pa = b.parent || {};
    if (!S(e.nom) || !S(pa.nom) || !S(pa.tel)) bad("Nom de l'enfant, nom du parent et téléphone requis.");
    if (!b.consent) bad("Le consentement du responsable légal est requis.");
    const id = D.uid("INS-");
    D.run("INSERT INTO inscriptions(id,created_at,enfant_nom,enfant_age,poste,filiere,niveau,parent_nom,parent_tel,parent_email,quartier,message,status,consent) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,1)", id, D.now(), S(e.nom), S(e.age, 10), S(e.poste, 40), S(e.filiere, 40), S(e.niveau, 80), S(pa.nom), S(pa.tel, 40), S(pa.email), S(pa.quartier, 80), S(b.message, 600), "nouveau");
    return json(res, 201, { ok: true, id });
  }
  if ((p = M("api/detections/:id/candidats")) && m === "POST") {
    const d = D.get("SELECT * FROM detections WHERE id=? AND statut='à venir' AND open_public=1", p.id);
    if (!d) throw new HttpError(404, "Cette journée de détection n'accepte plus d'inscriptions.");
    if (!S(b.nom) || !S(b.parent_tel) || !S(b.parent_nom)) bad("Nom du jeune, nom et téléphone du parent requis.");
    if (!b.consent) bad("Le consentement du responsable légal est requis.");
    const tel = A.normPhone(b.parent_tel);
    const doublon = D.get("SELECT dossard FROM candidates WHERE detection_id=? AND lower(nom)=lower(?) AND parent_tel=?", d.id, S(b.nom), tel);
    if (doublon) return json(res, 200, { ok: true, dossard: doublon.dossard, deja: true });
    const count = D.get("SELECT COUNT(*) n FROM candidates WHERE detection_id=?", d.id).n;
    if (count >= d.places) throw new HttpError(409, "Toutes les places de cette journée sont prises.");
    const dossard = (D.get("SELECT MAX(dossard) mx FROM candidates WHERE detection_id=?", d.id).mx || 0) + 1;
    D.run("INSERT INTO candidates(id,detection_id,dossard,nom,age,poste,parent_nom,parent_tel,quartier,source,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)", D.uid("C-"), d.id, dossard, S(b.nom), S(b.age, 10), S(b.poste, 40), S(b.parent_nom), tel, S(b.quartier, 80), "site", D.now());
    return json(res, 201, { ok: true, dossard });
  }
  if ((p = M("api/passeport/:token")) && m === "GET") {
    const pl = D.get("SELECT * FROM players WHERE share_token=? AND share_token<>''", p.token);
    if (!pl) throw new HttpError(404, "Ce lien n'est plus valide.");
    D.audit(null, "passeport-consulté", pl.id, ip(req));
    return json(res, 200, { ...passport(pl, pl.share_scope === "complet" ? "complet" : "evaluations"), academie: s.nom, partage: true, scope: pl.share_scope });
  }

  /* ===== authentification ===== */
  if (R("api/auth/login", ["POST"])) {
    const r = A.login(b.login, b.password, ip(req));
    if (r.error) return json(res, 401, { error: r.error });
    return json(res, 200, { ok: true, user: r.user }, { "Set-Cookie": A.cookieHeader(r.token, SECURE) });
  }
  if (R("api/auth/logout", ["POST"])) { A.logout(A.parseCookies(req).efa_session); return json(res, 200, { ok: true }, { "Set-Cookie": A.clearCookieHeader() }); }
  if (R("api/auth/me", ["GET"])) { if (!user) return json(res, 401, { error: "Non connecté" }); return json(res, 200, { user: A.publicUser(user), academie: s.nom }); }
  if (R("api/auth/password", ["POST"])) {
    requireRole(user, "direction", "coach", "parent");
    if (!A.verifyPassword(b.current || "", user.password_hash, user.salt)) bad("Mot de passe actuel incorrect.");
    if (!b.next || String(b.next).length < 8) bad("Le nouveau mot de passe doit faire au moins 8 caractères.");
    A.setPassword(user.id, b.next, 0); D.audit(user, "mot-de-passe-changé");
    return json(res, 200, { ok: true });
  }
  if (!user) throw new HttpError(401, "Connexion requise");

  /* ===== commun aux espaces connectés ===== */
  if ((p = M("api/joueurs/:id/passeport")) && m === "GET") { const pl = playerAccessible(user, player(p.id)); return json(res, 200, { ...passport(pl), player: playerOut(pl), scolaireStatut: schoolStatus(pl, s), share: user.role === "direction" || user.role === "parent" ? { token: pl.share_token, scope: pl.share_scope } : undefined }); }
  if ((p = M("api/joueurs/:id/presences")) && m === "GET") { const pl = playerAccessible(user, player(p.id)); return json(res, 200, D.all("SELECT a.date, a.status, a.note, s.type, s.debut, s.fin FROM attendance a LEFT JOIN seances s ON s.id=a.seance_id WHERE a.player_id=? ORDER BY a.date DESC LIMIT 60", pl.id)); }

  /* ===== direction ===== */
  if (seg[1] === "direction") {
    requireRole(user, "direction");
    if (R("api/direction/dashboard", ["GET"])) return json(res, 200, dashboard());
    if ((p = M("api/direction/rapport/:month")) && m === "GET") { if (!isMonth(p.month)) bad("Mois invalide"); return json(res, 200, monthReport(p.month)); }
    if (R("api/direction/journal", ["GET"])) return json(res, 200, D.all("SELECT a.*, u.name user_name FROM audit a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.id DESC LIMIT 200"));
    if (R("api/direction/export", ["GET"])) { D.audit(user, "export-sauvegarde"); return json(res, 200, D.exportAll(), { "Content-Disposition": `attachment; filename="elite-sauvegarde-${D.today()}.json"` }); }
    if (R("api/direction/import", ["POST"])) { D.importAll(b); D.audit(user, "import-sauvegarde"); return json(res, 200, { ok: true }); }

    /* demandes d'inscription */
    if (R("api/direction/inscriptions", ["GET"])) return json(res, 200, D.all("SELECT * FROM inscriptions ORDER BY created_at DESC"));
    if ((p = M("api/direction/inscriptions/:id"))) {
      const it = D.get("SELECT * FROM inscriptions WHERE id=?", p.id); if (!it) throw new HttpError(404, "Demande introuvable");
      if (m === "PATCH") { if (!["nouveau", "contacté", "détection", "inscrit", "refusé"].includes(b.status)) bad("Statut invalide"); D.run("UPDATE inscriptions SET status=? WHERE id=?", b.status, p.id); D.audit(user, "demande-statut", p.id, b.status); return json(res, 200, { ok: true }); }
      if (m === "DELETE") { D.run("DELETE FROM inscriptions WHERE id=?", p.id); D.audit(user, "demande-supprimée", p.id); return json(res, 200, { ok: true }); }
    }
    if ((p = M("api/direction/inscriptions/:id/convertir")) && m === "POST") {
      const it = D.get("SELECT * FROM inscriptions WHERE id=?", p.id); if (!it) throw new HttpError(404, "Demande introuvable");
      if (it.player_id) return json(res, 200, { ok: true, player_id: it.player_id, deja: true });
      const id = D.uid("J-"); const age = N(it.enfant_age, 0);
      const filiere = it.filiere === "Sport-Études" ? "Sport-Études" : "Loisirs";
      D.tx(() => {
        D.run("INSERT INTO players(id,name,birth_year,categorie_id,filiere,poste,parent_name,parent_phone,quartier,cotisation,statut,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)", id, it.enfant_nom, age ? new Date().getFullYear() - age : null, S(b.categorie_id, 40) || null, filiere, it.poste, it.parent_nom, A.normPhone(it.parent_tel), it.quartier, N(filiere === "Sport-Études" ? s.tarif_sport_etudes : s.tarif_loisirs), "actif", D.now());
        D.run("UPDATE inscriptions SET status='inscrit', player_id=? WHERE id=?", id, p.id);
      });
      D.audit(user, "joueur-créé-depuis-demande", id, it.enfant_nom);
      return json(res, 201, { ok: true, player_id: id });
    }

    /* joueurs */
    if (R("api/direction/joueurs", ["GET"])) return json(res, 200, D.all("SELECT * FROM players ORDER BY name").map(playerOut));
    if (R("api/direction/joueurs", ["POST"])) {
      if (!S(b.name)) bad("Le nom est requis");
      const id = D.uid("J-");
      D.run("INSERT INTO players(id,name,birth_year,sexe,categorie_id,filiere,poste,ecole,classe,parent_name,parent_phone,quartier,cotisation,exonere,medical_until,autorisation,consent_photos,statut,notes,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        id, S(b.name), N(b.birth_year, null) || null, S(b.sexe, 10), S(b.categorie_id, 40) || null, b.filiere === "Sport-Études" ? "Sport-Études" : "Loisirs", S(b.poste, 40), S(b.ecole, 80), S(b.classe, 30), S(b.parent_name), A.normPhone(b.parent_phone), S(b.quartier, 80), b.cotisation != null && b.cotisation !== "" ? N(b.cotisation, 0) : N(b.filiere === "Sport-Études" ? s.tarif_sport_etudes : s.tarif_loisirs), b.exonere ? 1 : 0, isDate(b.medical_until || "") ? b.medical_until : "", b.autorisation ? 1 : 0, b.consent_photos ? 1 : 0, "actif", S(b.notes, 500), D.now());
      D.audit(user, "joueur-créé", id, S(b.name));
      return json(res, 201, { ok: true, id });
    }
    if ((p = M("api/direction/joueurs/:id"))) {
      const pl = player(p.id); if (!pl) throw new HttpError(404, "Joueur introuvable");
      if (m === "PUT") {
        const f = { name: S(b.name ?? pl.name), birth_year: b.birth_year != null ? (N(b.birth_year, 0) || null) : pl.birth_year, sexe: S(b.sexe ?? pl.sexe, 10), categorie_id: b.categorie_id !== undefined ? (S(b.categorie_id, 40) || null) : pl.categorie_id, filiere: b.filiere ? (b.filiere === "Sport-Études" ? "Sport-Études" : "Loisirs") : pl.filiere, poste: S(b.poste ?? pl.poste, 40), ecole: S(b.ecole ?? pl.ecole, 80), classe: S(b.classe ?? pl.classe, 30), parent_name: S(b.parent_name ?? pl.parent_name), parent_phone: b.parent_phone != null ? A.normPhone(b.parent_phone) : pl.parent_phone, quartier: S(b.quartier ?? pl.quartier, 80), cotisation: b.cotisation != null ? N(b.cotisation, 0) : pl.cotisation, exonere: b.exonere != null ? (b.exonere ? 1 : 0) : pl.exonere, medical_until: b.medical_until != null ? (isDate(b.medical_until) ? b.medical_until : "") : pl.medical_until, autorisation: b.autorisation != null ? (b.autorisation ? 1 : 0) : pl.autorisation, consent_photos: b.consent_photos != null ? (b.consent_photos ? 1 : 0) : pl.consent_photos, statut: b.statut ? (b.statut === "inactif" ? "inactif" : "actif") : pl.statut, notes: S(b.notes ?? pl.notes, 500) };
        D.run("UPDATE players SET name=?,birth_year=?,sexe=?,categorie_id=?,filiere=?,poste=?,ecole=?,classe=?,parent_name=?,parent_phone=?,quartier=?,cotisation=?,exonere=?,medical_until=?,autorisation=?,consent_photos=?,statut=?,notes=? WHERE id=?", f.name, f.birth_year, f.sexe, f.categorie_id, f.filiere, f.poste, f.ecole, f.classe, f.parent_name, f.parent_phone, f.quartier, f.cotisation, f.exonere, f.medical_until, f.autorisation, f.consent_photos, f.statut, f.notes, p.id);
        D.audit(user, "joueur-modifié", p.id); return json(res, 200, { ok: true });
      }
      if (m === "DELETE") { D.run("DELETE FROM players WHERE id=?", p.id); D.audit(user, "joueur-supprimé", p.id, pl.name); return json(res, 200, { ok: true }); }
    }
    if ((p = M("api/direction/joueurs/:id/compte-parent")) && m === "POST") {
      const pl = player(p.id); if (!pl) throw new HttpError(404, "Joueur introuvable");
      const phone = A.normPhone(b.phone || pl.parent_phone); if (!phone) bad("Numéro du parent requis");
      let u = D.get("SELECT * FROM users WHERE phone=?", phone), password = null;
      if (!u) { const c = A.createUser({ role: "parent", name: S(b.name || pl.parent_name || "Parent"), phone }); u = { id: c.id }; password = c.password; }
      else if (u.role !== "parent") bad("Ce numéro appartient à un compte non parent");
      D.run("UPDATE players SET parent_id=?, parent_phone=? WHERE id=?", u.id, phone, p.id);
      D.audit(user, "compte-parent", p.id, phone);
      return json(res, 200, { ok: true, phone, password, nouveau: !!password });
    }
    if ((p = M("api/direction/joueurs/:id/partage"))) {
      const pl = player(p.id); if (!pl) throw new HttpError(404, "Joueur introuvable");
      if (m === "POST") { if (!pl.autorisation) bad("Le partage exige l'autorisation écrite du responsable légal (case « autorisation » du joueur)."); const token = crypto.randomBytes(12).toString("hex"); D.run("UPDATE players SET share_token=?, share_scope=? WHERE id=?", token, b.scope === "complet" ? "complet" : "evaluations", p.id); D.audit(user, "partage-créé", p.id, b.scope || "evaluations"); return json(res, 200, { ok: true, token }); }
      if (m === "DELETE") { D.run("UPDATE players SET share_token='' WHERE id=?", p.id); D.audit(user, "partage-révoqué", p.id); return json(res, 200, { ok: true }); }
    }

    /* catégories */
    if (R("api/direction/categories", ["GET"])) return json(res, 200, D.all("SELECT c.*, u.name coach, (SELECT COUNT(*) FROM players p WHERE p.categorie_id=c.id AND p.statut='actif') effectif FROM categories c LEFT JOIN users u ON u.id=c.coach_id ORDER BY c.position"));
    if (R("api/direction/categories", ["POST"])) { if (!S(b.name)) bad("Nom requis"); const id = D.uid("cat-"); D.run("INSERT INTO categories(id,name,tranche,coach_id,jours,capacity,position) VALUES(?,?,?,?,?,?,?)", id, S(b.name, 60), S(b.tranche, 40), S(b.coach_id, 40) || null, S(b.jours, 60), N(b.capacity, 20), D.get("SELECT COALESCE(MAX(position),0)+1 p FROM categories").p); D.audit(user, "catégorie-créée", id); return json(res, 201, { ok: true, id }); }
    if ((p = M("api/direction/categories/:id"))) {
      const c = D.get("SELECT * FROM categories WHERE id=?", p.id); if (!c) throw new HttpError(404, "Catégorie introuvable");
      if (m === "PUT") { D.run("UPDATE categories SET name=?,tranche=?,coach_id=?,jours=?,capacity=? WHERE id=?", S(b.name ?? c.name, 60), S(b.tranche ?? c.tranche, 40), b.coach_id !== undefined ? (S(b.coach_id, 40) || null) : c.coach_id, S(b.jours ?? c.jours, 60), b.capacity != null ? N(b.capacity, 20) : c.capacity, p.id); return json(res, 200, { ok: true }); }
      if (m === "DELETE") { D.run("DELETE FROM categories WHERE id=?", p.id); D.audit(user, "catégorie-supprimée", p.id); return json(res, 200, { ok: true }); }
    }

    /* séances */
    if (R("api/direction/seances", ["GET"])) return json(res, 200, D.all("SELECT s.*, c.name categorie, u.name coach FROM seances s LEFT JOIN categories c ON c.id=s.categorie_id LEFT JOIN users u ON u.id=s.coach_id"));
    if (R("api/direction/seances", ["POST"])) { if (!JOURS.includes(b.jour)) bad("Jour invalide"); const id = D.uid("se-"); D.run("INSERT INTO seances(id,jour,debut,fin,categorie_id,type,lieu,coach_id) VALUES(?,?,?,?,?,?,?,?)", id, b.jour, S(b.debut, 8), S(b.fin, 8), S(b.categorie_id, 40) || null, S(b.type, 30) || "Entraînement", S(b.lieu, 80), S(b.coach_id, 40) || null); return json(res, 201, { ok: true, id }); }
    if ((p = M("api/direction/seances/:id"))) {
      const se = D.get("SELECT * FROM seances WHERE id=?", p.id); if (!se) throw new HttpError(404, "Séance introuvable");
      if (m === "PUT") { D.run("UPDATE seances SET jour=?,debut=?,fin=?,categorie_id=?,type=?,lieu=?,coach_id=? WHERE id=?", JOURS.includes(b.jour) ? b.jour : se.jour, S(b.debut ?? se.debut, 8), S(b.fin ?? se.fin, 8), b.categorie_id !== undefined ? (S(b.categorie_id, 40) || null) : se.categorie_id, S(b.type ?? se.type, 30), S(b.lieu ?? se.lieu, 80), b.coach_id !== undefined ? (S(b.coach_id, 40) || null) : se.coach_id, p.id); return json(res, 200, { ok: true }); }
      if (m === "DELETE") { D.run("DELETE FROM seances WHERE id=?", p.id); return json(res, 200, { ok: true }); }
    }

    /* comptes coachs et parents */
    if (R("api/direction/utilisateurs", ["GET"])) return json(res, 200, D.all("SELECT u.id, u.role, u.name, u.phone, u.email, u.active, u.must_change, u.created_at, (SELECT COUNT(*) FROM players p WHERE p.parent_id=u.id) enfants, (SELECT GROUP_CONCAT(c.name, ' · ') FROM categories c WHERE c.coach_id=u.id) groupes FROM users u WHERE u.role<>'direction' ORDER BY u.role, u.name"));
    if (R("api/direction/utilisateurs", ["POST"])) { if (!["coach", "parent"].includes(b.role)) bad("Rôle invalide"); if (!S(b.name)) bad("Nom requis"); const c = A.createUser({ role: b.role, name: b.name, phone: b.phone, email: b.email }); D.audit(user, "compte-créé", c.id, b.role); return json(res, 201, { ok: true, id: c.id, phone: c.phone, password: c.password }); }
    if ((p = M("api/direction/utilisateurs/:id"))) {
      const u = D.get("SELECT * FROM users WHERE id=? AND role<>'direction'", p.id); if (!u) throw new HttpError(404, "Compte introuvable");
      if (m === "PUT") { D.run("UPDATE users SET name=?, email=?, active=? WHERE id=?", S(b.name ?? u.name), S(b.email ?? u.email), b.active != null ? (b.active ? 1 : 0) : u.active, p.id); if (b.active === false) D.run("DELETE FROM sessions WHERE user_id=?", p.id); D.audit(user, "compte-modifié", p.id); return json(res, 200, { ok: true }); }
      if (m === "DELETE") { D.run("DELETE FROM users WHERE id=?", p.id); D.audit(user, "compte-supprimé", p.id, u.phone); return json(res, 200, { ok: true }); }
    }
    if ((p = M("api/direction/utilisateurs/:id/mot-de-passe")) && m === "POST") { const u = D.get("SELECT id FROM users WHERE id=? AND role<>'direction'", p.id); if (!u) throw new HttpError(404, "Compte introuvable"); const pwd = A.generatePassword(); A.setPassword(p.id, pwd, 1); D.run("DELETE FROM sessions WHERE user_id=?", p.id); D.audit(user, "mot-de-passe-réinitialisé", p.id); return json(res, 200, { ok: true, password: pwd }); }

    /* détections et candidats */
    if (R("api/direction/detections", ["GET"])) return json(res, 200, D.all("SELECT d.*, (SELECT COUNT(*) FROM candidates c WHERE c.detection_id=d.id) inscrits, (SELECT COUNT(*) FROM candidates c WHERE c.detection_id=d.id AND c.decision='retenu') retenus FROM detections d ORDER BY date DESC"));
    if (R("api/direction/detections", ["POST"])) { if (!isDate(b.date || "")) bad("Date invalide"); const id = D.uid("det-"); D.run("INSERT INTO detections(id,date,heure,lieu,titre,description,places,statut,open_public) VALUES(?,?,?,?,?,?,?,?,?)", id, b.date, S(b.heure, 8), S(b.lieu, 80), S(b.titre, 100) || "Journée de détection", S(b.description, 500), N(b.places, 40), "à venir", b.open_public === false ? 0 : 1); D.audit(user, "détection-créée", id); return json(res, 201, { ok: true, id }); }
    if ((p = M("api/direction/detections/:id"))) {
      const d = D.get("SELECT * FROM detections WHERE id=?", p.id); if (!d) throw new HttpError(404, "Détection introuvable");
      if (m === "PUT") { D.run("UPDATE detections SET date=?,heure=?,lieu=?,titre=?,description=?,places=?,statut=?,open_public=? WHERE id=?", isDate(b.date || "") ? b.date : d.date, S(b.heure ?? d.heure, 8), S(b.lieu ?? d.lieu, 80), S(b.titre ?? d.titre, 100), S(b.description ?? d.description, 500), b.places != null ? N(b.places, 40) : d.places, ["à venir", "passée"].includes(b.statut) ? b.statut : d.statut, b.open_public != null ? (b.open_public ? 1 : 0) : d.open_public, p.id); return json(res, 200, { ok: true }); }
      if (m === "DELETE") { D.run("DELETE FROM detections WHERE id=?", p.id); D.audit(user, "détection-supprimée", p.id); return json(res, 200, { ok: true }); }
    }
    if ((p = M("api/direction/detections/:id/candidats"))) {
      const d = D.get("SELECT * FROM detections WHERE id=?", p.id); if (!d) throw new HttpError(404, "Détection introuvable");
      if (m === "GET") return json(res, 200, D.all("SELECT * FROM candidates WHERE detection_id=? ORDER BY dossard", p.id));
      if (m === "POST") { if (!S(b.nom)) bad("Nom requis"); const dossard = (D.get("SELECT MAX(dossard) mx FROM candidates WHERE detection_id=?", d.id).mx || 0) + 1; const id = D.uid("C-"); D.run("INSERT INTO candidates(id,detection_id,dossard,nom,age,poste,parent_nom,parent_tel,quartier,source,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)", id, d.id, dossard, S(b.nom), S(b.age, 10), S(b.poste, 40), S(b.parent_nom), A.normPhone(b.parent_tel), S(b.quartier, 80), "direction", D.now()); return json(res, 201, { ok: true, id, dossard }); }
    }
  }

  /* ===== direction + coach : candidats (notation), présences, évaluations, observations, scolaire ===== */
  if ((p = M("api/candidats/:id"))) {
    requireRole(user, "direction", "coach");
    const c = D.get("SELECT * FROM candidates WHERE id=?", p.id); if (!c) throw new HttpError(404, "Candidat introuvable");
    if (m === "PUT") { D.run("UPDATE candidates SET note_tech=?,note_phys=?,note_jeu=?,note_mental=?,commentaire=?,decision=?,present=?,poste=? WHERE id=?", b.note_tech !== undefined ? note10(b.note_tech) : c.note_tech, b.note_phys !== undefined ? note10(b.note_phys) : c.note_phys, b.note_jeu !== undefined ? note10(b.note_jeu) : c.note_jeu, b.note_mental !== undefined ? note10(b.note_mental) : c.note_mental, S(b.commentaire ?? c.commentaire, 400), b.decision !== undefined ? (["", "retenu", "liste d'attente", "non retenu"].includes(b.decision) ? b.decision : c.decision) : c.decision, b.present != null ? (b.present ? 1 : 0) : c.present, S(b.poste ?? c.poste, 40), p.id); return json(res, 200, { ok: true }); }
    if (m === "DELETE") { requireRole(user, "direction"); D.run("DELETE FROM candidates WHERE id=?", p.id); return json(res, 200, { ok: true }); }
  }
  if ((p = M("api/candidats/:id/convertir")) && m === "POST") {
    requireRole(user, "direction");
    const c = D.get("SELECT * FROM candidates WHERE id=?", p.id); if (!c) throw new HttpError(404, "Candidat introuvable");
    if (c.player_id) return json(res, 200, { ok: true, player_id: c.player_id, deja: true });
    const id = D.uid("J-"); const age = N(c.age, 0); const filiere = b.filiere === "Sport-Études" ? "Sport-Études" : "Loisirs";
    D.tx(() => { D.run("INSERT INTO players(id,name,birth_year,categorie_id,filiere,poste,parent_name,parent_phone,quartier,cotisation,statut,notes,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)", id, c.nom, age ? new Date().getFullYear() - age : null, S(b.categorie_id, 40) || null, filiere, c.poste, c.parent_nom, c.parent_tel, c.quartier, N(filiere === "Sport-Études" ? s.tarif_sport_etudes : s.tarif_loisirs), "actif", `Retenu à la détection du ${D.get("SELECT date FROM detections WHERE id=?", c.detection_id)?.date || ""} (dossard ${c.dossard})`, D.now()); D.run("UPDATE candidates SET player_id=?, decision='retenu' WHERE id=?", id, p.id); });
    D.audit(user, "joueur-créé-depuis-détection", id, c.nom);
    return json(res, 201, { ok: true, player_id: id });
  }
  if (R("api/presences", ["GET"])) {
    requireRole(user, "direction", "coach");
    const date = isDate(req.url.split("date=")[1]?.slice(0, 10) || "") ? req.url.split("date=")[1].slice(0, 10) : D.today();
    const cats = coachCategoryIds(user);
    return json(res, 200, D.all("SELECT a.*, p.name, p.categorie_id FROM attendance a JOIN players p ON p.id=a.player_id WHERE a.date=?", date).filter((a) => cats.includes(a.categorie_id)));
  }
  if (R("api/presences", ["POST"])) {
    requireRole(user, "direction", "coach");
    const date = isDate(b.date || "") ? b.date : bad("Date invalide");
    const rows = Array.isArray(b.presences) ? b.presences : bad("Liste des présences requise");
    const cats = coachCategoryIds(user); let n = 0;
    D.tx(() => { for (const r of rows) { const pl = player(S(r.player_id, 40)); if (!pl || !cats.includes(pl.categorie_id)) continue; if (!["présent", "absent", "retard", "excusé"].includes(r.status)) continue; D.run("INSERT INTO attendance(id,player_id,seance_id,date,status,note,coach_id,created_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(player_id,seance_id,date) DO UPDATE SET status=excluded.status, note=excluded.note, coach_id=excluded.coach_id", D.uid("A-"), pl.id, S(b.seance_id, 40) || null, date, r.status, S(r.note, 200), user.id, D.now()); n++; } });
    D.audit(user, "présences", date, `${n} joueurs`);
    return json(res, 200, { ok: true, n });
  }
  if ((p = M("api/joueurs/:id/evaluations")) && m === "POST") {
    requireRole(user, "direction", "coach");
    const pl = playerAccessible(user, player(p.id)); const trim = isTrim(b.trimestre || "") ? b.trimestre : D.trimestreOf();
    const v = { technique: note10(b.technique), physique: note10(b.physique), tactique: note10(b.tactique), mental: note10(b.mental), scolaire: note10(b.scolaire) };
    D.run("INSERT INTO evaluations(id,player_id,trimestre,technique,physique,tactique,mental,scolaire,commentaire,coach_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(player_id,trimestre) DO UPDATE SET technique=excluded.technique, physique=excluded.physique, tactique=excluded.tactique, mental=excluded.mental, scolaire=excluded.scolaire, commentaire=excluded.commentaire, coach_id=excluded.coach_id, updated_at=excluded.updated_at", D.uid("E-"), pl.id, trim, v.technique, v.physique, v.tactique, v.mental, v.scolaire, S(b.commentaire, 600), user.id, D.now(), D.now());
    D.audit(user, "évaluation", pl.id, trim); return json(res, 200, { ok: true, trimestre: trim });
  }
  if ((p = M("api/joueurs/:id/observations")) && m === "POST") { requireRole(user, "direction", "coach"); const pl = playerAccessible(user, player(p.id)); if (!S(b.texte)) bad("Texte requis"); D.run("INSERT INTO observations(id,player_id,date,texte,coach_id,created_at) VALUES(?,?,?,?,?,?)", D.uid("O-"), pl.id, isDate(b.date || "") ? b.date : D.today(), S(b.texte, 500), user.id, D.now()); return json(res, 201, { ok: true }); }
  if ((p = M("api/joueurs/:id/scolaire")) && m === "POST") {
    requireRole(user, "direction", "coach");
    const pl = playerAccessible(user, player(p.id)); const trim = isTrim(b.trimestre || "") ? b.trimestre : D.trimestreOf();
    const moy = b.moyenne === "" || b.moyenne == null ? null : N(b.moyenne, NaN); if (moy != null && (!Number.isFinite(moy) || moy < 0 || moy > 20)) bad("La moyenne va de 0 à 20");
    D.run("INSERT INTO school_results(id,player_id,trimestre,moyenne,commentaire,created_at) VALUES(?,?,?,?,?,?) ON CONFLICT(player_id,trimestre) DO UPDATE SET moyenne=excluded.moyenne, commentaire=excluded.commentaire", D.uid("S-"), pl.id, trim, moy, S(b.commentaire, 300), D.now());
    D.audit(user, "scolaire", pl.id, trim); return json(res, 200, { ok: true, statut: schoolStatus(player(pl.id), s) });
  }

  /* ===== coach ===== */
  if (seg[1] === "coach") {
    requireRole(user, "coach", "direction");
    const cats = coachCategoryIds(user);
    if (R("api/coach/espace", ["GET"])) {
      const categories = D.all("SELECT * FROM categories ORDER BY position").filter((c) => cats.includes(c.id));
      const joueurs = D.all("SELECT * FROM players WHERE statut='actif' ORDER BY name").filter((pl) => cats.includes(pl.categorie_id)).map((pl) => ({ ...playerOut(pl), presence: presenceRate("WHERE player_id=?", pl.id), scolaire: schoolStatus(pl, s), evaluation: D.get("SELECT trimestre FROM evaluations WHERE player_id=? AND trimestre=?", pl.id, D.trimestreOf()) ? "faite" : "à faire" }));
      const seances = D.all("SELECT s.*, c.name categorie FROM seances s LEFT JOIN categories c ON c.id=s.categorie_id").filter((se) => cats.includes(se.categorie_id));
      const absences = D.all("SELECT a.date, a.status, p.name, p.id player_id FROM attendance a JOIN players p ON p.id=a.player_id WHERE a.status='absent' AND a.date>=? ORDER BY a.date DESC", new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10)).filter((a) => joueurs.some((j) => j.id === a.player_id));
      return json(res, 200, { categories, joueurs, seances, absences, trimestre: D.trimestreOf(), today: D.today(), detections: D.all("SELECT d.*, (SELECT COUNT(*) FROM candidates c WHERE c.detection_id=d.id) inscrits FROM detections d WHERE statut='à venir' ORDER BY date") });
    }
    if ((p = M("api/coach/detections/:id/candidats")) && m === "GET") return json(res, 200, D.all("SELECT * FROM candidates WHERE detection_id=? ORDER BY dossard", p.id));
  }

  /* ===== parents ===== */
  if (seg[1] === "parents") {
    requireRole(user, "parent");
    const enfants = D.all("SELECT * FROM players WHERE parent_id=? ORDER BY name", user.id);
    if (R("api/parents/espace", ["GET"])) {
      const out = enfants.map((pl) => {
        const fees = D.all("SELECT * FROM fees WHERE player_id=? ORDER BY month DESC", pl.id);
        const payments = D.all("SELECT id, fee_id, amount, method, reference, status, created_at, validated_at, receipt_no, note FROM payments WHERE player_id=? ORDER BY created_at DESC", pl.id);
        const seances = D.all("SELECT s.jour, s.debut, s.fin, s.type, s.lieu, u.name coach FROM seances s LEFT JOIN users u ON u.id=s.coach_id WHERE s.categorie_id=?", pl.categorie_id);
        const news = D.all("SELECT id, date, type, title, body FROM news WHERE (categorie_id='' OR categorie_id=?) AND date>=? ORDER BY date DESC LIMIT 10", pl.categorie_id || "", new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10));
        const presences = D.all("SELECT a.date, a.status, a.note, s.type FROM attendance a LEFT JOIN seances s ON s.id=a.seance_id WHERE a.player_id=? ORDER BY a.date DESC LIMIT 30", pl.id);
        const documents = [{ cle: "medical", libelle: "Visite médicale d'aptitude", ok: !!pl.medical_until && pl.medical_until >= D.today(), detail: pl.medical_until ? `valable jusqu'au ${new Date(pl.medical_until + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}` : "à fournir" }, { cle: "autorisation", libelle: "Autorisation parentale signée", ok: !!pl.autorisation, detail: pl.autorisation ? "reçue" : "à signer à l'académie" }, { cle: "photos", libelle: "Consentement photos et vidéos", ok: !!pl.consent_photos, detail: pl.consent_photos ? "accordé" : "non accordé" }];
        return { ...playerOut(pl), passeport: passport(pl), scolaireStatut: schoolStatus(pl, s), fees, payments, seances, news, presences, presence: presenceRate("WHERE player_id=?", pl.id), documents, share: { token: pl.share_token, scope: pl.share_scope } };
      });
      return json(res, 200, { enfants: out, academie: { nom: s.nom, whatsapp: s.whatsapp, lieu: s.lieu, mobile_money: s.mobile_money, moyenne_min: N(s.moyenne_min), regle_tournoi: s.regle_tournoi }, today: D.today(), trimestre: D.trimestreOf() });
    }
    if ((p = M("api/parents/enfants/:id/paiements")) && m === "POST") {
      const pl = enfants.find((e) => e.id === p.id); if (!pl) throw new HttpError(403, "Accès réservé");
      const amount = N(b.amount, 0); if (amount <= 0) bad("Montant invalide");
      const fee = b.fee_id ? D.get("SELECT * FROM fees WHERE id=? AND player_id=?", S(b.fee_id, 40), pl.id) : null;
      if (b.fee_id && !fee) bad("Échéance introuvable");
      const method = ["Airtel Money", "Moov Money", "Espèces", "Virement"].includes(b.method) ? b.method : "Airtel Money";
      const id = D.uid("P-");
      D.run("INSERT INTO payments(id,player_id,fee_id,amount,method,reference,declared_by,status,created_at,note) VALUES(?,?,?,?,?,?,?,?,?,?)", id, pl.id, fee ? fee.id : null, amount, method, S(b.reference, 60), "parent", "pending", D.now(), S(b.note, 200));
      D.audit(user, "paiement-déclaré", pl.id, `${amount} ${method}`);
      return json(res, 201, { ok: true, id, message: "Déclaration enregistrée : elle sera vérifiée par l'académie avant d'être confirmée." });
    }
    if ((p = M("api/parents/enfants/:id/partage"))) {
      const pl = enfants.find((e) => e.id === p.id); if (!pl) throw new HttpError(403, "Accès réservé");
      if (m === "POST") { const token = crypto.randomBytes(12).toString("hex"); D.run("UPDATE players SET share_token=?, share_scope=?, autorisation=1 WHERE id=?", token, b.scope === "complet" ? "complet" : "evaluations", pl.id); D.audit(user, "partage-créé-parent", pl.id, b.scope || "evaluations"); return json(res, 200, { ok: true, token }); }
      if (m === "DELETE") { D.run("UPDATE players SET share_token='' WHERE id=?", pl.id); D.audit(user, "partage-révoqué-parent", pl.id); return json(res, 200, { ok: true }); }
    }
  }

  /* ===== direction : finances, actualités, paramètres (après coach/parents pour garder le préfixe) ===== */
  if (seg[1] === "direction") {
    if ((p = M("api/direction/echeancier/:month"))) {
      if (!isMonth(p.month)) bad("Mois invalide");
      if (m === "GET") return json(res, 200, { month: p.month, fees: D.all("SELECT f.*, p.name, p.filiere, p.parent_phone, p.categorie_id FROM fees f JOIN players p ON p.id=f.player_id WHERE f.month=? ORDER BY p.name", p.month) });
      if (m === "POST") { const n = generateFees(p.month); D.audit(user, "échéancier-généré", p.month, `${n} échéances`); return json(res, 200, { ok: true, created: n }); }
    }
    if ((p = M("api/direction/echeances/:id")) && m === "PATCH") { const f = D.get("SELECT * FROM fees WHERE id=?", p.id); if (!f) throw new HttpError(404, "Échéance introuvable"); if (!["due", "paid", "waived"].includes(b.status)) bad("Statut invalide"); D.run("UPDATE fees SET status=?, paid_at=? WHERE id=?", b.status, b.status === "paid" ? D.today() : "", p.id); if (b.status === "paid" && b.record !== false) { const id = D.uid("P-"); D.run("INSERT INTO payments(id,player_id,fee_id,amount,method,reference,declared_by,status,created_at,validated_at,validated_by,receipt_no) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)", id, f.player_id, f.id, f.amount, ["Airtel Money", "Moov Money", "Espèces", "Virement"].includes(b.method) ? b.method : "Espèces", S(b.reference, 60), "direction", "validated", D.now(), D.now(), user.id, nextReceiptNo()); } D.audit(user, "échéance-statut", p.id, b.status); return json(res, 200, { ok: true }); }
    if (R("api/direction/paiements", ["GET"])) return json(res, 200, D.all("SELECT pay.*, p.name, f.month FROM payments pay JOIN players p ON p.id=pay.player_id LEFT JOIN fees f ON f.id=pay.fee_id ORDER BY pay.created_at DESC LIMIT 300"));
    if ((p = M("api/direction/paiements/:id")) && m === "PATCH") {
      const pay = D.get("SELECT * FROM payments WHERE id=?", p.id); if (!pay) throw new HttpError(404, "Paiement introuvable");
      if (b.status === "validated") { if (pay.status === "validated") return json(res, 200, { ok: true }); validatePayment(pay, user); D.audit(user, "paiement-validé", p.id, `${pay.amount}`); return json(res, 200, { ok: true, receipt_no: D.get("SELECT receipt_no FROM payments WHERE id=?", p.id).receipt_no }); }
      if (b.status === "rejected") { D.run("UPDATE payments SET status='rejected', note=? WHERE id=?", S(b.note, 200), p.id); D.audit(user, "paiement-rejeté", p.id); return json(res, 200, { ok: true }); }
      bad("Statut invalide");
    }
    if (R("api/direction/depenses", ["GET"])) return json(res, 200, D.all("SELECT * FROM expenses ORDER BY date DESC LIMIT 300"));
    if (R("api/direction/depenses", ["POST"])) { const amount = N(b.amount, 0); if (amount <= 0) bad("Montant invalide"); const id = D.uid("dep-"); D.run("INSERT INTO expenses(id,date,label,category,amount) VALUES(?,?,?,?,?)", id, isDate(b.date || "") ? b.date : D.today(), S(b.label) || "Dépense", S(b.category, 40) || "Autre", amount); D.audit(user, "dépense", id, `${amount}`); return json(res, 201, { ok: true, id }); }
    if ((p = M("api/direction/depenses/:id")) && m === "DELETE") { D.run("DELETE FROM expenses WHERE id=?", p.id); return json(res, 200, { ok: true }); }
    if (R("api/direction/actualites", ["GET"])) return json(res, 200, D.all("SELECT n.*, c.name categorie FROM news n LEFT JOIN categories c ON c.id=n.categorie_id ORDER BY date DESC"));
    if (R("api/direction/actualites", ["POST"])) { if (!S(b.title)) bad("Titre requis"); const id = D.uid("N-"); D.run("INSERT INTO news(id,date,type,title,body,categorie_id,public,created_at) VALUES(?,?,?,?,?,?,?,?)", id, isDate(b.date || "") ? b.date : D.today(), ["actualité", "convocation", "résultat", "information"].includes(b.type) ? b.type : "actualité", S(b.title, 140), S(b.body, 2000), S(b.categorie_id, 40), b.public === false ? 0 : 1, D.now()); return json(res, 201, { ok: true, id }); }
    if ((p = M("api/direction/actualites/:id")) && m === "DELETE") { D.run("DELETE FROM news WHERE id=?", p.id); return json(res, 200, { ok: true }); }
    if (R("api/direction/parametres", ["GET"])) return json(res, 200, s);
    if (R("api/direction/parametres", ["PUT"])) { const keys = ["nom", "slogan", "whatsapp", "facebook", "instagram", "lieu", "saison", "capacite", "charges_fixes", "tarif_sport_etudes", "tarif_loisirs", "moyenne_min", "seuil_presence", "regle_tournoi", "mobile_money", "fondateur", "email"]; for (const k of keys) if (b[k] != null) D.setSetting(k, k === "whatsapp" ? String(b[k]).replace(/\D/g, "") : S(b[k], 300)); D.audit(user, "paramètres"); return json(res, 200, { ok: true }); }
  }
  throw new HttpError(404, "Route inconnue");
}

/* ---------- serveur ---------- */
const server = http.createServer(async (req, res) => {
  const url = req.url.split("?")[0], m = req.method;
  if (url.startsWith("/api/")) {
    try { await api(req, res, url, m, currentUser(req)); }
    catch (e) { if (e instanceof HttpError) return json(res, e.code, { error: e.message }); console.error(e); return json(res, 500, { error: "Erreur serveur" }); }
    return;
  }
  serveStatic(req, res);
});
server.listen(PORT, () => {
  console.log("=================================================");
  console.log("  Elite Football Academy — serveur v2 démarré");
  console.log("  Site     : http://localhost:" + PORT);
  console.log("  Direction: http://localhost:" + PORT + "/admin   Coachs: /coach   Parents: /parents");
  console.log("  Données  : " + D.DB_FILE + (repris.length ? "  (repris de la v1 : " + repris.join(", ") + ")" : ""));
  console.log("=================================================");
});
