"use client";

import { Button } from "@/components/ui/button";
import { Mail, Download, Calendar } from "lucide-react";

interface PortfolioActionsProps {
  email?: string;
  calendlyUrl?: string;
  resumeFileUrl?: string;
}

export function PortfolioActions({ email, calendlyUrl, resumeFileUrl }: PortfolioActionsProps) {
  const handleDownload = () => {
    if (resumeFileUrl) {
      // Download the actual PDF file
      const link = document.createElement('a');
      link.href = resumeFileUrl;
      link.download = 'resume.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Fallback to print
      window.print();
    }
  };

  return (
    <div className="flex flex-wrap justify-center gap-4">
      <Button 
        size="lg" 
        className="bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-100"
        asChild
      >
        <a href={`mailto:${email || 'hello@example.com'}`}>
          <Mail className="mr-2 h-4 w-4" />
          Get In Touch
        </a>
      </Button>
      <Button 
        size="lg" 
        variant="outline" 
        className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        onClick={handleDownload}
      >
        <Download className="mr-2 h-4 w-4" />
        Download CV
      </Button>
      {calendlyUrl ? (
        <Button 
          size="lg" 
          variant="outline" 
          className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          asChild
        >
          <a href={calendlyUrl} target="_blank" rel="noopener noreferrer">
            <Calendar className="mr-2 h-4 w-4" />
            Schedule Call
          </a>
        </Button>
      ) : (
        <Button 
          size="lg" 
          variant="outline" 
          className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          asChild
        >
          <a href={`mailto:${email || 'hello@example.com'}?subject=Schedule a Call`}>
            <Calendar className="mr-2 h-4 w-4" />
            Schedule Call
          </a>
        </Button>
      )}
    </div>
  );
}

export function PortfolioFooterAction({ email }: { email?: string }) {
  return (
    <Button 
      size="lg" 
      className="bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-100"
      asChild
    >
      <a href={`mailto:${email || 'hello@example.com'}`}>
        <Mail className="mr-2 h-4 w-4" />
        Get In Touch
      </a>
    </Button>
  );
}
