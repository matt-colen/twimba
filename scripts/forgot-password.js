import {
  getAuth,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { app } from "../scripts/firebase-config.js";

const passwordReset = (event) => {
  event.preventDefault();
  const email = document.querySelector("#loginEmail").value;
  const auth = getAuth(app);

  sendPasswordResetEmail(auth, email)
    .then(() => {
      window.location.href = "../index.html";
    })
    .catch((e) => {
      console.error(e);
    });
};

document.querySelector("form").addEventListener("submit", passwordReset);
