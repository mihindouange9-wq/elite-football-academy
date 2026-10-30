# -*- coding: utf-8 -*-
"""Partie III — Analyse financière détaillée : chaque chiffre est expliqué (origine, formule, hypothèse)."""
import modele as M
from modele import fcfa as F

def pct(a, b):
    return f"{100 * a / b:.1f} %".replace(".", ",")

def virg(x):
    return str(x).replace(".", ",")

def t(tete, lignes, larg=None, totaux=(), sections=()):
    return ("table", {"tete": tete, "lignes": lignes, "larg": larg, "totaux": set(totaux), "sections": set(sections)})

def blocs():
    B = []; add = B.append
    A = {a: M.compte_resultat(a) for a in (1, 2, 3)}
    P = {a: A[a]["produits"] for a in (1, 2, 3)}
    CV = {a: A[a]["cv"] for a in (1, 2, 3)}
    TR = M.tresorerie(); AM = M.amortissements(); S1, S2 = M.seuil(1), M.seuil(2); BIL = M.bilan_fin_a1()
    CH = {a: M.charges(a) for a in (1, 2, 3)}

    add(("h1", "III.  ANALYSE FINANCIÈRE"))
    add(("p", "Cette partie présente le modèle financier de l'académie poste par poste. Chaque montant est accompagné de sa base de calcul (quantité × prix, effectif × tarif × mois, ou référence de prix), de sorte qu'un lecteur puisse refaire le calcul et vérifier l'hypothèse. Les hypothèses sont volontairement prudentes : rentrée progressive, impayés comptés, partenariats absents de la première année, réserve de trésorerie jamais consommée."))
    add(("h3", "Hypothèses générales du modèle"))
    add(t(["Hypothèse", "Valeur retenue", "Justification"], [
        ["Durée de la saison de cotisation", f"{M.MOIS_COTISES} mois (septembre à juin)", "Calendrier scolaire gabonais ; juillet et août sont couverts par les stages de vacances, sans cotisation"],
        ["Tarif Sport-Études", f"{F(M.TARIF[1]['SE'])} FCFA par mois (A1-A2), {F(M.TARIF[3]['SE'])} en A3", "Tarif d'amorçage affiché sur le site ; hausse de 10 % en année 3 une fois la qualité démontrée"],
        ["Tarif Loisirs", f"{F(M.TARIF[1]['LO'])} FCFA par mois (A1-A2), {F(M.TARIF[3]['LO'])} en A3", "Moitié du tarif Sport-Études : séances en fin de journée et le samedi, sans répétiteur"],
        ["Part de l'effectif en Sport-Études", f"{int(M.PART_SE[1] * 100)} % en A1, {int(M.PART_SE[2] * 100)} % en A2, {int(M.PART_SE[3] * 100)} % en A3", "La filière complète est plus chère : un peu plus d'un tiers des familles au départ, davantage avec la notoriété"],
        ["Frais d'inscription", f"{F(M.FRAIS_INSCRIPTION)} FCFA, une fois", f"Pochette de bienvenue ({F(M.COUT_POCHETTE)}) + licence et frais de dossier ({F(M.LICENCE_DOSSIER)})"],
        ["Stage de vacances", f"{F(M.PRIX_STAGE)} FCFA par enfant et par stage", "Cinq demi-journées encadrées ; prix accessible aux familles extérieures à l'académie"],
        ["Taux d'impayés", f"{int(M.TAUX_IMPAYES[1] * 100)} % en A1, {int(M.TAUX_IMPAYES[2] * 100)} % en A2, {int(M.TAUX_IMPAYES[3] * 100)} % en A3", "Part des cotisations jamais recouvrées malgré l'échéancier et les relances ; baisse avec la discipline de la plateforme"],
        ["Charges sociales employeur", f"{int(M.TAUX_SOCIAL * 100)} % des salaires bruts", "Cotisations CNSS et CNAMGS à la charge de l'employeur, taux global arrondi, à confirmer par le comptable"],
        ["Impôt sur les sociétés", f"{int(M.TAUX_IS * 100)} % du résultat avant impôt", "Taux standard gabonais ; aucune exonération n'est supposée"],
        ["Capacité du terrain", f"{M.CAPACITE[1]} joueurs (A1-A2), {M.CAPACITE[3]} en A3", "Quatre groupes de vingt sur un terrain ; second créneau en année 3"],
    ], larg=[24, 26, 50]))

    # ------------------------------------------------------------------ 1. Prévisions économiques et investissements
    add(("h2", "1.  Prévisions économiques et investissements"))
    add(("h3", "1.1  Capital social et apports"))
    add(("p", f"Le capital social d'Elite Football Academy SARL s'élève à {F(M.CAPITAL)} FCFA, intégralement libéré à la création. Il se décompose en un apport en numéraire de {F(M.CAPITAL_NUM)} FCFA (équivalent à 13 000 €, liquidités apportées par le gérant) et un apport en nature de {F(M.CAPITAL_NAT)} FCFA correspondant à la plateforme numérique de l'académie, développée et en ligne au moment de la constitution."))
    add(t(["Composante du capital social", "Nature", "Montant (FCFA)", "Pourcentage"], [
        ["Apport en numéraire", "Cash (banque)", F(M.CAPITAL_NUM), pct(M.CAPITAL_NUM, M.CAPITAL)],
        ["Apport en nature — plateforme numérique Elite", "Immobilisation incorporelle", F(M.CAPITAL_NAT), pct(M.CAPITAL_NAT, M.CAPITAL)],
        ["TOTAL CAPITAL SOCIAL", "—", F(M.CAPITAL), "100,0 %"],
    ], larg=[46, 22, 17, 15], totaux=[2]))
    add(("p", f"Comment les {F(M.CAPITAL_NAT)} FCFA de l'apport en nature sont-ils justifiés ? La plateforme est évaluée à son coût de développement par un studio local, composant par composant, selon le temps de conception et de réalisation que chacun représente. Le détail ci-dessous constitue la base du rapport d'évaluation joint en annexe 1 ; il n'inclut aucune valeur de marché ni aucune survaleur."))
    add(t(["Composant de la plateforme (livré et en ligne)", "Valeur (FCFA)"], [[n, F(v)] for n, v in M.PLATEFORME] + [["TOTAL DE L'APPORT EN NATURE", F(M.CAPITAL_NAT)]], larg=[80, 20], totaux=[len(M.PLATEFORME)]))
    add(("p", "Au bilan d'ouverture, l'apport en nature est inscrit à l'actif en immobilisation incorporelle (logiciel) pour sa valeur d'apport, avec un poste de capitaux propres équivalent. Il est amorti sur cinq ans (section 1.4) et ne génère aucun flux de trésorerie : il ne peut donc ni financer une dépense, ni être confondu avec la réserve de trésorerie."))

    add(("h3", "1.2  Investissements initiaux détaillés"))
    add(("p", f"Les liquidités apportées au capital ({F(M.CAPITAL_NUM)} FCFA) financent sept postes de dépenses initiales (A à G) pour un total de {F(M.INV_TOTAL)} FCFA, et laissent {F(M.RESERVE)} FCFA de réserve de trésorerie (poste H), soit {pct(M.RESERVE, M.CAPITAL_NUM)} du numéraire. Chaque ligne précise la quantité, le prix unitaire retenu et la justification de ce prix. Les prix sont ceux relevés en 2026 auprès des équipementiers sportifs, fournisseurs de textile et prestataires administratifs de Libreville et d'Akanda ; les devis correspondants sont joints en annexe 6."))
    for code, nom, lignes in M.INVEST:
        add(("h3", f"{code} — {nom}"))
        rows = [[d, str(q), F(pu), F(q * pu), why] for d, q, pu, why in lignes]
        rows.append([f"Sous-total — Poste {code}", "—", "—", F(M.INV_SOUS_TOTAUX[code]), ""])
        add(t(["Désignation", "Qté", "PU (FCFA)", "Total (FCFA)", "Justification du prix et de la quantité"], rows, larg=[34, 6, 11, 12, 37], totaux=[len(rows) - 1]))
    add(("h3", "H — Réserve de trésorerie"))
    mens = TR["mensuel"]; courant = mens["salaires"] + mens["loyer"] + mens["medecin"] + mens["repetiteur"] + mens["fonctionnement"]
    add(("p", f"Calcul : {F(M.CAPITAL_NUM)} FCFA de numéraire − {F(M.INV_TOTAL)} FCFA de postes A à G = {F(M.RESERVE)} FCFA. Cette réserve représente {virg(round(M.RESERVE / courant, 1))} mois de charges courantes (salaires et charges sociales {F(mens['salaires'])}, loyer {F(mens['loyer'])}, répétiteur {F(mens['repetiteur'])}, médecin {F(mens['medecin'])}, fonctionnement {F(mens['fonctionnement'])} FCFA par mois, soit {F(courant)} FCFA). Elle n'est pas destinée à être consommée : le plan de trésorerie de la section 2.4 montre que le solde de fin de mois reste supérieur à {F(TR['min'])} FCFA tout au long de la première saison. Elle protège l'académie contre un retard de cotisations, une réparation imprévue ou un mois difficile pour les familles."))
    add(("h3", "Récapitulatif des investissements initiaux"))
    trait = {"A": "Immobilisé, amorti sur 3 ans", "B": "Stock remis aux 40 premiers joueurs", "C": "Charge de démarrage de l'année 1", "D": "Caution à l'actif ; aménagement amorti sur 5 ans", "E": "Immobilisé, amorti sur 3 ans", "F": "Charge de démarrage de l'année 1", "G": "Charge de démarrage de l'année 1"}
    rows = [[code, f"{code} — {nom}", F(M.INV_SOUS_TOTAUX[code]), pct(M.INV_SOUS_TOTAUX[code], M.CAPITAL_NUM), trait[code]] for code, nom, _ in M.INVEST]
    rows.append(["H", "Réserve de trésorerie (préservée)", F(M.RESERVE), pct(M.RESERVE, M.CAPITAL_NUM), "Reste en banque"])
    rows.append(["TOTAL CAPITAL EN NUMÉRAIRE", "—", F(M.CAPITAL_NUM), "100,0 %", ""])
    add(t(["Poste", "Désignation", "Montant (FCFA)", "% du cash", "Traitement comptable"], rows, larg=[9, 40, 15, 11, 25], totaux=[len(rows) - 1]))
    add(("note", f"Les postes C, F et G ({F(M.charges_demarrage())} FCFA) sont des dépenses de démarrage non récurrentes : décaissées sur le capital, elles sont comptabilisées en charges de la première année (section 2.3) et non à l'actif. Les 40 pochettes du poste B ({F(M.INV_SOUS_TOTAUX['B'])} FCFA) sont remises aux 40 premiers inscrits ; les suivantes sont achetées au fil des inscriptions (section 2.1)."))

    add(("h3", "1.3  Prévision de dépenses annuelles sur 3 ans"))
    add(("p", "Les charges d'exploitation sont les dépenses de fonctionnement de l'académie, indépendantes du nombre exact de joueurs à court terme (sauf les consommables, le transport et la communication, qui croissent avec l'activité). Elles sont distinctes des coûts variables directement liés à chaque joueur (pochettes de bienvenue, stages) traités en section 2.1. Le premier tableau détaille la masse salariale, premier poste de dépense ; le second présente toutes les charges, avec pour chacune sa base de calcul."))
    rows = []
    for nom, par_an, why in M.SALAIRES:
        n1, m1, k1 = par_an[1]; n2, m2, k2 = par_an[2]; n3, m3, k3 = par_an[3]
        rows.append([nom, f"{n1} × {F(m1)} × {k1}", F(n1 * m1 * k1), f"{n2} × {F(m2)} × {k2}", F(n2 * m2 * k2), f"{n3} × {F(m3)} × {k3}", F(n3 * m3 * k3), why])
    rows.append(["TOTAL SALAIRES BRUTS", "", F(M.masse_salariale(1)), "", F(M.masse_salariale(2)), "", F(M.masse_salariale(3)), ""])
    rows.append([f"Charges sociales ({int(M.TAUX_SOCIAL * 100)} %)", "", F(round(M.masse_salariale(1) * M.TAUX_SOCIAL)), "", F(round(M.masse_salariale(2) * M.TAUX_SOCIAL)), "", F(round(M.masse_salariale(3) * M.TAUX_SOCIAL)), "Cotisations employeur CNSS et CNAMGS"])
    rows.append(["COÛT TOTAL DU PERSONNEL PERMANENT", "", F(round(M.masse_salariale(1) * (1 + M.TAUX_SOCIAL))), "", F(round(M.masse_salariale(2) * (1 + M.TAUX_SOCIAL))), "", F(round(M.masse_salariale(3) * (1 + M.TAUX_SOCIAL))), ""])
    add(t(["Poste", "Base A1 (effectif × mensuel × mois)", "Année 1", "Base A2", "Année 2", "Base A3", "Année 3", "Justification"], rows, larg=[17, 13, 10, 11, 10, 11, 10, 18], totaux=[len(rows) - 3, len(rows) - 1]))
    rows = []; sec = []
    for i, (n, v, base) in enumerate(CH[1]):
        if v is None:
            rows.append([n, "", "", "", ""]); sec.append(len(rows) - 1)
        else:
            rows.append([n, F(v), F(CH[2][i][1]), F(CH[3][i][1]), base])
    tot = {a: A[a]["total_charges"] for a in (1, 2, 3)}
    rows.append(["TOTAL CHARGES D'EXPLOITATION (hors amortissements)", F(tot[1]), F(tot[2]), F(tot[3]), "Somme des lignes ci-dessus"])
    rows.append(["Dotations aux amortissements (section 1.4)", F(A[1]["dotation"]), F(A[2]["dotation"]), F(A[3]["dotation"]), "Charge calculée, sans décaissement"])
    rows.append(["TOTAL CHARGES FIXES ANNUELLES", F(tot[1] + A[1]["dotation"]), F(tot[2] + A[2]["dotation"]), F(tot[3] + A[3]["dotation"]), "Base du seuil de rentabilité (section 2.5)"])
    add(t(["Poste de dépense d'exploitation", "Année 1", "Année 2", "Année 3", "Base de calcul"], rows, larg=[30, 11, 11, 11, 37], totaux=[len(rows) - 3, len(rows) - 1], sections=sec))
    personnel = round(M.masse_salariale(1) * (1 + M.TAUX_SOCIAL)) + CH[1][3][1] + CH[1][4][1]
    add(("p", f"Lecture : le personnel (salaires, charges sociales, répétiteur, médecin) représente {pct(personnel, tot[1])} des charges d'exploitation de l'année 1, le terrain {pct(CH[1][6][1], tot[1])}. Entre l'année 1 et l'année 3, les charges augmentent de {pct(tot[3] - tot[1], tot[1])} alors que les produits augmentent de {pct(P[3]['total'] - P[1]['total'], P[1]['total'])} : c'est ce décalage, appelé levier opérationnel, qui explique la progression du résultat."))

    add(("h3", "1.4  Plan d'amortissement"))
    add(("p", "Les immobilisations sont amorties selon la méthode linéaire : la valeur d'origine est répartie à parts égales sur la durée d'usage retenue, conformément aux pratiques courantes et au plan comptable SYSCOHADA. La dotation annuelle est une charge calculée qui réduit le résultat imposable sans sortie de trésorerie. La caution du terrain n'est pas amortissable : elle reste à l'actif jusqu'à sa restitution. Les pochettes (poste B) et les dépenses de démarrage (postes C, F, G) ne sont pas des immobilisations."))
    rows = [[b["nom"], F(b["valeur"]), str(b["duree"]), f"{F(b['valeur'])} ÷ {b['duree']} = {F(b['dotation'])}", F(b["c1"]), F(b["c2"]), F(b["c3"]), F(b["vnc3"]), b["why"]] for b in AM]
    tot_val = sum(b["valeur"] for b in AM); tot_dot = sum(b["dotation"] for b in AM)
    rows.append(["TOTAL IMMOBILISATIONS AMORTISSABLES", F(tot_val), "—", F(tot_dot), F(sum(b["c1"] for b in AM)), F(sum(b["c2"] for b in AM)), F(sum(b["c3"] for b in AM)), F(sum(b["vnc3"] for b in AM)), ""])
    add(t(["Bien immobilisé", "Valeur d'origine", "Durée", "Dotation annuelle (calcul)", "Cumul fin A1", "Cumul fin A2", "Cumul fin A3", "VNC fin A3", "Pourquoi cette durée"], rows, larg=[22, 10, 5, 15, 9, 9, 9, 9, 12], totaux=[len(rows) - 1]))
    add(("p", f"La dotation annuelle totale s'élève à {F(tot_dot)} FCFA. La plateforme numérique en représente {pct(AM[3]['dotation'], tot_dot)} ({F(AM[3]['dotation'])} FCFA par an) : c'est l'effet comptable de l'apport en nature, qui pèse sur le résultat affiché mais pas sur la trésorerie. La valeur nette comptable en fin d'année 3 ({F(sum(b['vnc3'] for b in AM))} FCFA) correspond aux deux années d'amortissement restantes de la plateforme et de l'aménagement du terrain."))

    # ------------------------------------------------------------------ 2. Analyse financière détaillée
    add(("h2", "2.  Analyse financière détaillée"))
    add(("h3", "2.1  Produits et coûts par joueur"))
    add(("p", "L'académie raisonne par joueur et par saison, comme une entreprise industrielle raisonne par unité produite. Pour chaque filière, le tableau ci-dessous calcule ce qu'un joueur rapporte sur une saison (cotisations nettes d'impayés, frais d'inscription l'année de son entrée, stages auxquels il participe) et ce qu'il coûte directement (pochette de bienvenue, coûts des stages). La différence est sa contribution à la couverture des charges fixes."))
    se_brut = M.TARIF[1]["SE"] * M.MOIS_COTISES; lo_brut = M.TARIF[1]["LO"] * M.MOIS_COTISES
    se_net = se_brut * (1 - M.TAUX_IMPAYES[1]); lo_net = lo_brut * (1 - M.TAUX_IMPAYES[1])
    part_stage = .6; stage_moy = M.PRIX_STAGE * 3 * part_stage; cout_stage_moy = M.COUT_STAGE_ENFANT * 3 * part_stage
    add(t(["Poste par joueur et par saison", "Sport-Études (FCFA)", "Loisirs (FCFA)", "Calcul"], [
        ["Cotisations brutes sur la saison", F(se_brut), F(lo_brut), f"{F(M.TARIF[1]['SE'])} × {M.MOIS_COTISES} mois ; {F(M.TARIF[1]['LO'])} × {M.MOIS_COTISES} mois"],
        ["Impayés estimés", F(-se_brut * M.TAUX_IMPAYES[1]), F(-lo_brut * M.TAUX_IMPAYES[1]), f"{int(M.TAUX_IMPAYES[1] * 100)} % des cotisations brutes"],
        ["Cotisations nettes", F(se_net), F(lo_net), "Brut − impayés"],
        ["Frais d'inscription (année d'entrée seulement)", F(M.FRAIS_INSCRIPTION), F(M.FRAIS_INSCRIPTION), "Montant unique à l'inscription"],
        ["Stages de vacances", F(stage_moy), F(stage_moy), f"{F(M.PRIX_STAGE)} × 3 stages × {int(part_stage * 100)} % de participation moyenne"],
        ["PRODUITS PAR JOUEUR (année d'entrée)", F(se_net + M.FRAIS_INSCRIPTION + stage_moy), F(lo_net + M.FRAIS_INSCRIPTION + stage_moy), "Somme des trois lignes précédentes"],
        ["Pochette de bienvenue", F(-M.COUT_POCHETTE), F(-M.COUT_POCHETTE), " + ".join(f"{n} {F(v)}" for n, v in M.POCHETTE)],
        ["Coûts directs des stages", F(-cout_stage_moy), F(-cout_stage_moy), f"{F(M.COUT_STAGE_ENFANT)} par stage × 3 × {int(part_stage * 100)} %"],
        ["CONTRIBUTION PAR JOUEUR AUX CHARGES FIXES", F(se_net + M.FRAIS_INSCRIPTION + stage_moy - M.COUT_POCHETTE - cout_stage_moy), F(lo_net + M.FRAIS_INSCRIPTION + stage_moy - M.COUT_POCHETTE - cout_stage_moy), "Produits − coûts directs"],
    ], larg=[32, 15, 15, 38], totaux=[5, 8]))
    add(("p", f"Le coût d'un stage par enfant, {F(M.COUT_STAGE_ENFANT)} FCFA, se décompose ainsi : " + " ; ".join(f"{n[0].lower() + n[1:]} : {F(v)} FCFA" for n, v in M.STAGE_COUT) + f". Les éducateurs permanents encadrent les stages dans le cadre de leur salaire ; seul un vacataire supplémentaire est payé au-delà de dix enfants par éducateur. Un stage à {F(M.PRIX_STAGE)} FCFA dégage donc {F(M.PRIX_STAGE - M.COUT_STAGE_ENFANT)} FCFA de marge par enfant, soit {pct(M.PRIX_STAGE - M.COUT_STAGE_ENFANT, M.PRIX_STAGE)}."))

    add(("h3", "2.2  Projection des produits sur 3 ans"))
    add(("p", "La projection part de l'effectif payant mois par mois, c'est-à-dire du nombre de joueurs à jour de cotisation chaque mois. Le tableau ci-dessous en donne l'hypothèse pour les trois saisons, avec sa répartition entre les deux filières. La rentrée est progressive : les familles s'inscrivent surtout en septembre après la journée de détection, puis au fil des matchs et du bouche-à-oreille ; l'effectif se stabilise au printemps."))
    rows = []
    for a in (1, 2, 3):
        rows.append([f"ANNÉE {a}"] + [""] * 13)
        rows.append(["Effectif payant"] + [str(e) if e else "—" for e in P[a]["eff"]] + [str(P[a]["mois_joueurs"])])
        rows.append([f"dont Sport-Études ({int(M.PART_SE[a] * 100)} %)"] + [str(s) if s else "—" for s in P[a]["se"]] + [str(P[a]["mois_se"])])
        rows.append(["dont Loisirs"] + [str(l) if l else "—" for l in P[a]["lo"]] + [str(P[a]["mois_lo"])])
    add(t(["Effectif par mois"] + M.MOIS + ["Mois-joueurs"], rows, larg=[13] + [6.5] * 12 + [9], sections=[0, 4, 8]))
    add(("p", f"Lecture : la colonne « mois-joueurs » additionne les joueurs payants de chaque mois ; c'est l'unité de facturation de l'académie. En année 1, {P[1]['mois_joueurs']} mois-joueurs sont facturés, dont {P[1]['mois_se']} en Sport-Études et {P[1]['mois_lo']} en Loisirs. L'effectif moyen de la saison est de {virg(P[1]['eff_moyen'])} joueurs ({P[1]['mois_joueurs']} ÷ {M.MOIS_COTISES} mois), pour un maximum de {P[1]['eff_max']} en fin de saison. En année 2, la capacité du terrain ({M.CAPACITE[2]} joueurs) est atteinte dès décembre ; en année 3, le second créneau porte l'effectif à {P[3]['eff_max']}."))
    add(("p", "Comment l'effectif se renouvelle-t-il d'une saison à l'autre ? Chaque été, des joueurs quittent l'académie (fin de parcours à 18 ans, déménagement, choix familial) et sont remplacés par de nouveaux inscrits, qui paient les frais d'inscription et reçoivent une pochette. Le tableau ci-dessous explique le nombre de nouveaux inscrits de chaque année."))
    rows = [["Année 1", "—", "—", str(M.NOUVEAUX_MENSUELS[1][0]), str(sum(M.NOUVEAUX_MENSUELS[1][1:])), "—", str(M.NOUVEAUX[1]), "Tous les joueurs sont nouveaux : " + ", ".join(f"{n} en {m.lower()}" for n, m in zip(M.NOUVEAUX_MENSUELS[1], M.MOIS) if n)]]
    for a in (2, 3):
        r = M.RENOUVELLEMENT[a]
        rows.append([f"Année {a}", str(r["fin_prec"]), str(-r["departs"]), str(r["sept"]), str(r["croissance"]), str(r["remplacements"]), str(M.NOUVEAUX[a]), f"{r['fin_prec']} − {r['departs']} départs + {r['sept']} nouveaux = {M.EFFECTIF[a][0]} en septembre ; + {r['croissance']} de croissance" + (f" ; {r['remplacements']} remplacements en cours de saison" if r["remplacements"] else "")])
    add(t(["Saison", "Effectif fin de saison précédente", "Départs à l'été", "Nouveaux en septembre", "Nouveaux de croissance", "Remplacements", "Total nouveaux inscrits", "Calcul"], rows, larg=[8, 10, 8, 10, 10, 12, 11, 31]))
    add(("p", "Les stages de vacances sont ouverts aux joueurs de l'académie et aux jeunes extérieurs. L'hypothèse de participation est prudente : la moitié de l'effectif environ à la Toussaint, un peu plus à Pâques, et l'été attire aussi des enfants de l'extérieur."))
    rows = []
    for a in (1, 2, 3):
        for nom, im, n in M.STAGES[a]:
            rows.append([f"A{a} — {nom}", M.MOIS[im], str(n), F(M.PRIX_STAGE), F(n * M.PRIX_STAGE), F(n * M.COUT_STAGE_ENFANT), F(n * (M.PRIX_STAGE - M.COUT_STAGE_ENFANT))])
        rows.append([f"TOTAL ANNÉE {a}", "", str(P[a]["stagiaires"]), "", F(P[a]["stages"]), F(CV[a]["stages"]), F(P[a]["stages"] - CV[a]["stages"])])
    add(t(["Stage", "Mois", "Enfants", "Prix", "Produit (FCFA)", "Coût direct (FCFA)", "Marge (FCFA)"], rows, larg=[20, 10, 10, 12, 16, 16, 16], totaux=[3, 7, 11]))
    add(("p", f"Les partenariats d'entreprises (sponsoring des maillots, d'un tournoi ou de la journée de détection gratuite) ne sont comptés qu'à partir de la deuxième saison, et pour des montants modestes, une fois que l'académie a des résultats et des images à montrer : {F(M.PARTENARIATS[2])} FCFA en année 2 (un partenaire principal), {F(M.PARTENARIATS[3])} FCFA en année 3 (deux partenaires). Le modèle n'en dépend pas : sans eux, l'année 2 et l'année 3 restent bénéficiaires."))
    add(("p", "Le tableau de synthèse ci-dessous assemble ces hypothèses. Chaque ligne de cotisation se calcule comme « mois-joueurs de la filière × tarif mensuel »."))
    add(t(["Indicateur", "Année 1", "Année 2", "Année 3", "Calcul"], [
        ["Effectif moyen payant", virg(P[1]["eff_moyen"]), virg(P[2]["eff_moyen"]), virg(P[3]["eff_moyen"]), f"Mois-joueurs ÷ {M.MOIS_COTISES}"],
        ["Effectif en fin de saison", str(P[1]["eff_max"]), str(P[2]["eff_max"]), str(P[3]["eff_max"]), "Effectif de juin"],
        ["Cotisations Sport-Études", F(P[1]["cot_se"]), F(P[2]["cot_se"]), F(P[3]["cot_se"]), f"{P[1]['mois_se']} × {F(M.TARIF[1]['SE'])} ; {P[2]['mois_se']} × {F(M.TARIF[2]['SE'])} ; {P[3]['mois_se']} × {F(M.TARIF[3]['SE'])}"],
        ["Cotisations Loisirs", F(P[1]["cot_lo"]), F(P[2]["cot_lo"]), F(P[3]["cot_lo"]), f"{P[1]['mois_lo']} × {F(M.TARIF[1]['LO'])} ; {P[2]['mois_lo']} × {F(M.TARIF[2]['LO'])} ; {P[3]['mois_lo']} × {F(M.TARIF[3]['LO'])}"],
        ["Cotisations brutes", F(P[1]["cot_brut"]), F(P[2]["cot_brut"]), F(P[3]["cot_brut"]), "Somme des deux filières"],
        ["Impayés estimés", F(-P[1]["impayes"]), F(-P[2]["impayes"]), F(-P[3]["impayes"]), f"{int(M.TAUX_IMPAYES[1] * 100)} %, {int(M.TAUX_IMPAYES[2] * 100)} %, {int(M.TAUX_IMPAYES[3] * 100)} % des cotisations brutes"],
        ["Frais d'inscription", F(P[1]["inscriptions"]), F(P[2]["inscriptions"]), F(P[3]["inscriptions"]), f"{M.NOUVEAUX[1]}, {M.NOUVEAUX[2]}, {M.NOUVEAUX[3]} nouveaux × {F(M.FRAIS_INSCRIPTION)}"],
        ["Stages de vacances", F(P[1]["stages"]), F(P[2]["stages"]), F(P[3]["stages"]), f"{P[1]['stagiaires']}, {P[2]['stagiaires']}, {P[3]['stagiaires']} participations × {F(M.PRIX_STAGE)}"],
        ["Partenariats d'entreprises", F(P[1]["partenariats"]), F(P[2]["partenariats"]), F(P[3]["partenariats"]), "Aucun en A1 ; un puis deux partenaires"],
        ["TOTAL DES PRODUITS ANNUELS (FCFA)", F(P[1]["total"]), F(P[2]["total"]), F(P[3]["total"]), "Cotisations nettes + inscriptions + stages + partenariats"],
        ["Croissance par rapport à l'année précédente", "—", f"+{100 * (P[2]['total'] / P[1]['total'] - 1):.0f} %", f"+{100 * (P[3]['total'] / P[2]['total'] - 1):.0f} %", ""],
    ], larg=[26, 13, 13, 13, 35], totaux=[9]))

    add(("h3", "2.3  Compte de résultat prévisionnel sur 3 ans"))
    add(("p", "Le compte de résultat consolide les sections précédentes. Il se lit de haut en bas : les produits (section 2.2), moins les coûts variables par joueur (section 2.1), donnent la marge sur coûts variables ; moins les charges d'exploitation (section 1.3) et, en année 1 seulement, les charges de démarrage (section 1.2), on obtient l'excédent brut d'exploitation, qui est le résultat en trésorerie de l'activité ; moins les amortissements (section 1.4), le résultat avant impôt ; moins l'impôt sur les sociétés à 30 %, le résultat net."))
    rows = [
        ["Cotisations nettes d'impayés", F(P[1]["cot_brut"] - P[1]["impayes"]), F(P[2]["cot_brut"] - P[2]["impayes"]), F(P[3]["cot_brut"] - P[3]["impayes"])],
        ["Frais d'inscription, stages et partenariats", F(P[1]["inscriptions"] + P[1]["stages"] + P[1]["partenariats"]), F(P[2]["inscriptions"] + P[2]["stages"] + P[2]["partenariats"]), F(P[3]["inscriptions"] + P[3]["stages"] + P[3]["partenariats"])],
        ["TOTAL DES PRODUITS", F(P[1]["total"]), F(P[2]["total"]), F(P[3]["total"])],
        [f"Pochettes de bienvenue ({M.NOUVEAUX[1]}, {M.NOUVEAUX[2]}, {M.NOUVEAUX[3]} nouveaux × {F(M.COUT_POCHETTE)})", F(-CV[1]["pochettes"]), F(-CV[2]["pochettes"]), F(-CV[3]["pochettes"])],
        [f"Coûts directs des stages ({P[1]['stagiaires']}, {P[2]['stagiaires']}, {P[3]['stagiaires']} participations × {F(M.COUT_STAGE_ENFANT)})", F(-CV[1]["stages"]), F(-CV[2]["stages"]), F(-CV[3]["stages"])],
        ["MARGE SUR COÛTS VARIABLES", F(A[1]["marge"]), F(A[2]["marge"]), F(A[3]["marge"])],
        ["Taux de marge sur coûts variables", pct(A[1]["marge"], P[1]["total"]), pct(A[2]["marge"], P[2]["total"]), pct(A[3]["marge"], P[3]["total"])],
    ]
    for i, (n, v) in enumerate(A[1]["charges"]):
        rows.append([n, F(-v), F(-A[2]["charges"][i][1]), F(-A[3]["charges"][i][1])])
    rows.append(["TOTAL CHARGES D'EXPLOITATION", F(-A[1]["total_charges"]), F(-A[2]["total_charges"]), F(-A[3]["total_charges"])])
    rows.append(["Charges de démarrage non récurrentes (postes C, F, G)", F(-A[1]["demarrage"]), "0", "0"])
    rows.append(["EXCÉDENT BRUT D'EXPLOITATION", F(A[1]["ebe"]), F(A[2]["ebe"]), F(A[3]["ebe"])])
    rows.append(["Dotations aux amortissements", F(-A[1]["dotation"]), F(-A[2]["dotation"]), F(-A[3]["dotation"])])
    rows.append(["RÉSULTAT AVANT IMPÔT", F(A[1]["rai"]), F(A[2]["rai"]), F(A[3]["rai"])])
    rows.append([f"Impôt sur les sociétés ({int(M.TAUX_IS * 100)} %)", F(-A[1]["impot"]), F(-A[2]["impot"]), F(-A[3]["impot"])])
    rows.append(["RÉSULTAT NET DE L'EXERCICE", F(A[1]["net"]), F(A[2]["net"]), F(A[3]["net"])])
    rows.append(["Marge nette (résultat net ÷ produits)", pct(A[1]["net"], P[1]["total"]), pct(A[2]["net"], P[2]["total"]), pct(A[3]["net"], P[3]["total"])])
    n = len(rows)
    add(t(["Indicateur (FCFA)", "Année 1", "Année 2", "Année 3"], rows, larg=[52, 16, 16, 16], totaux=[2, 5, n - 8, n - 6, n - 4, n - 2]))
    add(("p", "Lecture ligne par ligne de l'année 1 :"))
    add(("ul", [
        f"Total des produits : {F(P[1]['total'])} FCFA, dont {F(P[1]['cot_brut'] - P[1]['impayes'])} de cotisations nettes ({P[1]['mois_joueurs']} mois-joueurs facturés) et {F(P[1]['inscriptions'] + P[1]['stages'])} de frais d'inscription et de stages.",
        f"Marge sur coûts variables : {F(A[1]['marge'])} FCFA, soit {pct(A[1]['marge'], P[1]['total'])} des produits, après {F(CV[1]['total'])} FCFA de pochettes et de coûts de stages.",
        f"Excédent brut d'exploitation : {F(A[1]['ebe'])} FCFA. Avant les charges de démarrage, l'exploitation courante dégage {F(A[1]['ebe_courant'])} FCFA : c'est l'argent réellement gagné par l'activité sur la saison, que l'on retrouve dans le plan de trésorerie.",
        f"Résultat avant impôt : {F(A[1]['rai'])} FCFA après {F(A[1]['dotation'])} FCFA d'amortissements, dont {F(AM[3]['dotation'])} pour la plateforme apportée en nature. Sans cet amortissement comptable, le résultat avant impôt serait de {F(A[1]['rai'] + AM[3]['dotation'])} FCFA.",
        f"Résultat net : {F(A[1]['net'])} FCFA après {F(A[1]['impot'])} FCFA d'impôt sur les sociétés. La première saison est à l'équilibre, ce qui est l'objectif : elle absorbe les coûts de lancement et l'amortissement complet, sans perte.",
    ]))
    add(("p", f"Années 2 et 3 : les charges d'exploitation passent de {F(A[1]['total_charges'])} à {F(A[3]['total_charges'])} FCFA (+{100 * (A[3]['total_charges'] / A[1]['total_charges'] - 1):.0f} %) tandis que les produits passent de {F(P[1]['total'])} à {F(P[3]['total'])} FCFA (+{100 * (P[3]['total'] / P[1]['total'] - 1):.0f} %). Le résultat net atteint {F(A[2]['net'])} FCFA en année 2 ({pct(A[2]['net'], P[2]['total'])} de marge nette) puis {F(A[3]['net'])} FCFA en année 3 ({pct(A[3]['net'], P[3]['total'])}). Les charges de démarrage ont disparu, et l'amortissement reste constant pendant que l'effectif double."))

    add(("h3", "2.4  Plan de trésorerie mensuel sur 12 mois"))
    add(("p", f"Le plan de trésorerie suit, mois par mois de septembre à août, l'argent qui entre et qui sort du compte de l'académie pendant la première saison. Il part de la réserve de {F(TR['reserve'])} FCFA (capital en numéraire après les investissements et dépenses de démarrage, section 1.2). Les montants sont en milliers de FCFA ; chaque ligne est expliquée sous le tableau."))
    k = lambda v: F(round(v / 1000))
    L = TR["lignes"]; m = TR["mensuel"]
    rows = [
        ["Effectif payant"] + [str(l["effectif"]) if l["effectif"] else "—" for l in L],
        ["Nouveaux inscrits"] + [str(l["nouveaux"]) if l["nouveaux"] else "—" for l in L],
        ["ENCAISSEMENTS"] + [""] * 12,
        ["Cotisations nettes"] + [k(l["enc_cot"]) for l in L],
        ["Frais d'inscription"] + [k(l["enc_insc"]) for l in L],
        ["Stages de vacances"] + [k(l["enc_stage"]) for l in L],
        ["Total encaissements"] + [k(l["enc"]) for l in L],
        ["DÉCAISSEMENTS"] + [""] * 12,
        ["Salaires et charges sociales"] + [k(l["salaires"]) for l in L],
        ["Loyer du terrain"] + [k(l["loyer"]) for l in L],
        ["Répétiteur scolaire"] + [k(l["repetiteur"]) for l in L],
        ["Médecin et kinésithérapeute"] + [k(l["medecin"]) for l in L],
        ["Assurance (par trimestre)"] + [k(l["assurance"]) for l in L],
        ["Fonctionnement courant"] + [k(l["fonctionnement"]) for l in L],
        ["Pochettes hors stock"] + [k(l["pochettes"]) for l in L],
        ["Coûts des stages"] + [k(l["stages"]) for l in L],
        ["Comptable"] + [k(l["comptable"]) for l in L],
        ["Total décaissements"] + [k(l["dec"]) for l in L],
        ["Flux net du mois"] + [k(l["flux"]) for l in L],
        ["TRÉSORERIE FIN DE MOIS"] + [k(l["solde"]) for l in L],
    ]
    add(t(["En k FCFA"] + [l["mois"] for l in L], rows, larg=[18] + [6.8] * 12, totaux=[6, 17, 19], sections=[2, 7]))
    add(("p", "Explication des lignes :"))
    add(("ul", [
        f"Cotisations nettes : effectif Sport-Études du mois × {F(M.TARIF[1]['SE'])} + effectif Loisirs × {F(M.TARIF[1]['LO'])}, moins {int(M.TAUX_IMPAYES[1] * 100)} % d'impayés. Exemple de septembre : {L[0]['effectif']} joueurs, dont {P[1]['se'][0]} en Sport-Études et {P[1]['lo'][0]} en Loisirs, soit {F(P[1]['se'][0] * M.TARIF[1]['SE'] + P[1]['lo'][0] * M.TARIF[1]['LO'])} FCFA bruts et {F(L[0]['enc_cot'])} FCFA nets. Aucune cotisation en juillet et août.",
        f"Frais d'inscription : nouveaux inscrits du mois × {F(M.FRAIS_INSCRIPTION)} FCFA ({L[0]['nouveaux']} en septembre, après la journée de détection).",
        f"Stages : encaissés le mois du stage, {F(M.PRIX_STAGE)} FCFA par enfant : Toussaint en novembre ({M.STAGES[1][0][2]} enfants), Pâques en avril ({M.STAGES[1][1][2]}), été en juillet ({M.STAGES[1][2][2]}).",
        f"Salaires et charges sociales : {F(m['salaires'])} FCFA chaque mois, soit {F(M.masse_salariale(1))} de salaires bruts et {F(round(M.masse_salariale(1) * M.TAUX_SOCIAL))} de charges sociales sur l'année, divisés par douze. Les éducateurs sont payés douze mois, y compris l'été, pour les fidéliser.",
        f"Loyer : {F(m['loyer'])} FCFA par mois ; la caution de deux mois a déjà été versée sur le capital (poste D).",
        f"Répétiteur : {F(m['repetiteur'])} FCFA par mois pendant les dix mois de cours ; rien en juillet et août.",
        f"Médecin et kinésithérapeute : forfait de {F(m['medecin'])} FCFA par mois.",
        f"Assurance : la prime annuelle de {F(m['assurance_trim'] * 4)} FCFA est réglée en quatre fois, {F(m['assurance_trim'])} FCFA en septembre, décembre, mars et juin.",
        f"Fonctionnement courant : {F(m['fonctionnement'])} FCFA par mois, somme de l'eau et de l'électricité, de la téléphonie, de l'hébergement, des consommables, du transport, de la communication et des divers (section 1.3), divisée par douze.",
        f"Pochettes hors stock : les {M.STOCK_POCHETTES} premières pochettes viennent du stock de démarrage ; à partir de la {M.STOCK_POCHETTES + 1}e inscription, chaque nouveau joueur coûte {F(M.COUT_POCHETTE)} FCFA de pochette.",
        f"Coûts des stages : {F(M.COUT_STAGE_ENFANT)} FCFA par enfant, décaissés le mois du stage.",
        f"Comptable : forfait annuel de {F(m['comptable'])} FCFA réglé en août, à la clôture.",
    ]))
    imin = min(range(12), key=lambda i: L[i]["solde"])
    add(("p", f"Lecture : la trésorerie part de {F(TR['reserve'])} FCFA, ne descend jamais sous {F(TR['min'])} FCFA (en {L[imin]['mois'].lower().rstrip('.')}) et termine la saison à {F(TR['fin'])} FCFA. Elle progresse tout au long de la saison de cotisation, puis les mois de juillet et d'août, sans cotisations, consomment une partie de ce qui a été accumulé : c'est précisément le rôle de la réserve, et elle n'est jamais entamée. La discipline d'encaisser les cotisations en début de mois, avec l'échéancier, les rappels WhatsApp et les reçus de la plateforme, est la clé de cette régularité. Le flux net cumulé de la saison, {F(TR['fin'] - TR['reserve'])} FCFA, est proche de l'excédent brut d'exploitation ({F(A[1]['ebe'])} FCFA) : l'écart tient aux impayés non encore constatés, aux pochettes prises sur le stock de départ et à l'impôt qui n'est réglé qu'après la clôture."))

    add(("h3", "2.5  Seuil de rentabilité et marges"))
    add(("p", "Le seuil de rentabilité, ou point mort, est le nombre moyen de joueurs à partir duquel l'académie couvre l'intégralité de ses charges fixes (charges d'exploitation et amortissements). Il se calcule en trois temps :"))
    add(("ul", [
        f"La cotisation mensuelle moyenne au mix de l'année : {int(M.PART_SE[1] * 100)} % × {F(M.TARIF[1]['SE'])} + {int((1 - M.PART_SE[1]) * 100)} % × {F(M.TARIF[1]['LO'])} = {F(S1['tarif_moyen'])} FCFA. Sur {M.MOIS_COTISES} mois et nette de {int(M.TAUX_IMPAYES[1] * 100)} % d'impayés : {F(S1['cot_nette'])} FCFA par joueur et par an.",
        f"Les produits annexes nets par joueur : (frais d'inscription {F(P[1]['inscriptions'])} + stages {F(P[1]['stages'])} − pochettes {F(CV[1]['pochettes'])} − coûts des stages {F(CV[1]['stages'])}) ÷ {virg(P[1]['eff_moyen'])} joueurs = {F(S1['annexe'])} FCFA.",
        f"La contribution annuelle par joueur : {F(S1['cot_nette'])} + {F(S1['annexe'])} = {F(S1['contrib'])} FCFA. Le point mort est le total des charges fixes divisé par cette contribution : {F(S1['fixes'])} ÷ {F(S1['contrib'])} = {S1['joueurs']} joueurs (arrondi au joueur supérieur).",
    ]))
    add(t(["Indicateur du seuil de rentabilité", "Année 1", "Année 2", "Calcul / explication"], [
        ["Charges fixes annuelles (exploitation + amortissements)", F(S1["fixes"]), F(S2["fixes"]), "Total de la section 1.3, hors charges de démarrage non récurrentes"],
        ["Cotisation mensuelle moyenne au mix de l'année", F(S1["tarif_moyen"]), F(S2["tarif_moyen"]), f"{int(M.PART_SE[1] * 100)} % puis {int(M.PART_SE[2] * 100)} % de Sport-Études"],
        ["Cotisation annuelle nette par joueur", F(S1["cot_nette"]), F(S2["cot_nette"]), f"× {M.MOIS_COTISES} mois, moins les impayés"],
        ["Produits annexes nets par joueur", F(S1["annexe"]), F(S2["annexe"]), "Inscriptions et stages, nets de leurs coûts, par joueur moyen"],
        ["Contribution annuelle par joueur", F(S1["contrib"]), F(S2["contrib"]), "Somme des deux lignes précédentes"],
        ["Effectif moyen au point mort", f"{S1['joueurs']} joueurs", f"{S2['joueurs']} joueurs", "Charges fixes ÷ contribution, arrondi au joueur supérieur"],
        ["Produits au point mort", F(S1["ca_seuil"]), F(S2["ca_seuil"]), "Point mort × contribution"],
        ["Effectif moyen prévu", f"{virg(S1['eff_moyen'])} joueurs", f"{virg(S2['eff_moyen'])} joueurs", "Moyenne de septembre à juin (section 2.2)"],
        ["Marge de sécurité", f"{virg(S1['marge_securite'])} joueurs", f"{virg(S2['marge_securite'])} joueurs", "Effectif prévu au-delà du point mort"],
        ["Capacité du terrain", f"{M.CAPACITE[1]} joueurs", f"{M.CAPACITE[2]} joueurs", f"Le point mort représente {pct(S1['joueurs'], M.CAPACITE[1])} de la capacité"],
    ], larg=[30, 14, 14, 42]))
    SENS = M.sensibilite(1); cash = lambda i: SENS[i]["rai"] + A[1]["dotation"]
    add(("p", f"Le tableau de sensibilité ci-dessous mesure la résistance du modèle à une rentrée plus faible que prévu en année 1, toutes charges fixes et de démarrage maintenues. Chaque joueur en moins par rapport à la prévision retire {F(S1['contrib'])} FCFA de contribution sur la saison. La perte comptable comprend {F(A[1]['dotation'])} FCFA d'amortissements sans décaissement : l'effet réel sur la trésorerie est donc plus faible. À 85 % de l'effectif prévu, le besoin de trésorerie de la saison ({F(-cash(1))} FCFA) est très largement couvert par la réserve de {F(TR['reserve'])} FCFA. À 70 %, il atteint {F(-cash(0))} FCFA, soit l'ordre de grandeur de la réserve : ce scénario déclenche le plan d'action décrit dans le tableau, qui ramène les charges au niveau de l'effectif réel."))
    add(t(["Scénario (année 1)", "Effectif moyen", "Résultat avant impôt (FCFA)", "Effet sur la trésorerie", "Lecture et plan d'action"], [
        ["Rentrée difficile : 70 % de la prévision", virg(SENS[0]["eff"]), F(SENS[0]["rai"]), F(cash(0)), "Second éducateur à temps partiel jusqu'à 50 joueurs, seconde détection en janvier, report du stage de Pâques, recrutement administratif différé"],
        ["Rentrée prudente : 85 % de la prévision", virg(SENS[1]["eff"]), F(SENS[1]["rai"]), F(cash(1)), "Couvert par la réserve ; aucune mesure structurelle"],
        ["Prévision du dossier : 100 %", virg(SENS[2]["eff"]), F(SENS[2]["rai"]), F(cash(2)), "Scénario retenu dans le compte de résultat"],
        ["Rentrée forte : 110 % de la prévision", virg(SENS[3]["eff"]), F(SENS[3]["rai"]), F(cash(3)), "Capacité du terrain atteinte dès le printemps ; liste d'attente"],
    ], larg=[24, 11, 16, 15, 34], totaux=[2]))
    add(("p", f"Synthèse : avec un effectif moyen de {virg(P[1]['eff_moyen'])} joueurs en année 1, l'académie dépasse son point mort de {virg(S1['marge_securite'])} joueurs, et le point mort reste nettement en dessous de la capacité du terrain. En année 2, la marge de sécurité passe à {virg(S2['marge_securite'])} joueurs."))

    add(("h3", "2.6  Bilan prévisionnel de fin d'année 1"))
    add(("p", "Le bilan photographie le patrimoine de l'académie au 31 août de la première saison. À l'actif, ce que l'académie possède ; au passif, ce qui l'a financé. Chaque ligne est reliée à une section précédente."))
    actif_rows = [["ACTIF IMMOBILISÉ", ""]] + [[n, F(v)] for n, v in BIL["immo"]] + [["Caution du terrain (non amortissable)", F(BIL["caution"])], ["ACTIF CIRCULANT", ""], ["Créances sur les familles (retards recouvrables)", F(BIL["creances"])], ["Trésorerie disponible (banque et caisse)", F(BIL["tresor"])], ["TOTAL ACTIF", F(BIL["actif"])]]
    passif_rows = [["CAPITAUX PROPRES", ""], ["Capital social", F(BIL["capital"])], ["Résultat net de l'exercice 1", F(BIL["resultat"])], ["Total des capitaux propres", F(BIL["capital"] + BIL["resultat"])], ["", ""], ["", ""], ["DETTES À COURT TERME", ""], ["Dettes sociales (charges du dernier mois)", F(BIL["dettes_sociales"])], ["Dettes fournisseurs", F(BIL["fournisseurs"])], ["Impôt sur les sociétés à payer", F(BIL["impot"])], ["Produits constatés d'avance et dettes diverses", F(BIL["ecart"])], ["TOTAL PASSIF", F(BIL["actif"])]]
    n = max(len(actif_rows), len(passif_rows))
    actif_rows = actif_rows[:-1] + [["", ""]] * (n - len(actif_rows)) + actif_rows[-1:]
    passif_rows = passif_rows[:-1] + [["", ""]] * (n - len(passif_rows)) + passif_rows[-1:]
    rows = [a + p for a, p in zip(actif_rows, passif_rows)]
    sec = [i for i, r in enumerate(rows) if r[0] in ("ACTIF IMMOBILISÉ", "ACTIF CIRCULANT") or r[2] in ("CAPITAUX PROPRES", "DETTES À COURT TERME")]
    add(t(["ACTIF", "Montant (FCFA)", "PASSIF", "Montant (FCFA)"], rows, larg=[34, 16, 34, 16], totaux=[n - 1], sections=sec))
    add(("p", "Explication des lignes :"))
    add(("ul", [
        f"Immobilisations nettes : valeur d'origine moins une année d'amortissement (section 1.4). Exemple : plateforme numérique {F(AM[3]['valeur'])} − {F(AM[3]['c1'])} = {F(AM[3]['valeur'] - AM[3]['c1'])} FCFA ; équipement sportif {F(AM[0]['valeur'])} − {F(AM[0]['c1'])} = {F(AM[0]['valeur'] - AM[0]['c1'])} FCFA.",
        f"Caution du terrain : {F(BIL['caution'])} FCFA versés à la signature du bail (poste D), récupérables, donc à l'actif et non en charge.",
        f"Créances sur les familles : la moitié des impayés de l'année ({F(P[1]['impayes'])} FCFA × 50 % = {F(BIL['creances'])} FCFA), considérée comme encore recouvrable en septembre ; l'autre moitié a été passée en perte dans les produits.",
        f"Trésorerie : {F(BIL['tresor'])} FCFA, solde d'août du plan de trésorerie (section 2.4).",
        f"Capital social : {F(BIL['capital'])} FCFA, inchangé (section 1.1). Résultat net : {F(BIL['resultat'])} FCFA (section 2.3), qui vient augmenter les capitaux propres.",
        f"Dettes sociales : les charges sociales du mois d'août ({F(round(M.masse_salariale(1) * M.TAUX_SOCIAL))} ÷ 12 = {F(BIL['dettes_sociales'])} FCFA), déclarées et payées le mois suivant. Dettes fournisseurs : {F(BIL['fournisseurs'])} FCFA de factures d'août (consommables, transport) réglées en septembre. Impôt sur les sociétés : {F(BIL['impot'])} FCFA calculés sur le résultat, payés après la clôture.",
        f"Produits constatés d'avance et dettes diverses : {F(BIL['ecart'])} FCFA, qui correspondent aux frais d'inscription encaissés en août pour la saison suivante et aux petits décalages de règlement ; cette ligne assure l'équilibre comptable entre l'actif et le passif.",
    ]))
    add(("p", f"Note : le bilan est équilibré à {F(BIL['actif'])} FCFA. La trésorerie de clôture, {F(BIL['tresor'])} FCFA, est supérieure à la réserve de départ ({F(TR['reserve'])} FCFA) : la première saison a renforcé la structure financière de l'académie sans aucun endettement, tout en amortissant la totalité des coûts de lancement."))
    return B
