// OWNLY Design System
// A warm, wellness-focused color palette with professional feel

export const Colors = {
  // Primary Brand Colors - Soft Purple (Mindfulness & Balance)
  primary: {
    50: '#F5F3FF',   // Very light purple background
    100: '#EDE9FE',  // Light purple tints
    200: '#DDD6FE',  // Subtle purple accents
    300: '#C4B5FD',  // Medium purple highlights
    400: '#A78BFA',  // Active purple states
    500: '#8B5CF6',  // Main brand purple
    600: '#7C3AED',  // Darker purple interactions
    700: '#6D28D9',  // Deep purple emphasis
    800: '#5B21B6',  // Very dark purple
    900: '#4C1D95',  // Darkest purple
  },

  // Secondary Colors - Sage Green (Growth & Healing)
  secondary: {
    50: '#F0FDF4',   // Very light sage
    100: '#DCFCE7',  // Light sage tints
    200: '#BBF7D0',  // Subtle sage accents
    300: '#86EFAC',  // Medium sage highlights
    400: '#4ADE80',  // Active sage states
    500: '#22C55E',  // Main sage green
    600: '#16A34A',  // Darker sage interactions
    700: '#15803D',  // Deep sage emphasis
    800: '#166534',  // Very dark sage
    900: '#14532D',  // Darkest sage
  },

  // Accent Colors - Warm Ocean Blue (Calm & Trust)
  accent: {
    50: '#F0F9FF',   // Very light blue
    100: '#E0F2FE',  // Light blue tints
    200: '#BAE6FD',  // Subtle blue accents
    300: '#7DD3FC',  // Medium blue highlights
    400: '#38BDF8',  // Active blue states
    500: '#0EA5E9',  // Main ocean blue
    600: '#0284C7',  // Darker blue interactions
    700: '#0369A1',  // Deep blue emphasis
    800: '#075985',  // Very dark blue
    900: '#0C4A6E',  // Darkest blue
  },

  // Neutral Colors - Warm Grays
  neutral: {
    50: '#FAFAF9',   // Almost white with warm undertone
    100: '#F5F5F4',  // Very light warm gray
    200: '#E7E5E4',  // Light warm gray
    300: '#D6D3D1',  // Medium light gray
    400: '#A8A29E',  // Medium gray
    500: '#78716C',  // Main text gray
    600: '#57534E',  // Dark text gray
    700: '#44403C',  // Very dark gray
    800: '#292524',  // Almost black
    900: '#1C1917',  // True black
  },

  // Semantic Colors
  success: '#22C55E',    // Sage green
  warning: '#F59E0B',    // Warm amber
  error: '#EF4444',      // Soft red
  info: '#0EA5E9',       // Ocean blue

  // Background Colors
  background: {
    primary: '#FAFAF9',   // Main app background
    secondary: '#FFFFFF', // Card backgrounds
    tertiary: '#F5F5F4',  // Subtle section backgrounds
  },

  // Text Colors
  text: {
    primary: '#1C1917',   // Main headings
    secondary: '#44403C', // Body text
    tertiary: '#78716C',  // Subtle text
    inverse: '#FFFFFF',   // White text on dark backgrounds
  },

  // Interactive States
  interactive: {
    hover: 'rgba(139, 92, 246, 0.1)',     // Purple with 10% opacity
    pressed: 'rgba(139, 92, 246, 0.2)',   // Purple with 20% opacity
    disabled: 'rgba(120, 113, 108, 0.4)', // Gray with 40% opacity
    focus: 'rgba(139, 92, 246, 0.3)',     // Purple with 30% opacity
  },

  // Shadow Colors
  shadow: {
    light: 'rgba(28, 25, 23, 0.04)',      // Very subtle
    medium: 'rgba(28, 25, 23, 0.08)',     // Standard cards
    heavy: 'rgba(28, 25, 23, 0.12)',      // Elevated elements
    colored: 'rgba(139, 92, 246, 0.15)',  // Purple shadow for special elements
  },
};

// Dark Mode Colors
export const DarkColors = {
  ...Colors,
  
  // Override backgrounds for dark mode
  background: {
    primary: '#0F0F0F',   // Main app background (very dark)
    secondary: '#1A1A1A', // Card backgrounds (slightly lighter)
    tertiary: '#262626',  // Subtle section backgrounds
  },

  // Override text colors for dark mode
  text: {
    primary: '#FFFFFF',   // Main headings (white)
    secondary: '#E5E5E5', // Body text (light gray)
    tertiary: '#A3A3A3',  // Subtle text (medium gray)
    inverse: '#1C1917',   // Dark text on light backgrounds
  },

  // Override interactive states for dark mode
  interactive: {
    hover: 'rgba(139, 92, 246, 0.15)',     // Slightly more visible in dark
    pressed: 'rgba(139, 92, 246, 0.25)',   // More visible pressed state
    disabled: 'rgba(163, 163, 163, 0.3)',  // Lighter disabled state
    focus: 'rgba(139, 92, 246, 0.4)',      // More visible focus
  },

  // Override shadow colors for dark mode
  shadow: {
    light: 'rgba(0, 0, 0, 0.2)',          // More visible shadows in dark
    medium: 'rgba(0, 0, 0, 0.3)',         // Standard cards
    heavy: 'rgba(0, 0, 0, 0.4)',          // Elevated elements
    colored: 'rgba(139, 92, 246, 0.2)',   // Purple shadow
  },
};

// Function to get colors based on theme
export const getColors = (isDark: boolean) => isDark ? DarkColors : Colors;

export const Typography = {
  // Font Families (using system fonts for better performance)
  fontFamily: {
    primary: {
      ios: 'SF Pro Display',
      android: 'Roboto',
      web: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    secondary: {
      ios: 'SF Pro Text',
      android: 'Roboto',
      web: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    mono: {
      ios: 'SF Mono',
      android: 'Roboto Mono',
      web: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
    }
  },

  // Font Sizes
  fontSize: {
    xs: 12,    // Small labels, captions
    sm: 14,    // Secondary text, metadata
    base: 16,  // Body text, standard size
    lg: 18,    // Emphasis text, section headers
    xl: 20,    // Page subtitles
    '2xl': 24, // Small headings
    '3xl': 28, // Medium headings
    '4xl': 32, // Large headings
    '5xl': 36, // Display text
    '6xl': 40, // Hero text
  },

  // Font Weights
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },

  // Line Heights
  lineHeight: {
    none: 1,
    tight: 1.2,
    snug: 1.3,
    normal: 1.4,
    relaxed: 1.5,
    loose: 1.75,
  },

  // Letter Spacing
  letterSpacing: {
    tighter: -0.5,
    tight: -0.25,
    normal: 0,
    wide: 0.25,
    wider: 0.5,
    widest: 1,
  },
};

export const Spacing = {
  // Base spacing unit (4px grid system)
  unit: 4,
  
  // Spacing scale
  xs: 4,     // 4px
  sm: 8,     // 8px  
  md: 12,    // 12px
  base: 16,  // 16px (most common)
  lg: 20,    // 20px
  xl: 24,    // 24px
  '2xl': 32, // 32px
  '3xl': 40, // 40px
  '4xl': 48, // 48px
  '5xl': 56, // 56px
  '6xl': 64, // 64px
  '7xl': 72, // 72px
  '8xl': 80, // 80px
};

export const BorderRadius = {
  none: 0,
  xs: 2,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 999, // Fully rounded
};

export const Shadows = {
  // Card shadows
  card: {
    shadowColor: Colors.shadow.medium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },

  // Button shadows
  button: {
    shadowColor: Colors.shadow.light,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },

  // Floating element shadows
  floating: {
    shadowColor: Colors.shadow.heavy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  },

  // Brand element shadows (with color)
  brand: {
    shadowColor: Colors.shadow.colored,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 4,
  },
};

export const Layout = {
  // Screen padding
  screenPadding: Spacing['2xl'],
  
  // Card padding
  cardPadding: Spacing.lg,
  
  // Section spacing
  sectionSpacing: Spacing['3xl'],
  
  // Element spacing
  elementSpacing: Spacing.base,
  
  // Compact spacing
  compactSpacing: Spacing.sm,
};

// Logo styling
export const Logo = {
  colors: {
    primary: Colors.primary[600],
    gradient: [Colors.primary[500], Colors.accent[500]], // Purple to blue gradient
    light: Colors.primary[300],
    dark: Colors.primary[800],
  },
  fontSize: {
    small: Typography.fontSize['2xl'],   // 24px for smaller spaces
    medium: Typography.fontSize['4xl'],  // 32px for headers
    large: Typography.fontSize['5xl'],   // 36px for splash/hero
  },
  fontWeight: Typography.fontWeight.bold,
  letterSpacing: Typography.letterSpacing.wide,
};