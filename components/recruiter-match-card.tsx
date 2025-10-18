"use client";

import { motion, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Briefcase, Star, CheckCircle, X, Heart, ExternalLink, Github, Linkedin, Building2, GraduationCap } from "lucide-react";
import { CandidateMatch } from "@/types/recruiter";

interface RecruiterMatchCardProps {
  match: CandidateMatch;
  onSwipe: (direction: "left" | "right" | "up") => void;
  style?: React.CSSProperties;
}

export function RecruiterMatchCard({ match, onSwipe, style }: RecruiterMatchCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Rotate card based on horizontal drag
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  
  // Opacity for like/pass indicators
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const passOpacity = useTransform(x, [0, -100], [0, 1]);
  const superLikeOpacity = useTransform(y, [0, -100], [0, 1]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 100;
    
    // Super like (swipe up)
    if (info.offset.y < -swipeThreshold) {
      onSwipe("up");
      return;
    }
    
    // Like (swipe right)
    if (info.offset.x > swipeThreshold) {
      onSwipe("right");
      return;
    }
    
    // Pass (swipe left)
    if (info.offset.x < -swipeThreshold) {
      onSwipe("left");
      return;
    }
  };

  // Get match score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-blue-500";
    if (score >= 40) return "bg-yellow-500";
    return "bg-gray-500";
  };

  const parsedData = match.matchDetails;

  return (
    <motion.div
      style={{
        x,
        y,
        rotate,
        cursor: "grab",
        ...style,
      }}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      whileTap={{ cursor: "grabbing" }}
      className="absolute will-change-transform"
    >
      <Card className="w-[480px] h-[720px] overflow-hidden shadow-2xl border-2 relative bg-card">
        {/* Swipe Indicators */}
        <motion.div
          style={{ opacity: likeOpacity }}
          className="absolute top-8 right-8 z-10 bg-green-500 text-white px-6 py-3 rounded-lg font-bold text-xl rotate-12 border-4 border-white shadow-lg"
        >
          <Heart className="inline mr-2" />
          LIKE
        </motion.div>

        <motion.div
          style={{ opacity: passOpacity }}
          className="absolute top-8 left-8 z-10 bg-red-500 text-white px-6 py-3 rounded-lg font-bold text-xl -rotate-12 border-4 border-white shadow-lg"
        >
          <X className="inline mr-2" />
          PASS
        </motion.div>

        <motion.div
          style={{ opacity: superLikeOpacity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-blue-500 text-white px-8 py-4 rounded-lg font-bold text-2xl border-4 border-white shadow-lg"
        >
          <Star className="inline mr-2 fill-white" />
          SUPER LIKE
        </motion.div>

        <CardContent className="p-6 h-full flex flex-col">
          {/* Avatar and Match Score */}
          <div className="flex items-start justify-between mb-6">
            <Avatar className="h-40 w-40 border-4 border-white shadow-xl ring-2 ring-primary/20">
              <AvatarImage src={match.candidateAvatar} alt={match.candidateName} />
              <AvatarFallback className="text-5xl font-bold bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                {match.candidateName?.charAt(0)?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>

            <Badge className={`${getScoreColor(match.matchScore)} text-white text-base px-3 py-1.5 font-bold shadow-lg`}>
              {match.matchScore}%
            </Badge>
          </div>

          {/* Candidate Info */}
          <div className="space-y-3 mb-4">
            <h2 className="text-2xl font-bold text-foreground">
              {match.candidateName || "Candidate"}
            </h2>
            <p className="text-lg text-muted-foreground flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              {match.candidateTitle || "Professional"}
            </p>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {match.candidateLocation || "Location not specified"}
            </p>
            {match.candidatePortfolioSlug && (
              <a
                href={`/portfolio/${match.candidatePortfolioSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline relative z-50 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  window.open(`/portfolio/${match.candidatePortfolioSlug}`, '_blank');
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-4 w-4" />
                View Full Portfolio
              </a>
            )}
          </div>

          {/* Social Links & Education */}
          <div className="flex flex-wrap gap-2 mb-4">
            {match.candidateGithub && (
              <a
                href={match.candidateGithub}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2 py-1 bg-secondary hover:bg-secondary/80 rounded-md text-xs relative z-50 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  window.open(match.candidateGithub, '_blank');
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
              >
                <Github className="h-3 w-3" />
                GitHub
              </a>
            )}
            {match.candidateLinkedin && (
              <a
                href={match.candidateLinkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2 py-1 bg-secondary hover:bg-secondary/80 rounded-md text-xs relative z-50 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  window.open(match.candidateLinkedin, '_blank');
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
              >
                <Linkedin className="h-3 w-3" />
                LinkedIn
              </a>
            )}
          </div>

          {/* Companies & Education */}
          <div className="space-y-2 mb-4">
            {match.candidateCompanies && match.candidateCompanies.length > 0 && (
              <div className="flex items-start gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground">
                  {match.candidateCompanies.slice(0, 3).join(", ")}
                </span>
              </div>
            )}
            {match.candidateEducation && (
              <div className="flex items-start gap-2 text-sm">
                <GraduationCap className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{match.candidateEducation}</span>
              </div>
            )}
          </div>

          {/* Match Reasons */}
          <div className="space-y-3 mb-4 flex-1 overflow-y-auto">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Why they're a great fit
            </h3>
            <div className="space-y-2">
              {match.matchReasons.slice(0, 5).map((reason, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Skills */}
          {match.candidateSkills && match.candidateSkills.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Top Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {match.candidateSkills.slice(0, 12).map((skill, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Experience */}
          {match.candidateExperienceYears !== undefined && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold">{match.candidateExperienceYears}+ years</span> of experience
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}


