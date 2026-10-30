# -*- coding: utf-8 -*-
"""Génère le business plan au format Word (.docx) à partir des blocs de contenu.py, sans dépendance externe :
le paquet OOXML est écrit à la main (document, styles, numérotation, pied de page, images)."""
import zipfile, struct, io
from xml.sax.saxutils import escape
import contenu as C

VERT, OR, NUIT, GRIS, GRIS_CLAIR, OR_CLAIR = "1B4332", "8C6F3D", "121A15", "555555", "F2F2F2", "F3EEE1"
FONT = "Calibri"

def rpr(bold=False, italic=False, size=22, color=None, caps=False):
    x = f'<w:rFonts w:ascii="{FONT}" w:hAnsi="{FONT}" w:cs="{FONT}" w:eastAsia="{FONT}"/>'
    if bold: x += "<w:b/><w:bCs/>"
    if italic: x += "<w:i/><w:iCs/>"
    if caps: x += "<w:caps/>"
    if color: x += f'<w:color w:val="{color}"/>'
    x += f'<w:sz w:val="{size}"/><w:szCs w:val="{size}"/>'
    return f"<w:rPr>{x}</w:rPr>"

def run(text, **k):
    parts = text.split("\n")
    out = []
    for i, p in enumerate(parts):
        if i: out.append(f"<w:r>{rpr(**k)}<w:br/></w:r>")
        out.append(f'<w:r>{rpr(**k)}<w:t xml:space="preserve">{escape(p)}</w:t></w:r>')
    return "".join(out)

def para(text, style=None, jc=None, before=0, after=120, line=276, keep=False, pagebreak=False, ind=None, **k):
    ppr = ""
    if style: ppr += f'<w:pStyle w:val="{style}"/>'
    if keep: ppr += "<w:keepNext/>"
    if pagebreak: ppr += "<w:pageBreakBefore/>"
    ppr += f'<w:spacing w:before="{before}" w:after="{after}" w:line="{line}" w:lineRule="auto"/>'
    if ind: ppr += ind
    if jc: ppr += f'<w:jc w:val="{jc}"/>'
    return f"<w:p><w:pPr>{ppr}</w:pPr>{run(text, **k) if text else ''}</w:p>"

def bullet(text):
    ppr = '<w:pStyle w:val="ListParagraph"/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr><w:spacing w:before="0" w:after="80" w:line="264" w:lineRule="auto"/><w:ind w:left="567" w:hanging="283"/>'
    return f"<w:p><w:pPr>{ppr}</w:pPr>{run(text, size=22, color=NUIT)}</w:p>"

def cell(text, width_pct, fill=None, bold=False, color=NUIT, jc="left", size=19, italic=False):
    tcpr = f'<w:tcW w:type="pct" w:w="{width_pct}%"/>'
    if fill: tcpr += f'<w:shd w:val="clear" w:color="auto" w:fill="{fill}"/>'
    tcpr += '<w:tcMar><w:top w:type="dxa" w:w="50"/><w:left w:type="dxa" w:w="90"/><w:bottom w:type="dxa" w:w="50"/><w:right w:type="dxa" w:w="90"/></w:tcMar><w:vAlign w:val="center"/>'
    p = f'<w:p><w:pPr><w:spacing w:before="20" w:after="20" w:line="240" w:lineRule="auto"/><w:jc w:val="{jc}"/></w:pPr>{run(text, bold=bold, color=color, size=size, italic=italic) if text else ""}</w:p>'
    return f"<w:tc><w:tcPr>{tcpr}</w:tcPr>{p}</w:tc>"

def est_nombre(s):
    s = s.replace(" ", "").replace(" ", "").replace("%", "").replace(",", ".").replace("×", "").replace("+", "").replace("-", "").replace("—", "")
    try: float(s); return True
    except ValueError: return False

def table(spec):
    tete, lignes, larg, totaux, sections = spec["tete"], spec["lignes"], spec["larg"], spec["totaux"], spec["sections"]
    n = len(tete)
    if not larg: larg = [round(100 / n)] * n
    borders = "".join(f'<w:{b} w:val="single" w:sz="4" w:space="0" w:color="BFBFBF"/>' for b in ("top", "left", "bottom", "right", "insideH", "insideV"))
    x = f'<w:tbl><w:tblPr><w:tblW w:type="pct" w:w="100%"/><w:tblBorders>{borders}</w:tblBorders><w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:type="dxa" w:w="90"/><w:right w:type="dxa" w:w="90"/></w:tblCellMar></w:tblPr>'
    x += "<w:tblGrid>" + "".join(f'<w:gridCol w:w="{int(w * 99)}"/>' for w in larg) + "</w:tblGrid>"
    x += "<w:tr><w:trPr><w:tblHeader/><w:cantSplit/></w:trPr>" + "".join(cell(h, larg[i], fill=VERT, bold=True, color="FFFFFF", jc="center" if i else "left", size=18) for i, h in enumerate(tete)) + "</w:tr>"
    for r, ligne in enumerate(lignes):
        tot, sec = r in totaux, r in sections
        fill = OR_CLAIR if tot else (GRIS_CLAIR if sec else None)
        x += "<w:tr><w:trPr><w:cantSplit/></w:trPr>"
        for i, v in enumerate(ligne):
            v = str(v)
            jc = "right" if (i and est_nombre(v) and v.strip() not in ("—", "")) else ("center" if (i and len(v) <= 4) else "left")
            x += cell(v, larg[i], fill=fill, bold=(tot or sec or (i == 0 and n > 2 and False)), color=VERT if tot else (GRIS if sec else NUIT), jc=jc, size=19 if n <= 5 else 16)
        x += "</w:tr>"
    x += "</w:tbl>" + para("", after=160)
    return x

def image_xml(rid, cx, cy, pid, name):
    return (f'<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="{cx}" cy="{cy}"/><wp:effectExtent l="0" t="0" r="0" b="0"/>'
            f'<wp:docPr id="{pid}" name="{escape(name)}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr>'
            f'<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">'
            f'<pic:nvPicPr><pic:cNvPr id="{pid}" name="{escape(name)}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="{rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>'
            f'<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>')

def dims(path):
    d = open(path, "rb").read()
    if d[:8] == b"\x89PNG\r\n\x1a\n": return struct.unpack(">II", d[16:24])
    i = 2
    while i < len(d):
        if d[i] != 0xFF: i += 1; continue
        m = d[i + 1]
        if m in (0xC0, 0xC1, 0xC2): return struct.unpack(">H", d[i + 7:i + 9])[0], struct.unpack(">H", d[i + 5:i + 7])[0]
        i += 2 + struct.unpack(">H", d[i + 2:i + 4])[0]
    return 100, 100

def couverture():
    cv = C.COUVERTURE
    x = ""
    # logos : Elite à gauche, école à droite (tableau sans bordure)
    we, he = dims("logo_elite.png"); wc, hc = dims("ecl_logo.jpg")
    cx_e = 1_300_000; cy_e = int(cx_e * he / we)
    cx_c = 1_700_000; cy_c = int(cx_c * hc / wc)
    nob = "".join(f'<w:{b} w:val="nil"/>' for b in ("top", "left", "bottom", "right", "insideH", "insideV"))
    x += f'<w:tbl><w:tblPr><w:tblW w:type="pct" w:w="100%"/><w:tblBorders>{nob}</w:tblBorders></w:tblPr><w:tblGrid><w:gridCol w:w="4950"/><w:gridCol w:w="4950"/></w:tblGrid><w:tr>'
    x += f'<w:tc><w:tcPr><w:tcW w:type="pct" w:w="50%"/></w:tcPr><w:p><w:pPr><w:jc w:val="left"/></w:pPr>{image_xml("rIdLogo", cx_e, cy_e, 101, "Logo Elite Football Academy")}</w:p></w:tc>'
    x += f'<w:tc><w:tcPr><w:tcW w:type="pct" w:w="50%"/><w:vAlign w:val="center"/></w:tcPr><w:p><w:pPr><w:jc w:val="right"/></w:pPr>{image_xml("rIdEcl", cx_c, cy_c, 102, "Logo École de Commerce de Lyon")}</w:p></w:tc></w:tr></w:tbl>'
    x += para("", before=1800, after=0)
    x += para(cv["titre"], jc="center", before=0, after=120, bold=True, size=72, color=VERT, caps=True)
    x += para(cv["societe"], jc="center", after=80, bold=True, size=40, color=NUIT)
    x += para(cv["sous"], jc="center", after=80, size=26, color=GRIS)
    x += para(cv["slogan"], jc="center", after=600, italic=True, size=28, color=OR)
    x += para(cv["fondateur_libelle"], jc="center", after=20, size=20, color=GRIS, caps=True)
    x += para(cv["fondateur"], jc="center", after=360, bold=True, size=30, color=NUIT)
    x += para(cv["capital"], jc="center", after=60, size=21, color=NUIT)
    x += para(cv["forme"], jc="center", after=900, size=21, color=NUIT)
    x += para(cv["redaction"], jc="center", after=40, size=21, color=NUIT)
    x += para(cv["ecole"], jc="center", after=40, bold=True, size=22, color=VERT)
    x += para(cv["date"], jc="center", after=0, size=21, color=GRIS)
    x += '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'
    return x

def sommaire():
    x = para("SOMMAIRE", style="Heading1", after=240, bold=True, size=36, color=VERT)
    for titre, niv in C.SOMMAIRE:
        ind = f'<w:ind w:left="{niv * 420}"/>'
        x += para(titre, after=40, before=60 if niv == 0 else 0, bold=(niv == 0), size=22 if niv == 0 else 21, color=VERT if niv == 0 else NUIT, ind=ind)
    x += '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'
    return x

def corps():
    x = ""
    premier_h1 = True
    for b in C.blocs():
        k = b[0]
        if k == "h1":
            x += para(b[1], style="Heading1", before=0, after=200, bold=True, size=34, color=VERT, keep=True, pagebreak=True)
        elif k == "h2":
            x += para(b[1], style="Heading2", before=280, after=140, bold=True, size=27, color=OR, keep=True)
        elif k == "h3":
            x += para(b[1], style="Heading3", before=220, after=100, bold=True, size=23, color=NUIT, keep=True)
        elif k == "p":
            x += para(b[1], after=140, jc="both", size=22, color=NUIT)
        elif k == "note":
            x += para(b[1], after=160, jc="both", size=19, color=GRIS, italic=True)
        elif k == "ul":
            for item in b[1]: x += bullet(item)
            x += para("", after=60)
        elif k == "table":
            x += table(b[1])
    return x

def document():
    ns = ('xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
          'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"')
    sect = ('<w:sectPr><w:footerReference w:type="default" r:id="rIdFooter"/><w:pgSz w:w="11906" w:h="16838" w:orient="portrait"/>'
            '<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/><w:pgNumType w:start="1"/><w:titlePg/><w:docGrid w:linePitch="360"/></w:sectPr>')
    return f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document {ns}><w:body>{couverture()}{sommaire()}{corps()}{sect}</w:body></w:document>'

def styles():
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="{FONT}" w:hAnsi="{FONT}" w:cs="{FONT}" w:eastAsia="{FONT}"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="fr-FR"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:color w:val="{VERT}"/><w:sz w:val="34"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:color w:val="{OR}"/><w:sz w:val="27"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:outlineLvl w:val="2"/></w:pPr><w:rPr><w:b/><w:color w:val="{NUIT}"/><w:sz w:val="23"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:ind w:left="720"/><w:contextualSpacing/></w:pPr></w:style>
<w:style w:type="paragraph" w:styleId="Footer"><w:name w:val="footer"/><w:basedOn w:val="Normal"/></w:style>
<w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:tblPr><w:tblInd w:w="0" w:type="dxa"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="108" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style>
</w:styles>'''

def numbering():
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="hybridMultilevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="567" w:hanging="283"/></w:pPr><w:rPr><w:rFonts w:ascii="{FONT}" w:hAnsi="{FONT}"/><w:color w:val="{OR}"/></w:rPr></w:lvl></w:abstractNum>
<w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
</w:numbering>'''

def footer():
    r = lambda t, **k: run(t, **k)
    return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
            '<w:p><w:pPr><w:pStyle w:val="Footer"/><w:pBdr><w:top w:val="single" w:sz="4" w:space="4" w:color="BFBFBF"/></w:pBdr><w:tabs><w:tab w:val="right" w:pos="9638"/></w:tabs><w:spacing w:after="0"/></w:pPr>'
            + r("Elite Football Academy SARL — Business plan — " + C.COUVERTURE["date"], size=16, color=GRIS)
            + '<w:r><w:rPr><w:sz w:val="16"/></w:rPr><w:tab/></w:r>'
            + r("Page ", size=16, color=GRIS)
            + '<w:r><w:rPr><w:sz w:val="16"/><w:color w:val="' + GRIS + '"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:rPr><w:sz w:val="16"/><w:color w:val="' + GRIS + '"/></w:rPr><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r><w:r><w:rPr><w:sz w:val="16"/><w:color w:val="' + GRIS + '"/></w:rPr><w:fldChar w:fldCharType="end"/></w:r>'
            '</w:p></w:ftr>')

def generer(sortie):
    parts = {
        "[Content_Types].xml": '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Default Extension="jpg" ContentType="image/jpeg"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>',
        "_rels/.rels": '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>',
        "word/_rels/document.xml.rels": '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rIdNum" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/><Relationship Id="rIdFooter" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/><Relationship Id="rIdLogo" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/logo_elite.png"/><Relationship Id="rIdEcl" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/ecl_logo.jpg"/></Relationships>',
        "docProps/core.xml": '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>Business plan — Elite Football Academy SARL</dc:title><dc:creator>Mihindou Hindet Ange</dc:creator><dc:language>fr-FR</dc:language></cp:coreProperties>',
        "docProps/app.xml": '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Microsoft Office Word</Application></Properties>',
        "word/styles.xml": styles(), "word/numbering.xml": numbering(), "word/footer1.xml": footer(), "word/document.xml": document(),
    }
    with zipfile.ZipFile(sortie, "w", zipfile.ZIP_DEFLATED) as z:
        for n, c in parts.items(): z.writestr(n, c.encode("utf-8") if isinstance(c, str) else c)
        z.write("logo_elite.png", "word/media/logo_elite.png"); z.write("ecl_logo.jpg", "word/media/ecl_logo.jpg")
    return sortie

if __name__ == "__main__":
    import sys
    out = sys.argv[1] if len(sys.argv) > 1 else "../livrables/Elite_Football_BusinessPlan_v1.docx"
    generer(out); print("écrit :", out)
