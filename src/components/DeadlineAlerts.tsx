/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState } from "react";
import { Professor, NotificationAlert } from "../types";
import { Bell, CalendarRange, Clock, AlertTriangle, CheckCircle } from "lucide-react";

interface DeadlineAlertsProps {
  professors: Professor[];
}

export default function DeadlineAlerts({ professors }: DeadlineAlertsProps) {
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Set the current baseline date from additional metadata: 2026-05-20
  const CURRENT_DATE = useMemo(() => new Date("2026-05-20"), []);

  const alerts = useMemo(() => {
    const list: NotificationAlert[] = [];

    professors.forEach((prof) => {
      // 1. Process application deadlines
      if (prof.applicationDeadline) {
        const deadlineDate = new Date(prof.applicationDeadline);
        // Normalize time elements
        deadlineDate.setHours(23, 59, 59, 999);
        const timeDiff = deadlineDate.getTime() - CURRENT_DATE.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

        // Let's list deadlines that are coming up in the future, or are up to 1 day overdue
        if (daysDiff >= -1 && daysDiff <= 30) {
          list.push({
            id: `deadline-${prof.id}`,
            type: "deadline",
            professorId: prof.id,
            professorName: prof.name,
            university: prof.university,
            date: prof.applicationDeadline,
            daysRemaining: daysDiff
          });
        }
      }

      // 2. Process interview dates
      if (prof.interviewDate) {
        const intDate = new Date(prof.interviewDate);
        const timeDiff = intDate.getTime() - CURRENT_DATE.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

        // List interview entries within 30 days
        if (daysDiff >= -1 && daysDiff <= 30) {
          list.push({
            id: `interview-${prof.id}`,
            type: "interview",
            professorId: prof.id,
            professorName: prof.name,
            university: prof.university,
            date: prof.interviewDate,
            daysRemaining: daysDiff
          });
        }
      }
    });

    // Sort alerts by days remaining (closest first)
    return list.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [professors, CURRENT_DATE]);

  // Handle requesting permission and triggering a real notification or system warning toast
  const triggerSysNotification = async () => {
    try {
      if ("Notification" in window) {
        const permission = await Notification.requestPermission();
        if (permission === "granted" && alerts.length > 0) {
          const urgentAlert = alerts[0];
          const text = urgentAlert.type === "deadline" 
            ? `Deadline in ${urgentAlert.daysRemaining} days for ${urgentAlert.professorName} (${urgentAlert.university})`
            : `Interview scheduled in ${urgentAlert.daysRemaining} days with ${urgentAlert.professorName}!`;
          
          new Notification("Grad School Advisor Alerts", {
            body: text,
            icon: "https://www.gstatic.com/images/branding/product/1x/sheets_2020q4_48dp.png"
          });
          
          setSuccessToast("Sent a system push notification alert successfully!");
          setTimeout(() => setSuccessToast(null), 4000);
          return;
        }
      }

      // Fallback in-app modal toast
      if (alerts.length > 0) {
        const urgentAlert = alerts[0];
        setSuccessToast(
          `🔔 App Reminder: Upcoming ${urgentAlert.type} with ${urgentAlert.professorName} at ${urgentAlert.university} in ${urgentAlert.daysRemaining} days!`
        );
      } else {
        setSuccessToast("All caught up! You have no upcoming deadlines/interviews within 30 days.");
      }
      setTimeout(() => setSuccessToast(null), 5000);
    } catch (e) {
      console.error(e);
      setSuccessToast("System permissions requested.");
      setTimeout(() => setSuccessToast(null), 3000);
    }
  };

  const getUrgencyClasses = (days: number) => {
    if (days < 0) return "bg-rose-50 border-rose-200 text-rose-800";
    if (days <= 3) return "bg-red-50 border-red-200 text-red-800 animate-pulse";
    if (days <= 7) return "bg-amber-50 border-amber-200 text-amber-800";
    return "bg-blue-50 border-blue-200 text-blue-700";
  };

  const getUrgencyBadge = (days: number) => {
    if (days < 0) return "Overdue";
    if (days === 0) return "Today!";
    if (days === 1) return "Tomorrow!";
    return `${days} days left`;
  };

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
      <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-sans font-semibold text-slate-800">
            Real-Time Notifications
          </h3>
          <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-medium">
            {alerts.length} Active
          </span>
        </div>
        <button
          onClick={triggerSysNotification}
          className="text-xs transition font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1.5 cursor-pointer"
          title="Test real chrome push notifications or show instant toast alert"
        >
          <Clock className="w-4 h-4" />
          Trigger Alert Test
        </button>
      </div>

      {successToast && (
        <div className="mb-4 bg-slate-900 text-white rounded-lg p-3 text-xs flex items-center justify-between shadow-lg transition duration-300">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-gray-400 hover:text-white ml-2 font-mono">×</button>
        </div>
      )}

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center bg-gray-50 rounded-lg">
          <CheckCircle className="w-10 h-10 text-slate-300 mb-2" />
          <h4 className="text-xs font-semibold text-slate-700">All Dates Caught Up</h4>
          <p className="text-xs text-mono text-gray-400 mt-1 max-w-[250px]">
            No application deadlines or scheduled interviews tracked in the next 30 days.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[290px] overflow-y-auto pr-1">
          {alerts.map((alert) => {
            const isDeadline = alert.type === "deadline";
            return (
              <div
                key={alert.id}
                className={`flex items-start justify-between p-3 rounded-lg border text-xs leading-relaxed transition ${getUrgencyClasses(
                  alert.daysRemaining
                )}`}
              >
                <div className="flex gap-2.5">
                  <div className="mt-0.5">
                    {isDeadline ? (
                      <CalendarRange className="w-4 h-4 opacity-85" />
                    ) : (
                      <Clock className="w-4 h-4 opacity-85" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">
                      {isDeadline ? "Application Deadline" : "Academic Interview"}
                    </p>
                    <p className="text-slate-700 mt-0.5">
                      {alert.professorName} • <span className="italic">{alert.university}</span>
                    </p>
                    <p className="text-[11px] opacity-75 mt-1">
                      Target Date: {alert.date}
                    </p>
                  </div>
                </div>
                <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white bg-opacity-65 shadow-2xs border border-black border-opacity-5">
                  {getUrgencyBadge(alert.daysRemaining)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center text-[11px] text-gray-400">
        <AlertTriangle className="w-3.5 h-3.5 mr-1 text-slate-400" />
        <span>Calculations relative to tracker baseline date: <span className="font-semibold">May 20, 2026</span>.</span>
      </div>
    </div>
  );
}
