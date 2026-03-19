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
- Dekking: header, tabs, KPI cards, chart, info cards, modals, formulieren, tabellen, admin panels, scrollbar
- Smooth transitions: `0.3s ease` op background-color, border-color, color, box-shadow
- Dashboard logo krijgt `filter: brightness(0) invert(1)` in dark mode

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

## Royalty Chart — Horizontale Revenue Timeline
- **Vervangt** de vorige stacked bar chart (die slecht werkte voor 1-3 producten per jaar)
- **Layout**: horizontale rijen per jaar (nieuwste bovenaan) via `.chart-timeline` → `.chart-year-row` (CSS grid: `52px 1fr auto`)
- **Per rij**: jaarlabel links, horizontale progress bar (`.chart-year-bar-track` met `.chart-year-bar-fill` segmenten), totaalbedrag rechts
- **Segmenten**: `.royalty` (primary), `.subsidiary` (#14b8a6), `.foreign` (#6DB5C5) — zelfde kleuren als voorheen
- **Detail labels**: bij meerdere types verschijnen `.chart-year-segments` onder de bar met bedragen per type
- **Legend**: alleen getoond als er meerdere payment types zijn
- **Hover**: subtiele groene tint op `.chart-year-row:hover`
- **Responsive**: op mobiel (≤768px) verdwijnen segment-labels, grid krimpt
- **Functie**: `renderRoyaltyChart(payments)` in `app.js`, groepeert payments per jaar en type

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

## PDF Afrekeningen

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
- **Links** (`.login-brand-panel`): Noordhoff branding — donkergroen gradient (`160deg, #007460 → #005a49 → #004035`), wit logo, "Auteursportaal" titel, subtitel, statistieken (190+ jaar, 500+ auteurs, 1000+ publicaties), decoratieve cirkels via `::before`/`::after`
- **Rechts** (`.login-form-panel`): witte kaart met formulier, "Terug naar website" knop linksboven (met SVG pijl-icoon)
- **Mobiel** (≤768px): branding panel verborgen (`display: none`), `.login-logo-mobile` wordt zichtbaar, back-knop wordt `position: static`
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

## Deployment stappen (na code push)
1. **Supabase SQL Editor**: Run `database/add-file-path.sql`
2. **Supabase SQL Editor**: Run `database/add-storage-policies.sql`
3. **Supabase Dashboard**: Email templates aanpassen voor wachtwoord-reset (Noordhoff branding)
4. **Supabase Dashboard**: Redirect URL instellen → `https://singaporecity.github.io/Royaltyportaal/`
5. **Edge Function deployen**: `supabase functions deploy create-accounts`
6. **CLI script** (optioneel): `cd scripts && npm install && node bulk-upload-pdfs.js ./pdfs-map`
