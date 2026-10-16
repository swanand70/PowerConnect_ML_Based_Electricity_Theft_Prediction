import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, User, AlertCircle, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { PublicHeader } from '../components/layout/PublicHeader';
import { PublicFooter } from '../components/layout/PublicFooter';
import { AtmosphericBackground } from '../components/common/AtmosphericBackground';
import { PowerConnectLogo } from '../components/common/PowerConnectLogo';

export const BoardAdminLogin: React.FC = () => {
  const [username, setUsername] = useState('board_admin');
  const [password, setPassword] = useState('Utility@2026');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const isDark = theme === 'dark';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(username, password);
      if (user.role === 'BOARD_COMMUNICATION_ADMIN') {
        navigate('/board-admin');
      } else {
        setError(`Signed in as ${user.role}. This portal requires BOARD_COMMUNICATION_ADMIN credentials.`);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify board administrator credentials.');
    } finally {
      setLoading(false);
    }
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

      <main className="relative overflow-hidden flex-1 flex flex-col justify-center items-center px-4 py-12 sm:py-16">
        <AtmosphericBackground
          intensity="subtle"
          className={isDark ? 'opacity-45' : 'opacity-20'}
        />

        <div className="relative z-10 w-full max-w-md">
          {/* Back Navigation */}
          <div className="mb-6">
            <Link
              to="/board-communication"
              className={`inline-flex items-center gap-1.5 text-xs transition-colors font-medium ${
                isDark ? 'text-[#9A9FA8] hover:text-[#F3F4F5]' : 'text-[#525866] hover:text-[#0F141C]'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Public Board Communications</span>
            </Link>
          </div>

          {/* Form Container Card */}
          <div
            className={`rounded-2xl p-7 sm:p-8 border shadow-xl transition-all duration-200 ${
              isDark
                ? 'bg-[#141619]/95 backdrop-blur-xs border-[#292C32] shadow-indigo-950/20'
                : 'bg-white/95 backdrop-blur-xs border-[#E2E5E9]'
            }`}
          >
            {/* Header Icon */}
            <div className="flex items-center gap-3 mb-6">
              <PowerConnectLogo size={40} />
              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  Board Administrator Sign-In
                </h1>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}`}>
                  PowerConnect • Publish updates, schemes & manage grievances
                </p>
              </div>
            </div>

            {error && (
              <div
                className="mb-5 p-3.5 rounded-lg border text-xs flex items-start gap-2.5 bg-red-500/10 border-red-500/30 text-red-400"
                role="alert"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  Administrator Username
                </label>
                <div className="relative">
                  <User
                    className={`w-4 h-4 absolute left-3.5 top-3 ${
                      isDark ? 'text-[#6E737D]' : 'text-slate-400'
                    }`}
                  />
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                    disabled={loading}
                    className={`w-full rounded-lg pl-10 pr-3 py-2.5 text-xs transition-colors focus:outline-hidden border ${
                      isDark
                        ? 'bg-[#0B0C0E] border-[#292C32] text-[#F3F4F5] focus:border-purple-400'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                    }`}
                    placeholder="e.g. board_admin"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className={`w-4 h-4 absolute left-3.5 top-3 ${
                      isDark ? 'text-[#6E737D]' : 'text-slate-400'
                    }`}
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className={`w-full rounded-lg pl-10 pr-3 py-2.5 text-xs transition-colors focus:outline-hidden border ${
                      isDark
                        ? 'bg-[#0B0C0E] border-[#292C32] text-[#F3F4F5] focus:border-purple-400'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                    }`}
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold py-3 px-4 rounded-lg transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Verifying Board Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Enter Board Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Credentials helper */}
            <div
              className={`mt-6 p-3.5 rounded-lg border text-xs space-y-1.5 ${
                isDark
                  ? 'bg-[#0B0C0E] border-[#292C32] text-[#9A9FA8]'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <div className="flex items-center gap-1.5 font-semibold text-[11px] text-purple-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Authorized Administrative Account</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Username: <code className="font-mono text-[11px]">board_admin</code>
                <br />
                Password: <code className="font-mono text-[11px]">Utility@2026</code>
              </p>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};
