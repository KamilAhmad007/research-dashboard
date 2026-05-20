/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Professor, ProfessorStatus, DecisionStatus } from "../types";

const HEADERS = [
  "ID",
  "Professor Name",
  "University",
  "Department",
  "Research Focus",
  "Email",
  "Website",
  "Email Sent Date",
  "Follow Up Date",
  "Status",
  "Application Deadline",
  "Interview Date",
  "Interview Notes",
  "Decision"
];

// Search user's Google Drive for existing US Graduate Professor Tracker spreadsheets
export async function listTrackerSpreadsheets(accessToken: string): Promise<{ id: string; name: string }[]> {
  try {
    const q = encodeURIComponent("name = 'US Graduate Professor Tracker' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false");
    const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`;
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to list sheets. Status: ${response.status}`);
    }

    const data = await response.json();
    return data.files || [];
  } catch (error) {
    console.error("Error listing spreadsheet trackers:", error);
    return [];
  }
}

// Create a new Google Sheet to track professor emails
export async function createTrackerSpreadsheet(accessToken: string): Promise<string> {
  try {
    const createUrl = "https://sheets.googleapis.com/v4/spreadsheets";
    const sheetBody = {
      properties: {
        title: "US Graduate Professor Tracker"
      },
      sheets: [
        {
          properties: {
            title: "Sheet1",
            gridProperties: {
              frozenRowCount: 1
            }
          }
        }
      ]
    };

    const createResponse = await fetch(createUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(sheetBody)
    });

    if (!createResponse.ok) {
      throw new Error("Failed to create Google Spreadsheet");
    }

    const createdSheet = await createResponse.json();
    const spreadsheetId = createdSheet.spreadsheetId;

    if (!spreadsheetId) {
      throw new Error("Spreadsheet ID was not returned by Google API.");
    }

    // Initialize headers in Row 1
    const writeHeadersUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:N1?valueInputOption=USER_ENTERED`;
    const headersBody = {
      range: "Sheet1!A1:N1",
      majorDimension: "ROWS",
      values: [HEADERS]
    };

    const headersResponse = await fetch(writeHeadersUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(headersBody)
    });

    if (!headersResponse.ok) {
      throw new Error("Failed to write headers to the new Google Spreadsheet");
    }

    return spreadsheetId;
  } catch (error) {
    console.error("Error creating tracker spreadsheet:", error);
    throw error;
  }
}

// Convert a row array of values into a Professor object
function rowToProfessor(row: any[], rowNum: number): Professor {
  return {
    id: row[0] || `row-${rowNum}-${Date.now()}`,
    rowNum: rowNum,
    name: row[1] || "",
    university: row[2] || "",
    department: row[3] || "",
    researchFocus: row[4] || "",
    email: row[5] || "",
    website: row[6] || "",
    emailSentDate: row[7] || "",
    followUpDate: row[8] || "",
    status: (row[9] as ProfessorStatus) || ProfessorStatus.NOT_SENT,
    applicationDeadline: row[10] || "",
    interviewDate: row[11] || "",
    interviewNotes: row[12] || "",
    decision: (row[13] as DecisionStatus) || DecisionStatus.PENDING
  };
}

// Convert a Professor object into a row array of values
function professorToRow(prof: Professor): any[] {
  return [
    prof.id,
    prof.name,
    prof.university,
    prof.department,
    prof.researchFocus,
    prof.email,
    prof.website,
    prof.emailSentDate,
    prof.followUpDate,
    prof.status,
    prof.applicationDeadline,
    prof.interviewDate,
    prof.interviewNotes,
    prof.decision
  ];
}

// Fetch all professors tracked in the spreadsheet
export async function fetchProfessors(accessToken: string, spreadsheetId: string): Promise<Professor[]> {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A2:N1000`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      // If the spreadsheet exists but values are inaccessible, it could be empty
      if (response.status === 400) {
        return [];
      }
      throw new Error(`Failed to fetch sheets data. Status: ${response.status}`);
    }

    const data = await response.json();
    const rows = data.values || [];
    
    return rows.map((row: any[], index: number) => {
      // Row 1 is header, so rows from A2 corresponds to spreadsheet Row 2.
      const rowNum = index + 2; 
      return rowToProfessor(row, rowNum);
    });
  } catch (error) {
    console.error("Error fetching professors list:", error);
    throw error;
  }
}

// Add a new professor to the spreadsheet
export async function appendProfessor(accessToken: string, spreadsheetId: string, professor: Professor): Promise<Professor> {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A:N:append?valueInputOption=USER_ENTERED`;
    const rowValues = professorToRow(professor);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        range: "Sheet1!A:N",
        majorDimension: "ROWS",
        values: [rowValues]
      })
    });

    if (!response.ok) {
      throw new Error("Failed to append professor in Sheet");
    }

    const resData = await response.json();
    // Parse the updated range to extract the row number
    const updatedRange = resData.updates?.updatedRange || ""; // e.g., "Sheet1!A5:N5"
    let rowNum: number | undefined;
    const match = updatedRange.match(/A(\d+):N\d+/);
    if (match) {
      rowNum = parseInt(match[1]);
    }

    return { ...professor, rowNum };
  } catch (error) {
    console.error("Error appending professor:", error);
    throw error;
  }
}

// Update an existing professor's row
export async function updateProfessorInSheet(accessToken: string, spreadsheetId: string, professor: Professor): Promise<void> {
  try {
    if (!professor.rowNum) {
      throw new Error("Cannot update professor without row number");
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A${professor.rowNum}:N${professor.rowNum}?valueInputOption=USER_ENTERED`;
    const rowValues = professorToRow(professor);

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        range: `Sheet1!A${professor.rowNum}:N${professor.rowNum}`,
        majorDimension: "ROWS",
        values: [rowValues]
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to update sheet row ${professor.rowNum}`);
    }
  } catch (error) {
    console.error("Error updating sheet row:", error);
    throw error;
  }
}

// Batch update the entire professor dataset. Excellent for deletions or full sync and reindexing.
export async function syncAllProfessorsToSheet(accessToken: string, spreadsheetId: string, professors: Professor[]): Promise<Professor[]> {
  try {
    // 1. Clear any existing rows to prevent residues (A2:N1000)
    const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A2:N1000:clear`;
    await fetch(clearUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (professors.length === 0) {
      return [];
    }

    // 2. Put the new list
    const writeUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A2:N${professors.length + 1}?valueInputOption=USER_ENTERED`;
    const rows = professors.map((p) => professorToRow(p));

    const response = await fetch(writeUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        range: `Sheet1!A2:N${professors.length + 1}`,
        majorDimension: "ROWS",
        values: rows
      })
    });

    if (!response.ok) {
      throw new Error("Failed to write replacement list to spreadsheet.");
    }

    // Reindex local list with new rows
    return professors.map((prof, index) => ({
      ...prof,
      rowNum: index + 2
    }));
  } catch (error) {
    console.error("Error in syncAllProfessorsToSheet:", error);
    throw error;
  }
}
