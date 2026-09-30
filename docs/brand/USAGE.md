# NagarVaani logo kit

Concept: a speech bubble (citizen voice) holding a city skyline with a broadcast tower (the city's voice reaching policymakers).
Colours: Indigo #6366F1 -> Violet #8B5CF6 gradient, Amber #F59E0B accent, Ink #0F172A, Night #0A0A0F.
Type: Outfit Bold (Latin) + Noto Sans Devanagari Bold (नगरवाणी). Both SIL Open Font License; all text is converted to outlines, no fonts needed to use the files.

## Folders
- svg/  master vector files (logo light/dark, tagline, mark, mono black/white, icon, favicon, maskable, OG)
- png/  presentation-ready PNGs (logo light/dark, icon 1024, mark 1024)
- web/  drop into your app's public/ folder: icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png, favicon.ico, favicon.svg, favicon-16/32/48.png, og-image.png (1200x630)

## Use in the app (public/ folder)
Copy everything in web/ to public/, replacing the corrupt icon-192.png and icon-512.png.

index.html <head>:
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <link rel="icon" href="/favicon.ico" sizes="48x48" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta property="og:image" content="https://nagarvaani-636001394004.asia-south1.run.app/og-image.png" />
  <meta name="twitter:card" content="summary_large_image" />

manifest.json icons:
  { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
  { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
  { "src": "/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }

## Rules
- Minimum size of the full mark: 24 px; below that use favicon.svg (simplified).
- Keep clear space equal to the height of the tallest building around the logo.
- On dark backgrounds use logo-dark; on white/light use logo-light; single-colour print use mark-black or mark-white.
- Do not recolour the amber dot, stretch, or add effects.
