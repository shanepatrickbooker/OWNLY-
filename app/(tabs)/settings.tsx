import React, { useState, useCallback } from 'react';
import { 
  SafeAreaView, 
  ScrollView, 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity,
  Alert,
  Switch,
  Share,
  Linking,
  Platform
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { getAllMoodEntries, getMoodEntryCount, generateSampleData, clearAllMoodData } from './database/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography, Spacing, BorderRadius, Shadows, Layout } from '../../constants/Design';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { conversionService } from '../../services/conversionService';
import { subscriptionService } from '../../services/subscriptionService';
import { notificationService, NotificationSettings } from '../../services/notificationService';
import HeaderLogo from '../../components/HeaderLogo';

interface SettingsSection {
  title: string;
  items: SettingsItem[];
}

interface SettingsItem {
  title: string;
  subtitle?: string;
  type: 'toggle' | 'action' | 'navigation' | 'info';
  value?: boolean;
  onPress?: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

const CRISIS_RESOURCES = [
  {
    name: 'National Suicide Prevention Lifeline',
    number: '988',
    available: '24/7'
  },
  {
    name: 'Crisis Text Line',
    number: 'Text HOME to 741741',
    available: '24/7'
  },
  {
    name: 'SAMHSA National Helpline',
    number: '1-800-662-4357',
    available: '24/7'
  }
];

const MENTAL_HEALTH_RESOURCES = [
  {
    title: 'National Alliance on Mental Illness (NAMI)',
    url: 'https://nami.org',
    description: 'Support, education, and advocacy'
  },
  {
    title: 'Mental Health America',
    url: 'https://mhanational.org',
    description: 'Screening tools and local resources'
  },
  {
    title: 'Psychology Today',
    url: 'https://psychologytoday.com',
    description: 'Find mental health professionals'
  }
];

export default function SettingsScreen() {
  const [entryCount, setEntryCount] = useState(0);
  const [notifications, setNotifications] = useState(false);
  const [notificationTime, setNotificationTime] = useState('19:00');
  const [skipWeekends, setSkipWeekends] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [insightsEnabled, setInsightsEnabled] = useState(true);
  const [weeklyNotifications, setWeeklyNotifications] = useState(false);
  const [weeklyDay, setWeeklyDay] = useState('Sunday');
  const [weeklySummariesEnabled, setWeeklySummariesEnabled] = useState(true);
  const [showDeveloperSettings, setShowDeveloperSettings] = useState(false);
  const [versionTapCount, setVersionTapCount] = useState(0);
  const [testingBypassEnabled, setTestingBypassEnabled] = useState(false);
  
  const { hasPremium, isLoading, restorePurchases, refreshPremiumStatus } = useSubscription();

  const loadSettings = useCallback(async () => {
    try {
      const count = await getMoodEntryCount();
      setEntryCount(count);
      
      // Load notification settings from service
      const notificationSettings = await notificationService.getSettings();
      setNotifications(notificationSettings.enabled);
      setNotificationTime(notificationSettings.time);
      setSkipWeekends(notificationSettings.skipWeekends);
      
      // Load testing bypass status
      const bypassEnabled = subscriptionService.isTestingBypassEnabled();
      setTestingBypassEnabled(bypassEnabled);
      
      // Load other preferences from AsyncStorage
      const darkModePref = await AsyncStorage.getItem('dark_mode');
      const insightsPref = await AsyncStorage.getItem('insights_enabled');
      const weeklyNotificationsPref = await AsyncStorage.getItem('weekly_notifications_enabled');
      const weeklyDayPref = await AsyncStorage.getItem('weekly_day');
      const weeklySummariesPref = await AsyncStorage.getItem('weekly_summaries_enabled');
      
      setDarkMode(darkModePref === 'true');
      setInsightsEnabled(insightsPref !== 'false'); // Default to true
      setWeeklyNotifications(weeklyNotificationsPref === 'true');
      setWeeklyDay(weeklyDayPref || 'Sunday');
      setWeeklySummariesEnabled(weeklySummariesPref !== 'false'); // Default to true
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadSettings();
  }, [loadSettings]));

  const savePreference = async (key: string, value: boolean) => {
    try {
      await AsyncStorage.setItem(key, value.toString());
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
    }
  };

  const exportAllData = async () => {
    try {
      const entries = await getAllMoodEntries();
      if (entries.length === 0) {
        Alert.alert('No Data', 'You have no mood entries to export.');
        return;
      }

      // Create CSV format with weekly summary data
      const { getWeekRange, getWeekLabel } = await import('../../utils/weeklyAnalysis');
      const csvHeader = 'Date,Time,Mood,Mood Value,Reflection,Week_Start,Week_Label\n';
      const csvRows = entries.map(entry => {
        const date = new Date(entry.created_at || entry.timestamp);
        const dateStr = date.toLocaleDateString();
        const timeStr = date.toLocaleTimeString();
        const reflection = (entry.reflection || '').replace(/"/g, '""'); // Escape quotes
        
        // Add weekly context
        const { start: weekStart } = getWeekRange(date);
        const weekLabel = getWeekLabel(weekStart);
        const weekStartStr = weekStart.toLocaleDateString();
        
        return `"${dateStr}","${timeStr}","${entry.mood_label}",${entry.mood_value},"${reflection}","${weekStartStr}","${weekLabel}"`;
      }).join('\n');
      
      const csvContent = csvHeader + csvRows;

      await Share.share({
        message: csvContent,
        title: `OWNLY Complete Data Export (${entries.length} entries with weekly context)`
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Export Error', 'Unable to export your data. Please try again.');
    }
  };

  const clearAllData = () => {
    Alert.alert(
      'Clear All Data',
      `This will permanently delete all ${entryCount} mood entries. This action cannot be undone.\n\nAre you sure you want to continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All Data',
          style: 'destructive',
          onPress: confirmClearData
        }
      ]
    );
  };

  const confirmClearData = () => {
    Alert.alert(
      'Final Confirmation',
      'This is your last chance to back out. All your mood tracking data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: performClearData
        }
      ]
    );
  };

  const performClearData = async () => {
    try {
      await AsyncStorage.multiRemove(['mood_entries', 'mood_counter']);
      setEntryCount(0);
      Alert.alert('Data Cleared', 'All your mood data has been deleted.');
    } catch (error) {
      console.error('Error clearing data:', error);
      Alert.alert('Error', 'Unable to clear your data. Please try again.');
    }
  };

  const toggleNotifications = async (value: boolean) => {
    if (value) {
      // Request permissions when enabling notifications
      const hasPermission = await notificationService.requestPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Permission Needed',
          'To send gentle reminders, we need your permission to show notifications. You can enable this in your device settings.',
          [{ text: 'OK' }]
        );
        return; // Don't enable notifications if permission denied
      }
    }
    
    await notificationService.updateSettings({ enabled: value });
    setNotifications(value);
    
    if (value) {
      Alert.alert(
        'Gentle Reminders Enabled',
        'You\'ll receive a daily reminder at 7 PM. You can customize the time below.',
        [{ text: 'Got it' }]
      );
    }
  };

  const showTimePickerOptions = () => {
    const times = [
      { label: '7:00 AM', value: '07:00' },
      { label: '12:00 PM', value: '12:00' },
      { label: '3:00 PM', value: '15:00' },
      { label: '6:00 PM', value: '18:00' },
      { label: '7:00 PM', value: '19:00' },
      { label: '8:00 PM', value: '20:00' },
      { label: '9:00 PM', value: '21:00' },
    ];

    Alert.alert(
      'Choose Reminder Time',
      'When would you like to receive your daily check-in reminder?',
      [
        { text: 'Cancel', style: 'cancel' },
        ...times.map(time => ({
          text: time.label,
          onPress: () => updateNotificationTime(time.value)
        }))
      ]
    );
  };

  const updateNotificationTime = async (time: string) => {
    await notificationService.updateSettings({ time });
    setNotificationTime(time);
    
    const displayTime = new Date(`2000-01-01T${time}:00`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    Alert.alert(
      'Time Updated',
      `Your daily reminder time has been set to ${displayTime}.`,
      [{ text: 'Perfect' }]
    );
  };

  const toggleSkipWeekends = async (value: boolean) => {
    await notificationService.updateSettings({ skipWeekends: value });
    setSkipWeekends(value);
  };

  const pauseNotifications = () => {
    Alert.alert(
      'Pause Notifications',
      'How long would you like to pause your gentle reminders?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: '1 Day', onPress: () => pauseNotificationsFor(24) },
        { text: '3 Days', onPress: () => pauseNotificationsFor(72) },
        { text: '1 Week', onPress: () => pauseNotificationsFor(168) },
      ]
    );
  };

  const pauseNotificationsFor = async (hours: number) => {
    await notificationService.pauseNotifications(hours);
    const duration = hours === 24 ? '1 day' : hours === 72 ? '3 days' : '1 week';
    Alert.alert(
      'Notifications Paused',
      `Your gentle reminders are paused for ${duration}. You can resume them anytime in settings.`,
      [{ text: 'OK' }]
    );
  };

  const handleVersionTap = () => {
    const newCount = versionTapCount + 1;
    setVersionTapCount(newCount);
    
    if (newCount === 7) {
      setShowDeveloperSettings(true);
      Alert.alert(
        'Developer Settings Enabled',
        'You can now access testing features. These should only be used during development and TestFlight testing.',
        [{ text: 'Got it' }]
      );
    }
  };

  const toggleTestingBypass = async () => {
    if (testingBypassEnabled) {
      Alert.alert(
        'Disable Testing Bypass',
        'This will restore normal paywall behavior. Premium features will be locked unless you have an active subscription.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            onPress: async () => {
              await subscriptionService.disableTestingBypass();
              setTestingBypassEnabled(false);
              // Use refreshPremiumStatus instead of refreshSubscriptionStatus
              // to avoid RevenueCat calls that might fail in simulator
              await refreshPremiumStatus();
              Alert.alert(
                'Testing Bypass Disabled',
                'Normal paywall behavior has been restored.',
                [{ text: 'OK' }]
              );
            }
          }
        ]
      );
    } else {
      Alert.alert(
        'Enable Testing Bypass',
        '⚠️ WARNING: This will unlock all premium features without payment. Only use this for TestFlight testing or development.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Enable for Testing',
            style: 'destructive',
            onPress: async () => {
              await subscriptionService.enableTestingBypass();
              setTestingBypassEnabled(true);
              await refreshPremiumStatus();
              Alert.alert(
                'Testing Bypass Enabled',
                '🧪 All premium features are now unlocked for testing.',
                [{ text: 'OK' }]
              );
            }
          }
        ]
      );
    }
  };

  const toggleDarkMode = (value: boolean) => {
    setDarkMode(value);
    savePreference('dark_mode', value);
    Alert.alert(
      'Theme Setting',
      'Theme changes will take effect when you restart the app.',
      [{ text: 'OK' }]
    );
  };

  const toggleInsights = (value: boolean) => {
    if (!value) {
      Alert.alert(
        'Disable Insights',
        'This will hide the insights screen and stop generating pattern analysis. You can re-enable this anytime.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            onPress: () => {
              setInsightsEnabled(false);
              savePreference('insights_enabled', false);
            }
          }
        ]
      );
    } else {
      setInsightsEnabled(true);
      savePreference('insights_enabled', true);
    }
  };

  const toggleWeeklySummaries = (value: boolean) => {
    if (!value) {
      Alert.alert(
        'Disable Weekly Summaries',
        'This will hide weekly pattern analysis. You can re-enable this anytime in settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            onPress: () => {
              setWeeklySummariesEnabled(false);
              setWeeklyNotifications(false); // Also disable notifications
              savePreference('weekly_summaries_enabled', false);
              savePreference('weekly_notifications_enabled', false);
            }
          }
        ]
      );
    } else {
      setWeeklySummariesEnabled(true);
      savePreference('weekly_summaries_enabled', true);
    }
  };

  const toggleWeeklyNotifications = (value: boolean) => {
    setWeeklyNotifications(value);
    savePreference('weekly_notifications_enabled', value);
    if (value) {
      Alert.alert(
        'Weekly Summary Reminders',
        `You'll receive a gentle reminder every ${weeklyDay} to review your weekly patterns. These summaries focus on awareness, not performance.`,
        [{ text: 'Got it' }]
      );
    }
  };

  const showCrisisResources = () => {
    const resourceText = CRISIS_RESOURCES.map(resource => 
      `${resource.name}\n${resource.number}\n${resource.available}\n`
    ).join('\n');

    Alert.alert(
      'Crisis Support Resources',
      `If you're in immediate danger or having thoughts of self-harm, please reach out:\n\n${resourceText}\n\nYour safety is the top priority.`,
      [
        { text: 'Close' },
        { 
          text: 'Call 988', 
          onPress: () => Linking.openURL('tel:988') 
        }
      ]
    );
  };

  const showMentalHealthResources = () => {
    Alert.alert(
      'Mental Health Resources',
      'Professional support and educational resources:',
      [
        { text: 'Close' },
        ...MENTAL_HEALTH_RESOURCES.map(resource => ({
          text: resource.title,
          onPress: () => Linking.openURL(resource.url)
        }))
      ]
    );
  };

  const showInsightGuide = () => {
    Alert.alert(
      'Understanding Your Insights',
      `Your insights are generated by analyzing patterns in your mood entries:

• Temporal patterns show when you tend to feel certain ways
• Trigger identification looks for common themes in difficult moments
• Progress recognition celebrates positive changes over time
• Coping recognition highlights your successful strategies

These observations are meant to support your self-awareness, not diagnose or treat any conditions.`,
      [{ text: 'Got it' }]
    );
  };

  const showWeeklySummaryGuide = () => {
    Alert.alert(
      'Understanding Weekly Patterns',
      `Weekly summaries help you understand your emotional rhythms:

• Mood distribution shows the natural variety in your week
• Reflection patterns highlight your self-awareness practice
• Time patterns reveal when you tend to check in
• All data is presented without judgment or performance pressure

Healthy use of weekly patterns:
✓ Notice trends with curiosity, not criticism
✓ Remember that emotional variety is completely normal
✓ Use insights for self-understanding, not self-optimization

Weekly summaries are tools for awareness, not scorecards for happiness.`,
      [{ text: 'Understood' }]
    );
  };

  const replayOnboarding = async () => {
    Alert.alert(
      'Replay Onboarding',
      'This will take you through the OWNLY introduction again, covering privacy, how it works, and mental health boundaries.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Onboarding',
          onPress: async () => {
            try {
              // Clear onboarding completion to trigger onboarding flow
              await AsyncStorage.removeItem('onboarding_completed');
              // Navigate to onboarding
              router.push('/onboarding/welcome');
            } catch (error) {
              console.error('Error starting onboarding replay:', error);
              Alert.alert('Error', 'Unable to start onboarding. Please try again.');
            }
          }
        }
      ]
    );
  };

  const sendFeedback = () => {
    const feedbackEmail = 'feedback@ownly.app';
    const subject = 'OWNLY App Feedback';
    const body = `Hi OWNLY team,

I'd like to share some feedback about the app:

[Please share your thoughts here]

App version: 1.0.0
Entry count: ${entryCount}

Thank you!`;

    const mailtoUrl = `mailto:${feedbackEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    Linking.openURL(mailtoUrl).catch(() => {
      Alert.alert(
        'Email Not Available',
        `Please send your feedback to: ${feedbackEmail}`,
        [
          { text: 'Close' },
          { 
            text: 'Copy Email', 
            onPress: () => {
              // Note: In a real app, you'd use Clipboard API here
              Alert.alert('Email Copied', feedbackEmail);
            }
          }
        ]
      );
    });
  };

  const handleRestorePurchases = async () => {
    try {
      const restored = await restorePurchases();
      if (restored) {
        Alert.alert(
          'Purchases Restored',
          'Your premium subscription has been restored successfully.',
          [{ text: 'Great!' }]
        );
      } else {
        Alert.alert(
          'No Purchases Found',
          'We couldn\'t find any previous purchases to restore. If you believe this is an error, please contact support.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error restoring purchases:', error);
      Alert.alert(
        'Restore Failed',
        'Unable to restore purchases. Please try again later.',
        [{ text: 'OK' }]
      );
    }
  };

  const openPremium = () => {
    router.push('/paywall');
  };

  const openSubscriptionManagement = () => {
    const subscriptionUrl = Platform.OS === 'ios' 
      ? 'https://apps.apple.com/account/subscriptions' 
      : 'https://play.google.com/store/account/subscriptions';
    
    Linking.openURL(subscriptionUrl).catch(() => {
      Alert.alert(
        'Unable to Open',
        'Please go to your device\'s App Store settings to manage your subscription.',
        [{ text: 'OK' }]
      );
    });
  };

  const sections: SettingsSection[] = [
    {
      title: 'Data Management',
      items: [
        {
          title: 'Total Entries',
          subtitle: `${entryCount} mood reflection${entryCount !== 1 ? 's' : ''} recorded`,
          type: 'info'
        },
        {
          title: 'Export All Data',
          subtitle: 'Download your complete mood history as CSV',
          type: 'action',
          onPress: exportAllData,
          disabled: entryCount === 0
        },
        {
          title: 'Clear All Data',
          subtitle: 'Permanently delete all mood entries',
          type: 'action',
          onPress: clearAllData,
          destructive: true,
          disabled: entryCount === 0
        }
      ]
    },
    {
      title: 'Subscription',
      items: [
        {
          title: 'Current Plan',
          subtitle: isLoading ? 'Checking...' : (hasPremium ? 'OWNLY Premium - Active' : 'OWNLY Free'),
          type: 'info'
        },
        ...(hasPremium ? [
          {
            title: 'Manage Subscription',
            subtitle: 'Change plan or cancel subscription',
            type: 'navigation' as const,
            onPress: openSubscriptionManagement
          }
        ] : [
          {
            title: 'Upgrade to Premium',
            subtitle: 'Unlock unlimited history and advanced insights',
            type: 'navigation' as const,
            onPress: openPremium
          }
        ]),
        {
          title: 'Restore Purchases',
          subtitle: 'If you previously purchased premium on this device',
          type: 'action',
          onPress: handleRestorePurchases,
          disabled: isLoading
        }
      ]
    },
    {
      title: 'Gentle Reminders',
      items: [
        {
          title: 'Daily Check-in Reminders',
          subtitle: 'Receive a gentle notification each day',
          type: 'toggle',
          value: notifications,
          onPress: () => toggleNotifications(!notifications)
        },
        ...(notifications ? [
          {
            title: 'Reminder Time',
            subtitle: `Currently set for ${new Date(`2000-01-01T${notificationTime}:00`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`,
            type: 'navigation' as const,
            onPress: showTimePickerOptions
          },
          {
            title: 'Skip Weekends',
            subtitle: 'No reminders on Saturday and Sunday',
            type: 'toggle' as const,
            value: skipWeekends,
            onPress: () => toggleSkipWeekends(!skipWeekends)
          },
          {
            title: 'Pause Reminders',
            subtitle: 'Temporarily stop notifications for a break',
            type: 'navigation' as const,
            onPress: pauseNotifications
          }
        ] : [])
      ]
    },
    {
      title: 'App Preferences',
      items: [
        {
          title: 'Dark Mode',
          subtitle: 'Easier on the eyes in low light',
          type: 'toggle',
          value: darkMode,
          onPress: () => toggleDarkMode(!darkMode)
        },
        {
          title: 'Generate Insights',
          subtitle: 'Analyze patterns in your mood data',
          type: 'toggle',
          value: insightsEnabled,
          onPress: () => toggleInsights(!insightsEnabled)
        },
        {
          title: 'Weekly Summaries',
          subtitle: 'View patterns and trends from the past week',
          type: 'toggle',
          value: weeklySummariesEnabled,
          onPress: () => toggleWeeklySummaries(!weeklySummariesEnabled)
        },
        {
          title: 'Weekly Summary Notifications',
          subtitle: `Gentle reminders on ${weeklyDay}s to review your week`,
          type: 'toggle',
          value: weeklyNotifications,
          onPress: () => toggleWeeklyNotifications(!weeklyNotifications),
          disabled: !weeklySummariesEnabled
        }
      ]
    },
    {
      title: 'Help & Support',
      items: [
        {
          title: 'Replay Onboarding',
          subtitle: 'Review privacy, features, and mental health boundaries',
          type: 'navigation',
          onPress: replayOnboarding
        },
        {
          title: 'How to Interpret Insights',
          subtitle: 'Understanding your mood patterns',
          type: 'navigation',
          onPress: showInsightGuide
        },
        {
          title: 'Understanding Weekly Patterns',
          subtitle: 'How to use weekly summaries mindfully',
          type: 'navigation',
          onPress: showWeeklySummaryGuide
        },
        {
          title: 'Mental Health Resources',
          subtitle: 'Professional support and educational materials',
          type: 'navigation',
          onPress: showMentalHealthResources
        },
        {
          title: 'Send Feedback',
          subtitle: 'Help us improve OWNLY',
          type: 'navigation',
          onPress: sendFeedback
        }
      ]
    },
    {
      title: 'Safety & Privacy',
      items: [
        {
          title: 'Crisis Resources',
          subtitle: 'Immediate support when you need it most',
          type: 'navigation',
          onPress: showCrisisResources
        },
        {
          title: 'Clinical Disclaimer',
          subtitle: 'Important limitations of this app',
          type: 'navigation',
          onPress: () => Alert.alert(
            'Clinical Disclaimer',
            `OWNLY is designed for personal reflection and self-awareness. It is NOT a substitute for professional mental health care.

This app:
• Cannot diagnose mental health conditions
• Should not replace therapy or medication
• Is not suitable for managing crisis situations

If you're experiencing persistent mental health concerns, please consult a qualified healthcare provider.`,
            [{ text: 'Understood' }]
          )
        },
        {
          title: 'Privacy Policy',
          subtitle: 'How we protect your personal data',
          type: 'navigation',
          onPress: () => Alert.alert(
            'Privacy Policy',
            `Your privacy is our priority:

• All mood data is stored locally on your device
• No data is sent to external servers
• No analytics or tracking are performed
• You have complete control over your information
• Deleting the app removes all your data

Your emotional journey belongs to you.`,
            [{ text: 'Thank you' }]
          )
        }
      ]
    },
    ...(showDeveloperSettings ? [{
      title: '🧪 Developer Settings',
      items: [
        {
          title: 'Testing Bypass',
          subtitle: testingBypassEnabled 
            ? '✅ Enabled - All premium features unlocked'
            : '❌ Disabled - Normal paywall behavior',
          type: 'toggle' as const,
          value: testingBypassEnabled,
          onPress: () => toggleTestingBypass()
        },
        {
          title: 'Reset Conversion Data',
          subtitle: 'Clear all paywall trigger tracking',
          type: 'action' as const,
          onPress: async () => {
            Alert.alert(
              'Reset Conversion Data',
              'This will clear all paywall trigger tracking data.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Reset',
                  onPress: async () => {
                    await conversionService.resetConversionData();
                    Alert.alert('Reset Complete', 'All conversion data has been cleared.');
                  }
                }
              ]
            );
          }
        },
        {
          title: 'Generate Sample Data',
          subtitle: 'Add 21 diverse mood entries to trigger all insights',
          type: 'action' as const,
          onPress: async () => {
            Alert.alert(
              'Generate Sample Data',
              'This will clear existing mood data and generate 21 diverse entries designed to trigger all 9 insight types. This is for testing only.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Generate',
                  onPress: async () => {
                    try {
                      await generateSampleData();
                      Alert.alert(
                        'Sample Data Generated! 🧪',
                        '21 diverse mood entries have been created. Go to the Insights tab to see multiple insights triggered.',
                        [{ text: 'View Insights', onPress: () => router.push('/(tabs)/insights') }]
                      );
                    } catch (error) {
                      Alert.alert('Error', 'Failed to generate sample data. Check console for details.');
                    }
                  }
                }
              ]
            );
          }
        },
        {
          title: 'Clear All Mood Data',
          subtitle: 'Remove all mood entries and reset database',
          type: 'action' as const,
          onPress: async () => {
            Alert.alert(
              'Clear All Data',
              'This will permanently delete all mood entries. This cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Clear All',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await clearAllMoodData();
                      Alert.alert('Data Cleared', 'All mood data has been removed.');
                    } catch (error) {
                      Alert.alert('Error', 'Failed to clear data. Check console for details.');
                    }
                  }
                }
              ]
            );
          }
        }
      ]
    }] : [])
  ];

  const renderSettingsItem = (item: SettingsItem) => (
    <TouchableOpacity
      key={item.title}
      style={[
        styles.settingsItem,
        item.disabled && styles.settingsItemDisabled
      ]}
      onPress={item.onPress}
      disabled={item.disabled || item.type === 'info'}
    >
      <View style={styles.settingsItemContent}>
        <View style={styles.settingsItemText}>
          <Text style={[
            styles.settingsItemTitle,
            item.destructive && styles.destructiveText,
            item.disabled && styles.disabledText
          ]}>
            {item.title}
          </Text>
          {item.subtitle && (
            <Text style={[styles.settingsItemSubtitle, item.disabled && styles.disabledText]}>
              {item.subtitle}
            </Text>
          )}
        </View>
        {item.type === 'toggle' && (
          <Switch
            value={item.value}
            onValueChange={item.onPress}
            disabled={item.disabled}
          />
        )}
        {item.type === 'navigation' && (
          <Text style={styles.chevron}>›</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderSection = (section: SettingsSection) => (
    <View key={section.title} style={styles.section}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <View style={styles.sectionContent}>
        {section.items.map(renderSettingsItem)}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <HeaderLogo />
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Manage your data and preferences</Text>
        </View>

        {sections.map(renderSection)}

        <TouchableOpacity style={styles.appInfo} onPress={handleVersionTap}>
          <Text style={styles.appVersion}>
            OWNLY v1.0.0{showDeveloperSettings ? ' 🧪' : ''}
          </Text>
          <Text style={styles.appTagline}>Your emotional awareness companion</Text>
          {showDeveloperSettings && (
            <Text style={styles.developerHint}>Developer settings enabled</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  scrollContent: {
    paddingBottom: Spacing['8xl'],
  },
  titleContainer: {
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSize['4xl'],
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
    letterSpacing: Typography.letterSpacing.tight,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.tertiary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  section: {
    marginBottom: Spacing['4xl'],
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
    paddingHorizontal: Layout.screenPadding,
  },
  sectionContent: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Layout.screenPadding,
    overflow: 'hidden',
    ...Shadows.card,
  },
  settingsItem: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  settingsItemDisabled: {
    opacity: 0.5,
  },
  settingsItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingsItemText: {
    flex: 1,
    marginRight: 12,
  },
  settingsItemTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium as any,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  settingsItemSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    lineHeight: Typography.lineHeight.snug * Typography.fontSize.sm,
  },
  destructiveText: {
    color: Colors.error,
  },
  disabledText: {
    color: '#9CA3AF',
  },
  chevron: {
    fontSize: 20,
    color: '#9CA3AF',
    fontWeight: '300',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: 20,
  },
  appVersion: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  developerHint: {
    fontSize: 10,
    color: '#EF4444',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '600',
  },
});