# Admin Access Setup Guide

This guide helps you fix the "access denied" issue and ensure your initial admin user has proper access to the DisModular.js dashboard.

## Quick Fix

If you're getting "access denied" errors, run these commands:

```bash
# Fix Prisma migration issues
npm run db:fix-migration

# Ensure admin access is properly set up
npm run db:ensure-admin

# Test that admin access is working
npm run db:test-admin
```

## Detailed Setup

### 1. Set Your Discord ID

First, you need to set your Discord ID in the environment variables:

1. **Find your Discord ID:**
   - Enable Developer Mode in Discord (User Settings > Advanced > Developer Mode)
   - Right-click on your username and select "Copy User ID"

2. **Set the environment variable:**
   - Add `INITIAL_ADMIN_DISCORD_ID=YOUR_DISCORD_ID` to your `.env` file
   - Or set it in your Docker environment

### 2. Fix Database Issues

If you're getting Prisma migration errors (P3005), run:

```bash
npm run db:fix-migration
```

This script will:
- Check database connectivity
- Fix migration table issues
- Create missing tables
- Generate the Prisma client

### 3. Ensure Admin Access

Run the admin setup script:

```bash
npm run db:ensure-admin
```

This script will:
- Check if your Discord ID is set
- Create or update your admin user
- Ensure you have `is_admin: true` and `access_status: 'approved'`
- Verify admin access is working

### 4. Test Admin Access

Verify everything is working:

```bash
npm run db:test-admin
```

This script will:
- Test all admin access checks
- Verify your user can access admin endpoints
- Show you the current state of all users

## Docker Setup

If you're using Docker, the admin setup is automatically handled during container startup. However, you still need to:

1. Set `INITIAL_ADMIN_DISCORD_ID` in your `.env` file
2. Restart the Docker containers

```bash
docker-compose down
docker-compose up -d
```

## Troubleshooting

### "INITIAL_ADMIN_DISCORD_ID is not set"

- Make sure you've set the environment variable in your `.env` file
- Restart your application after setting the variable

### "User not found in database"

- You need to log in at least once through Discord OAuth
- Visit the login page and authenticate with Discord
- Then run `npm run db:ensure-admin`

### "Access denied" errors

- Run `npm run db:ensure-admin` to fix admin access
- Check that your user has `is_admin: true` and `access_status: 'approved'`

### Prisma migration errors (P3005)

- Run `npm run db:fix-migration` to fix migration issues
- This creates a proper baseline migration for existing databases

## Manual Database Fix

If the scripts don't work, you can manually fix the admin access:

```bash
# Connect to your database
docker exec -it dismodular-postgres psql -U dismodular -d dismodular

# Update your user to be admin (replace YOUR_DISCORD_ID with your actual Discord ID)
UPDATE users SET is_admin = true, access_status = 'approved' WHERE discord_id = 'YOUR_DISCORD_ID';

# Exit the database
\q
```

## Verification

After running the setup scripts, you should be able to:

1. Log in to the dashboard
2. Access admin-only pages
3. See your user listed as an admin in the user management panel

If you're still having issues, check the application logs for more detailed error messages.
