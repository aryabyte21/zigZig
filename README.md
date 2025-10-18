<div align="center">
  <h1>zigZig - AI-Powered Career Hub</h1>
  <p>Build your dream career with AI. Generate portfolios, optimize resumes, find jobs, and land interviews.</p>
</div>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#demo"><strong>Demo</strong></a> ·
  <a href="#deploy-to-vercel"><strong>Deploy to Vercel</strong></a> ·
  <a href="#clone-and-run-locally"><strong>Clone and run locally</strong></a> ·
  <a href="#feedback-and-issues"><strong>Feedback and issues</strong></a>
  <a href="#more-supabase-examples"><strong>More Examples</strong></a>
</p>
<br/>

## Features

### 🚀 AI-Powered Portfolio Generation
- **Smart Resume Parsing**: Upload PDF/DOCX resumes or paste text for automatic data extraction
- **Ghibli-Style Avatars**: Generate beautiful Studio Ghibli-inspired profile pictures using Fal.AI
- **Enhanced Content**: AI-powered content optimization using Groq and Google Gemini
- **Professional Templates**: Clean, modern portfolio designs inspired by hello.cv

### 🔍 Intelligent Job Search
- **Semantic Search**: Find relevant job opportunities using Exa.ai's advanced search
- **Skills Matching**: AI-powered job recommendations based on your profile
- **Company Insights**: Get detailed information about potential employers

### 🛠 Technical Stack
- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui with Inter font (Spotify-inspired design)
- **Backend**: Supabase (Auth, Database, Storage)
- **AI Integration**: Groq, Google Gemini, Fal.AI, Exa.ai
- **Authentication**: OAuth (Google, GitHub) + Email/Password

### 📱 User Experience
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Dark/Light Mode**: System-aware theme switching
- **Real-time Updates**: Live portfolio updates and notifications
- **Professional URLs**: Custom portfolio slugs (e.g., zigzig.com/portfolio/john-doe)

## Demo

You can view a fully working demo at [demo-nextjs-with-supabase.vercel.app](https://demo-nextjs-with-supabase.vercel.app/).

## Deploy to Vercel

Vercel deployment will guide you through creating a Supabase account and project.

After installation of the Supabase integration, all relevant environment variables will be assigned to the project so the deployment is fully functioning.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fnext.js%2Ftree%2Fcanary%2Fexamples%2Fwith-supabase&project-name=nextjs-with-supabase&repository-name=nextjs-with-supabase&demo-title=nextjs-with-supabase&demo-description=This+starter+configures+Supabase+Auth+to+use+cookies%2C+making+the+user%27s+session+available+throughout+the+entire+Next.js+app+-+Client+Components%2C+Server+Components%2C+Route+Handlers%2C+Server+Actions+and+Middleware.&demo-url=https%3A%2F%2Fdemo-nextjs-with-supabase.vercel.app%2F&external-id=https%3A%2F%2Fgithub.com%2Fvercel%2Fnext.js%2Ftree%2Fcanary%2Fexamples%2Fwith-supabase&demo-image=https%3A%2F%2Fdemo-nextjs-with-supabase.vercel.app%2Fopengraph-image.png)

The above will also clone the Starter kit to your GitHub, you can clone that locally and develop locally.

If you wish to just develop locally and not deploy to Vercel, [follow the steps below](#clone-and-run-locally).

## Clone and run locally

1. You'll first need a Supabase project which can be made [via the Supabase dashboard](https://database.new)

2. Create a Next.js app using the Supabase Starter template npx command

   ```bash
   npx create-next-app --example with-supabase with-supabase-app
   ```

   ```bash
   yarn create next-app --example with-supabase with-supabase-app
   ```

   ```bash
   pnpm create next-app --example with-supabase with-supabase-app
   ```

3. Use `cd` to change into the app's directory

   ```bash
   cd with-supabase-app
   ```

4. Create a `.env.local` file and add the following environment variables:

  ```env
  # Supabase Configuration (Required)
  NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key

  # AI API Keys (Required for full functionality)
  GROQ_API_KEY=your_groq_api_key
  GEMINI_API_KEY=your_google_gemini_api_key
  FAL_KEY=your_fal_ai_api_key
  EXA_API_KEY=your_exa_ai_api_key
  ```

  **Where to get API keys:**
  - **Supabase**: [Create a project](https://database.new) and get keys from [API settings](https://supabase.com/dashboard/project/_?showConnect=true)
  - **Groq**: [Get API key](https://console.groq.com/keys) (Free tier available)
  - **Google Gemini**: [Get API key](https://aistudio.google.com/app/apikey) (Free tier available)
  - **Fal.AI**: [Get API key](https://fal.ai/dashboard) (Free credits included)
  - **Exa.ai**: [Get API key](https://dashboard.exa.ai/) (Free tier available)

5. You can now run the Next.js local development server:

   ```bash
   npm run dev
   ```

   The starter kit should now be running on [localhost:3000](http://localhost:3000/).

6. This template comes with the default shadcn/ui style initialized. If you instead want other ui.shadcn styles, delete `components.json` and [re-install shadcn/ui](https://ui.shadcn.com/docs/installation/next)

> Check out [the docs for Local Development](https://supabase.com/docs/guides/getting-started/local-development) to also run Supabase locally.

## Feedback and issues

Please file feedback and issues over on the [Supabase GitHub org](https://github.com/supabase/supabase/issues/new/choose).

## More Supabase examples

- [Next.js Subscription Payments Starter](https://github.com/vercel/nextjs-subscription-payments)
- [Cookie-based Auth and the Next.js 13 App Router (free course)](https://youtube.com/playlist?list=PL5S4mPUpp4OtMhpnp93EFSo42iQ40XjbF)
- [Supabase Auth and the Next.js App Router](https://github.com/supabase/supabase/tree/master/examples/auth/nextjs)
