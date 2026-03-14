-- Fix NULL token columns in auth.users that cause "converting NULL to string" errors
UPDATE auth.users 
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, '')
WHERE id = '95600174-4860-42d5-874c-a2879562fe96';