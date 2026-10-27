# FDR Guardian — Explainable AI-Powered Security Deposit & FDR Management System

> **Statutory Notice**: *Hackathon Prototype | Demonstration Data | Not an Official Government Portal*
> This is an independent prototype designed for streamlining institutional Fixed Deposit Receipt (FDR) and security deposit workflows. It is not an official AICTE or banking portal. All mock bank registries and ledger verification data are simulated for demonstration purposes.

---

## 1. Overview & Architectural Purpose

**FDR Guardian** addresses the critical operational challenge of managing thousands of institutional security deposits pledged by technical education institutions to regulatory authorities (such as AICTE, State Directorates of Technical Education, and University Boards).

Built with a formal Indian e-Governance administrative design system (deep navy, slate, restrained saffron and statutory green accents), the portal provides:
- **Explainable AI OCR**: Compares physical receipt scans against submitted values with field-level confidence ratings and transparent discrepancy explanations.
- **Dedicated Bank Verification Workspace**: Allows scheduled commercial bank nodal officers to cross-check certificates against Core Banking Solution (CBS) ledgers.
- **Regulatory Review Cockpit**: Empowering approval officers to request clarifications, track statutory checklists, and record legally binding determinations.
- **Maturity Horizon & Rollover Calendar**: Categorizing deposits into 30-day, 15-day, and 7-day urgent renewal cohorts.
- **Advisory Release-Readiness Checker**: Verifying compliance conditions, bank clearances, and State NOCs prior to lien discharge.
- **Institutional Reconciliation Engine**: Bulk CSV ingest and variance analysis for annual audit schedules.
- **Public QR Certificate Verification**: Secure, redacted verification proof accessible via mobile camera scan without leaking sensitive internal remarks.
- **Immutable Audit Trail**: Permanent record of every transition, officer decision, and field correction.

---

## 2. Technology Stack

- **Frontend Core**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4, PostCSS, high-contrast accessible design tokens
- **Icons**: Lucide React
- **Visualizations**: Recharts (status distribution, deposit volume, bank verification outcomes)
- **Routing**: React Router v7
- **Verification**: `qrcode.react` (SVG-based dynamic QR generator)
- **Database & Persistence**:
  - Dual-mode architecture:
    1. **Immediate Persistent Browser Storage**: Seeded with 10+ realistic institutional FDR cases across all lifecycle states.
    2. **Supabase PostgreSQL Integration**: Full schema migrations, typed models, and Row Level Security (RLS) policies.
- **Service Layer**: Decoupled repository architecture ready for FastAPI Python REST backends.

---

## 3. Quickstart & Installation

### Prerequisites
- Node.js `v18+` or `v20+` (tested on Node v24)
- npm `v9+` or `v11+`

### Setup Commands
```bash
# Navigate to the project directory
cd fdr-guardian

# Install dependencies
npm install

# Start the Vite local development server
npm run dev

# Run production TypeScript build & bundle verification
npm run build
```

The application will run at: **`http://localhost:5173`** (or configured Vite port).

---

## 4. Pre-Configured Personas & Demo Role Selector

The prototype includes a **Demo Persona Selector** available via the header button (*"Switch Persona"*), allowing instant evaluation of all 4 roles:

| Persona | Name | Organization Unit | Primary Capabilities |
| :--- | :--- | :--- | :--- |
| **Institution User** | Dr. Rajesh Sharma | Kalinga Institute of Tech. | Submit new FDRs, correct OCR mistakes, respond to clarification queries |
| **Bank Officer** | Amitav Sengupta | State Bank of India | Inspect receipts, cross-check CBS ledger, record Confirmed/Mismatch |
| **Regulatory Officer** | Smt. Meenakshi Sundaram | Approvals & Finance Bureau | Formal compliance checklist, issue statutory approvals or rejections |
| **System Administrator** | Vikramaditya Roy | National e-Gov Mission | User authorizations, institution & bank registries, SLA thresholds |

---

## 5. Demonstration Data Scenarios

The seeded database includes realistic institutional cases covering key scenarios:

1. **`FDR-2023-7741`** (Canara Bank, ₹35,00,000) — Fully approved deposit with verified SHA-256 receipt and active bank CBS confirmation.
2. **`FDR-2024-9102`** (State Bank of India, ₹50,00,000) — Newly submitted case in the Bank Verification queue.
3. **`FDR-2024-4321`** (Punjab National Bank, ₹25,00,000) — **Bank Mismatch Case**: Application claims ₹25L, but bank CBS ledger reports ₹20L (₹5L variance flagged).
4. **`FDR-2024-8833`** (Bank of Baroda, ₹15,00,000) — **Clarification Required**: AI OCR flagged 24-month tenure shortfall against mandated 36-month regulatory lock-in.
5. **`FDR-2021-3004`** (SBI, ₹20,00,000) — Approaching maturity milestone in 14-day cohort.
6. **`FDR-2020-1192`** (PNB, ₹30,00,000) — **Release Advisory Incomplete**: Matured 50 days ago; advisory checker flags missing State Directorate NOC.
7. **`FDR-2024-6620`** (Canara Bank, ₹30,00,000) — **Replacement Case**: Linked rollover record preserving historical parent certificate audit trail.
8. **`FDR-2024-0012`** (PNB, ₹20,00,000) — **Rejected Case**: Formal rejection recorded due to statutory 12-month short-term violation.

To reset the database back to clean baseline fixtures at any time, click **"Reset Demo Database"** in the persona selector or the Portal Settings page.

---

## 6. Project Structure

```
fdr-guardian/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   └── DemoRoleSwitcherModal.tsx
│   │   └── layout/
│   │       ├── AppLayout.tsx
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       └── Footer.tsx
│   ├── lib/
│   │   ├── storage.ts          # Reactive persistence engine
│   │   ├── supabase.ts         # Supabase client adapter
│   │   └── utils.ts            # INR currency formatting, status badges
│   ├── pages/
│   │   ├── admin/              # User management & settings
│   │   ├── analytics/          # Interest impact calculator
│   │   ├── auth/               # Sign-in & institution registration
│   │   ├── bank/               # Bank verification workspace
│   │   ├── dashboard/          # Role-tailored administrative KPIs
│   │   ├── fdr/                # Registry, submission wizard, 6-tab detail
│   │   ├── lifecycle/          # Escalations, readiness, maturity calendar
│   │   ├── reconciliation/     # Algorithmic CSV matching engine
│   │   ├── regulatory/         # Regulatory review cockpit
│   │   ├── reports/            # Recharts analytical distributions
│   │   └── verification/       # Public QR certificate page
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── fdr.service.ts
│   │   ├── audit.service.ts
│   │   ├── reconciliation.service.ts
│   │   └── seedData.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── supabase/
│   └── migrations/
│       └── 20261022000001_fdr_guardian_init.sql
├── .env.example
├── package.json
└── tailwind.config.js
```

---

## 7. Security & Compliance Architecture

- **Tamper Evidence**: Uploaded certificate scans generate 64-character SHA-256 hashes upon ingestion.
- **Data Isolation**: Institutional users are isolated to their own institution's records; bank officers access their respective bank's queues.
- **Immutable Audit Logging**: Actions (`FDR_SUBMITTED`, `OCR_FIELD_CORRECTED`, `BANK_VERIFICATION_CONFIRMED`, `REGULATORY_DECISION_APPROVED`) append permanent entries with actor, timestamp, before/after values, and justification.
- **Redacted Public Verification**: The public QR verification route (`/verify/:publicId`) displays masked identifiers and cryptographic status without exposing private financial notes or internal reviewer comments.
