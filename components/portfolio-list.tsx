"use client";

import { useState, memo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PortfolioCard } from "@/components/portfolio-card";
import { FileText, Sparkles } from "lucide-react";
import Link from "next/link";

interface Portfolio {
  id: string;
  title: string;
  description: string;
  slug: string;
  is_published: boolean;
  updated_at: string;
  created_at: string;
}

interface PortfolioListProps {
  portfolios: Portfolio[];
}

export const PortfolioList = memo(function PortfolioList({ portfolios: initialPortfolios }: PortfolioListProps) {
  const [portfolios, setPortfolios] = useState(initialPortfolios);
  
  // Determine active portfolio from current state
  const activePortfolio = portfolios.find(p => p.is_published);
  
  const handleDelete = useCallback((portfolioId: string) => {
    setPortfolios(prev => prev.filter(p => p.id !== portfolioId));
  }, []);

  const handleUpdate = useCallback((updatedPortfolio: Portfolio) => {
    setPortfolios(prev => prev.map(p => 
      p.id === updatedPortfolio.id ? updatedPortfolio : p
    ));
  }, []);

  const handleActivate = useCallback((activatedPortfolioId: string) => {
    setPortfolios(prev => prev.map(p => ({
      ...p,
      is_published: p.id === activatedPortfolioId
    })));
  }, []);

  if (portfolios.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No portfolios yet</h3>
          <p className="text-muted-foreground text-center mb-4">
            Create your first portfolio to showcase your work and skills.
          </p>
          <Button asChild className="bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-100">
            <Link href="/dashboard/onboarding">
              <Sparkles className="mr-2 h-4 w-4" />
              Create Your First AI Portfolio
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Portfolio Banner - Updates dynamically */}
      {activePortfolio && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-800 dark:text-green-200">
            <strong>Active Portfolio:</strong> {activePortfolio.title} is currently live and visible to the public.
          </p>
        </div>
      )}
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {portfolios.map((portfolio) => (
        <PortfolioCard
          key={portfolio.id}
          portfolio={portfolio}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
          onActivate={handleActivate}
        />
      ))}
      </div>
    </div>
  );
});
