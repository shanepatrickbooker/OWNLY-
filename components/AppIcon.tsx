import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Svg, Path, Circle, G, Defs, RadialGradient, Stop } from 'react-native-svg';
import { Colors } from '../constants/Design';

interface AppIconProps {
  size?: number;
  variant?: 'standard' | 'gradient' | 'monochrome';
}

export default function AppIcon({ 
  size = 512, 
  variant = 'gradient' 
}: AppIconProps) {
  
  const getBackgroundColors = () => {
    switch (variant) {
      case 'monochrome': return ['#FFFFFF', '#F8F8F8'];
      case 'standard': return [Colors.primary[400], Colors.primary[600]];
      case 'gradient': default: return [Colors.primary[400], Colors.accent[500]];
    }
  };

  const getIconColors = () => {
    switch (variant) {
      case 'monochrome': return ['#6B7280', '#9CA3AF'];
      case 'standard': return ['#FFFFFF', '#F3F4F6'];
      case 'gradient': default: return ['#FFFFFF', '#E0E7FF'];
    }
  };

  const backgroundColors = getBackgroundColors();
  const iconColors = getIconColors();

  // Sophisticated app icon with layered elements
  const renderIcon = () => (
    <Svg width={size} height={size} viewBox="0 0 512 512" style={styles.iconContainer}>
      <Defs>
        {/* Background gradient */}
        <RadialGradient id="backgroundGradient" cx="50%" cy="30%" rx="80%" ry="100%">
          <Stop offset="0%" stopColor={backgroundColors[0]} />
          <Stop offset="100%" stopColor={backgroundColors[1]} />
        </RadialGradient>
        
        {/* Icon element gradient */}
        <RadialGradient id="iconGradient" cx="50%" cy="50%" rx="60%" ry="60%">
          <Stop offset="0%" stopColor={iconColors[0]} />
          <Stop offset="100%" stopColor={iconColors[1]} />
        </RadialGradient>
      </Defs>

      {/* Background with rounded rectangle */}
      <Path
        d="M0 112 C0 50.14 50.14 0 112 0 L400 0 C461.86 0 512 50.14 512 112 L512 400 C512 461.86 461.86 512 400 512 L112 512 C50.14 512 0 461.86 0 400 Z"
        fill="url(#backgroundGradient)"
      />

      <G>
        {/* Main icon elements - centered and scaled for app icon */}
        
        {/* Outer protective ring */}
        <Circle
          cx="256"
          cy="256"
          r="180"
          stroke={iconColors[0]}
          strokeWidth="12"
          fill="none"
          opacity="0.3"
        />
        
        {/* Secondary ring for depth */}
        <Circle
          cx="256"
          cy="256"
          r="140"
          stroke={iconColors[0]}
          strokeWidth="8"
          fill="none"
          opacity="0.5"
        />

        {/* Central organic shape - emotional awareness */}
        <Path
          d="M156 256 Q256 156 356 256 Q256 356 156 256 Z"
          fill="url(#iconGradient)"
          opacity="0.9"
        />
        
        {/* Inner reflection elements */}
        <Path
          d="M200 256 Q256 200 312 256 Q256 312 200 256 Z"
          fill={iconColors[0]}
          opacity="0.6"
        />
        
        {/* Central mindfulness dot */}
        <Circle
          cx="256"
          cy="256"
          r="24"
          fill={iconColors[0]}
          opacity="0.95"
        />
        
        {/* Growth elements - subtle upward movement */}
        <Path
          d="M256 200 Q280 224 256 256 Q232 224 256 200 Z"
          fill={iconColors[0]}
          opacity="0.4"
        />
        
        <Path
          d="M256 256 Q280 280 256 312 Q232 280 256 256 Z"
          fill={iconColors[0]}
          opacity="0.3"
        />
      </G>
    </Svg>
  );

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {renderIcon()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconContainer: {
    backgroundColor: 'transparent',
  },
});