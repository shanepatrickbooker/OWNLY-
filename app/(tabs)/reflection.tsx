import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  SafeAreaView
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors, Typography, Spacing } from '../../constants/Design';
import { saveMoodEntry, getRecentMoodEntries, MoodEntry } from './database/database';
import { conversionService } from '../../services/conversionService';
import HeaderLogo from '../../components/HeaderLogo';

const MOOD_OPTIONS = [
  { emoji: '😄', label: 'Great', value: 5 },
  { emoji: '😊', label: 'Good', value: 4 },
  { emoji: '😐', label: 'Okay', value: 3 },
  { emoji: '😔', label: 'Low', value: 2 },
  { emoji: '😡', label: 'Tough', value: 1 }
];

export default function ReflectionScreen() {
  const params = useLocalSearchParams();
  const [reflection, setReflection] = useState('');
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentEntries, setRecentEntries] = useState<MoodEntry[]>([]);
  const [isDeepReflection, setIsDeepReflection] = useState(false);

  useEffect(() => {
    loadRecentEntries();
    
    // Check if this is a deep reflection from check-in screen
    if (params.isDeepReflection === 'true') {
      setIsDeepReflection(true);
      // Pre-select the mood from check-in
      if (params.mood) {
        const moodValue = Array.isArray(params.mood) ? params.mood[0] : params.mood;
        setSelectedMood(Number(moodValue));
      }
    }
  }, [params.isDeepReflection, params.mood]);

  const loadRecentEntries = async () => {
    try {
      const recent = await getRecentMoodEntries(3);
      setRecentEntries(recent);
    } catch (error) {
      if (__DEV__) console.error('Error loading recent entries:', error);
    }
  };

  const handleSubmit = async () => {
    if (!isDeepReflection && selectedMood === null) {
      Alert.alert(
        'Select Your Mood', 
        'Please select how you\'re feeling right now.'
      );
      return;
    }

    if (!reflection.trim()) {
      Alert.alert(
        isDeepReflection ? 'Add Your Reflection' : 'Add Some Thoughts', 
        isDeepReflection ? 'Please add your deeper reflection.' : 'Please share what\'s on your mind today.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Ensure selectedMood is a valid number
      if (selectedMood === null) {
        throw new Error('No mood selected');
      }

      let moodLabel: string;
      
      if (isDeepReflection) {
        // For deep reflection mode, use the passed mood label or find it
        const paramMoodLabel = Array.isArray(params.moodLabel) ? params.moodLabel[0] : params.moodLabel;
        const selectedMoodOption = MOOD_OPTIONS.find(m => m.value === selectedMood);
        moodLabel = selectedMoodOption?.label || paramMoodLabel || 'Unknown';
      } else {
        // Regular reflection mode
        const selectedMoodOption = MOOD_OPTIONS.find(m => m.value === selectedMood);
        moodLabel = selectedMoodOption?.label || 'Unknown';
      }
      
      await saveMoodEntry({
        mood_value: selectedMood,
        mood_label: moodLabel,
        reflection: reflection.trim(),
        timestamp: new Date().toISOString()
      });

      setReflection('');
      if (!isDeepReflection) setSelectedMood(null);
      await loadRecentEntries();

      // Track the mood entry for conversion triggers
      await conversionService.trackMoodEntry();

      Alert.alert(
        'Reflection Saved',
        'Your reflection has been saved privately on your device.',
        [{ 
          text: 'Continue', 
          style: 'default',
          onPress: () => {
            if (isDeepReflection) {
              router.back(); // Go back to check-in screen
            }
          }
        }]
      );
    } catch (error) {
      if (__DEV__) console.error('Error saving reflection:', error);
      Alert.alert(
        'Save Error',
        'There was an issue saving your reflection. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return 'Today';
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <HeaderLogo />
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            {isDeepReflection ? 'Deep Reflection' : 'Daily Reflection'}
          </Text>
          <Text style={styles.subtitle}>
            {isDeepReflection 
              ? 'Add more details about your current mood'
              : 'Take a moment to check in with yourself'
            }
          </Text>
        </View>

        {!isDeepReflection && (
          <View style={styles.moodSection}>
            <Text style={styles.sectionTitle}>How are you feeling right now?</Text>
          <View style={styles.moodOptions}>
            {MOOD_OPTIONS.map((mood) => (
              <TouchableOpacity
                key={mood.value}
                style={[
                  styles.moodOption,
                  selectedMood === mood.value && styles.moodOptionSelected
                ]}
                onPress={() => setSelectedMood(mood.value)}
                accessibilityRole="button"
                accessibilityLabel={`Select ${mood.label} mood`}
                accessibilityHint={`Tap to select ${mood.label} mood with emoji ${mood.emoji}`}
                accessibilityState={{ selected: selectedMood === mood.value }}
              >
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <Text style={[
                  styles.moodLabel,
                  selectedMood === mood.value && styles.moodLabelSelected
                ]}>
                  {mood.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        )}

        {isDeepReflection && selectedMood && (
          <View style={styles.moodPreviewSection}>
            <Text style={styles.sectionTitle}>Your current mood</Text>
            <View style={styles.moodPreview}>
              <Text style={styles.moodPreviewEmoji}>
                {MOOD_OPTIONS.find(m => m.value === selectedMood)?.emoji}
              </Text>
              <Text style={styles.moodPreviewLabel}>
                {params.moodLabel || MOOD_OPTIONS.find(m => m.value === selectedMood)?.label}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.reflectionSection}>
          <Text style={styles.sectionTitle}>
            {isDeepReflection ? 'Tell us more...' : 'What\'s on your mind?'}
          </Text>
          <Text style={styles.reflectionHint}>
            {isDeepReflection 
              ? 'Share more details about what led to this feeling or what you\'d like to explore'
              : 'Share whatever feels important today—your thoughts, experiences, or feelings'
            }
          </Text>
          
          <TextInput
            style={styles.reflectionInput}
            value={reflection}
            onChangeText={setReflection}
            placeholder="Start writing..."
            placeholderTextColor={Colors.neutral[400]}
            multiline
            textAlignVertical="top"
            maxLength={2000}
            accessibilityLabel="Reflection text field"
            accessibilityHint="Write about your feelings and thoughts, up to 2000 characters"
          />
          
          <Text style={styles.characterCount}>
            {reflection.length}/2000 characters
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            ((selectedMood === null && !isDeepReflection) || !reflection.trim() || isSubmitting) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={(selectedMood === null && !isDeepReflection) || !reflection.trim() || isSubmitting}
          accessibilityRole="button"
          accessibilityLabel={isDeepReflection ? 'Save deep reflection' : 'Save reflection'}
          accessibilityHint="Tap to save your mood and reflection"
          accessibilityState={{ disabled: (selectedMood === null && !isDeepReflection) || !reflection.trim() || isSubmitting }}
        >
          <Text style={[
            styles.submitButtonText,
            ((selectedMood === null && !isDeepReflection) || !reflection.trim() || isSubmitting) && styles.submitButtonTextDisabled
          ]}>
            {isSubmitting ? 'Saving...' : (isDeepReflection ? 'Save Deep Reflection' : 'Save Reflection')}
          </Text>
        </TouchableOpacity>

        {recentEntries.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Recent Check-ins</Text>
            {recentEntries.map((entry) => {
              const moodOption = MOOD_OPTIONS.find(m => m.value === entry.mood_value);
              return (
                <View key={entry.id} style={styles.recentItem}>
                  <View style={styles.recentHeader}>
                    <Text style={styles.recentDate}>{formatDate(entry.timestamp)}</Text>
                    <Text style={styles.recentMood}>
                      {moodOption?.emoji} {entry.mood_label}
                    </Text>
                  </View>
                  {entry.reflection && (
                    <Text style={styles.recentContent} numberOfLines={3}>
                      {entry.reflection}
                    </Text>
                  )}
                </View>
              );
            })}
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: Spacing.xl,
  },
  titleContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.text.primary,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.normal as any,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  moodSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  moodOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  moodOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.neutral[200],
    backgroundColor: Colors.background.secondary,
  },
  moodOptionSelected: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.primary[50],
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  moodLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.normal as any,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  moodLabelSelected: {
    color: Colors.primary[600],
    fontWeight: '600',
  },
  moodPreviewSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  moodPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.primary[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  moodPreviewEmoji: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  moodPreviewLabel: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.primary[700],
  },
  reflectionSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  reflectionHint: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.normal as any,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  reflectionInput: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.normal as any,
    color: Colors.text.primary,
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    padding: Spacing.md,
    minHeight: 120,
    maxHeight: 200,
  },
  characterCount: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.normal as any,
    color: Colors.text.tertiary,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
  submitButton: {
    backgroundColor: Colors.primary[500],
    marginHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.neutral[300],
  },
  submitButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold as any,
    color: 'white',
  },
  submitButtonTextDisabled: {
    color: Colors.neutral[500],
  },
  recentSection: {
    paddingHorizontal: Spacing.lg,
  },
  recentItem: {
    backgroundColor: Colors.background.secondary,
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary[300],
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  recentDate: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.text.secondary,
  },
  recentMood: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.normal as any,
    color: Colors.text.secondary,
  },
  recentContent: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.normal as any,
    color: Colors.text.primary,
    lineHeight: 22,
  },
});
