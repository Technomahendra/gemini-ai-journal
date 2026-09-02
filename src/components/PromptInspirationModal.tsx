import React, { useState } from 'react';
import { Sparkles, Lightbulb, RefreshCw, X, ArrowRight, BookOpen, Compass } from 'lucide-react';
import type { PromptIdea } from '../types';

interface PromptInspirationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (prompt: PromptIdea) => void;
}

const DEFAULT_PROMPTS: PromptIdea[] = [
  {
    id: 'p1',
    title: 'Daily Micro-Wins',
    prompt: 'What was one small, quiet moment today where you felt proud of how you responded?',
    tag: 'Gratitude',
  },
  {
    id: 'p2',
    title: 'Releasing the Uncontrollable',
    prompt: 'What is a problem or worry currently occupying your mind that is outside your direct control? How can you gently set it down?',
    tag: 'Clarity',
  },
  {
    id: 'p3',
    title: 'Growth Edge & Curiosity',
    prompt: 'Where did you feel friction or resistance this week, and what skill or mindset is that friction calling you to develop?',
    tag: 'Growth',
  },
  {
    id: 'p4',
    title: 'Values Alignment Check',
    prompt: 'Looking back at your recent decisions, did your calendar reflect your deepest values? What is one adjustment you can make?',
    tag: 'Mindset',
  },
  {
    id: 'p5',
    title: 'Future Vision & Resilience',
    prompt: 'Imagine yourself one year from today celebrating a major breakthrough. What courage did today\'s version of you demonstrate to start that path?',
    tag: 'Vision',
  },
];

export const PromptInspirationModal: React.FC<PromptInspirationModalProps> = ({
  isOpen,
  onClose,
  onSelectPrompt,
}) => {
  const [prompts, setPrompts] = useState<PromptIdea[]>(DEFAULT_PROMPTS);
  const [category, setCategory] = useState('daily');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleGenerateFreshPrompts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/gemini/prompt-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.prompts) && data.prompts.length > 0) {
        setPrompts(data.prompts);
      }
    } catch (err) {
      console.error('Failed to generate prompts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif-title font-bold text-base text-stone-900">
                Journaling & Reflection Prompts
              </h3>
              <p className="text-xs text-stone-500">Spark clarity with Gemini AI inquiries</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Categories & Generator */}
        <div className="p-4 bg-stone-50 border-b border-stone-100 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            {['daily', 'growth', 'gratitude', 'career', 'mindfulness'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs capitalize transition ${
                  category === cat
                    ? 'bg-amber-500 text-white font-semibold shadow-xs'
                    : 'bg-white text-stone-600 hover:bg-stone-200/80 border border-stone-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            onClick={handleGenerateFreshPrompts}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-stone-800 bg-white hover:bg-stone-100 border border-stone-300 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Generate Fresh</span>
          </button>
        </div>

        {/* Prompts list */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {prompts.map((p) => (
            <div
              key={p.id}
              onClick={() => {
                onSelectPrompt(p);
                onClose();
              }}
              className="group p-4 rounded-xl border border-stone-200 hover:border-amber-400 hover:bg-amber-50/50 cursor-pointer transition flex items-start justify-between gap-3"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-stone-900 group-hover:text-amber-950">
                    {p.title}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 font-medium">
                    #{p.tag}
                  </span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">{p.prompt}</p>
              </div>

              <div className="w-6 h-6 rounded-lg bg-stone-100 group-hover:bg-amber-200 group-hover:text-amber-900 text-stone-400 flex items-center justify-center shrink-0 transition mt-1">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-stone-100 bg-stone-50 text-center text-xs text-stone-400">
          Click any prompt to instantly begin a new reflection entry with it.
        </div>
      </div>
    </div>
  );
};
