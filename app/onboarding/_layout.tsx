import { Stack } from 'expo-router';
import React from 'react';
import { Colors } from '../../constants/Design';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false, // Disable swipe back to prevent skipping screens
        animation: 'slide_from_right',
        contentStyle: {
          backgroundColor: Colors.background.primary,
        },
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="how-it-works" />
      <Stack.Screen name="sentiment-analysis" />
      <Stack.Screen name="enhanced-patterns" />
      <Stack.Screen name="expectations" />
      <Stack.Screen name="boundaries" />
      <Stack.Screen name="notifications" />
    </Stack>
  );
}