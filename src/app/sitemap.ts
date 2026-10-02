import type { MetadataRoute } from 'next'
import { getPosts } from './blog/posts'
import { SITE_URL, postUrl } from './blog/postMetadata'

export const dynamic = 'force-static'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const posts = await getPosts()
    return [
        { url: SITE_URL },
        { url: `${SITE_URL}/blog`, lastModified: posts[0]?.date },
        ...posts.map((post) => ({ url: postUrl(post), lastModified: post.date })),
    ]
}
