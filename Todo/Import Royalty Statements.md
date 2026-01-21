# Bulk Import Tool - Plan voor Admin Panel

## Overzicht
Een feature waarmee de admin in één keer meerdere PDFs kan uploaden en koppelen aan auteurs, zonder dat de bestanden vooraf hernoemd hoeven te worden.

## Workflow voor de Admin

1. **Voorbereiding** (buiten het systeem)
   - Admin heeft een map met PDF-bestanden (mag "1.pdf", "2.pdf", etc. heten)
   - Admin maakt een CSV-bestand met de mapping

2. **In het Admin Panel**
   - Klik op nieuwe tab "Bulk Import" in de sidebar
   - Upload een ZIP-bestand met alle PDFs
   - Upload een CSV-bestand met de mapping
   - Klik op "Importeren" knop
   - Bekijk resultaten en download resultatenbestand

---

## Technische Implementatie

### 1. Nieuwe Admin Sidebar Tab
**Bestand:** `index.html` (regel ~1869)

Toevoegen van een derde tab "Bulk Import" naast "Auteurs" en "Alle Wijzigingen":

```html
<button class="sidebar-tab" onclick="showSidebarTab('bulkimport')">Bulk Import</button>
```

En een bijbehorende content sectie:
```html
<div id="sidebarBulkImport" class="sidebar-content">
    <!-- Bulk import interface -->
</div>
```

### 2. Bulk Import Interface HTML
Nieuwe sectie met:
- Upload zone voor ZIP-bestand
- Upload zone voor CSV-bestand
- Instructies/voorbeeld CSV-formaat
- "Importeren" knop (disabled totdat beide bestanden zijn geselecteerd)
- Resultaten sectie (verborgen tot na import)

### 3. JavaScript Bibliotheken
- **JSZip** (CDN): Voor het uitpakken van ZIP-bestanden in de browser
- Bestaande **jsPDF**: Niet nodig voor deze feature

### 4. CSV Formaat
```csv
bestandsnaam,alliant_nummer,type,jaar
1.pdf,2512345,royalty,2024
2.pdf,2512345,subsidiary,2024
3.pdf,2534892,royalty,2024
```

Kolommen:
- `bestandsnaam`: Naam van het bestand in de ZIP
- `alliant_nummer`: Het Alliant ID van de auteur
- `type`: `royalty`, `subsidiary`, of `foreign`
- `jaar`: Het jaar van het document (bijv. 2024)

### 5. JavaScript Functies

```javascript
// Nieuwe globale variabelen
let bulkZipFile = null;
let bulkCsvFile = null;

// ZIP en CSV bestand handlers
function handleZipUpload(event) { ... }
function handleCsvUpload(event) { ... }

// Hoofd import functie
async function processBulkImport() {
    // 1. Parse CSV
    // 2. Extract ZIP met JSZip
    // 3. Loop door CSV regels
    // 4. Match alliant_nummer met auteur
    // 5. Voeg document toe aan auteur.payments
    // 6. Genereer resultaten
}

// Resultaten genereren
function generateImportResults(results) {
    // Toon in UI
    // Download als CSV/TXT
}

// Helper: Vind auteur op Alliant nummer
function findAuthorByAlliantNumber(alliantNr) {
    return Object.entries(DATA.authors).find(
        ([email, author]) => author.info.alliantNumber === alliantNr
    );
}
```

### 6. Resultaten Bestand
Na import wordt automatisch een resultatenbestand gegenereerd:

```csv
status,bestandsnaam,alliant_nummer,auteur_naam,auteur_email,document_type,jaar,opmerking
SUCCESS,1.pdf,2512345,Patrick Jeeninga,patrick@noordhoff.nl,royalty,2024,Toegevoegd
SUCCESS,2.pdf,2512345,Patrick Jeeninga,patrick@noordhoff.nl,subsidiary,2024,Toegevoegd
ERROR,3.pdf,9999999,,,royalty,2024,Alliant nummer niet gevonden
ERROR,4.pdf,2534892,Jan de Vries,jan@mail.nl,royalty,2024,Bestand niet in ZIP
```

### 7. CSS Styling
Nieuwe styles voor:
- Upload dropzones (drag & drop support)
- Bestand preview/badges
- Resultaten tabel
- Success/error kleuren

---

## Bestanden te Wijzigen

| Locatie | Wijziging |
|---------|-----------|
| `index.html` regel ~10 | JSZip CDN toevoegen |
| `index.html` regel ~1200 | CSS voor bulk import |
| `index.html` regel ~1869 | Sidebar tab toevoegen |
| `index.html` regel ~1880 | Bulk import HTML sectie |
| `index.html` regel ~2550 | JavaScript functies |

---

## Validaties en Foutafhandeling

1. **CSV validatie**
   - Controleer of alle vereiste kolommen aanwezig zijn
   - Controleer of type valid is (royalty/subsidiary/foreign)
   - Controleer of jaar een geldig getal is

2. **ZIP validatie**
   - Controleer of het een geldig ZIP-bestand is
   - Waarschuw als bestanden uit CSV niet in ZIP zitten

3. **Auteur matching**
   - Log alle niet-gevonden Alliant nummers
   - Toon duidelijk welke imports zijn mislukt

---

## UI Preview

```
┌─────────────────────────────────────────────┐
│  Bulk Import                                │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  📁 Sleep ZIP-bestand hier          │   │
│  │     of klik om te selecteren        │   │
│  │                                     │   │
│  │  ✓ documenten.zip (15 bestanden)    │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  📄 Sleep CSV-bestand hier          │   │
│  │     of klik om te selecteren        │   │
│  │                                     │   │
│  │  ✓ mapping.csv (15 regels)          │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  CSV formaat:                               │
│  bestandsnaam,alliant_nummer,type,jaar      │
│                                             │
│  [ Importeren ]                             │
│                                             │
├─────────────────────────────────────────────┤
│  Resultaten                                 │
│  ✓ 12 succesvol │ ✗ 3 mislukt              │
│                                             │
│  [ Download resultaten.csv ]                │
└─────────────────────────────────────────────┘
```

---

## Verificatie

Na implementatie testen met:
1. Upload een test ZIP met 3-4 PDF bestanden
2. Upload een CSV met correcte en incorrecte Alliant nummers
3. Verifieer dat:
   - Correcte imports verschijnen in de auteur documenten
   - Fouten duidelijk worden getoond
   - Resultatenbestand correct is
   - Bestaande auteur data niet wordt aangetast
