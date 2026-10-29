import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { CONSTANTS, getDistanceMeters } from './constants';

admin.initializeApp();
const db = admin.firestore();

/**
 * 1. arrivalAlert: Triggers on vans/{vanId} write.
 * If the van is within 500m of the next ward in the route, sends push to topic `ward_{wardId}`.
 */
export const arrivalAlert = functions.firestore
  .document('vans/{vanId}')
  .onWrite(async (change, context) => {
    const afterData = change.after.data();
    if (!afterData || afterData.status !== 'on_shift' || !afterData.lastLocation) {
      return null;
    }

    const { routeId, currentTripId, lastLocation } = afterData;
    if (!currentTripId || !routeId) return null;

    const [tripDoc, routeDoc] = await Promise.all([
      db.collection('trips').doc(currentTripId).get(),
      db.collection('routes').doc(routeId).get(),
    ]);

    if (!tripDoc.exists || !routeDoc.exists) return null;

    const tripData = tripDoc.data()!;
    const routeData = routeDoc.data()!;
    const alertedWards: string[] = tripData.alertedWardIds || [];
    const wardsDone: any[] = tripData.wardsDone || [];
    const doneWardIds = new Set(wardsDone.map((w: any) => w.wardId));

    // Find the next upcoming ward not completed and not yet alerted
    const wardIds: string[] = routeData.wardIds || [];
    for (const wardId of wardIds) {
      if (!doneWardIds.has(wardId) && !alertedWards.includes(wardId)) {
        const wardDoc = await db.collection('wards').doc(wardId).get();
        if (wardDoc.exists) {
          const wardData = wardDoc.data()!;
          const dist = getDistanceMeters(lastLocation, wardData.center);

          if (dist <= CONSTANTS.ARRIVAL_ALERT_RADIUS_M) {
            // Send FCM push to ward topic
            await admin.messaging().send({
              topic: `ward_${wardId}`,
              notification: {
                title: '🌱 સફાઈ વાન નજીક છે / Sanitation Van Arriving',
                body: `સફાઈ વાન તમારા વિસ્તારથી ૫૦૦ મીટર દૂર છે. કચરો તૈયાર રાખો.`,
              },
              data: {
                wardId,
                vanId: context.params.vanId,
                type: 'arrival_alert',
              },
            });

            // Update trip alerted wards
            await tripDoc.ref.update({
              alertedWardIds: admin.firestore.FieldValue.arrayUnion(wardId),
            });
            break;
          }
        }
      }
    }
    return null;
  });

/**
 * 2. mergeDuplicates: Triggers on complaints create.
 * If another open complaint exists within 50m with same category, marks mergedInto.
 */
export const mergeDuplicates = functions.firestore
  .document('complaints/{complaintId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    if (!data || !data.location || !data.category) return null;

    const openComplaintsSnap = await db
      .collection('complaints')
      .where('wardId', '==', data.wardId)
      .where('status', 'in', ['received', 'assigned'])
      .get();

    for (const doc of openComplaintsSnap.docs) {
      if (doc.id === snap.id) continue;
      const other = doc.data();
      if (other.category === data.category && other.location) {
        const dist = getDistanceMeters(data.location, other.location);
        if (dist <= CONSTANTS.DUPLICATE_RADIUS_M) {
          await snap.ref.update({
            mergedInto: doc.id,
            status: 'assigned',
            note: `Auto-merged into existing active ticket ${other.ticketId || doc.id}`,
          });
          break;
        }
      }
    }
    return null;
  });

/**
 * 3. missedCollectionAlert: Triggers on complaints create with category missed_collection.
 * If 3 or more reports logged for same ward today, alerts ward inspector.
 */
export const missedCollectionAlert = functions.firestore
  .document('complaints/{complaintId}')
  .onCreate(async (snap) => {
    const data = snap.data();
    if (!data || data.category !== 'missed_collection') return null;

    const wardId = data.wardId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const countSnap = await db
      .collection('complaints')
      .where('wardId', '==', wardId)
      .where('category', '==', 'missed_collection')
      .where('createdAt', '>=', today.toISOString())
      .get();

    if (countSnap.size >= CONSTANTS.MISSED_REPORT_THRESHOLD) {
      const wardDoc = await db.collection('wards').doc(wardId).get();
      if (wardDoc.exists) {
        const inspectorId = wardDoc.data()?.inspectorId;
        if (inspectorId) {
          await admin.messaging().send({
            topic: `staff_${inspectorId}`,
            notification: {
              title: '⚠️ Missed Collection Threshold Alert',
              body: `Ward ${wardDoc.data()?.name || wardId} has received ${countSnap.size} missed collection reports today. Immediate verification required.`,
            },
            data: {
              wardId,
              reportCount: String(countSnap.size),
            },
          });
        }
      }
    }
    return null;
  });

/**
 * 4. escalateComplaints: Scheduled every 15 minutes.
 * Escalates open complaints older than 24h to Level 1, and older than 48h to Level 2.
 */
export const escalateComplaints = functions.pubsub
  .schedule('every 15 minutes')
  .onRun(async () => {
    const now = Date.now();
    const l1Threshold = new Date(now - CONSTANTS.ESCALATION_L1_HOURS * 3600 * 1000).toISOString();
    const l2Threshold = new Date(now - CONSTANTS.ESCALATION_L2_HOURS * 3600 * 1000).toISOString();

    const openComplaints = await db
      .collection('complaints')
      .where('status', 'in', ['received', 'assigned', 'escalated'])
      .get();

    const batch = db.batch();
    let updatedCount = 0;

    for (const doc of openComplaints.docs) {
      const data = doc.data();
      const createdAt = data.createdAt;
      const currentLevel = data.escalationLevel || 0;

      if (createdAt <= l2Threshold && currentLevel < 2) {
        batch.update(doc.ref, {
          escalationLevel: 2,
          status: 'escalated',
          escalatedAt: new Date().toISOString(),
        });
        updatedCount++;
      } else if (createdAt <= l1Threshold && currentLevel < 1) {
        batch.update(doc.ref, {
          escalationLevel: 1,
          status: 'escalated',
          escalatedAt: new Date().toISOString(),
        });
        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      await batch.commit();
      console.log(`Successfully auto-escalated ${updatedCount} complaints.`);
    }
    return null;
  });

/**
 * 5. vanOfflineWatch: Scheduled every 5 minutes.
 * Marks van offline if no location ping received for 10 minutes.
 */
export const vanOfflineWatch = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async () => {
    const thresholdTime = new Date(Date.now() - CONSTANTS.OFFLINE_THRESHOLD_MIN * 60 * 1000).toISOString();

    const activeVans = await db
      .collection('vans')
      .where('status', '==', 'on_shift')
      .get();

    for (const doc of activeVans.docs) {
      const data = doc.data();
      if (data.lastLocation?.updatedAt && data.lastLocation.updatedAt < thresholdTime) {
        await doc.ref.update({
          status: 'offline',
        });
        console.warn(`Van ${doc.id} marked offline due to inactive GPS telemetry.`);
      }
    }
    return null;
  });

/**
 * 6. verifyDriverPin: Callable function for Driver App authentication
 */
export const verifyDriverPin = functions.https.onCall(async (data) => {
  const { vanId, pin } = data;
  if (!vanId || !pin) {
    throw new functions.https.HttpsError('invalid-argument', 'vanId and pin required');
  }

  const secretDoc = await db.collection('vanSecrets').doc(vanId).get();
  if (!secretDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Van secret not found');
  }

  const storedPin = secretDoc.data()?.pin;
  if (storedPin !== pin) {
    throw new functions.https.HttpsError('permission-denied', 'Invalid Driver PIN');
  }

  // Create custom token with vanId claim
  const customToken = await admin.auth().createCustomToken(`driver_${vanId}`, {
    vanId,
    role: 'driver',
  });

  return { token: customToken };
});

/**
 * 7. sendNotice: Triggers on notices create.
 */
export const sendNotice = functions.firestore
  .document('notices/{noticeId}')
  .onCreate(async (snap) => {
    const data = snap.data();
    if (!data) return null;

    let targetTopic = 'all';
    if (data.targetType === 'ward') {
      targetTopic = `ward_${data.targetId}`;
    } else if (data.targetType === 'van') {
      targetTopic = `van_${data.targetId}`;
    }

    await admin.messaging().send({
      topic: targetTopic,
      notification: {
        title: '📢 સત્તાવાર સૂચના / Municipal Notice',
        body: data.message,
      },
      data: {
        noticeId: snap.id,
      },
    });
    return null;
  });
