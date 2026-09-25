# Cloudflare Pages deployment

This branch is a separate Cloudflare Pages deployment path. The original main branch remains unchanged.

## Cloudflare Pages settings

Create a new Pages application from this GitHub repository and select the **cloudflare-pages** production branch.

- Build command: npm run build
- Build output directory: dist
- Root directory: /
- Node.js version: 22 (or the current Node version supported by the repository)

## Environment variables

Set these in Cloudflare Pages under Settings > Environment variables for both Production and Preview:

- VITE_SUPABASE_URL — the existing Supabase project URL
- VITE_SUPABASE_ANON_KEY — the existing Supabase anon/public key

Do not add a Supabase service-role key. Vite exposes VITE_* values in the browser bundle.

## Supabase auth redirect

After the first deployment, add the new Pages URL (for example, https://your-project.pages.dev) in Supabase under Authentication > URL Configuration as the Site URL and an additional redirect URL.

The public/_redirects file keeps the Wouter client-side routes working when a route is refreshed directly.
