import { router, useFocusEffect } from 'expo-router';
import React, { useState, useCallback, useEffect } from 'react';
import { Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert, TextInput } from 'react-native';
import { saveMoodEntry, getAllMoodEntries, getMoodEntryCount } from './database/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateTestData, getTestDataStats } from '../../utils/testDataGenerator';
import { calculateEngagement } from '../../utils/engagementRecognition';
import { conversionService } from '../../services/conversionService';
import { Colors, Typography, Spacing, BorderRadius, Shadows, Layout } from '../../constants/Design';
import Logo from '../../components/Logo';

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
  const [selectedMoodIndex, setSelectedMoodIndex] = useState<number | null>(null);
  const [savedEntries, setSavedEntries] = useState<any[]>([]);
  const [engagementData, setEngagementData] = useState<any>(null);
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
    } catch (error) {
      if (__DEV__) console.error('Error loading saved entries:', error);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadSavedEntries();
    // Clear any selected mood state when returning to the screen
    setSelectedMoodIndex(null);
    setJustSaved(false);
    setShowReflection(false);
    setReflection('');
  }, [loadSavedEntries]));

  const handleMoodSelect = (index: number, moodLabel: string, moodValue: number) => {
    setSelectedMoodIndex(index);
    setJustSaved(true); // Show the options UI immediately
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

  const testDatabase = async () => {
    try {
      if (__DEV__) console.log('🧪 Testing database functionality...');
      
      // Test saving a mood entry
      const testEntry = {
        mood_value: 5,
        mood_label: 'Happy',
        reflection: 'Testing database functionality with a happy mood!',
        timestamp: new Date().toISOString()
      };
      
      const savedId = await saveMoodEntry(testEntry);
      if (__DEV__) console.log('✅ Test entry saved with ID:', savedId);
      
      // Refresh the entries display
      await loadSavedEntries();
      
      // Get count
      const count = await getMoodEntryCount();
      if (__DEV__) console.log('📈 Total entries:', count);
      
    } catch (error) {
      if (__DEV__) console.error('❌ Database test failed:', error);
    }
  };

  const generateSampleData = async () => {
    try {
      if (__DEV__) console.log('🎭 Generating sample data for sentiment analysis demo...');
      const stats = getTestDataStats();
      if (__DEV__) console.log('📊 Will generate:', stats);
      
      await generateTestData();
      
      // Refresh the entries display
      await loadSavedEntries();
      
      // Get final count
      const count = await getMoodEntryCount();
      if (__DEV__) console.log(`🎉 Successfully generated sample data! Total entries: ${count}`);
      if (__DEV__) console.log('💡 Check the Insights tab to see sentiment analysis patterns!');
      
    } catch (error) {
      if (__DEV__) console.error('❌ Sample data generation failed:', error);
    }
  };

  const testEngagement = async () => {
    try {
      if (__DEV__) console.log('📈 Testing engagement recognition...');
      const entries = await getAllMoodEntries();
      const entriesWithTimestamps = entries.filter(entry => entry.created_at);
      const engagement = calculateEngagement(entriesWithTimestamps as any);
      if (__DEV__) console.log('Engagement data:', engagement);
      
      setEngagementData(engagement);
    } catch (error) {
      if (__DEV__) console.error('❌ Engagement test failed:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <Logo size="large" showIcon={true} horizontal={false} style={styles.logo} />
        
        {/* Engagement Recognition */}
        {engagementData && engagementData.showMessage && (
          <View style={styles.engagementContainer}>
            <Text style={styles.engagementText}>
              {engagementData.message}
            </Text>
          </View>
        )}
        
        {/* Main Question */}
        <Text style={styles.question}>Check In</Text>
        
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
                <Text style={styles.reflectionLabel}>How are you feeling?</Text>
                <TextInput
                  style={styles.reflectionInput}
                  value={reflection}
                  onChangeText={setReflection}
                  placeholder="Tell us more about how you're feeling..."
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
                    accessibilityLabel="Save reflection"
                    accessibilityHint="Save your mood and reflection"
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
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
        
        {/* Test Buttons */}
        <View style={styles.testButtonsContainer}>
          <TouchableOpacity 
            style={styles.testButton} 
            onPress={testDatabase}
            accessibilityRole="button"
            accessibilityLabel="Test database"
            accessibilityHint="Test database functionality for development"
          >
            <Text style={styles.testButtonText}>Test Database</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.sampleDataButton} 
            onPress={generateSampleData}
            accessibilityRole="button"
            accessibilityLabel="Generate sample data"
            accessibilityHint="Generate test mood entries for development"
          >
            <Text style={styles.sampleDataButtonText}>Generate Sample Data</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.engagementTestButton} 
            onPress={testEngagement}
            accessibilityRole="button"
            accessibilityLabel="Test engagement"
            accessibilityHint="Test engagement recognition for development"
          >
            <Text style={styles.engagementTestButtonText}>Test Engagement</Text>
          </TouchableOpacity>
        </View>
        
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  scrollContent: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing['5xl'],
    paddingBottom: Spacing['8xl'],
  },
  logo: {
    marginBottom: Spacing['2xl'],
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
    marginBottom: Spacing['3xl'],
    color: Colors.text.primary,
    letterSpacing: Typography.letterSpacing.tight,
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
    backgroundColor: Colors.background.secondary,
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
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
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
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
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
    color: Colors.text.primary,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold as any,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: Colors.success[600],
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
    color: Colors.text.primary,
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
  testButtonsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'center',
    marginTop: Spacing['2xl'],
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.base,
  },
  testButton: {
    backgroundColor: Colors.secondary[500],
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    minWidth: 130,
    ...Shadows.button,
  },
  testButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold as any,
    textAlign: 'center',
  },
  sampleDataButton: {
    backgroundColor: Colors.primary[600],
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    minWidth: 150,
    ...Shadows.button,
  },
  sampleDataButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold as any,
    textAlign: 'center',
  },
  engagementTestButton: {
    backgroundColor: Colors.accent[600],
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    minWidth: 150,
    ...Shadows.button,
  },
  engagementTestButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold as any,
    textAlign: 'center',
  },
  entriesContainer: {
    marginTop: Spacing['3xl'],
    padding: Layout.cardPadding,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.sm,
    ...Shadows.card,
  },
  entriesTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.text.primary,
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
    color: Colors.text.tertiary,
  },
  emptyStateContainer: {
    alignItems: 'center',
    marginTop: Spacing['3xl'],
    paddingVertical: Spacing['2xl'],
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.background.secondary,
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
    color: Colors.text.primary,
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
});
