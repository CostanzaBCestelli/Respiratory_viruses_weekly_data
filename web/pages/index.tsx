/**
 * Home Page - Overview Dashboard
 * Displays three main charts: influenza positivity, RSV detections, COVID regional cases
 */

import { GetStaticProps } from 'next'
import Head from 'next/head'
import Layout from '@/components/Layout'
import Banner from '@/components/Banner'
import WeeklyLineChart from '@/components/WeeklyLineChart'
import fs from 'fs'
import path from 'path'

interface ECDCRecord {
  source: string
  iso_week: string
  country: string
  pathogen: string
  metric: string
  value: number
}

interface HomeProps {
  influenzaData: {
    labels: string[]
    datasets: Array<{
      label: string
      data: number[]
      borderColor: string
      backgroundColor: string
    }>
  }
  rsvData: {
    labels: string[]
    datasets: Array<{
      label: string
      data: number[]
      borderColor: string
      backgroundColor: string
    }>
  }
  sarsCov2Data: {
    labels: string[]
    datasets: Array<{
      label: string
      data: number[]
      borderColor: string
      backgroundColor: string
    }>
  }
  lastUpdate: string | null
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const publicDir = path.join(process.cwd(), 'public')
  const dataDir = path.join(publicDir, 'data')

  let ecdcRecords: ECDCRecord[] = []
  let lastUpdate: string | null = null

  // Load ECDC data
  try {
    const ecdcPath = path.join(dataDir, 'ecdc_weekly.jsonl')
    const ecdcContent = fs.readFileSync(ecdcPath, 'utf-8')
    ecdcRecords = ecdcContent
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line))
    
    // Set last update to current time if we have data
    if (ecdcRecords.length > 0) {
      lastUpdate = new Date().toISOString()
    }
  } catch (error) {
    console.warn('Could not load ECDC data:', error)
  }

  // Process influenza positivity rate (last 52 weeks)
  const influenzaRecords = ecdcRecords
    .filter(r => r.pathogen === 'influenza' && r.metric === 'positivity_rate')
    .sort((a, b) => a.iso_week.localeCompare(b.iso_week))
    .slice(-52)

  const influenzaData = {
    labels: influenzaRecords.map(r => r.iso_week),
    datasets: [
      {
        label: 'Influenza Positivity Rate (%)',
        data: influenzaRecords.map(r => r.value),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
    ],
  }

  // Process RSV cases (last 52 weeks)
  const rsvRecords = ecdcRecords
    .filter(r => r.pathogen === 'RSV' && r.metric === 'cases')
    .sort((a, b) => a.iso_week.localeCompare(b.iso_week))
    .slice(-52)

  const rsvData = {
    labels: rsvRecords.map(r => r.iso_week),
    datasets: [
      {
        label: 'RSV Cases',
        data: rsvRecords.map(r => r.value),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  }

  // Process SARS-CoV-2 positivity rate (last 52 weeks)
  const sarsCov2Records = ecdcRecords
    .filter(r => r.pathogen === 'SARS-CoV-2' && r.metric === 'positivity_rate')
    .sort((a, b) => a.iso_week.localeCompare(b.iso_week))
    .slice(-52)

  const sarsCov2Data = {
    labels: sarsCov2Records.map(r => r.iso_week),
    datasets: [
      {
        label: 'SARS-CoV-2 Positivity Rate (%)',
        data: sarsCov2Records.map(r => r.value),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  }

  return {
    props: {
      influenzaData,
      rsvData,
      sarsCov2Data,
      lastUpdate,
    },
  }
}

export default function Home({ influenzaData, rsvData, sarsCov2Data, lastUpdate }: HomeProps) {
  return (
    <Layout>
      <Head>
        <title>Respiratory Virus Surveillance - Italy</title>
      </Head>

      <Banner />

      <section>
        <h2>Weekly Respiratory Virus Trends</h2>
        <p>
          This dashboard presents the latest weekly surveillance data for respiratory viruses in Italy,
          including influenza, RSV (Respiratory Syncytial Virus), and SARS-CoV-2. Data is automatically
          updated every Tuesday morning from the European Centre for Disease Prevention and Control (ECDC).
        </p>
        {lastUpdate && (
          <p>
            <strong>Last updated:</strong> {new Date(lastUpdate).toLocaleString('en-GB', {
              dateStyle: 'long',
              timeStyle: 'short',
            })}
          </p>
        )}
      </section>

      <section>
        <WeeklyLineChart
          title="Influenza Positivity Rate"
          data={influenzaData}
          yAxisLabel="Positivity Rate (%)"
        />

        <WeeklyLineChart
          title="RSV Detections"
          data={rsvData}
          yAxisLabel="Number of Cases"
        />

        <WeeklyLineChart
          title="SARS-CoV-2 Positivity Rate"
          data={sarsCov2Data}
          yAxisLabel="Positivity Rate (%)"
        />
      </section>

      <section>
        <div className="info-box">
          <p>
            <strong>Note:</strong> All data are subject to continuous verification and may change
            based on retrospective updates. Testing strategies, reporting practices, and lag times
            differ between pathogens and should be considered when interpreting trends.
          </p>
          <p>
            <strong>Data Source:</strong>{' '}
            <a href="https://github.com/EU-ECDC/Respiratory_viruses_weekly_data" target="_blank" rel="noopener noreferrer">
              ECDC Respiratory Virus Surveillance System
            </a>
          </p>
        </div>
      </section>
    </Layout>
  )
}


