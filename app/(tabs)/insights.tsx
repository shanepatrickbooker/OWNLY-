import { useFocusEffect, router } from 'expo-router';
import React, { useState, useCallback } from 'react';
import { 
  SafeAreaView, 
  ScrollView, 
  StyleSheet, 
  Text, 
  View, 
  RefreshControl,
  Alert,
  TouchableOpacity
} from 'react-native';
import { getAllMoodEntries } from './database/database';
import { generateInsights, MoodInsight } from '../../utils/sentimentAnalysis';
import { InteractionManager } from 'react-native';
import { checkDataQuality, initializeInsightsEngine } from '../../utils/insightsGate';
import { generateFallbackCards, type FallbackCard } from '../../utils/fallbackContent';
import { Colors, Typography, Spacing, BorderRadius, Shadows, Layout, getColors } from '../../constants/Design';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useTheme } from '../../contexts/ThemeContext';
import { FREE_TIER_LIMITS } from '../../types/subscription';
import { conversionService } from '../../services/conversionService';
import PremiumLock from '../../components/PremiumLock';
import HeaderLogo from '../../components/HeaderLogo';
import EmotionalFlow from '../../components/EmotionalFlow';

export default function InsightsScreen() {
  const { hasPremium } = useSubscription();
  const { isDark } = useTheme();
  
  // Get theme-appropriate colors
  const colors = getColors(isDark);
  const [insights, setInsights] = useState<MoodInsight[]>([]);
  const [fallbackCards, setFallbackCards] = useState<FallbackCard[]>([]);
  const [showFallback, setShowFallback] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entryCount, setEntryCount] = useState(0);
  const [currentInsightIndex, setCurrentInsightIndex] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [entries, setEntries] = useState<any[]>([]);

  const loadInsights = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Initialize insights engine (versioning)
      await initializeInsightsEngine();

      const allEntries = await getAllMoodEntries();
      setEntries(allEntries);
      setEntryCount(allEntries.length);

      // Check data quality
      const qualityCheck = checkDataQuality(allEntries.map(e => ({
        mood_value: e.mood_value,
        mood_label: e.mood_label,
        reflection: e.reflection,
        timestamp: e.timestamp || e.created_at,
        created_at: e.created_at
      })));

      if (!qualityCheck.hasEnoughData) {
        // Not enough data - show fallback content
        if (__DEV__) console.log('📊 Using fallback content:', qualityCheck.reason);
        setShowFallback(true);
        setInsights([]);
        setFallbackCards(generateFallbackCards(allEntries as any));
        setLastUpdated(new Date());
        return;
      }

      const entriesWithTimestamps = allEntries.filter(entry => entry.created_at);

      // Show loading state immediately, then run expensive calculations after interactions
      await new Promise(resolve => setTimeout(resolve, 100));

      // Add small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 300));

      // Generate insights (now async with quality gates)
      const generatedInsights = await generateInsights(entriesWithTimestamps as any, hasPremium);

      if (generatedInsights.length === 0) {
        // Insights were filtered out - show fallback
        if (__DEV__) console.log('📊 No insights passed quality gates, using fallback');
        setShowFallback(true);
        setInsights([]);
        setFallbackCards(generateFallbackCards(allEntries as any));
      } else {
        // We have quality insights!
        if (__DEV__) console.log(`🧠 Generated ${generatedInsights.length} quality insights:`, generatedInsights.map(i => i.type));
        setShowFallback(false);
        setInsights(generatedInsights);
        setFallbackCards([]);
        setCurrentInsightIndex(0);
      }

      setLastUpdated(new Date());

      // Track insights view for conversion triggers
      await conversionService.trackInsightsView();
    } catch (err) {
      if (__DEV__) console.error('Error loading insights:', err);
      setError('Unable to analyze your patterns right now. Please try again.');
      setInsights([]);
      setFallbackCards([]);
    } finally {
      setLoading(false);
    }
  }, [hasPremium]);

  useFocusEffect(useCallback(() => {
    loadInsights();
  }, [loadInsights]));

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just updated';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getEntryCountMessage = (count: number): string => {
    if (count === 0) return "Start tracking your moods to discover your patterns";
    if (count === 1) return "Keep going! You need a few more entries to see patterns";
    if (count === 2) return "Almost there! One more entry and you'll see your first insight";
    return `From ${count} reflection${count !== 1 ? 's' : ''}`;
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'prediction': return Colors.warning + '20'; // Light orange
      case 'discovery': return Colors.primary[500] + '20'; // Light blue  
      case 'trend': return Colors.success + '20'; // Light green
      case 'cycle': return Colors.neutral[400] + '20'; // Light gray
      default: return Colors.neutral[100];
    }
  };

  const getCategoryEmoji = (category: string): string => {
    switch (category) {
      case 'prediction': return '🎯';
      case 'discovery': return '💡';
      case 'trend': return '📈';
      case 'cycle': return '🔄';
      default: return '📊';
    }
  };

  const getVisualSuccessRate = (successRate: number, frequency: number): string => {
    const successes = Math.round(successRate * frequency);
    
    // Smart visual scaling based on frequency
    if (frequency <= 6) {
      // Show all checkmarks for small datasets
      let visual = '';
      for (let i = 0; i < frequency; i++) {
        visual += i < successes ? '✅' : '⬜';
      }
      return `${visual} Works ${successes}/${frequency} times`;
    } else if (frequency <= 10) {
      // Show representative sample for medium datasets  
      let visual = '';
      for (let i = 0; i < 6; i++) {
        visual += i < Math.round(successes * 6 / frequency) ? '✅' : '⬜';
      }
      return `${visual}... Works ${successes}/${frequency} times`;
    } else {
      // Use text-only for large datasets
      const percentage = Math.round(successRate * 100);
      return `Works ${successes}/${frequency} times (${percentage}%)`;
    }
  };

  const getInsightIcon = (type: MoodInsight['type']) => {
    switch (type) {
      case 'nuanced_emotions': return '🎭';
      case 'contextual_patterns': return '🔍';
      case 'length_variation': return '📝';
      case 'temporal_patterns': return '📈';
      case 'day_of_week_patterns': return '📅';
      case 'time_of_day_patterns': return '🌅';
      case 'trigger_identification': return '🎯';
      case 'progress_recognition': return '📊';
      case 'coping_recognition': return '🌱';
      case 'environmental_awareness': return '🌍';
      default: return '💡';
    }
  };

  const getInsightColor = (type: MoodInsight['type']) => {
    switch (type) {
      case 'nuanced_emotions': return '#8B5CF6';
      case 'contextual_patterns': return '#06B6D4';
      case 'length_variation': return '#10B981';
      case 'temporal_patterns': return '#F59E0B';
      case 'day_of_week_patterns': return '#EC4899';
      case 'time_of_day_patterns': return '#F97316';
      case 'trigger_identification': return '#EF4444';
      case 'progress_recognition': return '#22C55E';
      case 'coping_recognition': return '#84CC16';
      case 'environmental_awareness': return '#06B6D4';
      default: return '#6366F1';
    }
  };

  // Create theme-aware styles
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadInsights} />
        }
      >
        {/* Header */}
        <HeaderLogo />
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            {entryCount < 3 ? 'Your Patterns' : 'Your Key Pattern'}
          </Text>
          <Text style={styles.subtitle}>
            {getEntryCountMessage(entryCount)}
          </Text>
        </View>

        {/* Update Status */}
        {lastUpdated && entryCount >= 3 && !loading && (
          <Text style={styles.updateStatus}>
            Updated {getTimeAgo(lastUpdated)} • Insights refresh as you add entries
          </Text>
        )}

        {/* Visualizations Section */}
        {!loading && !error && entries.length > 1 && (
          <View style={styles.visualizationsSection}>
            {/* Emotional Flow */}
            <View style={styles.visualizationCard}>
              <Text style={styles.visualizationTitle}>Emotional Flow</Text>
              <EmotionalFlow 
                entries={entries} 
                width={320} 
                height={140} 
                days={hasPremium ? 30 : 14} 
                showTrend={true} 
              />
              <Text style={styles.visualizationSubtext}>
                {hasPremium ? 'Full 30-day view' : 'Last 14 days • Upgrade for full history'}
              </Text>
            </View>
          </View>
        )}

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingEmoji}>🧠</Text>
            <Text style={styles.loadingText}>Discovering your patterns...</Text>
          </View>
        )}

        {/* Error State */}
        {error && !loading && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorEmoji}>🤔</Text>
            <Text style={styles.errorTitle}>Something went wrong</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadInsights}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Single Insight Display */}
        {!loading && !error && (
          <>
            {entryCount < 3 ? (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateIcon}>
                  {entryCount === 0 ? '🌱' : entryCount === 1 ? '🌿' : '✨'}
                </Text>
                <Text style={styles.emptyStateTitle}>
                  {entryCount === 0 ? 'Ready to begin' :
                   entryCount === 1 ? 'Great start!' :
                   'So close!'}
                </Text>
                <Text style={styles.emptyStateText}>
                  {entryCount === 0 ?
                    'Track your first mood to start building your emotional awareness journey. Each entry helps us understand your unique patterns.' :
                   entryCount === 1 ?
                    'You\'ve made your first entry! Add a few more mood check-ins to see your first personalized insight.' :
                    'Just one more entry and you\'ll discover your first pattern! Your insights will appear here automatically.'}
                </Text>
              </View>
            ) : showFallback && fallbackCards.length > 0 ? (
              <View style={styles.fallbackContainer}>
                <View style={styles.fallbackHeader}>
                  <Text style={styles.fallbackHeaderText}>
                    Building your pattern insights...
                  </Text>
                  <Text style={styles.fallbackSubtext}>
                    Here's what we can show you right now:
                  </Text>
                </View>
                {fallbackCards.map((card, index) => (
                  <View key={index} style={styles.fallbackCard}>
                    {card.emoji && (
                      <Text style={styles.fallbackEmoji}>{card.emoji}</Text>
                    )}
                    <Text style={styles.fallbackTitle}>{card.title}</Text>
                    <Text style={styles.fallbackContent}>{card.content}</Text>
                    {card.actionText && (
                      <Text style={styles.fallbackAction}>{card.actionText}</Text>
                    )}
                  </View>
                ))}
              </View>
            ) : insights.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateIcon}>🌱</Text>
                <Text style={styles.emptyStateTitle}>Building your patterns</Text>
                <Text style={styles.emptyStateText}>
                  Your emotional patterns are still taking shape. Each reflection helps 
                  create a clearer picture of your unique rhythms and experiences.
                </Text>
                
                <View style={styles.patternsHintCard}>
                  <Text style={styles.hintTitle}>What We're Looking For</Text>
                  <Text style={styles.hintText}>
                    • Common emotional themes in your reflections{'\n'}
                    • Times when you feel most/least balanced{'\n'}
                    • Coping strategies that work well for you{'\n'}
                    • Patterns in your emotional growth
                  </Text>
                </View>
                
                <View style={styles.timelineHint}>
                  <Text style={styles.timelineText}>
                    💡 <Text style={styles.timelineBold}>Your first insights typically appear after 5-7 entries</Text> 
                    {'\n\n'}Most meaningful patterns emerge over 2-3 weeks of natural use.
                  </Text>
                </View>
              </View>
            ) : (
              <>
                {/* Current Insight */}
            <View style={styles.currentInsightContainer}>
              <View style={[
                styles.insightCard,
                { borderColor: getInsightColor(insights[currentInsightIndex].type) }
              ]}>
                <View style={styles.insightHeader}>
                  <View style={styles.iconAndCategory}>
                    <Text style={styles.insightIcon}>
                      {getInsightIcon(insights[currentInsightIndex].type)}
                    </Text>
                    {insights[currentInsightIndex].patternCategory && (
                      <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(insights[currentInsightIndex].patternCategory!) }]}>
                        <Text style={styles.categoryText}>
                          {getCategoryEmoji(insights[currentInsightIndex].patternCategory!)} {insights[currentInsightIndex].patternCategory!.toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.headerBadges}>
                    {insights[currentInsightIndex].trendDirection && (
                      <Text style={styles.trendArrow}>
                        {insights[currentInsightIndex].trendDirection === 'improving' ? '↗️' : 
                         insights[currentInsightIndex].trendDirection === 'declining' ? '↘️' : '➡️'}
                      </Text>
                    )}
                  </View>
                </View>
                <Text style={styles.insightText}>
                  {insights[currentInsightIndex].observation}
                </Text>
                {/* Streamlined Evidence & Action Section */}
                {(insights[currentInsightIndex].successRate || insights[currentInsightIndex].actionableSuggestion) && (
                  <View style={styles.streamlinedFooter}>
                    {/* Visual Success Rate (Premium Only) */}
                    {insights[currentInsightIndex].successRate && hasPremium && (
                      <Text style={styles.visualSuccessRate}>
                        {getVisualSuccessRate(
                          insights[currentInsightIndex].successRate!, 
                          insights[currentInsightIndex].frequency || 4
                        )}
                      </Text>
                    )}
                    
                    {/* Actionable Suggestion (Premium) or Upgrade Prompt (Free) */}
                    {insights[currentInsightIndex].actionableSuggestion && (
                      <>
                        {hasPremium ? (
                          <Text style={styles.actionText}>
                            {insights[currentInsightIndex].actionableSuggestion}
                          </Text>
                        ) : (
                          <TouchableOpacity
                            style={styles.upgradePrompt}
                            onPress={() => router.push('/paywall')}
                            accessibilityRole="button"
                            accessibilityLabel="Upgrade for personalized suggestions"
                            accessibilityHint="Get actionable recommendations based on your patterns with premium"
                          >
                            <Text style={styles.upgradePromptText}>
                              🚀 Upgrade for personalized suggestions
                            </Text>
                          </TouchableOpacity>
                        )}
                      </>
                    )}
                    
                    {/* Premium Teaser Cards */}
                    {(insights[currentInsightIndex].supportingData?.isPremiumTeaser ||
                      insights[currentInsightIndex].supportingData?.isPredictionTeaser) && (
                      <TouchableOpacity
                        style={styles.premiumTeaserCard}
                        onPress={() => router.push('/paywall')}
                        accessibilityRole="button"
                        accessibilityLabel="Unlock premium insight"
                        accessibilityHint="Upgrade to premium to see this detailed insight"
                      >
                        <Text style={styles.premiumTeaserText}>
                          {insights[currentInsightIndex].actionableSuggestion}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                
                {/* Time Context Footer */}
                {insights[currentInsightIndex].timeContext && (
                  <View style={styles.contextFooter}>
                    <Text style={styles.contextText}>
                      🕐 {insights[currentInsightIndex].timeContext}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Navigation */}
            {insights.length > 1 && (
              <View style={styles.navigationContainer}>
                <View style={styles.dotIndicators}>
                  {insights.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.dot,
                        index === currentInsightIndex ? styles.activeDot : styles.inactiveDot
                      ]}
                      accessibilityLabel={`Insight ${index + 1} of ${insights.length}`}
                      accessibilityState={{ selected: index === currentInsightIndex }}
                    />
                  ))}
                </View>
                <View style={styles.navigationButtons}>
                  <TouchableOpacity
                    style={[styles.navButton, currentInsightIndex === 0 && styles.navButtonDisabled]}
                    onPress={() => setCurrentInsightIndex(Math.max(0, currentInsightIndex - 1))}
                    disabled={currentInsightIndex === 0}
                    accessibilityRole="button"
                    accessibilityLabel="Previous insight"
                    accessibilityHint="Navigate to the previous insight"
                    accessibilityState={{ disabled: currentInsightIndex === 0 }}
                  >
                    <Text style={[styles.navButtonText, currentInsightIndex === 0 && styles.navButtonTextDisabled]}>
                      Previous
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.navButton, currentInsightIndex === insights.length - 1 && styles.navButtonDisabled]}
                    onPress={() => {
                      const nextIndex = currentInsightIndex + 1;
                      if (!hasPremium && nextIndex >= FREE_TIER_LIMITS.maxInsightsPerSession) {
                        // Show paywall for premium insights
                        router.push('/paywall?trigger=mood_entries_10');
                      } else if (nextIndex < insights.length) {
                        setCurrentInsightIndex(nextIndex);
                      }
                    }}
                    disabled={currentInsightIndex === insights.length - 1}
                    accessibilityRole="button"
                    accessibilityLabel={!hasPremium && currentInsightIndex >= FREE_TIER_LIMITS.maxInsightsPerSession - 1 ? 'Unlock more insights' : 'Next insight'}
                    accessibilityHint={!hasPremium && currentInsightIndex >= FREE_TIER_LIMITS.maxInsightsPerSession - 1 ? 'Upgrade to premium to see more insights' : 'Navigate to the next insight'}
                    accessibilityState={{ disabled: currentInsightIndex === insights.length - 1 }}
                  >
                    <Text style={[styles.navButtonText, currentInsightIndex === insights.length - 1 && styles.navButtonTextDisabled]}>
                      {!hasPremium && currentInsightIndex >= FREE_TIER_LIMITS.maxInsightsPerSession - 1 ?
                        'Unlock More' : 'Next insight'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            </>
            )}
          </>
        )}

        {/* Gentle disclaimer */}
        <View style={styles.disclaimerContainer}>
          <Text style={styles.disclaimer}>
            These gentle observations are here to help you notice your own patterns, 
            not to diagnose or judge.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: typeof Colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: Spacing['8xl'],
  },
  titleContainer: {
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSize['4xl'],
    fontWeight: Typography.fontWeight.bold as any,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    color: colors.text.primary,
    letterSpacing: Typography.letterSpacing.tight,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    color: colors.text.tertiary,
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  updateStatus: {
    fontSize: Typography.fontSize.xs,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    color: colors.text.tertiary,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing['6xl'],
  },
  loadingEmoji: {
    fontSize: 48,
    marginBottom: Spacing.lg,
  },
  loadingText: {
    fontSize: Typography.fontSize.lg,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: Spacing['6xl'],
    paddingHorizontal: Layout.screenPadding,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: Spacing.lg,
  },
  errorTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.error,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  errorText: {
    fontSize: Typography.fontSize.base,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
    marginBottom: Spacing.xl,
  },
  retryButton: {
    backgroundColor: Colors.primary[600],
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.xl,
    ...Shadows.button,
  },
  retryButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold as any,
    textAlign: 'center',
  },
  disclaimerContainer: {
    marginTop: Spacing['3xl'],
    paddingHorizontal: Layout.screenPadding,
  },
  disclaimer: {
    fontSize: Typography.fontSize.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.sm,
    opacity: 0.8,
  },
  currentInsightContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  streamlinedFooter: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[100],
    gap: Spacing.md,
  },
  visualSuccessRate: {
    fontSize: Typography.fontSize.sm,
    color: Colors.success,
    fontWeight: Typography.fontWeight.medium as any,
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.sm,
  },
  actionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.sm,
    fontStyle: 'italic',
  },
  // Enhanced visual elements
  iconAndCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },
  categoryText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.text.secondary,
  },
  upgradePrompt: {
    backgroundColor: Colors.primary[50],
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  upgradePromptText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary[700],
    fontWeight: Typography.fontWeight.medium as any,
    textAlign: 'center',
  },
  premiumTeaserCard: {
    backgroundColor: Colors.primary[50],
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  trendArrow: {
    fontSize: 18,
  },
  contextFooter: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[100],
  },
  contextText: {
    fontSize: Typography.fontSize.xs,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
  premiumTeaserText: {
    color: Colors.primary[600],
    fontWeight: Typography.fontWeight.medium as any,
  },
  upgradeButton: {
    backgroundColor: Colors.primary[600],
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
    ...Shadows.button,
  },
  upgradeButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold as any,
    textAlign: 'center',
  },
  navigationContainer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  dotIndicators: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: Colors.primary[600],
  },
  inactiveDot: {
    backgroundColor: Colors.neutral[300],
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  navButton: {
    backgroundColor: Colors.primary[600],
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.xl,
    minWidth: 110,
    ...Shadows.button,
  },
  navButtonDisabled: {
    backgroundColor: Colors.neutral[200],
    ...Shadows.button,
  },
  navButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold as any,
    textAlign: 'center',
  },
  navButtonTextDisabled: {
    color: colors.text.tertiary,
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: Spacing['5xl'],
    paddingHorizontal: Layout.screenPadding,
  },
  emptyStateIcon: {
    fontSize: 52,
    marginBottom: Spacing.lg,
    textShadowColor: 'rgba(139, 92, 246, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  emptyStateTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: Typography.fontSize.base,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
    marginBottom: Spacing.xl,
  },
  patternsHintCard: {
    backgroundColor: Colors.secondary[50],
    borderRadius: BorderRadius.lg,
    padding: Layout.cardPadding,
    marginHorizontal: Layout.screenPadding,
    marginBottom: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.secondary[400],
  },
  hintTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.secondary[800],
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  hintText: {
    fontSize: Typography.fontSize.base,
    color: Colors.secondary[700],
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  timelineHint: {
    backgroundColor: Colors.primary[50],
    borderRadius: BorderRadius.lg,
    padding: Layout.cardPadding,
    marginHorizontal: Layout.screenPadding,
  },
  timelineText: {
    fontSize: Typography.fontSize.base,
    color: Colors.primary[700],
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  timelineBold: {
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.primary[800],
  },
  insightsContainer: {
    gap: 16,
  },
  insightCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing['3xl'],
    borderWidth: 2,
    ...Shadows.floating,
    marginHorizontal: Spacing.sm,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  insightIcon: {
    fontSize: 44,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  insightText: {
    fontSize: Typography.fontSize.xl,
    color: colors.text.primary,
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.xl,
    textAlign: 'center',
    fontWeight: Typography.fontWeight.medium as any,
    letterSpacing: Typography.letterSpacing.normal,
  },
  supportingData: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  tipsContainer: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#0EA5E9',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0C4A6E',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: '#0C4A6E',
    lineHeight: 20,
  },
  tierBadge: {
    backgroundColor: Colors.primary[100],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.sm,
    position: 'absolute',
    top: -Spacing.sm,
    right: -Spacing.sm,
  },
  tierText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.primary[600],
  },
  visualizationsSection: {
    marginBottom: Spacing['3xl'],
    gap: Spacing.lg,
  },
  visualizationCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.card,
  },
  visualizationTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  visualizationSubtext: {
    fontSize: Typography.fontSize.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: Spacing.md,
    fontStyle: 'italic',
  },
  fallbackContainer: {
    paddingVertical: Spacing.xl,
    gap: Spacing.lg,
  },
  fallbackHeader: {
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingHorizontal: Layout.screenPadding,
  },
  fallbackHeaderText: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold as any,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  fallbackSubtext: {
    fontSize: Typography.fontSize.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  fallbackCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginHorizontal: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    alignItems: 'center',
    ...Shadows.card,
  },
  fallbackEmoji: {
    fontSize: 40,
    marginBottom: Spacing.md,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  fallbackTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold as any,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  fallbackContent: {
    fontSize: Typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  fallbackAction: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary[600],
    textAlign: 'center',
    marginTop: Spacing.md,
    fontStyle: 'italic',
  },
});