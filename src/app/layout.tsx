import '../index.css'
import type { Metadata } from 'next'
import { AUTHOR, FEED, SITE_URL } from './blog/postMetadata'
 
const description =
  'Michio Sun is a machine learning engineer in Tokyo working on AI for robotics. Projects, and a blog on robot learning and ML systems.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: AUTHOR,
  description,
  authors: [{ name: AUTHOR, url: SITE_URL }],
  icons: {
    icon: '/icon.png',
  },
  alternates: { types: FEED },
  openGraph: { type: 'website', title: AUTHOR, description, url: '/', siteName: AUTHOR },
  twitter: { card: 'summary', title: AUTHOR, description },
}

export default function RootLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
        <html lang="en">
            <body>
                <div id="root">{children}</div>
            </body>
        </html>
    )
  }