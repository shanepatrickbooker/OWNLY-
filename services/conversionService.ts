import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { subscriptionService } from './subscriptionService';
import { CONVERSION_TRIGGERS } from '../types/subscription';

interface ConversionEvent {
  triggerId: string;
  timestamp: string;
  context?: any;
}

interface UserMetrics {
  totalMoodEntries: number;
  firstEntryDate: string | null;
  lastEntryDate: string | null;
  insightsViewCount: number;
  historyAccessAttempts: number;
}

class ConversionService {
  private readonly EVENTS_KEY = 'conversion_events';
  private readonly METRICS_KEY = 'user_metrics';
  private readonly PAYWALL_COOLDOWN_KEY = 'paywall_cooldown';

  // Track user metrics
  async updateUserMetrics(updates: Partial<UserMetrics>): Promise<void> {
    try {
      const existingMetrics = await this.getUserMetrics();
      const updatedMetrics = { ...existingMetrics, ...updates };
      await AsyncStorage.setItem(this.METRICS_KEY, JSON.stringify(updatedMetrics));
    } catch (error) {
      if (__DEV__) console.error('Failed to update user metrics:', error);
    }
  }

  // Get current user metrics
  async getUserMetrics(): Promise<UserMetrics> {
    try {
      const metricsData = await AsyncStorage.getItem(this.METRICS_KEY);
      if (metricsData) {
        return JSON.parse(metricsData);
      }
    } catch (error) {
      if (__DEV__) console.error('Failed to get user metrics:', error);
    }

    // Return default metrics
    return {
      totalMoodEntries: 0,
      firstEntryDate: null,
      lastEntryDate: null,
      insightsViewCount: 0,
      historyAccessAttempts: 0
    };
  }

  // Check and trigger conversions based on mood entries
  async checkMoodEntryTrigger(entryCount: number): Promise<void> {
    try {
      // Skip if user already has premium
      const hasPremium = await subscriptionService.hasPremiumAccess();
      if (hasPremium) return;

      // Check if we should trigger after 10 entries
      if (entryCount === 10) {
        await this.triggerConversion('mood_entries_10', { entryCount });
      }
    } catch (error) {
      if (__DEV__) console.error('Error checking mood entry trigger:', error);
    }
  }

  // Check and trigger conversion based on time since first use
  async checkTimeBasedTrigger(): Promise<void> {
    try {
      const hasPremium = await subscriptionService.hasPremiumAccess();
      if (hasPremium) return;

      const metrics = await this.getUserMetrics();
      if (!metrics.firstEntryDate) return;

      const firstEntryDate = new Date(metrics.firstEntryDate);
      const now = new Date();
      const daysSinceFirstEntry = (now.getTime() - firstEntryDate.getTime()) / (1000 * 60 * 60 * 24);

      // Trigger after 1 week of use
      if (daysSinceFirstEntry >= 7 && !await this.hasTriggeredRecently('week_of_use')) {
        await this.triggerConversion('week_of_use', { daysSinceFirstEntry });
      }
    } catch (error) {
      if (__DEV__) console.error('Error checking time-based trigger:', error);
    }
  }

  // Trigger conversion when user tries to access old history
  async checkHistoryAccessTrigger(): Promise<void> {
    try {
      const hasPremium = await subscriptionService.hasPremiumAccess();
      if (hasPremium) return;

      // Update metrics
      const metrics = await this.getUserMetrics();
      await this.updateUserMetrics({ 
        historyAccessAttempts: metrics.historyAccessAttempts + 1 
      });

      // Trigger after 3 attempts to access full history
      if (metrics.historyAccessAttempts >= 2) {
        await this.triggerConversion('history_access', { 
          attempts: metrics.historyAccessAttempts + 1 
        });
      }
    } catch (error) {
      if (__DEV__) console.error('Error checking history access trigger:', error);
    }
  }

  // Track insights view
  async trackInsightsView(): Promise<void> {
    try {
      const metrics = await this.getUserMetrics();
      await this.updateUserMetrics({ 
        insightsViewCount: metrics.insightsViewCount + 1 
      });
    } catch (error) {
      if (__DEV__) console.error('Error tracking insights view:', error);
    }
  }

  // Track new mood entry
  async trackMoodEntry(): Promise<void> {
    try {
      const metrics = await this.getUserMetrics();
      const now = new Date().toISOString();
      
      const updates: Partial<UserMetrics> = {
        totalMoodEntries: metrics.totalMoodEntries + 1,
        lastEntryDate: now
      };

      // Set first entry date if this is the first entry
      if (!metrics.firstEntryDate) {
        updates.firstEntryDate = now;
      }

      await this.updateUserMetrics(updates);

      // Check if we should trigger conversion
      await this.checkMoodEntryTrigger(updates.totalMoodEntries!);
    } catch (error) {
      if (__DEV__) console.error('Error tracking mood entry:', error);
    }
  }

  // Main trigger conversion method
  private async triggerConversion(triggerId: string, context?: any): Promise<void> {
    try {
      // Check cooldown period to avoid spam
      if (await this.isInCooldown(triggerId)) {
        return;
      }

      // Check if we should show paywall for this trigger
      const shouldShow = await subscriptionService.shouldShowPaywall(triggerId);
      if (!shouldShow) {
        return;
      }

      // Log the conversion event
      await this.logConversionEvent(triggerId, context);

      // Set cooldown period
      await this.setCooldown(triggerId);

      // Navigate to paywall with trigger context
      setTimeout(() => {
        router.push(`/paywall?trigger=${triggerId}`);
      }, 1000); // Small delay to avoid disrupting user flow

    } catch (error) {
      if (__DEV__) console.error('Error triggering conversion:', error);
    }
  }

  // Log conversion event
  private async logConversionEvent(triggerId: string, context?: any): Promise<void> {
    try {
      const event: ConversionEvent = {
        triggerId,
        timestamp: new Date().toISOString(),
        context
      };

      const existingEvents = await AsyncStorage.getItem(this.EVENTS_KEY);
      const events = existingEvents ? JSON.parse(existingEvents) : [];
      events.push(event);

      // Keep only last 50 events
      const recentEvents = events.slice(-50);
      await AsyncStorage.setItem(this.EVENTS_KEY, JSON.stringify(recentEvents));

      if (__DEV__) console.log('Conversion event logged:', event);
    } catch (error) {
      if (__DEV__) console.error('Failed to log conversion event:', error);
    }
  }

  // Check if trigger has been fired recently
  private async hasTriggeredRecently(triggerId: string, hours: number = 168): Promise<boolean> { // 1 week default
    try {
      const eventsData = await AsyncStorage.getItem(this.EVENTS_KEY);
      if (!eventsData) return false;

      const events: ConversionEvent[] = JSON.parse(eventsData);
      const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

      return events.some(event => 
        event.triggerId === triggerId && 
        new Date(event.timestamp) > cutoffTime
      );
    } catch (error) {
      if (__DEV__) console.error('Error checking recent triggers:', error);
      return false;
    }
  }

  // Set cooldown for specific trigger
  private async setCooldown(triggerId: string, hours: number = 24): Promise<void> {
    try {
      const cooldownEnd = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
      const key = `${this.PAYWALL_COOLDOWN_KEY}_${triggerId}`;
      await AsyncStorage.setItem(key, cooldownEnd);
    } catch (error) {
      if (__DEV__) console.error('Error setting cooldown:', error);
    }
  }

  // Check if trigger is in cooldown period
  private async isInCooldown(triggerId: string): Promise<boolean> {
    try {
      const key = `${this.PAYWALL_COOLDOWN_KEY}_${triggerId}`;
      const cooldownEnd = await AsyncStorage.getItem(key);
      
      if (!cooldownEnd) return false;

      return new Date() < new Date(cooldownEnd);
    } catch (error) {
      if (__DEV__) console.error('Error checking cooldown:', error);
      return false;
    }
  }

  // Get conversion analytics
  async getConversionAnalytics(): Promise<any> {
    try {
      const events = await AsyncStorage.getItem(this.EVENTS_KEY);
      const metrics = await this.getUserMetrics();
      
      return {
        events: events ? JSON.parse(events) : [],
        metrics,
        conversionTriggers: CONVERSION_TRIGGERS
      };
    } catch (error) {
      if (__DEV__) console.error('Error getting conversion analytics:', error);
      return null;
    }
  }

  // Reset all conversion data (useful for testing)
  async resetConversionData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.EVENTS_KEY,
        this.METRICS_KEY,
        `${this.PAYWALL_COOLDOWN_KEY}_mood_entries_10`,
        `${this.PAYWALL_COOLDOWN_KEY}_history_access`,
        `${this.PAYWALL_COOLDOWN_KEY}_week_of_use`
      ]);
      if (__DEV__) console.log('Conversion data reset');
    } catch (error) {
      if (__DEV__) console.error('Error resetting conversion data:', error);
    }
  }
}

// Export singleton instance
export const conversionService = new ConversionService();