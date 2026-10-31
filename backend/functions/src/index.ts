import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { CONSTANTS, getDistanceMeters } from './constants';
import { WhatsAppBotService } from './whatsappService';

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
 * 2. mergeDuplicates & WhatsApp Bot Notification: Triggers on complaints create.
 * If another open complaint exists within 50m with same category, marks mergedInto.
 * Dispatches automated receipt directly to citizen's WhatsApp.
 */
export const mergeDuplicates = functions.firestore
  .document('complaints/{complaintId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    if (!data || !data.location || !data.category) return null;

    const openComplaintsSnap = await db
      .collection('complaints')
      .where('wardId', '==', data.wardId)
      .where('status', 'in', ['received', 'assigned', 'in_progress'])
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

    // Automated WhatsApp Bot delivery to citizen's WhatsApp number
    if (data.phone) {
      try {
        const trackUrl = `https://tejashripatil3708.github.io/safai-saathi/?ticket=${data.ticketId || snap.id}`;
        await WhatsAppBotService.sendComplaintReceipt(
          data.phone,
          data.ticketId || snap.id,
          data.categoryCustomTitle || data.category,
          data.category,
          data.address || 'Godhra, Panchmahal',
          trackUrl
        );
      } catch (err) {
        console.warn('Automated WhatsApp bot dispatch deferred:', err);
      }
    }

    // Dispatch real-time alert to Municipal Admins & Ward Inspector
    try {
      await admin.messaging().send({
        topic: 'admin_all',
        notification: {
          title: `🚨 New Civic Ticket: ${data.ticketId || snap.id}`,
          body: `${data.category}: ${data.address || 'Godhra'} - Requires inspection`,
        },
        data: {
          complaintId: snap.id,
          ticketId: data.ticketId || snap.id,
          wardId: data.wardId || '',
          category: data.category || '',
          status: 'received',
        },
      });
    } catch (e) {
      console.warn('Admin notification push deferred:', e);
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
 * - Escalates older than 24h to Level 1
 * - Escalates older than 48h to Level 2
 * - Escalates older than 72h to Level 3 and dispatches Direct Authority Numbers to citizen's WhatsApp!
 */
export const escalateComplaints = functions.pubsub
  .schedule('every 15 minutes')
  .onRun(async () => {
    const now = Date.now();
    const l1Threshold = new Date(now - CONSTANTS.ESCALATION_L1_HOURS * 3600 * 1000).toISOString();
    const l2Threshold = new Date(now - CONSTANTS.ESCALATION_L2_HOURS * 3600 * 1000).toISOString();
    const l3Threshold = new Date(now - 72 * 3600 * 1000).toISOString();

    const openComplaints = await db
      .collection('complaints')
      .where('status', 'in', ['received', 'assigned', 'in_progress', 'reopened', 'escalated'])
      .get();

    const batch = db.batch();
    let updatedCount = 0;

    for (const doc of openComplaints.docs) {
      const data = doc.data();
      const createdAt = data.createdAt;
      const currentLevel = data.escalationLevel || 0;

      // 72-Hour SLA Breach Escalation
      if (createdAt <= l3Threshold && (!data.sla72Notified)) {
        const wardDoc = await db.collection('wards').doc(data.wardId).get();
        const wardData = wardDoc.exists ? wardDoc.data()! : {};

        // Dispatch direct WhatsApp alert to citizen with authority contact numbers
        if (data.phone) {
          await WhatsAppBotService.send72HourSlaBreachAlert(
            data.phone,
            data.ticketId || doc.id,
            data.category,
            data.address || 'Godhra, Panchmahal',
            wardData.inspectorName || 'Rajesh Parmar (Inspector)',
            wardData.inspectorPhone || '+91 94260 12341',
            wardData.escalationPhone || '+91 94260 99001',
            '+91 2672 242000'
          );
        }

        batch.update(doc.ref, {
          escalationLevel: 3,
          status: 'escalated',
          sla72Notified: true,
          escalatedAt: new Date().toISOString(),
          note: '72h SLA breached: Escalated to DDO Panchmahal. Authority contacts dispatched to citizen.',
        });
        updatedCount++;
      } else if (createdAt <= l2Threshold && currentLevel < 2) {
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
      console.log(`Successfully escalated ${updatedCount} complaints.`);
    }
    return null;
  });

/**
 * 5. autoResolvePendingComplaints: Scheduled every 15 minutes.
 * If 24 hours have passed since worker/admin marked cleaned and citizen hasn't verified,
 * automatically marks ticket as 'auto_resolved' and informs citizen they can still reopen.
 */
export const autoResolvePendingComplaints = functions.pubsub
  .schedule('every 15 minutes')
  .onRun(async () => {
    const nowIso = new Date().toISOString();

    const pendingSnap = await db
      .collection('complaints')
      .where('status', '==', 'pending_verification')
      .where('autoResolveDeadline', '<=', nowIso)
      .get();

    for (const doc of pendingSnap.docs) {
      const data = doc.data();
      await doc.ref.update({
        status: 'auto_resolved',
        resolvedAt: nowIso,
        resolvedNote: 'Auto-resolved after 24h citizen non-response',
        autoResolvedAt: nowIso,
      });

      if (data.phone) {
        const reopenUrl = `https://tejashripatil3708.github.io/safai-saathi/?ticket=${data.ticketId || doc.id}`;
        await WhatsAppBotService.sendAutoResolvedNotice(
          data.phone,
          data.ticketId || doc.id,
          reopenUrl
        );
      }
      console.log(`Complaint ${doc.id} auto-resolved after 24 hours.`);
    }
    return null;
  });

/**
 * 6. adminResolveComplaint: Callable function for Admin & Worker App.
 * Allows Sanitation Worker or Admin to update that spot has been cleaned,
 * attaching cleaning proof photo and triggering citizen cross-verification request on WhatsApp.
 */
export const adminResolveComplaint = functions.https.onCall(async (data, context) => {
  const { complaintId, workerName, workerId, cleanedPhotoUrl, cleaningNote } = data;
  if (!complaintId || !cleanedPhotoUrl) {
    throw new functions.https.HttpsError('invalid-argument', 'complaintId and cleanedPhotoUrl are required');
  }

  const complaintRef = db.collection('complaints').doc(complaintId);
  const complaintDoc = await complaintRef.get();
  if (!complaintDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Complaint not found');
  }

  const now = new Date();
  const autoResolveDeadline = new Date(now.getTime() + 24 * 3600 * 1000).toISOString();

  await complaintRef.update({
    status: 'pending_verification',
    adminResolvedAt: now.toISOString(),
    adminResolvedPhotoUrl: cleanedPhotoUrl,
    adminResolvedNote: cleaningNote || '',
    workerName: workerName || 'Municipal Sanitation Team',
    workerId: workerId || 'worker_default',
    autoResolveDeadline,
  });

  const complaint = complaintDoc.data()!;
  if (complaint.phone) {
    const verifyUrl = `https://tejashripatil3708.github.io/safai-saathi/?verify=${complaintId}&ticket=${complaint.ticketId}`;
    await WhatsAppBotService.sendCleaningVerificationRequest(
      complaint.phone,
      complaint.ticketId || complaintId,
      workerName || 'Municipal Sanitation Team',
      cleanedPhotoUrl,
      verifyUrl
    );
  }

  return { success: true, status: 'pending_verification', autoResolveDeadline };
});

/**
 * 7. citizenVerifyResolution: Callable function for Citizen Cross-Verification.
 * - If confirmed == true: Citizen provides proof photo -> Ticket marked complete ('resolved').
 * - If confirmed == false: Citizen provides proof photo of continued issue + reason -> Ticket marked 'reopened'.
 */
export const citizenVerifyResolution = functions.https.onCall(async (data, context) => {
  const { complaintId, confirmed, proofPhotoUrl, reason } = data;
  if (!complaintId || confirmed === undefined || !proofPhotoUrl) {
    throw new functions.https.HttpsError('invalid-argument', 'complaintId, confirmed, and proofPhotoUrl are required');
  }

  const complaintRef = db.collection('complaints').doc(complaintId);
  const complaintDoc = await complaintRef.get();
  if (!complaintDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Complaint not found');
  }

  const now = new Date().toISOString();
  const complaint = complaintDoc.data()!;

  if (confirmed) {
    await complaintRef.update({
      status: 'resolved',
      resolvedPhotoUrl: proofPhotoUrl,
      resolvedAt: now,
      resolvedNote: reason || 'Citizen cross-verified clean with live photo',
      citizenVerifiedAt: now,
      citizenVerifiedStatus: 'confirmed',
    });
  } else {
    await complaintRef.update({
      status: 'reopened',
      citizenVerifiedAt: now,
      citizenVerifiedStatus: 'rejected',
      citizenRejectPhotoUrl: proofPhotoUrl,
      citizenRejectReason: reason || 'Citizen reported spot still unclean',
      note: `Citizen rejected resolution: ${reason || 'Still unclean'}. Urgent re-inspection required.`,
    });

    if (complaint.phone) {
      await WhatsAppBotService.sendTicketReopenedNotice(
        complaint.phone,
        complaint.ticketId || complaintId,
        reason || 'Spot still unclean'
      );
    }
  }

  return { success: true, newStatus: confirmed ? 'resolved' : 'reopened' };
});

/**
 * 8. reopenComplaint: Callable function allowing citizen to reopen an auto-resolved or resolved ticket.
 */
export const reopenComplaint = functions.https.onCall(async (data, context) => {
  const { complaintId, proofPhotoUrl, reason } = data;
  if (!complaintId || !proofPhotoUrl) {
    throw new functions.https.HttpsError('invalid-argument', 'complaintId and proofPhotoUrl are required');
  }

  const complaintRef = db.collection('complaints').doc(complaintId);
  const complaintDoc = await complaintRef.get();
  if (!complaintDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Complaint not found');
  }

  const now = new Date().toISOString();
  await complaintRef.update({
    status: 'reopened',
    reopenedAt: now,
    reopenPhotoUrl: proofPhotoUrl,
    reopenReason: reason || 'Reopened by citizen with continuing grievance proof',
    note: `Reopened by citizen on ${now}: ${reason || 'Issue persisted'}`,
  });

  const complaint = complaintDoc.data()!;
  if (complaint.phone) {
    await WhatsAppBotService.sendTicketReopenedNotice(
      complaint.phone,
      complaint.ticketId || complaintId,
      reason || 'Reopened by citizen'
    );
  }

  return { success: true, status: 'reopened' };
});

/**
 * 9. whatsappWebhook: Two-way WhatsApp Bot Webhook
 * Handles citizen replies:
 * - 'YES' / 'હા' -> cross-verifies resolution
 * - 'NO' / 'ના' -> flags dispute and requests photo proof
 * - 'STATUS' -> sends current status
 */
export const whatsappWebhook = functions.https.onRequest(async (req, res) => {
  // Verification for Meta WhatsApp webhook
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token === (process.env.WHATSAPP_VERIFY_TOKEN || 'safai_saathi_token')) {
      res.status(200).send(challenge);
      return;
    }
    res.status(403).send('Forbidden');
    return;
  }

  const body = req.body;
  try {
    let incomingText = '';
    let fromPhone = '';

    if (body.Body && body.From) {
      incomingText = String(body.Body).trim().toUpperCase();
      fromPhone = WhatsAppBotService.sanitizePhone(body.From);
    } else if (body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      const msgObj = body.entry[0].changes[0].value.messages[0];
      incomingText = (msgObj.text?.body || '').trim().toUpperCase();
      fromPhone = WhatsAppBotService.sanitizePhone(msgObj.from);
    }

    if (fromPhone) {
      const snap = await db.collection('complaints')
        .where('phone', '>=', fromPhone)
        .limit(1)
        .get();

      if (!snap.empty) {
        const doc = snap.docs[0];
        const complaint = doc.data();

        if (incomingText === 'YES' || incomingText === 'હા' || incomingText === '1') {
          await doc.ref.update({
            status: 'resolved',
            citizenVerifiedAt: new Date().toISOString(),
            citizenVerifiedStatus: 'confirmed',
            resolvedNote: 'Confirmed via WhatsApp Bot reply YES',
          });
          await WhatsAppBotService.sendMessage(fromPhone, `✅ આપની ખાતરી બદલ આભાર! ટિકિટ ${complaint.ticketId} સંપન્ન ગણવામાં આવી છે.\nThank you! Ticket confirmed resolved.`);
        } else if (incomingText === 'NO' || incomingText === 'ના' || incomingText === '2') {
          await doc.ref.update({
            status: 'reopened',
            citizenVerifiedAt: new Date().toISOString(),
            citizenVerifiedStatus: 'rejected',
            citizenRejectReason: 'Disputed via WhatsApp Bot reply NO',
          });
          await WhatsAppBotService.sendMessage(fromPhone, `⚠️ આપની ફરિયાદ પુનઃ સક્રિય કરવામાં આવી છે. કૃપા કરીને તાજો ફોટો એપમાં અપલોડ કરો:\nhttps://tejashripatil3708.github.io/safai-saathi/?ticket=${complaint.ticketId}`);
        } else if (incomingText === 'STATUS') {
          await WhatsAppBotService.sendMessage(fromPhone, `ℹ️ ટિકિટ ${complaint.ticketId} ની સ્થિતિ: ${complaint.status.toUpperCase()}.\nલાઇવ ટ્રેકિંગ: https://tejashripatil3708.github.io/safai-saathi/?ticket=${complaint.ticketId}`);
        }
      }
    }
  } catch (err) {
    console.error('Error in WhatsApp webhook:', err);
  }

  res.status(200).send({ received: true });
});

/**
 * 10. vanOfflineWatch: Scheduled every 5 minutes.
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
        await doc.ref.update({ status: 'offline' });
      }
    }
    return null;
  });

/**
 * 11. verifyDriverPin: Callable function for Driver App authentication
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

  const customToken = await admin.auth().createCustomToken(`driver_${vanId}`, {
    vanId,
    role: 'driver',
  });

  return { token: customToken };
});


/**
 * 12. getWardDutyStatus: Checks if the sanitation van's duty in a specific ward has concluded for today.
 */
export const getWardDutyStatus = functions.https.onCall(async (data, context) => {
  const { wardId, date } = data;
  if (!wardId) {
    throw new functions.https.HttpsError('invalid-argument', 'wardId is required');
  }
  const todayKey = date || new Date().toISOString().split('T')[0];
  const dutyDoc = await db.collection('wardDuty').doc(`${todayKey}_${wardId}`).get();
  if (dutyDoc.exists) {
    const d = dutyDoc.data()!;
    return {
      isDutyOver: Boolean(d.isDutyOver || d.status === 'completed'),
      status: d.status || 'completed',
      completedAt: d.completedAt || null,
    };
  }

  // Also verify against active trips for today
  const tripsSnap = await db.collection('trips')
    .where('date', '==', todayKey)
    .where('status', '==', 'completed')
    .limit(1)
    .get();

  if (!tripsSnap.empty) {
    return { isDutyOver: true, status: 'completed' };
  }

  return { isDutyOver: false, status: 'in_progress' };
});

/**
 * 13. markWardDutyCompleted: Callable for Driver / Supervisor App to mark duty completed.
 */
export const markWardDutyCompleted = functions.https.onCall(async (data, context) => {
  const { wardId, vanId, routeId } = data;
  if (!wardId) {
    throw new functions.https.HttpsError('invalid-argument', 'wardId is required');
  }
  const todayKey = new Date().toISOString().split('T')[0];
  await db.collection('wardDuty').doc(`${todayKey}_${wardId}`).set({
    wardId,
    vanId: vanId || 'van_default',
    routeId: routeId || 'route_default',
    date: todayKey,
    isDutyOver: true,
    status: 'completed',
    completedAt: new Date().toISOString(),
  }, { merge: true });

  return { success: true, wardId, status: 'completed', isDutyOver: true };
});
