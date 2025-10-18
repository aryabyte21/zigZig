export interface AutocompleteContext {
  messageIntent: string;
  visitorName: string;
  visitorCompany: string;
  portfolioOwnerName: string;
  currentMessage: string;
  portfolioContext?: {
    skills: string[];
    projects: string[];
    experience: string;
  };
}

/**
 * Generate smart autocompletions using Groq's fast inference
 */
export async function generateAutocompletions(
  context: AutocompleteContext
): Promise<string[]> {
  try {
    const response = await fetch('/api/groq-autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'autocompletions',
        ...context,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate autocompletions');
    }

    const data = await response.json();
    return data.suggestions || [];
  } catch (error) {
    console.error('Groq autocomplete error:', error);
    return [];
  }
}

/**
 * Generate smart company suggestions based on partial input
 */
export async function suggestCompanies(partialCompany: string): Promise<string[]> {
  if (partialCompany.length < 2) return [];

  try {
    const response = await fetch('/api/groq-autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'companySuggestions',
        partialCompany,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get company suggestions');
    }

    const data = await response.json();
    return data.suggestions || [];
  } catch (error) {
    console.error('Company suggestion error:', error);
    return [];
  }
}

/**
 * Generate professional message templates based on intent
 */
export async function generateMessageTemplate(
  intent: string,
  context: Partial<AutocompleteContext>
): Promise<string> {
  try {
    const response = await fetch('/api/groq-autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'messageTemplate',
        intent,
        visitorCompany: context.visitorCompany,
        portfolioOwnerName: context.portfolioOwnerName,
        portfolioContext: context.portfolioContext,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate message template');
    }

    const data = await response.json();
    return data.template || '';
  } catch (error) {
    console.error('Template generation error:', error);
    return '';
  }
}

/**
 * Analyze message quality and suggest improvements
 */
export async function analyzeMessageQuality(message: string, intent: string): Promise<{
  score: number;
  suggestions: string[];
  improvements: string[];
}> {
  try {
    const response = await fetch('/api/groq-autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'messageQuality',
        message,
        intent,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to analyze message quality');
    }

    const data = await response.json();
    return {
      score: data.score || 5,
      suggestions: data.suggestions || [],
      improvements: data.improvements || [],
    };
  } catch (error) {
    console.error('Message analysis error:', error);
    return {
      score: 5,
      suggestions: [],
      improvements: []
    };
  }
}
