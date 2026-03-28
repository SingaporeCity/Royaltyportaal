#!/usr/bin/env python3
"""Generate Auteursportaal CEO pitch — based on Noordhoff template"""

from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE
import copy

TPL = '/Users/patrickjeeninga/Coding/Royaltyportaal/pitch/Template richtlijnen - 2026.pptx'
SHOTS = '/Users/patrickjeeninga/Coding/Royaltyportaal/pitch/screenshots'

# Load template for layouts
prs = Presentation(TPL)

# Remove all template slides (keep layouts)
while len(prs.slides) > 0:
    rId = prs.slides._sldIdLst[0].get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
    prs.part.drop_rel(rId)
    prs.slides._sldIdLst.remove(prs.slides._sldIdLst[0])

W = prs.slide_width
H = prs.slide_height

# Noordhoff colors
TEAL = RGBColor(0, 122, 94)       # #007A5E from template
TEAL_DARK = RGBColor(0, 90, 73)
TEAL_BG = RGBColor(240, 250, 247)
CORAL = RGBColor(232, 115, 74)
WHITE = RGBColor(255, 255, 255)
BLACK = RGBColor(0, 0, 0)
TEXT = RGBColor(41, 41, 41)        # #292929 from template
TEXT_SUB = RGBColor(50, 50, 50)    # #323232
TEXT_LIGHT = RGBColor(120, 120, 120)
BORDER = RGBColor(220, 220, 220)
RED_BG = RGBColor(254, 242, 242)
GREEN_BG = RGBColor(236, 253, 245)

# Layout references
LY_TITLE = prs.slide_layouts[0]       # Title Slide
LY_CONTENT = prs.slide_layouts[2]     # Title and Content
LY_TITLE_ONLY = prs.slide_layouts[4]  # Title Only
LY_GREEN = prs.slide_layouts[5]       # Title Only Green
LY_BLANK = prs.slide_layouts[8]       # Blank
LY_BLANK_GREEN = prs.slide_layouts[9] # Blank Green

def txt(slide, l, t, w, h, text, sz=14, bold=False, color=TEXT, align=PP_ALIGN.LEFT, font='Roboto Light', spacing=None):
    box = slide.shapes.add_textbox(l, t, w, h)
    tf = box.text_frame; tf.word_wrap = True
    for i, line in enumerate(text.split('\n')):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.text = line; p.font.size = Pt(sz); p.font.bold = bold
        p.font.color.rgb = color; p.font.name = font; p.alignment = align
        if spacing: p.space_after = Pt(spacing)
    return box

def card(slide, l, t, w, h, fill=WHITE, border=None):
    s = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, l, t, w, h)
    s.fill.solid(); s.fill.fore_color.rgb = fill
    if border: s.line.color.rgb = border; s.line.width = Pt(1)
    else: s.line.fill.background()
    s.adjustments[0] = 0.03
    return s

def line(slide, l, t, w, color=BORDER):
    s = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, l, t, w, Pt(1))
    s.fill.solid(); s.fill.fore_color.rgb = color; s.line.fill.background()

def dot(slide, l, t, color=TEAL):
    d = slide.shapes.add_shape(MSO_SHAPE.OVAL, l, t, Inches(0.1), Inches(0.1))
    d.fill.solid(); d.fill.fore_color.rgb = color; d.line.fill.background()

def subtitle(slide, t, text):
    txt(slide, Inches(0.9), t, Inches(6), Inches(0.3), text, sz=11, bold=True, color=TEAL, font='Roboto Light')

def heading(slide, t, text, sz=36):
    txt(slide, Inches(0.9), t, Inches(11.5), Inches(1), text, sz=sz, color=BLACK, font='Roboto Light')

def stat_pill(slide, l, t, value, label, hl=False):
    bg = TEAL if hl else WHITE
    vc = WHITE if hl else TEAL
    lc = RGBColor(200, 230, 220) if hl else TEXT_LIGHT
    card(slide, l, t, Inches(2.5), Inches(1.5), fill=bg, border=None if hl else BORDER)
    txt(slide, l, t + Inches(0.2), Inches(2.5), Inches(0.7), value, sz=30, bold=True, color=vc, align=PP_ALIGN.CENTER, font='Roboto Light')
    txt(slide, l, t + Inches(0.85), Inches(2.5), Inches(0.5), label, sz=10, color=lc, align=PP_ALIGN.CENTER)


# ═══════════════════════════════════════
# 1. TITEL
# ═══════════════════════════════════════
s = prs.slides.add_slide(LY_TITLE)
s.placeholders[0].text = 'Auteursportaal'
s.placeholders[0].text_frame.paragraphs[0].font.name = 'Roboto Light'
s.placeholders[0].text_frame.paragraphs[0].font.size = Pt(52)
s.placeholders[0].text_frame.paragraphs[0].font.color.rgb = TEAL
s.placeholders[1].text = 'Het digitale platform voor royalty-afrekeningen, contracten en prognoses\nNoordhoff  ·  Liber  ·  Plantyn'
for p in s.placeholders[1].text_frame.paragraphs:
    p.font.name = 'Roboto Light'; p.font.size = Pt(16); p.font.color.rgb = TEXT_SUB

# ═══════════════════════════════════════
# 2. WAAROM NU?
# ═══════════════════════════════════════
s = prs.slides.add_slide(LY_BLANK)
subtitle(s, Inches(0.7), 'CONTEXT')
heading(s, Inches(1.0), 'Waarom nu?')

items = [
    ('Aandeelhouders', 'De aandeelhouders pushen actief op meer\ndigitalisatie. Dit portaal is een concrete,\nzichtbare stap die direct waarde levert.', TEAL_BG, TEAL),
    ('Value Creation Plan', 'Past direct binnen het Value Creation Plan\nals digitaal verbeterproject. Schaalbaar\nnaar Liber en Plantyn.', TEAL_BG, TEAL),
    ('250 auteurs onzeker', '10% van alle auteurs belt of mailt jaarlijks\nmet vragen over hun afrekening.\nGebrek aan communicatie en transparantie.', RGBColor(255, 251, 235), RGBColor(146, 96, 0)),
    ('Concurrentiepositie', 'Auteurs vergelijken hun ervaring met\nandere uitgevers. Een modern portaal is\neen retentie-instrument.', RED_BG, CORAL),
]
for i, (title, desc, bg, tc) in enumerate(items):
    col, row = i % 2, i // 2
    l = Inches(0.9 + col * 5.75); t = Inches(2.2 + row * 2.3)
    card(s, l, t, Inches(5.45), Inches(2.0), fill=bg)
    txt(s, l + Inches(0.4), t + Inches(0.25), Inches(4.6), Inches(0.3), title, sz=15, bold=True, color=tc)
    txt(s, l + Inches(0.4), t + Inches(0.7), Inches(4.6), Inches(1.2), desc, sz=12, color=TEXT, spacing=4)


# ═══════════════════════════════════════
# 3. PROBLEEM — AUTEUR
# ═══════════════════════════════════════
s = prs.slides.add_slide(LY_BLANK)
subtitle(s, Inches(0.7), 'HET PROBLEEM')
heading(s, Inches(1.0), 'Hoe ervaart de auteur het nu?')

# Quote
card(s, Inches(0.9), Inches(2.2), Inches(11.5), Inches(1.5), fill=RGBColor(248, 249, 250), border=BORDER)
txt(s, Inches(1.2), Inches(2.25), Inches(0.5), Inches(0.6), '"', sz=48, bold=True, color=TEAL, font='Roboto Light')
txt(s, Inches(1.8), Inches(2.5), Inches(10), Inches(0.8), 'Ik heb in maart een brief ontvangen, maar ik begrijp de berekening niet.\nKan iemand mij bellen? Ik wil ook graag weten of mijn contract nog loopt.', sz=14, color=TEXT, spacing=5)
txt(s, Inches(1.8), Inches(3.3), Inches(10), Inches(0.25), '— Typische auteursvraag (1 van 250 per jaar)', sz=10, color=TEXT_LIGHT)

pains = [
    ('1 brief per jaar', 'De enige communicatie over royalties\nis een jaarlijkse brief in maart.\nDe rest van het jaar: stilte.'),
    ('Geen inzicht', 'Auteurs kunnen niet zelf opzoeken\nhoe hun methode presteert.\nVolledig afhankelijk van Noordhoff.'),
    ('Onzekerheid', '250 auteurs nemen jaarlijks contact\nop met vragen. Dat is 10% van\nalle auteurs die onzeker is.'),
]
for i, (t, d) in enumerate(pains):
    l = Inches(0.9 + i * 3.9)
    card(s, l, Inches(4.2), Inches(3.6), Inches(2.8), fill=WHITE, border=BORDER)
    dot(s, l + Inches(0.35), Inches(4.45), color=CORAL)
    txt(s, l + Inches(0.6), Inches(4.35), Inches(2.8), Inches(0.3), t, sz=14, bold=True, color=TEXT)
    txt(s, l + Inches(0.35), Inches(4.85), Inches(3), Inches(1.5), d, sz=12, color=TEXT_LIGHT, spacing=4)


# ═══════════════════════════════════════
# 4. PROBLEEM — KOSTEN
# ═══════════════════════════════════════
s = prs.slides.add_slide(LY_BLANK)
subtitle(s, Inches(0.7), 'HET PROBLEEM')
heading(s, Inches(1.0), 'Wat kost het Noordhoff nu?')

stat_pill(s, Inches(0.9), Inches(2.2), '€10.000', 'Postkosten per jaar\n(3 organisaties)')
stat_pill(s, Inches(3.7), Inches(2.2), '32 uur', 'Brieven inpakken\n(2 man × 2 dagen)')
stat_pill(s, Inches(6.5), Inches(2.2), '250', 'Auteurs met vragen\nper jaar')
stat_pill(s, Inches(9.3), Inches(2.2), '0', 'Digitaal inzicht\nvoor auteurs')

txt(s, Inches(0.9), Inches(4.2), Inches(11), Inches(0.35), 'Verborgen kosten die niet op de factuur staan:', sz=13, bold=True, color=TEXT)
hidden = [
    ('Afhandeling auteursvragen', '250 vragen × gem. 30 min = 125 uur per jaar', '~€5.000'),
    ('Fysieke verwerking', '2 medewerkers × 2 dagen printen, vouwen, inpakken', '~€2.500'),
    ('Reputatierisico', 'Auteurs ervaren Noordhoff als ouderwets en niet-transparant', '—'),
    ('Auteursverlies', 'Frustratie leidt tot overstap naar concurrent', '—'),
]
for i, (item, detail, cost) in enumerate(hidden):
    top = Inches(4.7 + i * 0.5)
    dot(s, Inches(1.1), top + Inches(0.1), color=CORAL)
    txt(s, Inches(1.4), top, Inches(3.2), Inches(0.4), item, sz=12, bold=True, color=TEXT)
    txt(s, Inches(4.8), top, Inches(5.2), Inches(0.4), detail, sz=11, color=TEXT_LIGHT)
    txt(s, Inches(10.5), top, Inches(1.5), Inches(0.4), cost, sz=12, bold=True, color=CORAL, align=PP_ALIGN.RIGHT)

line(s, Inches(0.9), Inches(6.85), Inches(11.3), color=TEAL)
txt(s, Inches(0.9), Inches(6.9), Inches(8), Inches(0.3), 'Totale kosten huidige situatie', sz=12, bold=True, color=TEAL)
txt(s, Inches(10.5), Inches(6.9), Inches(1.5), Inches(0.3), '~€18.000/jr', sz=12, bold=True, color=TEAL, align=PP_ALIGN.RIGHT)


# ═══════════════════════════════════════
# 5. OUD VS NIEUW
# ═══════════════════════════════════════
s = prs.slides.add_slide(LY_BLANK)
subtitle(s, Inches(0.7), 'DE TRANSFORMATIE')
heading(s, Inches(1.0), 'Van papier naar portaal')

card(s, Inches(0.9), Inches(2.2), Inches(5.2), Inches(4.8), fill=RED_BG)
txt(s, Inches(1.3), Inches(2.4), Inches(4), Inches(0.4), 'Nu: fysieke post', sz=18, bold=True, color=CORAL, font='Roboto Light')
for j, item in enumerate(['1× per jaar een royalty-brief', 'Geen tussentijds inzicht', 'Vragen via email en telefoon', 'Contracten in archiefkast', 'Geen prognose mogelijk', 'Gegevenswijziging per formulier', 'Brieven handmatig inpakken', 'Geen inzicht in auteuractiviteit']):
    txt(s, Inches(1.3), Inches(3.1 + j * 0.42), Inches(4.5), Inches(0.35), f'✗  {item}', sz=12, color=TEXT_LIGHT)

txt(s, Inches(6.05), Inches(4.2), Inches(0.8), Inches(0.6), '→', sz=32, color=TEAL, align=PP_ALIGN.CENTER, font='Roboto Light')

card(s, Inches(7.1), Inches(2.2), Inches(5.2), Inches(4.8), fill=GREEN_BG)
txt(s, Inches(7.5), Inches(2.4), Inches(4), Inches(0.4), 'Straks: het Auteursportaal', sz=18, bold=True, color=TEAL, font='Roboto Light')
for j, item in enumerate(['24/7 inzicht in afrekeningen', 'Realtime royalty-overzicht per jaar', 'FAQ en rondleiding in het portaal', 'Contracten direct inzien en downloaden', 'Prognose met min/max range', 'Wijzigingen digitaal aanvragen', 'Bulk upload + automatisch versturen', 'Activiteiten feed voor admin']):
    txt(s, Inches(7.5), Inches(3.1 + j * 0.42), Inches(4.5), Inches(0.35), f'✓  {item}', sz=12, color=TEXT)


# ═══════════════════════════════════════
# 6. DE OPLOSSING
# ═══════════════════════════════════════
s = prs.slides.add_slide(LY_BLANK)
subtitle(s, Inches(0.7), 'DE OPLOSSING')
heading(s, Inches(1.0), 'Eén portaal, twee dashboards')

card(s, Inches(0.9), Inches(2.2), Inches(5.45), Inches(4.8), fill=TEAL_BG, border=TEAL)
txt(s, Inches(1.3), Inches(2.4), Inches(4.5), Inches(0.35), 'Auteursdashboard', sz=17, bold=True, color=TEAL, font='Roboto Light')
for j, f in enumerate(['Jaaroverzicht met royalty-totalen', 'Afrekeningen zoeken, filteren, downloaden', 'Contracten inzien met PDF preview', 'Prognose komend jaar (min—max)', 'Declaraties indienen met PDF upload', 'Persoonlijke gegevens beheren', 'Interactieve royalty-grafiek per type', 'FAQ, guided tour, command palette (⌘K)']):
    txt(s, Inches(1.3), Inches(3.0 + j * 0.4), Inches(4.5), Inches(0.35), f'·  {f}', sz=12, color=TEXT)

card(s, Inches(6.65), Inches(2.2), Inches(5.45), Inches(4.8), fill=WHITE, border=BORDER)
txt(s, Inches(7.05), Inches(2.4), Inches(4.5), Inches(0.35), 'Admin Dashboard', sz=17, bold=True, color=TEXT, font='Roboto Light')
for j, f in enumerate(['Overzicht van alle auteurs met zoekfunctie', 'Per auteur: gegevens, contracten, afrekeningen', 'Wijzigingsverzoeken goedkeuren/afwijzen', 'Bulk PDF upload voor afrekeningen', 'CSV import voor nieuwe auteurs', 'Evenementen en nieuws beheren', 'Activiteiten feed (logins, wijzigingen)', 'E-mail notificatie instellingen']):
    txt(s, Inches(7.05), Inches(3.0 + j * 0.4), Inches(4.5), Inches(0.35), f'·  {f}', sz=12, color=TEXT)


# ═══════════════════════════════════════
# 7. SCREENSHOTS — Auteur
# ═══════════════════════════════════════
s = prs.slides.add_slide(LY_BLANK)
subtitle(s, Inches(0.7), 'HET PORTAAL')
heading(s, Inches(1.0), 'Auteursdashboard')

card(s, Inches(0.7), Inches(2.1), Inches(5.9), Inches(2.3), fill=WHITE, border=BORDER)
txt(s, Inches(0.9), Inches(2.15), Inches(3), Inches(0.25), 'Inloggen', sz=9, bold=True, color=TEAL)
s.shapes.add_picture(f'{SHOTS}/01_login.png', Inches(0.85), Inches(2.45), Inches(5.6))

card(s, Inches(6.8), Inches(2.1), Inches(5.9), Inches(2.3), fill=WHITE, border=BORDER)
txt(s, Inches(7.0), Inches(2.15), Inches(3), Inches(0.25), 'Dashboard — Jaaroverzicht', sz=9, bold=True, color=TEAL)
s.shapes.add_picture(f'{SHOTS}/02_start.png', Inches(6.95), Inches(2.45), Inches(5.6))

card(s, Inches(0.7), Inches(4.6), Inches(5.9), Inches(2.3), fill=WHITE, border=BORDER)
txt(s, Inches(0.9), Inches(4.65), Inches(3), Inches(0.25), 'Afrekeningen', sz=9, bold=True, color=TEAL)
s.shapes.add_picture(f'{SHOTS}/05_afrekeningen.png', Inches(0.85), Inches(4.95), Inches(5.6))

card(s, Inches(6.8), Inches(4.6), Inches(5.9), Inches(2.3), fill=WHITE, border=BORDER)
txt(s, Inches(7.0), Inches(4.65), Inches(3), Inches(0.25), 'Prognose', sz=9, bold=True, color=TEAL)
s.shapes.add_picture(f'{SHOTS}/07_prognose.png', Inches(6.95), Inches(4.95), Inches(5.6))


# ═══════════════════════════════════════
# 8. SCREENSHOTS — Meer + Admin
# ═══════════════════════════════════════
s = prs.slides.add_slide(LY_BLANK)
subtitle(s, Inches(0.7), 'HET PORTAAL')
heading(s, Inches(1.0), 'Contracten, Profiel & Admin')

card(s, Inches(0.7), Inches(2.1), Inches(3.8), Inches(2.3), fill=WHITE, border=BORDER)
txt(s, Inches(0.9), Inches(2.15), Inches(3), Inches(0.25), 'Contracten', sz=9, bold=True, color=TEAL)
s.shapes.add_picture(f'{SHOTS}/06_contracten.png', Inches(0.85), Inches(2.45), Inches(3.5))

card(s, Inches(4.7), Inches(2.1), Inches(3.8), Inches(2.3), fill=WHITE, border=BORDER)
txt(s, Inches(4.9), Inches(2.15), Inches(3), Inches(0.25), 'Profiel', sz=9, bold=True, color=TEAL)
s.shapes.add_picture(f'{SHOTS}/09_profiel.png', Inches(4.85), Inches(2.45), Inches(3.5))

card(s, Inches(8.7), Inches(2.1), Inches(3.8), Inches(2.3), fill=WHITE, border=BORDER)
txt(s, Inches(8.9), Inches(2.15), Inches(3), Inches(0.25), 'Evenementen & Nieuws', sz=9, bold=True, color=TEAL)
s.shapes.add_picture(f'{SHOTS}/04_events.png', Inches(8.85), Inches(2.45), Inches(3.5))

card(s, Inches(0.7), Inches(4.6), Inches(5.9), Inches(2.3), fill=WHITE, border=BORDER)
txt(s, Inches(0.9), Inches(4.65), Inches(3), Inches(0.25), 'Admin Dashboard', sz=9, bold=True, color=TEAL)
s.shapes.add_picture(f'{SHOTS}/10_admin.png', Inches(0.85), Inches(4.95), Inches(5.6))

card(s, Inches(6.8), Inches(4.6), Inches(5.9), Inches(2.3), fill=WHITE, border=BORDER)
txt(s, Inches(7.0), Inches(4.65), Inches(3), Inches(0.25), 'Admin — Content & Activiteiten', sz=9, bold=True, color=TEAL)
s.shapes.add_picture(f'{SHOTS}/11_admin_beheer.png', Inches(6.95), Inches(4.95), Inches(5.6))


# ═══════════════════════════════════════
# 9. LIVE DEMO
# ═══════════════════════════════════════
s = prs.slides.add_slide(LY_BLANK_GREEN)
txt(s, 0, Inches(2.2), W, Inches(1), 'Live Demo', sz=48, color=WHITE, align=PP_ALIGN.CENTER, font='Roboto Light')
txt(s, Inches(2.5), Inches(3.4), Inches(8.3), Inches(0.8), 'Laat me u tonen hoe het portaal eruitziet\nvoor auteur Patrick Jeeninga', sz=17, color=RGBColor(200, 235, 225), align=PP_ALIGN.CENTER, spacing=6)
for i, step in enumerate(['Inloggen als auteur', 'Jaaroverzicht & royalty-grafiek', 'Afrekening openen (echte PDF)', 'Contract bekijken', 'Prognose & declaraties']):
    txt(s, Inches(4.8), Inches(4.6 + i * 0.4), Inches(5), Inches(0.35), f'{i+1}.  {step}', sz=14, color=RGBColor(180, 225, 210))


# ═══════════════════════════════════════
# 10. SCHAALBAARHEID
# ═══════════════════════════════════════
s = prs.slides.add_slide(LY_BLANK)
subtitle(s, Inches(0.7), 'SCHAALBAARHEID')
heading(s, Inches(1.0), 'Eén platform, drie organisaties')

for i, (name, count, desc) in enumerate([
    ('Noordhoff', '2.500 auteurs', 'Primair, voortgezet onderwijs\nen mbo/hbo in Nederland'),
    ('Liber', '~1.500 auteurs', 'Educatieve uitgeverij\nin Zweden'),
    ('Plantyn', '~1.000 auteurs', 'Educatieve uitgeverij\nin België'),
]):
    l = Inches(0.9 + i * 3.9)
    card(s, l, Inches(2.3), Inches(3.6), Inches(2.3), fill=TEAL_BG if i == 0 else WHITE, border=TEAL if i == 0 else BORDER)
    txt(s, l + Inches(0.4), Inches(2.5), Inches(2.8), Inches(0.35), name, sz=20, bold=True, color=TEAL, font='Roboto Light')
    txt(s, l + Inches(0.4), Inches(3.0), Inches(2.8), Inches(0.3), count, sz=13, bold=True, color=TEXT)
    txt(s, l + Inches(0.4), Inches(3.4), Inches(2.8), Inches(1), desc, sz=12, color=TEXT_LIGHT, spacing=4)

txt(s, Inches(0.9), Inches(5.1), Inches(11), Inches(0.35), 'White-label ready', sz=16, bold=True, color=TEAL, font='Roboto Light')
txt(s, Inches(0.9), Inches(5.55), Inches(11.3), Inches(1.2),
    'Elke organisatie krijgt een eigen huisstijl (logo, kleuren), eigen auteurs-database en eigen admin.\nDe onderliggende technologie is identiek — updates worden één keer gebouwd en rollen uit naar alle drie.\nGeen extra ontwikkelkosten per organisatie, alleen configuratie en data-migratie.', sz=12, color=TEXT_LIGHT, spacing=5)


# ═══════════════════════════════════════
# 11. ROI
# ═══════════════════════════════════════
s = prs.slides.add_slide(LY_BLANK)
subtitle(s, Inches(0.7), 'BUSINESSCASE')
heading(s, Inches(1.0), 'Return on Investment')

stat_pill(s, Inches(0.9), Inches(2.1), '€10.000', 'Postkosten\nbespaard')
stat_pill(s, Inches(3.7), Inches(2.1), '€5.000', 'Minder\nauteursvragen')
stat_pill(s, Inches(6.5), Inches(2.1), '€2.500', 'Verwerking\nbespaard')
stat_pill(s, Inches(9.3), Inches(2.1), '€17.500', 'Totale besparing\nper jaar', hl=True)

tbl = s.shapes.add_table(6, 3, Inches(0.9), Inches(4.0), Inches(11.5), Inches(2.6)).table
tbl.columns[0].width = Inches(5.5); tbl.columns[1].width = Inches(3); tbl.columns[2].width = Inches(3)
rows = [('', 'Huidig (per jaar)', 'Met portaal'), ('Fysieke post (print + porto + verzending)', '€10.000', '€0'),
        ('Afhandeling auteursvragen (125 uur)', '€5.000', '€500'), ('Fysieke verwerking (32 uur)', '€2.500', '€0'),
        ('Auteursbehoud & tevredenheid', 'Risico', 'Geborgd'), ('Totaal', '€17.500+', '€500')]
for ri, row in enumerate(rows):
    for ci, val in enumerate(row):
        cell = tbl.cell(ri, ci); cell.text = val
        p = cell.text_frame.paragraphs[0]; p.font.size = Pt(12); p.font.name = 'Roboto Light'
        if ri == 0: cell.fill.solid(); cell.fill.fore_color.rgb = TEAL; p.font.color.rgb = WHITE; p.font.bold = True
        elif ri == len(rows)-1: cell.fill.solid(); cell.fill.fore_color.rgb = TEAL_BG; p.font.color.rgb = TEAL; p.font.bold = True
        else:
            cell.fill.solid(); cell.fill.fore_color.rgb = WHITE
            p.font.color.rgb = CORAL if ci == 1 else (TEAL if ci == 2 else TEXT)
            if ci == 2: p.font.bold = True
        if ci > 0: p.alignment = PP_ALIGN.CENTER


# ═══════════════════════════════════════
# 12. PRICING
# ═══════════════════════════════════════
s = prs.slides.add_slide(LY_BLANK)
subtitle(s, Inches(0.7), 'INVESTERING')
heading(s, Inches(1.0), 'Wat kost het?')

card(s, Inches(0.9), Inches(2.1), Inches(5.45), Inches(4.3), fill=WHITE, border=BORDER)
txt(s, Inches(1.3), Inches(2.3), Inches(4.6), Inches(0.3), 'Ontwikkeling & implementatie', sz=15, bold=True, color=TEXT, font='Roboto Light')
txt(s, Inches(1.3), Inches(2.8), Inches(3), Inches(0.6), '€19.000', sz=36, bold=True, color=TEAL, font='Roboto Light')
txt(s, Inches(3.9), Inches(3.05), Inches(2), Inches(0.25), 'eenmalig', sz=12, color=TEXT_LIGHT)
txt(s, Inches(1.3), Inches(3.5), Inches(4.6), Inches(0.25), '200 uur × €95/uur', sz=11, color=TEXT_LIGHT)
for j, item in enumerate(['Volledig werkend portaal (auteur + admin)', 'Database met Row Level Security', 'Bulk import tooling (CSV + PDF)', 'Tweetalig (NL/EN)', 'Responsive (desktop, tablet, mobiel)', 'Documentatie & overdracht']):
    txt(s, Inches(1.3), Inches(4.0 + j * 0.35), Inches(4.6), Inches(0.3), f'✓  {item}', sz=11, color=TEXT_LIGHT)

card(s, Inches(6.65), Inches(2.1), Inches(5.45), Inches(4.3), fill=TEAL_BG, border=TEAL)
badge = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.05), Inches(1.85), Inches(1.6), Inches(0.3))
badge.fill.solid(); badge.fill.fore_color.rgb = TEAL; badge.line.fill.background(); badge.adjustments[0] = 0.5
p = badge.text_frame.paragraphs[0]; p.text = 'AANBEVOLEN'; p.font.size = Pt(8); p.font.bold = True; p.font.color.rgb = WHITE; p.alignment = PP_ALIGN.CENTER
txt(s, Inches(7.05), Inches(2.3), Inches(4.6), Inches(0.3), 'Jaarlijkse licentie', sz=15, bold=True, color=TEXT, font='Roboto Light')
txt(s, Inches(7.05), Inches(2.8), Inches(3), Inches(0.6), '€5.000', sz=36, bold=True, color=TEAL, font='Roboto Light')
txt(s, Inches(9.3), Inches(3.05), Inches(2.5), Inches(0.25), '/jaar/organisatie', sz=12, color=TEXT_LIGHT)
txt(s, Inches(7.05), Inches(3.5), Inches(4.6), Inches(0.25), '3 organisaties = €15.000/jaar', sz=11, color=TEXT_LIGHT)
for j, item in enumerate(['Hosting & infrastructuur', 'Onderhoud, updates & bugfixes', 'Support (mail + telefoon)', 'Branding per organisatie (white-label)', 'Data-migratie ondersteuning', 'Nieuwe features op aanvraag']):
    txt(s, Inches(7.05), Inches(4.0 + j * 0.35), Inches(4.6), Inches(0.3), f'✓  {item}', sz=11, color=TEXT)

card(s, Inches(0.9), Inches(6.6), Inches(11.2), Inches(0.5), fill=RGBColor(248, 249, 250), border=BORDER)
txt(s, Inches(1.2), Inches(6.65), Inches(10.6), Inches(0.35),
    'Jaar 1: €34.000  ·  Besparing: €17.500  ·  Netto: €16.500  |  Vanaf jaar 2: €15.000 vs €17.500 besparing = netto positief',
    sz=11, bold=True, color=TEAL, align=PP_ALIGN.CENTER)


# ═══════════════════════════════════════
# 13. TIJDLIJN
# ═══════════════════════════════════════
s = prs.slides.add_slide(LY_BLANK)
subtitle(s, Inches(0.7), 'IMPLEMENTATIE')
heading(s, Inches(1.0), 'Tijdlijn naar productie')

for i, (week, phase, desc) in enumerate([
    ('Week 1–2', 'Setup', 'Contract, toegang,\ndata-inventarisatie'),
    ('Week 3–4', 'Data-migratie', 'Auteursdata importeren,\nPDFs uploaden'),
    ('Week 5–6', 'Testen', 'Pilot met 10 auteurs,\nfeedback verwerken'),
    ('Week 7', 'Go-live', 'Alle auteurs ontvangen\nlogin per email'),
]):
    l = Inches(0.9 + i * 3.05)
    card(s, l, Inches(2.3), Inches(2.75), Inches(2.5), fill=TEAL_BG if i == 3 else WHITE, border=TEAL if i == 3 else BORDER)
    txt(s, l + Inches(0.3), Inches(2.5), Inches(2.2), Inches(0.25), week, sz=10, bold=True, color=TEAL)
    txt(s, l + Inches(0.3), Inches(2.85), Inches(2.2), Inches(0.35), phase, sz=16, bold=True, color=TEXT, font='Roboto Light')
    txt(s, l + Inches(0.3), Inches(3.4), Inches(2.2), Inches(1), desc, sz=12, color=TEXT_LIGHT, spacing=4)
    if i < 3: txt(s, l + Inches(2.7), Inches(3.2), Inches(0.4), Inches(0.35), '→', sz=18, color=TEAL, align=PP_ALIGN.CENTER)

txt(s, Inches(0.9), Inches(5.3), Inches(11.3), Inches(0.8),
    'Het portaal is al gebouwd en getest. De enige stap naar productie is het importeren van echte data.\nBij akkoord kan het portaal binnen 7 weken live zijn voor alle 2.500 auteurs.',
    sz=13, color=TEXT, spacing=5)


# ═══════════════════════════════════════
# 14. URENLOGBOEK
# ═══════════════════════════════════════
s = prs.slides.add_slide(LY_BLANK)
subtitle(s, Inches(0.7), 'ONTWIKKELING')
heading(s, Inches(1.0), 'Urenverantwoording — 200 uur')

log = [('UX research & wireframes', 16), ('Huisstijl & design system', 12), ('Login & authenticatie', 10),
       ('Dashboard framework & routing', 14), ('7 auteur-tabbladen bouwen', 28), ('PDF preview & generatie', 10),
       ('Admin dashboard & CRUD', 22), ('Supabase backend & RLS', 18), ('Bulk import tools (CSV + PDF)', 12),
       ('Responsive design (mobile/tablet)', 14), ('i18n, dark mode, guided tour', 12),
       ('Publieke website (5 pagina\'s)', 16), ('Testing, QA & optimalisatie', 16)]
for i, (task, hours) in enumerate(log):
    col, row = i % 2, i // 2
    l = Inches(0.9 + col * 5.9); t = Inches(2.2 + row * 0.55)
    txt(s, l, t, Inches(4.3), Inches(0.4), task, sz=12, color=TEXT)
    txt(s, l + Inches(4.3), t, Inches(1.3), Inches(0.4), f'{hours} uur', sz=12, bold=True, color=TEAL, align=PP_ALIGN.RIGHT)
    bar = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, l, t + Inches(0.36), Inches(5.5 * hours / 28), Pt(2))
    bar.fill.solid(); bar.fill.fore_color.rgb = TEAL_BG; bar.line.fill.background()

line(s, Inches(0.9), Inches(6.2), Inches(11.3), color=TEAL)
txt(s, Inches(0.9), Inches(6.3), Inches(5), Inches(0.35), 'TOTAAL', sz=14, bold=True, color=TEAL)
txt(s, Inches(10.2), Inches(6.3), Inches(2), Inches(0.35), '200 uur', sz=14, bold=True, color=TEAL, align=PP_ALIGN.RIGHT)


# ═══════════════════════════════════════
# 15. CTA
# ═══════════════════════════════════════
s = prs.slides.add_slide(LY_BLANK_GREEN)
txt(s, 0, Inches(1.8), W, Inches(1), 'Klaar om te starten', sz=48, color=WHITE, align=PP_ALIGN.CENTER, font='Roboto Light')
txt(s, Inches(2.5), Inches(3.0), Inches(8.3), Inches(0.8),
    'Het portaal is gebouwd, getest en klaar voor productie.\nDe volgende stap is een akkoord en data-migratie.',
    sz=16, color=RGBColor(200, 235, 225), align=PP_ALIGN.CENTER, spacing=6)
for i, (val, label) in enumerate([('200 uur', 'Ontwikkeld'), ('5.000', 'Auteurs'), ('3', 'Organisaties'), ('7 weken', 'Naar go-live'), ('< 2 jaar', 'Terugverdientijd')]):
    l = Inches(0.9 + i * 2.45)
    txt(s, l, Inches(4.5), Inches(2.2), Inches(0.6), val, sz=28, bold=True, color=WHITE, align=PP_ALIGN.CENTER, font='Roboto Light')
    txt(s, l, Inches(5.2), Inches(2.2), Inches(0.3), label, sz=11, color=RGBColor(160, 210, 195), align=PP_ALIGN.CENTER)
txt(s, 0, Inches(6.3), W, Inches(0.3), 'Patrick Jeeninga  ·  patrick@noordhoff.nl', sz=12, color=RGBColor(140, 195, 180), align=PP_ALIGN.CENTER)


# ═══════════════════════════════════════
# APPENDIX 1: DATA SECURITY
# ═══════════════════════════════════════
s = prs.slides.add_slide(LY_BLANK)
txt(s, Inches(0.9), Inches(0.6), Inches(3), Inches(0.25), 'APPENDIX', sz=9, bold=True, color=TEXT_LIGHT)
heading(s, Inches(0.85), 'Databeveiliging', sz=28)

layers = [
    ('Authenticatie', 'Inloggen via versleutelde wachtwoorden (bcrypt). Sessie-tokens verlopen automatisch.'),
    ('Row Level Security', 'Database dwingt af dat elke auteur alleen eigen data ziet. Zelfs bij directe API-toegang.'),
    ('Versleutelde verbinding', 'Alle communicatie via HTTPS/TLS. Data in transit is altijd versleuteld.'),
    ('Opslag-beveiliging', 'PDFs in privé bucket. Download alleen via tijdelijke signed URLs (verlopen na 5 min).'),
    ('BSN-maskering', 'BSN wordt gemaskeerd weergegeven (•••••6789). Pas zichtbaar na expliciete actie.'),
]
for i, (lbl, desc) in enumerate(layers):
    t = Inches(2.1 + i * 0.75)
    dot(s, Inches(1.1), t + Inches(0.08), color=TEAL)
    txt(s, Inches(1.4), t, Inches(2.2), Inches(0.3), lbl, sz=12, bold=True, color=TEXT)
    txt(s, Inches(3.8), t, Inches(3.5), Inches(0.6), desc, sz=11, color=TEXT_LIGHT, spacing=2)

card(s, Inches(7.8), Inches(2.1), Inches(4.5), Inches(1.7), fill=RED_BG)
txt(s, Inches(8.1), Inches(2.2), Inches(4), Inches(0.25), 'Risico\'s fysieke post', sz=11, bold=True, color=CORAL)
for j, r in enumerate(['Brieven met financiële data raken zoek', 'Geen controle wie de brief opent', 'Geen audit trail', 'Kopieën op bureaus']):
    txt(s, Inches(8.1), Inches(2.55 + j * 0.28), Inches(4), Inches(0.25), f'✗  {r}', sz=10, color=TEXT_LIGHT)

card(s, Inches(7.8), Inches(4.1), Inches(4.5), Inches(1.8), fill=GREEN_BG)
txt(s, Inches(8.1), Inches(4.2), Inches(4), Inches(0.25), 'Waarborgen portaal', sz=11, bold=True, color=TEAL)
for j, r in enumerate(['Toegang alleen na inloggen', 'Auteur ziet uitsluitend eigen data (RLS)', 'Elke login wordt gelogd (audit trail)', 'Admin kan activiteit monitoren', 'Geen fysieke documenten']):
    txt(s, Inches(8.1), Inches(4.55 + j * 0.25), Inches(4), Inches(0.25), f'✓  {r}', sz=10, color=TEXT)


# ═══════════════════════════════════════
# APPENDIX 2: AVG
# ═══════════════════════════════════════
s = prs.slides.add_slide(LY_BLANK)
txt(s, Inches(0.9), Inches(0.6), Inches(3), Inches(0.25), 'APPENDIX', sz=9, bold=True, color=TEXT_LIGHT)
heading(s, Inches(0.85), 'AVG-compliance', sz=28)

avg = [
    ('Recht op inzage (Art. 15)', 'Auteurs kunnen 24/7 eigen gegevens,\ncontracten en afrekeningen inzien.', 'Geen formeel verzoek nodig —\nhet portaal biedt dit standaard.'),
    ('Recht op rectificatie (Art. 16)', 'Wijzigingsverzoek indienen via portaal\n(adres, telefoon, IBAN).', 'Admin keurt goed of wijst af.\nVolledig traceerbaar.'),
    ('Dataminimalisatie (Art. 5)', 'Alleen relevante gegevens getoond.\nBSN is standaard gemaskeerd.', 'Geen onnodige data-opslag\nof verspreiding.'),
    ('Beveiliging (Art. 32)', 'HTTPS, gehashte wachtwoorden, RLS,\nsigned URLs voor downloads.', 'Technische maatregelen zijn\ningebouwd in de architectuur.'),
    ('Verantwoording (Art. 5)', 'Login-logging en audit trail op alle\nwijzigingsverzoeken met timestamps.', 'Bij een audit exact traceerbaar\nwie wat heeft gedaan.'),
]
for i, (principle, how, note) in enumerate(avg):
    t = Inches(2.0 + i * 0.95)
    card(s, Inches(0.9), t, Inches(11.3), Inches(0.82), fill=TEAL_BG if i % 2 == 0 else WHITE, border=BORDER)
    txt(s, Inches(1.2), t + Inches(0.12), Inches(3), Inches(0.55), principle, sz=11, bold=True, color=TEAL)
    txt(s, Inches(4.3), t + Inches(0.12), Inches(3.5), Inches(0.55), how, sz=10, color=TEXT, spacing=2)
    txt(s, Inches(8.2), t + Inches(0.12), Inches(3.5), Inches(0.55), note, sz=10, color=TEXT_LIGHT, spacing=2)

txt(s, Inches(0.9), Inches(6.9), Inches(11.3), Inches(0.3),
    'Het portaal vervangt fysieke brieven — dit vermindert het risico op datalekken en verbetert de compliance-positie.',
    sz=11, bold=True, color=TEAL, align=PP_ALIGN.CENTER)


# ── Save ──
out = '/Users/patrickjeeninga/Coding/Royaltyportaal/pitch/Auteursportaal_Pitch.pptx'
prs.save(out)
print(f'✓ {out}')
