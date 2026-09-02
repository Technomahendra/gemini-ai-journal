import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Sparkles,
  Send,
  Save,
  Tag,
  Smile,
  Copy,
  Check,
  BrainCircuit,
  FileText,
  Lightbulb,
  HelpCircle,
  HeartHandshake,
  Download,
  Clock,
  AlertCircle,
  Cpu,
  RefreshCw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { JournalEntry, ReflectionMode, ReflectionTurn } from '../types';

interface EntryEditorProps {
  entry: JournalEntry | null;
  onSaveEntry: (updatedEntry: JournalEntry) => Promise<void>;
  isSaving: boolean;
}

const MOODS = [
  { emoji: '🌿', label: 'Calm' },
  { emoji: '💭', label: 'Reflective' },
  { emoji: '🌟', label: 'Energized' },
  { emoji: '🔥', label: 'Focused' },
  { emoji: '🌧️', label: 'Overwhelmed' },
  { emoji: '🎯', label: 'Determined' },
  { emoji: '🙏', label: 'Grateful' },
];

const MODES: { id: ReflectionMode; label: string; icon: any; desc: string }[] = [
  {
    id: 'reflection',
    label: 'Deep Reflection',
    icon: BrainCircuit,
    desc: 'Empathetic analysis and self-discovery insight',
  },
  {
    id: 'summary',
    label: 'Summary & Actions',
    icon: FileText,
    desc: 'Structured synthesis and micro-steps',
  },
  {
    id: 'brainstorm',
    label: 'Creative Brainstorm',
    icon: Lightbulb,
    desc: 'Diverse angles, analogies & solutions',
  },
  {
    id: 'socratic',
    label: 'Socratic Inquiry',
    icon: HelpCircle,
    desc: 'Deep clarifying questions to challenge assumptions',
  },
  {
    id: 'gratitude',
    label: 'Gratitude & Strength',
    icon: HeartHandshake,
    desc: 'Positive reframing and resilience anchoring',
  },
];

const SUGGESTED_TAGS = ['Mindset', 'Growth', 'Gratitude', 'Career', 'Health', 'Creativity', 'Relationships'];

export const EntryEditor: React.FC<EntryEditorProps> = ({
  entry,
  onSaveEntry,
  isSaving,
}) => {
  // Local editing state - call hooks unconditionally at the top level
  const [title, setTitle] = useState(entry?.title || '');
  const [content, setContent] = useState(entry?.content || '');
  const [mood, setMood] = useState(entry?.mood || '');
  const [tags, setTags] = useState<string[]>(entry?.tags || []);
  const [newTagInput, setNewTagInput] = useState('');
  const [mode, setMode] = useState<ReflectionMode>(entry?.mode || 'reflection');
  const [turns, setTurns] = useState<ReflectionTurn[]>(entry?.turns || []);
  const [summary, setSummary] = useState(entry?.summary || '');
  
  // Follow-up prompt state
  const [followUpQuery, setFollowUpQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const turnsEndRef = useRef<HTMLDivElement>(null);

  // Sync state when active entry changes
  useEffect(() => {
    if (entry) {
      setTitle(entry.title || '');
      setContent(entry.content || '');
      setMood(entry.mood || '');
      setTags(entry.tags || []);
      setMode(entry.mode || 'reflection');
      setTurns(entry.turns || []);
      setSummary(entry.summary || '');
      setGenerationError(null);
    } else {
      setTitle('');
      setContent('');
      setMood('');
      setTags([]);
      setMode('reflection');
      setTurns([]);
      setSummary('');
      setGenerationError(null);
    }
  }, [entry?.id]);

  if (!entry) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-stone-50 text-stone-500">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-100/70 text-amber-700 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="font-serif-title text-lg font-semibold text-stone-800">Select or Create a Reflection</h3>
          <p className="text-xs text-stone-500 mt-1">
            Choose an entry from the sidebar or click New Entry to begin your private reflection session.
          </p>
        </div>
      </div>
    );
  }

  const scrollToBottom = () => {
    turnsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Trigger manual save
  const handleSave = async () => {
    const updated: JournalEntry = {
      ...entry,
      title: title.trim() || 'Untitled Reflection',
      content,
      mood,
      tags,
      mode,
      turns,
      summary,
      updatedAt: Date.now(),
    };
    await onSaveEntry(updated);
  };

  // Add tag
  const handleAddTag = (tagToAdd: string) => {
    const clean = tagToAdd.trim().replace(/^#/, '');
    if (clean && !tags.includes(clean)) {
      const updatedTags = [...tags, clean];
      setTags(updatedTags);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Trigger Gemini Reflection
  const handleGenerateReflection = async (customQuery?: string) => {
    if (!content.trim() && !customQuery) {
      setGenerationError('Please write your thoughts or reflection first before asking Gemini.');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const res = await fetch('/api/gemini/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryTitle: title,
          entryContent: content,
          mode,
          conversationHistory: turns,
          userQuery: customQuery || '',
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gemini reflection service failed to respond');
      }

      const newTurn: ReflectionTurn = {
        id: `turn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        prompt: customQuery || `Reflect on this entry (${MODES.find((m) => m.id === mode)?.label})`,
        response: data.text,
        timestamp: Date.now(),
        mode,
        modelUsed: data.modelUsed,
      };

      const updatedTurns = [...turns, newTurn];
      setTurns(updatedTurns);
      setFollowUpQuery('');

      // Auto-save to Firestore immediately
      const updatedEntry: JournalEntry = {
        ...entry,
        title: title.trim() || 'Untitled Reflection',
        content,
        mood,
        tags,
        mode,
        turns: updatedTurns,
        summary,
        updatedAt: Date.now(),
      };
      await onSaveEntry(updatedEntry);

      // Subtle celebration if first reflection
      if (turns.length === 0) {
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#f59e0b', '#fbbf24', '#d97706'],
        });
      }

      setTimeout(scrollToBottom, 150);
    } catch (err: any) {
      console.error('Reflection error:', err);
      setGenerationError(err.message || 'Unable to connect to Gemini API.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Trigger Gemini Executive Summary
  const handleGenerateSummary = async () => {
    if (!content.trim()) {
      setGenerationError('Please add some content to summarize.');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const res = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate summary');
      }

      setSummary(data.summary);

      // Auto-save to Firestore
      const updatedEntry: JournalEntry = {
        ...entry,
        title: title.trim() || 'Untitled Reflection',
        content,
        mood,
        tags,
        mode,
        turns,
        summary: data.summary,
        updatedAt: Date.now(),
      };
      await onSaveEntry(updatedEntry);
    } catch (err: any) {
      console.error('Summary generation error:', err);
      setGenerationError(err.message || 'Unable to generate summary.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy helper
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Export entry to markdown file
  const handleExportMarkdown = () => {
    let md = `# ${title || 'Journal Reflection'}\n\n`;
    md += `*Date: ${new Date(entry.createdAt).toLocaleDateString()} | Mood: ${mood || 'Not specified'} | Tags: ${tags.map((t) => '#' + t).join(' ')}*\n\n`;
    md += `## Journal Entry\n\n${content}\n\n`;
    
    if (summary) {
      md += `## Executive Summary & Action Items\n\n${summary}\n\n`;
    }

    if (turns.length > 0) {
      md += `## Multi-Turn Dialogue with Gemini\n\n`;
      turns.forEach((turn, idx) => {
        md += `### Turn ${idx + 1}: ${turn.prompt}\n\n${turn.response}\n\n---\n\n`;
      });
    }

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(title || 'reflection').toLowerCase().replace(/\s+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const charCount = content.length;

  return (
    <div id="entry-editor" className="flex-1 flex flex-col h-full bg-stone-50 overflow-y-auto">
      {/* Top Toolbar */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-stone-200 px-6 py-3 flex items-center justify-between gap-4">
        {/* Left: Mood & Mode pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Mood Selector Dropdown / Pills */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
            {MOODS.map((m) => (
              <button
                key={m.label}
                onClick={() => setMood(m.emoji + ' ' + m.label)}
                className={`px-2 py-1 rounded-lg text-xs transition flex items-center gap-1 ${
                  mood.includes(m.label)
                    ? 'bg-white text-stone-900 shadow-xs font-semibold'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
                title={m.label}
              >
                <span>{m.emoji}</span>
                <span className="hidden xl:inline text-[11px]">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Word Count */}
          <span className="text-[11px] text-stone-400 hidden sm:inline mr-2">
            {wordCount} words · {charCount} chars
          </span>

          {/* Export Markdown */}
          <button
            onClick={handleExportMarkdown}
            className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition border border-stone-200/80"
            title="Export as Markdown"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Manual Save Button */}
          <button
            id="btn-save-entry"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 transition border border-stone-300 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl w-full mx-auto p-6 space-y-6">
        {/* Error notification banner */}
        {generationError && (
          <div
            role="alert"
            className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold">AI Assistant Notice: </span>
              {generationError}
            </div>
            <button
              onClick={() => setGenerationError(null)}
              className="text-rose-500 hover:text-rose-700 font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* Title Input */}
        <div>
          <input
            id="input-entry-title"
            type="text"
            placeholder="Title of this reflection..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-2xl sm:text-3xl font-serif-title font-bold text-stone-900 placeholder-stone-300 bg-transparent border-none focus:outline-none focus:ring-0 leading-tight"
          />
        </div>

        {/* Tags Section */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <Tag className="w-3.5 h-3.5 text-stone-400" />
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200/60 font-medium"
            >
              #{tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-amber-950 font-bold ml-0.5"
              >
                ×
              </button>
            </span>
          ))}

          {/* Add Tag Input */}
          <div className="flex items-center">
            <input
              type="text"
              placeholder="+ add tag"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  handleAddTag(newTagInput);
                }
              }}
              className="w-20 px-2 py-0.5 text-xs bg-stone-100 rounded-lg text-stone-700 placeholder-stone-400 focus:outline-none focus:w-28 transition-all"
            />
          </div>

          {/* Quick suggestions */}
          {tags.length === 0 && (
            <div className="flex items-center gap-1 text-[11px] text-stone-400">
              <span className="hidden sm:inline">Try:</span>
              {SUGGESTED_TAGS.slice(0, 4).map((stag) => (
                <button
                  key={stag}
                  onClick={() => handleAddTag(stag)}
                  className="hover:text-stone-600 underline underline-offset-2"
                >
                  +{stag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Main Reflection Textarea */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs relative">
          <textarea
            id="textarea-entry-content"
            rows={10}
            placeholder="Write your thoughts, daily experiences, reflections, challenges, or aspirations here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-transparent text-stone-800 text-sm sm:text-base leading-relaxed resize-y focus:outline-none placeholder-stone-300 min-h-[180px]"
          />

          {/* AI Mode Selector Bar */}
          <div className="mt-4 pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mr-1">
                Reflection Mode:
              </span>
              {MODES.map((m) => {
                const IconComponent = m.icon;
                const isSelected = mode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition ${
                      isSelected
                        ? 'bg-amber-100 text-amber-900 font-semibold border border-amber-300'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200/80 border border-transparent'
                    }`}
                    title={m.desc}
                  >
                    <IconComponent className="w-3.5 h-3.5 text-amber-600" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* AI Action Trigger Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                id="btn-summarize"
                onClick={handleGenerateSummary}
                disabled={isGenerating || !content.trim()}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 transition border border-stone-300 disabled:opacity-40"
              >
                <FileText className="w-3.5 h-3.5 text-stone-600" />
                <span>Executive Summary</span>
              </button>

              <button
                id="btn-reflect-gemini"
                onClick={() => handleGenerateReflection()}
                disabled={isGenerating || !content.trim()}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-stone-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 transition shadow-md shadow-amber-500/10 disabled:opacity-40"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-stone-950" />
                    <span>Reflecting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-stone-950" />
                    <span>Reflect with Gemini</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Executive Summary Card (if generated) */}
        {summary && (
          <div className="bg-gradient-to-br from-amber-50/80 to-stone-50 rounded-2xl p-6 border border-amber-200/80 shadow-xs relative">
            <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-amber-200/60">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-400/20 text-amber-800 flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-serif-title font-semibold text-sm text-stone-900">
                    Executive Summary & Key Takeaways
                  </h4>
                  <span className="text-[10px] text-stone-500">Structured synthesis by Gemini</span>
                </div>
              </div>

              <button
                onClick={() => handleCopyText(summary, 'summary')}
                className="p-1.5 text-stone-500 hover:text-stone-800 rounded-lg hover:bg-amber-100/50 transition"
                title="Copy Summary"
              >
                {copiedId === 'summary' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            <div className="text-xs sm:text-sm text-stone-800 leading-relaxed space-y-3 prose prose-stone max-w-none">
              <ReactMarkdown>{summary}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Multi-Turn Conversation Stream with Gemini */}
        {turns.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-stone-200">
            <div className="flex items-center justify-between">
              <h3 className="font-serif-title font-semibold text-base text-stone-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Multi-Turn Gemini Dialogue ({turns.length} {turns.length === 1 ? 'turn' : 'turns'})
              </h3>
              <span className="text-[11px] text-stone-400">
                Isolated in Firestore /users/{entry.userId || 'me'}/entries/{entry.id}
              </span>
            </div>

            {turns.map((turn, index) => (
              <div
                key={turn.id || index}
                id={`reflection-turn-${index}`}
                className="space-y-3 p-5 rounded-2xl bg-white border border-stone-200/90 shadow-xs"
              >
                {/* User Prompt Turn */}
                <div className="flex items-start gap-3 text-xs bg-stone-100/70 p-3 rounded-xl border border-stone-200/50">
                  <span className="w-5 h-5 rounded-full bg-stone-300 text-stone-800 font-bold flex items-center justify-center shrink-0 text-[10px]">
                    You
                  </span>
                  <div className="flex-1 font-medium text-stone-800">{turn.prompt}</div>
                  <span className="text-[10px] text-stone-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Gemini Response Turn */}
                <div className="flex items-start gap-3 pl-1">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0 mt-1">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-stone-400">
                      <span className="font-semibold text-stone-700 flex items-center gap-1.5">
                        Gemini 3.6 Flash
                        {turn.modelUsed && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-stone-100 text-stone-500 font-mono">
                            {turn.modelUsed}
                          </span>
                        )}
                      </span>
                      <button
                        onClick={() => handleCopyText(turn.response, turn.id)}
                        className="p-1 text-stone-400 hover:text-stone-700 transition rounded"
                        title="Copy Response"
                      >
                        {copiedId === turn.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <div className="text-xs sm:text-sm text-stone-800 leading-relaxed prose prose-stone max-w-none">
                      <ReactMarkdown>{turn.response}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div ref={turnsEndRef} />
          </div>
        )}

        {/* Multi-Turn Follow-Up Input Box */}
        <div className="sticky bottom-4 z-10 bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-stone-300 shadow-md">
          <div className="flex items-center gap-2">
            <input
              id="input-followup-query"
              type="text"
              placeholder="Ask Gemini a follow-up, explore a specific thought, or ask for action steps..."
              value={followUpQuery}
              onChange={(e) => setFollowUpQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (followUpQuery.trim() && !isGenerating) {
                    handleGenerateReflection(followUpQuery);
                  }
                }
              }}
              disabled={isGenerating}
              className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-stone-100/80 rounded-xl text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
            />

            <button
              id="btn-send-followup"
              onClick={() => handleGenerateReflection(followUpQuery)}
              disabled={isGenerating || !followUpQuery.trim()}
              className="px-4 py-2.5 rounded-xl font-semibold text-xs text-stone-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 transition shadow-sm disabled:opacity-40 flex items-center gap-1.5"
            >
              {isGenerating ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
