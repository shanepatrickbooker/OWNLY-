import React from 'react';
import { View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';

interface LogoProps {
  size?: 'small' | 'medium' | 'large' | 'icon';
  style?: ViewStyle;
}

export default function Logo({ 
  size = 'medium', 
  style
}: LogoProps) {
  
  const getDimensions = () => {
    switch (size) {
      case 'small': return 32;
      case 'medium': return 72;
      case 'large': return 80;
      case 'icon': return 96;
      default: return 72;
    }
  };

  const iconSize = getDimensions();



  const renderLogo = () => (
    <Image
      source={require('../assets/images/icon-ios-1024.png')}
      style={{
        width: iconSize,
        height: iconSize,
        backgroundColor: 'transparent'
      }}
      contentFit="contain"
      cachePolicy="memory-disk"
      transition={200}
    />
  );

  const containerStyle: ViewStyle = {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    ...style
  };

  if (size === 'icon') {
    return (
      <View style={[containerStyle, { width: iconSize, height: iconSize }]}>
        {renderLogo()}
      </View>
    );
  }

  // Clean, single-color approach - no gradients

  return (
    <View style={containerStyle}>
      {renderLogo()}
    </View>
  );
}

