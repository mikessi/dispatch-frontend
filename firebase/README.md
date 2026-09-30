# Firebase setup for Rate Settings

Rates are stored in one Firestore document (`settings/rates`). Anyone can read it;
only the admin email(s) in `firestore.rules` can save.

1. **Create a project** at https://console.firebase.google.com (Google Analytics not needed).
2. **Add a web app**: Project settings → General → Your apps → `</>`. Copy the config values
   into `.env.local` at the repo root (see `.env.example`).
3. **Firestore**: Build → Firestore Database → Create database (production mode, any region).
   Then open the **Rules** tab, paste `firestore.rules`, replace `REPLACE_WITH_ADMIN_EMAIL`
   with the admin's email, and Publish.
4. **Sign-in**: Build → Authentication → Get started → enable **Email/Password**.
   - Users tab → Add user: the admin email + a password.
   - Settings tab → User actions → uncheck **Enable create (sign-up)** so no one else can
     make an account.
5. **Authorized domains**: Authentication → Settings → Authorized domains → add
   `mikessi.github.io` (localhost is there by default).
6. Rebuild and deploy. The config is baked in at build time.
