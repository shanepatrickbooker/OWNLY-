import React from 'react';
import { View, ViewStyle, Image, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spacing } from '../constants/Design';

interface HeaderLogoProps {
  variant?: 'default' | 'onboarding';
  style?: ViewStyle;
}

export default function HeaderLogo({ 
  variant = 'default',
  style 
}: HeaderLogoProps) {
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get('window').width;
  
  // Responsive sizing based on screen width
  const getLogoSize = () => {
    // Base size is ~18-22% of screen width for better prominence
    const responsiveSize = Math.floor(screenWidth * 0.20);
    const minSize = 100;
    const maxSize = 160;
    return Math.min(Math.max(responsiveSize, minSize), maxSize);
  };

  const logoSize = getLogoSize();

  const containerStyle: ViewStyle = {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: variant === 'onboarding' ? 0 : insets.top + Spacing.base,
    paddingBottom: Spacing.md,
    ...style
  };

  return (
    <View style={containerStyle}>
      <Image
        source={require('../assets/images/icon-ios-1024.png')}
        style={{
          width: logoSize,
          height: logoSize,
          resizeMode: 'contain',
          backgroundColor: 'transparent'
        }}
      />
    </View>
  );
}