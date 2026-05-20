/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from "react";
import { Professor, ProfessorStatus, DecisionStatus } from "../types";
import { Search, Sparkles, Edit, Trash2, ExternalLink, Mail, Filter, ArrowUpDown } from "lucide-react";

interface ProfessorTableProps {
  professors: Professor[];
  onEdit: (prof: Professor) => void;
  onDelete: (prof: Professor) => void;
  onDraftEmail: (prof: Professor) => void;
  onUpdateStatus: (prof: Professor, status: ProfessorStatus) => void;
  onUpdateDecision: (prof: Professor, decision: DecisionStatus) => void;
}

type SortField = "name" | "university" | "status" | "applicationDeadline" | "interviewDate";
type SortOrder = "asc" | "desc";

export default function ProfessorTable({
  professors,
  onEdit,
  onDelete,
  onDraftEmail,
  onUpdateStatus,
  onUpdateDecision
}: ProfessorTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [universityFilter, setUniversityFilter] = useState<string>("ALL");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // Get unique list of universities for filtering
  const universities = useMemo(() => {
    const list = professors.map((p) => p.university).filter(Boolean);
    return Array.from(new Set(list));
  }, [professors]);

  // Handle Sort Toggle
  const triggerSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Filter and Sort dataset
  const processedProfessors = useMemo(() => {
    let list = [...professors];

    // Search query filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.university.toLowerCase().includes(q) ||
          p.department.toLowerCase().includes(q) ||
          p.researchFocus.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q)
      );
    }

    // Status Filter
    if (statusFilter !== "ALL") {
      list = list.filter((p) => p.status === statusFilter);
    }

    // University Filter
    if (universityFilter !== "ALL") {
      list = list.filter((p) => p.university === universityFilter);
    }

    // Sort order
    list.sort((a, b) => {
      let valA = a[sortField] || "";
      let valB = b[sortField] || "";

      if (sortField === "applicationDeadline" || sortField === "interviewDate") {
        valA = a[sortField] ? new Date(a[sortField]).getTime() : 0;
        valB = b[sortField] ? new Date(b[sortField]).getTime() : 0;
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [professors, searchTerm, statusFilter, universityFilter, sortField, sortOrder]);

  const getStatusBadgeStyles = (status: ProfessorStatus) => {
    switch (status) {
      case ProfessorStatus.NOT_SENT:
        return "bg-slate-100 text-slate-700";
      case ProfessorStatus.EMAILED:
        return "bg-blue-100 text-blue-700";
      case ProfessorStatus.REPLIED_INTERESTED:
        return "bg-emerald-100 text-emerald-800 font-semibold";
      case ProfessorStatus.REPLIED_NO_VACANCY:
        return "bg-orange-100 text-orange-700";
      case ProfessorStatus.INTERVIEW_SCHEDULED:
        return "bg-amber-100 text-amber-800 font-semibold";
      case ProfessorStatus.ACCEPTED:
        return "bg-green-100 text-green-800 font-bold";
      case ProfessorStatus.REJECTED:
        return "bg-rose-100 text-rose-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm">
      {/* Filtering Actions Bar */}
      <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search professor, school, focus..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap gap-2.5 w-full md:w-auto items-center justify-end">
          {/* Status Filter */}
          <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent focus:outline-none focus:ring-0 cursor-pointer text-xs font-medium"
            >
              <option value="ALL">Status: All</option>
              {Object.values(ProfessorStatus).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {/* School Filter */}
          <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={universityFilter}
              onChange={(e) => setUniversityFilter(e.target.value)}
              className="bg-transparent focus:outline-none focus:ring-0 cursor-pointer text-xs font-medium max-w-[150px]"
            >
              <option value="ALL">School: All</option>
              {universities.map((uni) => (
                <option key={uni} value={uni}>
                  {uni}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="overflow-x-auto w-full">
        {processedProfessors.length === 0 ? (
          <div className="py-16 text-center text-gray-400 flex flex-col items-center justify-center">
            <span className="text-3xl">📭</span>
            <p className="font-semibold text-xs mt-3 font-sans text-slate-700">No professors found matching filter</p>
            <p className="text-[11px] text-gray-400 mt-1 max-w-xs">
              Clear your search or filter terms, or click "Add Professor" to log a research contact.
            </p>
          </div>
        ) : (
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-gray-100 font-mono text-[10px] uppercase tracking-wider">
                <th onClick={() => triggerSort("name")} className="p-4 font-medium select-none cursor-pointer hover:bg-slate-100">
                  <span className="flex items-center gap-1">
                    Professor Name <ArrowUpDown className="w-3 h-3 text-gray-400" />
                  </span>
                </th>
                <th onClick={() => triggerSort("university")} className="p-4 font-medium select-none cursor-pointer hover:bg-slate-100">
                  <span className="flex items-center gap-1">
                    University <ArrowUpDown className="w-3 h-3 text-gray-400" />
                  </span>
                </th>
                <th className="p-4 font-medium">Research Focus</th>
                <th onClick={() => triggerSort("status")} className="p-4 font-medium select-none cursor-pointer hover:bg-slate-100">
                  <span className="flex items-center gap-1">
                    Status <ArrowUpDown className="w-3 h-3 text-gray-400" />
                  </span>
                </th>
                <th onClick={() => triggerSort("applicationDeadline")} className="p-4 font-medium select-none cursor-pointer hover:bg-slate-100">
                  <span className="flex items-center gap-1">
                    Deadline <ArrowUpDown className="w-3 h-3 text-gray-400" />
                  </span>
                </th>
                <th onClick={() => triggerSort("interviewDate")} className="p-4 font-medium select-none cursor-pointer hover:bg-slate-100">
                  <span className="flex items-center gap-1">
                    Interview <ArrowUpDown className="w-3 h-3 text-gray-400" />
                  </span>
                </th>
                <th className="p-4 font-medium">Decision</th>
                <th className="p-4 font-medium text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {processedProfessors.map((prof) => (
                <tr key={prof.id} className="hover:bg-slate-50/50 transition">
                  {/* Name */}
                  <td className="p-4">
                    <div className="font-semibold text-slate-800">{prof.name}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{prof.department || "Advisor"}</div>
                  </td>

                  {/* University */}
                  <td className="p-4">
                    <span className="font-medium text-slate-700">{prof.university}</span>
                  </td>

                  {/* Research Focus */}
                  <td className="p-4 max-w-[180px]">
                    <div className="truncate text-slate-600" title={prof.researchFocus}>
                      {prof.researchFocus || <span className="text-gray-300">-</span>}
                    </div>
                  </td>

                  {/* Status Inline Select */}
                  <td className="p-4">
                    <select
                      value={prof.status}
                      onChange={(e) => onUpdateStatus(prof, e.target.value as ProfessorStatus)}
                      className={`font-mono text-[10px] uppercase font-bold tracking-wider rounded px-2.5 py-1 border border-transparent cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 ${getStatusBadgeStyles(
                        prof.status
                      )}`}
                    >
                      {Object.values(ProfessorStatus).map((st) => (
                        <option key={st} value={st} className="bg-white text-slate-800 font-mono text-xs font-normal capitalize">
                          {st}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Deadline */}
                  <td className="p-4 font-mono text-gray-500">
                    {prof.applicationDeadline ? (
                      prof.applicationDeadline
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>

                  {/* Interview */}
                  <td className="p-4 font-mono text-gray-500">
                    {prof.interviewDate ? (
                      <span className="font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{prof.interviewDate}</span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>

                  {/* Decision Inline Select */}
                  <td className="p-4">
                    <select
                      value={prof.decision}
                      onChange={(e) => onUpdateDecision(prof, e.target.value as DecisionStatus)}
                      className={`text-[10px] tracking-wide font-medium border border-slate-200 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer text-slate-600 bg-white`}
                    >
                      {Object.values(DecisionStatus).map((dec) => (
                        <option key={dec} value={dec}>
                          {dec}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Action buttons */}
                  <td className="p-4 text-right pr-6 shrink-0">
                    <div className="flex items-center justify-end gap-2.5">
                      {/* Email template draft */}
                      <button
                        onClick={() => onDraftEmail(prof)}
                        className="p-1.5 transition text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                        title="Draft Cold Email with Gemini Support"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => onEdit(prof)}
                        className="p-1.5 transition text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                        title="Edit entry"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => onDelete(prof)}
                        className="p-1.5 transition text-rose-500 hover:text-rose-800 hover:bg-rose-50 rounded"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
