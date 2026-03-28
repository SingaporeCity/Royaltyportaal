#!/usr/bin/env python3
"""Generate Auteursportaal CEO pitch deck v2 — full story"""

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

# Noordhoff colors
TEAL = RGBColor(0, 116, 96)
TEAL_DARK = RGBColor(0, 70, 57)
TEAL_LIGHT = RGBColor(240, 250, 247)
CORAL = RGBColor(232, 115, 74)
AMBER = RGBColor(245, 158, 11)
WHITE = RGBColor(255, 255, 255)
TEXT = RGBColor(17, 24, 39)
TEXT_LIGHT = RGBColor(107, 114, 128)
BORDER = RGBColor(229, 231, 235)
RED_BG = RGBColor(254, 242, 242)
GREEN_BG = RGBColor(240, 253, 244)
AMBER_BG = RGBColor(255, 251, 235)
BG = RGBColor(247, 248, 250)

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)
W = prs.slide_width
H = prs.slide_height

# ── Helpers ──

def gradient_bg(slide):
    s = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, W, H)
    s.fill.gradient()
    s.fill.gradient_stops[0].color.rgb = RGBColor(0, 116, 96)
    s.fill.gradient_stops[0].position = 0.0
    s.fill.gradient_stops[1].color.rgb = RGBColor(0, 50, 42)
    s.fill.gradient_stops[1].position = 1.0
    s.line.fill.background()

def solid_bg(slide, color=WHITE):
    bg = slide.background; bg.fill.solid(); bg.fill.fore_color.rgb = color

def txt(slide, l, t, w, h, text, sz=14, bold=False, color=TEXT, align=PP_ALIGN.LEFT, spacing=None):
    box = slide.shapes.add_textbox(l, t, w, h)
    tf = box.text_frame; tf.word_wrap = True
    for i, line in enumerate(text.split('\n')):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.text = line; p.font.size = Pt(sz); p.font.bold = bold
        p.font.color.rgb = color; p.font.name = 'Roboto Flex'; p.alignment = align
        if spacing: p.space_after = Pt(spacing)
    return box

def card(slide, l, t, w, h, fill=BG, border=None, radius=0.04):
    s = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, l, t, w, h)
    s.fill.solid(); s.fill.fore_color.rgb = fill
    if border: s.line.color.rgb = border; s.line.width = Pt(1.5)
    else: s.line.fill.background()
    s.adjustments[0] = radius
    return s

def dot(slide, l, t, color=TEAL, size=Inches(0.1)):
    d = slide.shapes.add_shape(MSO_SHAPE.OVAL, l, t, size, size)
    d.fill.solid(); d.fill.fore_color.rgb = color; d.line.fill.background()

def divider(slide, l, t, w, color=BORDER):
    s = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, l, t, w, Pt(1))
    s.fill.solid(); s.fill.fore_color.rgb = color; s.line.fill.background()

def eyebrow(slide, t, text):
    txt(slide, Inches(1.2), t, Inches(6), Inches(0.3), text, sz=10, bold=True, color=TEAL)

def title(slide, t, text, sz=32):
    txt(slide, Inches(1.2), t, Inches(11), Inches(1), text, sz=sz, bold=True, color=TEAL)

def stat_pill(slide, l, t, value, label, highlight=False):
    bg = TEAL if highlight else WHITE
    vc = WHITE if highlight else TEAL
    lc = RGBColor(180, 220, 210) if highlight else TEXT_LIGHT
    card(slide, l, t, Inches(2.5), Inches(1.5), fill=bg, border=None if highlight else BORDER)
    txt(slide, l, t + Inches(0.25), Inches(2.5), Inches(0.7), value, sz=30, bold=True, color=vc, align=PP_ALIGN.CENTER)
    txt(slide, l, t + Inches(0.85), Inches(2.5), Inches(0.5), label, sz=10, color=lc, align=PP_ALIGN.CENTER)


# ════════════════════════════════════════════
# SLIDE 1: TITEL
# ════════════════════════════════════════════
s = prs.slides.add_slide(prs.slide_layouts[6])
gradient_bg(s)
txt(s, 0, Inches(2.0), W, Inches(1), 'AUTEURSPORTAAL', sz=56, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
txt(s, Inches(2.5), Inches(3.2), Inches(8.3), Inches(0.8), 'Het digitale platform voor royalty-afrekeningen,\ncontracten en prognoses van auteurs', sz=18, color=RGBColor(190, 225, 218), align=PP_ALIGN.CENTER, spacing=6)
# Subtle divider
divider(s, Inches(5.5), Inches(4.4), Inches(2.3), color=RGBColor(0, 150, 125))
txt(s, 0, Inches(4.8), W, Inches(0.5), 'Noordhoff  ·  Liber  ·  Plantyn', sz=14, color=RGBColor(120, 180, 165), align=PP_ALIGN.CENTER)
txt(s, 0, Inches(6.2), W, Inches(0.4), 'Patrick Jeeninga  —  Maart 2026', sz=12, color=RGBColor(100, 160, 145), align=PP_ALIGN.CENTER)


# ════════════════════════════════════════════
# SLIDE 2: CONTEXT — Waarom nu?
# ════════════════════════════════════════════
s = prs.slides.add_slide(prs.slide_layouts[6])
solid_bg(s)
eyebrow(s, Inches(0.8), 'CONTEXT')
title(s, Inches(1.15), 'Waarom nu?')

card(s, Inches(1.2), Inches(2.5), Inches(5.3), Inches(2.0), fill=TEAL_LIGHT)
txt(s, Inches(1.6), Inches(2.7), Inches(4.5), Inches(0.35), 'Aandeelhouders', sz=14, bold=True, color=TEAL)
txt(s, Inches(1.6), Inches(3.1), Inches(4.5), Inches(1.2), 'De aandeelhouders van Noordhoff pushen actief op\nmeer digitalisatie. Het Auteursportaal is een concrete,\nzichtbare stap die direct waarde levert.', sz=13, color=TEXT_LIGHT, spacing=4)

card(s, Inches(6.9), Inches(2.5), Inches(5.3), Inches(2.0), fill=TEAL_LIGHT)
txt(s, Inches(7.3), Inches(2.7), Inches(4.5), Inches(0.35), 'Value Creation Plan', sz=14, bold=True, color=TEAL)
txt(s, Inches(7.3), Inches(3.1), Inches(4.5), Inches(1.2), 'Dit portaal past direct binnen het Value Creation Plan\nals digitaal verbeterproject. Schaalbaar naar Liber\nen Plantyn zonder proportionele meerkosten.', sz=13, color=TEXT_LIGHT, spacing=4)

card(s, Inches(1.2), Inches(4.9), Inches(5.3), Inches(2.0), fill=AMBER_BG)
txt(s, Inches(1.6), Inches(5.1), Inches(4.5), Inches(0.35), 'Auteurstevredenheid onder druk', sz=14, bold=True, color=RGBColor(146, 96, 0))
txt(s, Inches(1.6), Inches(5.5), Inches(4.5), Inches(1.2), '250 auteurs nemen jaarlijks contact op met vragen\nover hun afrekening. Onzekerheid door gebrek aan\ncommunicatie en transparantie.', sz=13, color=TEXT_LIGHT, spacing=4)

card(s, Inches(6.9), Inches(4.9), Inches(5.3), Inches(2.0), fill=RED_BG)
txt(s, Inches(7.3), Inches(5.1), Inches(4.5), Inches(0.35), 'Concurrentiepositie', sz=14, bold=True, color=CORAL)
txt(s, Inches(7.3), Inches(5.5), Inches(4.5), Inches(1.2), 'Auteurs vergelijken hun ervaring bij Noordhoff met\nandere uitgevers. Een modern portaal is een\nconcurrentievoordeel bij het aantrekken van talent.', sz=13, color=TEXT_LIGHT, spacing=4)


# ════════════════════════════════════════════
# SLIDE 3: HET PROBLEEM — Auteursperspectief
# ════════════════════════════════════════════
s = prs.slides.add_slide(prs.slide_layouts[6])
solid_bg(s)
eyebrow(s, Inches(0.8), 'HET PROBLEEM')
title(s, Inches(1.15), 'Hoe ervaart de auteur het nu?')

# Quote style
card(s, Inches(1.2), Inches(2.5), Inches(11), Inches(1.6), fill=BG, border=BORDER)
txt(s, Inches(1.6), Inches(2.6), Inches(0.5), Inches(0.6), '"', sz=48, bold=True, color=TEAL)
txt(s, Inches(2.1), Inches(2.8), Inches(9.5), Inches(1), 'Ik heb in maart een brief ontvangen, maar ik begrijp de berekening niet.\nKan iemand mij bellen? Ik wil ook graag weten of mijn contract nog loopt.', sz=15, color=TEXT, spacing=5)
txt(s, Inches(2.1), Inches(3.6), Inches(9), Inches(0.3), '— Typische auteursvraag (1 van 250 per jaar)', sz=11, color=TEXT_LIGHT)

# Pain points
pains = [
    ('1 brief per jaar', 'De enige communicatie over royalties is\neen jaarlijkse brief in maart. De rest\nvan het jaar: stilte.'),
    ('Geen inzicht', 'Auteurs kunnen niet zelf opzoeken\nhoe hun methode presteert. Ze zijn\nvolledig afhankelijk van Noordhoff.'),
    ('Onzekerheid', '250 auteurs bellen of mailen jaarlijks\nmet vragen. Dat is 10% van alle auteurs\ndie actief onzeker is.'),
]
for i, (t, d) in enumerate(pains):
    left = Inches(1.2 + i * 3.7)
    card(s, left, Inches(4.6), Inches(3.4), Inches(2.5), fill=WHITE, border=BORDER)
    dot(s, left + Inches(0.4), Inches(4.85), color=CORAL)
    txt(s, left + Inches(0.65), Inches(4.75), Inches(2.5), Inches(0.35), t, sz=14, bold=True, color=TEXT)
    txt(s, left + Inches(0.4), Inches(5.3), Inches(2.6), Inches(1.5), d, sz=12, color=TEXT_LIGHT, spacing=4)


# ════════════════════════════════════════════
# SLIDE 4: HET PROBLEEM — Noordhoff-perspectief
# ════════════════════════════════════════════
s = prs.slides.add_slide(prs.slide_layouts[6])
solid_bg(s)
eyebrow(s, Inches(0.8), 'HET PROBLEEM')
title(s, Inches(1.15), 'Wat kost het Noordhoff nu?')

# Big stat pills (like admin dashboard)
stat_pill(s, Inches(1.2), Inches(2.4), '€10.000', 'Postkosten per jaar\n(3 organisaties)')
stat_pill(s, Inches(4.0), Inches(2.4), '32 uur', 'Brieven inpakken\n(2 man × 2 dagen)')
stat_pill(s, Inches(6.8), Inches(2.4), '250', 'Auteurs met vragen\nper jaar')
stat_pill(s, Inches(9.6), Inches(2.4), '0', 'Digitaal inzicht\nvoor auteurs')

# Hidden costs
txt(s, Inches(1.2), Inches(4.4), Inches(11), Inches(0.4), 'Verborgen kosten die niet op de factuur staan:', sz=14, bold=True, color=TEXT)

hidden = [
    ('Afhandeling auteursvragen', '250 vragen × gem. 30 min = 125 uur per jaar', '~€5.000'),
    ('Fysieke verwerking', '2 medewerkers × 2 dagen printen, vouwen, inpakken', '~€2.500'),
    ('Reputatierisico', 'Auteurs ervaren Noordhoff als ouderwets en niet-transparant', '—'),
    ('Auteursverlies', 'Frustratie leidt tot overstap naar concurrent', '—'),
]
for i, (item, detail, cost) in enumerate(hidden):
    top = Inches(4.9 + i * 0.55)
    dot(s, Inches(1.4), top + Inches(0.12), color=CORAL, size=Inches(0.08))
    txt(s, Inches(1.65), top, Inches(3.5), Inches(0.45), item, sz=13, bold=True, color=TEXT)
    txt(s, Inches(5.2), top, Inches(5), Inches(0.45), detail, sz=12, color=TEXT_LIGHT)
    txt(s, Inches(10.5), top, Inches(1.5), Inches(0.45), cost, sz=13, bold=True, color=CORAL, align=PP_ALIGN.RIGHT)

divider(s, Inches(1.2), Inches(7.1), Inches(11), color=TEAL)
txt(s, Inches(1.2), Inches(7.15), Inches(8), Inches(0.3), 'Totale kosten huidige situatie', sz=13, bold=True, color=TEAL)
txt(s, Inches(10.5), Inches(7.15), Inches(1.5), Inches(0.3), '~€18.000', sz=13, bold=True, color=TEAL, align=PP_ALIGN.RIGHT)


# ════════════════════════════════════════════
# SLIDE 5: OUD VS NIEUW
# ════════════════════════════════════════════
s = prs.slides.add_slide(prs.slide_layouts[6])
solid_bg(s)
eyebrow(s, Inches(0.8), 'DE TRANSFORMATIE')
title(s, Inches(1.15), 'Van papier naar portaal')

# Old
card(s, Inches(1.2), Inches(2.4), Inches(5), Inches(4.5), fill=RED_BG, border=RGBColor(254, 202, 202))
txt(s, Inches(1.6), Inches(2.6), Inches(4), Inches(0.4), 'Nu: fysieke post', sz=18, bold=True, color=CORAL)
old = ['1× per jaar een royalty-brief', 'Geen tussentijds inzicht', 'Vragen via email en telefoon', 'Contracten in archiefkast', 'Geen prognose mogelijk', 'Gegevenswijziging per formulier', 'Brieven handmatig inpakken', 'Geen inzicht in auteuractiviteit']
for j, item in enumerate(old):
    txt(s, Inches(1.6), Inches(3.3 + j * 0.42), Inches(4.2), Inches(0.4), f'✗  {item}', sz=12, color=TEXT_LIGHT)

# Arrow
txt(s, Inches(6.15), Inches(4.2), Inches(0.8), Inches(0.8), '→', sz=36, bold=True, color=TEAL, align=PP_ALIGN.CENTER)

# New
card(s, Inches(7.1), Inches(2.4), Inches(5), Inches(4.5), fill=GREEN_BG, border=RGBColor(167, 243, 208))
txt(s, Inches(7.5), Inches(2.6), Inches(4), Inches(0.4), 'Straks: het Auteursportaal', sz=18, bold=True, color=TEAL)
new = ['24/7 inzicht in afrekeningen', 'Realtime royalty-overzicht per jaar', 'FAQ en rondleiding in het portaal', 'Contracten direct inzien en downloaden', 'Prognose met min/max range', 'Wijzigingen digitaal aanvragen', 'Bulk upload + automatisch versturen', 'Activiteiten feed voor admin']
for j, item in enumerate(new):
    txt(s, Inches(7.5), Inches(3.3 + j * 0.42), Inches(4.2), Inches(0.4), f'✓  {item}', sz=12, color=TEXT)


# ════════════════════════════════════════════
# SLIDE 6: DE OPLOSSING
# ════════════════════════════════════════════
s = prs.slides.add_slide(prs.slide_layouts[6])
solid_bg(s)
eyebrow(s, Inches(0.8), 'DE OPLOSSING')
title(s, Inches(1.15), 'Eén portaal, twee dashboards')

# Auteur side
card(s, Inches(1.2), Inches(2.4), Inches(5.3), Inches(4.6), fill=TEAL_LIGHT, border=TEAL)
txt(s, Inches(1.6), Inches(2.6), Inches(4.5), Inches(0.4), 'Auteursdashboard', sz=18, bold=True, color=TEAL)
txt(s, Inches(1.6), Inches(3.1), Inches(4.5), Inches(0.35), 'Wat de auteur ziet:', sz=11, bold=True, color=TEXT_LIGHT)
auteur_features = [
    'Jaaroverzicht met royalty-totalen',
    'Afrekeningen zoeken, filteren, downloaden',
    'Contracten inzien met PDF preview',
    'Prognose komend jaar (min—max)',
    'Declaraties indienen met PDF upload',
    'Persoonlijke gegevens beheren',
    'Interactieve royalty-grafiek per type',
    'FAQ, guided tour, command palette (⌘K)',
]
for j, item in enumerate(auteur_features):
    txt(s, Inches(1.6), Inches(3.55 + j * 0.4), Inches(4.5), Inches(0.35), f'·  {item}', sz=12, color=TEXT)

# Admin side
card(s, Inches(6.9), Inches(2.4), Inches(5.3), Inches(4.6), fill=WHITE, border=BORDER)
txt(s, Inches(7.3), Inches(2.6), Inches(4.5), Inches(0.4), 'Admin Dashboard', sz=18, bold=True, color=TEXT)
txt(s, Inches(7.3), Inches(3.1), Inches(4.5), Inches(0.35), 'Wat de beheerder ziet:', sz=11, bold=True, color=TEXT_LIGHT)
admin_features = [
    'Overzicht van alle auteurs met zoekfunctie',
    'Per auteur: gegevens, contracten, afrekeningen',
    'Wijzigingsverzoeken goedkeuren/afwijzen',
    'Bulk PDF upload voor afrekeningen',
    'CSV import voor nieuwe auteurs',
    'Evenementen en nieuws beheren',
    'Activiteiten feed (logins, wijzigingen)',
    'E-mail notificatie instellingen',
]
for j, item in enumerate(admin_features):
    txt(s, Inches(7.3), Inches(3.55 + j * 0.4), Inches(4.5), Inches(0.35), f'·  {item}', sz=12, color=TEXT)


# ════════════════════════════════════════════
# SLIDE 7: LIVE DEMO
# ════════════════════════════════════════════
s = prs.slides.add_slide(prs.slide_layouts[6])
gradient_bg(s)
txt(s, 0, Inches(2.5), W, Inches(1), 'Live Demo', sz=48, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
txt(s, Inches(2.5), Inches(3.7), Inches(8.3), Inches(0.8), 'Laat me u tonen hoe het portaal eruitziet\nvoor auteur Patrick Jeeninga', sz=18, color=RGBColor(190, 225, 218), align=PP_ALIGN.CENTER, spacing=6)
# Demo steps
steps = ['Inloggen als auteur', 'Jaaroverzicht & royalty-grafiek', 'Afrekening openen (echte PDF)', 'Contract bekijken', 'Prognose & declaraties']
for i, step in enumerate(steps):
    txt(s, Inches(4.5), Inches(4.8 + i * 0.4), Inches(5), Inches(0.35), f'{i+1}.  {step}', sz=14, color=RGBColor(180, 220, 210))


# ════════════════════════════════════════════
# SLIDE 8: SCHAALBAARHEID
# ════════════════════════════════════════════
s = prs.slides.add_slide(prs.slide_layouts[6])
solid_bg(s)
eyebrow(s, Inches(0.8), 'SCHAALBAARHEID')
title(s, Inches(1.15), 'Eén platform, drie organisaties')

orgs = [
    ('Noordhoff', '2.500 auteurs', 'Primair, voortgezet onderwijs\nen mbo/hbo in Nederland'),
    ('Liber', '~1.500 auteurs', 'Educatieve uitgeverij\nin Zweden'),
    ('Plantyn', '~1.000 auteurs', 'Educatieve uitgeverij\nin België'),
]
for i, (name, count, desc) in enumerate(orgs):
    left = Inches(1.2 + i * 3.8)
    card(s, left, Inches(2.5), Inches(3.4), Inches(2.5), fill=TEAL_LIGHT if i == 0 else WHITE, border=TEAL if i == 0 else BORDER)
    txt(s, left + Inches(0.4), Inches(2.7), Inches(2.6), Inches(0.4), name, sz=20, bold=True, color=TEAL)
    txt(s, left + Inches(0.4), Inches(3.2), Inches(2.6), Inches(0.35), count, sz=14, bold=True, color=TEXT)
    txt(s, left + Inches(0.4), Inches(3.6), Inches(2.6), Inches(1), desc, sz=12, color=TEXT_LIGHT, spacing=4)

txt(s, Inches(1.2), Inches(5.5), Inches(11), Inches(0.4), 'White-label ready', sz=16, bold=True, color=TEAL)
txt(s, Inches(1.2), Inches(5.95), Inches(11), Inches(1), 'Elke organisatie krijgt een eigen huisstijl (logo, kleuren), eigen auteurs-database en eigen admin.\nDe onderliggende technologie is identiek — updates worden één keer gebouwd en rollen uit naar alle drie.\nGeen extra ontwikkelkosten per organisatie, alleen configuratie en data-migratie.', sz=13, color=TEXT_LIGHT, spacing=5)


# ════════════════════════════════════════════
# SLIDE 9: ROI
# ════════════════════════════════════════════
s = prs.slides.add_slide(prs.slide_layouts[6])
solid_bg(s)
eyebrow(s, Inches(0.8), 'BUSINESSCASE')
title(s, Inches(1.15), 'Return on Investment')

# Stats
stat_pill(s, Inches(1.2), Inches(2.3), '€10.000', 'Postkosten bespaard')
stat_pill(s, Inches(4.0), Inches(2.3), '€5.000', 'Minder auteursvragen')
stat_pill(s, Inches(6.8), Inches(2.3), '€2.500', 'Verwerking bespaard')
stat_pill(s, Inches(9.6), Inches(2.3), '€17.500', 'Totale besparing/jaar', highlight=True)

# Table
tbl = s.shapes.add_table(6, 3, Inches(1.2), Inches(4.3), Inches(11), Inches(2.8)).table
tbl.columns[0].width = Inches(5.5); tbl.columns[1].width = Inches(2.75); tbl.columns[2].width = Inches(2.75)

rows = [
    ('', 'Huidig (per jaar)', 'Met portaal'),
    ('Fysieke post (print + porto + verzending)', '€10.000', '€0'),
    ('Afhandeling auteursvragen (125 uur)', '€5.000', '€500'),
    ('Fysieke verwerking (32 uur)', '€2.500', '€0'),
    ('Auteursbehoud & tevredenheid', 'Risico', 'Geborgd'),
    ('Totale kosten', '€17.500+', '€500'),
]
for ri, row in enumerate(rows):
    for ci, val in enumerate(row):
        cell = tbl.cell(ri, ci); cell.text = val
        p = cell.text_frame.paragraphs[0]; p.font.size = Pt(12); p.font.name = 'Roboto Flex'
        if ri == 0:
            cell.fill.solid(); cell.fill.fore_color.rgb = TEAL; p.font.color.rgb = WHITE; p.font.bold = True
        elif ri == len(rows) - 1:
            cell.fill.solid(); cell.fill.fore_color.rgb = TEAL_LIGHT; p.font.color.rgb = TEAL; p.font.bold = True
        else:
            cell.fill.solid(); cell.fill.fore_color.rgb = WHITE
            p.font.color.rgb = CORAL if ci == 1 else (TEAL if ci == 2 else TEXT)
            if ci == 2: p.font.bold = True
        if ci > 0: p.alignment = PP_ALIGN.CENTER


# ════════════════════════════════════════════
# SLIDE 10: PRICING
# ════════════════════════════════════════════
s = prs.slides.add_slide(prs.slide_layouts[6])
solid_bg(s)
eyebrow(s, Inches(0.8), 'INVESTERING')
title(s, Inches(1.15), 'Wat kost het?')

# Card 1: Development
card(s, Inches(1.2), Inches(2.3), Inches(5.2), Inches(4.2), fill=WHITE, border=BORDER)
txt(s, Inches(1.6), Inches(2.5), Inches(4.4), Inches(0.35), 'Ontwikkeling & implementatie', sz=15, bold=True, color=TEXT)
txt(s, Inches(1.6), Inches(3.0), Inches(3), Inches(0.7), '€19.000', sz=36, bold=True, color=TEAL)
txt(s, Inches(4.0), Inches(3.25), Inches(2), Inches(0.3), 'eenmalig', sz=13, color=TEXT_LIGHT)
txt(s, Inches(1.6), Inches(3.7), Inches(4.4), Inches(0.25), '200 uur × €95/uur', sz=11, color=TEXT_LIGHT)
items1 = ['Volledig werkend portaal (auteur + admin)', 'Database met Row Level Security', 'Bulk import tooling (CSV + PDF)', 'Tweetalig (NL/EN)', 'Responsive (desktop, tablet, mobiel)', 'Documentatie & overdracht']
for j, item in enumerate(items1):
    txt(s, Inches(1.6), Inches(4.15 + j * 0.35), Inches(4.4), Inches(0.3), f'✓  {item}', sz=11, color=TEXT_LIGHT)

# Card 2: License
card(s, Inches(6.9), Inches(2.3), Inches(5.2), Inches(4.2), fill=TEAL_LIGHT, border=TEAL)
# Badge
badge = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.3), Inches(2.05), Inches(1.6), Inches(0.32))
badge.fill.solid(); badge.fill.fore_color.rgb = TEAL; badge.line.fill.background(); badge.adjustments[0] = 0.5
p = badge.text_frame.paragraphs[0]; p.text = 'AANBEVOLEN'; p.font.size = Pt(8); p.font.bold = True; p.font.color.rgb = WHITE; p.alignment = PP_ALIGN.CENTER

txt(s, Inches(7.3), Inches(2.5), Inches(4.4), Inches(0.35), 'Jaarlijkse licentie', sz=15, bold=True, color=TEXT)
txt(s, Inches(7.3), Inches(3.0), Inches(3), Inches(0.7), '€5.000', sz=36, bold=True, color=TEAL)
txt(s, Inches(9.5), Inches(3.25), Inches(2.5), Inches(0.3), '/jaar/organisatie', sz=13, color=TEXT_LIGHT)
txt(s, Inches(7.3), Inches(3.7), Inches(4.4), Inches(0.25), '3 organisaties = €15.000/jaar', sz=11, color=TEXT_LIGHT)
items2 = ['Hosting & infrastructuur', 'Onderhoud, updates & bugfixes', 'Support (mail + telefoon)', 'Branding per organisatie (white-label)', 'Data-migratie ondersteuning', 'Nieuwe features op aanvraag']
for j, item in enumerate(items2):
    txt(s, Inches(7.3), Inches(4.15 + j * 0.35), Inches(4.4), Inches(0.3), f'✓  {item}', sz=11, color=TEXT)

# Bottom summary
card(s, Inches(1.2), Inches(6.8), Inches(11), Inches(0.5), fill=BG, border=BORDER)
txt(s, Inches(1.5), Inches(6.85), Inches(10.5), Inches(0.35),
    'Jaar 1: €34.000  ·  Besparing: €17.500  ·  Netto: €16.500  |  Vanaf jaar 2: €15.000 licentie vs €17.500 besparing = netto positief',
    sz=11, bold=True, color=TEAL, align=PP_ALIGN.CENTER)


# ════════════════════════════════════════════
# SLIDE 11: TIJDLIJN
# ════════════════════════════════════════════
s = prs.slides.add_slide(prs.slide_layouts[6])
solid_bg(s)
eyebrow(s, Inches(0.8), 'IMPLEMENTATIE')
title(s, Inches(1.15), 'Tijdlijn naar productie')

phases = [
    ('Week 1–2', 'Akkoord & Setup', 'Contract, toegang tot systemen,\ndata-inventarisatie, branding afstemming'),
    ('Week 3–4', 'Data-migratie', 'Auteursdata importeren, PDF-afrekeningen\nuploaden, accounts aanmaken'),
    ('Week 5–6', 'Testen & Feedback', 'Pilot met 10 auteurs, feedback verwerken,\nlaatste aanpassingen'),
    ('Week 7', 'Go-live', 'Alle auteurs ontvangen een email met\nlogin-instructies. Het portaal is live.'),
]
for i, (week, phase, desc) in enumerate(phases):
    left = Inches(1.2 + i * 2.9)
    card(s, left, Inches(2.5), Inches(2.6), Inches(3.0), fill=TEAL_LIGHT if i == 3 else WHITE, border=TEAL if i == 3 else BORDER)
    txt(s, left + Inches(0.3), Inches(2.7), Inches(2), Inches(0.3), week, sz=11, bold=True, color=TEAL)
    txt(s, left + Inches(0.3), Inches(3.05), Inches(2), Inches(0.35), phase, sz=15, bold=True, color=TEXT)
    txt(s, left + Inches(0.3), Inches(3.5), Inches(2), Inches(1.5), desc, sz=12, color=TEXT_LIGHT, spacing=4)
    # Connector
    if i < 3:
        txt(s, left + Inches(2.55), Inches(3.6), Inches(0.4), Inches(0.4), '→', sz=20, color=TEAL, align=PP_ALIGN.CENTER)

txt(s, Inches(1.2), Inches(6.0), Inches(11), Inches(0.8),
    'Het portaal is al gebouwd en getest. De enige stap naar productie is het importeren van echte data.\nBij akkoord kan het portaal binnen 7 weken live zijn voor alle 2.500 auteurs van Noordhoff.',
    sz=14, color=TEXT, spacing=5)


# ════════════════════════════════════════════
# SLIDE 12: URENLOGBOEK
# ════════════════════════════════════════════
s = prs.slides.add_slide(prs.slide_layouts[6])
solid_bg(s)
eyebrow(s, Inches(0.8), 'ONTWIKKELING')
title(s, Inches(1.15), 'Urenverantwoording — 200 uur')

log = [
    ('UX research & wireframes', 16),
    ('Huisstijl & design system', 12),
    ('Login & authenticatie', 10),
    ('Dashboard framework & routing', 14),
    ('7 auteur-tabbladen bouwen', 28),
    ('PDF preview & generatie', 10),
    ('Admin dashboard & CRUD', 22),
    ('Supabase backend & RLS', 18),
    ('Bulk import tools (CSV + PDF)', 12),
    ('Responsive design (mobile/tablet)', 14),
    ('i18n, dark mode, guided tour', 12),
    ('Publieke website (5 pagina\'s)', 16),
    ('Testing, QA & optimalisatie', 16),
]
for i, (task, hours) in enumerate(log):
    col = i % 2; row = i // 2
    left = Inches(1.2 + col * 5.8)
    top = Inches(2.3 + row * 0.58)
    txt(s, left, top, Inches(4.3), Inches(0.45), task, sz=12, color=TEXT)
    txt(s, left + Inches(4.3), top, Inches(1.2), Inches(0.45), f'{hours} uur', sz=12, bold=True, color=TEAL, align=PP_ALIGN.RIGHT)
    # Bar
    bar_w = Inches(5.3 * (hours / 28))  # scale to max
    bar = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top + Inches(0.38), bar_w, Pt(2.5))
    bar.fill.solid(); bar.fill.fore_color.rgb = TEAL_LIGHT; bar.line.fill.background()

divider(s, Inches(1.2), Inches(6.5), Inches(11), color=TEAL)
txt(s, Inches(1.2), Inches(6.6), Inches(5), Inches(0.4), 'TOTAAL', sz=14, bold=True, color=TEAL)
txt(s, Inches(10.2), Inches(6.6), Inches(2), Inches(0.4), '200 uur', sz=14, bold=True, color=TEAL, align=PP_ALIGN.RIGHT)


# ════════════════════════════════════════════
# SLIDE 13: CTA
# ════════════════════════════════════════════
s = prs.slides.add_slide(prs.slide_layouts[6])
gradient_bg(s)
txt(s, 0, Inches(1.8), W, Inches(1), 'Klaar om te starten', sz=48, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
txt(s, Inches(2.5), Inches(3.0), Inches(8.3), Inches(0.8),
    'Het portaal is gebouwd, getest en klaar voor productie.\nDe volgende stap is een akkoord en data-migratie.',
    sz=17, color=RGBColor(190, 225, 218), align=PP_ALIGN.CENTER, spacing=6)

# Bottom stats
stats_cta = [('200 uur', 'Ontwikkeld'), ('5.000', 'Auteurs'), ('3', 'Organisaties'), ('7 weken', 'Naar go-live'), ('< 2 jaar', 'Terugverdientijd')]
for i, (val, label) in enumerate(stats_cta):
    left = Inches(1.0 + i * 2.4)
    txt(s, left, Inches(4.6), Inches(2), Inches(0.6), val, sz=28, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
    txt(s, left, Inches(5.3), Inches(2), Inches(0.3), label, sz=11, color=RGBColor(150, 200, 190), align=PP_ALIGN.CENTER)

txt(s, 0, Inches(6.5), W, Inches(0.3), 'Patrick Jeeninga  ·  patrick@noordhoff.nl', sz=12, color=RGBColor(120, 170, 155), align=PP_ALIGN.CENTER)


# ── Save ──
out = '/Users/patrickjeeninga/Coding/Royaltyportaal/pitch/Auteursportaal_Pitch.pptx'
prs.save(out)
print(f'✓ {out}')
