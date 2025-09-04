import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import OnboardingScreen from '../../components/OnboardingScreen';
import { Colors, Typography, Spacing, BorderRadius, Layout } from '../../constants/Design';

export default function HowItWorksScreen() {
  const handleNext = () => {
    router.push('/onboarding/sentiment-analysis');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <OnboardingScreen
      title="How OWNLY Works"
      subtitle="A simple, gentle process for emotional awareness"
      primaryButtonText="Continue"
      secondaryButtonText="Back"
      onPrimaryPress={handleNext}
      onSecondaryPress={handleBack}
      progress={{ current: 3, total: 7 }}
      showLogo={false}
    >
      <View style={styles.contentContainer}>
        <View style={styles.stepCard}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Check In</Text>
            <Text style={styles.stepDescription}>
              Select how you're feeling right now from a range of emotional options. 
              No judgment, just awareness.
            </Text>
            <Text style={styles.stepEmoji}>😊 😔 😡 😤 🤩</Text>
          </View>
        </View>

        <View style={styles.stepArrow}>
          <Text style={styles.arrowText}>↓</Text>
        </View>

        <View style={styles.stepCard}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Reflect (Optional)</Text>
            <Text style={styles.stepDescription}>
              Write about what's on your mind. This helps you process thoughts and 
              gives deeper context for insights.
            </Text>
            <View style={styles.reflectionExample}>
              <Text style={styles.reflectionText}>"Work was stressful today, but I handled it well..."</Text>
            </View>
          </View>
        </View>

        <View style={styles.stepArrow}>
          <Text style={styles.arrowText}>↓</Text>
        </View>

        <View style={styles.stepCard}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Discover Patterns</Text>
            <Text style={styles.stepDescription}>
              Over time, OWNLY identifies gentle patterns in your emotional experiences 
              and presents them as supportive insights.
            </Text>
            <Text style={styles.stepEmoji}>📊 🧠 💡</Text>
          </View>
        </View>

        <View style={styles.processNote}>
          <Text style={styles.processNoteText}>
            This process respects your natural rhythms. No daily requirements, no pressure, 
            no artificial goals. Just authentic emotional awareness when it feels right.
          </Text>
        </View>
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    gap: Spacing.md,
  },
  stepCard: {
    flexDirection: 'row',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Layout.cardPadding,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    flexShrink: 0,
  },
  stepNumberText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold as any,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  stepDescription: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
    marginBottom: Spacing.md,
  },
  stepEmoji: {
    fontSize: 20,
    textAlign: 'center',
  },
  reflectionExample: {
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.base,
    padding: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent[400],
  },
  reflectionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  stepArrow: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  arrowText: {
    fontSize: 24,
    color: Colors.primary[400],
    fontWeight: Typography.fontWeight.bold as any,
  },
  processNote: {
    backgroundColor: Colors.secondary[50],
    borderRadius: BorderRadius.lg,
    padding: Layout.cardPadding,
    borderLeftWidth: 4,
    borderLeftColor: Colors.secondary[400],
    marginTop: Spacing.lg,
  },
  processNoteText: {
    fontSize: Typography.fontSize.base,
    color: Colors.secondary[700],
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
    fontStyle: 'italic',
  },
});