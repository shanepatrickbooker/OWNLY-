import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import OnboardingScreen from '../../components/OnboardingScreen';
import { Colors, Typography, Spacing, BorderRadius, Layout } from '../../constants/Design';

export default function PrivacyScreen() {
  const handleNext = () => {
    router.push('/onboarding/how-it-works');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <OnboardingScreen
      title="Your Privacy Promise"
      subtitle="Why your emotional data deserves special protection"
      primaryButtonText="I Understand"
      secondaryButtonText="Back"
      onPrimaryPress={handleNext}
      onSecondaryPress={handleBack}
      progress={{ current: 2, total: 7 }}
      showLogo={false}
    >
      <View style={styles.contentContainer}>
        <View style={styles.privacyCard}>
          <Text style={styles.cardIcon}>🔒</Text>
          <Text style={styles.cardTitle}>Everything Stays Local</Text>
          <Text style={styles.cardText}>
            Your mood entries, reflections, and insights never leave your device. 
            No servers, no cloud storage, no data collection.
          </Text>
        </View>

        <View style={styles.privacyCard}>
          <Text style={styles.cardIcon}>🛡️</Text>
          <Text style={styles.cardTitle}>No Account Required</Text>
          <Text style={styles.cardText}>
            No email, phone number, or personal information needed. Your identity 
            remains completely private.
          </Text>
        </View>

        <View style={styles.privacyCard}>
          <Text style={styles.cardIcon}>🧠</Text>
          <Text style={styles.cardTitle}>Analysis Happens Here</Text>
          <Text style={styles.cardText}>
            Pattern recognition and insights are generated on your device using 
            your device's processing power.
          </Text>
        </View>

        <View style={styles.whyItMattersContainer}>
          <Text style={styles.whyItMattersTitle}>Why This Matters</Text>
          <Text style={styles.whyItMattersText}>
            Mental health data is deeply personal. Many people avoid digital wellness tools 
            because they worry about privacy. With OWNLY, you can explore your emotional 
            patterns with complete confidence that your innermost thoughts remain yours alone.
          </Text>
        </View>

        <View style={styles.guaranteeContainer}>
          <Text style={styles.guaranteeText}>
            ✓ No data ever transmitted{'\n'}
            ✓ No analytics or tracking{'\n'}
            ✓ Deleting the app removes everything{'\n'}
            ✓ You have complete control
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
  privacyCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Layout.cardPadding,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  cardIcon: {
    fontSize: 28,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  cardText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.sm,
  },
  whyItMattersContainer: {
    backgroundColor: Colors.secondary[50],
    borderRadius: BorderRadius.lg,
    padding: Layout.cardPadding,
    borderLeftWidth: 4,
    borderLeftColor: Colors.secondary[400],
    marginTop: Spacing.md,
  },
  whyItMattersTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.secondary[800],
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  whyItMattersText: {
    fontSize: Typography.fontSize.base,
    color: Colors.secondary[700],
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  guaranteeContainer: {
    backgroundColor: Colors.accent[50],
    borderRadius: BorderRadius.lg,
    padding: Layout.cardPadding,
    alignItems: 'center',
  },
  guaranteeText: {
    fontSize: Typography.fontSize.base,
    color: Colors.accent[800],
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium as any,
  },
});