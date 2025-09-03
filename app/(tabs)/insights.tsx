import { useFocusEffect } from 'expo-router';
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

export default function InsightsScreen() {
  const [insights, setInsights] = useState<MoodInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entryCount, setEntryCount] = useState(0);
  const [currentInsightIndex, setCurrentInsightIndex] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadInsights = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const entries = await getAllMoodEntries();
      setEntryCount(entries.length);
      
      if (entries.length < 3) {
        setInsights([]);
        setLastUpdated(new Date());
        return;
      }

      const entriesWithTimestamps = entries.filter(entry => entry.created_at);
      
      // Add small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const generatedInsights = generateInsights(entriesWithTimestamps as any);
      setInsights(generatedInsights);
      setCurrentInsightIndex(0);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error loading insights:', err);
      setError('Unable to analyze your patterns right now. Please try again.');
      setInsights([]);
    } finally {
      setLoading(false);
    }
  }, []);

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadInsights} />
        }
      >
        {/* Header */}
        <Text style={styles.title}>
          {entryCount < 3 ? 'Your Patterns' : 'Your Key Pattern'}
        </Text>
        <Text style={styles.subtitle}>
          {getEntryCountMessage(entryCount)}
        </Text>

        {/* Update Status */}
        {lastUpdated && entryCount >= 3 && !loading && (
          <Text style={styles.updateStatus}>
            Updated {getTimeAgo(lastUpdated)} • Insights refresh as you add entries
          </Text>
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
            ) : insights.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateIcon}>🔍</Text>
                <Text style={styles.emptyStateTitle}>Looking for patterns</Text>
                <Text style={styles.emptyStateText}>
                  Your patterns are still emerging. Keep adding reflections to discover 
                  your unique emotional rhythms.
                </Text>
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
                  <Text style={styles.insightIcon}>
                    {getInsightIcon(insights[currentInsightIndex].type)}
                  </Text>
                </View>
                <Text style={styles.insightText}>
                  {insights[currentInsightIndex].observation}
                </Text>
                {insights[currentInsightIndex].actionableSuggestion && (
                  <View style={styles.suggestionContainer}>
                    <Text style={styles.suggestionText}>
                      💭 {insights[currentInsightIndex].actionableSuggestion}
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
                    />
                  ))}
                </View>
                <View style={styles.navigationButtons}>
                  <TouchableOpacity 
                    style={[styles.navButton, currentInsightIndex === 0 && styles.navButtonDisabled]}
                    onPress={() => setCurrentInsightIndex(Math.max(0, currentInsightIndex - 1))}
                    disabled={currentInsightIndex === 0}
                  >
                    <Text style={[styles.navButtonText, currentInsightIndex === 0 && styles.navButtonTextDisabled]}>
                      Previous
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.navButton, currentInsightIndex === insights.length - 1 && styles.navButtonDisabled]}
                    onPress={() => setCurrentInsightIndex(Math.min(insights.length - 1, currentInsightIndex + 1))}
                    disabled={currentInsightIndex === insights.length - 1}
                  >
                    <Text style={[styles.navButtonText, currentInsightIndex === insights.length - 1 && styles.navButtonTextDisabled]}>
                      Next insight
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9ff',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    color: '#6B7280',
  },
  updateStatus: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 24,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  disclaimerContainer: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  disclaimer: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  currentInsightContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  suggestionContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  suggestionText: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    fontStyle: 'italic',
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
    backgroundColor: '#6366F1',
  },
  inactiveDot: {
    backgroundColor: '#D1D5DB',
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  navButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    minWidth: 100,
  },
  navButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  navButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  navButtonTextDisabled: {
    color: '#9CA3AF',
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  insightsContainer: {
    gap: 16,
  },
  insightCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 30,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginHorizontal: 10,
  },
  insightHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  insightIcon: {
    fontSize: 40,
  },
  insightText: {
    fontSize: 20,
    color: '#1f2937',
    lineHeight: 28,
    textAlign: 'center',
    fontWeight: '500',
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
});