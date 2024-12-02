# KonspecterAI - Smart Reading Assistant

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
    - Embedding generation
  - Contextual understanding of content

- **Authentication**
  - Supabase for authentication
  - Email/Password
  - Google OAuth integration

- **Modern UI**
  - Responsive design using Tailwind CSS
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
  - **Supabase** for authentication and database
  - **Gemini** for AI text processing
  - **Docker** for containerization

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
Required variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. Start the development server:
```bash
bun dev
```

5. For production:
```bash
bun build
bun start
```

## Docker Deployment

The project includes Docker support for easy deployment:

```bash
docker compose up -d
```

## Project Structure

```
src/
├── app/                 # Next.js app router pages
├── components/         # React components
├── lib/               # Utilities and contexts
├── utils/             # Helper functions
└── hooks/             # Custom React hooks
```
