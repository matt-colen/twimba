import { auth } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

const redirectToApp = () => (window.location.href = "../html/app.html");

document.addEventListener("submit", (e) => {
  e.preventDefault();

  if (e.target.id === "registerForm") {
    handleRegistration(e);
  } else if (e.target.id === "loginForm") {
    handleLogin(e);
  }
});

const handleRegistration = async (e) => {
  const email = document.querySelector("#registerEmail").value;
  const password = document.querySelector("#registerPassword").value;
  const username = document.querySelector("#registerUsername").value;

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

const handleLogin = async (e) => {
  const email = document.querySelector("#loginEmail").value;
  const password = document.querySelector("#loginPassword").value;

  await signInWithEmailAndPassword(auth, email, password);
  redirectToApp();
};
