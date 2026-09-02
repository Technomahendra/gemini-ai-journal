import React, { useState, useMemo } from 'react';
import {
  Search,
  Pin,
  Trash2,
  Calendar,
  MessageSquare,
  Sparkles,
  ChevronRight,
  Filter,
  X,
} from 'lucide-react';
import type { JournalEntry, ReflectionMode } from '../types';

interface EntryListProps {
  entries: JournalEntry[];
  selectedEntryId: string | null;
  onSelectEntry: (entry: JournalEntry) => void;
  onDeleteEntry: (entryId: string) => void;
  onTogglePin: (entryId: string, currentPin: boolean) => void;
  onNewEntry: () => void;
}

export const EntryList: React.FC<EntryListProps> = ({
  entries,
  selectedEntryId,
  onSelectEntry,
  onDeleteEntry,
  onTogglePin,
  onNewEntry,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<ReflectionMode | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    entries.forEach((e) => {
      if (Array.isArray(e.tags)) {
        e.tags.forEach((t) => tags.add(t));
      }
    });
    return Array.from(tags);
  }, [entries]);

  // Filtered & Sorted entries (pinned first, then by updatedAt desc)
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.turns?.some(
          (t) =>
            t.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.response.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesTag = !selectedTag || (entry.tags && entry.tags.includes(selectedTag));
      const matchesMode = !selectedMode || entry.mode === selectedMode;

      return matchesSearch && matchesTag && matchesMode;
    });
  }, [entries, searchQuery, selectedTag, selectedMode]);

  // Group entries by date
  const groupedEntries = useMemo(() => {
    const groups: { [key: string]: JournalEntry[] } = {
      Pinned: [],
      Today: [],
      Yesterday: [],
      'This Week': [],
      Earlier: [],
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;
    const oneWeekAgo = today - 7 * 86400000;

    filteredEntries.forEach((entry) => {
      if (entry.isPinned) {
        groups['Pinned'].push(entry);
        return;
      }

      const time = entry.updatedAt || entry.createdAt;
      if (time >= today) {
        groups['Today'].push(entry);
      } else if (time >= yesterday) {
        groups['Yesterday'].push(entry);
      } else if (time >= oneWeekAgo) {
        groups['This Week'].push(entry);
      } else {
        groups['Earlier'].push(entry);
      }
    });

    return groups;
  }, [filteredEntries]);

  return (
    <div
      id="entry-sidebar"
      className="flex flex-col h-full bg-white border-r border-stone-200 w-full md:w-80 lg:w-96 shrink-0"
    >
      {/* Search & Filter Header */}
      <div className="p-4 border-b border-stone-100 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-entries"
            type="text"
            placeholder="Search reflections, AI insights..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-stone-100/80 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-stone-800 placeholder-stone-400 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Tags horizontal scroll */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-2 py-0.5 rounded-full font-medium shrink-0 transition ${
                selectedTag === null
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              All Tags
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-2 py-0.5 rounded-full font-medium shrink-0 transition ${
                  selectedTag === tag
                    ? 'bg-amber-600 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Entry List Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {filteredEntries.length === 0 ? (
          <div className="py-12 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-stone-700">No reflections found</p>
            <p className="text-xs text-stone-400 mt-1 max-w-[200px] mx-auto">
              {searchQuery || selectedTag
                ? 'Try adjusting your search or filter criteria.'
                : 'Start your first private reflection with Gemini.'}
            </p>
            <button
              onClick={onNewEntry}
              className="mt-4 px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg transition"
            >
              + Create New Entry
            </button>
          </div>
        ) : (
          Object.entries(groupedEntries).map(([groupTitle, groupItems]) => {
            if (groupItems.length === 0) return null;

            return (
              <div key={groupTitle} className="space-y-1.5">
                <div className="px-2 py-1 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-stone-400">
                  <span>{groupTitle}</span>
                  <span>{groupItems.length}</span>
                </div>

                {groupItems.map((entry) => {
                  const isSelected = selectedEntryId === entry.id;
                  const wordCount = entry.content.trim().split(/\s+/).filter(Boolean).length;
                  const turnCount = entry.turns?.length || 0;

                  return (
                    <div
                      key={entry.id}
                      id={`entry-card-${entry.id}`}
                      onClick={() => onSelectEntry(entry)}
                      className={`group relative p-3 rounded-xl cursor-pointer transition border ${
                        isSelected
                          ? 'bg-amber-50/70 border-amber-300 shadow-sm text-stone-900 ring-1 ring-amber-400/30'
                          : 'bg-stone-50/50 hover:bg-stone-100/80 border-stone-200/70 text-stone-700'
                      }`}
                    >
                      {/* Top Bar: Title & Pin/Delete actions */}
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-sm line-clamp-1 flex-1 text-stone-900">
                          {entry.title || 'Untitled Reflection'}
                        </h4>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onTogglePin(entry.id, !entry.isPinned);
                            }}
                            className={`p-1 rounded hover:bg-stone-200/80 transition ${
                              entry.isPinned ? 'text-amber-600' : 'text-stone-400'
                            }`}
                            title={entry.isPinned ? 'Unpin' : 'Pin to top'}
                          >
                            <Pin className="w-3.5 h-3.5 fill-current" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEntryToDelete(entry.id);
                            }}
                            className="p-1 rounded hover:bg-rose-100 text-stone-400 hover:text-rose-600 transition"
                            title="Delete entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Content Preview */}
                      <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed mb-2">
                        {entry.content || 'Empty entry. Click to write your thoughts...'}
                      </p>

                      {/* Bottom Meta & Badges */}
                      <div className="flex items-center justify-between gap-2 text-[10px] text-stone-400">
                        <div className="flex items-center gap-2">
                          {entry.mood && (
                            <span className="px-1.5 py-0.5 rounded bg-stone-200/60 text-stone-700 font-medium">
                              {entry.mood}
                            </span>
                          )}
                          <span>{wordCount} words</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {turnCount > 0 && (
                            <span className="flex items-center gap-1 text-amber-700 font-medium">
                              <Sparkles className="w-3 h-3 text-amber-500" />
                              {turnCount} {turnCount === 1 ? 'turn' : 'turns'}
                            </span>
                          )}
                          <span>
                            {new Date(entry.updatedAt || entry.createdAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {entryToDelete && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-xl border border-stone-200 text-stone-800">
            <h4 className="font-semibold text-base mb-2">Delete this reflection?</h4>
            <p className="text-xs text-stone-500 leading-relaxed mb-5">
              This action will permanently delete this journal entry and all Gemini conversation turns from your Firestore database.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setEntryToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteEntry(entryToDelete);
                  setEntryToDelete(null);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
