export type UserRole = 'INSTITUTION' | 'BANK_OFFICER' | 'REGULATORY_OFFICER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  designation?: string;
  phone?: string;
  institutionId?: string;
  institutionName?: string;
  bankId?: string;
  bankName?: string;
  isApproved: boolean;
  createdAt: string;
}

export interface Institution {
  id: string;
  name: string;
  permanentId: string; // AICTE / Regulatory Permanent ID
  type: 'ENGINEERING' | 'MANAGEMENT' | 'POLYTECHNIC' | 'PHARMACY' | 'UNIVERSITY' | 'STANDALONE';
  state: string;
  district: string;
  email: string;
  phone: string;
  contactPerson: string;
  address: string;
  activeFdrCount?: number;
  totalDepositAmount?: number;
}

export interface Bank {
  id: string;
  name: string;
  code: string;
  ifscPrefix: string;
  nodalOfficer: string;
  nodalEmail: string;
  isSimulatedDemo: boolean;
}

export type FDRWorkflowStatus =
  | 'Draft'
  | 'Submitted'
  | 'OCR Processing'
  | 'Correction Required'
  | 'Ready for Bank Verification'
  | 'Bank Verification Pending'
  | 'Bank Confirmed'
  | 'Bank Mismatch'
  | 'Awaiting Information'
  | 'Under Regulatory Review'
  | 'Clarification Required'
  | 'Further Verification'
  | 'Approved'
  | 'Rejected'
  | 'Renewal Pending'
  | 'Replacement Pending'
  | 'Release Pending'
  | 'Released'
  | 'Matured';

export interface ExtractedField {
  field: string;
  label: string;
  submittedValue: string;
  extractedValue: string;
  confidence: number; // 0 to 100
  isMatched: boolean;
}

export interface DiscrepancyItem {
  id: string;
  field: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  explanation: string;
  recommendedAction: string;
  status: 'OPEN' | 'RESOLVED' | 'WAIVED';
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNote?: string;
}

export interface BankVerificationRecord {
  status: 'PENDING' | 'CONFIRMED' | 'MISMATCH' | 'UNABLE_TO_VERIFY' | 'INFO_REQUIRED';
  assignedOfficerId?: string;
  assignedOfficerName?: string;
  referenceNumber?: string;
  comments?: string;
  supportingEvidenceName?: string;
  supportingEvidenceUrl?: string;
  verifiedAt?: string;
  isSimulated: boolean;
  history?: Array<{
    attempt: number;
    status: string;
    officer: string;
    timestamp: string;
    notes: string;
  }>;
}

export interface RegulatoryDecisionRecord {
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CLARIFICATION_REQUIRED' | 'FURTHER_VERIFICATION';
  assignedReviewerId?: string;
  reviewerName?: string;
  decisionReason?: string;
  clarificationComments?: string;
  institutionClarificationResponse?: string;
  decidedAt?: string;
  conditionsApplicable?: string[];
}

export interface FDRDocument {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  sha256Hash: string;
  uploadedAt: string;
  uploadedBy: string;
  version: number;
  previewUrl: string;
}

export interface FDRRecord {
  id: string; // Internal UUID
  fdrNumber: string; // Bank receipt number (e.g. FDR-2024-8849)
  publicVerificationId: string; // Unguessable slug / token for public QR
  institutionId: string;
  institutionName: string;
  institutionPermanentId: string;
  bankId: string;
  bankName: string;
  branchName: string;
  holderName: string; // As entered
  jointHolderName?: string;
  principalAmount: number; // in INR
  issueDate: string; // YYYY-MM-DD
  maturityDate: string; // YYYY-MM-DD
  tenureMonths: number;
  interestRate: number; // Percentage e.g. 7.25
  depositCategory: 'PERMANENT_SECURITY' | 'INFRASTRUCTURE_FUND' | 'COURSE_AFFILIATION' | 'ENDOWMENT';
  lienMarkedTo: string; // e.g. "Member Secretary, AICTE / State Council"
  status: FDRWorkflowStatus;
  
  // Documents & OCR
  documents: FDRDocument[];
  extractedFields: ExtractedField[];
  discrepancies: DiscrepancyItem[];
  ocrConfidenceAverage: number;
  ocrCompletedAt?: string;

  // Verifications & Review
  bankVerification: BankVerificationRecord;
  regulatoryDecision: RegulatoryDecisionRecord;

  // Lifecycle & Replacement
  replacementOfFdrId?: string;
  replacedByFdrId?: string;
  renewalCount: number;
  
  // Escalation & Service Target
  stageEnteredAt: string;
  serviceTargetDays: number; // SLA days
  delayReason?: string;

  createdAt: string;
  updatedAt: string;
  submittedBy: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  entityType: 'FDR' | 'DOCUMENT' | 'INSTITUTION' | 'USER' | 'RECONCILIATION';
  entityId: string;
  previousState?: string;
  newState?: string;
  reason?: string;
  ipAddress?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
  link?: string;
  createdAt: string;
  isRead: boolean;
  targetRole?: UserRole;
  targetInstitutionId?: string;
}

export interface ReleaseReadinessCheck {
  id: string;
  title: string;
  category: 'MATURITY' | 'REGULATORY' | 'BANK' | 'LEGAL';
  isPassed: boolean;
  explanation: string;
  requiredAction?: string;
}

export interface ReconciliationBatch {
  id: string;
  fileName: string;
  uploadedAt: string;
  uploadedBy: string;
  institutionId?: string;
  institutionName?: string;
  totalRecords: number;
  matchedRecords: number;
  flaggedRecords: number;
  status: 'PENDING_REVIEW' | 'RECONCILED' | 'FLAGS_RESOLVED';
  resolvedBy?: string;
  resolvedAt?: string;
  records: Array<{
    id: string;
    fdrNumber: string;
    institutionName: string;
    bankName: string;
    reportedAmount: number;
    systemAmount?: number;
    reportedMaturityDate: string;
    systemMaturityDate?: string;
    status: 'MATCHED' | 'MISSING_IN_SYSTEM' | 'AMOUNT_MISMATCH' | 'DATE_MISMATCH' | 'DUPLICATE_FDR';
    notes?: string;
    isResolved: boolean;
    resolutionReason?: string;
  }>;
}

export type RegistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'INFO_REQUIRED';

export interface RegistrationRequest {
  id: string;
  applicantName: string;
  email: string;
  phone: string;
  requestedRole: UserRole;
  organizationName: string;
  organizationId?: string; // Institution ID or Bank ID if applicable
  designation: string;
  employeeId: string;
  bureauOrBranch: string;
  authorizationReference?: string;
  supportingNote?: string;
  status: RegistrationStatus;
  decisionReason?: string;
  decidedBy?: string;
  decidedAt?: string;
  infoQuery?: string;
  applicantInfoResponse?: string;
  createdAt: string;
  updatedAt: string;
}

