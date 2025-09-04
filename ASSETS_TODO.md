# Assets That Need OWNLY Branding

The following asset files currently contain placeholder/template content and need to be replaced with proper OWNLY branded assets before TestFlight submission:

## Required Asset Replacements:

1. **`assets/images/icon.png`** - Main app icon (1024x1024px)
   - Currently: Generic template icon
   - Needs: OWNLY branded app icon

2. **`assets/images/adaptive-icon.png`** - Android adaptive icon foreground (1024x1024px)
   - Currently: Same as main icon
   - Needs: OWNLY branded adaptive icon

3. **`assets/images/splash-icon.png`** - Splash screen icon (200px width as configured)
   - Currently: Same as main icon
   - Needs: OWNLY logo for splash screen

4. **`assets/images/favicon.png`** - Web favicon (32x32px)
   - Currently: Template favicon
   - Needs: Small OWNLY icon/logo

## Design Guidelines:

- **Brand Colors**: Use colors from `constants/Design.ts` (primary blues, etc.)
- **Style**: Clean, minimal, mood-focused design
- **Icon**: Consider mood/emotion related imagery (heart, face, journal, etc.)
- **Consistency**: Maintain visual consistency across all sizes

## Asset Specifications:

- **App Icon**: 1024x1024px, PNG, no transparency for iOS
- **Adaptive Icon**: 1024x1024px, PNG, with transparency for Android
- **Splash Icon**: Any size (will be resized to 200px width)
- **Favicon**: 32x32px, PNG

## Current Status:
❌ **BLOCKING TESTFLIGHT**: All assets are currently template placeholders and must be replaced before App Store submission.

## Next Steps:
1. Design OWNLY logo and app icon
2. Create all required asset sizes
3. Replace placeholder files
4. Test on both iOS and Android
5. Verify assets display correctly in all contexts