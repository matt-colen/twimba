import { auth } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

const redirectToApp = () => (window.location.href = "../index.html");

document.addEventListener("submit", (e) => {
  e.preventDefault();
  e.target.id === "registerForm" ? handleRegistration() : handleLogin();
});

const handleRegistration = async () => {
  const username = document.querySelector("#registerUsername").value;
  const email = document.querySelector("#registerEmail").value;
  const password = document.querySelector("#registerPassword").value;

  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  const user = userCredential.user;

  // Updates user profile with username
  await updateProfile(user, {
    displayName: username,
  });

  redirectToApp();
};

const handleLogin = async () => {
  const email = document.querySelector("#loginEmail").value;
  const password = document.querySelector("#loginPassword").value;

  await signInWithEmailAndPassword(auth, email, password);
  redirectToApp();
};
