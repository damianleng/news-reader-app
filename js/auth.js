import { auth } from "./firebaseConfig.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { clearUserData, syncNews } from "./ui.js";

export let currentUser = null;

document.addEventListener("DOMContentLoaded", () => {
  const logoutBtns = document.querySelectorAll("#logout-btn");

  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser = user;

      logoutBtns.forEach((btn) => {
        btn.style.display = "block";

        btn.addEventListener("click", async () => {
          try {
            await signOut(auth);
            clearUserData();
            M.toast({ html: "Logout successful!" });
            logoutBtns.forEach((button) => (button.style.display = "none"));
            window.location.href = "/pages/auth.html";
          } catch (e) {
            M.toast({ html: e.message });
          }
        });
      });

      // if (logoutBtn) {
      //   logoutBtn.style.display = "block";
      //   logoutBtn.addEventListener("click", async () => {
      //     try {
      //       await signOut(auth);
      //       clearUserData();
      //       M.toast({ html: "Logout successful!" });
      //       logoutBtn.style.display = "none";
      //       window.location.href = "/pages/auth.html";
      //     } catch (e) {
      //       M.toast({ html: e.message });
      //     }
      //   });
      // }
      syncNews();

      // Dispatch a custom event for currentUser initialization
      const userReadyEvent = new CustomEvent("userReady", { detail: user });
      document.dispatchEvent(userReadyEvent);
    } else {
      console.log("No user is currently signed in.");
      window.location.href = "/pages/auth.html";
    }
  });
});
