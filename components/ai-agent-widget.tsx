"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mic, X } from "lucide-react";

interface AIAgentWidgetProps {
  agentId: string;
  agentName?: string;
}

export function AIAgentWidget({ agentId, agentName = "AI Assistant" }: AIAgentWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        size="lg"
        className="h-14 px-6 gap-3 shadow-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
      >
        <Mic className="h-5 w-5" />
        <span>Talk to My AI</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl h-[80vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold">
                {agentName}
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          
          <div className="flex-1 w-full h-full overflow-hidden">
            <iframe
              src={`https://elevenlabs.io/convai-widget/${agentId}`}
              className="w-full h-full border-0"
              allow="microphone"
              title={agentName}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

