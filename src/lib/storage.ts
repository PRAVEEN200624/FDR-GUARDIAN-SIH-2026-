import { FDRRecord, User, Institution, Bank, AuditLogEntry, NotificationItem, RegistrationRequest } from '../types';
import {
  INITIAL_FDRS,
  INITIAL_INSTITUTIONS,
  INITIAL_BANKS,
  INITIAL_USERS,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_REGISTRATION_REQUESTS,
} from '../services/seedData';

const STORAGE_KEYS = {
  FDRS: 'fdr_guardian_records_v2',
  INSTITUTIONS: 'fdr_guardian_institutions_v2',
  BANKS: 'fdr_guardian_banks_v2',
  USERS: 'fdr_guardian_users_v2',
  CURRENT_USER: 'fdr_guardian_current_user_v2',
  AUDIT_LOGS: 'fdr_guardian_audit_logs_v2',
  NOTIFICATIONS: 'fdr_guardian_notifications_v2',
  RECONCILIATIONS: 'fdr_guardian_reconciliations_v2',
  REGISTRATION_REQUESTS: 'fdr_guardian_registration_requests_v2',
};

type Listener = () => void;
const listeners: Set<Listener> = new Set();

export function subscribeToStorage(callback: Listener): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function notifySubscribers() {
  listeners.forEach((cb) => {
    try {
      cb();
    } catch (e) {
      console.error('Storage subscriber error:', e);
    }
  });
}

/**
 * Initialize storage with seed data if keys don't exist
 */
export function initializeStorage() {
  if (typeof window === 'undefined') return;

  if (!localStorage.getItem(STORAGE_KEYS.FDRS)) {
    localStorage.setItem(STORAGE_KEYS.FDRS, JSON.stringify(INITIAL_FDRS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.INSTITUTIONS)) {
    localStorage.setItem(STORAGE_KEYS.INSTITUTIONS, JSON.stringify(INITIAL_INSTITUTIONS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.BANKS)) {
    localStorage.setItem(STORAGE_KEYS.BANKS, JSON.stringify(INITIAL_BANKS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(INITIAL_USERS[0])); // Default to Institution user
  }
  if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.REGISTRATION_REQUESTS)) {
    localStorage.setItem(STORAGE_KEYS.REGISTRATION_REQUESTS, JSON.stringify(INITIAL_REGISTRATION_REQUESTS));
  }
}

/**
 * Reset storage back to clean demo baseline
 */
export function resetDemoData() {
  localStorage.setItem(STORAGE_KEYS.FDRS, JSON.stringify(INITIAL_FDRS));
  localStorage.setItem(STORAGE_KEYS.INSTITUTIONS, JSON.stringify(INITIAL_INSTITUTIONS));
  localStorage.setItem(STORAGE_KEYS.BANKS, JSON.stringify(INITIAL_BANKS));
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(INITIAL_USERS[0]));
  localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
  localStorage.setItem(STORAGE_KEYS.REGISTRATION_REQUESTS, JSON.stringify(INITIAL_REGISTRATION_REQUESTS));
  notifySubscribers();
}


// ----------------- FDR ACCESSORS ----------------- //

export function getStoredFDRs(): FDRRecord[] {
  initializeStorage();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FDRS);
    return raw ? JSON.parse(raw) : INITIAL_FDRS;
  } catch {
    return INITIAL_FDRS;
  }
}

export function saveStoredFDRs(fdrs: FDRRecord[]) {
  localStorage.setItem(STORAGE_KEYS.FDRS, JSON.stringify(fdrs));
  notifySubscribers();
}

export function saveSingleFDR(fdr: FDRRecord) {
  const all = getStoredFDRs();
  const index = all.findIndex((item) => item.id === fdr.id);
  if (index >= 0) {
    all[index] = fdr;
  } else {
    all.unshift(fdr);
  }
  saveStoredFDRs(all);
}

// ----------------- USERS & AUTH ACCESSORS ----------------- //

export function getStoredUsers(): User[] {
  initializeStorage();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    return raw ? JSON.parse(raw) : INITIAL_USERS;
  } catch {
    return INITIAL_USERS;
  }
}

export function saveStoredUsers(users: User[]) {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  notifySubscribers();
}

export function getCurrentUser(): User {
  initializeStorage();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return raw ? JSON.parse(raw) : INITIAL_USERS[0];
  } catch {
    return INITIAL_USERS[0];
  }
}

export function setCurrentUser(user: User) {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  notifySubscribers();
}

// ----------------- INSTITUTIONS & BANKS ----------------- //

export function getStoredInstitutions(): Institution[] {
  initializeStorage();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INSTITUTIONS);
    return raw ? JSON.parse(raw) : INITIAL_INSTITUTIONS;
  } catch {
    return INITIAL_INSTITUTIONS;
  }
}

export function saveStoredInstitutions(insts: Institution[]) {
  localStorage.setItem(STORAGE_KEYS.INSTITUTIONS, JSON.stringify(insts));
  notifySubscribers();
}

export function getStoredBanks(): Bank[] {
  initializeStorage();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BANKS);
    return raw ? JSON.parse(raw) : INITIAL_BANKS;
  } catch {
    return INITIAL_BANKS;
  }
}

// ----------------- AUDIT LOGS ----------------- //

export function getStoredAuditLogs(): AuditLogEntry[] {
  initializeStorage();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    return raw ? JSON.parse(raw) : INITIAL_AUDIT_LOGS;
  } catch {
    return INITIAL_AUDIT_LOGS;
  }
}

export function addStoredAuditLog(entry: AuditLogEntry) {
  const logs = getStoredAuditLogs();
  logs.unshift(entry);
  localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
  notifySubscribers();
}

// ----------------- NOTIFICATIONS ----------------- //

export function getStoredNotifications(): NotificationItem[] {
  initializeStorage();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return raw ? JSON.parse(raw) : INITIAL_NOTIFICATIONS;
  } catch {
    return INITIAL_NOTIFICATIONS;
  }
}

export function markNotificationAsRead(id: string) {
  const notifs = getStoredNotifications();
  const updated = notifs.map((n) => (n.id === id ? { ...n, isRead: true } : n));
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
  notifySubscribers();
}

export function markAllNotificationsAsRead() {
  const notifs = getStoredNotifications();
  const updated = notifs.map((n) => ({ ...n, isRead: true }));
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
  notifySubscribers();
}

// ----------------- REGISTRATION REQUESTS ----------------- //

export function getStoredRegistrationRequests(): RegistrationRequest[] {
  initializeStorage();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REGISTRATION_REQUESTS);
    return raw ? JSON.parse(raw) : INITIAL_REGISTRATION_REQUESTS;
  } catch {
    return INITIAL_REGISTRATION_REQUESTS;
  }
}

export function saveStoredRegistrationRequests(requests: RegistrationRequest[]) {
  localStorage.setItem(STORAGE_KEYS.REGISTRATION_REQUESTS, JSON.stringify(requests));
  notifySubscribers();
}

export function saveSingleRegistrationRequest(request: RegistrationRequest) {
  const all = getStoredRegistrationRequests();
  const index = all.findIndex((r) => r.id === request.id);
  if (index >= 0) {
    all[index] = request;
  } else {
    all.unshift(request);
  }
  saveStoredRegistrationRequests(all);
}

