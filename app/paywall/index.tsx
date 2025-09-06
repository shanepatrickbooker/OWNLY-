import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/Design';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { SUBSCRIPTION_TIERS, CONVERSION_TRIGGERS } from '../../types/subscription';
import { subscriptionService } from '../../services/subscriptionService';
import { generateInsights } from '../../utils/sentimentAnalysis';
import { EnhancedPatternDetector } from '../../utils/enhancedPatternDetector';
import { getAllMoodEntries } from '../(tabs)/database/database';
import HeaderLogo from '../../components/HeaderLogo';

export default function PaywallScreen() {
  const { trigger = 'general', features } = useLocalSearchParams<{ trigger?: string; features?: string }>();
  const { purchaseSubscription, restorePurchases, isLoading } = useSubscription();
  const [selectedTier, setSelectedTier] = useState<string>('ownly_yearly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lockedPatterns, setLockedPatterns] = useState<any[]>([]);
  const [totalPatterns, setTotalPatterns] = useState(0);

  // Find the trigger configuration
  const triggerConfig = CONVERSION_TRIGGERS.find(t => t.id === trigger) || {
    id: 'general',
    condition: 'general',
    title: 'Unlock Premium Features',
    description: 'Get the most out of your emotional wellness journey with Premium.',
    features: [
      'Full insights analysis',
      'Unlimited history access',
      'Advanced pattern recognition'
    ]
  };

  useEffect(() => {
    // Mark that we've shown this paywall trigger
    subscriptionService.markPaywallShown(trigger);
    loadUserPatterns();
  }, [trigger]);

  const loadUserPatterns = async () => {
    try {
      const entries = await getAllMoodEntries();
      if (entries.length >= 3) {
        const patternDetector = new EnhancedPatternDetector(entries);
        const patterns = patternDetector.getPersonalPatterns();
        const insights = await generateInsights(entries, false); // Generate as free user
        
        setTotalPatterns(patterns.length + insights.length);
        
        // Create locked pattern previews (show what they're missing)
        const lockedPreviews = [
          ...patterns.slice(0, 3).map(p => ({
            type: 'pattern',
            title: p.pattern,
            preview: p.actionableInsight,
            confidence: p.confidence,
            frequency: p.frequency
          })),
          ...insights.slice(0, 2).map(i => ({
            type: 'insight',
            title: i.category,
            preview: i.insight,
            confidence: i.confidence || 0.8
          }))
        ];
        
        setLockedPatterns(lockedPreviews.slice(0, 4)); // Show up to 4 locked patterns
      }
    } catch (error) {
      console.error('Error loading user patterns:', error);
    }
  };

  const handlePurchase = async () => {
    try {
      setIsProcessing(true);
      const result = await purchaseSubscription(selectedTier);
      
      if (result.success) {
        Alert.alert(
          'Welcome to Premium!',
          'Your subscription is now active. Enjoy all the premium features!',
          [
            {
              text: 'Continue',
              onPress: () => router.back()
            }
          ]
        );
      } else {
        Alert.alert(
          'Purchase Failed',
          'There was an issue with your purchase. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestore = async () => {
    try {
      setIsProcessing(true);
      const result = await restorePurchases();
      
      if (result.success) {
        Alert.alert(
          'Purchases Restored',
          'Your premium subscription has been restored!',
          [
            {
              text: 'Continue',
              onPress: () => router.back()
            }
          ]
        );
      } else {
        Alert.alert(
          'No Purchases Found',
          'No active subscriptions were found to restore.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Restore Failed',
        'Unable to restore purchases. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedTierData = SUBSCRIPTION_TIERS.find(tier => tier.id === selectedTier);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[600]} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={() => router.back()}
            disabled={isProcessing}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <HeaderLogo />
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          <Text style={styles.title}>{triggerConfig.title}</Text>
          <Text style={styles.description}>{triggerConfig.description}</Text>

          {/* Privacy Benefits */}
          <View style={styles.privacySection}>
            <Text style={styles.privacyTitle}>🔒 Your Privacy Matters</Text>
            <Text style={styles.privacyText}>
              All analysis happens locally on your device. Your personal reflections never leave your phone.
            </Text>
          </View>

          {/* Locked Patterns Preview */}
          {lockedPatterns.length > 0 && (
            <View style={styles.lockedPatternsSection}>
              <Text style={styles.lockedPatternsTitle}>
                🔓 You have {totalPatterns} pattern{totalPatterns !== 1 ? 's' : ''} waiting to be discovered
              </Text>
              <Text style={styles.lockedPatternsSubtitle}>
                Here's a preview of what Premium will unlock from your data:
              </Text>
              
              {lockedPatterns.map((pattern, index) => (
                <View key={index} style={styles.lockedPatternItem}>
                  <View style={styles.lockedPatternContent}>
                    <View style={styles.lockedPatternHeader}>
                      <Text style={styles.lockedPatternType}>
                        {pattern.type === 'pattern' ? '🧠' : '💡'} {pattern.type.toUpperCase()}
                      </Text>
                      {pattern.confidence && (
                        <Text style={styles.lockedPatternConfidence}>
                          {Math.round(pattern.confidence * 100)}% confidence
                        </Text>
                      )}
                    </View>
                    <Text style={styles.lockedPatternTitle}>{pattern.title}</Text>
                    <Text style={styles.lockedPatternPreview} numberOfLines={2}>
                      {pattern.preview}
                    </Text>
                  </View>
                  <View style={styles.lockIcon}>
                    <Text style={styles.lockEmoji}>🔒</Text>
                  </View>
                </View>
              ))}
              
              <View style={styles.upgradePrompt}>
                <Text style={styles.upgradePromptText}>
                  Unlock all {totalPatterns} personalized insights with Premium
                </Text>
              </View>
            </View>
          )}

          {/* Feature List */}
          <View style={styles.featuresSection}>
            <Text style={styles.featuresTitle}>Premium includes:</Text>
            {triggerConfig.features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          {/* Subscription Options */}
          <View style={styles.subscriptionSection}>
            <Text style={styles.subscriptionTitle}>Choose your plan:</Text>
            
            {SUBSCRIPTION_TIERS.map((tier) => (
              <TouchableOpacity
                key={tier.id}
                style={[
                  styles.tierOption,
                  selectedTier === tier.id && styles.tierOptionSelected
                ]}
                onPress={() => setSelectedTier(tier.id)}
                disabled={isProcessing}
              >
                <View style={styles.tierContent}>
                  <View style={styles.tierHeader}>
                    <Text style={[
                      styles.tierName,
                      selectedTier === tier.id && styles.tierNameSelected
                    ]}>
                      {tier.name}
                    </Text>
                    <Text style={[
                      styles.tierPrice,
                      selectedTier === tier.id && styles.tierPriceSelected
                    ]}>
                      {tier.price}
                    </Text>
                  </View>
                  
                  {tier.savings && (
                    <Text style={styles.tierSavings}>{tier.savings}</Text>
                  )}
                  
                  <Text style={styles.tierPeriod}>
                    {tier.period === 'yearly' ? 'per year' : 'per month'}
                  </Text>
                </View>
                
                {selectedTier === tier.id && (
                  <View style={styles.selectedIndicator}>
                    <Text style={styles.selectedCheck}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Subscribe Button */}
          <TouchableOpacity
            style={[styles.subscribeButton, isProcessing && styles.subscribeButtonDisabled]}
            onPress={handlePurchase}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.subscribeButtonText}>
                Start Premium - {selectedTierData?.price}
              </Text>
            )}
          </TouchableOpacity>

          {/* Restore Purchases */}
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestore}
            disabled={isProcessing}
          >
            <Text style={styles.restoreButtonText}>Restore Purchases</Text>
          </TouchableOpacity>

          {/* Terms */}
          <View style={styles.termsSection}>
            <Text style={styles.termsText}>
              Payment charged to App Store account. Subscription auto-renews unless cancelled 24 hours before period ends. 
              Cancel anytime in Settings. Terms of Service and Privacy Policy apply.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: Spacing['2xl'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.medium as any,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.md,
    lineHeight: Typography.lineHeight.tight * Typography.fontSize['3xl'],
  },
  description: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  privacySection: {
    backgroundColor: Colors.primary[50],
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary[400],
  },
  privacyTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.primary[700],
    marginBottom: Spacing.sm,
  },
  privacyText: {
    fontSize: Typography.fontSize.base,
    color: Colors.primary[600],
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  featuresSection: {
    marginBottom: Spacing.xl,
  },
  featuresTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  featureCheck: {
    fontSize: Typography.fontSize.lg,
    color: Colors.secondary[600],
    marginRight: Spacing.md,
    fontWeight: Typography.fontWeight.bold as any,
  },
  featureText: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  subscriptionSection: {
    marginBottom: Spacing.xl,
  },
  subscriptionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  tierOption: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.neutral[200],
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tierOptionSelected: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.primary[50],
    ...Shadows.card,
  },
  tierContent: {
    flex: 1,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  tierName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.text.primary,
  },
  tierNameSelected: {
    color: Colors.primary[700],
  },
  tierPrice: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.text.primary,
  },
  tierPriceSelected: {
    color: Colors.primary[600],
  },
  tierSavings: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.secondary[600],
    backgroundColor: Colors.secondary[100],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
    marginBottom: Spacing.xs,
  },
  tierPeriod: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.md,
  },
  selectedCheck: {
    fontSize: Typography.fontSize.sm,
    color: 'white',
    fontWeight: Typography.fontWeight.bold as any,
  },
  subscribeButton: {
    backgroundColor: Colors.primary[600],
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadows.brand,
  },
  subscribeButtonDisabled: {
    opacity: 0.7,
  },
  subscribeButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold as any,
    color: 'white',
  },
  restoreButton: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  restoreButtonText: {
    fontSize: Typography.fontSize.base,
    color: Colors.primary[600],
    fontWeight: Typography.fontWeight.medium as any,
  },
  termsSection: {
    paddingHorizontal: Spacing.md,
  },
  termsText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.xs,
  },
  lockedPatternsSection: {
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 2,
    borderColor: Colors.secondary[200],
    borderStyle: 'dashed',
  },
  lockedPatternsTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.secondary[700],
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  lockedPatternsSubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  lockedPatternItem: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    opacity: 0.8,
  },
  lockedPatternContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
  lockedPatternHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  lockedPatternType: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.secondary[600],
    backgroundColor: Colors.secondary[100],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.sm,
  },
  lockedPatternConfidence: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    fontWeight: Typography.fontWeight.medium as any,
  },
  lockedPatternTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
    lineHeight: Typography.lineHeight.tight * Typography.fontSize.base,
  },
  lockedPatternPreview: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.sm,
  },
  lockIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockEmoji: {
    fontSize: 24,
    opacity: 0.6,
  },
  upgradePrompt: {
    backgroundColor: Colors.secondary[100],
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  upgradePromptText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium as any,
    color: Colors.secondary[700],
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
});