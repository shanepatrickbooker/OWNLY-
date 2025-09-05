import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors as DesignColors } from '../../constants/Design';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: DesignColors.primary[600],
        tabBarInactiveTintColor: DesignColors.text.tertiary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            backgroundColor: DesignColors.background.secondary,
            borderTopColor: DesignColors.neutral[200],
            borderTopWidth: 1,
          },
          default: {
            backgroundColor: DesignColors.background.secondary,
            borderTopColor: DesignColors.neutral[200],
            borderTopWidth: 1,
            elevation: 8,
            shadowColor: DesignColors.shadow.medium,
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 1,
            shadowRadius: 8,
          },
        }),
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: -2,
          marginBottom: 2,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="book.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.bar.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="gear" color={color} />,
        }}
      />
      <Tabs.Screen
        name="reflection"
        options={{
          href: null, // Hide from tabs - functionality moved to home screen
        }}
      />
      <Tabs.Screen
        name="weekly"
        options={{
          href: null, // Hide from tabs - moved to overflow or separate section
        }}
      />
    </Tabs>
  );
}
