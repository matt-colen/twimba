import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBRtqdISjZQn_oxxvwSfeWTsg_nWKJB0b0",
  authDomain: "twimba-f025b.firebaseapp.com",
  databaseURL: "https://twimba-f025b-default-rtdb.firebaseio.com",
  projectId: "twimba-f025b",
  storageBucket: "twimba-f025b.appspot.com",
  messagingSenderId: "531833384581",
  appId: "1:531833384581:web:b9f0376c7860872902c3ec",
};
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

export { app, database, auth };
