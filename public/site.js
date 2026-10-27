/* ============================================================
   Site public — données réelles (API publique), formulaires, mise en scène :
   chargeur, ouverture (éclipse), galerie d'écrans sur dunes, révélations, transitions de page.
   ============================================================ */
(() => {
  const { esc, ico, dateFr, waLink, post, get, toast, lire } = window.EFA;
  const $ = (id) => document.getElementById(id);
  const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const large = () => window.matchMedia("(min-width: 64.01em)").matches;
  const anime = !reduit && window.gsap && window.ScrollTrigger;
  let PUB = { whatsapp: "", lieu: "" };
  let lenis = null;

  /* ---------- en-tête, menu ---------- */
  const entete = $("entete"), menu = $("menuMobile"), burger = $("burger");
  entete.classList.add("sur-intro");
  const majEntete = () => entete.classList.toggle("sur-intro", window.scrollY < window.innerHeight * 1.2);
  majEntete(); window.addEventListener("scroll", majEntete, { passive: true });
  const ouvrirMenu = (o) => { menu.classList.toggle("ouvert", o); menu.setAttribute("aria-hidden", String(!o)); burger.setAttribute("aria-expanded", String(o)); if (lenis) { o ? lenis.stop() : lenis.start(); } else document.documentElement.style.overflow = o ? "hidden" : ""; if (o) $("menuFermer").focus(); else burger.focus(); };
  burger.addEventListener("click", () => ouvrirMenu(true));
  $("menuFermer").addEventListener("click", () => ouvrirMenu(false));
  menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => ouvrirMenu(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && menu.classList.contains("ouvert")) ouvrirMenu(false); });
  const sections = [...document.querySelectorAll("main section[id]")];
  const liens = [...document.querySelectorAll(".nav a")];
  const io = new IntersectionObserver((entries) => { for (const en of entries) if (en.isIntersecting) liens.forEach((a) => a.classList.toggle("actif", a.getAttribute("href") === "#" + en.target.id)); }, { rootMargin: "-40% 0px -55% 0px" });
  sections.forEach((s) => io.observe(s));
  $("annee").textContent = new Date().getFullYear();
  /* ancres : défilement doux et focus */
  document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
    const h = a.getAttribute("href"); if (h === "#") return; const t = document.querySelector(h); if (!t) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(t, { offset: h === "#haut" || h === "#galerie" ? 0 : -24, duration: 1.4 }); else t.scrollIntoView({ behavior: reduit ? "auto" : "smooth" });
    if (t.id && t.id !== "haut" && t.id !== "galerie") { t.setAttribute("tabindex", "-1"); setTimeout(() => t.focus({ preventScroll: true }), 900); }
  }));
  /* transitions de page : voile noir avant de quitter */
  const voile = $("voilePage");
  document.querySelectorAll("a[data-page]").forEach((a) => a.addEventListener("click", (e) => {
    if (reduit || !window.gsap || e.metaKey || e.ctrlKey) return;
    e.preventDefault(); const href = a.getAttribute("href");
    gsap.to(voile, { opacity: 1, duration: .5, ease: "power2.inOut", onComplete: () => { location.href = href; } });
  }));
  window.addEventListener("pageshow", (e) => { if (e.persisted && window.gsap) gsap.set(voile, { opacity: 0 }); });

  /* ---------- données réelles ---------- */
  function lienWa(texte) { return waLink(PUB.whatsapp, texte); }
  async function charger() {
    try { PUB = await get("/api/public"); } catch { return; }
    const bonjour = lienWa("Bonjour Elite Football Academy, je souhaite inscrire mon enfant.");
    ["waFloat", "waInsc", "waFoot"].forEach((id) => { if ($(id)) $(id).href = bonjour; });
    $("waPartenaire").href = lienWa("Bonjour Elite Football Academy, je souhaite discuter d'un partenariat.");
    if (PUB.lieu) { $("lieuTexte").textContent = PUB.lieu; $("lieuPied").textContent = PUB.lieu; }
    if (PUB.fondateur) { $("fondateurNom").textContent = PUB.fondateur; $("fondateurPied").textContent = PUB.fondateur; }
    if (PUB.email) { $("emailPied").hidden = false; $("emailLien").href = "mailto:" + PUB.email; $("emailLien").querySelector("span").textContent = PUB.email; }
    if (PUB.facebook) { $("fbPied").hidden = false; $("fbFoot").href = PUB.facebook; }
    if (PUB.instagram) { $("igPied").hidden = false; $("igFoot").href = PUB.instagram; }
    document.querySelector('[data-tarif="sport_etudes"]').innerHTML = `${window.EFA.num(PUB.tarif_sport_etudes)} <small>FCFA / mois</small>`;
    document.querySelector('[data-tarif="loisirs"]').innerHTML = `${window.EFA.num(PUB.tarif_loisirs)} <small>FCFA / mois</small>`;
    document.querySelector('[data-tarif-ecran="sport_etudes"]').textContent = window.EFA.num(PUB.tarif_sport_etudes);
    document.querySelector('[data-tarif-ecran="loisirs"]').textContent = window.EFA.num(PUB.tarif_loisirs);
    $("regleTexte").textContent = PUB.regle_tournoi === "oui" ? `En filière Sport-Études, la participation aux tournois demande un suivi scolaire à jour et une moyenne trimestrielle d'au moins ${PUB.moyenne_min}/20.` : "La direction a suspendu la règle de participation aux tournois liée au suivi scolaire : les moyennes restent suivies et visibles dans le passeport.";
    if (PUB.detections.length) {
      $("detectionVide").hidden = true; $("detectionListe").hidden = false;
      $("detectionListe").innerHTML = PUB.detections.map((d) => {
        const restantes = Math.max(0, d.places - d.inscrits), pct = d.places ? Math.min(100, Math.round((100 * d.inscrits) / d.places)) : 0;
        return `<article class="carte-detection rev" data-id="${esc(d.id)}">
          <div class="carte-detection__tete"><p class="carte-detection__date">${esc(dateFr(d.date, { weekday: "long", day: "numeric", month: "long" }))}<small>${esc(d.titre)}</small></p>${restantes ? `<span class="etiquette etiquette--or">${restantes} place${restantes > 1 ? "s" : ""}</span>` : `<span class="etiquette etiquette--erreur">Complet</span>`}</div>
          <div class="carte-detection__meta">${d.heure ? `<span>${ico("horloge")}${esc(d.heure)}</span>` : ""}${d.lieu ? `<span>${ico("lieu")}${esc(d.lieu)}</span>` : ""}<span>${ico("groupe")}${d.inscrits} inscrit${d.inscrits > 1 ? "s" : ""} sur ${d.places}</span></div>
          <div class="jauge" aria-hidden="true"><span style="width:${pct}%"></span></div>
          ${d.description ? `<p style="color:rgba(246,243,236,.66);font-size:var(--t-sm)">${esc(d.description)}</p>` : ""}
          ${restantes && d.open_public ? `<form class="form-detection" data-id="${esc(d.id)}" novalidate>
            <div class="grille-champs">
              <label class="champ"><span>Nom du jeune <small>requis</small></span><input name="nom" required></label>
              <label class="champ"><span>Âge</span><input name="age" type="number" min="5" max="20"></label>
              <label class="champ"><span>Nom du parent <small>requis</small></span><input name="parent_nom" required autocomplete="name"></label>
              <label class="champ"><span>Téléphone <small>requis</small></span><input name="parent_tel" type="tel" required inputmode="tel" placeholder="077 00 00 00"></label>
            </div>
            <label class="champ champ--case"><input type="checkbox" name="consent" required><span>Je suis le responsable légal et j'accepte l'utilisation de ces informations pour la détection (<a href="/confidentialite">confidentialité</a>).</span></label>
            <button class="pilule pilule--clair pilule--bloc" type="submit">Réserver un dossard${ico("fleche")}</button>
            <p class="formulaire__statut" role="status" aria-live="polite"></p>
          </form>` : ""}
          <div class="dossard" hidden></div>
        </article>`;
      }).join("");
      $("detectionListe").querySelectorAll(".form-detection").forEach((f) => f.addEventListener("submit", envoyerDetection));
    }
    if (PUB.coachs.length) { $("coachsVide").hidden = true; $("coachs").innerHTML = PUB.coachs.map((c) => `<li><span class="avatar" aria-hidden="true">${esc((c.name || "?").trim()[0].toUpperCase())}</span><div><b>${esc(c.name)}</b><small>${esc(c.groupes || "Éducateur")}</small></div></li>`).join(""); }
    const jours = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
    const parJour = jours.map((j) => ({ j, s: PUB.seances.filter((s) => s.jour === j).sort((a, b) => a.debut.localeCompare(b.debut)) })).filter((x) => x.s.length);
    $("planning").innerHTML = parJour.length ? parJour.map((x) => `<li><b>${esc(x.j)}</b><span>${x.s.map((s) => `${esc(s.debut)}–${esc(s.fin)} · ${esc(s.categorie || "")} · ${esc(s.type)}${s.lieu ? " · " + esc(s.lieu) : ""}`).join("<br>")}</span></li>`).join("") : `<li><span>Le planning de la semaine sera publié ici.</span></li>`;
    if (PUB.news.length) { $("actus").hidden = false; $("actusListe").innerHTML = PUB.news.map((n) => `<li><time datetime="${esc(n.date)}">${esc(dateFr(n.date))}${n.categorie ? " · " + esc(n.categorie) : ""}</time><h4>${esc(n.title)}</h4>${n.body ? `<p>${esc(n.body)}</p>` : ""}</li>`).join(""); }
    if (anime) { revelations(); ScrollTrigger.refresh(); }
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

  /* ---------- mise en scène ---------- */
  const scene = window.SCENE, dunes = window.DUNES;
  const ecrans = [...document.querySelectorAll(".ecran")];
  const chargeur = $("chargeur");
  /* le paragraphe de l'ouverture, mot par mot */
  const introTexte = $("introTexte");
  introTexte.innerHTML = introTexte.textContent.trim().split(/\s+/).map((m) => `<span class="mot">${esc(m)}</span>`).join(" ");
  const mots = [...introTexte.querySelectorAll(".mot")];
  /* points et libellés de la galerie */
  $("galPoints").innerHTML = ecrans.map(() => "<li></li>").join("");
  const points = [...$("galPoints").children];
  let courant = -1;
  function majGalerie(idx) {
    const i = Math.max(0, Math.min(ecrans.length - 1, Math.round(idx)));
    if (i === courant) return; courant = i;
    ecrans.forEach((e, k) => e.classList.toggle("courant", k === i));
    points.forEach((p, k) => p.classList.toggle("courant", k === i));
    $("galPrec").textContent = i > 0 ? ecrans[i - 1].dataset.titre : ""; $("galPrec").parentElement.hidden = i === 0;
    $("galSuiv").textContent = i < ecrans.length - 1 ? ecrans[i + 1].dataset.titre : ""; $("galSuiv").parentElement.hidden = i === ecrans.length - 1;
    $("galVisiter").setAttribute("href", ecrans[i].dataset.cible);
    $("galVisiter").querySelector("span").textContent = i === ecrans.length - 1 ? "Inscrire mon enfant" : "Explorer ce chapitre";
  }
  function placerEcrans(idx) {
    const vw = window.innerWidth, pas = Math.min(vw * .74, 1180);
    ecrans.forEach((e, k) => {
      const d = k - idx, ad = Math.abs(d);
      const x = d * pas, rot = Math.max(-38, Math.min(38, -d * 30)), z = -Math.min(ad, 2) * 260, y = Math.min(ad, 2) * 10;
      e.style.transform = `translate3d(${x}px, ${y}px, ${z}px) rotateY(${rot}deg)`;
      e.style.opacity = String(Math.max(0, 1 - Math.max(0, ad - 1.2) * .9));
      e.style.zIndex = String(10 - Math.round(ad));
    });
  }
  ecrans.forEach((e) => e.addEventListener("click", (ev) => { if (!large()) return; const t = document.querySelector(e.dataset.cible); if (!t) return; ev.preventDefault(); if (lenis) lenis.scrollTo(t, { offset: -24, duration: 1.4 }); else t.scrollIntoView({ behavior: "smooth" }); }));

  function revelations() {
    document.querySelectorAll(".rev:not([data-rev])").forEach((el) => { el.dataset.rev = "1"; gsap.to(el, { autoAlpha: 1, y: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 90%", once: true } }); });
  }

  if (anime) {
    gsap.registerPlugin(ScrollTrigger);
    document.documentElement.classList.add("js-anim");
    /* défilement doux */
    if (window.Lenis) { lenis = new Lenis({ lerp: .085, smoothWheel: true, wheelMultiplier: .9 }); lenis.on("scroll", ScrollTrigger.update); gsap.ticker.add((t) => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
    /* chargeur : jauge puis ouverture de la scène */
    const jauge = $("chargeurJauge");
    const tlOuverture = gsap.timeline({ paused: true, defaults: { ease: "expo.out" } });
    tlOuverture.to(jauge, { width: "100%", duration: 1.1, ease: "power2.inOut" })
      .add(() => { chargeur.classList.add("fini"); if (scene) scene.set({ pulse: 1 }); }, "+=.05")
      .fromTo(".intro__mot i", { yPercent: 40, autoAlpha: 0, filter: "blur(10px)" }, { yPercent: 0, autoAlpha: 1, filter: "blur(0px)", duration: 1.3, stagger: .06 }, "-=.1")
      .to(".intro__marque", { autoAlpha: 1, duration: .01 }, "<")
      .fromTo(".intro__sous", { autoAlpha: 0, letterSpacing: ".6em" }, { autoAlpha: 1, letterSpacing: ".34em", duration: 1.2 }, "-=.9")
      .to(".intro__bord", { autoAlpha: 1, duration: .9, stagger: .1 }, "-=.9")
      .to(".intro__cta", { autoAlpha: 1, y: 0, duration: .9 }, "-=.7")
      .to(".entete__in", { autoAlpha: 1, duration: .9 }, "-=.9");
    const lancer = () => { if (lenis) lenis.scrollTo(0, { immediate: true }); tlOuverture.play(); };
    if (document.readyState === "complete") lancer(); else window.addEventListener("load", lancer, { once: true });
    setTimeout(() => { if (!chargeur.classList.contains("fini")) lancer(); }, 2500);

    /* ouverture : l'éclipse s'ouvre, la marque s'éloigne, le texte s'allume, les dunes montent */
    ScrollTrigger.create({
      trigger: ".intro-wrap", start: "top top", end: "bottom bottom", scrub: true,
      onUpdate: (st) => {
        const p = st.progress;
        const open = gsap.utils.clamp(0, 1, p / .5);
        const texte = gsap.utils.clamp(0, 1, (p - .22) / .5);
        const sortie = gsap.utils.clamp(0, 1, (p - .78) / .18);
        if (scene) scene.set({ open, intro: 1 - sortie, dune: gsap.utils.clamp(0, 1, (p - .6) / .35) });
        gsap.set(".intro__marque", { scale: 1 + open * .9, autoAlpha: 1 - gsap.utils.clamp(0, 1, open / .55), filter: `blur(${open * 12}px)` });
        gsap.set(".intro__bord, .intro__cta", { autoAlpha: 1 - gsap.utils.clamp(0, 1, p / .18) });
        gsap.set(introTexte, { autoAlpha: Math.min(gsap.utils.clamp(0, 1, (p - .18) / .1), 1 - sortie), scale: 1 - sortie * .06 });
        const n = Math.round(texte * mots.length);
        mots.forEach((m, i) => m.classList.toggle("allume", i < n));
        if (dunes && large()) { dunes.set({ alpha: gsap.utils.clamp(0, 1, (p - .72) / .26), actif: p > .6 }); dunes.canvas.style.opacity = "1"; }
      },
    });
    /* galerie : défilement vertical converti en voyage horizontal entre les écrans */
    /* arrivée des écrans : la piste monte depuis les dunes pendant que la galerie entre */
    ScrollTrigger.create({ trigger: ".galerie-wrap", start: "top bottom", end: "top top", scrub: true, onUpdate: (st) => { if (!large()) return; const p = st.progress; gsap.set(".galerie__piste", { y: (1 - p) * window.innerHeight * .42, autoAlpha: gsap.utils.clamp(0, 1, (p - .3) / .5) }); gsap.set(".galerie__ui, .galerie__points", { autoAlpha: gsap.utils.clamp(0, 1, (p - .7) / .3) }); } });
    const trigGalerie = ScrollTrigger.create({
      trigger: ".galerie-wrap", start: "top top", end: "bottom bottom", scrub: true,
      snap: large() ? { snapTo: 1 / (ecrans.length - 1), duration: { min: .25, max: .7 }, delay: .08, ease: "power2.inOut" } : false,
      onUpdate: (st) => {
        if (!large()) return;
        const idx = st.progress * (ecrans.length - 1);
        placerEcrans(idx); majGalerie(idx);
        if (scene) scene.set({ pan: idx, dune: 1, open: 1, intro: 0 });
        if (dunes) dunes.set({ pan: idx, alpha: 1, actif: true });
      },
      onLeave: () => { if (dunes) dunes.set({ alpha: 0, actif: false }); if (scene) scene.set({ actif: false }); },
      onEnterBack: () => { if (scene) scene.set({ actif: true }); if (dunes && large()) dunes.set({ alpha: 1, actif: true }); },
    });
    if (large()) { placerEcrans(0); majGalerie(0); }
    window.addEventListener("resize", () => { if (large()) placerEcrans(Math.max(0, courant)); });
    /* titres ligne par ligne, blocs, photos, tracés */
    document.querySelectorAll(".rev-lignes").forEach((t) => gsap.fromTo(t.querySelectorAll(".ligne > span"), { yPercent: 110 }, { yPercent: 0, duration: 1.1, ease: "expo.out", stagger: .09, scrollTrigger: { trigger: t, start: "top 85%", once: true } }));
    gsap.fromTo(".pied__grand .ligne > span", { yPercent: 110 }, { yPercent: 0, duration: 1.2, ease: "expo.out", stagger: .1, scrollTrigger: { trigger: ".pied__grand", start: "top 88%", once: true } });
    revelations();
    document.querySelectorAll(".masque--portrait, .masque--large").forEach((m) => {
      gsap.fromTo(m, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 1.4, ease: "expo.inOut", scrollTrigger: { trigger: m, start: "top 80%", once: true } });
      gsap.fromTo(m.querySelector("img"), { scale: 1.18, yPercent: -4 }, { scale: 1.02, yPercent: 4, ease: "none", scrollTrigger: { trigger: m, start: "top bottom", end: "bottom top", scrub: .8 } });
    });
    gsap.to(".pentagone__trace", { strokeDashoffset: 0, duration: 1.8, ease: "power2.inOut", scrollTrigger: { trigger: ".galerie-wrap", start: "top 60%", once: true } });
    gsap.to(".pentagone__points circle", { opacity: 1, duration: .4, stagger: .12, delay: 1.2, scrollTrigger: { trigger: ".galerie-wrap", start: "top 60%", once: true } });
    gsap.to(".parcours__trace path", { strokeDashoffset: 0, ease: "none", scrollTrigger: { trigger: ".etapes", start: "top 85%", end: "bottom 60%", scrub: .5 } });
    gsap.from(".formule__prix", { scale: .9, autoAlpha: 0, duration: .8, ease: "back.out(1.6)", stagger: .15, scrollTrigger: { trigger: ".formules", start: "top 80%", once: true } });
    /* filet de sécurité : rien ne reste masqué */
    setTimeout(() => { document.querySelectorAll(".rev").forEach((el) => { if (el.getBoundingClientRect().top < window.innerHeight && getComputedStyle(el).opacity === "0") gsap.set(el, { autoAlpha: 1, y: 0 }); }); }, 3000);
    void trigGalerie;
  } else {
    chargeur.classList.add("fini");
    mots.forEach((m) => m.classList.add("allume"));
    if (scene) scene.set({ open: 0, pulse: 0 });
    introTexte.style.position = "static"; introTexte.style.transform = "none"; introTexte.style.opacity = "1"; introTexte.style.marginTop = "1.5rem";
    document.querySelector(".intro").style.gridTemplateRows = "auto auto";
    if (large()) { placerEcrans(0); majGalerie(0); if (dunes) { dunes.set({ alpha: 1, actif: true }); dunes.canvas.style.opacity = "1"; } }
    document.querySelector(".galerie-wrap").style.height = "auto"; document.querySelector(".galerie").style.position = "static";
  }
  charger();
})();
