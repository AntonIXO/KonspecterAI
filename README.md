# KonspecterAI - Smart Reading Assistant

KonspecterAI is a modern web application built with Next.js that helps users read and analyze books more effectively using AI-powered features.

## Features

- **Multi-Format Support**
  - PDF viewer with page navigation and text selection
  - EPUB reader support
  - Last opened file persistence

- **AI-Powered Analysis**
  - Text summarization of selected passages
  - Multiple compression ratios (1:1, 1:2, 1:3)
  - Contextual understanding of content

- **Authentication**
  - Email/Password authentication
  - Google OAuth integration
  - Protected routes and user sessions

- **Modern UI**
  - Responsive design using Tailwind CSS
  - Dark/Light mode support
  - Collapsible sidebar navigation
  - Mobile-friendly interface

## Tech Stack

- **Frontend**
  - Next.js 14 (App Router)
  - React 19
  - Tailwind CSS
  - shadcn/ui components
  - react-pdf for PDF rendering
  - react-reader for EPUB support

- **Backend & Services**
  - Supabase for authentication and database
  - Ollama for AI text processing
  - Docker for containerization

- **Development**
  - TypeScript
  - ESLint
  - Prettier
  - CI/CD with Gitea Actions

## Getting Started

1. Clone the repository:
```bash
git clone <repository-url>
```

2. Install dependencies:
```bash
yarn install
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
yarn dev
```

5. For production:
```bash
yarn build
yarn start
```

## Docker Deployment

The project includes Docker support for easy deployment:

```bash
docker compose up -d
```

This will start:
- Frontend service on port 7778
- Ollama service for AI processing

## Project Structure

```
src/
├── app/                 # Next.js app router pages
├── components/         # React components
├── lib/               # Utilities and contexts
├── utils/             # Helper functions
└── hooks/             # Custom React hooks
```
