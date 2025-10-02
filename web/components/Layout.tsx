/**
 * Layout Component
 * Provides consistent page structure with header, navigation, and footer
 */

import Link from 'next/link'
import { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <>
      <div className="header">
        <div className="container">
          <h1>Respiratory Virus Surveillance - Italy</h1>
          <nav className="nav">
            <Link href="/">Overview</Link>
            <Link href="/methods">Methods</Link>
            <Link href="/download">Download Data</Link>
          </nav>
        </div>
      </div>

      <main className="container">{children}</main>

      <footer className="footer">
        <div className="container">
          <div className="footer-section">
            <h3>Data Source</h3>
            <p>
              <strong>ECDC ERVISS:</strong> European Centre for Disease Prevention and Control
            </p>
            <p>
              <a href="https://erviss.org/" target="_blank" rel="noopener noreferrer">
                erviss.org
              </a>
              {' | '}
              <a href="https://github.com/EU-ECDC/Respiratory_viruses_weekly_data" target="_blank" rel="noopener noreferrer">
                GitHub Repository
              </a>
            </p>
          </div>

          <div className="footer-section">
            <h3>Licensing</h3>
            <p>
              ECDC data: EUPL-1.2 (European Union Public License)<br />
              Website code: MIT License
            </p>
          </div>

          <div className="footer-section">
            <p>
              <small>
                Data are subject to continuous verification and may change based on retrospective updates.
                Testing strategies, reporting practices, and lag times differ between pathogens.
                Caution should be used when comparing data longitudinally.
              </small>
            </p>
          </div>
        </div>
      </footer>
    </>
  )
}


