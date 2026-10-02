import type { Metadata } from 'next'
import Link from 'next/link'
import { getPosts } from './posts'
import { AUTHOR, FEED } from './postMetadata'

const description = `Posts by ${AUTHOR} on robot learning, ML systems and LLM security.`

export const metadata: Metadata = {
    title: `Blog — ${AUTHOR}`,
    description,
    alternates: { canonical: '/blog', types: FEED },
    openGraph: { type: 'website', title: `Blog — ${AUTHOR}`, description, url: '/blog', siteName: AUTHOR },
}

export default async function BlogIndex() {
    const posts = await getPosts()
    return (
        <div>
            <div className="blog-index-header">
                <h2 className="section-title">Blog</h2>
                <a className="blog-rss-link" href="/feed.xml" title="Subscribe via RSS">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
                        <path d="M4 11a9 9 0 0 1 9 9" />
                        <path d="M4 4a16 16 0 0 1 16 16" />
                        <circle cx="5" cy="19" r="1.4" fill="currentColor" stroke="none" />
                    </svg>
                    RSS
                </a>
            </div>
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
