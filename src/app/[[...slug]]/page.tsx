import type { Metadata } from 'next'
import { HomePage } from './client'
import { getPosts } from '../blog/posts'
import { FEED } from '../blog/postMetadata'

export const metadata: Metadata = {
    alternates: { canonical: '/', types: FEED },
}

export function generateStaticParams() {
    return [{ slug: [''] }]
  }
   
  export default async function Page() {
    const posts = (await getPosts()).slice(0, 3)
    return <HomePage posts={posts} />
  }