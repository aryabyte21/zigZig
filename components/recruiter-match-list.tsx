"use client";

import { CandidateMatch } from "@/types/recruiter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, MapPin, Briefcase, Heart, Star } from "lucide-react";
import Link from "next/link";

interface RecruiterMatchListProps {
  matches: CandidateMatch[];
  title: string;
  emptyMessage: string;
}

export function RecruiterMatchList({ matches, title, emptyMessage }: RecruiterMatchListProps) {
  if (matches.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-blue-500";
    if (score >= 40) return "bg-yellow-500";
    return "bg-gray-500";
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold mb-4">{title}</h3>
      <div className="grid gap-4">
        {matches.map((match) => (
          <Card key={match._id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <Avatar className="h-16 w-16 border-2 border-white shadow-lg">
                  <AvatarImage src={match.candidateAvatar} alt={match.candidateName} />
                  <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                    {match.candidateName?.charAt(0)?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h4 className="font-semibold text-lg">{match.candidateName || "Candidate"}</h4>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        {match.candidateTitle || "Professional"}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {match.candidateLocation || "Location not specified"}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <Badge className={`${getScoreColor(match.matchScore)} text-white font-bold`}>
                        {match.matchScore}% Match
                      </Badge>
                      {match.status === "super_liked" && (
                        <Badge className="bg-blue-500 text-white">
                          <Star className="h-3 w-3 mr-1 fill-white" />
                          Super Liked
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Skills */}
                  {match.candidateSkills && match.candidateSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {match.candidateSkills.slice(0, 5).map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Top Match Reason */}
                  {match.matchReasons && match.matchReasons.length > 0 && (
                    <p className="text-sm text-muted-foreground italic mb-3">
                      "{match.matchReasons[0]}"
                    </p>
                  )}

                  {/* Actions */}
                  {match.candidatePortfolioSlug && (
                    <Link
                      href={`/portfolio/${match.candidatePortfolioSlug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm" className="gap-2">
                        <ExternalLink className="h-4 w-4" />
                        View Portfolio
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

