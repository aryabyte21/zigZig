# Recruiter Candidate Matching System

A Tinder-style candidate matching platform built with Next.js, Convex, Supabase, and AI-powered matching using Groq.

## Features

### 🎯 Core Functionality
- **AI Job Description Parsing**: Automatically extracts requirements from job descriptions using Groq
- **Smart Candidate Matching**: AI-powered matching algorithm scores candidates 0-100 based on multiple factors
- **Tinder-Style Interface**: Swipe left to pass, right to like, up to super-like candidates
- **Real-time Updates**: Convex powers real-time match updates and statistics
- **Portfolio Caching**: Parsed portfolio data is cached for optimal performance
- **Batch Processing**: Processes candidates in batches to avoid API rate limits

### 💯 Matching Algorithm

Candidates are scored based on:
- **Skills Match (40%)**: Coverage of required and nice-to-have skills
- **Experience Level (30%)**: Years and seniority alignment
- **Industry Fit (15%)**: Relevant industry experience
- **Location Match (10%)**: Location/remote preference
- **Cultural Fit (5%)**: Company size preference

### 🎨 User Experience
- Smooth card animations with framer-motion
- Gesture-based swiping with visual feedback
- Undo last action functionality
- Progress tracking
- Stats dashboard (total matches, liked, passed, super-liked)
- Filter by minimum match score
- View liked and passed candidates separately

## Architecture

### Database Schema

**Supabase Tables:**
- `job_postings`: Stores job postings with extracted requirements

**Convex Tables:**
- `cached_portfolios`: Cached parsed portfolio data
- `candidate_matches`: Match records with scores and details
- `recruiter_activity`: Activity log for analytics

### API Routes

1. **`/api/recruiter/parse-job`** (POST)
   - Extracts requirements from job description using Groq
   - Creates job posting in Supabase
   - Returns structured requirements

2. **`/api/recruiter/compute-matches`** (POST)
   - Fetches all active portfolios
   - Scores candidates using AI
   - Caches portfolio data in Convex
   - Stores matches in Convex

3. **`/api/recruiter/update-match-status`** (PUT)
   - Updates match status (liked/passed/super_liked)
   - Logs activity
   - Updates job posting counters

### Convex Functions

**Queries:**
- `getActivePortfolios`: Fetch all active portfolios
- `getJobMatches`: Get paginated matches for a job
- `getMatchDetails`: Get full details for a match
- `getRecruiterStats`: Get activity stats

**Mutations:**
- `cachePortfolio`: Store/update parsed portfolio
- `createMatches`: Bulk insert matches
- `updateMatchStatus`: Update match status
- `markMatchViewed`: Mark match as viewed
- `logActivity`: Track recruiter actions

## Setup Instructions

### 1. Install Dependencies

```bash
pnpm install
```

Dependencies added:
- `framer-motion`: Card animations and gestures
- `react-virtuoso`: Performance for large lists

### 2. Apply Supabase Migration

The migration file was created at `supabase/migrations/*_create_job_postings.sql`

**If using Supabase CLI:**
```bash
npx supabase db push
```

**If using Supabase Dashboard:**
1. Go to SQL Editor in your Supabase dashboard
2. Copy the contents of the migration file
3. Run the SQL

The migration creates:
- `job_postings` table
- Indexes for performance
- Row Level Security (RLS) policies

### 3. Environment Variables

Ensure these are set in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GROQ_API_KEY`
- `NEXT_PUBLIC_CONVEX_URL`

### 4. Deploy Convex Schema

```bash
npx convex dev
```

This will automatically deploy the updated schema with the new recruiter tables.

## Usage Guide

### For Recruiters

1. **Navigate to Hiring Tab**
   - Click "Hiring" in the dashboard navigation

2. **Create a Job Posting**
   - Click "New Job" button
   - Paste your job description
   - Optionally add title and company
   - Click "Create & Find Matches"
   - The system will extract requirements and find matching candidates

3. **Review Candidates**
   - Swipe right to like a candidate
   - Swipe left to pass on a candidate
   - Swipe up to super-like a candidate
   - Or use the buttons below the card
   - Click "Undo" to reverse your last action

4. **View Stats**
   - See total matches, liked, passed, and super-liked counts
   - View average match score
   - Track your progress

5. **Filter Candidates**
   - Click "Filters" to adjust minimum match score
   - Switch between Pending, Liked, and Passed tabs

### For Developers

#### Creating a Match

The matching flow:
1. Job description is parsed by Groq LLM
2. Active portfolios are fetched from Supabase
3. Portfolios are parsed and cached in Convex
4. Each candidate is scored by Groq in batches
5. Matches are stored in Convex with scores and reasons

#### Extending the Matching Algorithm

To add new matching criteria, update:
1. `JobRequirements` type in `types/recruiter.ts`
2. Job parsing prompt in `app/api/recruiter/parse-job/route.ts`
3. Candidate scoring prompt in `app/api/recruiter/compute-matches/route.ts`
4. `MatchDetails` type to include new scoring dimensions

#### Performance Considerations

- **Batch Size**: Currently processes 10 portfolios at a time
- **Score Threshold**: Only includes matches above 20% score
- **Cache Strategy**: Portfolios are cached for 24 hours
- **Rate Limiting**: 500ms delay between batches to avoid API limits

## File Structure

```
/app
  /api
    /recruiter
      /parse-job/route.ts           # Job description parsing
      /compute-matches/route.ts     # Candidate scoring
      /update-match-status/route.ts # Status updates
  /dashboard
    /hiring/page.tsx                # Main hiring interface

/components
  recruiter-match-card.tsx          # Tinder card component
  recruiter-card-stack.tsx          # Card stack manager
  recruiter-job-selector.tsx        # Job creation/selection
  simple-dashboard-nav.tsx          # Navigation (updated)

/convex
  schema.ts                         # Database schema (updated)
  recruiter.ts                      # Convex functions

/types
  recruiter.ts                      # TypeScript types

/supabase
  /migrations
    *_create_job_postings.sql       # Supabase migration
```

## Performance Optimizations

### Implemented
- ✅ Portfolio caching in Convex
- ✅ Batch candidate processing
- ✅ Transform-based animations (GPU accelerated)
- ✅ Optimistic UI updates
- ✅ Lazy loading of card stack
- ✅ Memoized navigation items

### Future Enhancements
- [ ] Virtual scrolling for large match lists (react-virtuoso)
- [ ] Background job queue for match computation
- [ ] Redis caching for API responses
- [ ] Webhook for real-time portfolio updates
- [ ] Progressive loading (show first 10 matches immediately)

## Troubleshooting

### No matches found
- Ensure portfolios are published (`is_published = true`)
- Check if portfolios have sufficient data (skills, experience)
- Lower the minimum match score threshold
- Verify job requirements were extracted correctly

### Slow match computation
- Reduce batch size in `compute-matches/route.ts`
- Increase delay between batches
- Use Groq's faster models (`llama-3.1-8b-instant`)

### Card animations lagging
- Ensure hardware acceleration is enabled in browser
- Reduce number of cards rendered in stack (currently 3)
- Check browser console for performance warnings

## Future Features

- [ ] Email notifications for super-liked candidates
- [ ] Candidate profile preview before decision
- [ ] Export liked candidates to CSV
- [ ] Interview scheduling integration
- [ ] Team collaboration (share candidates)
- [ ] Advanced filters (skills, location, experience range)
- [ ] Candidate notes and tagging
- [ ] Analytics dashboard
- [ ] Mobile app with native gestures

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Database**: Supabase (PostgreSQL) + Convex
- **AI**: Groq (llama-3.3-70b-versatile)
- **Animations**: Framer Motion
- **Styling**: Tailwind CSS + shadcn/ui
- **Real-time**: Convex
- **Authentication**: Supabase Auth

## Contributing

When adding features:
1. Update TypeScript types in `types/recruiter.ts`
2. Add Convex functions if needed
3. Update UI components
4. Test with real portfolios
5. Update this documentation

## License

Part of the zigZig platform.


