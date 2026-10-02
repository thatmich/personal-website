import type { Metadata } from 'next'
import type { PostMeta } from './PostHeader'

export const SITE_URL = 'https://michiosun.com'
export const AUTHOR = 'Michio Sun'

export const postUrl = (post: PostMeta) => `${SITE_URL}/blog/${post.slug}`

/** Head tags for a post: description, canonical URL, and link-preview cards. */
export function postMetadata(post: PostMeta): Metadata {
    const path = `/blog/${post.slug}`
    const images = post.image ? [{ url: post.image, width: 1200, height: 630, alt: post.imageAlt }] : undefined
    return {
        title: `${post.title} — ${AUTHOR}`,
        description: post.description,
        authors: [{ name: AUTHOR, url: SITE_URL }],
        alternates: { canonical: path },
        openGraph: {
            type: 'article',
            title: post.title,
            description: post.description,
            url: path,
            siteName: AUTHOR,
            publishedTime: post.date,
            authors: [AUTHOR],
            tags: post.tags,
            images,
        },
        twitter: {
            card: post.image ? 'summary_large_image' : 'summary',
            title: post.title,
            description: post.description,
            images: post.image ? [post.image] : undefined,
        },
    }
}
