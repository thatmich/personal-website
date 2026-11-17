'use client'

import '../../App.css'
import Navbar from '../../Navbar/Navbar'
import Home from '../../views/Home'
import type { PostMeta } from '../blog/PostHeader'

/* Prerendered at build time, so the bio, work history and latest posts are in the HTML. */
export function HomePage({ posts }: { posts: PostMeta[] }) {
  return (
    <>
      <Navbar />
      <main className="main-content">
        <Home posts={posts} />
      </main>
    </>
  )
}
