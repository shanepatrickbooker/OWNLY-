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
    
    console.log('AsyncStorage initialized successfully');
  } catch (error) {
    console.error('Error initializing AsyncStorage:', error);
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
    
    console.log('Mood entry saved with ID:', newId);
    return newId;
  } catch (error) {
    console.error('Error saving mood entry:', error);
    throw error;
  }
};

// Get all mood entries (for insights later)
export const getAllMoodEntries = async (): Promise<MoodEntry[]> => {
  try {
    const data = await AsyncStorage.getItem(MOOD_ENTRIES_KEY);
    const entries: MoodEntry[] = data ? JSON.parse(data) : [];
    console.log(`Retrieved ${entries.length} mood entries`);
    return entries; // Already in DESC order from saveMoodEntry
  } catch (error) {
    console.error('Error retrieving mood entries:', error);
    throw error;
  }
};

// Get recent mood entries (last N entries)
export const getRecentMoodEntries = async (limit: number = 10): Promise<MoodEntry[]> => {
  try {
    const data = await AsyncStorage.getItem(MOOD_ENTRIES_KEY);
    const entries: MoodEntry[] = data ? JSON.parse(data) : [];
    const recentEntries = entries.slice(0, limit);
    console.log(`Retrieved ${recentEntries.length} recent mood entries`);
    return recentEntries;
  } catch (error) {
    console.error('Error retrieving recent mood entries:', error);
    throw error;
  }
};

// Get mood entries count
export const getMoodEntryCount = async (): Promise<number> => {
  try {
    const data = await AsyncStorage.getItem(MOOD_ENTRIES_KEY);
    const entries: MoodEntry[] = data ? JSON.parse(data) : [];
    const count = entries.length;
    console.log(`Total mood entries: ${count}`);
    return count;
  } catch (error) {
    console.error('Error getting mood entry count:', error);
    throw error;
  }
};
