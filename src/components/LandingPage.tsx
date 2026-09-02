import React, { useState } from 'react';
import {
  Sparkles,
  Lock,
  Database,
  Cpu,
  ShieldCheck,
  ArrowRight,
  BookOpen,
  MessagesSquare,
  History,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface LandingPageProps {
  onSignInWithGoogle: () => Promise<void>;
  onSignInAsGuest: () => Promise<void>;
  onDismissError?: () => void;
  isSigningIn: boolean;
  authError: string | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSignInWithGoogle,
  onSignInAsGuest,
  onDismissError,
  isSigningIn,
  authError,
}) => {
  const [activeTab, setActiveTab] = useState<'flow' | 'security'>('flow');

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col justify-between selection:bg-amber-400 selection:text-stone-950">
      {/* Top Header */}
      <header className="border-b border-stone-800 bg-stone-900/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-stone-950 font-bold shadow-md shadow-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-serif-title font-semibold text-xl tracking-tight text-stone-100">
              Reflect AI
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="landing-signin-btn-top"
              onClick={onSignInWithGoogle}
              disabled={isSigningIn}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-stone-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 transition shadow-sm disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isSigningIn ? 'Connecting...' : 'Sign In with Google'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 flex flex-col items-center">
        {/* Auth Error Banner */}
        {authError && (
          <div
            id="auth-error-banner"
            role="alert"
            className="w-full max-w-2xl mb-8 p-4 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-200 text-sm flex items-start justify-between gap-3 shadow-lg"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-200">Authentication Notice</p>
                <p className="text-rose-300 text-xs mt-0.5 leading-relaxed">{authError}</p>
                <div className="mt-2.5 flex items-center gap-3">
                  <button
                    onClick={onSignInAsGuest}
                    className="text-xs font-semibold text-amber-300 hover:text-amber-200 underline underline-offset-2"
                  >
                    Launch Instant Demo Session &rarr;
                  </button>
                </div>
              </div>
            </div>
            {onDismissError && (
              <button
                onClick={onDismissError}
                className="text-rose-400 hover:text-rose-200 text-xs px-2 py-1 rounded-lg hover:bg-rose-900/50 transition shrink-0"
              >
                Dismiss
              </button>
            )}
          </div>
        )}

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-800 border border-stone-700 text-stone-300 text-xs font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Powered by Gemini 3.6 Flash & Cloud Firestore Isolation
          </div>

          <h1 className="font-serif-title text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-stone-50 leading-[1.15] mb-6">
            Your Private Mindspace for Deep Reflection & AI Discovery.
          </h1>

          <p className="text-stone-400 text-base sm:text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
            Write uninhibited reflections, brainstorm solutions, and dialogue with Gemini.
            All journal entries are strictly encrypted and isolated to your authenticated account in Cloud Firestore.
          </p>

          {/* Primary CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mx-auto">
            <button
              id="landing-signin-google"
              onClick={onSignInWithGoogle}
              disabled={isSigningIn}
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl font-semibold text-sm text-stone-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isSigningIn ? 'Authenticating...' : 'Continue with Google'}</span>
            </button>

            <button
              id="landing-signin-guest"
              onClick={onSignInAsGuest}
              disabled={isSigningIn}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-medium text-sm text-stone-300 bg-stone-800 hover:bg-stone-700 transition border border-stone-700 disabled:opacity-50"
            >
              <span>Explore Demo Session</span>
              <ArrowRight className="w-4 h-4 text-stone-400" />
            </button>
          </div>
          <p className="text-[11px] text-stone-400 mt-3">
            Zero password storage. Federated OAuth 2.0 with Firebase Authentication.
          </p>
        </div>

        {/* Tab Selector for Feature Walkthrough & Architecture */}
        <div className="w-full max-w-4xl">
          <div className="flex items-center justify-center gap-2 mb-8">
            <button
              id="tab-flow"
              onClick={() => setActiveTab('flow')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'flow'
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-500/40'
                  : 'bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-700'
              }`}
            >
              User Flow & Core Experience
            </button>
            <button
              id="tab-security"
              onClick={() => setActiveTab('security')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'security'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-700'
              }`}
            >
              Security, Rules & Architecture
            </button>
          </div>

          {activeTab === 'flow' ? (
            /* 6-Step User Flow Grid */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Step 1 */}
              <div className="p-5 rounded-2xl bg-stone-800/50 border border-stone-700/70 hover:border-stone-600 transition">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm mb-4">
                  1
                </div>
                <h3 className="font-semibold text-stone-200 text-base mb-1.5 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400" />
                  Google Authentication
                </h3>
                <p className="text-stone-400 text-xs leading-relaxed">
                  Sign in instantly via federated Google Identity. No passwords stored in application code.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-5 rounded-2xl bg-stone-800/50 border border-stone-700/70 hover:border-stone-600 transition">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm mb-4">
                  2
                </div>
                <h3 className="font-semibold text-stone-200 text-base mb-1.5 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  Private Workspace
                </h3>
                <p className="text-stone-400 text-xs leading-relaxed">
                  Step into a clean, distraction-free dashboard curated exclusively for your personal reflections.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-5 rounded-2xl bg-stone-800/50 border border-stone-700/70 hover:border-stone-600 transition">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm mb-4">
                  3
                </div>
                <h3 className="font-semibold text-stone-200 text-base mb-1.5 flex items-center gap-2">
                  <MessagesSquare className="w-4 h-4 text-amber-400" />
                  Multi-Turn Journaling
                </h3>
                <p className="text-stone-400 text-xs leading-relaxed">
                  Write entries, ask clarifying questions, and converse back-and-forth in continuous dialogue.
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-5 rounded-2xl bg-stone-800/50 border border-stone-700/70 hover:border-stone-600 transition">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm mb-4">
                  4
                </div>
                <h3 className="font-semibold text-stone-200 text-base mb-1.5 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-amber-400" />
                  Gemini 3.6 Flash Engine
                </h3>
                <p className="text-stone-400 text-xs leading-relaxed">
                  Extract deep summaries, brainstorm solutions, analyze emotional tone, and conduct Socratic inquiries.
                </p>
              </div>

              {/* Step 5 */}
              <div className="p-5 rounded-2xl bg-stone-800/50 border border-stone-700/70 hover:border-stone-600 transition">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm mb-4">
                  5
                </div>
                <h3 className="font-semibold text-stone-200 text-base mb-1.5 flex items-center gap-2">
                  <Database className="w-4 h-4 text-amber-400" />
                  Firestore Data Isolation
                </h3>
                <p className="text-stone-400 text-xs leading-relaxed">
                  Every interaction is safely persisted under your UID path. Zero cross-user visibility.
                </p>
              </div>

              {/* Step 6 */}
              <div className="p-5 rounded-2xl bg-stone-800/50 border border-stone-700/70 hover:border-stone-600 transition">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm mb-4">
                  6
                </div>
                <h3 className="font-semibold text-stone-200 text-base mb-1.5 flex items-center gap-2">
                  <History className="w-4 h-4 text-amber-400" />
                  Searchable History
                </h3>
                <p className="text-stone-400 text-xs leading-relaxed">
                  Search, filter by mood or tag, review previous multi-turn threads, and track personal growth.
                </p>
              </div>
            </div>
          ) : (
            /* Security Architecture View */
            <div className="p-6 rounded-2xl bg-stone-800/60 border border-stone-700/80">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                <h3 className="font-semibold text-lg text-stone-100">
                  Zero-Trust Enterprise Security Model
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-stone-300">
                <div className="p-3.5 rounded-xl bg-stone-900/60 border border-stone-800">
                  <div className="font-semibold text-amber-300 mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                    Firestore ABAC Security Rules
                  </div>
                  <p className="text-stone-400">
                    Enforces strict path matching: <code className="text-stone-300">request.auth.uid == userId</code>. Other users cannot query, read, or write your records.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-stone-900/60 border border-stone-800">
                  <div className="font-semibold text-amber-300 mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                    Server-Side Gemini Proxy
                  </div>
                  <p className="text-stone-400">
                    Gemini API credentials never reach the browser client. All inferences are routed through a secure Express backend with fallback resilience.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-stone-900/60 border border-stone-800">
                  <div className="font-semibold text-amber-300 mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                    Strict Payload Sanitization
                  </div>
                  <p className="text-stone-400">
                    Zero-crash payload hygiene strips all undefined properties before database ingestion to guarantee transaction integrity.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-stone-900/60 border border-stone-800">
                  <div className="font-semibold text-amber-300 mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                    Automated Fallback Ladder
                  </div>
                  <p className="text-stone-400">
                    Dynamic model failover chain (Flash 3.6 $\rightarrow$ Flash-Lite 3.1 $\rightarrow$ Flash-Latest $\rightarrow$ Flash 3.7) ensures high availability.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-800 py-6 text-center text-xs text-stone-400">
        <p>Built with Google Gemini 3.6 Flash, Cloud Firestore & Firebase Authentication.</p>
      </footer>
    </div>
  );
};
