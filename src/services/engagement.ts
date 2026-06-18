import type { FAQEngagement, HeatmapLevel } from '../types';
import { getItem, setItem } from './storage';

const ENGAGEMENT_KEY = 'engagement';

type EngagementStore = Record<string, FAQEngagement>;

function getStore(): EngagementStore {
  return getItem<EngagementStore>(ENGAGEMENT_KEY, {});
}

function saveStore(store: EngagementStore): void {
  setItem(ENGAGEMENT_KEY, store);
}

function ensureEntry(store: EngagementStore, faqId: string): FAQEngagement {
  if (!store[faqId]) {
    store[faqId] = { views: 0, clicks: 0, expansions: 0 };
  }
  return store[faqId];
}

export function trackView(faqId: string): FAQEngagement {
  const store = getStore();
  const entry = ensureEntry(store, faqId);
  entry.views += 1;
  saveStore(store);
  return entry;
}

export function trackClick(faqId: string): FAQEngagement {
  const store = getStore();
  const entry = ensureEntry(store, faqId);
  entry.clicks += 1;
  saveStore(store);
  return entry;
}

export function trackExpansion(faqId: string): FAQEngagement {
  const store = getStore();
  const entry = ensureEntry(store, faqId);
  entry.expansions += 1;
  saveStore(store);
  return entry;
}

export function getEngagement(faqId: string): FAQEngagement {
  const store = getStore();
  return store[faqId] ?? { views: 0, clicks: 0, expansions: 0 };
}

export function getAllEngagement(): EngagementStore {
  return getStore();
}

export function getEngagementScore(engagement: FAQEngagement): number {
  return engagement.views + engagement.clicks * 2 + engagement.expansions * 3;
}

export function computeHeatmapLevels(
  faqIds: string[]
): Record<string, HeatmapLevel> {
  const store = getStore();
  const scores = faqIds.map((id) => ({
    id,
    score: getEngagementScore(store[id] ?? { views: 0, clicks: 0, expansions: 0 }),
  }));

  if (scores.every((s) => s.score === 0)) {
    return Object.fromEntries(faqIds.map((id) => [id, 'green' as HeatmapLevel]));
  }

  const sorted = [...scores].sort((a, b) => a.score - b.score);
  const max = sorted[sorted.length - 1].score;
  const min = sorted[0].score;
  const range = max - min || 1;

  const result: Record<string, HeatmapLevel> = {};
  for (const { id, score } of scores) {
    const normalized = (score - min) / range;
    if (normalized < 0.25) result[id] = 'green';
    else if (normalized < 0.5) result[id] = 'yellow';
    else if (normalized < 0.75) result[id] = 'orange';
    else result[id] = 'red';
  }
  return result;
}

export const HEATMAP_COLORS: Record<HeatmapLevel, string> = {
  green: '#22c55e',
  yellow: '#eab308',
  orange: '#f97316',
  red: '#ef4444',
};

export interface ActivityLogEntry {
  id: string;
  type: string;
  details: string;
  timestamp: string;
}

const ACTIVITY_LOG_KEY = 'activity_log';

export function logActivity(type: string, details: string): void {
  try {
    const logs = getItem<ActivityLogEntry[]>(ACTIVITY_LOG_KEY, []);
    const newEntry: ActivityLogEntry = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      details,
      timestamp: new Date().toISOString(),
    };
    const updated = [newEntry, ...logs].slice(0, 20);
    setItem(ACTIVITY_LOG_KEY, updated);
  } catch (e) {
    console.error('Failed to log activity:', e);
  }
}

export function getActivityLog(): ActivityLogEntry[] {
  return getItem<ActivityLogEntry[]>(ACTIVITY_LOG_KEY, []);
}
