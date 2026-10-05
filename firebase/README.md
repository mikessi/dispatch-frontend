# Firebase setup

What's stored in Firestore:

| Collection  | What                                             | Who can read | Who can write |
|-------------|--------------------------------------------------|--------------|---------------|
| `settings`  | `settings/rates` — the standard rates            | anyone       | admins        |
| `customers` | business details, contacts, custom rate overrides | admins       | admins        |
| `addresses` | pickup/delivery locations                        | admins       | admins        |
| `jobs`      | shipments: customer, from/to, pro #, pieces…     | admins       | admins        |
| `invoices`  | invoices made from jobs, with frozen amounts     | admins       | admins        |

Admins are the email(s) listed in `firestore.rules`. Whenever that file changes
(e.g. a new collection is added), re-publish it: Firestore Database → Rules → paste → Publish.

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
