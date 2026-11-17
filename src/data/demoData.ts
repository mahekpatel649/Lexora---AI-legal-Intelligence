import { WorkspaceState } from "../types";

export const INITIAL_WORKSPACE_STATE: WorkspaceState = {
  userProfile: {
    name: "Elena Vance, Esq.",
    role: "Senior Litigation Counsel",
    firmName: "Vance & Sterling LLP",
    email: "e.vance@vancesterling.demo",
  },
  aiProcessingConsent: false,
  cases: [
    {
      id: "case-1",
      caseId: "LEX-2026-104",
      title: "Vanguard Logistics v. Apex Cloud Systems",
      clientName: "Vanguard Logistics Corp.",
      category: "Contract Disputes",
      description:
        "Commercial breach of Master Services Agreement involving repeated enterprise telemetry platform outages exceeding the 99.95% SLA commitment during Q2–Q3 2026, resulting in supply-chain dispatch delays and disputed service credits.",
      courtName: "U.S. District Court, Northern District of California",
      filingDate: "2026-09-14",
      nextHearingDate: "2026-12-08",
      status: "Active",
      lastUpdated: "2026-11-15",
      aiSummary: {
        overview:
          "Vanguard Logistics alleges material SLA breaches by Apex Cloud Systems under the May 1, 2025 Master Services Agreement. Apex disputes consequential damage claims citing a 12-month fee liability cap in Section 9.2.",
        keyFindings: [
          "Section 4.1 guarantees 99.95% monthly uptime, yet Q3 2026 logs show 98.42% availability [Document: Master_Services_Agreement_2025.pdf, Page 2].",
          "Apex issued a cure objection on October 12, 2026 claiming force majeure due to a regional fiber cut [Document: Breach_Notice_and_SLA_Audit.pdf, Page 2].",
        ],
        recommendedNextSteps: [
          "Verify whether the carrier outage qualifies under Section 11 Force Majeure exclusions.",
          "Calculate direct service credits vs. capped damages under Section 9.2.",
        ],
        generatedAt: "2026-11-15T14:20:00.000Z",
      },
    },
    {
      id: "case-2",
      caseId: "LEX-2026-118",
      title: "Helios Biotech Patent Licensing Review",
      clientName: "Helios Biopharma Inc.",
      category: "Intellectual Property",
      description:
        "Pre-execution review of an exclusive field-of-use patent license covering CRISPR lipid nanoparticle delivery formulations across North America and the European Union.",
      courtName: "Pre-Litigation Advisory",
      filingDate: "2026-10-03",
      nextHearingDate: "2026-11-29",
      status: "Active",
      lastUpdated: "2026-11-16",
    },
    {
      id: "case-3",
      caseId: "LEX-2026-089",
      title: "Meridian Manufacturing Executive Separation",
      clientName: "Meridian Precision Manufacturing",
      category: "Employment",
      description:
        "Negotiation and enforceability audit of a severance, non-solicitation, and IP assignment agreement for departing VP of Operations.",
      courtName: "Delaware Court of Chancery (Advisory)",
      filingDate: "2026-08-21",
      nextHearingDate: "2026-12-18",
      status: "Pending",
      lastUpdated: "2026-11-12",
    },
    {
      id: "case-4",
      caseId: "LEX-2026-072",
      title: "Northstar Capital Asset Acquisition",
      clientName: "Northstar Industrial Partners",
      category: "Corporate",
      description:
        "Closed due diligence review of mutual non-disclosure obligations and environmental indemnity carve-outs for a $42M regional logistics fleet acquisition.",
      courtName: "Private M&A Transaction",
      filingDate: "2026-06-10",
      status: "Closed",
      lastUpdated: "2026-10-28",
    },
  ],
  documents: [
    {
      id: "doc-1",
      name: "Master_Services_Agreement_2025.pdf",
      fileType: "PDF",
      fileSize: 284160,
      caseId: "case-1",
      uploadDate: "2026-11-10",
      analysisStatus: "Analyzed",
      analyzedAt: "2026-11-10T10:15:00.000Z",
      pageCount: 3,
      hasPageNumbers: true,
      wordCount: 318,
      pages: [
        {
          pageNumber: 1,
          text:
            "MASTER SERVICES AGREEMENT\nEffective Date: May 1, 2025\nParties: Vanguard Logistics Corp. ('Customer'), a Delaware corporation, and Apex Cloud Systems Inc. ('Provider'), a California corporation.\n\nSECTION 1. SCOPE OF SERVICES\nProvider shall deliver enterprise fleet telemetry hosting, API ingestion, and real-time dispatch routing software on a 24/7 basis.\n\nSECTION 2. TERM AND FEES\nInitial Term is thirty-six (36) months commencing May 1, 2025. Annual subscription fee is $480,000 payable quarterly in advance within thirty (30) days of invoice.",
        },
        {
          pageNumber: 2,
          text:
            "SECTION 4. SERVICE LEVEL AGREEMENT (SLA)\n4.1 Uptime Commitment. Provider guarantees Monthly Uptime Percentage of at least 99.95%, excluding Scheduled Maintenance announced 72 hours in advance.\n4.2 Service Credits. If uptime falls between 99.0% and 99.94%, Customer receives a 10% monthly fee credit. If uptime falls below 99.0%, Customer receives a 25% monthly fee credit.\n4.3 Chronic Failure Termination. Three (3) consecutive months below 99.0% uptime entitle Customer to terminate for cause upon 15 days written notice without early termination penalty.",
        },
        {
          pageNumber: 3,
          text:
            "SECTION 9. LIMITATION OF LIABILITY\n9.1 Exclusion of Consequential Damages. Neither party shall be liable for indirect, incidental, special, or consequential damages, including lost profits.\n9.2 Liability Cap. Provider's aggregate cumulative liability arising out of this Agreement shall not exceed total fees paid by Customer in the twelve (12) months preceding the claim ($480,000), except for breaches of Section 7 (Confidentiality) or gross negligence.\n\nSECTION 11. FORCE MAJEURE\nNeither party is liable for delays caused by acts of God, war, or regional utility failures beyond reasonable control, provided Provider maintains commercially reasonable multi-region failover.",
        },
      ],
      fullText:
        "[Page 1]\nMASTER SERVICES AGREEMENT\nEffective Date: May 1, 2025\nParties: Vanguard Logistics Corp. ('Customer') and Apex Cloud Systems Inc. ('Provider')...\n[Page 2]\nSECTION 4. SERVICE LEVEL AGREEMENT (SLA)...\n[Page 3]\nSECTION 9. LIMITATION OF LIABILITY...",
      analysis: {
        documentSummary: {
          overview:
            "A 36-month Master Services Agreement executed on May 1, 2025 between Vanguard Logistics Corp. and Apex Cloud Systems Inc. governing enterprise fleet telemetry software, SLA uptime remedies, and liability limitations.",
          mainPurpose:
            "Establish commercial pricing, 99.95% uptime commitments, chronic failure termination rights, and mutual liability caps.",
          importantFacts: [
            {
              fact: "Annual subscription fee is $480,000 billed quarterly over a 36-month term starting May 1, 2025.",
              citation: "[Document: Master_Services_Agreement_2025.pdf, Page 1]",
              uncertain: false,
            },
            {
              fact: "Customer may terminate for cause without penalty if uptime drops below 99.0% for three consecutive months.",
              citation: "[Document: Master_Services_Agreement_2025.pdf, Page 2]",
              uncertain: false,
            },
            {
              fact: "Aggregate liability is capped at prior 12 months' fees ($480,000), carving out confidentiality breaches and gross negligence.",
              citation: "[Document: Master_Services_Agreement_2025.pdf, Page 3]",
              uncertain: false,
            },
          ],
        },
        keyInformation: {
          partiesInvolved: [
            {
              name: "Vanguard Logistics Corp.",
              role: "Customer (Delaware corporation)",
              citation: "[Document: Master_Services_Agreement_2025.pdf, Page 1]",
            },
            {
              name: "Apex Cloud Systems Inc.",
              role: "Provider (California corporation)",
              citation: "[Document: Master_Services_Agreement_2025.pdf, Page 1]",
            },
          ],
          importantDates: [
            {
              date: "May 1, 2025",
              significance: "Effective Date and start of 36-month Initial Term",
              citation: "[Document: Master_Services_Agreement_2025.pdf, Page 1]",
            },
            {
              date: "72 hours prior",
              significance: "Advance notice window required for Scheduled Maintenance",
              citation: "[Document: Master_Services_Agreement_2025.pdf, Page 2]",
            },
            {
              date: "15 days written notice",
              significance: "Notice period for chronic failure termination",
              citation: "[Document: Master_Services_Agreement_2025.pdf, Page 2]",
            },
          ],
          caseNumber: "Not specified in document",
          legalIssues: [
            {
              issue:
                "Whether Provider's failure to maintain multi-region failover negates the Force Majeure defense in Section 11.",
              citation: "[Document: Master_Services_Agreement_2025.pdf, Page 3]",
              uncertain: false,
            },
            {
              issue:
                "Whether consequential damages exclusion in Section 9.1 bars Vanguard's supply-chain delay claims absent gross negligence.",
              citation: "[Document: Master_Services_Agreement_2025.pdf, Page 3]",
              uncertain: true,
            },
          ],
          importantClauses: [
            {
              title: "Section 4.1–4.3 (SLA & Termination)",
              summary: "99.95% uptime guarantee, 10%/25% credit tiers, and 3-month chronic failure exit.",
              citation: "[Document: Master_Services_Agreement_2025.pdf, Page 2]",
            },
            {
              title: "Section 9.2 (Liability Cap & Carve-outs)",
              summary: "12-month fee cap ($480,000) excluding confidentiality and gross negligence.",
              citation: "[Document: Master_Services_Agreement_2025.pdf, Page 3]",
            },
          ],
        },
        riskAnalysis: {
          potentialRisks: [
            {
              title: "Broad Consequential Damages Waiver",
              severity: "High",
              description:
                "Section 9.1 excludes lost profits and consequential damages, potentially limiting recovery for downstream freight delays unless gross negligence is proven.",
              citation: "[Document: Master_Services_Agreement_2025.pdf, Page 3]",
              uncertain: false,
            },
            {
              title: "Ambiguous 'Commercially Reasonable Failover' Standard",
              severity: "Medium",
              description:
                "Section 11 conditions Force Majeure on 'commercially reasonable multi-region failover' without defining RTO/RPO benchmarks.",
              citation: "[Document: Master_Services_Agreement_2025.pdf, Page 3]",
              uncertain: false,
            },
          ],
          contradictions: [
            {
              description:
                "Section 4.2 caps SLA remedies at 25% monthly fee credits, while Section 9.2 permits claims up to 12 months of fees—interaction between exclusive-remedy silence and the cap is unaddressed.",
              citation: "[Document: Master_Services_Agreement_2025.pdf, Page 2]",
            },
          ],
          missingInformation: [
            {
              item: "Governing law and venue clause",
              impact: "The provided pages omit jurisdiction and dispute resolution forum provisions.",
            },
            {
              item: "Definition of gross negligence or willful misconduct",
              impact: "Needed to evaluate the Section 9.2 liability cap carve-out.",
            },
          ],
          unclearClauses: [
            {
              clause: "Section 11 (Force Majeure)",
              concern: "Does not specify whether single-carrier fiber cuts qualify as 'regional utility failures'.",
              citation: "[Document: Master_Services_Agreement_2025.pdf, Page 3]",
            },
          ],
        },
        importantPoints: {
          keyObservations: [
            {
              point: "Chronic failure termination does not require proving gross negligence—only 3 consecutive months below 99.0%.",
              citation: "[Document: Master_Services_Agreement_2025.pdf, Page 2]",
            },
          ],
          relevantFacts: [
            {
              fact: "Quarterly advance payments equal $120,000 per quarter.",
              citation: "[Document: Master_Services_Agreement_2025.pdf, Page 1]",
            },
          ],
          furtherReviewItems: [
            {
              item: "Obtain full agreement schedules and governing law section",
              reason: "Verify exclusive-remedy wording and venue in NDCA.",
              citation: "[Document: Master_Services_Agreement_2025.pdf, Page 2]",
            },
          ],
        },
      },
    },
    {
      id: "doc-2",
      name: "Breach_Notice_and_SLA_Audit.pdf",
      fileType: "PDF",
      fileSize: 192400,
      caseId: "case-1",
      uploadDate: "2026-11-12",
      analysisStatus: "Analyzed",
      analyzedAt: "2026-11-12T16:40:00.000Z",
      pageCount: 2,
      hasPageNumbers: true,
      wordCount: 215,
      pages: [
        {
          pageNumber: 1,
          text:
            "NOTICE OF MATERIAL BREACH AND DEMAND FOR CURE\nCase Ref: LEX-2026-104 | Date: October 2, 2026\nTo: General Counsel, Apex Cloud Systems Inc.\nFrom: Vanguard Logistics Corp.\n\nPursuant to Section 4.3 of the Master Services Agreement dated May 1, 2025, Vanguard Logistics hereby notifies Apex Cloud Systems of chronic SLA failures during July, August, and September 2026:\n- July 2026 Uptime: 98.71% (Downtime: 9 hours 36 minutes)\n- August 2026 Uptime: 98.54% (Downtime: 10 hours 52 minutes)\n- September 2026 Uptime: 98.01% (Downtime: 14 hours 20 minutes)",
        },
        {
          pageNumber: 2,
          text:
            "APEX RESPONSE SUMMARY (OCTOBER 12, 2026)\nApex Cloud Systems acknowledges the downtime figures in July–September 2026, but asserts that the September 18 outage (11 hours) resulted from a third-party regional fiber cut in Oregon and invokes Section 11 Force Majeure. Vanguard's forensic telemetry audit dated October 28, 2026 indicates Apex's secondary US-East failover cluster failed to activate due to an expired TLS certificate rather than fiber unavailability. Vanguard seeks $310,000 in direct expediting costs and refund of prepaid Q4 fees ($120,000).",
        },
      ],
      fullText:
        "[Page 1]\nNOTICE OF MATERIAL BREACH AND DEMAND FOR CURE...\n[Page 2]\nAPEX RESPONSE SUMMARY (OCTOBER 12, 2026)...",
      analysis: {
        documentSummary: {
          overview:
            "Formal breach notice from Vanguard Logistics citing three consecutive months below 99.0% uptime in Q3 2026, paired with Apex's October 12 Force Majeure objection and Vanguard's forensic audit rebuttal.",
          mainPurpose:
            "Document SLA breach metrics, preserve Section 4.3 termination rights, and rebut Apex's Force Majeure defense.",
          importantFacts: [
            {
              fact: "Uptime fell below 99.0% in July (98.71%), August (98.54%), and September (98.01%) 2026.",
              citation: "[Document: Breach_Notice_and_SLA_Audit.pdf, Page 1]",
              uncertain: false,
            },
            {
              fact: "Forensic audit attributes September 18 failover failure to an expired TLS certificate on the US-East cluster.",
              citation: "[Document: Breach_Notice_and_SLA_Audit.pdf, Page 2]",
              uncertain: false,
            },
          ],
        },
        keyInformation: {
          partiesInvolved: [
            {
              name: "Vanguard Logistics Corp.",
              role: "Claimant / Notifying Party",
              citation: "[Document: Breach_Notice_and_SLA_Audit.pdf, Page 1]",
            },
            {
              name: "Apex Cloud Systems Inc.",
              role: "Respondent / Provider",
              citation: "[Document: Breach_Notice_and_SLA_Audit.pdf, Page 1]",
            },
          ],
          importantDates: [
            {
              date: "October 2, 2026",
              significance: "Date of Notice of Material Breach",
              citation: "[Document: Breach_Notice_and_SLA_Audit.pdf, Page 1]",
            },
            {
              date: "October 12, 2026",
              significance: "Apex response invoking Force Majeure",
              citation: "[Document: Breach_Notice_and_SLA_Audit.pdf, Page 2]",
            },
            {
              date: "October 28, 2026",
              significance: "Vanguard forensic telemetry audit completed",
              citation: "[Document: Breach_Notice_and_SLA_Audit.pdf, Page 2]",
            },
          ],
          caseNumber: "LEX-2026-104",
          legalIssues: [
            {
              issue: "Whether an expired TLS certificate defeats Apex's Force Majeure defense under Section 11.",
              citation: "[Document: Breach_Notice_and_SLA_Audit.pdf, Page 2]",
              uncertain: false,
            },
          ],
          importantClauses: [
            {
              title: "Section 4.3 Chronic Failure Trigger",
              summary: "Invoked based on three consecutive months below 99.0% uptime.",
              citation: "[Document: Breach_Notice_and_SLA_Audit.pdf, Page 1]",
            },
          ],
        },
        riskAnalysis: {
          potentialRisks: [
            {
              title: "Classification of $310,000 Expediting Costs",
              severity: "High",
              description:
                "Apex may argue freight expediting costs constitute excluded consequential damages under MSA Section 9.1.",
              citation: "[Document: Breach_Notice_and_SLA_Audit.pdf, Page 2]",
              uncertain: true,
            },
          ],
          contradictions: [],
          missingInformation: [
            {
              item: "Raw forensic audit log attachments",
              impact: "Only a summary of the October 28 audit is included in this notice.",
            },
          ],
          unclearClauses: [],
        },
        importantPoints: {
          keyObservations: [
            {
              point: "Even excluding September, July and August alone show repeated SLA failures prior to the Oregon fiber cut.",
              citation: "[Document: Breach_Notice_and_SLA_Audit.pdf, Page 1]",
            },
          ],
          relevantFacts: [
            {
              fact: "Vanguard demands $310,000 in expediting costs plus $120,000 Q4 fee refund.",
              citation: "[Document: Breach_Notice_and_SLA_Audit.pdf, Page 2]",
            },
          ],
          furtherReviewItems: [
            {
              item: "Subpoena Apex certificate management logs",
              reason: "Corroborate forensic finding of expired TLS certificate and evaluate gross negligence.",
              citation: "[Document: Breach_Notice_and_SLA_Audit.pdf, Page 2]",
            },
          ],
        },
      },
    },
    {
      id: "doc-3",
      name: "Helios_Patent_License_Draft.docx",
      fileType: "DOCX",
      fileSize: 148900,
      caseId: "case-2",
      uploadDate: "2026-11-14",
      analysisStatus: "Pending Analysis",
      pageCount: 1,
      hasPageNumbers: false,
      wordCount: 210,
      pages: [
        {
          pageNumber: 1,
          text:
            "PATENT LICENSE AGREEMENT (DRAFT REV 3)\nLicensor: BioMatrix Research Foundation\nLicensee: Helios Biopharma Inc.\n\n1. GRANT OF LICENSE\nLicensor grants Licensee an exclusive, royalty-bearing license under U.S. Patent No. 11,482,910 ('Licensed Patents') within the Field of Oncology Therapeutics in North America and the EU. Licensor retains non-commercial academic research rights.\n\n2. MILESTONES AND ROYALTIES\nLicensee shall pay an upfront fee of $1,500,000 within 10 business days of execution, $3,000,000 upon Phase II clinical initiation, and a 4.5% running royalty on Net Sales. Minimum annual royalty of $250,000 begins in Year 3 regardless of regulatory approval status.\n\n3. PATENT PROSECUTION AND INFRINGEMENT\nLicensor controls patent prosecution at Licensee's expense. Neither party's indemnification obligations are capped, and Licensor disclaims all warranties of patent validity or non-infringement of third-party IP.\n\n4. TERMINATION\nLicensor may terminate immediately upon 10 days notice if Licensee challenges the validity of any Licensed Patent or fails to meet commercial diligence milestones by December 31, 2027.",
        },
      ],
      fullText:
        "PATENT LICENSE AGREEMENT (DRAFT REV 3)\nLicensor: BioMatrix Research Foundation\nLicensee: Helios Biopharma Inc.\n\n1. GRANT OF LICENSE\nLicensor grants Licensee an exclusive, royalty-bearing license under U.S. Patent No. 11,482,910 ('Licensed Patents') within the Field of Oncology Therapeutics in North America and the EU. Licensor retains non-commercial academic research rights.\n\n2. MILESTONES AND ROYALTIES\nLicensee shall pay an upfront fee of $1,500,000 within 10 business days of execution, $3,000,000 upon Phase II clinical initiation, and a 4.5% running royalty on Net Sales. Minimum annual royalty of $250,000 begins in Year 3 regardless of regulatory approval status.\n\n3. PATENT PROSECUTION AND INFRINGEMENT\nLicensor controls patent prosecution at Licensee's expense. Neither party's indemnification obligations are capped, and Licensor disclaims all warranties of patent validity or non-infringement of third-party IP.\n\n4. TERMINATION\nLicensor may terminate immediately upon 10 days notice if Licensee challenges the validity of any Licensed Patent or fails to meet commercial diligence milestones by December 31, 2027.",
    },
    {
      id: "doc-4",
      name: "Executive_Separation_Agreement.pdf",
      fileType: "PDF",
      fileSize: 164200,
      caseId: "case-3",
      uploadDate: "2026-11-11",
      analysisStatus: "Analyzed",
      analyzedAt: "2026-11-11T09:30:00.000Z",
      pageCount: 2,
      hasPageNumbers: true,
      wordCount: 185,
      pages: [
        {
          pageNumber: 1,
          text:
            "EXECUTIVE SEPARATION AND RELEASE AGREEMENT\nEmployer: Meridian Precision Manufacturing LLC\nExecutive: Marcus Thorne (VP of Operations)\nSeparation Date: November 30, 2026\n\n1. SEVERANCE PACKAGE\nSubject to timely execution and non-revocation within the 21-day consideration period and 7-day OWBPA revocation window, Employer will pay 9 months base salary ($247,500) in bi-weekly installments and COBRA subsidy for 9 months.",
        },
        {
          pageNumber: 2,
          text:
            "2. RESTRICTIVE COVENANTS\nExecutive agrees to an 18-month worldwide non-solicitation of customers and employees. Section 2.2 includes a 24-month nationwide non-competition restriction covering any precision aerospace or medical machining enterprise.\n3. GENERAL RELEASE\nExecutive releases all waivable employment claims under Title VII, ADEA, and state law, excluding vested 401(k) benefits and statutory workers' compensation.",
        },
      ],
      fullText:
        "[Page 1]\nEXECUTIVE SEPARATION AND RELEASE AGREEMENT...\n[Page 2]\n2. RESTRICTIVE COVENANTS...",
      analysis: {
        documentSummary: {
          overview:
            "Executive separation agreement for VP of Operations Marcus Thorne offering $247,500 in severance over 9 months in exchange for an ADEA/Title VII release and broad restrictive covenants.",
          mainPurpose:
            "Finalize executive departure terms, statutory release waivers, and post-employment non-compete/non-solicitation covenants.",
          importantFacts: [
            {
              fact: "Separation Date is November 30, 2026 with $247,500 severance over 9 months.",
              citation: "[Document: Executive_Separation_Agreement.pdf, Page 1]",
              uncertain: false,
            },
            {
              fact: "Includes 21-day consideration period and 7-day OWBPA revocation period.",
              citation: "[Document: Executive_Separation_Agreement.pdf, Page 1]",
              uncertain: false,
            },
          ],
        },
        keyInformation: {
          partiesInvolved: [
            {
              name: "Meridian Precision Manufacturing LLC",
              role: "Employer",
              citation: "[Document: Executive_Separation_Agreement.pdf, Page 1]",
            },
            {
              name: "Marcus Thorne",
              role: "Departing VP of Operations",
              citation: "[Document: Executive_Separation_Agreement.pdf, Page 1]",
            },
          ],
          importantDates: [
            {
              date: "November 30, 2026",
              significance: "Executive Separation Date",
              citation: "[Document: Executive_Separation_Agreement.pdf, Page 1]",
            },
            {
              date: "21 days / 7 days",
              significance: "Consideration and OWBPA revocation windows",
              citation: "[Document: Executive_Separation_Agreement.pdf, Page 1]",
            },
          ],
          caseNumber: "Not specified in document",
          legalIssues: [
            {
              issue: "Enforceability of 24-month nationwide non-compete and 18-month worldwide non-solicitation.",
              citation: "[Document: Executive_Separation_Agreement.pdf, Page 2]",
              uncertain: true,
            },
          ],
          importantClauses: [
            {
              title: "Section 2.2 (24-Month Nationwide Non-Compete)",
              summary: "Restricts employment across precision aerospace or medical machining nationwide.",
              citation: "[Document: Executive_Separation_Agreement.pdf, Page 2]",
            },
          ],
        },
        riskAnalysis: {
          potentialRisks: [
            {
              title: "Overbroad Geographic and Duration Non-Compete",
              severity: "High",
              description:
                "A 24-month nationwide non-compete paired with 18-month worldwide non-solicitation exceeds standard blue-pencil thresholds in several states.",
              citation: "[Document: Executive_Separation_Agreement.pdf, Page 2]",
              uncertain: false,
            },
          ],
          contradictions: [],
          missingInformation: [
            {
              item: "Governing state law and Executive's state of residence",
              impact: "Determines non-compete enforceability.",
            },
          ],
          unclearClauses: [],
        },
        importantPoints: {
          keyObservations: [
            {
              point: "OWBPA 21-day / 7-day periods are properly referenced for ADEA release validity.",
              citation: "[Document: Executive_Separation_Agreement.pdf, Page 1]",
            },
          ],
          relevantFacts: [
            {
              fact: "Vested 401(k) and workers' compensation claims are carved out from the release.",
              citation: "[Document: Executive_Separation_Agreement.pdf, Page 2]",
            },
          ],
          furtherReviewItems: [
            {
              item: "Narrow Section 2.2 geographic scope to active Meridian customer territories",
              reason: "Improve enforceability under Delaware/state scrutiny.",
              citation: "[Document: Executive_Separation_Agreement.pdf, Page 2]",
            },
          ],
        },
      },
    },
    {
      id: "doc-5",
      name: "NDA_Mutual_Disclosure.txt",
      fileType: "TXT",
      fileSize: 2840,
      caseId: "case-4",
      uploadDate: "2026-10-15",
      analysisStatus: "Pending Analysis",
      pageCount: 1,
      hasPageNumbers: false,
      wordCount: 142,
      pages: [
        {
          pageNumber: 1,
          text:
            "MUTUAL NON-DISCLOSURE AGREEMENT\nDate: June 10, 2026\nParties: Northstar Industrial Partners LLC and Cascade Fleet Holdings Inc.\n\n1. CONFIDENTIAL INFORMATION\nIncludes all financial statements, customer routing tables, and fleet maintenance logs shared in connection with the proposed acquisition. Survival period is three (3) years from disclosure, or indefinitely for trade secrets.\n\n2. PERMITTED DISCLOSURES\nReceiving Party may disclose Confidential Information to legal, tax, and financial advisors bound by professional or written confidentiality duties, or as compelled by court order upon prompt prior written notice.\n\n3. RETURN OR DESTRUCTION\nUpon written request, Receiving Party shall certify destruction within fifteen (15) business days, excluding automated backup archives.",
        },
      ],
      fullText:
        "MUTUAL NON-DISCLOSURE AGREEMENT\nDate: June 10, 2026\nParties: Northstar Industrial Partners LLC and Cascade Fleet Holdings Inc.\n\n1. CONFIDENTIAL INFORMATION\nIncludes all financial statements, customer routing tables, and fleet maintenance logs shared in connection with the proposed acquisition. Survival period is three (3) years from disclosure, or indefinitely for trade secrets.\n\n2. PERMITTED DISCLOSURES\nReceiving Party may disclose Confidential Information to legal, tax, and financial advisors bound by professional or written confidentiality duties, or as compelled by court order upon prompt prior written notice.\n\n3. RETURN OR DESTRUCTION\nUpon written request, Receiving Party shall certify destruction within fifteen (15) business days, excluding automated backup archives.",
    },
  ],
  deadlines: [
    {
      id: "dl-1",
      caseId: "case-1",
      title: "File Rule 26(f) Joint Case Management Statement",
      dueDate: "2026-11-24",
      priority: "High",
      completed: false,
    },
    {
      id: "dl-2",
      caseId: "case-2",
      title: "Deliver Redlined License Agreement to Helios Board",
      dueDate: "2026-11-21",
      priority: "High",
      completed: false,
    },
    {
      id: "dl-3",
      caseId: "case-3",
      title: "Confirm Executive Separation Consideration Deadline",
      dueDate: "2026-11-30",
      priority: "Medium",
      completed: false,
    },
    {
      id: "dl-4",
      caseId: "case-1",
      title: "Initial Case Management Conference (NDCA)",
      dueDate: "2026-12-08",
      priority: "Medium",
      completed: false,
    },
  ],
  threads: {},
  notifications: [
    {
      id: "notif-1",
      title: "High-priority deadline approaching",
      detail: "Deliver Redlined License Agreement to Helios Board is due Nov 21, 2026.",
      timestamp: "2026-11-17T08:00:00.000Z",
      read: false,
      targetSection: "cases",
      targetId: "case-2",
    },
    {
      id: "notif-2",
      title: "Document ready for AI review",
      detail: "Helios_Patent_License_Draft.docx has been uploaded and awaits analysis.",
      timestamp: "2026-11-16T17:30:00.000Z",
      read: false,
      targetSection: "documents",
      targetId: "doc-3",
    },
    {
      id: "notif-3",
      title: "SLA Audit analysis complete",
      detail: "Breach_Notice_and_SLA_Audit.pdf structured risk report is ready.",
      timestamp: "2026-11-12T16:40:00.000Z",
      read: true,
      targetSection: "documents",
      targetId: "doc-2",
    },
  ],
};
