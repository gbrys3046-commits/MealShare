
const API_BASE = `https://mealshare.onrender.com`;

let currentUser = null;

let authCheckAttempts = 0;
const MAX_AUTH_ATTEMPTS = 2;

async function checkAuth() {
  authCheckAttempts++;

  // Prevent infinite redirect loops
  if (authCheckAttempts > MAX_AUTH_ATTEMPTS) {
    console.log("⚠️ Max auth attempts reached, staying on page");
    return null;
  }

  try {
    console.log("🔍 Checking authentication... (Attempt", authCheckAttempts + ")");

    const res = await fetch(`/auth/me`, {
      method: 'GET',
      credentials: 'include' // ⚠️ CRITICAL: Send cookies
    });

    if (!res.ok) {
      console.log("❌ Not authenticated (status:", res.status + ")");
      window.location.replace("index.html?nocheck=1");
      return null;
    }

    const data = await res.json();

    if (!data.authenticated || !data.user) {
      console.log("❌ Session invalid");
      window.location.replace("index.html?nocheck=1");
      return null;
    }

    // Verify user is admin
    if (data.user.role !== "admin") {
      console.log("❌ User is not admin, role:", data.user.role);
      window.location.replace("index.html?nocheck=1");
      return null;
    }

    console.log("✅ Authenticated as Admin:", data.user.email);
    authCheckAttempts = 0;
    return data.user;

  } catch (err) {
    console.error("❌ Auth check failed:", err);
    window.location.replace("index.html?nocheck=1");
    return null;
  }
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
  window.location.replace("index.html");
}

// Setup logout buttons
document.addEventListener("click", (e) => {
  if (e.target.closest("[data-logout]")) {
    e.preventDefault();
    handleLogout();
  }
});

// Navigation
const panel = document.getElementById("n1");
const users = document.getElementById("n2");
const reports = document.getElementById("n3");
const notifications = document.getElementById("n4");

const views = {
  n1: document.getElementById('view-dashboard'),
  n2: document.getElementById('view-users'),
  n3: document.getElementById('view-reports'),
  n4: document.getElementById('view-notifications')
};

function switchView(activeId) {
  [panel, users, reports, notifications].forEach(el => {
    if (el) el.style.cssText = "padding: 10px;border-radius: 10px;color: var(--muted);cursor: pointer;border: 1px solid transparent;";
  });

  const activeEl = document.getElementById(activeId);
  if (activeEl) activeEl.style.cssText = "background: rgba(0, 196, 167, 0.08);color: #fff; border-color: rgba(0, 196, 167, 0.12);";

  Object.keys(views).forEach(key => {
    if (views[key]) {
      views[key].style.display = (key === activeId) ? 'block' : 'none';
    }
  });
}

if (panel) panel.addEventListener('click', () => switchView('n1'));
if (users) users.addEventListener('click', () => switchView('n2'));
if (reports) reports.addEventListener('click', () => switchView('n3'));
if (notifications) notifications.addEventListener('click', () => switchView('n4'));

// Utility Functions
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showToast(message, type = 'info', onClose = null) {
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
  closeX.onclick = () => { overlay.remove(); if (onClose) onClose(); };

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
  okBtn.onclick = () => { overlay.remove(); if (onClose) onClose(); };

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
    if (e.target === overlay) { overlay.remove(); if (onClose) onClose(); }
  });

  // Auto close after 5 seconds
  setTimeout(() => {
    if (overlay.parentNode) { overlay.remove(); if (onClose) onClose(); }
  }, 5000);
}

// Custom Confirm Modal
function showConfirm(message, onConfirm, onCancel = null) {
  // Remove any existing confirm modal
  const existing = document.querySelector('.confirm-modal-overlay');
  if (existing) existing.remove();

  // Create overlay
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

  // Card styles
  const card = overlay.querySelector('.confirm-modal-card');
  card.style.cssText = `
    position: relative;
    background: #fff;
    border-radius: 12px;
    padding: 30px 40px;
    text-align: center;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
    max-width: 400px;
    min-width: 320px;
    animation: modalSlideUp 0.3s ease;
  `;

  // Close X button
  const closeX = overlay.querySelector('.confirm-close-x');
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
  closeX.onclick = () => {
    overlay.remove();
    if (onCancel) onCancel();
  };

  // Icon wrapper
  const iconWrapper = overlay.querySelector('.confirm-icon-wrapper');
  iconWrapper.style.cssText = `
    width: 70px;
    height: 70px;
    margin: 0 auto 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(245, 158, 11, 0.1);
    border-radius: 50%;
    animation: iconBounce 0.4s ease 0.1s both;
  `;

  // Message
  const msgEl = overlay.querySelector('.confirm-message');
  msgEl.style.cssText = `
    margin: 0 0 25px 0;
    font-size: 16px;
    color: #374151;
    line-height: 1.6;
    font-weight: 500;
  `;

  // Buttons container
  const btnsContainer = overlay.querySelector('.confirm-buttons');
  btnsContainer.style.cssText = `
    display: flex;
    gap: 12px;
    justify-content: center;
  `;

  // OK button
  const okBtn = overlay.querySelector('.confirm-btn-ok');
  okBtn.style.cssText = `
    background: #00c4a7;
    color: #fff;
    border: none;
    padding: 12px 35px;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
  `;
  okBtn.onmouseover = () => {
    okBtn.style.transform = 'scale(1.03)';
    okBtn.style.boxShadow = '0 4px 15px rgba(0, 196, 167, 0.4)';
  };
  okBtn.onmouseout = () => {
    okBtn.style.transform = 'scale(1)';
    okBtn.style.boxShadow = 'none';
  };
  okBtn.onclick = () => {
    overlay.remove();
    if (onConfirm) onConfirm();
  };

  // Cancel button
  const cancelBtn = overlay.querySelector('.confirm-btn-cancel');
  cancelBtn.style.cssText = `
    background: #ef4444;
    color: #fff;
    border: none;
    padding: 12px 35px;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
  `;
  cancelBtn.onmouseover = () => {
    cancelBtn.style.transform = 'scale(1.03)';
    cancelBtn.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.4)';
  };
  cancelBtn.onmouseout = () => {
    cancelBtn.style.transform = 'scale(1)';
    cancelBtn.style.boxShadow = 'none';
  };
  cancelBtn.onclick = () => {
    overlay.remove();
    if (onCancel) onCancel();
  };

  document.body.appendChild(overlay);
}

// Custom Prompt Modal
function showPrompt(message, onSubmit, onCancel = null, placeholder = '') {
  // Remove any existing prompt modal
  const existing = document.querySelector('.prompt-modal-overlay');
  if (existing) existing.remove();

  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'prompt-modal-overlay';
  overlay.innerHTML = `
    <div class="prompt-modal-card">
      <button class="prompt-close-x" title="إغلاق">&times;</button>
      <div class="prompt-icon-wrapper">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="11" stroke="#3b82f6" stroke-width="2"/>
          <path d="M12 8h.01M12 11v5" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
      </div>
      <p class="prompt-message">${message}</p>
      <textarea class="prompt-input" placeholder="${placeholder}" rows="3"></textarea>
      <div class="prompt-buttons">
        <button class="prompt-btn-ok">موافق</button>
        <button class="prompt-btn-cancel">إلغاء</button>
      </div>
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

  // Card styles
  const card = overlay.querySelector('.prompt-modal-card');
  card.style.cssText = `
    position: relative;
    background: #fff;
    border-radius: 12px;
    padding: 30px 40px;
    text-align: center;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
    max-width: 450px;
    min-width: 350px;
    animation: modalSlideUp 0.3s ease;
  `;

  // Close X button
  const closeX = overlay.querySelector('.prompt-close-x');
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
  closeX.onclick = () => {
    overlay.remove();
    if (onCancel) onCancel();
  };

  // Icon wrapper
  const iconWrapper = overlay.querySelector('.prompt-icon-wrapper');
  iconWrapper.style.cssText = `
    width: 70px;
    height: 70px;
    margin: 0 auto 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(59, 130, 246, 0.1);
    border-radius: 50%;
    animation: iconBounce 0.4s ease 0.1s both;
  `;

  // Message
  const msgEl = overlay.querySelector('.prompt-message');
  msgEl.style.cssText = `
    margin: 0 0 20px 0;
    font-size: 16px;
    color: #374151;
    line-height: 1.6;
    font-weight: 500;
  `;

  // Input
  const inputEl = overlay.querySelector('.prompt-input');
  inputEl.style.cssText = `
    width: 100%;
    padding: 12px 15px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 14px;
    margin-bottom: 20px;
    resize: vertical;
    font-family: inherit;
    direction: rtl;
    transition: border-color 0.2s;
  `;
  inputEl.onfocus = () => inputEl.style.borderColor = '#3b82f6';
  inputEl.onblur = () => inputEl.style.borderColor = '#e5e7eb';

  // Buttons container
  const btnsContainer = overlay.querySelector('.prompt-buttons');
  btnsContainer.style.cssText = `
    display: flex;
    gap: 12px;
    justify-content: center;
  `;

  // OK button
  const okBtn = overlay.querySelector('.prompt-btn-ok');
  okBtn.style.cssText = `
    background: #00c4a7;
    color: #fff;
    border: none;
    padding: 12px 35px;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
  `;
  okBtn.onmouseover = () => {
    okBtn.style.transform = 'scale(1.03)';
    okBtn.style.boxShadow = '0 4px 15px rgba(0, 196, 167, 0.4)';
  };
  okBtn.onmouseout = () => {
    okBtn.style.transform = 'scale(1)';
    okBtn.style.boxShadow = 'none';
  };
  okBtn.onclick = () => {
    const value = inputEl.value.trim();
    overlay.remove();
    if (onSubmit) onSubmit(value);
  };

  // Cancel button
  const cancelBtn = overlay.querySelector('.prompt-btn-cancel');
  cancelBtn.style.cssText = `
    background: #ef4444;
    color: #fff;
    border: none;
    padding: 12px 35px;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
  `;
  cancelBtn.onmouseover = () => {
    cancelBtn.style.transform = 'scale(1.03)';
    cancelBtn.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.4)';
  };
  cancelBtn.onmouseout = () => {
    cancelBtn.style.transform = 'scale(1)';
    cancelBtn.style.boxShadow = 'none';
  };
  cancelBtn.onclick = () => {
    overlay.remove();
    if (onCancel) onCancel();
  };

  document.body.appendChild(overlay);

  // Focus on input
  setTimeout(() => inputEl.focus(), 100);
}

function isEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// API Functions
async function fetchUsers() {
  try {
    const res = await fetch(`/users`, {
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Failed to fetch users');
    return await res.json();
  } catch (err) {
    console.error("❌ Fetch users error:", err);
    return [];
  }
}

async function fetchRequests() {
  try {
    const res = await fetch(`/requests`, {
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Failed to fetch requests');
    return await res.json();
  } catch (err) {
    console.error("❌ Fetch requests error:", err);
    return [];
  }
}

async function fetchSurpluses() {
  try {
    const res = await fetch(`/surpluses`, {
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Failed to fetch surpluses');
    return await res.json();
  } catch (err) {
    console.error("❌ Fetch surpluses error:", err);
    return [];
  }
}

async function deleteUser(id) {
  try {
    const res = await fetch(`/users/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete user');
    return { success: true, message: data.message };
  } catch (err) {
    console.error("❌ Delete user error:", err);
    return { success: false, error: err.message };
  }
}

async function toggleUserStatus(id, isActive) {
  try {
    const res = await fetch(`/users/${encodeURIComponent(id)}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ is_active: isActive })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update status');
    return { success: true, message: data.message };
  } catch (err) {
    console.error("❌ Toggle user status error:", err);
    return { success: false, error: err.message };
  }
}

async function createCharity(charityData) {
  try {
    const res = await fetch(`/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify({ ...charityData, role: 'charity' })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create charity');
    return { success: true, data };
  } catch (err) {
    console.error("❌ Create charity error:", err);
    return { success: false, error: err.message };
  }
}

// Notifications API Functions
let cachedNotifications = [];

async function fetchAdminNotifications() {
  try {
    const res = await fetch(`/notifications/admin`, {
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
    const res = await fetch(`/notifications/${id}/read`, {
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
    const res = await fetch(`/notifications/${id}`, {
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
    const res = await fetch(`/notifications/delete-all`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ role: 'admin' })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete notifications');
    return { success: true, message: data.message };
  } catch (err) {
    console.error("❌ Delete all notifications error:", err);
    return { success: false, error: err.message };
  }
}

function renderNotifications() {
  const container = document.getElementById('view-notifications');
  if (!container) return;

  // Get the card element inside the container
  const card = container.querySelector('.card') || container;

  // Count unread notifications
  const unreadCount = cachedNotifications.filter(n => !n.is_read).length;

  // Update notification badge if exists
  const badge = document.getElementById('notification-badge');
  if (badge) {
    badge.textContent = unreadCount;
    badge.style.display = unreadCount > 0 ? 'inline-flex' : 'none';
  }

  card.innerHTML = `
    <div class="notifications-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:10px;">
      <h2 style="margin:0;color:var(--text);">الإشعارات <span style="font-size:14px;color:var(--muted);">(${cachedNotifications.length})</span></h2>
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
                 cursor:pointer;
                 transition:all 0.2s ease;
               ">
            <div class="notification-icon" style="
              width:44px;
              height:44px;
              border-radius:12px;
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
                <h4 style="margin:0;font-size:15px;font-weight:600;color:var(--text);">${escapeHtml(notification.title || 'إشعار')}</h4>
                ${!isRead ? '<span style="width:8px;height:8px;background:#00c4a7;border-radius:50%;flex-shrink:0;"></span>' : ''}
              </div>
              <p style="margin:0 0 8px 0;font-size:13px;color:var(--muted);line-height:1.5;">${escapeHtml(notification.message || '')}</p>
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
  `;
}

function getNotificationIcon(type) {
  const icons = {
    'request': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
    'surplus': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>',
    'user': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
    'warning': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
    'system': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>'
  };
  return icons[type] || icons['system'];
}

function getNotificationColor(type) {
  const colors = {
    'request': '#3b82f6',
    'surplus': '#22c55e',
    'user': '#8b5cf6',
    'warning': '#f59e0b',
    'system': '#6b7280'
  };
  return colors[type] || colors['system'];
}

// Data Storage
let cachedUsers = [];
let cachedRequests = [];
let cachedSurpluses = [];
let warnings = []; // In-memory warnings (could be moved to API later)

// Main Render Function
async function renderAdmin() {
  // Fetch data from APIs

  cachedUsers = await fetchUsers();
  cachedRequests = await fetchRequests();
  cachedSurpluses = await fetchSurpluses();
  cachedNotifications = await fetchAdminNotifications();

  // Filter out admin users for count
  const nonAdminUsers = cachedUsers.filter(u => u.role !== 'admin');
  const restaurants = nonAdminUsers.filter(u => u.role === 'restaurant');
  const charities = nonAdminUsers.filter(u => u.role === 'charity');
  const activeUsers = nonAdminUsers.filter(u => u.is_active === 1 || u.is_active === true);

  // Update stats cards
  const statUsers = document.getElementById('stat-users-count');
  const statRequests = document.getElementById('stat-requests-count');
  const statSurpluses = document.getElementById('stat-surpluses-count');
  const statRestaurants = document.getElementById('stat-restaurants-count');
  const statCharities = document.getElementById('stat-charities-count');

  if (statUsers) statUsers.textContent = nonAdminUsers.length;
  if (statRequests) statRequests.textContent = cachedRequests.length;
  if (statSurpluses) statSurpluses.textContent = cachedSurpluses.length;
  if (statRestaurants) statRestaurants.textContent = restaurants.length;
  if (statCharities) statCharities.textContent = charities.length;

  // Update donut chart (users distribution)
  updateAdminUsersChart(restaurants.length, charities.length, nonAdminUsers.length);

  // Update progress bars
  updateAdminProgressBars(cachedRequests, cachedSurpluses, activeUsers.length, nonAdminUsers.length);

  // Render events table (requests, warnings, surpluses)
  renderEventsTable();

  // Render users table in dashboard
  renderDashboardUsersTable();

  // Render notifications
  renderNotifications();
}

// Admin Charts Update Functions
function updateAdminUsersChart(restaurantsCount, charitiesCount, totalUsers) {
  const circumference = 2 * Math.PI * 40; // 251.2

  const segmentRestaurants = document.getElementById("segment-restaurants");
  const segmentCharities = document.getElementById("segment-charities");
  const totalUsersEl = document.getElementById("total-users");
  const legendRestaurants = document.getElementById("legend-restaurants");
  const legendCharities = document.getElementById("legend-charities");

  // Update legend
  if (legendRestaurants) legendRestaurants.textContent = restaurantsCount;
  if (legendCharities) legendCharities.textContent = charitiesCount;
  if (totalUsersEl) totalUsersEl.textContent = totalUsers;

  if (!segmentRestaurants || !segmentCharities) return;

  if (totalUsers === 0) {
    segmentRestaurants.style.strokeDasharray = `0 ${circumference}`;
    segmentCharities.style.strokeDasharray = `0 ${circumference}`;
    return;
  }

  // Calculate percentages
  const restaurantsPct = (restaurantsCount / totalUsers) * 100;
  const charitiesPct = (charitiesCount / totalUsers) * 100;

  // Calculate stroke-dasharray values
  const restaurantsDash = (restaurantsPct / 100) * circumference;
  const charitiesDash = (charitiesPct / 100) * circumference;

  // Restaurants starts at 0
  segmentRestaurants.style.strokeDasharray = `${restaurantsDash} ${circumference}`;
  segmentRestaurants.style.strokeDashoffset = '0';

  // Charities starts after restaurants
  segmentCharities.style.strokeDasharray = `${charitiesDash} ${circumference}`;
  segmentCharities.style.strokeDashoffset = `-${restaurantsDash}`;
}

function updateAdminProgressBars(requests, surpluses, activeUsersCount, totalUsers) {
  // Accepted requests rate
  const acceptedRequests = requests.filter(r => r.status === 'accepted').length;
  const acceptanceRate = requests.length > 0 ? Math.round((acceptedRequests / requests.length) * 100) : 0;

  const acceptedRateEl = document.getElementById("admin-accepted-rate");
  const acceptedBar = document.getElementById("admin-accepted-bar");



  if (acceptedRateEl) acceptedRateEl.textContent = `${acceptanceRate}%`;
  if (acceptedBar) acceptedBar.style.width = `${acceptanceRate}%`;

  const rejectedRateEl = document.getElementById("admin-rejected-rate");
  const rejectedBar = document.getElementById("admin-rejected-bar");

  const rejectedRequests = requests.filter(r => r.status === 'rejected').length;
  const rejectionRate = requests.length > 0 ? Math.round((rejectedRequests / requests.length) * 100) : 0;

  if (rejectedRateEl) rejectedRateEl.textContent = `${rejectionRate}%`;
  if (rejectedBar) rejectedBar.style.width = `${rejectionRate}%`;

  // Active surpluses
  const activeSurpluses = surpluses.filter(s => s.status === 'active').length;
  const surplusesPct = surpluses.length > 0 ? Math.round((activeSurpluses / surpluses.length) * 100) : 0;

  const activeSurplusesEl = document.getElementById("admin-active-surpluses");
  const surplusesBar = document.getElementById("admin-surpluses-bar");

  if (activeSurplusesEl) activeSurplusesEl.textContent = activeSurpluses;
  if (surplusesBar) surplusesBar.style.width = `${surplusesPct}%`;

  // Active users
  const activeUsersPct = totalUsers > 0 ? Math.round((activeUsersCount / totalUsers) * 100) : 0;

  const activeUsersEl = document.getElementById("admin-active-users");
  const activeBar = document.getElementById("admin-active-bar");

  if (activeUsersEl) activeUsersEl.textContent = `${activeUsersCount} (${activeUsersPct}%)`;
  if (activeBar) activeBar.style.width = `${activeUsersPct}%`;
}

function renderEventsTable() {
  const tbody = document.getElementById("admin-requests-body");
  if (!tbody) return;

  tbody.innerHTML = "";

  const filterType = document.getElementById("filter-type")?.value || "";
  const filterDate = document.getElementById("filter-date")?.value || "";

  // Build events array
  const events = [];

  cachedRequests.forEach(r => {
    events.push({
      type: 'request',
      time: r.created_at || r.time,
      id: r.id,
      payload: r

    });
  });

  warnings.forEach(w => {
    events.push({
      type: 'warning',
      time: w.time,
      id: w.id,
      payload: w
    });
  });

  cachedSurpluses.forEach(s => {
    events.push({
      type: 'surplus',
      time: s.created_at || s.createdAt,
      id: s.id,
      payload: s,
      instut: s.restaurant_name,
    });
  });

  // Filter and sort
  events
    .filter(ev => {
      if (filterType && ev.type !== filterType) return false;
      if (filterDate && ev.time) {
        const evDate = new Date(ev.time).toISOString().split("T")[0];
        if (evDate !== filterDate) return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .forEach(ev => {
      const tr = document.createElement('tr');

      const typeLabel =
        ev.type === 'request' ? 'طلب' :
          ev.type === 'warning' ? 'رسالة' : 'فائض';

      const content =
        ev.type === 'request' ? escapeHtml(ev.payload.title || ev.payload.surplus_title || '-') :
          ev.type === 'warning' ? escapeHtml(ev.payload.message) : escapeHtml(ev.payload.title);

      tr.innerHTML = `
        <td>${typeLabel}</td>
        <td>${content}</td>
        <td>${ev.time ? new Date(ev.time).toLocaleString('en-US') : '-'}</td>
        <td>${ev.id}</td>
        <td><button class="btn btn-view-event" data-type="${ev.type}" data-id="${ev.id}">عرض</button></td>
      `;

      tbody.appendChild(tr);
    });
}



// Dashboard Users Table (in main dashboard view)
function renderDashboardUsersTable() {
  const tbody = document.getElementById("dashboard-users-body");
  if (!tbody) return;

  tbody.innerHTML = "";
  const searchQuery = (document.getElementById("dashboard-user-search-input")?.value || "").toLowerCase().trim();

  cachedUsers
    .filter(u => {
      if (u.role === "admin") return false;
      if (!searchQuery) return true;
      const nameMatch = (u.name || "").toLowerCase().includes(searchQuery);
      const emailMatch = (u.email || "").toLowerCase().includes(searchQuery);
      const roleMatch = (u.role || "").toLowerCase().includes(searchQuery);
      return nameMatch || emailMatch || roleMatch;
    })
    .forEach(u => {
      const tr = document.createElement('tr');
      tr.dataset.id = u.id;

      if (u.role === "restaurant" || u.role === "charity") {
        const isActive = u.is_active === 1 || u.is_active === true;
        const statusText = isActive ? 'مفعّل' : 'معطّل';
        const statusColor = isActive ? '#00c4a7' : '#ef4444';
        const toggleBtnText = isActive ? 'تعطيل' : 'تفعيل';
        const toggleBtnColor = isActive ? '#f59e0b' : '#22c55e';

        tr.innerHTML = `
          <td>${escapeHtml(u.name)}</td>
          <td>${escapeHtml(u.role)}</td>
          <td>${escapeHtml(u.email)}</td>
          <td><span style="color:${statusColor};font-weight:600">${statusText}</span></td>
          <td>
            <button class="btn btn-toggle-status" data-id="${u.id}" data-active="${isActive}" style="background:${toggleBtnColor};margin-left:6px">${toggleBtnText}</button>
            <button class="btn btn-warn" data-email="${escapeHtml(u.email)}">رسالة</button>
            <button class="btn btn-delete-user" data-id="${u.id}" data-email="${escapeHtml(u.email)}" style="background:var(--danger);margin-left:6px">حذف</button>
          </td>
        `;
      }
      tbody.appendChild(tr);
    });
}

// Event Listeners
document.getElementById("filter-type")?.addEventListener("change", renderEventsTable);
document.getElementById("filter-date")?.addEventListener("change", function () {
  const wrapper = document.getElementById("date-filter-wrapper");
  if (wrapper) {
    if (this.value) {
      wrapper.classList.add("has-value");
    } else {
      wrapper.classList.remove("has-value");
    }
  }
  renderEventsTable();
});

// Clear date button handler
document.getElementById("clear-date-btn")?.addEventListener("click", function () {
  const dateInput = document.getElementById("filter-date");
  const wrapper = document.getElementById("date-filter-wrapper");
  if (dateInput) {
    dateInput.value = "";
    wrapper?.classList.remove("has-value");
    renderEventsTable();
  }
});


document.getElementById("dashboard-user-search-input")?.addEventListener("input", renderDashboardUsersTable);

// DOMContentLoaded
document.addEventListener("DOMContentLoaded", async () => {
  // ⚠️ CRITICAL: Check authentication first
  currentUser = await checkAuth();

  if (!currentUser) {
    // checkAuth already redirects
    return;
  }

  renderAdmin();
  setInterval(renderAdmin, 10000); // Refresh every 10 seconds

  // Hide element with id="xy" if exists
  const xyElement = document.getElementById("xy");
  if (xyElement) xyElement.style.display = "none";

  // Initialize map for creating charity
  initCharityForm();

  // Initialize password toggle
  initPasswordToggle();
});

// Charity Creation Form
function initCharityForm() {
  const form = document.getElementById('admin-create-charity-form');
  if (!form) return;

  let adminMap, adminMarker;
  const tripoliCenter = [32.8872, 13.1913];

  const mapContainer = document.getElementById('admin-map');
  if (mapContainer && typeof L !== 'undefined') {
    adminMap = L.map('admin-map').setView(tripoliCenter, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(adminMap);

    adminMap.on('click', function (e) {
      const { lat, lng } = e.latlng;
      document.getElementById('lat').value = lat.toFixed(6);
      document.getElementById('lng').value = lng.toFixed(6);

      if (adminMarker) {
        adminMarker.setLatLng(e.latlng);
      } else {
        adminMarker = L.marker(e.latlng).addTo(adminMap);
      }
    });

    // Handle resize
    const ro = new ResizeObserver(() => {
      if (adminMap) adminMap.invalidateSize(true);
    });
    ro.observe(mapContainer);
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const nameInput = document.getElementById('admin-charity-name');
    const emailInput = document.getElementById('admin-charity-email');
    const phoneInput = document.getElementById('admin-charity-phone');
    const addressInput = document.getElementById('admin-charity-address');
    const descInput = document.getElementById('desc');
    const latInput = document.getElementById('lat');
    const lngInput = document.getElementById('lng');
    const passInput = document.getElementById('admin-charity-pass');
    const pass2Input = document.getElementById('admin-charity-pass2');

    const name = (nameInput?.value || '').trim();
    const email = (emailInput?.value || '').trim();
    const phone = (phoneInput?.value || '').trim();
    const address = (addressInput?.value || '').trim();
    const desc = (descInput?.value || '').trim();
    const lat = parseFloat(latInput?.value || '0');
    const lng = parseFloat(lngInput?.value || '0');
    const pass = passInput?.value || '';
    const pass2 = pass2Input?.value || '';

    // Function to show field error with red border
    function showFieldError(input, message) {
      if (!input) return;

      // Find closest .field div or fallback to parentElement
      const fieldContainer = input.closest('.field') || input.parentElement;

      // Remove any existing error message
      const existingError = fieldContainer.querySelector('.field-error-msg');
      if (existingError) existingError.remove();

      // Add red border to indicate error
      input.style.borderColor = '#ef4444';
      input.style.border = '2px solid #ef4444';
      input.style.boxShadow = 'none';

      // Create error message element below the field
      const errorDiv = document.createElement('div');
      errorDiv.className = 'field-error-msg';
      errorDiv.style.cssText = 'color: #ef4444; font-size: 13px; margin-top: 6px; text-align: right;';
      errorDiv.textContent = message;
      fieldContainer.appendChild(errorDiv);

      // Remove error styling when user starts typing
      input.addEventListener('input', function resetError() {
        input.style.borderColor = '';
        input.style.border = '';
        input.style.boxShadow = '';
        const errMsg = fieldContainer.querySelector('.field-error-msg');
        if (errMsg) errMsg.remove();
        input.removeEventListener('input', resetError);
      }, { once: true });
    }

    // Remove all previous error messages
    form.querySelectorAll('.field-error-msg').forEach(el => el.remove());
    form.querySelectorAll('input, textarea').forEach(el => {
      el.style.borderColor = '';
      el.style.border = '';
      el.style.boxShadow = '';
    });

    // Comprehensive validation - check all errors at once
    let hasError = false;

    // 1. Charity name - required, Arabic or English letters only (with spaces)
    const arabicEnglishOnlyRegex = /^[\u0600-\u06FF\u0750-\u077Fa-zA-Z\s]+$/;
    if (!name) {
      showFieldError(nameInput, 'الاسم لا يمكن أن يكون فارغاً');
      hasError = true;
    } else if (name.length < 2) {
      showFieldError(nameInput, 'الاسم يجب أن يكون حرفين أو أكثر');
      hasError = true;
    } else if (!arabicEnglishOnlyRegex.test(name)) {
      showFieldError(nameInput, 'الاسم يجب أن يحتوي على حروف عربية أو إنجليزية فقط');
      hasError = true;
    }

    // 2. Email - English letters only + symbols (. _) + @ (no hyphens)
    // Format: letters/numbers/._ @ letters/numbers/. . letters
    const emailRegex = /^[a-zA-Z0-9._]+@[a-zA-Z0-9.]+\.[a-zA-Z]{2,}$/;
    if (!email) {
      showFieldError(emailInput, 'البريد الإلكتروني لا يمكن أن يكون فارغاً');
      hasError = true;
    } else if (email.includes('-')) {
      showFieldError(emailInput, 'البريد الإلكتروني لا يقبل إشارة (-)');
      hasError = true;
    } else if (!emailRegex.test(email)) {
      showFieldError(emailInput, 'البريد الإلكتروني يجب أن يحتوي على حروف إنجليزية ورموز (. _) فقط');
      hasError = true;
    } else {
      // 3. Check if email is already registered
      const existingUser = cachedUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existingUser) {
        showFieldError(emailInput, 'هذا البريد الإلكتروني مسجل مسبقاً');
        hasError = true;
      }
    }

    // 4. Phone number - starts with 09, third digit (1,2,3,4) + 7 more digits = 10 digits
    // Format: 09[1-4]xxxxxxx
    const phoneRegex = /^09[1-4][0-9]{7}$/;
    if (!phone) {
      showFieldError(phoneInput, 'رقم الهاتف لا يمكن أن يكون فارغاً');
      hasError = true;
    } else if (!phoneRegex.test(phone)) {
      if (phone.length !== 10) {
        showFieldError(phoneInput, 'رقم الهاتف يجب أن يكون 10 أرقام');
      } else if (!phone.startsWith('09')) {
        showFieldError(phoneInput, 'رقم الهاتف يجب أن يبدأ بـ 09');
      } else if (!/^09[1-4]/.test(phone)) {
        showFieldError(phoneInput, 'الرقم الثالث يجب أن يكون 1 أو 2 أو 3 أو 4');
      } else {
        showFieldError(phoneInput, 'رقم الهاتف غير صالح');
      }
      hasError = true;
    }

    // 5. Address - required
    if (!address) {
      showFieldError(addressInput, 'العنوان لا يمكن أن يكون فارغاً');
      hasError = true;
    } else if (address.length < 3) {
      showFieldError(addressInput, 'العنوان يجب أن يكون 3 أحرف أو أكثر');
      hasError = true;
    }

    // 6. Description - required
    if (!desc) {
      showFieldError(descInput, 'الوصف لا يمكن أن يكون فارغاً');
      hasError = true;
    } else if (desc.length < 10) {
      showFieldError(descInput, 'الوصف يجب أن يكون 10 أحرف أو أكثر');
      hasError = true;
    }

    // 7. Password - required, min 6 chars, English letters and symbols only (no Arabic, no hyphens)
    const arabicCharsRegex = /[\u0600-\u06FF\u0750-\u077F]/;
    const passwordRegex = /^[a-zA-Z0-9!@#$%^&*()_+=\[\]{};':"\\|,.<>\/?`~]+$/;
    if (!pass) {
      showFieldError(passInput, 'كلمة المرور لا يمكن أن تكون فارغة');
      hasError = true;
    } else if (pass.length < 6) {
      showFieldError(passInput, 'كلمة المرور يجب أن تكون 6 أحرف أو أكثر');
      hasError = true;
    } else if (pass.includes('-')) {
      showFieldError(passInput, 'كلمة المرور لا تقبل إشارة (-)');
      hasError = true;
    } else if (arabicCharsRegex.test(pass)) {
      showFieldError(passInput, 'كلمة المرور لا تقبل الحروف العربية');
      hasError = true;
    } else if (!passwordRegex.test(pass)) {
      showFieldError(passInput, 'كلمة المرور يجب أن تحتوي على حروف إنجليزية وأرقام ورموز فقط');
      hasError = true;
    }

    // 8. Confirm password - must match
    if (!pass2) {
      showFieldError(pass2Input, 'تأكيد كلمة المرور مطلوب');
      hasError = true;
    } else if (pass !== pass2) {
      showFieldError(pass2Input, 'كلمتا المرور غير متطابقتين');
      hasError = true;
    }

    // 9. Map location - required
    if (!lat || !lng || lat === 0 || lng === 0) {
      showToast('يرجى تحديد موقع الجمعية على الخريطة', 'danger');
      hasError = true;
    }

    // If there are errors, stop here
    if (hasError) {
      return;
    }

    // SEND TO API
    // Show loading state on submit button
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn?.innerHTML;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'جارٍ الإنشاء...';
    }

    // Check if email is already taken
    try {
      const checkEmailRes = await fetch(`/auth/check-email-available`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ email })
      });

      const checkEmailData = await checkEmailRes.json();

      if (!checkEmailRes.ok || !checkEmailData.available) {
        showFieldError(emailInput, 'هذا البريد الإلكتروني مسجل بالفعل');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }
        return;
      }
    } catch (err) {
      console.error("❌ Check email error:", err);
      showToast('خطأ في التحقق من البريد الإلكتروني', 'danger');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
      return;
    }

    // Check if phone number is already taken
    try {
      const checkPhoneRes = await fetch(`/auth/check-phone-available`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ phone })
      });

      const checkPhoneData = await checkPhoneRes.json();

      if (!checkPhoneRes.ok || !checkPhoneData.available) {
        showFieldError(phoneInput, 'رقم الهاتف مستخدم بالفعل');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }
        return;
      }
    } catch (err) {
      console.error("❌ Check phone error:", err);
      showToast('خطأ في التحقق من رقم الهاتف', 'danger');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
      return;
    }

    const result = await createCharity({
      name,
      email,
      password: pass,
      phone,
      address,
      description: desc,
      lat,
      lng
    });

    // Reset button state
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }

    if (result.success) {
      // Keep data visible, clear form when notification closes
      showToast('تم إنشاء حساب الجمعية الخيرية بنجاح ✓', 'success', () => {
        form.reset();
        if (adminMarker && adminMap) {
          adminMap.removeLayer(adminMarker);
          adminMarker = null;
        }
      });
      renderAdmin();
    } else {
      // Show specific error from API
      let errorMsg = result.error || 'فشل إنشاء الحساب';

      // Handle common API errors
      if (errorMsg.toLowerCase().includes('email') || errorMsg.toLowerCase().includes('exists') || errorMsg.toLowerCase().includes('duplicate')) {
        highlightError(emailInput, 'هذا البريد الإلكتروني مُسجل مسبقاً');
      } else {
        showToast(errorMsg, 'danger');
      }
    }
  });
}

// Click Event Handlers
document.addEventListener('click', async function (e) {
  // Mark Notification as Read Button
  const markReadBtn = e.target.closest('.btn-mark-read');
  if (markReadBtn) {
    const id = markReadBtn.dataset.id;
    markReadBtn.disabled = true;
    markReadBtn.innerText = 'جارٍ...';

    const result = await markNotificationAsRead(id);

    if (result.success) {
      showToast('تم تمييز الإشعار كمقروء', 'success');
      // Update local cache
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

  // Toggle User Status Button
  const toggleBtn = e.target.closest('.btn-toggle-status');
  if (toggleBtn) {
    const id = toggleBtn.dataset.id;
    const currentlyActive = toggleBtn.dataset.active === 'true';
    const newStatus = !currentlyActive;
    const actionText = newStatus ? 'تفعيل' : 'تعطيل';

    showConfirm(`هل تريد ${actionText} هذا الحساب؟`, async () => {
      toggleBtn.disabled = true;
      toggleBtn.innerText = 'جارٍ...';

      const result = await toggleUserStatus(id, newStatus);

      if (result.success) {
        showToast(result.message || `تم ${actionText} الحساب بنجاح`, 'success');
        renderAdmin();
      } else {
        showToast(result.error || `فشل ${actionText} الحساب`, 'warn');
        toggleBtn.disabled = false;
        toggleBtn.innerText = currentlyActive ? 'تعطيل' : 'تفعيل';
      }
    });
    return;
  }

  // Send Warning Button
  const warnBtn = e.target.closest('.btn-warn');
  if (warnBtn) {
    const email = warnBtn.dataset.email;

    showPrompt(`نص الرسالة التي تريد إرسالها إلى: ${email}`, async (msg) => {
      if (!msg) {
        showToast('الرسالة فارغة', 'warn');
        return;
      }

      warnBtn.disabled = true;
      const origText = warnBtn.innerText;
      warnBtn.innerText = 'جارٍ الإرسال...';

      try {
        const res = await fetch(`/notifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            receiver_type: 'user',
            receiver_role: email,
            sender_id: currentUser?.id || null,
            type: 'admin_message',
            title: 'رسالة من الإدارة',
            message: msg,
            action_url: null,
            meta: { from: 'admin', admin_email: currentUser?.email }
          })
        });

        if (!res.ok) throw new Error('Failed to send notification');

        warnings.push({
          id: Date.now(),
          targetEmail: email,
          message: msg,
          from: 'admin',
          time: new Date().toISOString()
        });

        showToast('تم إرسال الرسالة بنجاح', 'success');
        renderEventsTable();
      } catch (err) {
        console.error('❌ Send notification error:', err);
        showToast('فشل إرسال الرسالة', 'danger');
      } finally {
        warnBtn.disabled = false;
        warnBtn.innerText = origText;
      }
    }, null, 'اكتب رسالتك هنا...');
    return;
  }

  // View Event Button
  const viewEventBtn = e.target.closest('.btn-view-event');
  if (viewEventBtn) {
    const type = viewEventBtn.dataset.type;
    const id = Number(viewEventBtn.dataset.id);

    if (type === 'request') {
      const r = cachedRequests.find(x => x.id === id);
      if (!r) { showToast('الطلب غير موجود', 'warn'); return; }
      openAdminModal('طلب استلام', `
       العنصر: ${r.title || r.surplus_title || '-'}
       المؤسسة: ${r.restaurant_name || r.restaurant_email || '-'}
       الجمعية: ${r.charity_name || r.charity_email || '-'}
       الحالة: ${r.status || '-'}
       الوقت: ${r.created_at ? new Date(r.created_at).toLocaleString('en-US') : '-'}
      `);
      return;
    }

    if (type === 'warning') {
      const w = warnings.find(x => x.id === id);
      if (!w) { showToast('الرسالة غير موجود', 'warn'); return; }
      openAdminModal('رسالة مسجّلة', `
      المرسل إلى: ${w.targetEmail}
      النص: ${w.message}
      الوقت: ${new Date(w.time).toLocaleString('en-US')}
      `);
      return;
    }

    if (type === 'surplus') {
      const s = cachedSurpluses.find(x => x.id === id);
      if (!s) { showToast('الفائض غير موجود', 'warn'); return; }
      openAdminModal('الفائض', `
       العنصر: ${s.title}
       الكمية: ${s.qty}
       الصلاحية: ${s.expiry_text || (s.expiry_hours ? s.expiry_hours + ' ساعة' : '-')}
       الوصف: ${s.description || s.desc || '-'}
       الموقع: ${s.location || s.address || '-'}
       المؤسسة: ${s.restaurant_name || s.restaurant_email || '-'}
      `);
      return;
    }
  }

  // Delete User Button
  const deleteBtn = e.target.closest('.btn-delete-user');
  if (deleteBtn) {
    const email = deleteBtn.dataset.email || 'المستخدم';
    const id = deleteBtn.dataset.id;

    if (!id) {
      showToast('تعذّر تحديد معرف المستخدم', 'warn');
      return;
    }

    showConfirm(`هل أنت متأكد من حذف المستخدم ${email}؟<br>لا يمكن التراجع عن هذا الإجراء.`, async () => {
      deleteBtn.disabled = true;
      const origText = deleteBtn.innerText;
      deleteBtn.innerText = 'جارٍ الحذف...';

      const result = await deleteUser(id);

      if (result.success) {
        showToast(result.message || 'تم حذف المستخدم ' + email, 'success');
        const userRow = deleteBtn.closest('tr');
        if (userRow) {
          userRow.remove();
        } else {
          renderAdmin();
        }
      } else {
        showToast(result.error || 'فشل حذف المستخدم', 'warn');
        deleteBtn.disabled = false;
        deleteBtn.innerText = origText;
      }
    });
    return;
  }
});

// Admin Modal
function openAdminModal(title, bodyText) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content" style="max-width:430px;padding:20px">
      <h3 style="margin-bottom:15px">${escapeHtml(title)}</h3>
      <pre style="white-space:pre-wrap;color:var(--text);direction:rtl;text-align:right;line-height:1.8">${escapeHtml(bodyText)}</pre>
      <div style="text-align:left;margin-top:15px">
        <button class="btn" id="close-admin-modal">إغلاق</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.addEventListener('click', function (e) {
    if (e.target === modal) modal.remove();
  });

  const closeBtn = modal.querySelector('#close-admin-modal');
  if (closeBtn) closeBtn.addEventListener('click', () => modal.remove());
}

// Profile Navigation
document.getElementById('goProfile')?.addEventListener('click', () => {
  window.location.href = 'adProfile.html';
});

// Password Toggle
function initPasswordToggle() {
  const passInput = document.querySelector("#admin-charity-pass");
  const pass2Input = document.querySelector("#admin-charity-pass2");

  // Toggle for first password field
  const toggleBtn = document.querySelector("#toggle-pass");
  const eyeOpen = document.querySelector("#eye-open");
  const eyeClosed = document.querySelector("#eye-closed");

  if (toggleBtn && passInput) {
    toggleBtn.addEventListener("click", () => {
      const isShown = passInput.type === "text";
      passInput.type = isShown ? "password" : "text";
      toggleBtn.setAttribute("aria-pressed", String(!isShown));
      if (eyeOpen) eyeOpen.style.display = isShown ? "" : "none";
      if (eyeClosed) eyeClosed.style.display = isShown ? "none" : "";
      passInput.focus();
    });
  }

  // Toggle for confirm password field
  const toggleBtn2 = document.querySelector("#toggle-pass2");
  const eyeOpen2 = document.querySelector("#eye-open2");
  const eyeClosed2 = document.querySelector("#eye-closed2");

  if (toggleBtn2 && pass2Input) {
    toggleBtn2.addEventListener("click", () => {
      const isShown = pass2Input.type === "text";
      pass2Input.type = isShown ? "password" : "text";
      toggleBtn2.setAttribute("aria-pressed", String(!isShown));
      if (eyeOpen2) eyeOpen2.style.display = isShown ? "" : "none";
      if (eyeClosed2) eyeClosed2.style.display = isShown ? "none" : "";
      pass2Input.focus();
    });
  }
}
