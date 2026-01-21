# NetSuite Integratie Plan - Royaltyportaal

> Documentatie voor het synchroniseren van auteursgegevens naar NetSuite na admin-goedkeuring.

---

## Inhoudsopgave

1. [Overzicht](#1-overzicht)
2. [Huidige Workflow](#2-huidige-workflow)
3. [Architectuur Opties](#3-architectuur-opties)
4. [Aanbevolen Implementatie](#4-aanbevolen-implementatie)
5. [Veldmapping](#5-veldmapping)
6. [Beveiligingsprotocol](#6-beveiligingsprotocol)
7. [Kostenanalyse](#7-kostenanalyse)
8. [Implementatie Stappenplan](#8-implementatie-stappenplan)

---

## 1. Overzicht

### Doel
Wanneer een auteur zijn gegevens wijzigt in het Royaltyportaal en een admin deze wijziging goedkeurt, moet het bijbehorende Vendor record in NetSuite automatisch worden bijgewerkt.

### Flow
```
Auteur wijzigt data → Admin keurt goed → Backend API → NetSuite Vendor Update
```

---

## 2. Huidige Workflow

### Wat is al geïmplementeerd (frontend)

1. **Auteur wijzigt gegevens**
   - Wijziging wordt opgeslagen met status `pending`
   - Auteur ziet bevestigingsmelding
   - Gegevens worden direct getoond (voor de auteur)

2. **Admin portal**
   - Overzicht van pending/approved/rejected wijzigingen
   - Goedkeuren knop → status wordt `approved`
   - Afwijzen knop → modal voor reden → status wordt `rejected`
   - Audit trail met datum en reden

### Wat nog moet worden gebouwd (backend)

- API endpoint voor NetSuite communicatie
- Credential management
- Error handling en retry logic
- Logging en monitoring

---

## 3. Architectuur Opties

### Optie A: Directe API via Backend Server (AANBEVOLEN)

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Royaltyportaal │────▶│  Backend Server  │────▶│    NetSuite     │
│   (Frontend)    │     │  (AWS Lambda)    │     │  REST API       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │  Secrets Manager │
                        └──────────────────┘
```

**Voordelen:**
- Volledige controle over logica
- Credentials veilig opgeslagen
- Goedkoop (pay-per-use)
- Geen vendor lock-in

**Nadelen:**
- Zelf bouwen en onderhouden
- Kennis van AWS/Azure nodig

**Kosten: €20-40/maand**

---

### Optie B: iPaaS Middleware (Celigo, Boomi, Make)

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Royaltyportaal │────▶│  iPaaS Platform  │────▶│    NetSuite     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

**Voordelen:**
- Kant-en-klare NetSuite connector
- Geen code schrijven
- Enterprise security (SOC2)

**Nadelen:**
- Hoge maandelijkse kosten
- Vendor lock-in
- Minder flexibiliteit

**Kosten:**
| Platform | Kosten/maand |
|----------|--------------|
| Make.com | €29-99 |
| Celigo | €500-2000+ |
| Boomi | €600-2500+ |

---

### Optie C: SFTP + SuiteScript Import

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Royaltyportaal │────▶│   Secure SFTP    │────▶│  SuiteScript    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

**Voordelen:**
- Eenvoudige implementatie
- Batch verwerking mogelijk

**Nadelen:**
- Niet real-time
- Meer handmatig werk
- SuiteScript development nodig

**Kosten:**
- SFTP server: €10-30/maand
- SuiteScript development: €2000-5000 eenmalig

---

## 4. Aanbevolen Implementatie

### Waarom AWS Lambda?

1. **Kosten-efficiënt**: Betaal alleen voor gebruik
2. **Veilig**: Credentials in Secrets Manager
3. **Schaalbaar**: Automatisch mee met vraag
4. **Onderhoudsvriendelijk**: Geen servers beheren

### Architectuur Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         AWS Cloud                                │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │ API Gateway │───▶│   Lambda    │───▶│  Secrets Manager    │  │
│  │  (HTTPS)    │    │  Function   │    │  - Consumer Key     │  │
│  └─────────────┘    └──────┬──────┘    │  - Consumer Secret  │  │
│                            │           │  - Token ID         │  │
│                            │           │  - Token Secret     │  │
│                            │           └─────────────────────┘  │
│                            │                                     │
│                            ▼                                     │
│                     ┌─────────────┐                             │
│                     │ CloudWatch  │                             │
│                     │  (Logging)  │                             │
│                     └─────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼ HTTPS (OAuth 1.0 TBA)
                    ┌─────────────────┐
                    │    NetSuite     │
                    │   REST API      │
                    └─────────────────┘
```

### Componenten

| Component | Functie | AWS Service |
|-----------|---------|-------------|
| API Endpoint | Ontvangt requests van portal | API Gateway |
| Business Logic | Verwerkt en valideert data | Lambda |
| Credential Storage | Bewaart NetSuite keys | Secrets Manager |
| Logging | Audit trail en debugging | CloudWatch |

---

## 5. Veldmapping

### Portal → NetSuite Vendor Record

| Portal Veld | NetSuite Field | API Field Name | Type |
|-------------|----------------|----------------|------|
| Vendor ID | External ID | `externalid` | String |
| Voornaam | First Name | `firstname` | String |
| Achternaam | Last Name | `lastname` | String |
| E-mailadres | Email | `email` | Email |
| Straat + Huisnummer | Address Line 1 | `addressbook[0].addr1` | String |
| Postcode | Zip Code | `addressbook[0].zip` | String |
| Land | Country | `addressbook[0].country` | Enum |
| Geboortedatum | Custom Field | `custentity_birthdate` | Date |
| Telefoonnummer | Phone | `phone` | Phone |
| IBAN | Bank Account | `bankaccountnumber` | String |

### Land Codes (NetSuite Enum)

| Land | Code |
|------|------|
| Nederland | NL |
| België | BE |
| Duitsland | DE |

---

## 6. Beveiligingsprotocol

### Kritieke Regels

| Regel | Status |
|-------|--------|
| Credentials NOOIT in frontend | VERPLICHT |
| Alle communicatie via HTTPS | VERPLICHT |
| Input validatie (IBAN, email, etc.) | VERPLICHT |
| Rate limiting (max 100 req/uur) | AANBEVOLEN |
| IP whitelisting voor NetSuite | AANBEVOLEN |
| Audit logging | VERPLICHT |

### Request Flow met Security

```
1. Admin klikt "Goedkeuren"
   ↓
2. Frontend stuurt request met CSRF token
   POST /api/vendor/update
   Headers: { Authorization: Bearer <session_token> }
   ↓
3. API Gateway valideert request
   - Check HTTPS
   - Check rate limit
   - Check CORS origin
   ↓
4. Lambda functie
   - Valideer session token
   - Valideer input data
   - Haal credentials uit Secrets Manager
   - Maak OAuth 1.0 signed request
   ↓
5. NetSuite API
   - Valideer TBA token
   - Update Vendor record
   - Return success/error
   ↓
6. Lambda logt resultaat naar CloudWatch
   ↓
7. Response naar frontend
   - Success: Update status naar "synced"
   - Error: Toon foutmelding, status blijft "approved"
```

### NetSuite Token-Based Authentication (TBA)

```
Benodigde credentials (in Secrets Manager):

1. Consumer Key      - Van NetSuite Integration Record
2. Consumer Secret   - Van NetSuite Integration Record
3. Token ID          - Van User Access Token
4. Token Secret      - Van User Access Token
5. Account ID        - NetSuite Account Number
```

### Hoe TBA tokens aanmaken in NetSuite

1. **Integration Record aanmaken**
   - Setup → Integration → Manage Integrations → New
   - Naam: "Royaltyportaal Integration"
   - State: Enabled
   - Token-Based Authentication: Checked
   - Noteer Consumer Key en Consumer Secret

2. **Role toewijzen**
   - Maak een custom role met alleen Vendor Edit permissions
   - Setup → Users/Roles → Manage Roles

3. **Access Token aanmaken**
   - Setup → Users/Roles → Access Tokens → New
   - Application: Royaltyportaal Integration
   - User: Service account user
   - Role: Custom Vendor role
   - Noteer Token ID en Token Secret

---

## 7. Kostenanalyse

### Aanbevolen Setup: AWS Serverless

| Component | Service | Geschatte Kosten |
|-----------|---------|------------------|
| API Endpoint | API Gateway | €3-5/maand |
| Business Logic | Lambda | €5-15/maand |
| Credentials | Secrets Manager | €2/maand |
| Logging | CloudWatch | €3-5/maand |
| **Totaal** | | **€13-27/maand** |

*Gebaseerd op ~1000 API calls per maand*

### Vergelijking met Alternatieven

| Oplossing | Setup Kosten | Maandelijks | Totaal Jaar 1 |
|-----------|--------------|-------------|---------------|
| **AWS Lambda (aanbevolen)** | €0-500 | €20-40 | €240-980 |
| Make.com | €0 | €29-99 | €348-1188 |
| Celigo | €0 | €500-1000 | €6000-12000 |
| Eigen server (VPS) | €500-1000 | €50-100 | €1100-2200 |
| SFTP + SuiteScript | €2000-5000 | €30 | €2360-5360 |

### Eenmalige Development Kosten

| Optie | Geschatte Kosten |
|-------|------------------|
| Zelf bouwen (eigen tijd) | €0 |
| Freelance developer | €1500-4000 |
| Agency | €5000-15000 |

---

## 8. Implementatie Stappenplan

### Fase 1: Voorbereiding (Week 1)

- [ ] AWS Account aanmaken/toegang krijgen
- [ ] NetSuite TBA credentials aanmaken
- [ ] Custom role in NetSuite voor API access
- [ ] Test Vendor record identificeren

### Fase 2: Backend Development (Week 2-3)

- [ ] Lambda functie schrijven
- [ ] Secrets Manager configureren
- [ ] API Gateway endpoint aanmaken
- [ ] Error handling implementeren
- [ ] CloudWatch logging opzetten

### Fase 3: Frontend Integratie (Week 3-4)

- [ ] API call toevoegen bij "Goedkeuren" actie
- [ ] Loading state tijdens sync
- [ ] Error handling en retry UI
- [ ] "Synced" status toevoegen aan wijzigingen

### Fase 4: Testing (Week 4)

- [ ] Unit tests voor Lambda
- [ ] Integration tests met NetSuite Sandbox
- [ ] End-to-end test flow
- [ ] Security audit

### Fase 5: Go-Live (Week 5)

- [ ] Deploy naar productie
- [ ] Monitoring alerts instellen
- [ ] Documentatie voor beheer
- [ ] Training voor admins

---

## Appendix: Lambda Code Voorbeeld

```javascript
// handler.js - AWS Lambda function

const AWS = require('aws-sdk');
const OAuth = require('oauth-1.0a');
const crypto = require('crypto');
const https = require('https');

const secretsManager = new AWS.SecretsManager();

exports.handler = async (event) => {
    try {
        // 1. Parse request
        const body = JSON.parse(event.body);
        const { vendorId, field, value } = body;

        // 2. Validate input
        if (!vendorId || !field || !value) {
            return { statusCode: 400, body: 'Missing required fields' };
        }

        // 3. Get credentials from Secrets Manager
        const secret = await secretsManager.getSecretValue({
            SecretId: 'netsuite/royaltyportaal'
        }).promise();
        const creds = JSON.parse(secret.SecretString);

        // 4. Create OAuth signature
        const oauth = OAuth({
            consumer: { key: creds.consumerKey, secret: creds.consumerSecret },
            signature_method: 'HMAC-SHA256',
            hash_function(base_string, key) {
                return crypto.createHmac('sha256', key).update(base_string).digest('base64');
            }
        });

        // 5. Make NetSuite API request
        const url = `https://${creds.accountId}.suitetalk.api.netsuite.com/services/rest/record/v1/vendor/${vendorId}`;
        const requestData = { url, method: 'PATCH' };
        const token = { key: creds.tokenId, secret: creds.tokenSecret };
        const authHeader = oauth.toHeader(oauth.authorize(requestData, token));

        // 6. Build update payload
        const payload = {};
        payload[field] = value;

        // 7. Send request
        const response = await makeRequest(url, 'PATCH', authHeader, payload);

        // 8. Log and return
        console.log('NetSuite update successful:', { vendorId, field });
        return { statusCode: 200, body: JSON.stringify({ success: true }) };

    } catch (error) {
        console.error('NetSuite update failed:', error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
```

---

## Contact & Support

Voor vragen over deze documentatie of de implementatie:
- Technisch: [development team]
- NetSuite: [NetSuite admin]
- Security: [security officer]

---

*Laatst bijgewerkt: Januari 2025*
