import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Ticket,
  Send,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  Search,
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { StarRating } from '../components/ui/StarRating';
import { submitTicket, submitFeedback, getTickets, updateTicketStatus } from '../services/tickets';
import { logActivity } from '../services/engagement';
import type { Ticket as TicketType } from '../types';

const TICKET_CATEGORIES = [
  'General Inquiry',
  'Technical Issue',
  'Account & Access',
  'Internship Process',
  'ViBe Platform',
  'NOC & Documentation',
  'Other',
];

const PRIORITIES = [
  { value: 'low' as const, label: 'Low' },
  { value: 'medium' as const, label: 'Medium' },
  { value: 'high' as const, label: 'High' },
  { value: 'urgent' as const, label: 'Urgent' },
];

const getPriorityStyles = (priority: 'low' | 'medium' | 'high' | 'urgent') => {
  switch (priority) {
    case 'low':
      return 'bg-white/5 text-white/60 border border-white/10';
    case 'medium':
      return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
    case 'high':
      return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
    case 'urgent':
      return 'bg-red-500/10 text-red-400 border border-red-500/20';
  }
};

const getStatusStyles = (status: 'open' | 'in-progress' | 'resolved') => {
  switch (status) {
    case 'open':
      return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    case 'in-progress':
      return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
    case 'resolved':
      return 'bg-green-500/10 text-green-400 border border-green-500/20';
  }
};

export default function TicketPage() {
  const [activeTab, setActiveTab] = useState<'submit' | 'history'>('submit');
  const [tickets, setTickets] = useState<TicketType[]>(() => getTickets());
  
  const [ticketForm, setTicketForm] = useState({
    name: '',
    email: '',
    category: TICKET_CATEGORIES[0],
    priority: 'medium' as const,
    description: '',
  });
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [wasHelpful, setWasHelpful] = useState<boolean | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Search & filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in-progress' | 'resolved'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'urgent'>('all');



  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTicketLoading(true);
    const ticket = submitTicket(ticketForm);
    setTicketId(ticket.id);
    logActivity('search', `Raised Ticket ${ticket.id} under category: ${ticket.category}`);
    setTickets(getTickets());
    setTicketLoading(false);
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitFeedback({
      rating,
      text: feedbackText,
      wasHelpful,
    });
    setFeedbackSubmitted(true);
  };

  const copyTicketId = () => {
    if (ticketId) {
      navigator.clipboard.writeText(ticketId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleUpdateStatus = (id: string, status: 'open' | 'in-progress' | 'resolved') => {
    updateTicketStatus(id, status);
    logActivity('ticket_update', `Support ticket ${id} marked as ${status}`);
    setTickets(getTickets());
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchesSearch =
        t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tickets, searchQuery, statusFilter, priorityFilter]);

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-medium tracking-tight">Support & Feedback</h1>
          <p className="mt-2 text-sm text-white/40">
            Submit support requests, track your ticket status, and review the FAQ experience.
          </p>
        </motion.div>

        {/* Support Ticket Section */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-strong mb-8 rounded-2xl p-6 sm:p-8"
        >
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
                <Ticket size={20} />
              </div>
              <div>
                <h2 className="text-lg font-medium">Support Ticket Service</h2>
                <p className="text-xs text-white/40">
                  Raise queries or manage pending requests.
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6 flex gap-4 border-b border-white/10 pb-px">
            <button
              onClick={() => setActiveTab('submit')}
              className={`pb-3 text-sm font-semibold transition-colors relative ${
                activeTab === 'submit' ? 'text-white' : 'text-white/40 hover:text-white'
              }`}
            >
              Raise Ticket
              {activeTab === 'submit' && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
                />
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab('history');
                setTickets(getTickets());
              }}
              className={`pb-3 text-sm font-semibold transition-colors relative flex items-center gap-1.5 ${
                activeTab === 'history' ? 'text-white' : 'text-white/40 hover:text-white'
              }`}
            >
              My Tickets
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60">
                {tickets.length}
              </span>
              {activeTab === 'history' && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
                />
              )}
            </button>
          </div>

          {activeTab === 'submit' ? (
            ticketId ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6"
              >
                <CheckCircle2 size={48} className="mx-auto mb-4 text-green-400" />
                <h3 className="text-xl font-medium">Ticket Created Successfully</h3>
                <p className="mt-2 text-sm text-white/50">
                  Save your ticket ID for future reference.
                </p>
                <div className="mt-4 inline-flex items-center gap-3 rounded-xl bg-brand-gray px-6 py-3">
                  <span className="font-mono text-lg font-semibold">{ticketId}</span>
                  <button
                    onClick={copyTicketId}
                    className="rounded-lg p-2 text-white/40 hover:bg-white/10 hover:text-white"
                  >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>
                <div>
                  <button
                    onClick={() => {
                      setTicketId(null);
                      setTicketForm({
                        name: '',
                        email: '',
                        category: TICKET_CATEGORIES[0],
                        priority: 'medium',
                        description: '',
                      });
                    }}
                    className="mt-6 text-sm text-white/40 underline hover:text-white"
                  >
                    Submit another ticket
                  </button>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleTicketSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Name" required>
                    <input
                      type="text"
                      required
                      value={ticketForm.name}
                      onChange={(e) =>
                        setTicketForm({ ...ticketForm, name: e.target.value })
                      }
                      placeholder="Your full name"
                      className="form-input"
                    />
                  </FormField>
                  <FormField label="Email" required>
                    <input
                      type="email"
                      required
                      value={ticketForm.email}
                      onChange={(e) =>
                        setTicketForm({ ...ticketForm, email: e.target.value })
                      }
                      placeholder="you@example.com"
                      className="form-input"
                    />
                  </FormField>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Category" required>
                    <select
                      value={ticketForm.category}
                      onChange={(e) =>
                        setTicketForm({ ...ticketForm, category: e.target.value })
                      }
                      className="form-input"
                    >
                      {TICKET_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Priority" required>
                    <select
                      value={ticketForm.priority}
                      onChange={(e) =>
                        setTicketForm({
                          ...ticketForm,
                          priority: e.target.value as typeof ticketForm.priority,
                        })
                      }
                      className="form-input"
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>

                <FormField label="Description" required>
                  <textarea
                    required
                    rows={5}
                    value={ticketForm.description}
                    onChange={(e) =>
                      setTicketForm({ ...ticketForm, description: e.target.value })
                    }
                    placeholder="Describe your issue in detail…"
                    className="form-input resize-none"
                  />
                </FormField>

                <button
                  type="submit"
                  disabled={ticketLoading}
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-white font-semibold text-black transition-all hover:bg-white/90 active:scale-[0.98] disabled:opacity-50"
                >
                  <Send size={18} />
                  {ticketLoading ? 'Submitting…' : 'Submit Ticket'}
                </button>
              </form>
            )
          ) : (
            <div className="space-y-6">
              {/* Search & Filter row */}
              <div className="space-y-3">
                <div className="relative">
                  <Search size={16} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tickets by ID, name, category, or content..."
                    className="form-input pl-10"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-white/40">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="form-input"
                    >
                      <option value="all">All Statuses</option>
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-white/40">Priority</label>
                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value as any)}
                      className="form-input"
                    >
                      <option value="all">All Priorities</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Tickets List */}
              <div className="space-y-4">
                {filteredTickets.length === 0 ? (
                  <div className="py-12 text-center text-white/30 text-sm">
                    No tickets found matching your filters.
                  </div>
                ) : (
                  filteredTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="glass rounded-xl border border-white/5 p-5 space-y-4 transition-all hover:border-white/10"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-semibold text-white">
                              {ticket.id}
                            </span>
                            <span className="text-xs text-white/30">•</span>
                            <span className="text-xs text-white/60">{ticket.category}</span>
                          </div>
                          <p className="mt-1 text-xs text-white/40">
                            Raised by {ticket.name} ({ticket.email}) on {new Date(ticket.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getPriorityStyles(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                          <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getStatusStyles(ticket.status)}`}>
                            {ticket.status}
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
                        {ticket.description}
                      </p>

                      {/* Simulated Responses */}
                      {ticket.status === 'in-progress' && (
                        <div className="rounded-lg bg-purple-500/5 border border-purple-500/10 p-4 space-y-1.5">
                          <p className="text-xs font-semibold text-purple-400 flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse"></span>
                            Support Response:
                          </p>
                          <p className="text-xs text-white/70 italic leading-relaxed">
                            "Hello {ticket.name}, our technical team has received this ticket and we are currently working on a resolution. We appreciate your patience."
                          </p>
                        </div>
                      )}

                      {ticket.status === 'resolved' && (
                        <div className="rounded-lg bg-green-500/5 border border-green-500/10 p-4 space-y-1.5">
                          <p className="text-xs font-semibold text-green-400 flex items-center gap-1.5">
                            <span>✓</span> Support Response:
                          </p>
                          <p className="text-xs text-white/70 italic leading-relaxed">
                            "Hi {ticket.name}, we have successfully resolved your query regarding '{ticket.category}'. If the issue persists, feel free to reopen this ticket."
                          </p>
                        </div>
                      )}

                      {/* Admin simulator controls */}
                      <div className="flex flex-wrap justify-between items-center gap-2 pt-3 border-t border-white/5">
                        <span className="text-[10px] font-medium text-white/20 uppercase tracking-wider">
                          Simulation Sandbox
                        </span>
                        <div className="flex gap-1.5">
                          {ticket.status === 'open' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(ticket.id, 'in-progress')}
                                className="rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white px-2.5 py-1 text-xs font-medium text-white/70 transition-colors cursor-pointer"
                              >
                                Work On
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(ticket.id, 'resolved')}
                                className="rounded-lg bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 px-2.5 py-1 text-xs font-medium text-green-400 transition-colors cursor-pointer"
                              >
                                Resolve
                              </button>
                            </>
                          )}
                          {ticket.status === 'in-progress' && (
                            <button
                              onClick={() => handleUpdateStatus(ticket.id, 'resolved')}
                              className="rounded-lg bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 px-2.5 py-1 text-xs font-medium text-green-400 transition-colors cursor-pointer"
                            >
                              Resolve
                            </button>
                          )}
                          {ticket.status === 'resolved' && (
                            <button
                              onClick={() => handleUpdateStatus(ticket.id, 'open')}
                              className="rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white px-2.5 py-1 text-xs font-medium text-white/60 transition-colors cursor-pointer"
                            >
                              Re-open
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </motion.section>

        {/* Feedback Section */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-strong rounded-2xl p-6 sm:p-8"
        >
          <h2 className="mb-1 text-lg font-medium">Feedback</h2>
          <p className="mb-6 text-sm text-white/40">
            Help us improve the FAQ experience.
          </p>

          {feedbackSubmitted ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <CheckCircle2 size={40} className="mx-auto mb-3 text-green-400" />
              <p className="text-white/60">Thank you for your feedback!</p>
            </motion.div>
          ) : (
            <form onSubmit={handleFeedbackSubmit} className="space-y-6">
              <div>
                <label className="mb-3 block text-sm font-medium text-white">
                  Overall Rating
                </label>
                <StarRating value={rating} onChange={setRating} />
              </div>

              <div>
                <label className="mb-3 block text-sm font-medium text-white">
                  Was this FAQ helpful?
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setWasHelpful(true)}
                    className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium transition-colors ${
                      wasHelpful === true
                        ? 'bg-green-500/20 text-green-400 ring-1 ring-green-500/30'
                        : 'bg-brand-gray text-white/50 hover:bg-white/5'
                    }`}
                  >
                    <ThumbsUp size={16} /> Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setWasHelpful(false)}
                    className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium transition-colors ${
                      wasHelpful === false
                        ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/30'
                        : 'bg-brand-gray text-white/50 hover:bg-white/5'
                    }`}
                  >
                    <ThumbsDown size={16} /> No
                  </button>
                </div>
              </div>

              <FormField label="Additional Feedback">
                <textarea
                  rows={4}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Tell us what we can improve…"
                  className="form-input resize-none"
                />
              </FormField>

              <button
                type="submit"
                className="h-12 w-full rounded-xl border border-white/10 bg-brand-gray font-medium text-white transition-all hover:bg-white/5 active:scale-[0.98]"
              >
                Submit Feedback
              </button>
            </form>
          )}
        </motion.section>
      </div>
    </div>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-white">
        {label}
        {required && <span className="text-red-400"> *</span>}
      </label>
      {children}
    </div>
  );
}
