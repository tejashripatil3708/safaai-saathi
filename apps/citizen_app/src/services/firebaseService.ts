/**
 * Safaai Saathi - Firebase Firestore & Auth Integration Service
 * Enables cloud synchronization of citizen sanitation tickets
 * and provides real-time integration with the Admin Web Dashboard.
 */
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
  Firestore,
  serverTimestamp,
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, Auth, User } from 'firebase/auth';
import { Complaint, CitizenCollectionFeedback } from '../types';

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
  private auth: Auth | null = null;
  private currentUser: User | null = null;
  private authInitPromise: Promise<string | null> | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.init();
  }

  private init() {
    try {
      this.app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      this.db = getFirestore(this.app);
      this.auth = getAuth(this.app);
      this.isConfigured = true;

      // Authenticate citizen anonymously to satisfy Firestore security rules (request.auth.uid)
      this.authInitPromise = signInAnonymously(this.auth)
        .then((cred) => {
          this.currentUser = cred.user;
          console.log(`🔐 Safaai Saathi Anonymous Auth Active (UID: ${cred.user.uid.slice(0, 8)}...)`);
          return cred.user.uid;
        })
        .catch((authErr) => {
          console.warn('Anonymous auth fallback in offline mode:', authErr?.message || authErr);
          return null;
        });

      onAuthStateChanged(this.auth, (user) => {
        this.currentUser = user;
      });

      console.log('✅ Safaai Saathi Firestore Service Initialized (Ready for Admin Dashboard integration)');
    } catch (err) {
      console.warn('Firebase initialization in offline/fallback mode:', err);
      this.isConfigured = false;
    }
  }

  /**
   * Explicitly ensures the citizen has an active authenticated session before writes.
   * Prevents race conditions where a fast ticket submission occurs before auth completes.
   */
  public async ensureAuth(): Promise<string | null> {
    if (this.currentUser?.uid) {
      return this.currentUser.uid;
    }
    if (this.authInitPromise) {
      const uid = await this.authInitPromise;
      if (uid) return uid;
    }
    if (this.auth) {
      try {
        const cred = await signInAnonymously(this.auth);
        this.currentUser = cred.user;
        return cred.user.uid;
      } catch {
        return null;
      }
    }
    return null;
  }

  public getUid(): string | null {
    return this.currentUser?.uid || null;
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
      // Require verified authentication so deviceId == request.auth.uid passes firestore.rules
      const authUid = await this.ensureAuth();
      if (!authUid) {
        console.warn(`🔒 Anonymous auth not established; deferring cloud sync for ticket ${complaint.ticketId}`);
        return { success: false, cloudId: complaint.id };
      }
      const docRef = doc(this.db, 'complaints', complaint.id);
      
      const firestorePayload = {
        ...complaint,
        syncStatus: 'synced',
        deviceId: authUid,
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
   * Sync collection audit feedback to Firestore
   */
  async syncFeedbackToCloud(feedback: CitizenCollectionFeedback): Promise<boolean> {
    if (!this.db || !this.isConfigured) return false;
    try {
      const authUid = await this.ensureAuth();
      if (!authUid) return false;
      const docId = `${feedback.date}_${feedback.wardId}_${authUid.slice(0, 10)}`;
      const docRef = doc(this.db, 'collectionFeedback', docId);
      await setDoc(docRef, { 
        ...feedback, 
        syncStatus: 'synced', 
        deviceId: authUid, 
        serverReceivedAt: serverTimestamp() 
      }, { merge: true });
      return true;
    } catch {
      return false;
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
