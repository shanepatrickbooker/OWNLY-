import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Layout } from '../constants/Design';
import HeaderLogo from './HeaderLogo';

interface OnboardingScreenProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  showLogo?: boolean;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  onPrimaryPress?: () => void;
  onSecondaryPress?: () => void;
  primaryButtonDisabled?: boolean;
  progress?: {
    current: number;
    total: number;
  };
}

export default function OnboardingScreen({
  title,
  subtitle,
  children,
  showLogo = true,
  primaryButtonText,
  secondaryButtonText,
  onPrimaryPress,
  onSecondaryPress,
  primaryButtonDisabled = false,
  progress
}: OnboardingScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: 0 }]} showsVerticalScrollIndicator={false}>
        {/* Progress indicator */}
        {progress && (
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${(progress.current / progress.total) * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>{progress.current} of {progress.total}</Text>
          </View>
        )}

        {/* Logo */}
        {showLogo && (
          <HeaderLogo variant="onboarding" />
        )}

        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          {children}
        </View>
      </ScrollView>

      {/* Action buttons */}
      {(primaryButtonText || secondaryButtonText) && (
        <View style={styles.buttonContainer}>
          {secondaryButtonText && onSecondaryPress && (
            <TouchableOpacity style={styles.secondaryButton} onPress={onSecondaryPress}>
              <Text style={styles.secondaryButtonText}>{secondaryButtonText}</Text>
            </TouchableOpacity>
          )}
          
          {primaryButtonText && onPrimaryPress && (
            <TouchableOpacity 
              style={[styles.primaryButton, primaryButtonDisabled && styles.primaryButtonDisabled]} 
              onPress={onPrimaryPress}
              disabled={primaryButtonDisabled}
            >
              <Text style={[styles.primaryButtonText, primaryButtonDisabled && styles.primaryButtonTextDisabled]}>
                {primaryButtonText}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: Spacing['2xl'],
  },
  progressContainer: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  progressTrack: {
    width: '60%',
    height: 4,
    backgroundColor: Colors.neutral[200],
    borderRadius: 2,
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary[500],
    borderRadius: 2,
  },
  progressText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    fontWeight: Typography.fontWeight.medium as any,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.md,
    letterSpacing: Typography.letterSpacing.tight,
  },
  subtitle: {
    fontSize: Typography.fontSize.lg,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.lg,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  buttonContainer: {
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  primaryButton: {
    backgroundColor: Colors.primary[600],
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing['2xl'],
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: Colors.neutral[300],
  },
  primaryButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold as any,
    letterSpacing: Typography.letterSpacing.wide,
  },
  primaryButtonTextDisabled: {
    color: Colors.text.tertiary,
  },
  secondaryButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: Colors.text.secondary,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium as any,
  },
});