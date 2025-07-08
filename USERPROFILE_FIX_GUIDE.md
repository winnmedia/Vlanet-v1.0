# UserProfile Table Fix Guide

## Issue Summary
The error "relation 'users_userprofile' does not exist" indicates that the `users_userprofile` table is missing from the PostgreSQL database on Railway, even though the migrations show as applied.

## Root Causes Found

1. **Missing Table**: The `users_userprofile` table doesn't exist in the database
2. **Code Bug**: In `views_mypage.py`, line 108 incorrectly references `memo.content` instead of `memo.memo`

## Fixes Applied

### 1. Code Fix (Already Applied)
Fixed the bug in `/home/winnmedia/VideoPlanet/vridge_back/users/views_mypage.py`:
- Changed `memo.content` to `memo.memo` on line 108

### 2. Database Fix Scripts Created

Three fix scripts have been created in the `vridge_back` directory:

1. **fix_userprofile_table.py**: Creates the table manually if it doesn't exist
2. **ensure_userprofile.py**: Creates UserProfile instances for users without profiles
3. **fix_userprofile_migration.py**: Re-runs the migration or creates the table manually

## How to Fix on Railway

### Option 1: Via Railway CLI
```bash
# Connect to Railway
railway login
railway link

# Run the fix
railway run python manage.py shell < fix_userprofile_migration.py
```

### Option 2: Via Railway Console
1. Go to your Railway project dashboard
2. Click on the backend service
3. Go to the "Console" tab
4. Run these commands:

```python
# First, check if the table exists
from django.db import connection
with connection.cursor() as cursor:
    cursor.execute("SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = 'users_userprofile');")
    print(cursor.fetchone()[0])

# If False, create the table
with connection.cursor() as cursor:
    cursor.execute("""
        CREATE TABLE users_userprofile (
            id BIGSERIAL PRIMARY KEY,
            created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            profile_image VARCHAR(100),
            bio TEXT DEFAULT '',
            phone VARCHAR(20) DEFAULT '',
            company VARCHAR(100) DEFAULT '',
            position VARCHAR(100) DEFAULT '',
            user_id BIGINT NOT NULL UNIQUE REFERENCES users_user(id) ON DELETE CASCADE
        );
    """)
    print("Table created!")

# Create profiles for existing users
from users.models import User, UserProfile
for user in User.objects.filter(profile__isnull=True):
    UserProfile.objects.create(user=user)
    print(f"Created profile for {user.username}")
```

### Option 3: Force Re-migration
```bash
# In Railway console
python manage.py migrate users 0006 --fake  # Go back one migration
python manage.py migrate users 0007        # Re-apply the UserProfile migration
python manage.py migrate                   # Apply remaining migrations
```

## Verification Steps

After applying the fix:

1. Check if the table exists:
   ```python
   from users.models import UserProfile
   print(UserProfile.objects.count())
   ```

2. Test the MyPage API:
   ```bash
   curl https://videoplanet.up.railway.app/api/users/mypage/ \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

## Prevention

To prevent this in the future:
1. Always verify migrations are actually applied (not just marked as applied)
2. Add database integrity checks to the deployment process
3. Consider using `--run-syncdb` flag when migrations are missing

## Additional Notes

- The UserProfile model was added in migration `0007_remove_user_bio_remove_user_company_and_more`
- The model creates a one-to-one relationship with the User model
- All users should have a UserProfile instance created automatically when accessed