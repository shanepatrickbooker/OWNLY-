import React from 'react';
import { Image } from 'react-native';

type Props = { size?: number };

export default function LogoOwnly({ size = 96 }: Props) {
  return (
    <Image
      source={require('../assets/images/icon-ios-1024.png')}
      style={{
        width: size,
        height: size,
        resizeMode: 'contain'
      }}
    />
  );
}
