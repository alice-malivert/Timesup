import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  onSnapshot,
  setDoc,
  runTransaction,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig, ADMIN_EMAIL } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const stateRef = doc(db, "game", "state");

// ---- DOM refs ----
const wordCard = document.getElementById("word-card");
const currentWordEl = document.getElementById("current-word");
const visitorStatus = document.getElementById("visitor-status");

const showAdminLoginBtn = document.getElementById("show-admin-login");
const adminLoginPanel = document.getElementById("admin-login");
const adminLoginForm = document.getElementById("admin-login-form");
const adminPasswordInput = document.getElementById("admin-password");
const cancelAdminLoginBtn = document.getElementById("cancel-admin-login");
const adminLoginError = document.getElementById("admin-login-error");

const adminPanel = document.getElementById("admin-panel");
const adminLogoutBtn = document.getElementById("admin-logout");
const bagStatusEl = document.getElementById("bag-status");
const drawBtn = document.getElementById("draw-btn");
const resetBtn = document.getElementById("reset-btn");
const adminMessageEl = document.getElementById("admin-message");
const wordListTextarea = document.getElementById("word-list-textarea");
const saveWordsBtn = document.getElementById("save-words-btn");
const saveWordsStatus = document.getElementById("save-words-status");

// ---- Spoiler toggle ----
let lastSeenWord = null;

wordCard.addEventListener("click", () => {
  wordCard.classList.toggle("hidden-word");
});
wordCard.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    wordCard.classList.toggle("hidden-word");
  }
});

// ---- Shared live state listener (drives both visitor and admin views) ----
let isAdmin = false;
let textareaLoadedForThisSession = false;

onSnapshot(
  stateRef,
  (snap) => {
    const data = snap.data() || {};
    const currentWord = data.currentWord || "";
    const bagRemaining = data.bagRemaining || [];
    const allWords = data.allWords || [];

    currentWordEl.textContent = currentWord || "(no word drawn yet)";
    visitorStatus.textContent = "";

    if (currentWord !== lastSeenWord) {
      lastSeenWord = currentWord;
      wordCard.classList.add("hidden-word");
    }

    if (isAdmin) {
      bagStatusEl.textContent = `Words remaining: ${bagRemaining.length} / ${allWords.length}`;
      if (!textareaLoadedForThisSession) {
        wordListTextarea.value = allWords.join("\n");
        textareaLoadedForThisSession = true;
      }
    }
  },
  (err) => {
    visitorStatus.textContent = "Connection error.";
    console.error(err);
  }
);

// ---- Admin login/logout UI ----
showAdminLoginBtn.addEventListener("click", () => {
  adminLoginPanel.classList.remove("hidden");
  adminLoginError.textContent = "";
  adminPasswordInput.value = "";
  adminPasswordInput.focus();
});

cancelAdminLoginBtn.addEventListener("click", () => {
  adminLoginPanel.classList.add("hidden");
});

adminLoginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  adminLoginError.textContent = "";
  try {
    await signInWithEmailAndPassword(auth, ADMIN_EMAIL, adminPasswordInput.value);
    adminLoginPanel.classList.add("hidden");
  } catch (err) {
    adminLoginError.textContent = "Incorrect password.";
    console.error(err);
  }
});

adminLogoutBtn.addEventListener("click", () => {
  signOut(auth);
});

onAuthStateChanged(auth, (user) => {
  isAdmin = !!user && user.email === ADMIN_EMAIL;
  textareaLoadedForThisSession = false;
  adminPanel.classList.toggle("hidden", !isAdmin);
  showAdminLoginBtn.classList.toggle("hidden", isAdmin);
  if (!isAdmin) {
    adminLoginPanel.classList.add("hidden");
  }
});

// ---- Admin actions ----
saveWordsBtn.addEventListener("click", async () => {
  const raw = wordListTextarea.value;
  const words = raw
    .split("\n")
    .map((w) => w.trim())
    .filter((w) => w.length > 0);
  const uniqueWords = [...new Set(words)];

  try {
    await setDoc(
      stateRef,
      { allWords: uniqueWords, updatedAt: serverTimestamp() },
      { merge: true }
    );
    saveWordsStatus.textContent = `Saved ${uniqueWords.length} words. Takes effect after next Reset.`;
  } catch (err) {
    saveWordsStatus.textContent = "Failed to save.";
    console.error(err);
  }
});

drawBtn.addEventListener("click", async () => {
  adminMessageEl.textContent = "";
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(stateRef);
      const data = snap.exists() ? snap.data() : {};
      const bag = data.bagRemaining || [];

      if (bag.length === 0) {
        throw new Error("EMPTY_BAG");
      }

      const idx = Math.floor(Math.random() * bag.length);
      const word = bag[idx];
      const newBag = [...bag.slice(0, idx), ...bag.slice(idx + 1)];

      tx.set(
        stateRef,
        { bagRemaining: newBag, currentWord: word, updatedAt: serverTimestamp() },
        { merge: true }
      );
    });
  } catch (err) {
    if (err.message === "EMPTY_BAG") {
      adminMessageEl.textContent = "Bag is empty — press Reset to refill from the word list.";
    } else {
      adminMessageEl.textContent = "Draw failed.";
      console.error(err);
    }
  }
});

resetBtn.addEventListener("click", async () => {
  adminMessageEl.textContent = "";
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(stateRef);
      const data = snap.exists() ? snap.data() : {};
      const allWords = data.allWords || [];

      tx.set(
        stateRef,
        { bagRemaining: [...allWords], currentWord: "", updatedAt: serverTimestamp() },
        { merge: true }
      );
    });
    adminMessageEl.textContent = "Bag reset.";
  } catch (err) {
    adminMessageEl.textContent = "Reset failed.";
    console.error(err);
  }
});
