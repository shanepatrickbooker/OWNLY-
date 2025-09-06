import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { router } from 'expo-router';
import OnboardingScreen from '../../components/OnboardingScreen';
import { Colors, Typography, Spacing, BorderRadius, Layout } from '../../constants/Design';

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

export default function BoundariesScreen() {
  const handleNext = () => {
    router.push('/onboarding/notifications');
  };

  const handleBack = () => {
    router.back();
  };

  const handleCallCrisis = (number: string) => {
    const cleanNumber = number.replace(/[^0-9]/g, '');
    if (cleanNumber) {
      Linking.openURL(`tel:${cleanNumber}`);
    }
  };

  return (
    <OnboardingScreen
      title="Mental Health Boundaries"
      subtitle="Understanding what OWNLY can and can't do"
      primaryButtonText="I Understand"
      secondaryButtonText="Back"
      onPrimaryPress={handleNext}
      onSecondaryPress={handleBack}
      progress={{ current: 7, total: 8 }}
      showLogo={false}
    >
      <View style={styles.contentContainer}>
        <View style={styles.scopeCard}>
          <Text style={styles.scopeIcon}>🌿</Text>
          <Text style={styles.scopeTitle}>What OWNLY Is</Text>
          <View style={styles.scopeList}>
            <Text style={styles.scopeItem}>✓ A personal reflection tool</Text>
            <Text style={styles.scopeItem}>✓ Pattern recognition for self-awareness</Text>
            <Text style={styles.scopeItem}>✓ A private space for emotional check-ins</Text>
            <Text style={styles.scopeItem}>✓ Support for mindful self-observation</Text>
          </View>
        </View>

        <View style={styles.limitationsCard}>
          <Text style={styles.limitationsIcon}>⚠️</Text>
          <Text style={styles.limitationsTitle}>What OWNLY Is Not</Text>
          <View style={styles.limitationsList}>
            <Text style={styles.limitationsItem}>✗ Medical or mental health treatment</Text>
            <Text style={styles.limitationsItem}>✗ Therapy or professional counseling</Text>
            <Text style={styles.limitationsItem}>✗ Crisis intervention or emergency support</Text>
            <Text style={styles.limitationsItem}>✗ Diagnostic tool for mental health conditions</Text>
          </View>
        </View>

        <View style={styles.whenToSeekHelpCard}>
          <Text style={styles.helpTitle}>When to Seek Professional Help</Text>
          <Text style={styles.helpDescription}>
            Please consult a qualified healthcare provider if you experience:
          </Text>
          <View style={styles.helpList}>
            <Text style={styles.helpItem}>• Persistent feelings of sadness, anxiety, or hopelessness</Text>
            <Text style={styles.helpItem}>• Difficulty functioning in daily life</Text>
            <Text style={styles.helpItem}>• Thoughts of self-harm or suicide</Text>
            <Text style={styles.helpItem}>• Substance abuse concerns</Text>
            <Text style={styles.helpItem}>• Significant changes in sleep, appetite, or behavior</Text>
          </View>
        </View>

        <View style={styles.crisisResourcesCard}>
          <Text style={styles.crisisTitle}>Immediate Crisis Resources</Text>
          <Text style={styles.crisisDescription}>
            If you're in immediate danger or having thoughts of self-harm:
          </Text>
          
          {CRISIS_RESOURCES.map((resource, index) => (
            <TouchableOpacity 
              key={index}
              style={styles.crisisResource}
              onPress={() => handleCallCrisis(resource.number)}
            >
              <Text style={styles.resourceName}>{resource.name}</Text>
              <Text style={styles.resourceNumber}>{resource.number}</Text>
              <Text style={styles.resourceAvailable}>{resource.available}</Text>
            </TouchableOpacity>
          ))}
          
          <Text style={styles.emergencyNote}>
            In life-threatening emergencies, call 911 immediately.
          </Text>
        </View>

        <View style={styles.disclaimerCard}>
          <Text style={styles.disclaimerText}>
            OWNLY is designed to complement, not replace, professional mental health care. 
            Your safety and wellbeing are the top priority - please reach out for professional 
            support when needed.
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
  scopeCard: {
    backgroundColor: Colors.secondary[50],
    borderRadius: BorderRadius.lg,
    padding: Layout.cardPadding,
    alignItems: 'center',
  },
  scopeIcon: {
    fontSize: 32,
    marginBottom: Spacing.md,
  },
  scopeTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.secondary[800],
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  scopeList: {
    gap: Spacing.sm,
    alignSelf: 'stretch',
  },
  scopeItem: {
    fontSize: Typography.fontSize.base,
    color: Colors.secondary[700],
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  limitationsCard: {
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.lg,
    padding: Layout.cardPadding,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: Colors.neutral[400],
  },
  limitationsIcon: {
    fontSize: 32,
    marginBottom: Spacing.md,
  },
  limitationsTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  limitationsList: {
    gap: Spacing.sm,
    alignSelf: 'stretch',
  },
  limitationsItem: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  whenToSeekHelpCard: {
    backgroundColor: Colors.accent[50],
    borderRadius: BorderRadius.lg,
    padding: Layout.cardPadding,
  },
  helpTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.accent[800],
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  helpDescription: {
    fontSize: Typography.fontSize.base,
    color: Colors.accent[700],
    textAlign: 'center',
    marginBottom: Spacing.md,
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  helpList: {
    gap: Spacing.sm,
  },
  helpItem: {
    fontSize: Typography.fontSize.base,
    color: Colors.accent[700],
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  crisisResourcesCard: {
    backgroundColor: '#FEF2F2', // Light red background
    borderRadius: BorderRadius.lg,
    padding: Layout.cardPadding,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444', // Red accent
  },
  crisisTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold as any,
    color: '#991B1B', // Dark red
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  crisisDescription: {
    fontSize: Typography.fontSize.base,
    color: '#7F1D1D', // Dark red
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  crisisResource: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.base,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#FCA5A5', // Light red border
  },
  resourceName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold as any,
    color: '#991B1B', // Dark red
    marginBottom: Spacing.xs,
  },
  resourceNumber: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold as any,
    color: '#DC2626', // Red
    marginBottom: Spacing.xs,
  },
  resourceAvailable: {
    fontSize: Typography.fontSize.sm,
    color: '#7F1D1D', // Dark red
  },
  emergencyNote: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold as any,
    color: '#991B1B', // Dark red
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  disclaimerCard: {
    backgroundColor: Colors.primary[50],
    borderRadius: BorderRadius.lg,
    padding: Layout.cardPadding,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary[400],
  },
  disclaimerText: {
    fontSize: Typography.fontSize.base,
    color: Colors.primary[800],
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium as any,
  },
});