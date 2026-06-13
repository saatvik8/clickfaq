# ClickFAQ

A modern FAQ Management Platform built with React, TypeScript, Tailwind CSS, React Router, Lucide React, and Framer Motion.

## Features

- **Login Page** — Aurora-inspired glassmorphism design with background video
- **FAQ Page** — 141 questions with instant search, category filters, expand/collapse animations
- **Multilingual Translation** — Google Cloud Translation API with caching (EN, HI, FR, DE, ES, ZH, JA)
- **FAQ Heatmap** — Engagement tracking with color-coded borders (green → red)
- **Unanswered Questions** — Submit questions not found in the FAQ
- **Raise Ticket & Feedback** — Support tickets with auto-generated IDs and star ratings

## Getting Started

```bash
cd clickfaq
npm install
cp .env.example .env   # Add the Translate API key here
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — any email/password works in demo mode.

##  Translation API

1. Enable the [Cloud Translation API](https://console.cloud.google.com/apis/library/translate.googleapis.com)
2. Create an API key 
3. Set `TRANSLATE_API_KEY` in `.env`

Without an API key, the app falls back to English content.

## Data

FAQ content is sourced from [samagama.in/internship/faq](https://samagama.in/internship/faq).

To re-parse the FAQ dataset:

```bash
node scripts/parse-faq.mjs
```

## Tech Stack

- React 19 + TypeScript
- Tailwind CSS v4
- React Router v7
- Framer Motion
- Lucide React

