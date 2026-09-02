export type ReflectionMode = 'reflection' | 'summary' | 'brainstorm' | 'socratic' | 'gratitude';

export interface ReflectionTurn {
  id: string;
  prompt: string;
  response: string;
  timestamp: number;
  mode?: ReflectionMode;
  modelUsed?: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  mood?: string;
  tags: string[];
  mode: ReflectionMode;
  turns: ReflectionTurn[];
  summary?: string;
  isPinned?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  isAnonymous?: boolean;
}

export interface PromptIdea {
  id: string;
  title: string;
  prompt: string;
  tag: string;
}
