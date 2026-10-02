import { getPosts } from '../blog/posts'
import { AUTHOR, SITE_URL, postUrl } from '../blog/postMetadata'

export const dynamic = 'force-static'

/* Plain-text index of the site for AI crawlers (llmstxt.org). */
export async function GET() {
    const posts = await getPosts()
    const text = `# ${AUTHOR}

> Personal site and blog of ${AUTHOR}, a machine learning engineer in Tokyo working on AI for robotics.

## Blog posts

${posts.map((post) => `- [${post.title}](${postUrl(post)}) (${post.date}): ${post.description ?? ""}`).join('\n')}

## More

- [Home](${SITE_URL})
- [RSS feed](${SITE_URL}/feed.xml)
`
    return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
