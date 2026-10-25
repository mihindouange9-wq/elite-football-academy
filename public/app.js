/* Socle commun des espaces connectés : session, coquille (barre latérale, menu mobile), routage par vues. */
window.APP = (() => {
  const { esc, ico, get, post, toast } = window.EFA;
  const $ = (id) => document.getElementById(id);
  let USER = null;

  async function session(roles) {
    try { const r = await get("/api/auth/me"); USER = r.user; }
    catch { location.replace("/connexion"); return null; }
    if (!roles.includes(USER.role)) { location.replace({ direction: "/admin", coach: "/coach", parent: "/parents" }[USER.role] || "/connexion"); return null; }
    return USER;
  }
  function coquille({ titreEspace, vues, apresRendu }) {
    const lat = $("lat"), nav = $("latNav");
    nav.innerHTML = vues.map((v) => `<a href="#${v.id}" data-vue="${v.id}">${ico(v.icone)}<span>${esc(v.libelle)}</span><span class="badge" data-badge="${v.id}" hidden></span></a>`).join("");
    $("latUtilisateur").innerHTML = `<b>${esc(USER.name)}</b><small>${esc(titreEspace)}</small>`;
    $("btnDeconnexion").addEventListener("click", async () => { await post("/api/auth/logout"); location.href = "/connexion"; });
    const voile = $("voile");
    const ouvrir = (o) => { lat.classList.toggle("ouvert", o); voile.hidden = !o; $("burgerApp").setAttribute("aria-expanded", String(o)); };
    $("burgerApp").addEventListener("click", () => ouvrir(true)); voile.addEventListener("click", () => ouvrir(false));
    nav.addEventListener("click", () => ouvrir(false));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") ouvrir(false); });
    const afficher = async () => {
      const id = location.hash.replace("#", "").split("/")[0] || vues[0].id;
      const vue = vues.find((v) => v.id === id) || vues[0];
      nav.querySelectorAll("a").forEach((a) => a.classList.toggle("actif", a.dataset.vue === vue.id));
      $("titreVue").textContent = vue.libelle;
      const cible = $("vue"); cible.setAttribute("aria-busy", "true"); cible.innerHTML = `<p class="etat-vide" style="justify-items:center">Chargement…</p>`;
      try { await vue.rendu(cible); } catch (e) { cible.innerHTML = `<div class="message message--erreur">${ico("alerte")}<span>${esc(e.message)}</span></div>`; if (e.status === 401) location.replace("/connexion"); }
      cible.removeAttribute("aria-busy"); cible.focus({ preventScroll: true });
      if (apresRendu) apresRendu(vue);
    };
    window.addEventListener("hashchange", afficher);
    return afficher;
  }
  function badge(id, n) { const b = document.querySelector(`[data-badge="${id}"]`); if (!b) return; b.hidden = !n; b.textContent = n; }
  /** Dialogue avec un formulaire ; résout avec les valeurs ou null. */
  function formulaire(titre, html, { libelle = "Enregistrer", large = false } = {}) {
    return new Promise((resolve) => {
      const dlg = document.createElement("dialog"); dlg.className = "dialogue"; if (large) dlg.style.width = "min(96vw, 60rem)";
      dlg.innerHTML = `<form method="dialog" class="dialogue__corps form" novalidate><h2 class="titre titre--sm">${esc(titre)}</h2>${html}<p class="formulaire__statut erreur" data-statut></p><div class="dialogue__actions"><button type="button" class="btn btn--fantome" data-annuler>Annuler</button><button type="submit" class="btn">${esc(libelle)}</button></div></form>`;
      document.body.appendChild(dlg);
      const form = dlg.querySelector("form");
      dlg.querySelector("[data-annuler]").addEventListener("click", () => { dlg.close(); });
      form.addEventListener("submit", (e) => { e.preventDefault(); const d = window.EFA.lire(form); const req = [...form.querySelectorAll("[required]")].filter((el) => el.type === "checkbox" ? !el.checked : !el.value.trim()); if (req.length) { form.querySelector("[data-statut]").textContent = "Renseignez les champs requis."; req[0].focus(); return; } dlg.returnValue = "ok"; dlg.close(); resolve(d); });
      dlg.addEventListener("close", () => { if (dlg.returnValue !== "ok") resolve(null); dlg.remove(); });
      dlg.showModal(); const premier = form.querySelector("input, select, textarea"); if (premier) premier.focus();
    });
  }
  function secretHtml(libelle, phone, pwd) { return `<div class="secret"><span>${esc(libelle)}</span><span>Identifiant : <b>${esc(window.EFA.telAffiche(phone))}</b></span><span>Mot de passe provisoire : <code>${esc(pwd)}</code></span><span>À transmettre à la personne concernée, qui devra le changer à sa première connexion. Il ne sera plus affiché.</span></div>`; }
  const option = (arr, sel, vide) => (vide ? `<option value="">${esc(vide)}</option>` : "") + arr.map((o) => `<option value="${esc(o.value ?? o)}" ${(o.value ?? o) === sel ? "selected" : ""}>${esc(o.label ?? o)}</option>`).join("");
  const statutEtiquette = (s) => ({ nouveau: "info", "contacté": "neutre", "détection": "or", inscrit: "succes", "refusé": "erreur", due: "alerte", paid: "succes", waived: "neutre", pending: "alerte", validated: "succes", rejected: "erreur", "présent": "succes", absent: "erreur", retard: "alerte", "excusé": "info", "à venir": "info", "passée": "neutre", actif: "succes", inactif: "neutre" }[s] || "neutre");
  const libelleStatut = (s) => ({ due: "à payer", paid: "payée", waived: "exonérée", pending: "en attente", validated: "validé", rejected: "rejeté" }[s] || s);
  const etiquette = (s) => `<span class="etiquette etiquette--${statutEtiquette(s)}">${esc(libelleStatut(s))}</span>`;
  return { session, coquille, badge, formulaire, secretHtml, option, etiquette, libelleStatut, user: () => USER };
})();
