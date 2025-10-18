/**
 * Advanced Exa AI Job Search System
 * Leverages all sophisticated Exa AI capabilities for intelligent job recommendations
 * Based on https://docs.exa.ai/reference/search
 */

import { Exa } from "exa-js";
import { JobSearchFilters, EnhancedJob } from "./exa";
import { ParsedPortfolioData } from "../portfolio-parser";

let exa: Exa | null = null;

if (process.env.EXA_API_KEY) {
  exa = new Exa(process.env.EXA_API_KEY);
}

export interface AdvancedJobSearchConfig {
  searchStrategies: ('neural' | 'keyword' | 'hybrid')[];
  includeFreshJobs: boolean;
  includeRemoteJobs: boolean;
  targetSpecificBoards: boolean;
  extractFullContent: boolean;
  enableLLMContext: boolean;
  maxResultsPerStrategy: number;
}

export interface ExaJobResult {
  id: string;
  title: string;
  url: string;
  publishedDate: string;
  author?: string;
  text?: string;
  highlights?: string[];
  highlightScores?: number[];
  summary?: string;
  subpages?: ExaSubpage[];
  relevanceScore: number;
  searchStrategy: string;
  domain: string;
  extractedJobData: ExtractedJobData;
}

interface ExaSubpage {
  id: string;
  url: string;
  title: string;
  author?: string;
  publishedDate: string;
  text: string;
  summary: string;
  highlights: string[];
  highlightScores: number[];
}

interface ExtractedJobData {
  company: string;
  location: string;
  salary?: { min: number; max: number; currency: string };
  experienceLevel: string;
  jobType: string;
  skills: string[];
  benefits: string[];
  remote: boolean;
  hybrid: boolean;
  applicationDeadline?: string;
  companySize?: string;
}

/**
 * Advanced Multi-Strategy Job Search using Exa AI
 * Implements sophisticated search patterns based on Exa documentation
 */
export async function advancedJobSearch(
  filters: JobSearchFilters,
  parsedPortfolio: ParsedPortfolioData,
  config: AdvancedJobSearchConfig = getDefaultConfig()
): Promise<ExaJobResult[]> {
  if (!exa || !process.env.EXA_API_KEY) {
    console.error('EXA_API_KEY required for advanced job search');
    return [];
  }

  const allResults: ExaJobResult[] = [];

  // Strategy 1: Neural Search for Semantic Job Matching
  if (config.searchStrategies.includes('neural')) {
    const neuralResults = await executeNeuralJobSearch(filters, parsedPortfolio, config);
    allResults.push(...neuralResults.map(r => ({ ...r, searchStrategy: 'neural' })));
  }

  // Strategy 2: Keyword Search for Exact Skill Matching  
  if (config.searchStrategies.includes('keyword')) {
    const keywordResults = await executeKeywordJobSearch(filters, parsedPortfolio, config);
    allResults.push(...keywordResults.map(r => ({ ...r, searchStrategy: 'keyword' })));
  }

  // Strategy 3: Hybrid Approach for Comprehensive Coverage
  if (config.searchStrategies.includes('hybrid')) {
    const hybridResults = await executeHybridJobSearch(filters, parsedPortfolio, config);
    allResults.push(...hybridResults.map(r => ({ ...r, searchStrategy: 'hybrid' })));
  }

  // Deduplicate and rank results
  const deduplicatedResults = deduplicateByUrl(allResults);
  const rankedResults = rankJobResults(deduplicatedResults, parsedPortfolio);

  return rankedResults.slice(0, 50); // Top 50 results
}

/**
 * Neural Search Strategy - Uses embeddings for semantic understanding
 * Best for finding jobs that match the overall profile and intent
 */
async function executeNeuralJobSearch(
  filters: JobSearchFilters,
  parsedPortfolio: ParsedPortfolioData,
  config: AdvancedJobSearchConfig
): Promise<ExaJobResult[]> {
  const query = buildSemanticJobQuery(parsedPortfolio, filters);
  
  try {
    const response = await exa!.search(query, {
      type: "neural", // Use neural search for semantic understanding
      numResults: Math.min(config.maxResultsPerStrategy, 100), // Neural supports up to 100
      category: "company", // Focus on company job pages
      userLocation: inferUserLocation(parsedPortfolio.location),
      
      // Target top job boards and company career pages
      includeDomains: getJobDomains(config.targetSpecificBoards),
      
      // Exclude non-job content
      excludeDomains: [
        "stackoverflow.com", "reddit.com", "quora.com", 
        "medium.com", "blog.com", "news.com"
      ],
      
      // Get fresh job postings (last 30 days)
      ...(config.includeFreshJobs && {
        startCrawlDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      }),
      
      // Ensure job-relevant terms are present
      includeText: buildJobIncludeTerms(parsedPortfolio.preferences.preferredRoles),
      
      // Exclude irrelevant content
      excludeText: ["internship"], // Exclude if not entry level
      
      // Extract rich content for analysis
      ...(config.extractFullContent && {
        contents: {
          text: true,
          highlights: true,
          summary: true,
          subpages: true,
        }
      }),
      
      // Format for LLM processing
      ...(config.enableLLMContext && {
        context: true
      }),
      
      // Enable content filtering
      moderation: true,
    });

    return processExaResults(response.results, 'neural');
  } catch (error) {
    console.error('Neural job search error:', error);
    return [];
  }
}

/**
 * Keyword Search Strategy - Traditional search for exact matches
 * Best for finding jobs with specific technical requirements
 */
async function executeKeywordJobSearch(
  filters: JobSearchFilters,
  parsedPortfolio: ParsedPortfolioData,
  config: AdvancedJobSearchConfig
): Promise<ExaJobResult[]> {
  const query = buildKeywordJobQuery(parsedPortfolio, filters);
  
  try {
    const response = await exa!.search(query, {
      type: "keyword", // Traditional keyword search
      numResults: Math.min(config.maxResultsPerStrategy, 10), // Keyword limited to 10
      userLocation: inferUserLocation(parsedPortfolio.location),
      
      // Target specific job boards for keyword search
      includeDomains: [
        "linkedin.com/jobs", "indeed.com", "glassdoor.com",
        "stackoverflow.com/jobs", "dice.com", "monster.com"
      ],
      
      // Recent postings only
      ...(config.includeFreshJobs && {
        startPublishedDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      }),
      
      // Must contain job-related terms
      includeText: [`${parsedPortfolio.preferences.preferredRoles[0] || 'developer'} position`],
      
      // Extract content for processing
      ...(config.extractFullContent && {
        contents: {
          text: true,
          highlights: true,
          summary: true,
        }
      }),
    });

    return processExaResults(response.results, 'keyword');
  } catch (error) {
    console.error('Keyword job search error:', error);
    return [];
  }
}

/**
 * Hybrid Search Strategy - Combines multiple approaches
 * Uses auto mode with strategic parameter combinations
 */
async function executeHybridJobSearch(
  filters: JobSearchFilters,
  parsedPortfolio: ParsedPortfolioData,
  config: AdvancedJobSearchConfig
): Promise<ExaJobResult[]> {
  const queries = buildHybridJobQueries(parsedPortfolio, filters);
  const allResults: ExaJobResult[] = [];
  
  for (const queryConfig of queries) {
    try {
      const response = await exa!.search(queryConfig.query, {
        type: "auto", // Let Exa choose the best approach
        numResults: Math.min(15, config.maxResultsPerStrategy / queries.length),
        category: queryConfig.category,
        userLocation: inferUserLocation(parsedPortfolio.location),
        
        includeDomains: queryConfig.domains,
        
        ...(config.includeFreshJobs && {
          startCrawlDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
        }),
        
        includeText: queryConfig.includeText,
        
        ...(config.extractFullContent && {
          contents: {
            text: true,
            highlights: true,
            summary: true,
          }
        }),
        
        moderation: true,
      });

      const results = processExaResults(response.results, 'hybrid');
      allResults.push(...results);
    } catch (error) {
      console.error(`Hybrid search error for query "${queryConfig.query}":`, error);
    }
  }
  
  return allResults;
}

/**
 * Build semantic query optimized for neural search
 * Focuses on career intent and professional growth
 */
function buildSemanticJobQuery(portfolio: ParsedPortfolioData, filters: JobSearchFilters): string {
  const queryParts = [];
  
  // Career progression intent
  if (portfolio.preferences.preferredRoles.length > 0) {
    queryParts.push(`seeking ${portfolio.preferences.preferredRoles[0].toLowerCase()} role`);
  }
  
  // Professional context
  queryParts.push(`${portfolio.experience.level} professional`);
  
  // Technical expertise  
  if (portfolio.skills.technical.length > 0) {
    queryParts.push(`specializing in ${portfolio.skills.technical.slice(0, 3).join(', ')}`);
  }
  
  // Industry preference
  if (portfolio.experience.industries.length > 0) {
    queryParts.push(`in ${portfolio.experience.industries[0]} industry`);
  }
  
  // Location context
  if (filters.location) {
    queryParts.push(`located in ${filters.location}`);
  } else if (filters.remote) {
    queryParts.push('remote work opportunities');
  }
  
  return queryParts.join(' ');
}

/**
 * Build keyword query for exact technical matches
 */
function buildKeywordJobQuery(portfolio: ParsedPortfolioData, filters: JobSearchFilters): string {
  const queryParts = [];
  
  // Exact role match
  if (portfolio.preferences.preferredRoles.length > 0) {
    queryParts.push(`"${portfolio.preferences.preferredRoles[0]}"`);
  }
  
  // Key technical skills
  const topSkills = portfolio.skills.all.slice(0, 3);
  topSkills.forEach(skill => {
    queryParts.push(`"${skill}"`);
  });
  
  // Experience level
  queryParts.push(`"${portfolio.experience.level}"`);
  
  // Job type
  if (filters.jobType) {
    queryParts.push(`"${filters.jobType}"`);
  }
  
  return queryParts.join(' AND ');
}

/**
 * Build multiple hybrid queries for comprehensive coverage
 */
function buildHybridJobQueries(portfolio: ParsedPortfolioData, filters: JobSearchFilters): Array<{
  query: string;
  category?: string;
  domains: string[];
  includeText: string[];
}> {
  return [
    // Startup/Scale-up Focus
    {
      query: `${portfolio.preferences.preferredRoles[0] || 'software engineer'} startup opportunities ${portfolio.skills.frameworks.slice(0, 2).join(' ')}`,
      category: "company",
      domains: ["wellfound.com", "ycombinator.com", "techstars.com", "crunchbase.com"],
      includeText: ["startup", "founding team", "equity"]
    },
    
    // Enterprise Focus
    {
      query: `senior ${portfolio.skills.languages.slice(0, 2).join(' ')} enterprise development`,
      category: "company", 
      domains: ["careers.microsoft.com", "careers.google.com", "amazon.jobs", "linkedin.com/jobs"],
      includeText: ["enterprise", "scale", "team lead"]
    },
    
    // Remote-First Companies
    {
      query: `remote ${portfolio.preferences.preferredRoles[0] || 'developer'} distributed team`,
      domains: ["remoteok.io", "weworkremotely.com", "remote.co", "flexjobs.com"],
      includeText: ["remote-first", "distributed", "anywhere"]
    },
    
    // Tech-Specific Opportunities
    {
      query: `${portfolio.skills.frameworks[0] || 'react'} ${portfolio.skills.languages[0] || 'javascript'} development position`,
      domains: ["stackoverflow.com/jobs", "github.com/jobs", "techcareers.com"],
      includeText: [portfolio.skills.frameworks[0] || 'react', "technical team"]
    }
  ];
}

/**
 * Process Exa results into standardized format
 */
function processExaResults(results: any[], strategy: string): ExaJobResult[] {
  return results.map((result, index) => ({
    id: result.id || `${strategy}_${Date.now()}_${index}`,
    title: result.title || 'Software Engineer Position',
    url: result.url,
    publishedDate: result.publishedDate || new Date().toISOString(),
    author: result.author,
    text: result.text,
    highlights: result.highlights || [],
    highlightScores: result.highlightScores || [],
    summary: result.summary,
    subpages: result.subpages || [],
    relevanceScore: calculateRelevanceFromExa(result),
    searchStrategy: strategy,
    domain: extractDomain(result.url),
    extractedJobData: extractJobDataFromContent(result),
  }));
}

/**
 * Extract structured job data from Exa content
 */
function extractJobDataFromContent(result: any): ExtractedJobData {
  const text = result.text || '';
  const title = result.title || '';
  
  return {
    company: extractCompanyFromResult(result),
    location: extractLocationFromText(text) || 'Remote',
    salary: extractSalaryFromText(text),
    experienceLevel: extractExperienceLevelFromText(text + ' ' + title),
    jobType: extractJobTypeFromText(text + ' ' + title),
    skills: extractSkillsFromText(text + ' ' + title),
    benefits: extractBenefitsFromText(text),
    remote: isRemoteJob(text + ' ' + title),
    hybrid: isHybridJob(text + ' ' + title),
    applicationDeadline: extractDeadlineFromText(text),
    companySize: extractCompanySizeFromText(text),
  };
}

/**
 * Advanced relevance scoring using Exa-specific signals
 */
function calculateRelevanceFromExa(result: any): number {
  let score = 0.5; // Base score
  
  // Exa highlight scores indicate semantic relevance
  if (result.highlightScores && result.highlightScores.length > 0) {
    const avgHighlightScore = result.highlightScores.reduce((a: number, b: number) => a + b, 0) / result.highlightScores.length;
    score += avgHighlightScore * 0.3;
  }
  
  // Recent publication increases relevance
  if (result.publishedDate) {
    const daysOld = (Date.now() - new Date(result.publishedDate).getTime()) / (24 * 60 * 60 * 1000);
    if (daysOld < 7) score += 0.2;
    else if (daysOld < 30) score += 0.1;
  }
  
  // Summary indicates well-structured content
  if (result.summary && result.summary.length > 100) {
    score += 0.1;
  }
  
  // Subpages indicate comprehensive job information
  if (result.subpages && result.subpages.length > 0) {
    score += 0.1;
  }
  
  return Math.min(score, 1.0);
}

/**
 * Rank job results using portfolio context and Exa signals
 */
function rankJobResults(results: ExaJobResult[], portfolio: ParsedPortfolioData): ExaJobResult[] {
  return results.sort((a, b) => {
    // Primary: Exa relevance score
    const relevanceDiff = b.relevanceScore - a.relevanceScore;
    if (Math.abs(relevanceDiff) > 0.1) return relevanceDiff;
    
    // Secondary: Skill alignment
    const skillMatchA = calculateSkillMatch(a.extractedJobData.skills, portfolio.skills.all);
    const skillMatchB = calculateSkillMatch(b.extractedJobData.skills, portfolio.skills.all);
    const skillDiff = skillMatchB - skillMatchA;
    if (Math.abs(skillDiff) > 0.1) return skillDiff;
    
    // Tertiary: Publication date (newer is better)
    return new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime();
  });
}

// Helper functions
function getDefaultConfig(): AdvancedJobSearchConfig {
  return {
    searchStrategies: ['neural', 'keyword', 'hybrid'],
    includeFreshJobs: true,
    includeRemoteJobs: true,
    targetSpecificBoards: true,
    extractFullContent: true,
    enableLLMContext: true,
    maxResultsPerStrategy: 25,
  };
}

function getJobDomains(includeSpecific: boolean): string[] {
  const coreDomains = [
    "linkedin.com/jobs", "indeed.com", "glassdoor.com", "wellfound.com",
    "jobs.lever.co", "greenhouse.io", "workday.com", "bamboohr.com"
  ];
  
  if (includeSpecific) {
    return [
      ...coreDomains,
      "careers.google.com", "amazon.jobs", "microsoft.com/careers",
      "careers.netflix.com", "jobs.spotify.com", "careers.stripe.com",
      "careers.airbnb.com", "jobs.github.com", "careers.shopify.com"
    ];
  }
  
  return coreDomains;
}

function buildJobIncludeTerms(preferredRoles: string[]): string[] {
  if (preferredRoles.length === 0) return ["software engineer position"];
  
  return preferredRoles.slice(0, 1).map(role => `${role.toLowerCase()} position`);
}

function inferUserLocation(location: string): string {
  // Convert location to ISO country codes for Exa
  const locationMappings: { [key: string]: string } = {
    'united states': 'US',
    'usa': 'US', 
    'us': 'US',
    'canada': 'CA',
    'united kingdom': 'GB',
    'uk': 'GB',
    'germany': 'DE',
    'france': 'FR',
    'singapore': 'SG',
    'australia': 'AU',
    'india': 'IN',
    'japan': 'JP',
  };
  
  const locationLower = location.toLowerCase();
  return locationMappings[locationLower] || 'US'; // Default to US
}

function deduplicateByUrl(results: ExaJobResult[]): ExaJobResult[] {
  const seen = new Set<string>();
  return results.filter(result => {
    if (seen.has(result.url)) return false;
    seen.add(result.url);
    return true;
  });
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return 'unknown';
  }
}

// Utility functions for content extraction
function extractCompanyFromResult(result: any): string {
  if (result.author) return result.author;
  
  const url = result.url || '';
  const domain = extractDomain(url);
  
  // Extract company from career page URLs
  if (domain.includes('careers.')) {
    return domain.replace('careers.', '').replace('.com', '');
  }
  
  return domain.replace('.com', '').replace('.io', '').replace('.ai', '');
}

function calculateSkillMatch(jobSkills: string[], portfolioSkills: string[]): number {
  if (portfolioSkills.length === 0) return 0;
  
  const matches = jobSkills.filter(jobSkill => 
    portfolioSkills.some(portfolioSkill => 
      jobSkill.toLowerCase().includes(portfolioSkill.toLowerCase()) ||
      portfolioSkill.toLowerCase().includes(jobSkill.toLowerCase())
    )
  ).length;
  
  return matches / portfolioSkills.length;
}

// Re-export utility functions from the original exa.ts for content extraction
function extractLocationFromText(text: string): string | null {
  const locationPatterns = [
    /(?:location|based in|office in)[:\s]+([^,\n\.]+)/i,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2,3})\b/,
    /(?:remote|distributed|work from (?:home|anywhere))/i,
  ];
  
  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1] || match[0];
    }
  }
  
  return null;
}

function extractSalaryFromText(text: string): { min: number; max: number; currency: string } | undefined {
  const salaryPattern = /\$(\d{1,3}(?:,\d{3})*(?:k|K)?)\s*-\s*\$(\d{1,3}(?:,\d{3})*(?:k|K)?)/;
  const match = text.match(salaryPattern);
  
  if (match) {
    const min = parseSalary(match[1]);
    const max = parseSalary(match[2]);
    if (min && max) {
      return { min, max, currency: 'USD' };
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

function extractExperienceLevelFromText(text: string): string {
  const textLower = text.toLowerCase();
  if (textLower.includes('senior') || textLower.includes('lead') || textLower.includes('principal')) return 'Senior';
  if (textLower.includes('mid-level') || textLower.includes('intermediate')) return 'Mid-level';
  if (textLower.includes('junior') || textLower.includes('entry-level') || textLower.includes('new grad')) return 'Entry-level';
  return 'Mid-level';
}

function extractJobTypeFromText(text: string): string {
  const textLower = text.toLowerCase();
  if (textLower.includes('full-time') || textLower.includes('full time')) return 'Full-time';
  if (textLower.includes('part-time') || textLower.includes('part time')) return 'Part-time';
  if (textLower.includes('contract')) return 'Contract';
  if (textLower.includes('internship')) return 'Internship';
  return 'Full-time';
}

function extractSkillsFromText(text: string): string[] {
  const commonSkills = [
    'React', 'Vue', 'Angular', 'Node.js', 'Python', 'Java', 'TypeScript', 'JavaScript',
    'Go', 'Rust', 'C++', 'AWS', 'Docker', 'Kubernetes', 'PostgreSQL', 'MongoDB',
    'GraphQL', 'REST', 'Microservices', 'DevOps', 'CI/CD', 'Git'
  ];
  
  return commonSkills.filter(skill => 
    text.toLowerCase().includes(skill.toLowerCase())
  );
}

function extractBenefitsFromText(text: string): string[] {
  const benefits = [];
  const textLower = text.toLowerCase();
  
  if (textLower.includes('health insurance')) benefits.push('Health Insurance');
  if (textLower.includes('401k') || textLower.includes('retirement')) benefits.push('401k');
  if (textLower.includes('stock options') || textLower.includes('equity')) benefits.push('Stock Options');
  if (textLower.includes('remote work') || textLower.includes('work from home')) benefits.push('Remote Work');
  if (textLower.includes('flexible hours')) benefits.push('Flexible Hours');
  if (textLower.includes('unlimited pto') || textLower.includes('unlimited vacation')) benefits.push('Unlimited PTO');
  
  return benefits;
}

function isRemoteJob(text: string): boolean {
  const textLower = text.toLowerCase();
  return textLower.includes('remote') || textLower.includes('work from home') || textLower.includes('distributed');
}

function isHybridJob(text: string): boolean {
  const textLower = text.toLowerCase();
  return textLower.includes('hybrid') || textLower.includes('flexible location');
}

function extractDeadlineFromText(text: string): string | undefined {
  const deadlinePattern = /(?:deadline|apply by|closes)[:\s]+([^,\n]+)/i;
  const match = text.match(deadlinePattern);
  return match ? match[1].trim() : undefined;
}

function extractCompanySizeFromText(text: string): string | undefined {
  const textLower = text.toLowerCase();
  if (textLower.includes('startup') || textLower.includes('early-stage')) return 'Startup';
  if (textLower.includes('enterprise') || textLower.includes('fortune 500')) return 'Enterprise';
  if (textLower.includes('mid-size') || textLower.includes('growing company')) return 'Mid-size';
  return undefined;
}

export { ExaJobResult, AdvancedJobSearchConfig };
