
(function () {
  "use strict";

  const API_BASE = `https://mealshare.onrender.com`;

  const log = (...a) => console.log("[MS]", ...a);


  // Auth Modal Setup
  function setupAuthModal() {
    const source = document.getElementById("auth-panel");
    const overlay = document.getElementById("auth-modal-overlay");
    const modalBody = document.getElementById("auth-modal-body");
    if (!source || !overlay || !modalBody) {
      return;
    }

    let originalParent = null;
    let originalNextSibling = null;

    function open(initialTab = "login") {
      originalParent = source.parentNode;
      originalNextSibling = source.nextSibling;

      modalBody.appendChild(source);
      source.style.display = "block";
      overlay.classList.remove("hidden"); // Remove hidden class so display:flex works
      overlay.style.display = "flex";
      overlay.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";

      const tabSel = modalBody.querySelector(`.tab[data-tab="${initialTab}"]`);
      if (tabSel) tabSel.click();
      const first = modalBody.querySelector("input");
      if (first) setTimeout(() => first.focus(), 80);
    }

    function close() {
      if (originalParent) {
        if (originalNextSibling)
          originalParent.insertBefore(source, originalNextSibling);
        else originalParent.appendChild(source);
        source.style.display = "none";
      }
      overlay.style.display = "none";
      overlay.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    document
      .querySelectorAll("[data-open-auth], #btn-open-auth, #btn-open-auth-hero")
      .forEach((b) => {
        b.addEventListener("click", function (e) {
          e.preventDefault();
          open("login");
        });
      });

    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close();
    });
    const closeBtn = overlay.querySelector(".auth-close-btn");
    if (closeBtn) closeBtn.addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && overlay.style.display === "flex") close();
    });

    window.setupAuthModal = setupAuthModal;
  }

  // Logout Handler
  async function handleLogout() {
    try {
      await fetch(`/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (err) {
      console.error("Logout error:", err);
    }
    console.log("User logged out successfully");
    setTimeout(() => (location.href = "index.html"), 500);
  }

  // Global logout click handler
  document.addEventListener("click", function (e) {
    if (e.target.closest && e.target.closest("[data-logout]")) {
      e.preventDefault();
      handleLogout();
      return;
    }
  });



  function setupSidebarNav() {
    try {
      document.querySelectorAll(".nav-item").forEach((item) => {
        item.addEventListener("click", function (e) {
          const parent = item.parentNode || document;
          const siblings = Array.from(parent.querySelectorAll(".nav-item"));
          siblings.forEach((s) => s.classList.remove("active"));
          item.classList.add("active");
        });
      });
    } catch (e) {
      console.error("setupSidebarNav error", e);
    }
  }

  function initAuthModalWhenReady(timeoutMs = 4000) {
    const start = Date.now();
    (function tryOnce() {
      if (
        document.getElementById("auth-panel") &&
        document.getElementById("auth-modal-overlay") &&
        document.getElementById("auth-modal-body")
      ) {
        try {
          if (typeof setupAuthModal === "function") {
            setupAuthModal();
            console.log("[init] setupAuthModal() initialized.");
          }
        } catch (e) {
          console.error("[init] setupAuthModal error:", e);
        }
        return;
      }
      if (Date.now() - start < timeoutMs) {
        requestAnimationFrame(tryOnce);
      }
    })();
  }

  // DOMContentLoaded
  document.addEventListener("DOMContentLoaded", function () {
    log("App start — Cookie-based Auth Library Loaded");

    initAuthModalWhenReady(4000);

    try {
      if (typeof setupSidebarNav === "function") setupSidebarNav();
    } catch (e) {
      console.error("init UI toggles error", e);
    }
  });

})();
