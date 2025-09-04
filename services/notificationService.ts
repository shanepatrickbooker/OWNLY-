import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getMoodEntryCount, getMoodEntriesForDate } from '../app/(tabs)/database/database';

export interface NotificationSettings {
  enabled: boolean;
  time: string; // Format: "HH:MM"
  skipWeekends: boolean;
  pausedUntil?: string; // ISO string
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: false,
  time: '19:00', // 7 PM default
  skipWeekends: false,
};

const GENTLE_MESSAGES = [
  'A moment for self-reflection awaits',
  'How are you feeling today?',
  'Time for a gentle check-in with yourself',
  'Your emotional awareness practice is waiting',
  'Take a breath and check in with how you feel',
  'A quiet moment for your thoughts',
  'Your feelings deserve attention today',
  'Pause and notice what\'s happening inside',
  'Time to honor your emotional experience',
  'How is your heart today?'
];

const STORAGE_KEYS = {
  SETTINGS: 'notification_settings',
  LAST_SENT: 'last_notification_sent',
  PERMISSION_ASKED: 'notification_permission_asked'
};

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false, // Gentle, no sound
    shouldSetBadge: false,
  }),
});

class NotificationService {
  private static instance: NotificationService;
  
  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Request notification permissions
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log('Notifications only work on physical devices');
      return false;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Notification permission not granted');
        return false;
      }

      // Mark that we've asked for permission
      await AsyncStorage.setItem(STORAGE_KEYS.PERMISSION_ASKED, 'true');
      
      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  // Check if we've already asked for permissions
  async hasAskedForPermissions(): Promise<boolean> {
    try {
      const asked = await AsyncStorage.getItem(STORAGE_KEYS.PERMISSION_ASKED);
      return asked === 'true';
    } catch (error) {
      return false;
    }
  }

  // Get current notification settings
  async getSettings(): Promise<NotificationSettings> {
    try {
      const settingsData = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (settingsData) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(settingsData) };
      }
    } catch (error) {
      console.error('Error getting notification settings:', error);
    }
    return DEFAULT_SETTINGS;
  }

  // Update notification settings
  async updateSettings(settings: Partial<NotificationSettings>): Promise<void> {
    try {
      const currentSettings = await this.getSettings();
      const newSettings = { ...currentSettings, ...settings };
      
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
      
      // Reschedule notifications with new settings
      if (newSettings.enabled) {
        await this.scheduleDaily();
      } else {
        await this.cancelAllNotifications();
      }
    } catch (error) {
      console.error('Error updating notification settings:', error);
    }
  }

  // Check if user has already checked in today
  private async hasCheckedInToday(): Promise<boolean> {
    try {
      const today = new Date();
      const entries = await getMoodEntriesForDate(today);
      return entries.length > 0;
    } catch (error) {
      console.error('Error checking today\'s entries:', error);
      return false;
    }
  }

  // Check if notification was already sent today
  private async wasSentToday(): Promise<boolean> {
    try {
      const lastSent = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SENT);
      if (!lastSent) return false;

      const lastSentDate = new Date(lastSent);
      const today = new Date();
      
      return lastSentDate.toDateString() === today.toDateString();
    } catch (error) {
      return false;
    }
  }

  // Mark notification as sent today
  private async markSentToday(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SENT, new Date().toISOString());
    } catch (error) {
      console.error('Error marking notification as sent:', error);
    }
  }

  // Check if today should be skipped (weekends)
  private shouldSkipToday(skipWeekends: boolean): boolean {
    if (!skipWeekends) return false;
    
    const today = new Date().getDay();
    return today === 0 || today === 6; // Sunday or Saturday
  }

  // Check if notifications are paused
  private async isPaused(): Promise<boolean> {
    try {
      const settings = await this.getSettings();
      if (!settings.pausedUntil) return false;
      
      const pausedUntil = new Date(settings.pausedUntil);
      return new Date() < pausedUntil;
    } catch (error) {
      return false;
    }
  }

  // Get a random gentle message
  private getGentleMessage(): string {
    const randomIndex = Math.floor(Math.random() * GENTLE_MESSAGES.length);
    return GENTLE_MESSAGES[randomIndex];
  }

  // Schedule daily notifications
  async scheduleDaily(): Promise<void> {
    try {
      // Cancel existing notifications
      await this.cancelAllNotifications();

      const settings = await this.getSettings();
      if (!settings.enabled) return;

      const [hours, minutes] = settings.time.split(':').map(Number);
      
      // Schedule for today if time hasn't passed
      const now = new Date();
      const todayNotification = new Date();
      todayNotification.setHours(hours, minutes, 0, 0);

      if (todayNotification > now) {
        await this.scheduleSingleNotification(todayNotification);
      }

      // Schedule for the next 7 days
      for (let i = 1; i <= 7; i++) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + i);
        futureDate.setHours(hours, minutes, 0, 0);
        
        await this.scheduleSingleNotification(futureDate);
      }

    } catch (error) {
      console.error('Error scheduling notifications:', error);
    }
  }

  // Schedule a single notification with smart checks
  private async scheduleSingleNotification(date: Date): Promise<void> {
    try {
      const settings = await this.getSettings();
      
      // Skip weekends if configured
      const weekDay = date.getDay();
      if (settings.skipWeekends && (weekDay === 0 || weekDay === 6)) {
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'OWNLY',
          body: this.getGentleMessage(),
          sound: false,
          priority: Notifications.AndroidNotificationPriority.LOW,
          categoryIdentifier: 'mood-reminder',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: date,
        },
      });

    } catch (error) {
      console.error('Error scheduling single notification:', error);
    }
  }

  // Cancel all notifications
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  }

  // Pause notifications for a period
  async pauseNotifications(hours: number): Promise<void> {
    try {
      const pausedUntil = new Date();
      pausedUntil.setHours(pausedUntil.getHours() + hours);
      
      await this.updateSettings({ pausedUntil: pausedUntil.toISOString() });
    } catch (error) {
      console.error('Error pausing notifications:', error);
    }
  }

  // Resume paused notifications
  async resumeNotifications(): Promise<void> {
    try {
      await this.updateSettings({ pausedUntil: undefined });
    } catch (error) {
      console.error('Error resuming notifications:', error);
    }
  }

  // Handle notification received (when app is open)
  handleNotificationReceived(notification: Notifications.Notification): void {
    // Could track analytics here if needed
    console.log('Notification received:', notification);
  }

  // Handle notification response (when user taps)
  handleNotificationResponse(response: Notifications.NotificationResponse): void {
    // Navigate to reflection screen when user taps notification
    console.log('Notification tapped:', response);
    
    // Import router dynamically to avoid circular dependencies
    import('expo-router').then(({ router }) => {
      // Navigate to reflection tab
      router.push('/(tabs)/reflection');
    }).catch(error => {
      console.error('Error navigating from notification:', error);
    });
  }

  // Get scheduled notifications (for debugging)
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  // Smart notification check (called before sending)
  async shouldSendNotification(): Promise<boolean> {
    try {
      // Don't send if notifications are disabled
      const settings = await this.getSettings();
      if (!settings.enabled) return false;

      // Don't send if paused
      if (await this.isPaused()) return false;

      // Don't send if already sent today
      if (await this.wasSentToday()) return false;

      // Don't send if user already checked in today
      if (await this.hasCheckedInToday()) return false;

      // Don't send on weekends if configured
      if (this.shouldSkipToday(settings.skipWeekends)) return false;

      return true;
    } catch (error) {
      console.error('Error in shouldSendNotification:', error);
      return false;
    }
  }

  // Initialize the notification service
  async initialize(): Promise<void> {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('mood-reminders', {
          name: 'Mood Reminders',
          importance: Notifications.AndroidImportance.LOW,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      // Set up notification listeners
      Notifications.addNotificationReceivedListener(this.handleNotificationReceived);
      Notifications.addNotificationResponseReceivedListener(this.handleNotificationResponse);

      // Schedule notifications if enabled
      const settings = await this.getSettings();
      if (settings.enabled) {
        await this.scheduleDaily();
      }
    } catch (error) {
      console.error('Error initializing notification service:', error);
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();