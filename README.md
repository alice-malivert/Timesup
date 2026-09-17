# Time's Up

A tiny word-bag site for playing Time's Up. Anyone who opens the page sees the
current word (behind a tap-to-reveal spoiler). One admin, signed in with a
plain password, edits the word list, draws words without replacement, and
resets the bag. **No accounts needed for anyone, including the admin** — just
a password set up once and shared with whoever runs the game.

Static site (`index.html` / `app.js` / `style.css`), hosted for free on
GitHub Pages. Shared state (the word list, the bag, the current word) lives
in a free Firebase Firestore database; the admin password is a single
Firebase Auth user, enforced by Firestore security rules — there is no
server to run or pay for.

## Deployment checklist

Do these in order. Steps 1–7 are one-time Firebase setup; steps 8–10 put the
site online. Should take about 15 minutes total.

### Part A — Firebase (the shared backend)

1. Go to https://console.firebase.google.com (sign in with any Google
   account) → **Add project** → give it any name, e.g. `timesup-app` → you
   can disable Google Analytics when asked → **Create project**.
2. In the left sidebar: **Build → Firestore Database** → **Create database**
   → choose **Start in production mode** → pick any region (doesn't
   matter) → **Enable**.
3. Left sidebar: **Build → Authentication** → **Get started** → under
   "Sign-in method", click **Email/Password** → toggle it **Enabled** →
   **Save**.
4. Still in Authentication, go to the **Users** tab → **Add user**. This
   creates the one and only admin account:
   - **Email**: anything you like, e.g. `admin@timesup-app.internal`. It
     does not need to be a real inbox — nothing is ever sent to it, it's
     only used as an identifier.
   - **Password**: whatever the admin should type into the site to log in.
     This is the "admin password" for the whole game.
   - **Write this exact email down** — you need to paste it into two files
     in step 6 and 7 below, and it must match exactly (case-sensitive) in
     both places.
5. Click the gear icon (top left) → **Project settings** → scroll down to
   "Your apps" → click the **`</>`** (web) icon → give the app any nickname
   → click **Register app** (leave "Also set up Firebase Hosting"
   **unchecked** — we're using GitHub Pages instead) → you'll see a code
   block that looks like:
   ```js
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "timesup-app.firebaseapp.com",
     projectId: "timesup-app",
     storageBucket: "timesup-app.appspot.com",
     messagingSenderId: "...",
     appId: "..."
   };
   ```
   Keep this tab open (or copy the values somewhere) for the next step.
6. Open **`firebase-config.js`** in this repo and replace every
   `"REPLACE_ME"` value with the matching value from step 5. Also set
   `ADMIN_EMAIL` to the exact email you created in step 4. Example:
   ```js
   export const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "timesup-app.firebaseapp.com",
     projectId: "timesup-app",
     storageBucket: "timesup-app.appspot.com",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abcdef",
   };
   export const ADMIN_EMAIL = "admin@timesup-app.internal";
   ```
   These config values are **not secret** — they only identify which
   Firebase project to talk to. It's fine that they end up public in the
   deployed site. The actual access control is the Firestore rules in the
   next step, plus the admin password itself.
7. Open **`firestore.rules`** in this repo and make sure the email inside
   it matches `ADMIN_EMAIL` exactly:
   ```
   allow write: if request.auth != null
                && request.auth.token.email == 'admin@timesup-app.internal';
   ```
   Then in the Firebase console: **Firestore Database → Rules** tab →
   delete what's there → paste in the full contents of `firestore.rules` →
   **Publish**.

You don't need to create any Firestore documents by hand — the app creates
its one data document automatically the first time the admin saves a word
list or clicks Reset.

### Part B — GitHub Pages (hosting the site)

8. Make sure `firebase-config.js` and `firestore.rules` (edited in steps 6–7)
   are committed, then push this repo to GitHub (create a new repo on
   GitHub first if one doesn't exist yet, then `git push`).
9. On GitHub, open the repo → **Settings** tab → **Pages** (left sidebar) →
   under "Build and deployment", set **Source** to **Deploy from a
   branch** → **Branch**: `main`, folder **`/ (root)`** → **Save**.
10. Wait about a minute, then open
    `https://<your-github-username>.github.io/<repo-name>/`. That's the URL
    to share with everyone for game night. Any future `git push` to `main`
    redeploys it automatically within about a minute.

## Using it on game night

- Share the GitHub Pages URL from step 10 — anyone who opens it always sees
  the current word directly. No login, no install.
  (There's a tap-to-reveal spoiler mode built in but currently switched off;
  set `SPOILER_ENABLED = true` at the top of `app.js` to turn it back on.)
- Tap **Admin** at the bottom of the page, enter the password from step 4,
  and you can:
  - **Save word list** — paste/edit words, one per line. Takes effect
    starting from the next **Reset**, not mid-round.
  - **Draw a word** — picks a random remaining word from the bag and shows
    it to everyone live.
  - **Reset bag** — refills the bag from the current word list and clears
    the displayed word, ready for a new round.
  - (There's a built-in "let any visitor draw too" mode — set
    `ALLOW_VISITOR_DRAW = true` in `app.js` — but it's currently switched
    off since it needs a looser Firestore rule and hasn't been hardened
    for open access yet. See the comments next to that flag and in
    `firestore.rules`.)
- The admin stays logged in on that device/browser until **Log out** is
  pressed (safe to leave logged in on your own laptop between games).

## Changing the admin password later

Firebase console → **Authentication → Users** → select the admin user →
reset the password there. No code changes or redeploy needed.

## Troubleshooting

- **Admin login always says "Incorrect password"**: double-check the email
  in `firebase-config.js` (`ADMIN_EMAIL`) matches the user you created in
  Firebase Authentication exactly, and that Email/Password sign-in is
  enabled (step 3).
- **Word list won't save / draw or reset does nothing**: open the browser's
  developer console (F12) and look for a Firestore "permission denied"
  error — this almost always means the email in `firestore.rules` doesn't
  match `ADMIN_EMAIL`, or the rules weren't published (step 7).
- **Page loads but the word never updates for visitors**: check that
  Firestore was created in step 2 and that `firebase-config.js` has real
  values, not the `REPLACE_ME` placeholders.
