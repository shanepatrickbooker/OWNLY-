import { router, useFocusEffect } from 'expo-router';
import React, { useState, useCallback, useEffect } from 'react';
import { Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert, TextInput, InteractionManager } from 'react-native';
import { saveMoodEntry, getAllMoodEntries, getMoodEntryCount } from './database/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateEngagement } from '../../utils/engagementRecognition';
import { conversionService } from '../../services/conversionService';
import { Colors, Typography, Spacing, BorderRadius, Shadows, Layout, getColors } from '../../constants/Design';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useTheme } from '../../contexts/ThemeContext';
import { generateInsights } from '../../utils/sentimentAnalysis';
import { EnhancedPatternDetector } from '../../utils/enhancedPatternDetector';
import HeaderLogo from '../../components/HeaderLogo';

// Mood options matching your mockup
const MOODS = [
  { emoji: '😡', label: 'Angry', value: 1 },
  { emoji: '😤', label: 'Frustrated', value: 2 },  
  { emoji: '😔', label: 'Sad', value: 2 },
  { emoji: '😐', label: 'Neutral', value: 3 },
  { emoji: '😊', label: 'Content', value: 4 },
  { emoji: '😄', label: 'Happy', value: 5 },
  { emoji: '🤩', label: 'Joyful', value: 5 },
  { emoji: '😲', label: 'Surprised', value: 3 },
  { emoji: '😟', label: 'Worried', value: 2 },
  { emoji: '😰', label: 'Anxious', value: 2 }
];

export default function HomeScreen() {
  const { hasPremium } = useSubscription();
  const { isDark } = useTheme();
  
  // Get theme-appropriate colors
  const colors = getColors(isDark);
  const [selectedMoodIndex, setSelectedMoodIndex] = useState<number | null>(null);
  const [savedEntries, setSavedEntries] = useState<any[]>([]);
  const [engagementData, setEngagementData] = useState<any>(null);
  const [patternTeaser, setPatternTeaser] = useState<any>(null);
  const [patternContext, setPatternContext] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReflection, setShowReflection] = useState(false);
  const [reflection, setReflection] = useState('');

  // Check onboarding status on component mount
  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const onboardingCompleted = await AsyncStorage.getItem('onboarding_completed');
      if (onboardingCompleted !== 'true') {
        // Navigate to onboarding if not completed
        router.replace('/onboarding/welcome');
      }
    } catch (error) {
      if (__DEV__) console.error('Error checking onboarding status:', error);
      // If there's an error, default to showing onboarding
      router.replace('/onboarding/welcome');
    }
  };

  const loadSavedEntries = useCallback(async () => {
    try {
      const entries = await getAllMoodEntries();
      setSavedEntries(entries);
      
      // Calculate engagement data
      const entriesWithTimestamps = entries.filter(entry => entry.created_at);
      const engagement = calculateEngagement(entriesWithTimestamps as any);
      setEngagementData(engagement);
      
      // Generate pattern teaser if we have enough entries (deferred for performance)
      if (entries.length >= 5) {
        InteractionManager.runAfterInteractions(() => {
          const insights = generateInsights(entries, hasPremium);
          const patternDetector = new EnhancedPatternDetector(entries);
          const patterns = patternDetector.getPersonalPatterns();
          
          if (insights.length > 0 || patterns.length > 0) {
            const patternCount = hasPremium ? patterns.length : Math.min(patterns.length, 1);
            const topInsight = insights[0] || {
              category: 'pattern',
              insight: patterns[0]?.pattern || 'Pattern detected in your data',
              confidence: patterns[0]?.confidence || 0.8
            };
            
            setPatternTeaser({
              count: patternCount,
              insight: topInsight,
              hasMore: patterns.length > (hasPremium ? 0 : 1)
            });
          }
        });
      }
    } catch (error) {
      if (__DEV__) console.error('Error loading saved entries:', error);
    }
  }, [hasPremium]);

  useFocusEffect(useCallback(() => {
    loadSavedEntries();
    // Clear any selected mood state when returning to the screen
    setSelectedMoodIndex(null);
    setJustSaved(false);
    setShowReflection(false);
    setReflection('');
    setPatternContext(null);
  }, [loadSavedEntries]));

  const generatePatternContext = async (moodLabel: string, moodValue: number): Promise<string | null> => {
    if (savedEntries.length < 5) return null;
    
    return new Promise((resolve) => {
      // Defer pattern processing to avoid blocking UI interactions
      InteractionManager.runAfterInteractions(() => {
        try {
          const patternDetector = new EnhancedPatternDetector(savedEntries);
          const patterns = patternDetector.getPersonalPatterns();
          const currentHour = new Date().getHours();
          
          // Check for mood-specific patterns
          const similarMoodEntries = savedEntries.filter(entry => 
            entry.mood_label === moodLabel || Math.abs(entry.mood_value - moodValue) <= 0.5
          );
          
          // Time-based context
          let timeContext = '';
          if (currentHour >= 17 && currentHour <= 21) {
            const workStressEntries = savedEntries.filter(entry => 
              entry.reflection?.toLowerCase().includes('work') || 
              entry.reflection?.toLowerCase().includes('job') ||
              entry.reflection?.toLowerCase().includes('meeting')
            );
            if (workStressEntries.length >= 2) {
              timeContext = 'Work stress detected in your patterns';
            }
          } else if (currentHour >= 6 && currentHour <= 10) {
            timeContext = 'Morning check-ins often set the tone for your day';
          }
          
          // Activity-based suggestions from patterns
          const improvementPatterns = patterns.filter(p => p.type === 'improvement');
          if (improvementPatterns.length > 0) {
            const topPattern = improvementPatterns[0];
            if (moodValue <= 2.5) {
              // For difficult moods, suggest what has helped before
              resolve(`💡 ${topPattern.actionableInsight}`);
              return;
            }
          }
          
          // Trigger patterns for difficult moods
          if (moodValue <= 2.5) {
            const triggerPatterns = patterns.filter(p => p.type === 'trigger');
            if (triggerPatterns.length > 0 && similarMoodEntries.length >= 2) {
              resolve(`🔍 You've felt ${moodLabel.toLowerCase()} ${similarMoodEntries.length} times before - patterns can help`);
              return;
            }
          }
          
          // Positive reinforcement for good moods
          if (moodValue >= 4) {
            if (similarMoodEntries.length >= 3) {
              resolve(`✨ Great choice! You've felt ${moodLabel.toLowerCase()} ${similarMoodEntries.length} times - what's working?`);
              return;
            }
          }
          
          // Default time context if no specific patterns
          if (timeContext) {
            resolve(`⏰ ${timeContext}`);
            return;
          }
          
          resolve(null);
        } catch (error) {
          if (__DEV__) console.error('Error generating pattern context:', error);
          resolve(null);
        }
      });
    });
  };

  const handleMoodSelect = async (index: number, moodLabel: string, moodValue: number) => {
    setSelectedMoodIndex(index);
    setJustSaved(true); // Show the options UI immediately
    
    // Generate contextual pattern hint
    if (savedEntries.length >= 5) {
      const context = await generatePatternContext(moodLabel, moodValue);
      setPatternContext(context);
    }
  };

  const handleTellUsMore = () => {
    setShowReflection(true);
  };

  const handleNewCheckIn = async () => {
    if (selectedMoodIndex === null) return;
    
    setIsSubmitting(true);
    
    try {
      const selectedMood = MOODS[selectedMoodIndex];
      
      // Save the mood entry (with optional reflection)
      await saveMoodEntry({
        mood_value: selectedMood.value,
        mood_label: selectedMood.label,
        reflection: reflection.trim(), // Include reflection text if provided
        timestamp: new Date().toISOString()
      });
      
      
      // Show alert notification
      const hasReflection = reflection.trim().length > 0;
      Alert.alert(
        hasReflection ? 'Reflection Saved' : 'Check-in Saved',
        `Your ${hasReflection ? 'reflection has' : 'mood has'} been saved privately on your device.`,
        [{ 
          text: 'OK', 
          style: 'default',
          onPress: () => {
            // Clear all state after alert is dismissed
            setSelectedMoodIndex(null);
            setJustSaved(false);
            setShowReflection(false);
            setReflection('');
            setPatternContext(null);
          }
        }]
      );
      
      // Track for conversion triggers
      await conversionService.trackMoodEntry();
      
      // Refresh entries display
      await loadSavedEntries();
      
    } catch (error) {
      if (__DEV__) console.error('Error saving mood entry:', error);
    } finally {
      setIsSubmitting(false);
    }
  };


  // Create theme-aware styles
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <HeaderLogo />
        
        {/* Engagement Recognition */}
        {engagementData && engagementData.showMessage && (
          <View style={styles.engagementContainer}>
            <Text style={styles.engagementText}>
              {engagementData.message}
            </Text>
          </View>
        )}
        
        {/* Pattern Teaser */}
        {patternTeaser && (
          <TouchableOpacity
            style={styles.patternTeaserContainer}
            onPress={() => router.push('/insights')}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`View ${patternTeaser.count} pattern insight${patternTeaser.count !== 1 ? 's' : ''}`}
            accessibilityHint="Tap to see detailed pattern analysis and emotional insights"
          >
            <View style={styles.patternTeaserContent}>
              <View style={styles.patternTeaserHeader}>
                <Text style={styles.patternTeaserIcon}>🧠</Text>
                <View style={styles.patternTeaserTextContainer}>
                  <Text style={styles.patternTeaserTitle}>
                    OWNLY found {patternTeaser.count} pattern{patternTeaser.count !== 1 ? 's' : ''}
                  </Text>
                  <Text style={styles.patternTeaserSubtitle} numberOfLines={2}>
                    {patternTeaser.insight.insight}
                  </Text>
                </View>
              </View>
              <View style={styles.patternTeaserFooter}>
                <Text style={styles.patternTeaserCta}>View Insights</Text>
                <Text style={styles.patternTeaserArrow}>›</Text>
              </View>
            </View>
            {!hasPremium && patternTeaser.hasMore && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>Premium</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        
        {/* Main Question */}
        <Text style={styles.question}>Check In</Text>
        <Text style={styles.stepInstruction}>Tap an emoji below that matches your mood</Text>
        
        {/* Mood Grid - 3x4 layout like your mockup */}
        <View style={styles.moodGrid}>
          {MOODS.map((mood, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.moodButton,
                selectedMoodIndex === index && styles.selectedMood
              ]}
              onPress={() => handleMoodSelect(index, mood.label, mood.value)}
              accessibilityRole="button"
              accessibilityLabel={`Select ${mood.label} mood`}
              accessibilityHint={`Tap to select ${mood.label} mood with emoji ${mood.emoji}`}
              accessibilityState={{ selected: selectedMoodIndex === index }}
            >
              <Text style={styles.moodEmoji}>{mood.emoji}</Text>
              <Text style={styles.moodLabel}>{mood.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Success State & Options */}
        {justSaved && selectedMoodIndex !== null && (
          <View style={styles.successContainer}>
            <Text style={styles.successMessage}>
              {MOODS[selectedMoodIndex].emoji} Feeling {MOODS[selectedMoodIndex].label.toLowerCase()}
            </Text>
            
            {/* Pattern Context */}
            {patternContext && (
              <View style={styles.patternContextContainer}>
                <Text style={styles.patternContextText}>{patternContext}</Text>
              </View>
            )}
            
            {!showReflection ? (
              <View style={styles.optionsContainer}>
                <TouchableOpacity 
                  style={styles.tellUsMoreButton} 
                  onPress={handleTellUsMore}
                  accessibilityRole="button"
                  accessibilityLabel="Tell us more"
                  accessibilityHint="Tap to add a reflection about your mood"
                >
                  <Text style={styles.tellUsMoreButtonText}>Tell us more?</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.doneButton} 
                  onPress={handleNewCheckIn}
                  accessibilityRole="button"
                  accessibilityLabel="Done"
                  accessibilityHint="Tap to save your mood check-in"
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.reflectionContainer}>
                <Text style={styles.reflectionLabel}>Add details about how you're feeling (optional)</Text>
                <TextInput
                  style={styles.reflectionInput}
                  value={reflection}
                  onChangeText={setReflection}
                  placeholder="What's on your mind? This is your private space to reflect..."
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  accessibilityLabel="Reflection text field"
                  accessibilityHint="Write about your feelings and thoughts"
                />
                <View style={styles.reflectionButtons}>
                  <TouchableOpacity 
                    style={styles.skipButton} 
                    onPress={handleNewCheckIn}
                    accessibilityRole="button"
                    accessibilityLabel="Skip reflection"
                    accessibilityHint="Skip writing a reflection and save your mood"
                  >
                    <Text style={styles.skipButtonText}>Skip</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.saveButton} 
                    onPress={handleNewCheckIn}
                    accessibilityRole="button"
                    accessibilityLabel="Save mood entry"
                    accessibilityHint="Save your mood and reflection"
                  >
                    <Text style={styles.saveButtonText}>Save Check-In</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
        
        {/* Loading State */}
        {isSubmitting && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Saving...</Text>
          </View>
        )}
        
        {/* Show Saved Entries or Empty State */}
        {savedEntries.length > 0 ? (
          <View style={styles.entriesContainer}>
            <Text style={styles.entriesTitle}>Recent Entries ({savedEntries.length}):</Text>
            {savedEntries.slice(0, 3).map((entry, index) => (
              <View key={entry.id} style={styles.entryItem}>
                <Text style={styles.entryText}>
                  {entry.mood_label} ({entry.mood_value}) - {entry.reflection || 'No reflection'}
                </Text>
                <Text style={styles.entryTimestamp}>
                  {new Date(entry.created_at).toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateEmoji}>📝</Text>
            <Text style={styles.emptyStateTitle}>Start Your Journey</Text>
            <Text style={styles.emptyStateMessage}>
              Select how you're feeling today to begin tracking your emotional patterns and insights.
            </Text>
          </View>
        )}
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
  engagementContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.base,
    backgroundColor: Colors.primary[50],
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.sm,
    ...Shadows.card,
  },
  engagementText: {
    fontSize: Typography.fontSize.base,
    color: Colors.primary[700],
    fontWeight: Typography.fontWeight.medium as any,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  question: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.semibold as any,
    textAlign: 'left',
    marginBottom: Spacing.sm,
    color: colors.text.primary,
    letterSpacing: Typography.letterSpacing.tight,
  },
  stepInstruction: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium as any,
    textAlign: 'left',
    marginBottom: Spacing['3xl'],
    color: colors.text.tertiary,
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.base,
    marginHorizontal: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  moodButton: {
    width: 108,
    height: 108,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.xl,
    backgroundColor: colors.background.secondary,
    margin: Spacing.xs,
    borderWidth: 2,
    borderColor: Colors.neutral[100],
    ...Shadows.button,
    transform: [{ scale: 1 }],
  },
  selectedMood: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[400],
    ...Shadows.brand,
    transform: [{ scale: 0.98 }],
  },
  moodEmoji: {
    fontSize: 36,
    marginBottom: Spacing.sm,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  moodLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium as any,
    color: Colors.text.secondary,
    textAlign: 'center',
    letterSpacing: Typography.letterSpacing.wide,
  },
  successContainer: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.success[50],
    borderRadius: BorderRadius.xl,
    marginHorizontal: Spacing.base,
    ...Shadows.card,
  },
  successMessage: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  patternContextContainer: {
    backgroundColor: Colors.primary[100],
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    marginHorizontal: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary[400],
  },
  patternContextText: {
    fontSize: Typography.fontSize.base,
    color: Colors.primary[700],
    fontWeight: Typography.fontWeight.medium as any,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  tellUsMoreButton: {
    backgroundColor: Colors.primary[600],
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    minWidth: 120,
    ...Shadows.button,
  },
  tellUsMoreButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold as any,
    textAlign: 'center',
  },
  reflectionContainer: {
    width: '100%',
    alignItems: 'center',
  },
  reflectionLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium as any,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  reflectionInput: {
    width: '100%',
    backgroundColor: colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    fontSize: Typography.fontSize.base,
    color: colors.text.primary,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    marginBottom: Spacing.lg,
  },
  reflectionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'center',
  },
  skipButton: {
    backgroundColor: Colors.neutral[300],
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    minWidth: 80,
    ...Shadows.button,
  },
  skipButtonText: {
    color: colors.text.primary,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold as any,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: Colors.primary[600],
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    minWidth: 100,
    ...Shadows.button,
  },
  saveButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold as any,
    textAlign: 'center',
  },
  doneButton: {
    backgroundColor: Colors.neutral[200],
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    minWidth: 80,
    ...Shadows.button,
  },
  doneButtonText: {
    color: colors.text.primary,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold as any,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  loadingText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium as any,
    color: Colors.text.secondary,
  },
  entriesContainer: {
    marginTop: Spacing['3xl'],
    padding: Layout.cardPadding,
    backgroundColor: colors.background.secondary,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.sm,
    ...Shadows.card,
  },
  entriesTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginBottom: Spacing.md,
  },
  entryItem: {
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  entryText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.sm,
  },
  entryTimestamp: {
    fontSize: Typography.fontSize.xs,
    color: colors.text.tertiary,
  },
  emptyStateContainer: {
    alignItems: 'center',
    marginTop: Spacing['3xl'],
    paddingVertical: Spacing['2xl'],
    paddingHorizontal: Spacing.lg,
    backgroundColor: colors.background.secondary,
    borderRadius: BorderRadius.xl,
    marginHorizontal: Spacing.sm,
  },
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: Spacing.lg,
  },
  emptyStateTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  emptyStateMessage: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
    maxWidth: 280,
  },
  patternTeaserContainer: {
    backgroundColor: Colors.primary[50],
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary[400],
    ...Shadows.card,
    position: 'relative',
  },
  patternTeaserContent: {
    flex: 1,
  },
  patternTeaserHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  patternTeaserIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
    marginTop: 2,
  },
  patternTeaserTextContainer: {
    flex: 1,
  },
  patternTeaserTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.primary[700],
    marginBottom: Spacing.xs,
    lineHeight: Typography.lineHeight.tight * Typography.fontSize.lg,
  },
  patternTeaserSubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.primary[600],
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  patternTeaserFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  patternTeaserCta: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium as any,
    color: Colors.primary[600],
  },
  patternTeaserArrow: {
    fontSize: Typography.fontSize.xl,
    color: Colors.primary[500],
    fontWeight: Typography.fontWeight.bold as any,
  },
  premiumBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
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
    letterSpacing: Typography.letterSpacing.wide,
  },
});
