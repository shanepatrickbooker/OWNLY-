import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/Design';
import { useSubscription } from '../contexts/SubscriptionContext';

interface PremiumLockProps {
  trigger: string;
  title?: string;
  description?: string;
  features?: string[];
  children?: React.ReactNode;
  style?: ViewStyle;
  showPreview?: boolean;
}

export default function PremiumLock({
  trigger,
  title = "Premium Feature",
  description = "Unlock this feature with Premium",
  features = [],
  children,
  style,
  showPreview = false
}: PremiumLockProps) {
  const { hasPremium, isLoading } = useSubscription();

  // If user has premium, show the content
  if (hasPremium) {
    return <>{children}</>;
  }

  // Show preview if requested
  if (showPreview) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.previewContainer}>
          {children}
          <View style={styles.overlay}>
            <View style={styles.lockContent}>
              <Text style={styles.lockIcon}>🔒</Text>
              <Text style={styles.lockTitle}>{title}</Text>
              <Text style={styles.lockDescription}>{description}</Text>
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={() => router.push(`/paywall?trigger=${trigger}`)}
                disabled={isLoading}
                accessibilityRole="button"
                accessibilityLabel="Upgrade to premium"
                accessibilityHint="Opens premium subscription options and pricing"
                accessibilityState={{ disabled: isLoading }}
              >
                <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Show full lock screen
  return (
    <View style={[styles.container, style]}>
      <View style={styles.lockContainer}>
        <View style={styles.lockHeader}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.lockTitle}>{title}</Text>
          <Text style={styles.lockDescription}>{description}</Text>
        </View>

        {features.length > 0 && (
          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>Premium includes:</Text>
            {features.slice(0, 3).map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.upgradeButton}
          onPress={() => router.push(`/paywall?trigger=${trigger}`)}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel="Upgrade to premium"
          accessibilityHint="Opens premium subscription options and pricing"
          accessibilityState={{ disabled: isLoading }}
        >
          <Text style={styles.upgradeButtonText}>
            {isLoading ? 'Loading...' : 'Upgrade to Premium'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.learnMoreButton}
          onPress={() => router.push(`/paywall?trigger=${trigger}`)}
          accessibilityRole="button"
          accessibilityLabel="Learn more about premium features"
          accessibilityHint="View detailed information about premium subscription benefits"
        >
          <Text style={styles.learnMoreButtonText}>Learn more</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  previewContainer: {
    flex: 1,
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  lockContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.background.secondary,
    margin: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.card,
  },
  lockHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  lockContent: {
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    maxWidth: '90%',
    ...Shadows.card,
  },
  lockIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  lockTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  lockDescription: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
    marginBottom: Spacing.lg,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: Spacing.xl,
  },
  featuresTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  featureCheck: {
    fontSize: Typography.fontSize.base,
    color: Colors.secondary[600],
    marginRight: Spacing.md,
    fontWeight: Typography.fontWeight.bold as any,
  },
  featureText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    lineHeight: Typography.lineHeight.normal * Typography.fontSize.sm,
  },
  upgradeButton: {
    backgroundColor: Colors.primary[600],
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    minWidth: 200,
    alignItems: 'center',
    ...Shadows.brand,
  },
  upgradeButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold as any,
    color: 'white',
  },
  learnMoreButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  learnMoreButtonText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary[600],
    fontWeight: Typography.fontWeight.medium as any,
  },
});