import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import OnboardingScreen from '../../components/OnboardingScreen';
import { Colors, Typography, Spacing, BorderRadius, Layout } from '../../constants/Design';

export default function EnhancedPatternsScreen() {
  const handleNext = () => {
    router.push('/onboarding/expectations');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <OnboardingScreen
      title="Enhanced Pattern Detection"
      subtitle="OWNLY learns YOUR unique patterns (privacy-first AI)"
      primaryButtonText="Sounds Great"
      secondaryButtonText="Back"
      onPrimaryPress={handleNext}
      onSecondaryPress={handleBack}
      progress={{ current: 5, total: 8 }}
      showLogo={false}
    >
      <View style={styles.contentContainer}>
        <View style={styles.heroCard}>
          <Text style={styles.heroIcon}>🧠</Text>
          <Text style={styles.heroTitle}>OWNLY Learns YOUR Patterns</Text>
          <Text style={styles.heroText}>
            After just 3-5 check-ins, OWNLY begins recognizing what helps you feel better, 
            what triggers difficult times, and your unique emotional rhythms.
          </Text>
        </View>

        <View style={styles.examplesContainer}>
          <Text style={styles.examplesTitle}>What OWNLY Might Discover:</Text>
          
          <View style={styles.patternExample}>
            <Text style={styles.patternEmoji}>✨</Text>
            <Text style={styles.patternText}>"Exercise consistently improves your mood"</Text>
            <Text style={styles.patternDetail}>When feeling down, try walking - it helped 4/4 times ✅✅✅✅</Text>
          </View>

          <View style={styles.patternExample}>
            <Text style={styles.patternEmoji}>🔄</Text>
            <Text style={styles.patternText}>"Thursdays tend to be your best days"</Text>
            <Text style={styles.patternDetail}>Schedule important activities when you feel strongest</Text>
          </View>

          <View style={styles.patternExample}>
            <Text style={styles.patternEmoji}>📈</Text>
            <Text style={styles.patternText}>"Your morning check-ins lead to better days"</Text>
            <Text style={styles.patternDetail}>Based on your patterns, morning reflection helps set a positive tone</Text>
          </View>
        </View>

        <View style={styles.privacyCard}>
          <Text style={styles.privacyIcon}>🔒</Text>
          <Text style={styles.privacyTitle}>100% Private, On-Device Intelligence</Text>
          <Text style={styles.privacyText}>
            All pattern analysis happens locally on your device. Your personal patterns 
            never leave your phone - it's like having a personal emotional coach that only you know about.
          </Text>
        </View>

        <View style={styles.whyItHelpsCard}>
          <Text style={styles.whyItHelpsTitle}>Why This Matters</Text>
          <Text style={styles.whyItHelpsText}>
            Most people can't see their own emotional patterns - we're too close to them. 
            OWNLY acts as a neutral observer, helping you discover what actually works 
            for YOUR unique mind and circumstances.
          </Text>
        </View>

        <View style={styles.expectationCard}>
          <Text style={styles.expectationTitle}>What to Expect</Text>
          <View style={styles.expectationList}>
            <Text style={styles.expectationItem}>• Patterns emerge after 3+ entries</Text>
            <Text style={styles.expectationItem}>• More data = more personalized insights</Text>
            <Text style={styles.expectationItem}>• No judgment, only gentle observations</Text>
            <Text style={styles.expectationItem}>• You control what insights you see</Text>
          </View>
        </View>
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    gap: Spacing.lg,
  },
  heroCard: {
    backgroundColor: Colors.primary[50],
    borderRadius: BorderRadius.lg,
    padding: Layout.cardPadding,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary[400],
  },
  heroIcon: {
    fontSize: 32,
    marginBottom: Spacing.md,
  },
  heroTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.primary[800],
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  heroText: {
    fontSize: Typography.fontSize.base,
    color: Colors.primary[700],
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  examplesContainer: {
    backgroundColor: Colors.secondary[50],
    borderRadius: BorderRadius.lg,
    padding: Layout.cardPadding,
  },
  examplesTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.secondary[800],
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  patternExample: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.base,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.secondary[400],
  },
  patternEmoji: {
    fontSize: 20,
    marginBottom: Spacing.xs,
  },
  patternText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  patternDetail: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontStyle: 'italic',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.sm,
  },
  privacyCard: {
    backgroundColor: Colors.accent[50],
    borderRadius: BorderRadius.lg,
    padding: Layout.cardPadding,
    alignItems: 'center',
  },
  privacyIcon: {
    fontSize: 28,
    marginBottom: Spacing.md,
  },
  privacyTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.accent[800],
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  privacyText: {
    fontSize: Typography.fontSize.base,
    color: Colors.accent[700],
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  whyItHelpsCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Layout.cardPadding,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  whyItHelpsTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  whyItHelpsText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  expectationCard: {
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.lg,
    padding: Layout.cardPadding,
  },
  expectationTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  expectationList: {
    gap: Spacing.sm,
  },
  expectationItem: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.sm,
  },
});