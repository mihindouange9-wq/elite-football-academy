/* ============================================================
   Espace parents : résumé de l'enfant, planning, présences, passeport, cotisations et paiements
   (déclaration Mobile Money, reçus), convocations, documents, partage du passeport.
   ============================================================ */
(async () => {
  const { esc, ico, fcfa, dateFr, moisFr, trimestreFr, waLink, get, post, del, toast, confirmer, radar } = window.EFA;
  const { session, coquille, badge, formulaire, option, etiquette, libelleStatut } = window.APP;
  const user = await session(["parent"]); if (!user) return;
  const $ = (id) => document.getElementById(id);
  const actions = (html) => { $("barreActions").innerHTML = html; };
  const vide = (icone, titre, texte) => `<div class="etat-vide">${ico(icone)}<h3>${esc(titre)}</h3><p>${esc(texte)}</p></div>`;
  const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
  let E = null, enfantId = localStorage.getItem("efa-enfant") || "";
  const charger = async () => { E = await get("/api/parents/espace"); if (!E.enfants.some((e) => e.id === enfantId)) enfantId = E.enfants[0]?.id || ""; $("latWa").href = waLink(E.academie.whatsapp, `Bonjour, je suis ${user.name}, parent d'un joueur de l'académie.`); const dues = E.enfants.reduce((a, e) => a + e.fees.filter((f) => f.status === "due").length, 0); badge("cotisations", dues); return E; };
  const enfant = () => E.enfants.find((e) => e.id === enfantId);
  const onglets = () => E.enfants.length > 1 ? `<div class="enfant-onglets" role="tablist" style="margin-bottom:1rem">${E.enfants.map((e) => `<button role="tab" aria-selected="${e.id === enfantId}" data-enfant="${esc(e.id)}"><span class="avatar" style="width:1.8rem;height:1.8rem;font-size:.8rem">${esc(e.name[0])}</span>${esc(e.name)}</button>`).join("")}</div>` : "";
  const brancherOnglets = (el, rendu) => el.addEventListener("click", (e) => { const b = e.target.closest("[data-enfant]"); if (!b) return; enfantId = b.dataset.enfant; localStorage.setItem("efa-enfant", enfantId); rendu(el); });
  const sansEnfant = (el) => { el.innerHTML = vide("utilisateur", "Aucun enfant rattaché", `Votre compte n'est relié à aucun joueur. Contactez l'académie sur WhatsApp pour rattacher votre enfant.`); };

  /* ---------- résumé ---------- */
  async function vueResume(el) {
    actions("");
    await charger(); const c = enfant(); if (!c) return sansEnfant(el);
    const prochaine = (() => { const jourIdx = (new Date().getDay() + 6) % 7; for (let k = 0; k < 7; k++) { const j = JOURS[(jourIdx + k) % 7]; const s = c.seances.filter((x) => x.jour === j).sort((a, b) => a.debut.localeCompare(b.debut))[0]; if (s && (k > 0 || s.debut >= new Date().toTimeString().slice(0, 5))) return { ...s, dans: k }; } return null; })();
    const dues = c.fees.filter((f) => f.status === "due"), attente = c.payments.filter((p) => p.status === "pending");
    const derniere = c.passeport.evaluations[c.passeport.evaluations.length - 1];
    const docsManquants = c.documents.filter((d) => !d.ok);
    el.innerHTML = `${onglets()}
    <div class="resume-enfant"><div style="display:flex;align-items:center;gap:1rem"><span class="avatar">${esc(c.name[0])}</span><div><h2>${esc(c.name)}</h2><div class="meta"><span>${c.age ? c.age + " ans" : ""}</span><span>${esc(c.categorie || "groupe à définir")}</span><span>${esc(c.filiere)}</span><span>${esc(c.poste || "")}</span>${c.statut === "inactif" ? etiquette("inactif") : ""}</div></div></div></div>
    <dl class="cartes">
      <div class="indicateur"><dt>Prochaine séance</dt><dd>${prochaine ? `${prochaine.dans === 0 ? "Aujourd'hui" : prochaine.dans === 1 ? "Demain" : esc(prochaine.jour)}<small> · ${esc(prochaine.debut)} · ${esc(prochaine.lieu || "")}</small>` : `<span class="vide-indic">planning à venir</span>`}</dd></div>
      <div class="indicateur"><dt>Présence</dt><dd>${c.presence.n ? `${c.presence.taux}<small> % sur ${c.presence.n} séances</small>` : `<span class="vide-indic">pas encore de pointage</span>`}</dd></div>
      <div class="indicateur ${dues.length ? "indicateur--alerte" : ""}"><dt>Cotisations</dt><dd>${dues.length ? `${dues.length}<small> à régler · ${fcfa(dues.reduce((a, f) => a + f.amount, 0))}</small>` : c.fees.length ? `À jour` : `<span class="vide-indic">aucune échéance</span>`}</dd></div>
      <div class="indicateur indicateur--or"><dt>Dernière évaluation</dt><dd>${derniere ? `${window.PASSEPORT.moy(derniere)}<small> / 10 · ${esc(trimestreFr(derniere.trimestre).split(" · ")[0])}</small>` : `<span class="vide-indic">à venir</span>`}</dd></div>
    </dl>
    ${attente.length ? `<div class="message message--info">${ico("info")}<span>${attente.length} paiement${attente.length > 1 ? "s" : ""} déclaré${attente.length > 1 ? "s" : ""} en attente de vérification par l'académie.</span></div>` : ""}
    ${c.filiere === "Sport-Études" && c.scolaireStatut.regleActive && !c.scolaireStatut.eligibleTournoi ? `<div class="message message--alerte">${ico("alerte")}<span>${c.scolaireStatut.aJour ? `Moyenne du trimestre (${c.scolaireStatut.moyenne}/20) sous le seuil de ${E.academie.moyenne_min}/20 : la participation aux tournois est suspendue jusqu'au prochain bulletin.` : "Moyenne du trimestre non transmise : apportez le bulletin pour maintenir l'éligibilité aux tournois."}</span></div>` : ""}
    <div class="deux">
      <section class="panneau"><div class="panneau__tete"><h2>Convocations et informations</h2></div>${c.news.length ? c.news.slice(0, 4).map((n) => `<div class="annonce" style="margin-bottom:.6rem"><time>${esc(n.type)} · ${esc(dateFr(n.date))}</time><b>${esc(n.title)}</b>${n.body ? `<p>${esc(n.body)}</p>` : ""}</div>`).join("") : `<p class="corps" style="font-size:var(--t-sm)">Aucune convocation ni information récente pour le groupe de ${esc(c.name)}.</p>`}</section>
      <section class="panneau"><div class="panneau__tete"><h2>Documents du dossier</h2></div><div style="display:grid;gap:.5rem">${c.documents.map((d) => `<div class="doc ${d.ok ? "ok" : ""}">${ico(d.ok ? "ok" : "alerte")}<div><b>${esc(d.libelle)}</b><br><small>${esc(d.detail)}</small></div></div>`).join("")}</div>${docsManquants.length ? `<p class="corps" style="font-size:var(--t-sm);margin-top:.8rem">Les documents se remettent en main propre à l'académie${E.academie.lieu ? ` (${esc(E.academie.lieu)})` : ""}.</p>` : ""}</section>
    </div>`;
    brancherOnglets(el, vueResume);
  }

  /* ---------- planning et présences ---------- */
  async function vuePlanning(el) {
    actions("");
    if (!E) await charger(); const c = enfant(); if (!c) return sansEnfant(el);
    el.innerHTML = `${onglets()}<div class="deux">
      <section class="panneau"><div class="panneau__tete"><h2>Séances de ${esc(c.name)}</h2>${c.categorie ? `<span class="etiquette etiquette--neutre">${esc(c.categorie)}</span>` : ""}</div>${c.seances.length ? `<ul class="liste-simple">${JOURS.map((j) => c.seances.filter((s) => s.jour === j).sort((a, b) => a.debut.localeCompare(b.debut)).map((s) => `<li><span><b>${esc(j)}</b> ${esc(s.debut)}–${esc(s.fin)}<small>${esc(s.type)} · ${esc(s.lieu || "")}${s.coach ? " · coach " + esc(s.coach) : ""}</small></span></li>`).join("")).join("")}</ul>` : vide("calendrier", "Planning à venir", "Le planning du groupe sera publié par l'académie.")}</section>
      <section class="panneau"><div class="panneau__tete"><h2>Présences</h2>${c.presence.n ? `<span class="etiquette">${c.presence.taux} % sur ${c.presence.n}</span>` : ""}</div>${c.presences.length ? `<div class="jauge-fine" style="margin-bottom:1rem"><span style="width:${c.presence.taux}%"></span></div><ul class="liste-simple">${c.presences.map((a) => `<li><span>${esc(dateFr(a.date))}${a.type ? " · " + esc(a.type) : ""}${a.note ? `<small>${esc(a.note)}</small>` : ""}</span>${etiquette(a.status)}</li>`).join("")}</ul>` : `<p class="corps" style="font-size:var(--t-sm)">Aucun pointage pour l'instant : le coach pointe les présences à chaque séance.</p>`}</section>
    </div>`;
    brancherOnglets(el, vuePlanning);
  }

  /* ---------- passeport ---------- */
  async function vuePasseport(el) {
    if (!E) await charger(); const c = enfant(); if (!c) { actions(""); return sansEnfant(el); }
    const lien = c.share?.token ? `${location.origin}/passeport/${c.share.token}` : "";
    actions(lien ? `<button class="btn btn--sm btn--fantome" id="btnCopier">${ico("lien")}Copier le lien</button><button class="btn btn--sm btn--fantome" id="btnRevoquer">Révoquer le lien</button>` : `<button class="btn btn--sm" id="btnPartager">${ico("partage")}Partager à un club</button>`);
    el.innerHTML = `${onglets()}<div class="passeport" style="padding:0">${window.PASSEPORT.html({ ...c.passeport, academie: E.academie.nom, scolaire: c.passeport.scolaire })}</div>${lien ? `<section class="panneau" style="margin-top:1rem"><h2>Lien de partage actif</h2><p class="corps" style="font-size:var(--t-sm)">Toute personne disposant de ce lien peut consulter le passeport en lecture seule (${c.share.scope === "complet" ? "complet, avec les moyennes scolaires" : "évaluations sportives et présence uniquement"}). Chaque consultation est enregistrée ; vous pouvez le révoquer à tout moment.</p><code style="display:block;font-size:.85rem;word-break:break-all;background:var(--creme);padding:.7rem;border-radius:var(--r-sm)">${esc(lien)}</code></section>` : ""}`;
    brancherOnglets(el, vuePasseport);
    $("btnPartager")?.addEventListener("click", async () => {
      const d = await formulaire("Partager le passeport", `<p class="corps" style="font-size:var(--t-sm)">En créant ce lien, vous autorisez, en tant que responsable légal, la consultation du passeport de ${esc(c.name)} par les personnes à qui vous le transmettez (club, recruteur, famille). Le lien est révocable à tout moment.</p><label class="champ"><span>Contenu partagé</span><select name="scope">${option([{ value: "evaluations", label: "Évaluations sportives et présence" }, { value: "complet", label: "Complet : avec moyennes scolaires et observations" }], "evaluations")}</select></label><label class="champ champ--case"><input type="checkbox" name="accord" required><span>J'autorise ce partage en tant que responsable légal.</span></label>`, { libelle: "Créer le lien" });
      if (!d) return; try { await post(`/api/parents/enfants/${c.id}/partage`, d); toast("Lien créé", "succes"); E = null; vuePasseport(el); } catch (err) { toast(err.message, "erreur"); }
    });
    $("btnRevoquer")?.addEventListener("click", async () => { if (await confirmer("Révoquer le lien ?", "Le lien ne fonctionnera plus pour personne.", "Révoquer")) { await del(`/api/parents/enfants/${c.id}/partage`); toast("Lien révoqué"); E = null; vuePasseport(el); } });
    $("btnCopier")?.addEventListener("click", () => navigator.clipboard.writeText(lien).then(() => toast("Lien copié", "succes")));
  }

  /* ---------- cotisations ---------- */
  async function vueCotisations(el) {
    actions("");
    await charger(); const c = enfant(); if (!c) return sansEnfant(el);
    const dues = c.fees.filter((f) => f.status === "due");
    const recu = (p) => `<div class="passeport" style="padding:0"><header class="passeport__tete"><div style="display:flex;align-items:center;gap:1rem"><img src="/assets/logo_elite.png" alt=""><div class="passeport__id"><p class="sur-titre">Reçu de paiement</p><h1>${esc(p.receipt_no)}</h1><p>${esc(E.academie.nom)}${E.academie.lieu ? " · " + esc(E.academie.lieu) : ""}</p></div></div></header><div class="panneau"><ul class="liste-simple"><li><span>Joueur</span><b>${esc(c.name)}</b></li><li><span>Objet</span><b>Cotisation ${esc(c.fees.find((f) => f.id === p.fee_id) ? moisFr(c.fees.find((f) => f.id === p.fee_id).month) : "")}</b></li><li><span>Montant</span><b>${fcfa(p.amount)}</b></li><li><span>Moyen</span><b>${esc(p.method)}${p.reference ? " · réf. " + esc(p.reference) : ""}</b></li><li><span>Validé le</span><b>${esc(dateFr(p.validated_at))}</b></li></ul></div><p class="passeport__mention">Reçu établi par ${esc(E.academie.nom)} après vérification de l'encaissement.</p></div>`;
    el.innerHTML = `${onglets()}
    ${E.academie.mobile_money ? `<div class="message message--info">${ico("argent")}<span><b>Comment payer :</b> ${esc(E.academie.mobile_money)}. Après le transfert, déclarez-le ci-dessous avec la référence de la transaction : l'académie vérifie puis émet le reçu.</span></div>` : `<div class="message message--info">${ico("info")}<span>Le paiement se fait à l'académie (espèces ou Mobile Money). Vous pouvez déclarer ici un transfert déjà effectué ; l'académie le vérifie avant d'émettre le reçu.</span></div>`}
    <div class="deux">
      <section class="panneau" style="grid-column:1/-1"><div class="panneau__tete"><h2>Échéancier de ${esc(c.name)}</h2>${dues.length ? `<span class="etiquette etiquette--alerte">${fcfa(dues.reduce((a, f) => a + f.amount, 0))} à régler</span>` : c.fees.length ? `<span class="etiquette etiquette--succes">à jour</span>` : ""}</div>
        ${c.fees.length ? `<div class="table-wrap"><table class="tab"><thead><tr><th>Mois</th><th class="num">Montant</th><th>Statut</th><th></th></tr></thead><tbody>${c.fees.map((f) => { const pend = c.payments.find((p) => p.fee_id === f.id && p.status === "pending"); return `<tr><td><b>${esc(moisFr(f.month))}</b></td><td class="num">${f.status === "waived" ? "—" : fcfa(f.amount)}</td><td>${etiquette(f.status)}${f.paid_at ? `<br><small>le ${esc(dateFr(f.paid_at))}</small>` : pend ? `<br><small>déclaration en attente</small>` : ""}</td><td class="actions">${f.status === "due" && !pend ? `<button class="btn btn--sm" data-declarer="${esc(f.id)}">${ico("argent")}Déclarer un paiement</button>` : ""}</td></tr>`; }).join("")}</tbody></table></div>` : `<p class="corps" style="font-size:var(--t-sm)">Aucune échéance pour l'instant : l'académie génère l'échéancier chaque mois.</p>`}
      </section>
      <section class="panneau" style="grid-column:1/-1"><div class="panneau__tete"><h2>Paiements et reçus</h2></div>
        ${c.payments.length ? `<div class="table-wrap"><table class="tab"><thead><tr><th>Date</th><th class="num">Montant</th><th>Moyen</th><th>Statut</th><th></th></tr></thead><tbody>${c.payments.map((p) => `<tr><td>${esc(dateFr(p.created_at))}</td><td class="num">${fcfa(p.amount)}</td><td>${esc(p.method)}${p.reference ? `<br><small>réf. ${esc(p.reference)}</small>` : ""}</td><td>${etiquette(p.status)}${p.status === "rejected" && p.note ? `<br><small>${esc(p.note)}</small>` : ""}</td><td class="actions">${p.status === "validated" ? `<button class="btn btn--sm btn--fantome" data-recu="${esc(p.id)}">${ico("recu")}Reçu ${esc(p.receipt_no)}</button>` : ""}</td></tr>`).join("")}</tbody></table></div>` : `<p class="corps" style="font-size:var(--t-sm)">Aucun paiement enregistré.</p>`}
      </section>
    </div>`;
    brancherOnglets(el, vueCotisations);
    el.addEventListener("click", async (e) => {
      const b = e.target.closest("button[data-declarer],button[data-recu]"); if (!b) return;
      if (b.dataset.declarer) { const f = c.fees.find((x) => x.id === b.dataset.declarer); const d = await formulaire(`Déclarer le paiement de ${moisFr(f.month)}`, `<div class="grille-champs"><label class="champ"><span>Montant (FCFA)</span><input name="amount" type="number" min="1" value="${f.amount}" required></label><label class="champ"><span>Moyen</span><select name="method">${option(["Airtel Money", "Moov Money", "Espèces", "Virement"], "Airtel Money")}</select></label></div><label class="champ"><span>Référence de la transaction <small>recommandé</small></span><input name="reference" placeholder="ID du transfert Mobile Money"></label><label class="champ"><span>Remarque</span><input name="note"></label><input type="hidden" name="fee_id" value="${esc(f.id)}">`, { libelle: "Envoyer la déclaration" }); if (!d) return; try { const r = await post(`/api/parents/enfants/${c.id}/paiements`, d); toast(r.message, "succes"); vueCotisations(el); } catch (err) { toast(err.message, "erreur"); } }
      if (b.dataset.recu) { const p = c.payments.find((x) => x.id === b.dataset.recu); const dlg = document.createElement("dialog"); dlg.className = "dialogue"; dlg.style.width = "min(96vw,48rem)"; dlg.innerHTML = `<div class="dialogue__corps">${recu(p)}<div class="dialogue__actions sans-impression"><button class="btn btn--fantome" data-fermer>Fermer</button><button class="btn" onclick="window.print()">${ico("imprimer")}Imprimer / PDF</button></div></div>`; document.body.appendChild(dlg); dlg.querySelector("[data-fermer]").addEventListener("click", () => dlg.close()); dlg.addEventListener("close", () => dlg.remove()); dlg.showModal(); }
    });
  }

  /* ---------- lancement ---------- */
  if (user.must_change) {
    const d = await formulaire("Bienvenue : choisissez votre mot de passe", `<p class="corps" style="font-size:var(--t-sm)">Remplacez le mot de passe provisoire remis par l'académie par un mot de passe personnel d'au moins 8 caractères.</p><label class="champ"><span>Mot de passe provisoire</span><input name="current" type="password" required></label><label class="champ"><span>Nouveau mot de passe</span><input name="next" type="password" required minlength="8"></label>`, { libelle: "Enregistrer" });
    if (d) { try { await post("/api/auth/password", d); toast("Mot de passe enregistré", "succes"); } catch (err) { toast(err.message, "erreur"); } }
  }
  const afficher = coquille({ titreEspace: "Parent", vues: [
    { id: "resume", libelle: "Mon enfant", icone: "maison", rendu: vueResume },
    { id: "planning", libelle: "Planning et présences", icone: "calendrier", rendu: vuePlanning },
    { id: "passeport", libelle: "Passeport", icone: "radar", rendu: vuePasseport },
    { id: "cotisations", libelle: "Cotisations", icone: "argent", rendu: vueCotisations },
  ] });
  afficher();
})();
