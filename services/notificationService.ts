import { LocalNotifications } from '@capacitor/local-notifications';
import { db } from '@/db';

export const NotificationService = {
    async requestPermissions() {
        const status = await LocalNotifications.requestPermissions();
        return status.display === 'granted';
    },

    async checkPermissions() {
        const status = await LocalNotifications.checkPermissions();
        return status.display === 'granted';
    },

    async cancelAll() {
        const notifications = await LocalNotifications.getPending();
        if (notifications.notifications.length > 0) {
            await LocalNotifications.cancel(notifications);
        }
    },

    async scheduleSmartReminder() {
        try {
            await this.cancelAll();

            const moles = await db.moles.toArray();
            if (moles.length === 0) return;

            // Find the mole that needs checking the most (oldest last update)
            let oldestDate = new Date();
            let targetMole = null;
            let foundOldest = false;

            for (const mole of moles) {
                const latestEntry = await db.entries
                    .where('moleId')
                    .equals(mole.id!)
                    .reverse()
                    .first();

                const lastUpdate = latestEntry ? new Date(latestEntry.date) : new Date(mole.createdAt);

                if (!foundOldest || lastUpdate < oldestDate) {
                    oldestDate = lastUpdate;
                    targetMole = mole;
                    foundOldest = true;
                }
            }

            if (!targetMole) return;

            // Schedule for 30 days after last update
            const scheduleDate = new Date(oldestDate);
            scheduleDate.setDate(scheduleDate.getDate() + 30);
            scheduleDate.setHours(9, 0, 0, 0); // 9 AM

            // If that date has passed, schedule for tomorrow at 9 AM
            const now = new Date();
            if (scheduleDate <= now) {
                scheduleDate.setTime(now.getTime());
                scheduleDate.setDate(scheduleDate.getDate() + 1);
                scheduleDate.setHours(9, 0, 0, 0);
            }

            await LocalNotifications.schedule({
                notifications: [{
                    title: "Time for a Skin Check",
                    body: `It's been a while! Time to check on your ${targetMole.label} mole.`,
                    id: 1,
                    schedule: { at: scheduleDate },
                    smallIcon: 'ic_notification',
                    actionTypeId: "",
                    extra: null
                }]
            });

            console.log(`Scheduled reminder for ${targetMole.label} at ${scheduleDate}`);
        } catch (error) {
            console.error('Failed to schedule smart notification:', error);
        }
    }
};
