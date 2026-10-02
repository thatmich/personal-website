export interface PostMeta {
    title: string
    date: string
    slug: string // the post's folder name
    description: string // one or two sentences, shown in search results and link previews
    tags?: string[]
    image?: string // link-preview image, 1200x630, path from the site root
    imageAlt?: string
}

export default function PostHeader({ post }: { post: PostMeta }) {
    return (
        <div className="blog-post-header-block">
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
