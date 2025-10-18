import { AdvancedJobSearch } from "@/components/advanced-job-search";

export const metadata = {
  title: "Advanced AI Job Search",
  description: "Multi-strategy AI-powered job search using neural networks, keyword matching, and hybrid intelligence",
};

export default function AdvancedJobsPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Advanced AI Job Search
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Leverage multiple AI strategies and comprehensive portfolio analysis for intelligent job matching. 
          Powered by Exa AI's advanced search capabilities.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mt-8">
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Neural Search</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Semantic understanding of your career intent and professional context
            </p>
          </div>
          
          <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">Keyword Precision</h3>
            <p className="text-sm text-green-700 dark:text-green-300">
              Exact matching for specific technical skills and requirements
            </p>
          </div>
          
          <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">Hybrid Intelligence</h3>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              Multi-query approach targeting different job categories and contexts
            </p>
          </div>
        </div>
      </div>

      <AdvancedJobSearch />
    </div>
  );
}
