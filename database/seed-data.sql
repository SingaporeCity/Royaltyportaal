-- ============================================
-- SEED DATA FOR ROYALTYPORTAAL
-- Run this AFTER creating auth users in Supabase
-- ============================================

-- ============================================
-- TEMPORARY: Insert test authors
-- In production, these will come from NetSuite
-- ============================================

-- First, create users in Supabase Auth Dashboard:
-- 1. Go to Authentication > Users > Add user
-- 2. Create: admin@noordhoff.nl (password: Admin123)
-- 3. Create: patrick@noordhoff.nl (password: Patrick123)
-- 4. Create: suzanna@noordhoff.nl (password: Suzanna123)
-- 5. Create: anita@noordhoff.nl (password: Anita123)

-- Then run this SQL to insert author profiles
-- Replace the UUIDs with the actual auth.users IDs from Supabase

-- NOTE: This is a template. After creating auth users, get their IDs and use them here.

-- ============================================
-- INSERT AUTHORS (use actual auth user IDs)
-- ============================================

-- You can find user IDs in Supabase Dashboard > Authentication > Users
-- Copy the UUID for each user and replace below

/*
INSERT INTO authors (id, email, first_name, voorletters, last_name, bsn, phone, street, house_number, postcode, country, bank_account, bic, birth_date, initials, netsuite_vendor_id, netsuite_internal_id, is_admin)
VALUES
    -- Admin (replace UUID with actual auth user id)
    ('REPLACE-WITH-ADMIN-UUID', 'admin@noordhoff.nl', 'Admin', NULL, 'Noordhoff', NULL, NULL, NULL, NULL, NULL, 'Nederland', NULL, NULL, NULL, 'AN', NULL, NULL, true),

    -- Patrick
    ('REPLACE-WITH-PATRICK-UUID', 'patrick@noordhoff.nl', 'Patrick', 'P.J.', 'Jeeninga', '123456789', '+31 6 12345678', 'Herengracht', '123', '1015 BH', 'Nederland', 'NL91 ABNA 0123 4567 01', 'ABNANL2A', '15-03-1978', 'PJ', 'V0024123', 2512345, false),

    -- Suzanna
    ('REPLACE-WITH-SUZANNA-UUID', 'suzanna@noordhoff.nl', 'Suzanna', 'S.', 'van den Berg', '987654321', '+31 6 23456789', 'Keizersgracht', '456', '1016 GD', 'Nederland', 'NL45 INGB 0001 2345 67', 'INGBNL2A', '22-07-1985', 'SB', 'V0018756', 2534892, false),

    -- Anita
    ('REPLACE-WITH-ANITA-UUID', 'anita@noordhoff.nl', 'Anita', 'A.', 'de Vries', '456789123', '+31 6 34567890', 'Prinsengracht', '789', '1017 KL', 'Nederland', 'NL82 RABO 0123 9876 54', 'RABONL2U', '08-11-1972', 'AV', 'V0031247', 2567034, false);
*/

-- ============================================
-- INSERT CONTRACTS
-- ============================================

/*
-- Patrick's contracts
INSERT INTO contracts (author_id, contract_number, contract_name, contract_pdf)
SELECT id, 'CC_14000', 'Moderne Wiskunde 13-14 BB', 'CC_14000_contract.pdf'
FROM authors WHERE email = 'patrick@noordhoff.nl';

INSERT INTO contracts (author_id, contract_number, contract_name, contract_pdf)
SELECT id, 'CC_14001', 'Moderne Wiskunde 13-14 OB', 'CC_14001_contract.pdf'
FROM authors WHERE email = 'patrick@noordhoff.nl';

-- Suzanna's contracts
INSERT INTO contracts (author_id, contract_number, contract_name, contract_pdf)
SELECT id, 'CC_14000', 'Moderne Wiskunde 13-14 BB', 'CC_14000_contract.pdf'
FROM authors WHERE email = 'suzanna@noordhoff.nl';

INSERT INTO contracts (author_id, contract_number, contract_name, contract_pdf)
SELECT id, 'CC_14001', 'Moderne Wiskunde 13-14 OB', 'CC_14001_contract.pdf'
FROM authors WHERE email = 'suzanna@noordhoff.nl';

-- Anita's contracts
INSERT INTO contracts (author_id, contract_number, contract_name, contract_pdf)
SELECT id, 'CC_14000', 'Moderne Wiskunde 13-14 BB', 'CC_14000_contract.pdf'
FROM authors WHERE email = 'anita@noordhoff.nl';

INSERT INTO contracts (author_id, contract_number, contract_name, contract_pdf)
SELECT id, 'CC_14001', 'Moderne Wiskunde 13-14 OB', 'CC_14001_contract.pdf'
FROM authors WHERE email = 'anita@noordhoff.nl';
*/

-- ============================================
-- INSERT PAYMENTS
-- ============================================

/*
-- Patrick's payments
INSERT INTO payments (author_id, year, type, amount, filename, title_nl, title_en, date_nl, date_en, sort_date)
SELECT id, 2024, 'royalty', 17641.50, 'royalty-2024.pdf', 'Royalty-afrekening 2024', 'Royalty Statement 2024', '15 maart 2025', 'March 15, 2025', '2025-03-15'
FROM authors WHERE email = 'patrick@noordhoff.nl';

INSERT INTO payments (author_id, year, type, amount, filename, title_nl, title_en, date_nl, date_en, sort_date)
SELECT id, 2024, 'subsidiary', 1764.15, 'nevenrechten-2024.pdf', 'Nevenrechten 2024', 'Reader Rights 2024', '15 juni 2025', 'June 15, 2025', '2025-06-15'
FROM authors WHERE email = 'patrick@noordhoff.nl';

INSERT INTO payments (author_id, year, type, amount, filename, title_nl, title_en, date_nl, date_en, sort_date)
SELECT id, 2024, 'foreign', 705.66, 'foreign-rights-2024.pdf', 'Foreign Rights 2024', 'Foreign Rights 2024', '15 juli 2025', 'July 15, 2025', '2025-07-15'
FROM authors WHERE email = 'patrick@noordhoff.nl';

INSERT INTO payments (author_id, year, type, amount, filename, title_nl, title_en, date_nl, date_en, sort_date)
SELECT id, 2023, 'royalty', 15420.00, 'royalty-2023.pdf', 'Royalty-afrekening 2023', 'Royalty Statement 2023', '15 maart 2024', 'March 15, 2024', '2024-03-15'
FROM authors WHERE email = 'patrick@noordhoff.nl';

INSERT INTO payments (author_id, year, type, amount, filename, title_nl, title_en, date_nl, date_en, sort_date)
SELECT id, 2023, 'subsidiary', 1542.00, 'nevenrechten-2023.pdf', 'Nevenrechten 2023', 'Reader Rights 2023', '15 juni 2024', 'June 15, 2024', '2024-06-15'
FROM authors WHERE email = 'patrick@noordhoff.nl';

INSERT INTO payments (author_id, year, type, amount, filename, title_nl, title_en, date_nl, date_en, sort_date)
SELECT id, 2023, 'foreign', 616.80, 'foreign-rights-2023.pdf', 'Foreign Rights 2023', 'Foreign Rights 2023', '15 juli 2024', 'July 15, 2024', '2024-07-15'
FROM authors WHERE email = 'patrick@noordhoff.nl';

-- Add similar INSERT statements for Suzanna and Anita...
*/

-- ============================================
-- INSERT FORECASTS
-- ============================================

/*
INSERT INTO forecasts (author_id, year, min_amount, max_amount)
SELECT id, 2025, 15000, 20000 FROM authors WHERE email = 'patrick@noordhoff.nl';

INSERT INTO forecasts (author_id, year, min_amount, max_amount)
SELECT id, 2025, 8000, 12000 FROM authors WHERE email = 'suzanna@noordhoff.nl';

INSERT INTO forecasts (author_id, year, min_amount, max_amount)
SELECT id, 2025, 22000, 28000 FROM authors WHERE email = 'anita@noordhoff.nl';
*/

-- ============================================
-- HELPER: View to check data
-- ============================================
-- SELECT * FROM authors;
-- SELECT * FROM contracts;
-- SELECT * FROM payments;
-- SELECT * FROM forecasts;
