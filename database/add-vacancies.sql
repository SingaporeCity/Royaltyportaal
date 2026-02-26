-- ============================================
-- VACANCIES TABLE (Vacatures)
-- ============================================

CREATE TABLE vacancies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    title VARCHAR(255) NOT NULL,
    segment VARCHAR(20) NOT NULL CHECK (segment IN ('bao', 'vo', 'mbo', 'ho')),
    subject VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'auteur' CHECK (type IN ('auteur', 'medeauteur', 'reviewer', 'digitaal')),
    hours VARCHAR(50),
    description TEXT,
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_vacancies_segment ON vacancies(segment);
CREATE INDEX idx_vacancies_active ON vacancies(is_active);

-- Enable RLS
ALTER TABLE vacancies ENABLE ROW LEVEL SECURITY;

-- Anyone can read active vacancies (public website)
CREATE POLICY "Anyone can view active vacancies" ON vacancies
    FOR SELECT USING (is_active = true);

-- Admins can view all vacancies (including inactive)
CREATE POLICY "Admins can view all vacancies" ON vacancies
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM authors WHERE id = auth.uid() AND is_admin = true)
    );

-- Admins can manage vacancies
CREATE POLICY "Admins can insert vacancies" ON vacancies
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM authors WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "Admins can update vacancies" ON vacancies
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM authors WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "Admins can delete vacancies" ON vacancies
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM authors WHERE id = auth.uid() AND is_admin = true)
    );

-- Auto-update updated_at
CREATE TRIGGER update_vacancies_updated_at
    BEFORE UPDATE ON vacancies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA: Example vacancies
-- ============================================
INSERT INTO vacancies (title, segment, subject, type, hours, description) VALUES
    ('Auteur Natuurkunde VO', 'vo', 'Natuurkunde', 'auteur', '8-16 uur/week', 'We zoeken een ervaren natuurkundedocent die mee wil schrijven aan de nieuwe editie van onze VO-methode.'),
    ('Medeauteur Nederlands BAO', 'bao', 'Nederlands', 'medeauteur', '8-12 uur/week', 'Voor onze taalmethode zoeken we een leerkracht met ervaring in taalonderwijs voor groep 5-8.'),
    ('Auteur Bedrijfseconomie MBO', 'mbo', 'Bedrijfseconomie', 'auteur', '10-16 uur/week', 'Schrijf mee aan praktijkgerichte leermiddelen voor mbo-studenten economie en administratie.'),
    ('Reviewer Wiskunde VO', 'vo', 'Wiskunde', 'reviewer', '4-8 uur/week', 'Beoordeel en verbeter nieuwe hoofdstukken van Getal & Ruimte. Ideaal als eerste stap richting auteurschap.'),
    ('Auteur Psychologie HO', 'ho', 'Psychologie', 'auteur', '8-16 uur/week', 'We zoeken een academicus die mee wil werken aan een nieuw studieboek psychologie voor het hoger onderwijs.'),
    ('Digitale content Biologie VO', 'vo', 'Biologie', 'digitaal', '8-12 uur/week', 'Ontwikkel interactieve opdrachten en animaties voor onze digitale biologie-omgeving.'),
    ('Auteur Rekenen BAO', 'bao', 'Rekenen', 'auteur', '10-16 uur/week', 'Schrijf mee aan de vernieuwing van Pluspunt. We zoeken een leerkracht met passie voor rekenonderwijs.'),
    ('Medeauteur Logistiek MBO', 'mbo', 'Logistiek', 'medeauteur', '8-12 uur/week', 'Help mee bij het ontwikkelen van up-to-date lesmateriaal voor logistiek en transport in het mbo.');
