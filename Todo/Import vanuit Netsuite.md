# Import vanuit NetSuite - Royaltyportaal

> Plan voor het laden van auteurs vanuit NetSuite naar het Royaltyportaal, inclusief automatische synchronisatie voor nieuwe auteurs.

---

## Inhoudsopgave

1. [Overzicht](#1-overzicht)
2. [Huidige Situatie](#2-huidige-situatie)
3. [Benodigde Infrastructuur](#3-benodigde-infrastructuur)
4. [Architectuur Opties](#4-architectuur-opties)
5. [Aanbevolen Implementatie](#5-aanbevolen-implementatie)
6. [Data Mapping](#6-data-mapping)
7. [Implementatie Stappenplan](#7-implementatie-stappenplan)
8. [Kostenanalyse](#8-kostenanalyse)

---

## 1. Overzicht

### Doel

1. **Initiële import**: Alle bestaande auteurs (Vendors) uit NetSuite laden in het Royaltyportaal
2. **Continue sync**: Nieuwe auteurs automatisch toevoegen wanneer ze in NetSuite worden aangemaakt
3. **Data actueel houden**: Wijzigingen in NetSuite (door admin) doorvoeren naar het portaal

### Flow

```
┌─────────────┐                    ┌─────────────┐                    ┌─────────────┐
│  NetSuite   │ ──── sync ─────▶  │  Database   │ ◀──── login ────── │   Auteur    │
│  (Vendors)  │                    │  (Supabase) │                    │  (Browser)  │
└─────────────┘                    └─────────────┘                    └─────────────┘
       │                                  │
       │                                  │
       ▼                                  ▼
  Bron van                           Portaal leest
  waarheid                           vanuit database
```

---

## 2. Huidige Situatie

### Wat er nu is

Het Royaltyportaal is momenteel een **statische frontend applicatie**:

| Component | Huidige Status |
|-----------|----------------|
| Auteurs data | Hardcoded in `app.js` (DATA.authors object) |
| Database | Geen |
| Backend API | Geen |
| Authenticatie | Simpele wachtwoord check in frontend |
| Hosting | Lokaal / statische bestanden |

### Waarom dit moet veranderen

Om auteurs vanuit NetSuite te laden zijn minimaal nodig:

1. **Database** - Persistente opslag voor auteursgegevens
2. **Backend/API** - Veilige communicatie met NetSuite
3. **Authenticatie** - Echte login met sessies/tokens

---

## 3. Benodigde Infrastructuur

### Minimale Setup

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Nieuwe Architectuur                          │
│                                                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│  │   Frontend   │───▶│   Backend    │───▶│      Database        │  │
│  │   (Huidige   │    │   (Node.js   │    │    (PostgreSQL /     │  │
│  │    HTML/JS)  │    │   of Python) │    │     Supabase)        │  │
│  └──────────────┘    └──────────────┘    └──────────────────────┘  │
│                             │                                       │
│                             │                                       │
│                             ▼                                       │
│                      ┌──────────────┐                              │
│                      │   NetSuite   │                              │
│                      │   REST API   │                              │
│                      └──────────────┘                              │
└─────────────────────────────────────────────────────────────────────┘
```

### Componenten Overzicht

| Component | Optie A (Managed) | Optie B (Self-hosted) |
|-----------|-------------------|----------------------|
| Database | Supabase (gratis tier) | PostgreSQL op VPS |
| Backend | Supabase Edge Functions | Node.js op Railway/Render |
| Auth | Supabase Auth | Custom JWT implementatie |
| Sync Job | Supabase CRON | AWS Lambda + EventBridge |

---

## 4. Architectuur Opties

### Optie A: Supabase (AANBEVOLEN)

**All-in-one platform met gratis tier**

```
┌─────────────────────────────────────────────────────────────────┐
│                         Supabase                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  PostgreSQL │  │    Auth     │  │    Edge Functions       │  │
│  │  Database   │  │   (Login)   │  │  (NetSuite sync)        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│         ▲                                      │                 │
│         │                                      │                 │
│         │              ┌───────────────────────┘                 │
│         │              ▼                                         │
│  ┌─────────────────────────────┐                                │
│  │      Scheduled CRON         │ ◀─── Elke nacht om 02:00      │
│  │   (pg_cron extension)       │                                │
│  └─────────────────────────────┘                                │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ▼
                  ┌─────────────┐
                  │  NetSuite   │
                  │  REST API   │
                  └─────────────┘
```

**Voordelen:**
- Gratis tot 500MB database en 500K Edge Function calls/maand
- Ingebouwde authenticatie
- Real-time subscriptions (voor live updates)
- Row Level Security (auteur ziet alleen eigen data)
- Nederlandse/EU hosting mogelijk

**Nadelen:**
- Vendor lock-in (maar data is exporteerbaar)
- Gratis tier heeft limieten

---

### Optie B: AWS Serverless

**Volledig eigen beheer**

```
┌─────────────────────────────────────────────────────────────────┐
│                           AWS                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │    RDS      │  │   Cognito   │  │       Lambda            │  │
│  │ PostgreSQL  │  │   (Auth)    │  │  (API + Sync jobs)      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│                                              │                   │
│  ┌─────────────┐                             │                   │
│  │ EventBridge │ ──── trigger ───────────────┘                   │
│  │  (Scheduler)│                                                 │
│  └─────────────┘                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Voordelen:**
- Volledige controle
- Schaalbaar naar enterprise niveau
- Geen vendor lock-in

**Nadelen:**
- Complexer om op te zetten
- Meer onderhoud
- Kosten kunnen oplopen

---

### Optie C: Simple VPS + Cron

**Traditionele aanpak**

```
┌─────────────────────────────────────────────────────────────────┐
│                    VPS (DigitalOcean/Hetzner)                   │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ PostgreSQL  │  │   Node.js   │  │      Cron Job           │ │
│  │             │◀─│   Express   │  │  (node-cron / systemd)  │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Voordelen:**
- Simpel en begrijpelijk
- Lage kosten (~€5-10/maand)
- Volledige controle

**Nadelen:**
- Zelf server onderhouden
- Zelf backups regelen
- Zelf security patching

---

## 5. Aanbevolen Implementatie

### Waarom Supabase?

| Criterium | Score |
|-----------|-------|
| Kosten (start) | Gratis |
| Setup tijd | Uren, niet dagen |
| Onderhoud | Minimaal |
| Security | Ingebouwd |
| Schaalbaarheid | Goed |

### Database Schema

```sql
-- Auteurs tabel (komt overeen met NetSuite Vendors)
CREATE TABLE authors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    netsuite_vendor_id VARCHAR(50) UNIQUE NOT NULL,
    netsuite_internal_id INTEGER UNIQUE,

    -- Persoonlijke gegevens
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    voorletters VARCHAR(20),
    last_name VARCHAR(100),
    bsn_encrypted VARCHAR(255),  -- Versleuteld opgeslagen

    -- Contact
    phone VARCHAR(50),

    -- Adres
    street VARCHAR(255),
    house_number VARCHAR(20),
    postcode VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Nederland',

    -- Bankgegevens
    iban VARCHAR(50),
    bic VARCHAR(20),

    -- Metadata
    birth_date DATE,
    initials VARCHAR(10),

    -- Systeem
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_synced_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Contracten tabel
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES authors(id) ON DELETE CASCADE,
    netsuite_contract_id VARCHAR(50),

    contract_number VARCHAR(50) NOT NULL,
    contract_name VARCHAR(255),
    contract_pdf_url VARCHAR(500),

    created_at TIMESTAMP DEFAULT NOW()
);

-- Betalingen/Afrekeningen tabel
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES authors(id) ON DELETE CASCADE,

    year INTEGER NOT NULL,
    type VARCHAR(20) NOT NULL,  -- 'royalty', 'subsidiary', 'foreign'
    amount DECIMAL(12,2) NOT NULL,
    filename VARCHAR(255),
    payment_date DATE,

    created_at TIMESTAMP DEFAULT NOW()
);

-- Prognoses tabel
CREATE TABLE forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES authors(id) ON DELETE CASCADE,

    year INTEGER NOT NULL,
    min_amount DECIMAL(12,2),
    max_amount DECIMAL(12,2),

    UNIQUE(author_id, year)
);

-- Wijzigingsverzoeken (pending changes)
CREATE TABLE change_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES authors(id) ON DELETE CASCADE,

    field_name VARCHAR(50) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'approved', 'rejected'

    requested_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP,
    processed_by UUID,
    rejection_reason TEXT
);

-- Login geschiedenis
CREATE TABLE login_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES authors(id) ON DELETE CASCADE,
    logged_in_at TIMESTAMP DEFAULT NOW(),
    ip_address VARCHAR(50)
);

-- Sync log (voor debugging)
CREATE TABLE sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sync_type VARCHAR(50),  -- 'full', 'incremental', 'single'
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    records_processed INTEGER DEFAULT 0,
    records_created INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    errors JSONB,
    status VARCHAR(20) DEFAULT 'running'
);

-- Row Level Security: Auteur ziet alleen eigen data
ALTER TABLE authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authors can view own data" ON authors
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Authors can view own contracts" ON contracts
    FOR SELECT USING (author_id = auth.uid());

CREATE POLICY "Authors can view own payments" ON payments
    FOR SELECT USING (author_id = auth.uid());
```

### Sync Strategie

```
┌─────────────────────────────────────────────────────────────────┐
│                     Sync Strategieën                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. INITIËLE BULK IMPORT (eenmalig)                            │
│     ─────────────────────────────────                          │
│     • Alle Vendors uit NetSuite ophalen via REST API           │
│     • Of: CSV export uit NetSuite → import script              │
│     • Tijdsduur: ~30 min voor 1000 auteurs                     │
│                                                                 │
│  2. NACHTELIJKE INCREMENTAL SYNC                               │
│     ─────────────────────────────────                          │
│     • Elke nacht om 02:00                                      │
│     • Query: "lastmodifieddate >= yesterday"                   │
│     • Alleen nieuwe/gewijzigde records                         │
│     • Tijdsduur: ~5 min                                        │
│                                                                 │
│  3. REAL-TIME SYNC (optioneel, fase 2)                         │
│     ─────────────────────────────────                          │
│     • SuiteScript User Event in NetSuite                       │
│     • Trigger webhook bij create/update Vendor                 │
│     • Direct verwerkt, geen delay                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### NetSuite API Calls

```javascript
// 1. Alle Vendors ophalen (initiële import)
GET /services/rest/record/v1/vendor
?q=category IS "Author"
&fields=entityid,email,firstname,lastname,phone,address,custentity_iban,custentity_bic

// 2. Gewijzigde Vendors (incremental sync)
GET /services/rest/record/v1/vendor
?q=lastmodifieddate ON_OR_AFTER "2025-01-19" AND category IS "Author"

// 3. Specifieke Vendor ophalen
GET /services/rest/record/v1/vendor/{internalId}
```

---

## 6. Data Mapping

### NetSuite Vendor → Portal Author

| NetSuite Field | Database Column | Opmerkingen |
|----------------|-----------------|-------------|
| `internalid` | `netsuite_internal_id` | Unieke ID in NetSuite |
| `entityid` | `netsuite_vendor_id` | Vendor nummer (V00xxxxx) |
| `email` | `email` | Ook gebruikt voor login |
| `firstname` | `first_name` | |
| `lastname` | `last_name` | |
| `custentity_voorletters` | `voorletters` | Custom field |
| `phone` | `phone` | |
| `address.addr1` | `street` + `house_number` | Moet gesplit worden |
| `address.zip` | `postcode` | |
| `address.country` | `country` | Code → naam mapping |
| `custentity_iban` | `iban` | Custom field |
| `custentity_bic` | `bic` | Custom field |
| `custentity_bsn` | `bsn_encrypted` | Versleutelen! |
| `custentity_geboortedatum` | `birth_date` | Custom field |

### Wachtwoord Generatie

Bij import van nieuwe auteur:

```javascript
// Genereer tijdelijk wachtwoord
const tempPassword = generateSecurePassword(); // bijv. "Xa7$kL9m"

// Hash opslaan in database
const passwordHash = await bcrypt.hash(tempPassword, 10);

// Email sturen naar auteur met tijdelijk wachtwoord
await sendWelcomeEmail(author.email, tempPassword);
```

---

## 7. Implementatie Stappenplan

### Fase 1: Database Setup (Week 1)

- [ ] Supabase project aanmaken
- [ ] Database schema uitvoeren
- [ ] Row Level Security configureren
- [ ] Test data invoeren

### Fase 2: Backend API (Week 2)

- [ ] Supabase Edge Function voor NetSuite sync
- [ ] NetSuite TBA credentials in Supabase Secrets
- [ ] API endpoints voor frontend:
  - `POST /auth/login`
  - `GET /author/me`
  - `GET /author/contracts`
  - `GET /author/payments`
  - `PATCH /author/me` (met change request)

### Fase 3: Sync Implementatie (Week 2-3)

- [ ] Initiële import script schrijven
- [ ] Testen met NetSuite Sandbox
- [ ] Scheduled job voor nachtelijke sync
- [ ] Error handling en logging

### Fase 4: Frontend Aanpassen (Week 3-4)

- [ ] `DATA.authors` object vervangen door API calls
- [ ] Supabase client library toevoegen
- [ ] Login flow aanpassen naar echte auth
- [ ] Loading states toevoegen
- [ ] Error handling

### Fase 5: Testing & Migratie (Week 4-5)

- [ ] End-to-end tests
- [ ] Performance tests
- [ ] Security audit
- [ ] Migratie plan voor bestaande test data
- [ ] Documentatie

### Fase 6: Go-Live (Week 5)

- [ ] Initiële bulk import uitvoeren
- [ ] DNS/hosting configureren
- [ ] Monitoring opzetten
- [ ] Auteurs informeren over nieuwe login

---

## 8. Kostenanalyse

### Supabase (Aanbevolen)

| Component | Free Tier | Pro (indien nodig) |
|-----------|-----------|-------------------|
| Database | 500 MB | 8 GB |
| Auth | 50K MAU | 100K MAU |
| Edge Functions | 500K calls | 2M calls |
| **Kosten** | **€0/maand** | **€25/maand** |

### Geschatte volumes

| Metric | Schatting |
|--------|-----------|
| Aantal auteurs | 500-2000 |
| Logins per maand | ~1000 |
| API calls per maand | ~10.000 |
| Database grootte | ~50-100 MB |

**Conclusie**: Free tier is waarschijnlijk voldoende.

### Vergelijking

| Optie | Setup | Maandelijks | Jaar 1 Totaal |
|-------|-------|-------------|---------------|
| **Supabase (aanbevolen)** | €0 | €0-25 | €0-300 |
| AWS Serverless | €500 | €30-60 | €860-1220 |
| VPS + PostgreSQL | €200 | €10-20 | €320-440 |

---

## Appendix A: Supabase Edge Function Voorbeeld

```typescript
// supabase/functions/sync-netsuite/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OAuth from 'https://esm.sh/oauth-1.0a@2.2.6'
import { HmacSHA256 } from 'https://esm.sh/crypto-js@4.1.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get NetSuite credentials from secrets
    const netsuiteConfig = {
      accountId: Deno.env.get('NETSUITE_ACCOUNT_ID'),
      consumerKey: Deno.env.get('NETSUITE_CONSUMER_KEY'),
      consumerSecret: Deno.env.get('NETSUITE_CONSUMER_SECRET'),
      tokenId: Deno.env.get('NETSUITE_TOKEN_ID'),
      tokenSecret: Deno.env.get('NETSUITE_TOKEN_SECRET'),
    }

    // Create OAuth 1.0 signer
    const oauth = new OAuth({
      consumer: { key: netsuiteConfig.consumerKey, secret: netsuiteConfig.consumerSecret },
      signature_method: 'HMAC-SHA256',
      hash_function(base_string, key) {
        return HmacSHA256(base_string, key).toString()
      },
    })

    // Fetch vendors from NetSuite
    const url = `https://${netsuiteConfig.accountId}.suitetalk.api.netsuite.com/services/rest/record/v1/vendor?limit=1000`
    const requestData = { url, method: 'GET' }
    const token = { key: netsuiteConfig.tokenId, secret: netsuiteConfig.tokenSecret }
    const authHeader = oauth.toHeader(oauth.authorize(requestData, token))

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...authHeader,
        'Content-Type': 'application/json',
      },
    })

    const vendors = await response.json()

    // Log sync start
    const { data: syncLog } = await supabase
      .from('sync_log')
      .insert({ sync_type: 'full', records_processed: 0 })
      .select()
      .single()

    let created = 0
    let updated = 0

    // Process each vendor
    for (const vendor of vendors.items || []) {
      const authorData = {
        netsuite_internal_id: vendor.id,
        netsuite_vendor_id: vendor.entityid,
        email: vendor.email,
        first_name: vendor.firstname,
        last_name: vendor.lastname,
        phone: vendor.phone,
        // ... map other fields
        last_synced_at: new Date().toISOString(),
      }

      // Upsert (insert or update)
      const { error } = await supabase
        .from('authors')
        .upsert(authorData, { onConflict: 'netsuite_internal_id' })

      if (!error) {
        // Check if it was insert or update
        created++ // Simplified - would need separate logic
      }
    }

    // Update sync log
    await supabase
      .from('sync_log')
      .update({
        completed_at: new Date().toISOString(),
        records_processed: vendors.items?.length || 0,
        records_created: created,
        records_updated: updated,
        status: 'completed',
      })
      .eq('id', syncLog.id)

    return new Response(
      JSON.stringify({ success: true, processed: vendors.items?.length || 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Sync error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

---

## Appendix B: Frontend Migratie

### Huidige code (app.js)

```javascript
// NU: Hardcoded data
const DATA = {
    authors: {
        'patrick@noordhoff.nl': { ... }
    }
};

// Login check
if (DATA.authors[email] && DATA.authors[email].password === password) {
    currentUser = email;
}
```

### Nieuwe code (met Supabase)

```javascript
// NIEUW: Supabase client
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    'https://xxxxx.supabase.co',
    'public-anon-key'
)

// Login
const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password
})

if (error) {
    showLoginError();
} else {
    // Haal auteur data op
    const { data: author } = await supabase
        .from('authors')
        .select('*, contracts(*), payments(*)')
        .single()

    currentUser = author;
    initAuthorDashboard();
}
```

---

## Contact & Vragen

Voor vragen over dit plan:
- Technisch: [development team]
- NetSuite: [NetSuite admin]
- Database: [DBA / Supabase docs]

---

*Laatst bijgewerkt: Januari 2025*
