import "dotenv/config";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { createRequire } from "module";
import multer from "multer";
import mammoth from "mammoth";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const PORT = Number(process.env.PORT || 3000);
const PRIMARY_MODEL = "gemini-4-hydrogen";
const FALLBACK_MODEL = "gemini-3.1-flash-lite";

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error(
      "GEMINI_API_KEY is not configured. Please add a valid Gemini API key in Settings > Secrets."
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function isTransientUnavailable(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return (
    msg.includes("503") ||
    msg.includes("unavailable") ||
    msg.includes("high demand") ||
    msg.includes("overloaded") ||
    msg.includes("timeout")
  );
}

async function generateWithResilience(
  ai: GoogleGenAI,
  contents: string,
  config: {
    systemInstruction: string;
    thinkingLevel: ThinkingLevel;
    responseMimeType: string;
    responseSchema: Record<string, unknown>;
  }
) {
  try {
    const response = await ai.models.generateContent({
      model: PRIMARY_MODEL,
      contents,
      config: {
        systemInstruction: config.systemInstruction,
        thinkingConfig: { thinkingLevel: config.thinkingLevel },
        responseMimeType: config.responseMimeType,
        responseSchema: config.responseSchema,
      },
    });
    return { response, modelUsed: PRIMARY_MODEL };
  } catch (primaryErr) {
    if (!isTransientUnavailable(primaryErr)) {
      throw primaryErr;
    }
    await new Promise((resolve) => setTimeout(resolve, 350));
    try {
      const response = await ai.models.generateContent({
        model: FALLBACK_MODEL,
        contents,
        config: {
          systemInstruction: config.systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
          responseMimeType: config.responseMimeType,
          responseSchema: config.responseSchema,
        },
      });
      return { response, modelUsed: FALLBACK_MODEL };
    } catch (fallbackErr) {
      if (!isTransientUnavailable(fallbackErr)) {
        throw fallbackErr;
      }
      await new Promise((resolve) => setTimeout(resolve, 700));
      const response = await ai.models.generateContent({
        model: PRIMARY_MODEL,
        contents,
        config: {
          systemInstruction: config.systemInstruction,
          thinkingConfig: { thinkingLevel: config.thinkingLevel },
          responseMimeType: config.responseMimeType,
          responseSchema: config.responseSchema,
        },
      });
      return { response, modelUsed: PRIMARY_MODEL };
    }
  }
}

function formatGeminiError(err: unknown): { status: number; message: string } {
  const rawMessage =
    err instanceof Error ? err.message : "Unknown error communicating with Gemini API.";
  let extractedMessage = rawMessage;

  try {
    const parsed = JSON.parse(rawMessage) as { error?: { message?: string } };
    if (parsed?.error?.message) {
      extractedMessage = parsed.error.message;
    }
  } catch {
    // Keep raw message if not JSON
  }

  const lower = extractedMessage.toLowerCase();

  if (lower.includes("gemini_api_key is not configured")) {
    return { status: 503, message: extractedMessage };
  }
  if (
    lower.includes("403") ||
    lower.includes("permission_denied") ||
    lower.includes("api_key_invalid") ||
    lower.includes("api key not valid")
  ) {
    return {
      status: 400,
      message:
        "Gemini API authentication failed. Please verify your GEMINI_API_KEY in the Settings > Secrets panel.",
    };
  }
  if (lower.includes("429") || lower.includes("resource_exhausted")) {
    return {
      status: 429,
      message:
        "Gemini API rate limit or quota reached. Please wait a moment and try again.",
    };
  }
  if (isTransientUnavailable(extractedMessage)) {
    return {
      status: 503,
      message:
        "The AI service is temporarily experiencing high demand. Please retry in a few seconds.",
    };
  }
  return { status: 500, message: extractedMessage };
}

interface ExtractedPage {
  pageNumber: number;
  text: string;
}

async function extractPdfPages(buffer: Buffer): Promise<ExtractedPage[]> {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  try {
    const workerPath = require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs");
    pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;
  } catch {
    // Fallback if worker resolution differs
  }

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
    disableFontFace: true,
    verbosity: 0,
  });

  const pdfDoc = await loadingTask.promise;
  const pages: ExtractedPage[] = [];

  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();
    const lines: string[] = [];
    let currentLine = "";
    let lastY: number | null = null;

    for (const item of textContent.items) {
      if ("str" in item) {
        const y = Array.isArray(item.transform) ? item.transform[5] : null;
        if (lastY !== null && y !== null && Math.abs(y - lastY) > 4) {
          if (currentLine.trim()) {
            lines.push(currentLine.trim());
          }
          currentLine = item.str;
        } else {
          currentLine += (currentLine && item.str && !currentLine.endsWith(" ") ? " " : "") + item.str;
        }
        if (y !== null) {
          lastY = y;
        }
      }
    }
    if (currentLine.trim()) {
      lines.push(currentLine.trim());
    }

    pages.push({
      pageNumber: i,
      text: lines.join("\n").trim(),
    });
  }

  return pages;
}

function buildDocumentContextString(
  docs: Array<{
    name: string;
    type: string;
    hasPageNumbers: boolean;
    pages: Array<{ pageNumber: number; text: string }>;
    fullText: string;
  }>
): string {
  return docs
    .map((doc) => {
      if (doc.hasPageNumbers && doc.pages && doc.pages.length > 0) {
        const pageBlocks = doc.pages
          .map((p) => `[Page ${p.pageNumber}]\n${p.text}`)
          .join("\n\n");
        return `=== DOCUMENT: ${doc.name} (Type: ${doc.type}, Page Numbers Available: YES) ===\n${pageBlocks}`;
      }
      return `=== DOCUMENT: ${doc.name} (Type: ${doc.type}, Page Numbers Available: NO - do not invent page numbers) ===\n${doc.fullText}`;
    })
    .join("\n\n----------------------------------------\n\n");
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
});

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "12mb" }));

  app.get("/api/health", (_req, res) => {
    const key = process.env.GEMINI_API_KEY?.trim();
    res.json({
      ok: true,
      aiConfigured: Boolean(key && key !== "MY_GEMINI_API_KEY"),
    });
  });

  app.post("/api/documents/extract", upload.single("file"), async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ error: "No file uploaded." });
        return;
      }

      const originalName = file.originalname || "document";
      const ext = path.extname(originalName).toLowerCase();

      if (ext === ".pdf") {
        const pages = await extractPdfPages(file.buffer);
        const nonEmptyText = pages.map((p) => p.text).join("\n\n").trim();
        if (!nonEmptyText) {
          res.status(422).json({
            error:
              "No selectable text was found in this PDF. It may be a scanned image-only PDF. Please upload a text-based PDF, DOCX, or TXT file.",
          });
          return;
        }
        const fullText = pages
          .map((p) => `[Page ${p.pageNumber}]\n${p.text}`)
          .join("\n\n");
        const wordCount = nonEmptyText.split(/\s+/).filter(Boolean).length;

        res.json({
          fileName: originalName,
          fileType: "PDF",
          fileSize: file.size,
          pageCount: pages.length,
          hasPageNumbers: true,
          pages,
          fullText,
          wordCount,
        });
        return;
      }

      if (ext === ".docx") {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        const rawText = (result.value || "").trim();
        if (!rawText) {
          res.status(422).json({
            error: "No readable text could be extracted from this DOCX file.",
          });
          return;
        }
        const wordCount = rawText.split(/\s+/).filter(Boolean).length;
        res.json({
          fileName: originalName,
          fileType: "DOCX",
          fileSize: file.size,
          pageCount: 1,
          hasPageNumbers: false,
          pages: [{ pageNumber: 1, text: rawText }],
          fullText: rawText,
          wordCount,
        });
        return;
      }

      if (ext === ".txt") {
        const rawText = file.buffer.toString("utf-8").trim();
        if (!rawText) {
          res.status(422).json({ error: "The uploaded TXT file is empty." });
          return;
        }
        const wordCount = rawText.split(/\s+/).filter(Boolean).length;
        res.json({
          fileName: originalName,
          fileType: "TXT",
          fileSize: file.size,
          pageCount: 1,
          hasPageNumbers: false,
          pages: [{ pageNumber: 1, text: rawText }],
          fullText: rawText,
          wordCount,
        });
        return;
      }

      res.status(400).json({
        error: "Unsupported file format. Please upload a PDF, DOCX, or TXT file.",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to extract text from document.";
      res.status(500).json({ error: message });
    }
  });

  app.post("/api/ai/analyze-document", async (req, res) => {
    try {
      const { documentName, fileType, hasPageNumbers, pages, fullText, caseTitle } = req.body ?? {};
      if (!documentName || (!fullText && (!Array.isArray(pages) || pages.length === 0))) {
        res.status(400).json({ error: "Document name and extracted text are required." });
        return;
      }

      const ai = getGeminiClient();
      const docContext = buildDocumentContextString([
        {
          name: documentName,
          type: fileType || "Document",
          hasPageNumbers: Boolean(hasPageNumbers),
          pages: Array.isArray(pages) ? pages : [],
          fullText: String(fullText || ""),
        },
      ]);

      const systemInstruction = [
        "You are Lexora, a meticulous legal document intelligence analyst assisting qualified attorneys.",
        "Analyze ONLY the extracted text of the uploaded document provided below.",
        "STRICT GROUNDING RULES:",
        "1. Do NOT fabricate, infer beyond the text, or invent dates, parties, clauses, case numbers, or page numbers.",
        "2. If any fact, date, clause, or obligation is ambiguous or only partially stated, set uncertain: true and clearly note the uncertainty.",
        "3. When Page Numbers Available is YES, cite sources in the exact format: [Document: <fileName>, Page <N>].",
        "4. When Page Numbers Available is NO, cite sources as [Document: <fileName>, Page unavailable] and quote a short identifying phrase—never invent a page number.",
        "5. If a field such as caseNumber is not present in the text, return 'Not specified in document'.",
      ].join("\n");

      const prompt = [
        caseTitle ? `Associated Case Context: ${caseTitle}` : "",
        "Perform a comprehensive structured legal analysis of the following extracted document text:",
        "",
        docContext.slice(0, 120000),
      ]
        .filter(Boolean)
        .join("\n");

      const { response, modelUsed } = await generateWithResilience(ai, prompt, {
        systemInstruction,
        thinkingLevel: ThinkingLevel.MEDIUM,
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
              documentSummary: {
                type: Type.OBJECT,
                properties: {
                  overview: { type: Type.STRING },
                  mainPurpose: { type: Type.STRING },
                  importantFacts: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        fact: { type: Type.STRING },
                        citation: { type: Type.STRING },
                        uncertain: { type: Type.BOOLEAN },
                      },
                      required: ["fact", "citation", "uncertain"],
                    },
                  },
                },
                required: ["overview", "mainPurpose", "importantFacts"],
              },
              keyInformation: {
                type: Type.OBJECT,
                properties: {
                  partiesInvolved: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        role: { type: Type.STRING },
                        citation: { type: Type.STRING },
                      },
                      required: ["name", "role", "citation"],
                    },
                  },
                  importantDates: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        date: { type: Type.STRING },
                        significance: { type: Type.STRING },
                        citation: { type: Type.STRING },
                      },
                      required: ["date", "significance", "citation"],
                    },
                  },
                  caseNumber: { type: Type.STRING },
                  legalIssues: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        issue: { type: Type.STRING },
                        citation: { type: Type.STRING },
                        uncertain: { type: Type.BOOLEAN },
                      },
                      required: ["issue", "citation", "uncertain"],
                    },
                  },
                  importantClauses: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        summary: { type: Type.STRING },
                        citation: { type: Type.STRING },
                      },
                      required: ["title", "summary", "citation"],
                    },
                  },
                },
                required: [
                  "partiesInvolved",
                  "importantDates",
                  "caseNumber",
                  "legalIssues",
                  "importantClauses",
                ],
              },
              riskAnalysis: {
                type: Type.OBJECT,
                properties: {
                  potentialRisks: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        severity: { type: Type.STRING, description: "High, Medium, or Low" },
                        description: { type: Type.STRING },
                        citation: { type: Type.STRING },
                        uncertain: { type: Type.BOOLEAN },
                      },
                      required: ["title", "severity", "description", "citation", "uncertain"],
                    },
                  },
                  contradictions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        description: { type: Type.STRING },
                        citation: { type: Type.STRING },
                      },
                      required: ["description", "citation"],
                    },
                  },
                  missingInformation: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        item: { type: Type.STRING },
                        impact: { type: Type.STRING },
                      },
                      required: ["item", "impact"],
                    },
                  },
                  unclearClauses: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        clause: { type: Type.STRING },
                        concern: { type: Type.STRING },
                        citation: { type: Type.STRING },
                      },
                      required: ["clause", "concern", "citation"],
                    },
                  },
                },
                required: [
                  "potentialRisks",
                  "contradictions",
                  "missingInformation",
                  "unclearClauses",
                ],
              },
              importantPoints: {
                type: Type.OBJECT,
                properties: {
                  keyObservations: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        point: { type: Type.STRING },
                        citation: { type: Type.STRING },
                      },
                      required: ["point", "citation"],
                    },
                  },
                  relevantFacts: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        fact: { type: Type.STRING },
                        citation: { type: Type.STRING },
                      },
                      required: ["fact", "citation"],
                    },
                  },
                  furtherReviewItems: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        item: { type: Type.STRING },
                        reason: { type: Type.STRING },
                        citation: { type: Type.STRING },
                      },
                      required: ["item", "reason", "citation"],
                    },
                  },
                },
                required: ["keyObservations", "relevantFacts", "furtherReviewItems"],
              },
            },
            required: [
              "documentSummary",
              "keyInformation",
              "riskAnalysis",
              "importantPoints",
            ],
          },
      });

      const rawJson = (response.text || "").trim();
      if (!rawJson) {
        throw new Error("Gemini returned an empty analysis response.");
      }
      const parsed = JSON.parse(rawJson);
      res.json({
        analysis: parsed,
        analyzedAt: new Date().toISOString(),
        modelUsed,
      });
    } catch (err) {
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  app.post("/api/ai/assistant", async (req, res) => {
    try {
      const { question, caseContext, documents, history } = req.body ?? {};
      if (!question || typeof question !== "string") {
        res.status(400).json({ error: "A question is required." });
        return;
      }

      const docsArray = Array.isArray(documents) ? documents : [];
      if (docsArray.length === 0) {
        res.status(400).json({
          error: "Please select at least one uploaded document to query.",
        });
        return;
      }

      const ai = getGeminiClient();
      const docContext = buildDocumentContextString(docsArray);

      const historyText = Array.isArray(history)
        ? history
            .slice(-8)
            .map(
              (m: { role: string; text: string }) =>
                `${m.role === "user" ? "Attorney" : "Lexora"}: ${m.text}`
            )
            .join("\n")
        : "";

      const systemInstruction = [
        "You are Lexora AI Legal Assistant, a grounded legal document Q&A assistant.",
        "CRITICAL CITATION & GROUNDING RULES:",
        "1. Base your answers primarily and strictly on the provided uploaded documents.",
        "2. Every factual statement drawn from an uploaded document MUST include an inline citation in the answer text formatted as [Document: <exact filename>, Page <N>] when page numbers are available, or [Document: <exact filename>, Page unavailable] when page numbers are not available.",
        "3. NEVER invent fake page numbers, fake clauses, or fake quotes. Each citation in the citations array must include a verbatim excerpt from the document text.",
        "4. If the uploaded documents do NOT contain enough information to answer the question, set insufficientEvidence: true and explicitly state in the answer that the available uploaded documents do not provide enough information to answer that question.",
        "5. Clearly distinguish between (a) uploaded_document citations and (b) legal_reference_unverified if you mention any general statutory/common-law principles—never present AI-mentioned laws or judgments as verified legal authorities.",
      ].join("\n");

      const prompt = [
        caseContext
          ? `CASE CONTEXT:\nTitle: ${caseContext.title}\nCase ID: ${caseContext.caseId}\nClient: ${caseContext.clientName}\nCategory: ${caseContext.category}\nDescription: ${caseContext.description}`
          : "",
        "",
        "UPLOADED SOURCE DOCUMENTS:",
        docContext.slice(0, 120000),
        "",
        historyText ? `CONVERSATION HISTORY:\n${historyText}\n` : "",
        `CURRENT ATTORNEY QUESTION:\n${question}`,
      ]
        .filter(Boolean)
        .join("\n");

      const { response } = await generateWithResilience(ai, prompt, {
        systemInstruction,
        thinkingLevel: ThinkingLevel.LOW,
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
              answer: {
                type: Type.STRING,
                description:
                  "Detailed, clear response using inline citations like [Document: File.pdf, Page 2].",
              },
              insufficientEvidence: {
                type: Type.BOOLEAN,
                description:
                  "True if the uploaded documents lack sufficient evidence to answer the question.",
              },
              citations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    sourceCategory: {
                      type: Type.STRING,
                      description:
                        "Either 'uploaded_document' or 'legal_reference_unverified'",
                    },
                    documentName: { type: Type.STRING },
                    pageNumber: {
                      type: Type.INTEGER,
                      description:
                        "Exact integer page number if available; omit or use 0 if unavailable.",
                    },
                    pageAvailable: { type: Type.BOOLEAN },
                    excerpt: {
                      type: Type.STRING,
                      description: "Exact verbatim supporting quote from the document.",
                    },
                    note: { type: Type.STRING },
                  },
                  required: [
                    "sourceCategory",
                    "documentName",
                    "pageAvailable",
                    "excerpt",
                    "note",
                  ],
                },
              },
              legalAuthoritiesNotice: {
                type: Type.STRING,
                description:
                  "Clarification distinguishing uploaded file evidence from any general legal principles mentioned, or empty string if none mentioned.",
              },
            },
            required: [
              "answer",
              "insufficientEvidence",
              "citations",
              "legalAuthoritiesNotice",
            ],
          },
      });

      const rawJson = (response.text || "").trim();
      if (!rawJson) {
        throw new Error("Gemini returned an empty assistant response.");
      }
      const parsed = JSON.parse(rawJson);
      res.json(parsed);
    } catch (err) {
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  app.post("/api/ai/case-summary", async (req, res) => {
    try {
      const { caseData, documents } = req.body ?? {};
      if (!caseData) {
        res.status(400).json({ error: "Case data is required." });
        return;
      }
      const docsArray = Array.isArray(documents) ? documents : [];
      const ai = getGeminiClient();
      const docContext =
        docsArray.length > 0
          ? buildDocumentContextString(docsArray)
          : "No documents have been uploaded to this case yet.";

      const { response } = await generateWithResilience(
        ai,
        [
          `Generate a concise executive legal case summary based ONLY on the case metadata and uploaded documents below.`,
          `Case Title: ${caseData.title} (${caseData.caseId})`,
          `Client: ${caseData.clientName} | Category: ${caseData.category} | Status: ${caseData.status}`,
          `Court: ${caseData.courtName || "Not specified"} | Filing Date: ${caseData.filingDate || "Not specified"} | Next Hearing: ${caseData.nextHearingDate || "Not specified"}`,
          `Case Description: ${caseData.description}`,
          "",
          `UPLOADED DOCUMENTS:\n${docContext.slice(0, 100000)}`,
        ].join("\n"),
        {
          systemInstruction:
            "Be accurate and concise. Never fabricate facts not in the case description or uploaded documents. Cite uploaded documents as [Document: Name, Page N] or [Document: Name, Page unavailable].",
          thinkingLevel: ThinkingLevel.LOW,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overview: { type: Type.STRING },
              keyFindings: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              recommendedNextSteps: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ["overview", "keyFindings", "recommendedNextSteps"],
          },
        }
      );

      const rawJson = (response.text || "").trim();
      if (!rawJson) {
        throw new Error("Empty case summary returned by Gemini.");
      }
      res.json({
        summary: JSON.parse(rawJson),
        generatedAt: new Date().toISOString(),
      });
    } catch (err) {
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Lexora server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
