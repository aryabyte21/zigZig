import { createClient } from "@/lib/supabase/server";
import { SmartJobSearch } from "@/components/smart-job-search";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Sparkles, 
  TrendingUp, 
  Briefcase
} from "lucide-react";

export default async function JobsChatPage() {
  const supabase = await createClient();
  
  // Get user profile and portfolio data
  const [profileResult, portfoliosResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', (await supabase.auth.getUser()).data.user?.id).single(),
    supabase.from('portfolios').select('content, updated_at').eq('user_id', (await supabase.auth.getUser()).data.user?.id).order('updated_at', { ascending: false }).limit(1)
  ]);

  const profile = profileResult.data;
  const latestPortfolio = portfoliosResult.data?.[0];

  // Extract user profile data for the search
  const userProfile = {
    skills: profile?.skills || [],
    experienceLevel: profile?.experience_level || 'mid',
    location: profile?.location,
    remotePreference: profile?.remote_preference || 'flexible',
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <Search className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              AI Job Search
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Find your perfect job with intelligent matching
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-6">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            <Sparkles className="w-3 h-3 mr-1" />
            AI-Powered
          </Badge>
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <TrendingUp className="w-3 h-3 mr-1" />
            Real-time Search
          </Badge>
          <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
            <Briefcase className="w-3 h-3 mr-1" />
            Portfolio Matching
          </Badge>
        </div>
      </div>

      {/* Main Search Interface - Full Width */}
      <div className="w-full">
        <SmartJobSearch userProfile={userProfile} />
      </div>
    </div>
  );
}
