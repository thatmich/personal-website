import type { Metadata } from 'next'
import { HomePage } from './client'

export const metadata: Metadata = {
    alternates: { canonical: '/' },
}

export function generateStaticParams() {
    return [{ slug: [''] }]
  }
   
  export default function Page() {
    return <HomePage />
  }