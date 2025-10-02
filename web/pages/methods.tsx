/**
 * Methods Page
 * Explains data sources, indicators, and caveats
 */

import Head from 'next/head'
import Layout from '@/components/Layout'

export default function Methods() {
  return (
    <Layout>
      <Head>
        <title>Methods & Caveats - Respiratory Virus Surveillance</title>
      </Head>

      <h2>Methods and Data Sources</h2>

      <section>
        <h3>Overview</h3>
        <p>
          This website presents weekly respiratory virus surveillance data for Italy, aggregating
          information from multiple authoritative public health sources. The data is automatically
          refreshed every Tuesday at 07:15 Europe/Rome time via an automated pipeline.
        </p>
      </section>

      <section>
        <h3>Data Sources</h3>

        <h4>ECDC ERVISS (European Respiratory Virus Surveillance System)</h4>
        <p>
          <strong>Source:</strong> European Centre for Disease Prevention and Control (ECDC)<br />
          <strong>URL:</strong>{' '}
          <a href="https://erviss.org/" target="_blank" rel="noopener noreferrer">
            https://erviss.org/
          </a>
        </p>
        <p>
          ERVISS provides weekly aggregated data on respiratory virus detections and positivity rates
          from sentinel and non-sentinel surveillance systems across European countries. Data includes:
        </p>
        <ul>
          <li>Influenza virus detections and positivity rates</li>
          <li>RSV (Respiratory Syncytial Virus) detections and positivity rates</li>
          <li>SARS-CoV-2 detections and positivity rates (when available)</li>
          <li>Testing volumes and specimen types</li>
        </ul>
        <p>
          This dashboard filters ERVISS data to Italy (country code: IT) and presents the most recent
          52 weeks of surveillance data.
        </p>

        <h4>Protezione Civile - Italian COVID-19 Data</h4>
        <p>
          <strong>Source:</strong> Dipartimento della Protezione Civile - Presidenza del Consiglio dei Ministri<br />
          <strong>License:</strong> CC-BY-4.0
        </p>
        <p>
          The Italian Civil Protection Department publishes daily COVID-19 case data at the regional level.
          Our pipeline aggregates daily case counts (<code>nuovi_positivi</code>) to ISO week format
          to enable weekly trend analysis consistent with other respiratory virus indicators.
        </p>
      </section>

      <section>
        <h3>Indicators and Definitions</h3>

        <h4>Influenza Positivity Rate</h4>
        <p>
          The percentage of respiratory specimens tested that are positive for influenza virus. This metric
          reflects both testing volume and disease prevalence. Rising positivity rates typically indicate
          increasing influenza activity.
        </p>

        <h4>RSV Cases/Detections</h4>
        <p>
          The absolute number of laboratory-confirmed RSV detections reported weekly. RSV primarily affects
          young children and older adults, with seasonal peaks typically in winter months.
        </p>

        <h4>COVID-19 Regional Cases</h4>
        <p>
          The sum of daily new COVID-19 cases (<code>nuovi_positivi</code>) aggregated by ISO week.
          The dashboard presents national totals (sum across all Italian regions) to provide a weekly
          trend view. Regional breakdowns may be added in future versions.
        </p>
      </section>

      <section>
        <h3>Data Processing Pipeline</h3>

        <h4>ISO Week Calculation</h4>
        <p>
          All temporal data is standardized to ISO 8601 week format (<code>YYYY-Www</code>), where weeks
          run from Monday to Sunday and the first week of the year contains the first Thursday. This
          standardization enables consistent comparison across different surveillance systems.
        </p>

        <h4>Data Validation</h4>
        <p>
          The ETL pipeline performs the following validation steps:
        </p>
        <ul>
          <li>Verify presence of required columns in source CSV files</li>
          <li>Parse and validate date formats</li>
          <li>Ensure numeric fields are finite and non-negative</li>
          <li>Filter positivity rates to 0-100% range</li>
          <li>Reject records with missing or invalid data</li>
        </ul>
        <p>
          If source CSV schemas change unexpectedly, the pipeline fails with a clear error message rather
          than producing incorrect output.
        </p>

        <h4>Change Detection</h4>
        <p>
          Before writing output files, the pipeline computes a content hash to detect changes. If data
          is unchanged from the previous run, files are not rewritten, and the website is not redeployed.
          This minimizes unnecessary builds and preserves bandwidth.
        </p>
      </section>

      <section>
        <h3>Important Caveats</h3>

        <div className="warning-box">
          <h4>Cross-Source Comparability</h4>
          <p>
            <strong>Do not directly compare absolute case counts across pathogens.</strong> Different
            surveillance systems have different testing strategies, population coverage, and reporting
            practices:
          </p>
          <ul>
            <li>ECDC data represents sentinel surveillance networks with varying geographic coverage</li>
            <li>COVID-19 data represents comprehensive national reporting</li>
            <li>Testing volumes vary by pathogen, season, and public health priorities</li>
          </ul>
        </div>

        <h4>Reporting Delays</h4>
        <p>
          Source data may be published with delays of 1-2 weeks after the surveillance week ends. The
          most recent weeks displayed may be subject to retrospective updates as data is validated and
          finalized.
        </p>

        <h4>Retrospective Updates</h4>
        <p>
          All data are subject to continuous verification and may change based on:
        </p>
        <ul>
          <li>Late reporting from regional or local surveillance systems</li>
          <li>Corrections to case definitions or diagnostic criteria</li>
          <li>Quality control reviews by source agencies</li>
        </ul>
        <p>
          Historical trend shapes are generally stable, but individual week values may be revised.
        </p>

        <h4>Seasonal Comparisons</h4>
        <p>
          When comparing data across multiple years or seasons:
        </p>
        <ul>
          <li>Testing volumes and practices may have changed</li>
          <li>Population immunity levels vary by pathogen and season</li>
          <li>Public health interventions (e.g., COVID-19 measures) may affect other respiratory viruses</li>
        </ul>
      </section>

      <section>
        <h3>Data Freshness and Stale Indicators</h3>
        <p>
          If the automated pipeline cannot reach source URLs or encounters schema changes, it preserves
          the previous data files and sets a "stale" flag. A yellow banner will appear on the homepage
          indicating when data was last successfully updated. This ensures the site remains available
          even if upstream sources are temporarily unavailable.
        </p>
      </section>

      <section>
        <h3>Technical Implementation</h3>
        <p>
          This dashboard is built as a fully static website with zero server infrastructure:
        </p>
        <ul>
          <li><strong>ETL:</strong> Python 3.11 (standard library only)</li>
          <li><strong>Frontend:</strong> Next.js 14 static export with Chart.js</li>
          <li><strong>Automation:</strong> GitHub Actions scheduled workflow</li>
          <li><strong>Hosting:</strong> GitHub Pages</li>
        </ul>
        <p>
          The complete source code, including ETL scripts and validation tests, is available in the
          project repository. Machine-readable JSONL exports are available on the{' '}
          <a href="/download">Download</a> page.
        </p>
      </section>

      <section>
        <h3>Attribution and Licensing</h3>
        <p>
          <strong>ECDC ERVISS data:</strong> © European Centre for Disease Prevention and Control.
          Data subject to ECDC terms of use. Visit{' '}
          <a href="https://erviss.org/" target="_blank" rel="noopener noreferrer">
            erviss.org
          </a>{' '}
          for source documentation.
        </p>
        <p>
          <strong>Protezione Civile COVID-19 data:</strong> Dati forniti dal Dipartimento della
          Protezione Civile. Licensed under CC-BY-4.0.
        </p>
        <p>
          <strong>Website code:</strong> MIT License. Free to reuse with attribution.
        </p>
      </section>

      <section>
        <h3>Contact and Feedback</h3>
        <p>
          For questions about methodology, data issues, or feature requests, please open an issue
          in the project repository or contact the maintainer via the repository's contact information.
        </p>
      </section>
    </Layout>
  )
}


