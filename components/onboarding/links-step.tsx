"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Linkedin, 
  Github, 
  Twitter, 
  Globe, 
  Calendar,
  ExternalLink,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface LinksStepProps {
  onComplete: (data: any) => void;
  initialData: any;
}

const linkTypes = [
  {
    key: "linkedin",
    label: "LinkedIn",
    icon: Linkedin,
    placeholder: "https://linkedin.com/in/yourprofile",
    description: "Your professional LinkedIn profile",
    required: true,
  },
  {
    key: "github",
    label: "GitHub",
    icon: Github,
    placeholder: "https://github.com/yourusername",
    description: "Your code repositories and projects",
    required: false,
  },
  {
    key: "twitter",
    label: "Twitter/X",
    icon: Twitter,
    placeholder: "https://twitter.com/yourusername",
    description: "Your social media presence",
    required: false,
  },
  {
    key: "website",
    label: "Personal Website",
    icon: Globe,
    placeholder: "https://yourwebsite.com",
    description: "Your personal or portfolio website",
    required: false,
  },
  {
    key: "calendly",
    label: "Calendly",
    icon: Calendar,
    placeholder: "https://calendly.com/yourusername",
    description: "Your booking link for meetings",
    required: false,
  },
];

export function LinksStep({ onComplete, initialData }: LinksStepProps) {
  // Auto-populate links from resume data if available
  const resumeLinks = initialData?.resume?.socialLinks || {};
  
  // Enhanced link mapping with better fallbacks
  const defaultLinks = {
    linkedin: resumeLinks.linkedin || "",
    github: resumeLinks.github || "",
    twitter: resumeLinks.twitter || resumeLinks.x || "",
    website: resumeLinks.website || resumeLinks.portfolio || resumeLinks.blog || "",
    portfolio: resumeLinks.portfolio || resumeLinks.website || "",
    blog: resumeLinks.blog || resumeLinks.medium || "",
    medium: resumeLinks.medium || resumeLinks.blog || "",
    behance: resumeLinks.behance || "",
    dribbble: resumeLinks.dribbble || "",
    youtube: resumeLinks.youtube || "",
    instagram: resumeLinks.instagram || "",
    facebook: resumeLinks.facebook || "",
    calendly: resumeLinks.calendly || "",
  };

  // Extract additional links from resume content if available
  const resumeText = initialData?.resume?.personalInfo?.summary || "";
  const extractedUrls = resumeText.match(/https?:\/\/[^\s]+/g) || [];
  
  // Auto-detect missing links from extracted URLs
  extractedUrls.forEach((url: string) => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('linkedin.com/in/') && !defaultLinks.linkedin) {
      defaultLinks.linkedin = url;
    } else if (lowerUrl.includes('github.com/') && !defaultLinks.github) {
      defaultLinks.github = url;
    } else if ((lowerUrl.includes('twitter.com/') || lowerUrl.includes('x.com/')) && !defaultLinks.twitter) {
      defaultLinks.twitter = url;
    } else if (lowerUrl.includes('calendly.com/') && !defaultLinks.calendly) {
      defaultLinks.calendly = url;
    }
  });

  const [links, setLinks] = useState<Record<string, string>>(() => {
    // Merge existing links with auto-populated ones, prioritizing existing non-empty values
    const existingLinks = initialData.links || {};
    const mergedLinks: Record<string, string> = {};
    
    console.log('🔍 Links Debug Info:');
    console.log('📄 Resume Links:', resumeLinks);
    console.log('🔗 Default Links:', defaultLinks);
    console.log('💾 Existing Links:', existingLinks);
    
      // For each link type, use existing value if it exists and is not empty, otherwise use auto-populated
      Object.keys(defaultLinks).forEach(key => {
        const linkKey = key as keyof typeof defaultLinks;
        mergedLinks[linkKey] = (existingLinks[linkKey] && existingLinks[linkKey].trim()) || defaultLinks[linkKey];
      });
    
    console.log('🎯 Final Merged Links:', mergedLinks);
    return mergedLinks;
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateUrl = (url: string, type: string): boolean => {
    if (!url.trim()) return true; // Empty is OK for optional fields
    
    try {
      const urlObj = new URL(url);
      
      // Basic URL validation
      if (!urlObj.protocol.startsWith('http')) return false;
      
      // Type-specific validation
      switch (type) {
        case 'linkedin':
          return urlObj.hostname.includes('linkedin.com');
        case 'github':
          return urlObj.hostname.includes('github.com');
        case 'twitter':
          return urlObj.hostname.includes('twitter.com') || urlObj.hostname.includes('x.com');
        case 'calendly':
          return urlObj.hostname.includes('calendly.com');
        default:
          return true;
      }
    } catch {
      return false;
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setLinks(prev => ({ ...prev, [key]: value }));
    
    // Clear validation error when user starts typing
    if (validationErrors[key]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const handleValidation = () => {
    const errors: Record<string, string> = {};
    
    linkTypes.forEach(linkType => {
      const value = links[linkType.key] || '';
      
      // Check required fields
      if (linkType.required && !value.trim()) {
        errors[linkType.key] = `${linkType.label} is required`;
        return;
      }
      
      // Validate URL format if provided
      if (value.trim() && !validateUrl(value, linkType.key)) {
        errors[linkType.key] = `Please enter a valid ${linkType.label} URL`;
      }
    });
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleContinue = () => {
    if (handleValidation()) {
      // Filter out empty links
      const filteredLinks = Object.entries(links)
        .filter(([_, value]) => value.trim())
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
      
      onComplete({ links: filteredLinks });
      // Don't show toast here - wizard handles step completion notifications
    } else {
      // Show specific error for LinkedIn if it's missing
      if (validationErrors['linkedin']) {
        toast.error("LinkedIn is required to continue", {
          description: "Please add your LinkedIn profile URL to proceed with onboarding."
        });
      } else {
        toast.error("Please fix the validation errors before continuing");
      }
    }
  };

  const getValidationIcon = (key: string) => {
    const value = links[key] || '';
    const hasError = validationErrors[key];
    
    if (hasError) {
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
    
    if (value.trim() && validateUrl(value, key)) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    
    return null;
  };

  // Check if we have auto-populated links and count them
  const autoPopulatedLinks = Object.entries(defaultLinks).filter(([_, value]) => value.trim() !== "");
  const hasAutoPopulatedLinks = autoPopulatedLinks.length > 0;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-muted-foreground">
          Add your professional and social links to make it easy for people to connect with you.
        </p>
                {hasAutoPopulatedLinks && (
                  <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mt-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="space-y-2">
                        <span className="text-sm font-medium text-green-700 dark:text-green-300">
                          ✨ Found {autoPopulatedLinks.length} link{autoPopulatedLinks.length > 1 ? 's' : ''} from your resume!
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {autoPopulatedLinks.map(([key, _]) => (
                            <Badge key={key} variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                              {linkTypes.find(lt => lt.key === key)?.label || key}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          You can edit these or add more links below.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
      </div>

      <div className="grid gap-6">
        {linkTypes.map((linkType) => {
          const Icon = linkType.icon;
          const value = links[linkType.key] || '';
          const hasError = validationErrors[linkType.key];
          
          return (
            <Card key={linkType.key} className={hasError ? "border-destructive" : ""}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon className="h-4 w-4" />
                  {linkType.label}
                  {linkType.required && (
                    <Badge variant="secondary" className="text-xs">Required</Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-sm">
                  {linkType.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      type="url"
                      placeholder={linkType.placeholder}
                      value={value}
                      onChange={(e) => handleInputChange(linkType.key, e.target.value)}
                      className={hasError ? "border-destructive" : ""}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {getValidationIcon(linkType.key)}
                    </div>
                  </div>
                  
                  {hasError && (
                    <p className="text-sm text-destructive">{validationErrors[linkType.key]}</p>
                  )}
                  
                  {value.trim() && !hasError && validateUrl(value, linkType.key) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ExternalLink className="h-3 w-3" />
                      <a 
                        href={value} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        Preview link
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="font-medium text-sm">Links Summary</span>
          </div>
          <div className="space-y-1">
            {Object.entries(links).filter(([_, value]) => value.trim()).length === 0 ? (
              <p className="text-sm text-muted-foreground">No links added yet</p>
            ) : (
              Object.entries(links)
                .filter(([_, value]) => value.trim())
                .map(([key, value]) => {
                  const linkType = linkTypes.find(lt => lt.key === key);
                  return (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      {linkType && <linkType.icon className="h-3 w-3" />}
                      <span className="font-medium">{linkType?.label}:</span>
                      <span className="text-muted-foreground truncate">{value}</span>
                    </div>
                  );
                })
            )}
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleContinue} className="w-full">
        Continue to Photo Upload
      </Button>
    </div>
  );
}
