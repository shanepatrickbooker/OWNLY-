import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { subscriptionService } from '../services/subscriptionService';
import { SubscriptionStatus } from '../types/subscription';

interface SubscriptionContextType {
  subscriptionStatus: SubscriptionStatus;
  isLoading: boolean;
  hasPremium: boolean;
  refreshSubscriptionStatus: () => Promise<void>;
  refreshPremiumStatus: () => Promise<void>;
  purchaseSubscription: (packageId: string) => Promise<{ success: boolean; error?: any }>;
  restorePurchases: () => Promise<{ success: boolean; error?: any }>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    isActive: false,
    tier: 'free'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [hasPremium, setHasPremium] = useState(false);

  // Initialize subscription service and get initial status
  useEffect(() => {
    initializeSubscriptions();
  }, []);

  const initializeSubscriptions = async () => {
    try {
      setIsLoading(true);
      await subscriptionService.initialize();
      await refreshSubscriptionStatus();
    } catch (error) {
      console.error('Failed to initialize subscriptions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSubscriptionStatus = async () => {
    try {
      const status = await subscriptionService.getSubscriptionStatus();
      const premiumAccess = await subscriptionService.hasPremiumAccess();
      setSubscriptionStatus(status);
      setHasPremium(premiumAccess);
      console.log('Subscription status updated:', status, 'Premium access:', premiumAccess);
    } catch (error) {
      console.error('Failed to refresh subscription status:', error);
      // Still update premium access even if subscription status fails
      try {
        const premiumAccess = await subscriptionService.hasPremiumAccess();
        setHasPremium(premiumAccess);
        console.log('Premium access updated despite subscription status error:', premiumAccess);
      } catch (premiumError) {
        console.error('Failed to get premium access:', premiumError);
      }
    }
  };

  const refreshPremiumStatus = async () => {
    try {
      const premiumAccess = await subscriptionService.hasPremiumAccess();
      setHasPremium(premiumAccess);
      console.log('Premium access updated:', premiumAccess);
    } catch (error) {
      console.error('Failed to refresh premium status:', error);
    }
  };

  const purchaseSubscription = async (packageId: string) => {
    try {
      setIsLoading(true);
      const packages = await subscriptionService.getAvailablePackages();
      const packageToPurchase = packages.find(p => p.identifier === packageId);
      
      if (!packageToPurchase) {
        return { success: false, error: 'Package not found' };
      }

      const result = await subscriptionService.purchasePackage(packageToPurchase);
      
      if (result.success) {
        await refreshSubscriptionStatus();
      }
      
      return result;
    } catch (error) {
      console.error('Purchase failed:', error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  const restorePurchases = async () => {
    try {
      setIsLoading(true);
      const result = await subscriptionService.restorePurchases();
      
      if (result.success) {
        await refreshSubscriptionStatus();
      }
      
      return result;
    } catch (error) {
      console.error('Restore failed:', error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  const value: SubscriptionContextType = {
    subscriptionStatus,
    isLoading,
    hasPremium,
    refreshSubscriptionStatus,
    refreshPremiumStatus,
    purchaseSubscription,
    restorePurchases
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}