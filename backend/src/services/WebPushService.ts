import webpush from 'web-push';

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export class WebPushService {
  static initialize(): void {
    webpush.setVapidDetails(
      `mailto:${process.env.VAPID_EMAIL}`,
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );
  }

  static async sendNotification(subscription: PushSubscription, payload: any): Promise<void> {
    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload));
    } catch (error) {
      console.error('Error sending push notification:', error);
      throw error;
    }
  }

  static async sendBulkNotifications(subscriptions: PushSubscription[], payload: any): Promise<void> {
    const promises = subscriptions.map(subscription =>
      this.sendNotification(subscription, payload).catch(err => {
        console.error(`Failed to send to ${subscription.endpoint}:`, err);
      })
    );

    await Promise.all(promises);
  }

  static async sendAlertNotification(subscription: PushSubscription, alertData: {
    title: string;
    body: string;
    icon?: string;
    data?: any;
  }): Promise<void> {
    const payload = {
      notification: {
        title: alertData.title,
        body: alertData.body,
        icon: alertData.icon || '/icons/alert-icon.png',
        badge: '/icons/badge-icon.png',
        vibrate: [200, 100, 200],
        data: alertData.data,
        actions: [
          {
            action: 'view',
            title: 'Ver Alerta',
          },
        ],
      },
    };

    await this.sendNotification(subscription, payload);
  }
}
