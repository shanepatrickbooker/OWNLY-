import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, Alert } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingScreen from '../../components/OnboardingScreen';
import { Colors, Typography, Spacing, BorderRadius, Layout } from '../../constants/Design';
import { notificationService } from '../../services/notificationService';

export default function NotificationsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const handleComplete = async () => {
    try {
      // If notifications are enabled, configure the service
      if (notificationsEnabled) {
        await notificationService.updateSettings({
          enabled: true,
          time: '19:00', // Default 7 PM
          skipWeekends: false,
        });
      }
      
      // Mark onboarding as complete
      await AsyncStorage.setItem('onboarding_completed', 'true');
      
      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error saving onboarding completion:', error);
      // Still navigate even if storage fails
      router.replace('/(tabs)');
    }
  };

  const handleBack = () => {
    router.back();
  };

  const toggleNotifications = async (value: boolean) => {
    if (value) {
      // Request permissions when enabling notifications
      const hasPermission = await notificationService.requestPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Permission Needed',
          'To send gentle reminders, we need your permission to show notifications. You can enable this in your device settings later.',
          [{ text: 'OK' }]
        );
        return; // Don't enable notifications if permission denied
      }
    }
    setNotificationsEnabled(value);
  };

  return (
    <OnboardingScreen
      title="Optional Notifications"
      subtitle="Gentle daily reminders (completely optional)"
      primaryButtonText="Complete Setup"
      secondaryButtonText="Back"
      onPrimaryPress={handleComplete}
      onSecondaryPress={handleBack}
      progress={{ current: 8, total: 8 }}
      showLogo={false}
    >
      <View style={styles.contentContainer}>
        <View style={styles.notificationCard}>
          <Text style={styles.cardIcon}>🔔</Text>
          <Text style={styles.cardTitle}>Daily Check-in Reminders</Text>
          <Text style={styles.cardDescription}>
            Receive a gentle notification each day to encourage mindful reflection. 
            These reminders are never demanding or pressure-filled.
          </Text>
          
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Enable gentle reminders</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: Colors.neutral[300], true: Colors.primary[200] }}
              thumbColor={notificationsEnabled ? Colors.primary[600] : Colors.neutral[400]}
            />
          </View>
        </View>

        <View style={styles.approachCard}>
          <Text style={styles.approachTitle}>Our Approach to Reminders</Text>
          <View style={styles.approachList}>
            <Text style={styles.approachItem}>• No guilt or pressure language</Text>
            <Text style={styles.approachItem}>• No streaks or performance metrics</Text>
            <Text style={styles.approachItem}>• Respectful of your natural rhythms</Text>
            <Text style={styles.approachItem}>• Easy to disable anytime in settings</Text>
            <Text style={styles.approachItem}>• Sent at a calm, consistent time</Text>
          </View>
        </View>

        {notificationsEnabled && (
          <View style={styles.exampleCard}>
            <Text style={styles.exampleTitle}>Example Reminder</Text>
            <View style={styles.exampleNotification}>
              <Text style={styles.exampleText}>
                "Take a moment to check in with yourself if it feels right today. Your emotional awareness is a gift to yourself. 🌿"
              </Text>
            </View>
            <Text style={styles.exampleNote}>
              Simple, supportive, never demanding.
            </Text>
          </View>
        )}

        <View style={styles.noNotificationsCard}>
          <Text style={styles.noNotificationsTitle}>Prefer No Notifications?</Text>
          <Text style={styles.noNotificationsText}>
            That's perfectly fine! Many people prefer to check in naturally without reminders. 
            You can always enable notifications later in the settings if you change your mind.
          </Text>
        </View>

        <View style={styles.finalMessageCard}>
          <Text style={styles.finalMessageIcon}>🌱</Text>
          <Text style={styles.finalMessageTitle}>You're All Set!</Text>
          <Text style={styles.finalMessageText}>
            Welcome to your private space for emotional awareness. Remember: there's no right 
            or wrong way to use OWNLY. Trust your instincts, be gentle with yourself, and 
            let your natural wisdom guide the process.
          </Text>
        </View>
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    gap: Spacing.lg,
  },
  notificationCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Layout.cardPadding,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  cardIcon: {
    fontSize: 32,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
    marginBottom: Spacing.lg,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: Spacing.md,
  },
  switchLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.medium as any,
  },
  approachCard: {
    backgroundColor: Colors.primary[50],
    borderRadius: BorderRadius.lg,
    padding: Layout.cardPadding,
  },
  approachTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.primary[800],
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  approachList: {
    gap: Spacing.sm,
  },
  approachItem: {
    fontSize: Typography.fontSize.base,
    color: Colors.primary[700],
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  exampleCard: {
    backgroundColor: Colors.secondary[50],
    borderRadius: BorderRadius.lg,
    padding: Layout.cardPadding,
  },
  exampleTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.secondary[800],
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  exampleNotification: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.base,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.secondary[400],
  },
  exampleText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  exampleNote: {
    fontSize: Typography.fontSize.sm,
    color: Colors.secondary[600],
    textAlign: 'center',
    fontStyle: 'italic',
  },
  noNotificationsCard: {
    backgroundColor: Colors.accent[50],
    borderRadius: BorderRadius.lg,
    padding: Layout.cardPadding,
  },
  noNotificationsTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.accent[800],
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  noNotificationsText: {
    fontSize: Typography.fontSize.base,
    color: Colors.accent[700],
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  finalMessageCard: {
    backgroundColor: Colors.secondary[50],
    borderRadius: BorderRadius.lg,
    padding: Layout.cardPadding,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: Colors.secondary[400],
  },
  finalMessageIcon: {
    fontSize: 36,
    marginBottom: Spacing.md,
  },
  finalMessageTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.secondary[800],
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  finalMessageText: {
    fontSize: Typography.fontSize.base,
    color: Colors.secondary[700],
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
    fontStyle: 'italic',
  },
});