import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API endpoint for Gemini cold-email drafting
app.post("/api/draft-email", async (req, res) => {
  try {
    const { professorName, university, researchTopic, myBackground, specificDetails, goal } = req.body;

    if (!professorName || !university) {
      return res.status(400).json({ error: "Professor Name and University are required." });
    }

    const prompt = `
      You are an expert academic advisor helping a student draft a highly professional, polite, and concise cold email to a prospective research professor in the USA for Masters programs (MS/PhD).
      
      Details for the email:
      - Professor Name: ${professorName}
      - University: ${university}
      - Professor's Research Focus / Topic: ${researchTopic || "Not specified"}
      - Student's Academic Background: ${myBackground || "Not specified"}
      - Specific papers, project details or alignment: ${specificDetails || "Not specified"}
      - Student's main goal: ${goal || "Ask if they are accepting MS research students for the coming terms and express interest in their lab"}
      
      Instructions for drafting:
      1. Write an elegant, catchy, but professional SUBJECT LINE (Keep it under 10 words).
      2. Write a professional, punchy EMAIL BODY that:
         - Starts with a formal salutation (e.g., "Dear Professor ...," or "Dear Dr. ...,").
         - States the student's name, background, and intention immediately but politely.
         - References the professor's research or a specific detail/paper showing genuine research interest (NOT generic copy-paste).
         - Connects their background directly but briefly to the professor's work.
         - Keeps the email short (around 3 paragraphs, under 200 words). Busy professors do not read long emails.
         - Ends with a clear call-to-action (e.g., a brief 10-minute video/Zoom discussion) and a polite, professional sign-off.
      3. Use placeholders like [Your Name], [Your University] for the student to customize.
      
      Provide the output in JSON format matching this schema:
      {
        "subject": "The generated subject line string",
        "body": "The generated email body string with newlines"
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT" as any,
          properties: {
            subject: { type: "STRING" as any, description: "Highly professional cold email subject line." },
            body: { type: "STRING" as any, description: "Polished cold email body with appropriate spacing and placeholders." }
          },
          required: ["subject", "body"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response received from Gemini API");
    }

    const parsed = JSON.parse(resultText.trim());
    res.json(parsed);
  } catch (error: any) {
    console.error("Gemini Email Generation Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate email draft." });
  }
});

// Vite middleware flow
async function main() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

main().catch(err => {
  console.error("Server Startup Failure:", err);
});
