# Royaltyportaal — Noordhoff Auteursportaal

## Project Overview
Single-page application (vanilla HTML/CSS/JS) voor het Noordhoff Auteursportaal. Bevat een publieke website, login, auteur-dashboard en admin-dashboard. Hosted via GitHub Pages.

- **Live URL**: https://singaporecity.github.io/Royaltyportaal/
- **Repo**: https://github.com/SingaporeCity/Royaltyportaal

## Bestanden
| Bestand | Inhoud |
|---------|--------|
| `index.html` | Alle HTML: publieke pagina's, login, auteur dashboard, admin dashboard, modals |
| `styles.css` | Alle CSS (~5200 regels) |
| `app.js` | Routing, i18n (NL/EN), Supabase integratie, dashboard logica, quiz, vacatures |
| `config.js` | Supabase configuratie |
| `noordhoff-logo.png` | Officieel Noordhoff logo (teal, 602x128px) — gebruik ALTIJD dit bestand |
| `database/add-vacancies.sql` | Supabase migratie voor vacatures-tabel + seed data |

## Design — Noordhoff Huisstijl
- **Primary color**: `#007460` (teal)
- **Background**: `#ffffff` (wit)
- **Alt background**: `#F5F5F5` (lichtgrijs secties)
- **Border-radius**: `4px` overal (geen pill-shapes)
- **Font**: variabele font, h2 weight 360 (licht), body 300
- **Topbar**: puur wit (`#ffffff`), geen blur/transparantie

## Logo
Het logo is `noordhoff-logo.png` — een PNG met het icoon + "Noordhoff" tekst in teal. Dit wordt als `<img>` tag gebruikt op alle pagina's:
- **Nav**: 36px hoog (via CSS `.public-nav-logo img`)
- **Login**: 36px hoog, gecentreerd
- **Dashboards**: 28px hoog
- **Footer**: wit versie via CSS `filter: brightness(0) invert(1)`

**BELANGRIJK**: Gebruik NOOIT een nagebouwde SVG voor het logo. Altijd `noordhoff-logo.png`.

## Pagina-structuur (SPA Router)
De publieke site gebruikt een multi-page router via `navigateTo(pageName)`:

| Page ID | Route | Inhoud |
|---------|-------|--------|
| `page-home` | Home | Hero + Info-sessie banner + Stats + Methode-logos + Nieuws & Evenementen |
| `page-auteur` | Auteur worden | Vacatures + Segmenten + Info-sessie banner + Waarom auteur + Praktische info + Wie zoeken wij + Verdienmodel |
| `page-proces` | Het proces | Processtappen (met accordion) + Een week als auteur + Testimonials (incl. beginners) |
| `page-academy` | Academy | Academy cards (workshops, didactiek, digitaal) |
| `page-contact` | Contact | FAQ (16 items) + Zelftest quiz + Contactformulier (progressief) + Deelfunctie |

## Navigatie
- Mega-dropdowns bij "Auteur worden" en "Het proces" (CSS hover, alleen desktop)
- `navigateTo('pagina')` + `scrollToSection('sectie')` voor deep linking

### Mobiel menu (≤768px)
- Hamburger-knop rechtsboven, toggled via `toggleMobileMenu()` in `app.js`
- Menu is een compact dropdown-panel onder de navbar (`position: absolute; top: 100%`), **geen** full-screen overlay
- Mega-dropdowns en featured foto zijn volledig verborgen op mobile (`display: none !important`)
- Dropdown-pijltjes (▾) zijn verborgen; klikken op "Auteur worden" / "Het proces" navigeert direct naar de pagina
- Bevat een eigen "Inloggen" knop (`.mobile-login-btn`) en taalkeuze (`.mobile-lang-toggle`), omdat `.public-nav-actions` hidden is op mobile
- Menu sluit automatisch bij navigatie
- **Desktop is ongewijzigd** — alle mobile-specifieke CSS zit in `@media (max-width: 768px)`

### Navbar offset
- Alle `.public-page` containers hebben `padding-top: 80px` zodat content onder de vaste navbar begint
- `html` heeft `scroll-padding-top: 80px` voor correcte scroll-positionering
- `scrollToSection()` in `app.js` berekent de navbar hoogte dynamisch en scrollt met offset

## i18n
Tweetalig (NL/EN) via `TRANSLATIONS` object in `app.js`. Alle vertaalbare elementen gebruiken `data-i18n` attributen. Taalswitch in de nav.

## Supabase Backend
- Events, blog posts, FAQ, contracten, afrekeningen, **vacatures**
- Als Supabase niet bereikbaar is: statische fallback content wordt getoond (nieuws, evenementen, vacatures)
- Admin kan events/nieuws/FAQ/vacatures beheren via modals

## Vacatures
- Supabase-tabel `vacancies` met velden: title, segment, subject, type, hours, description, is_active
- Frontend toont vacatures op `page-auteur` met segment-filter (alle/bao/vo/mbo/ho)
- Fallback: 8 hardcoded vacatures als Supabase niet beschikbaar is
- Admin CRUD via `openVacancyManager()` / `openVacancyEditor()` / `saveVacancy()` / `deleteVacancy()`
- Migratie: `database/add-vacancies.sql`

## Nieuwe features (verbeterplan)
- **Informatiesessie-banner**: Op home + auteur pagina, groen gradient met aanmeldknop
- **Praktische info sectie**: Freelance basis, uren, locatie, projectduur op page-auteur
- **Verdienmodel sectie**: Royaltymodel, voorschot, afrekening, portaal-inzicht op page-auteur (#financial)
- **Processtappen uitgebreid**: Elk van 4 stappen heeft `<details>` accordion met extra info
- **Contactpersoon**: Lisa de Vries met foto in contactsectie
- **FAQ uitgebreid**: 16 vragen (was 6), inclusief beginnersvragen
- **Zelftest quiz**: "Past auteurschap bij mij?" — 5 vragen met score op page-contact
- **Progressief contactformulier**: Extra velden (segment, vak, functie, beschikbaarheid) bij "Ik wil auteur worden"
- **Floating CTA**: "Word auteur" knop verschijnt bij scrollen voorbij 600px
- **Een week als auteur**: Weekoverzicht op page-proces
- **Verbeterde testimonials**: 2 nieuwe beginner-testimonials bovenaan + "Recent gestart" badge
- **Methode-logos**: Getal & Ruimte, Kern, Nectar etc. als social proof op home
- **Deelfunctie**: WhatsApp/LinkedIn/Email/Kopieer knoppen op page-contact
- **SEO meta tags**: Description, keywords, Open Graph, canonical URL

## Nieuws & Evenementen (statische fallback)
Als Supabase niet beschikbaar is, worden deze items getoond:

**Nieuws:**
- Kabinet-Schoof presenteert nieuwe onderwijsagenda
- Herziene kerndoelen: wat verandert er voor auteurs?
- Noordhoff investeert in adaptief leren

**Evenementen:**
- Noordhoff 190 jaar Jubileumfeest (21 juni, Martiniplaza Groningen)
- Auteursinspraak: Kerndoelen & Curriculum
- Workshop: Schrijven voor digitaal onderwijs
- Auteursinspraak: Toetsing & Differentiatie

## Hero Image
`brooke-cagle--uHVRvDr7pg-unsplash.jpg` — lokaal bestand, gecommit in git.

## Footer
- "Ontworpen door Patrick Jeeninga" (NL) / "Designed by Patrick Jeeninga" (EN)
- Social icons: LinkedIn, Instagram, X
- Legal links: Privacybeleid, Voorwaarden, Cookies
