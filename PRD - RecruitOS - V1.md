# **RECRUITOS — PRODUCT REQUIREMENT DOCUMENT (PRD)**

**Document Status:** V1.0 Draft

**Wireframe:** [https://stitch.withgoogle.com/projects/6791819750230859733](https://stitch.withgoogle.com/projects/6791819750230859733)  
**Owner:** Product Management / Botspring Systems Architecture

**Target Audience:** Full-Stack Engineers, UI/UX Designers, Systems Specialists

## **PART 1: PRD OVERVIEW & PROBLEM DEFINITION**

### **1\. Executive Summary**

RecruitOS is an **Operational Operating System** built for independent recruiters and agency founders. Unlike standard Applicant Tracking Systems (ATS) that function as static "data graveyards," RecruitOS acts as an early-warning radar and automated workflow engine. It enforces strict SLAs on client feedback, eliminates manual WhatsApp/Excel double-entry, and protects revenue through the candidate lifecycle—from initial intake to probation completion.

### **2\. The Macro Problem Statement**

Independent recruitment is broken by three structural operational failures:

1. **The "Shadow CRM" (WhatsApp Chaos):** Up to 80% of critical deal mechanics (candidate updates, client feedback, salary negotiations) happen over WhatsApp. Because this data is never synced to a database, the recruiter's entire pipeline lives in their phone's chat history and personal memory.  
2. **The "Unhygienic Folder" Graveyard:** Candidate CVs are saved in chaotic desktop folders organized by arbitrary dates or job titles. Vetted, high-quality "silver medalist" candidates are lost forever, forcing recruiters to re-source from scratch for every new mandate.  
3. **The 90-Day Post-Offer Black Hole:** Between offer acceptance and Day 1 on the job (often 30–90 days notice), candidate engagement is manual and unstructured. Recruiters lose thousands in commissions when candidates quietly accept counter-offers or drop out without warning.

### **3\.  Multi-Tenancy Design Model: Shared Database, Row-Level Tenant Isolation**

* **Tenant Identification:** Every request is scoped to a single `agency_id` (Tenant ID).  
* **JWT Context Middleware:** Upon authentication, the Next.js API Middleware extracts `agency_id` from the secure HttpOnly JWT cookie and attaches it to the request context `req.agency_id`.  
* **PostgreSQL Row-Level Security (RLS) Policy:**

SQL

\-- Enable Row Level Security on core entity tables

ALTER TABLE candidate\_records ENABLE ROW LEVEL SECURITY;

ALTER TABLE job\_mandates ENABLE ROW LEVEL SECURITY;

ALTER TABLE candidate\_submissions ENABLE ROW LEVEL SECURITY;

\-- Tenant Isolation RLS Policy

CREATE POLICY tenant\_isolation\_policy ON candidate\_records

    AS RESTRICTIVE

    USING (agency\_id \= NULLIF(current\_setting('app.current\_agency\_id', true), '')::UUID);

### **2\. Middleware Context Injection Logic**

JavaScript

// Next.js API Context Middleware for Divyanshu

export async function tenantMiddleware(req, res, next) {

    const session \= await getSession({ req });

    if (\!session || \!session.agency\_id) {

        return res.status(401).json({ error: "Unauthorized: Missing Tenant Context" });

    }

    

    // Inject tenant ID into PostgreSQL transaction session

    await db.query(\`SET LOCAL app.current\_agency\_id \= '${session.agency\_id}'\`);

    req.agency\_id \= session.agency\_id;

    next();

}

## **PART 2: ZONE 1 — THE RECRUITER COCKPIT**

**Persona:** Independent Recruiter / Agency Founder

**Core Purpose:** Centralize all communication, eliminate desktop folders, enforce pipeline momentum, and provide immediate visibility into pipeline risks.

### **FEATURE RC-01: Unified WhatsApp & Email Communication Log**

*The "Shadow CRM" Integrator*

#### **1\. Grounding & Anecdote**

> *"We do most candidate follow-ups on WhatsApp... I send candidate details with date, name, and designation directly over chat. But there's no consolidated data or central dashboard to see what happened across all of them."*

#### **2\. User Story**

> **As a** busy solo recruiter,

> **I want** all WhatsApp messages and emails with candidates and clients automatically logged to their respective profiles,

> **So that** I never lose context, never copy-paste notes into spreadsheets, and can manage my business from one screen.

#### **3\. Detailed User Experience Journey**

1. **Intake/Sync:** The recruiter opens the Cockpit. A fixed side drawer displays the live **Unified Communication Stream**.  
2. **Inbound Notification:** A WhatsApp message arrives from a candidate (\+91-9876543210). The system automatically matches the phone number to candidate profile *Ankit Sharma*.  
3. **Contextual Action:** The recruiter clicks Ankit's card. The central workspace expands, revealing a side-by-side view:  
   * **Left Panel:** Candidate Pipeline Stage (*Interview Scheduled \- Round 2*).  
   * **Right Panel:** Live WhatsApp chat timeline.  
4. **Outbound Quick Template:** The recruiter needs to send interview details. They click \[Send Template\] $\\rightarrow$ select \[Interview Confirmation\]. The system populates variables (Candidate Name, Client Name, Time Slot) and previews the WhatsApp text.  
5. **Dispatch:** The recruiter clicks \[Send via WhatsApp\]. The message dispatches via WhatsApp Business API, logs into the audit timeline with a green delivered checkmark, and updates the Candidate's Last\_Contacted timestamp.

#### **4\. Functional & Logic Specifications**

* **Multi-Channel Sync:** Two-way sync via WhatsApp Business API (WABA) and IMAP/SMTP for Email.  
* **Auto-Matching Hierarchy:** Incoming messages match existing entities by Phone Number first, then Email Address. If no match exists, flag as Unlinked Lead with a 1-click \[Create Candidate\] button.  
* **Sentiment / Keyword Parsing:** If an inbound candidate message contains negative keywords (*"counter offer"*, *"declining"*, *"resigned"*, *"can't make it"*), automatically trigger a **High-Risk Alert Badge** on the Candidate Card in the Cockpit board.

#### **5\. UI Layout & State Rules**

* **States:** *Connected*, *Disconnected/API Error*, *Unlinked Contact*, *Active Chat*.  
* **Visuals:** Chat interface must feel native to messaging apps but embedded cleanly without clutter. Navy theme background (\#0F172A) for internal tags, subtle grey cards for raw messages.

#### **6\. AI Wireframe Prompt (Copy-Paste for UI Generation)**

Plaintext  
Clean, modern enterprise SaaS desktop UI, Deep Navy (\#0F172A) sidebar, white main panel. Center panel shows a candidate profile 'Ankit Sharma' with pipeline status 'Round 2 Interview'. Right sidebar shows a unified messaging stream labeled 'WhatsApp & Email Feed'. A chat bubble from Ankit says 'I have updated my notice period'. Below it is a message composer box with a button 'Send WhatsApp Template' highlighted in bright yellow (\#FFD400). Minimalist, zero visual clutter, generous whitespace.

### **FEATURE RC-02: Automated Intake & Clean CV Parsing Engine**

*The "Folder Killer"*

#### **1\. Grounding & Anecdote**

> *"Storing CVs in desktop folders is so unhygienic... we save them date-wise or role-wise, and then we completely forget who is where. It's a total waste of time."*

#### **2\. User Story**

> **As a** recruiter overwhelmed by raw resumes,

> **I want** to drag-and-drop raw CV files into the system and have them automatically parsed into clean, standardized profiles,

> **So that** I never have to manually re-type candidate details into an Excel sheet or search through messy desktop folders.

#### **3\. Detailed User Experience Journey**

1. **Drag-and-Drop Dropzone:** The recruiter receives 5 candidate CVs (PDFs/DOCX) via email. They open the Cockpit's persistent floating dropzone labeled \[ \+ Import Resumes \].  
2. **Batch Processing:** The recruiter drags all 5 files into the zone. A subtle progress bar displays parsing status (*"Parsing Experience... Extracting Skills... Sanitizing Contact Info..."*).  
3. **Parsing Review Drawer:** Once processed (2-3 seconds per file), a slide-out tray displays parsed entities side-by-side with the original document:  
   * Extracted Name, Current Designation, Total Experience, Skills, Location, Notice Period, Current CTC, Expected CTC.  
4. **Duplicate Check Warning:** If *Resume \#3* shares an email/phone with an existing database record, the UI displays a banner: \[Duplicate Detected: Updated existing record for Vivek Kumar\].  
5. **Auto-Sanitization:** The engine automatically generates a sanitized, client-ready summary view stripping phone numbers, personal emails, and home addresses for safe external client presentation.

#### **4\. Functional & Logic Specifications**

* **Parsing Engine:** Extract unstructured text from PDF, DOCX, and RTF formats using regex and LLM entity extraction.  
* **Extraction Schema:** full\_name, email, phone, skills\[\], total\_exp\_months, current\_company, current\_title, notice\_period\_days, current\_ctc, expected\_ctc.  
* **File Renaming Automation:** Auto-rename stored raw files in S3 storage using strict naming standard: \[Candidate\_ID\]\_\[First\_Name\]\_\[Designation\]\_\[Year\].pdf.

#### **5\. UI Layout & State Rules**

* **Dropzone Widget:** Fixed to top-right or accessible via global Cmd+K keyboard shortcut.  
* **Parsing Validation View:** Split screen: Left \= Original PDF Viewer, Right \= Editable Form Fields for human correction before saving.

#### **6\. AI Wireframe Prompt**

Plaintext  
Dashboard UI split-screen modal for resume parsing. Left side shows a uploaded PDF resume. Right side shows clean, structured input fields populated automatically: Full Name 'Priya Mehta', Primary Skills tags \['React', 'Node.js', 'PostgreSQL'\], Experience '6 Years', Notice Period '30 Days'. Top banner displays 'Duplicate Check Passed \- Record Created'. Aesthetic: Enterprise minimalist, Deep Navy headers, sharp line iconography, white clean cards.

### **FEATURE RC-03: Pipeline SLA & Stagnation Aging Radar**

*The 72-Hour Velocity Enforcer*

#### **1\. Grounding & Anecdote**

> *"Everybody in recruitment works in the slowest possible way. Candidates lose interest because feedback takes forever. Our rule is 72 hours max to show the client we are providing a solution, but tracking that manually across 20 positions is impossible."*

#### **2\. User Story**

> **As an** agency founder who prides myself on speed,

> **I want** an early-warning radar that highlights candidates who have been sitting in any stage without movement for over 48–72 hours,

> **So that** I can chase clients or candidates before deals go cold and candidates lose interest.

#### **3\. Detailed User Experience Journey**

1. **Morning Cockpit Load:** The recruiter opens RecruitOS at 9:00 AM. The top banner displays the **Operational Velocity Gauge** (*Current SLA Compliance: 84%*).  
2. **Visual Radar View:** The Kanban pipeline board displays candidate cards. Cards sitting within normal timelines display standard neutral borders.  
3. **Warning State (Yellow):** Candidate *Rohan Verma* was submitted to client *TechCorp* 36 hours ago. The card shows a yellow timer pill: \[36h in Submitted\].  
4. **Breach State (Red Glow):** Candidate *Neha Gupta* was submitted 78 hours ago with zero client feedback. Her card shifts to the top of the column, glowing subtle red with a badge: \[CRITICAL: 78h SLA Breached \- Client Feedback Pending\].  
5. **One-Click SLA Remediation:** The recruiter hovers over Neha's card, clicks \[Trigger Client Chase\]. The system dispatches an automated WhatsApp nudge to the hiring manager: *"Hi Alex, quick follow-up on Neha's profile sent 3 days ago. Should we schedule or pass?"*

#### **4\. Functional & Logic Specifications**

* **Stage SLA Configurations:**  
  * *Screened $\\rightarrow$ Submitted to Client:* Target \< 24 Hours  
  * *Submitted $\\rightarrow$ Client Feedback:* Target \< 48 Hours (Alert at 48h, Breach at 72h)  
  * *Interview Completed $\\rightarrow$ Round Decision:* Target \< 24 Hours  
* **Automated Escalation Logic:** On SLA Breach (72h+), automatically pin candidate to recruiter's **Daily Priority Focus Queue** and log an operational SLA breach incident.

#### **5\. UI Layout & State Rules**

* **Board Visuals:** Clean Kanban layout. High-contrast status chips (Green \= \<24h, Yellow \= 24-48h, Red \= 72h+).  
* **Sorting Rule:** Cards within columns are strictly sorted by Time\_In\_Stage in descending order so stalled deals remain visually unavoidable at the top.

#### **6\. AI Wireframe Prompt**

Plaintext  
Kanban board UI for recruitment pipeline. Columns labeled 'Screened', 'Submitted to Client', 'Interviewing'. Under 'Submitted to Client', top candidate card has a subtle red border and glowing red tag 'SLA BREACH: 78 Hours No Response'. A quick-action button on hover reads 'Send Auto Nudge'. Deep Navy accents, crisp typography, warning indicators using clear status colors.

### **FEATURE RC-04: Relational Talent & Household Mapping**

*The Relocation Network Builder*

#### **1\. Grounding & Anecdote**

> *"When candidates move to another city or country, like Africa or Saudi Arabia, their spouse often needs a job too. They give us high-trust references for their husband or wife, but right now we have no way to connect these profiles in a system."*

#### **2\. User Story**

> **As a** recruiter handling senior or international relocations,

> **I want** to link candidate profiles by household or professional relationship,

> **So that** when a candidate relocates, their spouse or reference is automatically surfaced as a candidate for open roles in that new market.

#### **3\. Detailed User Experience Journey**

1. **Profile Relationship Definition:** While interviewing Candidate *Siddharth Nair* for a General Manager role in Dubai, Siddharth mentions his wife *Anita* is a Senior HR Lead also looking to move.  
2. **Relational Linking:** On Siddharth's profile, the recruiter clicks \[ \+ Link Related Talent \] $\\rightarrow$ selects Relationship: Spouse $\\rightarrow$ attaches or creates *Anita Nair's* profile.  
3. **Trigger Event:** 3 weeks later, Siddharth accepts the offer for Dubai. The recruiter updates Siddharth's status to Offer Accepted (Dubai).  
4. **Automated Cross-Surface:** The system automatically executes a background rule: Anita Nair's profile is updated with Mobility Flag: Dubai (Immediate).  
5. **System Recommendation:** When a new HR Lead role opens up in Dubai 2 days later, Anita Nair automatically appears in the Recruiter’s Cockpit under \[Recommended Household Talent\].

#### **4\. Functional & Logic Specifications**

* **Relational Schema:** relationship\_id, candidate\_a\_id, candidate\_b\_id, relation\_type (Spouse, Ex-Colleague, Referral), shared\_location\_target.  
* **Inheritance Rules:** When Candidate\_A status updates to Placed with location\_id \= X, search all linked profiles (Candidate\_B) where relation\_type \= Spouse and auto-set Candidate\_B.target\_location \= X and Candidate\_B.availability\_status \= Hot Lead.

#### **5\. UI Layout & State Rules**

* **Candidate Profile Widget:** A dedicated tab labeled **Talent Network & Family Links**. Displays visual node connection cards (e.g., *"Linked Spouse: Anita Nair \- HR Lead"*).

#### **6\. AI Wireframe Prompt**

Plaintext  
User profile interface for recruitment OS. Under 'Relational Talent Network' tab, a visual card displays 'Linked Household Member: Anita Nair (Spouse)'. Shows her designation 'HR Lead' and a blue badge 'Target Location: Dubai (Synced from Siddharth Nair)'. Button next to her name 'Assign to Dubai HR Mandate'. Minimalist design, high contrast, soft shadows.

### **FEATURE RC-05: Post-Offer 90-Day Drop-Off Radar**

*The Notice Period Risk Mitigator*

#### **1\. Grounding & Anecdote**

> *"In India or Gulf hiring, candidates have 30 to 90 days notice period. They sign the offer letter, and then go silent. During those 3 months, they take counter-offers. We just talk casually about general life to keep in touch, but if you forget to call them, they drop out and your revenue goes to zero."*

#### **2\. User Story**

> **As a** recruiter with commission tied to candidate joining,

> **I want** an automated engagement schedule during the candidate's 90-day notice period,

> **So that** I can passively monitor their counter-offer risk and step in immediately if they begin to pull away.

#### **3\. Detailed User Experience Journey**

1. **Offer Acceptance Activation:** Recruiter updates Candidate *Vikram's* status to Offer Signed. Joining date is set for 60 days out.  
2. **Automated Touchpoint Schedule Created:** The system builds a 60-day cadence matrix:  
   * *Day 7:* WhatsApp Pulse Check ("How did the resignation discussion go?")  
   * *Day 20:* Automated WhatsApp Document Request ("Upload resignation acceptance copy")  
   * *Day 35:* Soft Check-in ("Hey Vikram, how is the handover going?")  
   * *Day 50:* Pre-joining Prep ("Excited for Day 1 next week?")  
3. **Passive Engagement Execution:** On Day 20, the automated WhatsApp link dispatches. Candidate opens link, clicks \[Resignation Accepted\], and uploads proof.  
4. **Risk Detection Trigger:** On Day 35, the WhatsApp check-in is delivered but remains **Unread for 72 hours**.  
5. **Red Alert:** The Cockpit surfaces a high-priority banner: \[DANGER: Vikram has gone dark on Day 35 of Notice Period. Immediate Call Required\].

#### **4\. Functional & Logic Specifications**

* **Cadence Engine:** Configurable touchpoint calendar based on Notice\_Period\_Length (30/60/90 days).  
* **Risk Score Matrix:**  
  * *Low Risk:* Responds to automated WhatsApp pulse within 12h; resignation proof uploaded.  
  * *Medium Risk:* Response delayed \> 48h; mentions "counter offer" or "management retention" in messages.  
  * *High Risk:* Fails to open 2 consecutive touchpoint links OR explicitly selects "Experiencing doubts" on pulse check.

#### **5\. UI Layout & State Rules**

* **Dashboard Tab:** Labeled **Notice Period Radar**. Displays a horizontal timeline slider for each offered candidate representing 0 to 90 days, with color-coded risk markers along the line.

#### **6\. AI Wireframe Prompt**

Plaintext  
Dashboard page titled '90-Day Notice Period Radar'. Displays candidate 'Vikram Malhotra' with a 60-day progress timeline bar at Day 35\. Milestone check-marks show 'Resignation Confirmed' (Green) and 'Handover Phase' (Red Warning Indicator). A prominent alert sidebar reads 'Risk Score: HIGH \- No interaction in 72h'. CTA button 'Launch Emergency Call Log'. Deep Navy styling, crisp indicators.

### **FEATURE RC-06: Lifecycle-Triggered Settlement & Invoicing Engine**

*Automated Fee Collector*

#### **1\. Grounding & Anecdote**

> *"Upfront token payment keeps clients serious. But after the candidate joins, raising invoices and tracking probation period guarantees is all done on memory or manual follow-ups."*

#### **2\. User Story**

> **As an** agency owner,

> **I want** the system to automatically generate billing invoices when candidates join or complete probation milestones,

> **So that** I collect my fees on time without administrative delay or missed billing windows.

#### **3\. Detailed User Experience Journey**

1. **Milestone Achievement:** Candidate *Meera* reaches Day 1 at client firm *Apex Corp*. The system auto-updates her status to Joined.  
2. **Invoice Auto-Generation:** The system calculates billing based on client terms (e.g., 8.33% of CTC ₹18,000,000 \= ₹1,500,000 fee).  
3. **Approval Notification:** A notification appears in the Cockpit: \[Draft Invoice Generated: Apex Corp \- Meera Placement\].  
4. **Review & Dispatch:** The recruiter clicks the notification, reviews pre-filled details (Tax ID, Client Billing Address, CTC Breakdown, Guarantee Terms), and clicks \[Approve & Dispatch Invoice\].  
5. **Client Delivery:** Invoice dispatches directly to Client HR & Finance emails, with a tracking link embedded.

#### **4\. Functional & Logic Specifications**

* **Fee Structure Logic:** Supports *Fixed Retainer*, *Percentage of Annual CTC*, *Split Advance \+ Success Fee*.  
* **Probation Tracker:** Sets background timer on Day 1 (e.g., 90-day replacement guarantee window). Tracks countdown and alerts recruiter on Day 80 to conduct "Probation Completion Review" before final payment signoff.

#### **5\. UI Layout & State Rules**

* **Cockpit Module:** **Financials & Settlements**. Displays metrics: Unbilled Placements, Invoices Pending Payment, Probation Guarantee Risks.

#### **6\. AI Wireframe Prompt**

Plaintext  
Financial overview screen in recruitment OS. Top summary metrics cards: 'Unbilled Placements', 'Overdue Invoices', 'Active Guarantee Windows'. Table below lists 'Apex Corp \- Candidate: Meera', Fee '₹1,500,000', Status 'Draft Invoice Ready'. Button labeled 'Approve & Send to Finance' highlighted in bright yellow (\#FFD400). Modern enterprise interface, clean typography.

### **FEATURE RC-07: Talent Database Recycling Engine**

*The "Silver Medalist" Indexer*

#### **1\. Grounding & Anecdote**

> *"When a role is closed, 3 or 4 candidates who cleared all interviews are left out. A few months later, a similar role opens and we waste time re-sourcing from job portals because we don't search our old data."*

#### **2\. User Story**

> **As a** recruiter starting a new mandate,

> **I want** the system to immediately pull up pre-screened, high-performing candidates from past mandates who finished in second or third place,

> **So that** I can present a pre-vetted shortlist to my client within 24 hours without spending money on fresh job board sourcing.

#### **3\. Detailed User Experience Journey**

1. **New Mandate Creation:** Recruiter enters a new job opening: *Senior Product Designer \- Bangalore*.  
2. **Instant Historical Match:** Upon hitting \[Save Job Requirements\], a right-hand drawer slides out titled \[Silver Medalists & Vetted Matches Found: 4 Candidates\].  
3. **Candidate Breakdown:** Card displays candidate *Deepak Roy*:  
   * *Past Context:* Reached Final Round for *Flipkart Product Designer* 4 months ago.  
   * *Rating:* Client Rating 4.5/5 (Rejected purely on budget fit, not skill).  
   * *Status:* Pre-vetted, interviewed by Founder previously.  
4. **1-Click Shortlist:** Recruiter clicks \[Re-engage via WhatsApp\]. System dispatches personalized message: *"Hi Deepak, a new Senior Product Designer role just opened matching your exact salary expectations. Are you open to a quick call today?"*

#### **4\. Functional & Logic Specifications**

* **Matching Algorithm:** Query historical candidate database filtering by:  
  * Highest\_Stage\_Reached $\\ge$ Client Interview  
  * Rejection\_Reason $\\neq$ Failed Technical or Behavioral Red Flag (Filter for Over Budget, Second Choice, Role Cancelled).  
  * Vector similarity match on Skills and Designation.

#### **5\. UI Layout & State Rules**

* **Widget Position:** Embedded directly into the **New Job Opening creation screen** as an instant pop-up overlay, preventing the user from leaving to job portals before checking existing database assets.

#### **6\. AI Wireframe Prompt**

Plaintext  
Job creation page overlay widget. Right-side drawer titled 'Silver Medalist Recommendations'. Candidate card shows 'Deepak Roy', subtitle 'Final Round Candidate for Flipkart (4 months ago)'. Tags display 'Pre-Vetted', 'Client Rating: 4.5/5', 'Reason: Salary Mismatch'. Action button 'Re-engage on WhatsApp' in yellow (\#FFD400). Minimalist, clean dark/light contrast.

# **FEATURE RC-08** 

*Job Board One-Click Broadcast & Auto-Webhooks*

### **FEATURE RC-08: Job Board One-Click Multi-Posting & Ingestion Engine**

*The Portal Sync Engine (Naukri, Bayt, LinkedIn)*

#### **1\. Real-World Recruitment Story**

> *"Recruiters rely heavily on job portals like Naukri, Bayt, and LinkedIn. But manually posting the same job on 3 portals, logging in twice a day to check applications, downloading Excel sheets, and copy-pasting CVs into desktop folders wastes hours. We need 1-click posting to all job boards and automated webhook auto-ingestion."*

#### **2\. Step-by-Step Screen Journey & UI States**

1. **Integration Setup (Cockpit Settings):** Recruiter navigates to Cockpit Settings $\\rightarrow$ Job Board API Keys. They enter their API credentials / OAuth tokens for **Naukri**, **Bayt**, and **LinkedIn**.  
2. **One-Click Broadcast Action:** Upon creating a new job mandate in Zone 1, recruiter clicks \[ Broadcast to Job Boards \].  
3. **Target Selection Modal:** Checkboxes for:  
   * ☑️ *Naukri.com (India/Gulf)*  
   * ☑️ *Bayt.com (Middle East)*  
   * ☑️ *LinkedIn Jobs*  
4. **Publish Execution:** Recruiter hits \[ Publish Jobs \]. System formats parameters for each API schema and posts concurrently. Status shifts to Active on 3 Portals.  
5. **Real-time Webhook Ingestion:** When a candidate applies on Naukri or Bayt, the job board triggers an instant webhook to RecruitOS.  
6. **Auto-Parsing & Tagging:** The candidate’s CV is automatically parsed (RC-02), duplicate-checked, and added to the Recruiter Cockpit pipeline with badge Source: Naukri.com.

#### **3\. Explicit PostgreSQL Schema Specification**

SQL  
\-- Job Board Integrations Credentials  
CREATE TABLE agency\_job\_board\_credentials (  
    credential\_id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    agency\_id UUID NOT NULL REFERENCES agencies(agency\_id) ON DELETE CASCADE,  
    board\_name VARCHAR(50) NOT NULL, \-- 'Naukri', 'Bayt', 'LinkedIn'  
    api\_key TEXT,  
    oauth\_token TEXT,  
    is\_active BOOLEAN DEFAULT TRUE,  
    created\_at TIMESTAMPTZ DEFAULT NOW()  
);

\-- Active Job Board Postings Log  
CREATE TABLE job\_board\_postings (  
    posting\_id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    job\_id UUID NOT NULL REFERENCES job\_mandates(job\_id) ON DELETE CASCADE,  
    board\_name VARCHAR(50) NOT NULL,  
    external\_job\_id VARCHAR(255) NOT NULL, \-- ID assigned by Naukri/Bayt API  
    posting\_status VARCHAR(50) DEFAULT 'Published',  
    applications\_count INT DEFAULT 0,  
    published\_at TIMESTAMPTZ DEFAULT NOW()  
);

CREATE INDEX idx\_board\_posting\_job ON job\_board\_postings(job\_id);

#### **4\. Backend API Routes & Controller Logic**

* **HTTP Method & Endpoint (Broadcast):** POST /api/v1/jobs/:job\_id/broadcast  
* **Request Payload:**  
* JSON

{  
  "selected\_boards": \["Naukri", "Bayt", "LinkedIn"\]  
}

*   
*   
* **HTTP Method & Endpoint (Webhook Receiver):** POST /api/v1/webhooks/job-boards/:board\_name  
* **Webhook Controller Logic:**  
  1. Verify incoming webhook signature against agency\_job\_board\_credentials.  
  2. Extract applicant JSON payload (Name, Email, Phone, Base64 CV File).  
  3. Execute Duplicate Arbitration Service (PO-03) against agency database.  
  4. Parse CV file and store in S3 bucket.  
  5. Create row in candidate\_records and link to job\_mandates with source \= board\_name.  
  6. **Interlinked Cockpit Notification:** Push real-time event to Recruiter Cockpit feed: New Applicant from Naukri: Ankit Sharma.

#### **5\. Edge Cases & Security Acceptance Criteria**

* **Expired OAuth / API Errors:** If an API key for Naukri expires, display a yellow badge in Cockpit: \[Naukri API Disconnected \- Re-authenticate\]. Do not interrupt internal recruiting operations if an external job board API fails.

#### **6\. AI Wireframe Prompt (v0.dev / Claude Artifacts)**

Plaintext  
UI modal for multi-job-board broadcasting. Modal title 'Broadcast Mandate to External Portals'. Displays 3 integration toggle cards: Card 1 'Naukri.com (Connected \- Account \#8412)' with yellow checkmark, Card 2 'Bayt.com (Connected \- Gulf Region)', Card 3 'LinkedIn Jobs (Connected)'. Bottom CTA button in solid yellow (\#FFD400) reading 'Publish Mandate across 3 Job Boards'. Modern enterprise styling.

## **PART 3: SUMMARY SPECIFICATION TABLE (ZONE 1\)**

| Feature Code | Feature Name | Core Operational Problem Solved | Primary Output / Asset |
| :---- | :---- | :---- | :---- |
| **RC-01** | Unified Communication Feed | WhatsApp & Email fragmentation ("Shadow CRM") | Centralized interaction timeline |
| **RC-02** | Auto CV Parsing & Intake | Desktop folder clutter & manual Excel data entry | Standardized, sanitized candidate profile |
| **RC-03** | Pipeline SLA Radar | Stalled feedback & slow recruiter velocity | Color-coded aging alerts (72h breach) |
| **RC-04** | Relational Talent Mapping | Losing family/spouse references during relocation | Cross-linked geographic candidate leads |
| **RC-05** | 90-Day Drop-Off Radar | Post-offer candidate dropouts & counter-offers | Passive WhatsApp engagement timeline |
| **RC-06** | Settlement & Invoicing Engine | Delayed billing and manual probation tracking | Automated milestone-triggered invoices |
| **RC-07** | Talent Database Recycling | Wasting pre-vetted 2nd-place candidates | Instant Vetted Shortlist on Job Creation |
| **RC-08** | Job Board One-Click Multi-Posting & Ingestion Engine |  | need 1-click posting to all job boards and automated webhook auto-ingestion |

### **How to use this PRD:**

1. **Copy into Google Docs:** This document is fully formatted in Markdown headers, tables, and code blocks for direct copy-paste.  
2. **Developer Implementation:** Developers can use the **Functional & Logic Specifications** to build the backend logic and PostgreSQL schema.  
3. **Design & Wireframing:** Copy the exact text inside the **AI Wireframe Prompt** blocks directly into AI UI generators (like v0.dev, Claude Artifacts, or Figma plugins) to generate high-fidelity UI screens instantly.

## **ZONE 2: THE CLIENT & INTERVIEWER PORTAL (The Feedback Engine)**

**Persona:** Client Hiring Manager / Company Interviewer / HR Contact

**Core Purpose:** Eliminate the "Client Feedback Trap" and calendar coordination ping-pong by providing a zero-login, frictionless portal for CV reviews, one-click feedback, and interview slot proposals.

### **FEATURE CF-01: Zero-Login Magic Link Candidate Presenter**

*The Frictionless CV Reviewer*

#### **1\. Real-World Recruitment Story**

> *"Hiring managers are extremely busy. If you make them log into a portal with a password, they won't use it. They end up texting feedback on WhatsApp or completely ignoring sent emails. We need a way for them to view screened profiles instantly on their phone or laptop with zero login barriers."*

#### **2\. Step-by-Step Screen Journey & UI States**

1. **Link Dispatch:** When a recruiter submits a shortlist of 3 candidates from the Cockpit, the system generates a secure 128-bit encrypted token URL (e.g., https://app.recruiteros.com/review/j8f92a1k-482a...).  
2. **First Load (No Auth Required):** Client clicks the link in WhatsApp or Email. Page loads in \< 1.2s with client company branding on top (*"TechCorp — Open Role: Senior Backend Engineer"*).  
3. **Shortlist Card View:** Displays horizontal candidate cards (e.g., *Candidate \#1: 8 Yrs Exp, Ex-Amazon, 30 Days Notice*).  
4. **Candidate Detail View:** Clicking a candidate card opens a slide-over panel showing:  
   * Sanitized executive summary (written by recruiter).  
   * Key skills tags, current CTC, expected CTC, notice period.  
   * Embedded PDF viewer displaying the sanitized CV (stripped of personal phone/email to prevent direct bypass).

#### **3\. Explicit PostgreSQL Schema Specification**

SQL

\-- Client Access Tokens Table

CREATE TABLE client\_portal\_tokens (

    token\_id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

    agency\_id UUID NOT NULL REFERENCES agencies(agency\_id) ON DELETE CASCADE,

    job\_id UUID NOT NULL REFERENCES job\_mandates(job\_id) ON DELETE CASCADE,

    client\_email VARCHAR(255) NOT NULL,

    token\_hash VARCHAR(64) UNIQUE NOT NULL, \-- SHA-256 hash of magic link token

    expires\_at TIMESTAMPTZ NOT NULL,

    created\_at TIMESTAMPTZ DEFAULT NOW(),

    last\_accessed\_at TIMESTAMPTZ

);

\-- Index for fast token lookup

CREATE INDEX idx\_portal\_token\_hash ON client\_portal\_tokens(token\_hash);

#### **4\. Backend API Routes & Controller Logic**

* **HTTP Method & Endpoint:** GET /api/v1/public/portal/:token  
* **Controller Logic:**  
  1. Hash the incoming URL param token using SHA-256.  
  2. Query client\_portal\_tokens WHERE token\_hash \= hashed\_token AND expires\_at \> NOW().  
  3. If expired or invalid, return 401 Unauthorized with UI state: *"This review link has expired. Please contact your recruiter for a fresh link."*  
  4. Fetch associated job\_mandates and all candidate\_submissions where stage \= 'Submitted to Client'.  
  5. **Sanitization Filter:** Strip phone, email, and home\_address from all candidate JSON pay-loads before sending response.

#### **5\. Edge Cases & Security Acceptance Criteria**

* **Security Isolation:** Unauthenticated client access must *never* expose raw candidate contact details or data from other client mandates.  
* **Link Expiration:** Tokens strictly expire after 14 days by default. Recruiter can manually revoke or extend tokens from the Cockpit.  
* **Audit Logging:** Every page access by the client logs IP\_Address, User\_Agent, and last\_accessed\_at timestamp back to the Recruiter Cockpit.

#### **6\. AI Wireframe Prompt (v0.dev / Claude Artifacts)**

Plaintext

Clean, responsive desktop web portal view for hiring managers. Deep Navy (\#0F172A) top header displays 'TechCorp — Shortlist Review: Senior Backend Lead'. White main body shows 3 candidate cards side-by-side. Candidate Card 1 displays title 'Senior Java / AWS Specialist', experience '7.5 Years', notice period '30 Days', expected salary '$120k'. A prominent primary button 'View CV & Details' in yellow (\#FFD400). Minimalist interface, zero navigation menus, high whitespace.

### **FEATURE CF-02: One-Click Candidate Decision & Feedback Matrix**

*The WhatsApp Replacement*

#### **1\. Real-World Recruitment Story**

> *"When a client rejects a candidate, they just say 'Not a fit' over text. They don't tell us why. Is it salary? Is it tech skill? If we don't capture structured rejection reasons, we keep sending them the wrong profiles and wasting days."*

#### **2\. Step-by-Step Screen Journey & UI States**

1. **Interactive Decision Bar:** Below each candidate profile in the Client Portal, three high-contrast buttons are anchored: \[ Shortlist for Interview \], \[ Reject \], \[ Hold \].  
2. **Shortlist Flow:** Client clicks \[ Shortlist for Interview \]. Button shifts to green checked state \[ Shortlisted \], and automatically opens the **Interview Availability Picker** (CF-03).  
3. **Reject Flow & Mandatory Reason Modal:** Client clicks \[ Reject \]. A lightweight popover appears:  
   * *"Help us refine our search. Primary reason for rejection?"*  
   * Radio Options: \[ Over Expected Budget \], \[ Weak Technical Experience \], \[ Notice Period Too Long \], \[ Culture / Soft Skills Fit \], \[ Other \].  
   * Optional text box: *"Additional feedback for recruiter..."*  
4. **Execution & Real-time Sync:** Clicking \[ Confirm Rejection \] locks the card state, removes it from active review, updates backend database, and fires an instant notification to the Recruiter Cockpit.

#### **3\. Explicit PostgreSQL Schema Specification**

SQL

\-- Candidate Submission Status ENUM

CREATE TYPE client\_decision\_enum AS ENUM (

    'Pending Review', 

    'Shortlisted', 

    'Rejected', 

    'On Hold'

);

CREATE TYPE rejection\_reason\_enum AS ENUM (

    'Over Budget', 

    'Technical Skill Gap', 

    'Notice Period Too Long', 

    'Domain Fit', 

    'Culture Fit', 

    'Other'

);

\-- Alter Submissions Table to store structured feedback

ALTER TABLE candidate\_submissions 

ADD COLUMN client\_decision client\_decision\_enum DEFAULT 'Pending Review',

ADD COLUMN rejection\_reason rejection\_reason\_enum,

ADD COLUMN client\_feedback\_notes TEXT,

ADD COLUMN decision\_timestamp TIMESTAMPTZ;

#### **4\. Backend API Routes & Controller Logic**

* **HTTP Method & Endpoint:** POST /api/v1/public/portal/:token/submissions/:submission\_id/decision  
* **Request Payload:**  
* JSON

{

  "decision": "Rejected",

  "rejection\_reason": "Over Budget",

  "feedback\_notes": "Candidate is asking for 30% above our benchmark."

}

* **Controller Logic:**  
  1. Validate access token.  
  2. Update candidate\_submissions row for given submission\_id.  
  3. Set decision\_timestamp \= NOW().  
  4. Reset stage SLA timer in pipeline\_stages.  
  5. **Notification Trigger:** Push real-time event via WebSocket / Webhook to update Recruiter Cockpit feed: *"TechCorp rejected Ankit Sharma (Reason: Over Budget)"*.

#### **5\. Edge Cases & Security Acceptance Criteria**

* **Decision Reversal:** Clients can change their decision within 24 hours directly from the portal unless the candidate has already been moved to "Interview Conducted" stage by the recruiter.  
* **Validation Enforcement:** rejection\_reason is strictly required if decision \== 'Rejected'. API must return 400 Bad Request if payload is missing reason.

#### **6\. AI Wireframe Prompt**

Plaintext

UI component modal overlay on a candidate review platform. Popup card titled 'Reason for Rejection'. Shows 4 sleek radio selection cards: 'Over Expected Salary', 'Technical Skill Mismatch', 'Notice Period Too Long', 'Role Already Filled'. Below is a text input box placeholder 'Optional feedback for recruiter...'. Action button 'Submit Rejection' in solid dark navy. Crisp, modern enterprise aesthetic.

### **FEATURE CF-03: Asynchronous Interview Slot Selector**

*The Calendar Ping-Pong Eliminator*

#### **1\. Real-World Recruitment Story**

> *"Scheduling an interview takes 10 back-and-forth messages: 'Is Tuesday 3 PM fine?' 'No, manager is busy, how about Thursday?' 'Candidate can't do Thursday.' We waste 3 days just agreeing on a 30-minute call slot. The client should drop their available slots the moment they shortlist a candidate."*

#### **2\. Step-by-Step Screen Journey & UI States**

1. **Trigger:** The client clicks \[ Shortlist for Interview \] in the Client Portal.  
2. **In-Line Calendar Popover:** A drawer slides up: *"Select 2–3 available time slots for Round 1 Interview"*.  
3. **Slot Selection:** Client interacts with a visual 7-day mini calendar picker. They click three time blocks (e.g., *Wed 14th Oct @ 3:00 PM*, *Thu 15th Oct @ 11:00 AM*, *Fri 16th Oct @ 4:00 PM*).  
4. **Interviewer Assignment:** Optional drop-down: *"Select Interviewer Name / Email"* (pre-filled with Hiring Manager details).  
5. **Dispatch:** Client hits \[ Confirm Shortlist & Send Slots \].  
6. **Candidate Dispatch:** System automatically routes these 3 options to the Candidate Experience Hub (Zone 3\) via automated WhatsApp message for 1-click candidate selection.

#### **3\. Explicit PostgreSQL Schema Specification**

SQL

\-- Proposed Interview Slots Table

CREATE TABLE proposed\_interview\_slots (

    slot\_id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

    submission\_id UUID NOT NULL REFERENCES candidate\_submissions(submission\_id) ON DELETE CASCADE,

    interviewer\_email VARCHAR(255) NOT NULL,

    start\_time TIMESTAMPTZ NOT NULL,

    end\_time TIMESTAMPTZ NOT NULL,

    slot\_status VARCHAR(20) DEFAULT 'Proposed', \-- 'Proposed', 'AcceptedByCandidate', 'Expired'

    created\_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE INDEX idx\_slots\_submission ON proposed\_interview\_slots(submission\_id);

#### **4\. Backend API Routes & Controller Logic**

* **HTTP Method & Endpoint:** POST /api/v1/public/portal/:token/submissions/:submission\_id/slots  
* **Request Payload:**  
* JSON

{

  "interviewer\_email": "alex@techcorp.com",

  "slots": \[

    { "start\_time": "2026-10-14T15:00:00Z", "end\_time": "2026-10-14T15:30:00Z" },

    { "start\_time": "2026-10-15T11:00:00Z", "end\_time": "2026-10-15T11:30:00Z" }

  \]

}

*   
*   
* **Controller Logic:**  
  1. Insert rows into proposed\_interview\_slots.  
  2. Update candidate\_submissions.client\_decision \= 'Shortlisted'.  
  3. **Trigger Event:** Call Zone 3 Candidate Messaging Dispatch API to send WhatsApp template to candidate containing 1-click slot selection buttons.

#### **5\. Edge Cases & Security Acceptance Criteria**

* **Timezone Standard:** All timestamps stored in database as TIMESTAMPTZ (UTC) and rendered on client/candidate UI using browser local timezone conversion.  
* **Past Time Validation:** API must reject any slot payload where start\_time \< NOW() \+ INTERVAL '12 hours'.

#### **6\. AI Wireframe Prompt**

Plaintext

Inline calendar UI component for scheduling interviews. Header reads 'Propose 3 Available Slots for Interview'. Displays a mini weekly calendar grid. User has selected 3 pill cards highlighted in yellow (\#FFD400): 'Wed, 14 Oct \- 3:00 PM', 'Thu, 15 Oct \- 11:00 AM', 'Fri, 16 Oct \- 4:00 PM'. Primary CTA button 'Send Slots to Candidate'. Enterprise clean design, subtle line borders.

### **FEATURE CF-04: Automated Client Chase Sequence & SLA Escalation**

*The "Client Nagging" Engine*

#### **1\. Real-World Recruitment Story**

> *"Clients leave candidate profiles sitting unread in their inbox for days. We hesitate to chase them manually because we don't want to sound unprofessional. The system should automatically send polite nudges on WhatsApp/Email on our behalf when feedback SLAs are breached."*

#### **2\. Step-by-Step Screen Journey & UI States**

1. **Background Tracking:** System tracks elapsed time since client\_portal\_tokens link was dispatched.  
2. **First Nudge (24 Hours \- Soft Reminder):** If CVs remain unreviewed after 24 hours, system sends automated WhatsApp to Hiring Manager: *"Hi Alex, 3 new profiles are waiting for your review for Senior Backend Lead. Click here to review: \[Magic\_Link\]"*.  
3. **Second Nudge (48 Hours \- SLA Alert):** If still unreviewed after 48 hours, system sends email \+ WhatsApp nudge emphasizing candidate drop-off risk: *"Hi Alex, candidates in this market go cold quickly. Quick 1-click feedback link: \[Magic\_Link\]"*.  
4. **Cockpit Escalation (72 Hours \- Breach):** If 72 hours elapse with no response, candidate card in Recruiter Cockpit glows red with badge \[CLIENT STALLED: 72h No Feedback\], and adds an urgent task to recruiter queue.

#### **3\. Explicit PostgreSQL Schema Specification**

SQL

\-- Client Reminder Log Table

CREATE TABLE client\_sla\_reminders (

    reminder\_id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

    token\_id UUID NOT NULL REFERENCES client\_portal\_tokens(token\_id) ON DELETE CASCADE,

    reminder\_level INT NOT NULL, \-- 1 \= 24h, 2 \= 48h, 3 \= 72h Escalation

    sent\_channel VARCHAR(20) NOT NULL, \-- 'WhatsApp', 'Email'

    sent\_at TIMESTAMPTZ DEFAULT NOW()

);

#### **4\. Backend API Routes & Controller Logic (Cron Background Worker)**

* **Execution Schedule:** Node-cron job running every 1 hour (0 \* \* \* \*).  
* **Cron Logic SQL:**  
* SQL

SELECT token\_id, client\_email, job\_id, created\_at 

FROM client\_portal\_tokens cpt

WHERE EXISTS (

    SELECT 1 FROM candidate\_submissions cs 

    WHERE cs.job\_id \= cpt.job\_id 

    AND cs.client\_decision \= 'Pending Review'

)

AND cpt.created\_at \< NOW() \- INTERVAL '24 hours';

*   
*   
* **Execution Flow:**  
  * If elapsed\_time \>= 24h AND reminder\_level 1 not sent $\\rightarrow$ Dispatch WABA Template \#1 $\\rightarrow$ Record in client\_sla\_reminders.  
  * If elapsed\_time \>= 72h $\\rightarrow$ Trigger Cockpit SLA Breach Alert $\\rightarrow$ Mark pipeline status as Client Breached.

#### **5\. Edge Cases & Security Acceptance Criteria**

* **Do Not Disturb (DND) Hours:** Automated WhatsApp nudges must *never* dispatch between 8:00 PM and 9:00 AM client local time. If cron triggers during DND, queue message for 9:05 AM next morning.  
* **Auto-Pause on Action:** The moment a client submits feedback on *any* candidate in the batch, cancel all queued pending reminders for that token batch.

#### **6\. AI Wireframe Prompt (WhatsApp Template Preview)**

Plaintext

Mobile screen view showing a WhatsApp Business message preview. Message header from 'RecruitOS Workspace'. Text reads 'Hi Alex, quick update on TechCorp's Senior Backend role. 3 shortlisted candidates are awaiting your review. Click below for 1-click review (No login required)'. Includes a direct WhatsApp link button 'Review Candidates Now'.

## **PART 3: ZONE 2 SUMMARY SPECIFICATION TABLE**

| Feature Code | Feature Name | Core Operational Problem Solved | Primary Technical Asset |
| :---- | :---- | :---- | :---- |
| **CF-01** | Zero-Login Magic Link Presenter | Hiring manager friction & login abandonment | SHA-256 Encrypted Magic Link URL |
| **CF-02** | One-Click Decision Matrix | Unexplained candidate rejections & slow feedback | Structured Rejection Reason Modal |
| **CF-03** | Asynchronous Interview Selector | Calendar ping-pong & scheduling delay | 3-Slot Visual Availability Selector |
| **CF-04** | Client SLA Chase Engine | Clients ignoring CVs & candidate pipeline freezing | Automated 24h/48h/72h Cron Reminders |

# 

## **ZONE 3: THE CANDIDATE EXPERIENCE HUB (The Engagement Loop & Prep)**

**Persona:** Job Candidate / Offered Candidate

**Core Purpose:** Eliminate candidate ghosting, notice-period drop-offs, and interview failures by automating slot confirmation, interview preparation kits, post-interview feedback, and low-friction notice-period pulse checks.

### **FEATURE CE-01: 1-Click WhatsApp Slot Confirmator**

*The Frictionless Calendar Locking Engine*

#### **1\. Real-World Recruitment Story**

> *"When a client gives us 3 available interview slots in Zone 2, we shouldn't spend 2 hours calling the candidate back and forth. The candidate should receive a WhatsApp message with direct options, tap one button, and have the interview locked in both calendar systems automatically."*

#### **2\. Step-by-Step Screen Journey & UI States**

1. **WhatsApp Dispatch:** The moment a client selects 3 proposed slots in Zone 2 (CF-03), the system dispatches an automated WhatsApp template to the candidate:  
   *"Hi \[Candidate\_First\_Name\], \[Company\_Name\] wants to interview you for \[Job\_Title\]\! Please select your preferred time slot: \[Magic\_Link\]"*  
2. **Mobile View Load (Zero Login):** Candidate taps link. Page loads in \< 1.0s on mobile browser with agency/company branding.  
3. **Slot Cards Display:** Displays 3 clean, mobile-optimized time cards showing date, time (converted to candidate’s local timezone), and interview format (*"Video Call via Google Meet"*).  
4. **1-Click Selection:** Candidate taps \[ Select Thursday, 15th Oct @ 11:00 AM \].  
5. **Confirmation & Calendar Sync:** Card shifts to green checked state. Screen displays:  
   * *"Interview Confirmed\!"*  
   * \[ Add to Google Calendar \] / \[ Download .ics \] buttons.  
   * Auto-generated Meeting Room link (Google Meet / Zoom URL).  
6. **System Notification:** Recruiter Cockpit and Client Portal receive real-time webhook updates: Interview Scheduled for 15th Oct @ 11:00 AM.

#### **3\. Explicit PostgreSQL Schema Specification**

SQL  
\-- Interview Schedule Table  
CREATE TABLE interview\_schedules (  
    interview\_id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    submission\_id UUID NOT NULL REFERENCES candidate\_submissions(submission\_id) ON DELETE CASCADE,  
    confirmed\_slot\_id UUID NOT NULL REFERENCES proposed\_interview\_slots(slot\_id),  
    meeting\_link VARCHAR(512),  
    calendar\_event\_id VARCHAR(255),  
    status VARCHAR(30) DEFAULT 'Scheduled', \-- 'Scheduled', 'Rescheduled', 'Completed', 'Cancelled', 'No Show'  
    confirmed\_at TIMESTAMPTZ DEFAULT NOW(),  
    updated\_at TIMESTAMPTZ DEFAULT NOW()  
);

CREATE INDEX idx\_interview\_submission ON interview\_schedules(submission\_id);

#### **4\. Backend API Routes & Controller Logic**

* **HTTP Method & Endpoint:** POST /api/v1/public/candidate/confirm-slot  
* **Request Payload:**  
* JSON

{  
  "token": "c8f92a1k-482a-candidate-token",  
  "selected\_slot\_id": "e4f81a9b-1234-4567-89ab-cdef01234567"  
}

*   
*   
* **Controller Logic:**  
  1. Validate candidate access token and check if selected\_slot\_id exists in proposed\_interview\_slots.  
  2. Verify slot\_status \== 'Proposed'. If already taken or expired, return 409 Conflict: *"This time slot is no longer available. Please request fresh slots."*  
  3. Update proposed\_interview\_slots.slot\_status \= 'AcceptedByCandidate'.  
  4. Create row in interview\_schedules and generate video meeting link via Google Meet / Zoom API integration.  
  5. Update candidate\_submissions.stage \= 'Interview Scheduled'.  
  6. **Webhook Trigger:** Dispatch WhatsApp confirmation template to both Hiring Manager and Candidate with calendar invite.

#### **5\. Edge Cases & Security Acceptance Criteria**

* **Slot Collision:** If candidate takes \> 24 hours to select a slot and the client revokes it, the UI gracefully renders a \[ Request New Slots \] button that sends a 1-click notification to the recruiter.  
* **Timezone Safety:** Backend strictly calculates timestamps using UTC (TIMESTAMPTZ). Mobile UI must auto-detect Intl.DateTimeFormat().resolvedOptions().timeZone and display local candidate time explicitly.

#### **6\. AI Wireframe Prompt (v0.dev / Claude Artifacts)**

Plaintext  
Mobile-first web UI screen for candidate interview slot selection. Top header shows 'TechCorp — Round 1 Video Interview'. Card text reads 'Hi Ankit, please select one slot that works best for you:'. Displays 3 full-width selectable radio cards: Card 1 'Wed, 14 Oct • 3:00 PM IST', Card 2 'Thu, 15 Oct • 11:00 AM IST' (Highlighted in yellow \#FFD400), Card 3 'Fri, 16 Oct • 4:00 PM IST'. Primary action button 'Confirm Interview Slot'. Clean, modern mobile layout.

### **FEATURE CE-02: Automated "Interview Prep Kit" Trigger**

*The Candidate Success Engine*

#### **1\. Real-World Recruitment Story**

> *"Candidates bomb interviews because they go in unprepared. They don't know the company's background, and they don't know how to answer behavioral questions (like the 'Orange Test' scenario). We spend hours coaching candidates on the phone. We need the system to send an automated interactive Prep Kit 24 hours before their interview."*

#### **2\. Step-by-Step Screen Journey & UI States**

1. **Trigger Event (T-24 Hours):** Exactly 24 hours before interview\_schedules.start\_time, system sends WhatsApp message:  
   *"Hi \[Candidate\_Name\], your interview with \[Company\_Name\] is in 24 hours\! Tap here to review your personalized Interview Prep Kit: \[Magic\_Link\]"*  
2. **Mobile Screen Load:** Candidate opens link. Top section shows countdown timer: Interview in: 23h 58m.  
3. **Tabbed Prep Sections:**  
   * **Tab 1: Company Intelligence:** 3 key bullet points on company background, recent news, and tech stack.  
   * **Tab 2: Role Expectations:** Key responsibilities and interview panel details (Interviewer name, LinkedIn link).  
   * **Tab 3: Behavioral & Soft-Skill Frameworks (e.g., Orange Test):** Common situational questions with response frameworks (e.g., *"Always ask 'Why' before providing a solution"*).  
4. **Acknowledgement:** Candidate clicks \[ I've Reviewed & Feel Ready\! \].  
5. **Recruiter Signal:** Cockpit feed logs: Ankit Sharma completed Interview Prep Kit (Status: Confirmed Ready).

#### **3\. Explicit PostgreSQL Schema Specification**

SQL  
\-- Job Prep Kit Templates Table  
CREATE TABLE job\_prep\_kits (  
    prep\_kit\_id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    job\_id UUID NOT NULL REFERENCES job\_mandates(job\_id) ON DELETE CASCADE,  
    company\_overview TEXT NOT NULL,  
    key\_tech\_stack TEXT\[\],  
    common\_questions JSONB NOT NULL, \-- Array of {"question": "...", "framework": "..."}  
    interviewer\_linkedin\_url VARCHAR(512),  
    created\_at TIMESTAMPTZ DEFAULT NOW()  
);

\-- Candidate Prep Audit Log  
CREATE TABLE candidate\_prep\_logs (  
    log\_id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    interview\_id UUID NOT NULL REFERENCES interview\_schedules(interview\_id) ON DELETE CASCADE,  
    candidate\_id UUID NOT NULL REFERENCES candidate\_records(candidate\_id),  
    accessed\_at TIMESTAMPTZ,  
    acknowledged\_ready BOOLEAN DEFAULT FALSE,  
    acknowledged\_at TIMESTAMPTZ  
);

#### **4\. Backend API Routes & Controller Logic**

* **HTTP Method & Endpoint:** GET /api/v1/public/candidate/prep-kit/:token  
* **Controller Logic:**  
  1. Validate Candidate Token and fetch interview\_id.  
  2. Query job\_prep\_kits WHERE job\_id \= interview.job\_id.  
  3. Log access event in candidate\_prep\_logs with accessed\_at \= NOW().  
  4. Return JSON payload containing sanitized company background, panel details, and question frameworks.  
* **HTTP Method & Endpoint:** POST /api/v1/public/candidate/prep-kit/:token/acknowledge  
* **Controller Logic:**  
  1. Set candidate\_prep\_logs.acknowledged\_ready \= TRUE and acknowledged\_at \= NOW().  
  2. Push notification to Recruiter Cockpit: Candidate Prepped & Confirmed.

#### **5\. Edge Cases & Security Acceptance Criteria**

* **Unacknowledged Alert:** If T-4 Hours before interview and acknowledged\_ready \== FALSE, send a high-priority SMS/WhatsApp reminder to the candidate and trigger a warning icon on the Recruiter Cockpit card.  
* **Late Scheduled Interviews:** If an interview is scheduled \< 24 hours in advance, trigger the Prep Kit dispatch immediately upon slot confirmation.

#### **6\. AI Wireframe Prompt**

Plaintext  
Mobile view of an 'Interview Preparation Kit'. Dark Navy header with countdown timer 'Interview in 18 Hours'. White card below titled 'TechCorp — Key Preparation Insights'. Includes 3 expandable accordions: '1. Company Overview & Products', '2. Behavioral Questions & Frameworks (e.g. Orange Test Response Guide)', '3. Interviewer Profile: Alex Smith (CTO)'. Sticky yellow button at bottom '\#FFD400' reading 'I Have Reviewed & I Am Ready'.

### **FEATURE CE-03: Post-Interview Candidate Feedback Collector**

*The Candidate Debrief Engine*

#### **1\. Real-World Recruitment Story**

> *"Right after an interview finishes, the recruiter needs to know how it went from the candidate's side before speaking to the client. Did the candidate find it too hard? Are they still interested? If we wait until the next day to ask, candidate memory fades and we go into client calls blind."*

#### **2\. Step-by-Step Screen Journey & UI States**

1. **Trigger Event (T+15 Mins Post Interview):** 15 minutes after interview\_schedules.end\_time, candidate receives automated WhatsApp ping:  
   *"Hi \[Candidate\_Name\], how did your interview with \[Company\_Name\] go? Share quick 30-second feedback here: \[Magic\_Link\]"*  
2. **Mobile Feedback Screen:** Loads a lightweight 3-question survey form:  
   * **Q1 (Rating):** *"How was your overall experience?"* (1 to 5 Stars).  
   * **Q2 (Interest Level):** *"Are you still interested in joining this company?"* Options: \[ 100% Excited\! \], \[ Have Some Doubts \], \[ No Longer Interested \].  
   * **Q3 (Questions Asked):** *"What key technical or salary topics were discussed?"* (Voice note recorder or short text input).  
3. **Submission & Recruiter Debrief Sync:** Candidate hits \[ Submit Debrief \].  
4. **Cockpit Feed Integration:** The candidate's response is appended instantly to the Recruiter’s Cockpit timeline. If candidate selects \[ Have Some Doubts \] or \[ No Longer Interested \], flag profile for **Immediate Recruiter Intervention**.

#### **3\. Explicit PostgreSQL Schema Specification**

SQL  
CREATE TYPE interest\_level\_enum AS ENUM (  
    'Extremely Interested',   
    'Neutral / Doubts',   
    'Not Interested'  
);

CREATE TABLE candidate\_interview\_feedback (  
    feedback\_id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    interview\_id UUID NOT NULL REFERENCES interview\_schedules(interview\_id) ON DELETE CASCADE,  
    candidate\_id UUID NOT NULL REFERENCES candidate\_records(candidate\_id),  
    rating INT CHECK (rating \>= 1 AND rating \<= 5),  
    interest\_level interest\_level\_enum NOT NULL,  
    debrief\_notes TEXT,  
    voice\_debrief\_url VARCHAR(512),  
    submitted\_at TIMESTAMPTZ DEFAULT NOW()  
);

#### **4\. Backend API Routes & Controller Logic**

* **HTTP Method & Endpoint:** POST /api/v1/public/candidate/interview-feedback  
* **Request Payload:**  
* JSON

{  
  "token": "candidate-token-1234",  
  "rating": 5,  
  "interest\_level": "Extremely Interested",  
  "debrief\_notes": "Interview went great. They asked about my AWS architecture experience."  
}

*   
*   
* **Controller Logic:**  
  1. Insert record into candidate\_interview\_feedback.  
  2. Update candidate\_submissions.stage \= 'Debrief Completed'.  
  3. **Conditional Logic:** If interest\_level \== 'Not Interested' OR rating \<= 2:  
     * Generate high-priority task in Recruiter Cockpit: \[ALERT: Candidate Ankit expressed low interest post-interview\].  
  4. Log feedback payload to candidate timeline.

#### **5\. Edge Cases & Security Acceptance Criteria**

* **Voice Note Upload Support:** Allow candidate to record a direct 30-second audio clip via browser MediaRecorder API, upload to S3 bucket, and render an inline audio player in the Recruiter Cockpit.

#### **6\. AI Wireframe Prompt**

Plaintext  
Mobile survey web screen titled 'Post-Interview Debrief'. Star rating component (5 stars selected). Radio selector cards for Interest Level: Option 1 '100% Excited to Join\!' (Selected in green), Option 2 'Have Some Doubts', Option 3 'Not Interested'. Text area placeholder 'Add quick notes or questions asked during the interview...'. Solid Navy button 'Submit Debrief'. Minimal, fast UI.

### **FEATURE CE-04: Passive Notice-Period Pulse & Counter-Offer Radar**

*The 90-Day Retention Safeguard*

#### **1\. Real-World Recruitment Story**

> *"During a 30 to 90-day notice period, candidates are at massive risk of accepting counter-offers or taking other job offers. We need a systematic, automated WhatsApp touchpoint every 14 days that asks low-friction questions to gauge their retention risk without sounding overbearing."*

#### **2\. Step-by-Step Screen Journey & UI States**

1. **Automated Cadence Schedule:** System schedules bi-weekly pulse checks across candidate’s notice period (e.g., Day 7, Day 15, Day 30, Day 45, Day 60).  
2. **WhatsApp Pulse Dispatch:** Candidate receives lightweight check-in ping:  
   *"Hi \[Candidate\_Name\], quick notice-period check-in\! Tap 1 button to update your resignation status: \[Magic\_Link\]"*  
3. **2-Click Mobile Survey:** Candidate opens link. Form displays 2 simple pulse questions:  
   * **Question 1:** *"Has your current employer offered a buyout or counter-offer to keep you?"* Buttons: \[ No Counter-Offer \], \[ Counter-Offer Made \- Need Advice \], \[ Declined Counter-Offer \].  
   * **Question 2:** *"How is your handover progressing?"* Buttons: \[ On Track \], \[ Minor Delay \], \[ Experiencing Issues \].  
4. **Document Proof Upload (Day 15 Milestone):** On Day 15, the pulse check prompts an optional document dropzone: *"Upload copy of official Resignation Acceptance Letter"*.  
5. **Cockpit Risk Updating:** Candidate selections automatically calculate and update Notice\_Period\_Tracker.risk\_level in Zone 1 (RC-05).

#### **3\. Explicit PostgreSQL Schema Specification**

SQL  
CREATE TABLE notice\_period\_pulse\_responses (  
    pulse\_id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    tracker\_id UUID NOT NULL REFERENCES notice\_period\_trackers(tracker\_id) ON DELETE CASCADE,  
    candidate\_id UUID NOT NULL REFERENCES candidate\_records(candidate\_id),  
    touchpoint\_day INT NOT NULL, \-- e.g., Day 7, Day 15, Day 30  
    counter\_offer\_status VARCHAR(50) NOT NULL, \-- 'None', 'Promised', 'Declined', 'Considering'  
    handover\_status VARCHAR(50) NOT NULL, \-- 'On Track', 'Delayed', 'Issues'  
    resignation\_proof\_url VARCHAR(512),  
    calculated\_risk\_level VARCHAR(20) NOT NULL, \-- 'Low', 'Medium', 'High'  
    submitted\_at TIMESTAMPTZ DEFAULT NOW()  
);

#### **4\. Backend API Routes & Controller Logic**

* **HTTP Method & Endpoint:** POST /api/v1/public/candidate/notice-pulse  
* **Request Payload:**  
* JSON

{  
  "token": "pulse-token-5678",  
  "touchpoint\_day": 15,  
  "counter\_offer\_status": "Considering",  
  "handover\_status": "On Track",  
  "resignation\_proof\_url": "https://s3.amazonaws.com/agency/resignation\_proof\_123.pdf"  
}

*   
*   
* **Controller Risk Logic:**  
* JavaScript

let riskLevel \= 'Low';  
if (req.body.counter\_offer\_status \=== 'Considering' || req.body.handover\_status \=== 'Issues') {  
    riskLevel \= 'High';  
} else if (req.body.counter\_offer\_status \=== 'Promised' || req.body.handover\_status \=== 'Delayed') {  
    riskLevel \= 'Medium';  
}

// Update Notice Period Tracker in Zone 1  
await db.query(  
    \`UPDATE notice\_period\_trackers   
     SET risk\_level \= $1, last\_touchpoint\_date \= NOW()   
     WHERE tracker\_id \= $2\`,  
    \[riskLevel, trackerId\]  
);

*   
* 

#### **5\. Edge Cases & Security Acceptance Criteria**

* **Fails to Respond (Dark Candidate):** If a candidate fails to open or complete a pulse check within 48 hours of dispatch, auto-escalate risk\_level \= 'High' in the Recruiter Cockpit and create an urgent task: \[DANGER: Candidate dark on Day 30 pulse check\].

#### **6\. AI Wireframe Prompt**

Plaintext  
Mobile web view titled 'Bi-Weekly Notice Period Pulse'. Card header reads 'Notice Period Update — Day 15 of 60'. Question 1: 'Has your current employer made a counter-offer?' 3 choice buttons: 'No Counter-Offer', 'Counter-Offer Made (Need Recruiter Advice)' (Highlighted in warning yellow \#FFD400), 'Declined Counter-Offer'. File upload zone 'Upload Resignation Acceptance Copy (PDF/Image)'. Action button 'Submit Update'. Modern mobile UI.

## **PART 3: ZONE 3 SUMMARY SPECIFICATION TABLE**

| Feature Code | Feature Name | Core Operational Problem Solved | Primary Technical Asset |
| :---- | :---- | :---- | :---- |
| **CE-01** | 1-Click Slot Confirmator | Candidate booking friction & scheduling delays | Mobile Slot Selection Page \+ Webhook Sync |
| **CE-02** | Interview Prep Kit Trigger | Candidate interview failures & lack of prep | Automated T-24h Prep Kit Page |
| **CE-03** | Post-Interview Feedback Collector | Unaware of candidate interest post-interview | T+15m Post-Interview 3-Question Survey |
| **CE-04** | Notice Period Counter-Offer Pulse | Candidate drop-offs during 30-90 day notice period | Bi-weekly Automated Pulse Check Engine |

# 

# 

## **ZONE 4: THE HR & COMPLIANCE ZONE (Post-Offer Handoff)**

**Persona:** Client HR Specialist / Agency Recruiter / Candidate

**Core Purpose:** Eliminate post-offer friction, manual document chasing, and probation billing disputes by automating compliance document collection, offer letter CTC verification, zero-touch HR handoffs, and 90-day guarantee tracking.

### **FEATURE HC-01: Automated Compliance Document Vault**

*The Pre-Onboarding Document Engine*

#### **1\. Real-World Recruitment Story**

> *"Once a candidate signs an offer letter, client HR requires 5 to 7 compliance documents (PAN card, Aadhaar/Passport, past 3 months' pay slips, relieving letters, educational certificates). Recruiters currently chase candidates manually over WhatsApp and email, receiving messy file attachments that get lost. We need an automated checklist where the candidate uploads everything directly into a clean vault."*

#### **2\. Step-by-Step Screen Journey & UI States**

1. **Trigger Event:** When a candidate's status moves to Offer Accepted in Zone 1 (Recruiter Cockpit), the system automatically dispatches a WhatsApp link to the candidate:  
   *"Congratulations \[Candidate\_Name\]\! Please upload your pre-onboarding compliance documents for \[Company\_Name\] here: \[Magic\_Link\]"*  
2. **Mobile Upload UI (Candidate Hub \- Zone 3):** Candidate opens link on phone. The screen displays an interactive checklist:  
   * 🟢 *Aadhaar / National ID* \[ Uploaded \]  
   * 🟡 *Past 3 Months Pay Slips* \[ Upload File \]  
   * 🔴 *Relieving / Experience Letter* \[ Pending \]  
3. **Upload & Auto-Validation:** Candidate taps \[ Upload File \], picks a PDF/JPG from mobile storage. System checks file size (\< 10MB) and format, auto-renames the document, and uploads it to cloud storage.  
4. **Interlinked Cockpit Alert:** As documents are uploaded, the candidate's card in the Recruiter Cockpit (Zone 1\) updates its compliance status: Document Vault: 4/5 Uploaded (80%).  
5. **Completion State:** Once all required files are present, the system marks the candidate as Compliance Cleared and notifies Client HR in Zone 2\.

#### **3\. Explicit PostgreSQL Schema Specification**

SQL  
CREATE TYPE doc\_type\_enum AS ENUM (  
    'National ID',   
    'PAN Card',   
    'Pay Slip',   
    'Relieving Letter',   
    'Degree Certificate',   
    'Offer Letter Signed'  
);

CREATE TYPE doc\_status\_enum AS ENUM (  
    'Pending',   
    'Uploaded',   
    'Verified',   
    'Rejected'  
);

CREATE TABLE candidate\_compliance\_docs (  
    doc\_id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    submission\_id UUID NOT NULL REFERENCES candidate\_submissions(submission\_id) ON DELETE CASCADE,  
    candidate\_id UUID NOT NULL REFERENCES candidate\_records(candidate\_id),  
    doc\_type doc\_type\_enum NOT NULL,  
    file\_url VARCHAR(512) NOT NULL,  
    file\_name VARCHAR(255) NOT NULL,  
    status doc\_status\_enum DEFAULT 'Uploaded',  
    rejection\_reason TEXT,  
    uploaded\_at TIMESTAMPTZ DEFAULT NOW(),  
    verified\_at TIMESTAMPTZ  
);

CREATE INDEX idx\_compliance\_submission ON candidate\_compliance\_docs(submission\_id);

#### **4\. Backend API Routes & Controller Logic**

* **HTTP Method & Endpoint:** POST /api/v1/public/candidate/compliance-doc  
* **Request Payload (Multipart Form Data):**  
  1. token: Candidate Access Token  
  2. doc\_type: "Pay Slip"  
  3. file: Binary File Object  
* **Controller Logic:**  
  1. Validate candidate access token.  
  2. Validate file MIME type (application/pdf, image/jpeg, image/png) and file size (\<= 10MB).  
  3. Upload binary file to AWS S3 / Supabase Storage with bucket path: agency\_id/candidates/candidate\_id/compliance/\[doc\_type\]\_\[timestamp\].pdf.  
  4. Upsert row into candidate\_compliance\_docs.  
  5. **Interlinked Update Trigger:** Query count of total required docs vs. uploaded docs. If all uploaded, update notice\_period\_trackers.compliance\_completed \= TRUE in Zone 1\.

#### **5\. Edge Cases & Security Acceptance Criteria**

* **Security Isolation:** Compliance documents contain sensitive PII (Pay Slips, National IDs). S3 URLs must be private and served only via signed temporary URLs (expiresIn \= 900s).  
* **Document Rejection:** If Client HR marks a document as "Rejected" (e.g., blurry scan), system automatically dispatches a WhatsApp nudge to the candidate specifying the exact rejection reason: *"Your Pay Slip upload was rejected because: File is blurry. Please re-upload here: \[Magic\_Link\]"*.

#### **6\. AI Wireframe Prompt (v0.dev / Claude Artifacts)**

Plaintext  
Mobile-first compliance document upload UI screen. Header reads 'TechCorp Onboarding — Document Checklist'. Shows 4 checklist items. Item 1 'National ID (Aadhaar/Passport)' has a green checkmark 'Uploaded'. Item 2 'Past 3 Months Pay Slips' has a yellow border with a button 'Upload PDF'. Item 3 'Relieving Letter' reads 'Pending'. Bottom progress bar reads 'Compliance Progress: 60% Complete'. Modern, clean mobile interface.

### **FEATURE HC-02: Offer Audit & CTC Verification Engine**

*The Placement Fee Guard*

#### **1\. Real-World Recruitment Story**

> *"Placement fees are calculated as a percentage of the candidate's final offered Cost-to-Company (CTC). Often, the verbal offer differs from the final signed written offer letter. If the recruiter doesn't verify the written CTC, they end up raising incorrect invoices in Zone 1, leading to billing disputes with Client HR."*

#### **2\. Step-by-Step Screen Journey & UI States**

1. **Offer Audit Modal (Zone 1 / Zone 2):** When a candidate reaches Offer Issued stage, a form drawer opens in the Recruiter Cockpit or Client HR Portal:  
   * **Field 1:** Offered Fixed CTC (₹)  
   * **Field 2:** Variable CTC / Performance Bonus (₹)  
   * **Field 3:** Joining Date (YYYY-MM-DD)  
   * **Field 4:** Upload Signed Offer Letter Copy (PDF)  
2. **Fee Auto-Calculation:** As values are typed, the engine auto-calculates placement fee based on client agreement terms (e.g., Fixed CTC ₹2,000,000 $\\times$ 8.33% Fee \= ₹166,600 \+ GST).  
3. **CTC Variance Warning:** If the offered CTC differs by more than 10% from the candidate's initial expected CTC recorded in Zone 1 (RC-02), display a warning banner:  
   \[NOTICE: Offered CTC ₹20L is below Candidate's Expected CTC ₹24L. High risk of counter-offer during notice period\].  
4. **Interlinked Financial Sync:** Upon clicking \[ Confirm & Save Offer Audit \], the calculated fee payload automatically populates the **Settlement Engine (RC-06)** in Zone 1 for auto-invoicing on Joining Day.

#### **3\. Explicit PostgreSQL Schema Specification**

SQL  
CREATE TABLE job\_offer\_audits (  
    audit\_id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    submission\_id UUID NOT NULL REFERENCES candidate\_submissions(submission\_id) ON DELETE CASCADE,  
    offered\_fixed\_ctc NUMERIC(12,2) NOT NULL,  
    offered\_variable\_ctc NUMERIC(12,2) DEFAULT 0.00,  
    total\_offered\_ctc NUMERIC(12,2) GENERATED ALWAYS AS (offered\_fixed\_ctc \+ offered\_variable\_ctc) STORED,  
    agreed\_fee\_percentage NUMERIC(5,2) NOT NULL,  
    calculated\_placement\_fee NUMERIC(12,2) NOT NULL,  
    joining\_date DATE NOT NULL,  
    signed\_offer\_url VARCHAR(512) NOT NULL,  
    verified\_by\_user\_id UUID NOT NULL,  
    created\_at TIMESTAMPTZ DEFAULT NOW()  
);

CREATE INDEX idx\_offer\_audit\_submission ON job\_offer\_audits(submission\_id);

#### **4\. Backend API Routes & Controller Logic**

* **HTTP Method & Endpoint:** POST /api/v1/offers/audit  
* **Request Payload:**  
* JSON

{  
  "submission\_id": "c8f92a1k-482a-submission-uuid",  
  "offered\_fixed\_ctc": 2000000,  
  "offered\_variable\_ctc": 200000,  
  "agreed\_fee\_percentage": 8.33,  
  "joining\_date": "2026-11-01",  
  "signed\_offer\_url": "https://s3.amazonaws.com/agency/offers/signed\_offer\_123.pdf"  
}

*   
*   
* **Controller Logic:**  
  1. Calculate calculated\_placement\_fee \= (offered\_fixed\_ctc \+ offered\_variable\_ctc) \* (agreed\_fee\_percentage / 100\).  
  2. Insert record into job\_offer\_audits.  
  3. Update candidate\_submissions.stage \= 'Offer Signed'.  
  4. **Interlinked Zone 1 Trigger:** Create or update row in notice\_period\_trackers (RC-05) setting joining\_date \= '2026-11-01'.  
  5. Pre-draft invoice in invoice\_records (RC-06) with amount \= calculated\_placement\_fee, status \= Draft (Pending Joining).

#### **5\. Edge Cases & Security Acceptance Criteria**

* **Audit Trail:** Signed offer letters are legal contracts. Any subsequent edits to offered\_fixed\_ctc after initial submission must append a row to offer\_audit\_logs tracking previous\_value, new\_value, user\_id, and reason\_for\_change.

#### **6\. AI Wireframe Prompt**

Plaintext  
Clean enterprise modal overlay for 'Offer Audit & Verification'. Top section displays candidate name 'Ankit Sharma' and role 'Backend Lead'. Input form fields: 'Offered Fixed CTC (₹)' set to '2,000,000', 'Agreed Fee Percentage' set to '8.33%'. Auto-calculated output box highlighted in light yellow (\#FEF08A) displays 'Calculated Placement Fee: ₹166,600 \+ GST'. File attachment card shows 'Signed\_Offer\_Ankit.pdf'. Action button 'Confirm & Save Offer Audit' in solid navy (\#0F172A).

### **FEATURE HC-03: Zero-Touch Client HR Handoff Portal**

*The Day-1 Onboarding Package*

#### **1\. Real-World Recruitment Story**

> *"On Day 1 of a candidate joining, Client HR needs the entire compliance file—signed offer letter, IDs, pay slips, and background details—transferred to them in one organized package. Right now, recruiters waste an hour zipping files and sending heavy email attachments. Client HR should get a zero-login 1-click download link."*

#### **2\. Step-by-Step Screen Journey & UI States**

1. **Day-1 Trigger Event:** When candidate's joining\_date \== TODAY(), the system dispatches a Magic Link email to Client HR:  
   *"Subject: Onboarding Vault Ready — \[Candidate\_Name\] joined TechCorp today\!"*  
2. **HR Portal View (Zero Login):** Client HR clicks the link. Page loads in browser displaying the **Candidate Onboarding Vault**:  
   * **Header:** Candidate Name, Role, Joining Date, Confirmed CTC.  
   * **Document Grid:** Cards for *Aadhaar/ID*, *Signed Offer*, *Past Pay Slips*, *Degree Certificates*.  
3. **1-Click Download:** HR clicks \[ Download Complete Onboarding Package (.ZIP) \]. System bundles all compliance files into a single zip archive.  
4. **HR Confirmation Button:** HR clicks \[ Confirm Candidate Joined Successfully \].  
5. **System-Wide Lifecycle Interlink:** Clicking this button automatically:  
   * Moves candidate status to Joined in Recruiter Cockpit (Zone 1).  
   * Dispatches Draft Invoice to Client Finance (RC-06).  
   * Starts the 90-Day Probation Guarantee Clock (HC-04).

#### **3\. Explicit PostgreSQL Schema Specification**

SQL  
CREATE TABLE client\_hr\_handoffs (  
    handoff\_id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    submission\_id UUID NOT NULL REFERENCES candidate\_submissions(submission\_id) ON DELETE CASCADE,  
    client\_hr\_email VARCHAR(255) NOT NULL,  
    access\_token\_hash VARCHAR(64) UNIQUE NOT NULL,  
    zip\_package\_url VARCHAR(512),  
    joining\_confirmed\_by\_hr BOOLEAN DEFAULT FALSE,  
    joining\_confirmed\_at TIMESTAMPTZ,  
    created\_at TIMESTAMPTZ DEFAULT NOW()  
);

#### **4\. Backend API Routes & Controller Logic**

* **HTTP Method & Endpoint:** GET /api/v1/public/hr-portal/:token/download-zip  
* **Controller Logic:**  
  1. Validate access\_token\_hash.  
  2. Fetch all verified compliance document URLs from candidate\_compliance\_docs WHERE submission\_id \= handoff.submission\_id.  
  3. Dynamic Zip Stream: Use Node.js archiver library to stream S3 files into a zip file \[Candidate\_Name\]\_Onboarding\_Package.zip directly to response.  
* **HTTP Method & Endpoint:** POST /api/v1/public/hr-portal/:token/confirm-joining  
* **Controller Logic:**  
  1. Update client\_hr\_handoffs.joining\_confirmed\_by\_hr \= TRUE and joining\_confirmed\_at \= NOW().  
  2. Update candidate\_submissions.stage \= 'Joined'.  
  3. **Interlinked Zone 1 Trigger:** Update invoice\_records.status \= 'Ready to Send' in RC-06.  
  4. **Interlinked HC-04 Trigger:** Create row in probation\_guarantee\_trackers setting expiry\_date \= NOW() \+ INTERVAL '90 days'.

#### **5\. Edge Cases & Security Acceptance Criteria**

* **Missing Documents Warning:** If HR opens the vault before candidate has uploaded 100% of required compliance documents, display a prominent warning banner: \[WARNING: 1 document still pending candidate upload\]. HR can still download partial zip.

#### **6\. AI Wireframe Prompt**

Plaintext  
Web dashboard view for Client HR. Title reads 'Onboarding Compliance Vault — Candidate: Ankit Sharma'. Top banner displays green success badge 'Joined TechCorp Today (1st Nov 2026)'. Grid below shows 5 verified document cards with download icons: 'National ID', 'Signed Offer Letter', 'Pay Slips (3 Months)', 'Degree Certificate'. Prominent CTA button 'Download Complete Zip Package'. Primary action button in bright yellow (\#FFD400) reading 'Confirm Candidate Joined Successfully'.

### **FEATURE HC-04: Probation Guarantee Clock & Milestone Tracker**

*The 90-Day Revenue Protection Engine*

#### **1\. Real-World Recruitment Story**

> *"Most recruitment agency contracts include a 60 to 90-day replacement guarantee. If a candidate quits during their 90-day probation, the recruiter must find a free replacement or refund the fee. Currently, recruiters celebrate on Day 1 and forget about the candidate. We need a system that tracks the 90-day probation window, schedules health check-ins, and alerts the recruiter if probation is completed safely."*

#### **2\. Step-by-Step Screen Journey & UI States**

1. **Activation:** The moment Client HR confirms joining in HC-03, a 90-day progress bar activates on the candidate's card in the Recruiter Cockpit (Zone 1).  
2. **Visual Countdown Bar:** Displays: Probation Progress: Day 24 of 90 (66 Days Remaining).  
3. **Automated Health Check Milestones:**  
   * **Day 30 Pulse Check:** System prompts recruiter to call candidate & Hiring Manager: *"How was month 1?"*  
   * **Day 60 Pulse Check:** Automated WhatsApp pulse sent to Candidate Hub: *"How is work at TechCorp going?"*  
4. **Day 80 Alert (Guarantee Expiry Approaching):** Cockpit surfaces alert: \[MILESTONE: Ankit Sharma's 90-day guarantee expires in 10 days. Send final check-in\].  
5. **Day 90 Completion Trigger:** Once Day 90 is reached without candidate resignation, status shifts to Probation Completed / Guarantee Fulfilled. The placement is permanently locked as **Risk-Free Revenue**.

#### **3\. Explicit PostgreSQL Schema Specification**

SQL  
CREATE TYPE probation\_status\_enum AS ENUM (  
    'Active Probation',   
    'Completed',   
    'Candidate Resigned',   
    'Terminated By Client'  
);

CREATE TABLE probation\_guarantee\_trackers (  
    guarantee\_id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    submission\_id UUID NOT NULL REFERENCES candidate\_submissions(submission\_id) ON DELETE CASCADE,  
    joining\_date DATE NOT NULL,  
    guarantee\_days INT DEFAULT 90,  
    expiry\_date DATE GENERATED ALWAYS AS (joining\_date \+ guarantee\_days) STORED,  
    status probation\_status\_enum DEFAULT 'Active Probation',  
    day\_30\_check\_completed BOOLEAN DEFAULT FALSE,  
    day\_60\_check\_completed BOOLEAN DEFAULT FALSE,  
    replacement\_triggered BOOLEAN DEFAULT FALSE,  
    created\_at TIMESTAMPTZ DEFAULT NOW()  
);

CREATE INDEX idx\_probation\_submission ON probation\_guarantee\_trackers(submission\_id);

#### **4\. Backend API Routes & Controller Logic (Cron Background Worker)**

* **Execution Schedule:** Daily Cron Job running at midnight (0 0 \* \* \*).  
* **Cron Logic SQL:**  
* SQL

\-- Check for probation completions  
UPDATE probation\_guarantee\_trackers  
SET status \= 'Completed'  
WHERE status \= 'Active Probation' AND expiry\_date \<= CURRENT\_DATE;

*   
*   
* **Early Resignation Handler Endpoint:** POST /api/v1/probation/breach  
  * **Payload:** { "submission\_id": "...", "reason": "Candidate quit on Day 42" }  
  * **Controller Logic:**  
    1. Update probation\_guarantee\_trackers.status \= 'Candidate Resigned'.  
    2. Set replacement\_triggered \= TRUE.  
    3. **Interlinked Zone 1 Trigger:** Auto-create a high-priority job mandate in Recruiter Cockpit titled \[REPLACEMENT MANDATE\] TechCorp — Senior Backend Lead (Free Replacement Required).

#### **5\. Edge Cases & Security Acceptance Criteria**

* **Replacement Guarantee Trigger:** If candidate quits during probation, the original invoice record in RC-06 is tagged Guarantee Credit Pending, preventing revenue reporting distortion.

#### **6\. AI Wireframe Prompt**

Plaintext  
UI card component for recruitment OS titled 'Probation Guarantee Tracker'. Displays candidate 'Ankit Sharma — TechCorp'. Horizontal progress bar filled to 75% displaying 'Day 68 of 90 (22 Days Remaining)'. Green badge reads 'Status: Active Probation / Health Score Good'. Milestone timeline markers show 'Day 30 Check (Passed)', 'Day 60 Pulse (Passed)', 'Day 90 Expiry (Upcoming \- 20th Jan 2027)'. Action button 'Log Candidate Check-in'. Deep navy accents, clean typography.

## **PART 3: ZONE 4 SUMMARY SPECIFICATION TABLE**

| Feature Code | Feature Name | Core Operational Problem Solved | Primary Technical Asset |
| :---- | :---- | :---- | :---- |
| **HC-01** | Automated Compliance Vault | Candidate pre-onboarding document chaos | Mobile Checklist Portal \+ Private S3 Vault |
| **HC-02** | Offer Audit & CTC Verification | Incorrect placement billing & CTC disputes | Offer CTC Fee Calculator \+ Variance Check |
| **HC-03** | Zero-Touch HR Handoff Portal | Piecemeal document sharing with Client HR | Magic Link HR Portal \+ 1-Click Zip Stream |
| **HC-04** | Probation Guarantee Tracker | Unmonitored 90-day guarantee replacement risks | 90-Day Countdown Engine \+ Auto-Replacement Trigger |

## **ZONE 5: THE PARTNER & VENDOR COLLABORATION NETWORK (Split-Fee Management)**

**Persona:** Agency Founder / Partner Recruiter (Freelance Sourcer)

**Core Purpose:** Eliminate candidate theft risks, duplicate submission arguments, and manual split-commission tracking by enabling anonymized job sharing, isolated partner candidate ingestion, automated duplicate arbitration, and interlinked split-fee ledger calculation.

### **FEATURE PO-01: Anonymized Mandate Sharing & Client Masking Vault**

*The Client Protection Engine*

#### **1\. Real-World Recruitment Story**

> *"When we have a big mandate that we can't fill alone, we collaborate with freelance sourcers or partner agencies. But if we email them our raw Job Description, it contains our client's name and hiring manager details. Unethical partners can easily bypass us, contact our client directly, and steal the deal. We need a way to share job requirements where client details are 100% masked."*

#### **2\. Step-by-Step Screen Journey & UI States**

1. **Share Action (Zone 1 Cockpit):** On any open job mandate in Zone 1, recruiter clicks \[ Share with Partner Network \].  
2. **Masking Configuration Modal:** A drawer slides open displaying auto-masked fields:  
   * **Actual Client Name:** TechCorp Dubai $\\rightarrow$ **Masked Public Title:** Leading Tier-1 E-Commerce Platform (Dubai)  
   * **Actual CTC Range:** ₹3,000,000 $\\rightarrow$ **Masked CTC Range:** Competitive / Market Standard  
   * **Split Agreement:** \[ 50% Agency / 50% Partner \] (Editable).  
   * **Partner Email Input:** partner@sourcers.com.  
3. **Magic Link Dispatch:** Clicking \[ Generate Encrypted Partner Link \] dispatches an automated Magic Link to the partner's email.  
4. **Partner View (Zero Login / Zero Client Exposure):** Partner opens link. Sees clean job description, key required skills, location, and split-fee terms. All mention of TechCorp or client contact info is programmatically stripped.

#### **3\. Explicit PostgreSQL Schema Specification**

SQL  
CREATE TABLE partner\_mandate\_shares (  
    share\_id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    agency\_id UUID NOT NULL REFERENCES agencies(agency\_id) ON DELETE CASCADE,  
    job\_id UUID NOT NULL REFERENCES job\_mandates(job\_id) ON DELETE CASCADE,  
    partner\_email VARCHAR(255) NOT NULL,  
    partner\_name VARCHAR(255),  
    masked\_job\_title VARCHAR(255) NOT NULL,  
    masked\_company\_description TEXT NOT NULL,  
    agency\_split\_percentage NUMERIC(5,2) DEFAULT 50.00,  
    partner\_split\_percentage NUMERIC(5,2) DEFAULT 50.00,  
    access\_token\_hash VARCHAR(64) UNIQUE NOT NULL,  
    expires\_at TIMESTAMPTZ NOT NULL,  
    is\_active BOOLEAN DEFAULT TRUE,  
    created\_at TIMESTAMPTZ DEFAULT NOW()  
);

CREATE INDEX idx\_partner\_token ON partner\_mandate\_shares(access\_token\_hash);

#### **4\. Backend API Routes & Controller Logic**

* **HTTP Method & Endpoint:** POST /api/v1/jobs/:job\_id/partner-share  
* **Request Payload:**  
* JSON

{  
  "partner\_email": "sourcer@freelance.com",  
  "masked\_job\_title": "Top Fintech Firm (Bangalore)",  
  "masked\_company\_description": "A funded fintech startup building UPI infrastructure.",  
  "partner\_split\_percentage": 50.00,  
  "expires\_in\_days": 30  
}

*   
*   
* **Controller Logic:**  
  1. Generate cryptographically secure token, store SHA-256 hash in partner\_mandate\_shares.  
  2. Sanitize raw job description string using regex pattern to strip URLs, @domain.com emails, and phone numbers.  
  3. Send dispatch email to partner\_email containing URL: https://app.recruiteros.com/partner-vault/:token.

#### **5\. Edge Cases & Security Acceptance Criteria**

* **Absolute Masking Enforcement:** Partner portal API response for GET /api/v1/public/partner/:token must *never* return client\_id, client\_name, billing\_address, or client\_hr\_email in the JSON payload, protecting against browser DevTools inspection.

#### **6\. AI Wireframe Prompt (v0.dev / Claude Artifacts)**

Plaintext  
Clean desktop web view for partner recruiter portal. Dark Navy header (\#0F172A) displays badge 'Partner Collaboration Network — Split Fee: 50/50'. Main card title reads 'Masked Mandate: Leading Tier-1 E-Commerce Platform (Dubai)'. Sections display 'Role: Senior Java Architect', 'Target Experience: 8-12 Years', 'Sanitized Job Description'. Right sidebar displays a resume upload card 'Submit Candidate for 50/50 Commission Split'. Minimalist, highly functional layout.

### **FEATURE PO-02: Isolated Partner Submission Vault**

*The Data Isolation Engine*

#### **1\. Real-World Recruitment Story**

> *"When a partner sourcer finds a candidate, they need a portal to upload the CV. But partners must NEVER see our main database, other candidates submitted by rival partners, or other client jobs. They should only see a submission confirmation and status updates for THEIR candidate."*

#### **2\. Step-by-Step Screen Journey & UI States**

1. **Partner CV Drop:** Partner opens their anonymized magic link (PO-01) on web or mobile.  
2. **Upload Form:** Partner enters Candidate Name, Email, Phone, Expected Salary, and drops candidate CV (PDF/DOCX).  
3. **Instant Duplicate Check (Interlinked PO-04):** System checks if candidate already exists in agency database. If clear, upload proceeds.  
4. **Partner Workspace View:** Once uploaded, partner view shows a restricted table displaying **ONLY** candidates submitted by their partner\_email:  
   * *Ankit Sharma* — Status: Submitted to Recruiter  
   * *Priya Verma* — Status: Client Interview Scheduled  
5. **Interlinked Cockpit Integration (Zone 1):** In the Recruiter Cockpit (Zone 1), the candidate card appears in the pipeline with a distinctive purple badge: \[PARTNER: Sourcer@freelance.com \- 50% Split\].

#### **3\. Explicit PostgreSQL Schema Specification**

SQL  
CREATE TABLE partner\_candidate\_submissions (  
    partner\_submission\_id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    share\_id UUID NOT NULL REFERENCES partner\_mandate\_shares(share\_id) ON DELETE CASCADE,  
    submission\_id UUID NOT NULL REFERENCES candidate\_submissions(submission\_id) ON DELETE CASCADE,  
    candidate\_id UUID NOT NULL REFERENCES candidate\_records(candidate\_id),  
    review\_status VARCHAR(30) DEFAULT 'Pending Agency Review', \-- 'Pending', 'Approved', 'Rejected'  
    agency\_review\_notes TEXT,  
    created\_at TIMESTAMPTZ DEFAULT NOW()  
);

CREATE INDEX idx\_partner\_sub\_share ON partner\_candidate\_submissions(share\_id);

#### **4\. Backend API Routes & Controller Logic**

* **HTTP Method & Endpoint:** POST /api/v1/public/partner/:token/submissions  
* **Request Payload (Multipart Form Data):**  
  1. candidate\_name: "Rohan Mehta"  
  2. email: "rohan@gmail.com"  
  3. phone: "+919876543210"  
  4. cv\_file: Binary Object  
* **Controller Logic:**  
  1. Validate access token. Execute duplicate check API (PO-04).  
  2. Parse CV binary using auto CV parser (RC-02 logic).  
  3. Insert row into candidate\_records and create base submission in candidate\_submissions setting source\_type \= 'Partner\_Network'.  
  4. Link submission in partner\_candidate\_submissions.  
  5. **Interlinked Zone 1 Trigger:** Push notification to Recruiter Cockpit feed: New Partner Candidate Submitted by \[Partner\_Email\] for \[Job\_Title\].

#### **5\. Edge Cases & Security Acceptance Criteria**

* **Multi-Tenant Isolation:** Database queries executed by a partner using token hash must strictly filter WHERE share\_id \= token.share\_id. Attempting to query submission\_id belonging to another partner must return 403 Forbidden.

#### **6\. AI Wireframe Prompt**

Plaintext  
Web UI screen showing partner recruiter's isolated dashboard. Header reads 'Partner Ingestion Vault — Shared Mandate \#842'. Form card on left allows uploading CV with fields 'Full Name', 'Email', 'Notice Period'. Table on right titled 'Your Submitted Candidates' displays 2 rows: 'Rohan Mehta' with purple badge 'Client Interview Scheduled', 'Siddharth Rao' with badge 'Under Agency Screening'. Clean, crisp visual design.

### **FEATURE PO-03: Automated Candidate Ownership & Duplicate Arbitrator**

*The Commission Dispute Prevention Engine*

#### **1\. Real-World Recruitment Story**

> *"A major headache in split-fee hiring is duplicate submissions. Partner A submits a CV today, but our in-house database already had that candidate 3 months ago. Or Partner A and Partner B submit the same candidate 2 hours apart. The system must automatically arbitrate candidate ownership based on hard rules so there are zero commission arguments later."*

#### **2\. Step-by-Step Screen Journey & UI States**

1. **Duplicate Test Event:** Partner attempts to submit Candidate *Vivek Kumar* (vivek@gmail.com / \+91-9811122233).  
2. **Rule Evaluation (Background Execution \< 200ms):**  
   * **Rule 1 (Active In-House Pipeline):** Candidate was submitted to *this specific client* within last 90 days by in-house team.  
     * *Outcome:* Submission Blocked. Red Banner: \[DUPLICATE BLOCKED: Candidate is currently active in the client's internal pipeline\].  
   * **Rule 2 (Stale In-House Database \> 180 Days):** Candidate exists in database, but has had zero activity for \> 180 days.  
     * *Outcome:* Submission Allowed. Partner is awarded 50% split ownership for re-engaging a cold lead.  
   * **Rule 3 (Partner vs. Partner \- First Touch Wins):** Partner A submitted Vivek at 10:00 AM. Partner B tries to submit Vivek at 11:30 AM for same job.  
     * *Outcome:* Partner B Blocked. Banner: \[DUPLICATE BLOCKED: Candidate was already submitted for this mandate by another partner\].  
3. **Arbitration Audit Log:** System generates a timestamped, unalterable ownership record visible to the agency founder.

#### **3\. Explicit PostgreSQL Schema Specification**

SQL  
CREATE TYPE arbitration\_result\_enum AS ENUM (  
    'Approved\_Unique',   
    'Approved\_Stale\_Lead\_Reactivated',   
    'Blocked\_Active\_InHouse\_Candidate',   
    'Blocked\_Prior\_Partner\_Submission'  
);

CREATE TABLE candidate\_ownership\_arbitrations (  
    arbitration\_id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    job\_id UUID NOT NULL REFERENCES job\_mandates(job\_id) ON DELETE CASCADE,  
    candidate\_email VARCHAR(255) NOT NULL,  
    candidate\_phone VARCHAR(50) NOT NULL,  
    submitting\_partner\_share\_id UUID REFERENCES partner\_mandate\_shares(share\_id),  
    arbitration\_result arbitration\_result\_enum NOT NULL,  
    matched\_existing\_submission\_id UUID REFERENCES candidate\_submissions(submission\_id),  
    time\_difference\_seconds INT,  
    created\_at TIMESTAMPTZ DEFAULT NOW()  
);

CREATE INDEX idx\_arbitration\_lookup ON candidate\_ownership\_arbitrations(candidate\_email, candidate\_phone);

#### **4\. Backend API Routes & Controller Logic**

* **Execution Function (Internal Service):** arbitrateCandidateOwnership(jobId, email, phone, shareId)  
* **Controller Logic Sequence:**  
* JavaScript

// 1\. Check for Partner vs Partner First Touch for THIS job  
const existingPartnerSub \= await db.query(  
  \`SELECT submission\_id, created\_at FROM candidate\_submissions   
   WHERE job\_id \= $1 AND (candidate\_email \= $2 OR candidate\_phone \= $3)   
   AND stage \!= 'Rejected' LIMIT 1\`,  
  \[jobId, email, phone\]  
);

if (existingPartnerSub.rows.length \> 0\) {  
  // Block \- Prior Submission Exists  
  return { status: 'BLOCKED', reason: 'Blocked\_Prior\_Partner\_Submission' };  
}

// 2\. Check for In-House Activity Window (90 Days)  
const inHouseActivity \= await db.query(  
  \`SELECT last\_activity\_at FROM candidate\_records   
   WHERE email \= $1 AND last\_activity\_at \> NOW() \- INTERVAL '90 days'\`,  
  \[email\]  
);

if (inHouseActivity.rows.length \> 0\) {  
  return { status: 'BLOCKED', reason: 'Blocked\_Active\_InHouse\_Candidate' };  
}

// 3\. Passed All Checks \-\> Award Ownership to Partner  
return { status: 'APPROVED', reason: 'Approved\_Unique' };

*   
* 

#### **5\. Edge Cases & Security Acceptance Criteria**

* **Normalizing Phone & Email:** Phone numbers must be stripped of spaces, dashes, and country codes before matching (e.g., \+91 98765-43210 $\\rightarrow$ 9876543210). Emails must be lowercased and whitespace-trimmed.

#### **6\. AI Wireframe Prompt**

Plaintext  
System notification modal for partner submission error. Header displays alert icon 'Submission Ownership Check'. Card body displays red warning message 'Duplicate Blocked: This candidate (vivek@gmail.com) was already submitted for this specific mandate 2 hours ago by another partner. First-touch attribution policy applied.' Neutral dark navy background, clean alert UI styling.

### **FEATURE PO-04: Split-Fee Ledger & Auto-Settlement Interlink**

*The Automated Partner Payout Engine*

#### **1\. Real-World Recruitment Story**

> *"When a partner's candidate gets placed, calculating who gets paid what is done on manual spreadsheets. If the total client fee is ₹2,000,000 and the split is 50/50, the agency gets ₹1,000,000 and the partner gets ₹1,000,000. When the invoice is raised in Zone 1, the system must automatically create a Partner Payable Voucher linked to the candidate's joining date."*

#### **2\. Step-by-Step Screen Journey & UI States**

1. **Milestone Trigger (Zone 4 Interlink):** Candidate *Rohan Mehta* (submitted by partner sourcer@freelance.com under 50% split) joins the client company. Client HR confirms joining in Zone 4 (HC-03).  
2. **Auto-Ledger Split Calculation:** The system reads the total placement fee from Zone 4 (HC-02) (e.g., Total CTC ₹20,000,000 $\\times$ 8.33% \= Total Fee ₹1,666,000).  
3. **Dual Record Creation in Zone 1 (RC-06):**  
   * **Record 1 (Client Receivables Invoice):** Bill TechCorp for ₹1,666,000 \+ GST.  
   * **Record 2 (Partner Payable Voucher):** Payable to sourcer@freelance.com for ₹833,000 (50% Split).  
4. **Partner Dashboard View (Zone 5):** Partner opens their vault link. Their financial tab displays:  
   * *Rohan Mehta Placement* — Total Split: ₹833,000 | Payout Status: Pending Client Fee Collection.  
5. **Collection Sync:** When the agency marks the Client Invoice as "Paid" in Zone 1 (RC-06), the system automatically updates the Partner's Payable status to \[ Ready for Payout \] and dispatches a notification to the partner.

#### **3\. Explicit PostgreSQL Schema Specification**

SQL  
CREATE TYPE partner\_payout\_status\_enum AS ENUM (  
    'Pending Candidate Joining',   
    'Awaiting Client Payment',   
    'Ready for Payout',   
    'Paid',   
    'Cancelled Guarantee Quitted'  
);

CREATE TABLE partner\_split\_ledgers (  
    ledger\_id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    submission\_id UUID NOT NULL REFERENCES candidate\_submissions(submission\_id) ON DELETE CASCADE,  
    share\_id UUID NOT NULL REFERENCES partner\_mandate\_shares(share\_id),  
    total\_placement\_fee NUMERIC(12,2) NOT NULL,  
    agency\_share\_amount NUMERIC(12,2) NOT NULL,  
    partner\_share\_amount NUMERIC(12,2) NOT NULL,  
    payout\_status partner\_payout\_status\_enum DEFAULT 'Pending Candidate Joining',  
    partner\_invoice\_number VARCHAR(100),  
    paid\_at TIMESTAMPTZ,  
    created\_at TIMESTAMPTZ DEFAULT NOW()  
);

CREATE INDEX idx\_partner\_ledger\_sub ON partner\_split\_ledgers(submission\_id);

#### **4\. Backend API Routes & Controller Logic**

* **Trigger Function (Interlinked from Zone 4 HC-03):** Called when Client HR clicks Confirm Joining.  
* **Controller Logic:**  
* JavaScript

// 1\. Check if submission is from a Partner Split  
const partnerSub \= await db.query(  
  \`SELECT share\_id FROM partner\_candidate\_submissions WHERE submission\_id \= $1\`,  
  \[submissionId\]  
);

if (partnerSub.rows.length \> 0\) {  
  const share \= await db.query(  
    \`SELECT partner\_split\_percentage, agency\_split\_percentage FROM partner\_mandate\_shares WHERE share\_id \= $1\`,  
    \[partnerSub.rows\[0\].share\_id\]  
  );

  const totalFee \= offerAudit.calculated\_placement\_fee;  
  const partnerAmount \= totalFee \* (share.rows\[0\].partner\_split\_percentage / 100);  
  const agencyAmount \= totalFee \- partnerAmount;

  // Insert into Split Ledger  
  await db.query(  
    \`INSERT INTO partner\_split\_ledgers   
     (submission\_id, share\_id, total\_placement\_fee, agency\_share\_amount, partner\_share\_amount, payout\_status)  
     VALUES ($1, $2, $3, $4, $5, 'Awaiting Client Payment')\`,  
    \[submissionId, partnerSub.rows\[0\].share\_id, totalFee, agencyAmount, partnerAmount\]  
  );  
}

*   
* 

#### **5\. Edge Cases & Security Acceptance Criteria**

* **Probation Guarantee Interlink (HC-04):** If candidate quits during 90-day probation and triggers a free replacement, update partner\_split\_ledgers.payout\_status \= 'Cancelled Guarantee Quitted', freezing the partner payout until a replacement candidate is successfully placed.

#### **6\. AI Wireframe Prompt**

Plaintext  
Partner financial dashboard UI component titled 'Split-Fee Commission Ledger'. Summary cards at top show 'Total Placements: 1', 'Earned Commissions: ₹833,000', 'Status: Awaiting Client Fee Collection'. Table row displays candidate 'Rohan Mehta — TechCorp', Total Fee '₹1,666,000', Your 50% Share '₹833,000', Payout Status badge in yellow 'Awaiting Client Payment'. Modern, enterprise financial UI.

## **PART 3: ZONE 5 SUMMARY SPECIFICATION TABLE**

| Feature Code | Feature Name | Core Operational Problem Solved | Primary Technical Asset |
| :---- | :---- | :---- | :---- |
| **PO-01** | Anonymized Mandate Vault | Partners bypassing agencies to steal clients | Encrypted Token Link \+ Regex Client Masking |
| **PO-02** | Isolated Partner Vault | Partner data leaks & multi-tenant security risks | Restricted Partner Workspace Query Isolation |
| **PO-03** | Automated Duplicate Arbitrator | Dispute over candidate ownership & commissions | 200ms Duplicate Rule Arbitration Service |
| **PO-04** | Split-Fee Ledger Engine | Manual commission calculations & delayed payouts | Dual Invoicing Interlink \+ Split Fee Ledger |

## **ZONE 6: THE AGENCY STOREFRONT (Inbound Lead Generation)**

**Persona:** Prospective Hiring Client / Job Seeker / Agency Founder

**Core Purpose:** Eliminate zero-website credibility gaps and manual lead intake friction by providing a zero-maintenance public storefront, self-serve client mandate intake, an anonymized "Hot Talent" showcase, and automated lead ingestion into the Recruiter Cockpit (Zone 1).

### **FEATURE AS-01: Public Agency Storefront & Branded Engine**

*The Digital Credibility Surface*

#### **1\. Real-World Recruitment Story**

> *"I don't have a website. All my business comes through word of mouth or my personal reputation. But when new prospective clients want to see what we do, or when candidates look us up, we have zero digital presence. We need a clean, auto-generated public web page that acts as our professional agency storefront without needing a web developer."*

#### **2\. Step-by-Step Screen Journey & UI States**

1. **Subdomain Provisioning:** When an agency sets up RecruitOS in Zone 1, the system automatically assigns a public domain (e.g., https://apexrecruitment.recruiteros.com or custom CNAME https://careers.apexrecruitment.com).  
2. **Public Layout:** Visitor loads the page in \< 1.0s.  
   * **Header:** Agency Logo, Founder Bio, Core Specialization Badges (*"Executive Search • Tech & Gulf Relocations"*).  
   * **Hero CTA 1 (For Employers):** \[ Submit a Hiring Mandate \]  
   * **Hero CTA 2 (For Candidates):** \[ Join Talent Network / Drop Resume \]  
   * **Live Stats Bar:** Auto-calculated performance metrics (*"140+ Placements Completed | 72h Average Shortlist SLA | 98% Probation Completion"*).  
3. **Cockpit Settings Interlink (Zone 1):** Recruiter controls public visibility, brand colors, logo, and featured metrics directly from an Agency\_Profile tab in the Recruiter Cockpit.

#### **3\. Explicit PostgreSQL Schema Specification**

SQL  
CREATE TABLE agency\_storefront\_profiles (  
    storefront\_id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    agency\_id UUID UNIQUE NOT NULL REFERENCES agencies(agency\_id) ON DELETE CASCADE,  
    subdomain VARCHAR(100) UNIQUE NOT NULL,  
    custom\_domain VARCHAR(255) UNIQUE,  
    brand\_logo\_url VARCHAR(512),  
    primary\_color VARCHAR(7) DEFAULT '\#0F172A',  
    accent\_color VARCHAR(7) DEFAULT '\#FFD400',  
    hero\_headline VARCHAR(255) NOT NULL DEFAULT 'Bespoke Executive Search & Talent Infrastructure',  
    about\_text TEXT,  
    featured\_specializations TEXT\[\], \-- \['Fintech', 'Gulf Relocations', 'Executive Leadership'\]  
    show\_metrics\_bar BOOLEAN DEFAULT TRUE,  
    is\_published BOOLEAN DEFAULT TRUE,  
    created\_at TIMESTAMPTZ DEFAULT NOW(),  
    updated\_at TIMESTAMPTZ DEFAULT NOW()  
);

CREATE INDEX idx\_storefront\_subdomain ON agency\_storefront\_profiles(subdomain);

#### **4\. Backend API Routes & Controller Logic**

* **HTTP Method & Endpoint:** GET /api/v1/public/storefront/:subdomain  
* **Controller Logic:**  
  1. Query agency\_storefront\_profiles WHERE subdomain \= params.subdomain AND is\_published \= TRUE.  
  2. If not found, check custom\_domain. Return 404 Not Found if unpublished.  
  3. Query job\_mandates aggregate count WHERE agency\_id \= profile.agency\_id AND status \= 'Joined' to populate verified placement metrics.  
  4. Return sanitized public JSON schema containing agency brand assets, public active mandates, and public talent showcases.

#### **5\. Edge Cases & Security Acceptance Criteria**

* **XSS & Injection Protection:** about\_text and custom text inputs must be sanitized on ingestion to strip raw \<script\> tags or malicious HTML before rendering on the public storefront.

#### **6\. AI Wireframe Prompt (v0.dev / Claude Artifacts)**

Plaintext  
Public agency homepage microsite UI. Top navigation bar shows logo 'Apex Recruitment Partners' and CTA button 'Submit Hiring Requirement' in yellow (\#FFD400). Hero section displays headline 'Premier Executive Search for Gulf & Emerging Markets'. Performance metrics bar below shows 3 stats: '140+ Placements', '72h Average Shortlist SLA', '98% Retention Rate'. Deep Navy accents, generous whitespace, Linear/Stripe-inspired premium aesthetic.

### **FEATURE AS-02: Self-Serve Client Mandate Ingestion Engine**

*The "Swiggy-Style" Job Order Intake*

#### **1\. Real-World Recruitment Story**

> *"She described wanting a 'Swiggy-like app' where employers can order a recruiter or submit a hiring requirement directly online. Right now, new clients email or text messy requirements over WhatsApp. We need a self-serve intake form where new clients drop job details, agree to retainer/fee terms, and trigger an active mandate in our Cockpit."*

#### **2\. Step-by-Step Screen Journey & UI States**

1. **Public Intake Trigger:** Prospective client clicks \[ Submit a Hiring Mandate \] on the Storefront (AS-01).  
2. **Interactive 4-Step Wizard:**  
   * **Step 1 (Company Details):** Company Name, HR Contact Name, Email, Phone, Work Location.  
   * **Step 2 (Role Specifications):** Job Title, Department, Key Required Skills (Tags), Target CTC Range, Required Notice Period.  
   * **Step 3 (Terms Selection):** Select Agreement Type: \[ Standard Contingency (8.33%) \] or \[ Priority Retainer (5% Upfront \+ 5% Success) \].  
   * **Step 4 (Document Attachment):** Drop raw internal Job Description PDF/DOCX (Optional).  
3. **Submission Confirmation:** Client hits \[ Submit Mandate to Apex Recruitment \]. Screen displays: *"Mandate Received\! A Senior Systems Recruiter will confirm intake within 4 hours."*  
4. **Interlinked Zone 1 Cockpit Ingestion:** The submission instantly creates an unassigned job mandate in the Recruiter Cockpit (Zone 1\) with an alert badge: \[NEW INBOUND CLIENT MANDATE: TechCorp — Sr Backend Lead\].

#### **3\. Explicit PostgreSQL Schema Specification**

SQL  
CREATE TYPE inbound\_mandate\_status\_enum AS ENUM (  
    'Pending Agency Review',   
    'Accepted Mandate',   
    'Declined Terms Mismatch'  
);

CREATE TABLE inbound\_client\_mandates (  
    inbound\_id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    agency\_id UUID NOT NULL REFERENCES agencies(agency\_id) ON DELETE CASCADE,  
    company\_name VARCHAR(255) NOT NULL,  
    contact\_name VARCHAR(255) NOT NULL,  
    contact\_email VARCHAR(255) NOT NULL,  
    contact\_phone VARCHAR(50) NOT NULL,  
    job\_title VARCHAR(255) NOT NULL,  
    target\_location VARCHAR(255) NOT NULL,  
    min\_budget NUMERIC(12,2),  
    max\_budget NUMERIC(12,2),  
    selected\_term\_type VARCHAR(50) DEFAULT 'Standard Contingency',  
    raw\_jd\_url VARCHAR(512),  
    status inbound\_mandate\_status\_enum DEFAULT 'Pending Agency Review',  
    converted\_job\_id UUID REFERENCES job\_mandates(job\_id),  
    created\_at TIMESTAMPTZ DEFAULT NOW()  
);

CREATE INDEX idx\_inbound\_agency ON inbound\_client\_mandates(agency\_id);

#### **4\. Backend API Routes & Controller Logic**

* **HTTP Method & Endpoint:** POST /api/v1/public/storefront/:subdomain/submit-mandate  
* **Request Payload:**  
* JSON

{  
  "company\_name": "Apex Cloud Labs",  
  "contact\_name": "Rahul Verma",  
  "contact\_email": "rahul@apexcloud.io",  
  "contact\_phone": "+919876543210",  
  "job\_title": "Lead DevOps Architect",  
  "target\_location": "Bangalore / Remote",  
  "min\_budget": 2500000,  
  "max\_budget": 3500000,  
  "selected\_term\_type": "Priority Retainer"  
}

*   
*   
* **Controller Logic:**  
  1. Lookup agency\_id from subdomain.  
  2. Insert record into inbound\_client\_mandates.  
  3. Check if client company or contact exists in clients table; link if existing.  
  4. **Interlinked Zone 1 Trigger:** Create low-priority draft row in job\_mandates with status Unreviewed Inbound.  
  5. Dispatch Webhook / WABA notification to Recruiter: *"New Inbound Job Lead from Apex Cloud Labs (Role: Lead DevOps Architect)"*.

#### **5\. Edge Cases & Security Acceptance Criteria**

* **Spam & Bot Mitigation:** Inbound client intake API must enforce Google Cloud reCAPTCHA v3 score verification (score \>= 0.5) and IP rate limiting (Max 3 mandate submissions per IP per hour).

#### **6\. AI Wireframe Prompt**

Plaintext  
Multi-step web form wizard for client hiring requirement submission. Header reads 'Submit Hiring Mandate — Apex Recruitment'. Step indicators at top: '1. Contact Info', '2. Role Specs' (Active), '3. Agreement Terms'. Form fields show 'Job Title' input 'Lead DevOps Architect', 'Location' input 'Bangalore', 'Target CTC Range' slider '$30k \- $45k'. Primary yellow CTA button '\#FFD400' reading 'Next: Select Terms'. Enterprise minimalist aesthetic.

### **FEATURE AS-03: "Hot Talent Showcase" & Candidate Teaser Gallery**

*The Passive Inbound Lead Generator*

#### **1\. Real-World Recruitment Story**

> *"Recruiters often have 3 or 4 exceptional, pre-vetted 'silver medalist' candidates sitting in their database in Zone 1 (RC-07). Instead of letting that data sit idle, we should showcase anonymized summaries of these top candidates on our Storefront. When prospective employers visit our site and see 'Ex-Amazon Senior Java Lead (30 Days Notice Available)', they click a button to request an interview, creating a fresh client lead\!"*

#### **2\. Step-by-Step Screen Journey & UI States**

1. **Feature Toggle in Zone 1 (RC-07):** In the Recruiter Cockpit, recruiter hovers over candidate *Ankit Sharma's* profile card and clicks \[ Feature on Storefront \].  
2. **Auto-Sanitization:** System generates an anonymized teaser card stripping candidate's name, phone, email, and exact company name:  
   * **Teaser Title:** Senior Java & AWS Specialist  
   * **Highlights:** 8 Yrs Exp • Ex-Tier 1 E-Commerce • Notice: 30 Days • Location: Dubai/Remote  
   * **Executive Teaser Note:** *"Cleared 3 interview rounds for top fintech firm. Exceptional system design capabilities."*  
3. **Storefront Gallery View (AS-01):** Candidate teaser card renders in the public **Featured Pre-Vetted Talent** section on the Agency Storefront.  
4. **Employer Lead Capture:** Visitor clicks \[ Request Candidate Profile & Interview \].  
5. **In-Line Modal:** Visitor enters Work Email and Company Name.  
6. **Interlinked Cockpit Notification (Zone 1):** System creates an inbound client lead in Zone 1: \[INBOUND LEAD: TechCorp requested profile of Senior Java Specialist \#C-842\].

#### **3\. Explicit PostgreSQL Schema Specification**

SQL  
CREATE TABLE storefront\_talent\_showcases (  
    showcase\_id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    agency\_id UUID NOT NULL REFERENCES agencies(agency\_id) ON DELETE CASCADE,  
    candidate\_id UUID NOT NULL REFERENCES candidate\_records(candidate\_id) ON DELETE CASCADE,  
    sanitized\_headline VARCHAR(255) NOT NULL, \-- e.g. 'Senior Java & AWS Specialist'  
    experience\_years NUMERIC(3,1) NOT NULL,  
    notice\_period\_days INT NOT NULL,  
    sanitized\_summary TEXT NOT NULL,  
    skills\_tags TEXT\[\] NOT NULL,  
    is\_active BOOLEAN DEFAULT TRUE,  
    inbound\_requests\_count INT DEFAULT 0,  
    created\_at TIMESTAMPTZ DEFAULT NOW()  
);

CREATE INDEX idx\_showcase\_agency ON storefront\_talent\_showcases(agency\_id);

#### **4\. Backend API Routes & Controller Logic**

* **HTTP Method & Endpoint:** POST /api/v1/public/storefront/:subdomain/request-talent  
* **Request Payload:**  
* JSON

{  
  "showcase\_id": "e4f81a9b-showcase-uuid",  
  "employer\_name": "Karan Kapoor",  
  "employer\_email": "karan@swiggy.in",  
  "company\_name": "Swiggy",  
  "phone": "+919811122233"  
}

*   
*   
* **Controller Logic:**  
  1. Insert request into inbound\_client\_mandates marked as Source: Talent\_Showcase\_Inquiry.  
  2. Increment storefront\_talent\_showcases.inbound\_requests\_count.  
  3. **Interlinked Zone 1 Trigger:** Create task in Recruiter Cockpit: \[HOT LEAD: Swiggy requested Candidate \#C-842 (Senior Java Specialist)\].  
  4. Auto-dispatch WhatsApp confirmation to recruiter and email acknowledgement to employer.

#### **5\. Edge Cases & Security Acceptance Criteria**

* **Anonymity Guarantee:** The public API response for GET /api/v1/public/storefront/:subdomain/talent must strictly exclude candidate\_id, full\_name, email, phone, and raw\_cv\_url to prevent external scraping or candidate poaching.

#### **6\. AI Wireframe Prompt**

Plaintext  
Public talent gallery grid on an agency website. Section title 'Pre-Vetted Executive Talent Available'. Shows 3 candidate teaser cards. Card 1 displays title 'Senior Java & AWS Architect', tags \['Java', 'AWS', 'System Design'\], experience '8 Years', notice period '30 Days'. Brief bio snippet below. Primary CTA button in yellow (\#FFD400) reading 'Request Full Candidate Profile'. Clean layout.

### **FEATURE AS-04: Candidate Self-Serve Application Portal**

*The Inbound Talent Magnet*

#### **1\. Real-World Recruitment Story**

> *"Candidates who visit our website or social media profiles should be able to submit their resume directly into our database without emailing us. The system should parse their CV, run duplicate checks, and drop them directly into our Candidate Graveyard / Recycler (RC-07) in Zone 1."*

#### **2\. Step-by-Step Screen Journey & UI States**

1. **Public Candidate Action:** Candidate clicks \[ Join Talent Network / Drop Resume \] on the Agency Storefront (AS-01).  
2. **Minimalist Mobile-Friendly Modal:** Form requests: Full Name, Email, Phone, Desired Role, Expected Salary, Notice Period, File Upload Dropzone (PDF/DOCX).  
3. **Drop & Auto-Parse (Interlinked RC-02):** Candidate drops resume. Backend parser (RC-02 logic) extracts skills, work history, and contact details.  
4. **Duplicate Arbitration (Interlinked PO-03):** System checks if candidate exists by phone/email. If existing, update last\_active\_at timestamp rather than creating duplicate.  
5. **Confirmation & Candidate Hub Link (Zone 3):** Screen displays: *"Application Received\! We have added you to our active talent database."*  
6. **Interlinked Cockpit Integration (Zone 1):** Candidate profile appears in Zone 1 Cockpit under Inbound Talent Pool with tag Source: Storefront\_Direct.

#### **3\. Explicit PostgreSQL Schema Specification**

SQL  
\-- Direct Candidate Applications Log Table  
CREATE TABLE storefront\_candidate\_applications (  
    application\_id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    agency\_id UUID NOT NULL REFERENCES agencies(agency\_id) ON DELETE CASCADE,  
    candidate\_id UUID NOT NULL REFERENCES candidate\_records(candidate\_id),  
    source\_channel VARCHAR(50) DEFAULT 'Storefront\_Direct',  
    parsed\_successfully BOOLEAN DEFAULT TRUE,  
    created\_at TIMESTAMPTZ DEFAULT NOW()  
);

CREATE INDEX idx\_storefront\_candidate\_agency ON storefront\_candidate\_applications(agency\_id);

#### **4\. Backend API Routes & Controller Logic**

* **HTTP Method & Endpoint:** POST /api/v1/public/storefront/:subdomain/apply  
* **Request Payload (Multipart Form Data):**  
  1. full\_name: "Rahul Sharma"  
  2. email: "rahul@gmail.com"  
  3. phone: "+919876543210"  
  4. notice\_period\_days: 30  
  5. cv\_file: Binary Object  
* **Controller Logic:**  
  1. Check for duplicate candidate\_records by email/phone.  
  2. Parse CV binary using auto CV parser (RC-02 logic).  
  3. Create or update candidate\_records setting source\_type \= 'Storefront\_Inbound'.  
  4. Store binary CV file in cloud storage (agency\_id/candidates/raw\_cvs/).  
  5. Log application in storefront\_candidate\_applications.  
  6. **Interlinked Zone 1 Trigger:** Surface candidate in Recruiter Cockpit (Zone 1\) under New Inbound Candidates queue.

#### **5\. Edge Cases & Security Acceptance Criteria**

* **File Upload Virus Scanning:** Binary upload endpoint must validate file magic numbers (ensuring .pdf / .docx headers match true MIME type) to prevent malicious executable file uploads (.exe, .sh, .php).

#### **6\. AI Wireframe Prompt**

Plaintext  
Mobile web view for candidate resume submission modal. Header reads 'Join Apex Talent Network'. Input fields 'Full Name', 'Email', 'Phone', 'Desired Designation', 'Notice Period (Days)'. Upload dropzone box displays icon with text 'Drag & Drop Resume (PDF or DOCX, Max 10MB)'. Action button in solid dark navy (\#0F172A) reading 'Submit Application'. Minimalist design.

## **PART 3: ZONE 6 SUMMARY SPECIFICATION TABLE**

| Feature Code | Feature Name | Core Operational Problem Solved | Primary Technical Asset |
| :---- | :---- | :---- | :---- |
| **AS-01** | Public Agency Storefront | Zero-website credibility gap & poor digital presence | Subdomain Engine \+ Dynamic Profile Renderer |
| **AS-02** | Client Mandate Ingestion | Messy inbound client requirements via email/WhatsApp | 4-Step Mandate Wizard \+ Intake Trigger |
| **AS-03** | Hot Talent Showcase | Wasting pre-vetted silver medalist candidates | Anonymized Talent Cards \+ Lead Capture |
| **AS-04** | Candidate Application Portal | Manual resume collection & email intake chaos | Self-Serve Resume Dropzone \+ Auto Parsing |

## 

## **FINAL SYSTEM COMPLETE SUMMARY MAP**

┌─────────────────────────────────────────────────────────────────────────┐  
│                      RECRUITOS MASTER ARCHITECTURE                      │  
│ FOUNDATION: Multi-Tenant JWT Middleware & PostgreSQL Row-Level Security │   
├─────────────────────────────────────────────────────────────────────────┤  
│ ZONE 1: RECRUITER COCKPIT (Internal Command Center & SLA Radar)          │  
│   ├── RC-01: WhatsApp & Email Communication Log                         │  
│   ├── RC-02: Auto CV Parsing & Intake Engine                            │  
│   ├── RC-03: Pipeline SLA & Stagnation Aging Radar                      │  
│   ├── RC-04: Relational Talent & Household Mapping                      │  
│   ├── RC-05: Post-Offer 90-Day Drop-Off Radar                           │  
│   ├── RC-06: Settlement & Auto-Invoicing Engine                         │  
│   └── RC-07: Silver Medalist Talent Recycler       
│   └── RC-08: Job Board One-Click Broadcast & Webhook Ingestion                        │  
├─────────────────────────────────────────────────────────────────────────┤  
│ ZONE 2: CLIENT & INTERVIEWER PORTAL (The Feedback Engine)               │  
│   ├── CF-01: Zero-Login Magic Link Presenter                            │  
│   ├── CF-02: One-Click Decision & Rejection Matrix                      │  
│   ├── CF-03: Asynchronous Interview Slot Selector                       │  
│   └── CF-04: Client SLA Chase Engine & Reminders                        │  
├─────────────────────────────────────────────────────────────────────────┤  
│ ZONE 3: CANDIDATE EXPERIENCE HUB (The Engagement Loop & Prep)           │  
│   ├── CE-01: 1-Click WhatsApp Slot Confirmator                          │  
│   ├── CE-02: Automated Interview Prep Kit Trigger                       │  
│   ├── CE-03: Post-Interview Feedback Collector                          │  
│   └── CE-04: Notice Period Counter-Offer Pulse                          │  
├─────────────────────────────────────────────────────────────────────────┤  
│ ZONE 4: HR & COMPLIANCE ZONE (Post-Offer Handoff)                       │  
│   ├── HC-01: Compliance Document Vault & Upload Checklist               │  
│   ├── HC-02: Offer Audit & CTC Placement Fee Guard                      │  
│   ├── HC-03: Zero-Touch Client HR Onboarding Handoff                    │  
│   └── HC-04: 90-Day Probation Guarantee Clock                           │  
├─────────────────────────────────────────────────────────────────────────┤  
│ ZONE 5: PARTNER & VENDOR NETWORK (Split-Fee Management)                 │  
│   ├── PO-01: Anonymized Mandate Share & Masking Vault                   │  
│   ├── PO-02: Isolated Partner Submission Workspace                      │  
│   ├── PO-03: Candidate Duplicate Arbitrator (200ms First-Touch Rule)    │  
│   └── PO-04: Split-Fee Ledger & Auto-Settlement Interlink               │  
├─────────────────────────────────────────────────────────────────────────┤  
│ ZONE 6: AGENCY STOREFRONT (Inbound Lead Generation)                     │  
│   ├── AS-01: Public Agency Storefront Microsite Engine                  │  
│   ├── AS-02: Self-Serve Client Mandate Ingestion Wizard                 │  
│   ├── AS-03: Hot Talent Showcase & Teaser Gallery                       │  
│   └── AS-04: Candidate Application Portal & Resume Dropzone             │  
└─────────────────────────────────────────────────────────────────────────┘

Wireframe: [https://stitch.withgoogle.com/projects/6791819750230859733](https://stitch.withgoogle.com/projects/6791819750230859733)

