import Link from "next/link";

const HomeBlog = ({ posts }) => (
    <section className="HomeBlog container">
        <div className="home-blog-header">
            <h2 className="section-title">Blog</h2>
            <Link href="/blog" className="home-blog-all">All posts →</Link>
        </div>
        <div className="home-blog-list">
            {posts.map((post) => (
                <Link href={`/blog/${post.slug}`} className="home-blog-item" key={post.slug}>
                    <span className="home-blog-title">{post.title}</span>
                    <span className="home-blog-date">{post.date}</span>
                </Link>
            ))}
        </div>
    </section>
);

export default HomeBlog;
