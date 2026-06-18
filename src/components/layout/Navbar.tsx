import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Circle,
  Globe,
  HelpCircle,
  LogOut,
  MessageSquarePlus,
  Loader2,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage, LANGUAGES } from '../../contexts/LanguageContext';
import type { SupportedLanguage } from '../../types';

const NAV_ITEMS = [
  { path: '/faq', label: 'FAQ', icon: HelpCircle },
  { path: '/rosetta', label: 'Rosetta Journal', icon: BookOpen },
  { path: '/ticket', label: 'Raise Ticket', icon: MessageSquarePlus },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const { language, setLanguage, isTranslating } = useLanguage();
  const location = useLocation();

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 glass-strong border-b border-white/10"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/faq" className="flex items-center gap-2">
          <Circle className="fill-white text-white" size={20} />
          <span className="text-lg font-semibold tracking-tight">ClickFAQ</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          {isTranslating && (
            <div className="hidden items-center gap-1.5 text-xs text-white/40 sm:flex">
              <Loader2 size={14} className="animate-spin" />
              Translating…
            </div>
          )}

          <div className="relative flex items-center gap-2">
            <Globe size={16} className="text-white/40" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
              className="cursor-pointer appearance-none rounded-lg bg-brand-gray px-3 py-1.5 pr-8 text-sm text-white focus:ring-2 focus:ring-white/20 focus:outline-none"
              aria-label="Select language"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.nativeLabel}
                </option>
              ))}
            </select>
          </div>

          {user && (
            <div className="hidden items-center gap-3 sm:flex">
              <span className="text-sm text-white/40">{user.email}</span>
              <button
                onClick={logout}
                className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
                aria-label="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-1 border-t border-white/5 px-4 py-2 md:hidden">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium ${
                active ? 'bg-white/10 text-white' : 'text-white/50'
              }`}
            >
              <Icon size={14} />
              {label}
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
}
