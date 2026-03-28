#!/usr/bin/env python3
"""Generate Auteursportaal CEO pitch deck as .pptx"""

from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

TEAL = RGBColor(0, 116, 96)
TEAL_DARK = RGBColor(0, 90, 73)
TEAL_LIGHT = RGBColor(240, 250, 247)
CORAL = RGBColor(232, 115, 74)
WHITE = RGBColor(255, 255, 255)
TEXT = RGBColor(17, 24, 39)
TEXT_LIGHT = RGBColor(107, 114, 128)
BG_LIGHT = RGBColor(248, 250, 252)
RED_LIGHT = RGBColor(254, 242, 242)
GREEN_LIGHT = RGBColor(240, 253, 244)

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)
W = prs.slide_width
H = prs.slide_height

def add_bg(slide, color):
    bg = slide.background
    fill = bg.fill
    fill.solid()
    fill.fore_color.rgb = color

def add_gradient_bg(slide):
    """Add a teal gradient background using a full-slide shape"""
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, W, H)
    shape.fill.gradient()
    shape.fill.gradient_stops[0].color.rgb = RGBColor(0, 116, 96)
    shape.fill.gradient_stops[0].position = 0.0
    shape.fill.gradient_stops[1].color.rgb = RGBColor(0, 61, 51)
    shape.fill.gradient_stops[1].position = 1.0
    shape.line.fill.background()
    shape.rotation = 0

def add_text_box(slide, left, top, width, height, text, font_size=14, bold=False, color=TEXT, align=PP_ALIGN.LEFT, font_name='Roboto Flex'):
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = text
    p.font.size = Pt(font_size)
    p.font.bold = bold
    p.font.color.rgb = color
    p.font.name = font_name
    p.alignment = align
    return txBox

def add_eyebrow(slide, top, text):
    add_text_box(slide, Inches(1.2), top, Inches(4), Inches(0.4), text, font_size=11, bold=True, color=TEAL, align=PP_ALIGN.LEFT)

def add_card(slide, left, top, width, height, fill_color=BG_LIGHT, border_color=None, border_left_color=None):
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill_color
    if border_color:
        shape.line.color.rgb = border_color
        shape.line.width = Pt(1.5)
    else:
        shape.line.fill.background()
    # Adjustment for rounded corners
    shape.adjustments[0] = 0.04
    return shape

# ============================================================
# SLIDE 1: Title
# ============================================================
slide = prs.slides.add_slide(prs.slide_layouts[6])  # blank
add_gradient_bg(slide)
add_text_box(slide, Inches(0), Inches(1.8), W, Inches(1), 'AUTEURSPORTAAL', font_size=52, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
add_text_box(slide, Inches(2), Inches(3.0), Inches(9.3), Inches(1), 'Het digitale platform voor auteurs van\nNoordhoff, Liber en Plantyn', font_size=20, color=RGBColor(200, 230, 225), align=PP_ALIGN.CENTER)
add_text_box(slide, Inches(0), Inches(5.5), W, Inches(0.5), 'Patrick Jeeninga  —  Maart 2026', font_size=13, color=RGBColor(150, 200, 190), align=PP_ALIGN.CENTER)

# ============================================================
# SLIDE 2: Het Probleem
# ============================================================
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(slide, WHITE)
add_eyebrow(slide, Inches(0.8), 'DE UITDAGING')
add_text_box(slide, Inches(1.2), Inches(1.2), Inches(10), Inches(0.8), 'Elk jaar 5.000 brieven versturen\nis niet meer van deze tijd', font_size=32, bold=True, color=TEAL)

# Problem cards
cards_data = [
    ('€10.000', 'Directe kosten per jaar', 'Print, porto en verwerking van\nroyalty-afrekeningen voor drie\norganisaties samen.'),
    ('5.000', 'Brieven per jaar', 'Elke auteur ontvangt jaarlijks\neen fysieke afrekening.\nHandmatig verwerkt, per post.'),
    ('0', 'Digitaal inzicht', 'Auteurs hebben geen realtime\ntoegang tot contracten,\nafrekeningen of prognoses.'),
]
for i, (num, title, desc) in enumerate(cards_data):
    left = Inches(1.2 + i * 3.8)
    add_card(slide, left, Inches(2.8), Inches(3.4), Inches(3.5), fill_color=RED_LIGHT, border_left_color=CORAL)
    add_text_box(slide, left + Inches(0.4), Inches(3.0), Inches(2.6), Inches(0.7), num, font_size=36, bold=True, color=CORAL)
    add_text_box(slide, left + Inches(0.4), Inches(3.7), Inches(2.6), Inches(0.4), title, font_size=15, bold=True, color=TEXT)
    add_text_box(slide, left + Inches(0.4), Inches(4.3), Inches(2.6), Inches(1.5), desc, font_size=12, color=TEXT_LIGHT)

# ============================================================
# SLIDE 3: Oud vs Nieuw
# ============================================================
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(slide, WHITE)
add_eyebrow(slide, Inches(0.8), 'DE TRANSFORMATIE')
add_text_box(slide, Inches(1.2), Inches(1.2), Inches(8), Inches(0.6), 'Van papier naar portaal', font_size=32, bold=True, color=TEAL)

# Old column
add_card(slide, Inches(1.2), Inches(2.4), Inches(5), Inches(4.2), fill_color=RED_LIGHT)
add_text_box(slide, Inches(1.6), Inches(2.6), Inches(4), Inches(0.5), 'Nu: fysieke post', font_size=18, bold=True, color=CORAL)
old_items = ['1× per jaar royalty-brief', 'Geen tussentijds inzicht', 'Vragen via email/telefoon', 'Contracten in archiefkast', 'Geen prognose mogelijk', 'Gegevenswijziging per formulier']
for j, item in enumerate(old_items):
    add_text_box(slide, Inches(1.6), Inches(3.3 + j * 0.5), Inches(4), Inches(0.45), f'✗  {item}', font_size=13, color=TEXT_LIGHT)

# Arrow
add_text_box(slide, Inches(6.1), Inches(4.0), Inches(1), Inches(0.8), '→', font_size=36, bold=True, color=TEAL, align=PP_ALIGN.CENTER)

# New column
add_card(slide, Inches(7.1), Inches(2.4), Inches(5), Inches(4.2), fill_color=GREEN_LIGHT)
add_text_box(slide, Inches(7.5), Inches(2.6), Inches(4), Inches(0.5), 'Straks: het Auteursportaal', font_size=18, bold=True, color=TEAL)
new_items = ['24/7 inzicht in afrekeningen', 'Realtime royalty-overzicht', 'Alles in één dashboard', 'Contracten direct inzien', 'Prognose komend jaar', 'Wijzigingen digitaal aanvragen']
for j, item in enumerate(new_items):
    add_text_box(slide, Inches(7.5), Inches(3.3 + j * 0.5), Inches(4), Inches(0.45), f'✓  {item}', font_size=13, color=TEXT)

# ============================================================
# SLIDE 4: De Oplossing
# ============================================================
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(slide, WHITE)
add_eyebrow(slide, Inches(0.8), 'DE OPLOSSING')
add_text_box(slide, Inches(1.2), Inches(1.2), Inches(8), Inches(0.6), 'Eén portaal voor al je auteurs', font_size=32, bold=True, color=TEAL)

solutions = [
    ('Auteursdashboard', 'Persoonlijk overzicht met jaaroverzicht,\nroyalty-grafiek, evenementen en nieuws.\nTweetalig (NL/EN).'),
    ('Afrekeningen & PDF\'s', 'Zoeken, filteren, preview en download\nvan alle royalty-afrekeningen.\nCSV-export voor de boekhouding.'),
    ('Contracten & Prognoses', 'Alle contracten op één plek. Verwachte\nroyalties voor het komend jaar\nmet min/max range.'),
    ('Admin Dashboard', 'Beheer auteurs, upload afrekeningen\nin bulk, keur wijzigingsverzoeken goed.\nCSV-import voor nieuwe auteurs.'),
]
for i, (title, desc) in enumerate(solutions):
    col = i % 2
    row = i // 2
    left = Inches(1.2 + col * 5.6)
    top = Inches(2.4 + row * 2.2)
    add_card(slide, left, top, Inches(5.2), Inches(1.9), fill_color=TEAL_LIGHT)
    add_text_box(slide, left + Inches(0.4), top + Inches(0.3), Inches(4.4), Inches(0.4), title, font_size=16, bold=True, color=TEAL)
    add_text_box(slide, left + Inches(0.4), top + Inches(0.8), Inches(4.4), Inches(1), desc, font_size=12, color=TEXT_LIGHT)

# ============================================================
# SLIDE 5: Functionaliteiten
# ============================================================
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(slide, WHITE)
add_eyebrow(slide, Inches(0.8), 'FUNCTIONALITEITEN')
add_text_box(slide, Inches(1.2), Inches(1.2), Inches(8), Inches(0.6), 'Wat zit er allemaal in?', font_size=32, bold=True, color=TEAL)

features = [
    '7 tabbladen: Start, Afrekeningen, Contracten,\nPrognose, Declaraties, FAQ, Profiel',
    'PDF preview & download van afrekeningen\nen contracten',
    'Interactieve royalty-grafiek per jaar\nmet type-uitsplitsing',
    'Bulk PDF upload en CSV-import voor admin',
    'Wijzigingsverzoeken met goedkeuringsflow',
    'Beveiligd met Row Level Security —\nauteurs zien alleen eigen data',
    'Tweetalig (NL/EN) met automatische\nbegroeting op basis van tijd',
    'Dark mode, responsive design,\ncommand palette (⌘K)',
    'Declaraties indienen met PDF-upload',
    'Guided tour voor nieuwe auteurs',
    'Evenementen, nieuws &\nNoordhoff Academy integratie',
    'Schaalbaar naar Liber en Plantyn\n(white-label ready)',
]
for i, feat in enumerate(features):
    col = i % 2
    row = i // 2
    left = Inches(1.2 + col * 5.8)
    top = Inches(2.3 + row * 0.78)
    # Dot
    dot = slide.shapes.add_shape(MSO_SHAPE.OVAL, left, top + Inches(0.12), Inches(0.12), Inches(0.12))
    dot.fill.solid()
    dot.fill.fore_color.rgb = TEAL
    dot.line.fill.background()
    add_text_box(slide, left + Inches(0.25), top, Inches(5), Inches(0.7), feat, font_size=12, color=TEXT)

# ============================================================
# SLIDE 6: Urenlogboek
# ============================================================
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(slide, WHITE)
add_eyebrow(slide, Inches(0.8), 'ONTWIKKELING')
add_text_box(slide, Inches(1.2), Inches(1.2), Inches(10), Inches(0.6), '200 uur — volledig urenlogboek', font_size=32, bold=True, color=TEAL)

log_items = [
    ('UX research & wireframes', '16'),
    ('Huisstijl & design system', '12'),
    ('Login & authenticatie', '10'),
    ('Dashboard framework & routing', '14'),
    ('7 auteur-tabbladen', '28'),
    ('PDF preview & generatie', '10'),
    ('Admin dashboard & CRUD', '22'),
    ('Supabase backend & RLS', '18'),
    ('Bulk import tools', '12'),
    ('Responsive & mobile', '14'),
    ('i18n, dark mode, guided tour', '12'),
    ('Publieke website (5 pagina\'s)', '16'),
    ('Testing, QA & optimalisatie', '16'),
]
for i, (task, hours) in enumerate(log_items):
    col = i % 2
    row = i // 2
    left = Inches(1.2 + col * 5.8)
    top = Inches(2.3 + row * 0.6)
    add_text_box(slide, left, top, Inches(4.5), Inches(0.5), task, font_size=12, color=TEXT)
    add_text_box(slide, left + Inches(4.5), top, Inches(1), Inches(0.5), f'{hours} uur', font_size=12, bold=True, color=TEAL, align=PP_ALIGN.RIGHT)
    # Separator line
    line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top + Inches(0.45), Inches(5.5), Pt(0.75))
    line.fill.solid()
    line.fill.fore_color.rgb = RGBColor(240, 240, 240)
    line.line.fill.background()

# Total bar
total_bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(1.2), Inches(6.3), Inches(11), Pt(2))
total_bar.fill.solid()
total_bar.fill.fore_color.rgb = TEAL
total_bar.line.fill.background()
add_text_box(slide, Inches(1.2), Inches(6.5), Inches(5), Inches(0.5), 'TOTAAL', font_size=14, bold=True, color=TEAL)
add_text_box(slide, Inches(10.2), Inches(6.5), Inches(2), Inches(0.5), '200 uur', font_size=14, bold=True, color=TEAL, align=PP_ALIGN.RIGHT)

# ============================================================
# SLIDE 7: ROI
# ============================================================
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(slide, WHITE)
add_eyebrow(slide, Inches(0.8), 'BUSINESSCASE')
add_text_box(slide, Inches(1.2), Inches(1.2), Inches(8), Inches(0.6), 'Return on Investment', font_size=32, bold=True, color=TEAL)

# Stats
stats = [('€10.000', 'Huidige kosten\npost per jaar', False), ('€0', 'Postkosten\nmet portaal', True), ('5.000', 'Auteurs\nbereikt', False), ('24/7', 'Beschikbaar-\nheid', False)]
for i, (val, label, highlight) in enumerate(stats):
    left = Inches(1.2 + i * 2.9)
    bg_col = TEAL if highlight else TEAL_LIGHT
    txt_col = WHITE if highlight else TEAL
    lbl_col = RGBColor(200, 230, 225) if highlight else TEXT_LIGHT
    add_card(slide, left, Inches(2.3), Inches(2.5), Inches(1.6), fill_color=bg_col)
    add_text_box(slide, left + Inches(0.1), Inches(2.5), Inches(2.3), Inches(0.7), val, font_size=30, bold=True, color=txt_col, align=PP_ALIGN.CENTER)
    add_text_box(slide, left + Inches(0.1), Inches(3.2), Inches(2.3), Inches(0.6), label, font_size=11, color=lbl_col, align=PP_ALIGN.CENTER)

# ROI Table
table_data = [
    ('Kostenpost', 'Huidig (per jaar)', 'Met portaal'),
    ('Fysieke post (print + porto)', '€10.000', '€0'),
    ('Administratieve verwerking', '~€5.000', '~€1.000'),
    ('Telefonische vragen auteurs', '~€3.000', '~€500'),
    ('Totaal', '€18.000', '€1.500'),
]
table_shape = slide.shapes.add_table(len(table_data), 3, Inches(1.2), Inches(4.3), Inches(11), Inches(2.5)).table
table_shape.columns[0].width = Inches(5.5)
table_shape.columns[1].width = Inches(2.75)
table_shape.columns[2].width = Inches(2.75)

for row_idx, row_data in enumerate(table_data):
    for col_idx, cell_text in enumerate(row_data):
        cell = table_shape.cell(row_idx, col_idx)
        cell.text = cell_text
        p = cell.text_frame.paragraphs[0]
        p.font.size = Pt(12)
        p.font.name = 'Roboto Flex'

        if row_idx == 0:  # Header
            cell.fill.solid()
            cell.fill.fore_color.rgb = TEAL
            p.font.color.rgb = WHITE
            p.font.bold = True
        elif row_idx == len(table_data) - 1:  # Total
            cell.fill.solid()
            cell.fill.fore_color.rgb = TEAL_LIGHT
            p.font.bold = True
            p.font.color.rgb = TEAL
        else:
            cell.fill.solid()
            cell.fill.fore_color.rgb = WHITE
            if col_idx == 1:
                p.font.color.rgb = CORAL
            elif col_idx == 2:
                p.font.color.rgb = TEAL
                p.font.bold = True
            else:
                p.font.color.rgb = TEXT

        if col_idx > 0:
            p.alignment = PP_ALIGN.CENTER

add_text_box(slide, Inches(1.2), Inches(6.9), Inches(11), Inches(0.4), 'Besparing van €16.500 per jaar voor drie organisaties samen. Het portaal verdient zichzelf terug in jaar 1.', font_size=11, color=TEXT_LIGHT)

# ============================================================
# SLIDE 8: Pricing
# ============================================================
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(slide, WHITE)
add_eyebrow(slide, Inches(0.8), 'INVESTERING')
add_text_box(slide, Inches(1.2), Inches(1.2), Inches(8), Inches(0.6), 'Wat kost het?', font_size=32, bold=True, color=TEAL)

# Card 1: Development
add_card(slide, Inches(1.2), Inches(2.3), Inches(5.2), Inches(4.5), fill_color=WHITE, border_color=RGBColor(229, 231, 235))
add_text_box(slide, Inches(1.6), Inches(2.5), Inches(4.4), Inches(0.4), 'Ontwikkeling & implementatie', font_size=16, bold=True, color=TEXT)
add_text_box(slide, Inches(1.6), Inches(3.1), Inches(4.4), Inches(0.7), '€19.000', font_size=36, bold=True, color=TEAL)
add_text_box(slide, Inches(3.9), Inches(3.35), Inches(2), Inches(0.3), 'eenmalig', font_size=13, color=TEXT_LIGHT)
add_text_box(slide, Inches(1.6), Inches(3.8), Inches(4.4), Inches(0.3), '200 uur × €95/uur', font_size=11, color=TEXT_LIGHT)

dev_items = ['Volledig werkend portaal', 'Auteur- én admin-dashboard', 'Database setup met beveiliging', 'Bulk import tooling', 'Tweetalig (NL/EN)', 'Documentatie & overdracht']
for j, item in enumerate(dev_items):
    add_text_box(slide, Inches(1.6), Inches(4.3 + j * 0.35), Inches(4.4), Inches(0.3), f'✓  {item}', font_size=11, color=TEXT_LIGHT)

# Card 2: License (featured)
add_card(slide, Inches(6.9), Inches(2.3), Inches(5.2), Inches(4.5), fill_color=TEAL_LIGHT, border_color=TEAL)
# Badge
badge = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.3), Inches(2.05), Inches(1.6), Inches(0.35))
badge.fill.solid()
badge.fill.fore_color.rgb = TEAL
badge.line.fill.background()
badge.adjustments[0] = 0.5
badge_tf = badge.text_frame
badge_tf.paragraphs[0].text = 'AANBEVOLEN'
badge_tf.paragraphs[0].font.size = Pt(8)
badge_tf.paragraphs[0].font.bold = True
badge_tf.paragraphs[0].font.color.rgb = WHITE
badge_tf.paragraphs[0].alignment = PP_ALIGN.CENTER

add_text_box(slide, Inches(7.3), Inches(2.5), Inches(4.4), Inches(0.4), 'Jaarlijkse licentie (per organisatie)', font_size=16, bold=True, color=TEXT)
add_text_box(slide, Inches(7.3), Inches(3.1), Inches(4.4), Inches(0.7), '€5.000', font_size=36, bold=True, color=TEAL)
add_text_box(slide, Inches(9.4), Inches(3.35), Inches(2), Inches(0.3), '/jaar', font_size=13, color=TEXT_LIGHT)
add_text_box(slide, Inches(7.3), Inches(3.8), Inches(4.4), Inches(0.3), '3 organisaties = €15.000/jaar', font_size=11, color=TEXT_LIGHT)

lic_items = ['Hosting & infrastructuur', 'Onderhoud & updates', 'Support & bugfixes', 'Branding per organisatie', 'Data-migratie ondersteuning', 'Nieuwe features op aanvraag']
for j, item in enumerate(lic_items):
    add_text_box(slide, Inches(7.3), Inches(4.3 + j * 0.35), Inches(4.4), Inches(0.3), f'✓  {item}', font_size=11, color=TEXT)

add_text_box(slide, Inches(1.2), Inches(7.0), Inches(11), Inches(0.3), 'Totale investering jaar 1: €34.000  ·  Jaarlijkse besparing: €16.500  ·  Terugverdientijd: < 2 jaar  ·  Vanaf jaar 3: netto besparing', font_size=11, color=TEXT_LIGHT, align=PP_ALIGN.CENTER)

# ============================================================
# SLIDE 9: CTA
# ============================================================
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_gradient_bg(slide)
add_text_box(slide, Inches(0), Inches(1.5), W, Inches(1), 'Klaar om te starten?', font_size=42, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
add_text_box(slide, Inches(2.5), Inches(2.8), Inches(8.3), Inches(1), 'Het portaal is gebouwd, getest en klaar voor productie.\nDe volgende stap is implementatie met echte auteursdata.', font_size=17, color=RGBColor(200, 230, 225), align=PP_ALIGN.CENTER)

cta_stats = [('200', 'Uur ontwikkeld'), ('5.000', 'Auteurs bereiken'), ('3', 'Organisaties'), ('< 2 jr', 'Terugverdientijd')]
for i, (val, label) in enumerate(cta_stats):
    left = Inches(1.8 + i * 2.7)
    add_text_box(slide, left, Inches(4.5), Inches(2.2), Inches(0.7), val, font_size=32, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
    add_text_box(slide, left, Inches(5.3), Inches(2.2), Inches(0.4), label, font_size=12, color=RGBColor(150, 200, 190), align=PP_ALIGN.CENTER)

# Save
output_path = '/Users/patrickjeeninga/Coding/Royaltyportaal/pitch/Auteursportaal_Pitch.pptx'
prs.save(output_path)
print(f'✓ Saved to {output_path}')
