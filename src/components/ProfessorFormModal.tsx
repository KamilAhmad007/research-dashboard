/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Professor, ProfessorStatus, DecisionStatus } from "../types";
import { X, Calendar, User, Eye, PlusCircle, Bookmark, Globe, Mail } from "lucide-react";

interface ProfessorFormModalProps {
  professor: Professor | null; // Null means Add Mode, provided means Edit Mode
  isOpen: boolean;
  onClose: () => void;
  onSave: (prof: Professor) => void;
}

export default function ProfessorFormModal({ professor, isOpen, onClose, onSave }: ProfessorFormModalProps) {
  const [name, setName] = useState("");
  const [university, setUniversity] = useState("");
  const [department, setDepartment] = useState("");
  const [researchFocus, setResearchFocus] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [emailSentDate, setEmailSentDate] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [status, setStatus] = useState<ProfessorStatus>(ProfessorStatus.NOT_SENT);
  const [applicationDeadline, setApplicationDeadline] = useState("");
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewNotes, setInterviewNotes] = useState("");
  const [decision, setDecision] = useState<DecisionStatus>(DecisionStatus.PENDING);

  useEffect(() => {
    if (isOpen) {
      if (professor) {
        // Edit Mode - Pre-fill
        setName(professor.name || "");
        setUniversity(professor.university || "");
        setDepartment(professor.department || "");
        setResearchFocus(professor.researchFocus || "");
        setEmail(professor.email || "");
        setWebsite(professor.website || "");
        setEmailSentDate(professor.emailSentDate || "");
        setFollowUpDate(professor.followUpDate || "");
        setStatus(professor.status || ProfessorStatus.NOT_SENT);
        setApplicationDeadline(professor.applicationDeadline || "");
        setInterviewDate(professor.interviewDate || "");
        setInterviewNotes(professor.interviewNotes || "");
        setDecision(professor.decision || DecisionStatus.PENDING);
      } else {
        // Add Mode - Reset
        setName("");
        setUniversity("");
        setDepartment("");
        setResearchFocus("");
        setEmail("");
        setWebsite("");
        setEmailSentDate("");
        setFollowUpDate("");
        setStatus(ProfessorStatus.NOT_SENT);
        setApplicationDeadline("");
        setInterviewDate("");
        setInterviewNotes("");
        setDecision(DecisionStatus.PENDING);
      }
    }
  }, [isOpen, professor]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !university.trim()) {
      alert("Name and University are required.");
      return;
    }

    const payload: Professor = {
      id: professor ? professor.id : `prof-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      rowNum: professor ? professor.rowNum : undefined,
      name: name.trim(),
      university: university.trim(),
      department: department.trim(),
      researchFocus: researchFocus.trim(),
      email: email.trim(),
      website: website.trim(),
      emailSentDate,
      followUpDate,
      status,
      applicationDeadline,
      interviewDate,
      interviewNotes: interviewNotes.trim(),
      decision
    };

    onSave(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div 
        className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-indigo-600" />
            <h3 className="font-sans font-bold text-slate-800 text-sm">
              {professor ? "Modify Advisor Log" : "Log Prospective Professor"}
            </h3>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:bg-slate-200 hover:text-slate-800 transition cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 select-text text-xs">
          
          {/* Section 1: Professor Details */}
          <div className="space-y-3">
            <h4 className="font-semibold text-indigo-700 uppercase tracking-wide text-[9px] font-mono border-b border-gray-100 pb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Professional Credentials
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Professor Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                  University *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stanford University"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Department / Lab
                </label>
                <input
                  type="text"
                  placeholder="e.g. Computer Science Dept"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Research Keywords / Focus
                </label>
                <input
                  type="text"
                  placeholder="e.g. LLM Reasoning, Robotics"
                  value={researchFocus}
                  onChange={(e) => setResearchFocus(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  placeholder="e.g. professor@stanford.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Website / Lab URL
                </label>
                <input
                  type="url"
                  placeholder="e.g. https://stanford.edu/~jane"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Milestones & Dates */}
          <div className="space-y-3 pt-3">
            <h4 className="font-semibold text-indigo-700 uppercase tracking-wide text-[9px] font-mono border-b border-gray-100 pb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Deadlines & Contact Dates
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Email Sent Date
                </label>
                <input
                  type="date"
                  value={emailSentDate}
                  onChange={(e) => setEmailSentDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Follow Up Target Date
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Application Deadline
                </label>
                <input
                  type="date"
                  value={applicationDeadline}
                  onChange={(e) => setApplicationDeadline(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer text-amber-800"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Status, Interviews, Decision */}
          <div className="space-y-3 pt-3">
            <h4 className="font-semibold text-indigo-700 uppercase tracking-wide text-[9px] font-mono border-b border-gray-100 pb-1 flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5" /> Pipeline Status & Interviews
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Email Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProfessorStatus)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer font-medium"
                >
                  {Object.values(ProfessorStatus).map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Interview Date
                </label>
                <input
                  type="date"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer text-purple-850"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Admission Decision
                </label>
                <select
                  value={decision}
                  onChange={(e) => setDecision(e.target.value as DecisionStatus)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer font-medium"
                >
                  {Object.values(DecisionStatus).map((dec) => (
                    <option key={dec} value={dec}>
                      {dec}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                Interview / Call Notes & Preparation
              </label>
              <textarea
                value={interviewNotes}
                onChange={(e) => setInterviewNotes(e.target.value)}
                rows={3}
                placeholder="Log discussion topics, questions asked, follow-up parameters, or reminders..."
                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Action buttons inside form */}
          <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 transition font-sans hover:text-slate-800 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg shadow-xs transition font-sans font-bold cursor-pointer"
            >
              {professor ? "Save Changes" : "Log Professor"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
