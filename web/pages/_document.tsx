/**
 * Next.js Document Component
 * Customizes the HTML document structure
 */

import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta name="description" content="Weekly respiratory virus surveillance data for Italy - influenza, RSV, and COVID-19" />
        <meta name="keywords" content="respiratory viruses, surveillance, Italy, influenza, RSV, COVID-19" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}


