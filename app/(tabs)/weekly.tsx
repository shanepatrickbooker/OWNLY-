import React, { useState, useCallback, useMemo } from 'react';
import { 
  SafeAreaView, 
  ScrollView, 
  StyleSheet, 
  Text, 
  View, 
  RefreshControl,
  TouchableOpacity,
  Alert,
  Dimensions
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { getAllMoodEntries } from './database/database';
import { generateWeeklySummary, getAvailableWeeks, WeeklySummary } from '../../utils/weeklyAnalysis';
import { EnhancedPatternDetector } from '../../utils/enhancedPatternDetector';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows, Layout } from '../../constants/Design';
import HeaderLogo from '../../components/HeaderLogo';

const { width: screenWidth } = Dimensions.get('window');

export default function WeeklyScreen() {
  const { hasPremium } = useSubscription();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [weeklyPatterns, setWeeklyPatterns] = useState<any[]>([]);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const allEntries = await getAllMoodEntries();
      setEntries(allEntries);
    } catch (error) {
      console.error('Error loading entries:', error);
      Alert.alert('Error', 'Unable to load your data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadEntries();
  }, [loadEntries]));

  const availableWeeks = useMemo(() => getAvailableWeeks(entries), [entries]);
  
  const weeklySummary = useMemo(() => {
    if (availableWeeks.length === 0) return null;
    const selectedWeekStart = availableWeeks[selectedWeekIndex];
    return generateWeeklySummary(entries, selectedWeekStart);
  }, [entries, availableWeeks, selectedWeekIndex]);

  // Generate weekly patterns using Enhanced Pattern Detection
  const generateWeeklyPatterns = useCallback(() => {
    if (entries.length < 3 || !weeklySummary) return [];
    
    try {
      // Filter entries for the selected week
      const weekEnd = new Date(weeklySummary.weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      
      const weekEntries = entries.filter(entry => {
        const entryDate = new Date(entry.created_at || entry.timestamp);
        return entryDate >= weeklySummary.weekStart && entryDate < weekEnd;
      });
      
      if (weekEntries.length < 2) return [];
      
      // Use Enhanced Pattern Detector on all entries for context
      const patternDetector = new EnhancedPatternDetector(entries);
      const allPatterns = patternDetector.getPersonalPatterns();
      
      // Filter patterns relevant to this week
      const weeklyRelevantPatterns = allPatterns.filter(pattern => {
        // Include patterns that show up in this week's data
        if (pattern.type === 'cycle') {
          // Day-based cycles are always relevant
          return true;
        }
        
        if (pattern.type === 'improvement' || pattern.type === 'trigger') {
          // Check if pattern keywords appear in this week's reflections
          const weekReflections = weekEntries
            .map(e => e.reflection?.toLowerCase() || '')
            .join(' ');
          
          return pattern.examples.some(example => 
            weekReflections.includes(example.toLowerCase().substring(0, 20))
          );
        }
        
        return pattern.confidence >= 0.7; // High confidence patterns
      });
      
      // Generate week-specific insights
      const weekSpecificInsights = [];
      
      // Weekly mood trend
      if (weekEntries.length >= 3) {
        const firstHalf = weekEntries.slice(0, Math.ceil(weekEntries.length / 2));
        const secondHalf = weekEntries.slice(Math.floor(weekEntries.length / 2));
        
        const firstHalfAvg = firstHalf.reduce((sum, e) => sum + e.mood_value, 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((sum, e) => sum + e.mood_value, 0) / secondHalf.length;
        
        if (secondHalfAvg > firstHalfAvg + 0.5) {
          weekSpecificInsights.push({
            type: 'trend',
            pattern: 'Your mood improved throughout the week',
            insight: 'You showed resilience and growth during this week',
            confidence: 0.8
          });
        } else if (firstHalfAvg > secondHalfAvg + 0.5) {
          weekSpecificInsights.push({
            type: 'trend',
            pattern: 'You started strong but faced challenges later',
            insight: 'Consider what changed mid-week and how to maintain early momentum',
            confidence: 0.8
          });
        }
      }
      
      // Combine patterns for display
      return [...weeklyRelevantPatterns.slice(0, 2), ...weekSpecificInsights];
      
    } catch (error) {
      console.error('Error generating weekly patterns:', error);
      return [];
    }
  }, [entries, weeklySummary]);

  // Update patterns when selection changes
  useFocusEffect(useCallback(() => {
    const patterns = generateWeeklyPatterns();
    setWeeklyPatterns(patterns);
  }, [generateWeeklyPatterns]));

  const renderMoodDistributionChart = (summary: WeeklySummary) => {
    if (summary.totalEntries === 0) return null;

    const maxCount = Math.max(...summary.moodDistribution.map(m => m.count));

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>Your Week Included</Text>
        <Text style={styles.sectionSubtitle}>
          A natural variety of {summary.totalEntries} emotional experience{summary.totalEntries !== 1 ? 's' : ''}
        </Text>
        
        {summary.moodDistribution.map((mood, index) => (
          <View key={mood.moodLabel} style={styles.moodBar}>
            <View style={styles.moodInfo}>
              <Text style={styles.moodEmoji}>{mood.emoji}</Text>
              <Text style={styles.moodLabel}>{mood.moodLabel}</Text>
            </View>
            <View style={styles.barContainer}>
              <View 
                style={[
                  styles.bar,
                  { 
                    width: `${(mood.count / maxCount) * 100}%`,
                    backgroundColor: index === 0 ? Colors.primary[400] : 
                                   index === 1 ? Colors.secondary[400] :
                                   index === 2 ? Colors.accent[400] :
                                   Colors.neutral[400]
                  }
                ]}
              />
              <Text style={styles.moodCount}>{mood.count} time{mood.count !== 1 ? 's' : ''}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderReflectionInsights = (summary: WeeklySummary) => {
    const { reflectionInsights } = summary;
    
    return (
      <View style={styles.insightsContainer}>
        <Text style={styles.sectionTitle}>Reflection Patterns</Text>
        
        <View style={styles.insightCard}>
          <Text style={styles.insightText}>
            You wrote reflections on {reflectionInsights.daysWithReflections} out of 7 days this week
          </Text>
          {reflectionInsights.averageReflectionLength > 0 && (
            <Text style={styles.insightSubtext}>
              Average reflection length: {reflectionInsights.averageReflectionLength} words
            </Text>
          )}
        </View>

        {reflectionInsights.commonWords.length > 0 && (
          <View style={styles.insightCard}>
            <Text style={styles.insightText}>Themes in your reflections:</Text>
            <View style={styles.wordsContainer}>
              {reflectionInsights.commonWords.slice(0, 3).map((wordData, index) => (
                <View key={wordData.word} style={styles.wordChip}>
                  <Text style={styles.wordText}>{wordData.word}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.insightSubtext}>
              These recurring themes show what was important to you this week
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderTemporalPatterns = (summary: WeeklySummary) => {
    const { temporalPatterns } = summary;
    
    if (temporalPatterns.timeOfDayPattern.length === 0) return null;

    return (
      <View style={styles.patternsContainer}>
        <Text style={styles.sectionTitle}>When You Checked In</Text>
        
        <View style={styles.patternCard}>
          <Text style={styles.patternTitle}>Time of Day</Text>
          <View style={styles.timePatterns}>
            {temporalPatterns.timeOfDayPattern.map(({ period, count }) => (
              <View key={period} style={styles.timeSlot}>
                <Text style={styles.timePeriod}>
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </Text>
                <Text style={styles.timeCount}>{count}</Text>
              </View>
            ))}
          </View>
        </View>

        {temporalPatterns.weekendVsWeekdayMessage && (
          <View style={styles.patternCard}>
            <Text style={styles.patternObservation}>
              {temporalPatterns.weekendVsWeekdayMessage}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderEnhancedPatterns = () => {
    if (weeklyPatterns.length === 0) return null;
    
    const displayPatterns = hasPremium ? weeklyPatterns : weeklyPatterns.slice(0, 1);
    const hasMorePatterns = weeklyPatterns.length > 1 && !hasPremium;

    return (
      <View style={styles.enhancedPatternsContainer}>
        <View style={styles.enhancedPatternHeader}>
          <Text style={styles.sectionTitle}>🧠 Enhanced Pattern Detection</Text>
          {!hasPremium && (
            <TouchableOpacity 
              style={styles.premiumBadge}
              onPress={() => router.push('/paywall?trigger=weekly_patterns')}
            >
              <Text style={styles.premiumBadgeText}>Premium</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <Text style={styles.enhancedPatternSubtitle}>
          AI-powered insights from your emotional patterns
        </Text>

        {displayPatterns.map((pattern, index) => (
          <View key={index} style={styles.enhancedPatternCard}>
            <View style={styles.patternTypeContainer}>
              <Text style={styles.patternTypeEmoji}>
                {pattern.type === 'improvement' ? '✨' : 
                 pattern.type === 'cycle' ? '🔄' :
                 pattern.type === 'trend' ? '📈' :
                 pattern.type === 'trigger' ? '🔍' : '💡'}
              </Text>
              <Text style={styles.patternTypeName}>
                {pattern.type.toUpperCase()}
              </Text>
              {pattern.confidence && (
                <Text style={styles.patternConfidence}>
                  {Math.round(pattern.confidence * 100)}% confidence
                </Text>
              )}
            </View>
            
            <Text style={styles.patternText}>{pattern.pattern}</Text>
            <Text style={styles.patternInsight}>
              {pattern.insight || pattern.actionableInsight}
            </Text>
            
            {pattern.frequency && (
              <Text style={styles.patternFrequency}>
                Based on {pattern.frequency} observations
              </Text>
            )}
          </View>
        ))}

        {hasMorePatterns && (
          <TouchableOpacity 
            style={styles.upgradePatternCard}
            onPress={() => router.push('/paywall?trigger=weekly_patterns')}
          >
            <Text style={styles.upgradePatternTitle}>
              🔓 {weeklyPatterns.length - 1} more pattern{weeklyPatterns.length > 2 ? 's' : ''} detected
            </Text>
            <Text style={styles.upgradePatternText}>
              Unlock all weekly pattern insights with Premium
            </Text>
            <Text style={styles.upgradePatternCta}>Tap to upgrade →</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderWeekSelector = () => {
    if (availableWeeks.length <= 1) return null;

    return (
      <View style={styles.weekSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {availableWeeks.map((week, index) => {
            const summary = generateWeeklySummary(entries, week);
            return (
              <TouchableOpacity
                key={week.toISOString()}
                style={[
                  styles.weekButton,
                  selectedWeekIndex === index && styles.weekButtonActive
                ]}
                onPress={() => setSelectedWeekIndex(index)}
              >
                <Text style={[
                  styles.weekButtonText,
                  selectedWeekIndex === index && styles.weekButtonTextActive
                ]}>
                  {summary.weekLabel}
                </Text>
                <Text style={[
                  styles.weekButtonSubtext,
                  selectedWeekIndex === index && styles.weekButtonSubtextActive
                ]}>
                  {summary.totalEntries} check-in{summary.totalEntries !== 1 ? 's' : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📊</Text>
      <Text style={styles.emptyTitle}>No Weekly Patterns Yet</Text>
      <Text style={styles.emptyText}>
        Start tracking your moods to see weekly patterns. Your emotional awareness 
        journey will create beautiful insights over time.
      </Text>
    </View>
  );

  if (!weeklySummary) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadEntries} />}
        >
          <HeaderLogo />
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Weekly Patterns</Text>
            <Text style={styles.subtitle}>Understanding your emotional rhythms</Text>
          </View>
          
          {renderEmptyState()}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadEntries} />}
      >
        <HeaderLogo />
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Weekly Patterns</Text>
          <Text style={styles.subtitle}>Understanding your emotional rhythms</Text>
        </View>

        {renderWeekSelector()}

        {/* Supportive Message */}
        <View style={styles.messageContainer}>
          <Text style={styles.supportiveMessage}>{weeklySummary.supportiveMessage}</Text>
        </View>

        {renderMoodDistributionChart(weeklySummary)}
        {renderReflectionInsights(weeklySummary)}
        {renderTemporalPatterns(weeklySummary)}
        {renderEnhancedPatterns()}

        {/* Disclaimer */}
        <View style={styles.disclaimerContainer}>
          <Text style={styles.disclaimer}>
            These patterns are for self-awareness, not self-judgment. Emotional variety 
            throughout the week is completely normal and healthy.
          </Text>
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
  scrollContent: {
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
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
    letterSpacing: Typography.letterSpacing.tight,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.tertiary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  weekSelector: {
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.xl,
  },
  weekButton: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.xs,
    minWidth: 120,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  weekButtonActive: {
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[300],
  },
  weekButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  weekButtonTextActive: {
    color: Colors.primary[700],
  },
  weekButtonSubtext: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
  },
  weekButtonSubtextActive: {
    color: Colors.primary[600],
  },
  messageContainer: {
    backgroundColor: Colors.secondary[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginHorizontal: Layout.screenPadding,
    marginBottom: Spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: Colors.secondary[400],
  },
  supportiveMessage: {
    fontSize: Typography.fontSize.base,
    color: Colors.secondary[800],
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  chartContainer: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Layout.cardPadding,
    marginHorizontal: Layout.screenPadding,
    marginBottom: Spacing.xl,
    ...Shadows.card,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    marginBottom: Spacing.lg,
    fontStyle: 'italic',
  },
  moodBar: {
    marginBottom: Spacing.md,
  },
  moodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  moodEmoji: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  moodLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium as any,
    color: Colors.text.primary,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 28,
  },
  bar: {
    height: 20,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
    minWidth: 40,
  },
  moodCount: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.medium as any,
  },
  insightsContainer: {
    marginHorizontal: Layout.screenPadding,
    marginBottom: Spacing.xl,
  },
  insightCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Layout.cardPadding,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  insightText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
    marginBottom: Spacing.xs,
  },
  insightSubtext: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.sm,
    fontStyle: 'italic',
  },
  wordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: Spacing.sm,
  },
  wordChip: {
    backgroundColor: Colors.primary[100],
    borderRadius: BorderRadius.base,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginRight: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  wordText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary[700],
    fontWeight: Typography.fontWeight.medium as any,
  },
  patternsContainer: {
    marginHorizontal: Layout.screenPadding,
    marginBottom: Spacing.xl,
  },
  patternCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Layout.cardPadding,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  patternTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.medium as any,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  timePatterns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeSlot: {
    alignItems: 'center',
    flex: 1,
  },
  timePeriod: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  timeCount: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.primary[600],
  },
  patternObservation: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing['6xl'],
    paddingHorizontal: Layout.screenPadding,
  },
  emptyIcon: {
    fontSize: 52,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.tertiary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  disclaimerContainer: {
    paddingHorizontal: Layout.screenPadding,
    marginTop: Spacing.xl,
  },
  disclaimer: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.sm,
    opacity: 0.8,
  },
  enhancedPatternsContainer: {
    marginHorizontal: Layout.screenPadding,
    marginBottom: Spacing.xl,
  },
  enhancedPatternHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  premiumBadge: {
    backgroundColor: Colors.secondary[500],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.sm,
  },
  premiumBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold as any,
    color: 'white',
    textTransform: 'uppercase',
  },
  enhancedPatternSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    marginBottom: Spacing.lg,
    fontStyle: 'italic',
  },
  enhancedPatternCard: {
    backgroundColor: Colors.primary[50],
    borderRadius: BorderRadius.lg,
    padding: Layout.cardPadding,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary[400],
    ...Shadows.card,
  },
  patternTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  patternTypeEmoji: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  patternTypeName: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.primary[600],
    backgroundColor: Colors.primary[100],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.md,
  },
  patternConfidence: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    fontWeight: Typography.fontWeight.medium as any,
  },
  patternText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.primary[700],
    marginBottom: Spacing.sm,
    lineHeight: Typography.lineHeight.tight * Typography.fontSize.base,
  },
  patternInsight: {
    fontSize: Typography.fontSize.base,
    color: Colors.primary[600],
    marginBottom: Spacing.sm,
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  patternFrequency: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    fontStyle: 'italic',
  },
  upgradePatternCard: {
    backgroundColor: Colors.secondary[50],
    borderRadius: BorderRadius.lg,
    padding: Layout.cardPadding,
    borderWidth: 2,
    borderColor: Colors.secondary[200],
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  upgradePatternTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.secondary[700],
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  upgradePatternText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.secondary[600],
    textAlign: 'center',
    marginBottom: Spacing.sm,
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.sm,
  },
  upgradePatternCta: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium as any,
    color: Colors.secondary[600],
    textAlign: 'center',
  },
});