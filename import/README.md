# NetSuite Import Handleiding

## Optie 1: CSV Export uit NetSuite (Aanbevolen voor eerste import)

### Stap 1: Saved Search maken in NetSuite

1. Ga naar **Reports > Saved Searches > All Saved Searches > New**
2. Kies **Vendor** als Search Type
3. Configureer de volgende **Results** kolommen:

| Label in Export | NetSuite Field | Internal ID |
|-----------------|----------------|-------------|
| email | Email | email |
| first_name | First Name | firstname |
| last_name | Last Name | lastname |
| voorletters | Voorletters | custentity_voorletters |
| phone | Phone | phone |
| street | Address 1 | address.addr1 |
| postcode | Zip | address.zip |
| country | Country | address.country |
| iban | IBAN | custentity_iban |
| bic | BIC | custentity_bic |
| bsn | BSN | custentity_bsn |
| birth_date | Geboortedatum | custentity_geboortedatum |
| vendor_id | Entity ID | entityid |
| internal_id | Internal ID | internalid |

4. Voeg een **Filter** toe: Category = "Author" (of jouw specifieke vendor categorie)
5. Sla op en exporteer naar CSV

### Stap 2: CSV Voorbereiden

1. Open het geëxporteerde bestand
2. Controleer dat de kolomnamen overeenkomen met de template
3. Splits indien nodig het adres (straat + huisnummer)
4. Formatteer datums als `dd-mm-jjjj`

### Stap 3: Importeren in Royaltyportaal

1. Log in als admin
2. Klik op "Auteurs importeren" (+)
3. Selecteer je CSV bestand
4. Controleer de preview
5. Klik "Importeren"

---

## Optie 2: NetSuite API Sync (Voor continue synchronisatie)

### Vereisten

1. NetSuite Token-Based Authentication (TBA) ingesteld
2. Supabase Edge Function gedeployed
3. Credentials als Secrets in Supabase

### NetSuite TBA Setup

1. **Maak een Integration Record:**
   - Setup > Integration > Manage Integrations > New
   - Naam: "Royaltyportaal Sync"
   - State: Enabled
   - Token-Based Authentication: ✓
   - Noteer Consumer Key en Consumer Secret

2. **Maak een Access Token:**
   - Setup > Users/Roles > Access Tokens > New
   - Application Name: "Royaltyportaal Sync"
   - User: (service account)
   - Role: met vendor read permissions
   - Noteer Token ID en Token Secret

3. **Voeg Secrets toe aan Supabase:**
   ```bash
   supabase secrets set NETSUITE_ACCOUNT_ID=xxxxxx
   supabase secrets set NETSUITE_CONSUMER_KEY=xxxxxx
   supabase secrets set NETSUITE_CONSUMER_SECRET=xxxxxx
   supabase secrets set NETSUITE_TOKEN_ID=xxxxxx
   supabase secrets set NETSUITE_TOKEN_SECRET=xxxxxx
   supabase secrets set NETSUITE_REALM=xxxxxx
   ```

4. **Deploy de Edge Function:**
   ```bash
   cd Royaltyportaal
   supabase functions deploy sync-netsuite
   ```

### API Sync Triggeren

```javascript
// Full sync (alle auteurs)
fetch('https://your-project.supabase.co/functions/v1/sync-netsuite', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer YOUR_ANON_KEY',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ type: 'full' })
});

// Incremental sync (laatste 24 uur)
fetch('...', {
    body: JSON.stringify({ type: 'incremental' })
});
```

### Scheduled Sync (CRON)

Voeg toe aan Supabase SQL Editor:

```sql
-- Elke nacht om 02:00
SELECT cron.schedule(
    'netsuite-sync-nightly',
    '0 2 * * *',
    $$
    SELECT net.http_post(
        url := 'https://your-project.supabase.co/functions/v1/sync-netsuite',
        headers := '{"Authorization": "Bearer YOUR_SERVICE_KEY", "Content-Type": "application/json"}'::jsonb,
        body := '{"type": "incremental"}'::jsonb
    );
    $$
);
```

---

## Kolom Vereisten

| Kolom | Verplicht | Max lengte | Format/Vereisten | Voorbeeld |
|-------|-----------|------------|------------------|-----------|
| `email` | **Ja** | 255 | Geldig email, uniek, wordt lowercase | `patrick@voorbeeld.nl` |
| `first_name` | **Ja** | 100 | Tekst | `Patrick` |
| `last_name` | **Ja** | 100 | Tekst | `Jansen` |
| `voorletters` | Nee | 20 | Met punten | `P.J.` |
| `phone` | Nee | 50 | Vrij formaat | `+31 6 12345678` |
| `street` | Nee | 255 | Alleen straatnaam (zonder huisnummer) | `Hoofdstraat` |
| `house_number` | Nee | 20 | Inclusief eventuele toevoeging | `123` of `45A` |
| `postcode` | Nee | 20 | Nederlands formaat | `1234 AB` |
| `country` | Nee | 100 | Default: `Nederland` | `Nederland` |
| `iban` | Nee | 50 | IBAN formaat | `NL91ABNA0123456789` |
| `bic` | Nee | 20 | BIC/SWIFT code | `ABNANL2A` |
| `bsn` | Nee | 20 | 9 cijfers | `123456789` |
| `birth_date` | Nee | 20 | **DD-MM-YYYY** | `15-03-1980` |
| `vendor_id` | Nee | 50 | NetSuite Entity ID, uniek | `V0024001` |
| `internal_id` | Nee | - | Numeriek (integer), uniek | `2500001` |

### Alternatieve kolomnamen

De import accepteert ook deze varianten:

| Alternatief | Wordt gemapt naar |
|-------------|-------------------|
| `firstname` | `first_name` |
| `lastname` | `last_name` |
| `telefoon` | `phone` |
| `straat` | `street` |
| `huisnummer` | `house_number` |
| `zip` | `postcode` |
| `land` | `country` |
| `bank_account` | `iban` |
| `geboortedatum` | `birth_date` |
| `entityid` | `vendor_id` |

---

## Troubleshooting

### "Geen email adres" fout
- Controleer of de email kolom correct is geformatteerd
- Verwijder lege rijen uit de CSV

### "Duplicate key" fout
- Een auteur met dit email adres bestaat al
- De import zal bestaande auteurs bijwerken

### Verkeerde karakters na import
- Zorg dat het CSV bestand UTF-8 encoded is
- In Excel: Opslaan als > CSV UTF-8

---

## Contact

Voor vragen over de NetSuite integratie, neem contact op met het development team.
