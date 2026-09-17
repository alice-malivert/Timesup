// Safe to commit/expose publicly: this identifies the Firebase project only.
// It is NOT a secret. The real access control is firestore.rules + the one
// admin password (set in the Firebase console under Authentication > Users).
export const firebaseConfig = {
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME.firebaseapp.com",
  projectId: "REPLACE_ME",
  storageBucket: "REPLACE_ME.appspot.com",
  messagingSenderId: "REPLACE_ME",
  appId: "REPLACE_ME",
};

// Must match the single admin user's email created in Firebase Auth,
// and the email checked in firestore.rules.
export const ADMIN_EMAIL = "admin@timesup-app.internal";
