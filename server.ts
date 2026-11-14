import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'academy-store.json');

const DEFAULT_PROGRESS = {
  profile: {
    name: 'Apprentice Candidate (428A)',
    age: 41,
    yearsShopExperience: 5,
    previousLocal: 'Ontario Boilermakers Local 128',
    currentLocal: 'Alberta Local 146 (Reinstated)',
    weldingTickets: ['SMAW Structural', 'FCAW Structural', 'Pipe Welding'],
    targetPath: 'Ontario 428A Classroom Exemption & Red Seal Readiness',
  },
  currentStudyLevel: 1,
  completedLessonIds: [],
  lessonAssessmentScores: {},
  diagnosticResult: null,
  assessmentHistory: [],
  weakSubjects: ['Mathematics', 'Rigging', 'Blueprint Reading'],
  studyNotes: [
    {
      id: 'note-initial-1',
      title: 'Shop Math Reminder — Mean Diameter vs OD',
      domain: 'Mathematics',
      level: 1,
      content:
        'Always subtract plate thickness from OD (or add to ID) before multiplying by pi when laying out rolled vessel shell blanks: Stretch-out = pi * (OD - t).',
      updatedAt: new Date().toISOString(),
    },
  ],
  uploadedDocs: [],
  studySchedule: [
    {
      day: 'Day 1 (Mon)',
      focusDomain: 'Mathematics',
      recommendedLessonId: 'l1-math-fractions-conversions',
      taskDescription: 'Complete 50-question diagnostic or start Trade Math I (Fractions, Decimals & Metric Conversions)',
      targetMinutes: 45,
      completed: false,
    },
    {
      day: 'Day 2 (Tue)',
      focusDomain: 'Mathematics',
      recommendedLessonId: 'l1-math-geometry-pythagoras',
      taskDescription: 'Trade Math II: Geometry, Cylinder Volumes & Pythagorean Pipe Offsets',
      targetMinutes: 45,
      completed: false,
    },
    {
      day: 'Day 3 (Wed)',
      focusDomain: 'Rigging',
      recommendedLessonId: 'l1-rigging-basics',
      taskDescription: 'Sling Tension Angles, L/H Ratio & Choker/Basket Derating Drills',
      targetMinutes: 45,
      completed: false,
    },
    {
      day: 'Day 4 (Thu)',
      focusDomain: 'Blueprint Reading',
      recommendedLessonId: 'l1-blueprint-basics',
      taskDescription: 'Third-Angle Orthographic Views & AWS/CSA Welding Symbol Practice',
      targetMinutes: 45,
      completed: false,
    },
    {
      day: 'Day 5 (Fri)',
      focusDomain: 'Industrial Equipment',
      recommendedLessonId: 'l1-boilers-steel-id',
      taskDescription: 'Fire-Tube vs Water-Tube Boilers, Drums, Downcomers & SA-516 Traceability',
      targetMinutes: 45,
      completed: false,
    },
    {
      day: 'Day 6 (Sat)',
      focusDomain: 'Safety',
      recommendedLessonId: 'l1-safety-foundations',
      taskDescription: 'Ontario OHSA, Confined Space Reg. 632/05, WHMIS 2015 & LOTO Review',
      targetMinutes: 60,
      completed: false,
    },
    {
      day: 'Day 7 (Sun)',
      focusDomain: 'Welding',
      recommendedLessonId: 'l1-welding-oxy-smaw',
      taskDescription: '25-Question Level 1 Practice Exam + Formula Sheet Review',
      targetMinutes: 60,
      completed: false,
    },
  ],
  bookmarkedFormulas: ['f-sling-tension', 'f-plate-weight', 'f-mean-circ', 'f-pythagoras'],
  weldingSessions: [],
  riggingSessions: [],
  signalProgress: {
    knownIds: [],
    practiceIds: [],
    bookmarkedIds: ['hoist', 'stop', 'emergency-stop'],
    srsNextDue: {},
    quizAttempts: 0,
    quizCorrect: 0,
  },
  bookmarkedGlossaryIds: ['e7018', 'dcep', 'undercut', 'heat-input', 'wll', 'sling-angle'],
  dailyStudySeconds: {},
  practiceTargetPct: 80,
  lastUpdatedAt: new Date().toISOString(),
};

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(STORE_PATH);
  } catch {
    await fs.writeFile(STORE_PATH, JSON.stringify(DEFAULT_PROGRESS, null, 2), 'utf8');
  }
}

async function readStore() {
  await ensureStore();
  const raw = await fs.readFile(STORE_PATH, 'utf8');
  const parsed = JSON.parse(raw);
  return {
    ...DEFAULT_PROGRESS,
    ...parsed,
    weldingSessions: Array.isArray(parsed.weldingSessions) ? parsed.weldingSessions : [],
    riggingSessions: Array.isArray(parsed.riggingSessions) ? parsed.riggingSessions : [],
    signalProgress:
      parsed.signalProgress && typeof parsed.signalProgress === 'object'
        ? {
            ...DEFAULT_PROGRESS.signalProgress,
            ...parsed.signalProgress,
          }
        : DEFAULT_PROGRESS.signalProgress,
    bookmarkedGlossaryIds: Array.isArray(parsed.bookmarkedGlossaryIds)
      ? parsed.bookmarkedGlossaryIds
      : DEFAULT_PROGRESS.bookmarkedGlossaryIds,
  };
}

async function writeStore(data: unknown) {
  await ensureStore();
  const tmpPath = `${STORE_PATH}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf8');
  await fs.rename(tmpPath, STORE_PATH);
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const INSTRUCTOR_SYSTEM_PROMPT = `You are a senior Canadian Red Seal Construction Boilermaker instructor, CWB/ASME welding supervisor, and rigging instructor coaching an experienced 41-year-old boilermaker preparing for Ontario Construction Boilermaker (428A) classroom exemption examinations (Levels 1, 2, and 3) and eventual Red Seal certification.

STUDENT CONTEXT:
- ~5 years shop boilermaker experience (industrial fabrication, fitting, welding, shop operations) + Alberta field experience.
- Holds SMAW, FCAW, and pipe welding experience; former Ontario Local 128 member; reinstated with Alberta Local 146; transferring back to Ontario.
- Strong practical instincts; needs sharp classroom math, formula discipline, blueprint/welding-symbol precision, and Canadian regulatory/code theory.

TEACHING RULES (STRICT):
1. Do NOT talk down to him like a day-one beginner. Connect classroom theory directly to shop-floor and field boilermaker work in plain Canadian English.
2. When teaching math or rigging, show clear step-by-step calculations with explicit units (imperial and metric where helpful).
3. NEVER invent official Skilled Trades Ontario (STO) exam questions, guaranteed exemption-exam eligibility, passing scores, or regulatory rules. Always clarify that official exemption eligibility and passing marks are governed strictly by Skilled Trades Ontario and approved Training Delivery Agents (TDAs like Lambton College / Local 128 JATC).
4. NEVER give unsafe rigging shortcuts. State when manufacturer load charts, ASME B30 / CSA standards, Ontario Reg. 213/91, engineered lift plans, or competent supervision govern actual lifts.
5. Disclose uncertainty openly if a question depends on an edition-specific ASME/CSA table or an unverified STO PDF outline not supplied.
6. Keep responses structured, practical, and scannable—use concise formulas, worked steps, and follow-up check questions when appropriate.`;

async function startServer() {
  await ensureStore();
  const app = express();
  app.use(express.json({ limit: '25mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'boilermaker-academy-428a' });
  });

  // No unauthenticated shared progress API. Until account-based storage is implemented,
  // study progress is stored locally in each student's browser.
  app.all(['/api/progress', '/api/progress/reset'], (_req, res) => {
    res.status(410).json({ error: 'Shared progress API retired. Use device-local study mode.' });
  });

  app.post('/api/ai/chat', async (req, res) => {
    try {
      const ai = getGeminiClient();
      if (!ai) {
        return res.status(503).json({
          error: 'Gemini API key is not configured on the server. Check Settings > Secrets for GEMINI_API_KEY.',
        });
      }

      const { messages, weakSubjects, currentLevel, activeTopic } = req.body as {
        messages: { role: 'user' | 'model'; text: string }[];
        weakSubjects?: string[];
        currentLevel?: number;
        activeTopic?: string;
      };

      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Messages array is required.' });
      }

      const dynamicContext = `
CURRENT STUDENT PROFILE STATE:
- Active Study Level: Level ${currentLevel ?? 1}
- Identified Priority / Weak Subjects: ${weakSubjects?.length ? weakSubjects.join(', ') : 'Not yet diagnosed (recommend diagnostic)'}
- Current Section Context: ${activeTopic ?? 'General 428A Preparation'}`;

      const contents = messages.map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents,
        config: {
          systemInstruction: `${INSTRUCTOR_SYSTEM_PROMPT}\n${dynamicContext}`,
        },
      });

      res.json({ reply: response.text ?? 'No response generated. Please try rephrasing your trade question.' });
    } catch (err: unknown) {
      console.error('Gemini chat error:', err);
      const message = err instanceof Error ? err.message : 'AI Instructor request failed.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/ai/analyze-document', async (req, res) => {
    try {
      const ai = getGeminiClient();
      if (!ai) {
        return res.status(503).json({
          error: 'Gemini API key is not configured on the server. Check Settings > Secrets for GEMINI_API_KEY.',
        });
      }

      const { fileName, mimeType, base64Data, taskMode, userPrompt } = req.body as {
        fileName: string;
        mimeType: string;
        base64Data: string;
        taskMode: 'explain' | 'map_curriculum' | 'generate_questions';
        userPrompt?: string;
      };

      if (!base64Data || !mimeType) {
        return res.status(400).json({ error: 'Uploaded file data and MIME type are required.' });
      }

      let taskInstruction = '';
      if (taskMode === 'map_curriculum') {
        taskInstruction =
          'Analyze this uploaded document (likely an Ontario 428A curriculum standard, Lambton College outline, or WPS). Summarize the official learning outcomes/topics found verbatim in the document, highlight any exact hours or unit titles, and clearly note what is verified from this document versus what remains outside it. Respect copyright—summarize and map rather than reproducing full pages verbatim.';
      } else if (taskMode === 'generate_questions') {
        taskInstruction =
          'Based strictly on the technical concepts in this uploaded material, write 5 original Ontario 428A-style multiple-choice study questions (4 options each, one correct answer, plus clear step-by-step explanation). Do not copy proprietary exam text verbatim; write original practice items.';
      } else {
        taskInstruction =
          'Explain the concepts, formulas, welding symbols, dimensions, or technical details shown in this uploaded document or photo in plain Canadian boilermaker shop English. Point out common pitfalls and key study takeaways.';
      }

      const promptText = userPrompt?.trim()
        ? `${taskInstruction}\n\nStudent specific question: ${userPrompt.trim()}\nFile name: ${fileName}`
        : `${taskInstruction}\nFile name: ${fileName}`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
            { text: promptText },
          ],
        },
        config: {
          systemInstruction: INSTRUCTOR_SYSTEM_PROMPT,
        },
      });

      res.json({
        analysis: response.text ?? 'Unable to extract technical details from this file.',
      });
    } catch (err: unknown) {
      console.error('Gemini document analysis error:', err);
      const message = err instanceof Error ? err.message : 'Document analysis failed.';
      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Boilermaker Academy server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
