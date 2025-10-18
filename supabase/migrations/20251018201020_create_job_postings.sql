-- Create job_postings table for recruiter matching system
CREATE TABLE IF NOT EXISTS job_postings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recruiter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  company TEXT,
  description TEXT NOT NULL,
  extracted_requirements JSONB,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'paused')),
  total_matches INTEGER DEFAULT 0,
  viewed_count INTEGER DEFAULT 0,
  liked_count INTEGER DEFAULT 0,
  passed_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for recruiter queries
CREATE INDEX IF NOT EXISTS idx_job_postings_recruiter_id ON job_postings(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings(status);
CREATE INDEX IF NOT EXISTS idx_job_postings_created_at ON job_postings(created_at DESC);

-- Enable RLS
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own job postings
CREATE POLICY "Users can read own job postings"
  ON job_postings FOR SELECT
  USING (auth.uid() = recruiter_id);

-- Policy: Users can insert their own job postings
CREATE POLICY "Users can insert own job postings"
  ON job_postings FOR INSERT
  WITH CHECK (auth.uid() = recruiter_id);

-- Policy: Users can update their own job postings
CREATE POLICY "Users can update own job postings"
  ON job_postings FOR UPDATE
  USING (auth.uid() = recruiter_id);

-- Policy: Users can delete their own job postings
CREATE POLICY "Users can delete own job postings"
  ON job_postings FOR DELETE
  USING (auth.uid() = recruiter_id);
