import { AuditLogEntry, UserRole } from '../types';
import { getStoredAuditLogs, addStoredAuditLog, getCurrentUser } from '../lib/storage';

export const AuditService = {
  getLogs(filters?: {
    entityType?: string;
    entityId?: string;
    role?: UserRole;
    action?: string;
    startDate?: string;
    endDate?: string;
  }): AuditLogEntry[] {
    let logs = getStoredAuditLogs();

    if (!filters) return logs;

    if (filters.entityType && filters.entityType !== 'ALL') {
      logs = logs.filter((l) => l.entityType === filters.entityType);
    }

    if (filters.entityId) {
      logs = logs.filter((l) => l.entityId.toLowerCase().includes(filters.entityId!.toLowerCase()));
    }

    if (filters.role && filters.role !== ('ALL' as any)) {
      logs = logs.filter((l) => l.actorRole === filters.role);
    }

    if (filters.action && filters.action !== 'ALL') {
      logs = logs.filter((l) => l.action.toLowerCase().includes(filters.action!.toLowerCase()));
    }

    if (filters.startDate) {
      logs = logs.filter((l) => new Date(l.timestamp) >= new Date(filters.startDate!));
    }

    if (filters.endDate) {
      logs = logs.filter((l) => new Date(l.timestamp) <= new Date(filters.endDate!));
    }

    return logs;
  },

  log(
    action: string,
    entityType: 'FDR' | 'DOCUMENT' | 'INSTITUTION' | 'USER' | 'RECONCILIATION',
    entityId: string,
    previousState?: string,
    newState?: string,
    reason?: string
  ): void {
    const user = getCurrentUser();
    addStoredAuditLog({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action,
      entityType,
      entityId,
      previousState,
      newState,
      reason,
      ipAddress: '103.24.18.52',
    });
  },
};
