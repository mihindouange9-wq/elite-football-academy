# -*- coding: utf-8 -*-
"""Contenu du business plan Elite Football Academy : une liste de blocs typés, rendue en Word et en PDF.
Blocs : ("h1"|"h2"|"h3"|"p"|"lead"|"ul", ...), ("table", {"tete": [...], "lignes": [[...]], "larg": [...], "totaux": {idx}, "sections": {idx}}),
("note", texte), ("encart", {"titre", "texte"}), ("pagebreak",)."""
import modele as M
import partie3
from modele import fcfa

F = fcfa
A1, A2, A3 = (M.compte_resultat(a) for a in (1, 2, 3))
P1, P2, P3 = A1["produits"], A2["produits"], A3["produits"]
TR = M.tresorerie()
AM = M.amortissements()
SEUIL1, SEUIL2 = M.seuil(1), M.seuil(2)
BIL = M.bilan_fin_a1()
INV_TOTAL = M.INV_TOTAL
RESERVE = M.RESERVE
SOUS_TOTAUX = M.INV_SOUS_TOTAUX

TITRE = "Elite Football Academy"
SLOGAN = "« Révéler les talents, bâtir des parcours »"
FONDATEUR = "Thomas Serge Lanchais"
SITE = "elite-football-academy-eezb.onrender.com"

def pct(a, b):
    return f"{100 * a / b:.1f} %".replace(".", ",")

def t(tete, lignes, larg=None, totaux=(), sections=()):
    return ("table", {"tete": tete, "lignes": lignes, "larg": larg, "totaux": set(totaux), "sections": set(sections)})

def blocs():
    B = []
    add = B.append
    # ------------------------------------------------------------------ INTRODUCTION
    add(("h1", "INTRODUCTION"))
    add(("p", "Le football est, au Gabon, le sport le plus pratiqué et le plus regardé. À Libreville et dans sa périphérie, où se concentre près de 60 % de la population urbaine du pays, des milliers de garçons et de filles de 8 à 18 ans jouent chaque semaine sur des terrains de quartier, dans des clubs informels ou des écoles de football sans encadrement diplômé, sans suivi médical et, surtout, sans lien avec leur scolarité. Les familles qui veulent offrir à leur enfant une formation sérieuse se heurtent à deux impasses : d'un côté des structures peu chères mais sans projet pédagogique, de l'autre des académies privées coûteuses, rares et souvent sans réponse à la question qui préoccupe le plus les parents gabonais : « que devient mon enfant s'il ne devient pas footballeur professionnel ? »"))
    add(("p", f"C'est à cette question que répond Elite Football Academy, projet porté par {FONDATEUR}, fondateur et gérant. Elite Football Academy est une académie Sport-Études de football implantée à Akanda, à proximité immédiate du stade de l'Amitié, au nord de Libreville. Elle forme les jeunes de 8 à 18 ans sur le terrain, les accompagne à l'école et leur transmet des valeurs qui durent. Sa promesse tient en un slogan : {SLOGAN}."))
    add(("p", f"Le projet repose sur un capital social total de {F(M.CAPITAL)} FCFA, composé de {F(M.CAPITAL_NUM)} FCFA en numéraire (équivalent à 13 000 €) et d'un apport en nature de {F(M.CAPITAL_NAT)} FCFA correspondant à la plateforme numérique de l'académie, déjà développée et en ligne : site public, espaces direction, coachs et parents, passeport du joueur, détection en ligne, cotisations et paiements. Cette plateforme est l'innovation différenciante du projet : aucune académie de football de Libreville n'offre aujourd'hui aux familles un suivi en temps réel de la progression sportive, scolaire et administrative de leur enfant."))
    add(("p", f"Le dossier a été construit avec une exigence de prudence financière : {F(RESERVE)} FCFA du capital en numéraire sont conservés en réserve de trésorerie dès le premier jour, et le plan de trésorerie mensuel de la première saison ne descend jamais en dessous de {F(TR['min'])} FCFA. L'académie atteint son seuil de rentabilité dès la première saison, avec {SEUIL1['joueurs']} joueurs en moyenne pour un effectif moyen prévu de {str(P1['eff_moyen']).replace('.', ',')}, et dégage {F(A3['net'])} FCFA de résultat net en année 3."))
    add(("p", "Le présent business plan détaille la structure interne d'Elite Football Academy, son organisation opérationnelle, l'analyse du marché de la formation footballistique des jeunes au Gabon et de la concurrence, ainsi qu'une analyse financière exhaustive poste par poste : capital et investissements, charges, produits, compte de résultat sur trois ans, plan de trésorerie mensuel, seuil de rentabilité et bilan de fin de première année."))

    # ------------------------------------------------------------------ DESCRIPTION
    add(("h1", "DESCRIPTION DE L'ACTIVITÉ"))
    add(("p", "Elite Football Academy SARL est une entreprise privée gabonaise dont l'activité principale est la formation sportive, le suivi scolaire et l'accompagnement humain de jeunes footballeurs de 8 à 18 ans, garçons et filles. L'académie est implantée à Akanda (commune du Grand Libreville), sur un terrain loué à proximité du stade de l'Amitié, et organise ses entraînements du lundi au samedi par groupes d'âge : U7-U9 (école de foot), U10-U12, U13-U15 et U16-U18."))
    add(("p", "L'offre se concentre sur deux filières, conçues pour répondre aux deux grands profils de familles rencontrés à Libreville :"))
    add(("h3", "Filière 1 — Sport-Études"))
    add(("p", f"La filière la plus complète, à {F(M.TARIF[1]['SE'])} FCFA par mois. Elle comprend les entraînements du matin et les séances technique et tactique de l'après-midi, des séances individualisées le mercredi, un suivi scolaire structuré avec aménagement du temps et un répétiteur, le suivi médical et la visite d'aptitude, les matchs, tournois et stages de vacances, et la pochette de bienvenue (maillot, ballon, sac). La règle de l'académie y est appliquée : la participation aux tournois demande un suivi scolaire à jour et une moyenne trimestrielle d'au moins 10/20."))
    add(("h3", "Filière 2 — Loisirs"))
    add(("p", f"La filière souple, à {F(M.TARIF[1]['LO'])} FCFA par mois. Elle comprend les séances en fin d'après-midi et le samedi matin, un encadrement diplômé et une progression technique, le suivi médical et la visite d'aptitude, des matchs amicaux, l'accès aux stages de vacances et la pochette de bienvenue."))
    add(("p", f"Dans les deux filières, chaque joueur dispose d'un passeport numérique : cinq axes notés chaque trimestre par ses éducateurs (technique, physique, tactique, mental, scolaire), un radar de progression, les présences, les observations, les moyennes scolaires et, avec l'autorisation des parents, un lien de partage sécurisé destiné aux clubs et aux recruteurs. Les parents consultent tout cela depuis leur téléphone, déclarent leurs paiements Mobile Money et reçoivent leurs reçus numérotés."))
    add(("h3", "Modèle économique : cotisations + inscriptions + stages"))
    add(("p", f"Le modèle économique repose sur trois flux de revenus complémentaires. D'une part, les cotisations mensuelles des deux filières, encaissées de septembre à juin (dix mois) et suivies joueur par joueur dans la plateforme (échéancier, relances, reçus). D'autre part, les frais d'inscription uniques de {F(M.FRAIS_INSCRIPTION)} FCFA, qui couvrent la pochette de bienvenue, la licence et l'assurance individuelle du joueur. Enfin, trois stages de vacances par saison (Toussaint, Pâques, été) à {F(M.PRIX_STAGE)} FCFA par enfant, ouverts aussi aux jeunes extérieurs à l'académie. À partir de la deuxième saison, des partenariats avec des entreprises locales viennent compléter ces revenus, sans que le modèle en dépende."))
    add(("p", f"Le programme annuel prévoit 36 semaines d'entraînement, trois stages de vacances, des matchs amicaux, des tournois et deux évaluations techniques par saison. Une journée de détection gratuite est organisée chaque année pour les jeunes des quartiers populaires : elle est à la fois un engagement social et le premier canal de recrutement de l'académie."))
    add(("p", f"Grâce à un capital social de {F(M.CAPITAL)} FCFA (dont {F(M.CAPITAL_NUM)} FCFA en numéraire et une plateforme numérique déjà opérationnelle apportée en nature), à des charges fixes maîtrisées ({F(A1['total_charges'])} FCFA en année 1) et à un seuil de rentabilité de {SEUIL1['joueurs']} joueurs atteint dès la première saison, Elite Football Academy vise un effectif de {P2['eff_max']} joueurs en année 2 (capacité du terrain) et de {P3['eff_max']} joueurs en année 3 avec l'ouverture d'un second créneau."))

    # ------------------------------------------------------------------ I. STRUCTURE INTERNE
    add(("h1", "I.  STRUCTURE INTERNE D'ELITE FOOTBALL ACADEMY"))
    add(("h2", "1.  Présentation de l'entreprise"))
    add(("h3", "1.1  Raison sociale et statuts"))
    add(("p", "La raison sociale est Elite Football Academy SARL. L'entreprise est immatriculée à Libreville auprès de l'Agence Nationale de Promotion des Investissements (ANPI Gabon), guichet unique des formalités : immatriculation au Registre du Commerce et du Crédit Mobilier (RCCM), obtention du Numéro d'Identification Fiscale (NIF), affiliation à la CNSS et à la CNAMGS en qualité d'employeur, ouverture du compte bancaire professionnel. L'affiliation sportive de l'académie et les licences de ses joueurs sont demandées auprès des instances compétentes du football gabonais pour la saison de lancement ; une provision est prévue à cet effet dans les investissements initiaux."))
    add(("p", "Les statuts précisent l'objet social, à savoir « la formation sportive de jeunes footballeurs, l'accompagnement scolaire et éducatif associé, l'organisation de séances, de stages, de journées de détection, de matchs et de tournois, l'exploitation d'une plateforme numérique de suivi des joueurs et des familles, ainsi que toute prestation de services et toute activité de partenariat connexe »."))
    add(("h3", "Tableau d'identité de l'entreprise"))
    add(("p", "Ce tableau récapitule les éléments d'identification essentiels d'Elite Football Academy SARL."))
    add(t(["Rubrique", "Description"], [
        ["Nom commercial", "Elite Football Academy"],
        ["Secteur d'activité", "Formation sportive et scolaire de jeunes footballeurs (académie Sport-Études)"],
        ["Forme juridique", "SARL (Société à Responsabilité Limitée) — droit OHADA"],
        ["Siège social", "Akanda, Grand Libreville, Gabon — terrain loué à proximité du stade de l'Amitié"],
        ["Fondateur et gérant", FONDATEUR],
        ["Capital social total", f"{F(M.CAPITAL)} FCFA (≈ 23 670 €)"],
        ["dont apport en numéraire", f"{F(M.CAPITAL_NUM)} FCFA (≈ 13 000 €)"],
        ["dont apport en nature (plateforme numérique)", f"{F(M.CAPITAL_NAT)} FCFA — plateforme développée et en ligne, évaluation en annexe"],
        ["Effectif permanent au démarrage", "Gérant + 2 éducateurs diplômés + 1 responsable administratif à temps partiel + vacataires (répétiteur, médecin, kinésithérapeute)"],
        ["Public", "Garçons et filles de 8 à 18 ans, deux filières : Sport-Études et Loisirs"],
        ["Capacité", f"{M.CAPACITE[1]} joueurs sur le terrain d'Akanda ; {M.CAPACITE[3]} en année 3 avec un second créneau"],
        ["Innovation différenciante", "Plateforme numérique : passeport du joueur, espaces direction / coachs / parents, détection en ligne, cotisations et paiements"],
        ["Site public", SITE],
        ["Slogan", SLOGAN],
    ], larg=[32, 68]))
    add(("h3", "1.2  Idée du projet"))
    add(("p", f"L'idée du projet est née de l'observation, par {FONDATEUR}, de deux réalités du football des jeunes à Libreville. La première est pédagogique : les enfants qui jouent le plus sont souvent ceux que l'école perd en premier. Faute de passerelle entre le terrain et la classe, le football devient pour beaucoup de familles une menace pour la scolarité plutôt qu'un levier. La seconde est organisationnelle : même dans les structures sérieuses, les parents ne savent pas ce que fait leur enfant à l'entraînement, s'il progresse, s'il était présent, ce qu'ils ont réellement payé et ce qu'il reste à régler. Tout repose sur des cahiers, des messages WhatsApp dispersés et la mémoire du coach."))
    add(("p", "Elite Football Academy propose une réponse locale et structurée : une académie qui prend le sport et l'école ensemble, qui applique une règle claire (pas de tournoi sans suivi scolaire à jour) et qui donne à chaque famille, depuis son téléphone, une vision complète et honnête de la progression de son enfant. Le projet garde l'idée d'origine de l'académie — former des joueurs et des élèves — et lui ajoute l'outil qui lui manquait pour tenir cette promesse à l'échelle de 80 puis 120 joueurs."))
    add(("h3", "1.3  Vision, missions et valeurs"))
    add(("p", "Vision : devenir d'ici 2029 l'académie de référence au Gabon pour la formation Sport-Études des jeunes footballeurs, reconnue par les familles, les écoles et les clubs pour la qualité de ses joueurs et la solidité de leur parcours scolaire."))
    add(("p", "Mission : permettre à chaque jeune joueur, quels que soient ses moyens, de révéler son potentiel sportif et personnel, en formant sur le terrain, en accompagnant à l'école et en transmettant des valeurs qui durent."))
    add(("p", "Valeurs fondatrices :"))
    add(("ul", ["Excellence : des entraînements de haut niveau, des éducateurs diplômés, une évaluation rigoureuse sur cinq axes chaque trimestre.",
                "Respect : des adversaires, des arbitres, des éducateurs, des familles et de soi-même.",
                "Discipline : la ponctualité, la présence, la tenue et l'effort, suivis et valorisés dans le passeport.",
                "Dépassement : chaque joueur est comparé à lui-même, trimestre après trimestre, jamais humilié.",
                "Solidarité : une journée de détection gratuite chaque année pour les quartiers populaires, des exonérations ciblées pour les familles en difficulté.",
                "Réussite scolaire : le sport ne se construit pas contre l'école, il se construit avec elle."]))
    add(("p", "Objectifs stratégiques à 3 ans :"))
    add(("ul", [f"Année 1 : lancer l'académie avec {P1['eff'][0]} joueurs dès septembre, atteindre {P1['eff_max']} joueurs en fin de saison et {F(P1['total'])} FCFA de produits, avec une trésorerie jamais inférieure à {F(TR['min'])} FCFA.",
                f"Année 2 : remplir la capacité du terrain ({P2['eff_max']} joueurs), recruter un troisième éducateur, signer deux partenariats avec des entreprises locales, atteindre {F(P2['total'])} FCFA de produits.",
                f"Année 3 : ouvrir un second créneau ou un second terrain, passer à {P3['eff_max']} joueurs et quatre éducateurs, atteindre {F(P3['total'])} FCFA de produits et {F(A3['net'])} FCFA de résultat net.",
                "Faire reconnaître le passeport du joueur par les clubs et les centres de formation gabonais comme pièce de référence du dossier d'un jeune."]))
    add(("h3", "1.4  Statut juridique et organisation"))
    add(("p", "Elite Football Academy est constituée sous la forme juridique de la Société à Responsabilité Limitée (SARL), conformément à l'Acte uniforme OHADA relatif au droit des sociétés commerciales. Cette forme protège le patrimoine personnel du gérant, rassure les partenaires (bailleur du terrain, assureur, banques, entreprises partenaires) et permet l'entrée ultérieure d'associés ou d'investisseurs au capital."))
    add(("p", f"Le capital social total s'élève à {F(M.CAPITAL)} FCFA, intégralement libéré à la création. Il se compose de {F(M.CAPITAL_NUM)} FCFA en numéraire et d'un apport en nature évalué à {F(M.CAPITAL_NAT)} FCFA correspondant à la plateforme numérique de l'académie, développée en collaboration avec le studio MÉTHODE AURA et déjà en ligne au moment de la rédaction de ce dossier. L'évaluation de cet apport (coût de développement, fonctionnalités livrées, valeur d'usage) figure en annexe."))
    add(("h2", "2.  Organisation et ressources humaines"))
    add(("h3", "2.1  Organigramme"))
    add(("p", "L'organisation au démarrage repose sur une équipe resserrée, complétée par des intervenants vacataires pour les fonctions spécialisées. Ce modèle hybride combine la stabilité d'un noyau permanent et la souplesse nécessaire à une activité saisonnière."))
    add(("p", "Représentation simplifiée de l'organigramme :"))
    add(("ul", [f"DIRECTION — {FONDATEUR} (fondateur et gérant) : pilotage, relations avec les familles, les écoles et les partenaires, pilotage financier depuis l'espace direction de la plateforme.",
                "Pôle sportif — 2 éducateurs diplômés en année 1 (3 en année 2, 4 en année 3), chacun responsable de deux groupes d'âge, du pointage des présences et des évaluations trimestrielles.",
                "Pôle scolaire — 1 responsable administratif et suivi scolaire à temps partiel (liaison avec les écoles, saisie des moyennes, convocations) et 1 répétiteur vacataire pour la filière Sport-Études.",
                "Pôle santé — médecin et kinésithérapeute partenaires (forfait mensuel) : visites d'aptitude, présence sur les tournois, suivi des blessures.",
                "Comptabilité tenue par le gérant à partir des exports de la plateforme (échéancier, paiements, dépenses, rapport mensuel), avec le visa annuel d'un comptable indépendant pour la DSF et le bilan SYSCOHADA."]))
    add(("h3", "2.2  Répartition des responsabilités"))
    add(("p", "Le tableau ci-dessous détaille les responsabilités de chaque poste. La plateforme numérique matérialise cette répartition : chaque personne dispose d'un compte et d'un rôle (direction, coach, parent) et ne voit que ce qui la concerne."))
    add(t(["Poste", "Responsabilités"], [
        [f"Gérant — {FONDATEUR}", "Stratégie, recrutement et encadrement des éducateurs, relations avec les familles, les écoles, le bailleur, l'assureur et les partenaires ; validation des paiements, génération de l'échéancier, rapport mensuel, sauvegardes ; animation de la journée de détection annuelle."],
        ["Éducateurs diplômés (2 à 4)", "Préparation et conduite des séances par groupe d'âge, feuille de présence à chaque séance, évaluation trimestrielle sur les cinq axes, observations, notation des candidats en détection, encadrement des matchs, tournois et stages."],
        ["Responsable administratif et suivi scolaire (temps partiel)", "Accueil des familles, dossiers d'inscription et consentements, liaison avec les établissements scolaires, saisie des moyennes trimestrielles, convocations et informations, relances de cotisations."],
        ["Répétiteur scolaire (vacataire)", "Aide aux devoirs et remise à niveau des joueurs Sport-Études, deux fois par semaine, en lien avec les enseignants ; alerte précoce en cas de baisse de moyenne."],
        ["Médecin et kinésithérapeute partenaires", "Visite médicale d'aptitude à l'inscription, présence sur les tournois et détections, prise en charge des blessures, conseils de prévention."],
        ["Comptable indépendant (mission ponctuelle)", "Paramétrage du plan comptable SYSCOHADA, visa annuel de la Déclaration Statistique et Fiscale, production du bilan."],
    ], larg=[30, 70]))
    add(("h3", "2.3  Politique de recrutement et formation"))
    add(("p", "Le recrutement des éducateurs privilégie des profils titulaires d'un diplôme d'entraîneur reconnu (licence fédérale ou équivalent) et d'une expérience de l'encadrement des jeunes. Au-delà de la compétence technique, l'académie exige une posture éducative : exemplarité, langage, respect des enfants et des familles. Chaque recrutement comporte une période d'essai sur les premières semaines d'entraînement, observée par le gérant."))
    add(("p", "Une fois recrutés, les éducateurs suivent une formation interne de deux journées : protocole de protection des mineurs, gestes de premiers secours, méthode d'évaluation sur les cinq axes, prise en main de l'espace coachs (feuille de présence en trois touches, curseurs d'évaluation, observations, notation en détection). Un budget de formation continue est prévu chaque année pour les diplômes fédéraux et les formations de secourisme."))
    add(("h3", "2.4  Marché amont (fournisseurs et partenaires)"))
    add(("p", "Le marché amont est structuré autour de cinq catégories de fournisseurs et de partenaires, identifiés avant le démarrage :"))
    add(("ul", ["Terrain : location d'un terrain avec vestiaires à Akanda, à proximité du stade de l'Amitié, sur la base d'un contrat annuel renouvelable avec une caution de deux mois.",
                "Équipementiers : distributeurs de matériel sportif de Libreville pour les buts mobiles, ballons, chasubles, plots et matériel de coordination ; fournisseur de textile pour les maillots floqués, shorts et sacs des pochettes de bienvenue.",
                "Santé : médecin du sport et kinésithérapeute conventionnés par forfait mensuel ; pharmacie partenaire pour le renouvellement des trousses de secours.",
                "Écoles : établissements scolaires d'Akanda et du nord de Libreville, avec lesquels l'académie organise les aménagements d'horaires de la filière Sport-Études et l'échange des bulletins.",
                "Numérique : hébergement de la plateforme (serveur, disque persistant, nom de domaine) et maintenance assurée par le studio MÉTHODE AURA dans le cadre de la collaboration existante."]))
    add(("p", "Une politique de double sourcing est appliquée pour le matériel sportif et le textile afin de sécuriser les délais de la rentrée et de maintenir une pression concurrentielle sur les prix."))
    add(("h2", "3.  Processus opérationnels"))
    add(("h3", "3.1  Le parcours d'un joueur, de la découverte à l'orientation"))
    add(("p", "Le cœur du métier de l'académie est un parcours en six étapes, outillé de bout en bout par la plateforme. Le tableau ci-dessous présente la chronologie type, depuis la première prise de contact d'une famille jusqu'au partage du passeport avec un club."))
    add(t(["Étape", "Délai", "Description détaillée"], [
        ["1 — Découverte", "Jour 0", "La famille remplit le formulaire du site (avec consentement du responsable légal) ou écrit sur WhatsApp. La demande apparaît dans l'espace direction ; une visite du terrain est proposée."],
        ["2 — Détection", "Sous 2 à 4 semaines", "Le jeune participe à une journée de détection : inscription en ligne, dossard attribué immédiatement, ateliers techniques, physiques et de jeu, grille de notation commune aux éducateurs, décision communiquée à la famille."],
        ["3 — Intégration", "1 à 2 semaines", "Visite médicale d'aptitude, choix de la filière avec la famille, dossier et autorisations signés, création du compte parent, remise de la pochette de bienvenue, affectation à un groupe d'âge."],
        ["4 — Entraînement", "Toute la saison", "Séances par groupe d'âge selon le planning publié, présences pointées par le coach à chaque séance, matchs amicaux, tournois (sous condition scolaire pour la filière Sport-Études) et stages de vacances."],
        ["5 — Évaluation", "Chaque trimestre", "Les cinq axes du passeport sont notés et commentés ; la moyenne scolaire du trimestre est saisie ; la famille consulte le radar et les observations dans son espace."],
        ["6 — Orientation", "Dès que le niveau le justifie", "Avec l'accord des parents, le passeport est partagé avec un club ou un recruteur par un lien sécurisé, révocable, dont chaque consultation est enregistrée."],
    ], larg=[18, 18, 64]))
    add(("h3", "3.2  Protocoles de sécurité, santé et protection des mineurs"))
    add(("p", "La sécurité des enfants est la priorité absolue de l'académie. Tous les entraînements respectent un protocole en cinq points : (1) visite médicale d'aptitude obligatoire avant la première séance, enregistrée dans la fiche du joueur avec sa date de validité ; (2) présence d'un éducateur formé aux premiers secours et d'une trousse de secours à chaque séance ; (3) hydratation et adaptation des charges d'entraînement à l'âge et à la chaleur ; (4) autorisation parentale signée et consentement explicite pour les photos et vidéos ; (5) aucun échange individuel entre un adulte et un enfant en dehors des canaux de l'académie, les communications passant par les parents."))
    add(("p", "L'entreprise se conforme aux principales obligations réglementaires : Code du travail gabonais pour les salariés, déclarations CNSS et CNAMGS, assurance responsabilité civile et assurance accidents couvrant les joueurs pendant les séances, matchs, stages et transports, réglementation sportive applicable pour l'affiliation et les licences. Les données personnelles des familles sont traitées avec le consentement du responsable légal, stockées sur un serveur sécurisé, et ne sont jamais vendues ni cédées."))
    add(("h3", "3.3  Gestion de l'organisation et relation avec les familles"))
    add(("p", "La direction pilote l'académie depuis son espace : tableau de bord (effectifs par groupe, taux de présence, impayés, alertes scolaires, dossiers médicaux à renouveler), demandes d'inscription, fiches joueurs, planning des séances, détections, échéancier des cotisations et validation des paiements, rapport mensuel imprimable, journal des actions et sauvegarde complète en un fichier."))
    add(("p", "La relation avec les familles repose sur trois engagements : (1) la transparence — tout ce qui concerne l'enfant est visible dans l'espace parents, du planning aux reçus ; (2) la réactivité — les absences sont signalées aux parents dès la séance suivante par WhatsApp, les baisses de moyenne dès la saisie du bulletin ; (3) l'équité — les règles sont les mêmes pour tous et appliquées automatiquement par la plateforme, ce qui protège l'éducateur comme la famille."))
    add(("h3", "3.4  La plateforme numérique Elite — innovation et apport en nature"))
    add(("p", "La plateforme numérique constitue l'innovation centrale du projet et son principal facteur de différenciation. Déjà développée et en ligne, elle est apportée en nature au capital. Elle se compose de quatre espaces :"))
    add(("ul", ["Le site public : présentation de l'académie, des filières et des tarifs, planning, actualités, journées de détection avec réservation d'un dossard en ligne, formulaire d'inscription avec consentement. Toute information modifiée par la direction s'y affiche aussitôt.",
                "L'espace direction : demandes, joueurs et passeports, groupes et planning, détections et grilles de notation, cotisations, paiements et reçus, rapport mensuel, actualités et convocations, comptes des coachs et des parents, paramètres, journal, sauvegarde et restauration.",
                "L'espace coachs : la semaine du coach, la feuille de présence en trois touches, l'évaluation trimestrielle par cinq curseurs, les observations, les absences récentes avec message aux parents en un clic, la notation des candidats en détection.",
                "L'espace parents : prochaine séance, présences, passeport et radar de progression, documents du dossier, convocations, échéancier, déclaration des paiements Mobile Money et reçus imprimables, partage sécurisé du passeport avec un club."]))
    add(("p", "Le socle technique est sobre et sûr : serveur unique sans dépendance externe, base de données persistante avec export et restauration, mots de passe chiffrés, trois rôles vérifiés côté serveur, journal des actions sensibles, consentement parental enregistré pour chaque inscription et chaque partage. Les coûts récurrents se limitent à l'hébergement, au disque de sauvegarde et au nom de domaine."))
    add(("p", "L'intérêt économique de la plateforme est direct : elle réduit les impayés (échéancier, relances, reçus), elle fait gagner aux éducateurs le temps du papier, elle rassure les familles qui paient pour un service visible, et elle transforme le passeport du joueur en véritable actif pour les familles lorsque vient le moment de l'orientation vers un club."))

    # ------------------------------------------------------------------ II. STRUCTURE EXTERNE
    add(("h1", "II.  STRUCTURE EXTERNE DE L'ENTREPRISE"))
    add(("h2", "1.  Étude du marché de la formation footballistique des jeunes au Gabon"))
    add(("h3", "1.1  Besoins et tendances du marché"))
    add(("p", "Le Gabon compte une population jeune : plus de la moitié des Gabonais ont moins de 25 ans et la tranche des 8-18 ans représente, selon les estimations démographiques courantes, de l'ordre d'un cinquième de la population. Rapporté aux quelque 800 000 habitants du Grand Libreville, cela représente un ordre de grandeur de 150 000 à 180 000 enfants et adolescents, dont une part importante pratique le football chaque semaine, de manière informelle pour l'immense majorité. Ces chiffres constituent un ordre de grandeur de marché ; ils seront affinés par l'enquête de terrain menée lors des journées de détection."))
    add(("p", "Trois tendances soutiennent le projet. La première est la professionnalisation progressive du football gabonais et la réussite de joueurs partis se former à l'étranger, qui nourrit chez les familles le désir d'une formation sérieuse pour leurs enfants. La deuxième est la préoccupation scolaire croissante des parents, pour qui le football ne peut plus être une alternative à l'école : l'offre Sport-Études répond précisément à cette attente. La troisième est l'équipement numérique des familles : le téléphone est devenu l'outil de gestion de la vie quotidienne, du paiement Mobile Money aux groupes WhatsApp de parents, ce qui rend un espace parents sur téléphone immédiatement adoptable."))
    add(("h3", "1.2  Acteurs institutionnels et privés"))
    add(("p", "Côté institutionnel, les acteurs clés sont : le ministère en charge des Sports (cadre réglementaire des structures de formation), la Fédération gabonaise de football et ses ligues (affiliation, licences, compétitions de jeunes), le ministère de l'Éducation nationale et les établissements scolaires (aménagements horaires de la filière Sport-Études), la commune d'Akanda (terrains, événements), l'ANPI Gabon (formalités et accompagnement des PME)."))
    add(("p", "Côté privé, les acteurs sont : les clubs de football et leurs centres de formation (débouché naturel des joueurs de l'académie et destinataires du passeport partagé), les écoles privées (partenariats Sport-Études), les entreprises locales (sponsoring d'équipements, de tournois et de la journée de détection gratuite), les opérateurs de Mobile Money (canal de paiement des familles), les équipementiers et le bailleur du terrain."))
    add(("h3", "1.3  Reconnaissance officielle et partenariats"))
    add(("p", "L'objectif prioritaire des douze premiers mois est l'affiliation de l'académie et la délivrance des licences de ses joueurs, qui ouvrent l'accès aux compétitions officielles de jeunes et donnent au passeport du joueur une valeur reconnue. En parallèle, l'académie vise trois conventions : avec un ou deux établissements scolaires d'Akanda pour la filière Sport-Études, avec un cabinet médical pour le suivi des joueurs, et avec une première entreprise partenaire pour financer les équipements et la journée de détection gratuite. Le passeport du joueur est présenté aux clubs comme pièce de référence du dossier d'un jeune : c'est l'ambition de l'académie à trois ans."))
    add(("h3", "1.4  Mode de prospection et acquisition des familles"))
    add(("p", "La stratégie d'acquisition repose sur quatre canaux complémentaires, chacun calibré sur un moment de l'année :"))
    add(("ul", ["La journée de détection gratuite de rentrée : événement de lancement de chaque saison, annoncé dans les écoles et les quartiers d'Akanda, avec inscription en ligne et dossard immédiat. Elle est à la fois le premier geste social de l'académie et sa première source de joueurs.",
                "Le site public et le bouche-à-oreille WhatsApp : formulaire d'inscription avec recontact sous 48 heures, bouton WhatsApp sur chaque page, messages pré-remplis ; les parents satisfaits sont les meilleurs ambassadeurs d'une académie, et l'espace parents leur donne des choses concrètes à montrer.",
                "Les écoles : présentation de la filière Sport-Études aux directions et aux associations de parents, affichage, participation aux journées sportives.",
                "Les matchs amicaux et tournois : visibilité des maillots, des éducateurs et du comportement des joueurs, qui est la meilleure publicité d'une académie auprès des autres familles et des clubs."]))
    add(("h2", "2.  Analyse de la concurrence"))
    add(("h3", "2.1  Structures concurrentes (directes et indirectes)"))
    add(("p", "Concurrence directe : les académies et écoles de football privées de Libreville, peu nombreuses, dont certaines sont adossées à des clubs ou à des anciens joueurs. Elles offrent un encadrement de qualité variable, rarement un suivi scolaire formalisé, et aucune, à notre connaissance, un espace numérique pour les familles. Leurs tarifs se situent, selon les relevés effectués auprès de parents, dans une fourchette indicative de 20 000 à 60 000 FCFA par mois, à confirmer par l'enquête terrain."))
    add(("p", "Concurrence indirecte : les clubs de quartier et les équipes informelles (gratuits ou presque, sans éducateur diplômé, sans suivi médical ni scolaire), les sections sportives de certains établissements scolaires (réservées à leurs élèves, football souvent non prioritaire), et les autres sports et loisirs qui disputent le temps et le budget des familles. Face à ces alternatives, l'académie ne se positionne pas sur le prix le plus bas mais sur la valeur la plus visible : un enfant encadré, suivi, évalué, protégé, et des parents informés."))
    add(("h3", "2.2  Analyse SWOT et PESTEL"))
    add(("p", "L'analyse SWOT ci-dessous identifie les forces internes, les faiblesses, les opportunités externes et les menaces qui structurent l'environnement d'Elite Football Academy."))
    add(t(["FORCES", "FAIBLESSES"], [
        ["• Une offre Sport-Études réelle : répétiteur, liaison avec les écoles, règle des tournois appliquée automatiquement\n• Une plateforme numérique unique à Libreville, déjà en ligne, apportée en nature\n• Un fondateur engagé, un terrain à proximité du stade de l'Amitié\n• Des charges fixes légères et une réserve de trésorerie dès le départ\n• Deux filières lisibles, des tarifs clairs, une journée de détection gratuite",
         "• Notoriété à construire : première saison, pas encore de résultats sportifs à montrer\n• Dépendance à un terrain loué (renouvellement du bail)\n• Équipe réduite au démarrage : la qualité repose sur deux éducateurs\n• Saisonnalité des encaissements (dix mois de cotisations)\n• Impayés possibles dans un contexte de revenus irréguliers"],
    ], larg=[50, 50]))
    add(t(["OPPORTUNITÉS", "MENACES"], [
        ["• Une population jeune et passionnée de football, des familles attentives à l'école\n• Peu d'offres structurées à Akanda et dans le nord de Libreville\n• Appétit des clubs pour des joueurs formés et documentés (passeport)\n• Entreprises locales à la recherche d'un sponsoring visible et social\n• Généralisation du Mobile Money et de WhatsApp chez les parents",
         "• Baisse du pouvoir d'achat des familles en période difficile\n• Arrivée d'une académie concurrente mieux dotée\n• Blessure grave ou incident sur un mineur (risque réputationnel majeur, d'où le protocole de sécurité)\n• Perte du terrain ou hausse brutale du loyer\n• Départ d'un éducateur clé en cours de saison"],
    ], larg=[50, 50]))
    add(("p", "Analyse PESTEL — environnement macro-économique :"))
    add(t(["Dimension", "Analyse appliquée à Elite Football Academy"], [
        ["Politique", "Volonté publique affichée de développer le sport et la formation des jeunes ; soutien possible des communes aux événements de jeunesse ; stabilité relative du cadre réglementaire sportif."],
        ["Économique", "Revenus des ménages inégaux et parfois irréguliers : tarifs d'amorçage, paiement mensuel, exonérations ciblées et suivi des impayés dans la plateforme ; coût d'importation du matériel sportif."],
        ["Socioculturel", "Football omniprésent dans la vie des jeunes ; attente forte des parents sur la réussite scolaire ; place croissante des filles dans le football, que l'académie accueille dès le lancement."],
        ["Technologique", "Smartphones et Mobile Money généralisés chez les parents ; WhatsApp comme canal de communication naturel ; hébergement cloud à faible coût pour la plateforme."],
        ["Environnemental", "Chaleur et saison des pluies : horaires adaptés, hydratation, terrain praticable ; matériel durable et réparé plutôt que jeté."],
        ["Légal", "Cadre OHADA pour la SARL ; obligations CNSS et CNAMGS ; assurance et protection des mineurs ; consentement parental pour les données, les photos et le partage du passeport."],
    ], larg=[22, 78]))
    add(("h3", "2.3  Stratégie de différenciation"))
    add(("p", "Elite Football Academy se différencie sur cinq axes complémentaires : (1) le vrai Sport-Études, avec un répétiteur, une liaison avec les écoles et une règle des tournois appliquée sans exception ; (2) le passeport du joueur, document vivant que la famille peut partager avec un club et qui donne à l'académie une crédibilité de centre de formation ; (3) la transparence totale envers les parents, du planning aux reçus ; (4) la protection des mineurs comme engagement affiché et outillé ; (5) un ancrage social réel, avec une journée de détection gratuite chaque année pour les quartiers populaires et des exonérations ciblées."))
    add(("h3", "2.4  Comparaison des prix et des modèles"))
    add(("p", "Le tableau ci-dessous compare l'offre de l'académie aux alternatives disponibles pour les familles de Libreville. Les fourchettes de prix des concurrents sont indicatives et seront confirmées par l'enquête terrain ; elles ne figurent ici que pour situer le positionnement."))
    add(t(["Type d'offre", "Prix indicatif (FCFA / mois)", "Ce que la famille obtient", "Position d'Elite Football Academy"], [
        ["Club de quartier ou équipe informelle", "0 à 5 000", "Des matchs, parfois un adulte référent ; ni suivi médical, ni scolaire, ni assurance", "Plus cher, mais encadré, assuré, suivi et visible"],
        ["École de football de proximité", "10 000 à 25 000", "Séances régulières, encadrement de qualité variable, peu d'information aux parents", f"Filière Loisirs à {F(M.TARIF[1]['LO'])} FCFA, avec passeport, suivi médical et espace parents"],
        ["Académie privée structurée", "40 000 à 60 000", "Entraînements de qualité, parfois matchs et tournois ; rarement un suivi scolaire formalisé", f"Filière Sport-Études à {F(M.TARIF[1]['SE'])} FCFA, avec répétiteur, règle des tournois et passeport partageable"],
        ["Section sportive d'établissement scolaire", "Compris dans la scolarité", "Pratique encadrée mais limitée aux élèves, football non prioritaire", "Complémentaire : convention Sport-Études avec les écoles"],
    ], larg=[22, 16, 32, 30]))
    add(("h2", "3.  Stratégie commerciale et marketing"))
    add(("h3", "3.1  Segmentation"))
    add(("p", "L'académie identifie quatre segments de familles, classés par ordre de contribution au chiffre d'affaires :"))
    add(("ul", ["Segment 1 — Familles Sport-Études : parents convaincus que le football de leur enfant doit s'articuler avec l'école, prêts à investir 50 000 FCFA par mois pour un encadrement complet et un suivi scolaire. Cible de la filière Sport-Études (environ 36 % de l'effectif en année 1, 42 % en année 3).",
                "Segment 2 — Familles Loisirs : parents qui veulent une pratique encadrée, régulière et sûre pour leur enfant, pour 25 000 FCFA par mois. Cible de la filière Loisirs et vivier naturel de la filière Sport-Études.",
                "Segment 3 — Jeunes à potentiel des quartiers populaires : repérés lors de la journée de détection gratuite, accueillis avec des exonérations ciblées ; ils constituent l'ambition sportive et sociale de l'académie.",
                "Segment 4 — Jeunes extérieurs pour les stages de vacances : familles qui ne sont pas inscrites à l'année mais recherchent une semaine encadrée pendant les congés ; premier contact avec l'académie."]))
    add(("h3", "3.2  Plan marketing mix (4P)"))
    add(("p", "Le marketing mix de l'académie — Produit, Prix, Distribution, Communication — est calibré pour rendre visible ce que les familles achètent réellement : un encadrement, un suivi et un parcours."))
    add(t(["Variable", "Description"], [
        ["Produit", "Deux filières (Sport-Études et Loisirs), quatre groupes d'âge, 36 semaines d'entraînement, trois stages, matchs et tournois, passeport du joueur, espace parents, pochette de bienvenue, suivi médical. Service rendu visible par la plateforme."],
        ["Prix", f"Tarifs d'amorçage : {F(M.TARIF[1]['SE'])} FCFA par mois en Sport-Études, {F(M.TARIF[1]['LO'])} FCFA en Loisirs, sur dix mois ; frais d'inscription uniques de {F(M.FRAIS_INSCRIPTION)} FCFA ; stages à {F(M.PRIX_STAGE)} FCFA. Hausse mesurée de 10 % prévue en année 3. Exonérations ciblées décidées par la direction."],
        ["Distribution", "Inscription directe via le site (formulaire et détection en ligne), WhatsApp et accueil sur le terrain. Paiement en espèces, Mobile Money ou virement, déclaré par les parents et validé par la direction."],
        ["Communication", "Journée de détection annuelle, affichage dans les écoles et les quartiers d'Akanda, site public mis à jour en direct, WhatsApp, matchs et tournois. Les réseaux sociaux sont alimentés uniquement avec de vraies images de l'académie, avec le consentement des familles."],
    ], larg=[22, 78]))
    add(("h3", "3.3  Politique tarifaire"))
    add(("p", "La politique tarifaire repose sur trois principes : (1) des tarifs d'amorçage lisibles et stables sur deux saisons, pour installer la confiance ; (2) une mensualisation sur dix mois adaptée aux revenus des familles, avec un échéancier visible dans l'espace parents, des rappels et des reçus numérotés ; (3) une solidarité assumée, par des exonérations ciblées et une journée de détection gratuite, financées par la marge de l'activité et, à partir de la deuxième saison, par les partenariats."))
    add(("p", "Les impayés sont intégrés au modèle de manière prudente : 6 % des cotisations en année 1, 5 % en année 2, 4 % en année 3, grâce au suivi de l'échéancier et aux relances WhatsApp générées depuis l'espace direction."))
    add(("h3", "3.4  Expérience des familles et fidélisation"))
    add(("p", "L'académie s'engage sur une expérience structurée, visible à chaque étape dans la plateforme :"))
    add(("ul", ["Phase de découverte : site public, journée de détection avec dossard en ligne, visite du terrain, réponse sous 48 heures.",
                "Phase d'intégration : visite médicale, choix de la filière, dossier signé, compte parent, pochette de bienvenue remise en main propre.",
                "Phase de saison : planning, présences, convocations, évaluations trimestrielles et radar de progression, échéancier et reçus, le tout sur le téléphone des parents.",
                "Phase d'orientation : passeport partagé avec un club ou un recruteur, avec l'accord des parents, lien révocable et journalisé.",
                "Fidélisation : stages de vacances, maintien du tarif pour les familles présentes depuis la première saison, remise pour le second enfant d'une même famille, et une règle simple — un parent qui comprend ce que fait son enfant reste."]))

    # ------------------------------------------------------------------ III. ANALYSE FINANCIÈRE
    B.extend(partie3.blocs())

    # ------------------------------------------------------------------ CONCLUSION
    add(("h1", "CONCLUSION"))
    add(("p", f"Elite Football Academy se positionne sur un marché à fort potentiel — la formation des jeunes footballeurs de 8 à 18 ans à Libreville — caractérisé par une demande abondante, une offre structurée rare et une attente nouvelle des familles : que le football de leur enfant se construise avec l'école et non contre elle. Avec un capital social total de {F(M.CAPITAL)} FCFA, dont {F(M.CAPITAL_NUM)} FCFA en numéraire et {F(M.CAPITAL_NAT)} FCFA d'apport en nature (la plateforme numérique, déjà en ligne), l'académie dispose des moyens d'atteindre son seuil de rentabilité dès la première saison tout en conservant {F(RESERVE)} FCFA de réserve de trésorerie, jamais entamée."))
    add(("p", "Le projet repose sur cinq piliers : (1) une équipe resserrée d'éducateurs diplômés, encadrée par un fondateur engagé et complétée par des vacataires pour l'école et la santé ; (2) une offre lisible en deux filières, avec des tarifs d'amorçage stables et une solidarité assumée ; (3) un parcours du joueur en six étapes, outillé de bout en bout ; (4) une plateforme numérique unique à Libreville, qui rend visible aux familles ce qu'elles paient et donne au passeport du joueur une valeur auprès des clubs ; (5) une discipline financière stricte, avec une réserve de trésorerie préservée et des impayés intégrés au modèle."))
    add(("p", f"Au-delà des objectifs financiers — {F(P3['total'])} FCFA de produits et {F(A3['net'])} FCFA de résultat net en année 3 — Elite Football Academy ambitionne de devenir l'académie de référence du Gabon pour la formation Sport-Études, créatrice d'emplois qualifiés pour des éducateurs gabonais, et surtout bâtisseuse de parcours : des joueurs qui progressent, des élèves qui réussissent, des familles qui savent."))
    add(("p", f"{SLOGAN} : derrière ce slogan, c'est toute la philosophie de l'académie qui se déploie — révéler ce que chaque enfant a de meilleur, et construire avec lui, et avec sa famille, un parcours qui tient."))

    # ------------------------------------------------------------------ ANNEXES
    add(("h1", "ANNEXES"))
    add(("p", "Les pièces justificatives suivantes sont jointes ou à joindre au présent business plan :"))
    add(("ul", [f"Annexe 1 — Rapport d'évaluation de l'apport en nature : la plateforme numérique Elite Football Academy (site public, espaces direction, coachs et parents, passeport du joueur), évaluée à {F(M.CAPITAL_NAT)} FCFA, avec le détail des fonctionnalités livrées et l'adresse de mise en ligne ({SITE}).",
                "Annexe 2 — Statuts de la SARL Elite Football Academy (à finaliser à la création) et acte notarié d'évaluation de l'apport en nature.",
                "Annexe 3 — Récépissé d'immatriculation au Registre du Commerce et du Crédit Mobilier (à obtenir auprès de l'ANPI Gabon).",
                "Annexe 4 — Contrat de location du terrain d'Akanda et attestation d'assurance responsabilité civile et accidents.",
                "Annexe 5 — Captures d'écran de la plateforme : tableau de bord de la direction, feuille de présence des coachs, passeport du joueur et espace parents.",
                "Annexe 6 — Devis des équipementiers et du fournisseur de textile pour l'équipement sportif et les pochettes de bienvenue.",
                "Annexe 7 — Modèles de documents des familles : fiche d'inscription, autorisation parentale, consentement photos et partage du passeport, règlement intérieur.",
                f"Annexe 8 — Curriculum vitae du gérant {FONDATEUR}, diplômes des deux premiers éducateurs et conventions avec le médecin et le kinésithérapeute partenaires.",
                "Annexe 9 — Hypothèses détaillées du modèle financier (effectifs mois par mois, mix des filières, taux d'impayés, stages, salaires) et tableau de sensibilité."]))
    return B

SOMMAIRE = [
    ("INTRODUCTION", 0), ("DESCRIPTION DE L'ACTIVITÉ", 0),
    ("I.  STRUCTURE INTERNE D'ELITE FOOTBALL ACADEMY", 0),
    ("1.  Présentation de l'entreprise", 1), ("1.1  Raison sociale et statuts", 2), ("1.2  Idée du projet", 2), ("1.3  Vision, missions et valeurs", 2), ("1.4  Statut juridique et organisation", 2),
    ("2.  Organisation et ressources humaines", 1), ("2.1  Organigramme", 2), ("2.2  Répartition des responsabilités", 2), ("2.3  Politique de recrutement et formation", 2), ("2.4  Marché amont (fournisseurs et partenaires)", 2),
    ("3.  Processus opérationnels", 1), ("3.1  Le parcours d'un joueur, de la découverte à l'orientation", 2), ("3.2  Protocoles de sécurité, santé et protection des mineurs", 2), ("3.3  Gestion de l'organisation et relation avec les familles", 2), ("3.4  La plateforme numérique Elite — innovation et apport en nature", 2),
    ("II.  STRUCTURE EXTERNE DE L'ENTREPRISE", 0),
    ("1.  Étude du marché de la formation footballistique des jeunes au Gabon", 1), ("1.1  Besoins et tendances du marché", 2), ("1.2  Acteurs institutionnels et privés", 2), ("1.3  Reconnaissance officielle et partenariats", 2), ("1.4  Mode de prospection et acquisition des familles", 2),
    ("2.  Analyse de la concurrence", 1), ("2.1  Structures concurrentes (directes et indirectes)", 2), ("2.2  Analyse SWOT et PESTEL", 2), ("2.3  Stratégie de différenciation", 2), ("2.4  Comparaison des prix et des modèles", 2),
    ("3.  Stratégie commerciale et marketing", 1), ("3.1  Segmentation", 2), ("3.2  Plan marketing mix (4P)", 2), ("3.3  Politique tarifaire", 2), ("3.4  Expérience des familles et fidélisation", 2),
    ("III.  ANALYSE FINANCIÈRE", 0), ("Hypothèses générales du modèle", 1),
    ("1.  Prévisions économiques et investissements", 1), ("1.1  Capital social et apports", 2), ("1.2  Investissements initiaux détaillés", 2), ("1.3  Prévision de dépenses annuelles sur 3 ans", 2), ("1.4  Plan d'amortissement", 2),
    ("2.  Analyse financière détaillée", 1), ("2.1  Produits et coûts par joueur", 2), ("2.2  Projection des produits sur 3 ans", 2), ("2.3  Compte de résultat prévisionnel sur 3 ans", 2), ("2.4  Plan de trésorerie mensuel sur 12 mois", 2), ("2.5  Seuil de rentabilité et marges", 2), ("2.6  Bilan prévisionnel de fin d'année 1", 2),
    ("CONCLUSION", 0), ("ANNEXES", 0),
]

COUVERTURE = {
    "titre": "BUSINESS PLAN",
    "societe": "Elite Football Academy SARL",
    "sous": "Académie Sport-Études de football — Akanda, Libreville, Gabon",
    "slogan": SLOGAN,
    "fondateur_libelle": "Fondateur et gérant",
    "fondateur": FONDATEUR,
    "capital": f"Capital social : {F(M.CAPITAL)} FCFA ({F(M.CAPITAL_NUM)} FCFA en numéraire + {F(M.CAPITAL_NAT)} FCFA d'apport en nature — plateforme numérique)",
    "forme": "Forme juridique : SARL (OHADA) — Libreville, Gabon",
    "redaction": "Dossier rédigé par Mihindou Hindet Ange",
    "ecole": "École de Commerce de Lyon — Campus Libreville",
    "date": "Octobre 2026",
}

if __name__ == "__main__":
    b = blocs()
    mots = sum(len(x[1].split()) for x in b if x[0] in ("p", "note"))
    mots += sum(len(" ".join(x[1]).split()) for x in b if x[0] == "ul")
    print(len(b), "blocs ;", mots, "mots de texte courant ;", sum(1 for x in b if x[0] == "table"), "tableaux")
