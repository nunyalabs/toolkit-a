# Hypertension Research Toolkit (PWA)

Offline-first, modular data collection toolkit with participant screening, IDI/FGD interviews, audio recording, and embedded guides. Includes theming (5 palettes with light/dark), PWA support, and CI deploy to GitHub Pages.

## Live site

After CI runs: https://nunyalabs.github.io/toolkit-a/

## Development

- Source: index.html, style.css, js/*, sw.js, manifest.json
- PWA: Service worker + manifest; relative paths for GitHub Pages
- Theming: Theme dropdown (5 themes) + light/dark mode persisted in localStorage
- Audio: WAV download with conversion from other formats

## Deployment

- GitHub Actions workflow: `.github/workflows/deploy.yml`
- Builds to `dist/`, minifies CSS/JS/HTML (excludes sw.js, app.js, manifest.json)
- Deploys to `gh-pages` branch with SPA fallback (404.html)

