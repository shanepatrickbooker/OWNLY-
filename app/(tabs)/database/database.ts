import AsyncStorage from '@react-native-async-storage/async-storage';
import { analyzeSentiment, SentimentResult } from '../../../utils/sentimentAnalysis';

// AsyncStorage keys
const MOOD_ENTRIES_KEY = 'mood_entries';
const MOOD_COUNTER_KEY = 'mood_counter';

// Mood entry interface
export interface MoodEntry {
  id?: number;
  mood_value: number;
  mood_label: string;
  reflection?: string;
  timestamp: string;
  created_at?: string;
  sentiment_data?: SentimentResult;
}

// Initialize AsyncStorage (no setup needed, but keeping interface consistent)
export const initializeDatabase = async (): Promise<void> => {
  try {
    // Initialize mood counter if it doesn't exist
    const counter = await AsyncStorage.getItem(MOOD_COUNTER_KEY);
    if (counter === null) {
      await AsyncStorage.setItem(MOOD_COUNTER_KEY, '0');
    }
    
    if (__DEV__) console.log('AsyncStorage initialized successfully');
  } catch (error) {
    if (__DEV__) console.error('Error initializing AsyncStorage:', error);
    throw error;
  }
};

// Insert a new mood entry
export const saveMoodEntry = async (entry: Omit<MoodEntry, 'id' | 'created_at'>): Promise<number> => {
  try {
    // Get current entries
    const existingData = await AsyncStorage.getItem(MOOD_ENTRIES_KEY);
    const entries: MoodEntry[] = existingData ? JSON.parse(existingData) : [];
    
    // Get and increment counter for new ID
    const counterStr = await AsyncStorage.getItem(MOOD_COUNTER_KEY) || '0';
    const newId = parseInt(counterStr) + 1;
    await AsyncStorage.setItem(MOOD_COUNTER_KEY, newId.toString());
    
    // Analyze sentiment if reflection exists
    const sentimentData = entry.reflection && entry.reflection.trim().length > 0 
      ? analyzeSentiment(entry.reflection) 
      : undefined;

    // Create new entry with ID, timestamp, and sentiment data
    const newEntry: MoodEntry = {
      id: newId,
      ...entry,
      created_at: new Date().toISOString(),
      sentiment_data: sentimentData
    };
    
    // Add to entries and save
    entries.unshift(newEntry); // Add to beginning for DESC order
    await AsyncStorage.setItem(MOOD_ENTRIES_KEY, JSON.stringify(entries));
    
    if (__DEV__) console.log('Mood entry saved with ID:', newId);
    return newId;
  } catch (error) {
    if (__DEV__) console.error('Error saving mood entry:', error);
    throw error;
  }
};

// Get all mood entries (for insights later)
export const getAllMoodEntries = async (): Promise<MoodEntry[]> => {
  try {
    const data = await AsyncStorage.getItem(MOOD_ENTRIES_KEY);
    const entries: MoodEntry[] = data ? JSON.parse(data) : [];
    if (__DEV__) console.log(`Retrieved ${entries.length} mood entries`);
    return entries; // Already in DESC order from saveMoodEntry
  } catch (error) {
    if (__DEV__) console.error('Error retrieving mood entries:', error);
    throw error;
  }
};

// Get recent mood entries (last N entries)
export const getRecentMoodEntries = async (limit: number = 10): Promise<MoodEntry[]> => {
  try {
    const data = await AsyncStorage.getItem(MOOD_ENTRIES_KEY);
    const entries: MoodEntry[] = data ? JSON.parse(data) : [];
    const recentEntries = entries.slice(0, limit);
    if (__DEV__) console.log(`Retrieved ${recentEntries.length} recent mood entries`);
    return recentEntries;
  } catch (error) {
    if (__DEV__) console.error('Error retrieving recent mood entries:', error);
    throw error;
  }
};

// Get mood entries count
export const getMoodEntryCount = async (): Promise<number> => {
  try {
    const data = await AsyncStorage.getItem(MOOD_ENTRIES_KEY);
    const entries: MoodEntry[] = data ? JSON.parse(data) : [];
    const count = entries.length;
    if (__DEV__) console.log(`Total mood entries: ${count}`);
    return count;
  } catch (error) {
    if (__DEV__) console.error('Error getting mood entry count:', error);
    throw error;
  }
};

// Get mood entries for a specific date
export const getMoodEntriesForDate = async (date: Date): Promise<MoodEntry[]> => {
  try {
    const data = await AsyncStorage.getItem(MOOD_ENTRIES_KEY);
    const entries: MoodEntry[] = data ? JSON.parse(data) : [];
    
    const dateStr = date.toDateString();
    const entriesForDate = entries.filter(entry => {
      const entryDate = new Date(entry.timestamp || entry.created_at || '');
      return entryDate.toDateString() === dateStr;
    });
    
    if (__DEV__) console.log(`Found ${entriesForDate.length} entries for ${dateStr}`);
    return entriesForDate;
  } catch (error) {
    if (__DEV__) console.error('Error getting mood entries for date:', error);
    throw error;
  }
};

// Generate diverse sample data to trigger all insights (for testing only)
export const generateSampleData = async (): Promise<void> => {
  try {
    if (__DEV__) console.log('🧪 Generating diverse sample data...');
    
    // Clear existing data first
    await AsyncStorage.setItem(MOOD_ENTRIES_KEY, JSON.stringify([]));
    await AsyncStorage.setItem(MOOD_COUNTER_KEY, '0');
    
    const now = new Date();
    const sampleEntries: Omit<MoodEntry, 'id' | 'created_at'>[] = [
      // Recent entries showing progress (trigger: progress_recognition)
      {
        mood_value: 4,
        mood_label: 'Content',
        reflection: 'Feeling much better today. The new meditation routine is really helping with my anxiety and stress levels.',
        timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        mood_value: 3,
        mood_label: 'Neutral',
        reflection: 'Had a good work meeting today. Boss was supportive and the project timeline looks manageable.',
        timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      
      // Monday blues pattern (trigger: day_of_week_patterns)
      {
        mood_value: 2,
        mood_label: 'Frustrated',
        reflection: 'Monday morning blues again. Work feels overwhelming and I have three meetings today.',
        timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString() // Last Monday
      },
      {
        mood_value: 2,
        mood_label: 'Sad',
        reflection: 'Another tough Monday. The weekend went by too fast and work stress is building up.',
        timestamp: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString() // Previous Monday
      },
      
      // Evening vs morning patterns (trigger: time_of_day_patterns)
      {
        mood_value: 5,
        mood_label: 'Joyful',
        reflection: 'Evening walk with friends was amazing! Love these peaceful moments after dinner.',
        timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        mood_value: 2,
        mood_label: 'Anxious',
        reflection: 'Morning anxiety is back. Coffee helps but the pressure to start the day productively is intense.',
        timestamp: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString()
      },
      
      // Work-related triggers (trigger: trigger_identification)
      {
        mood_value: 1,
        mood_label: 'Angry',
        reflection: 'Terrible day at work. Boss criticized my project in front of the whole team during the meeting. Feeling undervalued and frustrated.',
        timestamp: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        mood_value: 2,
        mood_label: 'Frustrated',
        reflection: 'Another stressful work day. Deadline pressure is getting to me and my colleague is not pulling their weight on this project.',
        timestamp: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        mood_value: 1,
        mood_label: 'Sad',
        reflection: 'Work meeting was a disaster. Boss seemed disappointed and I feel like I let the team down with my presentation.',
        timestamp: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()
      },
      
      // Family stress patterns (trigger: contextual_patterns)
      {
        mood_value: 2,
        mood_label: 'Worried',
        reflection: 'Family dinner was tense again. Parent and sibling were arguing about money and I felt caught in the middle.',
        timestamp: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        mood_value: 1,
        mood_label: 'Frustrated',
        reflection: 'Family drama continues. Parent called upset about financial stress and it brought down my whole mood.',
        timestamp: new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000).toISOString()
      },
      
      // Length variation - longer during difficult times (trigger: length_variation)
      {
        mood_value: 1,
        mood_label: 'Angry',
        reflection: 'Today was absolutely horrible and I need to write this all out to process it. Work was a nightmare from start to finish with meeting after meeting going poorly. My boss was in a terrible mood and took it out on everyone. Then I got home to find out that my partner had a bad day too and we ended up arguing about small things that normally wouldn\'t matter. I feel overwhelmed by everything and like nothing is going right in my life right now. The weather has been gloomy which doesn\'t help my mood at all.',
        timestamp: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        mood_value: 4,
        mood_label: 'Happy',
        reflection: 'Great day!',
        timestamp: new Date(now.getTime() - 16 * 24 * 60 * 60 * 1000).toISOString()
      },
      
      // Coping strategies visible (trigger: coping_recognition)
      {
        mood_value: 3,
        mood_label: 'Content',
        reflection: 'Used deep breathing exercises when I felt stressed today. It really helped me stay calm during the difficult conversation with my partner.',
        timestamp: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        mood_value: 4,
        mood_label: 'Happy',
        reflection: 'Went for a long walk when feeling down. Fresh air and exercise always help me process emotions better.',
        timestamp: new Date(now.getTime() - 11 * 24 * 60 * 60 * 1000).toISOString()
      },
      
      // Mood vs sentiment discrepancy (trigger: nuanced_emotions)
      {
        mood_value: 4,
        mood_label: 'Content',
        reflection: 'I rated myself as content but honestly feeling quite worried about upcoming changes at work and unsure about the future.',
        timestamp: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        mood_value: 3,
        mood_label: 'Neutral',
        reflection: 'Marked as neutral but actually feeling anxious and overwhelmed by all the responsibilities piling up.',
        timestamp: new Date(now.getTime() - 17 * 24 * 60 * 60 * 1000).toISOString()
      },
      
      // Environmental patterns (trigger: environmental_awareness)
      {
        mood_value: 2,
        mood_label: 'Sad',
        reflection: 'Another rainy day and my mood is matching the gloomy weather outside. The cold and darkness is affecting me.',
        timestamp: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        mood_value: 5,
        mood_label: 'Joyful',
        reflection: 'Beautiful sunny day! The weather is perfect and being outside in the sunshine instantly lifted my spirits.',
        timestamp: new Date(now.getTime() - 19 * 24 * 60 * 60 * 1000).toISOString()
      },
      
      // Additional entries for pattern recognition
      {
        mood_value: 3,
        mood_label: 'Neutral',
        reflection: 'Regular Tuesday. Work was fine, nothing special happened. Feeling okay overall.',
        timestamp: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        mood_value: 4,
        mood_label: 'Happy',
        reflection: 'Friday night! Love the weekend feeling. Spending time with friends always boosts my mood.',
        timestamp: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    // Add all sample entries
    for (const entry of sampleEntries) {
      await saveMoodEntry(entry);
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    if (__DEV__) console.log(`🧪 Generated ${sampleEntries.length} diverse sample entries!`);
    if (__DEV__) console.log('📊 This should trigger multiple insight types:');
    if (__DEV__) console.log('• day_of_week_patterns (Monday blues)');
    if (__DEV__) console.log('• time_of_day_patterns (evening vs morning)');
    if (__DEV__) console.log('• trigger_identification (work stress)');
    if (__DEV__) console.log('• contextual_patterns (family/work themes)');
    if (__DEV__) console.log('• progress_recognition (recent improvement)');
    if (__DEV__) console.log('• length_variation (long vs short reflections)');
    if (__DEV__) console.log('• coping_recognition (breathing, walking)');
    if (__DEV__) console.log('• nuanced_emotions (mood vs text mismatch)');
    if (__DEV__) console.log('• environmental_awareness (weather impact)');
    
  } catch (error) {
    if (__DEV__) console.error('Error generating sample data:', error);
    throw error;
  }
};

// Clear all mood data (for testing)
export const clearAllMoodData = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(MOOD_ENTRIES_KEY, JSON.stringify([]));
    await AsyncStorage.setItem(MOOD_COUNTER_KEY, '0');
    if (__DEV__) console.log('🗑️ All mood data cleared');
  } catch (error) {
    if (__DEV__) console.error('Error clearing mood data:', error);
    throw error;
  }
};
