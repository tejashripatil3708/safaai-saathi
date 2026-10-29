import { Complaint, CitizenCollectionFeedback, CitizenAddress } from '../types';

const STORAGE_KEYS = {
  DEVICE_ID: 'safai_sathi_device_id',
  WARD_ID: 'safai_sathi_selected_ward_id',
  CITIZEN_ADDRESS: 'safai_sathi_citizen_address_text',
  LANGUAGE: 'safai_sathi_language',
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

  static getVerifiedPhone(): string | null {
    return localStorage.getItem(STORAGE_KEYS.PHONE);
  }

  static setVerifiedPhone(phone: string): void {
    localStorage.setItem(STORAGE_KEYS.PHONE, phone);
  }

  static getComplaints(): Complaint[] {
    const data = localStorage.getItem(STORAGE_KEYS.COMPLAINTS);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static saveComplaint(complaint: Complaint): void {
    const complaints = this.getComplaints();
    const existingIndex = complaints.findIndex(c => c.id === complaint.id);
    if (existingIndex >= 0) {
      complaints[existingIndex] = complaint;
    } else {
      complaints.unshift(complaint);
    }
    localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(complaints));

    // Also trigger mock sync for admin website if open in another tab
    window.dispatchEvent(new CustomEvent('safai_sathi_new_complaint', { detail: complaint }));
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

  static saveFeedback(feedback: CitizenCollectionFeedback): void {
    const data = localStorage.getItem(STORAGE_KEYS.FEEDBACK);
    let list: CitizenCollectionFeedback[] = [];
    if (data) {
      try {
        list = JSON.parse(data);
      } catch {
        list = [];
      }
    }
    list.unshift(feedback);
    localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(list));
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
