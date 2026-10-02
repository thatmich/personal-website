import { AUTHOR, SITE_URL, postUrl } from './postMetadata'

export interface PostMeta {
    title: string
    date: string
    slug: string // the post's folder name
    description: string // one or two sentences, shown in search results and link previews
    tags?: string[]
    image?: string // link-preview image, 1200x630, path from the site root
    imageAlt?: string
}

/* Article data for search engines: who wrote it, when, and where it lives. */
function structuredData(post: PostMeta) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.description,
        datePublished: post.date,
        url: postUrl(post),
        mainEntityOfPage: postUrl(post),
        author: { '@type': 'Person', name: AUTHOR, url: SITE_URL },
        keywords: post.tags?.join(', '),
        image: post.image ? `${SITE_URL}${post.image}` : undefined,
    }
}

export default function PostHeader({ post }: { post: PostMeta }) {
    return (
        <div className="blog-post-header-block">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData(post)).replace(/</g, '\\u003c') }}
            />
            <div className="blog-post-header">
                <h1 className="blog-post-title">{post.title}</h1>
                <span className="blog-post-date">{post.date}</span>
            </div>
            {post.tags && (
                <div className="blog-post-tags">
                    {post.tags.map((tag) => (
                        <span className="blog-post-tag" key={tag}>{tag}</span>
                    ))}
                </div>
            )}
        </div>
    )
}
