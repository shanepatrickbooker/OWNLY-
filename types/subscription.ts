// Subscription types and constants

export interface SubscriptionTier {
  id: string;
  name: string;
  price: string;
  period: 'monthly' | 'yearly';
  savings?: string;
  features: string[];
}

export interface SubscriptionStatus {
  isActive: boolean;
  tier: 'free' | 'premium';
  expirationDate?: string;
  productId?: string;
}

export interface ConversionTrigger {
  id: string;
  condition: string;
  title: string;
  description: string;
  features: string[];
  triggerCount?: number;
}

// Subscription tiers
export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: 'ownly_monthly',
    name: 'Monthly',
    price: '$4.99',
    period: 'monthly',
    features: [
      'Full insights (3-5 per session)',
      'Unlimited history access',
      'Advanced weekly patterns',
      'Priority support',
      'Enhanced export options'
    ]
  },
  {
    id: 'ownly_yearly',
    name: 'Yearly',
    price: '$39.99',
    period: 'yearly',
    savings: '33% savings',
    features: [
      'Full insights (3-5 per session)',
      'Unlimited history access',
      'Advanced weekly patterns',
      'Priority support',
      'Enhanced export options',
      'Best value - save $20/year!'
    ]
  }
];

// Free tier limitations
export const FREE_TIER_LIMITS = {
  maxHistoryDays: 30,
  maxInsightsPerSession: 2,
  hasAdvancedPatterns: false,
  hasEnhancedExport: false,
  hasPrioritySupport: false
};

// Premium features list
export const PREMIUM_FEATURES = [
  'Full insights analysis',
  'Unlimited history access', 
  'Advanced weekly pattern analysis',
  'Priority customer support',
  'Enhanced export options',
  'Future premium features'
];

// Conversion triggers
export const CONVERSION_TRIGGERS: ConversionTrigger[] = [
  {
    id: 'mood_entries_10',
    condition: 'after_10_entries',
    title: 'Unlock Deeper Insights',
    description: 'You\'ve been consistently tracking your mood. Discover advanced patterns and deeper analysis with Premium.',
    features: [
      'Get 3-5 detailed insights per session instead of 1-2',
      'See emotional patterns you might be missing',
      'Understand your triggers and growth areas'
    ],
    triggerCount: 10
  },
  {
    id: 'history_access',
    condition: 'accessing_old_history',
    title: 'See Your Complete Journey',
    description: 'Access your full emotional history and track long-term patterns with Premium.',
    features: [
      'View all your mood entries, not just the last 30 days',
      'Track seasonal patterns and long-term trends',
      'Export your complete data anytime'
    ]
  },
  {
    id: 'week_of_use',
    condition: 'after_1_week',
    title: 'Discover Advanced Patterns',
    description: 'After a week of mindful tracking, you\'re ready for deeper insights.',
    features: [
      'Advanced weekly pattern analysis',
      'Personalized recommendations',
      'Priority support from our team'
    ]
  }
];

// RevenueCat configuration
export const REVENUECAT_CONFIG = {
  apiKey: {
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || 'your_ios_api_key',
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || 'your_android_api_key'
  },
  entitlement: 'premium_access'
};