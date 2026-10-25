/* ============================================================
   Authentification : mots de passe hachés (scrypt), sessions en base avec expiration,
   cookie HttpOnly, limitation des tentatives, trois rôles (direction, coach, parent).
   ============================================================ */
const crypto = require("crypto");
const D = require("./db");

const SESSION_DAYS = 7;
const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 10;

function hashPassword(pwd, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(String(pwd), salt, 64).toString("hex");
  return { hash, salt };
}
function verifyPassword(pwd, hash, salt) {
  const h = crypto.scryptSync(String(pwd), salt, 64);
  const stored = Buffer.from(hash, "hex");
  return h.length === stored.length && crypto.timingSafeEqual(h, stored);
}
/** Normalise un numéro gabonais : 077 00 00 00 → 24177000000. */
function normPhone(p) {
  const d = String(p || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("241")) return d;
  return "241" + d.replace(/^0+/, "");
}
function attemptsBlocked(key) {
  const r = D.get("SELECT count, until FROM login_attempts WHERE key=?", key);
  if (!r) return 0;
  if (new Date(r.until) > new Date() && r.count >= MAX_ATTEMPTS) return Math.ceil((new Date(r.until) - Date.now()) / 60000);
  if (new Date(r.until) <= new Date()) D.run("DELETE FROM login_attempts WHERE key=?", key);
  return 0;
}
function recordFailure(key) {
  const until = new Date(Date.now() + LOCK_MINUTES * 60000).toISOString();
  if (D.get("SELECT count FROM login_attempts WHERE key=?", key)) D.run("UPDATE login_attempts SET count=count+1, until=? WHERE key=?", until, key);
  else D.run("INSERT INTO login_attempts(key,count,until) VALUES(?,?,?)", key, 1, until);
}

/** Connexion : identifiant = « direction » ou numéro de téléphone (coach, parent). */
function login(loginId, password, ip) {
  const raw = String(loginId || "").trim().toLowerCase();
  const id = raw === "direction" ? "direction" : normPhone(raw);
  if (!id || !password) return { error: "Identifiant et mot de passe requis." };
  const key = `${id}|${ip}`;
  const blocked = attemptsBlocked(key);
  if (blocked) return { error: `Trop de tentatives. Réessayez dans ${blocked} min.` };
  const u = D.get("SELECT * FROM users WHERE phone=? AND active=1", id);
  if (!u || !verifyPassword(password, u.password_hash, u.salt)) { recordFailure(key); D.audit(null, "connexion-refusée", id); return { error: "Identifiant ou mot de passe incorrect." }; }
  D.run("DELETE FROM login_attempts WHERE key=?", key);
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString();
  D.run("INSERT INTO sessions(token,user_id,expires_at,created_at) VALUES(?,?,?,?)", token, u.id, expires, D.now());
  D.run("DELETE FROM sessions WHERE expires_at < ?", D.now());
  D.audit(u, "connexion");
  return { token, user: publicUser(u) };
}
function logout(token) { if (token) D.run("DELETE FROM sessions WHERE token=?", token); }
function userFromToken(token) {
  if (!token) return null;
  const s = D.get("SELECT user_id, expires_at FROM sessions WHERE token=?", token);
  if (!s || new Date(s.expires_at) < new Date()) return null;
  return D.get("SELECT * FROM users WHERE id=? AND active=1", s.user_id) || null;
}
function publicUser(u) { return { id: u.id, role: u.role, name: u.name, phone: u.phone, email: u.email, must_change: !!u.must_change }; }

function createUser({ role, name, phone, email = "", password }) {
  const p = normPhone(phone);
  if (!p || p.length < 11) throw new Error("Numéro de téléphone invalide");
  if (D.get("SELECT id FROM users WHERE phone=?", p)) throw new Error("Ce numéro a déjà un compte");
  const pwd = password || generatePassword();
  const { hash, salt } = hashPassword(pwd);
  const id = D.uid("U-");
  D.run("INSERT INTO users(id,role,name,phone,email,password_hash,salt,must_change,created_at) VALUES(?,?,?,?,?,?,?,?,?)", id, role, String(name || "").slice(0, 120), p, String(email || "").slice(0, 120), hash, salt, 1, D.now());
  return { id, phone: p, password: pwd };
}
function setPassword(userId, pwd, mustChange = 0) {
  const { hash, salt } = hashPassword(pwd);
  D.run("UPDATE users SET password_hash=?, salt=?, must_change=? WHERE id=?", hash, salt, mustChange, userId);
}
function generatePassword() { const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let s = ""; for (let i = 0; i < 8; i++) s += a[crypto.randomInt(a.length)]; return s; }

/* cookie de session */
function parseCookies(req) { const out = {}; (req.headers.cookie || "").split(";").forEach((c) => { const i = c.indexOf("="); if (i > 0) out[c.slice(0, i).trim()] = decodeURIComponent(c.slice(i + 1).trim()); }); return out; }
function cookieHeader(token, secure) { return `efa_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_DAYS * 86400}${secure ? "; Secure" : ""}`; }
function clearCookieHeader() { return "efa_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0"; }

module.exports = { hashPassword, verifyPassword, normPhone, login, logout, userFromToken, publicUser, createUser, setPassword, generatePassword, parseCookies, cookieHeader, clearCookieHeader };
