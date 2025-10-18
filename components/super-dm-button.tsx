"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, X } from "lucide-react";
import { SuperDMChat } from "./super-dm-chat";

interface SuperDMButtonProps {
  portfolioUserId: string;
  portfolioOwnerName: string;
}

export function SuperDMButton({ portfolioUserId, portfolioOwnerName }: SuperDMButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Fix hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleClick = () => {
    console.log("SuperDM button clicked!", { portfolioUserId, portfolioOwnerName });
    setIsOpen(true);
  };

  // Don't render until mounted to avoid hydration issues
  if (!isMounted) {
    return null;
  }

  return (
    <>
      {/* Floating Action Button - Positioned above AI voice widget with padding */}
      <div className="fixed bottom-36 right-8 z-[9999]">
        <Button
          onClick={handleClick}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground border-0 transition-all duration-300 hover:scale-110"
        >
          <MessageSquare className="h-6 w-6" />
          <span className="sr-only">Send message to {portfolioOwnerName}</span>
        </Button>
        
        {/* Pulse animation - removed purple */}
        <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20 pointer-events-none"></div>
      </div>

      {/* Chat Modal - Using shadcn styling */}
      {isOpen && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md max-h-[90vh] h-[700px] bg-background border rounded-lg shadow-2xl overflow-hidden flex flex-col">
            {/* Header - Using shadcn colors */}
            <div className="flex items-center justify-between p-4 border-b bg-muted/50 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Message {portfolioOwnerName}</h3>
                  <p className="text-xs text-muted-foreground">Usually responds within an hour</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Chat Component */}
            <div className="flex-1 overflow-hidden">
              <SuperDMChat
                portfolioUserId={portfolioUserId}
                portfolioOwnerName={portfolioOwnerName}
                onClose={() => setIsOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
