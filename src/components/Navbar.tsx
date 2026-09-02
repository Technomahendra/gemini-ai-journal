import React from 'react';
import {
  Sparkles,
  LogOut,
  Plus,
  ShieldCheck,
  BarChart2,
  Lightbulb,
  Cloud,
  CheckCircle2,
} from 'lucide-react';
import type { UserProfile } from '../types';

interface NavbarProps {
  user: UserProfile | null;
  onSignOut: () => void;
  onNewEntry: () => void;
  onOpenStats: () => void;
  onOpenInspiration: () => void;
  onOpenSecurity: () => void;
  entryCount: number;
  isSaving?: boolean;
  lastSavedAt?: number | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onSignOut,
  onNewEntry,
  onOpenStats,
  onOpenInspiration,
  onOpenSecurity,
  entryCount,
  isSaving,
  lastSavedAt,
}) => {
  return (
    <header
      id="app-navbar"
      aria-label="Application Navigation"
      className="sticky top-0 z-30 w-full bg-stone-900 text-stone-100 border-b border-stone-800 backdrop-blur-md bg-stone-900/95"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-md shadow-amber-500/20 text-stone-950 font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif-title font-semibold text-lg tracking-tight text-stone-100">
                Reflect AI
              </span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Gemini 3.6
              </span>
            </div>
            <p className="text-xs text-stone-400 hidden sm:block">
              Private Authenticated Journal & Reflections
            </p>
          </div>
        </div>

        {/* Center: Save state indicator */}
        <div className="hidden md:flex items-center gap-2 text-xs text-stone-400">
          {isSaving ? (
            <span className="flex items-center gap-1.5 text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              Syncing to Firestore...
            </span>
          ) : lastSavedAt ? (
            <span className="flex items-center gap-1.5 text-stone-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Saved to Firestore ({new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-stone-400">
              <Cloud className="w-3.5 h-3.5 text-stone-400" />
              Firestore Protected
            </span>
          )}
        </div>

        {/* Right: Actions & User Info */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Inspiration Generator */}
          <button
            id="btn-inspiration"
            onClick={onOpenInspiration}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-stone-200 bg-stone-800 hover:bg-stone-700 transition border border-stone-700"
            title="Inspiration Prompts"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Prompts</span>
          </button>

          {/* Stats */}
          <button
            id="btn-stats"
            onClick={onOpenStats}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-stone-200 bg-stone-800 hover:bg-stone-700 transition border border-stone-700"
            title="Reflection Analytics"
          >
            <BarChart2 className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">{entryCount} Entries</span>
          </button>

          {/* Security & Rules */}
          <button
            id="btn-security"
            onClick={onOpenSecurity}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/40 transition border border-emerald-800/50"
            title="Firestore Security Rules & Isolation"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden lg:inline">Secure</span>
          </button>

          {/* New Entry Button */}
          <button
            id="btn-new-entry"
            onClick={onNewEntry}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-stone-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Entry</span>
          </button>

          {/* User Profile / Logout */}
          {user && (
            <div className="flex items-center pl-2 border-l border-stone-800 gap-2">
              <div className="relative group flex items-center gap-2">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User Avatar'}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full border border-amber-400/40 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-medium text-xs border border-amber-500/30">
                    {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="hidden xl:block text-left text-xs">
                  <div className="font-medium text-stone-200 truncate max-w-[120px]">
                    {user.displayName || (user.isAnonymous ? 'Guest User' : 'Authenticated')}
                  </div>
                  <div className="text-[10px] text-stone-400 truncate max-w-[120px]">
                    {user.email || 'Isolated Session'}
                  </div>
                </div>
              </div>

              <button
                id="btn-signout"
                onClick={onSignOut}
                className="p-1.5 text-stone-400 hover:text-rose-400 rounded-lg hover:bg-stone-800 transition"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
