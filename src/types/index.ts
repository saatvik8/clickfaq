export interface FAQ {
  id: string;
  number: string;
  question: string;
  answer: string;
  categoryId: string;
  categoryName: string;
}

export interface FAQCategory {
  id: string;
  name: string;
  slug: string;
  questions: FAQ[];
}

export interface FAQDataset {
  version: string;
  lastUpdated: string;
  source: string;
  categories: FAQCategory[];
  faqs: FAQ[];
  totalCount: number;
}

export type SupportedLanguage =
  | 'en'
  | 'hi'
  | 'pa'
  | 'ta';

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nativeLabel: string;
}

export interface FAQEngagement {
  views: number;
  clicks: number;
  expansions: number;
}

export type HeatmapLevel = 'green' | 'yellow' | 'orange' | 'red';

export interface UnansweredQuestion {
  id: string;
  question: string;
  email?: string;
  submittedAt: string;
  status: 'pending' | 'reviewed' | 'converted';
  searchQuery?: string;
}

export interface Ticket {
  id: string;
  name: string;
  email: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  createdAt: string;
  status: 'open' | 'in-progress' | 'resolved';
}

export interface Feedback {
  id: string;
  rating: number;
  text: string;
  wasHelpful: boolean | null;
  faqId?: string;
  createdAt: string;
}

export interface User {
  email: string;
  name: string;
}

export interface TranslationCache {
  [key: string]: string;
}
