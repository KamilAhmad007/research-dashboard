/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum ProfessorStatus {
  NOT_SENT = "Not Sent",
  EMAILED = "Emailed",
  REPLIED_INTERESTED = "Replied - Interested",
  REPLIED_NO_VACANCY = "Replied - No Vacancies",
  INTERVIEW_SCHEDULED = "Interview Scheduled",
  ACCEPTED = "Accepted",
  REJECTED = "Rejected"
}

export enum DecisionStatus {
  PENDING = "Pending",
  ADMITTED = "Admitted",
  REJECTED = "Rejected",
  WAITLISTED = "Waitlisted"
}

export interface Professor {
  id: string; // String identifier (UUID/timestamp)
  rowNum?: number; // Google Sheets row number (for accurate single-row updates)
  name: string;
  university: string;
  department: string;
  researchFocus: string;
  email: string;
  website: string;
  emailSentDate: string; // YYYY-MM-DD or empty
  followUpDate: string; // YYYY-MM-DD or empty
  status: ProfessorStatus;
  applicationDeadline: string; // YYYY-MM-DD or empty
  interviewDate: string; // YYYY-MM-DD or empty (with optional time)
  interviewNotes: string;
  decision: DecisionStatus;
}

export interface NotificationAlert {
  id: string;
  type: "deadline" | "interview";
  professorId: string;
  professorName: string;
  university: string;
  date: string;
  daysRemaining: number;
}
