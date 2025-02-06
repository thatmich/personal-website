import '../index.css'
import type { Metadata } from 'next'
 
export const metadata: Metadata = {
  title: 'Michio Sun',
  description: "Michio Sun's website created with Next.js",
  icons: {
    icon: 'icon.png',
  }
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