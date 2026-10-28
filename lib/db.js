/* ============================================================
   Elite Football Academy — base de données (SQLite intégré à Node 22, zéro dépendance)
   Le fichier vit dans DATA_DIR (par défaut ./data). Les JSON de la v1 sont repris au premier démarrage.
   ============================================================ */
const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "..", "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_FILE = path.join(DATA_DIR, "elite.db");
const db = new DatabaseSync(DB_FILE);
db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");

/* ---------- schéma ---------- */
db.exec(`
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, role TEXT NOT NULL CHECK(role IN ('direction','coach','parent')),
  name TEXT NOT NULL, phone TEXT NOT NULL UNIQUE, email TEXT DEFAULT '',
  password_hash TEXT NOT NULL, salt TEXT NOT NULL, must_change INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS login_attempts (key TEXT PRIMARY KEY, count INTEGER NOT NULL, until TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS audit (id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT NOT NULL, user_id TEXT DEFAULT '', role TEXT DEFAULT '', action TEXT NOT NULL, target TEXT DEFAULT '', detail TEXT DEFAULT '');
CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, name TEXT NOT NULL, tranche TEXT DEFAULT '', coach_id TEXT REFERENCES users(id) ON DELETE SET NULL, jours TEXT DEFAULT '', capacity INTEGER DEFAULT 20, position INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, birth_year INTEGER, sexe TEXT DEFAULT '', categorie_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  filiere TEXT DEFAULT 'Loisirs', poste TEXT DEFAULT '', ecole TEXT DEFAULT '', classe TEXT DEFAULT '',
  parent_id TEXT REFERENCES users(id) ON DELETE SET NULL, parent_name TEXT DEFAULT '', parent_phone TEXT DEFAULT '', quartier TEXT DEFAULT '',
  cotisation INTEGER DEFAULT 0, exonere INTEGER DEFAULT 0, medical_until TEXT DEFAULT '', autorisation INTEGER DEFAULT 0, consent_photos INTEGER DEFAULT 0,
  statut TEXT DEFAULT 'actif', notes TEXT DEFAULT '', share_token TEXT DEFAULT '', share_scope TEXT DEFAULT 'evaluations', created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS inscriptions (
  id TEXT PRIMARY KEY, created_at TEXT NOT NULL, enfant_nom TEXT NOT NULL, enfant_age TEXT DEFAULT '', poste TEXT DEFAULT '', filiere TEXT DEFAULT '', niveau TEXT DEFAULT '',
  parent_nom TEXT NOT NULL, parent_tel TEXT NOT NULL, parent_email TEXT DEFAULT '', quartier TEXT DEFAULT '', message TEXT DEFAULT '',
  status TEXT DEFAULT 'nouveau', player_id TEXT DEFAULT '', consent INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS seances (id TEXT PRIMARY KEY, jour TEXT NOT NULL, debut TEXT DEFAULT '', fin TEXT DEFAULT '', categorie_id TEXT REFERENCES categories(id) ON DELETE CASCADE, type TEXT DEFAULT 'Entraînement', lieu TEXT DEFAULT '', coach_id TEXT REFERENCES users(id) ON DELETE SET NULL);
CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY, player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE, seance_id TEXT REFERENCES seances(id) ON DELETE SET NULL,
  date TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('présent','absent','retard','excusé')), note TEXT DEFAULT '', coach_id TEXT DEFAULT '', created_at TEXT NOT NULL,
  UNIQUE(player_id, seance_id, date));
CREATE TABLE IF NOT EXISTS evaluations (
  id TEXT PRIMARY KEY, player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE, trimestre TEXT NOT NULL,
  technique REAL, physique REAL, tactique REAL, mental REAL, scolaire REAL, commentaire TEXT DEFAULT '', coach_id TEXT DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT DEFAULT '',
  UNIQUE(player_id, trimestre));
CREATE TABLE IF NOT EXISTS observations (id TEXT PRIMARY KEY, player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE, date TEXT NOT NULL, texte TEXT NOT NULL, coach_id TEXT DEFAULT '', created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS school_results (id TEXT PRIMARY KEY, player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE, trimestre TEXT NOT NULL, moyenne REAL, commentaire TEXT DEFAULT '', created_at TEXT NOT NULL, UNIQUE(player_id, trimestre));
CREATE TABLE IF NOT EXISTS fees (id TEXT PRIMARY KEY, player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE, month TEXT NOT NULL, amount INTEGER NOT NULL, status TEXT DEFAULT 'due' CHECK(status IN ('due','paid','waived')), paid_at TEXT DEFAULT '', UNIQUE(player_id, month));
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY, player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE, fee_id TEXT REFERENCES fees(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL, method TEXT DEFAULT 'Espèces', reference TEXT DEFAULT '', declared_by TEXT DEFAULT 'direction',
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','validated','rejected')), created_at TEXT NOT NULL, validated_at TEXT DEFAULT '', validated_by TEXT DEFAULT '', receipt_no TEXT DEFAULT '', note TEXT DEFAULT '');
CREATE TABLE IF NOT EXISTS expenses (id TEXT PRIMARY KEY, date TEXT NOT NULL, label TEXT NOT NULL, category TEXT DEFAULT 'Autre', amount INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS detections (id TEXT PRIMARY KEY, date TEXT NOT NULL, heure TEXT DEFAULT '', lieu TEXT DEFAULT '', titre TEXT NOT NULL, description TEXT DEFAULT '', places INTEGER DEFAULT 40, statut TEXT DEFAULT 'à venir', open_public INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS candidates (
  id TEXT PRIMARY KEY, detection_id TEXT NOT NULL REFERENCES detections(id) ON DELETE CASCADE, dossard INTEGER, nom TEXT NOT NULL, age TEXT DEFAULT '', poste TEXT DEFAULT '',
  parent_nom TEXT DEFAULT '', parent_tel TEXT DEFAULT '', quartier TEXT DEFAULT '', note_tech REAL, note_phys REAL, note_jeu REAL, note_mental REAL, commentaire TEXT DEFAULT '',
  decision TEXT DEFAULT '', present INTEGER DEFAULT 0, player_id TEXT DEFAULT '', source TEXT DEFAULT 'site', created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS news (id TEXT PRIMARY KEY, date TEXT NOT NULL, type TEXT DEFAULT 'actualité', title TEXT NOT NULL, body TEXT DEFAULT '', categorie_id TEXT DEFAULT '', public INTEGER DEFAULT 1, created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_att_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_fees_month ON fees(month);
CREATE INDEX IF NOT EXISTS idx_players_cat ON players(categorie_id);
CREATE INDEX IF NOT EXISTS idx_players_parent ON players(parent_id);
`);

/* ---------- utilitaires ---------- */
const now = () => new Date().toISOString();
const today = () => new Date().toISOString().slice(0, 10);
const uid = (p) => p + Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 1e4).toString(36).toUpperCase();
const all = (sql, ...p) => db.prepare(sql).all(...p);
const get = (sql, ...p) => db.prepare(sql).get(...p);
const run = (sql, ...p) => db.prepare(sql).run(...p);
const tx = (fn) => { db.exec("BEGIN"); try { const r = fn(); db.exec("COMMIT"); return r; } catch (e) { db.exec("ROLLBACK"); throw e; } };

/** Trimestre scolaire courant : T1 sept-déc, T2 jan-mars, T3 avril-juin (juillet-août rattachés à T3). */
function trimestreOf(d = new Date()) {
  const m = d.getMonth() + 1, y = d.getFullYear();
  if (m >= 9) return `${y}-${y + 1}-T1`;
  if (m <= 3) return `${y - 1}-${y}-T2`;
  return `${y - 1}-${y}-T3`;
}
const monthOf = (d = new Date()) => d.toISOString().slice(0, 7);

const DEFAULT_SETTINGS = {
  nom: "Elite Football Academy",
  slogan: "Révéler les talents, bâtir des parcours",
  whatsapp: "24166802521",
  facebook: "",
  instagram: "",
  lieu: "Akanda — proche du stade de l'Amitié, Libreville (Gabon)",
  saison: "2026-2027",
  capacite: "80",
  charges_fixes: "0",
  tarif_sport_etudes: "50000",
  tarif_loisirs: "25000",
  moyenne_min: "10",
  seuil_presence: "75",
  regle_tournoi: "oui",
  mobile_money: "",
  fondateur: "Thomas Serge Lanchais",
  presentation: "Elite Football Academy est une académie Sport-Études d'Akanda qui forme les jeunes de 8 à 18 ans sur le terrain, les accompagne à l'école et leur transmet des valeurs qui durent.",
  age_min: "8",
  age_max: "18",
  horaires: "Lundi – Samedi",
  email: "",
};
function settings() { const s = { ...DEFAULT_SETTINGS }; for (const r of all("SELECT key, value FROM settings")) s[r.key] = r.value; return s; }
function setSetting(key, value) { run("INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", key, String(value)); }
function audit(user, action, target = "", detail = "") { run("INSERT INTO audit(at,user_id,role,action,target,detail) VALUES(?,?,?,?,?,?)", now(), user ? user.id : "", user ? user.role : "", action, String(target), String(detail).slice(0, 400)); }

const DEFAULT_CATEGORIES = [
  { id: "u7_u9", name: "U7 – U9 (École de foot)", tranche: "7-9 ans", jours: "Mer · Sam", position: 1 },
  { id: "u10_u12", name: "U10 – U12", tranche: "10-12 ans", jours: "Mar · Jeu · Sam", position: 2 },
  { id: "u13_u15", name: "U13 – U15", tranche: "13-15 ans", jours: "Lun · Mer · Ven", position: 3 },
  { id: "u16_u18", name: "U16 – U18", tranche: "16-18 ans", jours: "Lun · Mer · Ven · Sam", position: 4 },
];
const DEFAULT_SEANCES = [
  ["Lundi", "16:00", "18:00", "u13_u15", "Technique", "Terrain d'Akanda"],
  ["Mercredi", "15:00", "17:00", "u7_u9", "Technique", "Terrain d'Akanda"],
  ["Mercredi", "17:00", "19:00", "u16_u18", "Tactique", "Terrain d'Akanda"],
  ["Vendredi", "16:00", "18:00", "u13_u15", "Physique", "Terrain d'Akanda"],
  ["Samedi", "09:00", "11:00", "u10_u12", "Match", "Stade de l'Amitié"],
];

/* ---------- amorçage + reprise des JSON de la v1 ---------- */
function readJson(name) { try { const f = path.join(DATA_DIR, name); if (!fs.existsSync(f)) return null; return JSON.parse(fs.readFileSync(f, "utf8").replace(/^﻿/, "")); } catch { return null; } }
function bootstrap(auth) {
  const repris = [];
  if (get("SELECT COUNT(*) n FROM categories").n === 0) {
    const old = readJson("categories.json");
    const cats = Array.isArray(old) && old.length ? old.map((c, i) => ({ id: c.id || uid("cat-"), name: c.name, tranche: c.tranche || "", jours: c.jours || "", position: i + 1 })) : DEFAULT_CATEGORIES;
    for (const c of cats) run("INSERT INTO categories(id,name,tranche,jours,position) VALUES(?,?,?,?,?)", c.id, c.name, c.tranche, c.jours, c.position);
    if (old) repris.push("catégories");
  }
  if (get("SELECT COUNT(*) n FROM seances").n === 0) {
    const old = readJson("seances.json");
    const catByName = Object.fromEntries(all("SELECT id, name FROM categories").map((c) => [c.name, c.id]));
    if (Array.isArray(old) && old.length) { for (const s of old) run("INSERT INTO seances(id,jour,debut,fin,categorie_id,type,lieu) VALUES(?,?,?,?,?,?,?)", s.id || uid("se-"), s.jour, s.debut || "", s.fin || "", catByName[s.categorie] || null, s.type || "Entraînement", s.lieu || ""); repris.push("séances"); }
    else for (const [jour, debut, fin, cat, type, lieu] of DEFAULT_SEANCES) run("INSERT INTO seances(id,jour,debut,fin,categorie_id,type,lieu) VALUES(?,?,?,?,?,?,?)", uid("se-"), jour, debut, fin, cat, type, lieu);
  }
  if (get("SELECT COUNT(*) n FROM inscriptions").n === 0) {
    const old = readJson("inscriptions.json");
    if (Array.isArray(old) && old.length) { for (const i of old) run("INSERT OR IGNORE INTO inscriptions(id,created_at,enfant_nom,enfant_age,poste,filiere,niveau,parent_nom,parent_tel,parent_email,quartier,message,status) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)",
      i.id || uid("INS-"), i.createdAt || now(), i.enfant?.nom || "?", i.enfant?.age || "", i.enfant?.poste || "", i.enfant?.filiere || "", i.enfant?.niveau || "", i.parent?.nom || "?", i.parent?.tel || "", i.parent?.email || "", i.parent?.quartier || "", i.message || "", i.status || "nouveau"); repris.push("inscriptions"); }
  }
  if (get("SELECT COUNT(*) n FROM players").n === 0) {
    const old = readJson("joueurs.json");
    const catByName = Object.fromEntries(all("SELECT id, name FROM categories").map((c) => [c.name, c.id]));
    if (Array.isArray(old) && old.length) { for (const j of old) run("INSERT OR IGNORE INTO players(id,name,birth_year,categorie_id,filiere,poste,parent_name,parent_phone,quartier,cotisation,statut,notes,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)",
      j.id || uid("J-"), j.nom || "Joueur", j.age ? new Date().getFullYear() - (+j.age || 0) : null, catByName[j.categorie] || null, j.filiere || "Loisirs", j.poste || "", j.parentNom || "", j.parentTel || "", j.quartier || "", +j.cotisation || 0, j.actif === false ? "inactif" : "actif", j.notes || "", j.createdAt || now()); repris.push("joueurs"); }
  }
  if (get("SELECT COUNT(*) n FROM expenses").n === 0) { const old = readJson("expenses.json"); if (Array.isArray(old) && old.length) { for (const e of old) run("INSERT OR IGNORE INTO expenses(id,date,label,category,amount) VALUES(?,?,?,?,?)", e.id || uid("dep-"), e.date || today(), e.label || "Dépense", e.category || "Autre", +e.amount || 0); repris.push("dépenses"); } }
  if (get("SELECT COUNT(*) n FROM detections").n === 0) { const old = readJson("detections.json"); if (Array.isArray(old) && old.length) { for (const d of old) run("INSERT OR IGNORE INTO detections(id,date,heure,lieu,titre,description,places,statut) VALUES(?,?,?,?,?,?,?,?)", d.id || uid("det-"), d.date, d.heure || "", d.lieu || "", d.titre || "Journée de détection", d.description || "", +d.candidats || 40, d.statut || "à venir"); repris.push("détections"); } }
  const oldSettings = readJson("settings.json");
  if (oldSettings && typeof oldSettings === "object" && get("SELECT COUNT(*) n FROM settings").n === 0) {
    for (const k of ["whatsapp", "facebook", "instagram", "lieu"]) if (oldSettings[k] && !/^https:\/\/www\.(facebook|instagram)\.com\/$/.test(oldSettings[k])) setSetting(k, oldSettings[k]);
    repris.push("paramètres");
  }
  /* compte direction initial : ADMIN_PASSWORD, sinon l'ancien mot de passe v1, sinon « Elite2026 » (à changer à la première connexion) */
  if (get("SELECT COUNT(*) n FROM users WHERE role='direction'").n === 0) {
    const pwd = process.env.ADMIN_PASSWORD || (oldSettings && oldSettings.adminPassword) || "Elite2026";
    const { hash, salt } = auth.hashPassword(pwd);
    run("INSERT INTO users(id,role,name,phone,email,password_hash,salt,must_change,created_at) VALUES(?,?,?,?,?,?,?,?,?)", "U-DIRECTION", "direction", "Direction", "direction", "", hash, salt, process.env.ADMIN_PASSWORD ? 0 : 1, now());
  }
  if (repris.length) audit(null, "reprise-v1", "", repris.join(", "));
  return repris;
}

/* ---------- export / import de sauvegarde (JSON complet) ---------- */
const TABLES = ["settings", "users", "categories", "players", "inscriptions", "seances", "attendance", "evaluations", "observations", "school_results", "fees", "payments", "expenses", "detections", "candidates", "news", "audit"];
function exportAll() { const out = { exported_at: now(), version: 2 }; for (const t of TABLES) out[t] = all(`SELECT * FROM ${t}`); return out; }
function importAll(data) {
  if (!data || data.version !== 2) throw new Error("Sauvegarde invalide (version attendue : 2)");
  db.exec("PRAGMA foreign_keys = OFF"); // les sessions en cours survivent à la restauration (mêmes identifiants d'utilisateurs)
  try { tx(() => {
    for (const t of [...TABLES].reverse()) db.exec(`DELETE FROM ${t}`);
    for (const t of TABLES) for (const row of data[t] || []) { const cols = Object.keys(row); run(`INSERT INTO ${t}(${cols.join(",")}) VALUES(${cols.map(() => "?").join(",")})`, ...cols.map((c) => row[c])); }
  }); } finally { db.exec("PRAGMA foreign_keys = ON"); }
}

module.exports = { db, all, get, run, tx, uid, now, today, trimestreOf, monthOf, settings, setSetting, audit, bootstrap, exportAll, importAll, DATA_DIR, DB_FILE };
