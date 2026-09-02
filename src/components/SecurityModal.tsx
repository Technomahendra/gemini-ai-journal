import React from 'react';
import { ShieldCheck, Lock, Database, Key, CheckCircle2, X, FileCode } from 'lucide-react';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({ isOpen, onClose, userId }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif-title font-bold text-base text-stone-100">
                Security & Data Isolation Architecture
              </h3>
              <p className="text-xs text-stone-400">Zero-Trust Cloud Firestore & Gemini Protection</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-stone-700">
          {/* Active User Isolation Path */}
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
            <div className="font-semibold text-amber-900 mb-1 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-amber-700" />
              Active User Storage Boundary
            </div>
            <p className="text-stone-600 leading-relaxed">
              Your journal entries and conversation turns are stored exclusively at:
            </p>
            <div className="mt-1.5 p-2 rounded-lg bg-white border border-amber-300 font-mono text-[11px] text-amber-950 break-all select-all">
              /users/{userId || 'YOUR_AUTHENTICATED_UID'}/entries/{'{entryId}'}
            </div>
          </div>

          {/* Active Firestore Security Rules snippet */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-stone-900 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-emerald-600" />
                Deployed Firestore Security Rules (firestore.rules)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                Deployed & Active
              </span>
            </div>
            <pre className="p-3 rounded-xl bg-stone-900 text-stone-200 font-mono text-[11px] leading-relaxed overflow-x-auto border border-stone-800">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /{allSubcollections=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}`}
            </pre>
          </div>

          {/* Key Security Mitigations */}
          <div className="space-y-2 pt-2 border-t border-stone-100">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-stone-900">Zero Password Footprint:</strong> Federated identity management via Google OAuth 2.0. Passwords never touch application state.
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-stone-900">Zero Client-Exposed API Keys:</strong> The Gemini API key remains strictly server-side on the Express backend runtime.
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-stone-900">Zero-Crash Payload Hygiene:</strong> Strict undefined-stripping utility purges undefined values to preserve transaction integrity.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-100 bg-stone-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-800 bg-stone-200 hover:bg-stone-300 rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
