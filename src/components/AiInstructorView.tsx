import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Bot,
  FileText,
  Image as ImageIcon,
  Loader2,
  Send,
  Upload,
} from 'lucide-react';
import { ApprenticeshipLevel, TopicDomain, UploadedDocumentRef } from '../types/academy';

interface Message {
  role: 'user' | 'model';
  text: string;
}

const STARTER_PROMPTS = [
  "Explain sling tension like I'm standing in the shop.",
  'Show me how to calculate the weight of a steel plate.',
  'Give me ten difficult Level 2 rigging questions.',
  'Explain the difference between E6010 and E7018.',
  'Quiz me on boiler components.',
  'Teach me how to read a fabrication drawing and welding symbols.',
];

interface AiInstructorViewProps {
  currentLevel: ApprenticeshipLevel;
  weakSubjects: TopicDomain[];
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
  uploadedDocs: UploadedDocumentRef[];
  onSaveUploadedDoc: (doc: UploadedDocumentRef) => void;
}

export const AiInstructorView: React.FC<AiInstructorViewProps> = ({
  currentLevel,
  weakSubjects,
  initialPrompt,
  onClearInitialPrompt,
  uploadedDocs,
  onSaveUploadedDoc,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      text: `Welcome back to the shop classroom. I'm your Ontario 428A / Red Seal Boilermaker instructor. I know you already have 5 years on the tools—SMAW, FCAW, pipe, and Alberta field work—so we won't waste time on day-one basics.\n\nCurrent focus areas in your profile: ${
        weakSubjects.length > 0 ? weakSubjects.join(', ') : 'Run the 50Q diagnostic to pinpoint gaps'
      }.\n\nAsk any trade math, rigging, blueprint, metallurgy, or boiler question below—or upload a PDF curriculum standard, WPS, or fabrication drawing photo on the right.`,
    },
  ]);
  const [input, setInput] = useState<string>('');
  const [loadingChat, setLoadingChat] = useState<boolean>(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Document / Photo upload state
  const [docCategory, setDocCategory] = useState<UploadedDocumentRef['category']>('STO Curriculum PDF');
  const [taskMode, setTaskMode] = useState<'explain' | 'map_curriculum' | 'generate_questions'>('explain');
  const [docQuestion, setDocQuestion] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<{ name: string; mimeType: string; size: number; base64: string } | null>(null);
  const [loadingDoc, setLoadingDoc] = useState<boolean>(false);
  const [docError, setDocError] = useState<string | null>(null);
  const [latestAnalysis, setLatestAnalysis] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      void sendMessage(initialPrompt);
      onClearInitialPrompt?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loadingChat]);

  const sendMessage = async (textOverride?: string) => {
    const prompt = (textOverride ?? input).trim();
    if (!prompt || loadingChat) return;

    setChatError(null);
    const updatedMessages: Message[] = [...messages, { role: 'user', text: prompt }];
    setMessages(updatedMessages);
    if (!textOverride) setInput('');
    setLoadingChat(true);

    try {
      const resp = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          weakSubjects,
          currentLevel,
          activeTopic: weakSubjects[0] ?? 'Ontario 428A Preparation',
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || 'Failed to get response from AI instructor.');
      }
      setMessages((prev) => [...prev, { role: 'model', text: data.reply }]);
    } catch (err: unknown) {
      setChatError(err instanceof Error ? err.message : 'Unable to reach AI instructor endpoint.');
    } finally {
      setLoadingChat(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDocError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 18 * 1024 * 1024) {
      setDocError('File exceeds 18 MB limit. Please select a smaller PDF or compressed photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = reader.result as string;
      const base64 = resultStr.includes(',') ? resultStr.split(',')[1] : resultStr;
      setSelectedFile({
        name: file.name,
        mimeType: file.type || 'application/pdf',
        size: file.size,
        base64,
      });
    };
    reader.onerror = () => setDocError('Failed to read selected file.');
    reader.readAsDataURL(file);
  };

  const handleAnalyzeFile = async () => {
    if (!selectedFile || loadingDoc) return;
    setLoadingDoc(true);
    setDocError(null);
    setLatestAnalysis(null);

    try {
      const resp = await fetch('/api/ai/analyze-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: selectedFile.name,
          mimeType: selectedFile.mimeType,
          base64Data: selectedFile.base64,
          taskMode,
          userPrompt: docQuestion,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || 'Failed to analyze uploaded file.');
      }
      setLatestAnalysis(data.analysis);
      onSaveUploadedDoc({
        id: `doc-${Date.now()}`,
        fileName: selectedFile.name,
        mimeType: selectedFile.mimeType,
        sizeBytes: selectedFile.size,
        category: docCategory,
        uploadedAt: new Date().toISOString(),
        aiSummary: data.analysis,
      });
    } catch (err: unknown) {
      setDocError(err instanceof Error ? err.message : 'Document analysis failed.');
    } finally {
      setLoadingDoc(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-[#2A394A]">
        <h1 className="text-3xl font-bold text-white">AI Trade Instructor & Document Analyzer</h1>
        <p className="text-sm text-slate-400 mt-1">
          Powered server-side by Gemini · Adapts to your Level {currentLevel} progress and weak subjects ({weakSubjects.join(', ') || 'None flagged'}).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive Trade Chat */}
        <div className="lg:col-span-7 bg-[#111B27] border border-[#2A394A] rounded-lg flex flex-col h-[680px]">
          <div className="px-4 py-3 border-b border-[#2A394A] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-semibold text-white">428A Boilermaker Instructor</span>
            </div>
            <span className="text-xs font-mono text-slate-400">Level {currentLevel} Context Active</span>
          </div>

          {/* Starter Prompts */}
          <div className="px-4 py-2.5 border-b border-[#2A394A] bg-[#0D1622] flex flex-wrap gap-1.5">
            {STARTER_PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => void sendMessage(p)}
                className="text-xs px-2.5 py-1.5 rounded border border-[#2A394A] bg-[#111B27] text-slate-300 hover:border-amber-400 hover:text-white transition-colors text-left"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[88%] rounded-lg px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-amber-500 text-slate-950 font-medium'
                      : 'bg-[#0A111A] border border-[#2A394A] text-slate-200'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loadingChat && (
              <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Instructor is working through the explanation...</span>
              </div>
            )}
            {chatError && (
              <div className="p-3 rounded bg-red-950/50 border border-red-700/60 text-xs text-red-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{chatError}</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendMessage();
            }}
            className="p-3 border-t border-[#2A394A] bg-[#0D1622] flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about sling loads, E7018/E6010, pipe offsets, boilers, or WPS variables..."
              className="flex-1 bg-[#0A111A] border border-[#2A394A] rounded-md px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              disabled={loadingChat || !input.trim()}
              className="px-4 py-2.5 rounded-md bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-semibold text-sm flex items-center gap-1.5 transition-colors"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </form>
        </div>

        {/* Right: PDF & Photo Upload Analyzer */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-[#111B27] border border-[#2A394A] rounded-lg p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white">Upload Curriculum PDF or Shop Photo</h2>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload official Skilled Trades Ontario 428A PDFs, WPS sheets, fabrication drawings, textbook pages, or handwritten math notes for AI explanation and practice question generation.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Material Type</label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value as UploadedDocumentRef['category'])}
                  className="w-full bg-[#0A111A] border border-[#2A394A] rounded-md px-3 py-2 text-xs text-white"
                >
                  <option value="STO Curriculum PDF">STO 428A Curriculum / Training Standard PDF</option>
                  <option value="WPS / Welding">Welding Procedure Specification (WPS)</option>
                  <option value="Fabrication Drawing">Fabrication / Blueprint Drawing</option>
                  <option value="Notes / Textbook Photo">Handwritten Notes or Textbook Photo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Analysis Mode</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'explain', label: 'Explain' },
                    { id: 'map_curriculum', label: 'Map 428A' },
                    { id: 'generate_questions', label: '5 Quiz Qs' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setTaskMode(m.id as typeof taskMode)}
                      className={`py-1.5 px-2 rounded border text-xs font-medium transition-colors ${
                        taskMode === m.id
                          ? 'bg-amber-500 text-slate-950 border-amber-500 font-semibold'
                          : 'bg-[#0A111A] border-[#2A394A] text-slate-300'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block border border-dashed border-[#3B4E63] hover:border-amber-400 rounded-lg p-4 text-center cursor-pointer bg-[#0A111A] transition-colors">
                <input
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-1.5">
                  <div className="flex items-center gap-2 text-slate-300">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <ImageIcon className="w-4 h-4 text-sky-400" />
                  </div>
                  <span className="text-xs font-medium text-white">
                    {selectedFile ? selectedFile.name : 'Choose PDF, PNG, or JPG (max 18 MB)'}
                  </span>
                  {selectedFile && (
                    <span className="text-xs font-mono text-slate-400">
                      {Math.round(selectedFile.size / 1024)} KB · {selectedFile.mimeType}
                    </span>
                  )}
                </div>
              </label>

              <input
                type="text"
                value={docQuestion}
                onChange={(e) => setDocQuestion(e.target.value)}
                placeholder="Optional: e.g. 'Explain the weld symbol on flange N2'"
                className="w-full bg-[#0A111A] border border-[#2A394A] rounded-md px-3 py-2 text-xs text-white placeholder:text-slate-500"
              />

              <button
                type="button"
                disabled={!selectedFile || loadingDoc}
                onClick={handleAnalyzeFile}
                className="w-full py-2.5 rounded-md bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                {loadingDoc ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing Document...
                  </>
                ) : (
                  'Analyze Uploaded Material'
                )}
              </button>

              {docError && (
                <p className="text-xs text-red-400 bg-red-950/40 border border-red-700/50 p-2.5 rounded">{docError}</p>
              )}
            </div>
          </div>

          {/* Output & Saved References */}
          {latestAnalysis && (
            <div className="bg-[#111B27] border border-emerald-600/40 rounded-lg p-4 space-y-2 max-h-80 overflow-y-auto">
              <p className="text-xs font-mono text-emerald-400">ANALYSIS SAVED TO STUDY ARCHIVE</p>
              <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">{latestAnalysis}</div>
            </div>
          )}

          {uploadedDocs.length > 0 && (
            <div className="bg-[#111B27] border border-[#2A394A] rounded-lg p-4 space-y-2">
              <p className="text-xs font-mono text-slate-400">RECENTLY ANALYZED FILES ({uploadedDocs.length})</p>
              <ul className="space-y-1.5 text-xs">
                {uploadedDocs.slice(0, 4).map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-2 text-slate-300 bg-[#0A111A] px-2.5 py-1.5 rounded border border-[#1E293B]">
                    <span className="truncate">{d.fileName}</span>
                    <span className="font-mono text-slate-500 shrink-0">{d.category}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
