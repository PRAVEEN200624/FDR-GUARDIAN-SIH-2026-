import { ReconciliationBatch } from '../types';
import { getStoredFDRs, getCurrentUser, addStoredAuditLog } from '../lib/storage';

const RECON_STORAGE_KEY = 'fdr_guardian_reconciliation_batches_v1';

export const ReconciliationService = {
  getBatches(): ReconciliationBatch[] {
    try {
      const raw = localStorage.getItem(RECON_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return this.getInitialDemoBatches();
  },

  saveBatches(batches: ReconciliationBatch[]): void {
    localStorage.setItem(RECON_STORAGE_KEY, JSON.stringify(batches));
  },

  getInitialDemoBatches(): ReconciliationBatch[] {
    return [
      {
        id: 'batch-001',
        fileName: 'CEG_Annual_Audit_FDR_Schedule_2024.csv',
        uploadedAt: '2024-04-10T11:00:00Z',
        uploadedBy: 'Dr. K. Suganthi',
        institutionId: 'inst-anna-ceg',
        institutionName: 'College of Engineering, Guindy (Anna University)',
        totalRecords: 4,
        matchedRecords: 3,
        flaggedRecords: 1,
        status: 'PENDING_REVIEW',
        records: [
          {
            id: 'rec-1',
            fdrNumber: 'SBI-CEG-2024-FDR-984210',
            institutionName: 'College of Engineering, Guindy (Anna University)',
            bankName: 'State Bank of India',
            reportedAmount: 3500000,
            systemAmount: 3500000,
            reportedMaturityDate: '2029-06-15',
            systemMaturityDate: '2029-06-15',
            status: 'MATCHED',
            notes: 'Exact match with portal active record',
            isResolved: true,
          },
          {
            id: 'rec-2',
            fdrNumber: 'FDR-2024-9102',
            institutionName: 'College of Engineering, Guindy (Anna University)',
            bankName: 'State Bank of India',
            reportedAmount: 5000000,
            systemAmount: 5000000,
            reportedMaturityDate: '2029-02-10',
            systemMaturityDate: '2029-02-10',
            status: 'MATCHED',
            notes: 'Exact match with pending verification record',
            isResolved: true,
          },
          {
            id: 'rec-3',
            fdrNumber: 'FDR-2024-6620',
            institutionName: 'College of Engineering, Guindy (Anna University)',
            bankName: 'Canara Bank',
            reportedAmount: 3000000,
            systemAmount: 3000000,
            reportedMaturityDate: '2029-03-10',
            systemMaturityDate: '2029-03-10',
            status: 'MATCHED',
            notes: 'Replacement certificate match',
            isResolved: true,
          },
          {
            id: 'rec-4',
            fdrNumber: 'FDR-2022-9988',
            institutionName: 'College of Engineering, Guindy (Anna University)',
            bankName: 'Bank of India',
            reportedAmount: 1800000,
            reportedMaturityDate: '2027-08-20',
            status: 'MISSING_IN_SYSTEM',
            notes: 'Reported in institution schedule but not registered in FDR Guardian repository.',
            isResolved: false,
          },
        ],
      },
    ];
  },

  reconcileCSV(
    fileName: string,
    csvContent: string,
    institutionId?: string
  ): ReconciliationBatch {
    const lines = csvContent
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const currentUser = getCurrentUser();
    const systemFDRs = getStoredFDRs();
    const records: ReconciliationBatch['records'] = [];

    // Skip header line if present
    const dataLines = lines[0].toLowerCase().includes('fdr') ? lines.slice(1) : lines;

    for (let i = 0; i < dataLines.length; i++) {
      const parts = dataLines[i].split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
      if (parts.length < 3) continue;

      const fdrNumber = parts[0];
      const bankName = parts[1] || 'Unknown Bank';
      const reportedAmount = parseFloat(parts[2].replace(/[^0-9.-]+/g, '')) || 0;
      const reportedMaturityDate = parts[3] || '2027-12-31';
      const instName = parts[4] || currentUser.institutionName || 'Reporting Institution';

      const matchedSystemRecord = systemFDRs.find(
        (s) => s.fdrNumber.toLowerCase() === fdrNumber.toLowerCase()
      );

      let status: 'MATCHED' | 'MISSING_IN_SYSTEM' | 'AMOUNT_MISMATCH' | 'DATE_MISMATCH' | 'DUPLICATE_FDR' =
        'MATCHED';
      let notes = 'Matching entry in portal ledger.';

      if (!matchedSystemRecord) {
        status = 'MISSING_IN_SYSTEM';
        notes = 'Record present in uploaded schedule but not found in FDR Guardian database.';
      } else if (matchedSystemRecord.principalAmount !== reportedAmount) {
        status = 'AMOUNT_MISMATCH';
        notes = `Amount variance: Reported ₹${reportedAmount.toLocaleString('en-IN')} vs System ₹${matchedSystemRecord.principalAmount.toLocaleString('en-IN')}.`;
      } else if (
        matchedSystemRecord.maturityDate &&
        reportedMaturityDate &&
        matchedSystemRecord.maturityDate !== reportedMaturityDate
      ) {
        status = 'DATE_MISMATCH';
        notes = `Maturity date discrepancy: Reported ${reportedMaturityDate} vs System ${matchedSystemRecord.maturityDate}.`;
      }

      records.push({
        id: `recon-rec-${Date.now()}-${i}`,
        fdrNumber,
        institutionName: instName,
        bankName,
        reportedAmount,
        systemAmount: matchedSystemRecord?.principalAmount,
        reportedMaturityDate,
        systemMaturityDate: matchedSystemRecord?.maturityDate,
        status,
        notes,
        isResolved: status === 'MATCHED',
      });
    }

    const matchedRecords = records.filter((r) => r.status === 'MATCHED').length;
    const flaggedRecords = records.length - matchedRecords;

    const newBatch: ReconciliationBatch = {
      id: `batch-${Date.now()}`,
      fileName,
      uploadedAt: new Date().toISOString(),
      uploadedBy: currentUser.name,
      institutionId,
      institutionName: currentUser.institutionName,
      totalRecords: records.length,
      matchedRecords,
      flaggedRecords,
      status: flaggedRecords === 0 ? 'RECONCILED' : 'PENDING_REVIEW',
      records,
    };

    const batches = this.getBatches();
    batches.unshift(newBatch);
    this.saveBatches(batches);

    addStoredAuditLog({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: 'RECONCILIATION_UPLOADED',
      entityType: 'RECONCILIATION',
      entityId: newBatch.id,
      reason: `Uploaded ${fileName}: ${records.length} items checked (${matchedRecords} matched, ${flaggedRecords} flagged)`,
    });

    return newBatch;
  },

  resolveFlag(batchId: string, recordId: string, reason: string): boolean {
    const batches = this.getBatches();
    const batch = batches.find((b) => b.id === batchId);
    if (!batch) return false;

    const record = batch.records.find((r) => r.id === recordId);
    if (!record) return false;

    const currentUser = getCurrentUser();
    record.isResolved = true;
    record.resolutionReason = reason;

    const remainingFlags = batch.records.filter((r) => !r.isResolved).length;
    if (remainingFlags === 0) {
      batch.status = 'FLAGS_RESOLVED';
      batch.resolvedBy = currentUser.name;
      batch.resolvedAt = new Date().toISOString();
    }

    this.saveBatches(batches);

    addStoredAuditLog({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: 'RECONCILIATION_FLAG_RESOLVED',
      entityType: 'RECONCILIATION',
      entityId: batchId,
      reason: `Reconciliation flag for ${record.fdrNumber} resolved: ${reason}`,
    });

    return true;
  },
};
