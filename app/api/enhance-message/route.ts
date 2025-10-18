import { NextRequest, NextResponse } from "next/server";
import { enhanceMessage, quickGrammarCheck, suggestImprovements, rewriteInTone } from "@/lib/ai/message-enhancer";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, draft, intent, context, targetTone } = body;

    switch (action) {
      case "enhance":
        if (!draft || !intent || !context) {
          return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }
        const enhanced = await enhanceMessage(draft, intent, context);
        return NextResponse.json(enhanced);

      case "grammar":
        if (!draft) {
          return NextResponse.json({ error: "Missing draft text" }, { status: 400 });
        }
        const corrected = await quickGrammarCheck(draft);
        return NextResponse.json({ corrected });

      case "suggest":
        if (!draft || !intent) {
          return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }
        const suggestions = await suggestImprovements(draft, intent);
        return NextResponse.json({ suggestions });

      case "rewrite":
        if (!draft || !targetTone) {
          return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }
        const rewritten = await rewriteInTone(draft, targetTone);
        return NextResponse.json({ rewritten });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Message enhancement API error:", error);
    return NextResponse.json(
      { error: "Failed to enhance message" },
      { status: 500 }
    );
  }
}

