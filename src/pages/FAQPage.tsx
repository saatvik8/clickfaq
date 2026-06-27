import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, X, ChevronDown, ChevronUp, Star, BarChart3 } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { FAQCard } from '../components/faq/FAQCard';
import { CategoryFilter } from '../components/faq/CategoryFilter';
import { UnansweredSection } from '../components/faq/UnansweredSection';
import { HeatmapLegend } from '../components/faq/HeatmapLegend';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useLanguage } from '../contexts/LanguageContext';
import { computeHeatmapLevels, logActivity } from '../services/engagement';
import { getBookmarks } from '../services/bookmarks';
import { AnalyticsDashboard } from '../components/faq/AnalyticsDashboard';
import { useTranslation } from "../hooks/useTranslation";
import faqData from '../data/faqs.json';
import { FAQ_TRANSLATIONS } from "../data/faqTranslations";
import type { FAQ, FAQDataset } from '../types';







const data = faqData as FAQDataset;

export default function FAQPage() {
  const { language, setIsTranslating, isTranslating } = useLanguage();
  const t = useTranslation();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [bookmarks, setBookmarks] = useState<string[]>(() => getBookmarks());
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

  const allFaqs = data.faqs as FAQ[];

  // Debounced search logging
  useEffect(() => {
    if (!search.trim() || search.length < 3) return;
    const timer = setTimeout(() => {
      logActivity('search', `Searched keywords: "${search}"`);
    }, 1000);
    return () => clearTimeout(timer);
  }, [search]);

  // Translate logging
  useEffect(() => {
    if (language !== 'en') {
      logActivity('translate', `Switched language to: ${language.toUpperCase()}`);
    }
  }, [language]);

  const filteredFaqs = useMemo(() => {
    let result = allFaqs;
    if (selectedCategory) {
      result = result.filter((f) => f.categoryId === selectedCategory);
    }
    if (showBookmarksOnly) {
      result = result.filter((f) => bookmarks.includes(f.id));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((f) => {
        const tr = translatedFAQ(f);
        return (
          f.question.toLowerCase().includes(q) ||
          f.answer.toLowerCase().includes(q) ||
          f.categoryName.toLowerCase().includes(q) ||
          tr.question.toLowerCase().includes(q) ||
          tr.answer.toLowerCase().includes(q)
        );
      });
    }
    return result;
  }, [allFaqs, selectedCategory, search, showBookmarksOnly, bookmarks]);
  
  const groupedFaqs = useMemo(() => {
  return data.categories.map((category) => ({
    ...category,
    faqs: filteredFaqs.filter(
      (faq) => faq.categoryId === category.id
    ),
  }));
 }, [filteredFaqs]);

  const translatedCategoryName = (category: any) => {
  if (language === "en") return category.name;

  return (
    FAQ_TRANSLATIONS[
      language as keyof typeof FAQ_TRANSLATIONS
    ]?.categories?.[category.id] ?? category.name
  );
};

  const translatedFAQ = (faq: FAQ) => {
  if (language === "en") {
    return {
      question: faq.question,
      answer: faq.answer,
    };
  }
  const translation =
    FAQ_TRANSLATIONS[
      language as keyof typeof FAQ_TRANSLATIONS
    ]?.faqs?.[faq.id];

  return {
    question: translation?.question ?? faq.question,
    answer: translation?.answer ?? faq.answer,
  };
}; 
 

  const heatmapLevels = useMemo(
    () => computeHeatmapLevels(allFaqs.map((f) => f.id)),
    [allFaqs, expandedIds]
  );

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        const faq = allFaqs.find((f) => f.id === id);
        if (faq) {
          logActivity('expand', `Read FAQ ${faq.number}: "${faq.question.substring(0, 45)}..."`);
        }
      }
      return next;
    });
  };

  const expandAll = () => setExpandedIds(new Set(filteredFaqs.map((f) => f.id)));
  const collapseAll = () => setExpandedIds(new Set());

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">
            {t.faqTitle}
          </h1>
          <p className="mt-2 text-sm text-white/40">
            Vicharanashala Internship — {data.totalCount} questions across{' '}
            {data.categories.length} categories
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="relative">
            <Search
              size={20}
              className="absolute top-1/2 left-4 -translate-y-1/2 text-white/30"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="glass h-14 w-full rounded-2xl pr-12 pl-12 text-white placeholder:text-white/25 focus:ring-2 focus:ring-white/20 focus:outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute top-1/2 right-4 -translate-y-1/2 text-white/30 hover:text-white"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </motion.div>

        {/* Categories */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          <CategoryFilter
            categories={data.categories}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </motion.div>

        {/* Controls */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <HeatmapLegend />
          <div className="flex gap-2">
            <button
              onClick={() => setIsAnalyticsOpen(true)}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-white/40 transition-colors border border-transparent hover:bg-white/5 hover:text-white cursor-pointer"
            >
              <BarChart3 size={14} /> {t.analytics}
            </button>
            <button
              onClick={() => setShowBookmarksOnly((prev) => !prev)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors border ${
                showBookmarksOnly
                  ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                  : 'text-white/40 border-transparent hover:bg-white/5 hover:text-white'
              }`}
            >
              <Star size={14} className={showBookmarksOnly ? 'fill-yellow-400' : ''} />
              {t.bookmarks} ({bookmarks.length})
            </button>
            <button
              onClick={expandAll}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-white/40 transition-colors hover:bg-white/5 hover:text-white"
            >
              <ChevronDown size={14} /> {t.expandAll}
            </button>
            <button
              onClick={collapseAll}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-white/40 transition-colors hover:bg-white/5 hover:text-white"
            >
              <ChevronUp size={14} /> {t.collapseAll}
            </button>
          </div>
        </div>

        {/* Translation loading */}
        {isTranslating && (
          <div className="mb-4 flex justify-center">
            <LoadingSpinner label={t.translatingContent} />
          </div>
        )}

        {/* Results count */}
        <p className="mb-4 text-sm text-white/30">
          {t.showing} {filteredFaqs.length} {t.questions}
          {search && ` for "${search}"`}
         </p>

        {/* FAQ List */}
        <div className="space-y-10">
  {groupedFaqs.map((category, index) => {
    if (category.faqs.length === 0) return null;

    return (
      <div key={category.id}>
        <h2 className="mb-4 text-2xl font-semibold text-white">
          {index + 1}. {translatedCategoryName(category)}
        </h2>

        <div className="space-y-3">
          {category.faqs.map((faq) => (
            <FAQCard
              key={faq.id}
              faq={faq}
              question={translatedFAQ(faq).question}
              answer={translatedFAQ(faq).answer}
              heatmapLevel={heatmapLevels[faq.id] ?? "green"}
              isExpanded={expandedIds.has(faq.id)}
              onToggle={() => toggleExpand(faq.id)}
              onBookmarkToggle={() => {
                setBookmarks(getBookmarks());
              }}
            />
          ))}
        </div>
      </div>
    );
  })}
        </div>

        {filteredFaqs.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-16 text-center"
          >
            <p className="text-lg text-white/40">{t.noResults}</p>
            <p className="mt-2 text-sm text-white/25">
              {t.tryDifferentSearch}
            </p>
          </motion.div>
        )}

        {/* Unanswered Section */}
        <div className="mt-12">
          <UnansweredSection searchQuery={search} />
        </div>
      </div>

      <AnalyticsDashboard
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        faqs={allFaqs}
        categories={data.categories}
        onSearchSelect={(word) => setSearch(word)}
      />
    </div>
  );
}
