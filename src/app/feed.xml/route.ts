import { getPosts } from '../blog/posts'
import { AUTHOR, SITE_URL, postUrl } from '../blog/postMetadata'

export const dynamic = 'force-static'

const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/* Summary RSS feed: one item per post, linking back to the site. */
export async function GET() {
    const posts = await getPosts()
    const items = posts.map((post) => `    <item>
      <title>${escape(post.title)}</title>
      <link>${postUrl(post)}</link>
      <guid>${postUrl(post)}</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <description>${escape(post.description ?? "")}</description>
    </item>`)

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${AUTHOR}</title>
    <link>${SITE_URL}/blog</link>
    <description>Posts by ${AUTHOR} on robot learning, ML systems and LLM security.</description>
    <language>en</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
${items.join('\n')}
  </channel>
</rss>
`
    return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } })
}
