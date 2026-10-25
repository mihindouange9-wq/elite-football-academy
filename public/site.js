/* ============================================================
   Site public — données réelles (API publique), formulaires, motion GSAP/ScrollTrigger
   ============================================================ */
(() => {
  const { esc, ico, fcfa, dateFr, waLink, post, get, toast, lire } = window.EFA;
  const $ = (id) => document.getElementById(id);
  const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const anime = !reduit && window.gsap && window.ScrollTrigger;
  let PUB = { whatsapp: "", lieu: "" };

  /* ---------- en-tête, menu ---------- */
  const entete = $("entete"), menu = $("menuMobile"), burger = $("burger");
  const majEntete = () => entete.classList.toggle("est-compact", window.scrollY > 40);
  majEntete(); window.addEventListener("scroll", majEntete, { passive: true });
  const ouvrirMenu = (o) => { menu.classList.toggle("ouvert", o); menu.setAttribute("aria-hidden", String(!o)); burger.setAttribute("aria-expanded", String(o)); document.documentElement.style.overflow = o ? "hidden" : ""; if (o) $("menuFermer").focus(); else burger.focus(); };
  burger.addEventListener("click", () => ouvrirMenu(true));
  $("menuFermer").addEventListener("click", () => ouvrirMenu(false));
  menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => ouvrirMenu(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && menu.classList.contains("ouvert")) ouvrirMenu(false); });
  /* lien de navigation courant */
  const sections = [...document.querySelectorAll("main section[id]")];
  const liens = [...document.querySelectorAll(".nav a")];
  const io = new IntersectionObserver((entries) => { for (const en of entries) if (en.isIntersecting) liens.forEach((a) => a.classList.toggle("actif", a.getAttribute("href") === "#" + en.target.id)); }, { rootMargin: "-40% 0px -55% 0px" });
  sections.forEach((s) => io.observe(s));
  $("annee").textContent = new Date().getFullYear();
  /* ancres : déplacer le focus pour le clavier */
  document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener("click", () => { const t = document.querySelector(a.getAttribute("href")); if (t && t.id && t.id !== "haut") { t.setAttribute("tabindex", "-1"); setTimeout(() => t.focus({ preventScroll: true }), 500); } }));

  /* ---------- données réelles ---------- */
  function lienWa(texte) { return waLink(PUB.whatsapp, texte); }
  async function charger() {
    try { PUB = await get("/api/public"); } catch { return; }
    const bonjour = lienWa("Bonjour Elite Football Academy, je souhaite inscrire mon enfant.");
    ["waFloat", "waInsc", "waFoot"].forEach((id) => { if ($(id)) $(id).href = bonjour; });
    if (PUB.lieu) { $("lieuTexte").textContent = PUB.lieu; $("lieuPied").textContent = PUB.lieu; }
    if (PUB.fondateur) { $("fondateurNom").textContent = PUB.fondateur; $("fondateurPied").textContent = PUB.fondateur; }
    if (PUB.email) { $("emailPied").hidden = false; $("emailLien").href = "mailto:" + PUB.email; $("emailLien").querySelector("span").textContent = PUB.email; }
    if (PUB.facebook) { $("fbPied").hidden = false; $("fbFoot").href = PUB.facebook; }
    if (PUB.instagram) { $("igPied").hidden = false; $("igFoot").href = PUB.instagram; }
    document.querySelector('[data-tarif="sport_etudes"]').innerHTML = `${window.EFA.num(PUB.tarif_sport_etudes)} <small>FCFA / mois</small>`;
    document.querySelector('[data-tarif="loisirs"]').innerHTML = `${window.EFA.num(PUB.tarif_loisirs)} <small>FCFA / mois</small>`;
    $("regleTexte").textContent = PUB.regle_tournoi === "oui" ? `En filière Sport-Études, la participation aux tournois demande un suivi scolaire à jour et une moyenne trimestrielle d'au moins ${PUB.moyenne_min}/20.` : "La direction a suspendu la règle de participation aux tournois liée au suivi scolaire : les moyennes restent suivies et visibles dans le passeport.";
    /* repères réels dans le hero */
    if (PUB.categories.length) { $("faitGroupes").hidden = false; $("faitGroupes").querySelector("[data-compteur]").dataset.compteur = PUB.categories.length; }
    if (PUB.detections.length) { $("faitDetection").hidden = false; $("faitDetection").querySelector("dd").textContent = dateFr(PUB.detections[0].date, { day: "numeric", month: "short" }); }
    /* détections */
    if (PUB.detections.length) {
      $("detectionVide").hidden = true; $("detectionListe").hidden = false;
      $("detectionListe").innerHTML = PUB.detections.map((d) => {
        const restantes = Math.max(0, d.places - d.inscrits), pct = d.places ? Math.min(100, Math.round((100 * d.inscrits) / d.places)) : 0;
        return `<article class="carte-detection rev" data-id="${esc(d.id)}">
          <div class="carte-detection__tete"><p class="carte-detection__date">${esc(dateFr(d.date, { weekday: "long", day: "numeric", month: "long" }))}<small>${esc(d.titre)}</small></p>${restantes ? `<span class="etiquette etiquette--or">${restantes} place${restantes > 1 ? "s" : ""}</span>` : `<span class="etiquette etiquette--erreur">Complet</span>`}</div>
          <div class="carte-detection__meta">${d.heure ? `<span>${ico("horloge")}${esc(d.heure)}</span>` : ""}${d.lieu ? `<span>${ico("lieu")}${esc(d.lieu)}</span>` : ""}<span>${ico("groupe")}${d.inscrits} inscrit${d.inscrits > 1 ? "s" : ""} sur ${d.places}</span></div>
          <div class="jauge" aria-hidden="true"><span style="width:${pct}%"></span></div>
          ${d.description ? `<p style="color:var(--creme-70);font-size:var(--t-sm)">${esc(d.description)}</p>` : ""}
          ${restantes && d.open_public ? `<form class="form-detection" data-id="${esc(d.id)}" novalidate>
            <div class="grille-champs">
              <label class="champ"><span>Nom du jeune <small>requis</small></span><input name="nom" required></label>
              <label class="champ"><span>Âge</span><input name="age" type="number" min="5" max="20"></label>
              <label class="champ"><span>Nom du parent <small>requis</small></span><input name="parent_nom" required autocomplete="name"></label>
              <label class="champ"><span>Téléphone <small>requis</small></span><input name="parent_tel" type="tel" required inputmode="tel" placeholder="077 00 00 00"></label>
            </div>
            <label class="champ champ--case"><input type="checkbox" name="consent" required><span>Je suis le responsable légal et j'accepte l'utilisation de ces informations pour la détection (<a href="/confidentialite">confidentialité</a>).</span></label>
            <button class="btn btn--or btn--bloc" type="submit">Réserver un dossard${ico("fleche")}</button>
            <p class="formulaire__statut" role="status" aria-live="polite"></p>
          </form>` : ""}
          <div class="dossard" hidden></div>
        </article>`;
      }).join("");
      $("detectionListe").querySelectorAll(".form-detection").forEach((f) => f.addEventListener("submit", envoyerDetection));
    }
    /* coachs, planning, actualités */
    if (PUB.coachs.length) { $("coachsVide").hidden = true; $("coachs").innerHTML = PUB.coachs.map((c) => `<li><span class="avatar" aria-hidden="true">${esc((c.name || "?").trim()[0].toUpperCase())}</span><div><b>${esc(c.name)}</b><small>${esc(c.groupes || "Éducateur")}</small></div></li>`).join(""); }
    const jours = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
    const parJour = jours.map((j) => ({ j, s: PUB.seances.filter((s) => s.jour === j).sort((a, b) => a.debut.localeCompare(b.debut)) })).filter((x) => x.s.length);
    $("planning").innerHTML = parJour.length ? parJour.map((x) => `<li><b>${esc(x.j)}</b><span>${x.s.map((s) => `${esc(s.debut)}–${esc(s.fin)} · ${esc(s.categorie || "")} · ${esc(s.type)}${s.lieu ? " · " + esc(s.lieu) : ""}`).join("<br>")}</span></li>`).join("") : `<li><span>Le planning de la semaine sera publié ici.</span></li>`;
    if (PUB.news.length) { $("actus").hidden = false; $("actusListe").innerHTML = PUB.news.map((n) => `<li><time datetime="${esc(n.date)}">${esc(dateFr(n.date))}${n.categorie ? " · " + esc(n.categorie) : ""}</time><h4>${esc(n.title)}</h4>${n.body ? `<p>${esc(n.body)}</p>` : ""}</li>`).join(""); }
    if (anime) { ScrollTrigger.refresh(); compteurs(); }
  }

  async function envoyerDetection(e) {
    e.preventDefault();
    const f = e.target, statut = f.querySelector(".formulaire__statut"), btn = f.querySelector("button");
    const d = lire(f); statut.classList.remove("erreur"); statut.textContent = "";
    if (!d.nom || !d.parent_nom || !d.parent_tel) { statut.classList.add("erreur"); statut.textContent = "Le nom du jeune, le nom du parent et le téléphone sont requis."; return; }
    if (!d.consent) { statut.classList.add("erreur"); statut.textContent = "Cochez la case de consentement pour continuer."; return; }
    btn.disabled = true;
    try {
      const r = await post(`/api/detections/${f.dataset.id}/candidats`, d);
      const carte = f.closest(".carte-detection"), doss = carte.querySelector(".dossard");
      doss.hidden = false; doss.innerHTML = `<span>${r.deja ? "Ce jeune était déjà inscrit : son dossard est le" : "Dossard réservé"}</span><b>${r.dossard}</b><span>Présentez ce numéro le jour de la détection.</span>`;
      f.hidden = true; toast("Inscription à la détection enregistrée.", "succes");
    } catch (err) { statut.classList.add("erreur"); statut.textContent = err.message; }
    btn.disabled = false;
  }

  /* ---------- formulaire d'inscription ---------- */
  document.querySelectorAll("[data-filiere]").forEach((b) => b.addEventListener("click", () => { $("filiereSel").value = b.dataset.filiere; }));
  const messageWa = (p) => ["*Demande d'inscription — Elite Football Academy*", "", `Enfant : ${p.enfant.nom}${p.enfant.age ? ` (${p.enfant.age} ans)` : ""}`, `Filière : ${p.enfant.filiere}${p.enfant.poste ? ` — poste : ${p.enfant.poste}` : ""}`, p.enfant.niveau ? `Niveau : ${p.enfant.niveau}` : "", `Parent : ${p.parent.nom}`, `Téléphone : ${p.parent.tel}`, p.parent.quartier ? `Quartier : ${p.parent.quartier}` : "", p.message ? `Message : ${p.message}` : "", "", "Merci de me recontacter pour la journée de détection."].filter((l) => l !== "").join("\n");
  $("insForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target, d = lire(f), statut = $("insStatut");
    statut.classList.remove("erreur"); statut.textContent = "";
    f.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
    const manquants = ["enfNom", "enfAge", "parNom", "parTel"].filter((n) => !d[n]);
    if (manquants.length) { manquants.forEach((n) => f[n].setAttribute("aria-invalid", "true")); f[manquants[0]].focus(); statut.classList.add("erreur"); statut.textContent = "Renseignez le nom et l'âge de l'enfant, votre nom et votre téléphone."; return; }
    if (!d.consent) { statut.classList.add("erreur"); statut.textContent = "Cochez la case de consentement pour envoyer la demande."; f.consent.focus(); return; }
    const payload = { enfant: { nom: d.enfNom, age: d.enfAge, filiere: d.filiere, poste: d.poste, niveau: d.niveau }, parent: { nom: d.parNom, tel: d.parTel, email: d.parEmail, quartier: d.parQuartier }, message: d.message, consent: true };
    const btn = $("insSubmit"); btn.disabled = true;
    try {
      await post("/api/inscriptions", payload);
      $("waAfter").href = lienWa(messageWa(payload)); $("insConfirm").hidden = false; f.reset(); toast("Demande enregistrée. L'académie vous recontacte.", "succes");
    } catch (err) {
      if (err.status) { statut.classList.add("erreur"); statut.textContent = err.message; }
      else { window.open(lienWa(messageWa(payload)), "_blank"); statut.textContent = "Connexion indisponible : votre demande part sur WhatsApp."; }
    }
    btn.disabled = false;
  });

  /* ---------- motion ---------- */
  function compteurs() {
    document.querySelectorAll("[data-compteur]").forEach((el) => {
      const fin = +el.dataset.compteur || 0; if (!fin) return;
      gsap.fromTo(el, { innerText: 0 }, { innerText: fin, duration: 1.2, ease: "power2.out", snap: { innerText: 1 }, scrollTrigger: { trigger: el, start: "top 90%", once: true } });
    });
  }
  if (anime) {
    gsap.registerPlugin(ScrollTrigger);
    document.documentElement.classList.add("js-anim");
    /* hero : lignes, photo masquée, trajectoire du ballon, repères */
    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.from(".hero .sur-titre", { autoAlpha: 0, y: 16, duration: .7 }, .1)
      .from(".hero__titre .ligne > span", { yPercent: 110, duration: 1.1, stagger: .09 }, .15)
      .from(".hero__chapeau, .hero__actions, .hero__faits", { autoAlpha: 0, y: 22, duration: .9, stagger: .1 }, .6)
      .fromTo(".masque--hero", { clipPath: "inset(0 0 100% 0 round 28px)" }, { clipPath: "inset(0 0 0% 0 round 28px)", duration: 1.3, ease: "expo.inOut" }, .3)
      .from(".masque--hero img", { scale: 1.18, duration: 1.8 }, .3)
      .from(".hero__legende", { autoAlpha: 0, y: 10, duration: .6 }, 1.2)
      .to(".hero__trajectoire path", { strokeDashoffset: 0, duration: 1.8, ease: "power2.inOut" }, .5)
      .to(".hero__rond circle:first-child", { strokeDashoffset: 0, duration: 1.6, ease: "power2.inOut" }, .8);
    gsap.to(".hero__photo", { yPercent: 8, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: .6 } });
    gsap.to(".hero__rond", { y: -80, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1 } });
    /* titres ligne par ligne, blocs */
    document.querySelectorAll(".rev-lignes").forEach((t) => gsap.fromTo(t.querySelectorAll(".ligne > span"), { yPercent: 110 }, { yPercent: 0, duration: 1, ease: "expo.out", stagger: .08, scrollTrigger: { trigger: t, start: "top 85%", once: true } }));
    document.querySelectorAll(".rev").forEach((el) => gsap.to(el, { autoAlpha: 1, y: 0, duration: .9, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } }));
    /* photos : masque et parallaxe douce */
    document.querySelectorAll(".masque--portrait, .masque--large").forEach((m) => {
      gsap.fromTo(m, { clipPath: "inset(0 100% 0 0 round 28px)" }, { clipPath: "inset(0 0% 0 0 round 28px)", duration: 1.3, ease: "expo.inOut", scrollTrigger: { trigger: m, start: "top 80%", once: true } });
      gsap.fromTo(m.querySelector("img"), { scale: 1.15, yPercent: -4 }, { scale: 1.02, yPercent: 4, ease: "none", scrollTrigger: { trigger: m, start: "top bottom", end: "bottom top", scrub: .8 } });
    });
    /* pentagone des cinq axes et trajectoire du parcours : tracés au défilement */
    gsap.to(".pentagone__trace", { strokeDashoffset: 0, duration: 1.6, ease: "power2.inOut", scrollTrigger: { trigger: ".axes__radar", start: "top 75%", once: true } });
    gsap.to(".pentagone__points circle", { opacity: 1, duration: .4, stagger: .12, scrollTrigger: { trigger: ".axes__radar", start: "top 70%", once: true } });
    gsap.to(".parcours__trace path", { strokeDashoffset: 0, ease: "none", scrollTrigger: { trigger: ".etapes", start: "top 85%", end: "bottom 60%", scrub: .5 } });
    /* chiffres des formules : légère mise en avant au passage */
    gsap.from(".formule__prix", { scale: .9, autoAlpha: 0, duration: .8, ease: "back.out(1.6)", stagger: .15, scrollTrigger: { trigger: ".formules", start: "top 80%", once: true } });
    compteurs();
    /* filet de sécurité : tout élément resté masqué devient visible après 2,5 s dans la fenêtre */
    setTimeout(() => { document.querySelectorAll(".rev").forEach((el) => { if (el.getBoundingClientRect().top < window.innerHeight && getComputedStyle(el).opacity === "0") gsap.set(el, { autoAlpha: 1, y: 0 }); }); document.querySelectorAll(".rev-lignes .ligne > span").forEach((el) => { if (el.getBoundingClientRect().top < window.innerHeight && gsap.getProperty(el, "yPercent") > 0) gsap.set(el, { yPercent: 0 }); }); }, 2500);
  } else {
    document.querySelectorAll("[data-compteur]").forEach((el) => { el.textContent = el.dataset.compteur; });
  }
  charger();
})();
