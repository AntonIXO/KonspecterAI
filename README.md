# KonspecterAI - Read smarter, Not harder | AI powered book reader.

KonspecterAI is a modern web application built with Next.js that helps users read and analyze books more effectively using AI-powered features.

## Features

- **Multi-Format Support**
  - PDF viewer with page navigation and text selection
  - ~~EPUB reader support~~
  - Last opened file persistence

- **AI-Powered Analysis**
  - Text summarization and chat with selected content
  - Chrome local AI:
    - Compression
    - Translation
    - Language detection
    - ~~Quiz generation~~ in future
  - Contextual understanding of content

- **Authentication**
  - Supabase for authentication
  - Email/Password
  - Google OAuth integration

- **Modern UI**
  - Dark/Light mode support
  - Collapsible sidebar navigation
  - Mobile-friendly interface

## Tech Stack

- **Frontend**
  - **Next.js** (App Router)
  - **Tailwind CSS**
  - **Shadcn** components
  - **react-pdf** for PDF rendering
  - ~~**react-reader** for EPUB support~~ in plans

- **Backend & Services**
  - **ChromeAI** for local translation and compression
  - **Supabase** for authentication, database, storage and edge functions embedding generation
  - **Gemini** for quiz and chat generation

## Getting Started

1. Clone the repository:
```bash
git clone <repository-url>
```

2. Install dependencies:
```bash
bun install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Start the development server:
```bash
bun dev --turbo
```

5. For production:
```bash
bun run build
bun run start
```

## Project Structure

```
src/
├── app/                 # Next.js app router pages
├── components/          # React components
├── lib/                 # Utilities and contexts
├── utils/             # Helper functions
└── hooks/             # Custom React hooks
supabase/             # Supabase project files
```
