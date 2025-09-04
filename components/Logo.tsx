import React from 'react';
import { View, Text, StyleSheet, TextStyle, ViewStyle, Platform } from 'react-native';
import { Logo as LogoStyles, Typography, Colors } from '../constants/Design';
import { Svg, Path, G } from 'react-native-svg';

interface LogoProps {
  size?: 'small' | 'medium' | 'large' | 'icon';
  variant?: 'primary' | 'light' | 'dark';
  style?: ViewStyle;
  showIcon?: boolean;
  horizontal?: boolean;
}

export default function Logo({ 
  size = 'medium', 
  variant = 'primary',
  style,
  showIcon = true,
  horizontal = true
}: LogoProps) {
  
  const getDimensions = () => {
    switch (size) {
      case 'small': return { iconSize: 22, fontSize: 18, spacing: 8 };
      case 'medium': return { iconSize: 28, fontSize: 24, spacing: 12 };
      case 'large': return { iconSize: 36, fontSize: 28, spacing: 16 };
      case 'icon': return { iconSize: 64, fontSize: 0, spacing: 0 };
      default: return { iconSize: 28, fontSize: 24, spacing: 12 };
    }
  };

  const { iconSize, fontSize, spacing } = getDimensions();

  const getTextStyle = (): TextStyle => {
    const baseStyle = {
      fontFamily: Platform.select({
        ios: 'SF Pro Rounded', // Warmer system font on iOS
        android: 'sans-serif-medium', // Rounded characteristics on Android
        default: 'system-ui', // Modern system font on web
      }),
      fontSize,
      fontWeight: '600' as TextStyle['fontWeight'], // Semibold instead of bold
      letterSpacing: 1.2, // More open, breathable feel
    };

    const colorStyle = {
      color: variant === 'light' 
        ? LogoStyles.colors.light 
        : variant === 'dark' 
        ? LogoStyles.colors.dark 
        : LogoStyles.colors.primary
    };

    return StyleSheet.flatten([baseStyle, colorStyle]);
  };

  const getLeafColors = () => {
    switch (variant) {
      case 'light': return {
        primary: '#86EFAC', // Light fresh green
        secondary: '#BBF7D0', // Even lighter green
        branch: '#A3E635' // Light branch color
      };
      case 'dark': return {
        primary: '#15803D', // Dark green
        secondary: '#166534', // Darker green
        branch: '#22C55E' // Medium branch color
      };
      default: return {
        primary: '#22C55E', // Vibrant fresh green
        secondary: '#4ADE80', // Lighter vibrant green  
        branch: '#16A34A' // Rich branch green
      };
    }
  };

  const leafColors = getLeafColors();

  // Clean, simple leaf design like 🌿 - natural and minimalist
  const renderLeaf = () => (
    <Svg width={iconSize} height={iconSize} viewBox="0 0 32 32">
      <G>
        {/* Simple vertical stem */}
        <Path
          d="M16 26 L16 6"
          stroke={leafColors.branch}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        
        {/* Clean simple leaves - like 🌿 emoji */}
        {/* Bottom left leaf */}
        <Path
          d="M16 24 Q10 22 10 18 Q10 20 16 22 Z"
          fill={leafColors.primary}
        />
        
        {/* Bottom right leaf */}
        <Path
          d="M16 24 Q22 22 22 18 Q22 20 16 22 Z"
          fill={leafColors.primary}
        />
        
        {/* Middle left leaf */}
        <Path
          d="M16 18 Q9 16 9 12 Q9 14 16 16 Z"
          fill={leafColors.secondary}
        />
        
        {/* Middle right leaf */}
        <Path
          d="M16 18 Q23 16 23 12 Q23 14 16 16 Z"
          fill={leafColors.secondary}
        />
        
        {/* Top left leaf */}
        <Path
          d="M16 12 Q8 10 8 6 Q8 8 16 10 Z"
          fill={leafColors.primary}
        />
        
        {/* Top right leaf */}
        <Path
          d="M16 12 Q24 10 24 6 Q24 8 16 10 Z"
          fill={leafColors.primary}
        />
      </G>
    </Svg>
  );

  const containerStyle: ViewStyle = {
    flexDirection: horizontal ? 'row' : 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ...style
  };

  if (size === 'icon') {
    return (
      <View style={[containerStyle, { width: iconSize, height: iconSize }]}>
        {renderLeaf()}
      </View>
    );
  }

  // Clean, single-color approach - no gradients

  return (
    <View style={containerStyle}>
      {showIcon && (
        <View style={{ 
          marginRight: horizontal ? spacing : 0, 
          marginBottom: horizontal ? 0 : spacing / 2
        }}>
          {renderLeaf()}
        </View>
      )}
      <Text style={getTextStyle()}>
        OWNLY
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Clean, minimal styling - no shadows or complex effects
  // Let the leaf and typography speak for themselves
});