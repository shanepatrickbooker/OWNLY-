import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import OnboardingScreen from '../../components/OnboardingScreen';
import { Colors, Typography, Spacing, BorderRadius, Layout } from '../../constants/Design';

export default function WelcomeScreen() {
  const handleNext = () => {
    router.push('/onboarding/privacy');
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  return (
    <OnboardingScreen
      title="Welcome to OWNLY"
      subtitle="A private space for emotional clarity and personal growth"
      primaryButtonText="Get Started"
      secondaryButtonText="Skip Introduction"
      onPrimaryPress={handleNext}
      onSecondaryPress={handleSkip}
      progress={{ current: 1, total: 7 }}
    >
      <View style={styles.contentContainer}>
        <View style={styles.featureCard}>
          <Text style={styles.featureIcon}>🌿</Text>
          <Text style={styles.featureTitle}>Natural & Private</Text>
          <Text style={styles.featureText}>
            Your reflections stay on your device. No accounts, no data sharing, no judgment.
          </Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureIcon}>🧠</Text>
          <Text style={styles.featureTitle}>Gentle Insights</Text>
          <Text style={styles.featureText}>
            Discover patterns in your emotional experiences through thoughtful analysis.
          </Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureIcon}>🌱</Text>
          <Text style={styles.featureTitle}>Your Own Pace</Text>
          <Text style={styles.featureText}>
            No pressure, no streaks, no goals. Just authentic emotional awareness.
          </Text>
        </View>

        <View style={styles.messageContainer}>
          <Text style={styles.welcomeMessage}>
            OWNLY is designed to be a gentle companion on your journey toward emotional understanding. 
            Take a moment to learn how it works.
          </Text>
        </View>
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    gap: Spacing.xl,
  },
  featureCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Layout.cardPadding,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: Spacing.md,
  },
  featureTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  featureText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  messageContainer: {
    backgroundColor: Colors.primary[50],
    borderRadius: BorderRadius.lg,
    padding: Layout.cardPadding,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary[400],
    marginTop: Spacing.md,
  },
  welcomeMessage: {
    fontSize: Typography.fontSize.base,
    color: Colors.primary[800],
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
    fontStyle: 'italic',
  },
});