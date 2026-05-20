/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from "react";
import { Professor, ProfessorStatus, DecisionStatus } from "./types";
import { initAuth, googleSignIn, logout, auth } from "./utils/firebaseAuth";
import { 
  listTrackerSpreadsheets, 
  createTrackerSpreadsheet, 
  fetchProfessors, 
  appendProfessor, 
  updateProfessorInSheet,
  syncAllProfessorsToSheet 
} from "./utils/googleSheets";
import DashboardMetrics from "./components/DashboardMetrics";
import DeadlineAlerts from "./components/DeadlineAlerts";
import KanbanBoard from "./components/KanbanBoard";
import ProfessorTable from "./components/ProfessorTable";
import ProfessorFormModal from "./components/ProfessorFormModal";
import EmailDrafterModal from "./components/EmailDrafterModal";
import { User } from "firebase/auth";
import { 
  GraduationCap, 
  Plus, 
  LogOut, 
  LayoutGrid, 
  Table, 
  CheckCircle2, 
  Database, 
  Lock, 
  AlertCircle, 
  BookOpen, 
  ChevronRight,
  RefreshCw,
  FileSpreadsheet,
  Globe,
  Settings
} from "lucide-react";

// Pre-seeded academic sample professors for Sandbox Standalone mode
const SAMPLE_PROFESSORS: Professor[] = [
  {
    id: "sample-1",
    name: "Dr. Linda Harrison",
    university: "UC Berkeley",
    department: "Electrical Engineering & Computer Sciences",
    researchFocus: "Resource-Efficient VLSI Systems & Embedded AI Architecture",
    email: "lharrison@berkeley.edu",
    website: "https://eecs.berkeley.edu",
    emailSentDate: "2026-05-15",
    followUpDate: "2026-05-22",
    status: ProfessorStatus.EMAILED,
    applicationDeadline: "2026-12-01",
    interviewDate: "",
    interviewNotes: "",
    decision: DecisionStatus.PENDING
  },
  {
    id: "sample-2",
    name: "Prof. Arthur Pendelton",
    university: "Carnegie Mellon University",
    department: "Language Technologies Institute",
    researchFocus: "Low-resource Machine Translation and Transformer Optimization",
    email: "pendelton@cmu.edu",
    website: "https://lti.cs.cmu.edu",
    emailSentDate: "2026-05-10",
    followUpDate: "2026-05-17",
    status: ProfessorStatus.REPLIED_INTERESTED,
    applicationDeadline: "2026-12-15",
    interviewDate: "2026-05-25",
    interviewNotes: "Expressed strong interest in my low-resource translation paper! Focus on preparation.",
    decision: DecisionStatus.PENDING
  },
  {
    id: "sample-3",
    name: "Dr. Raymond Vance",
    university: "University of Washington",
    department: "Paul G. Allen School of Computer Science & Engineering",
    researchFocus: "Sparse Representations and Graph Neural Network Mechanics",
    email: "rvance@uw.edu",
    website: "https://cs.washington.edu",
    emailSentDate: "2026-05-18",
    followUpDate: "2026-05-25",
    status: ProfessorStatus.NOT_SENT,
    applicationDeadline: "2026-12-01",
    interviewDate: "",
    interviewNotes: "",
    decision: DecisionStatus.PENDING
  },
  {
    id: "sample-4",
    name: "Dr. Clara Wu",
    university: "Harvard University",
    department: "School of Engineering & Applied Sciences (SEAS)",
    researchFocus: "AI alignment, Neural Attention, and Robust Deep Learning Safety",
    email: "cwu@g.harvard.edu",
    website: "https://seas.harvard.edu",
    emailSentDate: "2026-05-02",
    followUpDate: "2026-05-09",
    status: ProfessorStatus.INTERVIEW_SCHEDULED,
    applicationDeadline: "2026-12-10",
    interviewDate: "2026-05-22",
    interviewNotes: "Scheduled Zoom chat to review research proposal. Be ready to explain prior scaling law adjustments.",
    decision: DecisionStatus.PENDING
  }
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [sandboxMode, setSandboxMode] = useState(true);

  // Sheet connection states
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);
  const [checkingSheet, setCheckingSheet] = useState(false);
  const [cachedSheets, setCachedSheets] = useState<{ id: string; name: string }[]>([]);
  const [syncStatus, setSyncStatus] = useState<"not_connected" | "checking" | "connected" | "syncing" | "error">("not_connected");

  // Data state
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "kanban" | "table">("dashboard");

  // Load/save variables for Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProfessor, setEditingProfessor] = useState<Professor | null>(null);
  const [isDrafterOpen, setIsDrafterOpen] = useState(false);
  const [draftingProfessor, setDraftingProfessor] = useState<Professor | null>(null);

  // Initialize auth
  useEffect(() => {
    initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
        setSandboxMode(false);
        setAuthLoading(false);
      },
      () => {
        setUser(null);
        setToken(null);
        setAuthLoading(false);
      }
    );
  }, []);

  // Sync / Load data based on state or Mode
  useEffect(() => {
    if (sandboxMode) {
      const stored = localStorage.getItem("sandbox_professors");
      if (stored) {
        setProfessors(JSON.parse(stored));
      } else {
        setProfessors(SAMPLE_PROFESSORS);
        localStorage.setItem("sandbox_professors", JSON.stringify(SAMPLE_PROFESSORS));
      }
      setSyncStatus("not_connected");
    } else if (token) {
      const savedSheetId = localStorage.getItem(`spreadsheet_id_${user?.uid}`);
      if (savedSheetId) {
        setSpreadsheetId(savedSheetId);
        loadSheetData(token, savedSheetId);
      } else {
        // No saved spreadsheet ID, look for one or offer creation
        findExistingSheets(token);
      }
    }
  }, [sandboxMode, token, user]);

  const findExistingSheets = async (accessToken: string) => {
    setCheckingSheet(true);
    setSyncStatus("checking");
    try {
      const list = await listTrackerSpreadsheets(accessToken);
      setCachedSheets(list);
      if (list.length > 0) {
        // Automatically default connect to the first found tracker!
        const autoId = list[0].id;
        setSpreadsheetId(autoId);
        localStorage.setItem(`spreadsheet_id_${user?.uid}`, autoId);
        loadSheetData(accessToken, autoId);
      } else {
        setSyncStatus("not_connected");
      }
    } catch (e) {
      console.error(e);
      setSyncStatus("error");
    } finally {
      setCheckingSheet(false);
    }
  };

  const loadSheetData = async (accessToken: string, targetId: string) => {
    setSyncStatus("checking");
    try {
      const list = await fetchProfessors(accessToken, targetId);
      setProfessors(list);
      setSyncStatus("connected");
    } catch (error) {
      console.error(error);
      setSyncStatus("error");
    }
  };

  const handleCreateNewSheet = async () => {
    if (!token) return;
    setSyncStatus("checking");
    try {
      const newId = await createTrackerSpreadsheet(token);
      setSpreadsheetId(newId);
      localStorage.setItem(`spreadsheet_id_${user?.uid}`, newId);
      
      // If there are existing local professors, offer to export/import them!
      const currentLocalProfs = professors.length > 0 ? professors : SAMPLE_PROFESSORS;
      const reindexed = await syncAllProfessorsToSheet(token, newId, currentLocalProfs);
      setProfessors(reindexed);
      setSyncStatus("connected");
    } catch (error) {
      console.error("Failed to provision sheets tracker:", error);
      setSyncStatus("error");
    }
  };

  // Switch sheet selection
  const handleSelectChangedSheet = (targetId: string) => {
    if (!token) return;
    setSpreadsheetId(targetId);
    localStorage.setItem(`spreadsheet_id_${user?.uid}`, targetId);
    loadSheetData(token, targetId);
  };

  const handleLogin = async () => {
    try {
      setAuthLoading(true);
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        setSandboxMode(false);
      }
    } catch (error) {
      console.error("Google sign in failure:", error);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogOut = async () => {
    try {
      await logout();
      setUser(null);
      setToken(null);
      setSpreadsheetId(null);
      setSandboxMode(true);
    } catch (err) {
      console.error(err);
    }
  };

  // CRUD Data Operations
  const handleSaveProfessor = async (prof: Professor) => {
    setIsFormOpen(false);
    setSyncStatus("syncing");

    // Add row action helper
    if (sandboxMode) {
      let newList = [...professors];
      const exists = professors.some((p) => p.id === prof.id);
      if (exists) {
        newList = professors.map((p) => (p.id === prof.id ? prof : p));
      } else {
        newList.push(prof);
      }
      setProfessors(newList);
      localStorage.setItem("sandbox_professors", JSON.stringify(newList));
      setSyncStatus("not_connected");
    } else if (token && spreadsheetId) {
      try {
        const exists = professors.some((p) => p.id === prof.id);
        if (exists && prof.rowNum) {
          // Update existing row
          await updateProfessorInSheet(token, spreadsheetId, prof);
          setProfessors(professors.map((p) => (p.id === prof.id ? prof : p)));
        } else {
          // Append new row
          const appended = await appendProfessor(token, spreadsheetId, prof);
          setProfessors([...professors, appended]);
        }
        setSyncStatus("connected");
      } catch (err) {
        console.error(err);
        setSyncStatus("error");
      }
    }
  };

  const handleUpdateStatus = async (prof: Professor, newStatus: ProfessorStatus) => {
    setSyncStatus("syncing");
    const updatedProf = { ...prof, status: newStatus };

    if (sandboxMode) {
      const newList = professors.map((p) => (p.id === prof.id ? updatedProf : p));
      setProfessors(newList);
      localStorage.setItem("sandbox_professors", JSON.stringify(newList));
      setSyncStatus("not_connected");
    } else if (token && spreadsheetId) {
      try {
        if (prof.rowNum) {
          await updateProfessorInSheet(token, spreadsheetId, updatedProf);
          setProfessors(professors.map((p) => (p.id === prof.id ? updatedProf : p)));
        } else {
          // Fallback batch write if rowNum is untracked
          const newList = professors.map((p) => (p.id === prof.id ? updatedProf : p));
          const synced = await syncAllProfessorsToSheet(token, spreadsheetId, newList);
          setProfessors(synced);
        }
        setSyncStatus("connected");
      } catch (err) {
        console.error(err);
        setSyncStatus("error");
      }
    }
  };

  const handleUpdateDecision = async (prof: Professor, newDecision: DecisionStatus) => {
    setSyncStatus("syncing");
    const updatedProf = { ...prof, decision: newDecision };

    if (sandboxMode) {
      const newList = professors.map((p) => (p.id === prof.id ? updatedProf : p));
      setProfessors(newList);
      localStorage.setItem("sandbox_professors", JSON.stringify(newList));
      setSyncStatus("not_connected");
    } else if (token && spreadsheetId) {
      try {
        if (prof.rowNum) {
          await updateProfessorInSheet(token, spreadsheetId, updatedProf);
          setProfessors(professors.map((p) => (p.id === prof.id ? updatedProf : p)));
        } else {
          const newList = professors.map((p) => (p.id === prof.id ? updatedProf : p));
          const synced = await syncAllProfessorsToSheet(token, spreadsheetId, newList);
          setProfessors(synced);
        }
        setSyncStatus("connected");
      } catch (err) {
        console.error(err);
        setSyncStatus("error");
      }
    }
  };

  const handleDeleteProfessor = async (prof: Professor) => {
    const isConfirmed = window.confirm(`Remove ${prof.name} from academic tracks? This will fully delete their data from the tracker.`);
    if (!isConfirmed) return;

    setSyncStatus("syncing");
    const filtered = professors.filter((p) => p.id !== prof.id);

    if (sandboxMode) {
      setProfessors(filtered);
      localStorage.setItem("sandbox_professors", JSON.stringify(filtered));
      setSyncStatus("not_connected");
    } else if (token && spreadsheetId) {
      try {
        // Safe batch reindex on deletion to ensure contiguous spreadsheet indices
        const synced = await syncAllProfessorsToSheet(token, spreadsheetId, filtered);
        setProfessors(synced);
        setSyncStatus("connected");
      } catch (err) {
        console.error(err);
        setSyncStatus("error");
      }
    }
  };

  // Modal open handlings
  const handleOpenEdit = (prof: Professor) => {
    setEditingProfessor(prof);
    setIsFormOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingProfessor(null);
    setIsFormOpen(true);
  };

  const handleOpenDrafter = (prof: Professor) => {
    setDraftingProfessor(prof);
    setIsDrafterOpen(true);
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-900 overflow-hidden">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 flex flex-col flex-shrink-0 text-slate-300 border-r border-slate-800">
        <div className="p-6 border-b border-slate-800/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-extrabold text-base">P</div>
            <div>
              <span className="text-white font-bold text-base tracking-tight block">ProfTrack Pro</span>
              <span className="text-[9px] text-slate-500 font-mono tracking-wider uppercase block">Advisor Tracker</span>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center px-4 py-3 text-xs font-semibold rounded-md transition-all duration-150 cursor-pointer ${
              activeTab === "dashboard"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <BookOpen className="w-4 h-4 mr-3 text-slate-400" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab("kanban")}
            className={`w-full flex items-center px-4 py-3 text-xs font-semibold rounded-md transition-all duration-150 cursor-pointer ${
              activeTab === "kanban"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <LayoutGrid className="w-4 h-4 mr-3 text-slate-400" />
            <span>Progression Pipeline</span>
          </button>

          <button
            onClick={() => setActiveTab("table")}
            className={`w-full flex items-center px-4 py-3 text-xs font-semibold rounded-md transition-all duration-150 cursor-pointer ${
              activeTab === "table"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Table className="w-4 h-4 mr-3 text-slate-400" />
            <span>Professor Directory</span>
          </button>
        </nav>

        {/* Database Status indicator inside Sidebar bottom */}
        <div className="p-4 border-t border-slate-850 bg-slate-950/40">
          <div className="bg-slate-850 p-4 rounded-lg border border-slate-800">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-2 flex items-center gap-1">
              <Database className="w-3 h-3 text-blue-500" />
              Connected Account
            </p>
            {sandboxMode ? (
              <div className="space-y-2">
                <p className="text-xs text-slate-300 font-semibold">Offline Sandbox</p>
                <p className="text-[10px] text-slate-500 leading-relaxed">Changes save locally in browser storage.</p>
                <button
                  onClick={handleLogin}
                  className="w-full text-center py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold cursor-pointer transition-colors"
                >
                  Link Google Sheets
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                <p className="text-xs text-white truncate font-semibold" title={spreadsheetId || ""}>
                  {cachedSheets.find(s => s.id === spreadsheetId)?.name || "Grad School Advisor Sheet"}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span className="text-[10px] text-emerald-400 font-semibold">Fully Synced</span>
                </div>
                {cachedSheets.length > 1 && (
                  <div className="mt-2 pt-1 border-t border-slate-800">
                    <select
                      value={spreadsheetId || ""}
                      onChange={(e) => handleSelectChangedSheet(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-300 text-[10px] rounded px-2 py-1 focus:ring-1 focus:ring-blue-500"
                    >
                      {cachedSheets.map((sh) => (
                        <option key={sh.id} value={sh.id}>{sh.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 flex-shrink-0">
          <div className="flex items-center space-x-3">
            {activeTab === "dashboard" && <h1 className="text-base font-bold text-slate-800">Graduate Application Dashboard</h1>}
            {activeTab === "kanban" && <h1 className="text-base font-bold text-slate-800">Progression Pipeline</h1>}
            {activeTab === "table" && <h1 className="text-base font-bold text-slate-800">Advisor Records Directory</h1>}
            
            <div className="h-4 w-px bg-slate-200"></div>
            
            <span className="text-[10px] font-mono text-slate-400">
              {syncStatus === "connected" && "● System Sync Safe"}
              {syncStatus === "syncing" && "⟳ Updating Sheets Database..."}
              {syncStatus === "not_connected" && "● Standalone Sandbox Sandbox"}
              {syncStatus === "error" && "⚠️ Sync Error check connection"}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Professor
            </button>

            <div className="h-6 w-px bg-slate-200"></div>

            {/* Profile Avatar & OAuth Status */}
            <div>
              {!sandboxMode && user ? (
                <div className="flex items-center space-x-3">
                  <div className="flex flex-col text-right">
                    <span className="text-xs font-semibold text-slate-800">{user.displayName || "Applicant"}</span>
                    <span className="text-[9px] text-slate-400 font-mono truncate max-w-[120px]">{user.email}</span>
                  </div>
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt="Avatar" 
                      className="w-8 h-8 rounded-full border border-slate-200" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                      {user.displayName?.charAt(0) || "U"}
                    </div>
                  )}
                  <button
                    onClick={handleLogOut}
                    className="p-1.5 text-slate-450 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Sign Out from portal"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  Google Sign In
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Content Area Wrap */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Sync Prompt Banner if logged out or auth setup needed */}
          {!sandboxMode && !spreadsheetId && !checkingSheet && (
            <div className="bg-slate-900 text-white rounded-lg p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 border border-slate-800">
              <div className="flex items-start gap-3.5">
                <Database className="w-9 h-9 text-blue-400 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <h3 className="font-bold text-sm text-slate-100">Provision Google Sheets Database</h3>
                  <p className="text-xs text-slate-350 mt-1 max-w-xl">
                    Keep your application targets stored in an open Google Sheets file on your Google Drive. Allows simple imports, raw edits, and seamless backup tracks.
                  </p>
                </div>
              </div>
              <button
                onClick={handleCreateNewSheet}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded shadow transition-colors cursor-pointer shrink-0"
              >
                Provision Sheets Tracker
              </button>
            </div>
          )}

          {/* Sync status active indicator */}
          {syncStatus === "checking" && (
            <div className="bg-amber-50 text-amber-850 border border-amber-200 p-3.5 rounded-lg text-xs flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
              <span>Verifying and compiling advisor database columns...</span>
            </div>
          )}

          {/* Dynamic tabs render logic */}
          {activeTab === "dashboard" ? (
            <div className="space-y-6">
              {/* Dashboard Metrics Panel */}
              <DashboardMetrics professors={professors} />

              {/* Grid content for Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Guides / Explainer */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-5">
                    <div>
                      <h2 className="text-base font-bold text-slate-850">Graduate Advisor Outreach Tracker</h2>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase tracking-wider">Instructions & Best Practices</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200/60 relative hover:border-blue-300 transition-colors">
                        <span className="text-base">📬</span>
                        <h4 className="font-bold text-slate-800 mt-2">1. Warm Cold-Emailing</h4>
                        <p className="text-slate-500 text-[11px] mt-1.5 leading-relaxed">
                          Tailor templates to match lab objectives. Call our AI Drafter to alignment to publications.
                        </p>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200/60 relative hover:border-blue-300 transition-colors">
                        <span className="text-base">💬</span>
                        <h4 className="font-bold text-slate-800 mt-2">2. Live Interviews</h4>
                        <p className="text-slate-500 text-[11px] mt-1.5 leading-relaxed">
                          Note targeted queries, dates, follow-up times, and relevant discussion outcomes.
                        </p>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200/60 relative hover:border-blue-300 transition-colors">
                        <span className="text-base">📊</span>
                        <h4 className="font-bold text-slate-800 mt-2">3. Master Sheets Data</h4>
                        <p className="text-slate-500 text-[11px] mt-1.5 leading-relaxed">
                          Enjoy fully contiguous spreadsheet logging & safe decision pipelines.
                        </p>
                      </div>
                    </div>

                    <div className="bg-blue-50/60 border border-blue-105 p-4 rounded-lg text-xs text-blue-900 leading-relaxed flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">💡</span>
                        <div>
                          <p className="font-bold">Want to compose customized letters instantly?</p>
                          <p className="text-[11px] text-blue-700/80 mt-0.5">Under Directory or Quick Advisor list, click the Compose Sparkles button to let Gemini synthesize your profile.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick table list */}
                  <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-3">
                      <h3 className="text-sm font-bold text-slate-800">Quick Advisor Records</h3>
                      <button 
                        onClick={() => setActiveTab("table")} 
                        className="text-blue-600 hover:text-blue-800 text-xs transition-colors font-semibold flex items-center cursor-pointer"
                      >
                        View Directory <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="bg-slate-50 text-slate-400 font-mono text-[10px] uppercase">
                            <th className="p-3 font-semibold">Professor & School</th>
                            <th className="p-3 font-semibold">Key Focus</th>
                            <th className="p-3 font-semibold">E-Mail Status</th>
                            <th className="p-3 font-semibold">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-sans font-medium">
                          {professors.slice(0, 4).map((prof) => (
                            <tr key={prof.id} className="hover:bg-slate-50/40">
                              <td className="p-3">
                                <span className="font-bold text-slate-800 block text-xs">{prof.name}</span>
                                <span className="text-[10px] text-slate-500">{prof.university}</span>
                              </td>
                              <td className="p-3 text-slate-600 truncate max-w-[180px]" title={prof.researchFocus}>{prof.researchFocus || "-"}</td>
                              <td className="p-3">
                                <span className="font-mono text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                  {prof.status}
                                </span>
                              </td>
                              <td className="p-3">
                                <button
                                  onClick={() => handleOpenDrafter(prof)}
                                  className="text-blue-600 font-bold hover:text-blue-800 hover:underline transition-colors cursor-pointer text-xs"
                                >
                                  Draft Email
                                </button>
                              </td>
                            </tr>
                          ))}
                          {professors.length === 0 && (
                            <tr>
                              <td colSpan={4} className="p-6 text-center text-slate-400">
                                No professor targets found. Log new advisors to begin.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Deadline alerts & upcoming interview schedule */}
                <div className="space-y-6">
                  <DeadlineAlerts professors={professors} />
                </div>
              </div>
            </div>
          ) : activeTab === "kanban" ? (
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm overflow-hidden flex flex-col">
              <div className="pb-3 border-b border-slate-100 mb-4 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Outreach progression board</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Move advisors through target pipeline states seamlessly</p>
                </div>
              </div>
              <KanbanBoard 
                professors={professors} 
                onUpdateStatus={handleUpdateStatus} 
                onEdit={handleOpenEdit} 
              />
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
              <ProfessorTable 
                professors={professors}
                onEdit={handleOpenEdit}
                onDelete={handleDeleteProfessor}
                onDraftEmail={handleOpenDrafter}
                onUpdateStatus={handleUpdateStatus}
                onUpdateDecision={handleUpdateDecision}
              />
            </div>
          )}

        </div>

        {/* System footer matches modern minimalist style */}
        <footer className="h-10 bg-white border-t border-slate-200 flex items-center justify-between px-8 text-[11px] text-slate-450 flex-shrink-0">
          <p>© 2026 ProfTrack Pro • Connected secure via Firebase Auth • Developed by: Kamil Ahmad, PUST</p>
          <p className="font-mono text-[10px]">SYS TIME: 2026-05-20 | USA GRAD PORTAL</p>
        </footer>

      </main>

      {/* MODAL OVERLAYS */}
      <ProfessorFormModal 
        isOpen={isFormOpen}
        professor={editingProfessor}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveProfessor}
      />

      <EmailDrafterModal 
        isOpen={isDrafterOpen}
        professor={draftingProfessor}
        onClose={() => setIsDrafterOpen(false)}
      />

    </div>
  );
}
