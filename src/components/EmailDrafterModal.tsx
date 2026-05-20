/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Professor } from "../types";
import { X, Sparkles, Copy, Check, Loader2, RefreshCw } from "lucide-react";

interface EmailDrafterModalProps {
  professor: Professor | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EmailDrafterModal({ professor, isOpen, onClose }: EmailDrafterModalProps) {
  const [background, setBackground] = useState("");
  const [specificAlignment, setSpecificAlignment] = useState("");
  const [goal, setGoal] = useState("Explore potential research openings under their guidance for fall 2026/2027 and ask for a short 10-minute introductory Zoom call.");
  const [generating, setGenerating] = useState(false);
  
  const [draftSubject, setDraftSubject] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load standard template profile from localStorage if any
  useEffect(() => {
    if (isOpen) {
      const cachedBg = localStorage.getItem("student_academic_background");
      if (cachedBg) {
        setBackground(cachedBg);
      } else {
        setBackground("B.Tech / BS in Computer Science candidate, research experience in Machine Learning with a focus on NLP, strong GPA (3.8/4.0), and 1 conference paper.");
      }
      
      // Default alignment to professor focus
      if (professor?.researchFocus) {
        setSpecificAlignment(`I read your lab's latest papers regarding "${professor.researchFocus}" and am specifically interested in how your methods handle efficiency scaling.`);
      } else {
        setSpecificAlignment("");
      }

      setErrorMsg(null);
      setDraftSubject("");
      setDraftBody("");
    }
  }, [isOpen, professor]);

  const handleGenerate = async () => {
    if (!professor) return;
    
    setGenerating(true);
    setErrorMsg(null);
    setCopied(false);

    // Persist background details for convenience next time
    localStorage.setItem("student_academic_background", background);

    try {
      const response = await fetch("/api/draft-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          professorName: professor.name,
          university: professor.university,
          researchTopic: professor.researchFocus,
          myBackground: background,
          specificDetails: specificAlignment,
          goal: goal,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate cold email. Server returned error status.");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setDraftSubject(data.subject || "");
      setDraftBody(data.body || "");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected error occurred while contacting the Gemini model.");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    const fullText = `Subject: ${draftSubject}\n\n${draftBody}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen || !professor) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div 
        className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
            <div>
              <h3 className="font-sans font-bold text-slate-800 text-sm">
                AI Cold-Email Assistant (Gemini)
              </h3>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Draft a highly personalized cold-email tailored for {professor.name} ({professor.university})
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:bg-slate-200 hover:text-slate-800 transition cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Input Details */}
            <div className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                  My Academic Background
                </label>
                <textarea
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                  rows={4}
                  placeholder="Specify major, university, GPA, research experiences, publication count..."
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Research Alignments / Lab Projects
                </label>
                <textarea
                  value={specificAlignment}
                  onChange={(e) => setSpecificAlignment(e.target.value)}
                  rows={3}
                  placeholder="Reference their specific paper topics, lab systems, or projects..."
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Inquiry Goal
                </label>
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <button
                disabled={generating}
                onClick={handleGenerate}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold text-xs rounded-lg shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-55"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Composing and Customizing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Cold Email Draft
                  </>
                )}
              </button>
            </div>

            {/* Right: Output Draft */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60 flex flex-col h-full min-h-[300px]">
              <div className="flex justify-between items-center pb-2 border-b border-gray-100 mb-2">
                <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Target Email Draft
                </span>
                {(draftSubject || draftBody) && (
                  <button
                    onClick={handleCopy}
                    className="text-indigo-600 hover:text-indigo-800 transition font-medium flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy Full Email
                      </>
                    )}
                  </button>
                )}
              </div>

              {generating ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400">
                  <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mb-2" />
                  <p className="text-xs transition font-semibold">Gemini is synthesizing context...</p>
                  <p className="text-[10px] text-gray-400 mt-1 max-w-[200px]">Aligning academic credentials to relevant research focus.</p>
                </div>
              ) : errorMsg ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-rose-500 p-2">
                  <span className="text-2xl mb-1">⚠️</span>
                  <p className="font-semibold text-xs">Failed to Draft</p>
                  <p className="text-[10px] text-rose-400 mt-1">{errorMsg}</p>
                </div>
              ) : draftSubject || draftBody ? (
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-slate-700 leading-relaxed font-sans scrollbar-thin">
                  <div>
                    <span className="font-semibold text-slate-400 font-mono text-[9px] uppercase">Subject:</span>
                    <p className="font-bold text-slate-800 text-xs mt-0.5 bg-indigo-50 border border-indigo-100/50 p-1.5 rounded">
                      {draftSubject}
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-400 font-mono text-[9px] uppercase">Body:</span>
                    <pre className="text-xs font-sans text-slate-700 mt-0.5 whitespace-pre-wrap leading-relaxed select-text font-normal p-2.5 bg-white border border-slate-200 rounded">
                      {draftBody}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400 py-10">
                  <span className="text-2xl mb-2">💡</span>
                  <p className="font-semibold">Draft Panel Ready</p>
                  <p className="text-[10px] text-gray-400 mt-1 max-w-[190px]">
                    Configure your student profile on the left and click "Generate" to construct a cold email.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-gray-100 flex justify-end gap-2 text-xs">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 transition font-sans hover:text-slate-800 font-semibold cursor-pointer"
          >
            Close assistant
          </button>
        </div>
      </div>
    </div>
  );
}
