/**
 * Comprehensive Portfolio Parser for Intelligent Job Matching
 * Extracts and analyzes portfolio data to create detailed user profiles for job search
 */

export interface ParsedPortfolioData {
  // Basic Information
  name: string;
  title: string;
  about: string;
  location: string;
  
  // Contact & Social
  contact: {
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    github: string;
    twitter: string;
    website: string;
    calendly: string;
  };
  
  // Skills Analysis
  skills: {
    technical: string[];
    frameworks: string[];
    languages: string[];
    tools: string[];
    databases: string[];
    cloud: string[];
    soft: string[];
    all: string[];
  };
  
  // Experience Analysis
  experience: {
    totalYears: number;
    level: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
    roles: Array<{
      title: string;
      company: string;
      duration: string;
      location: string;
      description: string;
      technologies: string[];
      achievements: string[];
      startDate?: Date;
      endDate?: Date;
      isCurrentRole: boolean;
    }>;
    industries: string[];
    companyTypes: ('startup' | 'mid-size' | 'enterprise' | 'agency' | 'consulting')[];
    remoteExperience: boolean;
  };
  
  // Project Analysis
  projects: {
    count: number;
    types: string[];
    technologies: string[];
    domains: string[];
    complexity: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    hasOpenSource: boolean;
    hasCommercial: boolean;
    recentProjects: Array<{
      name: string;
      description: string;
      technologies: string[];
      url?: string;
      github?: string;
      impact?: string;
    }>;
  };
  
  // Education & Certifications
  education: {
    degrees: Array<{
      degree: string;
      school: string;
      year: string;
      location: string;
      field?: string;
    }>;
    certifications: string[];
    continuousLearning: boolean;
  };
  
  // Career Preferences (inferred)
  preferences: {
    preferredRoles: string[];
    preferredIndustries: string[];
    preferredCompanySize: ('startup' | 'mid-size' | 'enterprise')[];
    remotePreference: 'remote' | 'hybrid' | 'onsite' | 'flexible';
    salaryRange?: { min: number; max: number };
    willingToRelocate: boolean;
    visaSponsorshipNeeded: boolean;
  };
  
  // Market Analysis
  marketProfile: {
    competitiveLevel: 'junior' | 'mid' | 'senior' | 'expert';
    uniqueSkillCombinations: string[][];
    marketDemandScore: number;
    rarityScore: number;
    versatilityScore: number;
  };
}

export class PortfolioParser {
  /**
   * Parse comprehensive portfolio data for intelligent job matching
   */
  static parsePortfolio(portfolioContent: any): ParsedPortfolioData {
    const skills = this.parseSkills(portfolioContent.skills || []);
    const experience = this.parseExperience(portfolioContent.experience || []);
    const projects = this.parseProjects(portfolioContent.projects || []);
    const education = this.parseEducation(portfolioContent.education || []);
    const preferences = this.inferPreferences(portfolioContent, experience, skills);
    const marketProfile = this.analyzeMarketProfile(skills, experience, projects);

    return {
      name: portfolioContent.name || '',
      title: portfolioContent.title || '',
      about: portfolioContent.about || '',
      location: portfolioContent.contact?.location || '',
      contact: portfolioContent.contact || {},
      skills,
      experience,
      projects,
      education,
      preferences,
      marketProfile,
    };
  }

  /**
   * Parse and categorize skills with intelligent classification
   */
  private static parseSkills(skillsArray: string[]): ParsedPortfolioData['skills'] {
    const technical: string[] = [];
    const frameworks: string[] = [];
    const languages: string[] = [];
    const tools: string[] = [];
    const databases: string[] = [];
    const cloud: string[] = [];
    const soft: string[] = [];

    // Skill categorization mappings
    const skillCategories = {
      languages: [
        'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 
        'swift', 'kotlin', 'php', 'ruby', 'scala', 'r', 'matlab', 'sql'
      ],
      frameworks: [
        'react', 'vue', 'angular', 'svelte', 'next.js', 'nuxt', 'express', 'fastapi',
        'django', 'flask', 'spring', 'laravel', 'rails', 'asp.net', 'gin', 'fiber'
      ],
      databases: [
        'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'cassandra',
        'dynamodb', 'firebase', 'supabase', 'prisma', 'typeorm', 'sequelize'
      ],
      cloud: [
        'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ansible',
        'jenkins', 'github actions', 'gitlab ci', 'vercel', 'netlify', 'heroku'
      ],
      tools: [
        'git', 'webpack', 'vite', 'babel', 'eslint', 'prettier', 'jest', 'cypress',
        'figma', 'sketch', 'photoshop', 'jira', 'confluence', 'slack', 'notion'
      ],
      soft: [
        'leadership', 'communication', 'teamwork', 'problem solving', 'project management',
        'agile', 'scrum', 'mentoring', 'public speaking', 'writing', 'research'
      ]
    };

    skillsArray.forEach(skill => {
      const skillLower = skill.toLowerCase();
      
      if (skillCategories.languages.some(lang => skillLower.includes(lang))) {
        languages.push(skill);
      } else if (skillCategories.frameworks.some(fw => skillLower.includes(fw))) {
        frameworks.push(skill);
      } else if (skillCategories.databases.some(db => skillLower.includes(db))) {
        databases.push(skill);
      } else if (skillCategories.cloud.some(cloud => skillLower.includes(cloud))) {
        cloud.push(skill);
      } else if (skillCategories.tools.some(tool => skillLower.includes(tool))) {
        tools.push(skill);
      } else if (skillCategories.soft.some(soft => skillLower.includes(soft))) {
        soft.push(skill);
      } else {
        technical.push(skill);
      }
    });

    return {
      technical,
      frameworks,
      languages,
      tools,
      databases,
      cloud,
      soft,
      all: skillsArray,
    };
  }

  /**
   * Parse experience with intelligent analysis
   */
  private static parseExperience(experienceArray: any[]): ParsedPortfolioData['experience'] {
    const roles = experienceArray.map(exp => {
      const technologies = this.extractTechnologies(exp.description || '');
      const achievements = this.extractAchievements(exp.description || '');
      
      return {
        title: exp.title || exp.position || '',
        company: exp.company || '',
        duration: exp.duration || '',
        location: exp.location || '',
        description: exp.description || '',
        technologies,
        achievements,
        startDate: this.parseDate(exp.startDate),
        endDate: this.parseDate(exp.endDate),
        isCurrentRole: exp.current || exp.isCurrentRole || false,
      };
    });

    const totalYears = this.calculateTotalExperience(roles);
    const level = this.determineExperienceLevel(totalYears, roles);
    const industries = this.extractIndustries(roles);
    const companyTypes = this.inferCompanyTypes(roles);
    const remoteExperience = this.hasRemoteExperience(roles);

    return {
      totalYears,
      level,
      roles,
      industries,
      companyTypes,
      remoteExperience,
    };
  }

  /**
   * Parse projects with complexity analysis
   */
  private static parseProjects(projectsArray: any[]): ParsedPortfolioData['projects'] {
    const recentProjects = projectsArray.map(project => ({
      name: project.name || project.title || '',
      description: project.description || '',
      technologies: project.technologies || project.tech || [],
      url: project.url || project.link || project.demo,
      github: project.github || project.repo,
      impact: this.extractImpact(project.description || ''),
    }));

    const technologies = [...new Set(recentProjects.flatMap(p => p.technologies))];
    const types = this.inferProjectTypes(recentProjects);
    const domains = this.inferProjectDomains(recentProjects);
    const complexity = this.assessProjectComplexity(recentProjects, technologies);
    const hasOpenSource = recentProjects.some(p => p.github);
    const hasCommercial = recentProjects.some(p => 
      p.description.toLowerCase().includes('commercial') || 
      p.description.toLowerCase().includes('client') ||
      p.description.toLowerCase().includes('business')
    );

    return {
      count: projectsArray.length,
      types,
      technologies,
      domains,
      complexity,
      hasOpenSource,
      hasCommercial,
      recentProjects,
    };
  }

  /**
   * Parse education and certifications
   */
  private static parseEducation(educationArray: any[]): ParsedPortfolioData['education'] {
    const degrees = educationArray.map(edu => ({
      degree: edu.degree || edu.title || '',
      school: edu.school || edu.institution || '',
      year: edu.year || edu.graduationYear || '',
      location: edu.location || '',
      field: edu.field || edu.major || this.inferField(edu.degree || ''),
    }));

    const certifications = this.extractCertifications(educationArray);
    const continuousLearning = this.assessContinuousLearning(degrees, certifications);

    return {
      degrees,
      certifications,
      continuousLearning,
    };
  }

  /**
   * Infer career preferences from portfolio data
   */
  private static inferPreferences(
    portfolioContent: any, 
    experience: ParsedPortfolioData['experience'],
    skills: ParsedPortfolioData['skills']
  ): ParsedPortfolioData['preferences'] {
    const preferredRoles = this.inferPreferredRoles(experience.roles, skills);
    const preferredIndustries = experience.industries;
    const preferredCompanySize = this.inferPreferredCompanySize(experience.companyTypes);
    const remotePreference = this.inferRemotePreference(experience.remoteExperience, portfolioContent.contact?.location);
    const willingToRelocate = this.assessRelocationWillingness(portfolioContent);
    const visaSponsorshipNeeded = this.assessVisaSponsorshipNeed(portfolioContent.contact?.location);

    return {
      preferredRoles,
      preferredIndustries,
      preferredCompanySize,
      remotePreference,
      willingToRelocate,
      visaSponsorshipNeeded,
    };
  }

  /**
   * Analyze market profile and competitiveness
   */
  private static analyzeMarketProfile(
    skills: ParsedPortfolioData['skills'],
    experience: ParsedPortfolioData['experience'],
    projects: ParsedPortfolioData['projects']
  ): ParsedPortfolioData['marketProfile'] {
    const competitiveLevel = this.assessCompetitiveLevel(experience.totalYears, skills, projects);
    const uniqueSkillCombinations = this.findUniqueSkillCombinations(skills);
    const marketDemandScore = this.calculateMarketDemand(skills.all);
    const rarityScore = this.calculateRarityScore(skills.all, experience.industries);
    const versatilityScore = this.calculateVersatilityScore(skills, projects.domains);

    return {
      competitiveLevel,
      uniqueSkillCombinations,
      marketDemandScore,
      rarityScore,
      versatilityScore,
    };
  }

  // Helper methods for parsing and analysis
  private static extractTechnologies(description: string): string[] {
    const techKeywords = [
      'react', 'vue', 'angular', 'node.js', 'python', 'java', 'typescript', 'javascript',
      'aws', 'docker', 'kubernetes', 'postgresql', 'mongodb', 'redis', 'graphql', 'rest'
    ];
    
    return techKeywords.filter(tech => 
      description.toLowerCase().includes(tech.toLowerCase())
    );
  }

  private static extractAchievements(description: string): string[] {
    const achievementPatterns = [
      /increased?\s+.*?by\s+(\d+%|\d+x)/gi,
      /reduced?\s+.*?by\s+(\d+%|\d+x)/gi,
      /improved?\s+.*?by\s+(\d+%|\d+x)/gi,
      /led\s+.*?team/gi,
      /managed?\s+.*?project/gi,
    ];

    const achievements: string[] = [];
    achievementPatterns.forEach(pattern => {
      const matches = description.match(pattern);
      if (matches) {
        achievements.push(...matches);
      }
    });

    return achievements;
  }

  private static calculateTotalExperience(roles: any[]): number {
    // Simple calculation - in production, parse actual dates
    return Math.min(roles.length * 1.5, 15);
  }

  private static determineExperienceLevel(totalYears: number, roles: any[]): ParsedPortfolioData['experience']['level'] {
    if (totalYears >= 12) return 'executive';
    if (totalYears >= 8) return 'lead';
    if (totalYears >= 5) return 'senior';
    if (totalYears >= 2) return 'mid';
    return 'entry';
  }

  private static extractIndustries(roles: any[]): string[] {
    const industryKeywords = {
      'fintech': ['bank', 'finance', 'payment', 'trading', 'investment'],
      'healthcare': ['health', 'medical', 'hospital', 'pharma', 'biotech'],
      'ecommerce': ['ecommerce', 'retail', 'shopping', 'marketplace'],
      'saas': ['saas', 'software', 'platform', 'cloud'],
      'gaming': ['game', 'gaming', 'entertainment'],
      'education': ['education', 'learning', 'university', 'school'],
    };

    const industries: string[] = [];
    roles.forEach(role => {
      const companyLower = (role.company || '').toLowerCase();
      const descLower = (role.description || '').toLowerCase();
      
      Object.entries(industryKeywords).forEach(([industry, keywords]) => {
        if (keywords.some(keyword => 
          companyLower.includes(keyword) || descLower.includes(keyword)
        )) {
          industries.push(industry);
        }
      });
    });

    return [...new Set(industries)];
  }

  private static inferCompanyTypes(roles: any[]): ParsedPortfolioData['experience']['companyTypes'] {
    const types: ParsedPortfolioData['experience']['companyTypes'] = [];
    
    roles.forEach(role => {
      const companyLower = (role.company || '').toLowerCase();
      const descLower = (role.description || '').toLowerCase();
      
      if (companyLower.includes('startup') || descLower.includes('startup')) {
        types.push('startup');
      } else if (companyLower.includes('enterprise') || descLower.includes('fortune')) {
        types.push('enterprise');
      } else {
        types.push('mid-size');
      }
    });

    return [...new Set(types)];
  }

  private static hasRemoteExperience(roles: any[]): boolean {
    return roles.some(role => 
      (role.location || '').toLowerCase().includes('remote') ||
      (role.description || '').toLowerCase().includes('remote')
    );
  }

  private static parseDate(dateStr: string): Date | undefined {
    if (!dateStr) return undefined;
    try {
      return new Date(dateStr);
    } catch {
      return undefined;
    }
  }

  private static extractImpact(description: string): string {
    const impactPatterns = [
      /(\d+%|\d+x)\s+improvement/gi,
      /saved?\s+\$?\d+/gi,
      /increased?\s+.*?by\s+(\d+%|\d+x)/gi,
    ];

    for (const pattern of impactPatterns) {
      const match = description.match(pattern);
      if (match) return match[0];
    }

    return '';
  }

  private static inferProjectTypes(projects: any[]): string[] {
    const types = new Set<string>();
    
    projects.forEach(project => {
      const desc = (project.description || '').toLowerCase();
      
      if (desc.includes('web app') || desc.includes('website')) types.add('web');
      if (desc.includes('mobile') || desc.includes('ios') || desc.includes('android')) types.add('mobile');
      if (desc.includes('api') || desc.includes('backend')) types.add('backend');
      if (desc.includes('machine learning') || desc.includes('ai')) types.add('ai/ml');
      if (desc.includes('blockchain') || desc.includes('crypto')) types.add('blockchain');
      if (desc.includes('game')) types.add('gaming');
    });

    return Array.from(types);
  }

  private static inferProjectDomains(projects: any[]): string[] {
    const domains = new Set<string>();
    
    projects.forEach(project => {
      const desc = (project.description || '').toLowerCase();
      
      if (desc.includes('ecommerce') || desc.includes('shopping')) domains.add('ecommerce');
      if (desc.includes('social') || desc.includes('chat')) domains.add('social');
      if (desc.includes('finance') || desc.includes('payment')) domains.add('fintech');
      if (desc.includes('health') || desc.includes('medical')) domains.add('healthcare');
      if (desc.includes('education') || desc.includes('learning')) domains.add('education');
    });

    return Array.from(domains);
  }

  private static assessProjectComplexity(projects: any[], technologies: string[]): ParsedPortfolioData['projects']['complexity'] {
    const complexityScore = technologies.length + projects.length;
    
    if (complexityScore >= 20) return 'expert';
    if (complexityScore >= 15) return 'advanced';
    if (complexityScore >= 10) return 'intermediate';
    return 'beginner';
  }

  private static extractCertifications(educationArray: any[]): string[] {
    return educationArray
      .filter(edu => (edu.type || '').toLowerCase().includes('certification'))
      .map(edu => edu.title || edu.degree || '');
  }

  private static assessContinuousLearning(degrees: any[], certifications: string[]): boolean {
    const recentEducation = degrees.some(degree => {
      const year = parseInt(degree.year);
      return year && year >= new Date().getFullYear() - 3;
    });
    
    return recentEducation || certifications.length > 0;
  }

  private static inferField(degree: string): string {
    const degreeL = degree.toLowerCase();
    
    if (degreeL.includes('computer') || degreeL.includes('software')) return 'Computer Science';
    if (degreeL.includes('engineering')) return 'Engineering';
    if (degreeL.includes('business')) return 'Business';
    if (degreeL.includes('design')) return 'Design';
    
    return 'Technology';
  }

  private static inferPreferredRoles(roles: any[], skills: ParsedPortfolioData['skills']): string[] {
    const roleTypes = new Set<string>();
    
    roles.forEach(role => {
      const title = (role.title || '').toLowerCase();
      
      if (title.includes('frontend') || title.includes('ui')) roleTypes.add('Frontend Developer');
      if (title.includes('backend') || title.includes('api')) roleTypes.add('Backend Developer');
      if (title.includes('fullstack') || title.includes('full stack')) roleTypes.add('Full Stack Developer');
      if (title.includes('devops') || title.includes('sre')) roleTypes.add('DevOps Engineer');
      if (title.includes('data') || title.includes('analytics')) roleTypes.add('Data Engineer');
      if (title.includes('mobile')) roleTypes.add('Mobile Developer');
      if (title.includes('lead') || title.includes('senior')) roleTypes.add('Senior Developer');
    });

    // Infer from skills if no clear roles
    if (roleTypes.size === 0) {
      if (skills.frameworks.some(fw => ['react', 'vue', 'angular'].includes(fw.toLowerCase()))) {
        roleTypes.add('Frontend Developer');
      }
      if (skills.frameworks.some(fw => ['express', 'django', 'spring'].includes(fw.toLowerCase()))) {
        roleTypes.add('Backend Developer');
      }
    }

    return Array.from(roleTypes);
  }

  private static inferPreferredCompanySize(companyTypes: ParsedPortfolioData['experience']['companyTypes']): ParsedPortfolioData['preferences']['preferredCompanySize'] {
    // Filter to only include valid preference types
    const validTypes = companyTypes.filter(type => 
      type === 'startup' || type === 'mid-size' || type === 'enterprise'
    ) as ParsedPortfolioData['preferences']['preferredCompanySize'];
    
    return validTypes.length > 0 ? validTypes : ['mid-size'];
  }

  private static inferRemotePreference(hasRemoteExp: boolean, location: string): ParsedPortfolioData['preferences']['remotePreference'] {
    if (hasRemoteExp) return 'remote';
    if (!location) return 'flexible';
    return 'hybrid';
  }

  private static assessRelocationWillingness(portfolioContent: any): boolean {
    const about = (portfolioContent.about || '').toLowerCase();
    return about.includes('relocate') || about.includes('willing to move') || about.includes('open to relocation');
  }

  private static assessVisaSponsorshipNeed(location: string): boolean {
    // Simple heuristic - in production, use more sophisticated detection
    const nonUSLocations = ['india', 'china', 'brazil', 'mexico', 'canada', 'uk', 'germany', 'france'];
    return nonUSLocations.some(loc => (location || '').toLowerCase().includes(loc));
  }

  private static assessCompetitiveLevel(
    totalYears: number, 
    skills: ParsedPortfolioData['skills'], 
    projects: ParsedPortfolioData['projects']
  ): ParsedPortfolioData['marketProfile']['competitiveLevel'] {
    const skillCount = skills.all.length;
    const projectCount = projects.count;
    
    const score = totalYears * 2 + skillCount + projectCount;
    
    if (score >= 30) return 'expert';
    if (score >= 20) return 'senior';
    if (score >= 10) return 'mid';
    return 'junior';
  }

  private static findUniqueSkillCombinations(skills: ParsedPortfolioData['skills']): string[][] {
    const combinations: string[][] = [];
    
    // Find unique combinations of skills that are valuable in the market
    if (skills.languages.includes('TypeScript') && skills.frameworks.includes('React')) {
      combinations.push(['TypeScript', 'React']);
    }
    
    if (skills.cloud.includes('AWS') && skills.languages.includes('Python')) {
      combinations.push(['AWS', 'Python']);
    }
    
    return combinations;
  }

  private static calculateMarketDemand(allSkills: string[]): number {
    const highDemandSkills = [
      'react', 'typescript', 'python', 'aws', 'kubernetes', 'node.js', 'go', 'rust'
    ];
    
    const demandScore = allSkills.filter(skill => 
      highDemandSkills.some(demand => skill.toLowerCase().includes(demand))
    ).length;
    
    return Math.min(demandScore / highDemandSkills.length, 1.0);
  }

  private static calculateRarityScore(allSkills: string[], industries: string[]): number {
    const rareSkills = ['rust', 'go', 'blockchain', 'quantum', 'webassembly'];
    const rareIndustries = ['blockchain', 'quantum', 'biotech'];
    
    const rareSkillCount = allSkills.filter(skill => 
      rareSkills.some(rare => skill.toLowerCase().includes(rare))
    ).length;
    
    const rareIndustryCount = industries.filter(industry => 
      rareIndustries.includes(industry)
    ).length;
    
    return Math.min((rareSkillCount + rareIndustryCount) / 5, 1.0);
  }

  private static calculateVersatilityScore(skills: ParsedPortfolioData['skills'], domains: string[]): number {
    const categoryCount = [
      skills.languages.length > 0 ? 1 : 0,
      skills.frameworks.length > 0 ? 1 : 0,
      skills.databases.length > 0 ? 1 : 0,
      skills.cloud.length > 0 ? 1 : 0,
      skills.tools.length > 0 ? 1 : 0,
    ].reduce((sum, val) => sum + val, 0);
    
    const domainCount = domains.length;
    
    return Math.min((categoryCount + domainCount) / 8, 1.0);
  }
}
