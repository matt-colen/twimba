import { auth } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

const redirectToApp = () => (window.location.href = "app.html");

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

  await createUserWithEmailAndPassword(auth, email, password);
  redirectToApp();
};

const handleLogin = async (e) => {
  const email = document.querySelector("#loginEmail").value;
  const password = document.querySelector("#loginPassword").value;

  await signInWithEmailAndPassword(auth, email, password);
  redirectToApp();
};
