import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import OnboardingScreen from '../../components/OnboardingScreen';
import { Colors, Typography, Spacing, BorderRadius, Layout } from '../../constants/Design';

export default function ExpectationsScreen() {
  const handleNext = () => {
    router.push('/onboarding/boundaries');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <OnboardingScreen
      title="Setting Expectations"
      subtitle="Your insights will appear after 5-7 entries. Meaningful patterns emerge over time."
      primaryButtonText="Continue"
      secondaryButtonText="Back"
      onPrimaryPress={handleNext}
      onSecondaryPress={handleBack}
      progress={{ current: 5, total: 7 }}
      showLogo={false}
    >
      <View style={styles.contentContainer}>
        <View style={styles.timelineContainer}>
          <Text style={styles.timelineTitle}>Your Journey Timeline</Text>
          
          <View style={styles.timelineItem}>
            <View style={styles.timelineIcon}>
              <Text style={styles.timelineIconText}>1-4</Text>
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>First Few Entries</Text>
              <Text style={styles.timelineDescription}>
                Getting started. No patterns yet - just building your personal database 
                of emotional experiences.
              </Text>
            </View>
          </View>

          <View style={styles.timelineItem}>
            <View style={[styles.timelineIcon, styles.timelineIconActive]}>
              <Text style={styles.timelineIconTextActive}>5-10</Text>
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>First Insights</Text>
              <Text style={styles.timelineDescription}>
                Basic patterns start to emerge. Simple observations about your 
                emotional rhythms and common themes.
              </Text>
            </View>
          </View>

          <View style={styles.timelineItem}>
            <View style={styles.timelineIcon}>
              <Text style={styles.timelineIconText}>20+</Text>
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>Meaningful Patterns</Text>
              <Text style={styles.timelineDescription}>
                Richer insights about your coping strategies, emotional triggers, 
                and personal growth patterns become visible.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.realityCheckCard}>
          <Text style={styles.realityCheckIcon}>🌱</Text>
          <Text style={styles.realityCheckTitle}>Emotional Growth Takes Time</Text>
          <Text style={styles.realityCheckText}>
            Unlike fitness apps with daily streaks, emotional awareness develops naturally 
            and organically. Some weeks you'll check in daily, others not at all - 
            both are perfectly normal.
          </Text>
        </View>

        <View style={styles.qualityCard}>
          <Text style={styles.qualityTitle}>Quality Over Quantity</Text>
          <View style={styles.qualityPoints}>
            <Text style={styles.qualityPoint}>• One thoughtful entry beats seven rushed ones</Text>
            <Text style={styles.qualityPoint}>• Authentic reflections create better insights</Text>
            <Text style={styles.qualityPoint}>• Your natural rhythm is the right rhythm</Text>
            <Text style={styles.qualityPoint}>• Taking breaks is healthy and expected</Text>
          </View>
        </View>

        <View style={styles.encouragementCard}>
          <Text style={styles.encouragementText}>
            Remember: OWNLY is designed to support your existing emotional intelligence, 
            not replace it. Trust your instincts, and let the insights complement 
            your natural self-awareness.
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
  timelineContainer: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Layout.cardPadding,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  timelineTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  timelineIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.neutral[300],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    flexShrink: 0,
  },
  timelineIconActive: {
    backgroundColor: Colors.primary[600],
  },
  timelineIconText: {
    color: Colors.text.secondary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold as any,
  },
  timelineIconTextActive: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold as any,
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  timelineDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.sm,
  },
  realityCheckCard: {
    backgroundColor: Colors.secondary[50],
    borderRadius: BorderRadius.lg,
    padding: Layout.cardPadding,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: Colors.secondary[400],
  },
  realityCheckIcon: {
    fontSize: 32,
    marginBottom: Spacing.md,
  },
  realityCheckTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.secondary[800],
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  realityCheckText: {
    fontSize: Typography.fontSize.base,
    color: Colors.secondary[700],
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  qualityCard: {
    backgroundColor: Colors.accent[50],
    borderRadius: BorderRadius.lg,
    padding: Layout.cardPadding,
  },
  qualityTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.accent[800],
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  qualityPoints: {
    gap: Spacing.sm,
  },
  qualityPoint: {
    fontSize: Typography.fontSize.base,
    color: Colors.accent[700],
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  encouragementCard: {
    backgroundColor: Colors.primary[50],
    borderRadius: BorderRadius.lg,
    padding: Layout.cardPadding,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary[400],
  },
  encouragementText: {
    fontSize: Typography.fontSize.base,
    color: Colors.primary[800],
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
    fontStyle: 'italic',
  },
});