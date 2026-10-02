import type { Metadata } from 'next'
import { HomePage } from './client'
import { FEED } from '../blog/postMetadata'

export const metadata: Metadata = {
    alternates: { canonical: '/', types: FEED },
}

export function generateStaticParams() {
    return [{ slug: [''] }]
  }
   
  export default function Page() {
    return <HomePage />
  }