-- Community Peptides Table (aggregated data)
CREATE TABLE community_peptides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  submitted_by TEXT NOT NULL, -- First submitter
  submission_count INTEGER DEFAULT 1,
  common_dosage_min NUMERIC,
  common_dosage_max NUMERIC,
  common_dosage_unit TEXT CHECK (common_dosage_unit IN ('mcg', 'mg')),
  benefits TEXT[], -- Array of benefits
  contraindications TEXT[], -- Array of contraindications
  warnings TEXT[], -- Array of warnings
  storage_instructions TEXT,
  unreconstituted_shelf_life TEXT,
  reconstituted_shelf_life TEXT,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual Peptide Submissions (raw user data)
CREATE TABLE peptide_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  peptide_name TEXT NOT NULL,
  submitted_by TEXT NOT NULL,
  description TEXT,
  dosage_min NUMERIC,
  dosage_max NUMERIC,
  dosage_unit TEXT CHECK (dosage_unit IN ('mcg', 'mg')),
  benefits TEXT[],
  contraindications TEXT[],
  warnings TEXT[],
  notes TEXT,
  source TEXT, -- e.g., "personal experience", "research", etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Reviews for Peptides
CREATE TABLE user_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  peptide_id UUID REFERENCES community_peptides(id) ON DELETE CASCADE,
  peptide_name TEXT NOT NULL,
  username TEXT NOT NULL,
  dosage_used NUMERIC,
  dosage_unit TEXT CHECK (dosage_unit IN ('mcg', 'mg')),
  frequency TEXT,
  duration_weeks INTEGER,
  benefits_experienced TEXT[],
  side_effects TEXT[],
  effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5),
  notes TEXT,
  helpful_votes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Votes on Reviews (to prevent duplicate votes)
CREATE TABLE review_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES user_reviews(id) ON DELETE CASCADE,
  user_identifier TEXT NOT NULL, -- Could be IP hash or session ID
  vote_type TEXT CHECK (vote_type IN ('helpful', 'not_helpful')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id, user_identifier)
);

-- Peptide Votes (upvote/downvote)
CREATE TABLE peptide_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  peptide_id UUID REFERENCES community_peptides(id) ON DELETE CASCADE,
  user_identifier TEXT NOT NULL,
  vote_type TEXT CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(peptide_id, user_identifier)
);

-- Indexes for performance
CREATE INDEX idx_peptides_name ON community_peptides(name);
CREATE INDEX idx_submissions_peptide_name ON peptide_submissions(peptide_name);
CREATE INDEX idx_reviews_peptide_id ON user_reviews(peptide_id);
CREATE INDEX idx_reviews_rating ON user_reviews(effectiveness_rating);
CREATE INDEX idx_peptides_upvotes ON community_peptides(upvotes DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_community_peptides_updated_at
  BEFORE UPDATE ON community_peptides
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_reviews_updated_at
  BEFORE UPDATE ON user_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE community_peptides ENABLE ROW LEVEL SECURITY;
ALTER TABLE peptide_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE peptide_votes ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone
CREATE POLICY "Allow read access for all users" ON community_peptides
  FOR SELECT USING (true);

CREATE POLICY "Allow read access for all users" ON peptide_submissions
  FOR SELECT USING (true);

CREATE POLICY "Allow read access for all users" ON user_reviews
  FOR SELECT USING (true);

-- Allow insert for all users (anonymous submissions)
CREATE POLICY "Allow insert for all users" ON community_peptides
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow insert for all users" ON peptide_submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow insert for all users" ON user_reviews
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow insert for all users" ON review_votes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow insert for all users" ON peptide_votes
  FOR INSERT WITH CHECK (true);

-- Allow update only for vote counts (via function)
CREATE POLICY "Allow update for vote counts" ON community_peptides
  FOR UPDATE USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow update for helpful votes" ON user_reviews
  FOR UPDATE USING (true)
  WITH CHECK (true);
