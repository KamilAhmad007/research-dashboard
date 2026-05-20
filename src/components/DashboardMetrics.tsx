/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Professor, ProfessorStatus, DecisionStatus } from "../types";
import { Users, MailCheck, MessageSquare, Calendar, HelpCircle, Trophy } from "lucide-react";

interface DashboardMetricsProps {
  professors: Professor[];
}

export default function DashboardMetrics({ professors }: DashboardMetricsProps) {
  const total = professors.length;
  
  const emailedCount = professors.filter(
    (p) => p.status !== ProfessorStatus.NOT_SENT
  ).length;

  const emailedPercent = total > 0 ? Math.round((emailedCount / total) * 100) : 0;

  const replies = professors.filter(
    (p) => 
      p.status === ProfessorStatus.REPLIED_INTERESTED || 
      p.status === ProfessorStatus.REPLIED_NO_VACANCY ||
      p.status === ProfessorStatus.INTERVIEW_SCHEDULED ||
      p.status === ProfessorStatus.ACCEPTED ||
      p.status === ProfessorStatus.REJECTED
  ).length;

  const responseRate = emailedCount > 0 ? Math.round((replies / emailedCount) * 100) : 0;

  const positiveReplies = professors.filter(
    (p) => p.status === ProfessorStatus.REPLIED_INTERESTED || p.status === ProfessorStatus.INTERVIEW_SCHEDULED || p.status === ProfessorStatus.ACCEPTED
  ).length;

  const interviewScheduledCount = professors.filter(
    (p) => p.status === ProfessorStatus.INTERVIEW_SCHEDULED
  ).length;

  const admittedCount = professors.filter(
    (p) => p.decision === DecisionStatus.ADMITTED
  ).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* Metric 1 */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm transition hover:shadow-md">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-mono text-gray-400 uppercase tracking-wider">Total Professors</p>
            <h3 className="text-3xl font-sans font-semibold tracking-tight text-slate-800 mt-1">{total}</h3>
          </div>
          <div className="p-3 bg-slate-50 text-slate-600 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          Add prospective advisors to begin tracking.
        </p>
      </div>

      {/* Metric 2 */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm transition hover:shadow-md">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-mono text-gray-400 uppercase tracking-wider">Emailed / Applied</p>
            <h3 className="text-3xl font-sans font-semibold tracking-tight text-slate-800 mt-1">
              {emailedCount} <span className="text-xs font-normal text-gray-400">/ {total}</span>
            </h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <MailCheck className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span className="font-semibold text-slate-700">{emailedPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5">
            <div 
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${emailedPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Metric 3 */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm transition hover:shadow-md">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-mono text-gray-400 uppercase tracking-wider">Response Rate</p>
            <h3 className="text-3xl font-sans font-semibold tracking-tight text-slate-800 mt-1">
              {responseRate}%
            </h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          <span className="font-semibold text-emerald-600">{positiveReplies}</span> positive / interested follow-ups.
        </p>
      </div>

      {/* Metric 4 */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm transition hover:shadow-md">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-mono text-gray-400 uppercase tracking-wider">Interviews & Deals</p>
            <h3 className="text-3xl font-sans font-semibold tracking-tight text-slate-800 mt-1">
              {interviewScheduledCount} <span className="text-xs font-normal text-emerald-600">({admittedCount} Admitted)</span>
            </h3>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-4 flex items-center">
          <Trophy className="w-4 h-4 text-amber-500 mr-1.5" />
          Keep preparing and practicing!
        </p>
      </div>
    </div>
  );
}
