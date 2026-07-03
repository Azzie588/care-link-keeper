## Goal
Make sign-in reliable and give a clear explanation when a known password is rejected.

## What I’ll check
1. **Account state**
   - Confirm whether the email account exists, is confirmed/active, or has been locked into a recovery/sign-up state.
   - Check whether repeated sign-ups created confusing “already exists” behavior while the saved password stayed different.

2. **Auth settings**
   - Verify email/password sign-in is enabled.
   - Verify password rules and leaked-password checks are not silently blocking password changes.
   - Confirm redirect URLs are not interfering with reset/update-password sessions.

3. **App sign-in flow**
   - Review the `/auth` and `/reset-password` pages for anything that could submit an old value, trim incorrectly, navigate too soon, or leave the user thinking the password changed when it did not.
   - Make the error message more specific: wrong password vs. unconfirmed account vs. reset link/code expired.

4. **Recovery fallback if needed**
   - If the password cannot be trusted because reset links are failing, add a safer “set a new password” path that uses the backend recovery flow correctly and clearly tells the user to use the newest email.

## Expected result
You should either be able to sign in with the current password, or the app will clearly tell you why not and give one working path to set a new password.