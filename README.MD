# Respiratory Viruses Weekly Data Dashboard

A fully automated public health data platform that aggregates respiratory virus surveillance data for Italy from multiple sources and presents it through a clean, accessible web interface.

## Overview

This project fetches, validates, and visualizes weekly respiratory virus data from:
- **ECDC ERVISS**: European respiratory virus surveillance for influenza, RSV, and SARS-CoV-2 (Italy focus)

The system runs automatically every Tuesday morning, updating the website with the latest data.

## Features

- ✅ Main visualizations:
  - National influenza positivity rate (weekly)
  - National RSV detections/positivity (weekly)
  - SARS-CoV-2 surveillance data (weekly)
- ✅ Fully automated weekly data refresh via GitHub Actions
- ✅ Machine-readable JSONL exports
- ✅ Clear data provenance and licensing
- ✅ Stale data detection and user notification
- ✅ Zero server infrastructure (GitHub Pages)

## Project Structure

```
.
├── data/                      # JSONL outputs (served by the website)
├── etl/                       # Python ETL scripts
│   └── fetch_and_build.py    # Main data processing pipeline
├── tests/                     # Data validation tests
│   └── test_schemas.py       # Schema validation for JSONL files
├── web/                       # Next.js static site
│   ├── pages/                # Site pages (home, methods, download)
│   ├── components/           # React components for charts
│   └── public/               # Static assets and data
└── .github/
    └── workflows/
        └── update.yml        # Weekly automation workflow
```

## Data Schema

### ECDC Weekly Data (`data/ecdc_weekly.jsonl`)

```json
{
  "source": "ECDC",
  "iso_week": "2025-W37",
  "country": "IT",
  "pathogen": "influenza",
  "metric": "positivity_rate",
  "value": 4.5
}
```

**Fields:**
- `source`: Always "ECDC"
- `iso_week`: ISO week format (YYYY-Www)
- `country`: Always "IT" (Italy)
- `pathogen`: One of "influenza", "RSV", "SARS-CoV-2"
- `metric`: One of "positivity_rate", "cases", "tests"
- `value`: Numeric value

## Running Locally

### ETL Pipeline

**Requirements**: Python 3.11+

```bash
# Generate mock data for testing
python etl/fetch_and_build.py --mock

# Fetch real data (uses default ECDC GitHub URL)
python etl/fetch_and_build.py --real

# Or override with custom URL
export ECDC_CSV_URL="https://raw.githubusercontent.com/EU-ECDC/Respiratory_viruses_weekly_data/main/data/sentinelTestsDetectionsPositivity.csv"
python etl/fetch_and_build.py --real
```

### Data Validation

```bash
# Run schema validation tests
python -m pytest tests/test_schemas.py
```

### Website

**Requirements**: Node.js 20+

```bash
cd web
npm install
npm run dev          # Development server
npm run build        # Production build
npm run export       # Static export for GitHub Pages
```

## Automated Deployment

The system runs automatically on a schedule:
- **Trigger**: Every Tuesday at 07:15 UTC (08:15 CET / 09:15 CEST)
- **Actions**:
  1. Fetch latest CSV from ECDC GitHub repository
  2. Validate schema and transform to JSONL
  3. Commit changes if data has updated
  4. Build and deploy static site to GitHub Pages
  5. Set stale flag if source data is unavailable

Manual trigger is also available via GitHub Actions UI.

## Data Sources and Licensing

### ECDC ERVISS
- **Source**: European Centre for Disease Prevention and Control
- **URL**: https://erviss.org/
- **Data Repository**: https://github.com/EU-ECDC/Respiratory_viruses_weekly_data
- **License**: EUPL-1.2 (European Union Public License)
- **Attribution**: European Centre for Disease Prevention and Control (ECDC)

## Configuration

The ETL uses the default ECDC data source URL from their official GitHub repository:

- **ECDC URL**: `https://raw.githubusercontent.com/EU-ECDC/Respiratory_viruses_weekly_data/main/data/sentinelTestsDetectionsPositivity.csv`

Optional configuration via GitHub Secrets (to override default):
- `ECDC_CSV_URL`: Custom ECDC data source URL

**Schedule**: Every Tuesday at 07:15 UTC (08:15 CET / 09:15 CEST)

## Error Handling

- **Schema drift**: ETL fails loudly if expected columns are missing
- **Source unavailable**: Previous data retained, stale banner displayed
- **Parse errors**: Non-zero exit code, no deploy occurs
- **Validation failures**: Test suite catches invalid data before publish

## Accessibility

- Keyboard navigable charts
- WCAG 2.1 AA color contrast compliance
- Semantic HTML structure
- Performance-optimized (< 200KB JS bundle)

## Maintenance

This project is designed for single-maintainer sustainability:
- No backend infrastructure
- Standard library Python (minimal dependencies)
- Static site generation
- Automated weekly updates
- Clear failure modes

## Future Enhancements (v1.1+)

- Regional influenza breakdown
- WHO FluNet subtype split for influenza A
- Season selector for historical comparison
- Additional pathogens as data becomes available

## General Data Considerations

Please visit https://erviss.org/ for detailed descriptions of the underlying data (see 'Methods' in the footer).

All data are subject to continuous verification and may change based on retrospective updates to accurately reflect trends, changes in national case definitions, and/or reporting practices. Caution should be used when comparing published data longitudinally.

Case definitions, testing strategies, reporting practices, and lag times differ between countries. These factors influence the data presented and may lead to misinterpretation.

## Contributing

This is a single-maintainer project. For data issues or questions, please open an issue with:
- Clear description of the problem
- Source URL and date range affected
- Expected vs actual behavior

## License

Code: MIT License
Data: Subject to ECDC EUPL-1.2 license

---

**Last Updated**: October 2025
**Maintainer**: Public Health Data Initiative
