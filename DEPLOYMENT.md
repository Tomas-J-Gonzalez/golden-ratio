# Deployment Guide

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor in your Supabase dashboard
3. Run the SQL schema from `supabase-schema.sql`
4. Go to Settings > API to get your project URL and anon key

## Netlify Deployment

### Option 1: Git-based Deployment

1. Push your code to GitHub/GitLab/Bitbucket
2. Connect your repository to Netlify
3. Set build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
4. Add environment variables in Netlify dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Option 2: Manual Deployment

1. Build the project locally:
```bash
npm run build
```

2. Deploy the `.next` folder to Netlify

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` with your Supabase credentials

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Production Considerations

- Update Supabase RLS policies for production if needed
- Consider adding authentication for production use
- Set up proper error monitoring
- Configure custom domain in Netlify
