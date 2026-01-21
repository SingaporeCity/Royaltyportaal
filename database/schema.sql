-- ============================================
-- ROYALTYPORTAAL DATABASE SCHEMA
-- Supabase / PostgreSQL
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- AUTHORS TABLE (Auteurs)
-- ============================================
CREATE TABLE authors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- NetSuite koppeling
    netsuite_vendor_id VARCHAR(50) UNIQUE,
    netsuite_internal_id INTEGER UNIQUE,

    -- Login gegevens
    email VARCHAR(255) UNIQUE NOT NULL,

    -- Persoonlijke gegevens
    first_name VARCHAR(100) NOT NULL,
    voorletters VARCHAR(20),
    last_name VARCHAR(100) NOT NULL,
    bsn VARCHAR(20),

    -- Contact
    phone VARCHAR(50),

    -- Adres
    street VARCHAR(255),
    house_number VARCHAR(20),
    postcode VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Nederland',

    -- Bankgegevens
    bank_account VARCHAR(50),
    bic VARCHAR(20),

    -- Overig
    birth_date VARCHAR(20),
    initials VARCHAR(10),

    -- Systeem
    is_admin BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_synced_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- CONTRACTS TABLE (Contracten)
-- ============================================
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID REFERENCES authors(id) ON DELETE CASCADE,

    contract_number VARCHAR(50) NOT NULL,
    contract_name VARCHAR(255),
    contract_pdf VARCHAR(500),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PAYMENTS TABLE (Afrekeningen)
-- ============================================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID REFERENCES authors(id) ON DELETE CASCADE,

    year INTEGER NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('royalty', 'subsidiary', 'foreign')),
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    filename VARCHAR(255),

    title_nl VARCHAR(255),
    title_en VARCHAR(255),
    date_nl VARCHAR(100),
    date_en VARCHAR(100),
    sort_date DATE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- FORECASTS TABLE (Prognoses)
-- ============================================
CREATE TABLE forecasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID REFERENCES authors(id) ON DELETE CASCADE,

    year INTEGER NOT NULL DEFAULT 2025,
    min_amount DECIMAL(12,2) DEFAULT 0,
    max_amount DECIMAL(12,2) DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(author_id, year)
);

-- ============================================
-- CHANGE REQUESTS TABLE (Wijzigingsverzoeken)
-- ============================================
CREATE TABLE change_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID REFERENCES authors(id) ON DELETE CASCADE,

    field_name VARCHAR(50) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),

    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES authors(id),
    rejection_reason TEXT
);

-- ============================================
-- LOGIN HISTORY TABLE
-- ============================================
CREATE TABLE login_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID REFERENCES authors(id) ON DELETE CASCADE,

    logged_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address VARCHAR(50)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_authors_email ON authors(email);
CREATE INDEX idx_contracts_author ON contracts(author_id);
CREATE INDEX idx_payments_author ON payments(author_id);
CREATE INDEX idx_payments_year ON payments(year);
CREATE INDEX idx_change_requests_author ON change_requests(author_id);
CREATE INDEX idx_change_requests_status ON change_requests(status);
CREATE INDEX idx_login_history_author ON login_history(author_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;

-- Authors: can view own data, admins can view all
CREATE POLICY "Users can view own author data" ON authors
    FOR SELECT USING (
        auth.uid() = id OR
        EXISTS (SELECT 1 FROM authors WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "Users can update own author data" ON authors
    FOR UPDATE USING (auth.uid() = id);

-- Contracts: users see own, admins see all
CREATE POLICY "Users can view own contracts" ON contracts
    FOR SELECT USING (
        author_id = auth.uid() OR
        EXISTS (SELECT 1 FROM authors WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "Admins can manage contracts" ON contracts
    FOR ALL USING (
        EXISTS (SELECT 1 FROM authors WHERE id = auth.uid() AND is_admin = true)
    );

-- Payments: users see own, admins see all
CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (
        author_id = auth.uid() OR
        EXISTS (SELECT 1 FROM authors WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "Admins can manage payments" ON payments
    FOR ALL USING (
        EXISTS (SELECT 1 FROM authors WHERE id = auth.uid() AND is_admin = true)
    );

-- Forecasts: users see own, admins see all
CREATE POLICY "Users can view own forecasts" ON forecasts
    FOR SELECT USING (
        author_id = auth.uid() OR
        EXISTS (SELECT 1 FROM authors WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "Admins can manage forecasts" ON forecasts
    FOR ALL USING (
        EXISTS (SELECT 1 FROM authors WHERE id = auth.uid() AND is_admin = true)
    );

-- Change requests: users see own, admins see all and can manage
CREATE POLICY "Users can view own change requests" ON change_requests
    FOR SELECT USING (
        author_id = auth.uid() OR
        EXISTS (SELECT 1 FROM authors WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "Users can create own change requests" ON change_requests
    FOR INSERT WITH CHECK (author_id = auth.uid());

CREATE POLICY "Admins can manage change requests" ON change_requests
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM authors WHERE id = auth.uid() AND is_admin = true)
    );

-- Login history: users see own, admins see all
CREATE POLICY "Users can view own login history" ON login_history
    FOR SELECT USING (
        author_id = auth.uid() OR
        EXISTS (SELECT 1 FROM authors WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "System can insert login history" ON login_history
    FOR INSERT WITH CHECK (true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for authors table
CREATE TRIGGER update_authors_updated_at
    BEFORE UPDATE ON authors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SYNC LOG TABLE (voor NetSuite import tracking)
-- ============================================
CREATE TABLE sync_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sync_type VARCHAR(50) NOT NULL,  -- 'full', 'incremental', 'csv_import'
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    records_processed INTEGER DEFAULT 0,
    records_created INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    errors JSONB,
    status VARCHAR(20) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
    triggered_by UUID REFERENCES authors(id)
);

CREATE INDEX idx_sync_log_status ON sync_log(status);
CREATE INDEX idx_sync_log_started ON sync_log(started_at DESC);

-- ============================================
-- SEED DATA: Admin user
-- ============================================
-- Note: After running this, you need to create the auth user in Supabase Auth
-- with the same email, then update the id here to match

-- This will be done via the migration script
