import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  signInAnonymously,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  getDocFromServer,
} from 'firebase/firestore';
import type { JournalEntry } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Auth Instance
export const auth = getAuth(app);

// Firestore Instance (bound to custom databaseId if configured)
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Test Firestore Connection on boot as required by Firebase skill (graceful offline handling)
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    // Expected when offline or before rules permit /test path; Firestore client automatically switches to offline persistence mode
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.info('Firestore client operating in offline cache mode.');
    }
  }
}
testConnection().catch(() => {});

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Concurrency mutex to prevent duplicate simultaneous signInWithPopup calls
// which trigger "@firebase/auth: INTERNAL ASSERTION FAILED: Pending promise was never set"
let isAuthOperationInProgress = false;

// Custom subscriber for guest / fallback mode
type AuthListenerCallback = (user: User | { uid: string; displayName: string; email: string; photoURL: string; isAnonymous: boolean } | null) => void;
const customAuthListeners = new Set<AuthListenerCallback>();
let simulatedGuestUser: { uid: string; displayName: string; email: string; photoURL: string; isAnonymous: boolean } | null = null;

function notifyCustomAuthListeners(user: any) {
  customAuthListeners.forEach((listener) => listener(user));
}

/**
 * Sign in with Google Popup with robust concurrency lock and descriptive error mapping
 */
export async function signInWithGoogle(): Promise<User | null> {
  if (isAuthOperationInProgress) {
    console.warn('Authentication request already in progress, ignoring duplicate call.');
    return null;
  }

  isAuthOperationInProgress = true;

  try {
    const result = await signInWithPopup(auth, googleProvider);
    simulatedGuestUser = null;
    return result.user;
  } catch (error: any) {
    console.warn('Google Sign In result/error code:', error?.code, error?.message);

    const errorCode = error?.code || '';

    if (errorCode === 'auth/popup-closed-by-user' || errorCode === 'auth/cancelled-popup-request') {
      throw new Error('Google Sign-in was closed before completing. Please try clicking "Continue with Google" again.');
    }

    if (errorCode === 'auth/popup-blocked') {
      throw new Error('Sign-in popup was blocked by your browser. Please allow popups for this site or open in a new tab.');
    }

    if (errorCode === 'auth/network-request-failed') {
      throw new Error('Network connection to Firebase Auth was interrupted. If you are inside an iframe preview, please open the app in a new window or use Demo Exploration.');
    }

    if (errorCode === 'auth/unauthorized-domain') {
      throw new Error('Current domain is not authorized in Firebase OAuth settings. Please use the Demo Exploration mode or add domain to Firebase Console.');
    }

    if (
      errorCode.includes('api-key-not-valid') ||
      errorCode.includes('invalid-api-key') ||
      error?.message?.includes('api-key-not-valid') ||
      error?.message?.includes('API key')
    ) {
      throw new Error('The Firebase API key is currently restricted or Identity Toolkit API is pending activation in GCP. Please click "Launch Instant Demo Session" to explore the full app with isolated session storage.');
    }

    if (errorCode === 'auth/operation-not-allowed') {
      throw new Error('Google sign-in provider is not enabled in Firebase Authentication console. Please click "Launch Instant Demo Session" to proceed.');
    }

    throw new Error(error?.message || 'Unable to complete Google authentication. Please try again or use Demo Exploration.');
  } finally {
    // Reset mutex after small timeout to ensure clean resolution
    setTimeout(() => {
      isAuthOperationInProgress = false;
    }, 400);
  }
}

/**
 * Sign in as Guest / Demo Exploration Session
 */
export async function signInAsGuest(): Promise<{ uid: string; displayName: string; email: string; photoURL: string; isAnonymous: boolean }> {
  try {
    const result = await signInAnonymously(auth);
    simulatedGuestUser = null;
    return {
      uid: result.user.uid,
      displayName: 'Guest Explorer',
      email: '',
      photoURL: '',
      isAnonymous: true,
    };
  } catch (error: any) {
    console.warn('Anonymous auth in Firebase not enabled or failed, providing instant local guest session:', error?.message);
    // Fallback: create resilient simulated guest user
    const guestId = `guest_${Math.random().toString(36).substring(2, 10)}`;
    
    // Seed initial demo entries for an immediate interactive experience
    const initialDemoEntries: JournalEntry[] = [
      {
        id: `demo_1_${Date.now()}`,
        userId: guestId,
        title: 'Architecting Focus & Mental Clarity',
        content:
          'Today I focused on eliminating task-switching fatigue. When working on deep problem solving, establishing 90-minute uninterrupted blocks increased cognitive throughput significantly. Next step: establish clear shutdown rituals at the end of each work cycle.',
        mood: 'focused',
        tags: ['Productivity', 'Mindset', 'Strategy'],
        mode: 'reflection',
        turns: [
          {
            id: `turn_1_${Date.now()}`,
            prompt: 'How can I optimize mental recovery after deep work sprints?',
            response:
              '### Cognitive Architecture & Focus Synthesis\n\nYour reflection highlights a core principle of **ultradian work cycles**. By setting 90-minute boundaries, you leverage natural neurochemical rhythms for sustained attention.\n\n**Recommended Exploration**:\n- What specific shutdown ritual can you test today to mark the psychological transition out of work mode?\n- How might you protect your morning cognitive bandwidth from reactive triage?',
            timestamp: Date.now() - 3600000,
            mode: 'reflection',
            modelUsed: 'gemini-3.6-flash',
          },
        ],
        isPinned: true,
        createdAt: Date.now() - 7200000,
        updatedAt: Date.now() - 3600000,
      },
      {
        id: `demo_2_${Date.now()}`,
        userId: guestId,
        title: 'Cultivating Gratitude in Daily Work',
        content:
          'Grateful for the team’s resilience during our recent release cycle, and the quiet 20-minute morning walk that helped me center my priorities before tackling the sprint backlog.',
        mood: 'grateful',
        tags: ['Gratitude', 'Wellbeing'],
        mode: 'gratitude',
        turns: [],
        isPinned: false,
        createdAt: Date.now() - 86400000,
        updatedAt: Date.now() - 86400000,
      },
    ];
    demoStorage.set(guestId, initialDemoEntries);

    simulatedGuestUser = {
      uid: guestId,
      displayName: 'Demo Explorer',
      email: 'demo@reflect.ai',
      photoURL: '',
      isAnonymous: true,
    };
    notifyCustomAuthListeners(simulatedGuestUser);
    notifyDemoListeners(guestId);
    return simulatedGuestUser;
  }
}

/**
 * Sign Out
 */
export async function logOut(): Promise<void> {
  simulatedGuestUser = null;
  notifyCustomAuthListeners(null);
  await signOut(auth);
}

/**
 * Auth State Change Listener
 */
export function listenToAuthState(callback: AuthListenerCallback) {
  customAuthListeners.add(callback);

  const unsubscribeFirebase = onAuthStateChanged(auth, (user) => {
    if (user) {
      simulatedGuestUser = null;
      callback(user);
    } else if (simulatedGuestUser) {
      callback(simulatedGuestUser);
    } else {
      callback(null);
    }
  });

  return () => {
    customAuthListeners.delete(callback);
    unsubscribeFirebase();
  };
}

// ---------------- FIRESTORE ERROR HANDLING ----------------

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || simulatedGuestUser?.uid || null,
      email: auth.currentUser?.email || simulatedGuestUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || false,
      isAnonymous: auth.currentUser?.isAnonymous || simulatedGuestUser?.isAnonymous || false,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  return errInfo;
}

/**
 * Strict undefined-stripping utility for zero-crash Firestore hygiene
 */
export function sanitizeFirestorePayload<T extends Record<string, any>>(obj: T): T {
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        sanitized[key] = value.map((item) =>
          typeof item === 'object' && item !== null ? sanitizeFirestorePayload(item) : item
        );
      } else if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
        sanitized[key] = sanitizeFirestorePayload(value);
      } else {
        sanitized[key] = value;
      }
    }
  }
  return sanitized as T;
}

// Local in-memory store and reactive listeners for guest/demo sessions
const demoStorage = new Map<string, JournalEntry[]>();
const demoListeners = new Map<string, Set<(entries: JournalEntry[]) => void>>();

function notifyDemoListeners(userId: string) {
  const listeners = demoListeners.get(userId);
  if (listeners) {
    const list = [...(demoStorage.get(userId) || [])];
    list.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });
    listeners.forEach((cb) => cb(list));
  }
}

/**
 * Realtime subscription to user's private entries collection (/users/{userId}/entries)
 */
export function subscribeToUserEntries(
  userId: string,
  onUpdate: (entries: JournalEntry[]) => void,
  onError?: (err: Error) => void
) {
  if (!userId) return () => {};

  // If this is a simulated demo user, subscribe to local in-memory store with full reactivity
  if (userId.startsWith('guest_')) {
    if (!demoListeners.has(userId)) {
      demoListeners.set(userId, new Set());
    }
    const listeners = demoListeners.get(userId)!;
    listeners.add(onUpdate);

    // Initial emission
    const list = [...(demoStorage.get(userId) || [])];
    list.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });
    onUpdate(list);

    return () => {
      listeners.delete(onUpdate);
    };
  }

  const entriesRef = collection(db, 'users', userId, 'entries');
  const q = query(entriesRef, orderBy('updatedAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const entries: JournalEntry[] = [];
      snapshot.forEach((docSnap) => {
        entries.push(docSnap.data() as JournalEntry);
      });
      onUpdate(entries);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${userId}/entries`);
      if (onError) onError(error);
    }
  );
}

/**
 * Save / Update a journal entry in Firestore (/users/{userId}/entries/{entryId})
 */
export async function saveJournalEntryToFirestore(userId: string, entry: JournalEntry): Promise<void> {
  if (!userId || !entry.id) {
    throw new Error('User ID and Entry ID are required to save.');
  }

  const cleanPayload = sanitizeFirestorePayload({
    ...entry,
    userId,
    updatedAt: Date.now(),
  });

  if (userId.startsWith('guest_')) {
    const list = demoStorage.get(userId) || [];
    const idx = list.findIndex((e) => e.id === entry.id);
    if (idx >= 0) {
      list[idx] = cleanPayload as JournalEntry;
    } else {
      list.unshift(cleanPayload as JournalEntry);
    }
    demoStorage.set(userId, list);
    notifyDemoListeners(userId);
    return;
  }

  const docRef = doc(db, 'users', userId, 'entries', entry.id);
  try {
    await setDoc(docRef, cleanPayload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/entries/${entry.id}`);
    throw error;
  }
}

/**
 * Delete a journal entry from Firestore
 */
export async function deleteJournalEntryFromFirestore(userId: string, entryId: string): Promise<void> {
  if (!userId || !entryId) return;

  if (userId.startsWith('guest_')) {
    const list = demoStorage.get(userId) || [];
    demoStorage.set(
      userId,
      list.filter((e) => e.id !== entryId)
    );
    notifyDemoListeners(userId);
    return;
  }

  const docRef = doc(db, 'users', userId, 'entries', entryId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}/entries/${entryId}`);
    throw error;
  }
}

/**
 * Toggle pinned status of an entry
 */
export async function togglePinJournalEntry(userId: string, entryId: string, isPinned: boolean): Promise<void> {
  if (!userId || !entryId) return;

  if (userId.startsWith('guest_')) {
    const list = demoStorage.get(userId) || [];
    const item = list.find((e) => e.id === entryId);
    if (item) {
      item.isPinned = isPinned;
      item.updatedAt = Date.now();
    }
    notifyDemoListeners(userId);
    return;
  }

  const docRef = doc(db, 'users', userId, 'entries', entryId);
  try {
    await updateDoc(docRef, { isPinned, updatedAt: Date.now() });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}/entries/${entryId}`);
    throw error;
  }
}
