**CODER\_INSTRUCTIONS.md**

* **Product Name:** RecruitOS (Recruitment Agency & Executive Search Operating System)   
* **Target Audience:** AI Coding Agents, Full-Stack Developers, Engineering Leads (Divyanshu Kumar)   
* **Document Purpose:** Operational execution protocol, scope boundaries, feature sequence gates, and implementation rules for implementing the approved **RecruitOS PRD (V2.0)**.   
* **Governing Rule:** The coding agent must implement one feature at a time, verify it against business workflows, provide a manual test plan, and **STOP** to wait for explicit user approval before proceeding. 

**1\. SOURCE OF TRUTH & PRECEDENCE HIERARCHY**

The coding agent must strictly resolve conflicts and base implementation decisions on the following hierarchy: 

┌─────────────────────────────────────────────────────────────────────────┐  
│ 1\. APPROVED PRD (RecruitOS V2.0) — Primary Source of Truth              │  
├─────────────────────────────────────────────────────────────────────────┤  
│ 2\. APPROVED BUSINESS WORKFLOWS & BUSINESS RULES IN PRD — Mandatory      │  
├─────────────────────────────────────────────────────────────────────────┤  
│ 3\. EXISTING CODEBASE — Truth for Architecture, Patterns & Conventions   │  
├─────────────────────────────────────────────────────────────────────────┤  
│ 4\. CODER\_INSTRUCTIONS.md — Operating Protocol for Coding Agent          │  
├─────────────────────────────────────────────────────────────────────────┤  
│ 5\. GENERAL AI ASSUMPTIONS / BEST PRACTICES — Lowest Priority            │  
└─────────────────────────────────────────────────────────────────────────┘  
**Inviolable Rules:**

1. **No Silent Reinterpretation:** The coding agent must never alter, reinterpret, or omit a requirement defined in the PRD.   
2. **Conflict Halt:** If the existing codebase and the PRD conflict, the agent must **STOP**, explain the conflict to the user, and ask for guidance before writing code.   
3. **No PRD Modification:** The coding agent must not modify the PRD to make an implementation easier or bypass technical friction.   
4. **No Legacy Product Carryover:** Do not import concepts, terminology, schemas, or assumptions from real estate or property brokerage applications (e.g., properties, units, towers, site visits, key vaults, channel partners). Use only RecruitOS recruitment and staffing entities. 

**2\. PLAIN-ENGLISH RECRUITOS BUSINESS CONTEXT**

**What RecruitOS Is**

RecruitOS is a multi-tenant operational intelligence and execution platform for recruitment agencies, search firms, and staffing consultancies. 

**The Business Problem It Solves**

Recruitment agencies leak revenue and suffer operational chaos because client and candidate lifecycles are fragmented across unmaintained spreadsheets, personal WhatsApp chats, and disconnected email threads: 

* Fresh client mandates sit idle without rapid sourcing assignment or SLA tracking.   
* Candidate resumes are duplicated across recruiters or submitted simultaneously by multiple external partner sourcers.   
* Client hiring managers delay reviewing candidate shortlists due to high-friction email attachments and portal logins.   
* Interview scheduling gets stuck in back-and-forth calendar ping-pong, resulting in candidate drop-offs and interview no-shows.   
* Offered candidates drop out during long 30/60/90-day notice periods due to unmonitored counter-offers.   
* Candidates leave during the 90-day probation guarantee period, triggering disputes over credit notes and partner split-fee payouts. 

**Who Uses RecruitOS**

* **Super Admin (Platform Owner — Ankur):** Provisions agency tenant accounts, enforces subscription tiers, assigns user seat caps, and monitors multi-tenant system health.   
* **Agency Owner / Managing Director (Tenant Admin):** Monitors the operational Cockpit, approves client accounts and commercial fee terms, authorizes partner split-fee settlements, and manages financial exceptions (Credit Notes/Refunds).   
* **Team Lead / Account Manager:** Converts inbound hiring requests into active mandates, assigns recruiters, monitors pipeline stage aging SLAs, and handles escalated notice-period dropout risks.   
* **Recruiter (Desk Sourcer & Delivery Specialist):** Manages daily focus queues, executes unified WhatsApp/Email outreach, curates candidate shortlists, and resolves interview scheduling tasks.   
* **External Partner Sourcer (B2B Split Recruiter):** Submits external candidates into an isolated vault under strict first-touch duplicate arbitration rules.   
* **Client Hiring Manager (External Stakeholder):** Reviews sanitized shortlists and records 1-click decisions (Shortlist/Hold/Reject) via zero-login encrypted links.   
* **Candidate (External Stakeholder):** Confirms interview slots, receives automated prep kits, logs post-interview feedback, and responds to bi-weekly notice-period pulse checks via WhatsApp/mobile. 

**The Operational Lifecycle Map**

\[Client Hiring Mandate Inbound / Storefront\]  
       │  
       ▼ (Workflow 1: Mandate Conversion, Commercial Terms & Assignment)  
       │  
       ▼ (Workflow 2: Candidate Ingestion, CV Parsing & 200ms Deduplication)  
       │  
       ▼ (Workflow 3: Daily Recruiter Cockpit & SLA Aging Radar)  
       │  
       ▼ (Workflow 4: Zero-Login Client Presenter & Asynchronous Slot Coordination)  
       │  
       ▼ (Workflow 5: T-24h Interview Prep Kit, Debrief Survey & Outcome Gate)  
       │  
       ▼ (Workflow 6: Offer Audit, 2-Tier Notice Period Radar & Compliance Vault)  
       │  
       ▼ (Workflow 7: Day-1 Invoice Dispatch, 90-Day Probation Clock & Partner Ledger)  
**3\. SCOPE BOUNDARIES & SINGLE-PRD MANDATE**

The coding agent is strictly constrained to the features and workflows defined in **RecruitOS PRD**. 

**Explicitly In Scope (Current PRD):**

* Multi-tenant data isolation with agency\_id Row-Level Security (RLS) and JWT auth middleware.   
* Public agency storefront and self-serve client mandate intake wizard (AS-01, AS-02).   
* Multichannel job board broadcasting and anonymized partner network sharing (RC-08, PO-01).   
* Candidate ingestion via application portal, CV parsing engine, and isolated partner vault (AS-04, RC-02, PO-02).   
* 200ms First-Touch Duplicate Arbitrator and spousal/relational talent mapping (PO-03, RC-04).   
* Silver Medalist candidate recycling engine and public showcase gallery (RC-07, AS-03).   
* Recruiter Daily Focus Queue, SLA stagnation radar pills, and unified WhatsApp/Email timeline logging (RC-01, RC-03).   
* Zero-login encrypted candidate shortlist presenter and 1-click decision matrix (CF-01, CF-02).   
* Automated client chase cron sequence and asynchronous interview slot selection (CF-04, CF-03, CE-01).   
* Automated T-24h candidate prep kit trigger and post-interview debrief capture (CE-02, CE-03).   
* Mandatory stage-gate enforcement blocking unrecorded interview outcomes.   
* Offer CTC audit, placement fee calculation, and pre-drafted invoice staging (HC-02).   
* Bi-weekly notice-period counter-offer pulse checks with 2-tier escalation engine (RC-05, CE-04).   
* Pre-onboarding compliance document vault with signed URL security (HC-01, HC-03).   
* Day-1 joining confirmation, automated invoice dispatch, and 90-day probation milestone clock (RC-06, HC-04).   
* Early departure probation breach alerts, auto-opened $0 replacement mandate, and partner payout freeze.   
* Partner split-fee operational ledger with owner-only financial authorization (PO-04). 

**Explicitly Out of Scope (Prohibited for Current Implementation):**

* ❌ **Automated Payment Gateway Payouts:** No direct payment gateway integration for paying recruitment partners (Stripe Connect, RazorpayX). Operational ledger status tracking only.   
* ❌ **Automated Re-sourcing Task Generation on Client Rejections:** Client rejections update status, but must never auto-trigger candidate sourcing tasks without manual recruiter discretion.   
* ❌ **Unvetted Candidate Slot Selection Pollution:** Alternative interview time requests submitted by candidates must never post directly to the client portal; they route strictly to the Recruiter Cockpit as coordination tasks.   
* ❌ **Staff Attendance & GPS Shift Tracking:** Internal HR/attendance tracking is isolated to internal ops tools and must not be mixed into RecruitOS tenant workflows. 

**4\. WORKFLOW-FIRST IMPLEMENTATION PRINCIPLE**

Features must **never** be implemented as isolated UI screens or disconnected database tables. Every feature must be constructed to fulfill its exact link in the recruitment business chain: 

$$Business Event⟶User Action⟶System Action⟶Decision Gate⟶State Change⟶Next Actor⟶Business Outcome$$

A feature that renders clean UI or passes a unit test but breaks the handoff to the next actor (e.g., failing to trigger the 2-tier escalation alert when a candidate goes dark on a notice-period pulse check) is an **incorrect implementation**. 

**5\. FEATURE IMPLEMENTATION ORDER (MANDATORY SEQUENTIAL QUEUE)**

The coding agent must implement features strictly in the following sequence. No skipping ahead for technical convenience. 

┌──────────────────────────────────────────────────────────────────────────┐  
│ SPRINT 1: FOUNDATIONS, AUTH & MANDATE INGESTION                          │  
│ Feature 1: Multi-Tenant RLS Security & Super Admin Provisioning (Tier/Seats)│  
│ Feature 2: Public Agency Storefront & Client Mandate Intake (AS-01, AS-02) │  
│ Feature 3: Owner Verification, Client Onboarding & SLA Setup (AS-02, RC-03)│  
│ Feature 4: Multichannel Job Broadcast & Anonymized Sharing (RC-08, PO-01) │  
├──────────────────────────────────────────────────────────────────────────┤  
│ SPRINT 2: CANDIDATE SUPPLY, PARSING & DUPLICATE ARBITRATION              │  
│ Feature 5: Multi-Channel Resume Ingestion & Parsing Engine (AS-04, RC-02) │  
│ Feature 6: Isolated Partner Submission Vault & 200ms Arbitrator (PO-02/03)│  
│ Feature 7: Relational Talent Mapping & Household Links (RC-04)           │  
│ Feature 8: Database Talent Recycler (Silver Medalist) & Showcase (RC-07)  │  
├──────────────────────────────────────────────────────────────────────────┤  
│ SPRINT 3: RECRUITER COCKPIT & CLIENT PRESENTATION PORTAL                 │  
│ Feature 9: Daily Recruiter Focus Queue & SLA Aging Radar Pills (RC-03)   │  
│ Feature 10: Unified WhatsApp & Email Interaction Timeline Logging (RC-01) │  
│ Feature 11: Zero-Login Magic Link Candidate Presenter (CF-01)             │  
│ Feature 12: 1-Click Client Decision Matrix & Reason Capture (CF-02)       │  
├──────────────────────────────────────────────────────────────────────────┤  
│ SPRINT 4: INTERVIEW COORDINATION, PREP KITS & STAGE GATES                │  
│ Feature 13: Asynchronous Slot Selector & WhatsApp Confirmator (CF-03/CE-01)│  
│ Feature 14: Automated Client Chase Sequence Cron Worker (CF-04)          │  
│ Feature 15: T-24h Interview Prep Kit Trigger Engine (CE-02)              │  
│ Feature 16: Post-Interview Feedback Survey & Strict Stage-Gate (CE-03)   │  
├──────────────────────────────────────────────────────────────────────────┤  
│ SPRINT 5: OFFER AUDIT, RETENTION RADAR & PROBATION SETTLEMENT            │  
│ Feature 17: Offer CTC Audit, Fee Calculator & Pre-Draft Invoice (HC-02)  │  
│ Feature 18: Notice Period Pulse Checks & 2-Tier Escalation (RC-05, CE-04) │  
│ Feature 19: Compliance Document Vault & Zero-Touch HR Handoff (HC-01/03) │  
│ Feature 20: Day-1 Invoice Trigger & Probation Replacement Engine (HC-04)  │  
│ Feature 21: Split-Fee Partner Ledger & Owner Financial Approvals (PO-04)  │  
│ Feature 22: End-to-End System Regression & Final PRD Audit                │  
└──────────────────────────────────────────────────────────────────────────┘  
**6\. THE 7-STEP IMPLEMENTATION GATEWAY (ONE FEATURE AT A TIME)**

For **every single feature** in the queue, the coding agent must execute the following 7 steps without deviation: 

┌──────────────┐  
│   Step 1:    │  Briefly explain feature, workflow context, and files to change.  
│   EXPLAIN    │  
└──────┬───────┘  
       │  
       ▼  
┌──────────────┐  
│   Step 2:    │  Audit existing models, components, utilities, and routes.  
│   INSPECT    │  
└──────┬───────┘  
       │  
       ▼  
┌──────────────┐  
│   Step 3:    │  Write code ONLY for this feature. Zero forward implementation.  
│  IMPLEMENT   │  
└──────┬───────┘  
       │  
       ▼  
┌──────────────┐  
│   Step 4:    │  Run technical tests \+ produce plain-English UI manual test checklist.  
│    TEST      │  
└──────┬───────┘  
       │  
       ▼  
┌──────────────┐  
│   Step 5:    │  HARD STOP. Do not continue. Do not start the next feature.  
│    STOP      │  
└──────┬───────┘  
       │  
       ▼  
┌──────────────┐  
│   Step 6:    │  User manually tests UI and gives explicit written approval.  
│   APPROVAL   │  (If bug reported: Fix \-\> Re-test \-\> Stop again).  
└──────┬───────┘  
       │  
       ▼  
┌──────────────┐  
│   Step 7:    │  Advance to next feature in the queue.  
│ NEXT FEATURE │  
└──────────────┘  
**Manual Testing Checklist Format (Step 4 Requirement)**

The test checklist provided to the user must be written in non-technical business language. Example: 

**Manual Test Checklist for Feature 11 & 12 (Zero-Login Presenter & Decision Matrix):**

1. Log in as **Assigned Recruiter**.   
2. Navigate to active job mandate **"Senior Backend Engineer \- TechCorp"** and click **"Generate Client Review Link"**.   
3. Copy the generated magic link and open it in an **Incognito / Private Window** (no login required).   
4. Verify that the candidate profile cards render with sanitized information (experience, CTC, notice period, skills) while candidate phone numbers and email addresses are completely stripped.   
5. Click **\[ Reject \]** on Candidate A. Verify that a modal requires selecting a rejection reason (e.g., *Over Budget*, *Notice Period Too Long*) before the decision saves.   
6. Click **\[ Shortlist for Interview \]** on Candidate B and input 3 proposed time slots.   
7. Return to the **Recruiter Cockpit**. Verify Candidate A is tagged as Rejected (with reason visible) and Candidate B has transitioned to Interview Coordination. 

**7\. NEVER BATCH FEATURES (ANTI-BATCHING MANDATE)**

* 🚫 **STRICTLY PROHIBITED:** Building multiple features together (e.g., *"I have implemented Features 11, 12, and 13\. Please review."*).   
* ✅ **MANDATORY:** Feature $N$ ➔ Implement ➔ Test ➔ Manual Checklist ➔ **STOP** ➔ User Approval ➔ Feature $N+1$. 

Batching prevents immediate bug detection, obscures breaking state changes, and violates the Botspring incremental engineering protocol. 

**8\. CORE BUSINESS RULES & INVARIANTS (NEVER BYPASS)**

The coding agent must enforce these invariants at the database and API levels: 

| Invariant Area | Mandatory Rule & System Enforcement |
| :---- | :---- |
| **Mandate Acceptance Gate** | Inbound client hiring requests can only be converted into active mandates by an AGENCY\_OWNER or TEAM\_LEAD. Recruiters cannot create client billing accounts or alter fee terms.  |
| **200ms Duplicate Arbitrator** | Candidate uniqueness checks are enforced on (agency\_id, phone\_normalized) and (agency\_id, email). Partner uploads matching an active in-house candidate (\<90 days) or a prior partner submission are hard-blocked immediately.  |
| **Sanitized Client Presenter** | Magic link endpoints (/api/v1/public/portal/:token) must strip all candidate PII (phone numbers, direct emails, home addresses) at the backend serialization layer.  |
| **Manual Re-sourcing Discretion** | Candidate rejections by client hiring managers update candidate status to Rejected, but **never** auto-create automated sourcing tasks. Re-sourcing remains under recruiter judgment.  |
| **Isolated Alternative Slot Routing** | If a candidate clicks "Request Alternative Slots", the proposed times route exclusively as a coordination task to the **Recruiter Cockpit** and must **never** post unvetted to the client portal.  |
| **Strict Interview Stage-Gate** | Advancing a candidate past interview stages requires an explicit outcome (Completed, Rescheduled, Rejected Post-Interview). Progression cannot occur on blank records without Owner/TL override.  |
| **2-Tier Notice Retention Escalation** | Unresponded notice-period check-in after 48h triggers a HIGH RISK banner in the Recruiter Cockpit. A 2nd consecutive missed check-in automatically alerts the AGENCY\_OWNER / TEAM\_LEAD directly.  |
| **Private Compliance Storage** | Pre-onboarding compliance documents (Pay Slips, National IDs, Relieving Letters) in S3 must be accessed strictly through temporary signed URLs (expiresIn \= 900s).  |
| **Day-1 Invoice Dispatch** | Confirming candidate physical joining triggers automatic dispatch of the pre-drafted placement invoice to Client Finance and starts the 90-day replacement guarantee clock.  |
| **Probation Breach & Freeze** | Early candidate departure within the 90-day window triggers multi-party alerts, freezes pending partner commission payouts, auto-opens a $0 replacement mandate, and recommends past Silver Medalists.  |
| **Owner-Only Financial Actions** | Generating Credit Notes, fee adjustments, or invoice cancellations strictly requires explicit approval from AGENCY\_OWNER or TEAM\_LEAD. Recruiters have zero financial edit rights.  |
| **Manual Operational Ledger** | Partner split-fee settlements are tracked via an internal ledger (PO-04). Payment status updates are manual actions performed by the Agency Owner upon actual bank realization.  |

**9\. ROLES & PERMISSION BOUNDARIES**

┌───────────────────┬─────────────────────────┬──────────────────────┬──────────────────────┐  
│ Role              │ Candidate PII Scope     │ Financial Edit Scope │ Export Permissions   │  
├───────────────────┼─────────────────────────┼──────────────────────┼──────────────────────┤  
│ Super Admin       │ Tenant-Wide Unmasked    │ System Tier / Seats  │ Global System Exports│  
│ Agency Owner / MD │ Tenant-Wide Unmasked    │ Full Invoices/Ledgers│ Full CSV / XLSX      │  
│ Team Lead         │ Team Mandates Unmasked  │ View Fees / Approve  │ Restricted / Filtered│  
│ Recruiter         │ Assigned Candidates ONLY│ View Fee % ONLY      │ Strictly Disabled    │  
│ Partner Sourcer   │ Own Submissions ONLY    │ View Own Split ONLY  │ Strictly Disabled    │  
│ Client HR / HM    │ Masked (Zero PII Link)  │ View Staged Invoice  │ Sanitized PDF Only   │  
└───────────────────┴─────────────────────────┴──────────────────────┴──────────────────────┘  
**Authorization Architecture:**

1. **API Route Enforcement:** Every API route must validate session.user.role and record ownership. A recruiter requesting GET /api/v1/candidates/\[id\] where they are not assigned and lack team permissions must receive a masked phone and email payload.   
2. **Frontend Masking is Not Security:** Masking must occur at the backend serialization layer (Prisma select / DTO transformation) before payload transmission. 

**10\. ENTITY LIFECYCLE & STATE MACHINES**

\[MANDATE LIFECYCLE\]  
UNREVIEWED\_INBOUND ──► ACTIVE\_ASSIGNED ──► SOURCING\_IN\_PROGRESS ──► INTERVIEWS\_ACTIVE  
                                                                           │  
┌──────────────────────────────────────────────────────────────────────────┘  
▼  
OFFER\_STAGED ──► PLACEMENT\_CONFIRMED ──► PROBATION\_TRACKING ──► CLOSED\_FULFILLED  
                                                │  
                                                ▼ (If Early Departure)  
                                         REPLACEMENT\_ACTIVE ($0 Mandate)

\[CANDIDATE SUBMISSION LIFECYCLE\]  
PARSED\_RAW ──► SCREENED\_QUALIFIED ──► SUBMITTED\_TO\_CLIENT ──► CLIENT\_SHORTLISTED  
                                                                     │  
┌────────────────────────────────────────────────────────────────────┘  
▼  
INTERVIEW\_SCHEDULED ──► INTERVIEW\_COMPLETED ──► OFFER\_ISSUED ──► OFFER\_ACCEPTED  
        │                       │                     │                │  
        ▼                       ▼                     ▼                ▼  
   NO\_SHOW\_FLAG           STAGE\_REJECTED        OFFER\_DECLINED    NOTICE\_PERIOD\_ACTIVE  
                                                                       │  
                                                                       ▼  
                                                              JOINED\_DAY\_1\_ACTIVE

\[PROBATION & SETTLEMENT LIFECYCLE\]  
DAY\_1\_JOINED ──► PROBATION\_ACTIVE (Day 1-90) ──► PROBATION\_CLEARED ──► SETTLED\_WON  
                       │  
                       ▼ (Early Exit \< 90 Days)  
                 PROBATION\_BREACH ──► PARTNER\_PAYOUT\_FROZEN ──► REPLACEMENT\_SOURCING  
**11\. CLARIFICATION & AMBIGUITY PROTOCOL**

If the coding agent encounters an edge case or ambiguity that materially affects: 

1. Business workflow sequence or handoffs,   
2. Candidate or mandate ownership,   
3. Role access permissions or data unmasking,   
4. Placement fee, invoice, or partner split-fee calculations,   
5. State machine transitions, 

The agent must **STOP IMMEDIATELY** and formulate a single, precise question for the user. 

* **Rule:** Do not guess. Do not invent business logic. Do not make product decisions.   
* **Minor Technical Details:** For non-business decisions (e.g., CSS utility naming, internal helper function structure), follow existing codebase conventions and document the choice in Step 1\. 

**12\. UI DESIGN & VISUAL SYSTEM GUIDELINES**

When building UI components to fulfill the workflow requirements, the agent must align with the Botspring enterprise design system: 

* **Primary Palette:** Deep Navy (\#d3dbed), Botspring Yellow (\#FFD400), Slate Grey (\#64748B), Clean Muted Background (\#F8FAFC).   
* **Semantic Accents:** Success Green (\#10B981), Alert Red (\#EF4444), Warning Amber (\#F59E0B), Silver Medalist Pill (\#94A3B8).   
* **Typography & Layout:** Clean sans-serif (Inter / Geist), high-density data tables with generous card padding, zero decorative clutter, focused Cockpit panels with clear operational hierarchy.   
* **Responsive Breakpoints:**  
  * Desktop ($>1024px$): Optimized for Founder Cockpit, Mandate Matrix, and Split Recruiter Workspace.   
  * Mobile ($<768px$): Card-based, zero-login clean layout optimized for Client Hiring Managers and Candidate mobile portals. 

**13\. PRD COMPLETION & FINAL VALIDATION GATE**

Before declaring the PRD implementation complete, the coding agent must execute a full end-to-end regression validation: 

1. **Feature Audit:** Verify that all 22 features in the implementation queue have individually received explicit user approval.   
2. **Cross-Workflow Simulation:** Execute a complete transaction run:   
   * Ingest client mandate via storefront ➔ Owner verifies & assigns recruiter ➔ Ingest candidate CV with 200ms duplicate check ➔ Generate zero-login client link ➔ Client shortlists & drops 3 slots ➔ Candidate confirms slot via WhatsApp ➔ T-24h prep kit trigger ➔ Post-interview debrief & outcome gate ➔ Offer CTC audit & pre-draft invoice ➔ Bi-weekly notice pulse check ➔ Day-1 joining confirmation ➔ Auto-dispatch invoice & activate 90-day probation clock ➔ Settle partner split-fee ledger.   
3. **Multi-Tenant Leakage Check:** Verify that Agency Tenant B cannot query or view Agency Tenant A mandates, candidates, client accounts, or partner feeds.   
4. **Final Deliverable Summary:** Provide a structured Markdown summary listing all implemented modules, database migrations, API routes, automated tests, and confirmed user approvals. 

*End of CODER\_INSTRUCTIONS.md — Operational Manual for RecruitOS Implementation*