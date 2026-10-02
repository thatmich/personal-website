import fs from 'fs'
import path from 'path'
import type { PostMeta } from './PostHeader'

const BLOG_DIR = path.join(process.cwd(), 'src', 'app', 'blog')

/** Every post's metadata, newest first. Read at build time. */
export async function getPosts(): Promise<PostMeta[]> {
    const slugs = fs.readdirSync(BLOG_DIR, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .filter((entry) => fs.existsSync(path.join(BLOG_DIR, entry.name, 'page.mdx')))
        .map((entry) => entry.name)

    const posts = await Promise.all(slugs.map(async (slug) => {
        const mod = await import(`./${slug}/page.mdx`)
        return { ...(mod.post as PostMeta), slug }
    }))

    return posts.sort((a, b) => (a.date < b.date ? 1 : -1))
}
