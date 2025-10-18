"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Github } from "lucide-react";

interface GitHubContributionsProps {
  githubUrl: string;
  className?: string;
}

// Extract GitHub username from various GitHub URL formats
function extractGitHubUsername(githubUrl: string): string | null {
  if (!githubUrl) return null;
  
  try {
    // Handle different GitHub URL formats
    const patterns = [
      /github\.com\/([^\/\?#]+)/i,           // https://github.com/username
      /^([^\/\?#]+)$/,                      // Just username
      /github\.com\/([^\/\?#]+)\/.*$/i,     // https://github.com/username/repo
    ];
    
    for (const pattern of patterns) {
      const match = githubUrl.match(pattern);
      if (match && match[1] && match[1] !== 'orgs') {
        return match[1];
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting GitHub username:', error);
    return null;
  }
}

export function GitHubContributions({ githubUrl, className = "" }: GitHubContributionsProps) {
  const username = extractGitHubUsername(githubUrl);
  
  if (!username) {
    return null;
  }

  // GitHub contribution chart URL
  const contributionChartUrl = `https://ghchart.rshah.org/${username}`;
  const contributionChartUrlDark = `https://ghchart.rshah.org/2F81F7/${username}`;

  return (
    <Card className={`border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-900 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white">
          <Github className="h-5 w-5" />
          GitHub Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Contribution activity for <span className="font-medium text-gray-900 dark:text-white">@{username}</span>
        </div>
        
        {/* Light mode chart */}
        <div className="block dark:hidden">
          <img 
            src={contributionChartUrl}
            alt={`${username}'s GitHub contribution chart`}
            className="w-full rounded-lg"
            loading="lazy"
            onError={(e) => {
              // Hide the image if it fails to load
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
        
        {/* Dark mode chart */}
        <div className="hidden dark:block">
          <img 
            src={contributionChartUrlDark}
            alt={`${username}'s GitHub contribution chart`}
            className="w-full rounded-lg"
            loading="lazy"
            onError={(e) => {
              // Hide the image if it fails to load
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Last 12 months</span>
          <a 
            href={`https://github.com/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            View on GitHub →
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

// Alternative GitHub stats component using GitHub Stats API
export function GitHubStats({ githubUrl, className = "" }: GitHubContributionsProps) {
  const username = extractGitHubUsername(githubUrl);
  
  if (!username) {
    return null;
  }

  return (
    <Card className={`border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-900 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white">
          <Github className="h-5 w-5" />
          GitHub Stats
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Statistics for <span className="font-medium text-gray-900 dark:text-white">@{username}</span>
        </div>
        
        {/* GitHub Stats Card */}
        <div className="space-y-3">
          <img 
            src={`https://github-readme-stats.vercel.app/api?username=${username}&show_icons=true&theme=default&hide_border=true&bg_color=ffffff&title_color=374151&text_color=6b7280&icon_color=2563eb`}
            alt={`${username}'s GitHub stats`}
            className="w-full rounded-lg block dark:hidden"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          
          <img 
            src={`https://github-readme-stats.vercel.app/api?username=${username}&show_icons=true&theme=dark&hide_border=true&bg_color=111827&title_color=f9fafb&text_color=d1d5db&icon_color=3b82f6`}
            alt={`${username}'s GitHub stats`}
            className="w-full rounded-lg hidden dark:block"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          
          {/* Most Used Languages */}
          <img 
            src={`https://github-readme-stats.vercel.app/api/top-langs/?username=${username}&layout=compact&theme=default&hide_border=true&bg_color=ffffff&title_color=374151&text_color=6b7280`}
            alt={`${username}'s most used languages`}
            className="w-full rounded-lg block dark:hidden"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          
          <img 
            src={`https://github-readme-stats.vercel.app/api/top-langs/?username=${username}&layout=compact&theme=dark&hide_border=true&bg_color=111827&title_color=f9fafb&text_color=d1d5db`}
            alt={`${username}'s most used languages`}
            className="w-full rounded-lg hidden dark:block"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Public repositories</span>
          <a 
            href={`https://github.com/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            View profile →
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
