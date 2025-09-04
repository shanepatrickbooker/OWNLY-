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
import { useFocusEffect } from 'expo-router';
import { getAllMoodEntries } from './database/database';
import { generateWeeklySummary, getAvailableWeeks, WeeklySummary } from '../../utils/weeklyAnalysis';
import { Colors, Typography, Spacing, BorderRadius, Shadows, Layout } from '../../constants/Design';
import Logo from '../../components/Logo';

const { width: screenWidth } = Dimensions.get('window');

export default function WeeklyScreen() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);

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
          <View style={styles.header}>
            <Logo size="medium" showIcon={true} horizontal={true} style={styles.logo} />
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
        <View style={styles.header}>
          <Logo size="medium" showIcon={true} horizontal={true} style={styles.logo} />
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
  header: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing['5xl'],
    paddingBottom: Spacing.xl,
  },
  logo: {
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
});