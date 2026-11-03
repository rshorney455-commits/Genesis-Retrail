# Genesis Retail — Site Viability Assessor

Vite + React app deployed on Vercel. Live code is in `src/`; server functions are in `api/`.

## Settings needed in Vercel

Project → Settings → Environment Variables, then redeploy:

| Name | What it is |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API key from console.anthropic.com, used for AI-written report sections and the admin assistant |
| `TOMTOM_API_KEY` | TomTom API key from developer.tomtom.com, used for the competitor search (1 mile radius) |
| `ADMIN_PIN` | PIN for the `/admin` portal login |

No keys belong in the code. The repo has been public, so any key that was ever committed should be treated as exposed.

## Local development

```
npm install
npm run dev
```

`npm run dev` serves the front end only. To test `api/` functions locally, use `vercel dev`.
