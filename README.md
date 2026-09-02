# Gemini AI Journal & Reflections (Cloud Firestore + Google Authentication)

A private, user-authenticated reflection and journaling workspace powered by **Google Gemini 3.6 Flash** and **Cloud Firestore**. Every reflection, prompt, insight, and multi-turn AI dialogue is strictly isolated to the authenticated user's account path with Zero-Trust access control.

---

## 🛡️ Threat Summary Table

| Threat Zone | Identified Risk | Severity | Countermeasure & Mitigation |
| :--- | :--- | :--- | :--- |
| **Input Surfaces** | Malicious injection or oversized inputs in journal entries | High | Strict schema validation, character length limits, text sanitization, and structured parameterization. |
| **Planning & Reasoning** | Prompt injection attempting system instruction bypass or cross-user inference | High | Encapsulated system prompts, strict context delimiters, and server-side fallback model ladders (`gemini-3.6-flash` $\rightarrow$ `gemini-3.1-flash-lite` $\rightarrow$ `gemini-flash-latest` $\rightarrow$ `gemini-3.7-flash`). |
| **Tool Execution** | Unauthorized API usage or direct client exposure of API keys | Critical | Zero API keys exposed on the client. Server-side proxy API endpoints (`/api/gemini/*`) with rate limiting and input validation. |
| **Memory & State** | Cross-tenant / cross-user data leakage and unauthorized Firestore reads/writes | Critical | Zero-trust ABAC Firestore security rules enforcing strict owner-bound paths (`request.auth.uid == userId`). |
| **Inter-System Communication** | Token tampering, identity spoofing, and unverified sessions | High | Federated Firebase Authentication via Google Sign-In with backend token validation and strict session verification. |

---

## 🔒 1. Firestore Security Rules

Deploy the following security rules to Cloud Firestore to enforce strict, owner-bound data isolation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /{allSubcollections=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

---

## 🔑 2. Secret Management Bindings (Google Cloud Secret Manager)

To ensure zero hardcoded credentials and prevent token leakage in production containers:

```bash
# 1. Enable Secret Manager API
gcloud services enable secretmanager.googleapis.com

# 2. Create and populate the Gemini API key secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 3. Grant the Cloud Run default compute service account permission to access the secret
export PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format='value(projectNumber)')

gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 🚀 3. Cloud Run Deployment Flow

```bash
# 1. Build and deploy container to Google Cloud Run
gcloud run deploy gemini-reflect-app \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --port 3000

# 2. Apply mandatory campaign verification label
gcloud run services update gemini-reflect-app \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 🧪 4. Functional Stability & User Walkthrough Test Plan

Every user process and interaction is verifiable via the following structured test scripts:

### Test Case 1: Authentication & Landing Page Routing
- **Step 1.1**: Open the app URL in a clean browser window. Verify that the landing page displays with "Continue with Google" and "Explore Demo Session".
- **Step 1.2**: Click **"Continue with Google"** (or **"Explore Demo Session"**).
- **Step 1.3**: Verify that upon successful sign-in, the user profile avatar and name appear in the top navigation bar, and the private reflection workspace unlocks.

### Test Case 2: New Reflection Creation & Real-Time Sync
- **Step 2.1**: Click the **"+ New Entry"** button in the navigation bar or sidebar.
- **Step 2.2**: Enter a title (e.g. `Navigating Team Deadlines`) and select a mood chip (e.g. `🔥 Focused`).
- **Step 2.3**: Type a short reflection in the main text area (e.g., `We have three major releases due next Friday. I want to balance velocity without burning out the team.`).
- **Step 2.4**: Add a tag `#Work` and click **"Save"**.
- **Step 2.5**: Confirm the top save indicator shows `Saved to Firestore` with the current timestamp.

### Test Case 3: Gemini AI Reflection & Multi-Turn Dialogue
- **Step 3.1**: Select **"Deep Reflection"** mode and click **"Reflect with Gemini"**.
- **Step 3.2**: Observe the loading indicator and verify Gemini returns an empathetic, structured Markdown analysis with follow-up inquiry questions.
- **Step 3.3**: In the follow-up input bar at the bottom, type: `How can I structure daily standups to detect burnout early?` and click **"Send"** (or press Enter).
- **Step 3.4**: Verify that Turn 2 is appended to the conversation stream and immediately persisted to Firestore.

### Test Case 4: Executive Summary Generation
- **Step 4.1**: Click the **"Executive Summary"** button above the reflection editor.
- **Step 4.2**: Verify that Gemini generates a synthesis card containing:
  - 🎯 Core Synthesis
  - 💡 Key Insights
  - 🌿 Emotional Climate
  - 🚀 Actionable Micro-Steps
- **Step 4.3**: Click the **Copy** icon on the summary card and verify clipboard copy confirmation.

### Test Case 5: History Search, Tag Filtering & Pinning
- **Step 5.1**: In the left sidebar search bar, type `Deadlines`. Verify the list filters in real-time.
- **Step 5.2**: Click the **Pin** icon on the entry card. Verify it moves to the top `Pinned` section.
- **Step 5.3**: Click the `#Work` tag filter pill. Verify only entries with `#Work` are displayed.

### Test Case 6: Prompts Inspiration & Analytics Modals
- **Step 6.1**: Click **"Prompts"** in the top navigation. Browse categories (`Growth`, `Gratitude`, `Career`) and click **"Generate Fresh"**.
- **Step 6.2**: Click any prompt card. Verify a new reflection opens with the pre-filled prompt inquiry.
- **Step 6.3**: Click **"Analytics"** in the top navbar. Verify reflection count, turn counts, and mood distributions accurately reflect your database state.

### Test Case 7: Sign Out & Session Teardown
- **Step 7.1**: Click the **Sign Out** icon in the navbar.
- **Step 7.2**: Verify the dashboard unmounts cleanly and returns to the secure Landing Page with zero lingering state.
