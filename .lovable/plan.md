## What's happening

Two separate things went wrong:

1. **Sign-in failed** — the password you typed didn't match the one saved at sign-up (backend returned "Invalid login credentials"). Nothing is broken; the password was just different.
2. **Reset-password link is broken** — clicking the email link shows "This site can't provide a secure connection." That's the real bug. The reset email is being generated with a redirect that the auth backend isn't allowed to send you to, so the browser lands on an invalid URL instead of your app.

Yes — you do need an account to save real data (each family's data is private and locked to their login). Once these are fixed, you'll be able to reset, sign in, and start adding providers.

## Plan

1. **Fix the reset-password redirect**
   - Configure the Lovable Cloud auth settings so the app's preview URL (and future published URL) are on the allowed redirect list.
   - Confirm `/reset-password` is a public route (not behind the auth gate) so the link opens without a login wall.
   - Verify the reset page correctly reads the recovery token from the URL and calls "update password" before sending you to Home.

2. **Make sign-in errors clearer on the auth screen**
   - Show a friendly message like "That email and password don't match. Try again or reset your password." instead of the raw backend text.
   - Keep the "Forgot your password?" link prominent right under the sign-in button.

3. **Verify end-to-end**
   - Trigger a password reset for your account, follow the link, set a new password, and confirm you land signed-in on Home.

## Not changing

- Sign-up flow, database, providers feature, or design — all stay as they are.
- Email confirmation stays off, so new accounts sign in immediately after sign-up.

After you approve, I'll make the changes and walk the reset flow end-to-end to confirm it works before handing back.
