export interface PostMeta {
    title: string
    date: string
    tags?: string[]
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
