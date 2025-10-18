import type { Metadata } from "next";
import { Inter, DM_Sans } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { ConvexClientProvider } from "@/components/convex-provider";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "ZigZig - AI-Powered Career Hub",
  description: "Build your dream career with AI. Generate portfolios, optimize resumes, find jobs, and land interviews with ZigZig's cutting-edge AI tools.",
  keywords: ["AI", "career", "portfolio", "resume", "job search", "interview", "professional development"],
  authors: [{ name: "ZigZig Team" }],
  openGraph: {
    title: "ZigZig - AI-Powered Career Hub",
    description: "Build your dream career with AI. Generate portfolios, optimize resumes, find jobs, and land interviews.",
    url: defaultUrl,
    siteName: "ZigZig",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ZigZig - AI-Powered Career Hub",
    description: "Build your dream career with AI. Generate portfolios, optimize resumes, find jobs, and land interviews.",
  },
};

// Spotify-inspired font stack - DM Sans is very close to Circular
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  display: "swap",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

// Fallback font
const inter = Inter({
  variable: "--font-inter",
  display: "swap",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.className} ${inter.variable} antialiased`}>
        <ConvexClientProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
