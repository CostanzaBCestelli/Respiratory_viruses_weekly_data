/**
 * Download Page
 * Provides links to machine-readable JSONL data files
 */

import Head from 'next/head'
import Layout from '@/components/Layout'

export default function Download() {
  return (
    <Layout>
      <Head>
        <title>Download Data - Respiratory Virus Surveillance</title>
      </Head>

      <h2>Download Data</h2>

      <section>
        <p>
          All processed data is available in JSONL (JSON Lines) format for programmatic access.
          Each file contains one JSON object per line, making it easy to stream and process
          large datasets.
        </p>
      </section>

      <section>
        <h3>Available Datasets</h3>

        <div className="chart-container">
          <h4>ECDC Weekly Data</h4>
          <p>
            Weekly respiratory virus surveillance data from ECDC ERVISS, filtered to Italy.
            Includes influenza, RSV, and SARS-CoV-2 positivity rates, cases, and test volumes.
          </p>
          <a href="/data/ecdc_weekly.jsonl" download className="download-link">
            Download ecdc_weekly.jsonl
          </a>
          <p>
            <strong>Schema:</strong>
          </p>
          <pre>
            <code>
{`{
  "source": "ECDC",
  "iso_week": "2025-W37",
  "country": "IT",
  "pathogen": "influenza",
  "metric": "positivity_rate",
  "value": 4.5
}`}
            </code>
          </pre>
          <p>
            <strong>Fields:</strong>
          </p>
          <ul>
            <li><code>source</code>: Always "ECDC"</li>
            <li><code>iso_week</code>: ISO 8601 week (YYYY-Www)</li>
            <li><code>country</code>: Always "IT" (Italy)</li>
            <li><code>pathogen</code>: One of: influenza, RSV, SARS-CoV-2</li>
            <li><code>metric</code>: One of: positivity_rate, cases, tests</li>
            <li><code>value</code>: Numeric value (non-negative)</li>
          </ul>
        </div>

        <div className="chart-container">
          <h4>Protezione Civile COVID Regional Weekly Data</h4>
          <p>
            COVID-19 cases aggregated by region and ISO week from Italian Civil Protection daily data.
          </p>
          <a href="/data/pc_covid_region_weekly.jsonl" download className="download-link">
            Download pc_covid_region_weekly.jsonl
          </a>
          <p>
            <strong>Schema:</strong>
          </p>
          <pre>
            <code>
{`{
  "source": "PC",
  "iso_week": "2025-W37",
  "region_code": "LIG",
  "metric": "cases",
  "value": 128
}`}
            </code>
          </pre>
          <p>
            <strong>Fields:</strong>
          </p>
          <ul>
            <li><code>source</code>: Always "PC" (Protezione Civile)</li>
            <li><code>iso_week</code>: ISO 8601 week (YYYY-Www)</li>
            <li><code>region_code</code>: Italian region code (2-3 letters, uppercase)</li>
            <li><code>metric</code>: Always "cases"</li>
            <li><code>value</code>: Total cases for that region and week</li>
          </ul>
        </div>
      </section>

      <section>
        <h3>Usage Examples</h3>

        <h4>Python</h4>
        <pre>
          <code>
{`import json
import urllib.request

# Load ECDC data
url = 'https://your-github-pages-url/data/ecdc_weekly.jsonl'
with urllib.request.urlopen(url) as response:
    for line in response:
        record = json.loads(line)
        print(record)
`}
          </code>
        </pre>

        <h4>JavaScript/Node.js</h4>
        <pre>
          <code>
{`const fs = require('fs');
const readline = require('readline');

const fileStream = fs.createReadStream('ecdc_weekly.jsonl');
const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity
});

for await (const line of rl) {
  const record = JSON.parse(line);
  console.log(record);
}
`}
          </code>
        </pre>

        <h4>R</h4>
        <pre>
          <code>
{`library(jsonlite)

# Load ECDC data
url <- "https://your-github-pages-url/data/ecdc_weekly.jsonl"
data <- stream_in(file(url))
print(head(data))
`}
          </code>
        </pre>
      </section>

      <section>
        <h3>Update Frequency</h3>
        <p>
          Data files are automatically refreshed every Tuesday at 07:15 Europe/Rome time.
          If source data is unchanged, files are not rewritten. You can check the
          <code>/status.json</code> file for the last successful update timestamp.
        </p>
      </section>

      <section>
        <h3>Licensing</h3>
        <div className="info-box">
          <p>
            <strong>ECDC data:</strong> Subject to ECDC terms of use. Please attribute the
            European Centre for Disease Prevention and Control as the data source.
          </p>
          <p>
            <strong>Protezione Civile data:</strong> CC-BY-4.0. Please attribute:
            "Dati forniti dal Dipartimento della Protezione Civile"
          </p>
          <p>
            When using this data, please also cite this dashboard as an intermediary processor
            and link back to this website.
          </p>
        </div>
      </section>

      <section>
        <h3>API Stability</h3>
        <p>
          The JSONL schemas documented above are considered stable for v1.x of this project.
          We will not make breaking changes to field names or types without incrementing the
          major version. Additional optional fields may be added in minor versions.
        </p>
        <p>
          File URLs (<code>/data/ecdc_weekly.jsonl</code>, <code>/data/pc_covid_region_weekly.jsonl</code>)
          will remain stable.
        </p>
      </section>
    </Layout>
  )
}


