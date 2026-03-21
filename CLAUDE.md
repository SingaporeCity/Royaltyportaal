# Royaltyportaal — Noordhoff Auteursportaal

## Project Overview
Single-page application (vanilla HTML/CSS/JS) voor het Noordhoff Auteursportaal. Bevat een publieke website, login, auteur-dashboard en admin-dashboard. Hosted via GitHub Pages.

- **Live URL**: https://singaporecity.github.io/Royaltyportaal/
- **Repo**: https://github.com/SingaporeCity/Royaltyportaal

## Bestanden
| Bestand | Inhoud |
|---------|--------|
| `index.html` | Alle HTML: publieke pagina's, login, auteur dashboard, admin dashboard, modals |
| `styles.css` | Alle CSS |
| `app.js` | Routing, i18n (NL/EN), Supabase integratie, dashboard logica, quiz, vacatures |
| `config.js` | Supabase configuratie |
| `noordhoff-logo.png` | Officieel Noordhoff logo (teal, 602x128px) — gebruik ALTIJD dit bestand |
| `database/add-vacancies.sql` | Supabase migratie voor vacatures-tabel + seed data |

### Database & Scripts
| Pad | Inhoud |
|-----|--------|
| `database/schema.sql` | Volledige database schema (incl. `file_path` kolom op payments) |
| `database/add-file-path.sql` | Migratie: voegt `file_path` toe aan `payments` tabel |
| `database/add-storage-policies.sql` | RLS policies voor `statements` Storage bucket |
| `database/seed-data.sql` | Initiële data |
| `scripts/bulk-upload-pdfs.js` | CLI script voor bulk PDF upload naar Supabase Storage |
| `scripts/package.json` | Dependencies voor CLI scripts |
| `scripts/.env.example` | Template voor env variabelen |
| `supabase/functions/create-accounts/index.ts` | Edge Function: bulk aanmaken auth accounts |
| `supabase/functions/sync-netsuite/` | Edge Function: NetSuite sync |

## Design — Noordhoff Modern
- **Primary color**: `#007460` (teal) — niet wijzigen
- **Primary dark**: `#005a49`
- **Primary subtle**: `#f0faf7` (achtergrond-tint voor kaarten/badges)
- **Background**: `#ffffff` (wit)
- **Alt background**: `#F7F8FA` (lichtgrijs secties)
- **Text**: `#111827` (donker), `#6b7280` (light)
- **Border**: `#e5e7eb`
- **Border-radius**: `10px` (sm), `14px` (md), `18px` (lg), `100px` (pill) — moderne afgeronde hoeken
- **Kaarten**: 12-16px radius, subtiele schaduwen, witte achtergrond
- **Knoppen**: 10-12px radius, primaire knoppen met groene schaduw
- **Modals**: 20px radius, blur overlay
- **Font**: Roboto Flex variabel; headings weight 500-650 (bold), body 380
- **Topbar**: puur wit, geen border-top meer, subtiele border-bottom
- **Schaduwen**: kleur-getint, meerdere lagen (soft/medium/lg)

### Dark Mode
- Toggle via `toggleDarkMode()` — pill-vormige switch met zon/maan-iconen in dashboard header (auteur + admin)
- Persistentie via `localStorage` key `theme` (`"light"` of `"dark"`)
- Initialisatie bij laden via `initDarkMode()` (vóór `initPublicSite()`)
- CSS: `[data-theme="dark"]` selector op `<html>` overschrijft `:root` variabelen
- **Dark kleuren**: `--color-bg: #0f1117`, `--color-bg-alt: #161922`, `--color-white: #1a1d27`, `--color-text: #e8eaed`, `--color-text-light: #8b8fa4`, `--color-border: #2a2d3a`
- Dekking: header, tabs, KPI cards, chart, info cards, modals, formulieren, tabellen, admin panels, scrollbar, stat-cards, changes filter, detail tabs, content buttons, skeleton loaders, command palette, PDF preview
- Admin stat-cards gebruiken CSS classes (`stat-card-amber/green/blue/purple`) ipv inline styles voor dark mode compatibiliteit
- Smooth transitions: `0.3s ease` op background-color, border-color, color, box-shadow
- Dashboard logo krijgt `filter: brightness(0) invert(1)` in dark mode

### Skeleton Loading States
- Shimmer-animatie (`@keyframes shimmer`, 1.8s loop) op grijze placeholder-blokken
- `.skeleton-line` met breedte-varianten (`.w25` t/m `.w70`)
- **Events & Nieuws**: 2 items met tekst-skeletons in `.skeleton-list` → `.skeleton-item`
- **Payments**: 3 rijen met `.skeleton-payment` (circle + text + amount layout, zelfde structuur als echte items)
- **FAQ**: 4 bars met `.skeleton-faq` (border + radius matcht echte FAQ items)
- Worden automatisch vervangen door echte content zodra data laadt
- Dark mode: aangepaste gradient-kleuren voor shimmer

## Logo
Het logo is `noordhoff-logo.png` — een PNG met het icoon + "Noordhoff" tekst in teal. Dit wordt als `<img>` tag gebruikt op alle pagina's:
- **Nav**: 36px hoog (via CSS `.public-nav-logo img`)
- **Login branding panel**: wit versie via CSS `filter: brightness(0) invert(1)`, 40px hoog
- **Login form (mobiel)**: 32px hoog, getoond via `.login-logo-mobile` (verborgen op desktop)
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
- **URL**: `https://izulahsrsaspbskejbbp.supabase.co`
- Events, blog posts, FAQ, contracten, afrekeningen, **vacatures**, Storage (PDFs)
- Als Supabase niet bereikbaar is: statische fallback content wordt getoond (nieuws, evenementen, vacatures)
- Admin kan events/nieuws/FAQ/vacatures beheren via modals

## Vacatures
- Supabase-tabel `vacancies` met velden: title, segment, subject, type, hours, description, is_active
- Frontend toont vacatures op `page-auteur` met segment-filter (alle/bao/vo/mbo/ho)
- Fallback: 8 hardcoded vacatures als Supabase niet beschikbaar is
- Admin CRUD via `openVacancyManager()` / `openVacancyEditor()` / `saveVacancy()` / `deleteVacancy()`
- Migratie: `database/add-vacancies.sql`

## Dashboard UX Polish

### Header Zoekbalk
- `.header-search-trigger` rechts in `.header-user` groep — klikbaar, opent command palette
- Toont vergrootglas + "Zoeken..." + `⌘K` badge
- Mobiel: collapsed naar alleen icoon

### Tijd-gebaseerde Begroeting
- `updateGreeting()` zet "Goedemorgen/Goedemiddag/Goedenavond/Goedenacht" op basis van uur
- Tweetalig NL/EN, aangeroepen in `initAuthorDashboard()`
- Element: `#greetingText` (was statisch `data-i18n="greeting"`)

### Animated KPI Counters
- `animateCounter(elementId, targetValue, isCurrency, delay)` — count-up animatie
- Ease-out cubic easing, 800ms duur, staggered delays (0/100/200/300ms)
- Gebruikt `requestAnimationFrame` voor smooth 60fps

### Scroll bij Tab Switch
- Bij tab-klik: scrollt alleen **omlaag** als tabs onder de viewport zitten, nooit omhoog
- Voorkomt dat korte tabs (bijv. Contracten) ongewenst omhoog springen
- Scroll wordt overgeslagen als de guided tour actief is (`_tourActive`)

## Dashboard Tile Systeem (Start Tab)
- `.dash-tile`: kaart met header-bar (icoon + titel) + content area, border-top 2px teal accent
- Gebruikt voor: royalty chart, evenementen, nieuws
- `.dash-tile-header` met `.dash-tile-title` (icoon + h3)
- KPI cards hebben gekleurde top-borders per type: blauw (#3b82f6), teal (#14b8a6), paars (#a855f7) via `:has()` selector
- **Academy banner** (`.academy-banner`): compacte link met teal icoon-cirkel, twee-regelige tekst, groene linker border, "Bezoek site" badge met external-link icoon
- **Achtergrond**: dashboard body en tab-content gebruiken `var(--color-bg-alt)` (#F7F8FA), kaarten zijn wit — creëert diepte
- Alle hardcoded `background: white` vervangen door `var(--color-white)` voor consistente theming

## Royalty Chart — Card Grid per Jaar
- **Layout**: CSS grid met kaarten per jaar (nieuwste eerst), `repeat(auto-fit, minmax(240px, 1fr))`
- **Per kaart**: jaarlabel, YoY verandering (%), totaalbedrag, gesegmenteerde bar, type-pills met bedragen
- **Kleuren** (Noordhoff brand): Royalties = `#2E8B7A` (donker teal), Nevenrechten = `#93C5CF` (lichtblauw), Foreign = `#E8734A` (koraal)
- **Bar**: 10px dik, pill-dots 8px — goed zichtbaar
- **Animatie**: `chartCardIn` fade-in met staggered delay per kaart
- **Responsive**: op mobiel (≤768px) grid wordt 1 kolom
- **Functie**: `renderRoyaltyChart(payments)` in `app.js`
- **BELANGRIJK**: Kleuren zijn consistent overal — chart, payment icons, type filter pills, admin detail gradients

## Trend Chart (Prognose Tab)
- Pure SVG area chart boven de prediction card op tab-forecast
- Historische royalty-totalen per jaar + geprojecteerd prognosejaar
- Gevulde area met gradient, gestreepte lijn voor forecast, pulserende dot
- Compacte labels (`formatCompactCurrency`: €2,4k formaat), y-as gridlijnen
- `renderTrendChart(author)` aangeroepen vanuit `initPredictions()`
- **Aspect ratio**: viewBox breedte = `container.clientWidth`, hoogte = 22% van breedte (min 140px, max 180px)
- `preserveAspectRatio="xMidYMid meet"` — cirkels blijven rond, tekst vervormt niet
- Geen externe dependencies (geen Chart.js)

## Command Palette (Ctrl+K / Cmd+K)
- `openCmdPalette()` / `closeCmdPalette()` — Notion/Linear-style zoekoverlay
- **Context-aware**: toont dashboard tabs (auteur), auteurs + navigatie (admin), pagina's (publiek)
- `getCmdPaletteCommands()` bouwt commands lijst op basis van actieve view
- Keyboard: pijltjestoetsen navigeren, Enter voert uit, Escape sluit
- `renderCmdPaletteResults(query)` filtert en groepeert resultaten
- Gegroepeerde items (Navigatie / Acties / Auteurs / Afrekeningen / Contracten / FAQ) met iconen en hints
- Admin: alle auteurs doorzoekbaar met initialen-avatar
- **Uitgebreide zoek**: payment type filters (Royalties/Nevenrechten/Foreign), contract namen, FAQ vragen doorzoekbaar
- **Rondleiding**: "Rondleiding" commando start de guided tour

## Admin Breadcrumbs
- `updateAdminBreadcrumb()` — toont "Dashboard › Auteurs › Patrick Jeeninga"
- Aangeroepen bij `selectAuthor()`, `showChangesPanel()`, `showAuthorDetailPanel()`
- `adminBreadcrumbNav(target)` voor klikbare navigatie terug
- Element: `#adminBreadcrumb` in `.admin-content`

## Admin Activiteiten Feed
- `renderActivityFeed()` — verzamelt login + change_request events van alle auteurs
- Sorteert op tijd (nieuwste eerst), limiet 20 items
- Per item: avatar met type-kleur (login/change/approved/rejected), tekst, relatieve tijd
- `formatTimeAgo(date)` — "Zojuist", "5 min geleden", "2 uur geleden", "3 dagen geleden"
- Slide-in animatie met staggered delay, auto-refresh elke 30s
- Layout: zijkolom naast Content beheer + Email instellingen (`.admin-two-col` grid: `1fr 320px`)

## Admin E-mail Instellingen (cosmetisch)
- Drie toggles: "Nieuwe afrekening", "Wijzigingsverzoek goedgekeurd", "Wachtwoord reset"
- `toggleEmailSetting(btn)` + `restoreEmailSettings()` via `localStorage`
- Puur visueel — geen backend, geen e-mails
- Badge "Configuratie" naast titel

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

### Database tabellen
| Tabel | Doel |
|-------|------|
| `authors` | Auteurprofielen met NetSuite IDs, persoonlijke gegevens, bankinfo |
| `contracts` | Contracten per auteur |
| `payments` | Afrekeningen (type: royalty/subsidiary/foreign), met `file_path` naar Storage |
| `forecasts` | Prognoses (min/max bedrag per jaar) |
| `change_requests` | Wijzigingsverzoeken (pending/approved/rejected) |
| `login_history` | Login timestamps |
| `events` | Evenementen (admin managed) |
| `blog_posts` | Nieuwsberichten (admin managed) |
| `sync_log` | Import tracking |

### Storage
- **Bucket**: `statements` (private)
- **Padconventie**: `{author_uuid}/{type}/{year}/{bestandsnaam}.pdf`
- RLS: auteurs downloaden eigen bestanden, admins uploaden/verwijderen

## PDF Preview & Afrekeningen

### PDF Preview Modal
- Klik op oog-icoon bij afrekening opent PDF in modal viewer (`#pdfPreviewModal`)
- Modal: 900px breed, 88vh hoog, met header (titel + bedrag), download-knop, sluit-knop
- Echte PDF: laadt via signed URL in `<iframe>`
- jsPDF fallback: genereert blob URL en toont in iframe
- Loading spinner met fallback timeout (3s), sluit op Escape/overlay-klik, scroll-lock op body
- Blob URLs worden vrijgegeven bij sluiten via `URL.revokeObjectURL()`

### Zoeken & Filteren in Afrekeningen
- **Zoekbalk** (`#paymentsSearchInput`): filtert live op titel, datum, bedrag, type-naam
- **Type pills** (`#paymentsTypeFilter`): Alle / Royalties / Nevenrechten / Foreign met gekleurde dots
- **Resultaatteller** (`#paymentsResultCount`): "3 van 8 afrekeningen" bij actief filter
- **State**: `_paymentTypeFilter` en `_paymentYearFilter` variabelen, `filterPayments()` en `setPaymentTypeFilter()`
- Clear-knop (x) in zoekveld, lege state met zoek-icoon

### CSV Export
- `exportPaymentsCSV()` — genereert CSV met `;` als scheidingsteken + UTF-8 BOM
- Kolommen: Jaar, Type, Omschrijving, Datum, Bedrag (komma als decimaalteken)
- Inclusief totalen per jaar + eindtotaal
- Bestandsnaam: `afrekeningen_{Naam}_{datum}.csv`

### Auteur-download
- `downloadPaymentPDF()` controleert eerst `payment.filePath`
- Als `filePath` bestaat → download via `createSignedUrl()` (echte PDF uit Storage)
- Als geen `filePath` → fallback naar jsPDF-gegenereerde PDF (jaaropgaves, legacy data)

### Admin — enkelvoudige upload
- File input in "Document toevoegen" en "Document bewerken" modals
- Bij opslaan: upload naar Storage + `file_path` opslaan in payment record
- Toont huidige bestandsnaam als er al een PDF geüpload is

### Admin — bulk upload modal
- Trigger: "PDF afrekeningen importeren" knop in admin dashboard
- **Prefix-configuratie**: 3 invoervelden per type (royalty/nevenrechten/foreign), opgeslagen in `localStorage`
- **Drop zone**: drag & drop of file picker voor meerdere PDFs
- **Filename parser**: splitst `PREFIX_xxxxxxx_Naam_YYYYMM.pdf` → type (via prefix), auteur (via `netsuite_internal_id` lookup), jaar
- **Preview tabel**: bestandsnaam, gematcht type, gevonden auteur, status (match/geen match)
- **Upload**: sequentieel per bestand → Storage upload + payment record aanmaken
- **Voortgang**: progressbar + samenvatting

### CLI bulk upload
```bash
cd scripts && npm install
node bulk-upload-pdfs.js ./pdfs-map --prefix-royalty=RA --prefix-subsidiary=NR --prefix-foreign=FR
```
Vereist `SUPABASE_URL` en `SUPABASE_SERVICE_ROLE_KEY` in `scripts/.env`.

## Admin Payment CRUD
`saveNewPayment()`, `saveStatement()`, `deletePayment()` schrijven naar Supabase:
- **Create**: `supabaseClient.from('payments').insert()` + Storage upload
- **Update**: `supabaseClient.from('payments').update()` + Storage upload (upsert)
- **Delete**: `supabaseClient.from('payments').delete()` + Storage file verwijderen
- Na elke operatie: `loadAllAuthorsForAdmin()` voor data refresh uit DB

## Login & Authenticatie

### Login scherm — Split-screen design
- **Layout**: `.login-page-inner` is een flex container met twee panelen
- **Links** (`.login-brand-panel`): Noordhoff branding — donkergroen gradient (`160deg, #007460 → #005a49 → #004035`), wit logo, "Auteursportaal" titel, subtitel, statistieken (190 jaar, 2500+ auteurs, 1000+ publicaties), decoratieve cirkels via `::before`/`::after`
- **Rechts** (`.login-form-panel`): eigen topbar (`.login-form-topbar`) met "Terug naar website" knop, kaart gecentreerd in `.login-form-center` (flex layout, geen absolute positionering)
- **Mobiel** (≤768px): branding panel verborgen (`display: none`), `.login-logo-mobile` wordt zichtbaar
- **Tablet** (≤1024px): branding panel krimpt naar 40%

### Sessie-persistentie
- Bij app-init: `restoreSession()` → `supabaseClient.auth.getSession()` → als sessie bestaat, profiel laden en direct naar dashboard
- `onAuthStateChange` listener voor `SIGNED_OUT` (logout) en `PASSWORD_RECOVERY` (wachtwoord reset link) events

### Wachtwoord vergeten flow
Drie schermen in de login-card:
1. **Login** (`#loginForm`): standaard login
2. **Reset aanvragen** (`#forgotPasswordForm`): email invoeren → `resetPasswordForEmail()` → bevestigingsbericht
3. **Nieuw wachtwoord** (`#setNewPasswordForm`): verschijnt na klikken op email-link → `updateUser({ password })` → redirect naar login

### Bulk account-aanmaak
- **Edge Function**: `supabase/functions/create-accounts/index.ts`
  - Ontvangt `{ accounts: [{ email, author_id }] }`
  - Maakt auth user aan met `admin.createUser({ id: author_id })` — UUID matcht bestaande author
  - Stuurt recovery email
  - Skipped bestaande accounts
- **Admin UI**: "Accounts aanmaken" knop in dashboard → modal met selecteerbare auteurs → Edge Function aanroepen

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

## Dashboard Tabs — Volgorde & Structuur
**Volgorde**: Start, Afrekeningen, Contracten, Prognose, Declaraties, FAQ, Profiel

| Tab | data-tab | Inhoud |
|-----|----------|--------|
| Start | `start` | Year in Review (hero + 3 stats), royalty chart, events, nieuws |
| Afrekeningen | `payments` | Zoek/filter, type pills, jaar filter, payment items met preview |
| Contracten | `contracts` | Contracten tabel met preview/download icons |
| Prognose | `forecast` | Verwachte royalties, trend chart, range bar |
| Declaraties | `expenses` | Vendor ID notice, upload formulier, ingediende declaraties |
| FAQ | `faq` | Accordion FAQ items |
| Profiel | `info` | ID nummers, persoonlijke gegevens, bewerken |

- Tab "Gegevens" is hernoemd naar **"Profiel"** (NL) / "Profile" (EN)
- FAQ tekst referenties naar "Gegevens" zijn geüpdatet naar "Profiel"

## Year in Review (`.yr-card`)
- Donkergroene kaart bovenaan Start tab
- **Hero block**: groot gecentreerd bedrag "Uitgekeerd in [jaar]" + YoY percentage badge
- **3 sub-stats** eronder: "Totaal vanaf [jaar-picker]", "Laatste betaling" (bedrag + datum), "Actieve contracten"
- **Jaar-picker**: pill-toggle knoppen (2023 | 2024) onder "Totaal vanaf" — herberekent totaal on-click via `setTotalFromYear()`
- `container._yearTotals` slaat data op voor herberekening
- Geen ster-icoon bij "Jaaroverzicht" badge — alleen tekst

## Declaraties Tab (nieuw)
- **Vendor ID notice**: teal banner bovenaan toont het Vendor nummer van de auteur
- **Indienformulier**: omschrijving + bedrag + drag & drop PDF upload (alleen PDF, max 10 MB)
- **File handling**: `handleExpenseFile()` valideert type/grootte, toont bestandsnaam met verwijder-knop
- **Submit knop**: disabled tot alles ingevuld, success-feedback na indienen
- **Geschiedenis**: lijst van ingediende declaraties met status badges (In behandeling/Goedgekeurd/Afgewezen)
- **Opslag**: `localStorage` key `expenses` (demo-modus, geen Supabase backend)
- **Vertaalsleutels**: `expenses_*` in NL en EN

## Contract PDF Preview
- `generateContractPDFDoc(contract, author)` — geëxtraheerde helper uit `downloadAuthorContractPDF()`
- `previewContractPDF(index)` — hergebruikt het bestaande PDF preview modal
- Contracten tabel toont **oog-icoon** (preview) + **download-icoon** naast elkaar
- CSS: `.contract-actions` flex container, `.contract-action-btn` met hover-state

## Afrekeningen — Jaar-groepering
- Payments gesorteerd per jaar (nieuwste eerst), jaaropgave eerst binnen elk jaar
- **Jaar-headers** getoond wanneer filter "Alle" en type filter "Alle"
- `resolvePayment()` gesynchroniseerd met dezelfde sortering
- CSS: `.payments-year-header` met uppercase styling

## Favicon
- Inline SVG in `<head>` — twee overlappende teal vierkanten
- Geen extern bestand nodig

## Guided Tour (Rondleiding)
- **"?" knop** in dashboard header (`header-help-btn`) start `startGuidedTour()`
- Tour-panel vervangt de welcome section content inline (geen floating tooltip)
- **7 stappen**: Start → Afrekeningen → Contracten → Prognose → Declaraties → FAQ → Profiel
- Elke stap: titel + beginner-friendly beschrijving (NL/EN via `getTourSteps()`)
- Actieve tab wordt geklikt → content zichtbaar, tab + content gehighlight boven overlay
- **Overlay** dimt achtergrond (`tour-overlay` z-index 999), highlighted elementen z-index 1001+
- Navigatie: Vorige/Volgende/Sluiten + Escape
- Welcome section content wordt hersteld bij sluiten (`welcome._originalHTML`)
- Tab-switch scroll overgeslagen tijdens tour (`_tourActive` flag)
- Ook bereikbaar via Cmd+K → "Rondleiding"

## Sessie & Login Fixes
- **`restoreSession()`**: bij geen sessie/fout → `showLoginPage()` (niet publieke site)
- Bij fout profiel-fetch → `signOut()` om stale tokens op te ruimen
- **`logout()`**: roept ALTIJD `supabaseLogout()` aan (ook bij lokale demo-login) om localStorage tokens te wissen
- **Startpagina**: loginscherm is standaard zichtbaar bij pageload (`loginPage` geen `hidden` class, `publicSite` wel)
- **Logo-klik** in dashboard → navigeert naar Start tab (auteur) / Dashboard overzicht (admin), niet naar publieke site

## Postcode Validatie
- Nederlands formaat: `^\d{4}\s?[A-Za-z]{2}$` (bijv. "1234 AB")
- Gevalideerd in `saveEditedInfo()` vóór IBAN check
- Alert met NL/EN foutmelding bij ongeldig formaat

## Header Styling
- `.header-logo-sub` ("AUTEURSPORTAAL") heeft `position: relative; top: 1px` voor verticale uitlijning met logo

## Responsive Design (Mobile)

### 768px (Tablet)
- Header: 4-kolom grid (`auto 1fr auto auto`)
- **Tabs**: hamburger-stijl dropdown — `.mobile-tab-toggle` toont actieve tab-naam + chevron
  - Klik → `.tabs-nav.mobile-open` toont alle tabs verticaal (icon + label)
  - Tab kiezen → menu sluit, label update
  - Desktop: toggle knop `display: none`, tabs normaal horizontaal
- Dashboard content: padding `1.5rem 1rem`
- Contracten tabel: horizontaal scrollbaar
- Year Review stats: 1 kolom gestapeld
- `.tab-btn.active`: teal achtergrond, geen bottom-bar maar left-accent via `::after`

### 480px (Telefoon)
- Header: logo-tekst + divider verborgen, alleen logo-afbeelding
- Help-knop: 30×30px
- Tab toggle: kleiner padding/font
- Dashboard content: `1rem 0.75rem`
- Welcome h1: 1.3rem
- Year Review: hero 1.85rem, compactere stats
- Year pills: kleiner (0.58rem)
- Payments: scrollbare year-filter
- Profiel: ID nummers gestapeld
- Tour panel: compacter
- Command palette: bijna full-width

## Auteur Onboarding — End-to-End Flow

### Wat werkt
1. **Admin maakt accounts aan** via Edge Function `create-accounts` → Supabase auth users met recovery email
2. **Auteur ontvangt email** met wachtwoord-reset link → stelt wachtwoord in → kan inloggen
3. **Auteur ziet alleen eigen data** — RLS enforced op alle tabellen (`author_id = auth.uid()`)
4. **Admin uploadt statements** — enkel of bulk → PDF in Storage + payment record in DB
5. **Auteur bekijkt statements** — filter, zoek, preview PDF, download, CSV export

### Wat geconfigureerd moet worden (geen code)
- **Supabase Dashboard → Auth → Email Templates**: wachtwoord-reset email aanpassen met Noordhoff branding
- **Redirect URL**: `https://singaporecity.github.io/Royaltyportaal/`

### Bekende beperkingen
| Issue | Status | Details |
|-------|--------|---------|
| Bulk upload zet bedrag op €0 | Bug | Admin moet bedragen handmatig invullen na bulk import |
| Geen email bij nieuwe statement | Ontbreekt | Auteur krijgt geen notificatie als admin een afrekening uploadt |
| Declaraties tab geen backend | Ontbreekt | UI werkt met localStorage, geen Supabase tabel, geen admin-goedkeuring |
| Contract PDF upload | Ontbreekt | Kolom `contract_pdf` bestaat maar geen upload-UI voor echte bestanden |
| Duplicate payment preventie | Ontbreekt | Zelfde auteur/jaar/type kan meerdere keren aangemaakt worden |
| Admin email instellingen | Cosmetisch | Toggles zijn UI-only, geen echte emails worden verstuurd |

## Deployment stappen (na code push)
1. **Supabase SQL Editor**: Run `database/add-file-path.sql`
2. **Supabase SQL Editor**: Run `database/add-storage-policies.sql`
3. **Supabase Dashboard**: Email templates aanpassen voor wachtwoord-reset (Noordhoff branding)
4. **Supabase Dashboard**: Redirect URL instellen → `https://singaporecity.github.io/Royaltyportaal/`
5. **Edge Function deployen**: `supabase functions deploy create-accounts`
6. **CLI script** (optioneel): `cd scripts && npm install && node bulk-upload-pdfs.js ./pdfs-map`
