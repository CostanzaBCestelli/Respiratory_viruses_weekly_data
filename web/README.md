# Respiratory Virus Dashboard - Frontend

A beautiful, accessible web dashboard for visualizing respiratory virus surveillance data for Italy.

## Features

- 📊 **Three Interactive Charts**: Influenza, RSV, and SARS-CoV-2 positivity rates
- 📱 **Fully Responsive**: Works on desktop, tablet, and mobile
- ♿ **Accessible**: WCAG 2.1 AA compliant
- 🎨 **Modern UI**: Clean design with Chart.js visualizations
- 📦 **Static Export**: Deploys to GitHub Pages (no server needed)

## Tech Stack

- **Framework**: Next.js 14 (React 18)
- **Language**: TypeScript
- **Charts**: Chart.js + react-chartjs-2
- **Styling**: CSS Modules + Global Styles

## Prerequisites

You need Node.js 18 or higher installed. Download from [nodejs.org](https://nodejs.org/)

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000 in your browser
```

## Available Scripts

```bash
# Development server with hot reload
npm run dev

# Production build
npm run build

# Start production server (after build)
npm start

# Build and export static site for GitHub Pages
npm run export
```

## Data Requirements

The app expects data files in `public/data/`:

- `ecdc_weekly.jsonl` - ECDC respiratory virus data

To copy the latest data from the ETL:

```bash
# From the project root
cp ../data/ecdc_weekly.jsonl public/data/
```

## Project Structure

```
web/
├── components/
│   ├── Banner.tsx          # Alert banner component
│   ├── Layout.tsx          # Page layout with header/footer
│   └── WeeklyLineChart.tsx # Chart.js wrapper component
├── pages/
│   ├── _app.tsx            # App initialization
│   ├── _document.tsx       # HTML document structure
│   ├── index.tsx           # Homepage with charts
│   ├── methods.tsx         # Data methodology page
│   └── download.tsx        # Data download page
├── public/
│   └── data/
│       └── ecdc_weekly.jsonl
├── styles/
│   └── globals.css         # Global styles
└── package.json
```

## Static Export for GitHub Pages

The dashboard can be exported as a static site:

```bash
npm run export
```

This creates an `out/` directory that can be deployed to GitHub Pages, Netlify, Vercel, or any static hosting service.

## Deployment

### GitHub Pages (Automated)

The GitHub Actions workflow (`.github/workflows/update_data.yml`) automatically:
1. Fetches latest data every Tuesday
2. Builds the static site
3. Deploys to GitHub Pages

### Manual Deployment

```bash
# Build static site
npm run export

# Deploy the 'out/' directory to your hosting service
```

## Customization

### Colors

Chart colors are defined in `pages/index.tsx`:
- Influenza: `rgb(75, 192, 192)` (teal)
- RSV: `rgb(255, 99, 132)` (red)
- SARS-CoV-2: `rgb(53, 162, 235)` (blue)

### Time Range

Default is last 52 weeks. Adjust in `pages/index.tsx`:

```typescript
.slice(-52)  // Change to -26 for 6 months, -104 for 2 years, etc.
```

## Accessibility

- Semantic HTML structure
- Keyboard navigable
- ARIA labels on interactive elements
- Color contrast WCAG AA compliant
- Screen reader friendly

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile: iOS Safari, Chrome Android

## License

MIT License - See LICENSE file for details

---

**Last Updated**: October 2025

