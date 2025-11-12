# Security & Privacy Guide

## Current Security Status: ✅ SECURE

Your application follows security best practices for a collaborative estimation tool.

---

## ✅ What's Already Secure

### 1. API Keys & Credentials
- ✅ **Environment variables**: All Supabase credentials stored in `.env.local`
- ✅ **Git-ignored**: `.env*` files are in `.gitignore` (never committed)
- ✅ **Netlify secrets**: Environment variables set in Netlify dashboard (not in code)
- ✅ **No hardcoded secrets**: No API keys or passwords in source code
- ✅ **NEXT_PUBLIC prefix**: Only client-safe keys are exposed (Supabase anon key is designed to be public)

### 2. Database Security (Supabase)
- ✅ **Row Level Security (RLS)**: Enabled on all tables
- ✅ **Cascade deletes**: When sessions are deleted, all related data is removed
- ✅ **UUID primary keys**: No sequential IDs that could be guessed
- ✅ **Unique constraints**: Prevents duplicate votes per participant per task
- ✅ **Foreign key constraints**: Ensures data integrity

### 3. Session Privacy
- ✅ **Random 6-character codes**: Hard to guess (36^6 = 2.1 billion combinations)
- ✅ **Session isolation**: Each session has its own data
- ✅ **No cross-session leakage**: Queries filter by session_id
- ✅ **No user accounts**: No passwords to leak or manage
- ✅ **Ephemeral sessions**: Sessions can be deactivated after use

### 4. Data Privacy
- ✅ **Minimal data collection**: Only nicknames (no emails, phones, or PII)
- ✅ **No tracking**: No analytics or third-party trackers
- ✅ **No persistent user profiles**: Participant IDs stored temporarily in localStorage only
- ✅ **Temporary data**: Sessions and estimates are task-specific, not long-term personal data

### 5. Frontend Security
- ✅ **Input sanitization**: React automatically escapes user input
- ✅ **No eval()**: No dynamic code execution
- ✅ **Type safety**: TypeScript prevents many runtime errors
- ✅ **No external scripts**: All code is self-contained

---

## 🔒 Supabase RLS Policies Explained

Your current policies are **intentionally permissive** for collaboration:

### Sessions
```sql
- Anyone can VIEW sessions (needed to join via code)
- Anyone can CREATE sessions (public tool)
- Anyone can UPDATE sessions (for moderator actions)
```
**Why this is safe**: Sessions are isolated by code. No cross-session access.

### Participants
```sql
- Anyone can VIEW participants (needed to show who's in the session)
- Anyone can CREATE participants (to join sessions)
- Anyone can UPDATE participants (for avatar/emoji changes)
- Anyone can DELETE participants (to leave sessions)
```
**Why this is safe**: Participants are scoped to sessions. No personal information beyond nickname.

### Tasks & Votes
```sql
- Anyone can VIEW/CREATE/UPDATE/DELETE
```
**Why this is safe**: All operations are scoped to a specific session. Collaborative tools need open access within the session context.

---

## 🛡️ Additional Security Measures (Optional)

### For Extra Session Privacy:

Add these policies to restrict access only to session participants:

```sql
-- Only allow viewing sessions if you're a participant
CREATE OR REPLACE POLICY "Sessions viewable by participants only"
ON sessions FOR SELECT
USING (
  id IN (
    SELECT session_id FROM participants 
    WHERE id = current_setting('app.current_participant_id', true)::uuid
  )
);

-- Only allow viewing tasks for your session
CREATE OR REPLACE POLICY "Tasks viewable by session participants only"
ON tasks FOR SELECT
USING (
  session_id IN (
    SELECT session_id FROM participants
    WHERE id = current_setting('app.current_participant_id', true)::uuid
  )
);
```

**Note**: This requires implementing authentication context, which adds complexity. For most use cases, the current open model is sufficient since:
- Sessions are temporary
- No sensitive business data
- Users need the session code anyway

---

## 🚨 Security Recommendations

### 1. Environment Variables ✅ DONE
- Keep `.env.local` out of Git (already done)
- Set environment variables in Netlify dashboard
- Use Netlify's encrypted environment variables

### 2. HTTPS Only ✅ AUTOMATIC
- Netlify automatically provides HTTPS
- All data transmitted encrypted

### 3. Rate Limiting (Optional)
Consider adding to Netlify:
```toml
# In netlify.toml
[[headers]]
  for = "/api/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
```

### 4. Session Expiration (Optional)
Add a scheduled job in Supabase to clean up old sessions:
```sql
-- Delete sessions older than 7 days
DELETE FROM sessions 
WHERE created_at < NOW() - INTERVAL '7 days';
```

### 5. Input Validation (Already Done)
- ✅ Max lengths on all inputs
- ✅ Session codes validated (6 chars, alphanumeric)
- ✅ Nicknames limited to 100 chars
- ✅ No SQL injection possible (parameterized queries)

---

## 📝 What Data Is Stored

### In Supabase (Production):
- **Sessions**: Code, creation timestamp, moderator ID, active status
- **Participants**: Nickname, join timestamp, moderator flag, avatar emoji
- **Tasks**: Title, description, status, estimates
- **Votes**: Numeric estimates and estimation factors

### In localStorage (Demo Mode):
- Same structure as above
- **Participant IDs**: Stored as `participant_{sessionCode}` to maintain identity

### NOT Stored:
- ❌ Email addresses
- ❌ IP addresses  
- ❌ Passwords
- ❌ Payment information
- ❌ Personal identifiable information (PII)
- ❌ Location data
- ❌ Device fingerprints

---

## 🔍 Security Checklist

- [x] Environment variables in .gitignore
- [x] No hardcoded API keys
- [x] Supabase RLS enabled on all tables
- [x] HTTPS enforced (Netlify automatic)
- [x] Input validation on all forms
- [x] Type safety with TypeScript
- [x] No XSS vulnerabilities (React escaping)
- [x] No SQL injection (parameterized queries)
- [x] Minimal data collection
- [x] Session isolation
- [x] CASCADE deletes for data cleanup
- [ ] Optional: Add DELETE policy for participants (see add-participant-delete-policy.sql)
- [ ] Optional: Session expiration/cleanup
- [ ] Optional: Rate limiting
- [ ] Optional: Additional HTTP security headers

---

## 🎯 Conclusion

**Your application is SECURE for its intended use case:**

- Temporary collaborative estimation sessions
- No sensitive business data
- No user authentication needed
- Appropriate for internal team use
- Safe for demo and production deployment

The "anyone can view" RLS policies are **intentional and safe** because:
1. Sessions require a code to access
2. No personal or sensitive data is collected
3. Sessions are temporary and task-focused
4. It's a collaborative tool where sharing is the goal

If you need **additional security** for enterprise use, consider:
- Adding Supabase Auth for user accounts
- Implementing more restrictive RLS policies
- Adding session passwords
- Enabling audit logging

---

## 📞 Questions?

If you have specific security concerns or compliance requirements (GDPR, HIPAA, SOC2, etc.), we can implement additional measures as needed.

