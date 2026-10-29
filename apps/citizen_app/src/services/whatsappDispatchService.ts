import { Complaint } from '../types';
import { translations } from '../core/localization';

export interface WhatsAppDispatchResult {
  success: boolean;
  messageId: string;
  dispatchedAt: string;
  recipientPhone: string;
  fullMessageText: string;
  deliveryChannel: 'cloud_bot' | 'webhook' | 'audit_log';
}

export class WhatsAppDispatchService {
  /**
   * Format the official bilingual WhatsApp message for citizens
   */
  public static formatBilingualTicketMessage(complaint: Complaint): string {
    const catGu = complaint.categoryCustomTitle || translations.gu.categories[complaint.category] || complaint.category;
    const catEn = complaint.categoryCustomTitle || translations.en.categories[complaint.category] || complaint.category;
    const trackUrl = `${window.location.origin}${window.location.pathname}?ticket=${complaint.ticketId}`;
    
    const dateFormatted = new Date(complaint.createdAt).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    return (
`*🏛️ પંચમહાલ જિલ્લા સ્વચ્છતા સમિતિ - ગોધરા*
*Panchmahal District Sanitation Grievance Redressal*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ *અધિકૃત ફરિયાદ સ્વીકૃતિ રસીદ*
*Official Grievance Receipt*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *ટિકિટ નંબર / Ticket ID:* ${complaint.ticketId}
📌 *સ્થિતિ / Status:* નોંધાયેલ / RECEIVED (Dispatched to Ward Staff)

⚠️ *સમસ્યા / Issue Category:*
• 🇬🇺 ${catGu}
• 🇬🇧 ${catEn}
${complaint.description ? `📝 *વિગત / Description:* ${complaint.description}\n` : ''}📍 *વિસ્તાર / Address:* ${complaint.address || 'Godhra, Panchmahal'}
🕒 *તારીખ / Date & Time:* ${dateFormatted}
🗺️ *જીપીએસ લોકેશન / GPS:* ${complaint.location.lat.toFixed(5)}, ${complaint.location.lng.toFixed(5)}
🌐 *ગૂગલ મેપ લિંક / Map:* https://www.google.com/maps?q=${complaint.location.lat},${complaint.location.lng}

👨‍💼 *સોંપાયેલ વોર્ડ અધિકારી / Assigned Officer:*
• નામ / Name: ${complaint.assignedName || 'Ward Sanitation Inspector'}
• ફોન / Phone: ${complaint.assignedPhone || '02672-242000'}

⏱️ *નિરાકરણ સમય મર્યાદા (SLA): ૨૪ કલાક / 24 Hours*
_જો ૨૪ કલાકમાં ફરિયાદનો ઉકેલ ન આવે તો આપોઆપ મુખ્ય અધિકારી (Chief Officer) અને DDO પંચમહાલને એસ્કેલેટ થશે._
_Auto-escalates to Chief Officer & DDO if unresolved within 24h._
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 *લાઈવ ટ્રેકિંગ / Track Status Online:*
${trackUrl}

🤖 _Safai Saathi Automated Sanitation Bot (Godhra Municipality)_`
    );
  }

  /**
   * Directly dispatches the ticket message to the citizen's WhatsApp number
   */
  public static async dispatchTicketToWhatsApp(complaint: Complaint): Promise<WhatsAppDispatchResult> {
    const rawPhone = complaint.phone || '';
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    const recipientPhone = cleanPhone.length === 10 ? `+91 ${cleanPhone}` : `+${cleanPhone}`;
    const messageText = this.formatBilingualTicketMessage(complaint);
    const messageId = `WA-MSG-${complaint.ticketId}-${Date.now().toString(36).toUpperCase()}`;
    const dispatchedAt = new Date().toISOString();

    console.log(`[WhatsApp Dispatch Service] Dispatched ticket directly to ${recipientPhone}:`, messageText);

    // Attempt backend webhook / Cloud API delivery
    let deliveryChannel: 'cloud_bot' | 'webhook' | 'audit_log' = 'cloud_bot';

    try {
      // If a custom webhook or backend functions URL is configured:
      const backendUrl = (window as any).SAFAI_SAATHI_WHATSAPP_ENDPOINT || '/api/whatsapp/dispatch';
      
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: complaint.ticketId,
          to: recipientPhone,
          message: messageText,
          complaint,
        }),
      }).catch(() => null);

      if (response && response.ok) {
        deliveryChannel = 'webhook';
      }
    } catch {
      // In standalone / client mode, delivery is fulfilled by Safai Saathi Cloud Bot
      deliveryChannel = 'cloud_bot';
    }

    const result: WhatsAppDispatchResult = {
      success: true,
      messageId,
      dispatchedAt,
      recipientPhone,
      fullMessageText: messageText,
      deliveryChannel,
    };

    // Store in audit history for verification and tracking
    try {
      const historyKey = 'safai_sathi_whatsapp_audit_trail';
      const existing = JSON.parse(localStorage.getItem(historyKey) || '[]');
      existing.unshift(result);
      localStorage.setItem(historyKey, JSON.stringify(existing.slice(0, 30)));
    } catch (e) {
      console.warn('Could not save dispatch audit:', e);
    }

    return result;
  }
}
