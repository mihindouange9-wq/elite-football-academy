# -*- coding: utf-8 -*-
"""Version HTML du business plan (même contenu que le Word), mise en page pour l'impression A4 :
couverture sombre « éclipse », Sora + Manrope, tableaux vert et or. Imprimée en PDF par pdf.mjs (Chrome)."""
from html import escape
import base64, os
import contenu as C

def b64(path):
    return base64.b64encode(open(path, "rb").read()).decode()

def font(path):
    return f"url(data:font/woff2;base64,{b64(path)}) format('woff2')"

def est_nombre(s):
    s = s.replace(" ", "").replace(" ", "").replace("%", "").replace(",", ".").replace("×", "").replace("+", "").replace("-", "").replace("—", "")
    try: float(s); return True
    except ValueError: return False

def table(spec):
    tete, lignes, larg, totaux, sections = spec["tete"], spec["lignes"], spec["larg"], spec["totaux"], spec["sections"]
    n = len(tete)
    if not larg: larg = [100 / n] * n
    cols = "".join(f'<col style="width:{w}%">' for w in larg)
    th = "".join(f"<th>{escape(h)}</th>" for h in tete)
    rows = []
    for r, ligne in enumerate(lignes):
        cls = "total" if r in totaux else ("section" if r in sections else "")
        tds = []
        for i, v in enumerate(ligne):
            v = str(v)
            al = "num" if (i and est_nombre(v) and v.strip() not in ("—", "")) else ("centre" if (i and len(v) <= 4) else "")
            tds.append(f'<td class="{al}">{escape(v).replace(chr(10), "<br>")}</td>')
        rows.append(f'<tr class="{cls}">{"".join(tds)}</tr>')
    return f'<table class="{"large" if n > 6 else ""}"><colgroup>{cols}</colgroup><thead><tr>{th}</tr></thead><tbody>{"".join(rows)}</tbody></table>'

def corps():
    out = []
    for b in C.blocs():
        k = b[0]
        if k == "h1": out.append(f'<h1 class="chapitre">{escape(b[1])}</h1>')
        elif k == "h2": out.append(f"<h2>{escape(b[1])}</h2>")
        elif k == "h3": out.append(f"<h3>{escape(b[1])}</h3>")
        elif k == "p": out.append(f"<p>{escape(b[1])}</p>")
        elif k == "note": out.append(f'<p class="note">{escape(b[1])}</p>')
        elif k == "ul": out.append("<ul>" + "".join(f"<li>{escape(i)}</li>" for i in b[1]) + "</ul>")
        elif k == "table": out.append(table(b[1]))
    return "\n".join(out)

def sommaire():
    items = "".join(f'<li class="n{niv}">{escape(t)}</li>' for t, niv in C.SOMMAIRE)
    return f'<section class="page sommaire"><h1>Sommaire</h1><ul>{items}</ul></section>'

def couverture():
    cv = C.COUVERTURE
    return f'''<section class="couv">
  <div class="couv__halo"></div>
  <div class="couv__logos"><img class="couv__elite" src="data:image/png;base64,{b64('logo_elite.png')}" alt=""><img class="couv__ecl" src="data:image/jpeg;base64,{b64('ecl_logo.jpg')}" alt=""></div>
  <p class="couv__sur">{escape(cv['titre'])}</p>
  <h1 class="couv__titre">Elite<br><span>Football Academy</span></h1>
  <p class="couv__sous">{escape(cv['sous'])}</p>
  <p class="couv__slogan">{escape(cv['slogan'])}</p>
  <div class="couv__bloc"><small>{escape(cv['fondateur_libelle'])}</small><b>{escape(cv['fondateur'])}</b><span>{escape(cv['capital'])}</span><span>{escape(cv['forme'])}</span></div>
  <div class="couv__pied"><span>{escape(cv['redaction'])}</span><b>{escape(cv['ecole'])}</b><span>{escape(cv['date'])}</span></div>
</section>'''

def page():
    fonts = {"sora": "../public/fonts/sora-latin.woff2", "sora_ext": "../public/fonts/sora-latin-ext.woff2", "manrope": "../public/fonts/manrope-latin-wght-normal.woff2", "manrope_ext": "../public/fonts/manrope-latin-ext-wght-normal.woff2"}
    css = f'''
@font-face {{ font-family: "Sora"; src: {font(fonts['sora_ext'])}; font-weight: 100 800; unicode-range: U+0100-02BA, U+1E00-1EFF; }}
@font-face {{ font-family: "Sora"; src: {font(fonts['sora'])}; font-weight: 100 800; }}
@font-face {{ font-family: "Manrope"; src: {font(fonts['manrope_ext'])}; font-weight: 200 800; unicode-range: U+0100-02BA, U+1E00-1EFF; }}
@font-face {{ font-family: "Manrope"; src: {font(fonts['manrope'])}; font-weight: 200 800; }}
:root {{ --vert: #1B4332; --or: #8C6F3D; --or-clair: #F3EEE1; --nuit: #121A15; --gris: #555555; --ligne: #D9D4C7; --creme: #F6F3EC; }}
* {{ box-sizing: border-box; }}
@page {{ size: A4; margin: 20mm 18mm 20mm 18mm; }}
html, body {{ margin: 0; padding: 0; }}
body {{ font-family: "Manrope", Calibri, sans-serif; font-size: 10.5pt; line-height: 1.5; color: var(--nuit); }}
.couv {{ position: relative; height: 257mm; margin: -20mm -18mm 0; padding: 22mm 20mm; background: #050807; color: var(--creme); overflow: hidden; page-break-after: always; }}
.couv__halo {{ position: absolute; left: 50%; top: 36%; width: 122mm; height: 122mm; margin: -61mm 0 0 -61mm; border-radius: 50%; background: #050807; box-shadow: 0 0 0 1.5mm rgba(246,243,236,.9), 0 0 18mm 6mm rgba(214,190,110,.55), 0 0 60mm 20mm rgba(31,138,76,.35); }}
.couv__halo::after {{ content: ""; position: absolute; inset: 0; border-radius: 50%; background: #050807; }}
.couv__logos {{ position: relative; display: flex; justify-content: space-between; align-items: center; }}
.couv__elite {{ width: 30mm; height: 30mm; border-radius: 50%; background: #fff; padding: 1mm; }}
.couv__ecl {{ width: 44mm; background: #fff; padding: 2mm; border-radius: 2mm; }}
.couv__sur {{ position: relative; margin: 26mm 0 4mm; font-family: "Sora", sans-serif; font-weight: 700; font-size: 10pt; letter-spacing: .3em; text-transform: uppercase; color: #d4af37; text-align: center; }}
.couv__titre {{ position: relative; margin: 0; font-family: "Sora", sans-serif; font-weight: 800; font-size: 44pt; letter-spacing: .14em; line-height: 1; text-align: center; color: #fff; }}
.couv__titre span {{ display: block; font-size: 16pt; letter-spacing: .32em; font-weight: 600; color: rgba(246,243,236,.72); margin-top: 3mm; text-transform: uppercase; }}
.couv__sous {{ position: relative; text-align: center; margin: 8mm 0 2mm; font-size: 11pt; color: rgba(246,243,236,.85); }}
.couv__slogan {{ position: relative; text-align: center; margin: 0 0 36mm; font-family: "Sora", sans-serif; font-weight: 600; font-size: 13pt; color: #d4af37; }}
.couv__bloc {{ position: relative; display: grid; justify-items: center; gap: 1.2mm; text-align: center; }}
.couv__bloc small {{ font-family: "Sora", sans-serif; font-size: 8pt; letter-spacing: .26em; text-transform: uppercase; color: rgba(246,243,236,.6); }}
.couv__bloc b {{ font-family: "Sora", sans-serif; font-size: 16pt; font-weight: 700; color: #fff; margin-bottom: 2mm; }}
.couv__bloc span {{ font-size: 9.5pt; color: rgba(246,243,236,.8); max-width: 150mm; }}
.couv__pied {{ position: absolute; left: 20mm; right: 20mm; bottom: 16mm; display: grid; justify-items: center; gap: 1mm; text-align: center; font-size: 9.5pt; color: rgba(246,243,236,.75); }}
.couv__pied b {{ font-family: "Sora", sans-serif; color: #d4af37; font-weight: 700; }}
.sommaire {{ page-break-after: always; }}
.sommaire h1, h1.chapitre {{ font-family: "Sora", sans-serif; font-weight: 800; font-size: 20pt; letter-spacing: -.02em; color: var(--vert); margin: 0 0 6mm; padding-bottom: 2.5mm; border-bottom: 1.2pt solid var(--or); }}
h1.chapitre {{ page-break-before: always; }}
.sommaire ul {{ list-style: none; padding: 0; margin: 0; }}
.sommaire li {{ padding: 1.2mm 0; border-bottom: .3pt solid var(--ligne); }}
.sommaire li.n0 {{ font-family: "Sora", sans-serif; font-weight: 700; color: var(--vert); margin-top: 2.5mm; }}
.sommaire li.n1 {{ padding-left: 6mm; font-weight: 600; }}
.sommaire li.n2 {{ padding-left: 12mm; color: var(--gris); }}
h2 {{ font-family: "Sora", sans-serif; font-weight: 700; font-size: 14pt; color: var(--or); margin: 8mm 0 3mm; page-break-after: avoid; }}
h3 {{ font-family: "Sora", sans-serif; font-weight: 700; font-size: 11.5pt; color: var(--nuit); margin: 6mm 0 2mm; page-break-after: avoid; }}
p {{ margin: 0 0 3mm; text-align: justify; hyphens: auto; }}
p.note {{ font-size: 9pt; color: var(--gris); font-style: italic; }}
ul {{ margin: 0 0 3mm; padding-left: 6mm; }}
li {{ margin-bottom: 1.5mm; padding-left: 1mm; }}
li::marker {{ color: var(--or); }}
table {{ width: 100%; border-collapse: collapse; margin: 2mm 0 5mm; font-size: 9.2pt; page-break-inside: auto; table-layout: fixed; }}
table.large {{ font-size: 7.6pt; }}
thead {{ display: table-header-group; }}
tr {{ page-break-inside: avoid; }}
th {{ background: var(--vert); color: #fff; font-family: "Sora", sans-serif; font-weight: 700; font-size: 8.4pt; padding: 1.8mm 2mm; text-align: left; border: .4pt solid #BFBFBF; }}
th:not(:first-child) {{ text-align: center; }}
td {{ padding: 1.4mm 2mm; border: .4pt solid #BFBFBF; vertical-align: top; }}
td.num {{ text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }}
td.centre {{ text-align: center; }}
tr.total td {{ background: var(--or-clair); color: var(--vert); font-weight: 700; }}
tr.section td {{ background: #F2F2F2; color: var(--gris); font-weight: 700; font-size: 8pt; letter-spacing: .06em; }}
'''
    return f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Business plan — Elite Football Academy</title><style>{css}</style></head><body>{couverture()}{sommaire()}<main>{corps()}</main></body></html>'

if __name__ == "__main__":
    import sys
    out = sys.argv[1] if len(sys.argv) > 1 else "business-plan.html"
    open(out, "w", encoding="utf-8").write(page()); print("écrit :", out, os.path.getsize(out) // 1024, "Ko")
