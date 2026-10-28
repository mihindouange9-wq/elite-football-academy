/* ============================================================
   Espace direction : pilotage, demandes, joueurs et passeports, groupes et planning, détections,
   cotisations et paiements, rapport mensuel, actualités, comptes, paramètres, journal et sauvegarde.
   ============================================================ */
(async () => {
  const { esc, ico, fcfa, num, dateFr, moisFr, telAffiche, waLink, trimestreFr, get, post, put, patch, del, toast, confirmer, radar } = window.EFA;
  const { session, coquille, badge, formulaire, secretHtml, option, etiquette } = window.APP;
  const user = await session(["direction"]); if (!user) return;
  const $ = (id) => document.getElementById(id);
  const moisCourant = new Date().toISOString().slice(0, 7);
  const POSTES = ["À déterminer", "Gardien", "Défenseur", "Latéral", "Milieu", "Ailier", "Attaquant"];
  const FILIERES = ["Sport-Études", "Loisirs"];
  const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
  const METHODES = ["Espèces", "Airtel Money", "Moov Money", "Virement"];
  let CATS = [], COACHS = [];
  async function references() { [CATS, COACHS] = await Promise.all([get("/api/direction/categories"), get("/api/direction/utilisateurs").then((u) => u.filter((x) => x.role === "coach" && x.active))]); }
  const catOpt = (sel) => option(CATS.map((c) => ({ value: c.id, label: c.name })), sel, "— Aucun groupe —");
  const coachOpt = (sel) => option(COACHS.map((c) => ({ value: c.id, label: c.name })), sel, "— Aucun coach —");
  const actions = (html) => { $("barreActions").innerHTML = html; };
  const vide = (icone, titre, texte, bouton = "") => `<div class="etat-vide">${ico(icone)}<h3>${esc(titre)}</h3><p>${esc(texte)}</p>${bouton}</div>`;

  /* ---------- tableau de bord ---------- */
  async function vueTableau(el) {
    actions(`<a class="btn btn--sm" href="#rapport">${ico("document")}Rapport du mois</a>`);
    const d = await get("/api/direction/dashboard");
    const k = d.kpis, dm = d.demarrage;
    badge("demandes", k.nouvelles); badge("finances", k.paiementsEnAttente);
    const kpi = (lib, val, suffixe = "", cls = "") => `<div class="indicateur ${cls}"><dt>${lib}</dt><dd>${val == null ? `<span class="vide-indic">Pas encore de données</span>` : `${val}<small>${suffixe}</small>`}</dd></div>`;
    const demarrageHtml = !dm.joueurs || !dm.coachs || !dm.echeancier ? `<section class="panneau"><h2>Pour démarrer</h2><div class="demarrage">
      <a href="#groupes" class="${dm.categories ? "fait" : ""}">${ico(dm.categories ? "ok" : "groupe")}Créer les groupes par tranche d'âge <small>(${dm.categories} groupe${dm.categories > 1 ? "s" : ""})</small></a>
      <a href="#comptes" class="${dm.coachs ? "fait" : ""}">${ico(dm.coachs ? "ok" : "sifflet")}Créer les comptes des coachs et les affecter aux groupes</a>
      <a href="#groupes" class="${dm.seances ? "fait" : ""}">${ico(dm.seances ? "ok" : "calendrier")}Planifier les séances de la semaine</a>
      <a href="#joueurs" class="${dm.joueurs ? "fait" : ""}">${ico(dm.joueurs ? "ok" : "utilisateur")}Enregistrer les premiers joueurs (ou convertir une demande)</a>
      <a href="#finances" class="${dm.echeancier ? "fait" : ""}">${ico(dm.echeancier ? "ok" : "argent")}Générer l'échéancier de ${esc(moisFr(d.month))}</a>
    </div></section>` : "";
    el.innerHTML = `
    <dl class="cartes">
      ${kpi("Joueurs actifs", k.joueurs, k.capacite ? ` / ${k.capacite} places` : "")}
      ${kpi("Taux de conversion", k.conversion, " %", "indicateur--or")}
      ${kpi("Présence (30 jours)", k.presence30, k.presence30 == null ? "" : ` % · ${k.presenceN} pointages`)}
      ${kpi("Encaissé ce mois", d.finances.echeancierGenere ? num(k.encaisse) : null, " FCFA")}
      ${kpi("Impayés", d.finances.echeancierGenere ? k.impayes : null, d.finances.echeancierGenere ? ` joueur${k.impayes > 1 ? "s" : ""} · ${num(k.impayesMontant)} FCFA` : "", k.impayes ? "indicateur--alerte" : "")}
      ${kpi("Paiements à vérifier", k.paiementsEnAttente, "", k.paiementsEnAttente ? "indicateur--alerte" : "")}
      ${kpi("Nouvelles demandes", k.nouvelles, ` / ${k.demandes} au total`, k.nouvelles ? "indicateur--or" : "")}
      ${kpi("Alertes scolaires", k.alertesScolaires, "", k.alertesScolaires ? "indicateur--erreur" : "")}
    </dl>
    ${demarrageHtml}
    <div class="deux">
      <section class="panneau"><div class="panneau__tete"><h2>Demandes reçues, 7 derniers jours</h2></div>${d.ins7.some((x) => x.n) ? `<div class="barres">${d.ins7.map((x) => `<div><i><span style="height:${(100 * x.n) / Math.max(...d.ins7.map((y) => y.n))}%"></span></i><b>${x.n}</b><small>${esc(x.jour)}</small></div>`).join("")}</div>` : vide("info", "Aucune demande cette semaine", "Les demandes du formulaire public apparaîtront ici.")}</section>
      <section class="panneau"><div class="panneau__tete"><h2>Demandes par statut</h2></div><div class="repartition">${Object.entries(d.parStatut).map(([s, n]) => `<div><span>${etiquette(s)}</span><i><span style="width:${k.demandes ? (100 * n) / k.demandes : 0}%"></span></i><b>${n}</b></div>`).join("")}</div></section>
      <section class="panneau"><div class="panneau__tete"><h2>Effectif par groupe</h2><a class="btn btn--sm btn--fantome" href="#groupes">Gérer</a></div>${d.categories.length ? `<div class="repartition">${d.categories.map((c) => `<div><span>${esc(c.name)}</span><i><span style="width:${c.capacity ? Math.min(100, (100 * c.n) / c.capacity) : 0}%;background:${c.capacity && c.n > c.capacity ? "var(--erreur)" : "var(--vert-vif)"}"></span></i><b>${c.n}${c.capacity ? ` / ${c.capacity}` : ""}</b></div>`).join("")}</div>` : vide("groupe", "Aucun groupe", "Créez les groupes par tranche d'âge pour répartir les joueurs.")}</section>
      <section class="panneau"><div class="panneau__tete"><h2>Finances de ${esc(moisFr(d.month))}</h2><a class="btn btn--sm btn--fantome" href="#finances">Détail</a></div>
        <ul class="liste-simple"><li><span>Cotisations attendues</span><b>${d.finances.echeancierGenere ? fcfa(k.attendus) : "échéancier à générer"}</b></li><li><span>Recettes validées</span><b>${fcfa(d.finances.recettesMois)}</b></li><li><span>Dépenses</span><b>${fcfa(d.finances.depensesMois)}</b></li><li><span>Solde du mois</span><b style="color:${d.finances.solde < 0 ? "var(--erreur)" : "var(--succes)"}">${fcfa(d.finances.solde)}</b></li><li><span>Point mort</span><b>${d.finances.pointMort != null ? `${d.finances.pointMort} joueurs <small>(charges fixes ${num(d.finances.chargesFixes)} FCFA ÷ cotisation moyenne ${num(d.finances.cotisationMoyenne)})</small>` : `<small>renseignez les charges fixes dans Paramètres</small>`}</b></li></ul></section>
      <section class="panneau"><div class="panneau__tete"><h2>Alertes</h2></div>
        ${k.medicalPerime || d.alertesScolaires.length || d.impayes.length ? `<ul class="liste-simple">
          ${k.medicalPerime ? `<li><span>${ico("alerte")} Visite médicale absente ou périmée</span><b>${k.medicalPerime} joueur${k.medicalPerime > 1 ? "s" : ""}</b></li>` : ""}
          ${d.alertesScolaires.map((a) => `<li><span>${esc(a.nom)} · ${!a.aJour ? "moyenne du trimestre manquante" : a.sousSeuil ? `moyenne ${a.moyenne}/20 sous le seuil` : `baisse (${a.precedente} → ${a.moyenne})`}</span>${a.eligibleTournoi ? etiquette("actif").replace("actif", "éligible") : `<span class="etiquette etiquette--erreur">tournoi suspendu</span>`}</li>`).join("")}
          ${d.impayes.map((i) => `<li><span>Cotisation en retard : ${esc(i.nom)}</span><b>${fcfa(i.montant)}</b></li>`).join("")}
        </ul>` : `<p class="corps" style="font-size:var(--t-sm)">Aucune alerte : dossiers médicaux, suivi scolaire et cotisations sont à jour, ou pas encore renseignés.</p>`}</section>
      <section class="panneau"><div class="panneau__tete"><h2>Dernières demandes</h2><a class="btn btn--sm btn--fantome" href="#demandes">Toutes</a></div>
        ${d.dernieres.length ? `<ul class="liste-simple">${d.dernieres.map((i) => `<li><span><b>${esc(i.enfant_nom)}</b>${i.enfant_age ? ` · ${esc(i.enfant_age)} ans` : ""} · ${esc(i.filiere || "filière à définir")}<small>${esc(i.parent_nom)} · ${esc(telAffiche(i.parent_tel))} · ${esc(dateFr(i.created_at))}</small></span>${etiquette(i.status)}</li>`).join("")}</ul>` : vide("info", "Aucune demande pour l'instant", "Dès qu'un parent remplit le formulaire du site, sa demande apparaît ici.")}</section>
      <section class="panneau"><div class="panneau__tete"><h2>Détections à venir</h2><a class="btn btn--sm btn--fantome" href="#detections">Gérer</a></div>
        ${d.detections.length ? `<ul class="liste-simple">${d.detections.map((x) => `<li><span><b>${esc(dateFr(x.date))}</b> · ${esc(x.titre)}<small>${esc(x.lieu)}</small></span><b>${x.inscrits} / ${x.places}</b></li>`).join("")}</ul>` : vide("calendrier", "Aucune détection programmée", "Planifiez une journée pour ouvrir les inscriptions en ligne.", `<a class="btn btn--sm" href="#detections">Planifier</a>`)}</section>
    </div>`;
  }

  /* ---------- demandes ---------- */
  async function vueDemandes(el) {
    actions("");
    const liste = await get("/api/direction/inscriptions");
    const rendu = () => {
      const q = ($("filtreDemande")?.value || "").toLowerCase(), st = $("filtreStatut")?.value || "";
      const rows = liste.filter((i) => (!st || i.status === st) && (!q || `${i.enfant_nom} ${i.parent_nom} ${i.parent_tel} ${i.quartier}`.toLowerCase().includes(q)));
      $("tabDemandes").innerHTML = rows.length ? `<table class="tab"><thead><tr><th>Date</th><th>Enfant</th><th>Parent</th><th>Filière</th><th>Statut</th><th></th></tr></thead><tbody>${rows.map((i) => `<tr>
        <td>${esc(dateFr(i.created_at, { day: "2-digit", month: "2-digit", year: "2-digit" }))}</td>
        <td><b>${esc(i.enfant_nom)}</b>${i.enfant_age ? ` · ${esc(i.enfant_age)} ans` : ""}${i.poste ? `<br><small>${esc(i.poste)}</small>` : ""}${i.niveau ? `<br><small>${esc(i.niveau)}</small>` : ""}</td>
        <td>${esc(i.parent_nom)}<br><small>${esc(telAffiche(i.parent_tel))}${i.quartier ? " · " + esc(i.quartier) : ""}</small>${i.message ? `<br><small><i>${esc(i.message)}</i></small>` : ""}</td>
        <td>${esc(i.filiere || "—")}</td>
        <td><select data-statut="${esc(i.id)}" class="btn btn--sm btn--fantome" aria-label="Statut">${option(["nouveau", "contacté", "détection", "inscrit", "refusé"], i.status)}</select></td>
        <td class="actions"><a class="btn btn--sm btn--fantome" href="${waLink(i.parent_tel, `Bonjour ${i.parent_nom}, Elite Football Academy a bien reçu votre demande pour ${i.enfant_nom}.`)}" target="_blank" rel="noopener" aria-label="WhatsApp">${ico("whatsapp")}</a>${i.player_id ? `<a class="btn btn--sm" href="#joueurs/${esc(i.player_id)}">Fiche joueur</a>` : `<button class="btn btn--sm" data-convertir="${esc(i.id)}">${ico("plus")}Joueur</button>`}<button class="btn btn--sm btn--fantome" data-suppr="${esc(i.id)}" aria-label="Supprimer">${ico("corbeille")}</button></td></tr>`).join("")}</tbody></table>` : vide("info", "Aucune demande", "Les demandes du formulaire public et les candidats des détections arrivent ici.");
    };
    el.innerHTML = `<section class="panneau"><div class="panneau__tete"><div class="filtres"><input id="filtreDemande" type="search" placeholder="Rechercher un enfant, un parent…" aria-label="Rechercher"><select id="filtreStatut" aria-label="Filtrer par statut">${option(["nouveau", "contacté", "détection", "inscrit", "refusé"], "", "Tous les statuts")}</select></div><button class="btn btn--sm btn--fantome" id="exportCsv">${ico("telecharger")}CSV</button></div><div class="table-wrap" id="tabDemandes"></div></section>`;
    rendu();
    $("filtreDemande").addEventListener("input", rendu); $("filtreStatut").addEventListener("change", rendu);
    $("exportCsv").addEventListener("click", () => { const lignes = [["date", "enfant", "age", "filiere", "poste", "niveau", "parent", "telephone", "email", "quartier", "message", "statut"], ...liste.map((i) => [i.created_at, i.enfant_nom, i.enfant_age, i.filiere, i.poste, i.niveau, i.parent_nom, i.parent_tel, i.parent_email, i.quartier, i.message, i.status])]; const csv = lignes.map((l) => l.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";")).join("\n"); const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv" })); a.download = "demandes-inscription.csv"; a.click(); });
    el.addEventListener("change", async (e) => { const id = e.target.dataset.statut; if (!id) return; try { await patch(`/api/direction/inscriptions/${id}`, { status: e.target.value }); toast("Statut mis à jour", "succes"); liste.find((i) => i.id === id).status = e.target.value; } catch (err) { toast(err.message, "erreur"); } });
    el.addEventListener("click", async (e) => {
      const b = e.target.closest("[data-convertir], [data-suppr]"); if (!b) return;
      if (b.dataset.convertir) { const d = await formulaire("Créer la fiche joueur", `<label class="champ"><span>Groupe</span><select name="categorie_id">${catOpt("")}</select></label><p class="corps" style="font-size:var(--t-sm)">La filière, le poste et les coordonnées du parent sont repris de la demande ; la cotisation suit le tarif de la filière.</p>`, { libelle: "Créer le joueur" }); if (!d) return; try { const r = await post(`/api/direction/inscriptions/${b.dataset.convertir}/convertir`, d); toast("Joueur créé", "succes"); location.hash = `#joueurs/${r.player_id}`; } catch (err) { toast(err.message, "erreur"); } }
      if (b.dataset.suppr && (await confirmer("Supprimer cette demande ?", "La demande sera définitivement effacée.", "Supprimer"))) { await del(`/api/direction/inscriptions/${b.dataset.suppr}`); liste.splice(liste.findIndex((i) => i.id === b.dataset.suppr), 1); rendu(); toast("Demande supprimée"); }
    });
  }

  /* ---------- joueurs ---------- */
  const formJoueur = (p = {}) => `<div class="grille-champs">
    <label class="champ"><span>Nom et prénom <small>requis</small></span><input name="name" required value="${esc(p.name || "")}"></label>
    <label class="champ"><span>Année de naissance</span><input name="birth_year" type="number" min="2000" max="2022" value="${esc(p.birth_year || "")}"></label>
    <label class="champ"><span>Groupe</span><select name="categorie_id">${catOpt(p.categorie_id || "")}</select></label>
    <label class="champ"><span>Filière</span><select name="filiere">${option(FILIERES, p.filiere || "Loisirs")}</select></label>
    <label class="champ"><span>Poste</span><select name="poste">${option(POSTES, p.poste || "À déterminer")}</select></label>
    <label class="champ"><span>Sexe</span><select name="sexe">${option(["", "Garçon", "Fille"], p.sexe || "")}</select></label>
    <label class="champ"><span>École</span><input name="ecole" value="${esc(p.ecole || "")}"></label>
    <label class="champ"><span>Classe</span><input name="classe" value="${esc(p.classe || "")}"></label>
    <label class="champ"><span>Parent ou tuteur</span><input name="parent_name" value="${esc(p.parent_name || "")}"></label>
    <label class="champ"><span>Téléphone du parent</span><input name="parent_phone" type="tel" inputmode="tel" value="${esc(p.parent_phone ? telAffiche(p.parent_phone) : "")}"></label>
    <label class="champ"><span>Quartier</span><input name="quartier" value="${esc(p.quartier || "")}"></label>
    <label class="champ"><span>Cotisation mensuelle (FCFA) <small>vide = tarif de la filière</small></span><input name="cotisation" type="number" min="0" step="500" value="${p.cotisation ?? ""}"></label>
    <label class="champ"><span>Visite médicale valable jusqu'au</span><input name="medical_until" type="date" value="${esc(p.medical_until || "")}"></label>
    <label class="champ"><span>Statut</span><select name="statut">${option(["actif", "inactif"], p.statut || "actif")}</select></label>
  </div>
  <label class="champ champ--case"><input type="checkbox" name="exonere" ${p.exonere ? "checked" : ""}><span>Exonéré de cotisation (journée détection quartiers populaires, bourse…)</span></label>
  <label class="champ champ--case"><input type="checkbox" name="autorisation" ${p.autorisation ? "checked" : ""}><span>Autorisation parentale signée reçue (nécessaire au partage du passeport)</span></label>
  <label class="champ champ--case"><input type="checkbox" name="consent_photos" ${p.consent_photos ? "checked" : ""}><span>Consentement photos et vidéos accordé</span></label>
  <label class="champ"><span>Notes internes</span><textarea name="notes" rows="2">${esc(p.notes || "")}</textarea></label>`;
  async function vueJoueurs(el) {
    const id = location.hash.split("/")[1];
    if (id) return ficheJoueur(el, id);
    actions(`<button class="btn btn--sm" id="btnNouveauJoueur">${ico("plus")}Nouveau joueur</button>`);
    const liste = await get("/api/direction/joueurs");
    const rendu = () => {
      const q = ($("filtreJoueur")?.value || "").toLowerCase(), cat = $("filtreCat")?.value || "", st = $("filtreStatutJ")?.value || "";
      const rows = liste.filter((p) => (!cat || p.categorie_id === cat) && (!st || p.statut === st) && (!q || `${p.name} ${p.parent_name} ${p.parent_phone}`.toLowerCase().includes(q)));
      $("tabJoueurs").innerHTML = rows.length ? `<table class="tab"><thead><tr><th>Joueur</th><th>Groupe</th><th>Filière</th><th>Parent</th><th class="num">Cotisation</th><th>Dossier</th><th></th></tr></thead><tbody>${rows.map((p) => `<tr>
        <td><a href="#joueurs/${esc(p.id)}"><b>${esc(p.name)}</b></a>${p.age ? `<br><small>${p.age} ans${p.poste && p.poste !== "À déterminer" ? " · " + esc(p.poste) : ""}</small>` : ""}</td>
        <td>${esc(p.categorie || "—")}</td><td>${esc(p.filiere)}</td>
        <td>${esc(p.parent_name || "—")}<br><small>${esc(telAffiche(p.parent_phone))}${p.parent_compte ? " · compte créé" : ""}</small></td>
        <td class="num">${p.exonere ? etiquette("waived") : fcfa(p.cotisation)}</td>
        <td>${p.medical_until && p.medical_until >= new Date().toISOString().slice(0, 10) ? `<span class="etiquette etiquette--succes">médical ok</span>` : `<span class="etiquette etiquette--alerte">médical</span>`} ${p.autorisation ? "" : `<span class="etiquette etiquette--alerte">autorisation</span>`} ${p.statut === "inactif" ? etiquette("inactif") : ""}</td>
        <td class="actions"><a class="btn btn--sm btn--fantome" href="#joueurs/${esc(p.id)}">Fiche</a></td></tr>`).join("")}</tbody></table>` : vide("utilisateur", "Aucun joueur", "Créez un joueur ou convertissez une demande d'inscription.", `<button class="btn btn--sm" id="btnNouveauJoueur2">${ico("plus")}Nouveau joueur</button>`);
    };
    el.innerHTML = `<section class="panneau"><div class="panneau__tete"><div class="filtres"><input id="filtreJoueur" type="search" placeholder="Rechercher…" aria-label="Rechercher un joueur"><select id="filtreCat" aria-label="Groupe">${catOpt("").replace("— Aucun groupe —", "Tous les groupes")}</select><select id="filtreStatutJ" aria-label="Statut">${option(["actif", "inactif"], "", "Actifs et inactifs")}</select></div><span class="etiquette etiquette--neutre">${liste.length} joueur${liste.length > 1 ? "s" : ""}</span></div><div class="table-wrap" id="tabJoueurs"></div></section>`;
    rendu();
    ["filtreJoueur", "filtreCat", "filtreStatutJ"].forEach((i) => $(i).addEventListener("input", rendu));
    const nouveau = async () => { const d = await formulaire("Nouveau joueur", formJoueur(), { libelle: "Créer", large: true }); if (!d) return; try { const r = await post("/api/direction/joueurs", d); toast("Joueur créé", "succes"); location.hash = `#joueurs/${r.id}`; } catch (err) { toast(err.message, "erreur"); } };
    el.addEventListener("click", (e) => { if (e.target.closest("#btnNouveauJoueur2")) nouveau(); });
    $("btnNouveauJoueur").addEventListener("click", nouveau);
  }
  async function ficheJoueur(el, id) {
    const pp = await get(`/api/joueurs/${id}/passeport`);
    const p = pp.player, sc = pp.scolaireStatut, trim = pp.scolaireStatut.trimestre;
    const presences = await get(`/api/joueurs/${id}/presences`);
    actions(`<a class="btn btn--sm btn--fantome" href="#joueurs">${ico("fleche")}Liste</a><button class="btn btn--sm btn--fantome" id="btnModifier">${ico("crayon")}Modifier</button><button class="btn btn--sm btn--fantome" id="btnSupprimer">${ico("corbeille")}Supprimer</button>`);
    const lienPartage = pp.share?.token ? `${location.origin}/passeport/${pp.share.token}` : "";
    el.innerHTML = `
    <div class="resume-enfant"><h2>${esc(p.name)}</h2><div class="meta"><span>${p.age ? p.age + " ans" : "âge inconnu"}</span><span>${esc(p.categorie || "sans groupe")}</span><span>${esc(p.filiere)}</span><span>${esc(p.poste || "")}</span>${p.ecole ? `<span>${esc(p.ecole)}${p.classe ? " · " + esc(p.classe) : ""}</span>` : ""}<span>${etiquette(p.statut)}</span></div>
      <div class="meta"><span>${ico("utilisateur")} ${esc(p.parent_name || "parent non renseigné")} · ${esc(telAffiche(p.parent_phone))}</span>${p.parent_phone ? `<a class="etiquette" href="${waLink(p.parent_phone)}" target="_blank" rel="noopener">WhatsApp</a>` : ""}<span>${p.parent_compte ? "Compte parent actif" : "Pas encore de compte parent"}</span></div></div>
    <div class="deux">
      <section class="panneau"><div class="panneau__tete"><h2>Passeport</h2><a class="btn btn--sm btn--fantome" href="#passeport/${esc(id)}">${ico("document")}Vue complète / PDF</a></div>
        ${pp.evaluations.length ? radar(pp.evaluations.slice(-3)) + `<div class="legende">${pp.evaluations.slice(-3).map((e) => `<span>${esc(trimestreFr(e.trimestre).replace(" · ", " "))}</span>`).join("")}</div>` : vide("radar", "Pas encore d'évaluation", "Saisissez la première évaluation trimestrielle ci-dessous, ou laissez le coach le faire depuis son espace.")}
        <form class="form" id="formEval"><h3>Évaluation ${esc(trimestreFr(trim))}</h3><div class="notes-axes">${window.PASSEPORT.AXES.map(([k, l]) => { const v = pp.evaluations.find((e) => e.trimestre === trim)?.[k]; return `<label><span>${l}</span><input type="range" name="${k}" min="0" max="10" step="0.5" value="${v ?? 5}" oninput="this.nextElementSibling.value=this.value"><output>${v ?? 5}</output></label>`; }).join("")}</div><label class="champ"><span>Commentaire</span><textarea name="commentaire" rows="2">${esc(pp.evaluations.find((e) => e.trimestre === trim)?.commentaire || "")}</textarea></label><div class="form__actions"><button class="btn btn--sm">Enregistrer l'évaluation</button></div></form>
      </section>
      <section class="panneau"><div class="panneau__tete"><h2>Suivi scolaire</h2>${sc.regleActive ? (sc.eligibleTournoi ? `<span class="etiquette etiquette--succes">éligible aux tournois</span>` : `<span class="etiquette etiquette--erreur">tournois suspendus</span>`) : `<span class="etiquette etiquette--neutre">règle désactivée</span>`}</div>
        <p class="corps" style="font-size:var(--t-sm)">${p.filiere === "Sport-Études" ? `Moyenne minimale fixée à ${esc(sc.regleActive ? "" : "")}<b>${esc(String((await get("/api/direction/parametres")).moyenne_min))}/20</b> pour participer aux tournois (règle ${sc.regleActive ? "active" : "suspendue"}).` : "Filière Loisirs : les moyennes sont suivies à titre d'accompagnement."}</p>
        ${pp.scolaire.length ? `<div class="table-wrap"><table class="tab"><thead><tr><th>Trimestre</th><th class="num">Moyenne</th><th>Commentaire</th></tr></thead><tbody>${pp.scolaire.map((s) => `<tr><td>${esc(trimestreFr(s.trimestre))}</td><td class="num">${s.moyenne == null ? "—" : s.moyenne + "/20"}</td><td>${esc(s.commentaire)}</td></tr>`).join("")}</tbody></table></div>` : `<p class="corps" style="font-size:var(--t-sm)">Aucune moyenne saisie.</p>`}
        <form class="form" id="formScolaire"><div class="grille-champs"><label class="champ"><span>Trimestre</span><input name="trimestre" value="${esc(trim)}" pattern="\\d{4}-\\d{4}-T[123]"></label><label class="champ"><span>Moyenne /20</span><input name="moyenne" type="number" min="0" max="20" step="0.25" value="${sc.moyenne ?? ""}"></label></div><label class="champ"><span>Commentaire</span><input name="commentaire"></label><div class="form__actions"><button class="btn btn--sm">Enregistrer la moyenne</button></div></form>
      </section>
      <section class="panneau"><div class="panneau__tete"><h2>Présences</h2>${pp.presence.n ? `<span class="etiquette">${pp.presence.taux} % sur ${pp.presence.n}</span>` : ""}</div>
        ${presences.length ? `<ul class="liste-simple">${presences.slice(0, 12).map((a) => `<li><span>${esc(dateFr(a.date))}${a.type ? " · " + esc(a.type) : ""}${a.note ? `<small>${esc(a.note)}</small>` : ""}</span>${etiquette(a.status)}</li>`).join("")}</ul>` : `<p class="corps" style="font-size:var(--t-sm)">Aucun pointage : les coachs pointent les présences depuis leur espace.</p>`}
      </section>
      <section class="panneau"><h2>Observations</h2>
        ${pp.observations.length ? `<ul class="liste-simple">${pp.observations.map((o) => `<li><span>${esc(o.texte)}</span><small>${esc(dateFr(o.date))}</small></li>`).join("")}</ul>` : `<p class="corps" style="font-size:var(--t-sm)">Aucune observation.</p>`}
        <form class="form" id="formObs"><label class="champ"><span>Nouvelle observation</span><input name="texte" required placeholder="Ex. : très bon pied gauche, à travailler le jeu de tête"></label><div class="form__actions"><button class="btn btn--sm">Ajouter</button></div></form>
      </section>
      <section class="panneau"><h2>Espace parents et partage</h2>
        <div class="liste-simple"><li><span>Compte parent</span>${p.parent_compte ? `<span class="etiquette etiquette--succes">actif</span>` : `<button class="btn btn--sm" id="btnCompteParent">Créer le compte</button>`}</li>
        <li><span>Autorisation parentale signée</span>${p.autorisation ? etiquette("validated").replace("validé", "reçue") : `<span class="etiquette etiquette--alerte">manquante</span>`}</li>
        <li><span>Lien de partage du passeport</span>${lienPartage ? `<span class="etiquette etiquette--succes">actif (${esc(pp.share.scope === "complet" ? "complet" : "évaluations")})</span>` : `<span class="etiquette etiquette--neutre">aucun</span>`}</li></div>
        ${lienPartage ? `<div class="secret"><span>Lien à transmettre au club ou au recruteur :</span><code style="font-size:.85rem;letter-spacing:0;word-break:break-all">${esc(lienPartage)}</code></div><div class="form__actions"><button class="btn btn--sm btn--fantome" id="btnCopier">Copier le lien</button><button class="btn btn--sm btn--fantome" id="btnRevoquer">Révoquer</button></div>` : `<div class="form__actions"><button class="btn btn--sm btn--fantome" id="btnPartager" ${p.autorisation ? "" : "disabled title='Autorisation parentale requise'"}>${ico("partage")}Créer un lien de partage</button></div>`}
      </section>
    </div>`;
    $("formEval").addEventListener("submit", async (e) => { e.preventDefault(); try { await post(`/api/joueurs/${id}/evaluations`, { trimestre: trim, ...window.EFA.lire(e.target) }); toast("Évaluation enregistrée", "succes"); ficheJoueur(el, id); } catch (err) { toast(err.message, "erreur"); } });
    $("formScolaire").addEventListener("submit", async (e) => { e.preventDefault(); try { await post(`/api/joueurs/${id}/scolaire`, window.EFA.lire(e.target)); toast("Moyenne enregistrée", "succes"); ficheJoueur(el, id); } catch (err) { toast(err.message, "erreur"); } });
    $("formObs").addEventListener("submit", async (e) => { e.preventDefault(); try { await post(`/api/joueurs/${id}/observations`, window.EFA.lire(e.target)); toast("Observation ajoutée", "succes"); ficheJoueur(el, id); } catch (err) { toast(err.message, "erreur"); } });
    $("btnModifier").addEventListener("click", async () => { const d = await formulaire("Modifier le joueur", formJoueur(p), { large: true }); if (!d) return; try { await put(`/api/direction/joueurs/${id}`, d); toast("Fiche mise à jour", "succes"); ficheJoueur(el, id); } catch (err) { toast(err.message, "erreur"); } });
    $("btnSupprimer").addEventListener("click", async () => { if (await confirmer("Supprimer ce joueur ?", `${p.name} et tout son historique (présences, évaluations, cotisations) seront effacés. Préférez le statut « inactif » pour conserver l'historique.`, "Supprimer définitivement")) { await del(`/api/direction/joueurs/${id}`); toast("Joueur supprimé"); location.hash = "#joueurs"; } });
    $("btnCompteParent")?.addEventListener("click", async () => { const d = await formulaire("Créer le compte parent", `<label class="champ"><span>Nom du parent</span><input name="name" value="${esc(p.parent_name || "")}" required></label><label class="champ"><span>Téléphone (identifiant de connexion)</span><input name="phone" type="tel" value="${esc(telAffiche(p.parent_phone))}" required></label>`, { libelle: "Créer" }); if (!d) return; try { const r = await post(`/api/direction/joueurs/${id}/compte-parent`, d); if (r.nouveau) await formulaire("Compte parent créé", secretHtml("Compte parent", r.phone, r.password), { libelle: "J'ai noté" }); else toast("Enfant rattaché au compte parent existant", "succes"); ficheJoueur(el, id); } catch (err) { toast(err.message, "erreur"); } });
    $("btnPartager")?.addEventListener("click", async () => { const d = await formulaire("Créer un lien de partage", `<p class="corps" style="font-size:var(--t-sm)">Le lien donne accès en lecture au passeport. Il est révocable à tout moment ; chaque consultation est journalisée.</p><label class="champ"><span>Contenu partagé</span><select name="scope">${option([{ value: "evaluations", label: "Évaluations sportives et présence" }, { value: "complet", label: "Complet : avec moyennes scolaires et observations" }], "evaluations")}</select></label>`, { libelle: "Créer le lien" }); if (!d) return; try { await post(`/api/direction/joueurs/${id}/partage`, d); toast("Lien créé", "succes"); ficheJoueur(el, id); } catch (err) { toast(err.message, "erreur"); } });
    $("btnRevoquer")?.addEventListener("click", async () => { if (await confirmer("Révoquer le lien ?", "Le lien ne fonctionnera plus.", "Révoquer")) { await del(`/api/direction/joueurs/${id}/partage`); toast("Lien révoqué"); ficheJoueur(el, id); } });
    $("btnCopier")?.addEventListener("click", () => navigator.clipboard.writeText(lienPartage).then(() => toast("Lien copié", "succes")));
  }
  async function vuePasseport(el) {
    const id = location.hash.split("/")[1]; if (!id) { location.hash = "#joueurs"; return; }
    actions(`<a class="btn btn--sm btn--fantome" href="#joueurs/${esc(id)}">${ico("fleche")}Fiche</a>`);
    const pp = await get(`/api/joueurs/${id}/passeport`);
    el.innerHTML = `<div class="passeport" style="padding:0">${window.PASSEPORT.html({ ...pp, academie: "Elite Football Academy" })}</div>`;
  }

  /* ---------- groupes et planning ---------- */
  async function vueGroupes(el) {
    actions(`<button class="btn btn--sm" id="btnGroupe">${ico("plus")}Groupe</button><button class="btn btn--sm btn--fantome" id="btnSeance">${ico("plus")}Séance</button>`);
    await references();
    const seances = await get("/api/direction/seances");
    const formGroupe = (c = {}) => `<div class="grille-champs"><label class="champ"><span>Nom <small>requis</small></span><input name="name" required value="${esc(c.name || "")}" placeholder="U10 – U12"></label><label class="champ"><span>Tranche d'âge</span><input name="tranche" value="${esc(c.tranche || "")}" placeholder="10-12 ans"></label><label class="champ"><span>Coach</span><select name="coach_id">${coachOpt(c.coach_id || "")}</select></label><label class="champ"><span>Capacité</span><input name="capacity" type="number" min="1" value="${c.capacity ?? 20}"></label></div><label class="champ"><span>Jours (texte libre)</span><input name="jours" value="${esc(c.jours || "")}" placeholder="Mer · Sam"></label>`;
    const formSeance = (s = {}) => `<div class="grille-champs"><label class="champ"><span>Jour</span><select name="jour">${option(JOURS, s.jour || "Lundi")}</select></label><label class="champ"><span>Groupe</span><select name="categorie_id">${catOpt(s.categorie_id || "")}</select></label><label class="champ"><span>Début</span><input name="debut" type="time" value="${esc(s.debut || "16:00")}"></label><label class="champ"><span>Fin</span><input name="fin" type="time" value="${esc(s.fin || "18:00")}"></label><label class="champ"><span>Type</span><select name="type">${option(["Entraînement", "Technique", "Tactique", "Physique", "Match", "Stage"], s.type || "Entraînement")}</select></label><label class="champ"><span>Coach</span><select name="coach_id">${coachOpt(s.coach_id || "")}</select></label></div><label class="champ"><span>Lieu</span><input name="lieu" value="${esc(s.lieu || "")}" placeholder="Terrain d'Akanda"></label>`;
    el.innerHTML = `<div class="deux">
      <section class="panneau"><div class="panneau__tete"><h2>Groupes par tranche d'âge</h2></div>${CATS.length ? `<div class="table-wrap"><table class="tab"><thead><tr><th>Groupe</th><th>Tranche</th><th>Coach</th><th class="num">Effectif</th><th></th></tr></thead><tbody>${CATS.map((c) => `<tr><td><b>${esc(c.name)}</b><br><small>${esc(c.jours)}</small></td><td>${esc(c.tranche)}</td><td>${esc(c.coach || "—")}</td><td class="num">${c.effectif} / ${c.capacity}</td><td class="actions"><button class="btn btn--sm btn--fantome" data-edit-cat="${esc(c.id)}" aria-label="Modifier">${ico("crayon")}</button><button class="btn btn--sm btn--fantome" data-del-cat="${esc(c.id)}" aria-label="Supprimer">${ico("corbeille")}</button></td></tr>`).join("")}</tbody></table></div>` : vide("groupe", "Aucun groupe", "Créez un premier groupe.")}</section>
      <section class="panneau"><div class="panneau__tete"><h2>Séances de la semaine</h2></div>${seances.length ? `<ul class="liste-simple">${JOURS.map((j) => seances.filter((s) => s.jour === j).sort((a, b) => a.debut.localeCompare(b.debut)).map((s) => `<li><span><b>${esc(j)}</b> ${esc(s.debut)}–${esc(s.fin)} · ${esc(s.categorie || "sans groupe")} · ${esc(s.type)}<small>${esc(s.lieu)}${s.coach ? " · " + esc(s.coach) : ""}</small></span><span class="actions"><button class="btn btn--sm btn--fantome" data-edit-se="${esc(s.id)}" aria-label="Modifier">${ico("crayon")}</button><button class="btn btn--sm btn--fantome" data-del-se="${esc(s.id)}" aria-label="Supprimer">${ico("corbeille")}</button></span></li>`).join("")).join("")}</ul>` : vide("calendrier", "Aucune séance", "Planifiez la semaine type : jour, horaire, groupe, lieu.")}</section></div>`;
    $("btnGroupe").addEventListener("click", async () => { const d = await formulaire("Nouveau groupe", formGroupe()); if (!d) return; try { await post("/api/direction/categories", d); toast("Groupe créé", "succes"); vueGroupes(el); } catch (err) { toast(err.message, "erreur"); } });
    $("btnSeance").addEventListener("click", async () => { const d = await formulaire("Nouvelle séance", formSeance()); if (!d) return; try { await post("/api/direction/seances", d); toast("Séance ajoutée", "succes"); vueGroupes(el); } catch (err) { toast(err.message, "erreur"); } });
    el.addEventListener("click", async (e) => {
      const b = e.target.closest("button[data-edit-cat],button[data-del-cat],button[data-edit-se],button[data-del-se]"); if (!b) return;
      if (b.dataset.editCat) { const c = CATS.find((x) => x.id === b.dataset.editCat); const d = await formulaire("Modifier le groupe", formGroupe(c)); if (d) { await put(`/api/direction/categories/${c.id}`, d); toast("Groupe modifié", "succes"); vueGroupes(el); } }
      if (b.dataset.delCat && (await confirmer("Supprimer ce groupe ?", "Les joueurs resteront enregistrés sans groupe ; les séances du groupe seront supprimées.", "Supprimer"))) { await del(`/api/direction/categories/${b.dataset.delCat}`); vueGroupes(el); }
      if (b.dataset.editSe) { const s = seances.find((x) => x.id === b.dataset.editSe); const d = await formulaire("Modifier la séance", formSeance(s)); if (d) { await put(`/api/direction/seances/${s.id}`, d); toast("Séance modifiée", "succes"); vueGroupes(el); } }
      if (b.dataset.delSe && (await confirmer("Supprimer cette séance ?", "La séance disparaît du planning.", "Supprimer"))) { await del(`/api/direction/seances/${b.dataset.delSe}`); vueGroupes(el); }
    });
  }

  /* ---------- détections ---------- */
  async function vueDetections(el) {
    const id = location.hash.split("/")[1];
    if (id) return ficheDetection(el, id);
    actions(`<button class="btn btn--sm" id="btnDetection">${ico("plus")}Journée de détection</button>`);
    const liste = await get("/api/direction/detections");
    el.innerHTML = `<section class="panneau">${liste.length ? `<div class="table-wrap"><table class="tab"><thead><tr><th>Date</th><th>Journée</th><th>Lieu</th><th class="num">Inscrits</th><th class="num">Retenus</th><th>Statut</th><th></th></tr></thead><tbody>${liste.map((d) => `<tr><td><b>${esc(dateFr(d.date))}</b><br><small>${esc(d.heure)}</small></td><td>${esc(d.titre)}<br><small>${d.open_public ? "inscriptions en ligne ouvertes" : "inscriptions fermées"}</small></td><td>${esc(d.lieu)}</td><td class="num">${d.inscrits} / ${d.places}</td><td class="num">${d.retenus}</td><td>${etiquette(d.statut)}</td><td class="actions"><a class="btn btn--sm" href="#detections/${esc(d.id)}">Candidats</a></td></tr>`).join("")}</tbody></table></div>` : vide("cible", "Aucune journée de détection", "Planifiez une date : les familles pourront réserver un dossard depuis le site.", `<button class="btn btn--sm" id="btnDetection2">${ico("plus")}Planifier</button>`)}</section>`;
    const formDet = (d = {}) => `<div class="grille-champs"><label class="champ"><span>Date <small>requis</small></span><input name="date" type="date" required value="${esc(d.date || "")}"></label><label class="champ"><span>Heure</span><input name="heure" type="time" value="${esc(d.heure || "09:00")}"></label><label class="champ"><span>Titre</span><input name="titre" value="${esc(d.titre || "Journée de détection")}"></label><label class="champ"><span>Places</span><input name="places" type="number" min="1" value="${d.places ?? 40}"></label></div><label class="champ"><span>Lieu</span><input name="lieu" value="${esc(d.lieu || "Terrain d'Akanda")}"></label><label class="champ"><span>Description</span><textarea name="description" rows="2">${esc(d.description || "")}</textarea></label><label class="champ champ--case"><input type="checkbox" name="open_public" ${d.open_public === 0 ? "" : "checked"}><span>Inscriptions ouvertes sur le site public</span></label>${d.id ? `<label class="champ"><span>Statut</span><select name="statut">${option(["à venir", "passée"], d.statut)}</select></label>` : ""}`;
    const creer = async () => { const d = await formulaire("Nouvelle journée de détection", formDet()); if (!d) return; try { const r = await post("/api/direction/detections", d); toast("Journée créée", "succes"); location.hash = `#detections/${r.id}`; } catch (err) { toast(err.message, "erreur"); } };
    $("btnDetection").addEventListener("click", creer); $("btnDetection2")?.addEventListener("click", creer);
    el.formDet = formDet;
  }
  async function ficheDetection(el, id) {
    const liste = await get("/api/direction/detections"); const d = liste.find((x) => x.id === id); if (!d) { location.hash = "#detections"; return; }
    await references();
    const cands = await get(`/api/direction/detections/${id}/candidats`);
    actions(`<a class="btn btn--sm btn--fantome" href="#detections">${ico("fleche")}Liste</a><button class="btn btn--sm btn--fantome" id="btnModifDet">${ico("crayon")}Modifier</button><button class="btn btn--sm" id="btnAjoutCand">${ico("plus")}Candidat</button><button class="btn btn--sm btn--fantome" id="btnSupprDet">${ico("corbeille")}</button>`);
    const moy = (c) => { const v = [c.note_tech, c.note_phys, c.note_jeu, c.note_mental].filter((x) => x != null); return v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : "—"; };
    el.innerHTML = `<div class="resume-enfant"><h2>${esc(d.titre)}</h2><div class="meta"><span>${ico("calendrier")} ${esc(dateFr(d.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" }))}${d.heure ? " · " + esc(d.heure) : ""}</span><span>${ico("lieu")} ${esc(d.lieu)}</span><span>${cands.length} inscrits / ${d.places} places</span><span>${etiquette(d.statut)}</span></div>${d.description ? `<p style="color:var(--creme-70);font-size:var(--t-sm)">${esc(d.description)}</p>` : ""}</div>
    <section class="panneau"><div class="panneau__tete"><h2>Candidats et grille de notation</h2><span class="etiquette etiquette--neutre">notes de 0 à 10 · tri par dossard</span></div>
      ${cands.length ? `<div class="table-wrap"><table class="tab"><thead><tr><th class="num">Dossard</th><th>Candidat</th><th>Parent</th><th class="num">Présent</th><th class="num">Tech.</th><th class="num">Phys.</th><th class="num">Jeu</th><th class="num">Mental</th><th class="num">Moy.</th><th>Décision</th><th></th></tr></thead><tbody>${cands.map((c) => `<tr data-cand="${esc(c.id)}">
        <td class="num"><b>${c.dossard}</b></td><td><b>${esc(c.nom)}</b><br><small>${c.age ? esc(c.age) + " ans · " : ""}${esc(c.poste || "")}${c.source === "site" ? " · inscrit en ligne" : ""}</small></td><td>${esc(c.parent_nom)}<br><small>${esc(telAffiche(c.parent_tel))}</small></td>
        <td class="num"><input type="checkbox" data-champ="present" ${c.present ? "checked" : ""} aria-label="Présent"></td>
        ${["note_tech", "note_phys", "note_jeu", "note_mental"].map((k) => `<td class="num"><input type="number" min="0" max="10" step="0.5" value="${c[k] ?? ""}" data-champ="${k}" style="width:4rem;padding:.3rem;border:1px solid var(--ligne-forte);border-radius:6px" aria-label="${k}"></td>`).join("")}
        <td class="num"><b data-moy>${moy(c)}</b></td>
        <td><select data-champ="decision" class="btn btn--sm btn--fantome">${option(["", "retenu", "liste d'attente", "non retenu"], c.decision).replace('value=""', 'value="" ').replace(">" + "<", ">—<")}</select></td>
        <td class="actions">${c.player_id ? `<a class="btn btn--sm" href="#joueurs/${esc(c.player_id)}">Joueur</a>` : c.decision === "retenu" ? `<button class="btn btn--sm" data-convertir="${esc(c.id)}">${ico("plus")}Joueur</button>` : ""}<button class="btn btn--sm btn--fantome" data-del-cand="${esc(c.id)}" aria-label="Supprimer">${ico("corbeille")}</button></td></tr>`).join("")}</tbody></table></div><p class="corps" style="font-size:var(--t-xs)">Les notes et décisions sont enregistrées automatiquement à chaque modification.</p>` : vide("groupe", "Aucun candidat inscrit", "Les inscriptions du site public apparaissent ici ; vous pouvez aussi ajouter un candidat à la main.")}
    </section>`;
    el.addEventListener("change", async (e) => { const tr = e.target.closest("tr[data-cand]"); const champ = e.target.dataset.champ; if (!tr || !champ) return; const val = e.target.type === "checkbox" ? e.target.checked : e.target.value; try { await put(`/api/candidats/${tr.dataset.cand}`, { [champ]: val }); const c = cands.find((x) => x.id === tr.dataset.cand); c[champ] = e.target.type === "checkbox" ? (val ? 1 : 0) : val === "" ? null : (champ.startsWith("note") ? +val : val); tr.querySelector("[data-moy]").textContent = moy(c); if (champ === "decision") ficheDetection(el, id); } catch (err) { toast(err.message, "erreur"); } });
    el.addEventListener("click", async (e) => {
      const b = e.target.closest("button[data-convertir],button[data-del-cand]"); if (!b) return;
      if (b.dataset.convertir) { const dd = await formulaire("Créer la fiche joueur", `<div class="grille-champs"><label class="champ"><span>Groupe</span><select name="categorie_id">${catOpt("")}</select></label><label class="champ"><span>Filière</span><select name="filiere">${option(FILIERES, "Loisirs")}</select></label></div>`, { libelle: "Créer le joueur" }); if (!dd) return; try { const r = await post(`/api/candidats/${b.dataset.convertir}/convertir`, dd); toast("Joueur créé depuis la détection", "succes"); location.hash = `#joueurs/${r.player_id}`; } catch (err) { toast(err.message, "erreur"); } }
      if (b.dataset.delCand && (await confirmer("Retirer ce candidat ?", "Son dossard et ses notes seront effacés.", "Retirer"))) { await del(`/api/candidats/${b.dataset.delCand}`); ficheDetection(el, id); }
    });
    $("btnAjoutCand").addEventListener("click", async () => { const c = await formulaire("Ajouter un candidat", `<div class="grille-champs"><label class="champ"><span>Nom <small>requis</small></span><input name="nom" required></label><label class="champ"><span>Âge</span><input name="age" type="number" min="5" max="20"></label><label class="champ"><span>Parent</span><input name="parent_nom"></label><label class="champ"><span>Téléphone</span><input name="parent_tel" type="tel"></label><label class="champ"><span>Poste</span><select name="poste">${option(POSTES, "À déterminer")}</select></label><label class="champ"><span>Quartier</span><input name="quartier"></label></div>`, { libelle: "Ajouter" }); if (!c) return; try { const r = await post(`/api/direction/detections/${id}/candidats`, c); toast(`Dossard ${r.dossard} attribué`, "succes"); ficheDetection(el, id); } catch (err) { toast(err.message, "erreur"); } });
    $("btnModifDet").addEventListener("click", async () => { const formDet = (dd) => `<div class="grille-champs"><label class="champ"><span>Date</span><input name="date" type="date" required value="${esc(dd.date)}"></label><label class="champ"><span>Heure</span><input name="heure" type="time" value="${esc(dd.heure)}"></label><label class="champ"><span>Titre</span><input name="titre" value="${esc(dd.titre)}"></label><label class="champ"><span>Places</span><input name="places" type="number" min="1" value="${dd.places}"></label><label class="champ"><span>Statut</span><select name="statut">${option(["à venir", "passée"], dd.statut)}</select></label></div><label class="champ"><span>Lieu</span><input name="lieu" value="${esc(dd.lieu)}"></label><label class="champ"><span>Description</span><textarea name="description" rows="2">${esc(dd.description)}</textarea></label><label class="champ champ--case"><input type="checkbox" name="open_public" ${dd.open_public ? "checked" : ""}><span>Inscriptions ouvertes sur le site public</span></label>`; const dd = await formulaire("Modifier la journée", formDet(d)); if (!dd) return; try { await put(`/api/direction/detections/${id}`, dd); toast("Journée modifiée", "succes"); ficheDetection(el, id); } catch (err) { toast(err.message, "erreur"); } });
    $("btnSupprDet").addEventListener("click", async () => { if (await confirmer("Supprimer cette journée ?", "Les candidats et leurs notes seront effacés (les joueurs déjà créés sont conservés).", "Supprimer")) { await del(`/api/direction/detections/${id}`); location.hash = "#detections"; } });
  }

  /* ---------- finances ---------- */
  async function vueFinances(el) {
    const mois = location.hash.split("/")[1] || moisCourant;
    actions(`<input type="month" id="moisSel" value="${esc(mois)}" class="btn btn--sm btn--fantome" aria-label="Mois"><button class="btn btn--sm btn--fantome" id="btnDepense">${ico("plus")}Dépense</button><a class="btn btn--sm btn--fantome" href="#rapport/${esc(mois)}">${ico("document")}Rapport</a>`);
    const [ech, paiements, depenses, params] = await Promise.all([get(`/api/direction/echeancier/${mois}`), get("/api/direction/paiements"), get("/api/direction/depenses"), get("/api/direction/parametres")]);
    const fees = ech.fees, enAttente = paiements.filter((p) => p.status === "pending");
    badge("finances", enAttente.length);
    const tot = { attendu: fees.filter((f) => f.status !== "waived").reduce((a, f) => a + f.amount, 0), paye: fees.filter((f) => f.status === "paid").reduce((a, f) => a + f.amount, 0), du: fees.filter((f) => f.status === "due").reduce((a, f) => a + f.amount, 0) };
    el.innerHTML = `
    ${enAttente.length ? `<section class="panneau" style="border-color:var(--alerte)"><div class="panneau__tete"><h2>Paiements déclarés par les parents, à vérifier</h2><span class="etiquette etiquette--alerte">${enAttente.length}</span></div><p class="corps" style="font-size:var(--t-sm)">Vérifiez la réception sur le compte Mobile Money avant de valider : une déclaration n'est jamais un paiement confirmé.</p><div class="table-wrap"><table class="tab"><thead><tr><th>Date</th><th>Joueur</th><th>Mois</th><th class="num">Montant</th><th>Moyen</th><th>Référence</th><th></th></tr></thead><tbody>${enAttente.map((p) => `<tr><td>${esc(dateFr(p.created_at))}</td><td><b>${esc(p.name)}</b></td><td>${esc(moisFr(p.month))}</td><td class="num">${fcfa(p.amount)}</td><td>${esc(p.method)}</td><td>${esc(p.reference || "—")}${p.note ? `<br><small>${esc(p.note)}</small>` : ""}</td><td class="actions"><button class="btn btn--sm" data-valider="${esc(p.id)}">${ico("ok")}Valider</button><button class="btn btn--sm btn--fantome" data-rejeter="${esc(p.id)}">Rejeter</button></td></tr>`).join("")}</tbody></table></div></section>` : ""}
    <dl class="cartes"><div class="indicateur"><dt>Attendu en ${esc(moisFr(mois))}</dt><dd>${fees.length ? fcfa(tot.attendu) : `<span class="vide-indic">échéancier non généré</span>`}</dd></div><div class="indicateur"><dt>Encaissé</dt><dd>${fees.length ? fcfa(tot.paye) : "—"}</dd></div><div class="indicateur ${tot.du ? "indicateur--alerte" : ""}"><dt>Reste à encaisser</dt><dd>${fees.length ? fcfa(tot.du) : "—"}</dd></div><div class="indicateur indicateur--or"><dt>Dépenses du mois</dt><dd>${fcfa(depenses.filter((d) => d.date.startsWith(mois)).reduce((a, d) => a + d.amount, 0))}</dd></div></dl>
    <div class="deux">
      <section class="panneau" style="grid-column:1/-1"><div class="panneau__tete"><h2>Échéancier de ${esc(moisFr(mois))}</h2>${fees.length ? `<span class="etiquette etiquette--neutre">${fees.length} joueurs</span>` : `<button class="btn btn--sm" id="btnGenerer">${ico("plus")}Générer l'échéancier</button>`}</div>
        ${fees.length ? `<div class="table-wrap"><table class="tab"><thead><tr><th>Joueur</th><th>Filière</th><th class="num">Montant</th><th>Statut</th><th></th></tr></thead><tbody>${fees.map((f) => `<tr><td><a href="#joueurs/${esc(f.player_id)}"><b>${esc(f.name)}</b></a></td><td>${esc(f.filiere)}</td><td class="num">${fcfa(f.amount)}</td><td>${etiquette(f.status)}${f.paid_at ? `<br><small>le ${esc(dateFr(f.paid_at))}</small>` : ""}</td><td class="actions">${f.status === "due" ? `<button class="btn btn--sm" data-payer="${esc(f.id)}">Encaisser</button><a class="btn btn--sm btn--fantome" href="${waLink(f.parent_phone, `Bonjour, Elite Football Academy vous rappelle que la cotisation de ${moisFr(mois)} (${fcfa(f.amount)}) reste à régler. Merci de votre confiance.`)}" target="_blank" rel="noopener">${ico("whatsapp")}Relancer</a><button class="btn btn--sm btn--fantome" data-exonerer="${esc(f.id)}">Exonérer</button>` : f.status === "paid" ? `<button class="btn btn--sm btn--fantome" data-annuler="${esc(f.id)}">Annuler</button>` : `<button class="btn btn--sm btn--fantome" data-annuler="${esc(f.id)}">Rétablir</button>`}</td></tr>`).join("")}</tbody></table></div>` : vide("argent", "Échéancier non généré", "La génération crée une échéance par joueur actif, au montant de sa cotisation (les exonérés sont marqués comme tels).")}
      </section>
      <section class="panneau"><div class="panneau__tete"><h2>Derniers paiements validés</h2></div>${paiements.filter((p) => p.status === "validated").length ? `<ul class="liste-simple">${paiements.filter((p) => p.status === "validated").slice(0, 10).map((p) => `<li><span><b>${esc(p.name)}</b> · ${esc(p.method)}<small>${esc(dateFr(p.validated_at))} · reçu ${esc(p.receipt_no)}</small></span><b>${fcfa(p.amount)}</b></li>`).join("")}</ul>` : `<p class="corps" style="font-size:var(--t-sm)">Aucun paiement validé.</p>`}</section>
      <section class="panneau"><div class="panneau__tete"><h2>Dépenses</h2></div>${depenses.length ? `<ul class="liste-simple">${depenses.slice(0, 12).map((d) => `<li><span><b>${esc(d.label)}</b> · ${esc(d.category)}<small>${esc(dateFr(d.date))}</small></span><span class="actions"><b>${fcfa(d.amount)}</b><button class="btn btn--sm btn--fantome" data-del-dep="${esc(d.id)}" aria-label="Supprimer">${ico("corbeille")}</button></span></li>`).join("")}</ul>` : `<p class="corps" style="font-size:var(--t-sm)">Aucune dépense enregistrée. ${params.charges_fixes && +params.charges_fixes ? `Charges fixes paramétrées : ${fcfa(params.charges_fixes)} / mois.` : "Renseignez les charges fixes mensuelles dans Paramètres pour calculer le point mort."}</p>`}</section>
    </div>`;
    $("moisSel").addEventListener("change", (e) => { location.hash = `#finances/${e.target.value}`; });
    $("btnGenerer")?.addEventListener("click", async () => { try { const r = await post(`/api/direction/echeancier/${mois}`); toast(`${r.created} échéance${r.created > 1 ? "s" : ""} créée${r.created > 1 ? "s" : ""}`, "succes"); vueFinances(el); } catch (err) { toast(err.message, "erreur"); } });
    $("btnDepense").addEventListener("click", async () => { const d = await formulaire("Nouvelle dépense", `<div class="grille-champs"><label class="champ"><span>Libellé <small>requis</small></span><input name="label" required></label><label class="champ"><span>Montant (FCFA) <small>requis</small></span><input name="amount" type="number" min="1" required></label><label class="champ"><span>Catégorie</span><select name="category">${option(["Matériel", "Terrain", "Encadrement", "Transport", "Médical", "Administratif", "Autre"], "Matériel")}</select></label><label class="champ"><span>Date</span><input name="date" type="date" value="${new Date().toISOString().slice(0, 10)}"></label></div>`, { libelle: "Enregistrer" }); if (!d) return; try { await post("/api/direction/depenses", d); toast("Dépense enregistrée", "succes"); vueFinances(el); } catch (err) { toast(err.message, "erreur"); } });
    el.addEventListener("click", async (e) => {
      const b = e.target.closest("button[data-valider],button[data-rejeter],button[data-payer],button[data-exonerer],button[data-annuler],button[data-del-dep]"); if (!b) return;
      try {
        if (b.dataset.valider && (await confirmer("Valider ce paiement ?", "Confirmez seulement après avoir vérifié la réception des fonds. Un numéro de reçu sera attribué.", "Valider"))) { const r = await patch(`/api/direction/paiements/${b.dataset.valider}`, { status: "validated" }); toast(`Paiement validé · reçu ${r.receipt_no}`, "succes"); vueFinances(el); }
        if (b.dataset.rejeter) { const d = await formulaire("Rejeter la déclaration", `<label class="champ"><span>Motif (visible par le parent)</span><input name="note" placeholder="Référence introuvable, montant différent…"></label>`, { libelle: "Rejeter" }); if (d) { await patch(`/api/direction/paiements/${b.dataset.rejeter}`, { status: "rejected", note: d.note }); toast("Déclaration rejetée"); vueFinances(el); } }
        if (b.dataset.payer) { const d = await formulaire("Encaisser la cotisation", `<div class="grille-champs"><label class="champ"><span>Moyen de paiement</span><select name="method">${option(METHODES, "Espèces")}</select></label><label class="champ"><span>Référence</span><input name="reference"></label></div>`, { libelle: "Encaisser" }); if (d) { await patch(`/api/direction/echeances/${b.dataset.payer}`, { status: "paid", ...d }); toast("Cotisation encaissée, reçu émis", "succes"); vueFinances(el); } }
        if (b.dataset.exonerer && (await confirmer("Exonérer cette échéance ?", "Le montant ne sera plus attendu pour ce mois.", "Exonérer"))) { await patch(`/api/direction/echeances/${b.dataset.exonerer}`, { status: "waived" }); vueFinances(el); }
        if (b.dataset.annuler && (await confirmer("Remettre l'échéance « à payer » ?", "Le reçu déjà émis reste dans l'historique.", "Confirmer"))) { await patch(`/api/direction/echeances/${b.dataset.annuler}`, { status: "due" }); vueFinances(el); }
        if (b.dataset.delDep && (await confirmer("Supprimer cette dépense ?", "", "Supprimer"))) { await del(`/api/direction/depenses/${b.dataset.delDep}`); vueFinances(el); }
      } catch (err) { toast(err.message, "erreur"); }
    });
  }

  /* ---------- rapport mensuel ---------- */
  async function vueRapport(el) {
    const mois = location.hash.split("/")[1] || moisCourant;
    actions(`<input type="month" id="moisRap" value="${esc(mois)}" class="btn btn--sm btn--fantome" aria-label="Mois"><button class="btn btn--sm" onclick="window.print()">${ico("imprimer")}Imprimer / PDF</button>`);
    const r = await get(`/api/direction/rapport/${mois}`);
    const t = r.totaux;
    el.innerHTML = `<div class="passeport" style="padding:0">
      <header class="passeport__tete"><div style="display:flex;align-items:center;gap:1rem"><img src="/assets/logo_elite.png" alt=""><div class="passeport__id"><p class="sur-titre">Rapport mensuel · saison ${esc(r.saison)}</p><h1>${esc(moisFr(mois))}</h1><p>Elite Football Academy · établi le ${esc(dateFr(new Date().toISOString()))}</p></div></div></header>
      <dl class="cartes"><div class="indicateur"><dt>Joueurs actifs</dt><dd>${r.joueursActifs}</dd></div><div class="indicateur"><dt>Demandes reçues</dt><dd>${r.demandes}</dd></div><div class="indicateur"><dt>Présence</dt><dd>${r.presence.n ? `${r.presence.taux}<small> % · ${r.presence.n} pointages</small>` : `<span class="vide-indic">aucun pointage</span>`}</dd></div><div class="indicateur"><dt>Cotisations attendues</dt><dd>${r.fees.length ? fcfa(t.attendus) : `<span class="vide-indic">non généré</span>`}</dd></div><div class="indicateur"><dt>Encaissé</dt><dd>${fcfa(t.encaisse)}</dd></div><div class="indicateur ${t.impayes ? "indicateur--alerte" : ""}"><dt>Impayés</dt><dd>${fcfa(t.impayes)}</dd></div><div class="indicateur"><dt>Recettes validées</dt><dd>${fcfa(t.recettes)}</dd></div><div class="indicateur"><dt>Dépenses</dt><dd>${fcfa(t.depenses)}</dd></div><div class="indicateur ${t.solde < 0 ? "indicateur--erreur" : "indicateur--or"}"><dt>Solde</dt><dd>${fcfa(t.solde)}</dd></div></dl>
      <div class="passeport__grille">
        <section class="panneau"><h2>Cotisations</h2>${r.fees.length ? `<div class="table-wrap"><table class="tab"><thead><tr><th>Joueur</th><th class="num">Montant</th><th>Statut</th></tr></thead><tbody>${r.fees.map((f) => `<tr><td>${esc(f.name)}</td><td class="num">${fcfa(f.amount)}</td><td>${etiquette(f.status)}</td></tr>`).join("")}</tbody></table></div>` : `<p class="corps" style="font-size:var(--t-sm)">Échéancier non généré pour ce mois.</p>`}</section>
        <section class="panneau"><h2>Paiements validés</h2>${r.payments.length ? `<div class="table-wrap"><table class="tab"><thead><tr><th>Date</th><th>Joueur</th><th>Moyen</th><th>Reçu</th><th class="num">Montant</th></tr></thead><tbody>${r.payments.map((p) => `<tr><td>${esc(dateFr(p.validated_at, { day: "2-digit", month: "2-digit" }))}</td><td>${esc(p.name)}</td><td>${esc(p.method)}</td><td>${esc(p.receipt_no)}</td><td class="num">${fcfa(p.amount)}</td></tr>`).join("")}</tbody></table></div>` : `<p class="corps" style="font-size:var(--t-sm)">Aucun paiement validé ce mois.</p>`}</section>
        <section class="panneau" style="grid-column:1/-1"><h2>Dépenses</h2>${r.expenses.length ? `<div class="table-wrap"><table class="tab"><thead><tr><th>Date</th><th>Libellé</th><th>Catégorie</th><th class="num">Montant</th></tr></thead><tbody>${r.expenses.map((d) => `<tr><td>${esc(dateFr(d.date, { day: "2-digit", month: "2-digit" }))}</td><td>${esc(d.label)}</td><td>${esc(d.category)}</td><td class="num">${fcfa(d.amount)}</td></tr>`).join("")}</tbody></table></div>` : `<p class="corps" style="font-size:var(--t-sm)">Aucune dépense ce mois.</p>`}</section>
      </div></div>`;
    $("moisRap").addEventListener("change", (e) => { location.hash = `#rapport/${e.target.value}`; });
  }

  /* ---------- actualités ---------- */
  async function vueActualites(el) {
    actions(`<button class="btn btn--sm" id="btnActu">${ico("plus")}Publier</button>`);
    await references();
    const liste = await get("/api/direction/actualites");
    el.innerHTML = `<section class="panneau"><p class="corps" style="font-size:var(--t-sm)">Les actualités publiques apparaissent sur le site ; les convocations et informations d'un groupe apparaissent dans l'espace des parents concernés.</p>${liste.length ? `<ul class="liste-simple">${liste.map((n) => `<li><span><span class="etiquette etiquette--${n.type === "convocation" ? "or" : "neutre"}">${esc(n.type)}</span> <b>${esc(n.title)}</b><small>${esc(dateFr(n.date))} · ${n.categorie ? esc(n.categorie) : "tous les groupes"} · ${n.public ? "site public" : "espaces connectés"}</small>${n.body ? `<br><small>${esc(n.body)}</small>` : ""}</span><button class="btn btn--sm btn--fantome" data-del-news="${esc(n.id)}" aria-label="Supprimer">${ico("corbeille")}</button></li>`).join("")}</ul>` : vide("cloche", "Aucune publication", "Publiez une convocation de match, un résultat ou une information de rentrée.")}</section>`;
    $("btnActu").addEventListener("click", async () => { const d = await formulaire("Nouvelle publication", `<div class="grille-champs"><label class="champ"><span>Type</span><select name="type">${option(["actualité", "convocation", "résultat", "information"], "actualité")}</select></label><label class="champ"><span>Date</span><input name="date" type="date" value="${new Date().toISOString().slice(0, 10)}"></label><label class="champ"><span>Groupe concerné</span><select name="categorie_id">${catOpt("").replace("— Aucun groupe —", "Tous les groupes")}</select></label></div><label class="champ"><span>Titre <small>requis</small></span><input name="title" required></label><label class="champ"><span>Texte</span><textarea name="body" rows="3"></textarea></label><label class="champ champ--case"><input type="checkbox" name="public" checked><span>Afficher aussi sur le site public</span></label>`, { libelle: "Publier" }); if (!d) return; try { await post("/api/direction/actualites", d); toast("Publié", "succes"); vueActualites(el); } catch (err) { toast(err.message, "erreur"); } });
    el.addEventListener("click", async (e) => { const b = e.target.closest("button[data-del-news]"); if (b && (await confirmer("Supprimer cette publication ?", "", "Supprimer"))) { await del(`/api/direction/actualites/${b.dataset.delNews}`); vueActualites(el); } });
  }

  /* ---------- comptes ---------- */
  async function vueComptes(el) {
    actions(`<button class="btn btn--sm" id="btnCoach">${ico("plus")}Compte coach</button>`);
    const liste = await get("/api/direction/utilisateurs");
    const bloc = (role, titre, texteVide) => { const rows = liste.filter((u) => u.role === role); return `<section class="panneau"><div class="panneau__tete"><h2>${titre}</h2><span class="etiquette etiquette--neutre">${rows.length}</span></div>${rows.length ? `<div class="table-wrap"><table class="tab"><thead><tr><th>Nom</th><th>Identifiant</th><th>${role === "coach" ? "Groupes" : "Enfants"}</th><th>État</th><th></th></tr></thead><tbody>${rows.map((u) => `<tr><td><b>${esc(u.name)}</b>${u.email ? `<br><small>${esc(u.email)}</small>` : ""}</td><td>${esc(telAffiche(u.phone))}</td><td>${role === "coach" ? esc(u.groupes || "—") : u.enfants}</td><td>${u.active ? (u.must_change ? `<span class="etiquette etiquette--alerte">mot de passe à changer</span>` : etiquette("actif")) : etiquette("inactif")}</td><td class="actions"><button class="btn btn--sm btn--fantome" data-reset="${esc(u.id)}">${ico("cle")}Réinitialiser</button><button class="btn btn--sm btn--fantome" data-toggle="${esc(u.id)}" data-active="${u.active}">${u.active ? "Désactiver" : "Réactiver"}</button><button class="btn btn--sm btn--fantome" data-del-user="${esc(u.id)}" aria-label="Supprimer">${ico("corbeille")}</button></td></tr>`).join("")}</tbody></table></div>` : `<p class="corps" style="font-size:var(--t-sm)">${texteVide}</p>`}</section>`; };
    el.innerHTML = `<div style="display:grid;gap:1.4rem">${bloc("coach", "Coachs", "Créez un compte coach puis affectez-le à un groupe (vue Groupes et planning).")}${bloc("parent", "Parents", "Les comptes parents se créent depuis la fiche d'un joueur.")}</div>`;
    $("btnCoach").addEventListener("click", async () => { const d = await formulaire("Nouveau compte coach", `<div class="grille-champs"><label class="champ"><span>Nom <small>requis</small></span><input name="name" required></label><label class="champ"><span>Téléphone (identifiant) <small>requis</small></span><input name="phone" type="tel" required></label></div><label class="champ"><span>E-mail</span><input name="email" type="email"></label><input type="hidden" name="role" value="coach">`, { libelle: "Créer" }); if (!d) return; try { const r = await post("/api/direction/utilisateurs", d); await formulaire("Compte coach créé", secretHtml("Compte coach", r.phone, r.password), { libelle: "J'ai noté" }); vueComptes(el); } catch (err) { toast(err.message, "erreur"); } });
    el.addEventListener("click", async (e) => {
      const b = e.target.closest("button[data-reset],button[data-toggle],button[data-del-user]"); if (!b) return;
      try {
        if (b.dataset.reset && (await confirmer("Réinitialiser le mot de passe ?", "Un nouveau mot de passe provisoire sera généré et les sessions en cours fermées.", "Réinitialiser"))) { const u = liste.find((x) => x.id === b.dataset.reset); const r = await post(`/api/direction/utilisateurs/${u.id}/mot-de-passe`); await formulaire("Nouveau mot de passe", secretHtml(u.name, u.phone, r.password), { libelle: "J'ai noté" }); vueComptes(el); }
        if (b.dataset.toggle) { await put(`/api/direction/utilisateurs/${b.dataset.toggle}`, { active: b.dataset.active !== "1" }); vueComptes(el); }
        if (b.dataset.delUser && (await confirmer("Supprimer ce compte ?", "La personne ne pourra plus se connecter. Les joueurs rattachés sont conservés.", "Supprimer"))) { await del(`/api/direction/utilisateurs/${b.dataset.delUser}`); vueComptes(el); }
      } catch (err) { toast(err.message, "erreur"); }
    });
  }

  /* ---------- paramètres ---------- */
  async function vueParametres(el) {
    actions("");
    const s = await get("/api/direction/parametres");
    const champ = (k, lib, type = "text", aide = "") => `<label class="champ"><span>${lib}${aide ? ` <small>${aide}</small>` : ""}</span><input name="${k}" type="${type}" value="${esc(s[k] ?? "")}"></label>`;
    el.innerHTML = `<div class="deux">
      <section class="panneau"><h2>Académie</h2><p class="corps" style="font-size:var(--t-sm)">Ces informations alimentent le site public : chaque enregistrement y est visible en quelques secondes.</p><form class="form" id="formParams"><div class="grille-champs">${champ("nom", "Nom")}${champ("fondateur", "Fondateur / gérant")}${champ("saison", "Saison", "text", "ex. 2026-2027")}${champ("capacite", "Capacité du terrain", "number", "joueurs")}</div>${champ("slogan", "Slogan", "text", "affiché en pied de page")}<label class="champ"><span>Texte de présentation <small>ouverture du site</small></span><textarea name="presentation" rows="3" maxlength="600">${esc(s.presentation || "")}</textarea></label>${champ("lieu", "Localisation")}<div class="grille-champs">${champ("age_min", "Âge minimum", "number", "ans")}${champ("age_max", "Âge maximum", "number", "ans")}${champ("horaires", "Jours d'ouverture", "text", "ex. Lundi – Samedi")}</div><div class="grille-champs">${champ("whatsapp", "WhatsApp", "tel", "format 24177000000")}${champ("email", "E-mail de contact", "email")}${champ("facebook", "Page Facebook", "url", "vide = non affiché")}${champ("instagram", "Compte Instagram", "url", "vide = non affiché")}</div><div class="form__actions"><button class="btn btn--sm">Enregistrer</button></div></form></section>
      <section class="panneau"><h2>Règles, tarifs et finances</h2><form class="form" id="formRegles"><div class="grille-champs">${champ("tarif_sport_etudes", "Tarif Sport-Études", "number", "FCFA / mois")}${champ("tarif_loisirs", "Tarif Loisirs", "number", "FCFA / mois")}${champ("moyenne_min", "Moyenne minimale", "number", "/20, filière Sport-Études")}${champ("seuil_presence", "Seuil de présence attendu", "number", "%")}${champ("charges_fixes", "Charges fixes mensuelles", "number", "FCFA, pour le point mort")}<label class="champ"><span>Règle des tournois</span><select name="regle_tournoi">${option([{ value: "oui", label: "Active : suivi scolaire à jour et moyenne ≥ seuil" }, { value: "non", label: "Suspendue : moyennes suivies sans blocage" }], s.regle_tournoi)}</select></label></div>${champ("mobile_money", "Consigne Mobile Money affichée aux parents", "text", "ex. Airtel Money 077 00 00 00 au nom de…")}<div class="form__actions"><button class="btn btn--sm">Enregistrer</button></div></form></section>
      <section class="panneau"><h2>Mot de passe de la direction</h2><form class="form" id="formMdp"><div class="grille-champs"><label class="champ"><span>Mot de passe actuel</span><input name="current" type="password" required autocomplete="current-password"></label><label class="champ"><span>Nouveau mot de passe <small>8 caractères min.</small></span><input name="next" type="password" required minlength="8" autocomplete="new-password"></label></div><div class="form__actions"><button class="btn btn--sm">Changer</button></div></form></section>
      <section class="panneau"><h2>Sauvegarde et restauration</h2><p class="corps" style="font-size:var(--t-sm)">L'export contient toutes les données (sans les mots de passe en clair). Conservez-le hors du serveur. La restauration remplace l'intégralité des données actuelles.</p><div class="form__actions" style="justify-content:flex-start"><a class="btn btn--sm" href="/api/direction/export" download>${ico("telecharger")}Exporter la sauvegarde</a><label class="btn btn--sm btn--fantome">${ico("rafraichir")}Restaurer un fichier<input type="file" id="fichierImport" accept="application/json" hidden></label></div></section>
    </div>`;
    const enregistrer = async (form) => { try { await put("/api/direction/parametres", window.EFA.lire(form)); toast("Paramètres enregistrés", "succes"); } catch (err) { toast(err.message, "erreur"); } };
    $("formParams").addEventListener("submit", (e) => { e.preventDefault(); enregistrer(e.target); });
    $("formRegles").addEventListener("submit", (e) => { e.preventDefault(); enregistrer(e.target); });
    $("formMdp").addEventListener("submit", async (e) => { e.preventDefault(); try { await post("/api/auth/password", window.EFA.lire(e.target)); toast("Mot de passe changé", "succes"); e.target.reset(); } catch (err) { toast(err.message, "erreur"); } });
    $("fichierImport").addEventListener("change", async (e) => { const f = e.target.files[0]; if (!f) return; if (!(await confirmer("Restaurer cette sauvegarde ?", "Toutes les données actuelles seront remplacées par celles du fichier.", "Restaurer"))) return; try { await post("/api/direction/import", JSON.parse(await f.text())); toast("Sauvegarde restaurée", "succes"); location.hash = "#tableau"; } catch (err) { toast(err.message, "erreur"); } });
  }

  /* ---------- journal ---------- */
  async function vueJournal(el) {
    actions("");
    const j = await get("/api/direction/journal");
    el.innerHTML = `<section class="panneau"><p class="corps" style="font-size:var(--t-sm)">Les 200 dernières actions sensibles : connexions, modifications de dossiers, paiements, partages de passeport, exports.</p>${j.length ? `<div class="table-wrap"><table class="tab"><thead><tr><th>Date</th><th>Qui</th><th>Action</th><th>Cible</th><th>Détail</th></tr></thead><tbody>${j.map((a) => `<tr><td>${esc(new Date(a.at).toLocaleString("fr-FR"))}</td><td>${esc(a.user_name || (a.role || "—"))}</td><td>${esc(a.action)}</td><td><small>${esc(a.target)}</small></td><td><small>${esc(a.detail)}</small></td></tr>`).join("")}</tbody></table></div>` : vide("document", "Journal vide", "Les actions apparaîtront ici.")}</section>`;
  }

  /* ---------- lancement ---------- */
  if (user.must_change) {
    const d = await formulaire("Première connexion : choisissez votre mot de passe", `<p class="corps" style="font-size:var(--t-sm)">Le mot de passe initial doit être remplacé par un mot de passe personnel d'au moins 8 caractères.</p><label class="champ"><span>Mot de passe actuel</span><input name="current" type="password" required></label><label class="champ"><span>Nouveau mot de passe</span><input name="next" type="password" required minlength="8"></label>`, { libelle: "Enregistrer" });
    if (d) { try { await post("/api/auth/password", d); toast("Mot de passe enregistré", "succes"); } catch (err) { toast(err.message, "erreur"); } }
  }
  await references();
  const afficher = coquille({ titreEspace: "Direction", vues: [
    { id: "tableau", libelle: "Tableau de bord", icone: "graphe", rendu: vueTableau },
    { id: "demandes", libelle: "Demandes", icone: "document", rendu: vueDemandes },
    { id: "joueurs", libelle: "Joueurs", icone: "utilisateur", rendu: vueJoueurs },
    { id: "passeport", libelle: "Passeport", icone: "radar", rendu: vuePasseport, cache: true },
    { id: "groupes", libelle: "Groupes et planning", icone: "calendrier", rendu: vueGroupes },
    { id: "detections", libelle: "Détections", icone: "cible", rendu: vueDetections },
    { id: "finances", libelle: "Cotisations et paiements", icone: "argent", rendu: vueFinances },
    { id: "rapport", libelle: "Rapport mensuel", icone: "recu", rendu: vueRapport },
    { id: "actualites", libelle: "Actualités", icone: "cloche", rendu: vueActualites },
    { id: "comptes", libelle: "Comptes", icone: "groupe", rendu: vueComptes },
    { id: "parametres", libelle: "Paramètres", icone: "reglages", rendu: vueParametres },
    { id: "journal", libelle: "Journal", icone: "tableau", rendu: vueJournal },
  ] });
  document.querySelector('[data-vue="passeport"]').hidden = true;
  afficher();
})();
