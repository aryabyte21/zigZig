"use client";

import { useState, memo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ExternalLink, Edit, Trash2, CheckCircle, Circle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { EditPortfolioDialog } from "@/components/edit-portfolio-dialog";

interface Portfolio {
  id: string;
  title: string;
  description: string;
  slug: string;
  is_published: boolean;
  updated_at: string;
  created_at: string;
}

interface PortfolioCardProps {
  portfolio: Portfolio;
  onDelete: (portfolioId: string) => void;
  onUpdate?: (updatedPortfolio: Portfolio) => void;
  onActivate?: (portfolioId: string) => void;
}

export const PortfolioCard = memo(function PortfolioCard({ portfolio, onDelete, onUpdate, onActivate }: PortfolioCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdated, setIsUpdated] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  const handleUpdate = (updatedPortfolio: Portfolio) => {
    if (onUpdate) {
      onUpdate(updatedPortfolio);
      setIsUpdated(true);
      setTimeout(() => setIsUpdated(false), 2000); // Remove highlight after 2 seconds
    }
  };

  const handleActivate = async () => {
    if (!onActivate) return;
    
    setIsActivating(true);
    try {
      const response = await fetch('/api/activate-portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ portfolioId: portfolio.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to activate portfolio');
      }

      onActivate(portfolio.id);
      toast.success("Portfolio activated successfully");
    } catch (error) {
      console.error('Activation error:', error);
      toast.error("Failed to activate portfolio");
    } finally {
      setIsActivating(false);
    }
  };

  const handleDeactivate = async () => {
    setIsActivating(true);
    try {
      const response = await fetch('/api/activate-portfolio', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ portfolioId: portfolio.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to deactivate portfolio');
      }

      if (onActivate) {
        onActivate(portfolio.id);
      }
      toast.success("Portfolio deactivated successfully");
    } catch (error) {
      console.error('Deactivation error:', error);
      toast.error("Failed to deactivate portfolio");
    } finally {
      setIsActivating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch('/api/delete-portfolio', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ portfolioId: portfolio.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete portfolio');
      }

      onDelete(portfolio.id);
      toast.success("Portfolio deleted successfully");
    } catch (error) {
      console.error('Delete error:', error);
      toast.error("Failed to delete portfolio");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className={`group hover:shadow-lg transition-all duration-300 ${isUpdated ? 'ring-2 ring-green-500 ring-opacity-50 bg-green-50 dark:bg-green-950' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{portfolio.title}</CardTitle>
            <CardDescription className="line-clamp-2">
              {portfolio.description}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {portfolio.is_published && (
              <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Active
              </Badge>
            )}
            {!portfolio.is_published && (
              <Badge variant="secondary" className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                <Circle className="w-3 h-3 mr-1" />
                Draft
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Updated {new Date(portfolio.updated_at).toLocaleDateString()}
          </span>
          <div className="flex space-x-2">
            {/* Activation Controls */}
            {onActivate && (
              <>
                {!portfolio.is_published ? (
                  <Button
                    onClick={handleActivate}
                    disabled={isActivating}
                    size="sm"
                    variant="outline"
                    className="text-gray-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 border-gray-300"
                  >
                    {isActivating ? (
                      <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Circle className="h-4 w-4" />
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleDeactivate}
                    disabled={isActivating}
                    size="sm"
                    className="bg-green-500 hover:bg-red-600 text-white"
                  >
                    {isActivating ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </>
            )}

            {/* Edit Button */}
            {onUpdate ? (
              <EditPortfolioDialog
                portfolio={portfolio}
                onUpdate={handleUpdate}
                trigger={
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                }
              />
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link href={`/dashboard/portfolio/${portfolio.id}`}>
                  <Edit className="h-4 w-4" />
                </Link>
              </Button>
            )}

            {/* View Public Portfolio */}
            {portfolio.is_published && portfolio.slug && (
              <Button asChild size="sm">
                <Link href={`/portfolio/${portfolio.slug}`} target="_blank">
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            )}

            {/* Delete Button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Portfolio</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{portfolio.title}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
