import React from 'react';
import { BarChart2, Sparkles, X, Heart, Award, Calendar, BookOpen, MessageSquare } from 'lucide-react';
import type { JournalEntry } from '../types';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: JournalEntry[];
}

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose, entries }) => {
  if (!isOpen) return null;

  const totalEntries = entries.length;
  const totalTurns = entries.reduce((acc, curr) => acc + (curr.turns?.length || 0), 0);
  const totalWords = entries.reduce(
    (acc, curr) => acc + (curr.content ? curr.content.trim().split(/\s+/).filter(Boolean).length : 0),
    0
  );

  // Mood frequency
  const moodCounts: { [key: string]: number } = {};
  entries.forEach((e) => {
    if (e.mood) {
      moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
    }
  });

  // Top Tags
  const tagCounts: { [key: string]: number } = {};
  entries.forEach((e) => {
    e.tags?.forEach((t) => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
  });

  const sortedTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif-title font-bold text-base text-stone-900">
                Your Reflection Journey
              </h3>
              <p className="text-xs text-stone-500">Personal insights and activity metrics</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Metric Cards Grid */}
        <div className="p-5 space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 text-center">
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-2">
                <BookOpen className="w-3.5 h-3.5" />
              </div>
              <div className="font-serif-title font-bold text-xl text-stone-900">{totalEntries}</div>
              <div className="text-[11px] text-stone-500 font-medium">Reflections</div>
            </div>

            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 text-center">
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-2">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="font-serif-title font-bold text-xl text-stone-900">{totalTurns}</div>
              <div className="text-[11px] text-stone-500 font-medium">Gemini Turns</div>
            </div>

            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 text-center">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-2">
                <Award className="w-3.5 h-3.5" />
              </div>
              <div className="font-serif-title font-bold text-xl text-stone-900">{totalWords}</div>
              <div className="text-[11px] text-stone-500 font-medium">Words Written</div>
            </div>
          </div>

          {/* Mood breakdown */}
          {Object.keys(moodCounts).length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2.5">
                Emotional Mindsets
              </h4>
              <div className="flex items-center gap-2 flex-wrap">
                {Object.entries(moodCounts).map(([m, count]) => (
                  <div
                    key={m}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-stone-100 border border-stone-200 text-xs text-stone-700"
                  >
                    <span>{m}</span>
                    <span className="font-semibold text-stone-900">({count})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Topics / Tags */}
          {sortedTags.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2.5">
                Focus Themes
              </h4>
              <div className="flex items-center gap-1.5 flex-wrap">
                {sortedTags.map(([tag, count]) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium"
                  >
                    #{tag} <span className="text-amber-700 font-bold">×{count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-stone-100 bg-stone-50 text-center text-xs text-stone-400">
          All data is dynamically queried in real-time from your private Firestore collection.
        </div>
      </div>
    </div>
  );
};
