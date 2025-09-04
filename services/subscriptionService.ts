import Purchases, { CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SubscriptionStatus, REVENUECAT_CONFIG } from '../types/subscription';

class SubscriptionService {
  private isInitialized = false;
  private customerInfo: CustomerInfo | null = null;
  private testingBypassEnabled = false;
  
  private readonly TESTING_BYPASS_KEY = 'testing_bypass_enabled';

  // Initialize RevenueCat
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) return;

      // Check for testing bypass first
      const bypassEnabled = await AsyncStorage.getItem(this.TESTING_BYPASS_KEY);
      this.testingBypassEnabled = bypassEnabled === 'true';
      
      if (this.testingBypassEnabled) {
        if (__DEV__) console.log('🧪 Testing bypass enabled - Premium features unlocked');
        this.isInitialized = true;
        return;
      }

      const apiKey = Platform.OS === 'ios' 
        ? REVENUECAT_CONFIG.apiKey.ios 
        : REVENUECAT_CONFIG.apiKey.android;

      // Skip RevenueCat init if using placeholder API keys
      if (!apiKey || apiKey.includes('your_') || apiKey.includes('api_key')) {
        if (__DEV__) console.log('RevenueCat: Using placeholder API keys, skipping initialization');
        this.isInitialized = true;
        return;
      }

      await Purchases.configure({ apiKey });
      
      // Set debug mode for development
      if (__DEV__) {
        await Purchases.setLogLevel('debug');
      }

      this.isInitialized = true;
      if (__DEV__) console.log('RevenueCat initialized successfully');
    } catch (error) {
      if (__DEV__) console.error('Failed to initialize RevenueCat:', error);
      // Mark as initialized anyway to prevent infinite retry loops
      this.isInitialized = true;
    }
  }

  // Get current subscription status
  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    try {
      await this.ensureInitialized();
      
      // Check for placeholder API keys - return free tier
      const apiKey = Platform.OS === 'ios' 
        ? REVENUECAT_CONFIG.apiKey.ios 
        : REVENUECAT_CONFIG.apiKey.android;
        
      if (!apiKey || apiKey.includes('your_') || apiKey.includes('api_key')) {
        return {
          isActive: false,
          tier: 'free'
        };
      }
      
      const customerInfo = await Purchases.getCustomerInfo();
      this.customerInfo = customerInfo;

      const isPremium = customerInfo.entitlements.active[REVENUECAT_CONFIG.entitlement] != null;
      
      if (isPremium) {
        const activeEntitlement = customerInfo.entitlements.active[REVENUECAT_CONFIG.entitlement];
        return {
          isActive: true,
          tier: 'premium',
          expirationDate: activeEntitlement.expirationDate,
          productId: activeEntitlement.productIdentifier
        };
      }

      return {
        isActive: false,
        tier: 'free'
      };
    } catch (error) {
      // Don't log configuration errors
      if (!error.message?.includes('singleton instance') && 
          !error.message?.includes('configure')) {
        if (__DEV__) console.error('Failed to get subscription status:', error);
      }
      // Return free tier as fallback
      return {
        isActive: false,
        tier: 'free'
      };
    }
  }

  // Check if user has premium access
  async hasPremiumAccess(): Promise<boolean> {
    // Return true immediately if testing bypass is enabled
    if (this.testingBypassEnabled) {
      return true;
    }
    
    const status = await this.getSubscriptionStatus();
    return status.isActive && status.tier === 'premium';
  }

  // Get available packages for purchase
  async getAvailablePackages(): Promise<PurchasesPackage[]> {
    try {
      await this.ensureInitialized();
      const offerings = await Purchases.getOfferings();
      
      if (offerings.current && offerings.current.availablePackages.length > 0) {
        return offerings.current.availablePackages;
      }
      
      return [];
    } catch (error) {
      if (__DEV__) console.error('Failed to get available packages:', error);
      return [];
    }
  }

  // Purchase a subscription package
  async purchasePackage(packageToPurchase: PurchasesPackage): Promise<{ success: boolean, customerInfo?: CustomerInfo, error?: any }> {
    try {
      await this.ensureInitialized();
      
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      this.customerInfo = customerInfo;
      
      const isPremium = customerInfo.entitlements.active[REVENUECAT_CONFIG.entitlement] != null;
      
      if (isPremium) {
        // Track successful subscription
        await this.trackSubscriptionEvent('subscription_purchased', packageToPurchase.identifier);
        return { success: true, customerInfo };
      }
      
      return { success: false, error: 'Purchase completed but premium access not activated' };
    } catch (error) {
      if (__DEV__) console.error('Purchase failed:', error);
      return { success: false, error };
    }
  }

  // Restore purchases
  async restorePurchases(): Promise<{ success: boolean, customerInfo?: CustomerInfo, error?: any }> {
    try {
      await this.ensureInitialized();
      
      const customerInfo = await Purchases.restorePurchases();
      this.customerInfo = customerInfo;
      
      const isPremium = customerInfo.entitlements.active[REVENUECAT_CONFIG.entitlement] != null;
      
      if (isPremium) {
        await this.trackSubscriptionEvent('subscription_restored');
        return { success: true, customerInfo };
      }
      
      return { success: false, error: 'No active purchases found to restore' };
    } catch (error) {
      if (__DEV__) console.error('Failed to restore purchases:', error);
      return { success: false, error };
    }
  }

  // Set user ID for RevenueCat (optional but recommended)
  async setUserId(userId: string): Promise<void> {
    try {
      await this.ensureInitialized();
      await Purchases.logIn(userId);
    } catch (error) {
      if (__DEV__) console.error('Failed to set user ID:', error);
    }
  }

  // Track subscription events
  private async trackSubscriptionEvent(eventName: string, productId?: string): Promise<void> {
    try {
      const eventData = {
        event: eventName,
        timestamp: new Date().toISOString(),
        productId
      };
      
      // Store locally for analytics
      const existingEvents = await AsyncStorage.getItem('subscription_events');
      const events = existingEvents ? JSON.parse(existingEvents) : [];
      events.push(eventData);
      
      // Keep only last 100 events
      const recentEvents = events.slice(-100);
      await AsyncStorage.setItem('subscription_events', JSON.stringify(recentEvents));
      
      if (__DEV__) console.log('Subscription event tracked:', eventData);
    } catch (error) {
      if (__DEV__) console.error('Failed to track subscription event:', error);
    }
  }

  // Get subscription analytics
  async getSubscriptionAnalytics(): Promise<any[]> {
    try {
      const eventsData = await AsyncStorage.getItem('subscription_events');
      return eventsData ? JSON.parse(eventsData) : [];
    } catch (error) {
      if (__DEV__) console.error('Failed to get subscription analytics:', error);
      return [];
    }
  }

  // Check if user should see paywall based on usage
  async shouldShowPaywall(trigger: string): Promise<boolean> {
    try {
      // Don't show paywall if already premium
      const hasPremium = await this.hasPremiumAccess();
      if (hasPremium) return false;

      // Check if we've already shown this trigger recently
      const lastShownKey = `paywall_shown_${trigger}`;
      const lastShown = await AsyncStorage.getItem(lastShownKey);
      
      if (lastShown) {
        const lastShownDate = new Date(lastShown);
        const daysSinceLastShown = (Date.now() - lastShownDate.getTime()) / (1000 * 60 * 60 * 24);
        
        // Don't show same trigger more than once per week
        if (daysSinceLastShown < 7) {
          return false;
        }
      }

      return true;
    } catch (error) {
      if (__DEV__) console.error('Error checking paywall trigger:', error);
      return false;
    }
  }

  // Mark that paywall was shown for a trigger
  async markPaywallShown(trigger: string): Promise<void> {
    try {
      const key = `paywall_shown_${trigger}`;
      await AsyncStorage.setItem(key, new Date().toISOString());
    } catch (error) {
      if (__DEV__) console.error('Failed to mark paywall shown:', error);
    }
  }

  // Ensure RevenueCat is initialized
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  // Get cached customer info
  getCachedCustomerInfo(): CustomerInfo | null {
    return this.customerInfo;
  }

  // Testing bypass methods (for TestFlight and development)
  async enableTestingBypass(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.TESTING_BYPASS_KEY, 'true');
      this.testingBypassEnabled = true;
      if (__DEV__) console.log('🧪 Testing bypass ENABLED - Premium features unlocked');
    } catch (error) {
      if (__DEV__) console.error('Failed to enable testing bypass:', error);
    }
  }

  async disableTestingBypass(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.TESTING_BYPASS_KEY);
      this.testingBypassEnabled = false;
      if (__DEV__) console.log('🧪 Testing bypass DISABLED - Normal paywall behavior restored');
    } catch (error) {
      if (__DEV__) console.error('Failed to disable testing bypass:', error);
    }
  }

  isTestingBypassEnabled(): boolean {
    return this.testingBypassEnabled;
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService();