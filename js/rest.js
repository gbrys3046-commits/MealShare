

const API_BASE = `http://${window.location.hostname}:3000/api`;

// Current User (from server session)
let currentUser = null;

// Navigation
const panel = document.getElementById('nav1');
const surp = document.getElementById('nav2');
const ord = document.getElementById('nav3');
const sett = document.getElementById('nav4');
const notif = document.getElementById('nav5');

const views = {
  nav1: document.getElementById('view-dashboard'),
  nav2: document.getElementById('view-surpluses'),
  nav3: document.getElementById('view-requests'),
  nav4: document.getElementById('view-settings'),
  nav5: document.getElementById('view-notifications')

};

function switchView(activeId) {
  [panel, surp, ord, sett, notif].forEach(el => {
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

if (panel) panel.addEventListener('click', () => switchView('nav1'));
if (surp) surp.addEventListener('click', () => switchView('nav2'));
if (ord) ord.addEventListener('click', () => switchView('nav3'));
if (sett) sett.addEventListener('click', () => switchView('nav4'));
if (notif) notif.addEventListener('click', () => switchView('nav5'));

// Utility Functions
function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function showToast(message, type = "default") {
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
    max-width: 500px;
    min-width: 350px;
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

// Show prominent success notification div - Same style as showToast notification modal
function showSuccessNotification(title, subtitle = "", onClose = null) {
  // Remove any existing notification
  const existing = document.querySelector('.notification-modal-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'notification-modal-overlay';
  overlay.innerHTML = `
    <div class="notification-modal-card">
      <button class="notification-close-x" title="إغلاق">&times;</button>
      <div class="notification-icon-wrapper">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="11" stroke="#00c4a7" stroke-width="2"/>
          <path d="M8 12l2.5 2.5L16 9" stroke="#00c4a7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h2 class="notification-title">${title}</h2>
      ${subtitle ? `<p class="notification-subtitle">${subtitle}</p>` : ''}
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
    max-width: 400px;
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
    background: rgba(0, 196, 167, 0.1);
    border-radius: 50%;
    animation: iconBounce 0.4s ease 0.1s both;
  `;

  // Title
  const titleEl = overlay.querySelector('.notification-title');
  titleEl.style.cssText = `
    color: #00c4a7;
    font-size: 20px;
    font-weight: bold;
    margin: 0 0 10px 0;
  `;

  // Subtitle
  const subtitleEl = overlay.querySelector('.notification-subtitle');
  if (subtitleEl) {
    subtitleEl.style.cssText = `
      color: #6b7280;
      font-size: 14px;
      margin: 0 0 25px 0;
      line-height: 1.5;
    `;
  }

  // OK button
  const okBtn = overlay.querySelector('.notification-ok-btn');
  okBtn.style.cssText = `
    background: #00c4a7;
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
    okBtn.style.boxShadow = '0 4px 15px rgba(0, 196, 167, 0.5)';
  };
  okBtn.onmouseout = () => {
    okBtn.style.transform = 'scale(1)';
    okBtn.style.boxShadow = 'none';
  };
  okBtn.onclick = () => { overlay.remove(); if (onClose) onClose(); };

  // Add keyframe animations if not already added
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

// Auth Check - CRITICAL
// Track auth check attempts to prevent redirect loops
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
    
    const res = await fetch(`${API_BASE}/auth/me`, {
      method: 'GET',
      credentials: 'include' // ⚠️ CRITICAL: Send cookies
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

// Fetch Surpluses
async function fetchSurplusesFromServer() {
  try {
    const res = await fetch(`${API_BASE}/surpluses`, {
      credentials: 'include'
    });
    if (!res.ok) throw new Error("Failed to fetch surpluses");
    return await res.json();
  } catch (err) {
    console.error(err);
    return [];
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

function renderNotifications() {
  const container = document.getElementById('view-notifications');
  if (!container) return;

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

// Update unread notification badge in sidebar navigation
function updateNotificationBadge(unreadCount) {
  const navItem = document.getElementById('nav5');
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

function getNotificationIcon(type) {
  const icons = {
    'request': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
    'request.created': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
    'surplus': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>',
    'surplus.created': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>',
    'admin_message': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>',
    'system': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>'
  };
  return icons[type] || icons['system'];
}

function getNotificationColor(type) {
  const colors = {
    'request': '#3b82f6',
    'request.created': '#f59e0b',
    'surplus': '#22c55e',
    'surplus.created': '#22c55e',
    'admin_message': '#8b5cf6',
    'system': '#6b7280'
  };
  return colors[type] || colors['system'];
}

// Render Restaurant Dashboard
async function renderRestaurant() {
  if (!currentUser) return;

  // Fetch and render notifications
  cachedNotifications = await fetchNotifications();
  console.log(`🔔 Loaded ${cachedNotifications.length} notifications`);
  renderNotifications();

  const ob = document.getElementById("owner-surplus-body");
  if (ob) {
    ob.innerHTML = "";
  
    const surpluses = await fetchSurplusesFromServer();
    const mySurpluses = surpluses.filter(s => s.restaurant_email === currentUser.email);

    mySurpluses.forEach((s) => {
      const tr = document.createElement("tr");

      const statusLabel =
        s.status === "expired"
          ? '<span class="status danger"> منتهي الصلاحية</span>'
          : '<span class="status success">منشور</span>';

      tr.innerHTML = `
        <td>${escapeHtml(s.title)}</td>
        <td>${escapeHtml(s.qty)}</td>
        <td>${escapeHtml(s.expiry_text)}</td>
        <td>${statusLabel}</td>
        <td>
          <button class="btn btn-delete-surplus" data-id="${s.id}">حذف</button>
        </td>
        <td>
          <button class="btn btn-edit-surplus" data-surplus='${JSON.stringify(s)}'>تعديل</button>
        </td>
      `;

      ob.appendChild(tr);
    });

    const sc = document.getElementById("stat-count");
    if (sc) sc.textContent = mySurpluses.length;
  }

  // Render Requests
  const rrb = document.getElementById("restaurant-requests-body");
  if (rrb) {
    rrb.innerHTML = "";

    let myRequests = [];
    try {
      const res = await fetch(
        `${API_BASE}/requests?restaurant_email=${encodeURIComponent(currentUser.email)}`,
        { credentials: 'include' }
      );

      if (res.ok) {
        myRequests = await res.json();
        if (!Array.isArray(myRequests)) myRequests = [];
      }
    } catch (err) {
      console.error(err);
    }

    const statAccepted = document.getElementById("stat-accepted");
    if (statAccepted) {
      statAccepted.textContent = myRequests.filter(r => r.status === "accepted").length;
    }

    if (myRequests.length === 0) {
      rrb.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--muted)">لا توجد طلبات واردة</td></tr>`;
    } else {
      myRequests.forEach((r) => {
        const tr = document.createElement("tr");
        tr.id = `request-row-${r.id}`;

        let statusHtml = '<span class="status warn">قيد الانتظار</span>';
        let actionsHtml = `
          <button class="btn btn-accept-req" data-id="${r.id}">قبول</button>
          <button class="btn btn-reject-req" data-id="${r.id}" style="background:var(--danger)">رفض</button>
        `;

        if (r.status === "accepted") {
          statusHtml = '<span class="status success">مقبول</span>';
          actionsHtml = '<span style="color:var(--success)">تم القبول</span>';
        } else if (r.status === "rejected") {
          statusHtml = '<span class="status danger">مرفوض</span>';
          actionsHtml = '<span style="color:var(--danger)">تم الرفض</span>';
        }

        tr.innerHTML = `
          <td>${escapeHtml(r.title)}</td>
          <td>
            <span class="char-link" data-email="${r.charity_email || ""}">${escapeHtml(r.charity_name || r.charity_email || "جمعية")}</span>
          </td>
          <td>${new Date(r.created_at).toLocaleString("en-US")}</td>
          <td>${statusHtml}</td>
          <td style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
            ${actionsHtml}
            <button class="btn btn-delete-request" data-id="${r.id}" style="background:#ef4444;color:#fff; display:none;">حذف</button>
          </td>
        `;

        rrb.appendChild(tr);
      });
    }
  }

  // Render Ratings - Same style as profile.html
  const myRatings = document.getElementById("my-ratings-section");
  if (myRatings) {
    myRatings.innerHTML = "";

    try {
      const ratingsRes = await fetch(
        `${API_BASE}/ratings/restaurant/${encodeURIComponent(currentUser.email)}`,
        { credentials: 'include' }
      );
      const avgRes = await fetch(
        `${API_BASE}/ratings/restaurant/${encodeURIComponent(currentUser.email)}/avg`,
        { credentials: 'include' }
      );

      let evals = [];
      let avgData = { staff_behavior_avg: 0, timeliness_avg: 0, packaging_avg: 0, total_ratings: 0 };

      if (ratingsRes.ok) evals = await ratingsRes.json();
      if (avgRes.ok) avgData = await avgRes.json();

      // Calculate overall average like profile.html
      const staffAvg = parseFloat(avgData.staff_behavior_avg) || 0;
      const timelinessAvg = parseFloat(avgData.timeliness_avg) || 0;
      const packagingAvg = parseFloat(avgData.packaging_avg) || 0;
      const totalRatings = avgData.total_ratings || evals.length || 0;

      // Calculate overall average (only from non-zero values)
      let validAverages = [];
      if (staffAvg > 0) validAverages.push(staffAvg);
      if (timelinessAvg > 0) validAverages.push(timelinessAvg);
      if (packagingAvg > 0) validAverages.push(packagingAvg);
      
      const overallAvg = validAverages.length > 0 
        ? (validAverages.reduce((a, b) => a + b, 0) / validAverages.length) 
        : 0;
      
      // Update rating stat card
      const statRating = document.getElementById("stat-rating");
      if (statRating) {
        statRating.textContent = overallAvg > 0 ? `${overallAvg.toFixed(1)}⭐` : "0";
      }

      if (evals.length === 0) {
        myRatings.innerHTML = '<p style="color:var(--muted)">لا توجد تقييمات حتى الآن</p>';
      } else {
        // Summary section with numeric rating like profile.html
        const summary = `<div style="padding:16px;background:var(--glass);border-radius:8px;margin-bottom:16px;text-align:center;">
          <div style="font-size:24px;margin-bottom:6px;color:#f59e0b;">⭐⭐⭐⭐</div>
          <div style="font-weight:700;font-size:16px;">${overallAvg.toFixed(2)}/5 (${totalRatings} تقييم)</div>
        </div>`;
        myRatings.innerHTML = summary;

        // Render individual ratings like profile.html
        evals.forEach((e) => {
          // Calculate overall rating for this review
          const staffRating = parseFloat(e.staff_behavior_rating) || 0;
          const timelinessRating = parseFloat(e.timeliness_rating) || 0;
          const packagingRating = parseFloat(e.packaging_rating) || 0;
          
          let validRatings = [];
          if (staffRating > 0) validRatings.push(staffRating);
          if (timelinessRating > 0) validRatings.push(timelinessRating);
          if (packagingRating > 0) validRatings.push(packagingRating);
          
          const overallRating = validRatings.length > 0 
            ? (validRatings.reduce((a, b) => a + b, 0) / validRatings.length) 
            : 0;

          const div = document.createElement("div");
          div.style.cssText = "padding:12px;border:1px solid var(--border);border-radius:8px;background:var(--glass);margin-bottom:10px;";
          div.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <strong style="color:var(--primary);">${escapeHtml(e.charity_name || e.charity_email)}</strong>
              <span style="font-size:12px;color:var(--muted);">${new Date(e.created_at).toLocaleDateString("en-US")}</span>
            </div>
            <div style="font-size:16px;margin-bottom:4px;font-weight:bold;color:#f59e0b;">⭐ ${overallRating.toFixed(1)} / 5</div>
            <div style="font-size:12px;color:var(--muted);">
              معاملة الطاقم: ${e.staff_behavior_rating || "-"} | 
              الالتزام بالوقت: ${e.timeliness_rating || "-"} | 
              التغليف: ${e.packaging_rating || "-"}
            </div>
            ${e.comment ? `<div style="font-size:13px;margin-top:6px;padding-top:6px;border-top:1px solid var(--border);">${escapeHtml(e.comment)}</div>` : ""}
          `;
          myRatings.appendChild(div);
        });
      }
    } catch (err) {
      console.error("Error fetching ratings:", err);
      myRatings.innerHTML = '<p style="color:var(--danger)">فشل تحميل التقييمات</p>';
    }
  }

  // Update welcome message
  const welcome = document.querySelector('.welcome');
  if (welcome && currentUser.name) {
    welcome.innerText = currentUser.name;
  }
  
  // Update Charts and Statistics
  updateStatisticsCharts();
}

// Statistics Charts Update Function
function updateStatisticsCharts() {
  // Get requests data
  const rrb = document.getElementById("restaurant-requests-body");
  if (!rrb) return;
  
  // Count requests by status
  const rows = rrb.querySelectorAll('tr');
  let accepted = 0, pending = 0, rejected = 0, total = 0;
  
  rows.forEach(row => {
    if (row.querySelector('[colspan]')) return; // Skip "no requests" row
    total++;
    const statusCell = row.querySelector('.status');
    if (statusCell) {
      if (statusCell.classList.contains('success')) accepted++;
      else if (statusCell.classList.contains('danger')) rejected++;
      else pending++;
    }
  });
  
  // Update stat cards
  const statPending = document.getElementById("stat-pending");
  const statRejected = document.getElementById("stat-rejected");
  if (statPending) statPending.textContent = pending;
  if (statRejected) statRejected.textContent = rejected;
  
  // Update donut chart
  updateDonutChart(accepted, pending, rejected, total);
  
  // Update legend
  const legendAccepted = document.getElementById("legend-accepted");
  const legendPending = document.getElementById("legend-pending");
  const legendRejected = document.getElementById("legend-rejected");
  const totalRequests = document.getElementById("total-requests");
  
  if (legendAccepted) legendAccepted.textContent = accepted;
  if (legendPending) legendPending.textContent = pending;
  if (legendRejected) legendRejected.textContent = rejected;
  if (totalRequests) totalRequests.textContent = total;
  
  // Update progress bars
  updateProgressBars(accepted, pending, rejected, total);
}

function updateDonutChart(accepted, pending, rejected, total) {
  const circumference = 2 * Math.PI * 40; // 251.2
  
  const segmentAccepted = document.getElementById("segment-accepted");
  const segmentPending = document.getElementById("segment-pending");
  const segmentRejected = document.getElementById("segment-rejected");
  
  if (!segmentAccepted || !segmentPending || !segmentRejected) return;
  
  if (total === 0) {
    // No data - show empty ring
    segmentAccepted.style.strokeDasharray = `0 ${circumference}`;
    segmentPending.style.strokeDasharray = `0 ${circumference}`;
    segmentRejected.style.strokeDasharray = `0 ${circumference}`;
    return;
  }
  
  // Calculate percentages
  const acceptedPct = (accepted / total) * 100;
  const pendingPct = (pending / total) * 100;
  const rejectedPct = (rejected / total) * 100;
  
  // Calculate stroke-dasharray values
  const acceptedDash = (acceptedPct / 100) * circumference;
  const pendingDash = (pendingPct / 100) * circumference;
  const rejectedDash = (rejectedPct / 100) * circumference;
  
  // Calculate offsets (stroke-dashoffset)
  // Accepted starts at 0
  segmentAccepted.style.strokeDasharray = `${acceptedDash} ${circumference}`;
  segmentAccepted.style.strokeDashoffset = '0';
  
  // Pending starts after accepted
  segmentPending.style.strokeDasharray = `${pendingDash} ${circumference}`;
  segmentPending.style.strokeDashoffset = `-${acceptedDash}`;
  
  // Rejected starts after accepted + pending
  segmentRejected.style.strokeDasharray = `${rejectedDash} ${circumference}`;
  segmentRejected.style.strokeDashoffset = `-${acceptedDash + pendingDash}`;
}

function updateProgressBars(accepted, pending, rejected, total) {
  // Acceptance rate
  const acceptanceRate = total > 0 ? Math.round((accepted / total) * 100) : 0;
  const acceptanceRateEl = document.getElementById("acceptance-rate");
  const acceptanceBar = document.getElementById("acceptance-bar");
  
  if (acceptanceRateEl) acceptanceRateEl.textContent = `${acceptanceRate}%`;
  if (acceptanceBar) acceptanceBar.style.width = `${acceptanceRate}%`;
  
  // Active surpluses (get from stat-count)
  const surplusCount = parseInt(document.getElementById("stat-count")?.textContent || "0", 10);
  const activeSurpluses = document.getElementById("active-surpluses");
  const surplusesBar = document.getElementById("surpluses-bar");
  
  // Max 10 for visual purposes
  const surplusesPct = Math.min((surplusCount / 10) * 100, 100);
  if (activeSurpluses) activeSurpluses.textContent = surplusCount;
  if (surplusesBar) surplusesBar.style.width = `${surplusesPct}%`;
  
  // Interaction rate (accepted + rejected = total interactions)
  const interactions = accepted + rejected;
  const interactionRate = document.getElementById("interaction-rate");
  const interactionBar = document.getElementById("interaction-bar");
  
  // Calculate as percentage of total requests
  const interactionPct = total > 0 ? Math.round((interactions / total) * 100) : 0;
  if (interactionRate) interactionRate.textContent = `${interactions} تفاعل`;
  if (interactionBar) interactionBar.style.width = `${interactionPct}%`;
}

// Edit Surplus Modal
document.addEventListener("click", function (e) {
  const btn = e.target.closest(".btn-edit-surplus");
  if (!btn) return;

  const surplus = JSON.parse(btn.dataset.surplus);
  openEditSurplusModal(surplus);
});

function openEditSurplusModal(surplus) {
  const modal = document.createElement("div");
  modal.className = "modal-overlay";

  modal.innerHTML = `
    <div class="modal-content">
      <h3>تعديل الفائض</h3>
       <label for="edit-title">العنوان</label>
      <input id="edit-title" value="${escapeHtml(surplus.title)}" placeholder="العنوان" maxlength="20">
      <span id="edit-title-error" style="display:none;color:#ef4444;font-size:12px;margin-top:4px;">العنوان يجب أن يحتوي على حروف وأرقام فقط بدون رموز</span>
      <label for="edit-qty">الكمية</label>
      <input id="edit-qty" value="${escapeHtml(surplus.qty)}" placeholder="الكمية" maxlength="3">
      <span id="edit-qty-error" style="display:none;color:#ef4444;font-size:12px;margin-top:4px;">لا يمكنك إضافة أكثر من 100</span>
      <label for="edit-expiry">ساعات الصلاحية</label>

      
         <select id="edit-expiry">
            <option value="3">3 ساعات</option>
            <option value="6">6 ساعات</option>
            <option value="12">12 ساعة</option>    
         </select>

      
      <label for="edit-desc">الوصف</label>
      <textarea id="edit-desc" placeholder="الوصف" maxlength="255">${escapeHtml(surplus.description || "")}</textarea>
      <button class="btn primary" id="save-surplus">حفظ</button>
      <button class="btn" id="close-modal">إغلاق</button>
    </div>
  `;

 

  document.body.appendChild(modal);
 document.getElementById("edit-expiry").value = surplus.expiry_hours;

  // Add input validation for qty field - only allow numbers and no leading zeros
  const qtyInput = document.getElementById("edit-qty");
  qtyInput.oninput = function() {
    this.value = this.value.replace(/[^0-9]/g, '').replace(/^0+/, '');
    // Reset error state when user types
    this.style.borderColor = '';
    document.getElementById("edit-qty-error").style.display = 'none';
  };

  // Reset title error when user types
  const titleInput = document.getElementById("edit-title");
  titleInput.oninput = function() {
    this.style.borderColor = '';
    document.getElementById("edit-title-error").style.display = 'none';
  };

  document.getElementById("close-modal").onclick = () => modal.remove();
  document.getElementById("save-surplus").onclick = async () => {
    const saved = await saveSurplusChanges(surplus.id);
    if (saved) modal.remove();
  };
}

async function saveSurplusChanges(id) {
  const titleInput = document.getElementById("edit-title");
  const qtyInput = document.getElementById("edit-qty");
  const titleError = document.getElementById("edit-title-error");
  const qtyError = document.getElementById("edit-qty-error");
  
  const title = titleInput.value.trim();
  const qty = qtyInput.value.trim();
  const expiry = Number(document.getElementById("edit-expiry").value.trim());
  const desc = document.getElementById("edit-desc").value.trim();

  // Reset all error states
  titleInput.style.borderColor = '';
  qtyInput.style.borderColor = '';
  titleError.style.display = 'none';
  qtyError.style.display = 'none';

  // Regex for valid title: Arabic, English letters, numbers, and spaces only
  const validTitlePattern = /^[a-zA-Z0-9\u0600-\u06FF\s]+$/;

  // Validate required fields (title, qty, expiry) - description is optional
  if (!title) {
    showToast("أدخل عنوان الفائض", "warn");
    return false;
  }
  
  // Check if title contains special characters
  if (!validTitlePattern.test(title)) {
    titleInput.style.borderColor = '#ef4444';
    titleError.style.display = 'block';
    return false;
  }
  
  if (!qty) {
    showToast("أدخل الكمية", "warn");
    return false;
  }
  if (parseInt(qty) > 100) {
    qtyInput.style.borderColor = '#ef4444';
    qtyError.style.display = 'block';
    return false;
  }
  if (!expiry || expiry <= 0) {
    showToast("اختر مدة صلاحية صحيحة", "warn");
    return false;
  }

  try {
    const res = await fetch(`${API_BASE}/surpluses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify({
        title, qty,
        expiry_hours: expiry,
        expiry_text: `${expiry} ساعة`,
        description: desc || "",
        status: "active"
      })
    });

    if (!res.ok) throw new Error("Update failed");

    showToast("تم تعديل الفائض بنجاح", "success");
    await renderRestaurant();
    return true;
  } catch (err) {
    console.error(err);
    showToast("فشل تعديل الفائض", "danger");
    return false;
  }
}

// Add Surplus
async function setupAddSurplus() {
  const form = document.getElementById("add-surplus-form");
  if (!form || !currentUser) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const titleInput = document.getElementById("surplus-title");
    const qtyInput = document.getElementById("surplus-qty");
    const title = titleInput?.value.trim() || "";
    const qty = qtyInput?.value.trim() || "";
    const expiry = Number(document.getElementById("surplus-expiry")?.value || "0");
    const desc = document.getElementById("surplus-desc")?.value.trim() || "";

    // Function to show error below field
    function showFieldError(input, message) {
      if (!input) return;
      
      // Remove any existing error message for this field
      const nextSibling = input.nextElementSibling;
      if (nextSibling && nextSibling.classList.contains('field-error-msg')) {
        nextSibling.remove();
      }
      
      input.style.border = '2px solid #ef4444';
      
      const errorDiv = document.createElement('div');
      errorDiv.className = 'field-error-msg';
      errorDiv.style.cssText = 'color: #ef4444; font-size: 13px; margin-top: 6px; margin-bottom: 10px; text-align: right;';
      errorDiv.textContent = message;
      
      // Insert error message right after the input element
      input.insertAdjacentElement('afterend', errorDiv);
      
      input.addEventListener('input', function resetError() {
        input.style.border = '';
        const nextEl = input.nextElementSibling;
        if (nextEl && nextEl.classList.contains('field-error-msg')) {
          nextEl.remove();
        }
        input.removeEventListener('input', resetError);
      }, { once: true });
    }

    // Remove previous errors
    document.querySelectorAll('.field-error-msg').forEach(el => el.remove());
    document.querySelectorAll('.supt').forEach(el => el.style.border = '');

    // Validation rules
    const titleRegex = /^[\u0600-\u06FF\u0750-\u077Fa-zA-Z0-9\s]+$/;
    let hasError = false;

    // 1. Meal type - required, min 3 chars, Arabic/English letters and numbers only
    if (!title) {
      showFieldError(titleInput, 'نوع الوجبة لا يمكن أن يكون فارغاً');
      hasError = true;
    } else if (title.length < 3) {
      showFieldError(titleInput, 'نوع الوجبة يجب أن يكون 3 أحرف أو أكثر');
      hasError = true;
    } else if (!titleRegex.test(title)) {
      showFieldError(titleInput, 'نوع الوجبة يجب أن يحتوي على حروف عربية أو إنجليزية وأرقام فقط');
      hasError = true;
    }

    // 2. Quantity - required, must be a number, max 100
    const qtyNumber = parseInt(qty.replace(/[^\d]/g, ''), 10);
    if (!qty) {
      showFieldError(qtyInput, 'الكمية لا يمكن أن تكون فارغة');
      hasError = true;
    } else if (isNaN(qtyNumber) || qtyNumber <= 0) {
      showFieldError(qtyInput, 'الكمية يجب أن تكون رقماً صحيحاً أكبر من صفر');
      hasError = true;
    } else if (qtyNumber > 100) {
      showFieldError(qtyInput, 'الكمية لا يمكن أن تتجاوز 100 وجبة');
      hasError = true;
    }

    // 3. Expiry duration
    if (!expiry || expiry <= 0) {
      showToast("اختر مدة صلاحية صحيحة", "warn");
      hasError = true;
    }

    if (hasError) return;

    // 4. Check surplus limit (max 5 surpluses per 24 hours)
    try {
      const countRes = await fetch(`${API_BASE}/surpluses/count-today/${currentUser.id}`, {
        method: "GET",
        credentials: 'include'
      });
      
      if (countRes.ok) {
        const countData = await countRes.json();
        if (countData.count >= 5) {
          showToast("لقد وصلت للحد الأقصى (5 فوائض خلال 24 ساعة)", "danger");
          return;
        }
      }
    } catch (err) {
      console.log("Could not check surplus limit, proceeding...");
    }

    try {
      const res = await fetch(`${API_BASE}/surpluses`,{
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({
          restaurant_id: currentUser.id,
          restaurant_email: currentUser.email,
          title, qty,
          expiry_hours: expiry,
          expiry_text: `${expiry} ساعة`,
          description: desc || "",
          status: "active"
        })
      });

      if (!res.ok) throw new Error("Server error");

      // Show styled success notification div - clear form when closed
      showSuccessNotification("✅ تم نشر الفائض بنجاح!", "سيظهر الفائض الآن للجمعيات الخيرية القريبة منك", () => form.reset());
      await renderRestaurant();

    } catch (err) {
      console.error(err);
      showToast("خطأ أثناء الإرسال للسيرفر", "danger");
    }
  });


}

// Delete, Accept, Reject Handlers
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

  // Delete surplus
  const dbtn = e.target.closest(".btn-delete-surplus");
  if (dbtn) {
    const id = Number(dbtn.dataset.id);

    try {
      const res = await fetch(`${API_BASE}/surpluses/${id}`, {
        method: "DELETE",
        credentials: 'include'
      });

      if (!res.ok) throw new Error("Delete failed");

      showToast("تم حذف الفائض", "success");
      await renderRestaurant();
    } catch (err) {
      console.error(err);
      showToast("خطأ أثناء حذف الفائض", "danger");
    }
    return;
  }


  // Accept request
  const acceptReqBtn = e.target.closest(".btn-accept-req");
  if (acceptReqBtn) {
    const id = Number(acceptReqBtn.dataset.id);

    try {
      const res = await fetch(`${API_BASE}/requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ status: "accepted" })
      });

      if (!res.ok) throw new Error();

      showToast("تم قبول الطلب", "success");
      await renderRestaurant();
    } catch {
      showToast("خطأ أثناء قبول الطلب", "danger");
    }
    return;
  }

  // Reject request
  const rejectReqBtn = e.target.closest(".btn-reject-req");
  if (rejectReqBtn) {
    const id = Number(rejectReqBtn.dataset.id);

    try {
      const res = await fetch(`${API_BASE}/requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ status: "rejected" })
      });

      if (!res.ok) throw new Error();

      showToast("تم رفض الطلب", "default");
      await renderRestaurant();
    } catch {
      showToast("خطأ أثناء رفض الطلب", "danger");
    }
    return;
  }

  // Charity link
  const charlink = e.target.closest(".char-link");
  if (charlink) {
    const email = charlink.dataset.email;
    if (email) {
      window.location.href = `profile.html?email=${encodeURIComponent(email)}`;
    }
  }
});

// Edit Profile
const editBtnElement = document.getElementById("edit-profile-btn");
if (editBtnElement) {
  editBtnElement.addEventListener("click", openEditProfileModal);
}

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
        <input id="edit-name" style="width:100%" value="${escapeHtml(currentUser.name || "")}" maxlength="20">
      </div>
      <div class="field">
        <label>العنوان</label>
        <input id="edit-address" style="width:100%" value="${escapeHtml(currentUser.address || "")}" maxlength="20">
      </div>
      <div class="field">
        <label>اختر الموقع من الخريطة</label>
        <div id="edit-profile-map" style="height:250px;border-radius:8px;margin-bottom:10px;z-index:9999;"></div>
      </div>
      <div class="field" style="display:flex;gap:10px; display:none">
        <div style="flex:1">
          <label>Lat</label>
          <input id="lat" type="number" step="0.000001" value="${currentLat}" style="width:100%">
        </div>
        <div style="flex:1 display:none">
          <label>Lng</label>
          <input id="lng" type="number" step="0.000001" value="${currentLng}" style="width:100%">
        </div>
      </div>
      <div class="field">
        <label>الوصف</label>
        <textarea id="desc" style="width:100%"  row =5 maxlength="255" >${escapeHtml(currentUser.description || "")}</textarea>
      </div>
      <div style="margin-top:15px;text-align:left;">
        <button class="btn primary" id="save-profile">حفظ</button>
        <button class="btn" id="close-profile">إغلاق</button>
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
  document.getElementById("save-profile").onclick = async () => {
    const name = document.getElementById("edit-name").value.trim();
    const address = document.getElementById("edit-address").value.trim();
    const lat = parseFloat(document.getElementById("lat").value) || null;
    const lng = parseFloat(document.getElementById("lng").value) || null;
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

    try {
      const res = await fetch(`${API_BASE}/users/by-email/${encodeURIComponent(currentUser.email)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ name, address, lat, lng, desc })
      });

      if (!res.ok) throw new Error();

      showToast("تم تحديث الملف الشخصي بنجاح", "success");
      // modal.remove(); // تم تعطيله مؤقتاً لأخذ لقطة شاشة للتوثيق
      
      // Refresh user data
      currentUser = await checkAuth();
      if (currentUser) await renderRestaurant();

    } catch (err) {
      console.error(err);
      showToast("فشل تحديث الملف الشخصي", "danger");
    }
  };
}

// Check Expiries
async function checkExpiries() {
  try {
    await fetch(`${API_BASE}/surpluses/check-expiries`, {
      method: "POST",
      credentials: 'include'
    });
  } catch (err) {
    console.error("Error checking expiries:", err);
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
  // ⚠️ CRITICAL: Check authentication first
  currentUser = await checkAuth();

  if (!currentUser) {
    // checkAuth already redirects, but just in case
    return;
  }

  // Show/hide edit profile button based on role
  const editBtn = document.getElementById("edit-profile-btn");
  if (editBtn) {
    if (currentUser.role === "restaurant" || currentUser.role === "charity") {
      editBtn.style.display = "inline-block";
    } else {
      editBtn.style.display = "none";
    }
  }

  // Setup security management button
  const securityBtn = document.getElementById("edit-email-password-btn");
  if (securityBtn) {
    securityBtn.addEventListener("click", openSecurityModal);
  }

  await renderRestaurant();
  await setupAddSurplus();
  await checkExpiries();

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
  // CSS styles for password toggle buttons
  const toggleBtnStyle = `
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
  `;

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
          <input type="tel" id="new-phone-input" maxlength="10" class="input" style="width:100%" value="${escapeHtml(currentUser.phone || '')}" placeholder="رقم الهاتف">
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

// Check expiries every minute
setInterval(checkExpiries, 60000);








// Password toggle is now handled inside openSecurityModal function