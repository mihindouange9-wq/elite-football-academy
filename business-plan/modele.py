# -*- coding: utf-8 -*-
"""Modèle financier du business plan Elite Football Academy.
Toutes les hypothèses sont ici, chacune avec sa justification ; les tableaux du dossier en découlent
(aucun chiffre saisi à la main ailleurs)."""
from math import ceil

CAPITAL_NUM = 8_528_000          # apport en numéraire (identique à GabHabite : 13 000 €)
CAPITAL_NAT = 7_000_000          # apport en nature : plateforme numérique Elite (site + espaces + passeport)
CAPITAL = CAPITAL_NUM + CAPITAL_NAT
# valeur de l'apport en nature, au coût de développement par un studio local (dire d'expert, annexe 1)
PLATEFORME = [
    ("Site public : direction artistique, ouverture animée, galerie de sept chapitres, détection en ligne, formulaire d'inscription, pages légales", 1_400_000),
    ("Espace direction : tableau de bord, demandes, joueurs et passeports, groupes et planning, détections, cotisations et paiements, rapport mensuel, actualités, comptes, paramètres, journal, sauvegarde (12 vues)", 2_200_000),
    ("Espace coachs : semaine, feuille de présence, évaluations, absences, notation des candidats", 800_000),
    ("Espace parents : résumé, planning et présences, passeport, cotisations, déclaration de paiement et reçus", 1_000_000),
    ("Passeport du joueur, radar de progression, partage sécurisé, règle des tournois, détection avec dossards", 800_000),
    ("Socle technique : base de données persistante, comptes et rôles, sécurité, journal, export et restauration, tests automatisés, mise en ligne, documentation", 800_000),
]
assert sum(v for _, v in PLATEFORME) == CAPITAL_NAT

# ---------- tarifs et volumes ----------
TARIF = {1: {"SE": 50_000, "LO": 25_000}, 2: {"SE": 50_000, "LO": 25_000}, 3: {"SE": 55_000, "LO": 27_500}}
MOIS_COTISES = 10                # cotisations dues de septembre à juin ; juillet et août = stages
FRAIS_INSCRIPTION = 30_000       # une fois, à l'entrée
POCHETTE = [("Maillot d'entraînement floqué", 6_000), ("Ballon taille 4 ou 5", 8_000), ("Sac de sport", 5_000)]
COUT_POCHETTE = sum(v for _, v in POCHETTE)          # 19 000
LICENCE_DOSSIER = FRAIS_INSCRIPTION - COUT_POCHETTE  # 11 000 : licence, frais de dossier
PRIX_STAGE = 25_000              # par enfant et par stage de vacances (5 demi-journées)
STAGE_COUT = [("Éducateur vacataire supplémentaire (5 demi-journées, 20 000 FCFA, pour 10 enfants)", 2_000), ("Collation et eau (5 jours × 800 FCFA)", 4_000), ("Transport et matériel du stage", 2_000)]
COUT_STAGE_ENFANT = sum(v for _, v in STAGE_COUT)    # 8 000
PART_SE = {1: .36, 2: .40, 3: .42}                   # part de l'effectif en filière Sport-Études
TAUX_IMPAYES = {1: .06, 2: .05, 3: .04}
TAUX_IS = .30
TAUX_SOCIAL = .22
CAPACITE = {1: 80, 2: 80, 3: 120}                     # année 3 : second créneau
MOIS = ["Sept.", "Oct.", "Nov.", "Déc.", "Janv.", "Févr.", "Mars", "Avr.", "Mai", "Juin", "Juil.", "Août"]
EFFECTIF = {
    1: [36, 42, 48, 54, 58, 62, 66, 70, 72, 72, 0, 0],
    2: [70, 74, 78, 80, 80, 80, 80, 80, 80, 80, 0, 0],
    3: [88, 94, 100, 106, 110, 114, 116, 118, 120, 120, 0, 0],
}
NOUVEAUX_MENSUELS = {1: [36, 6, 6, 6, 4, 4, 4, 4, 2, 0, 0, 0]}
# renouvellement : départs en fin de saison (18 ans, déménagements), nouveaux de septembre, croissance, remplacements en cours de saison
RENOUVELLEMENT = {2: {"fin_prec": 72, "departs": 14, "sept": 12, "croissance": 10, "remplacements": 8},
                  3: {"fin_prec": 80, "departs": 16, "sept": 24, "croissance": 32, "remplacements": 0}}
NOUVEAUX = {1: sum(NOUVEAUX_MENSUELS[1]), 2: 30, 3: 56}
for a_, r_ in RENOUVELLEMENT.items():
    assert r_["fin_prec"] - r_["departs"] + r_["sept"] == EFFECTIF[a_][0] and r_["sept"] + r_["croissance"] + r_["remplacements"] == NOUVEAUX[a_]
STAGES = {1: [("Toussaint", 2, 36), ("Pâques", 7, 46), ("Été", 10, 54)],
          2: [("Toussaint", 2, 50), ("Pâques", 7, 58), ("Été", 10, 66)],
          3: [("Toussaint", 2, 72), ("Pâques", 7, 84), ("Été", 10, 96)]}   # (nom, index du mois, enfants)
PARTENARIATS = {1: 0, 2: 1_500_000, 3: 3_000_000}
STOCK_POCHETTES = 40

# ---------- investissements initiaux (numéraire) : désignation, quantité, prix unitaire, justification ----------
INVEST = [
    ("A", "Équipement sportif et pédagogique", [
        ("Buts mobiles 5 × 2 m en aluminium avec filets (paire)", 1, 480_000, "Format école de foot et U13 ; prix moyen relevé chez les équipementiers de Libreville, devis en annexe 6"),
        ("Ballons d'entraînement tailles 4 et 5 (lot de 30)", 30, 8_000, "Un ballon pour deux joueurs à l'entraînement (capacité 80, deux créneaux) ; ballon d'entraînement courant"),
        ("Chasubles réversibles (lot de 60)", 60, 3_000, "Deux couleurs par chasuble pour les oppositions ; 60 pour deux groupes simultanés"),
        ("Cônes, plots, coupelles, piquets de slalom (lot complet)", 1, 60_000, "Lot standard de 100 coupelles, 20 cônes, 10 piquets"),
        ("Échelles de rythme et haies de coordination (lot)", 1, 90_000, "Deux échelles et dix haies basses pour les ateliers de motricité"),
        ("Mannequins de défense mobiles", 4, 25_000, "Quatre mannequins pour les ateliers de frappe et de coups de pied arrêtés"),
        ("Sacs à ballons, pompes, chronomètres, sifflets, tableau tactique", 1, 70_000, "Petit matériel des deux éducateurs"),
    ]),
    ("B", "Pochettes de bienvenue (stock de démarrage, 40 kits)", [
        ("Maillot d'entraînement floqué Elite Football Academy", 40, 6_000, "Maillot technique floqué, prix fournisseur textile pour 40 pièces"),
        ("Ballon taille 4 ou 5 remis au joueur", 40, 8_000, "Même ballon que le poste A, remis à chaque joueur"),
        ("Sac de sport aux couleurs de l'académie", 40, 5_000, "Sac à dos sérigraphié, prix fournisseur pour 40 pièces"),
    ]),
    ("C", "Santé et sécurité", [
        ("Trousses de premiers secours terrain, glacières et bidons d'eau", 2, 55_000, "Une trousse complète par créneau, avec glacière et dix bidons"),
        ("Kit d'urgence (attelles, poches de froid, couvertures de survie)", 1, 120_000, "Matériel conseillé par le médecin partenaire pour un terrain sans infirmerie"),
        ("Protection des mineurs : dossier d'autorisations, affichage, formation des éducateurs", 1, 100_000, "Impression des dossiers familles, affichage du protocole, deux journées de formation"),
        ("Tenues d'éducateurs (survêtements, sifflets, brassards)", 3, 90_000, "Une tenue complète par éducateur et pour le gérant"),
    ]),
    ("D", "Terrain et installation", [
        ("Caution de location du terrain d'Akanda (2 mois)", 1, 600_000, "Deux mois de loyer (300 000 FCFA par mois) ; restituée en fin de bail, reste à l'actif"),
        ("Aménagement léger : banc de touche, abri, tableau d'affichage, rangement du matériel", 1, 250_000, "Menuiserie et serrurerie locales ; abri de 3 × 2 m et coffre à matériel"),
        ("Marquage des zones d'ateliers et petits buts d'école de foot", 1, 80_000, "Peinture de marquage et quatre petits buts 3 × 1,5 m"),
    ]),
    ("E", "Bureau, informatique et téléphonie", [
        ("Ordinateur portable de gérance (plateforme, comptabilité, bureautique)", 1, 350_000, "Portable de milieu de gamme, prix des revendeurs de Libreville"),
        ("Tablette de terrain pour les coachs (présences, évaluations)", 1, 120_000, "Tablette Android 10 pouces avec coque renforcée"),
        ("Imprimante multifonction (reçus, passeports, convocations)", 1, 60_000, "Jet d'encre A4 avec scanner"),
        ("Mobilier de bureau et smartphone de gérance", 1, 100_000, "Bureau, deux chaises, armoire et téléphone professionnel"),
    ]),
    ("F", "Frais d'établissement et juridiques", [
        ("Frais de création SARL via ANPI Gabon", 1, 150_000, "Barème du guichet unique ANPI pour une SARL"),
        ("Frais de notaire et rédaction des statuts (incluant l'apport en nature)", 1, 145_000, "Honoraires notariés avec acte d'évaluation de l'apport en nature"),
        ("Immatriculation RCCM et obtention du NIF", 1, 75_000, "Frais de greffe et de déclaration fiscale"),
        ("Affiliation CNSS et CNAMGS employeur", 1, 45_000, "Frais d'ouverture des comptes employeur"),
        ("Ouverture du compte bancaire professionnel, tampons, papeterie", 1, 55_000, "Frais de dossier bancaire, cachets, premiers reçus imprimés"),
        ("Provision pour affiliation sportive et licences de la saison 1", 1, 250_000, "Affiliation de l'académie et licences des 72 joueurs de la saison, selon le barème en vigueur"),
    ]),
    ("G", "Lancement et communication", [
        ("Journée de détection gratuite de lancement (dossards, eau, collation, éducateurs vacataires)", 1, 250_000, "100 dossards, eau et collation pour 100 jeunes, deux éducateurs vacataires, sonorisation"),
        ("Affiches, banderoles, flyers dans les écoles et quartiers d'Akanda", 1, 118_000, "Deux banderoles, 50 affiches A2, 2 000 flyers"),
        ("Nom de domaine, hébergement de la plateforme et disque persistant (12 mois)", 1, 110_000, "Nom de domaine, serveur et disque de sauvegarde pour la première saison"),
        ("Photos et vidéo de la première saison (communication authentique)", 1, 40_000, "Une demi-journée de prise de vues sur le terrain"),
    ]),
]
INV_SOUS_TOTAUX = {code: sum(q * pu for _, q, pu, _ in l) for code, _, l in INVEST}
INV_TOTAL = sum(INV_SOUS_TOTAUX.values())
RESERVE = CAPITAL_NUM - INV_TOTAL
DEMARRAGE_POSTES = ("C", "F", "G")   # dépensés en année 1, comptabilisés en charges non récurrentes

# ---------- masse salariale : poste → année → (effectif, salaire mensuel brut, mois) ----------
SALAIRES = [
    ("Gérant (Thomas Serge Lanchais)", {1: (1, 150_000, 12), 2: (1, 200_000, 12), 3: (1, 250_000, 12)}, "Rémunération volontairement modeste au démarrage, revalorisée avec les résultats"),
    ("Éducateurs diplômés", {1: (2, 150_000, 12), 2: (3, 150_000, 12), 3: (4, 150_000, 12)}, "Un éducateur pour deux groupes d'âge ; salaire de référence d'un entraîneur diplômé à Libreville, 12 mois pour fidéliser"),
    ("Responsable administratif et suivi scolaire (temps partiel)", {1: (1, 100_000, 12), 2: (1, 120_000, 12), 3: (1, 150_000, 12)}, "Mi-temps en année 1, temps renforcé avec l'effectif"),
]
def masse_salariale(annee):
    return sum(n * m * k for _, par_an, _ in SALAIRES for n, m, k in [par_an[annee]])

# ---------- charges d'exploitation : nom, {année: montant}, base de calcul ----------
def charges(annee):
    a = annee
    sal = {k: masse_salariale(k) for k in (1, 2, 3)}
    rows = [
        ("CHARGES DE PERSONNEL", None, None),
        ("Salaires bruts (gérant, éducateurs, responsable administratif)", sal, "Détail dans le tableau de la masse salariale : effectif × salaire mensuel × 12 mois"),
        ("Charges sociales CNSS et CNAMGS", {k: round(sal[k] * TAUX_SOCIAL) for k in sal}, "22 % des salaires bruts (cotisations employeur CNSS et CNAMGS), taux à confirmer par le comptable"),
        ("Répétiteur scolaire vacataire (filière Sport-Études)", {1: 1_000_000, 2: 1_200_000, 3: 1_800_000}, "A1 : 100 000 FCFA × 10 mois (deux séances par semaine) ; A2 : 120 000 × 10 ; A3 : deux répétiteurs, 180 000 × 10"),
        ("Médecin et kinésithérapeute partenaires", {1: 600_000, 2: 660_000, 3: 840_000}, "Forfait mensuel : 50 000 FCFA × 12 ; 55 000 × 12 ; 70 000 × 12 (présence aux tournois et visites)"),
        ("CHARGES FIXES STRUCTURELLES", None, None),
        ("Location du terrain et des vestiaires (Akanda)", {1: 3_600_000, 2: 3_780_000, 3: 6_600_000}, "300 000 FCFA × 12 mois ; +5 % en A2 (315 000 × 12) ; A3 : second créneau, 550 000 × 12"),
        ("Assurance responsabilité civile et accidents des joueurs", {1: 480_000, 2: 520_000, 3: 720_000}, "RC professionnelle 180 000 + assurance accidents 3 750 FCFA par joueur (80 joueurs en A1-A2, 120 en A3, +arrondi)"),
        ("Eau, électricité, entretien du terrain", {1: 480_000, 2: 520_000, 3: 780_000}, "40 000 FCFA par mois (arrosage, éclairage, tonte) ; 43 000 ; 65 000 avec le second créneau"),
        ("Internet, téléphonie et WhatsApp professionnel", {1: 360_000, 2: 380_000, 3: 420_000}, "30 000 FCFA par mois (deux lignes et une connexion), puis 32 000 et 35 000"),
        ("Hébergement et sauvegarde de la plateforme numérique", {1: 180_000, 2: 200_000, 3: 240_000}, "15 000 FCFA par mois (serveur, disque persistant, domaine) ; 17 000 ; 20 000"),
        ("CHARGES VARIABLES LIÉES À L'ACTIVITÉ", None, None),
        ("Matériel consommable et renouvellement (ballons, chasubles, plots)", {1: 600_000, 2: 720_000, 3: 1_000_000}, "50 000 FCFA par mois : remplacement des ballons et plots usés ; 60 000 ; 83 000 avec 120 joueurs"),
        ("Transport des matchs, tournois et détections (location ponctuelle de minibus)", {1: 720_000, 2: 900_000, 3: 1_300_000}, "Deux locations de minibus par mois à 30 000 FCFA (720 000) ; 2,5 par mois ; 3,6 par mois"),
        ("Communication récurrente (réseaux, affichage, événements)", {1: 600_000, 2: 720_000, 3: 960_000}, "50 000 FCFA par mois : affichage de rentrée, impressions, publicité ciblée ; 60 000 ; 80 000"),
        ("AUTRES CHARGES D'EXPLOITATION", None, None),
        ("Honoraires du comptable indépendant (DSF, bilan SYSCOHADA)", {1: 150_000, 2: 250_000, 3: 300_000}, "Forfait annuel d'un comptable agréé : première DSF simple, puis bilan complet"),
        ("Formation continue des éducateurs, frais bancaires, divers", {1: 300_000, 2: 400_000, 3: 520_000}, "25 000 FCFA par mois : diplômes fédéraux, secourisme, frais de tenue de compte, imprévus"),
    ]
    return [(n, (v[a] if v else None), base) for n, v, base in rows]

# ---------- amortissements ----------
AMORT_BIENS = [
    ("Équipement sportif et pédagogique (poste A)", lambda: INV_SOUS_TOTAUX["A"], 3, "Buts, ballons, matériel : usage intensif, remplacement en trois saisons"),
    ("Aménagement du terrain hors caution (poste D)", lambda: INV_SOUS_TOTAUX["D"] - 600_000, 5, "Abri, banc, coffre, marquage : durée du bail renouvelé"),
    ("Bureau, informatique et téléphonie (poste E)", lambda: INV_SOUS_TOTAUX["E"], 3, "Durée d'usage courante du matériel informatique"),
    ("Plateforme numérique Elite (apport en nature, immobilisation incorporelle)", lambda: CAPITAL_NAT, 5, "Logiciel développé : cinq ans, durée usuelle des immobilisations incorporelles"),
]
def amortissements():
    out = []
    for nom, val_f, duree, why in AMORT_BIENS:
        val = val_f(); dot = round(val / duree)
        c = lambda k: min(val, dot * k)
        out.append({"nom": nom, "valeur": val, "duree": duree, "dotation": dot, "c1": c(1), "c2": c(2), "c3": c(3), "vnc3": val - c(3), "why": why})
    return out
def total_dotation():
    return sum(b["dotation"] for b in amortissements())

# ---------- produits ----------
def produits(annee):
    a = annee
    eff = EFFECTIF[a]
    se = [round(e * PART_SE[a]) for e in eff]
    lo = [e - s for e, s in zip(eff, se)]
    cot_se = sum(s * TARIF[a]["SE"] for s in se)
    cot_lo = sum(l * TARIF[a]["LO"] for l in lo)
    cot_brut = cot_se + cot_lo
    impayes = round(cot_brut * TAUX_IMPAYES[a])
    insc = NOUVEAUX[a] * FRAIS_INSCRIPTION
    stages = sum(n * PRIX_STAGE for _, _, n in STAGES[a])
    part = PARTENARIATS[a]
    total = cot_brut - impayes + insc + stages + part
    return {"eff": eff, "se": se, "lo": lo, "cot_se": cot_se, "cot_lo": cot_lo, "cot_brut": cot_brut, "impayes": impayes,
            "inscriptions": insc, "stages": stages, "partenariats": part, "total": total,
            "eff_moyen": round(sum(e for e in eff if e) / MOIS_COTISES, 1), "eff_max": max(eff),
            "mois_joueurs": sum(eff), "mois_se": sum(se), "mois_lo": sum(lo), "stagiaires": sum(n for _, _, n in STAGES[a])}

def couts_variables(annee):
    a = annee
    pochettes = NOUVEAUX[a] * COUT_POCHETTE
    stages = sum(n * COUT_STAGE_ENFANT for _, _, n in STAGES[a])
    return {"pochettes": pochettes, "stages": stages, "total": pochettes + stages}

def charges_demarrage():
    return sum(INV_SOUS_TOTAUX[c] for c in DEMARRAGE_POSTES)

def compte_resultat(annee):
    p = produits(annee); cv = couts_variables(annee)
    ch = [(n, v) for n, v, _ in charges(annee) if v is not None]
    total_ch = sum(v for _, v in ch)
    dot = total_dotation()
    demarrage = charges_demarrage() if annee == 1 else 0
    marge = p["total"] - cv["total"]
    ebe = marge - total_ch - demarrage
    rai = ebe - dot
    impot = round(max(rai, 0) * TAUX_IS)
    net = rai - impot
    return {"produits": p, "cv": cv, "charges": ch, "total_charges": total_ch, "demarrage": demarrage, "dotation": dot, "marge": marge, "ebe": ebe, "ebe_courant": marge - total_ch, "rai": rai, "impot": impot, "net": net}

# ---------- trésorerie mensuelle année 1, par catégorie ----------
def tresorerie():
    a = 1
    p = produits(a)
    ch = {n: v for n, v, _ in charges(a) if v is not None}
    nom = lambda deb: next(k for k in ch if k.startswith(deb))
    salaires = (ch[nom("Salaires")] + ch[nom("Charges sociales")]) / 12
    loyer = ch[nom("Location")] / 12
    medecin = ch[nom("Médecin")] / 12
    repetiteur = ch[nom("Répétiteur")] / MOIS_COTISES
    assurance = ch[nom("Assurance")]
    comptable = ch[nom("Honoraires")]
    fonctionnement = sum(v for k, v in ch.items() if k.startswith(("Eau", "Internet", "Hébergement", "Matériel", "Transport", "Communication", "Formation"))) / 12
    nm = NOUVEAUX_MENSUELS[a]
    lignes = []; solde = RESERVE
    for m in range(12):
        enc_cot = round((p["se"][m] * TARIF[a]["SE"] + p["lo"][m] * TARIF[a]["LO"]) * (1 - TAUX_IMPAYES[a]))
        enc_insc = nm[m] * FRAIS_INSCRIPTION
        enc_stage = sum(n * PRIX_STAGE for _, im, n in STAGES[a] if im == m)
        deja = sum(nm[:m]); hors_stock = max(0, nm[m] - max(0, STOCK_POCHETTES - deja))
        d = {"salaires": round(salaires), "loyer": round(loyer), "repetiteur": round(repetiteur) if m < MOIS_COTISES else 0, "medecin": round(medecin),
             "assurance": round(assurance / 4) if m % 3 == 0 else 0, "fonctionnement": round(fonctionnement),
             "pochettes": hors_stock * COUT_POCHETTE, "stages": sum(n * COUT_STAGE_ENFANT for _, im, n in STAGES[a] if im == m),
             "comptable": comptable if m == 11 else 0}
        enc = enc_cot + enc_insc + enc_stage; dec = sum(d.values())
        solde += enc - dec
        lignes.append({"mois": MOIS[m], "effectif": p["eff"][m], "nouveaux": nm[m], "enc_cot": enc_cot, "enc_insc": enc_insc, "enc_stage": enc_stage, "enc": enc, "dec": dec, "flux": enc - dec, "solde": solde, **d})
    return {"reserve": RESERVE, "invest_total": INV_TOTAL, "lignes": lignes, "min": min(l["solde"] for l in lignes), "fin": lignes[-1]["solde"],
            "mensuel": {"salaires": round(salaires), "loyer": round(loyer), "repetiteur": round(repetiteur), "medecin": round(medecin), "assurance_trim": round(assurance / 4), "fonctionnement": round(fonctionnement), "comptable": comptable}}

def seuil(annee=1):
    cr = compte_resultat(annee)
    fixes = cr["total_charges"] + cr["dotation"]
    tarif_moyen = PART_SE[annee] * TARIF[annee]["SE"] + (1 - PART_SE[annee]) * TARIF[annee]["LO"]
    cot_nette = tarif_moyen * MOIS_COTISES * (1 - TAUX_IMPAYES[annee])
    p = produits(annee); cv = couts_variables(annee)
    annexe = (p["inscriptions"] + p["stages"] - cv["total"]) / p["eff_moyen"]
    contrib = cot_nette + annexe
    n = ceil(fixes / contrib)
    return {"fixes": fixes, "tarif_moyen": round(tarif_moyen), "cot_nette": round(cot_nette), "annexe": round(annexe), "contrib": round(contrib), "joueurs": n, "ca_seuil": round(n * contrib), "eff_moyen": p["eff_moyen"], "marge_securite": round(p["eff_moyen"] - n, 1)}

def sensibilite(annee=1):
    sv = seuil(annee); p = produits(annee); cr = compte_resultat(annee); out = []
    for f in (0.70, 0.85, 1.00, 1.10):
        eff = round(p["eff_moyen"] * f, 1)
        rai = round(cr["rai"] + (eff - p["eff_moyen"]) * sv["contrib"])
        out.append({"facteur": f, "eff": eff, "rai": rai})
    return out

def bilan_fin_a1():
    cr = compte_resultat(1); tr = tresorerie(); am = amortissements()
    immo = [(b["nom"], b["valeur"] - b["c1"]) for b in am]
    caution = 600_000
    creances = round(produits(1)["cot_brut"] * TAUX_IMPAYES[1] * .5)
    tresor = tr["fin"]
    actif = sum(v for _, v in immo) + caution + creances + tresor
    capital = CAPITAL; resultat = cr["net"]
    dettes_sociales = round(sum(v for n, v in cr["charges"] if "sociales" in n) / 12)
    fournisseurs = 200_000
    impot = cr["impot"]
    ecart = actif - (capital + resultat + dettes_sociales + fournisseurs + impot)
    return {"immo": immo, "caution": caution, "creances": creances, "tresor": tresor, "actif": actif, "capital": capital, "resultat": resultat, "dettes_sociales": dettes_sociales, "fournisseurs": fournisseurs, "impot": impot, "ecart": ecart}

def fcfa(n):
    s = f"{abs(int(round(n))):,}".replace(",", " ")
    return ("-" if n < 0 else "") + s

if __name__ == "__main__":
    print("investissements", fcfa(INV_TOTAL), "réserve", fcfa(RESERVE))
    for a in (1, 2, 3):
        cr = compte_resultat(a); p = cr["produits"]
        print(f"A{a} eff moyen {p['eff_moyen']} produits {fcfa(p['total'])} marge {fcfa(cr['marge'])} charges {fcfa(cr['total_charges'])} EBE {fcfa(cr['ebe'])} RAI {fcfa(cr['rai'])} net {fcfa(cr['net'])}")
    tr = tresorerie(); print("tréso min", fcfa(tr["min"]), "fin", fcfa(tr["fin"]), tr["mensuel"])
    print("seuil", seuil(1)); b = bilan_fin_a1(); print("bilan actif", fcfa(b["actif"]), "écart", fcfa(b["ecart"]))
