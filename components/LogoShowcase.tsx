import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import Logo from './Logo';
import AppIcon from './AppIcon';
import { Colors, Typography, Spacing, BorderRadius, Layout } from '../constants/Design';

export default function LogoShowcase() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>OWNLY Logo Showcase</Text>
        <Text style={styles.subtitle}>Enhanced brand identity with trust and emotional awareness</Text>
        
        {/* Primary Variants */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Primary Logo Variants</Text>
          
          <View style={styles.logoContainer}>
            <Text style={styles.logoLabel}>Large Primary (Hero)</Text>
            <Logo size="large" variant="primary" />
          </View>
          
          <View style={styles.logoContainer}>
            <Text style={styles.logoLabel}>Medium with Icon (Headers)</Text>
            <Logo size="medium" showIcon={true} horizontal={true} />
          </View>
          
          <View style={styles.logoContainer}>
            <Text style={styles.logoLabel}>Small Compact</Text>
            <Logo size="small" showIcon={true} horizontal={true} />
          </View>
        </View>

        {/* Color Variants */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Color Treatments</Text>
          
          <View style={styles.logoContainer}>
            <Text style={styles.logoLabel}>Primary (Standard)</Text>
            <Logo size="medium" variant="primary" showIcon={true} />
          </View>
          
          <View style={[styles.logoContainer, { backgroundColor: Colors.neutral[800] }]}>
            <Text style={[styles.logoLabel, { color: Colors.text.inverse }]}>Light (On Dark)</Text>
            <Logo size="medium" variant="light" showIcon={true} />
          </View>
          
          <View style={styles.logoContainer}>
            <Text style={styles.logoLabel}>Dark Treatment</Text>
            <Logo size="medium" variant="dark" showIcon={true} />
          </View>
        </View>

        {/* Layout Variants */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Layout Options</Text>
          
          <View style={styles.logoContainer}>
            <Text style={styles.logoLabel}>Horizontal</Text>
            <Logo size="medium" horizontal={true} showIcon={true} />
          </View>
          
          <View style={styles.logoContainer}>
            <Text style={styles.logoLabel}>Vertical</Text>
            <Logo size="medium" horizontal={false} showIcon={true} />
          </View>
          
          <View style={styles.logoContainer}>
            <Text style={styles.logoLabel}>Text Only</Text>
            <Logo size="medium" showIcon={false} />
          </View>
        </View>

        {/* App Icon Variants */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Icon (App Store Ready)</Text>
          
          <View style={styles.iconRow}>
            <View style={styles.iconContainer}>
              <Text style={styles.logoLabel}>Standard</Text>
              <AppIcon size={80} variant="standard" />
            </View>
            
            <View style={styles.iconContainer}>
              <Text style={styles.logoLabel}>Gradient</Text>
              <AppIcon size={80} variant="gradient" />
            </View>
            
            <View style={styles.iconContainer}>
              <Text style={styles.logoLabel}>Monochrome</Text>
              <AppIcon size={80} variant="monochrome" />
            </View>
          </View>
        </View>

        {/* Icon Only */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Icon Only (Compact Use)</Text>
          
          <View style={styles.logoContainer}>
            <Text style={styles.logoLabel}>Icon Size</Text>
            <Logo size="icon" />
          </View>
        </View>

        {/* Brand Guidelines */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Brand Personality</Text>
          <Text style={styles.brandText}>
            ✓ Trustworthy & Natural - Simple leaf suggests organic growth{'\n'}
            ✓ Calming & Gentle - Warm sage green promotes tranquility{'\n'}
            ✓ Approachable & Human - Semibold typography feels like a companion{'\n'}
            ✓ Private & Safe - Minimal design respects personal space{'\n'}
            ✓ Inviting Reflection - Clean aesthetic encourages mindfulness{'\n'}
            ✓ Scalable & Flexible - Works beautifully at any size
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  scrollContent: {
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Spacing['2xl'],
    paddingBottom: Spacing['8xl'],
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.tertiary,
    textAlign: 'center',
    marginBottom: Spacing['4xl'],
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  section: {
    marginBottom: Spacing['4xl'],
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
  },
  logoContainer: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  logoLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
    fontWeight: Typography.fontWeight.medium as any,
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  brandText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
    backgroundColor: Colors.secondary[50],
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.secondary[400],
  },
});