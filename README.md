# michiosun.com

Personal website built with [Next.js](https://nextjs.org/), statically exported and deployed to GitHub Pages.

## Development

```bash
npm install
npm run dev      # dev server with hot reload at http://localhost:3000
```

```bash
npm run build    # static export to ./build
npm run start    # serve the exported site locally
```

## Writing a blog post

Posts are MDX files. Create a folder with a `page.mdx` inside:

```
src/app/blog/my-new-post/page.mdx
```

Copy the top few lines from an existing post (the `PostHeader` import and the
`post` object with title, date, and tags), then write markdown below it. The
blog index at `/blog` discovers posts automatically and sorts them by date.
Being MDX, posts can also import and render React components.

## Architecture

- The homepage is the original create-react-app SPA, rendered client-side
  through a catch-all route (`src/app/[[...slug]]/`) — see the
  [Next.js SPA migration guide](https://nextjs.org/docs/app/guides/single-page-applications).
- The blog (`src/app/blog/`) uses the App Router directly, so posts are
  prerendered to static HTML at build time.

## Deployment

Every push to `master` triggers the GitHub Actions workflow
(`.github/workflows/nextjs.yml`), which builds the site and deploys it to
GitHub Pages at [michiosun.com](https://michiosun.com). No manual steps.
