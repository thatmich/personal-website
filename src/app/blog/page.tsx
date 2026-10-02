import type { Metadata } from 'next'
import Link from 'next/link'
import { getPosts } from './posts'
import { AUTHOR } from './postMetadata'

const description = `Posts by ${AUTHOR} on robot learning, ML systems and LLM security.`

export const metadata: Metadata = {
    title: `Blog — ${AUTHOR}`,
    description,
    alternates: { canonical: '/blog' },
    openGraph: { type: 'website', title: `Blog — ${AUTHOR}`, description, url: '/blog', siteName: AUTHOR },
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
