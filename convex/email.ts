"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";

/**
 * Send email notification when portfolio owner replies to visitor
 * This file uses Node.js runtime to make fetch requests to localhost
 */
export const sendEmailNotification = internalAction({
  args: {
    conversationId: v.id("conversations"),
    visitorEmail: v.string(),
    visitorName: v.string(),
    portfolioOwnerName: v.string(),
    message: v.string(),
    magicToken: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    console.log("🚀 EMAIL ACTION STARTED:", {
      conversationId: args.conversationId,
      visitorEmail: args.visitorEmail,
      visitorName: args.visitorName,
      portfolioOwnerName: args.portfolioOwnerName,
      messageLength: args.message.length,
      magicToken: args.magicToken.substring(0, 20) + "..."
    });
    
    try {
      const magicLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/chat/${args.magicToken}`;
      
      console.log("🔗 EMAIL DETAILS:", {
        magicLink: magicLink.substring(0, 50) + "...",
        to: "aryaabyte@gmail.com", // Demo email
        visitorName: args.visitorName,
        portfolioOwnerName: args.portfolioOwnerName,
        messagePreview: args.message.substring(0, 100) + "..."
      });

      if (!process.env.RESEND_API_KEY) {
        console.error("❌ RESEND_API_KEY not configured in Convex environment");
        return null;
      }

      const resend = new Resend(process.env.RESEND_API_KEY);

      console.log("📤 SENDING EMAIL VIA RESEND...");
      
      const { data, error } = await resend.emails.send({
        from: "SuperDM <onboarding@resend.dev>",
        to: "aryaabyte@gmail.com", // For demo: send all emails to verified address
        subject: `✨ ${args.portfolioOwnerName} replied to your message`,
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta name="color-scheme" content="dark light">
            <meta name="supported-color-schemes" content="dark light">
            <title>New Reply from ${args.portfolioOwnerName}</title>
          </head>
          <body style="margin: 0; padding: 0; background: #0f0f0f; font-family: 'Circular', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-weight: 400; line-height: 1.5;">
            
            <!-- Outer Container -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #0f0f0f; padding: 40px 20px;">
              <tr>
                <td align="center">
                  
                  <!-- Main Container -->
                  <table width="580" cellpadding="0" cellspacing="0" border="0" style="max-width: 580px; background: #1a1a1a; border-radius: 16px;">
                    
                    <!-- Header -->
                    <tr>
                      <td style="padding: 40px 40px 32px;">
                        <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em;">
                          SuperDM
                        </h1>
                        <p style="margin: 0; font-size: 16px; color: #9ca3af; font-weight: 400;">
                          New message from ${args.portfolioOwnerName}
                        </p>
                      </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                      <td style="padding: 0 40px 40px;">
                        
                        <!-- Greeting -->
                        <p style="font-size: 18px; font-weight: 500; color: #ffffff; margin: 0 0 16px;">
                          Hi ${args.visitorName},
                        </p>
                        
                        <p style="font-size: 16px; color: #d1d5db; margin: 0 0 32px; line-height: 1.6;">
                          ${args.portfolioOwnerName} replied to your message.
                        </p>

                        <!-- Message Card -->
                        <div style="background: #262626; border-radius: 12px; padding: 24px; margin: 0 0 32px; border-left: 4px solid #3b82f6;">
                          <p style="margin: 0; color: #ffffff; font-size: 15px; line-height: 1.6; font-weight: 400;">
                            "${args.message.substring(0, 300)}${args.message.length > 300 ? '...' : ''}"
                          </p>
                        </div>

                        <!-- CTA Button -->
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 40px;">
                          <tr>
                            <td align="center">
                              <a href="${magicLink}" 
                                 style="display: inline-block; background: #3b82f6; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; font-family: 'Circular', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                                Reply to Message
                              </a>
                            </td>
                          </tr>
                        </table>

                        <!-- Info Box -->
                        <div style="background: #1f2937; border-radius: 8px; padding: 20px; border: 1px solid #374151;">
                          <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #ffffff;">
                            Quick Access
                          </p>
                          <p style="margin: 0; font-size: 13px; color: #9ca3af; line-height: 1.5;">
                            This link gives you direct access to your conversation. Bookmark it for easy reference.
                          </p>
                        </div>

                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background: #262626; padding: 32px 40px; text-align: center; border-radius: 0 0 16px 16px;">
                        <p style="margin: 0 0 12px; color: #ffffff; font-size: 16px; font-weight: 600;">
                          SuperDM
                        </p>
                        <p style="margin: 0 0 20px; color: #6b7280; font-size: 14px;">
                          Professional messaging made simple
                        </p>
                        <p style="margin: 0;">
                          <a href="${magicLink}" style="color: #3b82f6; text-decoration: none; font-size: 14px; font-weight: 500;">
                            Continue Conversation →
                          </a>
                        </p>
                      </td>
                    </tr>

                  </table>
                  
                  <!-- Unsubscribe -->
                  <p style="margin: 24px 0 0; color: #6b7280; font-size: 12px; text-align: center;">
                    This email was sent because you started a conversation on SuperDM
                  </p>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      });

      if (error) {
        console.error("❌ RESEND ERROR:", {
          error,
          message: error.message,
          name: error.name
        });
        return null;
      }

      console.log("🎉 EMAIL SENT SUCCESSFULLY!", {
        emailId: data?.id,
        to: "aryaabyte@gmail.com",
        from: "SuperDM",
        subject: `✨ ${args.portfolioOwnerName} replied to your message`
      });

    } catch (error) {
      console.error("💥 EMAIL ACTION ERROR:", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        args: {
          conversationId: args.conversationId,
          visitorEmail: args.visitorEmail
        }
      });
    }

    return null;
  },
});

