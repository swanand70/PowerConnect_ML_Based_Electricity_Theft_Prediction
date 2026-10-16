import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PublicHeader } from '../components/layout/PublicHeader';
import { PublicFooter } from '../components/layout/PublicFooter';
import {
  Building2,
  Calendar,
  ArrowLeft,
  X,
  ShieldCheck,
  BarChart3,
  Lock,
  ChevronRight,
  FileText,
  Clock
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import type { BoardPostItem, AggregateEnforcementStats } from '../types';

export const BoardCommunicationPage: React.FC = () => {
  const { theme } = useTheme();
  const [posts, setPosts] = useState<BoardPostItem[]>([]);
  const [enforcementStats, setEnforcementStats] = useState<AggregateEnforcementStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedPost, setSelectedPost] = useState<BoardPostItem | null>(null);

  const isDark = theme === 'dark';

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getBoardPosts().catch(() => []),
      api.getEnforcementSummary().catch(() => null)
    ])
      .then(([postsData, statsData]) => {
        // Defensive client-side deduplication by unique content signature (title + category)
        const uniqueMap = new Map<string, BoardPostItem>();
        (postsData || []).forEach(p => {
          const signature = `${p.title.trim().toLowerCase()}-${p.category}`;
          if (!uniqueMap.has(signature)) {
            uniqueMap.set(signature, p);
          }
        });
        setPosts(Array.from(uniqueMap.values()));
        setEnforcementStats(statsData);
      })
      .finally(() => setLoading(false));
  }, []);

  const categories = [
    { id: 'ALL', label: 'All Notices' },
    { id: 'MAINTENANCE', label: 'Grid Maintenance' },
    { id: 'SCHEME', label: 'Consumer Scheme' },
    { id: 'ENERGY_SAVING', label: 'Energy Conservation' },
    { id: 'ENFORCEMENT_UPDATE', label: 'Enforcement & Anti-Theft' },
    { id: 'POLICY', label: 'Board Policy' },
    { id: 'ADVISORY', label: 'Public Advisory' }
  ];

  const filteredPosts = posts.filter(p => {
    if (selectedCategory === 'ALL') return true;
    return p.category === selectedCategory;
  });

  const formatCategory = (cat: string) => {
    switch (cat) {
      case 'MAINTENANCE':
        return 'Grid Maintenance';
      case 'SCHEME':
        return 'Consumer Scheme';
      case 'ENERGY_SAVING':
        return 'Energy Conservation';
      case 'ENFORCEMENT_UPDATE':
        return 'Enforcement & Anti-Theft';
      case 'POLICY':
        return 'Board Policy';
      case 'ADVISORY':
        return 'Public Advisory';
      default:
        return cat.replace('_', ' ');
    }
  };

  const getCategoryBadgeClass = (cat: string) => {
    if (isDark) {
      switch (cat) {
        case 'MAINTENANCE':
          return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
        case 'SCHEME':
          return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        case 'ENERGY_SAVING':
          return 'bg-[#8AA8FF]/10 text-[#8AA8FF] border-[#8AA8FF]/20';
        case 'ENFORCEMENT_UPDATE':
          return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        case 'POLICY':
          return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
        case 'ADVISORY':
          return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
        default:
          return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      }
    } else {
      switch (cat) {
        case 'MAINTENANCE':
          return 'bg-sky-50 text-sky-700 border-sky-200';
        case 'SCHEME':
          return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        case 'ENERGY_SAVING':
          return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'ENFORCEMENT_UPDATE':
          return 'bg-amber-50 text-amber-800 border-amber-200';
        case 'POLICY':
          return 'bg-purple-50 text-purple-700 border-purple-200';
        case 'ADVISORY':
          return 'bg-rose-50 text-rose-700 border-rose-200';
        default:
          return 'bg-slate-100 text-slate-700 border-slate-200';
      }
    }
  };

  const getNoticeRefCode = (post: BoardPostItem) => {
    const year = post.published_at ? new Date(post.published_at).getFullYear() : 2026;
    return `REF: SEB/CIR/${year}/${String(post.id).padStart(3, '0')}`;
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        isDark
          ? 'bg-[#0B0C0E] text-[#F3F4F5] selection:bg-[#8AA8FF]/20 selection:text-[#F3F4F5]'
          : 'bg-[#F8F9FA] text-[#0F141C] selection:bg-[#2B59FF]/20 selection:text-[#0F141C]'
      }`}
    >
      <PublicHeader />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 w-full space-y-8">
        {/* Navigation Breadcrumb */}
        <div
          className={`flex items-center space-x-2 text-xs ${
            isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'
          }`}
        >
          <Link
            to="/"
            className={`transition-colors flex items-center gap-1.5 ${
              isDark ? 'hover:text-[#F3F4F5]' : 'hover:text-[#0F141C]'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Public Gateway</span>
          </Link>
          <span>/</span>
          <span className={`font-semibold ${isDark ? 'text-[#F3F4F5]' : 'text-[#0F141C]'}`}>
            Official Notices & Circulars
          </span>
        </div>

        {/* Institutional Notice Board Header */}
        <div
          className={`rounded-2xl p-6 sm:p-8 border shadow-2xs transition-colors ${
            isDark ? 'bg-[#141619] border-[#292C32]' : 'bg-white border-[#E2E5E9]'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-inherit">
            <div>
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold tracking-wider uppercase mb-2.5 border ${
                  isDark
                    ? 'bg-[#0B0C0E] text-[#8AA8FF] border-[#292C32]'
                    : 'bg-blue-50 text-[#2B59FF] border-blue-200'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>STATE ELECTRICITY DISTRIBUTION BOARD • OFFICIAL DISPATCH</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Official Notices & Circulars
              </h1>
              <p
                className={`text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed ${
                  isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'
                }`}
              >
                Public advisories, electricity service announcements and official board communications.
              </p>
            </div>

            {/* Board Official Login CTA */}
            <div className="shrink-0 self-start md:self-auto">
              <Link
                to="/board-admin/login"
                className={`inline-flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-lg border transition-colors shadow-2xs cursor-pointer ${
                  isDark
                    ? 'bg-[#0B0C0E] hover:bg-[#1A1D21] text-[#F3F4F5] border-[#292C32] hover:border-[#3E434D]'
                    : 'bg-[#F8F9FA] hover:bg-[#F0F2F5] text-[#0F141C] border-[#E2E5E9] hover:border-[#CBD1D8]'
                }`}
              >
                <Lock className="w-3.5 h-3.5 text-purple-400" />
                <span>Board Administrator Sign-In</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </Link>
            </div>
          </div>

          {/* Category Filter Row */}
          <div className="pt-5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span
              className={`text-xs font-semibold mr-2 shrink-0 ${
                isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'
              }`}
            >
              Filter Category:
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat.id
                      ? isDark
                        ? 'bg-[#F3F4F5] border-[#F3F4F5] text-[#0B0C0E] font-semibold'
                        : 'bg-[#0F141C] border-[#0F141C] text-white font-semibold'
                      : isDark
                      ? 'bg-[#0B0C0E] border-[#292C32] text-[#9A9FA8] hover:text-[#F3F4F5] hover:border-[#3E434D]'
                      : 'bg-[#F8F9FA] border-[#E2E5E9] text-[#525866] hover:text-[#0F141C] hover:border-[#CBD1D8]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* =========================================================================
            INSTITUTIONAL NOTICE BOARD SURFACE
           ========================================================================= */}
        <section aria-label="Official Notice Board" className="space-y-3">
          <div
            className={`rounded-2xl border shadow-2xs overflow-hidden transition-colors ${
              isDark ? 'bg-[#141619] border-[#292C32]' : 'bg-white border-[#E2E5E9]'
            }`}
          >
            {/* Notice Board Toolbar Header */}
            <div
              className={`px-6 py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                isDark ? 'bg-[#0B0C0E]/70 border-[#292C32]' : 'bg-slate-50/70 border-[#E2E5E9]'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className={`w-4 h-4 ${isDark ? 'text-[#8AA8FF]' : 'text-[#2B59FF]'}`} />
                <span className="font-semibold tracking-tight">
                  Public Board Gazette & Circular Register
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`font-mono text-[11px] px-2 py-0.5 rounded-full border ${
                    isDark
                      ? 'bg-[#141619] border-[#292C32] text-[#9A9FA8]'
                      : 'bg-white border-slate-200 text-[#525866]'
                  }`}
                >
                  {filteredPosts.length} Notice{filteredPosts.length !== 1 ? 's' : ''} Listed
                </span>
                <span className="text-[11px] text-[#6E737D]">Official Gazette Series 2026-27</span>
              </div>
            </div>

            {/* Notice List Content */}
            {loading ? (
              <div className="p-16 text-center text-xs space-y-3">
                <div className="w-7 h-7 border-2 border-[#2B59FF] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className={isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}>
                  Loading official publications from state utility repository...
                </p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <Building2 className="w-10 h-10 opacity-30 mx-auto" />
                <h3 className="text-sm font-bold">No Notices in this Category</h3>
                <p
                  className={`text-xs max-w-sm mx-auto leading-relaxed ${
                    isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'
                  }`}
                >
                  There are no active public circulars filed under{' '}
                  <strong>
                    {categories.find(c => c.id === selectedCategory)?.label || selectedCategory}
                  </strong>{' '}
                  for the current distribution cycle.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('ALL')}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                      isDark
                        ? 'bg-[#0B0C0E] border-[#292C32] text-[#8AA8FF] hover:border-[#8AA8FF]/40'
                        : 'bg-slate-50 border-slate-200 text-[#2B59FF] hover:border-[#2B59FF]/40'
                    }`}
                  >
                    View All Published Notices
                  </button>
                </div>
              </div>
            ) : (
              <div
                className={`divide-y ${
                  isDark ? 'divide-[#202328]' : 'divide-[#E2E5E9]'
                }`}
              >
                {filteredPosts.map(post => (
                  <article
                    key={post.id}
                    className={`p-6 transition-colors ${
                      isDark ? 'hover:bg-[#181B1F]' : 'hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                      {/* Left: Category & Publication Date */}
                      <div className="w-full md:w-44 shrink-0 space-y-2">
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getCategoryBadgeClass(
                            post.category
                          )}`}
                        >
                          {formatCategory(post.category)}
                        </span>
                        <div
                          className={`flex items-center gap-1.5 text-xs font-medium ${
                            isDark ? 'text-[#9A9FA8]' : 'text-[#6E737D]'
                          }`}
                        >
                          <Calendar className="w-3.5 h-3.5 opacity-70" />
                          <span>
                            {new Date(post.published_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#6E737D]">
                          Authority: <span className={isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}>{post.author_name}</span>
                        </div>
                      </div>

                      {/* Centre: Title & Concise Summary */}
                      <div className="flex-1 space-y-2">
                        <h2 className="text-base sm:text-lg font-bold tracking-tight leading-snug">
                          {post.title}
                        </h2>
                        <p
                          className={`text-xs sm:text-sm leading-relaxed ${
                            isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'
                          }`}
                        >
                          {post.summary || post.content}
                        </p>
                        <div className="pt-1 flex flex-wrap items-center gap-3">
                          <span
                            className={`font-mono text-[11px] px-2 py-0.5 rounded border font-medium ${
                              isDark
                                ? 'bg-[#0B0C0E] border-[#292C32] text-[#8AA8FF]'
                                : 'bg-slate-100 border-slate-200 text-[#2B59FF]'
                            }`}
                          >
                            {getNoticeRefCode(post)}
                          </span>
                          <span className="text-[11px] text-[#6E737D] inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Public Dispatch Notice</span>
                          </span>
                        </div>
                      </div>

                      {/* Right: Read Notice Action */}
                      <div className="shrink-0 self-start md:self-center pt-2 md:pt-0">
                        <button
                          type="button"
                          onClick={() => setSelectedPost(post)}
                          className={`w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border transition-colors shadow-2xs cursor-pointer ${
                            isDark
                              ? 'bg-[#0B0C0E] hover:bg-[#1A1D21] text-[#F3F4F5] border-[#292C32] hover:border-[#8AA8FF]/40'
                              : 'bg-white hover:bg-slate-50 text-[#0F141C] border-[#E2E5E9] hover:border-[#2B59FF]/40'
                          }`}
                        >
                          <span>Read Notice</span>
                          <ChevronRight className="w-3.5 h-3.5 text-[#8AA8FF] dark:text-[#8AA8FF]" />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Verified Aggregate Enforcement Summary Card */}
        {enforcementStats && (
          <section aria-label="Audited Vigilance Statistics">
            <div
              className={`rounded-2xl p-6 sm:p-8 border shadow-2xs transition-colors space-y-5 ${
                isDark ? 'bg-[#141619] border-[#292C32]' : 'bg-white border-[#E2E5E9]'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-inherit">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                      isDark
                        ? 'bg-[#0B0C0E] border-[#292C32] text-emerald-400'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    }`}
                  >
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold tracking-tight">
                      Verified Anti-Theft Enforcement Outcomes
                    </h2>
                    <p className={`text-xs ${isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}`}>
                      Certified field intelligence and audit outcomes aggregated across monitored distribution feeders.
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 self-start sm:self-auto">
                  Audited Vigilance Data
                </span>
              </div>

              {/* 4 Stats Columns */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div
                  className={`p-4 rounded-xl border ${
                    isDark ? 'bg-[#0B0C0E] border-[#292C32]' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <span className={`text-[11px] block ${isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}`}>
                    Inspections Executed
                  </span>
                  <div className="text-xl sm:text-2xl font-bold mt-1 text-[#8AA8FF]">
                    {enforcementStats.total_inspections_completed}
                  </div>
                  <span className="text-[11px] text-[#6E737D]">Completed field visits</span>
                </div>

                <div
                  className={`p-4 rounded-xl border ${
                    isDark ? 'bg-[#0B0C0E] border-[#292C32]' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <span className={`text-[11px] block ${isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}`}>
                    Confirmed Theft Cases
                  </span>
                  <div className="text-xl sm:text-2xl font-bold mt-1 text-amber-400">
                    {enforcementStats.theft_confirmed_count}
                  </div>
                  <span className="text-[11px] text-[#6E737D]">Verified irregular draws</span>
                </div>

                <div
                  className={`p-4 rounded-xl border ${
                    isDark ? 'bg-[#0B0C0E] border-[#292C32]' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <span className={`text-[11px] block ${isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}`}>
                    Clean Installations
                  </span>
                  <div className="text-xl sm:text-2xl font-bold mt-1 text-emerald-400">
                    {enforcementStats.clean_inspections_count}
                  </div>
                  <span className="text-[11px] text-[#6E737D]">Certified normal meters</span>
                </div>

                <div
                  className={`p-4 rounded-xl border ${
                    isDark ? 'bg-[#0B0C0E] border-[#292C32]' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <span className={`text-[11px] block ${isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}`}>
                    Penalties Assessed
                  </span>
                  <div className="text-xl sm:text-2xl font-bold mt-1 text-purple-400">
                    ₹{enforcementStats.total_penalty_assessed_inr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                  <span className="text-[11px] text-[#6E737D]">Recovered revenue</span>
                </div>
              </div>

              {/* Privacy Guarantee Banner */}
              <div
                className={`p-3.5 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 ${
                  isDark ? 'bg-[#0B0C0E] border-[#292C32] text-[#9A9FA8]' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Strict Privacy Guarantee:</strong> Individual customer identifiers, predictive model scores, and inspection case dossiers remain strictly confidential under utility vigilance rules. Only certified aggregate figures are published.
                </span>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* =========================================================================
          NOTICE DOCUMENT READER MODAL
         ========================================================================= */}
      {selectedPost && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Official Circular Document"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
        >
          <div
            className={`border rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden p-6 sm:p-7 max-h-[85vh] flex flex-col ${
              isDark
                ? 'bg-[#141619] border-[#292C32] text-[#F3F4F5]'
                : 'bg-white border-[#E2E5E9] text-[#0F141C]'
            }`}
          >
            {/* Modal Header */}
            <div
              className={`flex items-start justify-between border-b pb-4 mb-5 ${
                isDark ? 'border-[#292C32]' : 'border-[#E2E5E9]'
              }`}
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getCategoryBadgeClass(
                      selectedPost.category
                    )}`}
                  >
                    {formatCategory(selectedPost.category)}
                  </span>
                  <span
                    className={`font-mono text-[11px] px-2 py-0.5 rounded border ${
                      isDark ? 'bg-[#0B0C0E] border-[#292C32] text-[#8AA8FF]' : 'bg-slate-50 border-slate-200 text-[#2B59FF]'
                    }`}
                  >
                    {getNoticeRefCode(selectedPost)}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                  {selectedPost.title}
                </h2>
                <div
                  className={`text-xs mt-1.5 flex flex-wrap items-center gap-3 ${
                    isDark ? 'text-[#9A9FA8]' : 'text-[#6E737D]'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      Published:{' '}
                      {new Date(selectedPost.published_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </span>
                  <span>•</span>
                  <span>Issuing Authority: <strong>{selectedPost.author_name}</strong></span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPost(null)}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer shrink-0 ${
                  isDark
                    ? 'border-[#292C32] bg-[#0B0C0E] text-[#9A9FA8] hover:text-[#F3F4F5]'
                    : 'border-[#E2E5E9] bg-slate-50 text-[#525866] hover:text-[#0F141C]'
                }`}
                aria-label="Close Notice"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div
              className={`flex-1 overflow-y-auto space-y-4 text-xs sm:text-sm leading-relaxed pr-2 ${
                isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'
              }`}
            >
              {/* Official Summary Callout */}
              <div
                className={`p-4 border rounded-xl text-xs font-medium leading-relaxed ${
                  isDark
                    ? 'bg-[#0B0C0E] border-[#292C32] text-[#F3F4F5]'
                    : 'bg-slate-50 border-slate-200 text-[#0F141C]'
                }`}
              >
                <span className="text-[11px] font-bold uppercase tracking-wider block text-[#8AA8FF] mb-1">
                  Summary Abstract
                </span>
                {selectedPost.summary}
              </div>

              {/* Full Content */}
              <div className="whitespace-pre-line leading-relaxed pt-1">
                {selectedPost.content}
              </div>
            </div>

            {/* Modal Footer */}
            <div
              className={`pt-4 mt-5 border-t flex items-center justify-between ${
                isDark ? 'border-[#292C32]' : 'border-[#E2E5E9]'
              }`}
            >
              <span className="text-[11px] text-[#6E737D]">
                Certified State Electricity Distribution Board Dispatch
              </span>
              <button
                type="button"
                onClick={() => setSelectedPost(null)}
                className={`text-xs font-semibold px-4 py-2 rounded-lg border transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-[#0B0C0E] hover:bg-[#1A1D21] text-[#F3F4F5] border-[#292C32] hover:border-[#3E434D]'
                    : 'bg-[#0F141C] hover:bg-black text-white border-transparent'
                }`}
              >
                Close Notice
              </button>
            </div>
          </div>
        </div>
      )}

      <PublicFooter />
    </div>
  );
};
