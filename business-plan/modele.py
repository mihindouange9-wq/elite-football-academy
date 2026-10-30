# -*- coding: utf-8 -*-
"""Modèle financier du business plan Elite Football Academy.
Toutes les hypothèses sont ici ; les tableaux du dossier en découlent (aucun chiffre saisi à la main ailleurs)."""
from math import ceil

CAPITAL_NUM = 8_528_000          # apport en numéraire (identique à GabHabite)
CAPITAL_NAT = 7_000_000          # apport en nature : plateforme numérique Elite (site + espaces + passeport)
CAPITAL = CAPITAL_NUM + CAPITAL_NAT

# ---------- tarifs et volumes ----------
TARIF = {1: {"SE": 50_000, "LO": 25_000}, 2: {"SE": 50_000, "LO": 25_000}, 3: {"SE": 55_000, "LO": 27_500}}
FRAIS_INSCRIPTION = 30_000       # une fois, à l'entrée : pochette de bienvenue (19 000) + licence et assurance individuelle
COUT_POCHETTE = 19_000           # maillot 6 000 + ballon 8 000 + sac 5 000
PRIX_STAGE = 25_000              # par enfant et par stage de vacances (5 jours)
COUT_STAGE_ENFANT = 8_000        # encadrement vacataire, collation, eau, transport
PART_SE = {1: .36, 2: .40, 3: .42}
TAUX_IMPAYES = {1: .06, 2: .05, 3: .04}
CAPACITE = {1: 80, 2: 80, 3: 120}   # année 3 : second créneau / second terrain
MOIS = ["Sept.", "Oct.", "Nov.", "Déc.", "Janv.", "Févr.", "Mars", "Avr.", "Mai", "Juin", "Juil.", "Août"]
# effectif payant mois par mois (cotisations dues de septembre à juin : 10 mois ; juillet-août = stages)
EFFECTIF = {
    1: [36, 42, 48, 54, 58, 62, 66, 70, 72, 72, 0, 0],
    2: [70, 74, 78, 80, 80, 80, 80, 80, 80, 80, 0, 0],
    3: [88, 94, 100, 106, 110, 114, 116, 118, 120, 120, 0, 0],
}
NOUVEAUX = {1: 72, 2: 30, 3: 56}          # nouveaux inscrits (pochette + frais d'inscription)
STAGES = {1: [("Toussaint", 2, 36), ("Pâques", 7, 46), ("Été", 10, 54)],
          2: [("Toussaint", 2, 50), ("Pâques", 7, 58), ("Été", 10, 66)],
          3: [("Toussaint", 2, 72), ("Pâques", 7, 84), ("Été", 10, 96)]}   # (nom, index mois, enfants)
PARTENARIATS = {1: 0, 2: 1_500_000, 3: 3_000_000}   # sponsoring local : rien en année 1 (prudence)

# ---------- investissements initiaux (numéraire) ----------
INVEST = [
    ("A", "Équipement sportif et pédagogique", [
        ("Buts mobiles 5 × 2 m en aluminium avec filets (paire)", 1, 480_000),
        ("Ballons d'entraînement tailles 4 et 5 (lot de 30)", 30, 8_000),
        ("Chasubles réversibles (lot de 60)", 60, 3_000),
        ("Cônes, plots, coupelles, piquets de slalom (lot complet)", 1, 60_000),
        ("Échelles de rythme et haies de coordination (lot)", 1, 90_000),
        ("Mannequins de défense mobiles", 4, 25_000),
        ("Sacs à ballons, pompes, chronomètres, sifflets, tableau tactique", 1, 70_000),
    ]),
    ("B", "Pochettes de bienvenue (stock de démarrage, 40 kits)", [
        ("Maillot d'entraînement floqué Elite Football Academy", 40, 6_000),
        ("Ballon taille 4 ou 5 remis au joueur", 40, 8_000),
        ("Sac de sport aux couleurs de l'académie", 40, 5_000),
    ]),
    ("C", "Santé et sécurité", [
        ("Trousses de premiers secours terrain, glacières et bidons d'eau", 2, 55_000),
        ("Kit d'urgence (attelles, poches de froid, couvertures de survie)", 1, 120_000),
        ("Protection des mineurs : dossier d'autorisations, affichage, formation des éducateurs", 1, 100_000),
        ("Tenues d'éducateurs (survêtements, sifflets, brassards)", 3, 90_000),
    ]),
    ("D", "Terrain et installation", [
        ("Caution de location du terrain d'Akanda (2 mois)", 1, 600_000),
        ("Aménagement léger : banc de touche, abri, tableau d'affichage, rangement du matériel", 1, 250_000),
        ("Marquage des zones d'ateliers et petits buts d'école de foot", 1, 80_000),
    ]),
    ("E", "Bureau, informatique et téléphonie", [
        ("Ordinateur portable de gérance (plateforme, comptabilité, bureautique)", 1, 350_000),
        ("Tablette de terrain pour les coachs (présences, évaluations)", 1, 120_000),
        ("Imprimante multifonction (reçus, passeports, convocations)", 1, 60_000),
        ("Mobilier de bureau et smartphone de gérance", 1, 100_000),
    ]),
    ("F", "Frais d'établissement et juridiques", [
        ("Frais de création SARL via ANPI Gabon", 1, 150_000),
        ("Frais de notaire et rédaction des statuts (incluant l'apport en nature)", 1, 145_000),
        ("Immatriculation RCCM et obtention du NIF", 1, 75_000),
        ("Affiliation CNSS et CNAMGS employeur", 1, 45_000),
        ("Ouverture du compte bancaire professionnel, tampons, papeterie", 1, 55_000),
        ("Provision pour affiliation sportive et licences de la saison 1", 1, 250_000),
    ]),
    ("G", "Lancement et communication", [
        ("Journée de détection gratuite de lancement (dossards, eau, collation, éducateurs vacataires)", 1, 250_000),
        ("Affiches, banderoles, flyers dans les écoles et quartiers d'Akanda", 1, 118_000),
        ("Nom de domaine, hébergement de la plateforme et disque persistant (12 mois)", 1, 110_000),
        ("Photos et vidéo de la première saison (communication authentique)", 1, 40_000),
    ]),
]

# ---------- charges d'exploitation annuelles ----------
def charges(annee):
    a = annee
    loyer = {1: 3_600_000, 2: 3_780_000, 3: 6_600_000}[a]            # 300 000/mois ; A3 : second créneau/terrain
    sal_gerant = {1: 1_800_000, 2: 2_400_000, 3: 3_000_000}[a]      # 150 000 → 200 000 → 250 000 / mois : le fondateur se rémunère modestement au démarrage
    sal_educ = {1: 3_600_000, 2: 5_400_000, 3: 7_200_000}[a]        # 2 éducateurs à 150 000 → 3 → 4
    sal_admin = {1: 1_200_000, 2: 1_440_000, 3: 1_800_000}[a]       # responsable administratif et suivi scolaire, temps partiel
    salaires = sal_gerant + sal_educ + sal_admin
    social = round(salaires * .22)
    rows = [
        ("CHARGES DE PERSONNEL", None),
        ("Salaire du gérant (Thomas Serge Lanchais)", sal_gerant),
        ("Salaires des éducateurs diplômés (2 en A1, 3 en A2, 4 en A3)", sal_educ),
        ("Responsable administratif et suivi scolaire (temps partiel)", sal_admin),
        ("Charges sociales CNSS et CNAMGS (environ 22 %)", social),
        ("Répétiteur scolaire vacataire pour la filière Sport-Études (10 mois)", {1: 1_000_000, 2: 1_200_000, 3: 1_800_000}[a]),
        ("Médecin et kinésithérapeute partenaires (forfait mensuel)", {1: 600_000, 2: 660_000, 3: 840_000}[a]),
        ("CHARGES FIXES STRUCTURELLES", None),
        ("Location du terrain et des vestiaires (Akanda)", loyer),
        ("Assurance responsabilité civile et accidents des joueurs", {1: 480_000, 2: 520_000, 3: 720_000}[a]),
        ("Eau, électricité, entretien du terrain", {1: 480_000, 2: 520_000, 3: 780_000}[a]),
        ("Internet, téléphonie et WhatsApp professionnel", {1: 360_000, 2: 380_000, 3: 420_000}[a]),
        ("Hébergement et sauvegarde de la plateforme numérique", {1: 180_000, 2: 200_000, 3: 240_000}[a]),
        ("CHARGES VARIABLES LIÉES À L'ACTIVITÉ", None),
        ("Matériel consommable et renouvellement (ballons, chasubles, plots)", {1: 600_000, 2: 720_000, 3: 1_000_000}[a]),
        ("Transport des matchs, tournois et détections (location ponctuelle de minibus)", {1: 720_000, 2: 900_000, 3: 1_300_000}[a]),
        ("Communication récurrente (réseaux, affichage, événements)", {1: 600_000, 2: 720_000, 3: 960_000}[a]),
        ("AUTRES CHARGES D'EXPLOITATION", None),
        ("Honoraires du comptable indépendant (DSF, bilan SYSCOHADA)", {1: 150_000, 2: 250_000, 3: 300_000}[a]),
        ("Formation continue des éducateurs, frais bancaires, divers", {1: 300_000, 2: 400_000, 3: 520_000}[a]),
    ]
    return rows

# ---------- amortissements ----------
def amortissements():
    inv = {code: sum(q * pu for _, q, pu in lignes) for code, _, lignes in INVEST}
    biens = [
        ("Équipement sportif et pédagogique (poste A)", inv["A"], 3),
        ("Aménagement du terrain hors caution (poste D)", inv["D"] - 600_000, 5),
        ("Bureau, informatique et téléphonie (poste E)", inv["E"], 3),
        ("Plateforme numérique Elite (apport en nature, immobilisation incorporelle)", CAPITAL_NAT, 5),
    ]
    out = []
    for nom, val, duree in biens:
        dot = round(val / duree)
        c = lambda k: min(val, dot * k)          # le cumul ne dépasse jamais la valeur d'origine (arrondis)
        out.append({"nom": nom, "valeur": val, "duree": duree, "dotation": dot, "c1": c(1), "c2": c(2), "c3": c(3), "vnc3": val - c(3)})
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
            "eff_moyen": round(sum(e for e in eff if e) / 10, 1), "eff_max": max(eff)}

def couts_variables(annee):
    a = annee
    pochettes = NOUVEAUX[a] * COUT_POCHETTE
    stages = sum(n * COUT_STAGE_ENFANT for _, _, n in STAGES[a])
    return {"pochettes": pochettes, "stages": stages, "total": pochettes + stages}

def charges_demarrage():
    """Postes C, F et G des investissements initiaux : dépensés en année 1, ce sont des charges non récurrentes, pas des actifs."""
    return sum(sum(q * pu for _, q, pu in l) for code, _, l in INVEST if code in ("C", "F", "G"))

def compte_resultat(annee):
    p = produits(annee); cv = couts_variables(annee)
    ch = [(n, v) for n, v in charges(annee) if v is not None]
    total_ch = sum(v for _, v in ch)
    dot = total_dotation()
    demarrage = charges_demarrage() if annee == 1 else 0
    marge = p["total"] - cv["total"]
    ebe = marge - total_ch - demarrage
    rai = ebe - dot
    impot = round(max(rai, 0) * .30)
    net = rai - impot
    return {"produits": p, "cv": cv, "charges": ch, "total_charges": total_ch, "demarrage": demarrage, "dotation": dot, "marge": marge, "ebe": ebe, "ebe_courant": marge - total_ch, "rai": rai, "impot": impot, "net": net}

# ---------- trésorerie mensuelle année 1 ----------
def tresorerie():
    a = 1
    p = produits(a)
    inv_total = sum(sum(q * pu for _, q, pu in l) for _, _, l in INVEST)
    reserve = CAPITAL_NUM - inv_total
    ch = dict((n, v) for n, v in charges(a) if v is not None)
    mensuel_fixe = sum(v for n, v in ch.items() if n not in ("Répétiteur scolaire vacataire pour la filière Sport-Études (10 mois)", "Honoraires du comptable indépendant (DSF, bilan SYSCOHADA)", "Assurance responsabilité civile et accidents des joueurs")) / 12
    repetiteur = ch["Répétiteur scolaire vacataire pour la filière Sport-Études (10 mois)"] / 10
    nouveaux_mensuels = [36, 6, 6, 6, 4, 4, 4, 4, 2, 0, 0, 0]
    lignes = []
    solde = reserve
    for m in range(12):
        enc_cot = round((p["se"][m] * TARIF[a]["SE"] + p["lo"][m] * TARIF[a]["LO"]) * (1 - TAUX_IMPAYES[a]))
        enc_insc = nouveaux_mensuels[m] * FRAIS_INSCRIPTION
        enc_stage = sum(n * PRIX_STAGE for _, im, n in STAGES[a] if im == m)
        enc = enc_cot + enc_insc + enc_stage
        dec_fixe = round(mensuel_fixe) + (round(repetiteur) if m < 10 else 0)
        deja = sum(nouveaux_mensuels[:m]); hors_stock = max(0, nouveaux_mensuels[m] - max(0, 40 - deja))   # les 40 premiers kits viennent du stock de démarrage
        dec_var = hors_stock * COUT_POCHETTE + sum(n * COUT_STAGE_ENFANT for _, im, n in STAGES[a] if im == m)
        dec_ponct = (ch["Assurance responsabilité civile et accidents des joueurs"] / 4 if m % 3 == 0 else 0) + (ch["Honoraires du comptable indépendant (DSF, bilan SYSCOHADA)"] if m == 11 else 0)
        dec = dec_fixe + dec_var + dec_ponct
        solde += enc - dec
        lignes.append({"mois": MOIS[m], "effectif": p["eff"][m], "enc_cot": enc_cot, "enc_insc": enc_insc, "enc_stage": enc_stage, "enc": enc, "dec_fixe": dec_fixe + dec_ponct, "dec_var": dec_var, "dec": dec, "flux": enc - dec, "solde": solde})
    return {"reserve": reserve, "invest_total": inv_total, "lignes": lignes, "min": min(l["solde"] for l in lignes), "fin": lignes[-1]["solde"]}

def seuil(annee=1):
    cr = compte_resultat(annee)
    fixes = cr["total_charges"] + cr["dotation"]
    tarif_moyen = PART_SE[annee] * TARIF[annee]["SE"] + (1 - PART_SE[annee]) * TARIF[annee]["LO"]
    marge_joueur_an = tarif_moyen * 10 * (1 - TAUX_IMPAYES[annee])   # cotisation nette par joueur et par an
    # produits annexes par joueur (inscription, stages) nets de leurs coûts
    p = produits(annee); cv = couts_variables(annee)
    annexe = (p["inscriptions"] + p["stages"] - cv["total"]) / p["eff_moyen"]
    contrib = marge_joueur_an + annexe
    n = ceil(fixes / contrib)
    return {"fixes": fixes, "tarif_moyen": round(tarif_moyen), "contrib": round(contrib), "joueurs": n, "ca_seuil": round(n * contrib), "eff_moyen": p["eff_moyen"], "marge_securite": round(p["eff_moyen"] - n, 1)}

def sensibilite(annee=1):
    """Résultat avant impôt selon l'effectif réellement atteint (en % de la prévision), charges fixes constantes."""
    sv = seuil(annee); p = produits(annee); cr = compte_resultat(annee); out = []
    for f in (0.70, 0.85, 1.00, 1.10):
        eff = round(p["eff_moyen"] * f, 1)
        rai = round(cr["rai"] + (eff - p["eff_moyen"]) * sv["contrib"])   # écart d'effectif valorisé à la contribution par joueur
        out.append({"facteur": f, "eff": eff, "rai": rai})
    return out

def bilan_fin_a1():
    """Bilan construit à partir des flux : l'actif est ce qui reste, le passif ce qui l'a financé ; l'écart résiduel est explicité."""
    cr = compte_resultat(1); tr = tresorerie(); am = amortissements()
    immo = [(b["nom"], b["valeur"] - b["c1"]) for b in am]
    caution = 600_000
    stock = 0                                       # les 40 kits du stock initial sont tous remis aux joueurs en année 1
    creances = round(produits(1)["cot_brut"] * TAUX_IMPAYES[1] * .5)   # retards de cotisation encore recouvrables
    tresor = tr["fin"]
    actif = sum(v for _, v in immo) + caution + stock + creances + tresor
    capital = CAPITAL; resultat = cr["net"]
    dettes_sociales = round(sum(v for n, v in cr["charges"] if "sociales" in n) / 12)
    fournisseurs = 200_000
    impot = cr["impot"]
    passif_connu = capital + resultat + dettes_sociales + fournisseurs + impot
    ecart = actif - passif_connu
    return {"immo": immo, "caution": caution, "stock": stock, "creances": creances, "tresor": tresor, "actif": actif, "capital": capital, "resultat": resultat, "dettes_sociales": dettes_sociales, "fournisseurs": fournisseurs, "impot": impot, "ecart": ecart}

def fcfa(n):
    s = f"{abs(int(round(n))):,}".replace(",", " ")
    return ("-" if n < 0 else "") + s

if __name__ == "__main__":
    inv_total = sum(sum(q * pu for _, q, pu in l) for _, _, l in INVEST)
    print("investissements", fcfa(inv_total), "réserve", fcfa(CAPITAL_NUM - inv_total))
    for a in (1, 2, 3):
        cr = compte_resultat(a); p = cr["produits"]
        print(f"A{a} eff moyen {p['eff_moyen']} produits {fcfa(p['total'])} marge {fcfa(cr['marge'])} charges {fcfa(cr['total_charges'])} dot {fcfa(cr['dotation'])} EBE {fcfa(cr['ebe'])} RAI {fcfa(cr['rai'])} net {fcfa(cr['net'])}")
    tr = tresorerie()
    print("tréso min", fcfa(tr["min"]), "fin", fcfa(tr["fin"]))
    for l in tr["lignes"]: print(l["mois"], l["effectif"], fcfa(l["enc"]), fcfa(l["dec"]), fcfa(l["solde"]))
    print("seuil", seuil(1)); print("seuil A2", seuil(2))
    b = bilan_fin_a1(); print("bilan actif", fcfa(b["actif"]), "écart", fcfa(b["ecart"]))
