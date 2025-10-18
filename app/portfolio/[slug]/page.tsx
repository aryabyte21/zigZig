import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PortfolioActions, PortfolioFooterAction } from "@/components/portfolio-actions";
import { GitHubContributions } from "@/components/github-contributions";
import { LogoImage } from "@/components/logo-image";
import { SuperDMButton } from "@/components/super-dm-button";
import { Phone, MapPin, Linkedin, Github, ExternalLink, Mail } from "lucide-react";

interface PortfolioPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function PortfolioPage({ params }: PortfolioPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Helper function to safely get string values
  const getString = (value: unknown): string => {
    return typeof value === 'string' ? value : '';
  };
  
  // Get portfolio by slug
  const { data: portfolio, error } = await supabase
    .from("portfolios")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error || !portfolio) {
    notFound();
  }

  const content = portfolio.content || {};

  // Debug avatar URL
  console.log('Portfolio avatar debug:');
  console.log('content.avatar:', content.avatar);
  console.log('content.avatar_url:', content.avatar_url);
  console.log('content.photo_url:', content.photo_url);
  console.log('content.originalPhoto:', content.originalPhoto);

  if (!content.name) {
    console.warn('Portfolio content is missing required fields');
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Modern Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-primary hover:opacity-80 transition-opacity">
              zigZig
            </Link>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-emerald-600 border-emerald-600/30 bg-emerald-50/50 dark:bg-emerald-950/20 px-3 py-1">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
                Available for work
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Modern and Engaging */}
      <section className="relative py-24 lg:py-32 overflow-hidden will-change-transform">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-muted/50 via-transparent to-muted/30 will-change-opacity"></div>
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse will-change-transform"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl animate-pulse will-change-transform" style={{animationDelay: '1s'}}></div>
        
        <div className="relative container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Column - Content */}
              <div className="space-y-8">
                <div className="space-y-6">
                  <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 border border-blue-200/50 dark:border-blue-800/50">
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      👋 Welcome to my portfolio
                    </span>
                  </div>
                  
                  <h1 className="text-4xl lg:text-6xl xl:text-7xl font-bold font-spotify">
                    <span className="bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white bg-clip-text text-transparent">
                      {content.name || "Portfolio"}
                    </span>
                  </h1>
                  
                  <div className="space-y-4">
                    <p className="text-xl lg:text-2xl font-medium text-slate-600 dark:text-slate-300">
                      {content.title}
                    </p>
                    <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                      {content.about}
                    </p>
                  </div>
                </div>
                
                {/* Enhanced CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <PortfolioActions 
                    email={content.contact?.email} 
                    calendlyUrl={content.contact?.calendly}
                    resumeFileUrl={content.resumeFileUrl}
                  />
                </div>

                {/* Quick Stats */}
                {(content.experience?.length || content.projects?.length || content.skills?.length) && (
                  <div className="flex items-center gap-8 pt-8 border-t border-slate-200/50 dark:border-slate-700/50">
                    {content.experience?.length && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                          {content.experience.length}+
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          Years Experience
                        </div>
                      </div>
                    )}
                    {content.projects?.length && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                          {content.projects.length}+
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          Projects
                        </div>
                      </div>
                    )}
                    {content.skills?.length && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                          {content.skills.length}+
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          Skills
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column - Avatar and Visual Elements */}
              <div className="relative flex justify-center lg:justify-end">
                <div className="relative">
                  {/* Decorative Elements */}
                  <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-2xl"></div>
                  <div className="absolute -top-8 -right-8 w-16 h-16 bg-blue-500/20 rounded-full"></div>
                  <div className="absolute -bottom-6 -left-6 w-12 h-12 bg-purple-500/20 rounded-full"></div>
                  
                  {/* Main Avatar */}
                  <div className="relative">
                  <Avatar className="h-80 w-80 lg:h-96 lg:w-96 ring-8 ring-white/50 dark:ring-slate-800/50 shadow-2xl">
                  <AvatarImage 
                        src={content.avatar || content.avatar_url || content.photo_url || content.originalPhoto} 
                        className="object-cover"
                        alt={`${content.name}'s profile picture`}
                      />
                      <AvatarFallback className="text-4xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 text-slate-700 dark:text-slate-300">
                        {content.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Status Indicator */}
                    <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-full px-3 py-2 shadow-lg">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Available
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="relative py-20 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="container mx-auto px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid gap-8 lg:grid-cols-4">
              
              {/* Contact & Skills Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                {/* Contact Card */}
                <Card className="group border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Contact
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {content.contact?.email && (
                      <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
                          <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <a href={`mailto:${content.contact.email}`} className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
                          {content.contact.email}
                        </a>
                      </div>
                    )}
                    {content.contact?.phone && (
                      <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-800/50 transition-colors">
                          <Phone className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <a href={`tel:${content.contact.phone}`} className="text-slate-700 dark:text-slate-300 hover:text-green-600 dark:hover:text-green-400 transition-colors font-medium">
                          {content.contact.phone}
                        </a>
                      </div>
                    )}
                    {content.contact?.location && (
                      <div className="flex items-center space-x-3 p-3 rounded-lg">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                          <MapPin className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{content.contact.location}</span>
                      </div>
                    )}
                    {content.contact?.linkedin && (
                      <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
                          <Linkedin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <a href={content.contact.linkedin} target="_blank" rel="noopener noreferrer" className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
                          LinkedIn
                        </a>
                      </div>
                    )}
                    {content.contact?.github && (
                      <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
                          <Github className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                        </div>
                        <a href={content.contact.github} target="_blank" rel="noopener noreferrer" className="text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors font-medium">
                          GitHub
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Skills Card */}
                {content.skills && content.skills.length > 0 && (
                  <Card className="group border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        Skills
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {content.skills.map((skill: string, index: number) => (
                          <Badge 
                            key={index} 
                            variant="secondary" 
                            className="bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 text-slate-700 dark:text-slate-300 border-0 hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 transition-all duration-200 cursor-default"
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* GitHub Contributions */}
                {content.contact?.github && (
                  <div className="space-y-4">
                    <GitHubContributions githubUrl={content.contact.github} />
                  </div>
                )}
              </div>

              {/* Main Content */}
              <div className="lg:col-span-3 space-y-12">
                {/* Experience Section */}
                {content.experience && content.experience.length > 0 && (
                  <section>
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                      <h2 className="text-3xl font-bold text-slate-900 dark:text-white font-spotify">
                        Experience
                      </h2>
                    </div>
                    <div className="space-y-6">
                      {content.experience.map((exp: Record<string, unknown>, index: number) => (
                        <Card key={index} className="group border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
                          <CardContent className="p-8">
                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                              <div className="flex-1 space-y-4">
                                <div className="space-y-2">
                                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {getString(exp.title)}
                                  </h3>
                                  <div className="flex items-center gap-3">
                                    {getString(exp.logoUrl) ? (
                                      <LogoImage 
                                        src={getString(exp.logoUrl)} 
                                        alt={`${getString(exp.company)} logo`}
                                        className="w-12 h-12 rounded-xl object-contain bg-white shadow-md border border-gray-200 dark:border-gray-700 p-2"
                                      />
                                    ) : (
                                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                    )}
                                    <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                                      {getString(exp.company)}
                                    </p>
                                  </div>
                                </div>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg">
                                  {getString(exp.description)}
                                </p>
                              </div>
                              <div className="flex flex-col items-start lg:items-end gap-2">
                                <Badge variant="outline" className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 border-blue-200/50 dark:border-blue-800/50 text-blue-700 dark:text-blue-300 px-4 py-2">
                                  {getString(exp.duration)}
                                </Badge>
                                {getString(exp.location) && (
                                  <span className="text-sm text-slate-500 dark:text-slate-400">
                                    {getString(exp.location)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </section>
                )}

                {/* Projects Section */}
                {content.projects && content.projects.length > 0 && (
                  <section>
                    <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
                      Projects
                    </h2>
                    <div className="grid gap-6 md:grid-cols-1">
                      {content.projects.map((project: Record<string, unknown>, index: number) => (
                        <Card key={index} className="border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-900">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                {getString(project.name)}
                              </h3>
                              {getString(project.url) && (
                                <Button asChild size="sm" variant="ghost" className="shrink-0 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                                  <a href={getString(project.url)} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                </Button>
                              )}
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                              {getString(project.description)}
                            </p>
                            {Array.isArray(project.technologies) && project.technologies.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {project.technologies.map((tech: unknown, techIndex: number) => (
                                  <Badge 
                                    key={techIndex} 
                                    variant="outline" 
                                    className="text-xs bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                                  >
                                    {getString(tech)}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </section>
                )}

                {/* Education Section */}
                {content.education && content.education.length > 0 && (
                  <section>
                    <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
                      Education
                    </h2>
                    <div className="space-y-4">
                      {content.education.map((edu: Record<string, unknown>, index: number) => (
                        <Card key={index} className="border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-900">
                          <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                              <div className="flex items-center gap-3">
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {getString(edu.degree)}
                                  </h3>
                                  <div className="flex items-center gap-2">
                                    {getString(edu.logoUrl) ? (
                                      <LogoImage 
                                        src={getString(edu.logoUrl)} 
                                        alt={`${getString(edu.school)} logo`}
                                        className="w-10 h-10 rounded-lg object-contain bg-white shadow-sm border border-gray-200 dark:border-gray-700 p-1.5"
                                      />
                                    ) : null}
                                    <p className="text-gray-700 dark:text-gray-300 font-medium">
                                      {getString(edu.school)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <Badge variant="outline" className="w-fit mt-2 md:mt-0 border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-400">
                                {getString(edu.year)}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-6 py-12">
          <div className="text-center space-y-6">
            <p className="text-xl font-medium text-gray-900 dark:text-white">
              Ready to work together?
            </p>
            <PortfolioFooterAction email={content.contact?.email} />
            <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
              <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-4 text-sm text-gray-600 dark:text-gray-400">
                <p>
                  Built with{" "}
                  <Link
                    href="/"
                    className="font-semibold hover:underline text-gray-900 dark:text-white"
                  >
                    zigZig
                  </Link>
                  {" "}• AI-Powered Career Hub
                </p>
                <p>
                  Last updated {new Date(portfolio.updated_at).toISOString().split('T')[0]}
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* SuperDM Chat Button */}
      <SuperDMButton 
        portfolioUserId={portfolio.user_id}
        portfolioOwnerName={content.name || "Portfolio Owner"}
      />
    </div>
  );
}
