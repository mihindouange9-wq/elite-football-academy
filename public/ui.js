/* Outils partagés par le site public et les espaces connectés : icônes, requêtes, notifications, formats. */
window.EFA = (() => {
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const ico = (name, cls = "ico") => `<svg class="${cls}" aria-hidden="true"><use href="/icons.svg#i-${name}"/></svg>`;
  const num = (n) => (Math.round(+n) || 0).toLocaleString("fr-FR").replace(/[   ]/g, " ");
  const fcfa = (n) => num(n) + " FCFA";
  const dateFr = (iso, opts = { day: "numeric", month: "long", year: "numeric" }) => iso ? new Date(iso.length === 10 ? iso + "T12:00:00" : iso).toLocaleDateString("fr-FR", opts) : "";
  const moisFr = (ym) => ym ? new Date(ym + "-15T12:00:00").toLocaleDateString("fr-FR", { month: "long", year: "numeric" }) : "";
  const telAffiche = (t) => { t = String(t || "").replace(/\D/g, ""); if (t.startsWith("241")) t = t.slice(3); return t.replace(/(\d{2})(?=\d)/g, "$1 ").trim(); };
  const waLink = (num, text) => `https://wa.me/${String(num || "").replace(/\D/g, "")}${text ? "?text=" + encodeURIComponent(text) : ""}`;
  const trimestreFr = (t) => { const m = /^(\d{4})-(\d{4})-T([123])$/.exec(t || ""); return m ? `Trimestre ${m[3]} · ${m[1]}-${m[2]}` : t || ""; };

  async function api(method, path, body) {
    const r = await fetch(path, { method, headers: { "Content-Type": "application/json", "X-Requested-With": "fetch" }, body: body !== undefined ? JSON.stringify(body) : undefined, credentials: "same-origin" });
    let data = null; try { data = await r.json(); } catch { /* vide */ }
    if (!r.ok) { const e = new Error((data && data.error) || `Erreur ${r.status}`); e.status = r.status; throw e; }
    return data;
  }
  const get = (p) => api("GET", p), post = (p, b) => api("POST", p, b || {}), put = (p, b) => api("PUT", p, b || {}), patch = (p, b) => api("PATCH", p, b || {}), del = (p) => api("DELETE", p);

  let toastEl = null, toastTimer = null;
  function toast(msg, type = "") {
    if (!toastEl) { toastEl = document.createElement("div"); toastEl.className = "toast"; toastEl.setAttribute("role", "status"); toastEl.setAttribute("aria-live", "polite"); document.body.appendChild(toastEl); }
    toastEl.className = "toast" + (type ? " toast--" + type : ""); toastEl.textContent = msg;
    requestAnimationFrame(() => toastEl.classList.add("visible"));
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove("visible"), 3600);
  }
  /** Confirmation modale accessible (remplace window.confirm). */
  function confirmer(titre, texte, libelle = "Confirmer") {
    return new Promise((resolve) => {
      const dlg = document.createElement("dialog"); dlg.className = "dialogue";
      dlg.innerHTML = `<form method="dialog" class="dialogue__corps"><h2 class="titre titre--sm">${esc(titre)}</h2><p>${esc(texte)}</p><div class="dialogue__actions"><button value="non" class="btn btn--fantome">Annuler</button><button value="oui" class="btn">${esc(libelle)}</button></div></form>`;
      document.body.appendChild(dlg); dlg.addEventListener("close", () => { resolve(dlg.returnValue === "oui"); dlg.remove(); }); dlg.showModal();
    });
  }
  /** Lit un formulaire en objet { name: value } (cases à cocher → booléen). */
  function lire(form) { const o = {}; for (const el of form.elements) { if (!el.name) continue; o[el.name] = el.type === "checkbox" ? el.checked : el.value.trim(); } return o; }
  /** Graphique radar SVG des cinq axes (0–10). Plusieurs séries = plusieurs trimestres. */
  function radar(series, { taille = 260, axes = ["Technique", "Physique", "Tactique", "Mental", "Scolaire"], cles = ["technique", "physique", "tactique", "mental", "scolaire"] } = {}) {
    const c = taille / 2, r = taille / 2 - 34, n = axes.length;
    const pt = (i, v) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / n; const rr = (r * Math.max(0, Math.min(10, v || 0))) / 10; return [c + rr * Math.cos(a), c + rr * Math.sin(a)]; };
    let out = `<svg class="radar" viewBox="0 0 ${taille} ${taille}" role="img" aria-label="Radar des cinq axes">`;
    for (const lvl of [2.5, 5, 7.5, 10]) out += `<polygon points="${axes.map((_, i) => pt(i, lvl).join(",")).join(" ")}" class="radar__niveau"/>`;
    axes.forEach((a, i) => { const [x, y] = pt(i, 10); out += `<line x1="${c}" y1="${c}" x2="${x}" y2="${y}" class="radar__axe"/>`; const [lx, ly] = pt(i, 12.6); out += `<text x="${lx}" y="${ly}" class="radar__libelle" text-anchor="middle" dominant-baseline="middle">${esc(a)}</text>`; });
    series.forEach((s, k) => { const pts = cles.map((cle, i) => pt(i, s[cle])); out += `<polygon points="${pts.map((p) => p.join(",")).join(" ")}" class="radar__serie radar__serie--${k}"/>`; pts.forEach((p) => { out += `<circle cx="${p[0]}" cy="${p[1]}" r="3.5" class="radar__point radar__point--${k}"/>`; }); });
    return out + "</svg>";
  }
  return { esc, ico, fcfa, num, dateFr, moisFr, telAffiche, waLink, trimestreFr, api, get, post, put, patch, del, toast, confirmer, lire, radar };
})();
