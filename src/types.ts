export type LegalCategory =
  | "Civil"
  | "Criminal"
  | "Corporate"
  | "Intellectual Property"
  | "Employment"
  | "Contract Disputes"
  | "Family"
  | "Other";

export type CaseStatus = "Active" | "Pending" | "Closed";

export type DeadlinePriority = "High" | "Medium" | "Low";

export type DocumentFileType = "PDF" | "DOCX" | "TXT";

export type AnalysisStatus = "Analyzed" | "Pending Analysis" | "Error";

export type NavSection =
  | "dashboard"
  | "cases"
  | "documents"
  | "assistant"
  | "settings";

export interface DocumentPage {
  pageNumber: number;
  text: string;
}

export interface DocumentAnalysis {
  documentSummary: {
    overview: string;
    mainPurpose: string;
    importantFacts: Array<{
      fact: string;
      citation: string;
      uncertain: boolean;
    }>;
  };
  keyInformation: {
    partiesInvolved: Array<{
      name: string;
      role: string;
      citation: string;
    }>;
    importantDates: Array<{
      date: string;
      significance: string;
      citation: string;
    }>;
    caseNumber: string;
    legalIssues: Array<{
      issue: string;
      citation: string;
      uncertain: boolean;
    }>;
    importantClauses: Array<{
      title: string;
      summary: string;
      citation: string;
    }>;
  };
  riskAnalysis: {
    potentialRisks: Array<{
      title: string;
      severity: string;
      description: string;
      citation: string;
      uncertain: boolean;
    }>;
    contradictions: Array<{
      description: string;
      citation: string;
    }>;
    missingInformation: Array<{
      item: string;
      impact: string;
    }>;
    unclearClauses: Array<{
      clause: string;
      concern: string;
      citation: string;
    }>;
  };
  importantPoints: {
    keyObservations: Array<{
      point: string;
      citation: string;
    }>;
    relevantFacts: Array<{
      fact: string;
      citation: string;
    }>;
    furtherReviewItems: Array<{
      item: string;
      reason: string;
      citation: string;
    }>;
  };
}

export interface LegalDocument {
  id: string;
  name: string;
  fileType: DocumentFileType;
  fileSize: number;
  caseId: string;
  uploadDate: string;
  analysisStatus: AnalysisStatus;
  analysisError?: string;
  analyzedAt?: string;
  pageCount: number;
  hasPageNumbers: boolean;
  wordCount: number;
  pages: DocumentPage[];
  fullText: string;
  analysis?: DocumentAnalysis;
}

export interface CaseDeadline {
  id: string;
  caseId: string;
  title: string;
  dueDate: string;
  priority: DeadlinePriority;
  completed: boolean;
}

export interface CaseAISummary {
  overview: string;
  keyFindings: string[];
  recommendedNextSteps: string[];
  generatedAt: string;
}

export interface LegalCase {
  id: string;
  caseId: string;
  title: string;
  clientName: string;
  category: LegalCategory;
  description: string;
  courtName?: string;
  filingDate?: string;
  nextHearingDate?: string;
  status: CaseStatus;
  lastUpdated: string;
  aiSummary?: CaseAISummary;
}

export interface Citation {
  sourceCategory: "uploaded_document" | "legal_reference_unverified";
  documentName: string;
  pageNumber: number | null;
  pageAvailable: boolean;
  excerpt: string;
  note: string;
}

export interface AssistantMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  insufficientEvidence?: boolean;
  citations?: Citation[];
  legalAuthoritiesNotice?: string;
  error?: string;
}

export interface AssistantThread {
  caseId: string;
  documentScope: string; // "all" or document id
  messages: AssistantMessage[];
}

export interface UserProfile {
  name: string;
  role: string;
  firmName: string;
  email: string;
}

export interface AppNotification {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  read: boolean;
  targetSection: NavSection;
  targetId?: string;
}

export interface WorkspaceState {
  cases: LegalCase[];
  documents: LegalDocument[];
  deadlines: CaseDeadline[];
  threads: Record<string, AssistantThread>;
  userProfile: UserProfile;
  aiProcessingConsent: boolean;
  notifications: AppNotification[];
}
