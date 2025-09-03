import { router, useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import { Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { saveMoodEntry, getAllMoodEntries, getMoodEntryCount } from './database/database';
import { generateTestData, getTestDataStats } from '../../utils/testDataGenerator';
import { calculateStreak, getStreakDisplayText, shouldShowStreakPromptly, getMilestoneEmoji, formatStreakData } from '../../utils/streakTracking';

// Mood options matching your mockup
const MOODS = [
  { emoji: '😡', label: 'Angry', value: 1 },
  { emoji: '😔', label: 'Frustrated', value: 2 },  
  { emoji: '😐', label: 'Sad', value: 2 },
  { emoji: '😊', label: 'Neutral', value: 3 },
  { emoji: '😄', label: 'Content', value: 4 },
  { emoji: '🤩', label: 'Joyful', value: 4 },
  { emoji: '😆', label: 'Happy', value: 5 },
  { emoji: '😲', label: 'Surprised', value: 4 },
  { emoji: '😟', label: 'Worried', value: 2 },
  { emoji: '😰', label: 'Worried', value: 1 },
  { emoji: '😤', label: 'Anxious', value: 2 }
];

export default function HomeScreen() {
  const [selectedMoodIndex, setSelectedMoodIndex] = useState<number | null>(null);
  const [savedEntries, setSavedEntries] = useState<any[]>([]);
  const [streakData, setStreakData] = useState<any>(null);
  const [showMilestone, setShowMilestone] = useState(false);

  const loadSavedEntries = useCallback(async () => {
    try {
      const entries = await getAllMoodEntries();
      setSavedEntries(entries);
      
      // Calculate streak data (filter entries with timestamps)
      const entriesWithTimestamps = entries.filter(entry => entry.created_at);
      const streak = calculateStreak(entriesWithTimestamps as any);
      setStreakData(streak);
      
      // Show milestone celebration if this is a new milestone
      if (streak.isMilestone && streak.currentStreak > 0) {
        setShowMilestone(true);
        // Auto-hide milestone after 5 seconds
        setTimeout(() => setShowMilestone(false), 5000);
      }
    } catch (error) {
      console.error('Error loading saved entries:', error);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadSavedEntries();
  }, [loadSavedEntries]));

  const handleMoodSelect = (index: number, moodLabel: string, moodValue: number) => {
    setSelectedMoodIndex(index);
    console.log(`Selected mood: ${moodLabel} (value: ${moodValue})`);
  };

  const handleNext = () => {
    if (selectedMoodIndex !== null) {
      const selectedMood = MOODS[selectedMoodIndex];
      router.push({
        pathname: '/reflection' as any,
        params: {
          mood: selectedMood.value,
          moodLabel: selectedMood.label
        }
      });
    }
  };

  const testDatabase = async () => {
    try {
      console.log('🧪 Testing database functionality...');
      
      // Test saving a mood entry
      const testEntry = {
        mood_value: 5,
        mood_label: 'Happy',
        reflection: 'Testing database functionality with a happy mood!',
        timestamp: new Date().toISOString()
      };
      
      const savedId = await saveMoodEntry(testEntry);
      console.log('✅ Test entry saved with ID:', savedId);
      
      // Refresh the entries display
      await loadSavedEntries();
      
      // Get count
      const count = await getMoodEntryCount();
      console.log('📈 Total entries:', count);
      
    } catch (error) {
      console.error('❌ Database test failed:', error);
    }
  };

  const generateSampleData = async () => {
    try {
      console.log('🎭 Generating sample data for sentiment analysis demo...');
      const stats = getTestDataStats();
      console.log('📊 Will generate:', stats);
      
      await generateTestData();
      
      // Refresh the entries display
      await loadSavedEntries();
      
      // Get final count
      const count = await getMoodEntryCount();
      console.log(`🎉 Successfully generated sample data! Total entries: ${count}`);
      console.log('💡 Check the Insights tab to see sentiment analysis patterns!');
      
      // Show streak calculation
      if (streakData) {
        console.log('📈 Streak data:', formatStreakData(streakData));
      }
      
    } catch (error) {
      console.error('❌ Sample data generation failed:', error);
    }
  };

  const testStreak = async () => {
    try {
      console.log('📈 Testing streak calculation...');
      const entries = await getAllMoodEntries();
      const entriesWithTimestamps = entries.filter(entry => entry.created_at);
      const streak = calculateStreak(entriesWithTimestamps as any);
      console.log('Streak data:', formatStreakData(streak));
      console.log('Display text:', getStreakDisplayText(streak));
      console.log('Should show prominently:', shouldShowStreakPromptly(streak));
      
      if (streak.isMilestone) {
        console.log('🎉 Milestone reached!', streak.milestoneMessage);
      }
      
      setStreakData(streak);
    } catch (error) {
      console.error('❌ Streak test failed:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <Text style={styles.title}>OWNLY</Text>
        
        {/* Streak Display */}
        {streakData && shouldShowStreakPromptly(streakData) && (
          <View style={styles.streakContainer}>
            <Text style={styles.streakText}>
              {getMilestoneEmoji(streakData.currentStreak)} {getStreakDisplayText(streakData)}
            </Text>
          </View>
        )}
        
        {/* Milestone Celebration */}
        {showMilestone && streakData?.isMilestone && (
          <View style={styles.milestoneContainer}>
            <Text style={styles.milestoneEmoji}>
              {getMilestoneEmoji(streakData.currentStreak)}
            </Text>
            <Text style={styles.milestoneText}>
              {streakData.milestoneMessage}
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
            >
              <Text style={styles.moodEmoji}>{mood.emoji}</Text>
              <Text style={styles.moodLabel}>{mood.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Next Button */}
        {selectedMoodIndex !== null && (
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        )}
        
        {/* Test Buttons */}
        <View style={styles.testButtonsContainer}>
          <TouchableOpacity style={styles.testButton} onPress={testDatabase}>
            <Text style={styles.testButtonText}>Test Database</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sampleDataButton} onPress={generateSampleData}>
            <Text style={styles.sampleDataButtonText}>Generate Sample Data</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.streakTestButton} onPress={testStreak}>
            <Text style={styles.streakTestButtonText}>Test Streak</Text>
          </TouchableOpacity>
        </View>
        
        {/* Show Saved Entries */}
        {savedEntries.length > 0 && (
          <View style={styles.entriesContainer}>
            <Text style={styles.entriesTitle}>Saved Entries ({savedEntries.length}):</Text>
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
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9ff', // Light background like mockup
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 60, // Extra padding at bottom so Next button is visible
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1f2937',
  },
  streakContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  streakText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
    opacity: 0.8,
  },
  milestoneContainer: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  milestoneEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  milestoneText: {
    fontSize: 16,
    color: '#92400E',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 22,
  },
  question: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'left',
    marginBottom: 30,
    color: '#1f2937',
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 15, // Space between items
    marginHorizontal: 10,
    marginBottom: 20,
  },
  moodButton: {
    width: 100, // Fixed width instead of percentage
    height: 100, // Fixed height
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#ffffff',
    margin: 5, // Individual margin for better spacing
    // Cross-platform shadow
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      },
    }),
  },
  selectedMood: {
    backgroundColor: '#6366F1', // Purple from your color scheme
    transform: [{ scale: 0.95 }],
  },
  moodEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  moodLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  nextButton: {
    backgroundColor: '#6366F1', // Purple primary color
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    alignSelf: 'center',
    marginTop: 20,
    minWidth: 120,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  testButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    marginTop: 20,
    flexWrap: 'wrap',
  },
  testButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    minWidth: 120,
  },
  testButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  sampleDataButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    minWidth: 140,
  },
  sampleDataButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  streakTestButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    minWidth: 120,
  },
  streakTestButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  entriesContainer: {
    marginTop: 30,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginHorizontal: 10,
  },
  entriesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  entryItem: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  entryText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  entryTimestamp: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
