# Zipline

Expiring file sharing with QR codes and print-ready tags. Next.js + Prisma/Postgres + Vercel Blob.

## Deploy to Vercel
1. Push to GitHub, import the repo in Vercel.
2. Storage tab: create a **Blob** store (adds `BLOB_READ_WRITE_TOKEN`) and a **Postgres** (Neon/Supabase) DB (adds `DATABASE_URL`).
3. Add env vars: `AUTH_SECRET`, `CRON_SECRET`, `NEXT_PUBLIC_APP_URL` (your https domain).
4. Deploy. `build` runs `prisma db push`, so tables are created automatically. The hourly cron comes from `vercel.json`.

## Local
`cp .env.example .env.local`, fill it in, then `npm i && npx prisma db push && npm run dev`.
(Note: auth cookie is `secure`; use localhost, which browsers allow.)

## ShareX / curl
`curl -H "Authorization: Bearer zp_..." -F file=@a.png -F ttl=24h https://yourdomain/api/v1/upload`
(That route is server-side, so it is limited to ~4.5MB on Vercel; the web UI uploads directly to Blob up to 100MB.)
