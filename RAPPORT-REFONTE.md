# Elite Football Academy — rapport de refonte (25 octobre 2026)

## Ce qui a été livré

**Identité et site public** (commit `92e2f31`)
- Nouvelle direction artistique sur les couleurs existantes (vert forêt, nuit, crème, or) : typographies Sora + Manrope auto-hébergées, pictogrammes SVG (sprite `public/icons.svg`), aucun emoji.
- Page unique : hero immersif sur la photo existante, académie, cinq axes (pentagone), parcours, Sport-Études avec tarifs et règle lus depuis les paramètres, détection avec inscription en ligne (dossard attribué), équipe et planning depuis l'API, formulaire d'inscription avec consentement obligatoire, pied de page avec les seuls contacts réels renseignés.
- Mouvement GSAP + ScrollTrigger vendorisés, désactivés si `prefers-reduced-motion`.
- Pages `/mentions-legales`, `/confidentialite`, `/connexion`.

**Socle technique** (commit `0c62951`)
- Base SQLite persistante (`node:sqlite`, Node 22), reprise automatique des JSON v1 au premier démarrage.
- Mots de passe hachés (scrypt + sel), sessions en base, cookie HttpOnly SameSite=Strict, limitation des tentatives, en-tête anti-CSRF requis sur les mutations, trois rôles vérifiés côté serveur, journal d'audit, export/import complet.
- Aucun secret dans le dépôt : `ADMIN_PASSWORD` en variable d'environnement, `data/` ignoré par git.

**Trois espaces connectés** (ce commit)
- Direction : tableau de bord (indicateurs réels, « Pour démarrer » tant que l'académie est vide), demandes, joueurs et fiche complète (évaluation, scolaire, présences, observations, compte parent, lien de partage), groupes et planning, détections (dossards, grille de notation, conversion en joueur), cotisations et paiements (échéancier mensuel, encaissement, validation ou rejet des déclarations, reçus numérotés, relance WhatsApp, exonérations, dépenses), rapport mensuel imprimable, actualités et convocations, comptes coachs et parents (mot de passe provisoire, réinitialisation), paramètres, journal, sauvegarde.
- Coachs : ma semaine, feuille de présence (P/R/A/E, tout présent par défaut), mes joueurs (évaluation cinq axes, observations, moyennes), absences récentes avec message WhatsApp, notation des candidats.
- Parents : onglets par enfant, résumé (prochaine séance, présence, cotisations, dernière évaluation, convocations, documents du dossier), planning et présences, passeport (radar, impression PDF, partage à un club avec autorisation du responsable légal, révocable), cotisations (consigne Mobile Money, déclaration de paiement, reçus imprimables).
- Lien public `/passeport/<jeton>` en lecture seule, journalisé.

**Présentation visuelle « éclipse » (27 octobre 2026)**, transposée de la référence Studio Mirage après analyse de son site (captures, polices, structure) :
- Chargeur à jauge fine, puis ouverture plein écran : éclipse-ballon au bord crénelé, lumière rasante sur un sol ondulé (scène WebGL écrite à la main, `public/scene.js`), wordmark ELITE au centre, Akanda et Libreville aux bords, pilule « Faites défiler pour explorer ».
- Au défilement : l'éclipse s'ouvre, la marque s'éloigne dans le flou, le texte de présentation s'allume mot à mot, les dunes de pelouse montent (`public/dunes.js`).
- Galerie de sept écrans en perspective posés sur les dunes (académie, passeport, parcours, Sport-Études, détection, éducateurs, inscription), parcourue par le défilement vertical, aimantée chapitre par chapitre, avec Précédent / Suivant et « Explorer ce chapitre ».
- Sections détaillées en noir profond, pilules translucides, transitions de page par voile noir, défilement doux (Lenis vendorisé). Sur mobile, la galerie devient une pile d'écrans et les dunes sont désactivées ; avec `prefers-reduced-motion`, tout est statique.

## Ce qui a été testé

| Vérification | Résultat |
|---|---|
| `tools/test-api.mjs` : 44 contrôles de bout en bout (accès public, rôles, inscription → joueur, compte parent, présences, évaluations, scolaire et règle des tournois, échéancier, déclaration et validation de paiement, reçus, détection et candidats, partage de passeport, journal, export, **persistance des données et des sessions après redémarrage**, restauration) | 44/44 |
| `tools/shoot-recit.mjs` : 44 captures du récit au défilement du site public (ouverture, galerie, sections) à 1440 px et 390 px, contrôle des erreurs JavaScript et des débordements | 0 erreur, 0 débordement |
| `tools/shoot-espaces.mjs` : 51 captures de toutes les vues des trois espaces à 1440 px et 390 px sur données de démonstration temporaires, contrôle des erreurs JavaScript et des débordements horizontaux | 0 erreur, 0 débordement |
| Détecteur d'anti-patterns Impeccable sur les feuilles de style et scripts | 0 signalement |
| Site public : captures section par section (`tools/shoot.mjs`), Lighthouse sur la v1 de la refonte | conforme (voir commit précédent) |

Vérifications **non faites** : aucune mesure sur un vrai téléphone (captures Chrome headless uniquement), pas de test de charge, pas de test d'impression sur imprimante physique (mise en page `@media print` vérifiée en aperçu).

## Limites connues, à dire honnêtement

1. **Persistance sur Render** : la base SQLite est persistante localement (prouvé par le test de redémarrage). Sur le plan gratuit de Render, le disque est effacé à chaque redéploiement ou réveil : il faut un disque persistant (plan Starter, `/var/data`) ou des exports réguliers. Détail dans `DEPLOIEMENT-RENDER.txt`. Je n'ai pas vérifié le comportement en ligne.
2. **Paiements** : aucune passerelle Airtel Money / Moov Money n'est branchée. Les parents déclarent un paiement, la direction le vérifie et le valide manuellement ; le reçu n'est émis qu'après validation.
3. **Messagerie** : aucun envoi automatique de SMS ou WhatsApp. Les boutons ouvrent WhatsApp avec un message pré-rempli (relance, absence, demande).
4. **Documents** : la visite médicale, l'autorisation parentale et le consentement photos sont des cases suivies par la direction, pas des fichiers téléversés.
5. **Photos** : uniquement les trois photos existantes (hero, entraînement, équipe) ; aucun visuel ajouté ni partenaire inventé. Aucune statistique n'est affichée tant qu'elle n'est pas calculée sur de vraies données.
6. **Police** : Sora et Manrope, auto-hébergées, en remplacement des polices système de la v1.
7. **Remote git** : le dépôt local pointe vers un bundle de sauvegarde, pas vers GitHub ; rien n'a été poussé.
8. Les messages de commit portent une ligne `Co-Authored-By: Claude …` : à retirer (`git rebase` ou amend) si le projet est rendu comme travail personnel.

## À configurer par l'académie

- Variables Render : `ADMIN_PASSWORD`, `DATA_DIR=/var/data`, `NODE_VERSION=22.12.0`, disque persistant.
- Paramètres de l'espace direction : WhatsApp, e-mail, Facebook, Instagram (vides = non affichés), tarifs, moyenne minimale, seuil de présence, règle des tournois, charges fixes, consigne Mobile Money.
- Comptes coachs puis affectation aux groupes ; comptes parents depuis chaque fiche joueur (mot de passe provisoire à transmettre, changement imposé à la première connexion).
- Dates réelles des journées de détection.
