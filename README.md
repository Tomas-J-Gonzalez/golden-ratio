# Design Estimation Tool

A custom agile estimation tool for UX/UI design teams, similar to planning poker but tailored for sizing design tasks.

## Features

- **Session Management**: Create and join estimation sessions with unique codes
- **Task Management**: Add design tasks to the session backlog
- **Voting System**: Secret voting with custom scale (XS, S, M, L, XL)
- **Real-time Updates**: Live collaboration using Supabase subscriptions
- **Meeting Buffers**: Add overhead for collaboration and meetings
- **Iteration Multipliers**: Account for design iterations
- **Task History**: Track completed estimates with export functionality

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **UI Components**: shadcn/ui with Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Real-time)
- **Deployment**: Netlify

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd design-estimation-tool
```

2. Install dependencies:
```bash
npm install
```

3. Set up Supabase:
   - Create a new Supabase project
   - Run the SQL schema from `supabase-schema.sql` in your Supabase SQL editor
   - Get your project URL and anon key from the API settings

4. Create environment variables:
```bash
cp .env.example .env.local
```

5. Update `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Creating a Session

1. Visit the home page
2. Enter your name as the moderator
3. Click "Create Session" to generate a unique session code
4. Share the session link with your team

### Joining a Session

1. Use the join link or visit `/join/[sessionCode]`
2. Enter your nickname
3. Click "Join Session"

### Estimating Tasks

1. **Moderator**: Add tasks to the backlog
2. **Moderator**: Start voting on a task
3. **All Participants**: Vote secretly using the estimation scale
4. **System**: Reveals all votes when everyone has voted
5. **Moderator**: Finalizes the estimate with optional buffers and multipliers

### Estimation Scale

- **XS**: Very small task (1-2 hours)
- **S**: Small task (2-4 hours)  
- **M**: Medium task (4-8 hours)
- **L**: Large task (1-2 days)
- **XL**: Very large task (2+ days)

## Database Schema

The application uses four main tables:

- **sessions**: Stores session information and codes
- **participants**: Tracks who joined each session
- **tasks**: Contains the design tasks to be estimated
- **votes**: Stores individual votes for each task

## Deployment

### Netlify

1. Build the project:
```bash
npm run build
```

2. Deploy to Netlify:
   - Connect your GitHub repository
   - Set build command: `npm run build`
   - Set publish directory: `.next`
   - Add environment variables in Netlify dashboard

3. Update your Supabase RLS policies if needed for production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details