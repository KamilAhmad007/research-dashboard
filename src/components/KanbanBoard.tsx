/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Professor, ProfessorStatus, DecisionStatus } from "../types";
import { ArrowLeft, ArrowRight, Mail, ExternalLink, Calendar, GraduationCap, Building } from "lucide-react";

interface KanbanBoardProps {
  professors: Professor[];
  onUpdateStatus: (prof: Professor, newStatus: ProfessorStatus) => void;
  onEdit: (prof: Professor) => void;
}

export default function KanbanBoard({ professors, onUpdateStatus, onEdit }: KanbanBoardProps) {
  // Group professors by logical columns
  const columns = [
    {
      id: "to-contact",
      title: "Prospects & Drafts",
      color: "border-slate-300 bg-slate-50",
      textColor: "text-slate-800",
      statuses: [ProfessorStatus.NOT_SENT],
      description: "Professors found, emails not yet sent."
    },
    {
      id: "emailed",
      title: "Awaiting Reply",
      color: "border-blue-200 bg-blue-50/40",
      textColor: "text-blue-800",
      statuses: [ProfessorStatus.EMAILED],
      description: "Cold email sent. Fingertips crossed."
    },
    {
      id: "interested",
      title: "Warm Lead / Interested",
      color: "border-emerald-200 bg-emerald-50/40",
      textColor: "text-emerald-800",
      statuses: [ProfessorStatus.REPLIED_INTERESTED],
      description: "Replied showing clear interest in you."
    },
    {
      id: "interview",
      title: "Interviews Scheduled",
      color: "border-purple-200 bg-purple-50/40",
      textColor: "text-purple-800",
      statuses: [ProfessorStatus.INTERVIEW_SCHEDULED],
      description: "Advisors scheduling dynamic live interviews."
    },
    {
      id: "resolved",
      title: "Resolved / Decided",
      color: "border-slate-200 bg-slate-50/30",
      textColor: "text-slate-700",
      statuses: [ProfessorStatus.ACCEPTED, ProfessorStatus.REJECTED, ProfessorStatus.REPLIED_NO_VACANCY],
      description: "Decisions, rejections, or no vacancy answers."
    }
  ];

  // Quick state progression pipeline
  const getNextStatus = (curr: ProfessorStatus, direction: "next" | "prev"): ProfessorStatus | null => {
    const list = [
      ProfessorStatus.NOT_SENT,
      ProfessorStatus.EMAILED,
      ProfessorStatus.REPLIED_INTERESTED,
      ProfessorStatus.INTERVIEW_SCHEDULED,
      ProfessorStatus.ACCEPTED
    ];
    
    const index = list.indexOf(curr);
    if (index === -1) {
      if (curr === ProfessorStatus.REPLIED_NO_VACANCY || curr === ProfessorStatus.REJECTED) {
        // Can move back to emailed
        return direction === "prev" ? ProfessorStatus.EMAILED : null;
      }
      return null;
    }

    if (direction === "next") {
      return index < list.length - 1 ? list[index + 1] : null;
    } else {
      return index > 0 ? list[index - 1] : null;
    }
  };

  const getDecisionBadge = (decision: DecisionStatus) => {
    switch (decision) {
      case DecisionStatus.ADMITTED:
        return "bg-amber-100 text-amber-800 border-amber-200";
      case DecisionStatus.REJECTED:
        return "bg-rose-100 text-rose-800 border-rose-200";
      case DecisionStatus.WAITLISTED:
        return "bg-cyan-100 text-cyan-800 border-cyan-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };


  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-5 items-start mt-6 overflow-x-auto min-w-full pb-6">
      {columns.map((col) => {
        // Filter professors belonging to this column description
        const colProfs = professors.filter((p) => col.statuses.includes(p.status));

        return (
          <div 
            key={col.id} 
            className="flex flex-col flex-1 min-w-[280px] bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs h-[560px]"
          >
            {/* Header */}
            <div className={`p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/80`}>
              <div>
                <h4 className="font-sans font-bold text-slate-800 text-sm">{col.title}</h4>
                <p className="text-[10px] text-gray-400 mt-0.5">{col.description}</p>
              </div>
              <span className="bg-slate-200 font-mono text-xs font-bold px-2 py-0.5 rounded text-slate-700">
                {colProfs.length}
              </span>
            </div>

            {/* Cards container */}
            <div className="p-3 flex-1 overflow-y-auto space-y-3 bg-slate-50/30">
              {colProfs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 text-gray-400">
                  <span className="text-2xl">📁</span>
                  <p className="text-xs font-medium font-sans mt-2">Column Empty</p>
                </div>
              ) : (
                colProfs.map((prof) => {
                  const prevOption = getNextStatus(prof.status, "prev");
                  const nextOption = getNextStatus(prof.status, "next");

                  return (
                    <div 
                      key={prof.id}
                      className="bg-white border border-gray-100 shadow-2xs hover:shadow-xs rounded-lg p-3.5 space-y-2.5 transition group border-l-3 border-l-slate-400"
                    >
                      {/* Prof details */}
                      <div>
                        <div className="flex items-start justify-between">
                          <h5 
                            onClick={() => onEdit(prof)}
                            className="font-semibold text-xs text-slate-800 hover:text-blue-600 cursor-pointer hover:underline truncate max-w-[85%]"
                            title="Edit Professor"
                          >
                            {prof.name}
                          </h5>
                          {prof.website && (
                            <a 
                              href={prof.website} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-gray-400 hover:text-slate-700"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        
                        <div className="flex items-center text-[11px] text-gray-500 mt-1">
                          <Building className="w-3 h-3 mr-1 shrink-0 text-slate-400" />
                          <span className="truncate">{prof.university}</span>
                        </div>
                        
                        <div className="flex items-center text-[11px] text-gray-400 mt-0.5">
                          <GraduationCap className="w-3 h-3 mr-1 shrink-0 text-slate-400" />
                          <span className="truncate">{prof.department}</span>
                        </div>
                      </div>

                      {/* Research keywords / email info */}
                      {prof.researchFocus && (
                        <div className="bg-slate-50 rounded px-2 py-1 text-[10px] text-slate-600 truncate">
                          Focus: {prof.researchFocus}
                        </div>
                      )}

                      {/* Display deadlines or follow ups */}
                      <div className="text-[10px] space-y-1 bg-blue-50/20 rounded p-1.5 border border-blue-100/50">
                        {prof.emailSentDate && (
                          <div className="text-gray-500 flex justify-between">
                            <span>Emailed:</span>
                            <span className="font-mono text-slate-700">{prof.emailSentDate}</span>
                          </div>
                        )}
                        {prof.interviewDate && (
                          <div className="text-blue-700 flex justify-between font-medium">
                            <span>Interview:</span>
                            <span className="font-mono">{prof.interviewDate}</span>
                          </div>
                        )}
                        {prof.applicationDeadline && (
                          <div className="text-amber-700 flex justify-between font-medium">
                            <span>Deadline:</span>
                            <span className="font-mono">{prof.applicationDeadline}</span>
                          </div>
                        )}
                      </div>

                      {/* Decision status label if resolved */}
                      {col.id === "resolved" && (
                        <div className="flex justify-between items-center pt-1 border-t border-gray-50">
                          <span className="text-[10px] text-gray-400">Decision:</span>
                          <span className={`text-[9px] uppercase tracking-wider font-bold font-mono px-1.5 py-0.5 border rounded ${getDecisionBadge(prof.decision)}`}>
                            {prof.decision}
                          </span>
                        </div>
                      )}

                      {/* Drag progression utility */}
                      <div className="flex justify-between items-center pt-2 border-t border-gray-100 mt-1">
                        <button
                          disabled={!prevOption}
                          onClick={() => prevOption && onUpdateStatus(prof, prevOption)}
                          className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                          title="Move Status Backward"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                        
                        <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest">
                          {prof.status === ProfessorStatus.NOT_SENT ? "PROSPECT" : "IN PROGRESS"}
                        </span>

                        <button
                          disabled={!nextOption}
                          onClick={() => nextOption && onUpdateStatus(prof, nextOption)}
                          className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                          title="Move Status Forward"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
