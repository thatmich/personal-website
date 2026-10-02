import createMDX from '@next/mdx'
import remarkGfm from 'remark-gfm'

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export', // Outputs a Single-Page Application (SPA).
    distDir: './build', // Changes the build output directory to `./build`.
    pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  }

const withMDX = createMDX({
    options: {
        remarkPlugins: [remarkGfm], // GFM tables in posts.
    },
})

export default withMDX(nextConfig)
