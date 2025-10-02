/**
 * Banner Component
 * Displays status messages (e.g., stale data warning)
 */

import { useEffect, useState } from 'react'

interface Status {
  build_time: string
  stale: boolean
}

export default function Banner() {
  const [status, setStatus] = useState<Status | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/status.json')
      .then(res => {
        if (!res.ok) {
          throw new Error('Status file not found')
        }
        return res.json()
      })
      .then(data => setStatus(data))
      .catch(err => {
        // Status file is optional - don't show error if it doesn't exist
        console.warn('Could not load status:', err)
      })
  }, [])

  if (error) {
    return (
      <div className="banner banner-error" role="alert">
        <strong>Error:</strong> {error}
      </div>
    )
  }

  if (status?.stale) {
    return (
      <div className="banner" role="alert">
        <strong>Data may be stale:</strong> Source data was unavailable during the last update.
        Displaying previously cached data. Last successful update: {new Date(status.build_time).toLocaleString()}
      </div>
    )
  }

  if (status?.build_time) {
    const buildDate = new Date(status.build_time)
    const isRecent = Date.now() - buildDate.getTime() < 7 * 24 * 60 * 60 * 1000 // 7 days

    if (!isRecent) {
      return (
        <div className="banner" role="alert">
          <strong>Notice:</strong> Data was last updated on {buildDate.toLocaleDateString()}.
          The automated update may be experiencing issues.
        </div>
      )
    }
  }

  return null
}


