/**
 * Shared TypeScript types for the Recruiter Matching System
 */

export interface JobRequirements {
  title: string;
  required_skills: string[];
  nice_to_have_skills: string[];
  min_experience_years: number;
  experience_level: "entry" | "mid" | "senior" | "lead" | "executive";
  industries: string[];
  location: string;
  remote_ok: boolean;
  company_size: string;
  salary_range?: { min: number; max: number };
}

export interface JobPosting {
  id: string;
  recruiter_id: string;
  title: string;
  company?: string;
  description: string;
  extracted_requirements: JobRequirements;
  status: "active" | "closed" | "paused";
  total_matches: number;
  viewed_count: number;
  liked_count: number;
  passed_count: number;
  created_at: string;
  updated_at: string;
}

export interface MatchDetails {
  skills_match: {
    matched_required: string[];
    matched_nice_to_have: string[];
    missing_required: string[];
    score: number; // 0-100
  };
  experience_match: {
    years: number;
    level: string;
    is_match: boolean;
    score: number; // 0-100
  };
  industry_match: {
    matched_industries: string[];
    score: number; // 0-100
  };
  location_match: {
    is_match: boolean;
    score: number; // 0-100
  };
  overall_score: number; // 0-100
}

export interface CandidateMatch {
  _id: string;
  jobId: string;
  candidateUserId: string;
  portfolioId: string;
  matchScore: number;
  matchReasons: string[];
  matchDetails: MatchDetails;
  status: "pending" | "liked" | "passed" | "super_liked";
  viewedAt?: number;
  decidedAt?: number;
  // Portfolio data for display
  candidateName?: string;
  candidateTitle?: string;
  candidateLocation?: string;
  candidateAvatar?: string;
  candidateSkills?: string[];
  candidateExperienceYears?: number;
  candidatePortfolioSlug?: string;
  candidateGithub?: string;
  candidateLinkedin?: string;
  candidateCompanies?: string[]; // List of companies worked at
  candidateEducation?: string; // Highest degree
}

export interface RecruiterStats {
  total_matches: number;
  viewed_count: number;
  liked_count: number;
  passed_count: number;
  super_liked_count: number;
  average_match_score: number;
  pending_count: number;
  top_skills: Array<{ skill: string; count: number }>;
}


