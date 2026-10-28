import {
  FDRRecord,
  FDRWorkflowStatus,
  BankVerificationRecord,
  RegulatoryDecisionRecord,
  DiscrepancyItem,
  User,
} from '../types';
import {
  getStoredFDRs,
  saveSingleFDR,
  saveStoredFDRs,
  addStoredAuditLog,
  getCurrentUser,
} from '../lib/storage';
import { generateMockSha256 } from '../lib/utils';
import { INITIAL_FDRS } from './seedData';

export interface FDRFilterParams {
  search?: string;
  status?: string;
  bankId?: string;
  institutionId?: string;
  depositCategory?: string;
  minAmount?: number;
  maxAmount?: number;
}

export const FDRService = {
  getAllFDRs(filters?: FDRFilterParams, currentUser?: User): FDRRecord[] {
    let records = getStoredFDRs();
    const user = currentUser || getCurrentUser();

    // Data Isolation: Institutions can only view their own FDR records
    if (user.role === 'INSTITUTION' && user.institutionId) {
      records = records.filter((r) => r.institutionId === user.institutionId);
    }
    // Bank officers: Show all pending verification records, prioritizing their designated bank
    if (user.role === 'BANK_OFFICER' && filters?.bankId && filters.bankId !== 'ALL') {
      records = records.filter((r) => r.bankId === filters.bankId);
    }

    if (!filters) return records;

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      records = records.filter(
        (r) =>
          r.fdrNumber.toLowerCase().includes(q) ||
          r.institutionName.toLowerCase().includes(q) ||
          r.bankName.toLowerCase().includes(q) ||
          r.holderName.toLowerCase().includes(q)
      );
    }

    if (filters.status && filters.status !== 'ALL') {
      records = records.filter((r) => r.status === filters.status);
    }

    if (filters.bankId && filters.bankId !== 'ALL') {
      records = records.filter((r) => r.bankId === filters.bankId);
    }

    if (filters.institutionId && filters.institutionId !== 'ALL') {
      records = records.filter((r) => r.institutionId === filters.institutionId);
    }

    if (filters.depositCategory && filters.depositCategory !== 'ALL') {
      records = records.filter((r) => r.depositCategory === filters.depositCategory);
    }

    if (filters.minAmount !== undefined) {
      records = records.filter((r) => r.principalAmount >= (filters.minAmount || 0));
    }

    if (filters.maxAmount !== undefined && filters.maxAmount > 0) {
      records = records.filter((r) => r.principalAmount <= (filters.maxAmount || Infinity));
    }

    return records;
  },

  getFDRById(id: string): FDRRecord | undefined {
    if (!id) return undefined;
    const clean = id.trim().toLowerCase();
    const cleanAlphanumeric = clean.replace(/[^a-z0-9]/g, '');
    const all = getStoredFDRs();

    // 1. Check stored active records (by ID, FDR certificate number, or verification ID)
    const found = all.find(
      (r) =>
        r.id.toLowerCase() === clean ||
        r.fdrNumber.toLowerCase() === clean ||
        (r.publicVerificationId && r.publicVerificationId.toLowerCase() === clean) ||
        r.fdrNumber.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanAlphanumeric
    );
    if (found) return found;

    // 2. Fallback to seed records
    return INITIAL_FDRS.find(
      (r) =>
        r.id.toLowerCase() === clean ||
        r.fdrNumber.toLowerCase() === clean ||
        (r.publicVerificationId && r.publicVerificationId.toLowerCase() === clean) ||
        r.fdrNumber.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanAlphanumeric
    );
  },

  getFDRByPublicId(publicId: string): FDRRecord | undefined {
    if (!publicId) return undefined;
    return this.getFDRById(publicId);
  },

  checkDuplicate(fdrNumber: string, bankId: string): boolean {
    const all = getStoredFDRs();
    return all.some(
      (r) =>
        r.fdrNumber.trim().toUpperCase() === fdrNumber.trim().toUpperCase() &&
        r.bankId === bankId
    );
  },

  createFDR(data: {
    fdrNumber: string;
    institutionId: string;
    institutionName: string;
    institutionPermanentId: string;
    bankId: string;
    bankName: string;
    branchName: string;
    holderName: string;
    jointHolderName?: string;
    principalAmount: number;
    issueDate: string;
    maturityDate: string;
    tenureMonths: number;
    interestRate: number;
    depositCategory: any;
    lienMarkedTo: string;
    fileName: string;
    fileSize: number;
    fileType: string;
  }): { success: boolean; fdr?: FDRRecord; error?: string } {
    // Duplicate check
    if (this.checkDuplicate(data.fdrNumber, data.bankId)) {
      return {
        success: false,
        error: `Duplicate Record Error: An FDR with number "${data.fdrNumber}" already exists under ${data.bankName}. Accidental duplicate submissions are prevented.`,
      };
    }

    const currentUser = getCurrentUser();
    const fdrId = `fdr-${Date.now()}`;
    const publicSlug = `pub-vfy-${data.bankId.replace('bank-', '')}-${data.fdrNumber.slice(-4)}-${Math.random().toString(36).substring(2, 6)}`;
    const sha256 = generateMockSha256(data.fileName + data.fileSize + Date.now());

    // Generate explainable simulated OCR extraction
    const extractedFields = [
      {
        field: 'fdrNumber',
        label: 'FDR Certificate Number',
        submittedValue: data.fdrNumber,
        extractedValue: data.fdrNumber,
        confidence: 99.2,
        isMatched: true,
      },
      {
        field: 'principalAmount',
        label: 'Principal Deposit Amount',
        submittedValue: data.principalAmount.toLocaleString('en-IN'),
        extractedValue: data.principalAmount.toLocaleString('en-IN'),
        confidence: 98.8,
        isMatched: true,
      },
      {
        field: 'holderName',
        label: 'Deposit Holder Name',
        submittedValue: data.holderName,
        extractedValue: data.holderName,
        confidence: 97.4,
        isMatched: true,
      },
      {
        field: 'maturityDate',
        label: 'Maturity Expiry Date',
        submittedValue: data.maturityDate,
        extractedValue: data.maturityDate,
        confidence: 98.5,
        isMatched: true,
      },
      {
        field: 'lienClause',
        label: 'Statutory Lien Endorsement',
        submittedValue: data.lienMarkedTo,
        extractedValue: data.lienMarkedTo,
        confidence: 96.0,
        isMatched: true,
      },
    ];

    const newRecord: FDRRecord = {
      id: fdrId,
      fdrNumber: data.fdrNumber,
      publicVerificationId: publicSlug,
      institutionId: data.institutionId,
      institutionName: data.institutionName,
      institutionPermanentId: data.institutionPermanentId,
      bankId: data.bankId,
      bankName: data.bankName,
      branchName: data.branchName,
      holderName: data.holderName,
      jointHolderName: data.jointHolderName,
      principalAmount: data.principalAmount,
      issueDate: data.issueDate,
      maturityDate: data.maturityDate,
      tenureMonths: data.tenureMonths,
      interestRate: data.interestRate,
      depositCategory: data.depositCategory,
      lienMarkedTo: data.lienMarkedTo,
      status: 'Ready for Bank Verification',
      documents: [
        {
          id: `doc-${Date.now()}`,
          fileName: data.fileName,
          fileSize: data.fileSize,
          fileType: data.fileType,
          sha256Hash: sha256,
          uploadedAt: new Date().toISOString(),
          uploadedBy: currentUser.name,
          version: 1,
          previewUrl: '',
        },
      ],
      extractedFields,
      discrepancies: [],
      ocrConfidenceAverage: 98.0,
      ocrCompletedAt: new Date().toISOString(),
      bankVerification: {
        status: 'PENDING',
        isSimulated: true,
      },
      regulatoryDecision: {
        status: 'PENDING',
      },
      renewalCount: 0,
      stageEnteredAt: new Date().toISOString(),
      serviceTargetDays: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      submittedBy: currentUser.name,
    };

    saveSingleFDR(newRecord);

    addStoredAuditLog({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: 'FDR_SUBMITTED',
      entityType: 'FDR',
      entityId: fdrId,
      newState: 'Ready for Bank Verification',
      reason: `New FDR receipt uploaded and queued for verification (FDR: ${data.fdrNumber}, Bank: ${data.bankName})`,
    });

    return { success: true, fdr: newRecord };
  },

  updateOCRField(
    fdrId: string,
    fieldName: string,
    correctedValue: string,
    justification: string
  ): boolean {
    const fdr = this.getFDRById(fdrId);
    if (!fdr) return false;

    const currentUser = getCurrentUser();
    const oldField = fdr.extractedFields.find((f) => f.field === fieldName);
    const oldValue = oldField?.extractedValue || 'N/A';

    fdr.extractedFields = fdr.extractedFields.map((f) => {
      if (f.field === fieldName) {
        return {
          ...f,
          extractedValue: correctedValue,
          confidence: 100, // Manual human correction
          isMatched: true,
        };
      }
      return f;
    });

    fdr.updatedAt = new Date().toISOString();
    saveSingleFDR(fdr);

    addStoredAuditLog({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: 'OCR_FIELD_CORRECTED',
      entityType: 'FDR',
      entityId: fdrId,
      previousState: `${fieldName}: "${oldValue}"`,
      newState: `${fieldName}: "${correctedValue}"`,
      reason: `Manual field correction: ${justification}`,
    });

    return true;
  },

  resolveDiscrepancy(
    fdrId: string,
    discrepancyId: string,
    resolutionNote: string
  ): boolean {
    const fdr = this.getFDRById(fdrId);
    if (!fdr) return false;

    const currentUser = getCurrentUser();
    fdr.discrepancies = fdr.discrepancies.map((d) => {
      if (d.id === discrepancyId) {
        return {
          ...d,
          status: 'RESOLVED',
          resolvedBy: currentUser.name,
          resolvedAt: new Date().toISOString(),
          resolutionNote,
        };
      }
      return d;
    });

    fdr.updatedAt = new Date().toISOString();
    saveSingleFDR(fdr);

    addStoredAuditLog({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: 'DISCREPANCY_RESOLVED',
      entityType: 'FDR',
      entityId: fdrId,
      reason: `Discrepancy marked as resolved: ${resolutionNote}`,
    });

    return true;
  },

  submitBankVerification(
    fdrId: string,
    params: {
      status: 'CONFIRMED' | 'MISMATCH' | 'UNABLE_TO_VERIFY' | 'INFO_REQUIRED';
      referenceNumber: string;
      comments: string;
      evidenceName?: string;
    }
  ): boolean {
    const fdr = this.getFDRById(fdrId);
    if (!fdr) return false;

    const currentUser = getCurrentUser();
    const prevStatus = fdr.status;

    let newStatus: FDRWorkflowStatus = fdr.status;
    if (params.status === 'CONFIRMED') {
      newStatus = 'Under Regulatory Review';
    } else if (params.status === 'MISMATCH') {
      newStatus = 'Bank Mismatch';
    } else if (params.status === 'INFO_REQUIRED') {
      newStatus = 'Awaiting Information';
    } else if (params.status === 'UNABLE_TO_VERIFY') {
      newStatus = 'Correction Required';
    }

    const verificationRecord: BankVerificationRecord = {
      status: params.status,
      assignedOfficerId: currentUser.id,
      assignedOfficerName: currentUser.name,
      referenceNumber: params.referenceNumber,
      comments: params.comments,
      supportingEvidenceName: params.evidenceName,
      verifiedAt: new Date().toISOString(),
      isSimulated: true,
      history: [
        ...(fdr.bankVerification.history || []),
        {
          attempt: (fdr.bankVerification.history?.length || 0) + 1,
          status: params.status,
          officer: currentUser.name,
          timestamp: new Date().toISOString(),
          notes: params.comments,
        },
      ],
    };

    fdr.bankVerification = verificationRecord;
    fdr.status = newStatus;
    fdr.stageEnteredAt = new Date().toISOString();
    fdr.updatedAt = new Date().toISOString();
    saveSingleFDR(fdr);

    addStoredAuditLog({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: `BANK_VERIFICATION_${params.status}`,
      entityType: 'FDR',
      entityId: fdrId,
      previousState: prevStatus,
      newState: newStatus,
      reason: `Bank Officer recorded ${params.status}. Reference: ${params.referenceNumber}. Comments: ${params.comments}`,
    });

    return true;
  },

  submitRegulatoryDecision(
    fdrId: string,
    params: {
      decision: 'APPROVED' | 'REJECTED' | 'CLARIFICATION_REQUIRED' | 'FURTHER_VERIFICATION';
      reason: string;
      clarificationNote?: string;
      conditions?: string[];
    }
  ): boolean {
    const fdr = this.getFDRById(fdrId);
    if (!fdr) return false;

    const currentUser = getCurrentUser();
    const prevStatus = fdr.status;

    let newStatus: FDRWorkflowStatus = fdr.status;
    if (params.decision === 'APPROVED') {
      newStatus = 'Approved';
    } else if (params.decision === 'REJECTED') {
      newStatus = 'Rejected';
    } else if (params.decision === 'CLARIFICATION_REQUIRED') {
      newStatus = 'Clarification Required';
    } else if (params.decision === 'FURTHER_VERIFICATION') {
      newStatus = 'Further Verification';
    }

    const decisionRecord: RegulatoryDecisionRecord = {
      status: params.decision,
      assignedReviewerId: currentUser.id,
      reviewerName: currentUser.name,
      decisionReason: params.reason,
      clarificationComments: params.clarificationNote,
      decidedAt: new Date().toISOString(),
      conditionsApplicable: params.conditions,
    };

    fdr.regulatoryDecision = decisionRecord;
    fdr.status = newStatus;
    fdr.stageEnteredAt = new Date().toISOString();
    fdr.updatedAt = new Date().toISOString();
    saveSingleFDR(fdr);

    addStoredAuditLog({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: `REGULATORY_DECISION_${params.decision}`,
      entityType: 'FDR',
      entityId: fdrId,
      previousState: prevStatus,
      newState: newStatus,
      reason: `Regulatory Officer recorded ${params.decision}. Justification: ${params.reason}`,
    });

    return true;
  },

  respondToClarification(fdrId: string, responseText: string): boolean {
    const fdr = this.getFDRById(fdrId);
    if (!fdr) return false;

    const currentUser = getCurrentUser();
    fdr.regulatoryDecision.institutionClarificationResponse = responseText;
    fdr.status = 'Under Regulatory Review';
    fdr.updatedAt = new Date().toISOString();
    saveSingleFDR(fdr);

    addStoredAuditLog({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: 'CLARIFICATION_RESPONDED',
      entityType: 'FDR',
      entityId: fdrId,
      previousState: 'Clarification Required',
      newState: 'Under Regulatory Review',
      reason: `Institution representative responded: ${responseText}`,
    });

    return true;
  },

  requestLifecycleAction(
    fdrId: string,
    actionType: 'RENEWAL' | 'REPLACEMENT' | 'RELEASE',
    details: {
      reason: string;
      newFdrNumber?: string;
      newMaturityDate?: string;
      newPrincipalAmount?: number;
      replacementFileName?: string;
    }
  ): { success: boolean; newFdrId?: string } {
    const fdr = this.getFDRById(fdrId);
    if (!fdr) return { success: false };

    const currentUser = getCurrentUser();
    const prevStatus = fdr.status;

    if (actionType === 'RENEWAL') {
      fdr.status = 'Renewal Pending';
      fdr.stageEnteredAt = new Date().toISOString();
      fdr.updatedAt = new Date().toISOString();
      saveSingleFDR(fdr);

      addStoredAuditLog({
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorRole: currentUser.role,
        action: 'LIFECYCLE_RENEWAL_REQUESTED',
        entityType: 'FDR',
        entityId: fdrId,
        previousState: prevStatus,
        newState: 'Renewal Pending',
        reason: `Maturity renewal requested: ${details.reason}`,
      });
      return { success: true };
    }

    if (actionType === 'RELEASE') {
      fdr.status = 'Release Pending';
      fdr.stageEnteredAt = new Date().toISOString();
      fdr.updatedAt = new Date().toISOString();
      saveSingleFDR(fdr);

      addStoredAuditLog({
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorRole: currentUser.role,
        action: 'LIFECYCLE_RELEASE_REQUESTED',
        entityType: 'FDR',
        entityId: fdrId,
        previousState: prevStatus,
        newState: 'Release Pending',
        reason: `Deposit release clearance requested: ${details.reason}`,
      });
      return { success: true };
    }

    if (actionType === 'REPLACEMENT') {
      // Create new linked replacement FDR record
      const newFdrId = `fdr-repl-${Date.now()}`;
      const newFdrNumber = details.newFdrNumber || `${fdr.fdrNumber}-R1`;

      const replacementRecord: FDRRecord = {
        ...fdr,
        id: newFdrId,
        fdrNumber: newFdrNumber,
        publicVerificationId: `pub-vfy-repl-${newFdrNumber.slice(-4)}-${Math.random().toString(36).substring(2, 6)}`,
        principalAmount: details.newPrincipalAmount || fdr.principalAmount,
        maturityDate: details.newMaturityDate || fdr.maturityDate,
        status: 'Replacement Pending',
        replacementOfFdrId: fdr.id,
        renewalCount: fdr.renewalCount + 1,
        bankVerification: {
          status: 'PENDING',
          isSimulated: true,
        },
        regulatoryDecision: {
          status: 'PENDING',
        },
        discrepancies: [],
        stageEnteredAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Update old record to show link
      fdr.replacedByFdrId = newFdrId;
      fdr.updatedAt = new Date().toISOString();

      saveSingleFDR(fdr);
      saveSingleFDR(replacementRecord);

      addStoredAuditLog({
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorRole: currentUser.role,
        action: 'LIFECYCLE_REPLACEMENT_INITIATED',
        entityType: 'FDR',
        entityId: fdrId,
        previousState: prevStatus,
        newState: `Replaced by ${newFdrNumber}`,
        reason: `FDR Replacement created with linked audit history: ${details.reason}`,
      });

      return { success: true, newFdrId };
    }

    return { success: false };
  },
};
