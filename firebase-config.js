// Safe to commit/expose publicly: this identifies the Firebase project only.
// It is NOT a secret. The real access control is firestore.rules + the one
// admin password (set in the Firebase console under Authentication > Users).
export const firebaseConfig = {
  apiKey: "AIzaSyCrVPONLPG-7BFdVO7Xs-Fqqo-0tp1_fms",
  authDomain: "timesup-76a12.firebaseapp.com",
  projectId: "timesup-76a12",
  storageBucket: "timesup-76a12.firebasestorage.app",
  messagingSenderId: "367845170380",
  appId: "1:367845170380:web:06dbb1e9b87e8a5e90b669"
};

// Must match the single admin user's email created in Firebase Auth,
// and the email checked in firestore.rules.
export const ADMIN_EMAIL = "malicemalivert@gmail.com";
