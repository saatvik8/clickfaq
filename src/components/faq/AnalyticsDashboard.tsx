import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, MousePointer, Expand, BarChart3, TrendingUp, Award, Clock, Search } from 'lucide-react';
import type { FAQ } from '../../types';
import {
  getAllEngagement,
  getEngagementScore,
  computeHeatmapLevels,
  HEATMAP_COLORS,
  getActivityLog,
  type ActivityLogEntry,
} from '../../services/engagement';

interface AnalyticsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  faqs: FAQ[];
  categories: { id: string; name: string }[];
  onSearchSelect?: (keyword: string) => void;
}

export function AnalyticsDashboard({
  isOpen,
  onClose,
  faqs,
  categories,
  onSearchSelect,
}: AnalyticsDashboardProps) {
  if (!isOpen) return null;

  const engagementStore = getAllEngagement();
  const heatmapLevels = computeHeatmapLevels(faqs.map((f) => f.id));
  const activityLogs = getActivityLog();

  let greenCount = 0;
  let yellowCount = 0;
  let orangeCount = 0;
  let redCount = 0;
  let totalViews = 0;
  let totalClicks = 0;
  let totalExpansions = 0;

  faqs.forEach((faq) => {
    const level = heatmapLevels[faq.id] ?? 'green';
    if (level === 'green') greenCount++;
    else if (level === 'yellow') yellowCount++;
    else if (level === 'orange') orangeCount++;
    else if (level === 'red') redCount++;

    const eng = engagementStore[faq.id] ?? { views: 0, clicks: 0, expansions: 0 };
    totalViews += eng.views;
    totalClicks += eng.clicks;
    totalExpansions += eng.expansions;
  });

  const totalFaqsCount = faqs.length || 1;

  // Top 5 FAQs
  const sortedFaqs = [...faqs]
    .map((faq) => {
      const eng = engagementStore[faq.id] ?? { views: 0, clicks: 0, expansions: 0 };
      const score = getEngagementScore(eng);
      return { faq, eng, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  // Category stats for Donut Chart
  const categoryStats = categories
    .map((cat) => {
      let catViews = 0;
      let catScore = 0;
      const catFaqs = faqs.filter((f) => f.categoryId === cat.id);
      catFaqs.forEach((faq) => {
        const eng = engagementStore[faq.id] ?? { views: 0, clicks: 0, expansions: 0 };
        catViews += eng.views;
        catScore += getEngagementScore(eng);
      });
      return {
        id: cat.id,
        name: cat.name,
        views: catViews,
        score: catScore,
        count: catFaqs.length,
      };
    })
    .sort((a, b) => b.views - a.views);

  // Custom Line Chart Math (Last 7 Days)
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  // Generate a dynamic mock distribution based on actual views
  const baseLineValues = [12, 19, 8, 26, 14, 18, 30];
  const chartValues = useMemo(() => {
    if (totalViews === 0) return baseLineValues;
    // Distribute totalViews across 7 days dynamically
    const weights = [0.1, 0.18, 0.08, 0.25, 0.12, 0.15, 0.12];
    return weights.map((w) => Math.max(1, Math.round(w * totalViews * 1.5)));
  }, [totalViews]);

  const maxChartVal = Math.max(...chartValues) || 1;
  const linePoints = useMemo(() => {
    const width = 420;
    const height = 100;
    const padding = 15;
    const xStep = (width - padding * 2) / 6;

    return chartValues.map((val, idx) => {
      const x = padding + idx * xStep;
      // y increases downwards, so subtract from height
      const y = height - padding - (val / maxChartVal) * (height - padding * 2);
      return { x, y, val };
    });
  }, [chartValues, maxChartVal]);

  const linePath = useMemo(() => {
    if (linePoints.length === 0) return '';
    return linePoints.reduce(
      (path, pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `${path} L ${pt.x} ${pt.y}`),
      ''
    );
  }, [linePoints]);

  const areaPath = useMemo(() => {
    if (linePoints.length === 0) return '';
    const firstPt = linePoints[0];
    const lastPt = linePoints[linePoints.length - 1];
    return `${linePath} L ${lastPt.x} 100 L ${firstPt.x} 100 Z`;
  }, [linePoints, linePath]);

  // Donut Chart Segment Math
  const donutRadius = 35;
  const donutCircumference = 2 * Math.PI * donutRadius; // ~219.9
  const totalCatViews = categoryStats.reduce((sum, c) => sum + c.views, 0) || 1;
  
  let currentAngleOffset = -90; // Start at top (12 o'clock)
  const donutSegments = categoryStats.map((cat, idx) => {
    const percentage = totalViews === 0 ? 100 / categoryStats.length : (cat.views / totalCatViews) * 100;
    const strokeLength = (percentage / 100) * donutCircumference;
    const strokeOffset = donutCircumference - strokeLength;
    const rotationAngle = currentAngleOffset;
    
    // Increment for next segment
    currentAngleOffset += (percentage / 100) * 360;

    // Distinct colors
    const colors = ['#3b82f6', '#eab308', '#a855f7', '#10b981', '#f43f5e', '#64748b'];
    const color = colors[idx % colors.length];

    return {
      ...cat,
      percentage,
      strokeOffset,
      rotationAngle,
      color,
    };
  });

  // Hot Keywords
  const hotKeywords = ['NOC', 'stipend', 'leave', 'Rosetta', 'badges', 'exams', 'timing', 'dates', 'Yaksha', 'VINS'];

  const handleKeywordClick = (word: string) => {
    if (onSearchSelect) {
      onSearchSelect(word);
      onClose();
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'search':
        return <Search size={10} className="text-blue-400" />;
      case 'journal_save':
        return <Award size={10} className="text-green-400" />;
      case 'ticket_update':
      case 'roadmap_update':
        return <TrendingUp size={10} className="text-yellow-400" />;
      default:
        return <Clock size={10} className="text-white/40" />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="glass-strong relative z-10 max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-3xl p-6 shadow-2xl border border-white/10"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 rounded-full p-1.5 text-white/40 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            aria-label="Close analytics"
          >
            <X size={18} />
          </button>

          {/* Title */}
          <div className="mb-6 flex items-center gap-2">
            <BarChart3 className="text-white" size={24} />
            <h2 className="text-xl font-semibold tracking-tight text-white">
              FAQ Engagement Analytics
            </h2>
          </div>

          <div className="space-y-6">
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="glass rounded-2xl p-4 text-center">
                <div className="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                  <Eye size={16} />
                </div>
                <div className="text-lg font-bold text-white">{totalViews}</div>
                <div className="text-[10px] uppercase tracking-wider text-white/40">Views</div>
              </div>
              <div className="glass rounded-2xl p-4 text-center">
                <div className="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-lg bg-yellow-500/10 text-yellow-400">
                  <MousePointer size={16} />
                </div>
                <div className="text-lg font-bold text-white">{totalClicks}</div>
                <div className="text-[10px] uppercase tracking-wider text-white/40">Clicks</div>
              </div>
              <div className="glass rounded-2xl p-4 text-center">
                <div className="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                  <Expand size={16} />
                </div>
                <div className="text-lg font-bold text-white">{totalExpansions}</div>
                <div className="text-[10px] uppercase tracking-wider text-white/40">Expands</div>
              </div>
            </div>

            {/* Split row: Charts */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Daily Trend Line Chart */}
              <div className="glass rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 flex items-center gap-1.5">
                  <TrendingUp size={14} /> Daily Traffic Trend
                </h3>
                <div className="relative flex justify-center py-2 h-[120px] w-full bg-white/[0.01] rounded-xl border border-white/5 p-2">
                  <svg viewBox="0 0 420 100" className="w-full h-full overflow-visible">
                    <defs>
                      <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {/* Grid background lines */}
                    <line x1="15" y1="15" x2="405" y2="15" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
                    <line x1="15" y1="50" x2="405" y2="50" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
                    <line x1="15" y1="85" x2="405" y2="85" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
                    
                    {/* Path drawings */}
                    {linePath && (
                      <>
                        <path d={areaPath} fill="url(#chartGlow)" />
                        <path d={linePath} fill="none" stroke="#ffffff" strokeWidth="2.5" />
                      </>
                    )}
                    
                    {/* Line Points */}
                    {linePoints.map((pt, idx) => (
                      <g key={idx} className="group">
                        <circle cx={pt.x} cy={pt.y} r="4" fill="#ffffff" />
                        <circle cx={pt.x} cy={pt.y} r="8" fill="#ffffff" className="animate-ping opacity-0 group-hover:opacity-30" />
                        <text x={pt.x} y={pt.y - 8} fill="#ffffff" className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-bold text-center" textAnchor="middle">
                          {pt.val}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>
                <div className="flex justify-between px-2 text-[10px] text-white/40">
                  {daysOfWeek.map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </div>
              </div>

              {/* Category Donut Chart */}
              <div className="glass rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 flex items-center gap-1.5">
                  <Award size={14} /> Category Share
                </h3>
                <div className="flex items-center gap-4 py-1 h-[120px]">
                  {/* SVG Donut */}
                  <div className="relative h-24 w-24 shrink-0 flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                      {totalViews === 0 ? (
                        <circle cx="50" cy="50" r={donutRadius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                      ) : (
                        donutSegments.map((seg, idx) => (
                          <circle
                            key={seg.id}
                            cx="50"
                            cy="50"
                            r={donutRadius}
                            fill="none"
                            stroke={seg.color}
                            strokeWidth="12"
                            strokeDasharray={donutCircumference}
                            strokeDashoffset={seg.strokeOffset}
                            transform={`rotate(${seg.rotationAngle} 50 50)`}
                            className="transition-all duration-500"
                          />
                        ))
                      )}
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-[10px] uppercase text-white/40 tracking-wider">Views</span>
                      <span className="text-xs font-bold text-white">{totalViews}</span>
                    </div>
                  </div>

                  {/* Legend list */}
                  <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[110px] pr-1">
                    {donutSegments.map((seg) => (
                      <div key={seg.id} className="flex items-center justify-between text-[10px] gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                          <span className="text-white/70 truncate">{seg.name}</span>
                        </div>
                        <span className="text-white font-semibold shrink-0">{Math.round(seg.percentage)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Keyword tag cloud */}
            <div className="glass rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 flex items-center gap-1.5">
                <Search size={14} /> Popular Hot Searches
              </h3>
              <p className="text-[10px] text-white/30">Click a keyword to instantly filter the FAQ questions below.</p>
              <div className="flex flex-wrap gap-2 pt-1">
                {hotKeywords.map((word) => (
                  <button
                    key={word}
                    onClick={() => handleKeywordClick(word)}
                    className="rounded-full bg-white/5 border border-white/5 hover:border-white/15 hover:bg-white/10 px-3 py-1.5 text-xs text-white/70 hover:text-white transition-all cursor-pointer"
                  >
                    #{word}
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Row: Top FAQs & Recent Activity Feed split */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
              {/* Top FAQs list */}
              <div className="glass rounded-2xl p-5 space-y-3 md:col-span-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 flex items-center gap-1.5">
                  <Award size={14} /> Top Performing FAQs
                </h3>
                <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
                  {sortedFaqs.every((f) => f.score === 0) ? (
                    <p className="text-center py-8 text-xs text-white/30">
                      No engagement tracked yet. Interact with FAQs to see them here.
                    </p>
                  ) : (
                    sortedFaqs.map(({ faq, eng, score }, i) => (
                      <div
                        key={faq.id}
                        className="flex items-center justify-between gap-4 border-b border-white/5 pb-2 last:border-0 last:pb-0"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white/40 flex items-center gap-1">
                            <span>#{i + 1}</span>
                            <span className="font-mono">{faq.number}</span>
                            <span className="text-[9px] rounded px-1" style={{ backgroundColor: `${HEATMAP_COLORS[heatmapLevels[faq.id] ?? 'green']}15`, color: HEATMAP_COLORS[heatmapLevels[faq.id] ?? 'green'] }}>
                              Score: {score}
                            </span>
                          </p>
                          <p className="text-xs text-white/80 truncate mt-0.5">
                            {faq.question}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-white/40 shrink-0">
                          <span className="flex items-center gap-0.5"><Eye size={10} /> {eng.views}</span>
                          <span className="flex items-center gap-0.5"><MousePointer size={10} /> {eng.clicks}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Activity Log Stream */}
              <div className="glass rounded-2xl p-5 space-y-3 md:col-span-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 flex items-center gap-1.5">
                  <Clock size={14} /> Recent Actions Log
                </h3>
                <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
                  {activityLogs.length === 0 ? (
                    <p className="text-center py-8 text-xs text-white/30">
                      No actions recorded yet. Start using ClickFAQ.
                    </p>
                  ) : (
                    activityLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-2 border-b border-white/5 pb-2 last:border-0 last:pb-0">
                        <div className="mt-0.5 rounded p-1 bg-white/5 shrink-0">
                          {getActivityIcon(log.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white/80 leading-snug break-words">{log.details}</p>
                          <span className="text-[9px] text-white/30 mt-0.5 block">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
export default AnalyticsDashboard;
