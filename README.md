# Pawsome Financial Dashboard

Weekly financial dashboard connected to QuickBooks. Deploy once to Vercel — everyone with the URL sees live data.

## Setup

### 1. Get QuickBooks API credentials

1. Go to [developer.intuit.com](https://developer.intuit.com) and sign in
2. Click **Create an App** → choose **QuickBooks Online and Payments**
3. Name it "Pawsome Dashboard"
4. Go to **Keys & credentials** → copy **Client ID** and **Client Secret**
5. Under **Redirect URIs**, add: `https://YOUR_APP.vercel.app/api/auth/quickbooks`
   (also add `http://localhost:3000/api/auth/quickbooks` for local dev)
6. Set the app to **Production** mode when ready

### 2. Set up Upstash Redis

1. Go to [upstash.com](https://upstash.com) and create a free account
2. Create a new Redis database (free tier is sufficient)
3. Copy the **REST URL** and **REST Token** from the database details page

### 3. Set environment variables in Vercel

In your Vercel project → **Settings** → **Environment Variables**, add:

| Variable | Value |
|---|---|
| `QUICKBOOKS_CLIENT_ID` | From developer.intuit.com |
| `QUICKBOOKS_CLIENT_SECRET` | From developer.intuit.com |
| `QUICKBOOKS_REDIRECT_URI` | `https://YOUR_APP.vercel.app/api/auth/quickbooks` |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` and paste result |
| `UPSTASH_REDIS_REST_URL` | From upstash.com dashboard |
| `UPSTASH_REDIS_REST_TOKEN` | From upstash.com dashboard |

### 4. Deploy

```bash
npm i -g vercel
vercel --prod
```

Or connect your GitHub repo in the Vercel dashboard for automatic deploys.

### 5. Connect QuickBooks

1. Open your deployed URL
2. Click **Connect QuickBooks**
3. Sign in to QuickBooks and authorize the app
4. You'll be redirected back to the dashboard — done!

The connection persists in Upstash Redis. Both users just open the URL.

## Local Development

```bash
cp .env.example .env.local
# Fill in your credentials
npm run dev
```

## Tech Stack

- Next.js 14 (App Router)
- Tailwind CSS
- Recharts
- QuickBooks OAuth 2.0
- Upstash Redis (token storage)
