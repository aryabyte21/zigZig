"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface AIVoiceWidgetProps {
  portfolioId: string;
}

export function AIVoiceWidget({ portfolioId }: AIVoiceWidgetProps) {
  const agent = useQuery(api.agents.getAgentByPortfolio, { portfolioId });
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const initRef = useRef(false);

  // Load ElevenLabs script on mount
  useEffect(() => {
    if (typeof window === 'undefined' || initRef.current) return;
    
    const existingScript = document.querySelector('script[src="https://elevenlabs.io/convai-widget/index.js"]');
    if (existingScript) {
      setScriptLoaded(true);
      initRef.current = true;
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://elevenlabs.io/convai-widget/index.js';
    script.async = true;
    script.onload = () => {
      setScriptLoaded(true);
      initRef.current = true;
    };
    
    document.head.appendChild(script);
  }, []);

  if (!agent || !agent.isActive || !scriptLoaded) {
    return null;
  }

  return (
    <div 
      className="fixed bottom-6 right-6 z-50"
      dangerouslySetInnerHTML={{
        __html: `<elevenlabs-convai agent-id="${agent.agentId}"></elevenlabs-convai>`
      }}
    />
  );
}

