import { User, UserRole, RegistrationRequest, RegistrationStatus } from '../types';
import {
  getCurrentUser as getStoredCurrentUser,
  setCurrentUser as setStoredCurrentUser,
  getStoredUsers,
  saveStoredUsers,
  addStoredAuditLog,
  getStoredRegistrationRequests,
  saveStoredRegistrationRequests,
  saveSingleRegistrationRequest,
} from '../lib/storage';

export const AuthService = {
  getCurrentUser(): User {
    return getStoredCurrentUser();
  },

  getAllUsers(): User[] {
    return getStoredUsers();
  },

  switchUser(user: User): void {
    setStoredCurrentUser(user);
    addStoredAuditLog({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'ROLE_SWITCH',
      entityType: 'USER',
      entityId: user.id,
      reason: `Switched active session to ${user.role} (${user.name}) via Demo Role Selector`,
    });
  },

  switchRole(role: UserRole): User | undefined {
    const users = getStoredUsers();
    const targetUser = users.find((u) => u.role === role && u.isApproved);
    if (targetUser) {
      this.switchUser(targetUser);
      return targetUser;
    }
    return undefined;
  },

  login(email: string): { success: boolean; user?: User; isPending?: boolean; error?: string } {
    const cleanEmail = email.toLowerCase().trim();
    const users = getStoredUsers();
    let user = users.find((u) => u.email.toLowerCase() === cleanEmail);

    // Robust demo fallback alias matching for cloud/static deployments
    if (!user) {
      if (cleanEmail.includes('sbi') || cleanEmail.includes('bank')) {
        user = users.find((u) => u.role === 'BANK_OFFICER');
      } else if (cleanEmail.includes('aicte') || cleanEmail.includes('regulatory') || cleanEmail.includes('meenakshi')) {
        user = users.find((u) => u.role === 'REGULATORY_OFFICER');
      } else if (cleanEmail.includes('admin') || cleanEmail.includes('egov') || cleanEmail.includes('e-gov')) {
        user = users.find((u) => u.role === 'ADMIN');
      } else if (cleanEmail.includes('ceg') || cleanEmail.includes('annauniv') || cleanEmail.includes('registrar') || cleanEmail.includes('institution')) {
        user = users.find((u) => u.role === 'INSTITUTION');
      }
    }

    // Also check registration requests
    const requests = getStoredRegistrationRequests();
    const matchingReq = requests.find((r) => r.email.toLowerCase() === cleanEmail);

    if (matchingReq && matchingReq.status === 'PENDING') {
      return {
        success: false,
        isPending: true,
        error: `Your registration request as ${matchingReq.requestedRole.replace('_', ' ')} is currently PENDING administrative authorization. Privileged dashboard access is withheld until an administrator verifies official appointment orders.`,
      };
    }

    if (matchingReq && matchingReq.status === 'REJECTED') {
      return {
        success: false,
        isPending: false,
        error: `Access Denied: Your registration request was rejected by the portal administrator. Reason: "${matchingReq.decisionReason || 'Credentials could not be verified'}"`,
      };
    }

    if (matchingReq && matchingReq.status === 'INFO_REQUIRED') {
      return {
        success: false,
        isPending: true,
        error: `Action Required: Additional documentation requested for your registration: "${matchingReq.infoQuery}"`,
      };
    }

    if (!user) {
      return { success: false, error: 'User account not found with the entered official email address.' };
    }

    if (!user.isApproved) {
      return {
        success: false,
        isPending: true,
        error: 'Your account registration is currently pending administrative verification. Privileged permissions are disabled.',
      };
    }

    setStoredCurrentUser(user);
    addStoredAuditLog({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'USER_LOGIN',
      entityType: 'USER',
      entityId: user.id,
      reason: 'User authenticated into administrative portal',
    });
    return { success: true, user };
  },

  submitRegistration(data: {
    applicantName: string;
    email: string;
    phone: string;
    requestedRole: UserRole;
    organizationName: string;
    organizationId?: string;
    designation: string;
    employeeId: string;
    bureauOrBranch: string;
    authorizationReference?: string;
    supportingNote?: string;
    // For institution specific onboarding
    permanentId?: string;
    institutionType?: any;
    state?: string;
    district?: string;
  }): { success: boolean; isPending: boolean; user?: User; request: RegistrationRequest } {
    const isPrivileged = data.requestedRole === 'BANK_OFFICER' || data.requestedRole === 'REGULATORY_OFFICER';
    const requestId = `req-${Date.now()}`;

    const newRequest: RegistrationRequest = {
      id: requestId,
      applicantName: data.applicantName,
      email: data.email,
      phone: data.phone,
      requestedRole: data.requestedRole,
      organizationName: data.organizationName,
      organizationId: data.organizationId,
      designation: data.designation,
      employeeId: data.employeeId,
      bureauOrBranch: data.bureauOrBranch,
      authorizationReference: data.authorizationReference,
      supportingNote: data.supportingNote,
      status: isPrivileged ? 'PENDING' : 'APPROVED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveSingleRegistrationRequest(newRequest);

    const newUser: User = {
      id: `user-${Date.now()}`,
      name: data.applicantName,
      email: data.email,
      role: data.requestedRole,
      designation: data.designation,
      phone: data.phone,
      institutionId: data.requestedRole === 'INSTITUTION' ? (data.organizationId || `inst-${Date.now()}`) : undefined,
      institutionName: data.requestedRole === 'INSTITUTION' ? data.organizationName : undefined,
      bankId: data.requestedRole === 'BANK_OFFICER' ? data.organizationId : undefined,
      bankName: data.requestedRole === 'BANK_OFFICER' ? data.organizationName : undefined,
      isApproved: !isPrivileged, // Bank officers and Regulatory officers strictly default to Pending
      createdAt: new Date().toISOString(),
    };

    const users = getStoredUsers();
    users.push(newUser);
    saveStoredUsers(users);

    if (!isPrivileged) {
      // Auto login institution users
      setStoredCurrentUser(newUser);
    }

    addStoredAuditLog({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: newUser.id,
      actorName: newUser.name,
      actorRole: data.requestedRole,
      action: isPrivileged ? 'PRIVILEGED_REGISTRATION_REQUESTED' : 'INSTITUTION_REGISTERED',
      entityType: 'USER',
      entityId: newUser.id,
      newState: isPrivileged ? 'Pending Approval' : 'Active',
      reason: isPrivileged
        ? `Applicant requested ${data.requestedRole} role under ${data.organizationName} (${data.employeeId}). Awaiting administrative verification.`
        : `Institution onboarding: ${data.organizationName} (${data.permanentId || data.employeeId})`,
    });

    return {
      success: true,
      isPending: isPrivileged,
      user: isPrivileged ? undefined : newUser,
      request: newRequest,
    };
  },

  getRegistrationRequests(filters?: {
    role?: string;
    status?: string;
    search?: string;
  }): RegistrationRequest[] {
    let requests = getStoredRegistrationRequests();

    if (!filters) return requests;

    if (filters.role && filters.role !== 'ALL') {
      requests = requests.filter((r) => r.requestedRole === filters.role);
    }

    if (filters.status && filters.status !== 'ALL') {
      requests = requests.filter((r) => r.status === filters.status);
    }

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      requests = requests.filter(
        (r) =>
          r.applicantName.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.organizationName.toLowerCase().includes(q) ||
          r.employeeId.toLowerCase().includes(q)
      );
    }

    return requests;
  },

  approveUser(userId: string): boolean {
    const users = getStoredUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) return false;
    user.isApproved = true;
    saveStoredUsers(users);

    const currentAdmin = this.getCurrentUser();
    addStoredAuditLog({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: currentAdmin.id,
      actorName: currentAdmin.name,
      actorRole: currentAdmin.role,
      action: 'USER_ACCESS_APPROVED',
      entityType: 'USER',
      entityId: user.id,
      previousState: 'UNAPPROVED',
      newState: 'APPROVED',
      reason: `Administrator manually activated access for user ${user.name} (${user.role})`,
    });
    return true;
  },

  approveRegistration(requestId: string): boolean {
    const requests = getStoredRegistrationRequests();
    const req = requests.find((r) => r.id === requestId);
    if (!req) return false;

    const currentAdmin = this.getCurrentUser();
    req.status = 'APPROVED';
    req.decidedBy = `${currentAdmin.name} (${currentAdmin.role})`;
    req.decidedAt = new Date().toISOString();
    req.updatedAt = new Date().toISOString();
    saveStoredRegistrationRequests(requests);

    // Update or create user account
    const users = getStoredUsers();
    let targetUser = users.find((u) => u.email.toLowerCase() === req.email.toLowerCase());
    if (targetUser) {
      targetUser.isApproved = true;
      targetUser.role = req.requestedRole; // Assign role server-side
      targetUser.designation = req.designation;
      if (req.requestedRole === 'BANK_OFFICER') {
        targetUser.bankId = req.organizationId;
        targetUser.bankName = req.organizationName;
      }
    } else {
      targetUser = {
        id: `user-${Date.now()}`,
        name: req.applicantName,
        email: req.email,
        role: req.requestedRole,
        designation: req.designation,
        phone: req.phone,
        bankId: req.organizationId,
        bankName: req.organizationName,
        isApproved: true,
        createdAt: new Date().toISOString(),
      };
      users.push(targetUser);
    }
    saveStoredUsers(users);

    addStoredAuditLog({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: currentAdmin.id,
      actorName: currentAdmin.name,
      actorRole: currentAdmin.role,
      action: 'REGISTRATION_REQUEST_APPROVED',
      entityType: 'USER',
      entityId: req.id,
      previousState: 'PENDING',
      newState: 'APPROVED',
      reason: `Administrator authorized ${req.requestedRole} credentials for ${req.applicantName} (${req.organizationName})`,
    });

    return true;
  },

  rejectRegistration(requestId: string, reason: string): boolean {
    const requests = getStoredRegistrationRequests();
    const req = requests.find((r) => r.id === requestId);
    if (!req) return false;

    const currentAdmin = this.getCurrentUser();
    req.status = 'REJECTED';
    req.decisionReason = reason;
    req.decidedBy = `${currentAdmin.name} (${currentAdmin.role})`;
    req.decidedAt = new Date().toISOString();
    req.updatedAt = new Date().toISOString();
    saveStoredRegistrationRequests(requests);

    // Revoke permissions from user account if exists
    const users = getStoredUsers();
    const user = users.find((u) => u.email.toLowerCase() === req.email.toLowerCase());
    if (user) {
      user.isApproved = false;
      saveStoredUsers(users);
    }

    addStoredAuditLog({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: currentAdmin.id,
      actorName: currentAdmin.name,
      actorRole: currentAdmin.role,
      action: 'REGISTRATION_REQUEST_REJECTED',
      entityType: 'USER',
      entityId: req.id,
      previousState: 'PENDING',
      newState: 'REJECTED',
      reason: `Administrator rejected registration for ${req.applicantName}. Reason: ${reason}`,
    });

    return true;
  },

  requestInfo(requestId: string, query: string): boolean {
    const requests = getStoredRegistrationRequests();
    const req = requests.find((r) => r.id === requestId);
    if (!req) return false;

    const currentAdmin = this.getCurrentUser();
    req.status = 'INFO_REQUIRED';
    req.infoQuery = query;
    req.decidedBy = `${currentAdmin.name} (${currentAdmin.role})`;
    req.decidedAt = new Date().toISOString();
    req.updatedAt = new Date().toISOString();
    saveStoredRegistrationRequests(requests);

    addStoredAuditLog({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: currentAdmin.id,
      actorName: currentAdmin.name,
      actorRole: currentAdmin.role,
      action: 'REGISTRATION_INFO_REQUESTED',
      entityType: 'USER',
      entityId: req.id,
      previousState: 'PENDING',
      newState: 'INFO_REQUIRED',
      reason: `Administrator requested additional information from ${req.applicantName}: "${query}"`,
    });

    return true;
  },

  logout(): void {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      addStoredAuditLog({
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorRole: currentUser.role,
        action: 'USER_LOGOUT',
        entityType: 'USER',
        entityId: currentUser.id,
        reason: 'User signed out from session',
      });
    }
    try {
      localStorage.removeItem('fdr_guardian_current_user_v2');
      localStorage.removeItem('fdr_guardian_current_user_v1');
      localStorage.removeItem('fdr_current_user');
      localStorage.removeItem('fdr_token');
    } catch {
      // ignore
    }
  },
};
