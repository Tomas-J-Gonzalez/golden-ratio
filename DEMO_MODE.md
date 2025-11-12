# Demo Mode

This application now supports a **Demo Mode** that allows you to run the app locally without needing a Supabase backend. All data is stored in your browser's localStorage.

## How Demo Mode Works

The app automatically detects when you're in demo mode by checking if the Supabase URL contains "placeholder". When in demo mode:

- ✅ All data is stored in browser localStorage
- ✅ Real-time updates are simulated using event emitters
- ✅ Multiple tabs/windows can share the same session (within the same browser)
- ✅ Full functionality: create sessions, add tasks, vote, finalize estimates
- ⚠️ Data is temporary and will be lost when you clear browser cache
- ⚠️ Cannot share sessions across different computers/browsers

## Starting Demo Mode

The app is **already in demo mode** because the default Supabase URL is set to a placeholder value.

1. Make sure the dev server is running:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000 in your browser

3. You should see a yellow banner at the top indicating "Demo Mode"

4. Create a session and start estimating!

## Demo Mode Features

### What Works:
- ✅ Creating sessions with unique codes
- ✅ Joining sessions (in the same browser)
- ✅ Adding tasks to sessions
- ✅ Starting and stopping votes
- ✅ Submitting estimates
- ✅ Revealing votes
- ✅ Finalizing task estimates
- ✅ Task history and export
- ✅ Real-time updates (within same browser)
- ✅ Avatar emojis
- ✅ Drag-and-drop task reordering

### What's Different:
- ⚠️ Data only persists in localStorage (not in a database)
- ⚠️ Can't share sessions across different devices
- ⚠️ Real-time updates only work within the same browser
- ⚠️ Data is lost when clearing browser cache/data

## Testing Demo Mode

Try these scenarios:

### 1. Basic Session Flow
1. Create a session with your name
2. Note the session code
3. Add a few tasks
4. Start voting on a task
5. Submit your estimate
6. Finalize the estimate

### 2. Multiple Participants (Simulation)
1. Create a session in one browser tab
2. Open a new incognito/private window
3. Join the same session code
4. Both participants can vote
5. See real-time updates

### 3. Data Persistence
1. Create a session
2. Add some tasks
3. Refresh the page
4. Your session should still be there (data in localStorage)
5. Clear browser data to reset

## Switching to Production Mode

To use the real Supabase backend:

1. Create a `.env.local` file in the project root:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_actual_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_supabase_key
   ```

2. Restart the dev server:
   ```bash
   npm run dev
   ```

3. The yellow demo banner should disappear
4. App will now use real Supabase backend

## Technical Details

Demo mode is implemented using:

- **`demo-storage.ts`**: LocalStorage wrapper that mimics Supabase database operations
- **`mock-supabase.ts`**: Mock Supabase client that implements the same API as the real client
- **`supabase.ts`**: Automatically switches between mock and real client based on environment

The mock client provides:
- Full CRUD operations (Create, Read, Update, Delete)
- Query filtering (eq, in)
- Ordering and limiting
- Real-time subscriptions (using event emitters)
- Upsert operations

## Troubleshooting

### Demo mode not working?
- Check that you see the yellow banner at the top
- Check browser console for errors
- Try clearing localStorage: `localStorage.clear()` in browser console

### Data not persisting?
- Check if browser is in private/incognito mode
- Check browser storage settings
- Try a different browser

### Real-time updates not working?
- Demo mode only supports real-time within the same browser
- Open in multiple tabs (not different browsers) to test
- Check browser console for errors

## Limitations

Demo mode is intended for:
- Local development
- Demos and presentations
- Testing without backend setup
- Exploring features

Demo mode is NOT suitable for:
- Production use
- Collaborative sessions across devices
- Persistent data storage
- Multi-user scenarios (beyond same browser)

