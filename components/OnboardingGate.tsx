import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { router, usePathname } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing } from '../constants/Design';

interface OnboardingGateProps {
  children: React.ReactNode;
}

export default function OnboardingGate({ children }: OnboardingGateProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasChecked, setHasChecked] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Only check onboarding status once and only if we're not already in onboarding
    if (!hasChecked && !pathname.startsWith('/onboarding')) {
      checkOnboardingStatus();
    }
  }, [hasChecked, pathname]);

  const checkOnboardingStatus = async () => {
    try {
      const onboardingCompleted = await AsyncStorage.getItem('onboarding_completed');
      
      if (onboardingCompleted !== 'true') {
        // Use push instead of replace and set a timeout to avoid infinite loops
        setTimeout(() => {
          router.push('/onboarding/welcome');
        }, 100);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      // Default to showing onboarding if there's an error
      setTimeout(() => {
        router.push('/onboarding/welcome');  
      }, 100);
    } finally {
      setIsLoading(false);
      setHasChecked(true);
    }
  };

  if (isLoading && !hasChecked) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary[600]} />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
  },
});