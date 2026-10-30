import { firebaseService } from './firebaseService';
import { Complaint, CitizenCollectionFeedback, AppTheme } from '../types';

const STORAGE_KEYS = {
  DEVICE_ID: 'safai_sathi_device_id',
  WARD_ID: 'safai_sathi_selected_ward_id',
  CITIZEN_ADDRESS: 'safai_sathi_citizen_address_text',
  LANGUAGE: 'safai_sathi_language',
  THEME: 'safai_sathi_theme_mode',
  INTRO_SEEN: 'safai_sathi_intro_completed',
  PHONE: 'safai_sathi_verified_phone',
  COMPLAINTS: 'safai_sathi_my_complaints',
  MISSED_REPORTS: 'safai_sathi_missed_reports_by_date',
  FEEDBACK: 'safai_sathi_collection_feedback',
};

export class StorageService {
  static getDeviceId(): string {
    let id = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
      localStorage.setItem(STORAGE_KEYS.DEVICE_ID, id);
    }
    return id;
  }

  static getSelectedWardId(): string | null {
    return localStorage.getItem(STORAGE_KEYS.WARD_ID);
  }

  static setSelectedWardId(wardId: string): void {
    localStorage.setItem(STORAGE_KEYS.WARD_ID, wardId);
  }

  static getCitizenAddress(): string {
    return localStorage.getItem(STORAGE_KEYS.CITIZEN_ADDRESS) || 'Polan Bazar, Godhra';
  }

  static setCitizenAddress(addressText: string, wardId?: string): void {
    localStorage.setItem(STORAGE_KEYS.CITIZEN_ADDRESS, addressText);
    if (wardId) {
      localStorage.setItem(STORAGE_KEYS.WARD_ID, wardId);
    }
  }

  static getLanguage(): 'gu' | 'en' {
    const lang = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
    return lang === 'en' ? 'en' : 'gu';
  }

  static setLanguage(lang: 'gu' | 'en'): void {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
  }

  static getTheme(): AppTheme {
    const theme = localStorage.getItem(STORAGE_KEYS.THEME) as AppTheme;
    return theme || 'system';
  }

  static setTheme(theme: AppTheme): void {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }

  static hasSeenIntro(): boolean {
    return localStorage.getItem(STORAGE_KEYS.INTRO_SEEN) === 'true';
  }

  static setHasSeenIntro(seen: boolean): void {
    localStorage.setItem(STORAGE_KEYS.INTRO_SEEN, seen ? 'true' : 'false');
  }

  static getComplaints(): Complaint[] {
    const data = localStorage.getItem(STORAGE_KEYS.COMPLAINTS);
    if (!data) return [];
    try {
      const list: Complaint[] = JSON.parse(data);
      // Auto-check 24-hour resolution window
      let updated = false;
      const now = Date.now();
      list.forEach(c => {
        if (c.status === 'pending_verification' && c.adminResolvedAt) {
          const resolvedTime = new Date(c.adminResolvedAt).getTime();
          // If 24h passed without citizen verification, auto-resolve
          if (now - resolvedTime >= 24 * 3600 * 1000) {
            c.status = 'auto_resolved';
            c.resolvedAt = new Date().toISOString();
            c.resolvedNote = 'Auto-resolved after 24h citizen verification window';
            updated = true;
          }
        }
      });
      if (updated) {
        localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(list));
      }
      return list;
    } catch {
      return [];
    }
  }

  static saveComplaint(complaint: Complaint): void {
    const complaints = this.getComplaints();
    const existingIndex = complaints.findIndex(c => c.id === complaint.id);
    
    // Always default to 'pending_sync' until cloud confirmed
    if (!complaint.syncStatus) {
      complaint.syncStatus = 'pending_sync';
    }

    if (existingIndex >= 0) {
      complaints[existingIndex] = complaint;
    } else {
      complaints.unshift(complaint);
    }
    localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(complaints));

    // Asynchronously synchronize with Firestore for Municipal Admin Web Portal
    firebaseService.syncComplaintToCloud(complaint)
      .then(res => {
        if (res.success) {
          StorageService.updateComplaintSyncStatus(complaint.id, 'synced');
        } else {
          StorageService.updateComplaintSyncStatus(complaint.id, 'pending_sync');
        }
      })
      .catch(() => {
        StorageService.updateComplaintSyncStatus(complaint.id, 'pending_sync');
      });

    window.dispatchEvent(new CustomEvent('safai_sathi_new_complaint', { detail: complaint }));
  }

  /**
   * Save a complaint locally when an update is received from the Firestore snapshot listener.
   * Does NOT trigger a write back to cloud, avoiding unauthorized loop or overwriting staff actions.
   */
  static saveComplaintLocally(complaint: Complaint): void {
    const complaints = this.getComplaints();
    const existingIndex = complaints.findIndex(c => c.id === complaint.id);
    
    // Remote snapshot updates are by definition confirmed in sync with cloud
    const updatedComplaint: Complaint = {
      ...(existingIndex >= 0 ? complaints[existingIndex] : {}),
      ...complaint,
      syncStatus: 'synced',
    };

    if (existingIndex >= 0) {
      complaints[existingIndex] = updatedComplaint;
    } else {
      complaints.unshift(updatedComplaint);
    }
    localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(complaints));
    window.dispatchEvent(new CustomEvent('safai_sathi_complaints_synced', { detail: complaints }));
  }

  static updateComplaintSyncStatus(complaintId: string, syncStatus: 'synced' | 'pending_sync'): void {
    const complaints = this.getComplaints();
    const target = complaints.find(c => c.id === complaintId);
    if (target && target.syncStatus !== syncStatus) {
      target.syncStatus = syncStatus;
      localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(complaints));
      window.dispatchEvent(new CustomEvent('safai_sathi_complaints_synced', { detail: complaints }));
    }
  }

  static async retryPendingSync(): Promise<void> {
    const complaints = this.getComplaints();
    const pending = complaints.filter(c => c.syncStatus === 'pending_sync');
    if (pending.length === 0) return;

    console.log(`🌐 Network restored: auto-syncing ${pending.length} pending offline tickets to Firestore...`);
    for (const item of pending) {
      const res = await firebaseService.syncComplaintToCloud(item);
      if (res.success) {
        item.syncStatus = 'synced';
      }
    }
    localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(complaints));
    window.dispatchEvent(new CustomEvent('safai_sathi_complaints_synced', { detail: complaints }));
  }

  static markComplaintResolved(complaintId: string, resolvedPhotoUrl: string, resolvedNote?: string): void {
    const complaints = this.getComplaints();
    const target = complaints.find(c => c.id === complaintId);
    if (target) {
      target.status = 'resolved';
      target.resolvedPhotoUrl = resolvedPhotoUrl;
      target.resolvedAt = new Date().toISOString();
      target.resolvedNote = resolvedNote;
      localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(complaints));
      firebaseService.syncComplaintToCloud(target).catch(() => {});
    }
  }

  /**
   * Admin / Worker marks spot as Cleaned -> enters pending_verification
   */
  static adminResolveComplaint(
    complaintId: string,
    cleanedPhotoUrl: string,
    cleaningNote?: string,
    workerName?: string
  ): void {
    const complaints = this.getComplaints();
    const target = complaints.find(c => c.id === complaintId);
    if (target) {
      const now = new Date();
      target.status = 'pending_verification';
      target.adminResolvedPhotoUrl = cleanedPhotoUrl;
      target.adminResolvedAt = now.toISOString();
      target.adminResolvedNote = cleaningNote || 'Cleaned by municipal sanitation worker';
      target.workerName = workerName || 'Ramesh Parmar (Ward Sanitation Worker)';
      target.autoResolveDeadline = new Date(now.getTime() + 24 * 3600 * 1000).toISOString();
      localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(complaints));
      firebaseService.syncComplaintToCloud(target).catch(() => {});
    }
  }

  /**
   * Citizen cross-verification:
   * - If confirmed = true: marks resolved with citizen live photo proof
   * - If confirmed = false: marks reopened with citizen live photo proof + reason
   */
  static citizenVerifyResolution(
    complaintId: string,
    confirmed: boolean,
    proofPhotoUrl: string,
    reason?: string
  ): void {
    const complaints = this.getComplaints();
    const target = complaints.find(c => c.id === complaintId);
    if (target) {
      const now = new Date().toISOString();
      if (confirmed) {
        target.status = 'resolved';
        target.resolvedPhotoUrl = proofPhotoUrl;
        target.resolvedAt = now;
        target.resolvedNote = reason || 'Verified clean by citizen with camera proof';
        target.citizenVerifiedAt = now;
        target.citizenVerifiedStatus = 'confirmed';
      } else {
        target.status = 'reopened';
        target.citizenVerifiedAt = now;
        target.citizenVerifiedStatus = 'rejected';
        target.citizenRejectPhotoUrl = proofPhotoUrl;
        target.citizenRejectReason = reason || 'Citizen reported spot still unclean';
        target.note = `Disputed by citizen: ${reason || 'Still unclean'}`;
      }
      localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(complaints));
      firebaseService.syncComplaintToCloud(target).catch(() => {});
    }
  }

  /**
   * Citizen reopens a resolved or auto-resolved complaint
   */
  static reopenComplaint(
    complaintId: string,
    proofPhotoUrl: string,
    reason?: string
  ): void {
    const complaints = this.getComplaints();
    const target = complaints.find(c => c.id === complaintId);
    if (target) {
      const now = new Date().toISOString();
      target.status = 'reopened';
      target.reopenedAt = now;
      target.reopenPhotoUrl = proofPhotoUrl;
      target.reopenReason = reason || 'Reopened with fresh photo proof';
      target.note = `Reopened on ${now}: ${reason || 'Issue persisted'}`;
      localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(complaints));
      firebaseService.syncComplaintToCloud(target).catch(() => {});
    }
  }

  static updateComplaintStatus(complaintId: string, status: Complaint['status'], escalationLevel?: number): void {
    const complaints = this.getComplaints();
    const target = complaints.find(c => c.id === complaintId);
    if (target) {
      target.status = status;
      if (escalationLevel !== undefined) {
        target.escalationLevel = escalationLevel;
      }
      localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(complaints));
      firebaseService.syncComplaintToCloud(target).catch(() => {});
    }
  }

  static getTodayKey(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  static hasReportedMissedToday(wardId: string): boolean {
    const key = `${this.getTodayKey()}_${wardId}`;
    const data = localStorage.getItem(STORAGE_KEYS.MISSED_REPORTS);
    if (!data) return false;
    try {
      const records = JSON.parse(data);
      return Boolean(records[key]);
    } catch {
      return false;
    }
  }

  static markReportedMissedToday(wardId: string): void {
    const key = `${this.getTodayKey()}_${wardId}`;
    const data = localStorage.getItem(STORAGE_KEYS.MISSED_REPORTS);
    let records: Record<string, boolean> = {};
    if (data) {
      try {
        records = JSON.parse(data);
      } catch {
        records = {};
      }
    }
    records[key] = true;
    localStorage.setItem(STORAGE_KEYS.MISSED_REPORTS, JSON.stringify(records));
  }

  static isGarbageCollectedToday(wardId: string): boolean {
    const today = this.getTodayKey();
    const data = localStorage.getItem(STORAGE_KEYS.FEEDBACK);
    if (!data) return false;
    try {
      const list = JSON.parse(data);
      return list.some((item: CitizenCollectionFeedback) => item.wardId === wardId && item.date === today && item.collectionStatus === 'collected');
    } catch {
      return false;
    }
  }

  static resetGarbageCollectedToday(wardId: string): void {
    const today = this.getTodayKey();
    const data = localStorage.getItem(STORAGE_KEYS.FEEDBACK);
    if (!data) return;
    try {
      let list = JSON.parse(data);
      list = list.filter((item: CitizenCollectionFeedback) => !(item.wardId === wardId && item.date === today && item.collectionStatus === 'collected'));
      localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('safai_sathi_collection_updated'));
    } catch {}
  }

  static saveFeedback(feedback: CitizenCollectionFeedback): void {
    const data = localStorage.getItem(STORAGE_KEYS.FEEDBACK);
    let list = [];
    if (data) {
      try {
        list = JSON.parse(data);
      } catch {
        list = [];
      }
    }
    list.unshift(feedback);
    localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(list));
    // Asynchronously push collection feedback audit to Firestore
    firebaseService.syncFeedbackToCloud(feedback).catch(() => {});
    window.dispatchEvent(new CustomEvent('safai_sathi_collection_updated', { detail: feedback }));
  }

  static hasAnsweredFeedbackToday(wardId: string): boolean {
    const today = this.getTodayKey();
    const data = localStorage.getItem(STORAGE_KEYS.FEEDBACK);
    if (!data) return false;
    try {
      const list: CitizenCollectionFeedback[] = JSON.parse(data);
      return list.some(item => item.wardId === wardId && item.date === today);
    } catch {
      return false;
    }
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    StorageService.retryPendingSync();
  });
}
