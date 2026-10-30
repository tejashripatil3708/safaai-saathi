/**
 * Safaai Saathi - Firebase Firestore Integration Service
 * Enables cloud synchronization of citizen sanitation tickets
 * and provides real-time integration with the Admin Web Dashboard.
 */
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  onSnapshot,
  Firestore,
  serverTimestamp,
} from 'firebase/firestore';
import { Complaint } from '../types';

// Default Firebase Configuration (reads from Vite env or fallback to project defaults)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDemo-Godhra-SafaaiSaathi2026',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'safai-saathi-panchmahal.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'safai-saathi-panchmahal',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'safai-saathi-panchmahal.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1029384756',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1029384756:web:a1b2c3d4e5f6',
};

class FirebaseService {
  private app: FirebaseApp | null = null;
  private db: Firestore | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.init();
  }

  private init() {
    try {
      this.app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      this.db = getFirestore(this.app);
      this.isConfigured = true;
      console.log('✅ Safaai Saathi Firestore Service Initialized (Ready for Admin Dashboard integration)');
    } catch (err) {
      console.warn('Firebase initialization in offline/fallback mode:', err);
      this.isConfigured = false;
    }
  }

  /**
   * Upload or sync a complaint to Firestore collection `complaints`
   * Ensures the ticket is accessible to the Municipal Admin Web Dashboard in real time.
   */
  async syncComplaintToCloud(complaint: Complaint): Promise<{ success: boolean; cloudId: string }> {
    if (!this.db || !this.isConfigured) {
      return { success: false, cloudId: complaint.id };
    }

    try {
      const docRef = doc(this.db, 'complaints', complaint.id);
      
      const firestorePayload = {
        ...complaint,
        serverReceivedAt: serverTimestamp(),
        syncSource: 'citizen_pwa_client',
      };

      await setDoc(docRef, firestorePayload, { merge: true });
      console.log(`📡 Complaint ${complaint.ticketId} successfully synced to Firestore for Admin Portal.`);
      return { success: true, cloudId: complaint.id };
    } catch (error) {
      console.warn(`Firestore sync queued locally for ticket ${complaint.ticketId}:`, error);
      return { success: false, cloudId: complaint.id };
    }
  }

  /**
   * Listen to real-time status updates from the Admin Website / Ward Inspector
   */
  listenToTicketUpdates(complaintId: string, onUpdate: (updatedComplaint: Partial<Complaint>) => void): () => void {
    if (!this.db || !this.isConfigured) {
      return () => {};
    }

    try {
      const docRef = doc(this.db, 'complaints', complaintId);
      return onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as Partial<Complaint>;
          onUpdate(data);
        }
      });
    } catch (err) {
      console.warn('Real-time ticket listener error:', err);
      return () => {};
    }
  }

  getIsConfigured(): boolean {
    return this.isConfigured;
  }
}

export const firebaseService = new FirebaseService();
