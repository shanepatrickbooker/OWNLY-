import React from 'react';
import { Image } from 'expo-image';

type Props = { size?: number };

export default function LogoOwnly({ size = 96 }: Props) {
  return (
    <Image
      source={require('../assets/images/icon-ios-1024.png')}
      style={{
        width: size,
        height: size,
      }}
      contentFit="contain"
      cachePolicy="memory-disk"
      transition={200}
    />
  );
}
