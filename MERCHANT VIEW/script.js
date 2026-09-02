import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAnKvRsz1_bsttCZUzDxROvFFakechrGug",
    authDomain: "apka-store-1f1df.firebaseapp.com",
    databaseURL: "https://apka-store-1f1df-default-rtdb.firebaseio.com",
    projectId: "apka-store-1f1df",
    storageBucket: "apka-store-1f1df.firebasestorage.app",
    messagingSenderId: "631626163938",
    appId: "1:631626163938:web:e9ee057f3335163381a0bb"
};

const auth = getAuth(initializeApp(firebaseConfig));
const merchantName = document.getElementById("merchantName");
const dashboardTitle = document.getElementById("dashboardTitle");
const dashboardMessage = document.getElementById("dashboardMessage");

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.replace("../CUSTOMER VIEW/index.html");
        return;
    }

    merchantName.textContent = user.displayName || user.email || "Merchant";
});

document.querySelectorAll(".merchant-action").forEach((button) => {
    button.addEventListener("click", () => {
        const action = button.dataset.action;
        dashboardTitle.textContent = action;
        dashboardMessage.textContent = `${action} management will appear here as you add your store data.`;
    });
});

document.getElementById("signOutButton").addEventListener("click", async () => {
    await signOut(auth);
});
