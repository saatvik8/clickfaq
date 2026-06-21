# ClickFAQ

A modern FAQ Management Platform built with React, TypeScript, Tailwind CSS, React Router, Lucide React, and Framer Motion. 

## Features

- **Login Page** — Aurora-inspired glassmorphism design with background video
- **FAQ Page** — 141 questions with instant search, category filters, expand/collapse animations
- **Multilingual Translation** —  Translation done with the help of a local library (EN, HI &Punjabi , Tamil)
-**Translation** - Translation currently only applies to section 1 (short answers) & section 2(long answers) and category buttons and labels to demonstrate the translation feature
- **FAQ Heatmap** — Engagement tracking with color-coded borders (green → red)
- **Unanswered Questions** — Submit questions not found in the FAQ
- **Raise Ticket & Feedback** — Support tickets with auto-generated IDs and star ratings
- **Rosetta Journal** - Allow users to make entry directly via the Faq site and have easy access to the journal

## Getting Started

```bash
cd clickfaq
npm install
cp .env.example .env   # Add the Translate API key here
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — any email/password works in demo mode.


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

