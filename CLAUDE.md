# Royaltyportaal — Noordhoff Auteursportaal

## Project Overview
Single-page application (vanilla HTML/CSS/JS) voor het Noordhoff Auteursportaal. Bevat een publieke website, login, auteur-dashboard en admin-dashboard. Hosted via GitHub Pages.

- **Live URL**: https://singaporecity.github.io/Royaltyportaal/
- **Repo**: https://github.com/SingaporeCity/Royaltyportaal

## Bestanden
| Bestand | Inhoud |
|---------|--------|
| `index.html` | Alle HTML: publieke pagina's, login, auteur dashboard, admin dashboard, modals |
| `styles.css` | Alle CSS (~4300 regels) |
| `app.js` | Routing, i18n (NL/EN), Supabase integratie, dashboard logica |
| `config.js` | Supabase configuratie |
| `noordhoff-logo.png` | Officieel Noordhoff logo (teal, 602x128px) — gebruik ALTIJD dit bestand |

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
| `page-home` | Home | Hero (50/50 met foto) + Stats + Nieuws & Evenementen |
| `page-auteur` | Auteur worden | Segmenten + Waarom auteur + Wie zoeken wij |
| `page-proces` | Het proces | Processtappen + Testimonials (met Unsplash foto's) |
| `page-academy` | Academy | Academy cards (workshops, didactiek, digitaal) |
| `page-contact` | Contact | FAQ + Contactformulier |

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

## i18n
Tweetalig (NL/EN) via `TRANSLATIONS` object in `app.js`. Alle vertaalbare elementen gebruiken `data-i18n` attributen. Taalswitch in de nav.

## Supabase Backend
- Events, blog posts, FAQ, contracten, afrekeningen
- Als Supabase niet bereikbaar is: statische fallback content wordt getoond (nieuws, evenementen)
- Admin kan events/nieuws/FAQ beheren via modals

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
