# Supabase Database Connection Guide for Local Development

## The Issue You Encountered

Your local environment was timing out when trying to connect to Supabase because the DATABASE_URL format was incorrect. The error `connect ETIMEDOUT 104.18.38.10:5432` indicates the connection string wasn't properly formatted.

## Solution: Correct Database Connection Format

Based on your Supabase project (`urmcnyuydwnxpufkayrb`), here are the correct connection formats:

### Option 1: Direct Connection (Recommended)
```env
DATABASE_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.urmcnyuydwnxpufkayrb.supabase.co:5432/postgres
```

### Option 2: Pooled Connection (If Option 1 doesn't work)
```env
DATABASE_URL=postgresql://postgres.urmcnyuydwnxpufkayrb:YOUR_ACTUAL_PASSWORD@aws-0-us-west-1.pooler.supabase.com:5432/postgres
```

### Option 3: IPv6 Compatible (For some network configurations)
```env
DATABASE_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.urmcnyuydwnxpufkayrb.supabase.co:6543/postgres
```

## How to Get Your Database Password

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard/project/urmcnyuydwnxpufkayrb
2. **Navigate to Settings > Database**
3. **Look for "Connection Info" or "Database Password"**
4. **Copy your database password** (this is the password you set when creating the project)

## Complete .env File Template

Create a `.env` file in your project root with this content:

```env
# Database Connection - REPLACE YOUR_ACTUAL_PASSWORD
DATABASE_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.urmcnyuydwnxpufkayrb.supabase.co:5432/postgres

# Supabase Configuration (Optional - for real-time features)
SUPABASE_URL=https://urmcnyuydwnxpufkayrb.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVybWNueXV5ZHdueHB1ZmtheXJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MDI4MTQsImV4cCI6MjA2NzE3ODgxNH0.fnAhM_8Lyk4Ne6ycp63XbBeQUSgWygeUCfXVcSdqau4
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_if_needed
```

## Testing Your Connection

After updating your `.env` file:

1. **Save the file**
2. **Restart your development server**: `npm run dev`
3. **Look for these success messages**:
   ```
   🔍 Testing database connection...
   ✅ Database connected successfully
   ✅ Using Supabase database storage
   ```

## What Happens When Connected vs Not Connected

### ✅ When Connected (What you want):
- Uses your actual Supabase database
- Real-time data persistence
- All investments, properties, and transactions are saved
- Data survives server restarts

### ⚠️ When Not Connected (Fallback mode):
- Uses in-memory storage for development
- Data is temporary and disappears when server restarts
- Still functional for testing, but no persistence

## Troubleshooting

### Error: "connect ETIMEDOUT"
- **Cause**: Wrong DATABASE_URL format or network issues
- **Solution**: Use the exact formats provided above

### Error: "password authentication failed"
- **Cause**: Wrong password in DATABASE_URL
- **Solution**: Double-check your database password in Supabase dashboard

### Error: "database does not exist"
- **Cause**: Wrong database name
- **Solution**: Make sure the URL ends with `/postgres`

### Still Having Issues?
Try these steps in order:
1. Use Option 2 (pooled connection) format
2. Check your internet connection
3. Verify your Supabase project is active
4. Try Option 3 (IPv6) if on certain networks

## Success Indicators

When everything is working correctly, you'll see:
- Real-time data updates in your dashboard
- Persistent investments that survive server restarts
- All property listings load from your Supabase database
- Governance voting data is saved and persists