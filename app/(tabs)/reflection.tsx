import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { saveMoodEntry } from './database/database';

export default function ReflectionScreen() {
  const { mood, moodLabel } = useLocalSearchParams();
  const [reflection, setReflection] = useState('');

  const handleSave = async () => {
    try {
      await saveMoodEntry({
        mood_value: Number(mood),
        mood_label: String(moodLabel),
        reflection,
        timestamp: new Date().toISOString()
      });
      
      console.log('Mood entry saved successfully');
      router.back();
    } catch (error) {
      console.error('Error saving mood entry:', error);
    }
  };

  const handleSkip = async () => {
    try {
      await saveMoodEntry({
        mood_value: Number(mood),
        mood_label: String(moodLabel),
        reflection: '',
        timestamp: new Date().toISOString()
      });
      
      console.log('Mood entry saved without reflection');
      router.back();
    } catch (error) {
      console.error('Error saving mood entry:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header with selected mood */}
        <View style={styles.headerContainer}>
          <Text style={styles.selectedMoodText}>
            You&apos;re feeling: {moodLabel}
          </Text>
        </View>

        {/* Main Question */}
        <Text style={styles.question}>What&apos;s on your mind?</Text>
        
        {/* Reflection Text Input */}
        <TextInput
          style={styles.textInput}
          placeholder="Describe what&apos;s making you feel this way..."
          placeholderTextColor="#9CA3AF"
          value={reflection}
          onChangeText={setReflection}
          multiline={true}
          numberOfLines={6}
          textAlignVertical="top"
        />

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.saveButton, !reflection.trim() && styles.saveButtonDisabled]} 
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
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
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  selectedMoodText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6366F1',
    textAlign: 'center',
  },
  question: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'left',
    marginBottom: 20,
    color: '#1f2937',
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 30,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  skipButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    flex: 1,
  },
  skipButtonText: {
    color: '#6B7280',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    flex: 1,
  },
  saveButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});
