/* Rendu du passeport du joueur (espaces connectés, lien partagé, impression / PDF). */
window.PASSEPORT = (() => {
  const { esc, ico, radar, trimestreFr, dateFr } = window.EFA;
  const AXES = [["technique", "Technique"], ["physique", "Physique"], ["tactique", "Tactique"], ["mental", "Mental"], ["scolaire", "Scolaire"]];
  const moy = (e) => { const v = AXES.map(([k]) => e[k]).filter((x) => x != null); return v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : "—"; };
  function html(p, { partage = false, actions = "" } = {}) {
    const evals = p.evaluations || [], dern = evals.slice(-3);
    const derniere = evals[evals.length - 1];
    return `
    <header class="passeport__tete">
      <div style="display:flex;align-items:center;gap:1rem"><img src="/assets/logo_elite.png" alt=""><div class="passeport__id"><p class="sur-titre">Passeport du joueur · ${esc(p.academie || "Elite Football Academy")}</p><h1>${esc(p.name)}</h1><p>${[p.age ? p.age + " ans" : "", p.categorie, p.filiere, p.poste].filter(Boolean).map(esc).join(" · ")} · Saison ${esc(p.saison || "")}</p></div></div>
      <div class="sans-impression" style="display:flex;gap:.5rem;flex-wrap:wrap">${actions}<button class="btn btn--fantome btn--sm" onclick="window.print()">${ico("imprimer")}Imprimer / PDF</button></div>
    </header>
    <div class="passeport__grille">
      <section class="panneau"><div class="panneau__tete"><h2>Radar de progression</h2>${derniere ? `<span class="etiquette">${esc(trimestreFr(derniere.trimestre))}</span>` : ""}</div>
        ${evals.length ? radar(dern) + `<div class="legende">${dern.map((e) => `<span>${esc(trimestreFr(e.trimestre).replace(" · ", " "))}</span>`).join("")}</div>` : `<div class="etat-vide">${ico("radar")}<h3>Aucune évaluation pour l'instant</h3><p>Le radar apparaîtra après la première évaluation trimestrielle du coach.</p></div>`}
      </section>
      <section class="panneau"><h2>Évaluations trimestrielles</h2>
        ${evals.length ? `<div class="table-wrap"><table class="tab"><thead><tr><th>Trimestre</th>${AXES.map(([, l]) => `<th class="num">${l.slice(0, 4)}.</th>`).join("")}<th class="num">Moy.</th></tr></thead><tbody>${evals.map((e) => `<tr><td>${esc(trimestreFr(e.trimestre))}</td>${AXES.map(([k]) => `<td class="num">${e[k] == null ? "—" : e[k]}</td>`).join("")}<td class="num"><b>${moy(e)}</b></td></tr>`).join("")}</tbody></table></div>${evals.filter((e) => e.commentaire).map((e) => `<p class="corps" style="font-size:var(--t-sm)"><b>${esc(trimestreFr(e.trimestre))} :</b> ${esc(e.commentaire)}</p>`).join("")}` : `<p class="corps" style="font-size:var(--t-sm)">Les notes vont de 0 à 10 sur chaque axe : technique, physique, tactique, mental, scolaire.</p>`}
      </section>
      <section class="panneau"><h2>Présence aux séances</h2>
        ${p.presence && p.presence.n ? `<p class="chiffre" style="font-size:2.4rem;color:var(--vert)">${p.presence.taux}<small style="font-size:1rem;font-family:var(--texte);font-weight:600;color:var(--encre-3)"> % de présence sur ${p.presence.n} séance${p.presence.n > 1 ? "s" : ""}</small></p><div class="jauge-fine"><span style="width:${p.presence.taux}%"></span></div>` : `<p class="corps" style="font-size:var(--t-sm)">Aucune séance pointée pour l'instant.</p>`}
      </section>
      ${p.scolaire && p.scolaire.length ? `<section class="panneau"><h2>Suivi scolaire</h2><div class="table-wrap"><table class="tab"><thead><tr><th>Trimestre</th><th class="num">Moyenne</th><th>Commentaire</th></tr></thead><tbody>${p.scolaire.map((s) => `<tr><td>${esc(trimestreFr(s.trimestre))}</td><td class="num">${s.moyenne == null ? "—" : s.moyenne + "/20"}</td><td>${esc(s.commentaire)}</td></tr>`).join("")}</tbody></table></div></section>` : partage && p.scope !== "complet" ? `<section class="panneau"><h2>Suivi scolaire</h2><p class="corps" style="font-size:var(--t-sm)">Non partagé : le responsable légal a limité ce lien aux évaluations sportives.</p></section>` : ""}
      ${p.observations && p.observations.length ? `<section class="panneau" style="grid-column:1/-1"><h2>Observations des éducateurs</h2><ul class="liste-simple">${p.observations.map((o) => `<li><span>${esc(o.texte)}</span><small>${esc(dateFr(o.date))}</small></li>`).join("")}</ul></section>` : ""}
    </div>
    <p class="passeport__mention">Document établi par ${esc(p.academie || "Elite Football Academy")} à partir des évaluations de ses éducateurs. ${partage ? "Lien de partage autorisé par le responsable légal, révocable à tout moment ; chaque consultation est enregistrée." : "Usage réservé à la famille et à l'académie."}</p>`;
  }
  return { html, AXES, moy };
})();
