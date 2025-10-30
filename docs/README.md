# OWNLY Legal Documents

This folder contains the public-facing legal documents for the OWNLY app, hosted via GitHub Pages.

## Files

- **index.html** - Privacy Policy (main page)
- **terms.html** - Terms of Service

## GitHub Pages Setup

To host these documents publicly:

1. Go to your GitHub repository settings
2. Navigate to **Pages** section
3. Under "Source", select:
   - Branch: `main`
   - Folder: `/docs`
4. Click Save

Your documents will be available at:
- Privacy Policy: `https://[your-username].github.io/OWNLY/`
- Terms of Service: `https://[your-username].github.io/OWNLY/terms.html`

## Usage in App Store Connect

Once GitHub Pages is enabled, add these URLs to:

1. **App Store Connect**:
   - Privacy Policy URL field (required)
   - Support URL field (optional, can use privacy URL)

2. **Your .env file**:
   ```
   EXPO_PUBLIC_PRIVACY_POLICY_URL=https://[your-username].github.io/OWNLY/
   EXPO_PUBLIC_TERMS_URL=https://[your-username].github.io/OWNLY/terms.html
   ```

3. **In-app links** (if needed):
   - Settings screen can link to these URLs
   - Paywall can link to Terms of Service

## Updating Documents

To update these legal documents:

1. Edit the HTML files in this directory
2. Commit and push changes to GitHub
3. GitHub Pages will automatically update within a few minutes

## Local Testing

To preview these documents locally:
```bash
open docs/index.html
open docs/terms.html
```
