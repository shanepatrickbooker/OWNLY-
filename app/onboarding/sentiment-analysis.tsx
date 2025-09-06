import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import OnboardingScreen from '../../components/OnboardingScreen';
import { Colors, Typography, Spacing, BorderRadius, Layout } from '../../constants/Design';

export default function SentimentAnalysisScreen() {
  const handleNext = () => {
    router.push('/onboarding/enhanced-patterns');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <OnboardingScreen
      title="Understanding Your Words"
      subtitle="How we analyze your reflections (in plain language)"
      primaryButtonText="Got It"
      secondaryButtonText="Back"
      onPrimaryPress={handleNext}
      onSecondaryPress={handleBack}
      progress={{ current: 4, total: 7 }}
      showLogo={false}
    >
      <View style={styles.contentContainer}>
        <View style={styles.explanationCard}>
          <Text style={styles.cardIcon}>📝</Text>
          <Text style={styles.cardTitle}>What We Analyze</Text>
          <Text style={styles.cardText}>
            When you write reflections, OWNLY looks at the words and phrases you use 
            to understand the emotional tone and themes in your thoughts.
          </Text>
        </View>

        <View style={styles.exampleContainer}>
          <Text style={styles.exampleTitle}>For Example:</Text>
          
          <View style={styles.exampleCard}>
            <Text style={styles.exampleReflection}>
              "I felt overwhelmed at work today, but I managed to stay calm and focus on solutions."
            </Text>
            <View style={styles.exampleAnalysis}>
              <Text style={styles.analysisLabel}>Analysis might notice:</Text>
              <Text style={styles.analysisPoint}>• Challenge: work stress</Text>
              <Text style={styles.analysisPoint}>• Coping strategy: staying calm</Text>
              <Text style={styles.analysisPoint}>• Positive framing: solution-focused</Text>
            </View>
          </View>
        </View>

        <View style={styles.explanationCard}>
          <Text style={styles.cardIcon}>🧠</Text>
          <Text style={styles.cardTitle}>What We Don't Do</Text>
          <Text style={styles.cardText}>
            We don't diagnose, judge, or try to "fix" anything. We simply help you notice 
            patterns in your own words and experiences.
          </Text>
        </View>

        <View style={styles.technicalNote}>
          <Text style={styles.technicalNoteTitle}>Technical Note</Text>
          <Text style={styles.technicalNoteText}>
            This analysis happens entirely on your device using established natural language 
            processing techniques. No human ever reads your reflections, and no data is sent 
            anywhere for analysis.
          </Text>
        </View>

        <View style={styles.benefitCard}>
          <Text style={styles.benefitTitle}>Why This Helps</Text>
          <Text style={styles.benefitText}>
            Sometimes patterns in our emotional experiences are hard to see day-to-day. 
            Gentle analysis can reveal helpful insights about your coping strategies, 
            triggers, and emotional growth over time.
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
  explanationCard: {
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
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  exampleContainer: {
    backgroundColor: Colors.accent[50],
    borderRadius: BorderRadius.lg,
    padding: Layout.cardPadding,
  },
  exampleTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.accent[800],
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  exampleCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.base,
    padding: Spacing.md,
  },
  exampleReflection: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: Spacing.md,
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  exampleAnalysis: {
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
    paddingTop: Spacing.md,
  },
  analysisLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.medium as any,
    marginBottom: Spacing.xs,
  },
  analysisPoint: {
    fontSize: Typography.fontSize.sm,
    color: Colors.accent[700],
    marginBottom: Spacing.xs,
  },
  technicalNote: {
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.lg,
    padding: Layout.cardPadding,
  },
  technicalNoteTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  technicalNoteText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.sm,
  },
  benefitCard: {
    backgroundColor: Colors.secondary[50],
    borderRadius: BorderRadius.lg,
    padding: Layout.cardPadding,
    borderLeftWidth: 4,
    borderLeftColor: Colors.secondary[400],
  },
  benefitTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.secondary[800],
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  benefitText: {
    fontSize: Typography.fontSize.base,
    color: Colors.secondary[700],
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
});