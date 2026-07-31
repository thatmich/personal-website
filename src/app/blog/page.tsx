import fs from 'fs'
import path from 'path'
import Link from 'next/link'
import type { PostMeta } from './PostHeader'

const BLOG_DIR = path.join(process.cwd(), 'src', 'app', 'blog')

async function getPosts(): Promise<Array<PostMeta & { slug: string }>> {
    const slugs = fs.readdirSync(BLOG_DIR, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .filter((entry) => fs.existsSync(path.join(BLOG_DIR, entry.name, 'page.mdx')))
        .map((entry) => entry.name)

    const posts = await Promise.all(slugs.map(async (slug) => {
        const mod = await import(`./${slug}/page.mdx`)
        return { slug, ...(mod.post as PostMeta) }
    }))

    return posts.sort((a, b) => (a.date < b.date ? 1 : -1))
}

export default async function BlogIndex() {
    const posts = await getPosts()
    return (
        <div>
            <h2 className="section-title">Blog</h2>
            <div className="blog-posts">
                {posts.map((post) => (
                    <Link href={`/blog/${post.slug}`} className="blog-post" key={post.slug}>
                        <article>
                            <div className="blog-post-header">
                                <h3 className="blog-post-title">{post.title}</h3>
                                <span className="blog-post-date">{post.date}</span>
                            </div>
                            {post.tags && (
                                <div className="blog-post-tags">
                                    {post.tags.map((tag) => (
                                        <span className="blog-post-tag" key={tag}>{tag}</span>
                                    ))}
                                </div>
                            )}
                        </article>
                    </Link>
                ))}
            </div>
        </div>
    )
}
