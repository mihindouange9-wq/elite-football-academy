/* ============================================================
   Espace coachs : ma semaine, feuille de présence, mes joueurs (évaluation 5 axes, observations,
   scolaire), absences récentes, détections (notation des candidats).
   ============================================================ */
(async () => {
  const { esc, ico, dateFr, trimestreFr, telAffiche, waLink, get, post, put, toast, radar, lire } = window.EFA;
  const { session, coquille, badge, formulaire, option, etiquette } = window.APP;
  const user = await session(["coach"]); if (!user) return;
  const $ = (id) => document.getElementById(id);
  const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
  const STATUTS = ["présent", "retard", "absent", "excusé"];
  const actions = (html) => { $("barreActions").innerHTML = html; };
  const vide = (icone, titre, texte) => `<div class="etat-vide">${ico(icone)}<h3>${esc(titre)}</h3><p>${esc(texte)}</p></div>`;
  const aujourdhui = () => new Date().toISOString().slice(0, 10);
  const jourDe = (date) => JOURS[(new Date(date + "T12:00:00").getDay() + 6) % 7];
  let E = null;
  const charger = async () => { E = await get("/api/coach/espace"); badge("absences", E.absences.length); badge("joueurs", E.joueurs.filter((j) => j.evaluation === "à faire").length); return E; };

  /* ---------- ma semaine ---------- */
  async function vueSemaine(el) {
    actions(`<a class="btn btn--sm" href="#presences">${ico("ok")}Pointer les présences</a>`);
    await charger();
    const jour = jourDe(aujourdhui());
    const aFaire = E.joueurs.filter((j) => j.evaluation === "à faire").length;
    if (!E.categories.length) { el.innerHTML = vide("groupe", "Aucun groupe affecté", "La direction doit vous affecter à un ou plusieurs groupes pour que vos joueurs et vos séances apparaissent ici."); return; }
    el.innerHTML = `
    <dl class="cartes">
      <div class="indicateur"><dt>Mes groupes</dt><dd>${E.categories.length}<small> · ${E.categories.map((c) => esc(c.name)).join(", ")}</small></dd></div>
      <div class="indicateur"><dt>Joueurs actifs</dt><dd>${E.joueurs.length}</dd></div>
      <div class="indicateur ${E.absences.length ? "indicateur--alerte" : ""}"><dt>Absences (14 jours)</dt><dd>${E.absences.length}</dd></div>
      <div class="indicateur ${aFaire ? "indicateur--or" : ""}"><dt>Évaluations ${esc(trimestreFr(E.trimestre).split(" · ")[0])}</dt><dd>${aFaire ? `${aFaire}<small> à faire</small>` : `${E.joueurs.length}<small> faites</small>`}</dd></div>
    </dl>
    <div class="deux">
      <section class="panneau"><div class="panneau__tete"><h2>Aujourd'hui, ${esc(jour.toLowerCase())} ${esc(dateFr(aujourdhui(), { day: "numeric", month: "long" }))}</h2></div>
        ${E.seances.filter((s) => s.jour === jour).length ? `<ul class="liste-simple">${E.seances.filter((s) => s.jour === jour).sort((a, b) => a.debut.localeCompare(b.debut)).map((s) => `<li><span><b>${esc(s.debut)}–${esc(s.fin)}</b> · ${esc(s.categorie)} · ${esc(s.type)}<small>${esc(s.lieu)}</small></span><a class="btn btn--sm" href="#presences/${esc(s.id)}">Pointer</a></li>`).join("")}</ul>` : `<p class="corps" style="font-size:var(--t-sm)">Pas de séance planifiée aujourd'hui pour vos groupes.</p>`}
      </section>
      <section class="panneau"><div class="panneau__tete"><h2>Planning de la semaine</h2></div>
        ${E.seances.length ? `<ul class="liste-simple">${JOURS.map((j) => E.seances.filter((s) => s.jour === j).sort((a, b) => a.debut.localeCompare(b.debut)).map((s) => `<li><span><b>${esc(j)}</b> ${esc(s.debut)}–${esc(s.fin)} · ${esc(s.categorie)}<small>${esc(s.type)} · ${esc(s.lieu)}</small></span></li>`).join("")).join("")}</ul>` : vide("calendrier", "Aucune séance planifiée", "La direction planifie les séances depuis son espace.")}
      </section>
      <section class="panneau"><div class="panneau__tete"><h2>Absences récentes</h2><a class="btn btn--sm btn--fantome" href="#absences">Tout voir</a></div>
        ${E.absences.length ? `<ul class="liste-simple">${E.absences.slice(0, 6).map((a) => `<li><span><b>${esc(a.name)}</b><small>${esc(dateFr(a.date))}</small></span>${etiquette(a.status)}</li>`).join("")}</ul>` : `<p class="corps" style="font-size:var(--t-sm)">Aucune absence pointée sur les 14 derniers jours.</p>`}
      </section>
      <section class="panneau"><div class="panneau__tete"><h2>Prochaines détections</h2></div>
        ${E.detections.length ? `<ul class="liste-simple">${E.detections.map((d) => `<li><span><b>${esc(dateFr(d.date))}</b> · ${esc(d.titre)}<small>${esc(d.lieu)} · ${d.inscrits} inscrits</small></span><a class="btn btn--sm btn--fantome" href="#detections/${esc(d.id)}">Noter</a></li>`).join("")}</ul>` : `<p class="corps" style="font-size:var(--t-sm)">Aucune journée de détection programmée.</p>`}
      </section>
    </div>`;
  }

  /* ---------- feuille de présence ---------- */
  async function vuePresences(el) {
    if (!E) await charger();
    const [, seanceId, dateParam] = location.hash.split("/");
    let date = dateParam || aujourdhui();
    actions(`<input type="date" id="datePres" value="${esc(date)}" class="btn btn--sm btn--fantome" aria-label="Date de la séance">`);
    if (!E.joueurs.length) { el.innerHTML = vide("groupe", "Aucun joueur", "Aucun joueur actif dans vos groupes pour l'instant."); return; }
    const existantes = await get(`/api/presences?date=${date}`);
    const seancesJour = E.seances.filter((s) => s.jour === jourDe(date));
    const seance = E.seances.find((s) => s.id === seanceId) || seancesJour[0] || null;
    const groupeSel = seance ? seance.categorie_id : (E.categories[0]?.id || "");
    const etat = {}; E.joueurs.forEach((j) => { const ex = existantes.find((a) => a.player_id === j.id && (!seance || !a.seance_id || a.seance_id === seance.id)); etat[j.id] = { status: ex ? ex.status : "présent", note: ex ? ex.note : "" }; });
    const rendu = () => {
      const cat = $("groupePres").value;
      const rows = E.joueurs.filter((j) => !cat || j.categorie_id === cat);
      $("feuille").innerHTML = rows.length ? rows.map((j) => `<div class="ligne-presence"><div><b>${esc(j.name)}</b><small>${esc(j.categorie || "")}${j.presence.n ? ` · ${j.presence.taux} % de présence` : ""}</small></div><div class="segments" role="group" aria-label="Présence de ${esc(j.name)}">${STATUTS.map((s) => `<button type="button" data-j="${esc(j.id)}" data-v="${s}" aria-pressed="${etat[j.id].status === s}">${s === "présent" ? "P" : s === "retard" ? "R" : s === "absent" ? "A" : "E"}</button>`).join("")}</div></div>`).join("") : `<p class="corps">Aucun joueur dans ce groupe.</p>`;
      $("compteur").textContent = `${rows.filter((j) => etat[j.id].status === "présent" || etat[j.id].status === "retard").length} présents sur ${rows.length}`;
    };
    el.innerHTML = `<section class="panneau"><div class="panneau__tete"><div class="filtres"><select id="groupePres" aria-label="Groupe">${option(E.categories.map((c) => ({ value: c.id, label: c.name })), groupeSel, "Tous mes groupes")}</select>${seancesJour.length ? `<select id="seancePres" aria-label="Séance">${option(seancesJour.map((s) => ({ value: s.id, label: `${s.debut} · ${s.categorie} · ${s.type}` })), seance?.id || "")}</select>` : `<span class="etiquette etiquette--neutre">pas de séance planifiée ce ${esc(jourDe(date).toLowerCase())}</span>`}</div><span class="etiquette" id="compteur"></span></div>
      <p class="corps" style="font-size:var(--t-sm);margin-bottom:1rem">P = présent · R = retard · A = absent · E = excusé. Tout le monde est présent par défaut : touchez seulement les absents.</p>
      <div class="liste-presence" id="feuille"></div>
      <div class="form__actions" style="margin-top:1rem"><button class="btn btn--sm btn--fantome" id="tousPresents">Tous présents</button><button class="btn" id="btnEnregistrer">${ico("ok")}Enregistrer la feuille</button></div>
    </section>`;
    rendu();
    $("groupePres").addEventListener("change", rendu);
    $("seancePres")?.addEventListener("change", (e) => { location.hash = `#presences/${e.target.value}/${date}`; });
    $("datePres").addEventListener("change", (e) => { location.hash = `#presences/${seance ? seance.id : ""}/${e.target.value}`; });
    $("feuille").addEventListener("click", (e) => { const b = e.target.closest("button[data-j]"); if (!b) return; etat[b.dataset.j].status = b.dataset.v; b.parentElement.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); rendu(); });
    $("tousPresents").addEventListener("click", () => { Object.values(etat).forEach((x) => (x.status = "présent")); rendu(); });
    $("btnEnregistrer").addEventListener("click", async () => {
      const cat = $("groupePres").value;
      const presences = E.joueurs.filter((j) => !cat || j.categorie_id === cat).map((j) => ({ player_id: j.id, status: etat[j.id].status, note: etat[j.id].note }));
      try { const r = await post("/api/presences", { date, seance_id: $("seancePres")?.value || seance?.id || "", presences }); toast(`Feuille enregistrée : ${r.n} joueurs`, "succes"); await charger(); } catch (err) { toast(err.message, "erreur"); }
    });
  }

  /* ---------- mes joueurs ---------- */
  async function vueJoueurs(el) {
    if (!E) await charger();
    const id = location.hash.split("/")[1];
    if (id) return ficheJoueur(el, id);
    actions("");
    if (!E.joueurs.length) { el.innerHTML = vide("groupe", "Aucun joueur", "Aucun joueur actif dans vos groupes pour l'instant."); return; }
    el.innerHTML = `<section class="panneau"><div class="panneau__tete"><div class="filtres"><input id="filtreJ" type="search" placeholder="Rechercher…" aria-label="Rechercher"><select id="filtreCat" aria-label="Groupe">${option(E.categories.map((c) => ({ value: c.id, label: c.name })), "", "Tous mes groupes")}</select></div><span class="etiquette etiquette--neutre">${E.joueurs.length} joueurs</span></div><div class="table-wrap" id="tabJ"></div></section>`;
    const rendu = () => { const q = $("filtreJ").value.toLowerCase(), cat = $("filtreCat").value; const rows = E.joueurs.filter((j) => (!cat || j.categorie_id === cat) && (!q || j.name.toLowerCase().includes(q)));
      $("tabJ").innerHTML = `<table class="tab"><thead><tr><th>Joueur</th><th>Groupe</th><th class="num">Présence</th><th>Scolaire</th><th>Évaluation ${esc(trimestreFr(E.trimestre).split(" · ")[0])}</th><th></th></tr></thead><tbody>${rows.map((j) => `<tr><td><a href="#joueurs/${esc(j.id)}"><b>${esc(j.name)}</b></a><br><small>${j.age ? j.age + " ans · " : ""}${esc(j.poste || "")} · ${esc(j.filiere)}</small></td><td>${esc(j.categorie || "—")}</td><td class="num">${j.presence.n ? `${j.presence.taux} %` : "—"}</td><td>${j.filiere === "Sport-Études" ? (j.scolaire.eligibleTournoi ? `<span class="etiquette etiquette--succes">éligible</span>` : `<span class="etiquette etiquette--erreur">${j.scolaire.aJour ? "sous le seuil" : "moyenne manquante"}</span>`) : "—"}</td><td>${j.evaluation === "faite" ? `<span class="etiquette etiquette--succes">faite</span>` : `<span class="etiquette etiquette--alerte">à faire</span>`}</td><td class="actions"><a class="btn btn--sm btn--fantome" href="#joueurs/${esc(j.id)}">Évaluer</a></td></tr>`).join("")}</tbody></table>`; };
    rendu(); $("filtreJ").addEventListener("input", rendu); $("filtreCat").addEventListener("change", rendu);
  }
  async function ficheJoueur(el, id) {
    const pp = await get(`/api/joueurs/${id}/passeport`);
    const p = pp.player, trim = pp.scolaireStatut.trimestre, courante = pp.evaluations.find((e) => e.trimestre === trim);
    actions(`<a class="btn btn--sm btn--fantome" href="#joueurs">${ico("fleche")}Mes joueurs</a>`);
    el.innerHTML = `
    <div class="resume-enfant"><h2>${esc(p.name)}</h2><div class="meta"><span>${p.age ? p.age + " ans" : ""}</span><span>${esc(p.categorie || "")}</span><span>${esc(p.filiere)}</span><span>${esc(p.poste || "")}</span>${pp.presence.n ? `<span>${pp.presence.taux} % de présence</span>` : ""}${p.parent_phone ? `<a class="etiquette" href="${waLink(p.parent_phone)}" target="_blank" rel="noopener">WhatsApp parent</a>` : ""}</div></div>
    <div class="deux">
      <section class="panneau"><div class="panneau__tete"><h2>Évaluation ${esc(trimestreFr(trim))}</h2>${courante ? `<span class="etiquette etiquette--succes">enregistrée</span>` : `<span class="etiquette etiquette--alerte">à faire</span>`}</div>
        <form class="form" id="formEval"><div class="notes-axes">${window.PASSEPORT.AXES.map(([k, l]) => `<label><span>${l}</span><input type="range" name="${k}" min="0" max="10" step="0.5" value="${courante?.[k] ?? 5}" oninput="this.nextElementSibling.value=this.value"><output>${courante?.[k] ?? 5}</output></label>`).join("")}</div><label class="champ"><span>Commentaire pour la famille</span><textarea name="commentaire" rows="3" placeholder="Points forts, axes de travail, attitude…">${esc(courante?.commentaire || "")}</textarea></label><div class="form__actions"><button class="btn btn--sm">${ico("ok")}Enregistrer l'évaluation</button></div></form>
      </section>
      <section class="panneau"><div class="panneau__tete"><h2>Progression</h2></div>${pp.evaluations.length ? radar(pp.evaluations.slice(-3)) + `<div class="legende">${pp.evaluations.slice(-3).map((e) => `<span>${esc(trimestreFr(e.trimestre).replace(" · ", " "))}</span>`).join("")}</div>` : vide("radar", "Pas encore de radar", "Il apparaît dès la première évaluation enregistrée.")}</section>
      <section class="panneau"><h2>Observations</h2>
        ${pp.observations.length ? `<ul class="liste-simple">${pp.observations.map((o) => `<li><span>${esc(o.texte)}</span><small>${esc(dateFr(o.date))}</small></li>`).join("")}</ul>` : `<p class="corps" style="font-size:var(--t-sm)">Aucune observation. Notez ce que vous remarquez à l'entraînement : les parents le voient dans le passeport.</p>`}
        <form class="form" id="formObs"><label class="champ"><span>Nouvelle observation</span><input name="texte" required maxlength="500"></label><div class="form__actions"><button class="btn btn--sm">Ajouter</button></div></form>
      </section>
      <section class="panneau"><div class="panneau__tete"><h2>Suivi scolaire</h2>${p.filiere === "Sport-Études" ? (pp.scolaireStatut.eligibleTournoi ? `<span class="etiquette etiquette--succes">éligible aux tournois</span>` : `<span class="etiquette etiquette--erreur">tournois suspendus</span>`) : `<span class="etiquette etiquette--neutre">loisirs</span>`}</div>
        ${pp.scolaire.length ? `<div class="table-wrap"><table class="tab"><thead><tr><th>Trimestre</th><th class="num">Moyenne</th><th>Commentaire</th></tr></thead><tbody>${pp.scolaire.map((s) => `<tr><td>${esc(trimestreFr(s.trimestre))}</td><td class="num">${s.moyenne == null ? "—" : s.moyenne + "/20"}</td><td>${esc(s.commentaire)}</td></tr>`).join("")}</tbody></table></div>` : `<p class="corps" style="font-size:var(--t-sm)">Aucune moyenne saisie pour ce joueur.</p>`}
        <form class="form" id="formScolaire"><div class="grille-champs"><label class="champ"><span>Trimestre</span><input name="trimestre" value="${esc(trim)}" pattern="\\d{4}-\\d{4}-T[123]"></label><label class="champ"><span>Moyenne /20</span><input name="moyenne" type="number" min="0" max="20" step="0.25" required></label></div><label class="champ"><span>Commentaire</span><input name="commentaire" placeholder="Bulletin reçu le…"></label><div class="form__actions"><button class="btn btn--sm">Enregistrer</button></div></form>
      </section>
    </div>`;
    const soumettre = (form, url, msg) => form.addEventListener("submit", async (e) => { e.preventDefault(); try { await post(url, { trimestre: trim, ...lire(form) }); toast(msg, "succes"); E = null; ficheJoueur(el, id); } catch (err) { toast(err.message, "erreur"); } });
    soumettre($("formEval"), `/api/joueurs/${id}/evaluations`, "Évaluation enregistrée");
    soumettre($("formObs"), `/api/joueurs/${id}/observations`, "Observation ajoutée");
    soumettre($("formScolaire"), `/api/joueurs/${id}/scolaire`, "Moyenne enregistrée");
  }

  /* ---------- absences ---------- */
  async function vueAbsences(el) {
    actions("");
    await charger();
    const parJoueur = {}; E.absences.forEach((a) => { (parJoueur[a.player_id] ||= { name: a.name, dates: [], id: a.player_id }).dates.push(a.date); });
    const rows = Object.values(parJoueur).sort((a, b) => b.dates.length - a.dates.length);
    el.innerHTML = `<section class="panneau"><p class="corps" style="font-size:var(--t-sm)">Absences non excusées pointées sur les 14 derniers jours. Un message WhatsApp au parent évite qu'un décrochage s'installe.</p>${rows.length ? `<div class="table-wrap"><table class="tab"><thead><tr><th>Joueur</th><th class="num">Absences</th><th>Dates</th><th></th></tr></thead><tbody>${rows.map((r) => { const j = E.joueurs.find((x) => x.id === r.id); return `<tr><td><a href="#joueurs/${esc(r.id)}"><b>${esc(r.name)}</b></a></td><td class="num"><span class="etiquette etiquette--${r.dates.length >= 3 ? "erreur" : "alerte"}">${r.dates.length}</span></td><td><small>${r.dates.map((d) => esc(dateFr(d))).join(", ")}</small></td><td class="actions">${j?.parent_phone ? `<a class="btn btn--sm btn--fantome" href="${waLink(j.parent_phone, `Bonjour, ${r.name} a manqué ${r.dates.length} séance${r.dates.length > 1 ? "s" : ""} récemment à Elite Football Academy. Tout va bien ? Coach ${user.name}.`)}" target="_blank" rel="noopener">${ico("whatsapp")}Prévenir</a>` : ""}</td></tr>`; }).join("")}</tbody></table></div>` : vide("ok", "Aucune absence récente", "Tous vos joueurs ont été présents ou excusés sur les deux dernières semaines.")}</section>`;
  }

  /* ---------- détections ---------- */
  async function vueDetections(el) {
    if (!E) await charger();
    const id = location.hash.split("/")[1] || E.detections[0]?.id;
    actions("");
    if (!id) { el.innerHTML = vide("cible", "Aucune détection programmée", "Les journées planifiées par la direction apparaîtront ici avec leur grille de notation."); return; }
    const d = E.detections.find((x) => x.id === id);
    const cands = await get(`/api/coach/detections/${id}/candidats`);
    const moy = (c) => { const v = [c.note_tech, c.note_phys, c.note_jeu, c.note_mental].filter((x) => x != null); return v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : "—"; };
    el.innerHTML = `<div class="filtres" style="margin-bottom:1rem"><select id="detSel" aria-label="Journée">${option(E.detections.map((x) => ({ value: x.id, label: `${dateFr(x.date)} · ${x.titre}` })), id)}</select></div>
    <section class="panneau"><div class="panneau__tete"><h2>${esc(d.titre)} · ${esc(dateFr(d.date))}</h2><span class="etiquette etiquette--neutre">${cands.length} candidats · notes de 0 à 10</span></div>
      ${cands.length ? `<div class="table-wrap"><table class="tab"><thead><tr><th class="num">Dossard</th><th>Candidat</th><th class="num">Présent</th><th class="num">Tech.</th><th class="num">Phys.</th><th class="num">Jeu</th><th class="num">Mental</th><th class="num">Moy.</th><th>Avis</th></tr></thead><tbody>${cands.map((c) => `<tr data-cand="${esc(c.id)}"><td class="num"><b>${c.dossard}</b></td><td><b>${esc(c.nom)}</b><br><small>${c.age ? c.age + " ans · " : ""}${esc(c.poste || "")}</small></td><td class="num"><input type="checkbox" data-champ="present" ${c.present ? "checked" : ""} aria-label="Présent"></td>${["note_tech", "note_phys", "note_jeu", "note_mental"].map((k) => `<td class="num"><input type="number" min="0" max="10" step="0.5" value="${c[k] ?? ""}" data-champ="${k}" style="width:4rem;padding:.3rem;border:1px solid var(--ligne-forte);border-radius:6px" aria-label="${k}"></td>`).join("")}<td class="num"><b data-moy>${moy(c)}</b></td><td><input data-champ="commentaire" value="${esc(c.commentaire || "")}" placeholder="Remarque" style="min-width:10rem;padding:.3rem;border:1px solid var(--ligne-forte);border-radius:6px"></td></tr>`).join("")}</tbody></table></div><p class="corps" style="font-size:var(--t-xs)">Enregistrement automatique. La décision finale (retenu, liste d'attente) revient à la direction.</p>` : vide("groupe", "Aucun candidat inscrit", "Les inscriptions arrivent depuis le site public.")}
    </section>`;
    $("detSel").addEventListener("change", (e) => { location.hash = `#detections/${e.target.value}`; });
    el.addEventListener("change", async (e) => { const tr = e.target.closest("tr[data-cand]"), champ = e.target.dataset.champ; if (!tr || !champ) return; const val = e.target.type === "checkbox" ? e.target.checked : e.target.value; try { await put(`/api/candidats/${tr.dataset.cand}`, { [champ]: val }); const c = cands.find((x) => x.id === tr.dataset.cand); if (champ.startsWith("note")) c[champ] = val === "" ? null : +val; tr.querySelector("[data-moy]").textContent = moy(c); } catch (err) { toast(err.message, "erreur"); } });
  }

  /* ---------- lancement ---------- */
  if (user.must_change) {
    const d = await formulaire("Première connexion : choisissez votre mot de passe", `<p class="corps" style="font-size:var(--t-sm)">Remplacez le mot de passe provisoire par un mot de passe personnel d'au moins 8 caractères.</p><label class="champ"><span>Mot de passe provisoire</span><input name="current" type="password" required></label><label class="champ"><span>Nouveau mot de passe</span><input name="next" type="password" required minlength="8"></label>`, { libelle: "Enregistrer" });
    if (d) { try { await post("/api/auth/password", d); toast("Mot de passe enregistré", "succes"); } catch (err) { toast(err.message, "erreur"); } }
  }
  const afficher = coquille({ titreEspace: "Coach", vues: [
    { id: "semaine", libelle: "Ma semaine", icone: "calendrier", rendu: vueSemaine },
    { id: "presences", libelle: "Présences", icone: "ok", rendu: vuePresences },
    { id: "joueurs", libelle: "Mes joueurs", icone: "utilisateur", rendu: vueJoueurs },
    { id: "absences", libelle: "Absences", icone: "alerte", rendu: vueAbsences },
    { id: "detections", libelle: "Détections", icone: "cible", rendu: vueDetections },
  ] });
  afficher();
})();
