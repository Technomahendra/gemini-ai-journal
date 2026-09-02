import React, { useState, useEffect, useCallback } from 'react';
import type { JournalEntry, UserProfile, PromptIdea } from './types';
import {
  signInWithGoogle,
  signInAsGuest,
  logOut,
  listenToAuthState,
  subscribeToUserEntries,
  saveJournalEntryToFirestore,
  deleteJournalEntryFromFirestore,
  togglePinJournalEntry,
} from './lib/firebase';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { EntryList } from './components/EntryList';
import { EntryEditor } from './components/EntryEditor';
import { PromptInspirationModal } from './components/PromptInspirationModal';
import { StatsModal } from './components/StatsModal';
import { SecurityModal } from './components/SecurityModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Journal Entries state
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  // Modals state
  const [isInspirationOpen, setIsInspirationOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);

  // Listen to Auth state
  useEffect(() => {
    const unsubscribe = listenToAuthState((user) => {
      if (user) {
        setCurrentUser({
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          isAnonymous: user.isAnonymous,
        });
        setAuthError(null);
      } else {
        setCurrentUser(null);
        setEntries([]);
        setSelectedEntryId(null);
      }
      setIsAuthChecking(false);
    });

    return () => unsubscribe();
  }, []);

  // Listen to real-time Firestore collection when user is logged in
  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubscribe = subscribeToUserEntries(
      currentUser.uid,
      (userEntries) => {
        setEntries(userEntries);
        // If there is no selection yet and entries exist, select the first entry
        setSelectedEntryId((prev) => {
          if (prev && userEntries.some((e) => e.id === prev)) {
            return prev;
          }
          return userEntries.length > 0 ? userEntries[0].id : null;
        });
      },
      (error) => {
        console.error('Realtime Firestore subscription error:', error);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Handle Google Sign In
  const handleSignInWithGoogle = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.warn('Google Sign-in encountered an environment/key restriction, starting instant session:', err);
      // Auto-fallback to instant exploration session so user is never blocked
      try {
        await signInAsGuest();
      } catch (guestErr: any) {
        setAuthError(err?.message || 'Unable to complete sign-in.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  // Handle Guest Sign In
  const handleSignInAsGuest = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      await signInAsGuest();
    } catch (err: any) {
      console.error('Guest sign-in failed:', err);
      setAuthError(err.message || 'Unable to start guest session.');
    } finally {
      setIsSigningIn(false);
    }
  };

  // Handle Sign Out
  const handleSignOut = async () => {
    try {
      await logOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // Create a new blank reflection entry
  const handleCreateNewEntry = useCallback(() => {
    if (!currentUser?.uid) return;

    const newId = `entry-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newEntry: JournalEntry = {
      id: newId,
      userId: currentUser.uid,
      title: '',
      content: '',
      mood: '🌿 Calm',
      tags: ['Daily'],
      mode: 'reflection',
      turns: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Optimistically update local entries list and select it
    setEntries((prev) => [newEntry, ...prev]);
    setSelectedEntryId(newId);

    // Save to Firestore
    saveJournalEntryToFirestore(currentUser.uid, newEntry).catch((err) => {
      console.error('Failed to create entry in Firestore:', err);
    });
  }, [currentUser?.uid]);

  // Select a prompt from inspiration modal and create a new entry with it
  const handleSelectPromptFromInspiration = (promptIdea: PromptIdea) => {
    if (!currentUser?.uid) return;

    const newId = `entry-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newEntry: JournalEntry = {
      id: newId,
      userId: currentUser.uid,
      title: promptIdea.title,
      content: `Prompt: ${promptIdea.prompt}\n\nReflection:\n`,
      mood: '💭 Reflective',
      tags: [promptIdea.tag || 'Inspiration'],
      mode: 'reflection',
      turns: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setEntries((prev) => [newEntry, ...prev]);
    setSelectedEntryId(newId);

    saveJournalEntryToFirestore(currentUser.uid, newEntry).catch((err) => {
      console.error('Failed to save inspiration entry in Firestore:', err);
    });
  };

  // Save entry callback
  const handleSaveEntry = async (updatedEntry: JournalEntry) => {
    if (!currentUser?.uid) return;
    setIsSaving(true);
    try {
      await saveJournalEntryToFirestore(currentUser.uid, updatedEntry);
      setLastSavedAt(Date.now());
      // Optimistic local state update
      setEntries((prev) =>
        prev.map((e) => (e.id === updatedEntry.id ? updatedEntry : e))
      );
    } catch (error) {
      console.error('Error saving entry to Firestore:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete entry callback
  const handleDeleteEntry = async (entryId: string) => {
    if (!currentUser?.uid) return;
    try {
      await deleteJournalEntryFromFirestore(currentUser.uid, entryId);
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
      if (selectedEntryId === entryId) {
        const remaining = entries.filter((e) => e.id !== entryId);
        setSelectedEntryId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  // Toggle Pin callback
  const handleTogglePin = async (entryId: string, currentPin: boolean) => {
    if (!currentUser?.uid) return;
    try {
      await togglePinJournalEntry(currentUser.uid, entryId, currentPin);
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  // Active selected entry object
  const activeEntry = entries.find((e) => e.id === selectedEntryId) || null;

  // If initial auth checking, display warm loader
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-stone-900 text-stone-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto animate-pulse">
            <span className="font-serif-title font-bold text-xl">R</span>
          </div>
          <p className="text-xs text-stone-400 font-medium">Securing private session...</p>
        </div>
      </div>
    );
  }

  // If user is not logged in, render the Landing / Sign-in view
  if (!currentUser) {
    return (
      <LandingPage
        onSignInWithGoogle={handleSignInWithGoogle}
        onSignInAsGuest={handleSignInAsGuest}
        onDismissError={() => setAuthError(null)}
        isSigningIn={isSigningIn}
        authError={authError}
      />
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col h-screen overflow-hidden">
      {/* Top Navbar */}
      <Navbar
        user={currentUser}
        onSignOut={handleSignOut}
        onNewEntry={handleCreateNewEntry}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenInspiration={() => setIsInspirationOpen(true)}
        onOpenSecurity={() => setIsSecurityOpen(true)}
        entryCount={entries.length}
        isSaving={isSaving}
        lastSavedAt={lastSavedAt}
      />

      {/* Main Workspace Layout (Sidebar + Editor) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Searchable, Filterable Entries History Sidebar */}
        <EntryList
          entries={entries}
          selectedEntryId={selectedEntryId}
          onSelectEntry={(entry) => setSelectedEntryId(entry.id)}
          onDeleteEntry={handleDeleteEntry}
          onTogglePin={handleTogglePin}
          onNewEntry={handleCreateNewEntry}
        />

        {/* Right: Multi-turn Reflection Editor & Gemini Partner */}
        <EntryEditor
          entry={activeEntry}
          onSaveEntry={handleSaveEntry}
          isSaving={isSaving}
        />
      </div>

      {/* Prompts Inspiration Modal */}
      <PromptInspirationModal
        isOpen={isInspirationOpen}
        onClose={() => setIsInspirationOpen(false)}
        onSelectPrompt={handleSelectPromptFromInspiration}
      />

      {/* Stats Modal */}
      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        entries={entries}
      />

      {/* Security Details Modal */}
      <SecurityModal
        isOpen={isSecurityOpen}
        onClose={() => setIsSecurityOpen(false)}
        userId={currentUser.uid}
      />
    </div>
  );
}
