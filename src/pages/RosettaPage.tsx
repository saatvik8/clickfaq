import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Calendar, Award, Flame, Download, CheckCircle2, Save, Trash, CalendarRange } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { logActivity } from '../services/engagement';

interface JournalEntry {
  day: number;
  date: string;
  answers: string[];
}

const ROUTINES = [
  {
    name: '3-2-1 Reflection',
    description: 'Structure your learning by identifying three insights, two lingering questions, and one surprise.',
    prompts: [
      '3 key ideas or insights you engaged with today:',
      '2 questions that are still on your mind:',
      '1 surprise or eye-opening moment you experienced:',
    ],
  },
  {
    name: 'Muddy / Clear Reflection',
    description: 'Separate what is clear and sharp from what is still confusing or foggy, and plan your next step.',
    prompts: [
      'What concepts, tasks, or code are crystal clear to you now?',
      'What parts of today\'s work are still muddy or foggy?',
      'What is your immediate plan to clarify the muddy parts?',
    ],
  },
  {
    name: 'What? So What? Now What?',
    description: 'Reflect on what occurred, why it matters, and how it informs your next actions.',
    prompts: [
      'What happened today? (Describe facts, activities, and events)',
      'So what? (What is the significance, learning, or impact?)',
      'Now what? (What are your next steps or adjustments?)',
    ],
  },
  {
    name: 'Connect, Extend, Challenge',
    description: 'Connect new ideas to existing knowledge, extend your thinking, and identify challenges.',
    prompts: [
      'How does today\'s work connect to what you already knew?',
      'How did it extend or broaden your thinking in new directions?',
      'What is still challenging, puzzling, or frustrating to you?',
    ],
  },
  {
    name: 'Think, Puzzle, Explore',
    description: 'Reflect on what you think you know, what puzzles you, and how you will explore it.',
    prompts: [
      'What do you think you know or understand about your project now?',
      'What puzzles, questions, or doubts do you have about it?',
      'How can you explore, search, or find answers to those puzzles?',
    ],
  },
];

const ROUTINE_THEMES = [
  {
    accentColor: '#fbbf24', // Amber
    bgGradient: 'from-amber-500/10 to-yellow-600/5',
    borderGlow: 'rgba(251, 191, 36, 0.15)',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500/20',
  },
  {
    accentColor: '#34d399', // Emerald
    bgGradient: 'from-emerald-500/10 to-teal-600/5',
    borderGlow: 'rgba(52, 211, 153, 0.15)',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/20',
  },
  {
    accentColor: '#60a5fa', // Blue
    bgGradient: 'from-blue-500/10 to-indigo-600/5',
    borderGlow: 'rgba(96, 165, 250, 0.15)',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/20',
  },
  {
    accentColor: '#c084fc', // Purple
    bgGradient: 'from-purple-500/10 to-fuchsia-600/5',
    borderGlow: 'rgba(192, 132, 252, 0.15)',
    textColor: 'text-purple-400',
    borderColor: 'border-purple-500/20',
  },
  {
    accentColor: '#f43f5e', // Rose
    bgGradient: 'from-rose-500/10 to-pink-600/5',
    borderGlow: 'rgba(244, 63, 94, 0.15)',
    textColor: 'text-rose-400',
    borderColor: 'border-rose-500/20',
  },
];

const LOCAL_STORAGE_KEY = 'clickfaq_rosetta_entries';

export default function RosettaPage() {
  const [entries, setEntries] = useState<Record<number, JournalEntry>>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [selectedDay, setSelectedDay] = useState(1);
  const [editorAnswers, setEditorAnswers] = useState<string[]>(['', '', '']);
  const [editorDate, setEditorDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState<number | null>(null);

  // Rotate routines based on day
  const routine = useMemo(() => {
    const idx = (selectedDay - 1) % ROUTINES.length;
    return ROUTINES[idx];
  }, [selectedDay]);

  // Accent theme mapping
  const theme = useMemo(() => {
    const idx = (selectedDay - 1) % ROUTINE_THEMES.length;
    return ROUTINE_THEMES[idx];
  }, [selectedDay]);

  // Load selected entry when selectedDay changes
  useEffect(() => {
    const entry = entries[selectedDay];
    if (entry) {
      setEditorAnswers(entry.answers);
      setEditorDate(entry.date);
    } else {
      setEditorAnswers(['', '', '']);
      setEditorDate(new Date().toISOString().split('T')[0]);
    }
  }, [selectedDay, entries]);

  const saveEntry = () => {
    if (editorAnswers.every(a => !a.trim())) {
      alert('Please fill in at least one prompt before saving!');
      return;
    }

    const updated = {
      ...entries,
      [selectedDay]: {
        day: selectedDay,
        date: editorDate,
        answers: editorAnswers,
      },
    };

    setEntries(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

    // Track activity
    logActivity('journal_save', `Saved Rosetta Journal entry for Day ${selectedDay}`);

    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2000);
  };

  const deleteEntry = () => {
    if (!entries[selectedDay]) return;
    if (confirm(`Are you sure you want to clear your entry for Day ${selectedDay}?`)) {
      const updated = { ...entries };
      delete updated[selectedDay];
      setEntries(updated);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

      // Track activity
      logActivity('journal_save', `Cleared Rosetta Journal entry for Day ${selectedDay}`);
    }
  };

  // Stats calculation
  const completedCount = useMemo(() => Object.keys(entries).length, [entries]);
  const completionPercentage = Math.round((completedCount / 65) * 100);

  const streak = useMemo(() => {
    let currentStreak = 0;
    for (let day = 1; day <= 65; day++) {
      if (entries[day]) {
        currentStreak++;
      } else {
        break;
      }
    }
    return currentStreak;
  }, [entries]);

  // Export as Markdown
  const exportMarkdown = () => {
    const header = `# Rosetta Journal - Summership 2026\n`;
    const subheader = `Generated on: ${new Date().toLocaleDateString()}\nStreak: ${streak} Days | Total Completed: ${completedCount}/65\n\n---\n\n`;
    
    let content = '';
    for (let day = 1; day <= 65; day++) {
      const entry = entries[day];
      if (entry) {
        const rotIdx = (day - 1) % ROUTINES.length;
        const r = ROUTINES[rotIdx];
        content += `## Day ${day}: ${r.name}\n`;
        content += `*Date: ${entry.date}*\n\n`;
        r.prompts.forEach((p, idx) => {
          content += `### ${p}\n`;
          content += `${entry.answers[idx] || '_No response_'}\n\n`;
        });
        content += `---\n\n`;
      }
    }

    if (!content) {
      alert('You have not written any journal entries to export yet!');
      return;
    }

    const blob = new Blob([header + subheader + content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Rosetta_Journal_Day_${completedCount}_Summership.md`;
    link.click();
    URL.revokeObjectURL(url);

    // Track activity
    logActivity('journal_save', `Exported Rosetta Journal Markdown file`);
  };

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Title Block with futuristic header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col justify-between gap-6 sm:flex-row sm:items-center border-b border-white/5 pb-6"
        >
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white">
                <BookOpen size={20} />
              </span>
              <h1 className="text-3xl font-medium tracking-tight sm:text-4xl text-white">
                Rosetta Reflection Journal
              </h1>
            </div>
            <p className="mt-2.5 text-xs sm:text-sm text-white/40 max-w-xl leading-relaxed">
              Summership 2026 Journaling Platform. Build daily writing habits, articulate your struggles, and unlock self-learning milestones.
            </p>
          </div>
          <button
            onClick={exportMarkdown}
            className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-semibold text-black hover:bg-white/90 active:scale-95 transition-all cursor-pointer shadow-[0_4px_20px_rgba(255,255,255,0.05)] shrink-0"
          >
            <Download size={14} /> Export Journal (.md)
          </button>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass rounded-2xl p-5 flex items-center justify-between border border-white/5 hover:border-white/10 transition-colors"
          >
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-white/30">Completion Progress</p>
              <h3 className="text-2xl font-bold mt-1 text-white">{completedCount} <span className="text-xs text-white/30 font-medium">/ 65 Days</span></h3>
            </div>
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/15 flex items-center justify-center font-bold text-sm">
              {completionPercentage}%
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl p-5 flex items-center justify-between border border-white/5 hover:border-white/10 transition-colors"
          >
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-white/30">Reflection Streak</p>
              <h3 className="text-2xl font-bold mt-1 text-white">{streak} <span className="text-xs text-white/30 font-medium">Days</span></h3>
            </div>
            <div className="h-12 w-12 rounded-xl bg-yellow-500/10 text-yellow-400 border border-yellow-500/15 flex items-center justify-center">
              <Flame size={20} className={streak > 0 ? 'animate-bounce fill-yellow-400/20' : ''} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass rounded-2xl p-5 flex items-center justify-between border border-white/5 hover:border-white/10 transition-colors"
          >
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-white/30">Active Routine</p>
              <h3 className="text-sm font-semibold mt-1.5 text-white truncate max-w-[180px]">{routine.name}</h3>
            </div>
            <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/15 flex items-center justify-center">
              <Award size={20} />
            </div>
          </motion.div>
        </div>

        {/* Dashboard Grid and Editor Split */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Map Selection (Left Side) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-3xl p-6 border border-white/5 lg:col-span-5 flex flex-col justify-between space-y-6"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CalendarRange size={16} className="text-white/40" />
                <h2 className="text-sm font-semibold text-white">Journal Progress Map</h2>
              </div>
              <p className="text-[11px] text-white/40 mb-5">Select a day below to compose or update reflections.</p>
              
              {/* Grid map (13 cols of 5 rows) */}
              <div
                style={{ gridTemplateColumns: 'repeat(13, minmax(0, 1fr))' }}
                className="grid gap-1.5 p-2 bg-white/[0.01] rounded-2xl border border-white/5 shadow-inner"
              >
                {Array.from({ length: 65 }, (_, i) => {
                  const day = i + 1;
                  const hasSaved = !!entries[day];
                  const isSelected = selectedDay === day;
                  const routineIdx = (day - 1) % ROUTINE_THEMES.length;
                  const dayTheme = ROUTINE_THEMES[routineIdx];
                  
                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      title={`Day ${day}: ${ROUTINES[routineIdx].name} (${hasSaved ? 'Completed' : 'Empty'})`}
                      className={`relative aspect-square w-full rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center border hover:scale-105 active:scale-95 pb-1 ${
                        isSelected
                          ? 'bg-white text-black border-white ring-4 ring-white/10 scale-110 z-10 font-black'
                          : hasSaved
                          ? `bg-gradient-to-br from-green-500/10 to-green-600/30 text-green-300 border-green-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] hover:from-green-500/20`
                          : 'bg-white/[0.02] hover:bg-white/[0.08] text-white/30 border-white/5 hover:text-white'
                      }`}
                    >
                      {day}
                      <span
                        className="absolute bottom-1.5 h-1 w-1 rounded-full"
                        style={{
                          backgroundColor: isSelected
                            ? '#000000'
                            : hasSaved
                            ? '#22c55e'
                            : dayTheme.accentColor,
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="flex items-center gap-4 text-[10px]">
                <span className="flex items-center gap-1.5 text-white/40">
                  <span className="h-2.5 w-2.5 rounded bg-white/[0.02] border border-white/5 inline-block" /> Unsaved Day
                </span>
                <span className="flex items-center gap-1.5 text-green-400">
                  <span className="h-2.5 w-2.5 rounded bg-gradient-to-br from-green-500/15 to-green-600/30 border border-green-500/20 inline-block" /> Completed Day
                </span>
              </div>
              <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-4 text-[11px] text-white/50 leading-relaxed">
                🔥 **Reflection Streak Guidelines:** Your streak increments when consecutive days starting from Day 1 are saved. Ensure you reflect daily to lock in your habits.
              </div>
            </div>
          </motion.div>

          {/* Interactive Dynamic Editor (Right Side) */}
          <motion.div
            animate={{ 
              borderColor: theme.accentColor + '25',
              boxShadow: `0 10px 40px -15px ${theme.borderGlow}`,
            }}
            transition={{ duration: 0.3 }}
            className="glass-strong rounded-3xl p-6 sm:p-8 border lg:col-span-7 flex flex-col justify-between"
            style={{ 
              borderColor: theme.accentColor + '15',
              boxShadow: `0 10px 40px -15px ${theme.borderGlow}`
            }}
          >
            {/* Slide transition wrapper for day-specific values */}
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedDay}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col justify-between"
              >
                <div>
                  {/* Editor Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-4 mb-5">
                    <div>
                      <span className={`text-[10px] uppercase font-bold tracking-wider ${theme.textColor}`}>
                        Day {selectedDay} Routine
                      </span>
                      <h2 className="text-xl font-bold mt-0.5 text-white flex items-center gap-2">
                        {routine.name}
                      </h2>
                    </div>
                    
                    {/* Date Picker */}
                    <div className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl px-3.5 py-2">
                      <Calendar size={13} className="text-white/40" />
                      <input
                        type="date"
                        value={editorDate}
                        onChange={(e) => setEditorDate(e.target.value)}
                        className="bg-transparent text-xs text-white outline-none border-none cursor-pointer focus:ring-0"
                        aria-label="Reflection date"
                      />
                    </div>
                  </div>

                  {/* Routine Context Guide */}
                  <div className="text-xs text-white/50 leading-relaxed mb-6 italic bg-white/[0.01] border border-white/5 p-4 rounded-2xl relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b" style={{ backgroundColor: theme.accentColor }} />
                    <p className="pl-2">{routine.description}</p>
                  </div>

                  {/* Dynamic Fields */}
                  <div className="space-y-5">
                    {routine.prompts.map((prompt, idx) => {
                      const isFocused = focusedIdx === idx;
                      return (
                        <div key={idx} className="space-y-2">
                          <label className="text-[11px] font-semibold text-white/70 block transition-colors duration-200" style={isFocused ? { color: theme.accentColor } : {}}>
                            {prompt}
                          </label>
                          <textarea
                            value={editorAnswers[idx] || ''}
                            onChange={(e) => {
                              const newAnswers = [...editorAnswers];
                              newAnswers[idx] = e.target.value;
                              setEditorAnswers(newAnswers);
                            }}
                            onFocus={() => setFocusedIdx(idx)}
                            onBlur={() => setFocusedIdx(null)}
                            placeholder="Describe your thoughts honestly..."
                            rows={3}
                            className="form-input resize-none bg-white/[0.01] border border-white/5 focus:bg-white/[0.03] h-auto py-3 px-4 rounded-xl text-xs leading-relaxed transition-all duration-200"
                            style={isFocused ? { 
                              borderColor: theme.accentColor + '40', 
                              boxShadow: `0 0 0 3px ${theme.accentColor}18` 
                            } : {}}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-8 pt-5 border-t border-white/5 flex items-center justify-between gap-4">
                  {entries[selectedDay] ? (
                    <button
                      onClick={deleteEntry}
                      className="flex items-center gap-1.5 text-xs text-red-400/80 hover:text-red-400 font-semibold px-3 py-2.5 rounded-xl hover:bg-red-500/5 transition-all cursor-pointer"
                    >
                      <Trash size={14} /> Clear Reflection
                    </button>
                  ) : (
                    <div />
                  )}
                  
                  <button
                    onClick={saveEntry}
                    className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-semibold text-black hover:bg-white/90 active:scale-95 transition-all cursor-pointer shadow-[0_4px_16px_rgba(255,255,255,0.05)] font-bold"
                  >
                    <Save size={14} /> Save Day {selectedDay} Entry
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Floating Save Toast */}
      <AnimatePresence>
        {showSavedToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 glass-strong border border-green-500/20 px-5 py-3 rounded-full flex items-center gap-2 shadow-2xl text-green-400 font-medium text-xs bg-black"
          >
            <CheckCircle2 size={16} /> Day {selectedDay} Reflection Saved!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
