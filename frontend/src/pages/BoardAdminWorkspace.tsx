import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  FileText,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  Send,
  LogOut,
  Sun,
  Moon,
  ExternalLink,
  ShieldCheck,
  Clock,
  MessageSquare,
  BarChart3,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import type {
  BoardPostAdminItem,
  ConsumerIssueItem,
  AggregateEnforcementStats
} from '../types';

export const BoardAdminWorkspace: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  // Tab State
  const [activeTab, setActiveTab] = useState<'manage' | 'create' | 'issues' | 'enforcement'>('manage');

  // Data States
  const [posts, setPosts] = useState<BoardPostAdminItem[]>([]);
  const [issues, setIssues] = useState<ConsumerIssueItem[]>([]);
  const [enforcementStats, setEnforcementStats] = useState<AggregateEnforcementStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter State
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Create Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('POLICY');
  const [newSummary, setNewSummary] = useState('');
  const [newContent, setNewContent] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createMessage, setCreateMessage] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit Modal State
  const [editingPost, setEditingPost] = useState<BoardPostAdminItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editIsPublished, setEditIsPublished] = useState(true);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Preview Modal State
  const [previewPost, setPreviewPost] = useState<BoardPostAdminItem | null>(null);

  // Respond Issue Modal State
  const [respondingIssue, setRespondingIssue] = useState<ConsumerIssueItem | null>(null);
  const [responseStatus, setResponseStatus] = useState<string>('RESOLVED');
  const [responseNotes, setResponseNotes] = useState<string>('');
  const [responseSubmitting, setResponseSubmitting] = useState(false);

  // Fetch all board admin data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [postsData, issuesData, statsData] = await Promise.all([
        api.getAdminBoardPosts().catch(() => []),
        api.getAdminIssues().catch(() => []),
        api.getEnforcementSummary().catch(() => null)
      ]);
      setPosts(postsData || []);
      setIssues(issuesData || []);
      setEnforcementStats(statsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load board administrator data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Create Post
  const handleCreatePost = async (publishImmediately: boolean) => {
    if (!newTitle.trim() || !newSummary.trim() || !newContent.trim()) {
      setCreateError('Please complete all required fields (Title, Summary, and Content).');
      return;
    }

    setCreateSubmitting(true);
    setCreateError(null);
    setCreateMessage(null);

    try {
      const created = await api.createBoardPost({
        title: newTitle.trim(),
        category: newCategory,
        summary: newSummary.trim(),
        content: newContent.trim(),
        is_published: publishImmediately
      });

      setPosts(prev => [created, ...prev]);
      setCreateMessage(
        publishImmediately
          ? `Announcement "${created.title}" published successfully!`
          : `Draft "${created.title}" saved successfully.`
      );
      setNewTitle('');
      setNewSummary('');
      setNewContent('');
      setNewCategory('POLICY');
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create announcement.');
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (p: BoardPostAdminItem) => {
    setEditingPost(p);
    setEditTitle(p.title);
    setEditCategory(p.category);
    setEditSummary(p.summary);
    setEditContent(p.content);
    setEditIsPublished(p.is_published);
  };

  // Submit Edit Post
  const handleUpdatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;

    setEditSubmitting(true);
    try {
      const updated = await api.updateBoardPost(editingPost.id, {
        title: editTitle.trim(),
        category: editCategory,
        summary: editSummary.trim(),
        content: editContent.trim(),
        is_published: editIsPublished
      });

      setPosts(prev => prev.map(p => (p.id === updated.id ? updated : p)));
      setEditingPost(null);
    } catch (err: any) {
      alert(`Update failed: ${err.message || 'Unknown error'}`);
    } finally {
      setEditSubmitting(false);
    }
  };

  // Toggle Publication
  const handleTogglePublish = async (post: BoardPostAdminItem) => {
    try {
      const updated = await api.updateBoardPost(post.id, {
        is_published: !post.is_published
      });
      setPosts(prev => prev.map(p => (p.id === updated.id ? updated : p)));
    } catch (err: any) {
      alert(`Status toggle failed: ${err.message || 'Unknown error'}`);
    }
  };

  // Delete Post
  const handleDeletePost = async (postId: number) => {
    if (!window.confirm('Are you sure you want to permanently withdraw/delete this announcement?')) {
      return;
    }
    try {
      await api.deleteBoardPost(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err: any) {
      alert(`Deletion failed: ${err.message || 'Unknown error'}`);
    }
  };

  // Submit Issue Response
  const handleRespondToIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!respondingIssue) return;
    if (!responseNotes.trim()) {
      alert('Please provide official response notes.');
      return;
    }

    setResponseSubmitting(true);
    try {
      await api.respondToIssue(respondingIssue.id, {
        status: responseStatus,
        response_notes: responseNotes.trim()
      });

      setIssues(prev =>
        prev.map(item =>
          item.id === respondingIssue.id
            ? {
                ...item,
                status: responseStatus as any,
                response_notes: responseNotes.trim(),
                resolved_at: new Date().toISOString()
              }
            : item
        )
      );
      setRespondingIssue(null);
      setResponseNotes('');
    } catch (err: any) {
      alert(`Failed to record response: ${err.message || 'Unknown error'}`);
    } finally {
      setResponseSubmitting(false);
    }
  };

  // Filtered posts
  const filteredPosts = posts.filter(p => {
    if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;
    if (statusFilter === 'PUBLISHED' && !p.is_published) return false;
    if (statusFilter === 'DRAFT' && p.is_published) return false;
    return true;
  });

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center font-sans ${
          isDark ? 'bg-[#0B0C0E] text-[#F3F4F5]' : 'bg-[#F8F9FA] text-[#0F141C]'
        }`}
      >
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className={`text-xs font-medium ${isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}`}>
            Loading board communications & grievances...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        isDark
          ? 'bg-[#0B0C0E] text-[#F3F4F5] selection:bg-[#8AA8FF]/20 selection:text-[#F3F4F5]'
          : 'bg-[#F8F9FA] text-[#0F141C] selection:bg-[#2B59FF]/20 selection:text-[#0F141C]'
      }`}
    >
      {/* 1. Header */}
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors ${
          isDark
            ? 'bg-[#0B0C0E]/90 border-[#292C32]'
            : 'bg-[#F8F9FA]/90 border-[#E2E5E9]'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <div
                className={`w-8 h-8 rounded-lg border flex items-center justify-center shadow-xs transition-colors ${
                  isDark
                    ? 'border-[#292C32] bg-[#141619] text-purple-400'
                    : 'border-[#E2E5E9] bg-white text-purple-700'
                }`}
              >
                <Building2 className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm tracking-tight">PowerConnect</span>
            </Link>
            <span className={`text-xs ${isDark ? 'text-[#6E737D]' : 'text-slate-300'}`}>|</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Board Communication Administration
            </span>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold">{user?.username || 'board_admin'}</span>
              <span className={`text-[11px] ${isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}`}>
                Official Author
              </span>
            </div>

            <Link
              to="/board-communication"
              target="_blank"
              className={`hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                isDark
                  ? 'border-[#292C32] hover:bg-[#141619] text-[#9A9FA8] hover:text-[#F3F4F5]'
                  : 'border-[#E2E5E9] hover:bg-white text-[#525866] hover:text-[#0F141C]'
              }`}
            >
              <span>Public Feed</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={toggleTheme}
              className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                isDark
                  ? 'border-[#292C32] hover:bg-[#141619] text-[#9A9FA8] hover:text-[#F3F4F5]'
                  : 'border-[#E2E5E9] hover:bg-white text-[#525866] hover:text-[#0F141C]'
              }`}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            <button
              type="button"
              onClick={logout}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                isDark
                  ? 'border-[#292C32] hover:bg-[#141619] text-[#9A9FA8] hover:text-red-400'
                  : 'border-[#E2E5E9] hover:bg-white text-[#525866] hover:text-red-600'
              }`}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto gap-2 border-t border-transparent scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('manage')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'manage'
                ? isDark
                  ? 'border-purple-400 text-[#F3F4F5]'
                  : 'border-purple-600 text-[#0F141C]'
                : isDark
                ? 'border-transparent text-[#9A9FA8] hover:text-[#F3F4F5]'
                : 'border-transparent text-[#525866] hover:text-[#0F141C]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Manage Posts ({posts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'create'
                ? isDark
                  ? 'border-purple-400 text-[#F3F4F5]'
                  : 'border-purple-600 text-[#0F141C]'
                : isDark
                ? 'border-transparent text-[#9A9FA8] hover:text-[#F3F4F5]'
                : 'border-transparent text-[#525866] hover:text-[#0F141C]'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create Announcement</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('issues')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'issues'
                ? isDark
                  ? 'border-purple-400 text-[#F3F4F5]'
                  : 'border-purple-600 text-[#0F141C]'
                : isDark
                ? 'border-transparent text-[#9A9FA8] hover:text-[#F3F4F5]'
                : 'border-transparent text-[#525866] hover:text-[#0F141C]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Consumer Grievances ({issues.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('enforcement')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'enforcement'
                ? isDark
                  ? 'border-purple-400 text-[#F3F4F5]'
                  : 'border-purple-600 text-[#0F141C]'
                : isDark
                ? 'border-transparent text-[#9A9FA8] hover:text-[#F3F4F5]'
                : 'border-transparent text-[#525866] hover:text-[#0F141C]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Enforcement Totals</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        {error && (
          <div
            className="p-4 rounded-xl border text-xs flex items-start gap-3 bg-red-500/10 border-red-500/30 text-red-400"
            role="alert"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* =========================================================================
            TAB 1: MANAGE POSTS (PUBLISHED & DRAFTS)
           ========================================================================= */}
        {activeTab === 'manage' && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <div
              className={`p-4 rounded-xl border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 ${
                isDark ? 'bg-[#141619] border-[#292C32]' : 'bg-white border-[#E2E5E9]'
              }`}
            >
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold ${isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}`}>
                    Category:
                  </span>
                  <select
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs border ${
                      isDark ? 'bg-[#0B0C0E] border-[#292C32] text-[#F3F4F5]' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="ALL">All Categories</option>
                    <option value="POLICY">Policy</option>
                    <option value="SCHEME">Scheme</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="ADVISORY">Advisory</option>
                    <option value="ENERGY_SAVING">Energy Saving</option>
                    <option value="ENFORCEMENT_UPDATE">Enforcement Update</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold ${isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}`}>
                    Status:
                  </span>
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs border ${
                      isDark ? 'bg-[#0B0C0E] border-[#292C32] text-[#F3F4F5]' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="PUBLISHED">Published Only</option>
                    <option value="DRAFT">Drafts Only</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('create')}
                className="inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>New Announcement</span>
              </button>
            </div>

            {/* Posts List / Table */}
            <div
              className={`rounded-xl border overflow-hidden ${
                isDark ? 'bg-[#141619] border-[#292C32]' : 'bg-white border-[#E2E5E9]'
              }`}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className={isDark ? 'bg-[#0B0C0E] text-[#9A9FA8]' : 'bg-slate-50 text-[#525866]'}>
                    <tr>
                      <th className="py-3.5 px-4 font-semibold">Title & Category</th>
                      <th className="py-3.5 px-4 font-semibold">Author</th>
                      <th className="py-3.5 px-4 font-semibold">Status</th>
                      <th className="py-3.5 px-4 font-semibold">Published Date</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-inherit">
                    {filteredPosts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-xs text-[#9A9FA8]">
                          No announcements match the selected filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredPosts.map((post) => (
                        <tr
                          key={post.id}
                          className={`transition-colors ${
                            isDark ? 'hover:bg-[#1A1D21]' : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="py-3.5 px-4 max-w-sm">
                            <div className="font-semibold text-sm line-clamp-1">{post.title}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400">
                                {post.category.replace('_', ' ')}
                              </span>
                              <span className={`text-[11px] line-clamp-1 ${isDark ? 'text-[#9A9FA8]' : 'text-[#6E737D]'}`}>
                                {post.summary}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-[#6E737D] font-mono">
                            {post.author_name}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                post.is_published
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}
                            >
                              {post.is_published ? 'Published' : 'Draft'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-[#6E737D]">
                            {new Date(post.published_at).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setPreviewPost(post)}
                                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                                  isDark ? 'hover:bg-[#292C32] text-[#9A9FA8]' : 'hover:bg-slate-200 text-[#525866]'
                                }`}
                                title="Preview Announcement"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditModal(post)}
                                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                                  isDark ? 'hover:bg-[#292C32] text-blue-400' : 'hover:bg-slate-200 text-blue-600'
                                }`}
                                title="Edit Post"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleTogglePublish(post)}
                                className={`p-1.5 rounded-md transition-colors cursor-pointer text-[10px] font-semibold border ${
                                  post.is_published
                                    ? 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10'
                                    : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                                }`}
                                title={post.is_published ? 'Unpublish to Draft' : 'Publish Announcement'}
                              >
                                {post.is_published ? 'Withdraw' : 'Publish'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePost(post.id)}
                                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                                  isDark ? 'hover:bg-[#292C32] text-red-400' : 'hover:bg-slate-200 text-red-600'
                                }`}
                                title="Delete Announcement"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: CREATE ANNOUNCEMENT / DRAFT
           ========================================================================= */}
        {activeTab === 'create' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form Box */}
            <div
              className={`p-6 rounded-xl border space-y-4 ${
                isDark ? 'bg-[#141619] border-[#292C32]' : 'bg-white border-[#E2E5E9]'
              }`}
            >
              <div>
                <h3 className="text-base font-bold tracking-tight">Draft or Publish Official Notice</h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}`}>
                  Announce schemes, grid maintenance windows, policies, or anti-theft enforcement summaries.
                </p>
              </div>

              {createMessage && (
                <div
                  className="p-3.5 rounded-lg border text-xs flex items-start gap-2 bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  role="status"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{createMessage}</span>
                </div>
              )}

              {createError && (
                <div
                  className="p-3.5 rounded-lg border text-xs flex items-start gap-2 bg-red-500/10 border-red-500/30 text-red-400"
                  role="alert"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{createError}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    Announcement Headline / Title *
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    required
                    disabled={createSubmitting}
                    placeholder="e.g. Voluntary Load Regularization Scheme 2026"
                    className={`w-full rounded-lg px-3 py-2 text-xs transition-colors focus:outline-hidden border ${
                      isDark
                        ? 'bg-[#0B0C0E] border-[#292C32] text-[#F3F4F5] focus:border-purple-400'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    Category *
                  </label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    disabled={createSubmitting}
                    className={`w-full rounded-lg px-3 py-2 text-xs transition-colors focus:outline-hidden border ${
                      isDark
                        ? 'bg-[#0B0C0E] border-[#292C32] text-[#F3F4F5] focus:border-purple-400'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                    }`}
                  >
                    <option value="POLICY">Board Policy & Regulatory Orders</option>
                    <option value="SCHEME">Consumer Programs & Schemes</option>
                    <option value="MAINTENANCE">Scheduled Grid Maintenance & Outages</option>
                    <option value="ADVISORY">Public Advisories & Safety</option>
                    <option value="ENERGY_SAVING">Energy Conservation & Efficiency</option>
                    <option value="ENFORCEMENT_UPDATE">Anti-Theft Enforcement Updates</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    Executive Summary / Teaser *
                  </label>
                  <textarea
                    rows={2}
                    value={newSummary}
                    onChange={e => setNewSummary(e.target.value)}
                    required
                    disabled={createSubmitting}
                    placeholder="Concise 1-2 sentence overview shown in public feeds..."
                    className={`w-full rounded-lg px-3 py-2 text-xs transition-colors focus:outline-hidden border ${
                      isDark
                        ? 'bg-[#0B0C0E] border-[#292C32] text-[#F3F4F5] focus:border-purple-400'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    Detailed Announcement Content *
                  </label>
                  <textarea
                    rows={6}
                    value={newContent}
                    onChange={e => setNewContent(e.target.value)}
                    required
                    disabled={createSubmitting}
                    placeholder="Full notice text, terms, effective dates, sub-station schedules, and helpline contacts..."
                    className={`w-full rounded-lg px-3 py-2 text-xs transition-colors focus:outline-hidden border ${
                      isDark
                        ? 'bg-[#0B0C0E] border-[#292C32] text-[#F3F4F5] focus:border-purple-400'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                    }`}
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    disabled={createSubmitting}
                    onClick={() => handleCreatePost(true)}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold py-2.5 px-4 rounded-lg transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Publish Announcement Now</span>
                  </button>

                  <button
                    type="button"
                    disabled={createSubmitting}
                    onClick={() => handleCreatePost(false)}
                    className={`inline-flex items-center justify-center gap-2 text-xs font-semibold py-2.5 px-4 rounded-lg border transition-colors disabled:opacity-50 cursor-pointer ${
                      isDark
                        ? 'border-[#292C32] hover:bg-[#1A1D21] text-[#9A9FA8]'
                        : 'border-[#E2E5E9] hover:bg-slate-100 text-[#525866]'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Save as Draft</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Live Preview Card */}
            <div
              className={`p-6 rounded-xl border flex flex-col justify-between ${
                isDark ? 'bg-[#141619] border-[#292C32]' : 'bg-white border-[#E2E5E9]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-inherit mb-4">
                  <span className="text-xs font-bold tracking-wider uppercase text-purple-400 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Live Typography Preview</span>
                  </span>
                  <span className="text-[11px] text-[#6E737D]">Simulated Public View</span>
                </div>

                <div
                  className={`p-5 rounded-lg border space-y-3 ${
                    isDark ? 'bg-[#0B0C0E] border-[#292C32]' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400">
                    {newCategory.replace('_', ' ')}
                  </span>
                  <h4 className="text-base font-bold">
                    {newTitle || 'Headline Title Preview'}
                  </h4>
                  <p className={`text-xs italic leading-relaxed ${isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}`}>
                    {newSummary || 'Executive summary teaser will appear here...'}
                  </p>
                  <div className="border-t border-inherit pt-3 text-xs leading-relaxed whitespace-pre-line">
                    {newContent || 'Full announcement content will render cleanly with appropriate line heights.'}
                  </div>
                </div>
              </div>

              <div className="pt-4 text-[11px] text-[#6E737D]">
                Authorized by State Electricity Distribution Board • Official Public Dispatch System
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: CONSUMER GRIEVANCES (BOARD RESPONSE WORKFLOW)
           ========================================================================= */}
        {activeTab === 'issues' && (
          <div className="space-y-6">
            <div
              className={`p-6 rounded-xl border space-y-4 ${
                isDark ? 'bg-[#141619] border-[#292C32]' : 'bg-white border-[#E2E5E9]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold tracking-tight">Consumer Grievance Review & Resolution</h3>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}`}>
                    Review reported meter discrepancies, billing queries, and record formal resolution notes.
                  </p>
                </div>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400">
                  {issues.length} Registered
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className={isDark ? 'bg-[#0B0C0E] text-[#9A9FA8]' : 'bg-slate-50 text-[#525866]'}>
                    <tr>
                      <th className="py-3 px-4 font-semibold">Ticket & Category</th>
                      <th className="py-3 px-4 font-semibold">Consumer</th>
                      <th className="py-3 px-4 font-semibold">Subject & Description</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">Filed Date</th>
                      <th className="py-3 px-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-inherit">
                    {issues.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-xs text-[#9A9FA8]">
                          No consumer grievances recorded.
                        </td>
                      </tr>
                    ) : (
                      issues.map((item) => (
                        <tr
                          key={item.id}
                          className={`transition-colors ${
                            isDark ? 'hover:bg-[#1A1D21]' : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-purple-400">{item.ticket_number}</span>
                            <div className="text-[10px] text-[#6E737D] mt-0.5">
                              {item.category.replace('_', ' ')}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-semibold">{item.consumer_name}</td>
                          <td className="py-3.5 px-4 max-w-xs">
                            <div className="font-semibold line-clamp-1">{item.subject}</div>
                            <div className={`line-clamp-2 text-[11px] mt-0.5 ${isDark ? 'text-[#9A9FA8]' : 'text-[#6E737D]'}`}>
                              {item.description}
                            </div>
                            {item.response_notes && (
                              <div className="text-[10px] text-emerald-400 mt-1">
                                ✓ Note: {item.response_notes}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                item.status === 'RESOLVED' || item.status === 'CLOSED'
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : item.status === 'IN_PROGRESS'
                                  ? 'bg-blue-500/10 text-blue-400'
                                  : 'bg-amber-500/10 text-amber-400'
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-[#6E737D]">
                            {new Date(item.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setRespondingIssue(item);
                                setResponseStatus(item.status === 'SUBMITTED' ? 'IN_PROGRESS' : 'RESOLVED');
                                setResponseNotes(item.response_notes || '');
                              }}
                              className="text-xs font-semibold px-3 py-1 rounded-md bg-purple-600 hover:bg-purple-700 text-white transition-colors cursor-pointer"
                            >
                              Respond
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: VERIFIED ENFORCEMENT SUMMARY
           ========================================================================= */}
        {activeTab === 'enforcement' && (
          <div className="space-y-6">
            <div
              className={`p-6 rounded-xl border space-y-6 ${
                isDark ? 'bg-[#141619] border-[#292C32]' : 'bg-white border-[#E2E5E9]'
              }`}
            >
              <div>
                <h3 className="text-base font-bold tracking-tight">Verified Anti-Theft Enforcement Outcomes</h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}`}>
                  Aggregate totals certified from physical flying squad inspection records.
                </p>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                  className={`p-5 rounded-lg border ${
                    isDark ? 'bg-[#0B0C0E] border-[#292C32]' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <span className={`text-xs ${isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}`}>
                    Inspections Completed
                  </span>
                  <div className="text-2xl font-bold mt-1">
                    {enforcementStats?.total_inspections_completed || 0}
                  </div>
                  <div className="text-[11px] text-[#6E737D] mt-0.5">Physical field audits</div>
                </div>

                <div
                  className={`p-5 rounded-lg border ${
                    isDark ? 'bg-[#0B0C0E] border-[#292C32]' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <span className={`text-xs ${isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}`}>
                    Confirmed Theft Cases
                  </span>
                  <div className="text-2xl font-bold text-red-400 mt-1">
                    {enforcementStats?.theft_confirmed_count || 0}
                  </div>
                  <div className="text-[11px] text-[#6E737D] mt-0.5">Verified meter tampering</div>
                </div>

                <div
                  className={`p-5 rounded-lg border ${
                    isDark ? 'bg-[#0B0C0E] border-[#292C32]' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <span className={`text-xs ${isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}`}>
                    Clean / Legitimate
                  </span>
                  <div className="text-2xl font-bold text-emerald-400 mt-1">
                    {enforcementStats?.clean_inspections_count || 0}
                  </div>
                  <div className="text-[11px] text-[#6E737D] mt-0.5">No irregularity detected</div>
                </div>

                <div
                  className={`p-5 rounded-lg border ${
                    isDark ? 'bg-[#0B0C0E] border-[#292C32]' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <span className={`text-xs ${isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}`}>
                    Recoveries & Penalties
                  </span>
                  <div className="text-2xl font-bold text-purple-400 mt-1">
                    ₹{enforcementStats ? enforcementStats.total_penalty_assessed_inr.toLocaleString('en-IN') : '0'}
                  </div>
                  <div className="text-[11px] text-[#6E737D] mt-0.5">
                    {enforcementStats ? enforcementStats.total_estimated_units_recovered_kwh.toLocaleString('en-IN') : '0'} kWh recovered
                  </div>
                </div>
              </div>

              {/* Strict Privacy Governance Notice */}
              <div
                className={`p-5 rounded-xl border text-xs leading-relaxed space-y-2 ${
                  isDark ? 'bg-[#0B0C0E] border-[#292C32] text-[#9A9FA8]' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs text-purple-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confidentiality & Anti-Defamation Enforcement Policy</span>
                </div>
                <p>
                  Under electricity board regulations, individual customer identities, meter coordinates, predictive machine learning risk scores, and SHAP explainability factors are strictly classified internal intelligence. They are restricted to vigilance enforcement officers and are never disclosed in public or board communication briefings.
                </p>
                <p className="text-[11px] text-[#6E737D]">
                  Only verified physical inspection findings and authorized aggregate statistics are made available for operational transparency.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Edit Announcement Modal */}
      {editingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className={`w-full max-w-xl rounded-2xl border p-6 space-y-4 shadow-2xl transition-colors ${
              isDark ? 'bg-[#141619] border-[#292C32] text-[#F3F4F5]' : 'bg-white border-[#E2E5E9] text-[#0F141C]'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-inherit">
              <h3 className="text-sm font-bold">Edit Announcement #{editingPost.id}</h3>
              <button
                type="button"
                onClick={() => setEditingPost(null)}
                className="p-1 rounded-md hover:bg-slate-500/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdatePost} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Headline Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  required
                  className={`w-full rounded-lg px-3 py-2 text-xs border ${
                    isDark ? 'bg-[#0B0C0E] border-[#292C32]' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Category</label>
                <select
                  value={editCategory}
                  onChange={e => setEditCategory(e.target.value)}
                  className={`w-full rounded-lg px-3 py-2 text-xs border ${
                    isDark ? 'bg-[#0B0C0E] border-[#292C32]' : 'bg-slate-50 border-slate-300'
                  }`}
                >
                  <option value="POLICY">Policy</option>
                  <option value="SCHEME">Scheme</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="ADVISORY">Advisory</option>
                  <option value="ENERGY_SAVING">Energy Saving</option>
                  <option value="ENFORCEMENT_UPDATE">Enforcement Update</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Executive Summary</label>
                <textarea
                  rows={2}
                  value={editSummary}
                  onChange={e => setEditSummary(e.target.value)}
                  required
                  className={`w-full rounded-lg px-3 py-2 text-xs border ${
                    isDark ? 'bg-[#0B0C0E] border-[#292C32]' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Full Content</label>
                <textarea
                  rows={5}
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  required
                  className={`w-full rounded-lg px-3 py-2 text-xs border ${
                    isDark ? 'bg-[#0B0C0E] border-[#292C32]' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editIsPublished"
                  checked={editIsPublished}
                  onChange={e => setEditIsPublished(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="editIsPublished" className="text-xs font-semibold">
                  Publish publicly (uncheck to save as private draft)
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPost(null)}
                  className="px-4 py-2 rounded-lg border text-xs font-semibold hover:bg-slate-500/10 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold cursor-pointer"
                >
                  {editSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className={`w-full max-w-lg rounded-2xl border p-6 space-y-4 shadow-2xl transition-colors ${
              isDark ? 'bg-[#141619] border-[#292C32] text-[#F3F4F5]' : 'bg-white border-[#E2E5E9] text-[#0F141C]'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-inherit">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400">
                {previewPost.category.replace('_', ' ')}
              </span>
              <button
                type="button"
                onClick={() => setPreviewPost(null)}
                className="p-1 rounded-md hover:bg-slate-500/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 className="text-base font-bold">{previewPost.title}</h3>
              <div className="text-[11px] text-[#6E737D] mt-1">
                Author: {previewPost.author_name} • Published: {new Date(previewPost.published_at).toLocaleDateString()}
              </div>
            </div>

            <p className={`text-xs italic leading-relaxed ${isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}`}>
              {previewPost.summary}
            </p>

            <div className="border-t border-inherit pt-3 text-xs leading-relaxed whitespace-pre-line max-h-60 overflow-y-auto">
              {previewPost.content}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewPost(null)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-purple-700 cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Respond to Issue Modal */}
      {respondingIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className={`w-full max-w-lg rounded-2xl border p-6 space-y-4 shadow-2xl transition-colors ${
              isDark ? 'bg-[#141619] border-[#292C32] text-[#F3F4F5]' : 'bg-white border-[#E2E5E9] text-[#0F141C]'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-inherit">
              <h3 className="text-sm font-bold">
                Respond to Grievance {respondingIssue.ticket_number}
              </h3>
              <button
                type="button"
                onClick={() => setRespondingIssue(null)}
                className="p-1 rounded-md hover:bg-slate-500/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className={`p-3 rounded-lg border text-xs space-y-1 ${
              isDark ? 'bg-[#0B0C0E] border-[#292C32]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="font-semibold">{respondingIssue.subject}</div>
              <p className={isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}>{respondingIssue.description}</p>
              <div className="text-[10px] text-[#6E737D] pt-1">
                Consumer: {respondingIssue.consumer_name}
              </div>
            </div>

            <form onSubmit={handleRespondToIssue} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Update Status</label>
                <select
                  value={responseStatus}
                  onChange={e => setResponseStatus(e.target.value)}
                  className={`w-full rounded-lg px-3 py-2 text-xs border ${
                    isDark ? 'bg-[#0B0C0E] border-[#292C32]' : 'bg-slate-50 border-slate-300'
                  }`}
                >
                  <option value="IN_PROGRESS">In Progress (Technical Squad Dispatched)</option>
                  <option value="RESOLVED">Resolved (Action Completed)</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Official Response Notes *</label>
                <textarea
                  rows={4}
                  value={responseNotes}
                  onChange={e => setResponseNotes(e.target.value)}
                  required
                  placeholder="Record verification outcome, technical repair date, or billing recalculation details..."
                  className={`w-full rounded-lg px-3 py-2 text-xs border ${
                    isDark ? 'bg-[#0B0C0E] border-[#292C32]' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRespondingIssue(null)}
                  className="px-4 py-2 rounded-lg border text-xs font-semibold hover:bg-slate-500/10 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={responseSubmitting}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold cursor-pointer"
                >
                  {responseSubmitting ? 'Recording...' : 'Record Response'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
