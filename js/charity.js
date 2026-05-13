
const API_BASE = `http://${window.location.hostname}:3000/api`;

let currentUser = null;

let authCheckAttempts = 0;
const MAX_AUTH_ATTEMPTS = 2;

async function checkAuth() {
  authCheckAttempts++;
  
  if (authCheckAttempts > MAX_AUTH_ATTEMPTS) {
    console.log("⚠️ Max auth attempts reached, staying on page");
    return null;
  }

  try {
    console.log("🔍 Checking authentication... (Attempt", authCheckAttempts + ")");
    
    const res = await fetch(`${API_BASE}/auth/me`, {
      method: 'GET',
      credentials: 'include'
    });

    if (!res.ok) {
      console.log("❌ Not authenticated (status:", res.status + ")");
      // Add nocheck parameter to prevent infinite loop
      window.location.replace("index.html?nocheck=1");
      return null;
    }

    const data = await res.json();
    
    if (!data.authenticated || !data.user) {
      console.log("❌ Session invalid");
      window.location.replace("index.html?nocheck=1");
      return null;
    }

    console.log("✅ Authenticated as:", data.user.email, "| Role:", data.user.role);
    authCheckAttempts = 0; // Reset on success
    return data.user;

  } catch (err) {
    console.error("❌ Auth check failed:", err);
    // Add nocheck parameter to prevent infinite loop
    window.location.replace("index.html?nocheck=1");
    return null;
  }
}

// Logout Handler
async function handleLogout() {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
  } catch (err) {
    console.error("Logout error:", err);
  }
  location.href = "index.html";
}

// Setup logout buttons
document.addEventListener("click", (e) => {
  if (e.target.closest("[data-logout]")) {
    e.preventDefault();
    handleLogout();
  }
});

// Navigation
let navSurpluses = document.getElementById("nav-surpluses");
let navRequests = document.getElementById("nav-requests");
let navRatings = document.getElementById("nav-ratings");
let navSettings = document.getElementById("nav4");
let navNotifications = document.getElementById("nav-notifications");

const views = {
  "nav-surpluses": document.getElementById("view-surpluses"),
  "nav-requests": document.getElementById("view-requests"),
  "nav-ratings": document.getElementById("view-ratings"),
  "nav4": document.getElementById("view-settings"),
  "nav-notifications": document.getElementById("view-notifications"),
};

function switchView(activeId) {
  [navSurpluses, navRequests, navRatings, navSettings, navNotifications].forEach((el) => {
    if (el)
      el.style.cssText =
        "padding: 10px;border-radius: 10px;color: var(--muted);cursor: pointer;border: 1px solid transparent;";
  });

  const activeEl = document.getElementById(activeId);
  if (activeEl)
    activeEl.style.cssText =
      "background: rgba(0, 196, 167, 0.08);color: #fff; border-color: rgba(0, 196, 167, 0.12);";

  Object.keys(views).forEach((key) => {
    if (views[key]) {
      views[key].style.display = key === activeId ? "block" : "none";
    }
  });
}

if (navSurpluses) navSurpluses.addEventListener("click", () => switchView("nav-surpluses"));
if (navRequests) navRequests.addEventListener("click", () => switchView("nav-requests"));
if (navRatings) navRatings.addEventListener("click", () => switchView("nav-ratings"));
if (navSettings) navSettings.addEventListener("click", () => switchView("nav4"));
if (navNotifications) navNotifications.addEventListener("click", () => switchView("nav-notifications"));

// Distance Constants & Functions
const MAX_DISTANCE_KM = 7; // Maximum distance in kilometers

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

// Check if a location is within the maximum distance from charity
function isWithinDistance(charityLat, charityLng, targetLat, targetLng) {
  if (!charityLat || !charityLng || !targetLat || !targetLng) return false;
  const distance = calculateDistance(charityLat, charityLng, targetLat, targetLng);
  return distance <= MAX_DISTANCE_KM;
}

// Get list of nearby restaurant emails
async function getNearbyRestaurantEmails() {
  if (!currentUser || !currentUser.lat || !currentUser.lng) return [];
  
  const allUsers = await fetchUsers();
  return allUsers
    .filter(u => u.role === "restaurant" && u.lat && u.lng)
    .filter(rest => isWithinDistance(currentUser.lat, currentUser.lng, rest.lat, rest.lng))
    .map(rest => rest.email);
}

// Get restaurant name by email
async function getRestaurantName(email) {
  const allUsers = await fetchUsers();
  const restaurant = allUsers.find(u => u.email === email);
  return restaurant?.name || email;
}

// Store restaurant names cache
let restaurantNamesCache = {};

// Preload restaurant names
async function preloadRestaurantNames() {
  const allUsers = await fetchUsers();
  allUsers.filter(u => u.role === "restaurant").forEach(u => {
    restaurantNamesCache[u.email] = u.name;
  });
}

// Calculate remaining time for a surplus
function calculateRemainingTime(createdAt, expiryHours) {
  const createdTime = new Date(createdAt).getTime();
  const expiryTime = createdTime + (expiryHours * 60 * 60 * 1000);
  const now = Date.now();
  const remainingMs = expiryTime - now;
  
  if (remainingMs <= 0) return null; // Expired
  
  const hours = Math.floor(remainingMs / (1000 * 60 * 60));
  const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);
  
  return { hours, minutes, seconds, totalMs: remainingMs };
}

// Format remaining time as string
function formatRemainingTime(remaining) {
  if (!remaining) return 'منتهية';
  return `${remaining.hours}:${String(remaining.minutes).padStart(2, '0')}:${String(remaining.seconds).padStart(2, '0')}`;
}

// Track requested surplus IDs (to show "تم ارسال الطلب")
let requestedSurplusIds = new Set();

// Track surplus request statuses from server
let surplusRequestStatuses = {}; // { surplusId: 'pending' | 'accepted' | 'rejected' }

// Countdown interval reference
let countdownInterval = null;

// Utility Functions
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showToast(message, type = 'info') {
  // Remove any existing notification modal
  const existing = document.querySelector('.notification-modal-overlay');
  if (existing) existing.remove();

  // Define colors and icons based on type
  const config = {
    success: {
      color: '#00c4a7',
      bgColor: 'rgba(0, 196, 167, 0.1)',
      icon: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="11" stroke="#00c4a7" stroke-width="2"/>
        <path d="M8 12l2.5 2.5L16 9" stroke="#00c4a7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`
    },
    danger: {
      color: '#ef4444',
      bgColor: 'rgba(239, 68, 68, 0.1)',
      icon: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="11" stroke="#ef4444" stroke-width="2"/>
        <path d="M15 9l-6 6M9 9l6 6" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round"/>
      </svg>`
    },
    warn: {
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.1)',
      icon: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L2 22h20L12 2z" stroke="#f59e0b" stroke-width="2" stroke-linejoin="round"/>
        <path d="M12 9v4M12 17h.01" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round"/>
      </svg>`
    },
    info: {
      color: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.1)',
      icon: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="11" stroke="#3b82f6" stroke-width="2"/>
        <path d="M12 8h.01M12 11v5" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round"/>
      </svg>`
    },
    default: {
      color: '#6b7280',
      bgColor: 'rgba(107, 114, 128, 0.1)',
      icon: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="11" stroke="#6b7280" stroke-width="2"/>
        <path d="M12 8h.01M12 11v5" stroke="#6b7280" stroke-width="2.5" stroke-linecap="round"/>
      </svg>`
    }
  };

  const currentConfig = config[type] || config.default;

  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'notification-modal-overlay';
  overlay.innerHTML = `
    <div class="notification-modal-card">
      <button class="notification-close-x" title="إغلاق">&times;</button>
      <div class="notification-icon-wrapper">
        ${currentConfig.icon}
      </div>
      <p class="notification-message">${message}</p>
      <button class="notification-ok-btn">حسناً</button>
    </div>
  `;

  // Styles for overlay
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99999;
    animation: modalFadeIn 0.25s ease;
  `;

  // Get card element and style it
  const card = overlay.querySelector('.notification-modal-card');
  card.style.cssText = `
    position: relative;
    background: #fff;
    border-radius: 12px;
    padding: 30px 40px;
    text-align: center;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
    max-width: 380px;
    min-width: 300px;
    animation: modalSlideUp 0.3s ease;
  `;

  // Close X button
  const closeX = overlay.querySelector('.notification-close-x');
  closeX.style.cssText = `
    position: absolute;
    top: 10px;
    right: 12px;
    background: none;
    border: none;
    font-size: 24px;
    color: #9ca3af;
    cursor: pointer;
    line-height: 1;
    transition: color 0.2s;
  `;
  closeX.onmouseover = () => closeX.style.color = '#374151';
  closeX.onmouseout = () => closeX.style.color = '#9ca3af';
  closeX.onclick = () => overlay.remove();

  // Icon wrapper
  const iconWrapper = overlay.querySelector('.notification-icon-wrapper');
  iconWrapper.style.cssText = `
    width: 70px;
    height: 70px;
    margin: 0 auto 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${currentConfig.bgColor};
    border-radius: 50%;
    animation: iconBounce 0.4s ease 0.1s both;
  `;

  // Message
  const msgEl = overlay.querySelector('.notification-message');
  msgEl.style.cssText = `
    margin: 0 0 25px 0;
    font-size: 16px;
    color: #374151;
    line-height: 1.6;
    font-weight: 500;
  `;

  // OK button
  const okBtn = overlay.querySelector('.notification-ok-btn');
  okBtn.style.cssText = `
    background: ${currentConfig.color};
    color: #fff;
    border: none;
    padding: 12px 50px;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
  `;
  okBtn.onmouseover = () => {
    okBtn.style.transform = 'scale(1.03)';
    okBtn.style.boxShadow = `0 4px 15px ${currentConfig.color}50`;
  };
  okBtn.onmouseout = () => {
    okBtn.style.transform = 'scale(1)';
    okBtn.style.boxShadow = 'none';
  };
  okBtn.onclick = () => overlay.remove();

  // Add keyframe animations
  if (!document.getElementById('notification-modal-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-modal-styles';
    style.textContent = `
      @keyframes modalFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes modalSlideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes iconBounce {
        0% { transform: scale(0); }
        60% { transform: scale(1.1); }
        100% { transform: scale(1); }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(overlay);

  // Click outside to close
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  // Auto close after 5 seconds
  setTimeout(() => {
    if (overlay.parentNode) overlay.remove();
  }, 5000);
}

// Custom Confirm Modal
function showConfirm(message, onConfirm, onCancel = null) {
  const existing = document.querySelector('.confirm-modal-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'confirm-modal-overlay';
  overlay.innerHTML = `
    <div class="confirm-modal-card">
      <button class="confirm-close-x" title="إغلاق">&times;</button>
      <div class="confirm-icon-wrapper">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="11" stroke="#f59e0b" stroke-width="2"/>
          <path d="M12 8v4M12 16h.01" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
      </div>
      <p class="confirm-message">${message}</p>
      <div class="confirm-buttons">
        <button class="confirm-btn-ok">موافق</button>
        <button class="confirm-btn-cancel">إلغاء</button>
      </div>
    </div>
  `;

  overlay.style.cssText = `position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:99999;animation:modalFadeIn 0.25s ease;`;
  
  const card = overlay.querySelector('.confirm-modal-card');
  card.style.cssText = `position:relative;background:#fff;border-radius:12px;padding:30px 40px;text-align:center;box-shadow:0 10px 40px rgba(0,0,0,0.15);max-width:400px;min-width:320px;animation:modalSlideUp 0.3s ease;`;
  
  const closeX = overlay.querySelector('.confirm-close-x');
  closeX.style.cssText = `position:absolute;top:10px;right:12px;background:none;border:none;font-size:24px;color:#9ca3af;cursor:pointer;line-height:1;`;
  closeX.onclick = () => { overlay.remove(); if (onCancel) onCancel(); };
  
  const iconWrapper = overlay.querySelector('.confirm-icon-wrapper');
  iconWrapper.style.cssText = `width:70px;height:70px;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;background:rgba(245,158,11,0.1);border-radius:50%;`;
  
  const msgEl = overlay.querySelector('.confirm-message');
  msgEl.style.cssText = `margin:0 0 25px 0;font-size:16px;color:#374151;line-height:1.6;font-weight:500;`;
  
  const btnsContainer = overlay.querySelector('.confirm-buttons');
  btnsContainer.style.cssText = `display:flex;gap:12px;justify-content:center;`;
  
  const okBtn = overlay.querySelector('.confirm-btn-ok');
  okBtn.style.cssText = `background:#00c4a7;color:#fff;border:none;padding:12px 35px;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;`;
  okBtn.onclick = () => { overlay.remove(); if (onConfirm) onConfirm(); };
  
  const cancelBtn = overlay.querySelector('.confirm-btn-cancel');
  cancelBtn.style.cssText = `background:#ef4444;color:#fff;border:none;padding:12px 35px;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;`;
  cancelBtn.onclick = () => { overlay.remove(); if (onCancel) onCancel(); };

  document.body.appendChild(overlay);
}

// API Functions (all with credentials: include)
async function fetchSurpluses() {
  try {
    // Pass charity email to also display surpluses reserved for them
    const charityEmail = currentUser?.email ? `?charity_email=${encodeURIComponent(currentUser.email)}` : '';
    const res = await fetch(`${API_BASE}/surpluses${charityEmail}`, {
      credentials: 'include'
    });
    if (!res.ok) throw new Error("Failed to fetch surpluses");
    return await res.json();
  } catch (err) {
    console.error("❌ Fetch surpluses error:", err);
    return [];
  }
}

async function fetchMyRequests(charityEmail) {
  try {
    const res = await fetch(
      `${API_BASE}/requests?charity_email=${encodeURIComponent(charityEmail)}`,
      { credentials: 'include' }
    );
    if (!res.ok) throw new Error("Failed to fetch requests");
    return await res.json();
  } catch (err) {
    console.error("❌ Fetch requests error:", err);
    return [];
  }
}

async function fetchUsers() {
  try {
    const res = await fetch(`${API_BASE}/users`, {
      credentials: 'include'
    });
    if (!res.ok) throw new Error("Failed to fetch users");
    return await res.json();
  } catch (err) {
    console.error("❌ Fetch users error:", err);
    return [];
  }
}

async function fetchRatings(restaurantEmail) {
  try {
    const res = await fetch(
      `${API_BASE}/ratings/restaurant/${encodeURIComponent(restaurantEmail)}`,
      { credentials: 'include' }
    );
    if (!res.ok) throw new Error("Failed to fetch ratings");
    return await res.json();
  } catch (err) {
    console.error("❌ Fetch ratings error:", err);
    return [];
  }
}

async function fetchRatingsAvg(restaurantEmail) {
  try {
    const res = await fetch(
      `${API_BASE}/ratings/restaurant/${encodeURIComponent(restaurantEmail)}/avg`,
      { credentials: 'include' }
    );
    if (!res.ok) throw new Error("Failed to fetch ratings avg");
    return await res.json();
  } catch (err) {
    console.error("❌ Fetch ratings avg error:", err);
    return { staff_behavior_avg: 0, total_ratings: 0 };
  }
}

async function submitRating(ratingData) {
  try {
    const res = await fetch(`${API_BASE}/ratings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify(ratingData)
    });
    if (!res.ok) throw new Error("Failed to submit rating");
    return { success: true };
  } catch (err) {
    console.error("❌ Submit rating error:", err);
    return { success: false, error: err.message };
  }
}

// Check if a rating exists for a specific request
async function checkRatingExists(requestId) {
  try {
    const res = await fetch(`${API_BASE}/ratings/check/${requestId}`, {
      credentials: 'include'
    });
    if (!res.ok) return { hasRating: false };
    return await res.json();
  } catch (err) {
    console.error("❌ Check rating error:", err);
    return { hasRating: false };
  }
}

async function createRequest(requestData) {
  try {
    const res = await fetch(`${API_BASE}/requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify(requestData)
    });
    if (!res.ok) throw new Error("Failed to create request");
    return { success: true };
  } catch (err) {
    console.error("❌ Create request error:", err);
    return { success: false, error: err.message };
  }
}

async function updateUserProfile(email, data) {
  try {
    const res = await fetch(`${API_BASE}/users/by-email/${encodeURIComponent(email)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to update profile");
    return { success: true };
  } catch (err) {
    console.error("❌ Update profile error:", err);
    return { success: false, error: err.message };
  }
}

async function fetchSurplusById(id) {
  try {
    const surpluses = await fetchSurpluses();
    return surpluses.find(s => s.id === id) || null;
  } catch (err) {
    return null;
  }
}

// Notifications API Functions
let cachedNotifications = [];

async function fetchNotifications() {
  try {
    // Fetch user notifications by email instead of role
    if (!currentUser?.email) return [];
    const res = await fetch(`${API_BASE}/notifications/email/${encodeURIComponent(currentUser.email)}`, {
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return await res.json();
  } catch (err) {
    console.error("❌ Fetch notifications error:", err);
    return [];
  }
}

async function markNotificationAsRead(id) {
  try {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to mark as read');
    return { success: true, message: data.message };
  } catch (err) {
    console.error("❌ Mark notification as read error:", err);
    return { success: false, error: err.message };
  }
}

async function deleteNotification(id) {
  try {
    const res = await fetch(`${API_BASE}/notifications/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete notification');
    return { success: true, message: data.message };
  } catch (err) {
    console.error("❌ Delete notification error:", err);
    return { success: false, error: err.message };
  }
}

async function deleteAllNotifications() {
  try {
    const res = await fetch(`${API_BASE}/notifications/delete-all`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email: currentUser?.email })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete notifications');
    return { success: true, message: data.message };
  } catch (err) {
    console.error("❌ Delete all notifications error:", err);
    return { success: false, error: err.message };
  }
}

// Update unread notification badge in sidebar navigation
function updateNotificationBadge(unreadCount) {
  const navItem = document.getElementById('nav-notifications');
  if (!navItem) return;

  // Remove existing badge if present
  const existingBadge = navItem.querySelector('.notification-badge');
  if (existingBadge) existingBadge.remove();

  // Add new badge if there are unread notifications
  if (unreadCount > 0) {
    const badge = document.createElement('span');
    badge.className = 'notification-badge';
    badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
    badge.style.cssText = `
     order: -1;                 /* Makes it appear before notification text */
  min-width: 18px;
  height: 18px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 10px;
  color: #fff;
  background: rgb(239,68,68);
  padding: 0 4px;
  margin-right: 0;           /* Make sure to remove old margin-right */
  margin-left: 8px;         /*
    `;
    // Insert badge at the start of text (before text in RTL layout)
    navItem.insertBefore(badge, navItem.firstChild);
  }
}

function renderNotifications() {
  const container = document.getElementById('view-notifications');
  if (!container) return;

  // Count unread notifications
  const unreadCount = cachedNotifications.filter(n => !n.is_read).length;

  // Update notification badge in navigation
  updateNotificationBadge(unreadCount);

  container.innerHTML = `
    <div class="card">
      <div class="notifications-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:10px;">
        <h3 style="margin:0;">الإشعارات <span style="font-size:14px;color:var(--muted);">(${cachedNotifications.length})</span></h3>
        <div style="display:flex;gap:8px;align-items:center;">
          ${unreadCount > 0 ? `<span style="background:#00c4a7;color:#fff;padding:4px 12px;border-radius:20px;font-size:12px;">${unreadCount} غير مقروء</span>` : ''}
          ${cachedNotifications.length > 0 ? `<button id="btn-delete-all-notifications" style="
            background:#ef4444;
            color:#fff;
            border:none;
            padding:6px 14px;
            border-radius:8px;
            font-size:12px;
            cursor:pointer;
            display:flex;
            align-items:center;
            gap:4px;
          "><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg> حذف الكل</button>` : ''}
        </div>
      </div>
      <div class="notifications-list" id="notifications-list">
        ${cachedNotifications.length === 0 ? `
          <div style="text-align:center;padding:40px;color:var(--muted);">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:16px;opacity:0.5;">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <p>لا توجد إشعارات</p>
          </div>
        ` : cachedNotifications.map(notification => {
          const isRead = notification.is_read === 1 || notification.is_read === true;
          const createdAt = notification.created_at ? new Date(notification.created_at).toLocaleString('ar-LY') : '-';
          const typeIcon = getNotificationIcon(notification.type);
          const typeColor = getNotificationColor(notification.type);
          
          return `
            <div class="notification-item ${isRead ? 'read' : 'unread'}" 
                 data-id="${notification.id}"
                 style="
                   display:flex;
                   gap:12px;
                   padding:16px;
                   margin-bottom:12px;
                   background:${isRead ? 'var(--surface)' : 'rgba(0, 196, 167, 0.08)'};
                   border-radius:12px;
                   border:1px solid ${isRead ? 'var(--border)' : 'rgba(0, 196, 167, 0.2)'};
                   transition:all 0.2s ease;
                 ">
              <div class="notification-icon" style="
                width:40px;
                height:40px;
                border-radius:10px;
                background:${typeColor};
                display:flex;
                align-items:center;
                justify-content:center;
                flex-shrink:0;
              ">
                ${typeIcon}
              </div>
              <div class="notification-content" style="flex:1;min-width:0;">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">
                  <h4 style="margin:0;font-size:14px;font-weight:600;color:var(--text);">${escapeHtml(notification.title || 'إشعار')}</h4>
                  ${!isRead ? '<span style="width:8px;height:8px;background:#00c4a7;border-radius:50%;flex-shrink:0;"></span>' : ''}
                </div>
                <p style="margin:0 0 8px 0;font-size:12px;color:var(--muted);line-height:1.5;">${escapeHtml(notification.message || '')}</p>
                <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">
                  <span style="font-size:11px;color:var(--muted);">${createdAt}</span>
                  <div style="display:flex;gap:6px;">
                    ${!isRead ? `<button class="btn-mark-read" data-id="${notification.id}" style="
                      background:transparent;
                      border:1px solid var(--border);
                      color:var(--text);
                      padding:4px 10px;
                      border-radius:6px;
                      font-size:11px;
                      cursor:pointer;
                    ">تمييز كمقروء</button>` : ''}
                    <button class="btn-delete-notification" data-id="${notification.id}" style="
                      background:transparent;
                      border:1px solid #ef4444;
                      color:#ef4444;
                      padding:4px 10px;
                      border-radius:6px;
                      font-size:11px;
                      cursor:pointer;
                    ">حذف</button>
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function getNotificationIcon(type) {
  const icons = {
    'request': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
    'surplus': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>',
    'surplus.created': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>',
    'request.accepted': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M20 6L9 17l-5-5"></path></svg>',
    'request.rejected': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M18 6L6 18"></path><path d="M6 6l12 12"></path></svg>',
    'admin_message': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>',
    'system': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>'
  };
  return icons[type] || icons['system'];
}

function getNotificationColor(type) {
  const colors = {
    'request': '#3b82f6',
    'surplus': '#22c55e',
    'surplus.created': '#22c55e',
    'request.accepted': '#22c55e',
    'request.rejected': '#ef4444',
    'request.created': '#f59e0b',
    'admin_message': '#8b5cf6',
    'system': '#6b7280'
  };
  return colors[type] || colors['system'];
}

// Main Render Function (OPTIMIZED)
async function renderCharity() {
  if (!currentUser) return;

  // Show loading indicator immediately
  const tbody = document.getElementById("surplus-table-body");
  const cr = document.getElementById("charity-requests-body");
  
  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:20px;"><span class="loading-spinner"></span> جاري تحميل الفوائض...</td></tr>';
  }
  if (cr) {
    cr.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:20px;"><span class="loading-spinner"></span> جاري تحميل الطلبات...</td></tr>';
  }

  // Add loading spinner CSS if not already added
  if (!document.getElementById('loading-spinner-styles')) {
    const style = document.createElement('style');
    style.id = 'loading-spinner-styles';
    style.textContent = `
      .loading-spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid var(--muted);
        border-top-color: var(--primary);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin-left: 8px;
        vertical-align: middle;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  try {
    // Cleanup old requests (accepted/rejected older than 7 days)
    fetch(`${API_BASE}/requests/cleanup-old`, {
      method: 'POST',
      credentials: 'include'
    }).catch(() => {});

    // STEP 1: Fetch ALL data in parallel for maximum speed
    console.log("🚀 Starting parallel data fetch...");
    const startTime = performance.now();
    
    const [allUsers, allSurpluses, myRequests, notifications] = await Promise.all([
      fetchUsers(),
      fetchSurpluses(),
      fetchMyRequests(currentUser.email),
      fetchNotifications()
    ]);
    
    console.log(`⚡ Data fetched in ${(performance.now() - startTime).toFixed(0)}ms`);

    // STEP 2: Process data locally (no more API calls)
    // Build restaurant names cache from already fetched users
    restaurantNamesCache = {};
    const restaurantsList = allUsers.filter(u => u.role === "restaurant");
    restaurantsList.forEach(u => {
      restaurantNamesCache[u.email] = u.name;
    });

    // Build users map for requests table
    const usersMap = {};
    allUsers.forEach(u => { usersMap[u.email] = u.name; });

    // Get nearby restaurant emails (based on distance)
    const nearbyEmails = restaurantsList
      .filter(rest => rest.lat && rest.lng && isWithinDistance(currentUser.lat, currentUser.lng, rest.lat, rest.lng))
      .map(rest => rest.email);
    console.log(`📍 Found ${nearbyEmails.length} nearby restaurants within ${MAX_DISTANCE_KM}km`);

    // Track request statuses
    surplusRequestStatuses = {};
    myRequests.forEach(r => {
      surplusRequestStatuses[r.surplus_id] = r.status;
    });
    console.log(`📝 User has ${myRequests.length} existing requests`);

    // Render notifications (already fetched)
    cachedNotifications = notifications;
    console.log(`🔔 Loaded ${cachedNotifications.length} notifications`);
    renderNotifications();

    // STEP 3: Render Surpluses Table - ONLY from nearby restaurants
    if (tbody) {
      tbody.innerHTML = "";

      // Clear previous countdown interval
      if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
      }

      const filterType = document.getElementById("filter-type")?.value || "";
      const filterExpiry = document.getElementById("filter-expiry")?.value || "";
      
      // Attach event listener for filter if not already attached
      const expiryFilter = document.getElementById("filter-expiry");
      if (expiryFilter && !expiryFilter.dataset.listenerAttached) {
        expiryFilter.addEventListener("change", () => {
          console.log("🔄 Filter changed, re-rendering...");
          renderCharity();
        });
        expiryFilter.dataset.listenerAttached = "true";
      }
      
      console.log(`🔍 Current filter: type="${filterType}", expiry="${filterExpiry}"`);

      // Filter surpluses to only show from nearby restaurants AND not expired
      const surpluses = allSurpluses.filter(s => {
        if (!nearbyEmails.includes(s.restaurant_email)) return false;
        // Check if not expired
        const remaining = calculateRemainingTime(s.created_at, s.expiry_hours);
        return remaining !== null; // Only show non-expired
      });
      console.log(`📦 Showing ${surpluses.length} valid surpluses from nearby restaurants (out of ${allSurpluses.length} total)`);

      if (!Array.isArray(surpluses) || surpluses.length === 0) {
        tbody.innerHTML =
          '<tr><td colspan="5" style="text-align:center;color:var(--muted)">لا توجد فوائض متاحة من مؤسسات قريبة (ضمن 7 كم)</td></tr>';
      } else {
        surpluses
          .filter(s => {
            if (filterType && s.title !== filterType) return false;
            // Filter by remaining time ranges
            if (filterExpiry) {
              const remaining = calculateRemainingTime(s.created_at, s.expiry_hours);
              if (!remaining) return false;
              const totalHours = remaining.hours + (remaining.minutes / 60);
              console.log(`🔍 Filter: ${s.title}, remaining: ${totalHours.toFixed(2)}h, filter: ${filterExpiry}`);
              // 3 hours or less
              if (filterExpiry === "3" && totalHours > 3) return false;
              // From 3 to 6 hours  
              if (filterExpiry === "6" && (totalHours <= 3 || totalHours > 6)) return false;
              // From 6 to 12 hours
              if (filterExpiry === "12" && (totalHours <= 6 || totalHours > 12)) return false;
            }
            return true;
          })
          .forEach(s => {
            const remaining = calculateRemainingTime(s.created_at, s.expiry_hours);
            const restaurantName = restaurantNamesCache[s.restaurant_email] || s.restaurant_email;
            const requestStatus = surplusRequestStatuses[s.id];
            const isRequested = requestedSurplusIds.has(s.id) || requestStatus;
            
            // Determine button HTML based on request status
            let actionButtonHtml = '';
            if (requestStatus === 'accepted') {
              actionButtonHtml = '<button class="btn btn-accepted" disabled style="background: #22c55e; color: white; cursor: not-allowed;">✓ تمت الموافقة</button>';
            } else if (requestStatus === 'rejected') {
              actionButtonHtml = '<button class="btn btn-rejected" disabled style="background: #ef4444; color: white; cursor: not-allowed;">✗ تم الرفض</button>';
            } else if (requestStatus === 'pending' || requestedSurplusIds.has(s.id)) {
              actionButtonHtml = '<button class="btn btn-pending" disabled style="background: #6b7280; color: white; cursor: not-allowed;">⏳ قيد المعالجة</button>';
            } else {
              actionButtonHtml = `<button class="btn btn-request" data-id="${s.id}">طلب استلام</button>`;
            }
            
            const tr = document.createElement("tr");
            tr.id = `surplus-row-${s.id}`;
            tr.innerHTML = `
              <td>${escapeHtml(s.title)}</td>
              <td>
                <span class="org-link" data-email="${escapeHtml(s.restaurant_email)}"
                  style="cursor:pointer; color:var(--primary);">
                  ${escapeHtml(restaurantName)}
                </span>
              </td>
              <td>${escapeHtml(s.qty)}</td>
              <td>
                <span class="countdown-timer" data-created="${s.created_at}" data-expiry="${s.expiry_hours}" data-surplus-id="${s.id}"
                  style="font-family: monospace; font-weight: bold; color: ${remaining && remaining.hours < 1 ? '#ef4444' : remaining && remaining.hours < 3 ? '#f59e0b' : '#00c4a7'};">
                  ${formatRemainingTime(remaining)}
                </span>
              </td>
              <td>
                <button class="btn btn-view-surplus" data-id="${s.id}">عرض التفاصيل</button>
                ${actionButtonHtml}
              </td>
            `;
            tbody.appendChild(tr);
          });

        // Start countdown timer
        startCountdownTimer();
      }
    }

    // STEP 4: Render Requests Table
    if (cr) {
      cr.innerHTML = "";

      // Check ratings for accepted requests IN PARALLEL (not sequential)
      const acceptedRequests = myRequests.filter(req => req.status === "accepted");
      let ratingChecks = {};
      
      if (acceptedRequests.length > 0) {
        // Fetch all rating checks in parallel
        const ratingCheckPromises = acceptedRequests.map(r => 
          checkRatingExists(r.id).then(check => ({ id: r.id, hasRating: check.hasRating }))
        );
        const ratingResults = await Promise.all(ratingCheckPromises);
        ratingResults.forEach(result => {
          ratingChecks[result.id] = result.hasRating;
        });
      }

      myRequests.forEach((r) => {
        const tr = document.createElement("tr");
        tr.id = `request-row-${r.id}`;
        let statusHtml = '<span class="status warn">قيد المعالجة</span>';
        if (r.status === "accepted")
          statusHtml = '<span class="status success">مقبول</span>';
        else if (r.status === "rejected")
          statusHtml = '<span class="status danger">مرفوض</span>';

        // Get restaurant name from already fetched users map
        const restaurantName = usersMap[r.restaurant_email] || r.restaurant_email;

        // Check if already rated
        const isRated = ratingChecks[r.id] || false;

        // Determine button HTML for accepted requests
        let ratingButtonHtml = "";
        if (r.status === "accepted") {
          if (isRated) {
            ratingButtonHtml = `<button class="btn btn-rated" disabled style="background: #9ca3af; color: white; cursor: not-allowed; opacity: 0.7;">✓ تم التقييم</button>`;
          } else {
            ratingButtonHtml = `<button class="btn btn-rate" data-request-id="${r.id}" data-surplus-id="${r.surplus_id}" data-restaurant-email="${escapeHtml(r.restaurant_email)}">تقييم</button>`;
          }
        }

        tr.innerHTML = `
          <td>${escapeHtml(r.title)}</td>
          <td>
            <span class="org-link" data-email="${escapeHtml(r.restaurant_email)}"
              style="cursor:pointer; color:var(--primary);">
              ${escapeHtml(restaurantName)}
            </span>
          </td>
          <td>${new Date(r.created_at).toLocaleString("en-US")}</td>
          <td>${statusHtml}</td>
          <td style="display:flex;gap:6px;flex-wrap:wrap;">
            ${ratingButtonHtml}
          </td>
        `;
        cr.appendChild(tr);
      });
    }
          // <button class="btn btn-delete-request" data-id="${r.id}" style="background:#ef4444;color:#fff;">حذف</button>

    console.log(`✅ Charity dashboard rendered in ${(performance.now() - startTime).toFixed(0)}ms total`);
    
  } catch (err) {
    console.error("❌ Error rendering charity dashboard:", err);
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:red">فشل تحميل الفوائض</td></tr>';
    }
  }
}

// Refresh Requests Table Only (for after sending new request)
async function refreshRequestsTable() {
  const cr = document.getElementById("charity-requests-body");
  if (!cr || !currentUser) return;
  
  console.log("🔄 Refreshing requests table...");
  
  try {
    // Fetch fresh data in parallel
    const [myRequests, allUsers] = await Promise.all([
      fetchMyRequests(currentUser.email),
      fetchUsers()
    ]);

    // Build users map
    const usersMap = {};
    allUsers.forEach(u => { usersMap[u.email] = u.name; });

    // Update the request statuses cache
    myRequests.forEach(r => {
      surplusRequestStatuses[r.surplus_id] = r.status;
    });

    // Check ratings for accepted requests in parallel
    const acceptedRequests = myRequests.filter(req => req.status === "accepted");
    let ratingChecks = {};
    
    if (acceptedRequests.length > 0) {
      const ratingCheckPromises = acceptedRequests.map(r => 
        checkRatingExists(r.id).then(check => ({ id: r.id, hasRating: check.hasRating }))
      );
      const ratingResults = await Promise.all(ratingCheckPromises);
      ratingResults.forEach(result => {
        ratingChecks[result.id] = result.hasRating;
      });
    }

    // Clear and re-render the requests table
    cr.innerHTML = "";

    myRequests.forEach((r) => {
      const tr = document.createElement("tr");
      tr.id = `request-row-${r.id}`;
      let statusHtml = '<span class="status warn">قيد المعالجة</span>';
      if (r.status === "accepted")
        statusHtml = '<span class="status success">مقبول</span>';
      else if (r.status === "rejected")
        statusHtml = '<span class="status danger">مرفوض</span>';

      const restaurantName = usersMap[r.restaurant_email] || r.restaurant_email;
      const isRated = ratingChecks[r.id] || false;

      let ratingButtonHtml = "";
      if (r.status === "accepted") {
        if (isRated) {
          ratingButtonHtml = `<button class="btn btn-rated" disabled style="background: #9ca3af; color: white; cursor: not-allowed; opacity: 0.7;">✓ تم التقييم</button>`;
        } else {
          ratingButtonHtml = `<button class="btn btn-rate" data-request-id="${r.id}" data-surplus-id="${r.surplus_id}" data-restaurant-email="${escapeHtml(r.restaurant_email)}">تقييم</button>`;
        }
      }

      tr.innerHTML = `
        <td>${escapeHtml(r.title)}</td>
        <td>
          <span class="org-link" data-email="${escapeHtml(r.restaurant_email)}"
            style="cursor:pointer; color:var(--primary);">
            ${escapeHtml(restaurantName)}
          </span>
        </td>
        <td>${new Date(r.created_at).toLocaleString("en-US")}</td>
        <td>${statusHtml}</td>
        <td style="display:flex;gap:6px;flex-wrap:wrap;">
          ${ratingButtonHtml}
        </td>
      `;
      cr.appendChild(tr);
    });
    
    console.log(`✅ Requests table refreshed with ${myRequests.length} requests`);
    
    // Also update stats
    await updateCharityStats(true);
    
  } catch (err) {
    console.error("❌ Error refreshing requests table:", err);
  }
}

// Countdown Timer
function startCountdownTimer() {
  // Clear any existing interval
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }

  countdownInterval = setInterval(() => {
    const timers = document.querySelectorAll('.countdown-timer');
    
    timers.forEach(timer => {
      const createdAt = timer.dataset.created;
      const expiryHours = parseFloat(timer.dataset.expiry);
      const surplusId = timer.dataset.surplusId;
      
      const remaining = calculateRemainingTime(createdAt, expiryHours);
      
      if (!remaining) {
        // Expired - remove the row with animation
        const row = document.getElementById(`surplus-row-${surplusId}`);
        if (row) {
          row.style.transition = 'opacity 0.5s, transform 0.5s';
          row.style.opacity = '0';
          row.style.transform = 'translateX(-20px)';
          setTimeout(() => row.remove(), 500);
        }
        return;
      }
      
      // Update timer display
      timer.textContent = formatRemainingTime(remaining);
      
      // Update color based on remaining time
      if (remaining.hours < 1) {
        timer.style.color = '#ef4444'; // Red - urgent
      } else if (remaining.hours < 3) {
        timer.style.color = '#f59e0b'; // Orange - warning
      } else {
        timer.style.color = '#00c4a7'; // Green - safe
      }
    });

    // Check if any timers remain
    if (timers.length === 0) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
  }, 1000); // Update every second
}

// Filter Initialization
function initSurplusFilters() {
  // Setup expiry filter with remaining time ranges
  const expiryFilter = document.getElementById("filter-expiry");
  if (expiryFilter) {
    // Filter options based on remaining time
    expiryFilter.innerHTML = `
      <option value="">كل الصلاحيات</option>
      <option value="3">3 ساعات أو أقل</option>
      <option value="6">من 3 إلى 6 ساعات</option>
      <option value="12">من 6 إلى 12 ساعة</option>
    `;
    expiryFilter.onchange = renderCharity;
  }
}

// Rating Modal
function openRatingModal(requestId, surplusId, restaurantEmail, surplusTitle) {
  // Get restaurant name from cache
  const restaurantName = restaurantNamesCache[restaurantEmail] || restaurantEmail;
  
  const html = `
    <div style="padding:20px;max-width:500px">
      <h3>تقييم المؤسسة</h3>
      <p style="color:var(--muted);font-size:14px">
        المؤسسة: <strong style="color:var(--primary)">${escapeHtml(restaurantName)}</strong>
        <br>تقييم: ${escapeHtml(surplusTitle || '')}
      </p>

      <form id="form-rating">
        <div class="field">
          <label>جودة معاملة طاقم العمل (1-5)</label>
          <input type="range" min="1" max="5" value="3" id="staff-behavior-rating" style="width:100%">
          <div style="text-align:center;font-size:12px"><span id="staff-val">3</span>/5</div>
        </div>

        <div class="field">
          <label>الالتزام بالوقت (1-5)</label>
          <input type="range" min="1" max="5" value="3" id="timeliness-rating" style="width:100%">
          <div style="text-align:center;font-size:12px"><span id="timeliness-val">3</span>/5</div>
        </div>

        <div class="field">
          <label>جودة التغليف (1-5)</label>
          <input type="range" min="1" max="5" value="3" id="packaging-rating" style="width:100%">
          <div style="text-align:center;font-size:12px"><span id="packaging-val">3</span>/5</div>
        </div>

        <div class="field">
          <label>ملاحظات إضافية (اختياري)</label>
          <textarea id="rating-comment" rows="3" style="width:100%"></textarea>
        </div>

        <button type="submit" class="btn-block">إرسال التقييم</button>
      </form>
    </div>
  `;

  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.innerHTML = `<div class="modal-content">${html}</div>`;
  document.body.appendChild(modal);

  // Update range values
  ["staff-behavior", "timeliness", "packaging"].forEach((k) => {
    const input = modal.querySelector(`#${k}-rating`);
    const span = modal.querySelector(`#${k.split('-')[0]}-val`);
    if (input && span) {
      input.addEventListener("input", () => (span.textContent = input.value));
    }
  });

  // Submit rating
  modal.querySelector("#form-rating").addEventListener("submit", async (e) => {
    e.preventDefault();

    const result = await submitRating({
      request_id: requestId,
      surplus_id: surplusId,
      restaurant_email: restaurantEmail,
      charity_email: currentUser.email,
      staff_behavior_rating: Number(document.getElementById("staff-behavior-rating").value),
      timeliness_rating: Number(document.getElementById("timeliness-rating").value),
      packaging_rating: Number(document.getElementById("packaging-rating").value),
      comment: document.getElementById("rating-comment")?.value || ""
    });

    if (result.success) {
      showToast("تم إرسال التقييم بنجاح", "success");
      modal.remove();
      renderCharity();
    } else {
      showToast("فشل إرسال التقييم", "danger");
    }
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.remove();
  });
}



// View Surplus Modal
async function openSurplusModal(surplus) {
  // Get restaurant name from cache
  const restaurantName = restaurantNamesCache[surplus.restaurant_email] || surplus.restaurant_email;
  
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  const html = `
    <div class="modal-content" style="max-width:600px;padding:18px">
      <h3>${escapeHtml(surplus.title)}</h3>
      <div style="color:var(--muted);font-size:13px;margin-bottom:8px">المؤسسة: <strong style="color:var(--primary)">${escapeHtml(restaurantName)}</strong></div>
      <div style="display:flex;gap:12px;margin-bottom:8px">
        <div><strong>الكمية</strong><div class="small">${escapeHtml(surplus.qty || "")}</div></div>
        <div><strong>الصلاحية</strong><div class="small">${escapeHtml(surplus.expiry_hours || "")} ساعة</div></div>
      </div>
      ${surplus.description ? `<div style="margin-bottom:8px"><strong>وصف</strong><div class="small">${escapeHtml(surplus.description)}</div></div>` : ""}
      <div style="margin-top:12px;color:var(--muted);font-size:12px">نُشر في: ${new Date(surplus.created_at).toLocaleString("en-US")}</div>
      <div style="margin-top:14px;text-align:right"><button class="btn" id="close-surplus-modal">إغلاق</button></div>
    </div>
  `;
  modal.innerHTML = html;
  document.body.appendChild(modal);
  
  modal.addEventListener("click", function (e) {
    if (e.target === modal) modal.remove();
  });
  
  const close = modal.querySelector("#close-surplus-modal");
  if (close) close.addEventListener("click", () => modal.remove());
}

// Click Event Handlers
document.addEventListener("click", async function (e) {
  // Mark notification as read button
  const markReadBtn = e.target.closest('.btn-mark-read');
  if (markReadBtn) {
    const id = markReadBtn.dataset.id;
    markReadBtn.disabled = true;
    markReadBtn.innerText = 'جارٍ...';

    const result = await markNotificationAsRead(id);

    if (result.success) {
      showToast('تم تمييز الإشعار كمقروء', 'success');
      const notification = cachedNotifications.find(n => n.id == id);
      if (notification) notification.is_read = 1;
      renderNotifications();
    } else {
      showToast(result.error || 'فشل تمييز الإشعار', 'warn');
      markReadBtn.disabled = false;
      markReadBtn.innerText = 'تمييز كمقروء';
    }
    return;
  }

  // Delete Single Notification Button
  const deleteNotifBtn = e.target.closest('.btn-delete-notification');
  if (deleteNotifBtn) {
    const id = deleteNotifBtn.dataset.id;
    
    showConfirm('هل تريد حذف هذا الإشعار؟', async () => {
      deleteNotifBtn.disabled = true;
      deleteNotifBtn.innerText = 'جارٍ...';

      const result = await deleteNotification(id);

      if (result.success) {
        showToast('تم حذف الإشعار', 'success');
        cachedNotifications = cachedNotifications.filter(n => n.id != id);
        renderNotifications();
      } else {
        showToast(result.error || 'فشل حذف الإشعار', 'warn');
        deleteNotifBtn.disabled = false;
        deleteNotifBtn.innerText = 'حذف';
      }
    });
    return;
  }

  // Delete All Notifications Button
  const deleteAllBtn = e.target.closest('#btn-delete-all-notifications');
  if (deleteAllBtn) {
    showConfirm('هل تريد حذف جميع الإشعارات؟ لا يمكن التراجع عن هذا الإجراء.', async () => {
      deleteAllBtn.disabled = true;
      deleteAllBtn.innerHTML = '<span>جارٍ الحذف...</span>';

      const result = await deleteAllNotifications();

      if (result.success) {
        showToast(result.message || 'تم حذف جميع الإشعارات', 'success');
        cachedNotifications = [];
        renderNotifications();
      } else {
        showToast(result.error || 'فشل حذف الإشعارات', 'warn');
        deleteAllBtn.disabled = false;
        deleteAllBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg> حذف الكل';
      }
    });
    return;
  }

  

  // Request button
  const rb = e.target.closest(".btn-request");
  if (rb) {
    if (!currentUser) {
      showToast("يجب تسجيل الدخول أولاً", "warn");
      return;
    }

    const surplusId = Number(rb.dataset.id);
    const restaurantEmail = rb.closest("tr").querySelector(".org-link")?.dataset.email;
    const title = rb.closest("tr").children[0].innerText;

    // Disable button immediately to prevent double clicks
    rb.disabled = true;
    rb.textContent = 'جاري الإرسال...';

    const result = await createRequest({
      surplus_id: surplusId,
      restaurant_id: 1,
      restaurant_email: restaurantEmail,
      charity_id: currentUser.id || 1,
      charity_email: currentUser.email,
      title: title,
      status: "pending"
    });

    if (result.success) {
      showToast("تم إرسال طلب الاستلام", "success");
      // Add to requested set and update button
      requestedSurplusIds.add(surplusId);
      surplusRequestStatuses[surplusId] = 'pending'; // Update cached status
      rb.textContent = '⏳ قيد المعالجة';
      rb.className = 'btn btn-pending';
      rb.style.background = '#6b7280';
      rb.style.cursor = 'not-allowed';
      
      // Clear cached stats data to force refresh
      cachedStatsData = null;
      
      // Refresh the requests table in the background
      refreshRequestsTable();
    } else {
      showToast("فشل إرسال الطلب", "danger");
      // Re-enable button on failure
      rb.disabled = false;
      rb.textContent = 'طلب استلام';
    }
    return;
  }

  // View surplus button
  const viewBtn = e.target.closest(".btn-view-surplus");
  if (viewBtn) {
    const id = Number(viewBtn.dataset.id);
    const surplus = await fetchSurplusById(id);
    if (!surplus) {
      showToast("الفائض غير موجود", "warn");
      return;
    }
    openSurplusModal(surplus);
    return;
  }

  // Rate button
  const ratebtn = e.target.closest(".btn-rate");
  if (ratebtn) {
    const requestId = Number(ratebtn.dataset.requestId);
    const surplusId = Number(ratebtn.dataset.surplusId);
    const restaurantEmail = ratebtn.dataset.restaurantEmail;
    const surplus = await fetchSurplusById(surplusId);
    openRatingModal(requestId, surplusId, restaurantEmail, surplus?.title || '');
    return;
  }



  // Org link
  const orgLink = e.target.closest(".org-link");
  if (orgLink) {
    const email = orgLink.dataset.email;
    if (email) {
      window.location.href = `profile.html?email=${encodeURIComponent(email)}`;
    }
  }
});

// Profile Edit Modal
function openEditProfileModal() {
  if (!currentUser) return;

  const modal = document.createElement("div");
  modal.className = "modal-overlay";

  const currentLat = currentUser.lat || 32.8872;
  const currentLng = currentUser.lng || 13.1913;

  modal.innerHTML = `
    <div class="modal-content" style="max-width:600px;padding:20px;background:#fff;color:#333;">
      <h3 style="color:#333;">تعديل الملف الشخصي</h3>
      
      
      
      <div class="field">
        <label>الاسم</label>
        <input id="edit-name" class="input" style="width:100%" value="${escapeHtml(currentUser.name || "")}" maxlength="20">
      </div>
      <div class="field">
        <label>العنوان</label>
        <input id="edit-address" class="input" style="width:100%" value="${escapeHtml(currentUser.address || "")}"maxlength="20">
      </div>
      <div class="field">
        <label>اختر الموقع من الخريطة</label>
        <div id="edit-profile-map" style="height:250px;border-radius:8px;margin-bottom:10px;z-index:9999;"></div>
      </div>
      <div class="field" style="display:flex;gap:10px;">
        <div style="flex:1; display : none">
          <label>Lat</label>
          <input id="lat" type="number" step="0.000001" placeholder="0" value="${currentLat}" style="width:100%">
        </div>
        <div style="flex:1; display : none">
          <label>Lng</label>
          <input id="lng" type="number" step="0.000001" placeholder="0" value="${currentLng}" style="width:100%">
        </div>
      </div>
      <div class="field">
        <label>الوصف</label>
        <textarea id="desc" placeholder="وصف الجمعية" style="width:100%"maxlength="255">${escapeHtml(currentUser.description || "")} </textarea>
      </div>
      <div style="margin-top:15px; text-align:left">
        <button class="btn primary" id="save-profile">حفظ</button>
        <button class="btn" id="close-profile" style="margin-right:8px">إغلاق</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Initialize map after modal is added to DOM
  setTimeout(() => {
    const mapContainer = document.getElementById("edit-profile-map");
    if (mapContainer && typeof L !== 'undefined') {
      const editMap = L.map("edit-profile-map").setView([currentLat, currentLng], 13);
      
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap"
      }).addTo(editMap);

      // Add marker at current position
      let editMarker = L.marker([currentLat, currentLng]).addTo(editMap);
      editMarker.bindPopup("📍 موقعك الحالي").openPopup();

      // Click on map to update position
      editMap.on("click", function(e) {
        const { lat, lng } = e.latlng;
        document.getElementById("lat").value = lat.toFixed(6);
        document.getElementById("lng").value = lng.toFixed(6);

        // Update marker
        editMarker.setLatLng(e.latlng);
        editMarker.bindPopup("📍 الموقع الجديد").openPopup();
      });

      // Fix map size after modal animation
      setTimeout(() => editMap.invalidateSize(), 100);
    }
  }, 100);

  document.getElementById("close-profile").onclick = () => modal.remove();

  document.getElementById("save-profile").addEventListener("click", async () => {
    const name = document.getElementById("edit-name").value.trim();
    const address = document.getElementById("edit-address").value.trim();
    const lat = parseFloat(document.getElementById("lat").value);
    const lng = parseFloat(document.getElementById("lng").value);
    const desc = document.getElementById("desc").value.trim();

    // New validation rules
    // الاسم يقبل حروف عربية أو إنجليزية + أرقام + مسافات
    const nameRegex = /^[\u0600-\u06FF\u0750-\u077Fa-zA-Z0-9\s]+$/;
    
    if (!name) {
      showToast("يرجى إدخال الاسم", "danger");
      return;
    }
    if (name.length < 2) {
      showToast("الاسم يجب أن يكون حرفين أو أكثر", "danger");
      return;
    }
    if (!nameRegex.test(name)) {
      showToast("الاسم يجب أن يحتوي على حروف عربية أو إنجليزية وأرقام فقط", "danger");
      return;
    }

    // العنوان مطلوب
    if (!address) {
      showToast("يرجى إدخال العنوان", "danger");
      return;
    }

    const result = await updateUserProfile(currentUser.email, {
      name, address, lat, lng, desc
    });

    if (result.success) {
      showToast("تم تحديث الملف الشخصي بنجاح", "success");
      // modal.remove(); // تم تعطيله مؤقتاً لأخذ لقطة شاشة للتوثيق
      
      // Refresh user data from server
      currentUser = await checkAuth();
      if (currentUser) {
        const welcome = document.querySelector('.welcome');
        if (welcome) welcome.innerText = currentUser.name || '';
      }
    } else {
      showToast("فشل تحديث الملف الشخصي", "danger");
    }
  });
}

// Edit Button Setup
const editBtnElement = document.getElementById("edit-profile-btn");
if (editBtnElement) {
  editBtnElement.addEventListener("click", () => {
    openEditProfileModal();
  });
}

//  Map Initialization 
async function initMap() {
  if (!currentUser) return;
  if (currentUser.role !== "charity") return;

  const mapContainer = document.getElementById("map");
  if (!mapContainer || typeof L === 'undefined') return;

  const map = L.map("map").setView([32.8872, 13.1913], 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
  }).addTo(map);

  // Add user marker if has location
  if (currentUser.lat && currentUser.lng) {
    L.marker([currentUser.lat, currentUser.lng], {
      icon: L.icon({
        iconUrl: "https://maps.gstatic.com/mapfiles/ms2/micons/red-dot.png",
        iconSize: [32, 32]
      })
    })
    .addTo(map)
    .bindPopup(`📍 موقعك (الجمعية)<br><small>نطاق البحث: ${MAX_DISTANCE_KM} كم</small>`)
    .openPopup();

    map.setView([currentUser.lat, currentUser.lng], 13);

    // Draw circle to show 7km radius
    L.circle([currentUser.lat, currentUser.lng], {
      color: '#00c4a7',
      fillColor: '#00c4a7',
      fillOpacity: 0.1,
      radius: MAX_DISTANCE_KM * 1000 // Convert km to meters
    }).addTo(map).bindPopup(`نطاق البحث: ${MAX_DISTANCE_KM} كم`);
  }

  // Fetch restaurants and filter by distance - ONLY show nearby restaurants (within 7km)
  const allUsers = await fetchUsers();
  const nearbyRestaurants = allUsers
    .filter(u => u.role === "restaurant" && u.lat && u.lng)
    .filter(rest => {
      if (!currentUser.lat || !currentUser.lng) return true; // Show all if charity has no location
      return isWithinDistance(currentUser.lat, currentUser.lng, rest.lat, rest.lng);
    });

  console.log(`🗺️ Showing ${nearbyRestaurants.length} nearby restaurants on map (within ${MAX_DISTANCE_KM}km)`);

  nearbyRestaurants.forEach(rest => {
    const distance = calculateDistance(currentUser.lat, currentUser.lng, rest.lat, rest.lng).toFixed(2);
    L.marker([rest.lat, rest.lng])
      .addTo(map)
      .bindPopup(`
        <strong>${escapeHtml(rest.name)}</strong><br>
        📞 ${rest.phone || "-"}<br>
        📏 المسافة: ${distance} كم
      `);
  });
}

// DOMContentLoaded
document.addEventListener("DOMContentLoaded", async () => {
  // ⚠️ CRITICAL: Check authentication first via cookies
  currentUser = await checkAuth();
  
  if (!currentUser) {
    // checkAuth already redirects
    return;
  }

  renderCharity();
  initSurplusFilters();
  
  // Initialize map after a short delay
  setTimeout(initMap, 500);

  // Show edit button for charity users
  const editBtn = document.getElementById("edit-profile-btn");
  if (editBtn && currentUser.role === "charity") {
    editBtn.style.display = "inline-block";
  }

  // Setup security management button
  const securityBtn = document.getElementById("edit-email-password-btn");
  if (securityBtn) {
    securityBtn.addEventListener("click", openSecurityModal);
  }

  // Update welcome message
  const welcome = document.querySelector('.welcome');
  if (welcome) {
    welcome.innerText = currentUser.name || '';
  }

  // ✅ Fetch notifications and update badge on page load
  cachedNotifications = await fetchNotifications();
  const unreadCount = cachedNotifications.filter(n => !n.is_read).length;
  updateNotificationBadge(unreadCount);
});

// Security Management Modal
function openSecurityModal() {
  if (!currentUser) return;

  // Track email OTP state
  let emailOtpSent = false;
  let emailOtpVerified = false;
  let pendingNewEmail = null;

  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.id = "security-modal";

  // Step 1: Password verification
  modal.innerHTML = `
    <style>
      .password-field-wrapper {
        position: relative;
        display: flex;
        align-items: center;
      }
      .password-field-wrapper input {
        padding-left: 40px;
        width: 100%;
      }
      .toggle-password-btn {
        position: absolute;
        left: 10px;
        top: 50%;
        transform: translateY(-50%);
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.6;
        transition: opacity 0.2s;
      }
      .toggle-password-btn:hover {
        opacity: 1;
      }
    </style>
    <div class="modal-content" style="max-width:450px;padding:24px;background:#fff;color:#333;">
      <h3 style="margin-bottom:20px;text-align:center;color:#333;">🔐 إدارة الأمان</h3>
      
      <div id="security-step-1">
        <p style="color:var(--muted);margin-bottom:16px;text-align:center;">
          للمتابعة، يرجى إدخال كلمة المرور الحالية
        </p>
        <div class="field">
          <label>كلمة المرور الحالية</label>
          <div class="password-field-wrapper">
            <input type="password" id="verify-password-input" class="input" style="width:100%" placeholder="أدخل كلمة المرور" minlength="6" maxlength="20">
            <button type="button" class="toggle-password-btn" id="toggle-pass" aria-label="إظهار كلمة المرور">
              <svg class="eye-open" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="1.5">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <svg class="eye-closed" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="1.5" style="display:none">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </button>
          </div>
        </div>
        <div id="verify-error" style="color:#ef4444;font-size:13px;margin-bottom:12px;display:none;"></div>
        <div style="display:flex;gap:10px;margin-top:16px;">
          <button class="btn primary" id="verify-password-btn" style="flex:1;">التحقق</button>
          <button class="btn" id="close-security-modal" style="flex:1;">إلغاء</button>
        </div>
      </div>

      <div id="security-step-2" style="display:none;">
        <p style="color:var(--muted);margin-bottom:16px;text-align:center;">
          يمكنك تعديل البريد الإلكتروني وكلمة المرور ورقم الهاتف
        </p>
        
        <div class="field">
          <label>البريد الإلكتروني الجديد</label>
          <div style="display:flex;gap:8px;">
            <input type="email" id="new-email-input" class="input" style="flex:1;" value="${escapeHtml(currentUser.email || '')}" placeholder="البريد الإلكتروني">
            <button class="btn" id="send-email-otp-btn" style="white-space:nowrap;">إرسال رمز التحقق</button>
          </div>
          <div id="email-status" style="font-size:12px;margin-top:4px;display:none;"></div>
        </div>

        <div class="field" id="email-otp-field" style="display:none;">
          <label>رمز التحقق المرسل للبريد الجديد</label>
          <div style="display:flex;gap:8px;">
            <input type="text" id="email-otp-input" class="input" style="flex:1;" maxlength="6" placeholder="أدخل الرمز المكون من 6 أرقام" minlength="6">
            <button class="btn" id="verify-email-otp-btn" style="white-space:nowrap;">تحقق</button>
          </div>
          <div id="otp-status" style="font-size:12px;margin-top:4px;display:none;"></div>
        </div>

        <div class="field">
          <label>رقم الهاتف</label>
          <input type="tel" id="new-phone-input" class="input" maxlength="10" style="width:100%" value="${escapeHtml(currentUser.phone || '')}" placeholder="رقم الهاتف" >
          <div id="phone-error" style="color:#ef4444;font-size:13px;margin-top:6px;display:none;"></div>
        </div>

        <div class="field">
          <label>كلمة المرور الجديدة <span style="color:var(--muted);font-size:12px;">(اتركها فارغة إذا لم ترد التغيير)</span></label>
          <div class="password-field-wrapper">
            <input type="password" id="new-password-input" class="input" style="width:100%" placeholder="كلمة المرور الجديدة" minlength="6" maxlength="20">
            <button type="button" class="toggle-password-btn" id="toggle-pass2" aria-label="إظهار كلمة المرور">
              <svg class="eye-open" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="1.5">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <svg class="eye-closed" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="1.5" style="display:none">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </button>
          </div>
          <div id="password-error" style="color:#ef4444;font-size:13px;margin-top:6px;display:none;"></div>
        </div>

        <div class="field" id="confirm-password-field" style="display:none;">
          <label>تأكيد كلمة المرور الجديدة</label>
          <div class="password-field-wrapper">
            <input type="password" id="confirm-password-input" class="input" style="width:100%" placeholder="تأكيد كلمة المرور" minlength="6" maxlength="20">
            <button type="button" class="toggle-password-btn" id="toggle-pass3" aria-label="إظهار كلمة المرور">
              <svg class="eye-open" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="1.5">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <svg class="eye-closed" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="1.5" style="display:none">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </button>
          </div>
        </div>

        <div id="update-error" style="color:#ef4444;font-size:13px;margin-bottom:12px;display:none;"></div>
        <div id="update-success" style="color:#22c55e;font-size:13px;margin-bottom:12px;display:none;"></div>

        <div style="display:flex;gap:10px;margin-top:16px;">
          <button class="btn primary" id="save-security-btn" style="flex:1;">حفظ التغييرات</button>
          <button class="btn" id="close-security-modal-2" style="flex:1;">إلغاء</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Close modal handlers
  modal.querySelector("#close-security-modal")?.addEventListener("click", () => modal.remove());
  modal.querySelector("#close-security-modal-2")?.addEventListener("click", () => modal.remove());
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.remove();
  });

  // Setup password toggle buttons
  modal.querySelectorAll('.toggle-password-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const wrapper = btn.closest('.password-field-wrapper');
      const input = wrapper.querySelector('input');
      const eyeOpen = btn.querySelector('.eye-open');
      const eyeClosed = btn.querySelector('.eye-closed');
      
      if (input.type === 'password') {
        input.type = 'text';
        eyeOpen.style.display = 'none';
        eyeClosed.style.display = '';
      } else {
        input.type = 'password';
        eyeOpen.style.display = '';
        eyeClosed.style.display = 'none';
      }
    });
  });

  // Show confirm password field when typing new password
  const newPasswordInput = modal.querySelector("#new-password-input");
  const confirmPasswordField = modal.querySelector("#confirm-password-field");
  newPasswordInput?.addEventListener("input", () => {
    if (newPasswordInput.value.length > 0) {
      confirmPasswordField.style.display = "block";
    } else {
      confirmPasswordField.style.display = "none";
    }
  });

  // Step 1: Verify password
  modal.querySelector("#verify-password-btn")?.addEventListener("click", async () => {
    const password = modal.querySelector("#verify-password-input").value;
    const errorDiv = modal.querySelector("#verify-error");
    const btn = modal.querySelector("#verify-password-btn");

    if (!password) {
      errorDiv.textContent = "يرجى إدخال كلمة المرور";
      errorDiv.style.display = "block";
      return;
    }

    btn.disabled = true;
    btn.textContent = "جارٍ التحقق...";
    errorDiv.style.display = "none";

    try {
      const res = await fetch(`${API_BASE}/auth/verify-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "فشل التحقق");
      }

      // Success - show step 2
      modal.querySelector("#security-step-1").style.display = "none";
      modal.querySelector("#security-step-2").style.display = "block";

    } catch (err) {
      errorDiv.textContent = err.message || "كلمة المرور غير صحيحة";
      errorDiv.style.display = "block";
      btn.disabled = false;
      btn.textContent = "التحقق";
    }
  });

  // Send OTP for email change
  modal.querySelector("#send-email-otp-btn")?.addEventListener("click", async () => {
    const newEmail = modal.querySelector("#new-email-input").value.trim();
    const btn = modal.querySelector("#send-email-otp-btn");
    const emailStatus = modal.querySelector("#email-status");
    const otpField = modal.querySelector("#email-otp-field");

    // Validate email format - حروف إنجليزية ورموز فقط (بدون -)
    const emailRegex = /^[a-zA-Z0-9._]+@[a-zA-Z0-9.]+\.[a-zA-Z]{2,}$/;
    if (!newEmail) {
      emailStatus.textContent = "البريد الإلكتروني لا يمكن أن يكون فارغاً";
      emailStatus.style.color = "#ef4444";
      emailStatus.style.display = "block";
      return;
    } else if (newEmail.includes('-')) {
      emailStatus.textContent = "البريد الإلكتروني لا يقبل إشارة (-)";
      emailStatus.style.color = "#ef4444";
      emailStatus.style.display = "block";
      return;
    } else if (!emailRegex.test(newEmail)) {
      emailStatus.textContent = "البريد الإلكتروني يجب أن يحتوي على حروف إنجليزية ورموز (. _) فقط";
      emailStatus.style.color = "#ef4444";
      emailStatus.style.display = "block";
      return;
    }

    // If same email, no need for OTP
    if (newEmail === currentUser.email) {
      emailStatus.textContent = "هذا هو البريد الإلكتروني الحالي";
      emailStatus.style.color = "#f59e0b";
      emailStatus.style.display = "block";
      return;
    }

    btn.disabled = true;
    btn.textContent = "جارٍ التحقق...";
    emailStatus.style.display = "none";

    try {
      // Step 1: Check if email is available
      const checkRes = await fetch(`${API_BASE}/auth/check-email-available`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: newEmail, currentEmail: currentUser.email })
      });

      const checkData = await checkRes.json();

      if (!checkRes.ok || !checkData.available) {
        throw new Error(checkData.error || "البريد الإلكتروني مستخدم بالفعل");
      }

      // Step 2: Send OTP to new email
      const otpRes = await fetch(`${API_BASE}/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: newEmail, purpose: "verify" })
      });

      const otpData = await otpRes.json();

      if (!otpRes.ok) {
        throw new Error(otpData.message || "فشل إرسال رمز التحقق");
      }

      // Success
      emailOtpSent = true;
      pendingNewEmail = newEmail;
      
      emailStatus.textContent = "✓ تم إرسال رمز التحقق إلى البريد الجديد";
      emailStatus.style.color = "#22c55e";
      emailStatus.style.display = "block";
      
      otpField.style.display = "block";
      btn.textContent = "إعادة الإرسال";
      btn.disabled = false;

      // Disable email input while OTP is pending
      modal.querySelector("#new-email-input").readOnly = true;
      modal.querySelector("#new-email-input").style.background = "var(--surface)";

    } catch (err) {
      emailStatus.textContent = err.message || "فشل إرسال رمز التحقق";
      emailStatus.style.color = "#ef4444";
      emailStatus.style.display = "block";
      btn.disabled = false;
      btn.textContent = "إرسال رمز التحقق";
    }
  });

  // Verify Email OTP
  modal.querySelector("#verify-email-otp-btn")?.addEventListener("click", async () => {
    const otp = modal.querySelector("#email-otp-input").value.trim();
    const btn = modal.querySelector("#verify-email-otp-btn");
    const otpStatus = modal.querySelector("#otp-status");

    if (!otp || otp.length !== 6) {
      otpStatus.textContent = "يرجى إدخال رمز التحقق المكون من 6 أرقام";
      otpStatus.style.color = "#ef4444";
      otpStatus.style.display = "block";
      return;
    }

    btn.disabled = true;
    btn.textContent = "جارٍ التحقق...";
    otpStatus.style.display = "none";

    try {
      const res = await fetch(`${API_BASE}/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: pendingNewEmail, otp, purpose: "verify" })
      });

      const data = await res.json();

      if (!res.ok || !data.verified) {
        throw new Error(data.message || "رمز التحقق غير صحيح");
      }

      // Success
      emailOtpVerified = true;
      
      otpStatus.textContent = "✓ تم التحقق من البريد الإلكتروني بنجاح";
      otpStatus.style.color = "#22c55e";
      otpStatus.style.display = "block";
      
      btn.textContent = "تم التحقق ✓";
      btn.style.background = "#22c55e";
      modal.querySelector("#email-otp-input").readOnly = true;
      modal.querySelector("#send-email-otp-btn").style.display = "none";

    } catch (err) {
      otpStatus.textContent = err.message || "رمز التحقق غير صحيح";
      otpStatus.style.color = "#ef4444";
      otpStatus.style.display = "block";
      btn.disabled = false;
      btn.textContent = "تحقق";
    }
  });

  // Step 2: Save changes
  modal.querySelector("#save-security-btn")?.addEventListener("click", async () => {
    const newEmail = modal.querySelector("#new-email-input").value.trim();
    const newPhone = modal.querySelector("#new-phone-input").value.trim();
    const newPassword = modal.querySelector("#new-password-input").value;
    const confirmPassword = modal.querySelector("#confirm-password-input").value;
    const errorDiv = modal.querySelector("#update-error");
    const successDiv = modal.querySelector("#update-success");
    const btn = modal.querySelector("#save-security-btn");

    errorDiv.style.display = "none";
    successDiv.style.display = "none";

    // Check if email changed and OTP verified
    const emailChanged = newEmail && newEmail !== currentUser.email;
    
    if (emailChanged && !emailOtpVerified) {
      errorDiv.textContent = "يجب التحقق من البريد الإلكتروني الجديد عبر رمز OTP قبل الحفظ";
      errorDiv.style.display = "block";
      return;
    }

    if (emailChanged && pendingNewEmail !== newEmail) {
      errorDiv.textContent = "البريد الإلكتروني المدخل لا يتطابق مع البريد الذي تم التحقق منه";
      errorDiv.style.display = "block";
      return;
    }

    // Validation - القيود الجديدة (بدون -)
    const emailRegex = /^[a-zA-Z0-9._]+@[a-zA-Z0-9.]+\.[a-zA-Z]{2,}$/;
    const phoneRegex = /^09[1-4][0-9]{7}$/;
    const arabicCharsRegex = /[\u0600-\u06FF\u0750-\u077F]/;
    const passwordCharRegex = /^[a-zA-Z0-9!@#$%^&*()_+=\[\]{};':"\\|,.<>\/?`~]+$/;

    if (newEmail && newEmail.includes('-')) {
      errorDiv.textContent = "البريد الإلكتروني لا يقبل إشارة (-)";
      errorDiv.style.display = "block";
      return;
    }

    if (newEmail && !emailRegex.test(newEmail)) {
      errorDiv.textContent = "البريد الإلكتروني يجب أن يحتوي على حروف إنجليزية ورموز (. _) فقط";
      errorDiv.style.display = "block";
      return;
    }

    // التحقق من رقم الهاتف - عرض الخطأ تحت الحقل مباشرة
    const phoneErrorDiv = modal.querySelector("#phone-error");
    const phoneInput = modal.querySelector("#new-phone-input");
    
    // إزالة أي خطأ سابق
    if (phoneErrorDiv) {
      phoneErrorDiv.style.display = "none";
      phoneInput.style.border = "";
    }
    
    if (newPhone && !phoneRegex.test(newPhone)) {
      let phoneErrorMsg = "";
      if (newPhone.length !== 10) {
        phoneErrorMsg = "رقم الهاتف يجب أن يكون 10 أرقام";
      } else if (!newPhone.startsWith('09')) {
        phoneErrorMsg = "رقم الهاتف يجب أن يبدأ بـ 09";
      } else if (!/^09[1-4]/.test(newPhone)) {
        phoneErrorMsg = "الرقم الثالث يجب أن يكون 1 أو 2 أو 3 أو 4";
      } else {
        phoneErrorMsg = "رقم الهاتف غير صالح";
      }
      
      if (phoneErrorDiv) {
        phoneErrorDiv.textContent = phoneErrorMsg;
        phoneErrorDiv.style.display = "block";
        phoneInput.style.border = "2px solid #ef4444";
      }
      return;
    }
    
    // Check if phone number is already taken
    if (newPhone && newPhone !== currentUser.phone) {
      try {
        const checkPhoneRes = await fetch(`${API_BASE}/auth/check-phone-available`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: 'include',
          body: JSON.stringify({ phone: newPhone, currentPhone: currentUser.phone })
        });
        
        const checkPhoneData = await checkPhoneRes.json();
        
        if (!checkPhoneRes.ok || !checkPhoneData.available) {
          if (phoneErrorDiv) {
            phoneErrorDiv.textContent = "رقم الهاتف مستخدم بالفعل";
            phoneErrorDiv.style.display = "block";
            phoneInput.style.border = "2px solid #ef4444";
          }
          return;
        }
      } catch (err) {
        console.error("❌ Check phone error:", err);
        errorDiv.textContent = "خطأ في التحقق من رقم الهاتف";
        errorDiv.style.display = "block";
        return;
      }
    }

    // التحقق من كلمة المرور - عرض الخطأ تحت الحقل مباشرة
    const passwordErrorDiv = modal.querySelector("#password-error");
    const passwordInput = modal.querySelector("#new-password-input");
    
    // إزالة أي خطأ سابق
    if (passwordErrorDiv) {
      passwordErrorDiv.style.display = "none";
      passwordInput.style.border = "";
    }

    if (newPassword && newPassword.length < 6) {
      if (passwordErrorDiv) {
        passwordErrorDiv.textContent = "كلمة المرور يجب أن تكون 6 أحرف على الأقل";
        passwordErrorDiv.style.display = "block";
        passwordInput.style.border = "2px solid #ef4444";
      }
      return;
    }

    if (newPassword && arabicCharsRegex.test(newPassword)) {
      if (passwordErrorDiv) {
        passwordErrorDiv.textContent = "كلمة المرور لا تقبل الحروف العربية";
        passwordErrorDiv.style.display = "block";
        passwordInput.style.border = "2px solid #ef4444";
      }
      return;
    }

    if (newPassword && newPassword.includes('-')) {
      if (passwordErrorDiv) {
        passwordErrorDiv.textContent = "كلمة المرور لا تقبل إشارة (-)";
        passwordErrorDiv.style.display = "block";
        passwordInput.style.border = "2px solid #ef4444";
      }
      return;
    }

    if (newPassword && !passwordCharRegex.test(newPassword)) {
      if (passwordErrorDiv) {
        passwordErrorDiv.textContent = "كلمة المرور يجب أن تحتوي على حروف إنجليزية وأرقام ورموز فقط";
        passwordErrorDiv.style.display = "block";
        passwordInput.style.border = "2px solid #ef4444";
      }
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      errorDiv.textContent = "كلمتا المرور غير متطابقتين";
      errorDiv.style.display = "block";
      return;
    }

    btn.disabled = true;
    btn.textContent = "جارٍ الحفظ...";

    try {
      const updateData = {};
      
      if (emailChanged && emailOtpVerified) {
        updateData.email = newEmail;
      }
      if (newPhone !== (currentUser.phone || '')) {
        updateData.phone = newPhone;
      }
      if (newPassword) {
        updateData.password = newPassword;
      }

      if (Object.keys(updateData).length === 0) {
        errorDiv.textContent = "لم يتم تغيير أي بيانات";
        errorDiv.style.display = "block";
        btn.disabled = false;
        btn.textContent = "حفظ التغييرات";
        return;
      }

      const res = await fetch(`${API_BASE}/users/by-email/${encodeURIComponent(currentUser.email)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updateData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "فشل التحديث");
      }

      // Update local currentUser
      if (updateData.email) currentUser.email = updateData.email;
      if (updateData.phone !== undefined) currentUser.phone = updateData.phone;

      successDiv.textContent = "تم تحديث البيانات بنجاح";
      successDiv.style.display = "block";
      btn.textContent = "تم الحفظ ✓";

      // If email changed, may need to re-login
      if (updateData.email) {
        successDiv.textContent = "تم تحديث البريد الإلكتروني. سيتم تسجيل خروجك...";
        setTimeout(() => {
          window.location.href = "index.html";
        }, 2000);
      } else {
        setTimeout(() => modal.remove(), 1500);
      }

    } catch (err) {
      errorDiv.textContent = err.message || "حدث خطأ أثناء التحديث";
      errorDiv.style.display = "block";
      btn.disabled = false;
      btn.textContent = "حفظ التغييرات";
    }
  });

  // Allow Enter key to submit
  modal.querySelector("#verify-password-input")?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      modal.querySelector("#verify-password-btn")?.click();
    }
  });
}

// Profile Navigation
document.getElementById('goProfile')?.addEventListener('click', () => {
  window.location.href = 'chProfile.html';
});

// Charity Statistics Update Function (OPTIMIZED)
// Cache for stats data to avoid redundant API calls  
let cachedStatsData = null;

async function updateCharityStats(forceRefetch = false) {
  if (!currentUser) return;
  
  try {
    let myRequests, allUsers, allSurpluses;
    
    // Use cached data if available and not forcing refetch
    if (!forceRefetch && cachedStatsData) {
      myRequests = cachedStatsData.myRequests;
      allUsers = cachedStatsData.allUsers;
      allSurpluses = cachedStatsData.allSurpluses;
    } else {
      // Fetch all data in parallel
      [myRequests, allUsers, allSurpluses] = await Promise.all([
        fetchMyRequests(currentUser.email),
        fetchUsers(),
        fetchSurpluses()
      ]);
      // Cache for future use
      cachedStatsData = { myRequests, allUsers, allSurpluses };
    }
    
    // Count requests by status
    const accepted = myRequests.filter(r => r.status === 'accepted').length;
    const pending = myRequests.filter(r => r.status === 'pending').length;
    const rejected = myRequests.filter(r => r.status === 'rejected').length;
    const total = myRequests.length;
    
    // Update stat cards
    const statTotal = document.getElementById('charity-stat-total');
    const statAccepted = document.getElementById('charity-stat-accepted');
    const statPending = document.getElementById('charity-stat-pending');
    const statRejected = document.getElementById('charity-stat-rejected');
    
    if (statTotal) statTotal.textContent = total;
    if (statAccepted) statAccepted.textContent = accepted;
    if (statPending) statPending.textContent = pending;
    if (statRejected) statRejected.textContent = rejected;
    
    // Update legend counts
    const legendAccepted = document.getElementById('charity-legend-accepted');
    const legendPending = document.getElementById('charity-legend-pending');
    const legendRejected = document.getElementById('charity-legend-rejected');
    const totalRequests = document.getElementById('charity-total-requests');
    
    if (legendAccepted) legendAccepted.textContent = accepted;
    if (legendPending) legendPending.textContent = pending;
    if (legendRejected) legendRejected.textContent = rejected;
    if (totalRequests) totalRequests.textContent = total;
    
    // Update donut chart segments
    const circumference = 2 * Math.PI * 40; // r = 40
    
    const segmentAccepted = document.getElementById('charity-segment-accepted');
    const segmentPending = document.getElementById('charity-segment-pending');
    const segmentRejected = document.getElementById('charity-segment-rejected');
    
    if (total > 0) {
      const acceptedPercent = accepted / total;
      const pendingPercent = pending / total;
      const rejectedPercent = rejected / total;
      
      const acceptedLength = acceptedPercent * circumference;
      const pendingLength = pendingPercent * circumference;
      const rejectedLength = rejectedPercent * circumference ;
      
      if (segmentAccepted) {
        segmentAccepted.style.strokeDasharray = `${acceptedLength} ${circumference}`;
        segmentAccepted.style.strokeDashoffset = '0';
      }
      
      if (segmentPending) {
        segmentPending.style.strokeDasharray = `${pendingLength} ${circumference}`;
        segmentPending.style.strokeDashoffset = `-${acceptedLength}`;
      }
      
      if (segmentRejected) {
        segmentRejected.style.strokeDasharray = `${rejectedLength} ${circumference}`;
        segmentRejected.style.strokeDashoffset = `-${acceptedLength + pendingLength}`;
      }
    }
    
    // Update progress bars
    const acceptanceRate = total > 0 ? Math.round((accepted / total) * 100) : 0;
    const acceptanceRateEl = document.getElementById('charity-acceptance-rate');
    const acceptanceBar = document.getElementById('charity-acceptance-bar');
    
    if (acceptanceRateEl) acceptanceRateEl.textContent = `${acceptanceRate}%`;
    if (acceptanceBar) acceptanceBar.style.width = `${acceptanceRate}%`;
    
    // Get nearby restaurant emails from already fetched users
    const restaurantsList = allUsers.filter(u => u.role === "restaurant");
    const nearbyEmails = restaurantsList
      .filter(rest => rest.lat && rest.lng && isWithinDistance(currentUser.lat, currentUser.lng, rest.lat, rest.lng))
      .map(rest => rest.email);
    
    // Filter available surpluses from already fetched data
    const availableSurpluses = allSurpluses.filter(s => {
      if (!nearbyEmails.includes(s.restaurant_email)) return false;
      const remaining = calculateRemainingTime(s.created_at, s.expiry_hours);
      return remaining !== null;
    }).length;
    
    const surplusesEl = document.getElementById('charity-available-surpluses');
    const surplusesBar = document.getElementById('charity-surpluses-bar');
    
    if (surplusesEl) surplusesEl.textContent = availableSurpluses;
    if (surplusesBar) surplusesBar.style.width = `${Math.min(availableSurpluses * 10, 100)}%`;
    
    // Update interaction rate (unique restaurants interacted with)
    const uniqueRestaurants = [...new Set(myRequests.map(r => r.restaurant_email))].length;
    const interactionEl = document.getElementById('charity-interaction-rate');
    const interactionBar = document.getElementById('charity-interaction-bar');
    
    if (interactionEl) interactionEl.textContent = `${uniqueRestaurants} مؤسسة`;
    if (interactionBar) interactionBar.style.width = `${Math.min(uniqueRestaurants * 10, 100)}%`;
    
    console.log(`📊 Charity stats updated: ${total} total, ${accepted} accepted, ${pending} pending, ${rejected} rejected`);
    
  } catch (err) {
    console.error('❌ Error updating charity stats:', err);
  }
}

// Call updateCharityStats when page loads (after auth check)
(async function initStats() {
  // Wait for renderCharity to complete, then update stats
  const originalRenderCharity = renderCharity;
  window.renderCharity = async function() {
    await originalRenderCharity.apply(this, arguments);
    // Clear cache to get fresh data after renderCharity
    cachedStatsData = null;
    await updateCharityStats(true);
  };
})();