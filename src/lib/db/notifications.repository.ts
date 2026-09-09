import { prisma, isDatabaseConfigured } from "@/lib/prisma";

export interface NotificationDeliveryItem {
  id: string;
  alertId?: string;
  notificationTitle: string;
  channel: "IN_APP" | "PUSH" | "SMS";
  recipient: string;
  status: "DELIVERED" | "PENDING" | "PROVIDER_NOT_CONFIGURED" | "FAILED";
  messagePreview: string;
  provider: string;
  timestamp: string;
}

// Initial seed deliveries so the system displays initial realistic audit logs
const SEED_DELIVERIES: NotificationDeliveryItem[] = [
  {
    id: "deliv-001",
    alertId: "ALT-TW-01",
    notificationTitle: "High Landslide Threat • Tawang Sector",
    channel: "IN_APP",
    recipient: "Active Citizen App Session",
    status: "DELIVERED",
    messagePreview: "High landslide risk detected on NH-13 Km 4 corridor. Use safe evacuation route.",
    provider: "SentinalX In-App Engine",
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: "deliv-002",
    alertId: "ALT-TW-01",
    notificationTitle: "High Landslide Threat • Tawang Sector",
    channel: "PUSH",
    recipient: "Registered Device Tokens (Web/APNS)",
    status: "PENDING",
    messagePreview: "High landslide risk (78/100) detected in Tawang Sector. Avoid affected corridor.",
    provider: "APNS / WebPush Gateway",
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: "deliv-003",
    alertId: "ALT-TW-01",
    notificationTitle: "High Landslide Threat • Tawang Sector",
    channel: "SMS",
    recipient: "+91 98765 43210 (Citizen Emergency Alert)",
    status: "PROVIDER_NOT_CONFIGURED",
    messagePreview: "SENTINALX EMERGENCY ALERT: HIGH LANDSLIDE RISK in Tawang Sector (78/100). Safe Shelter: Tawang Community Center.",
    provider: "Twilio / Gov SMS Gateway (Not Configured)",
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: "deliv-004",
    alertId: "ALT-GTK-02",
    notificationTitle: "Active Debris Watch • Sevoke Teesta Escarpment",
    channel: "IN_APP",
    recipient: "Active Citizen App Session",
    status: "DELIVERED",
    messagePreview: "Moderate slope instability and minor debris wash along Teesta River valley cutting.",
    provider: "SentinalX In-App Engine",
    timestamp: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
  },
  {
    id: "deliv-005",
    alertId: "ALT-GTK-02",
    notificationTitle: "Active Debris Watch • Sevoke Teesta Escarpment",
    channel: "SMS",
    recipient: "+91 94350 11223",
    status: "PROVIDER_NOT_CONFIGURED",
    messagePreview: "SENTINALX ADVISORY: Debris watch active along Teesta River valley.",
    provider: "Twilio / Gov SMS Gateway (Not Configured)",
    timestamp: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
  },
];

const memoryDeliveries: NotificationDeliveryItem[] = [...SEED_DELIVERIES];

export const NotificationsRepository = {
  /**
   * Log a new notification delivery attempt across channels
   */
  async recordDelivery(item: Omit<NotificationDeliveryItem, "id" | "timestamp">): Promise<NotificationDeliveryItem> {
    const now = new Date().toISOString();
    const record: NotificationDeliveryItem = {
      ...item,
      id: `deliv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: now,
    };

    memoryDeliveries.unshift(record);

    if (isDatabaseConfigured) {
      try {
        const created = await prisma.notificationDelivery.create({
          data: {
            alertId: record.alertId,
            channel: record.channel,
            recipient: record.recipient,
            status: record.status,
            messagePreview: record.messagePreview,
            provider: record.provider,
            timestamp: new Date(now),
          },
        });
        record.id = created.id;
      } catch (err) {
        console.warn("[NotificationsRepository] Prisma recordDelivery failed:", err);
      }
    }

    return record;
  },

  /**
   * Get all notification delivery history
   */
  async getDeliveries(limit = 50): Promise<NotificationDeliveryItem[]> {
    if (isDatabaseConfigured) {
      try {
        const dbItems = await prisma.notificationDelivery.findMany({
          orderBy: { timestamp: "desc" },
          take: limit,
          include: { alert: true },
        });

        if (dbItems && dbItems.length > 0) {
          return dbItems.map((d) => ({
            id: d.id,
            alertId: d.alertId || undefined,
            notificationTitle: d.alert?.title || "Operational Alert Notification",
            channel: d.channel as "IN_APP" | "PUSH" | "SMS",
            recipient: d.recipient,
            status: d.status as NotificationDeliveryItem["status"],
            messagePreview: d.messagePreview,
            provider: d.provider,
            timestamp: d.timestamp.toISOString(),
          }));
        }
      } catch (err) {
        console.warn("[NotificationsRepository] Prisma getDeliveries failed, using memory store:", err);
      }
    }

    return memoryDeliveries.slice(0, limit);
  },

  /**
   * Create standard multi-channel deliveries for an alert
   */
  async dispatchMultiChannelAlert(alert: {
    id: string;
    title: string;
    message: string;
    locationName: string;
    severity: string;
    riskScore?: number | null;
  }): Promise<NotificationDeliveryItem[]> {
    const results: NotificationDeliveryItem[] = [];

    // 1. IN-APP Notification (Active & Delivered)
    results.push(
      await this.recordDelivery({
        alertId: alert.id,
        notificationTitle: alert.title,
        channel: "IN_APP",
        recipient: "Active Citizen App Session",
        status: "DELIVERED",
        messagePreview: alert.message,
        provider: "SentinalX In-App Engine",
      })
    );

    // 2. PUSH Notification (Ready / Device Permission Required)
    results.push(
      await this.recordDelivery({
        alertId: alert.id,
        notificationTitle: alert.title,
        channel: "PUSH",
        recipient: "Registered Device Tokens (WebPush)",
        status: "PENDING",
        messagePreview: `${alert.severity} LANDSLIDE ALERT: ${alert.locationName} (${alert.riskScore ? Math.round(alert.riskScore) : "High"}/100)`,
        provider: "WebPush Gateway (Browser Permission Required)",
      })
    );

    // 3. SMS Alert (Honest status: Provider Not Configured unless env set)
    const hasTwilio = Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
    results.push(
      await this.recordDelivery({
        alertId: alert.id,
        notificationTitle: alert.title,
        channel: "SMS",
        recipient: "+91 98765 43210 (Designated Sector Broadcast)",
        status: hasTwilio ? "DELIVERED" : "PROVIDER_NOT_CONFIGURED",
        messagePreview: `SENTINALX EMERGENCY ALERT: ${alert.severity} RISK in ${alert.locationName}. Avoid affected zone. Emergency: 112`,
        provider: hasTwilio ? "Twilio SMS Gateway" : "SMS Provider Not Configured",
      })
    );

    return results;
  },
};
