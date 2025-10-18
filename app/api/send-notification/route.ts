import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  console.log("📧 EMAIL API: Request received");
  
  try {
    const body = await request.json();
    const { visitorEmail, visitorName, portfolioOwnerName, message, magicLink } = body;
    
    console.log("📋 EMAIL API: Request payload:", {
      visitorEmail,
      visitorName,
      portfolioOwnerName,
      messageLength: message?.length,
      magicLinkPresent: !!magicLink,
      hasResendKey: !!process.env.RESEND_API_KEY
    });

    if (!visitorEmail || !portfolioOwnerName || !message || !magicLink) {
      console.error("❌ EMAIL API: Missing required fields:", {
        visitorEmail: !!visitorEmail,
        portfolioOwnerName: !!portfolioOwnerName,
        message: !!message,
        magicLink: !!magicLink
      });
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      console.error("❌ EMAIL API: RESEND_API_KEY not configured");
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 });
    }
    
    console.log("✅ EMAIL API: All validations passed, sending email...");

    const { data, error } = await resend.emails.send({
      from: "SuperDM <onboarding@resend.dev>", // Update with your verified domain
      to: "aryaabyte@gmail.com", // For demo: send all emails to verified address
      subject: `✨ ${portfolioOwnerName} replied to your message`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta name="color-scheme" content="light">
          <meta name="supported-color-schemes" content="light">
          <title>New Reply from ${portfolioOwnerName}</title>
        </head>
        <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; min-height: 100vh;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding: 40px 20px;">
            <tr>
              <td align="center">
                <!-- Main Container -->
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);">
                  
                  <!-- Header with Logo -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                      <div style="background: white; width: 60px; height: 60px; border-radius: 16px; margin: 0 auto 20px; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <span style="font-size: 28px; font-weight: bold; color: #667eea;">SD</span>
                      </div>
                      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                        💬 New Reply!
                      </h1>
                      <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">
                        Someone is waiting for your response
                      </p>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      
                      <!-- Greeting -->
                      <p style="font-size: 18px; color: #111827; margin: 0 0 24px; font-weight: 500;">
                        Hi <span style="color: #667eea; font-weight: 600;">${visitorName}</span> 👋
                      </p>
                      
                      <p style="font-size: 16px; color: #4b5563; margin: 0 0 24px; line-height: 1.6;">
                        Great news! <strong style="color: #111827;">${portfolioOwnerName}</strong> has replied to your message.
                      </p>

                      <!-- Message Preview Card -->
                      <div style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); border-left: 5px solid #667eea; padding: 20px; border-radius: 12px; margin: 0 0 32px; position: relative;">
                        <div style="position: absolute; top: 12px; right: 12px; background: #667eea; color: white; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                          New
                        </div>
                        <p style="margin: 0; color: #1f2937; font-size: 15px; line-height: 1.7; font-weight: 400;">
                          "${message.substring(0, 180)}${message.length > 180 ? '...' : ''}"
                        </p>
                      </div>

                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 32px;">
                        <tr>
                          <td align="center">
                            <a href="${magicLink}" 
                               style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 10px 15px -3px rgba(102, 126, 234, 0.4); transition: all 0.3s;">
                              View & Reply to Conversation →
                            </a>
                          </td>
                        </tr>
                      </table>

                      <!-- Features Grid -->
                      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 24px;">
                        <tr>
                          <td style="padding: 16px; background: #fef3c7; border-radius: 12px; width: 50%; vertical-align: top;">
                            <div style="text-align: center;">
                              <span style="font-size: 24px;">⚡</span>
                              <p style="margin: 8px 0 4px; font-size: 14px; font-weight: 600; color: #92400e;">Quick Reply</p>
                              <p style="margin: 0; font-size: 12px; color: #b45309; line-height: 1.4;">One-click access to continue the conversation</p>
                            </div>
                          </td>
                          <td style="width: 16px;"></td>
                          <td style="padding: 16px; background: #dbeafe; border-radius: 12px; width: 50%; vertical-align: top;">
                            <div style="text-align: center;">
                              <span style="font-size: 24px;">🔐</span>
                              <p style="margin: 8px 0 4px; font-size: 14px; font-weight: 600; color: #1e40af;">Secure Link</p>
                              <p style="margin: 0; font-size: 12px; color: #1e40af; line-height: 1.4;">Your private conversation link that only you can access</p>
                            </div>
                          </td>
                        </tr>
                      </table>

                      <!-- Pro Tip -->
                      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 20px; border: 2px dashed #f59e0b;">
                        <div style="display: flex; align-items: start;">
                          <span style="font-size: 24px; margin-right: 12px;">💡</span>
                          <div>
                            <p style="margin: 0 0 4px; font-size: 14px; font-weight: 700; color: #92400e;">
                              Pro Tip
                            </p>
                            <p style="margin: 0; font-size: 13px; color: #b45309; line-height: 1.5;">
                              Bookmark this conversation link to return anytime without searching your email. It's your permanent access point!
                            </p>
                          </div>
                        </div>
                      </div>

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0 0 12px; color: #6b7280; font-size: 14px; font-weight: 500;">
                        Powered by <span style="color: #667eea; font-weight: 700;">SuperDM</span>
                      </p>
                      <p style="margin: 0 0 16px; color: #9ca3af; font-size: 12px;">
                        Professional Networking Reimagined
                      </p>
                      <p style="margin: 0;">
                        <a href="${magicLink}" style="color: #667eea; text-decoration: none; font-size: 13px; font-weight: 600;">
                          Open Conversation →
                        </a>
                      </p>
                      <p style="margin: 16px 0 0; color: #d1d5db; font-size: 11px;">
                        This email was sent because you initiated a conversation through SuperDM
                      </p>
                    </td>
                  </tr>

                </table>
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
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    console.log("🎉 EMAIL SENT SUCCESSFULLY!", {
      emailId: data?.id,
      to: "aryaabyte@gmail.com",
      from: "SuperDM",
      subject: `✨ ${portfolioOwnerName} replied to your message`
    });

    return NextResponse.json({ 
      success: true, 
      id: data?.id,
      message: "Email sent successfully",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("💥 EMAIL API CATCH ERROR:", {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
  }
}

