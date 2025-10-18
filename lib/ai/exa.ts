import { Exa } from "exa-js";

let exa: Exa | null = null;

if (process.env.EXA_API_KEY) {
  exa = new Exa(process.env.EXA_API_KEY);
}

export interface JobSearchFilters {
  skills: string[];
  location?: string;
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'lead';
  jobType?: 'full-time' | 'part-time' | 'contract' | 'internship';
  salaryRange?: { min: number; max: number };
  companySize?: 'startup' | 'mid-size' | 'enterprise';
  remote?: boolean;
  industry?: string[];
}

export interface EnhancedJob {
  id: string;
  title: string;
  url: string;
  company: string;
  location: string;
  description: string;
  publishedDate: string;
  score: number;
  relevanceScore: number;
  salaryRange?: { min: number; max: number; currency: string };
  jobType: string;
  experienceLevel: string;
  skills: string[];
  benefits: string[];
  companySize?: string;
  companyCulture?: string;
  applicationDeadline?: string;
  remote: boolean;
  hybrid: boolean;
}

export async function searchJobOpportunities(
  filters: JobSearchFilters,
  userProfile?: any
): Promise<EnhancedJob[]> {
  if (!exa || !process.env.EXA_API_KEY) {
    throw new Error('EXA_API_KEY environment variable is required');
  }

  try {
    // Build sophisticated search query
    const query = buildAdvancedJobQuery(filters, userProfile);
    
    // Use improved search strategy with better query construction
    const [primaryResults, specializedResults] = await Promise.all([
      // Primary neural search with enhanced query
      exa.searchAndContents(query, {
        type: "neural",
        numResults: 25,
        useAutoprompt: true,
        text: { maxCharacters: 1000 },
        includeDomains: [
          'linkedin.com/jobs', 'indeed.com', 'glassdoor.com', 'wellfound.com', 
          'jobs.lever.co', 'greenhouse.io', 'careers.google.com', 'jobs.apple.com', 
          'amazon.jobs', 'microsoft.com/careers', 'careers.netflix.com', 'jobs.spotify.com',
          'careers.stripe.com', 'jobs.github.com', 'careers.shopify.com', 'careers.airbnb.com',
          'jobsbank.gov.sg', 'jobstreet.sg', 'indeed.sg', 'mycareersfuture.gov.sg',
          'techinasia.com/jobs', 'glints.com', 'nodesk.co'
        ],
      }),
      
      // Specialized boards with targeted query
      exa.searchAndContents(buildSpecializedQuery(filters), {
        type: "neural",
        numResults: 15,
        useAutoprompt: true,
        text: { maxCharacters: 1000 },
        includeDomains: [
          'remoteok.io', 'weworkremotely.com', 'relocate.me', 'landing.jobs', 
          'arbeitnow.com', 'remote.co', 'flexjobs.com', 'remotive.io',
          'nodesk.co', 'workingnomads.co', 'jobspresso.co', 'welcometothejungle.com',
          'stackoverflowjobs.com', 'dice.com', 'monster.com', 'ziprecruiter.com'
        ],
      })
    ]);

    // Combine and deduplicate results from all sources
    const allResults = [...primaryResults.results, ...specializedResults.results];
    const uniqueResults = deduplicateResults(allResults);
    
    // Filter out unwanted domains since we can't use excludeDomains
    const filteredResults = uniqueResults.filter(result => {
      const url = result.url?.toLowerCase() || '';
      return !url.includes('stackoverflow.com') && 
             !url.includes('github.com') && 
             !url.includes('reddit.com');
    });

    // Enhance job data with AI analysis
    const enhancedJobs = await Promise.all(
      filteredResults.map(async (result, index) => {
        const enhanced = await enhanceJobData(result, filters, userProfile);
        return {
          ...enhanced,
          id: `job_${Date.now()}_${index}`,
          relevanceScore: calculateRelevanceScore(enhanced, filters, userProfile),
        };
      })
    );

    // Sort by relevance score
    return enhancedJobs.sort((a, b) => b.relevanceScore - a.relevanceScore);

  } catch (error) {
    console.error('Exa job search error:', error);
    throw error;
  }
}

function buildAdvancedJobQuery(filters: JobSearchFilters, userProfile?: any): string {
  const { skills, location, experienceLevel, jobType, salaryRange, companySize, remote, industry } = filters;
  
  let queryParts: string[] = [];
  
  // Core job intent with user context
  if (userProfile?.parsedPortfolio?.marketProfile?.roleAlignment) {
    queryParts.push(userProfile.parsedPortfolio.marketProfile.roleAlignment.join(' OR '));
  } else {
    queryParts.push('software engineer developer position opening');
  }
  
  // Skills with semantic expansion
  if (skills.length > 0) {
    const primarySkills = skills.slice(0, 5);
    const skillContext = primarySkills.map(s => 
      `"${s}" OR ${getSkillSynonyms(s).slice(0, 2).join(' OR ')}`
    ).join(' ');
    queryParts.push(skillContext);
  }
  
  // Experience context from actual portfolio
  if (userProfile?.parsedPortfolio?.experience) {
    const expLevel = userProfile.parsedPortfolio.experience.level;
    const expYears = userProfile.parsedPortfolio.experience.totalYears;
    queryParts.push(`${expLevel} ${expYears}+ years`);
  } else if (experienceLevel) {
    const levelTerms = {
      'entry': 'junior entry-level graduate new grad',
      'mid': 'mid-level intermediate 2-5 years',
      'senior': 'senior lead principal 5+ years',
      'lead': 'lead principal staff architect director'
    };
    queryParts.push(levelTerms[experienceLevel]);
  }
  
  // Location/remote preference with intelligent expansion - prioritize location
  if (location && location.toLowerCase().includes('singapore')) {
    // Make Singapore searches very specific
    queryParts.push('"Singapore" OR "SG" OR "Southeast Asia" OR "Singapore jobs"');
  } else if (remote) {
    queryParts.push('remote "work from anywhere" distributed "fully remote" WFH');
  } else if (location) {
    const expandedLocation = expandLocationForSearch(location);
    queryParts.push(expandedLocation);
  }
  
  // Industry context
  if (industry && industry.length > 0) {
    queryParts.push(industry.slice(0, 3).join(' OR '));
  }
  
  // Job type
  if (jobType) {
    queryParts.push(jobType);
  }
  
  // Company size preferences
  if (companySize) {
    const sizeTerms = {
      'startup': 'startup early-stage venture-backed',
      'mid-size': 'mid-size growing company',
      'enterprise': 'enterprise large company fortune 500'
    };
    queryParts.push(sizeTerms[companySize]);
  }
  
  return queryParts.join(' ');
}

function buildSpecializedQuery(filters: JobSearchFilters): string {
  const { skills, remote, industry } = filters;
  
  let query = "software engineering jobs";
  
  if (skills.length > 0) {
    query += ` ${skills.slice(0, 3).join(' ')}`;
  }
  
  if (remote) {
    query += " remote distributed work from home";
  }
  
  if (industry && industry.length > 0) {
    query += ` ${industry.slice(0, 2).join(' ')}`;
  }
  
  return query;
}

function expandLocationForSearch(location: string): string {
  const locationLower = location.toLowerCase().trim();
  
  // Location expansion mappings for better search results
  const expansions: { [key: string]: string[] } = {
    // Asia-Pacific
    'singapore': ['Singapore', 'SG', 'Southeast Asia'],
    'hong kong': ['Hong Kong', 'HK'],
    'tokyo': ['Tokyo', 'Japan'],
    'sydney': ['Sydney', 'Australia'],
    'melbourne': ['Melbourne', 'Australia'],
    'bangalore': ['Bangalore', 'Bengaluru', 'India'],
    'mumbai': ['Mumbai', 'India'],
    'delhi': ['Delhi', 'New Delhi', 'India'],
    'pune': ['Pune', 'India'],
    
    // Europe
    'london': ['London', 'UK', 'United Kingdom'],
    'berlin': ['Berlin', 'Germany'],
    'paris': ['Paris', 'France'],
    'amsterdam': ['Amsterdam', 'Netherlands'],
    'stockholm': ['Stockholm', 'Sweden'],
    'copenhagen': ['Copenhagen', 'Denmark'],
    'zurich': ['Zurich', 'Switzerland'],
    'geneva': ['Geneva', 'Switzerland'],
    'dublin': ['Dublin', 'Ireland'],
    'tel aviv': ['Tel Aviv', 'Israel'],
    
    // North America
    'san francisco': ['San Francisco', 'SF', 'Bay Area', 'Silicon Valley'],
    'sf': ['San Francisco', 'SF', 'Bay Area', 'Silicon Valley'],
    'bay area': ['San Francisco', 'SF', 'Bay Area', 'Silicon Valley', 'Palo Alto', 'Mountain View'],
    'silicon valley': ['San Francisco', 'SF', 'Bay Area', 'Silicon Valley', 'Palo Alto', 'Mountain View'],
    'new york': ['New York', 'NYC', 'Manhattan', 'Brooklyn'],
    'nyc': ['New York', 'NYC', 'Manhattan', 'Brooklyn'],
    'los angeles': ['Los Angeles', 'LA', 'Santa Monica'],
    'la': ['Los Angeles', 'LA', 'Santa Monica'],
    'seattle': ['Seattle', 'Bellevue', 'Redmond'],
    'boston': ['Boston', 'Cambridge'],
    'washington dc': ['Washington DC', 'DC', 'Arlington'],
    'dc': ['Washington DC', 'DC', 'Arlington'],
    'austin': ['Austin', 'Texas'],
    'chicago': ['Chicago', 'Illinois'],
    'denver': ['Denver', 'Boulder', 'Colorado'],
    'atlanta': ['Atlanta', 'Georgia'],
    'miami': ['Miami', 'Florida'],
    'dallas': ['Dallas', 'Texas'],
    'houston': ['Houston', 'Texas'],
    'phoenix': ['Phoenix', 'Arizona'],
    'san diego': ['San Diego', 'California'],
    'portland': ['Portland', 'Oregon'],
    'toronto': ['Toronto', 'Canada'],
    'vancouver': ['Vancouver', 'Canada'],
    
    // Remote
    'remote': ['remote', 'work from home', 'distributed', 'anywhere']
  };
  
  const expanded = expansions[locationLower];
  if (expanded) {
    return expanded.map(loc => `"${loc}"`).join(' OR ');
  }
  
  // If no specific expansion, use the original location with quotes
  return `"${location}"`;
}

function getSkillSynonyms(skill: string): string[] {
  const synonyms: { [key: string]: string[] } = {
    'React': ['React.js', 'ReactJS', 'React Native', 'Frontend', 'UI/UX'],
    'Node.js': ['NodeJS', 'Node', 'Backend', 'Server-side'],
    'Python': ['Python3', 'Django', 'Flask', 'FastAPI', 'Data Science'],
    'JavaScript': ['JS', 'ES6', 'TypeScript', 'Frontend', 'Web Development'],
    'TypeScript': ['TS', 'JavaScript', 'Frontend', 'Web Development'],
    'AWS': ['Amazon Web Services', 'Cloud', 'DevOps', 'Infrastructure'],
    'Docker': ['Containerization', 'Kubernetes', 'DevOps', 'CI/CD'],
    'PostgreSQL': ['Postgres', 'SQL', 'Database', 'Backend'],
    'MongoDB': ['NoSQL', 'Database', 'Backend', 'Document Database'],
    'Kubernetes': ['K8s', 'Container Orchestration', 'DevOps', 'Cloud Native'],
    'Go': ['Golang', 'Backend', 'Microservices', 'System Programming'],
    'Java': ['Spring', 'Backend', 'Enterprise', 'JVM'],
    'C++': ['Cpp', 'System Programming', 'Performance', 'Embedded'],
    'Machine Learning': ['ML', 'AI', 'Data Science', 'Deep Learning', 'Neural Networks'],
    'Data Science': ['Analytics', 'Statistics', 'Python', 'R', 'Machine Learning'],
    'DevOps': ['CI/CD', 'Infrastructure', 'Automation', 'Cloud'],
    'Frontend': ['UI', 'UX', 'React', 'Vue', 'Angular', 'Web Development'],
    'Backend': ['API', 'Server', 'Database', 'Microservices'],
    'Full Stack': ['Full-Stack', 'Fullstack', 'Web Development', 'End-to-End']
  };
  
  return synonyms[skill] || [skill];
}

function calculateExperienceYears(experience: any[]): number {
  if (!experience || experience.length === 0) return 0;
  
  // Simple calculation based on number of experience entries
  // In a real implementation, you'd parse dates and calculate actual years
  return Math.min(experience.length * 1.5, 10); // Cap at 10 years
}

async function enhanceJobData(result: any, filters: JobSearchFilters, userProfile?: any): Promise<Omit<EnhancedJob, 'id' | 'relevanceScore'>> {
  const text = result.text || '';
  const title = result.title || 'Software Engineer';
  
  // Extract and enhance location information
  let extractedLocation = extractLocationFromText(text) || extractLocationFromTitle(title);
  
  // If no location found, try to infer from URL or use filter location
  if (!extractedLocation) {
    extractedLocation = extractLocationFromUrl(result.url) || filters.location || 'Remote';
  }
  
  // Normalize the location for consistency
  const normalizedLocation = normalizeLocation(extractedLocation);
  
  return {
    title,
    url: result.url,
    company: extractCompanyFromTitle(title),
    location: normalizedLocation,
    description: text.substring(0, 500) + (text.length > 500 ? '...' : ''),
    publishedDate: result.publishedDate || new Date().toISOString(),
    score: result.score || 0,
    salaryRange: extractSalaryFromText(text),
    jobType: extractJobTypeFromText(text),
    experienceLevel: extractExperienceLevelFromText(text),
    skills: extractSkillsFromText(text),
    benefits: extractBenefitsFromText(text),
    companySize: extractCompanySizeFromText(text),
    companyCulture: extractCompanyCultureFromText(text),
    applicationDeadline: extractApplicationDeadlineFromText(text),
    remote: isRemoteJob(text) || isRemoteJob(title),
    hybrid: isHybridJob(text) || isHybridJob(title),
  };
}

function extractLocationFromTitle(title: string): string | null {
  // Extract location from job title patterns
  const titleLocationPatterns = [
    /\(([^)]+)\)$/, // Location in parentheses at end
    /-\s*([^-]+)$/, // Location after dash at end
    /,\s*([^,]+)$/, // Location after comma at end
    /\|\s*([^|]+)$/, // Location after pipe at end
  ];
  
  for (const pattern of titleLocationPatterns) {
    const match = title.match(pattern);
    if (match) {
      const location = match[1].trim();
      // Filter out non-location text
      if (!isNonLocationText(location)) {
        return location;
      }
    }
  }
  
  return null;
}

function extractLocationFromUrl(url: string): string | null {
  // Extract location hints from URL structure
  const urlPatterns = [
    /\/jobs\/([a-z-]+)-[a-z-]+-\d+/, // Job board URL patterns
    /location=([^&]+)/, // URL parameter
    /\/([a-z-]+)\/jobs/, // City in URL path
  ];
  
  for (const pattern of urlPatterns) {
    const match = url.match(pattern);
    if (match) {
      const location = decodeURIComponent(match[1]).replace(/-/g, ' ');
      if (!isNonLocationText(location)) {
        return location;
      }
    }
  }
  
  return null;
}

function isNonLocationText(text: string): boolean {
  const nonLocationKeywords = [
    'full time', 'part time', 'contract', 'permanent', 'temporary',
    'senior', 'junior', 'lead', 'principal', 'staff', 'director',
    'engineer', 'developer', 'manager', 'analyst', 'consultant',
    'software', 'frontend', 'backend', 'fullstack', 'devops',
    'remote', 'hybrid', 'onsite', 'work from home',
    'urgent', 'immediate', 'asap', 'new', 'hot', 'featured'
  ];
  
  const textLower = text.toLowerCase();
  return nonLocationKeywords.some(keyword => textLower.includes(keyword));
}

function calculateRelevanceScore(job: Omit<EnhancedJob, 'id' | 'relevanceScore'>, filters: JobSearchFilters, userProfile?: any): number {
  let score = job.score || 0.5;
  
  // Profile-based skill matching (40% weight)
  const profileSkills = userProfile?.parsedPortfolio?.skills.all || filters.skills;
  const skillMatchScore = calculateSkillAlignment(job.skills, profileSkills);
  score += skillMatchScore * 0.4;
  
  // Experience level alignment (20% weight)
  const expMatch = matchExperienceLevel(
    job.experienceLevel, 
    userProfile?.parsedPortfolio?.experience.level || filters.experienceLevel
  );
  score += expMatch * 0.2;
  
  // Location/remote preference (15% weight)
  if (filters.remote && job.remote) score += 0.15;
  else if (filters.location && jobLocationMatch(job.location, filters.location)) {
    score += 0.1;
  }
  
  // Industry preference (10% weight)
  if (filters.industry?.some(ind => 
    job.description.toLowerCase().includes(ind.toLowerCase())
  )) {
    score += 0.1;
  }
  
  // Company quality signals (10% weight)
  const companyScore = assessCompanyQuality(job.company, job.url);
  score += companyScore * 0.1;
  
  // Job type match (5% weight)
  if (filters.jobType && job.jobType.toLowerCase().includes(filters.jobType)) {
    score += 0.05;
  }
  
  return Math.min(score, 1.0);
}

// Helper functions for enhanced scoring
function calculateSkillAlignment(jobSkills: string[], profileSkills: string[]): number {
  if (profileSkills.length === 0) return 0;
  
  const matches = profileSkills.filter(profileSkill => 
    jobSkills.some(jobSkill => 
      jobSkill.toLowerCase().includes(profileSkill.toLowerCase()) ||
      profileSkill.toLowerCase().includes(jobSkill.toLowerCase())
    )
  ).length;
  
  return matches / profileSkills.length;
}

function matchExperienceLevel(jobLevel: string, userLevel?: string): number {
  if (!userLevel) return 0.5;
  
  const levelMap: { [key: string]: number } = {
    'entry': 1, 'junior': 1, 'entry-level': 1,
    'mid': 2, 'mid-level': 2, 'intermediate': 2,
    'senior': 3, 'lead': 4, 'principal': 4, 'staff': 4
  };
  
  const jobLevelNum = levelMap[jobLevel.toLowerCase()] || 2;
  const userLevelNum = levelMap[userLevel.toLowerCase()] || 2;
  
  // Perfect match
  if (jobLevelNum === userLevelNum) return 1.0;
  
  // Adjacent levels (senior can apply to lead, etc.)
  if (Math.abs(jobLevelNum - userLevelNum) === 1) return 0.7;
  
  // Too far apart
  return 0.2;
}

function jobLocationMatch(jobLocation: string, userLocation: string): boolean {
  if (!jobLocation || !userLocation) return false;
  
  const jobLower = jobLocation.toLowerCase().trim();
  const userLower = userLocation.toLowerCase().trim();
  
  // Exact match
  if (jobLower === userLower) return true;
  
  // Normalize both locations for better matching
  const normalizedJob = normalizeLocation(jobLocation);
  const normalizedUser = normalizeLocation(userLocation);
  
  if (normalizedJob.toLowerCase() === normalizedUser.toLowerCase()) return true;
  
  // Check for partial matches with common location patterns
  const locationMappings = [
    // Major tech hubs
    ['san francisco', 'sf', 'bay area', 'silicon valley', 'palo alto', 'mountain view', 'cupertino', 'sunnyvale'],
    ['new york', 'nyc', 'new york city', 'manhattan', 'brooklyn'],
    ['los angeles', 'la', 'santa monica', 'west hollywood', 'beverly hills'],
    ['seattle', 'bellevue', 'redmond', 'kirkland'],
    ['boston', 'cambridge', 'somerville'],
    ['washington dc', 'dc', 'arlington', 'alexandria'],
    ['austin', 'round rock', 'cedar park'],
    ['chicago', 'evanston', 'oak park'],
    ['denver', 'boulder', 'golden'],
    ['atlanta', 'buckhead', 'midtown'],
    ['miami', 'south beach', 'coral gables'],
    ['dallas', 'plano', 'richardson', 'frisco'],
    ['houston', 'sugar land', 'the woodlands'],
    ['phoenix', 'scottsdale', 'tempe'],
    ['san diego', 'la jolla', 'del mar'],
    ['portland', 'beaverton', 'lake oswego'],
    // Remote work variations
    ['remote', 'work from home', 'distributed', 'anywhere', 'wfh', 'fully remote', '100% remote']
  ];
  
  // Check if both locations belong to the same metro area
  for (const group of locationMappings) {
    const jobInGroup = group.some(loc => jobLower.includes(loc) || loc.includes(jobLower));
    const userInGroup = group.some(loc => userLower.includes(loc) || loc.includes(userLower));
    
    if (jobInGroup && userInGroup) return true;
  }
  
  // Check for state-level matches (e.g., "California" matches "San Francisco, CA")
  const stateAbbreviations: { [key: string]: string[] } = {
    'ca': ['california', 'calif'],
    'ny': ['new york'],
    'tx': ['texas'],
    'fl': ['florida'],
    'wa': ['washington'],
    'ma': ['massachusetts'],
    'il': ['illinois'],
    'co': ['colorado'],
    'ga': ['georgia'],
    'az': ['arizona'],
    'or': ['oregon'],
    'nc': ['north carolina'],
    'va': ['virginia'],
    'md': ['maryland'],
    'pa': ['pennsylvania'],
    'oh': ['ohio'],
    'mi': ['michigan'],
    'mn': ['minnesota'],
    'wi': ['wisconsin'],
    'ut': ['utah'],
    'nv': ['nevada']
  };
  
  for (const [abbrev, fullNames] of Object.entries(stateAbbreviations)) {
    const jobHasState = jobLower.includes(abbrev) || fullNames.some(name => jobLower.includes(name));
    const userHasState = userLower.includes(abbrev) || fullNames.some(name => userLower.includes(name));
    
    if (jobHasState && userHasState) return true;
  }
  
  // Fallback to partial string matching
  return jobLower.includes(userLower) || userLower.includes(jobLower);
}

function assessCompanyQuality(company: string, url: string): number {
  // Known high-quality companies
  const topCompanies = [
    'google', 'microsoft', 'apple', 'amazon', 'meta', 'netflix', 'uber', 'airbnb',
    'stripe', 'square', 'palantir', 'databricks', 'snowflake', 'mongodb',
    'atlassian', 'slack', 'zoom', 'salesforce', 'adobe', 'oracle'
  ];
  
  const companyLower = company.toLowerCase();
  const urlLower = url.toLowerCase();
  
  // Check if it's a known top company
  if (topCompanies.some(top => companyLower.includes(top))) {
    return 1.0;
  }
  
  // Check for quality indicators in URL
  if (urlLower.includes('careers.') || urlLower.includes('jobs.')) {
    return 0.8;
  }
  
  // Well-known job boards
  if (urlLower.includes('linkedin.com') || urlLower.includes('indeed.com')) {
    return 0.7;
  }
  
  return 0.5;
}

function deduplicateResults(results: any[]): any[] {
  const seen = new Set();
  return results.filter(result => {
    const key = result.url || result.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Enhanced extraction functions with improved location intelligence
function extractLocationFromText(text: string): string | null {
  const locationPatterns = [
    // Specific location formats
    /(?:location|based in|office in|headquarters in)[:\s]+([^,\n\.]+)/i,
    /(?:located in|position in|role in)[:\s]+([^,\n\.]+)/i,
    
    // City, State format
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2,3})\b/,
    
    // City, Country format  
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
    
    // Remote work indicators
    /(?:remote|distributed|work from (?:home|anywhere)|fully remote|100% remote)/i,
    
    // Hybrid work indicators
    /(?:hybrid|flexible location|remote-friendly)/i,
    
    // On-site indicators
    /(?:on-site|in-office|office-based)/i
  ];
  
  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match) {
      let location = match[1] || match[0];
      return normalizeLocation(location.trim());
    }
  }
  
  return null;
}

function normalizeLocation(location: string): string {
  // Common location normalizations
  const normalizations: { [key: string]: string } = {
    'sf': 'San Francisco',
    'bay area': 'San Francisco Bay Area',
    'silicon valley': 'San Francisco Bay Area',
    'nyc': 'New York',
    'new york city': 'New York',
    'la': 'Los Angeles',
    'dc': 'Washington DC',
    'washington d.c.': 'Washington DC',
    'boston area': 'Boston',
    'greater boston': 'Boston',
    'seattle area': 'Seattle',
    'greater seattle': 'Seattle',
    'austin area': 'Austin',
    'chicago area': 'Chicago',
    'denver area': 'Denver',
    'atlanta area': 'Atlanta',
    'miami area': 'Miami',
    'dallas area': 'Dallas',
    'houston area': 'Houston',
    'phoenix area': 'Phoenix',
    'san diego area': 'San Diego',
    'portland area': 'Portland',
    'remote work': 'Remote',
    'work from home': 'Remote',
    'distributed': 'Remote',
    'fully remote': 'Remote',
    '100% remote': 'Remote',
    'anywhere': 'Remote'
  };
  
  const normalized = normalizations[location.toLowerCase()];
  return normalized || location;
}

function extractSalaryFromText(text: string): { min: number; max: number; currency: string } | undefined {
  const salaryPatterns = [
    /\$(\d{1,3}(?:,\d{3})*(?:k|K)?)\s*-\s*\$(\d{1,3}(?:,\d{3})*(?:k|K)?)/,
    /(\d{1,3}(?:,\d{3})*(?:k|K)?)\s*-\s*(\d{1,3}(?:,\d{3})*(?:k|K)?)\s*(?:USD|dollars?)/i
  ];
  
  for (const pattern of salaryPatterns) {
    const match = text.match(pattern);
    if (match) {
      const min = parseSalary(match[1]);
      const max = parseSalary(match[2]);
      if (min && max) {
        return { min, max, currency: 'USD' };
      }
    }
  }
  
  return undefined;
}

function parseSalary(salaryStr: string): number | null {
  const num = salaryStr.replace(/[,$]/g, '').toLowerCase();
  const multiplier = num.includes('k') ? 1000 : 1;
  const value = parseInt(num.replace('k', ''));
  return isNaN(value) ? null : value * multiplier;
}

function extractJobTypeFromText(text: string): string {
  const textLower = text.toLowerCase();
  if (textLower.includes('full-time') || textLower.includes('full time')) return 'Full-time';
  if (textLower.includes('part-time') || textLower.includes('part time')) return 'Part-time';
  if (textLower.includes('contract')) return 'Contract';
  if (textLower.includes('internship')) return 'Internship';
  return 'Full-time';
}

function extractExperienceLevelFromText(text: string): string {
  const textLower = text.toLowerCase();
  if (textLower.includes('senior') || textLower.includes('lead') || textLower.includes('principal')) return 'Senior';
  if (textLower.includes('mid-level') || textLower.includes('intermediate')) return 'Mid-level';
  if (textLower.includes('junior') || textLower.includes('entry-level') || textLower.includes('new grad')) return 'Entry-level';
  return 'Mid-level';
}

function extractSkillsFromText(text: string): string[] {
  const commonSkills = [
    'React', 'Node.js', 'Python', 'JavaScript', 'TypeScript', 'Java', 'Go', 'C++',
    'AWS', 'Docker', 'Kubernetes', 'PostgreSQL', 'MongoDB', 'Redis',
    'Machine Learning', 'Data Science', 'DevOps', 'Frontend', 'Backend'
  ];
  
  return commonSkills.filter(skill => 
    text.toLowerCase().includes(skill.toLowerCase())
  );
}

function extractBenefitsFromText(text: string): string[] {
  const benefits = [];
  const textLower = text.toLowerCase();
  
  if (textLower.includes('health insurance')) benefits.push('Health Insurance');
  if (textLower.includes('dental')) benefits.push('Dental');
  if (textLower.includes('vision')) benefits.push('Vision');
  if (textLower.includes('401k') || textLower.includes('retirement')) benefits.push('401k');
  if (textLower.includes('stock options') || textLower.includes('equity')) benefits.push('Stock Options');
  if (textLower.includes('flexible hours') || textLower.includes('flexible schedule')) benefits.push('Flexible Hours');
  if (textLower.includes('remote work')) benefits.push('Remote Work');
  if (textLower.includes('professional development')) benefits.push('Professional Development');
  
  return benefits;
}

function extractCompanySizeFromText(text: string): string | undefined {
  const textLower = text.toLowerCase();
  if (textLower.includes('startup') || textLower.includes('early-stage')) return 'Startup';
  if (textLower.includes('enterprise') || textLower.includes('fortune 500')) return 'Enterprise';
  if (textLower.includes('mid-size') || textLower.includes('growing company')) return 'Mid-size';
  return undefined;
}

function extractCompanyCultureFromText(text: string): string | undefined {
  const textLower = text.toLowerCase();
  if (textLower.includes('collaborative') || textLower.includes('team-oriented')) return 'Collaborative';
  if (textLower.includes('innovative') || textLower.includes('cutting-edge')) return 'Innovative';
  if (textLower.includes('fast-paced') || textLower.includes('dynamic')) return 'Fast-paced';
  return undefined;
}

function extractApplicationDeadlineFromText(text: string): string | undefined {
  const deadlinePattern = /(?:deadline|apply by|closes)[:\s]+([^,\n]+)/i;
  const match = text.match(deadlinePattern);
  return match ? match[1].trim() : undefined;
}

function isRemoteJob(text: string): boolean {
  const textLower = text.toLowerCase();
  return textLower.includes('remote') || textLower.includes('work from home') || textLower.includes('wfh');
}

function isHybridJob(text: string): boolean {
  const textLower = text.toLowerCase();
  return textLower.includes('hybrid') || textLower.includes('flexible location');
}

export async function findRelevantArticles(topic: string) {
  if (!exa || !process.env.EXA_API_KEY) {
    throw new Error('EXA_API_KEY environment variable is required');
  }

  try {
    const results = await exa.searchAndContents(topic, {
      type: "neural",
      numResults: 5,
      useAutoprompt: true,
    });

    return results.results.map(result => ({
      title: result.title,
      url: result.url,
      text: (result.text?.substring(0, 200) || 'No content available') + (result.text && result.text.length > 200 ? '...' : ''),
      publishedDate: result.publishedDate,
    }));
  } catch (error) {
    console.error('Exa articles error:', error);
    throw error;
  }
}

// Specialized search functions for different regions and platforms
export async function searchJapanJobs(skills: string[], location?: string): Promise<EnhancedJob[]> {
  if (!exa || !process.env.EXA_API_KEY) {
    throw new Error('EXA_API_KEY environment variable is required');
  }

  try {
    const query = `software engineering jobs Japan ${skills.join(' ')} ${location || 'Tokyo'}`;
    
    const results = await exa.searchAndContents(query, {
      type: "neural",
      numResults: 8,
      useAutoprompt: true,
      includeDomains: ['tokyodev.com', 'japan-dev.com', 'jobs.github.com', 'linkedin.com'],
    });

    return results.results.map((result, index) => ({
      id: `japan_${Date.now()}_${index}`,
      title: result.title || 'Software Engineer',
      url: result.url,
      company: extractCompanyFromTitle(result.title || ''),
      location: 'Japan',
      description: (result.text?.substring(0, 400) || 'No description available') + (result.text && result.text.length > 400 ? '...' : ''),
      publishedDate: result.publishedDate || new Date().toISOString(),
      score: result.score || 0,
      relevanceScore: result.score || 0,
      jobType: 'Full-time',
      experienceLevel: 'Mid-level',
      skills: extractSkillsFromText(result.text || ''),
      benefits: extractBenefitsFromText(result.text || ''),
      remote: false,
      hybrid: false,
    }));
  } catch (error) {
    console.error('Japan job search error:', error);
    throw error;
  }
}

export async function searchEuropeJobs(skills: string[], location?: string): Promise<EnhancedJob[]> {
  if (!exa || !process.env.EXA_API_KEY) {
    throw new Error('EXA_API_KEY environment variable is required');
  }

  try {
    const query = `software engineering jobs Europe ${skills.join(' ')} ${location || 'remote'}`;
    
    const results = await exa.searchAndContents(query, {
      type: "neural",
      numResults: 10,
      useAutoprompt: true,
      includeDomains: [
        'landing.jobs', 'arbeitnow.com', 'relocate.me', 'jobs.ie', 
        'totaljobs.com', 'reed.co.uk', 'stepstone.de', 'xing.com',
        'jobteaser.com', 'welcometothejungle.com'
      ],
    });

    return results.results.map((result, index) => ({
      id: `europe_${Date.now()}_${index}`,
      title: result.title || 'Software Engineer',
      url: result.url,
      company: extractCompanyFromTitle(result.title || ''),
      location: location || 'Europe',
      description: (result.text?.substring(0, 400) || 'No description available') + (result.text && result.text.length > 400 ? '...' : ''),
      publishedDate: result.publishedDate || new Date().toISOString(),
      score: result.score || 0,
      relevanceScore: result.score || 0,
      jobType: 'Full-time',
      experienceLevel: 'Mid-level',
      skills: extractSkillsFromText(result.text || ''),
      benefits: extractBenefitsFromText(result.text || ''),
      remote: isRemoteJob(result.text || ''),
      hybrid: isHybridJob(result.text || ''),
    }));
  } catch (error) {
    console.error('Europe job search error:', error);
    throw error;
  }
}

export async function searchHackerNewsJobs(skills: string[]): Promise<EnhancedJob[]> {
  if (!exa || !process.env.EXA_API_KEY) {
    throw new Error('EXA_API_KEY environment variable is required');
  }

  try {
    const query = `"who's hiring" software engineering ${skills.join(' ')} visa sponsorship`;
    
    const results = await exa.searchAndContents(query, {
      type: "neural",
      numResults: 6,
      useAutoprompt: true,
      includeDomains: ['news.ycombinator.com'],
    });

    return results.results.map((result, index) => ({
      id: `hn_${Date.now()}_${index}`,
      title: result.title || 'Software Engineer',
      url: result.url,
      company: extractCompanyFromTitle(result.title || ''),
      location: 'Remote',
      description: (result.text?.substring(0, 400) || 'No description available') + (result.text && result.text.length > 400 ? '...' : ''),
      publishedDate: result.publishedDate || new Date().toISOString(),
      score: result.score || 0,
      relevanceScore: result.score || 0,
      jobType: 'Full-time',
      experienceLevel: 'Mid-level',
      skills: extractSkillsFromText(result.text || ''),
      benefits: extractBenefitsFromText(result.text || ''),
      remote: true,
      hybrid: false,
    }));
  } catch (error) {
    console.error('HackerNews job search error:', error);
    throw error;
  }
}

export async function searchRemoteJobs(skills: string[]): Promise<EnhancedJob[]> {
  if (!exa || !process.env.EXA_API_KEY) {
    throw new Error('EXA_API_KEY environment variable is required');
  }

  try {
    const query = `remote software engineering jobs ${skills.join(' ')} work from home`;
    
    const results = await exa.searchAndContents(query, {
      type: "neural",
      numResults: 8,
      useAutoprompt: true,
      includeDomains: [
        'remoteok.io', 'weworkremotely.com', 'remote.co', 'flexjobs.com',
        'workingnomads.co', 'remotive.io', 'nodesk.co', 'jobspresso.co'
      ],
    });

    return results.results.map((result, index) => ({
      id: `remote_${Date.now()}_${index}`,
      title: result.title || 'Remote Software Engineer',
      url: result.url,
      company: extractCompanyFromTitle(result.title || ''),
      location: 'Remote',
      description: (result.text?.substring(0, 400) || 'No description available') + (result.text && result.text.length > 400 ? '...' : ''),
      publishedDate: result.publishedDate || new Date().toISOString(),
      score: result.score || 0,
      relevanceScore: result.score || 0,
      jobType: 'Full-time',
      experienceLevel: 'Mid-level',
      skills: extractSkillsFromText(result.text || ''),
      benefits: extractBenefitsFromText(result.text || ''),
      remote: true,
      hybrid: false,
    }));
  } catch (error) {
    console.error('Remote job search error:', error);
    throw error;
  }
}

export async function searchCompanyInfo(companyName: string) {
  if (!exa || !process.env.EXA_API_KEY) {
    throw new Error('EXA_API_KEY environment variable is required');
  }

  try {
    const results = await exa.searchAndContents(`${companyName} company information careers`, {
      type: "neural",
      numResults: 3,
      useAutoprompt: true,
    });

    return results.results.map(result => ({
      title: result.title,
      url: result.url,
      text: (result.text?.substring(0, 300) || 'No information available') + (result.text && result.text.length > 300 ? '...' : ''),
      publishedDate: result.publishedDate,
    }));
  } catch (error) {
    console.error('Exa company search error:', error);
    throw error;
  }
}

// Helper functions
function extractCompanyFromTitle(title: string): string {
  // Simple extraction logic - in production you'd use more sophisticated parsing
  const commonPatterns = [
    /at (.+?) -/,
    /- (.+?)$/,
    /\| (.+?)$/,
  ];
  
  for (const pattern of commonPatterns) {
    const match = title.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  return 'Company';
}

// Removed mock data functions - using real APIs only

