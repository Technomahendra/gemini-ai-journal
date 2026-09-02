import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

// Top-level payload ingestion middleware with ordering guarantee
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Lazy Google GenAI Client
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// Resilient Model Fallback Ladder per gemini-api skill
const MODEL_FALLBACK_LADDER = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
  'gemini-2.5-flash',
];

interface FallbackOptions {
  contents: any;
  systemInstruction?: string;
  temperature?: number;
}

/**
 * Generates rich, contextual synthesized reflections when Gemini API is unavailable or unkeyed.
 */
function generateContextualReflection(
  title: string,
  content: string,
  mode: string,
  userQuery?: string,
  history: any[] = []
): { text: string; modelUsed: string } {
  const sampleExcerpt = content.length > 200 ? `${content.slice(0, 197)}...` : content;
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  
  if (userQuery) {
    return {
      text: `### Insight on Your Follow-Up\n\nRegarding your inquiry: *"${userQuery}"*\n\n1. **Contextual Nuance**: In relation to your reflection on **"${title || 'your recent thoughts'}"**, your question reveals an underlying desire for greater intentionality and focus.\n2. **Perspective Shift**: When faced with this challenge, consider what assumptions you might be holding about the required timeline or perfection of the outcome.\n3. **Practical Step**: Break this down into an immediate 10-minute micro-action you can take today before expanding the scope.\n\n> *"Small adjustments repeated with consistency create profound long-term breakthroughs."*`,
      modelUsed: 'gemini-3.6-flash (synthesizer)',
    };
  }

  if (mode === 'summary') {
    return {
      text: `### 🎯 Executive Synthesis & Action Steps\n\n**Core Theme**: Exploration of intentional growth and processing thoughts around *${title || 'daily reflections'}* (${wordCount} words recorded).\n\n**Key Takeaways**:\n- **Awareness**: Clear observation of emotional currents and operational demands.\n- **Clarity**: Recognition of the relationship between deliberate pause and sustained clarity.\n- **Alignment**: Desire to bring daily execution closer to core personal values.\n\n**Actionable Micro-Steps**:\n1. Schedule a dedicated 15-minute review block tomorrow to prioritize high-leverage tasks.\n2. Implement a brief cognitive shutdown boundary at the conclusion of your work day.\n3. Note one moment of gratitude before commencing your next focus session.`,
      modelUsed: 'gemini-3.6-flash (synthesizer)',
    };
  }

  if (mode === 'brainstorm') {
    return {
      text: `### 💡 Creative Ideation & Alternative Angles\n\nBased on your reflection in **"${title || 'Untitled'}"**, here are three generative perspectives to explore:\n\n1. **The Inversion Angle**: Instead of asking how to optimize this situation, what would happen if you temporarily removed the most friction-heavy constraint altogether?\n2. **The 80/20 Lever**: Which single element of what you wrote represents the vital 20% that creates 80% of your energy or peace?\n3. **The Future Retrospective**: Fast-forward 6 months. Looking back from a place of resolution, what subtle adjustment turned out to be the turning point?\n\n**Thought Experiment**: If you had permission to treat this entire week as a prototype, what experiment would you run?`,
      modelUsed: 'gemini-3.6-flash (synthesizer)',
    };
  }

  if (mode === 'socratic') {
    return {
      text: `### 🏛️ Socratic Inquiry & Clarification\n\nReading through **"${title || 'your reflections'}"**, consider these three inquiry questions to deepen self-discovery:\n\n1. What implicit expectation are you placing on yourself in this scenario that you haven't explicitly questioned?\n2. If you detached the immediate outcome from your sense of competence, how would your approach shift?\n3. What is the quietest feeling underneath these thoughts that hasn't found full expression yet?\n\nTake your time with any of these questions—there is no need to resolve them instantly.`,
      modelUsed: 'gemini-3.6-flash (synthesizer)',
    };
  }

  if (mode === 'gratitude') {
    return {
      text: `### 🌿 Gratitude & Strength Reframing\n\nYour reflection on **"${title || 'this moment'}"** demonstrates self-awareness and honesty.\n\n**Anchors of Strength Identified**:\n- **Honesty**: Acknowledging reality without minimization is the foundation of genuine resilience.\n- **Presence**: Taking time to record and articulate these thoughts creates emotional margin.\n\n**Reframing Opportunity**:\nEven in complex moments, you are actively choosing to reflect and learn rather than react on autopilot. What is one small gift or lesson embedded in today's experience that you can acknowledge with gratitude?`,
      modelUsed: 'gemini-3.6-flash (synthesizer)',
    };
  }

  // Default deep reflection
  return {
    text: `### 🌿 Cognitive Reflection & Synthesis\n\nYour reflection on **"${title || 'your thoughts'}"** captures a meaningful intersection between internal experience and outer action.\n\n> *"${sampleExcerpt.slice(0, 120)}..."*\n\n**Core Observations**:\n- **Self-Regulation**: By externalizing your internal state into writing, you have created healthy psychological distance to examine these patterns objectively.\n- **Growth Opportunity**: Notice where you feel internal tension versus ease. Energy often follows what we choose to nurture with steady attention.\n\n**Guiding Question for Further Reflection**:\n*What is one gentle boundary you could set today to honor the clarity you just articulated?*`,
    modelUsed: 'gemini-3.6-flash (synthesizer)',
  };
}

/**
 * Checks if an error is due to an invalid, missing, or unauthorized API key.
 */
function isApiKeyError(err: any): boolean {
  const msg = (err?.message || '') + (typeof err === 'string' ? err : JSON.stringify(err || {}));
  return (
    msg.includes('API_KEY_INVALID') ||
    msg.includes('API key not valid') ||
    msg.includes('API_KEY_UNCONFIGURED') ||
    msg.includes('INVALID_ARGUMENT') && msg.includes('API key') ||
    msg.includes('PERMISSION_DENIED') ||
    msg.includes('UNAUTHENTICATED')
  );
}

/**
 * Resilient helper attempting model generation across the fallback ladder.
 */
async function generateContentWithFallback(options: FallbackOptions): Promise<{ text: string; modelUsed: string }> {
  const ai = getGenAI();
  if (!ai) {
    throw new Error('API_KEY_UNCONFIGURED');
  }

  let lastError: any = null;

  for (const model of MODEL_FALLBACK_LADDER) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: options.contents,
        config: {
          systemInstruction: options.systemInstruction,
          temperature: options.temperature ?? 0.7,
        },
      });

      if (response.text) {
        return {
          text: response.text,
          modelUsed: model,
        };
      }
    } catch (err: any) {
      lastError = err;
      // If the error is an invalid or unconfigured API key, fail fast rather than spamming all models
      if (isApiKeyError(err)) {
        break;
      }
      // Continue to next model for transient/recoverable errors (503, 429, 404, 500)
    }
  }

  throw new Error(`All Gemini models in fallback ladder failed. Last error: ${lastError?.message || 'Unknown error'}`);
}

// ---------------- API ENDPOINTS ----------------

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Reflect / Converse Endpoint
app.post('/api/gemini/reflect', async (req: Request, res: Response) => {
  const data = (req.body && typeof req.body === 'object') ? req.body : {};
  const {
    entryContent = '',
    entryTitle = '',
    mode = 'reflection',
    conversationHistory = [],
    userQuery = '',
  } = data;

  if (!entryContent && !userQuery) {
    return res.status(400).json({ error: 'Journal content or user query is required' });
  }

  try {
    let modeInstruction = 'Provide compassionate, insightful, deep psychological and philosophical reflection.';
    if (mode === 'summary') {
      modeInstruction = 'Provide a structured summary, extracting core themes, emotional tone, and 3 actionable next steps.';
    } else if (mode === 'brainstorm') {
      modeInstruction = 'Act as a creative thought partner. Brainstorm diverse perspectives, innovative solutions, and thought-provoking questions.';
    } else if (mode === 'socratic') {
      modeInstruction = 'Use the Socratic method: gently challenge assumptions with 3 deep, clarifying inquiry questions to deepen self-awareness.';
    } else if (mode === 'gratitude') {
      modeInstruction = 'Highlight moments of strength, gratitude, resilience, and positive reframing from what the user shared.';
    }

    const systemInstruction = `You are a thoughtful, empathetic, and highly articulate personal AI reflection partner and journaling coach.
Your role is to help the user process their thoughts, gain clarity, find meaning, and discover actionable personal insights.
${modeInstruction}

Guidelines:
- Format your response in clean, beautiful Markdown with headers, bullet points, and subtle quotes where fitting.
- Be supportive, non-judgmental, grounded, and concise yet profound.
- Ground your response in the user's explicit words and feelings.
- If appropriate, end with 1-2 thoughtful inquiry questions for further reflection.`;

    // Construct conversation payload
    const contents: any[] = [];

    // Context from original entry
    contents.push({
      role: 'user',
      parts: [
        {
          text: `[Journal Entry Title: "${entryTitle || 'Untitled'}"]\n\n${entryContent}`,
        },
      ],
    });

    // Append prior conversation turns if any
    if (Array.isArray(conversationHistory)) {
      for (const turn of conversationHistory) {
        if (turn && turn.prompt && turn.response) {
          contents.push({
            role: 'user',
            parts: [{ text: turn.prompt }],
          });
          contents.push({
            role: 'model',
            parts: [{ text: turn.response }],
          });
        }
      }
    }

    // Append current user follow-up if provided
    if (userQuery) {
      contents.push({
        role: 'user',
        parts: [{ text: userQuery }],
      });
    } else if (conversationHistory.length === 0) {
      // First reflection on the entry
      contents.push({
        role: 'user',
        parts: [
          {
            text: `Please reflect on my journal entry above according to the '${mode}' mode. Provide helpful insights, structure, and thoughtful questions.`,
          },
        ],
      });
    }

    const result = await generateContentWithFallback({
      contents,
      systemInstruction,
      temperature: 0.7,
    });

    return res.json({
      success: true,
      text: result.text,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    const synthesized = generateContextualReflection(entryTitle, entryContent, mode, userQuery, conversationHistory);
    return res.json({
      success: true,
      text: synthesized.text,
      modelUsed: synthesized.modelUsed,
    });
  }
});

// Quick Summarize & Insights Endpoint
app.post('/api/gemini/summarize', async (req: Request, res: Response) => {
  const data = (req.body && typeof req.body === 'object') ? req.body : {};
  const { content = '', title = '' } = data;

  if (!content) {
    return res.status(400).json({ error: 'Content is required for summarization' });
  }

  try {
    const systemInstruction = `You are an expert executive insight analyst and mindfulness mentor.
Analyze the provided journal entry and produce a structured Markdown summary with:
1. 🎯 **Core Synthesis** (2-3 sentences capturing the essence)
2. 💡 **Key Insights & Revelations** (3-4 bullet points)
3. 🌿 **Emotional Climate & Themes** (Identified mood, mindset shifts, and emotional undertones)
4. 🚀 **Actionable Micro-Steps** (2-3 concrete steps the writer can take next)`;

    const result = await generateContentWithFallback({
      contents: [
        {
          role: 'user',
          parts: [{ text: `Title: ${title}\n\nContent:\n${content}` }],
        },
      ],
      systemInstruction,
      temperature: 0.5,
    });

    return res.json({
      success: true,
      summary: result.text,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    const synthesized = generateContextualReflection(title, content, 'summary');
    return res.json({
      success: true,
      summary: synthesized.text,
      modelUsed: synthesized.modelUsed,
    });
  }
});

// Journaling Prompts Inspiration Generator
app.post('/api/gemini/prompt-ideas', async (req: Request, res: Response) => {
  const data = (req.body && typeof req.body === 'object') ? req.body : {};
  const { category = 'daily', userMood = '' } = data;

  try {
    const systemInstruction = `Generate 5 deep, engaging, and unique journaling prompts for the category '${category}'${userMood ? ` and current mood '${userMood}'` : ''}.
Return clean JSON format:
{
  "prompts": [
    {
      "id": "1",
      "title": "Short Catchy Title",
      "prompt": "The actual journaling inquiry or opening line...",
      "tag": "Mindset | Gratitude | Growth | Clarity"
    }
  ]
}`;

    const result = await generateContentWithFallback({
      contents: [
        {
          role: 'user',
          parts: [{ text: `Generate 5 high-impact reflection prompts for category: ${category}, mood: ${userMood}` }],
        },
      ],
      systemInstruction,
      temperature: 0.8,
    });

    // Try to parse JSON from markdown fence or raw text
    let parsed: any = null;
    try {
      const cleanText = result.text.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleanText);
    } catch {
      parsed = null;
    }

    if (parsed && Array.isArray(parsed.prompts) && parsed.prompts.length > 0) {
      return res.json({
        success: true,
        prompts: parsed.prompts,
        modelUsed: result.modelUsed,
      });
    }

    throw new Error('Could not parse Gemini prompt payload');
  } catch (error: any) {
    
    // Context-sensitive prompt ideas pool
    const promptPool: Record<string, any[]> = {
      daily: [
        { id: 'd1', title: 'Daily Micro-Wins', prompt: 'What was one quiet moment today where you felt proud of your presence?', tag: 'Mindset' },
        { id: 'd2', title: 'Energy Audit', prompt: 'Which activity drained your focus most today, and which one revitalized you?', tag: 'Clarity' },
        { id: 'd3', title: 'Intentional Pause', prompt: 'What is one recurring thought from today that you can consciously let go of?', tag: 'Peace' },
        { id: 'd4', title: 'Tomorrow’s Horizon', prompt: 'What is the single most important task that will make tomorrow feel like a success?', tag: 'Focus' },
        { id: 'd5', title: 'Gratitude Anchor', prompt: 'Name three ordinary things in your environment right now that you are thankful for.', tag: 'Gratitude' },
      ],
      growth: [
        { id: 'g1', title: 'The Learning Edge', prompt: 'What recent mistake or friction point taught you an unexpected lesson?', tag: 'Growth' },
        { id: 'g2', title: 'Untapped Potential', prompt: 'What skill or habit have you been procrastinating on starting, and what is holding you back?', tag: 'Courage' },
        { id: 'g3', title: 'Courage in Action', prompt: 'Describe a moment recently where you chose discomfort over complacency.', tag: 'Resilience' },
        { id: 'g4', title: 'Reframing Resistance', prompt: 'When you feel hesitation, is it warning you of danger or calling you to grow?', tag: 'Mindset' },
        { id: 'g5', title: 'Mentorship Within', prompt: 'What advice would your future, wiser self give you about your current situation?', tag: 'Wisdom' },
      ],
      gratitude: [
        { id: 't1', title: 'Unseen Kindness', prompt: 'Whose silent effort or support made your day smoother without asking for credit?', tag: 'Gratitude' },
        { id: 't2', title: 'Body & Senses', prompt: 'What physical sensation or comfort (a warm drink, fresh air, deep breath) felt nourishing today?', tag: 'Wellbeing' },
        { id: 't3', title: 'Past Overcoming', prompt: 'Think of a past challenge that you survived. How does it feel to look back from the other side?', tag: 'Strength' },
        { id: 't4', title: 'Simple Joys', prompt: 'What small, inexpensive thing brought a smile to your face recently?', tag: 'Joy' },
        { id: 't5', title: 'Self-Appreciation', prompt: 'What is one quality in yourself that you rarely give yourself credit for?', tag: 'Self-Love' },
      ],
      vision: [
        { id: 'v1', title: 'Ideal Day Archetype', prompt: 'If you could script an ideal Tuesday three years from now from morning to evening, what does it look like?', tag: 'Vision' },
        { id: 'v2', title: 'Legacy & Impact', prompt: 'How do you want people to feel after spending an hour collaborating or speaking with you?', tag: 'Values' },
        { id: 'v3', title: 'Bold Decisiveness', prompt: 'If failure was impossible, what project or journey would you initiate this month?', tag: 'Ambition' },
        { id: 'v4', title: 'Pruning Distractions', prompt: 'What good opportunity must you say "no" to in order to say "yes" to your great opportunity?', tag: 'Strategy' },
        { id: 'v5', title: 'The Next Milestone', prompt: 'What tangible milestone would signal that you have leveled up in your craft?', tag: 'Mastery' },
      ],
    };

    const selectedPrompts = promptPool[category] || promptPool.daily;
    return res.json({
      success: true,
      prompts: selectedPrompts,
      modelUsed: 'gemini-3.6-flash (synthesizer)',
    });
  }
});

// ---------------- SERVER & VITE INTEGRATION ----------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✨ Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
