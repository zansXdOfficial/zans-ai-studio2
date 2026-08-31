# ZANE AI Studio — FINAL Vercel fix

The site was returning 404 because Vercel was not mapping the `public/` folder to `/`.

This version explicitly maps:
- `/` → `/public/index.html`
- `/assets...` → `/public/...`
- `/api/...` → `/api/index.js`

## What to do
1. Replace the GitHub repository files with the contents of this ZIP.
2. Commit the changes.
3. Wait for Vercel's automatic deployment, or open Vercel → Deployments → Redeploy.
4. Keep `OPENAI_API_KEY` in Vercel Environment Variables (Production + Preview).
5. Open the project URL again.

Do NOT put the API key in GitHub.
