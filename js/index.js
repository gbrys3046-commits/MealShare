


const API_BASE = `https://mealshare.onrender.com`;

let isRedirecting = false;

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

function isEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Check if already logged in
async function checkExistingSession() {
  // Skip check if we are in the middle of redirecting or just arrived from a failed dashboard redirect
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('nocheck') === '1') {
    console.log("⚠️ Skipping session check (nocheck flag)");
    // Clean up the URL
    window.history.replaceState({}, document.title, window.location.pathname);
    return false;
  }

  try {
    const res = await fetch(`/api/auth/me`, {
      method: 'GET',
      credentials: 'include' // ⚠️ CRITICAL: Send cookies
    });

    if (res.ok) {
      const data = await res.json();
      if (data.authenticated && data.user) {
        // Already logged in - redirect to appropriate dashboard
        console.log("✅ Already logged in as:", data.user.email);
        isRedirecting = true;
        redirectToDashboard(data.user.role);
        return true;
      }
    }
  } catch (err) {
    console.log("❌ No existing session or server error");
  }
  return false;
}

function redirectToDashboard(role) {
  console.log("🚀 Redirecting to dashboard for role:", role);
  isRedirecting = true;

  if (role === "admin") {
    window.location.replace("dashboard-admin.html");
  } else if (role === "charity") {
    window.location.replace("requests-charity.html");
  } else {
    window.location.replace("dashboard-restaurant.html");
  }
}

// Navigation to Advantages - Beautiful Modal
const btnknowPlatform = document.getElementById('btn-advantages');
if (btnknowPlatform) {
  btnknowPlatform.addEventListener('click', () => {
    showPlatformInfoModal();
  });
}

// Platform Info Modal
function showPlatformInfoModal() {
  // Remove any existing modal
  const existing = document.querySelector('.platform-info-modal-overlay');
  if (existing) existing.remove();

  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'platform-info-modal-overlay';

  overlay.innerHTML = `
    <div class="platform-info-modal">
      <button class="platform-modal-close" title="إغلاق">×</button>
      
      <!-- Header with Logo -->
      <div class="platform-modal-header">
        <div class="platform-logo-wrapper">
          <img src="../assests/logo.png" alt="MealShare Logo" class="platform-logo-img">
        </div>
        <h2 class="platform-modal-title">MealShare</h2>
        <p class="platform-modal-subtitle">منصة ربط المؤسسات الغذائية بالجمعيات الخيرية</p>
      </div>
      
      <!-- Mission Section -->
      <div class="platform-section">
        <div class="section-icon mission-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
            <path d="M2 17l10 5 10-5"></path>
            <path d="M2 12l10 5 10-5"></path>
          </svg>
        </div>
        <h3>رسالتنا</h3>
        <p>تقليل هدر الطعام وضمان وصول الفائض الغذائي إلى المحتاجين من خلال ربط المطاعم والفنادق والمخابز بالجمعيات الخيرية بطريقة سهلة وفعّالة.</p>
      </div>
      
      <!-- How it Works -->
      <div class="platform-section">
        <div class="section-icon how-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <h3>كيف تعمل المنصة؟</h3>
        <div class="steps-container">
          <div class="step-item">
            <span class="step-number">١</span>
            <div class="step-content">
              <strong>نشر الفائض</strong>
              <p>تقوم المؤسسات الغذائية بنشر الفوائض المتاحة مع تفاصيل الكمية والموقع</p>
            </div>
          </div>
          <div class="step-item">
            <span class="step-number">٢</span>
            <div class="step-content">
              <strong>عرض الفوائض القريبة</strong>
              <p>الجمعيات القريبة تظهر لها الفوائض القريبة من موقعها</p>
            </div>
          </div>
          <div class="step-item">
            <span class="step-number">٣</span>
            <div class="step-content">
              <strong>طلب الاستلام</strong>
              <p>ترسل الجمعية طلب استلام ويتم التنسيق مع المؤسسة</p>
            </div>
          </div>

        </div>
      </div>
      
      <!-- Features Grid -->
      <div class="platform-section">
        <div class="section-icon features-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        </div>
        <h3>مميزات المنصة</h3>
        <div class="features-grid">
          <div class="feature-box">
            <div class="feature-icon">📍</div>
            <strong>إشعارات حسب الموقع</strong>
            <p>إشعار الجمعيات القريبة تلقائياً</p>
          </div>
          <div class="feature-box">
            <div class="feature-icon">📊</div>
            <strong>تقارير وإحصاءات</strong>
            <p>تتبع الكميات والتأثير</p>
          </div>
          <div class="feature-box">
            <div class="feature-icon">⭐</div>
            <strong>تقييم المؤسسات</strong>
            <p>تقييم المؤسسات الغذائية من قبل الجمعيات</p>
          </div>
          <div class="feature-box">
            <div class="feature-icon">🔔</div>
            <strong>إشعارات فورية</strong>
            <p>تنبيهات لحظية للطلبات</p>
          </div>
        </div>
      </div>
      
      <!-- Users Section -->
      <div class="platform-section">
        <div class="section-icon users-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </div>
        <h3>من يستخدم المنصة؟</h3>
        <div class="users-container">
          <div class="user-type">
            <div class="user-icon restaurant-icon">🍽️</div>
            <h4>المؤسسات الغذائية</h4>
            <p>المطاعم، الفنادق، المخابز، الكافيهات التي لديها فائض طعام</p>
          </div>
          <div class="user-type">
            <div class="user-icon charity-icon">🤝</div>
            <h4>الجمعيات الخيرية</h4>
            <p>المنظمات والجمعيات التي توزع الطعام على المحتاجين</p>
          </div>
        </div>
      </div>
      

    </div>
  `;

  // Add styles
  if (!document.getElementById('platform-modal-styles')) {
    const style = document.createElement('style');
    style.id = 'platform-modal-styles';
    style.textContent = `
      .platform-info-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(5px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
        padding: 20px;
        animation: platformOverlayFade 0.3s ease;
      }
      
      @keyframes platformOverlayFade {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      .platform-info-modal {
        background: linear-gradient(145deg, #ffffff 0%, #fff8f5 100%);
        border-radius: 24px;
        max-width: 700px;
        width: 100%;
        max-height: 85vh;
        overflow-y: auto;
        padding: 0;
        position: relative;
        box-shadow: 0 25px 80px rgba(255, 107, 53, 0.15), 0 10px 30px rgba(0, 0, 0, 0.1);
        animation: platformModalSlide 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      
      @keyframes platformModalSlide {
        from { 
          transform: translateY(30px) scale(0.95);
          opacity: 0;
        }
        to { 
          transform: translateY(0) scale(1);
          opacity: 1;
        }
      }
      
      .platform-modal-close {
        position: absolute;
        top: 15px;
        left: 15px;
        width: 40px;
        height: 40px;
        border: none;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 50%;
        font-size: 24px;
        color: #6b7280;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        z-index: 10;
      }
      
      .platform-modal-close:hover {
        background: #ef4444;
        color: white;
        transform: rotate(90deg);
      }
      
      .platform-modal-header {
        background: linear-gradient(135deg, #FF6B35 0%, #F7931E 50%, #FFD23F 100%);
        padding: 40px 30px;
        text-align: center;
        border-radius: 24px 24px 0 0;
        position: relative;
        overflow: hidden;
      }
      
      .platform-modal-header::before {
        content: '';
        position: absolute;
        top: -50%;
        right: -50%;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%);
        animation: shimmer 3s infinite;
      }
      
      @keyframes shimmer {
        0%, 100% { transform: translate(0, 0); }
        50% { transform: translate(-20%, 20%); }
      }
      
      .platform-logo-wrapper {
        width: 120px;
        height: 120px;
        background: white;
        border-radius: 24px;
        margin: 0 auto 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 15px 40px rgba(0, 0, 0, 0.25);
        position: relative;
        z-index: 1;
        padding: 0;
        overflow: hidden;
      }
      
      .platform-logo-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 24px;
      }
      
      .platform-modal-title {
        color: white;
        font-size: 2rem;
        margin: 0 0 8px 0;
        font-weight: 800;
        text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        position: relative;
        z-index: 1;
      }
      
      .platform-modal-subtitle {
        color: rgba(255, 255, 255, 0.95);
        font-size: 1rem;
        margin: 0;
        font-weight: 500;
        position: relative;
        z-index: 1;
      }
      
      .platform-section {
        padding: 25px 30px;
        border-bottom: 1px solid rgba(255, 107, 53, 0.1);
      }
      
      .platform-section:last-of-type {
        border-bottom: none;
      }
      
      .section-icon {
        width: 50px;
        height: 50px;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 15px;
      }
      
      .mission-icon { background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); color: white; }
      .how-icon { background: linear-gradient(135deg, #2EC4B6 0%, #45B69C 100%); color: white; }
      .features-icon { background: linear-gradient(135deg, #FFD23F 0%, #F7931E 100%); color: white; }
      .users-icon { background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); color: white; }
      
      .platform-section h3 {
        color: #2D3436;
        font-size: 1.3rem;
        margin: 0 0 12px 0;
        font-weight: 700;
      }
      
      .platform-section > p {
        color: #636E72;
        line-height: 1.8;
        margin: 0;
        font-size: 0.95rem;
      }
      
      .steps-container {
        display: flex;
        flex-direction: column;
        gap: 15px;
        margin-top: 15px;
      }
      
      .step-item {
        display: flex;
        align-items: flex-start;
        gap: 15px;
        padding: 15px;
        background: rgba(46, 196, 182, 0.08);
        border-radius: 12px;
        transition: all 0.3s ease;
      }
      
      .step-item:hover {
        background: rgba(46, 196, 182, 0.15);
        transform: translateX(-5px);
      }
      
      .step-number {
        width: 36px;
        height: 36px;
        background: linear-gradient(135deg, #2EC4B6 0%, #45B69C 100%);
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 1.1rem;
        flex-shrink: 0;
      }
      
      .step-content strong {
        display: block;
        color: #2D3436;
        margin-bottom: 4px;
        font-size: 1rem;
      }
      
      .step-content p {
        color: #636E72;
        margin: 0;
        font-size: 0.9rem;
        line-height: 1.5;
      }
      
      .features-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 15px;
        margin-top: 15px;
      }
      
      .feature-box {
        background: white;
        padding: 20px;
        border-radius: 16px;
        text-align: center;
        border: 1px solid rgba(255, 107, 53, 0.1);
        transition: all 0.3s ease;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
      }
      
      .feature-box:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 30px rgba(255, 107, 53, 0.15);
        border-color: rgba(255, 107, 53, 0.3);
      }
      
      .feature-box .feature-icon {
        font-size: 2rem;
        margin-bottom: 10px;
      }
      
      .feature-box strong {
        display: block;
        color: #2D3436;
        font-size: 0.95rem;
        margin-bottom: 5px;
      }
      
      .feature-box p {
        color: #95A5A6;
        font-size: 0.85rem;
        margin: 0;
        line-height: 1.4;
      }
      
      .users-container {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
        margin-top: 15px;
      }
      
      .user-type {
        background: white;
        padding: 25px 20px;
        border-radius: 16px;
        text-align: center;
        border: 2px solid transparent;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
      }
      
      .user-type:first-child {
        border-color: rgba(255, 107, 53, 0.2);
      }
      
      .user-type:last-child {
        border-color: rgba(46, 196, 182, 0.2);
      }
      
      .user-type:hover {
        transform: scale(1.03);
      }
      
      .user-icon {
        font-size: 2.5rem;
        margin-bottom: 12px;
      }
      
      .user-type h4 {
        color: #2D3436;
        font-size: 1.1rem;
        margin: 0 0 8px 0;
        font-weight: 700;
      }
      
      .user-type p {
        color: #636E72;
        font-size: 0.9rem;
        margin: 0;
        line-height: 1.5;
      }
      
      .platform-cta {
        background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%);
        padding: 30px;
        text-align: center;
        border-radius: 0 0 24px 24px;
      }
      
      .platform-cta p {
        color: white;
        font-size: 1.1rem;
        margin: 0 0 15px 0;
        font-weight: 600;
      }
      
      .cta-btn {
        background: white;
        color: #FF6B35;
        border: none;
        padding: 14px 40px;
        border-radius: 12px;
        font-size: 1rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
      }
      
      .cta-btn:hover {
        transform: translateY(-3px) scale(1.05);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      }
      
      /* Scrollbar styling */
      .platform-info-modal::-webkit-scrollbar {
        width: 8px;
      }
      
      .platform-info-modal::-webkit-scrollbar-track {
        background: transparent;
      }
      
      .platform-info-modal::-webkit-scrollbar-thumb {
        background: rgba(255, 107, 53, 0.3);
        border-radius: 4px;
      }
      
      .platform-info-modal::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 107, 53, 0.5);
      }
      
      /* Responsive */
      @media (max-width: 600px) {
        .platform-info-modal {
          max-height: 90vh;
          border-radius: 20px;
        }
        
        .platform-modal-header {
          padding: 30px 20px;
          border-radius: 20px 20px 0 0;
        }
        
        .platform-section {
          padding: 20px;
        }
        
        .features-grid,
        .users-container {
          grid-template-columns: 1fr;
        }
        
        .platform-modal-title {
          font-size: 1.6rem;
        }
        
        .platform-cta {
          border-radius: 0 0 20px 20px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(overlay);

  // Event handlers
  const closeBtn = overlay.querySelector('.platform-modal-close');
  closeBtn.addEventListener('click', () => overlay.remove());

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  // CTA button opens auth modal
  const ctaBtn = overlay.querySelector('#platform-cta-register');
  if (ctaBtn) {
    ctaBtn.addEventListener('click', () => {
      overlay.remove();
      // Trigger the auth modal
      const authBtn = document.getElementById('btn-open-auth-hero');
      if (authBtn) authBtn.click();
    });
  }

  // Close on Escape key
  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') {
      overlay.remove();
      document.removeEventListener('keydown', escHandler);
    }
  });
}

// Auth Setup
function setupAuth() {


  // General click handlers
  document.addEventListener("click", (e) => {
    // Forgot password link
    if (e.target.matches("[data-forgot]")) {
      e.preventDefault();
      const panel = document.getElementById("auth-panel");
      if (!panel) return;
      panel.querySelectorAll("#login, #register").forEach(el => el && el.classList.add("hidden"));
      const reset = panel.querySelector("#reset-password");
      reset && reset.classList.remove("hidden");
      panel.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      return;
    }

    // Back to login link
    if (e.target.matches("[data-back-login]")) {
      e.preventDefault();
      const panel = document.getElementById("auth-panel");
      if (!panel) return;
      const login = panel.querySelector("#login");
      const reset = panel.querySelector("#reset-password");
      if (reset) {
        reset.classList.add("hidden");
        const step1 = reset.querySelector("#reset-step-1");
        const step2 = reset.querySelector("#reset-step-2");
        step1 && step1.classList.remove("hidden");
        step2 && step2.classList.add("hidden");
      }
      login && login.classList.remove("hidden");
      const loginTab = panel.querySelector('.tab[data-tab="login"]');
      if (loginTab) {
        panel.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        loginTab.classList.add("active");
      }
      return;
    }

    // Account type chips
    const chip = e.target.closest(".chip");
    if (chip) {
      const container = chip.closest(".select-account") || chip.parentElement;
      if (!container) return;
      container.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      return;
    }

    // Tab switching
    const tab = e.target.closest("[data-tab]");
    if (tab && tab.classList && tab.classList.contains("tab")) {
      const tabName = tab.dataset.tab;
      const parent = tab.closest(".tabs");
      if (!parent) return;
      parent.querySelectorAll(".tab").forEach(t => {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });
      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");
      const ctx = tab.closest('[role="tablist"]')?.parentElement;
      const loginDiv = ctx?.querySelector("#login");
      const registerDiv = ctx?.querySelector("#register");
      const resetDiv = ctx?.querySelector("#reset-password");

      // Hide password reset section when switching between tabs
      if (resetDiv) {
        resetDiv.classList.add("hidden");
        // Reset the recovery steps
        const step1 = resetDiv.querySelector("#reset-step-1");
        const step2 = resetDiv.querySelector("#reset-step-2");
        if (step1) step1.classList.remove("hidden");
        if (step2) step2.classList.add("hidden");
      }

      // Show tabs if they were hidden
      const tabs = ctx?.querySelector(".tabs");
      if (tabs) tabs.classList.remove("hidden");

      loginDiv && loginDiv.classList.toggle("hidden", tabName !== "login");
      registerDiv && registerDiv.classList.toggle("hidden", tabName !== "register");
      return;
    }
  });

  // Register continue button
  const btnRegisterContinue = document.querySelector("#btn-register-continue");
  if (btnRegisterContinue) {
    btnRegisterContinue.addEventListener("click", (e) => {
      e.preventDefault();
      const form = btnRegisterContinue.closest("form");
      if (form) form.requestSubmit();
    });
  }

  // Form submissions
  document.addEventListener("submit", async (e) => {
    const form = e.target;

    //  LOGIN 
    if (form.matches && form.matches("#form-login")) {
      e.preventDefault();

      const emailInput = form.querySelector("#email");
      const passwordInput = form.querySelector("#pwd");
      const email = (emailInput?.value || "").trim();
      const password = passwordInput?.value || "";

      // Function to show error below field
      function showFieldError(input, message) {
        if (!input) return;
        const fieldContainer = input.closest('.field') || input.parentElement;
        const existingError = fieldContainer.querySelector('.field-error-msg');
        if (existingError) existingError.remove();

        input.style.border = '2px solid #ef4444';

        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error-msg';
        errorDiv.style.cssText = 'color: #ef4444; font-size: 13px; margin-top: 6px; text-align: right;';
        errorDiv.textContent = message;
        fieldContainer.appendChild(errorDiv);

        input.addEventListener('input', function resetError() {
          input.style.border = '';
          const errMsg = fieldContainer.querySelector('.field-error-msg');
          if (errMsg) errMsg.remove();
          input.removeEventListener('input', resetError);
        }, { once: true });
      }

      // Remove previous errors
      form.querySelectorAll('.field-error-msg').forEach(el => el.remove());
      form.querySelectorAll('input').forEach(el => el.style.border = '');

      // Validation rules
      const emailRegex = /^[a-zA-Z0-9._]+@[a-zA-Z0-9.]+\.[a-zA-Z]{2,}$/;
      const arabicCharsRegex = /[\u0600-\u06FF\u0750-\u077F]/;
      let hasError = false;

      // 1. Email - required, English letters and symbols only (no hyphens)
      if (!email) {
        showFieldError(emailInput, 'البريد الإلكتروني لا يمكن أن يكون فارغاً');
        hasError = true;
      } else if (email.includes('-')) {
        showFieldError(emailInput, 'البريد الإلكتروني لا يقبل إشارة (-)');
        hasError = true;
      } else if (!emailRegex.test(email)) {
        showFieldError(emailInput, 'البريد الإلكتروني يجب أن يحتوي على حروف إنجليزية ورموز (. _) فقط');
        hasError = true;
      }

      // 2. Password - required, no Arabic characters, no hyphens
      if (!password) {
        showFieldError(passwordInput, 'كلمة المرور لا يمكن أن تكون فارغة');
        hasError = true;
      } else if (password.includes('-')) {
        showFieldError(passwordInput, 'كلمة المرور لا تقبل إشارة (-)');
        hasError = true;
      } else if (arabicCharsRegex.test(password)) {
        showFieldError(passwordInput, 'كلمة المرور لا تقبل الحروف العربية');
        hasError = true;
      }

      if (hasError) return;

      // Disable form submission while processing
      const submitBtn = form.querySelector('button[type="submit"], .btn-block');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'جاري تسجيل الدخول...';
      }

      try {
        const res = await fetch(`/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: 'include', // ⚠️ CRITICAL: Accept cookies from server
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) {
          showToast(data?.error || "فشل تسجيل الدخول", "danger");
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'تسجيل الدخول';
          }
          return;
        }

        console.log("✅ Login successful:", data.user.email, "Role:", data.user.role);
        showToast("تم تسجيل الدخول بنجاح!", "success");

        // ⚠️ CRITICAL: Mark that we are redirecting to prevent any session check interference
        isRedirecting = true;

        // ⚠️ Use replace to prevent going back to login page
        setTimeout(() => {
          redirectToDashboard(data.user.role);
        }, 800);

      } catch (err) {
        console.error("Login request failed:", err);
        showToast("خطأ في الاتصال بالسيرفر", "danger");
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'تسجيل الدخول';
        }
      }
      return;
    }

    // REGISTER
    if (form.matches && form.matches("#form-register")) {
      e.preventDefault();

      const step1 = form.querySelector("#register-step-1");
      const step2 = form.querySelector("#register-step-2");

      // Check if we're in OTP verification step
      if (step2 && !step2.classList.contains("hidden")) {
        // OTP Verification Step
        const otp = (form.querySelector("#r-otp")?.value || "").trim();
        const email = window._pendingRegistration?.email;

        if (!otp) {
          showToast("أدخل رمز التحقق", "warn");
          return;
        }

        if (!email) {
          showToast("حدث خطأ، أعد المحاولة", "danger");
          return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'جاري التحقق...';
        }

        try {
          // Verify OTP
          const verifyRes = await fetch(`/otp/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: 'include',
            body: JSON.stringify({ email, otp, purpose: "signup" })
          });

          const verifyData = await verifyRes.json();

          if (!verifyRes.ok) {
            showToast(verifyData.message || "رمز التحقق غير صحيح", "danger");
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = 'تأكيد الرمز وإتمام التسجيل';
            }
            return;
          }

          // OTP verified - now register the user
          const regData = window._pendingRegistration;
          const regRes = await fetch(`/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: 'include',
            body: JSON.stringify(regData)
          });

          const regResult = await regRes.json();

          if (!regRes.ok) {
            showToast(regResult.error || "فشل إنشاء الحساب", "danger");
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = 'تأكيد الرمز وإتمام التسجيل';
            }
            return;
          }

          // Auto-login after registration
          const loginRes = await fetch(`/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: 'include',
            body: JSON.stringify({ email: regData.email, password: regData.password })
          });

          const userData = await loginRes.json();

          if (loginRes.ok) {
            // Show success notification - redirect when closed (user clicks OK or auto-close after 5 sec)
            showToast(" تم إنشاء حساب المؤسسة الغذائية بنجاح   ", "success", () => {
              window._pendingRegistration = null;
              redirectToDashboard(userData.user.role);
            });
          } else {
            showToast("تم إنشاء الحساب، الرجاء تسجيل الدخول", "success");
            window._pendingRegistration = null;
          }

        } catch (err) {
          console.error("Registration OTP error:", err);
          showToast("خطأ في الاتصال بالسيرفر", "danger");
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'تأكيد الرمز وإتمام التسجيل';
          }
        }
        return;
      }

      // Step 1 - Collect data and send OTP
      const nameInput = form.querySelector("#rname");
      const emailInput = form.querySelector("#remail");
      const phoneInput = form.querySelector("#rphone");
      const addressInput = form.querySelector("#raddress");
      const descInput = form.querySelector("#desc");
      const passInput = form.querySelector("#rpass");
      const pass2Input = form.querySelector("#rpass2");

      const name = (nameInput?.value || "").trim();
      const email = (emailInput?.value || "").trim();
      const phone = (phoneInput?.value || "").trim();
      const address = (addressInput?.value || "").trim();
      const lat = parseFloat(form.querySelector("#lat")?.value || "0");
      const lng = parseFloat(form.querySelector("#lng")?.value || "0");
      const desc = (descInput?.value || "").trim();
      const pass = passInput?.value || "";
      const pass2 = pass2Input?.value || "";

      let role = "restaurant";
      const active = form.querySelector(".chip.active");
      if (active && active.dataset && active.dataset.role) role = active.dataset.role;

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

      // 1. Name - required, Arabic or English letters only (with spaces)
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
      }

      // 3. Phone number - starts with 09, third digit (1,2,3,4) + 7 more digits = 10 digits
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

      // 4. Address - required
      if (!address) {
        showFieldError(addressInput, 'العنوان لا يمكن أن يكون فارغاً');
        hasError = true;
      }

      // 5. Password - required, min 6 chars, English letters and symbols only (no Arabic, no hyphens)
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

      // 6. Confirm password - must match
      if (!pass2) {
        showFieldError(pass2Input, 'تأكيد كلمة المرور مطلوب');
        hasError = true;
      } else if (pass !== pass2) {
        showFieldError(pass2Input, 'كلمتا المرور غير متطابقتين');
        hasError = true;
      }

      // If there are errors, stop here
      if (hasError) {
        return;
      }

      // Store pending registration data
      window._pendingRegistration = {
        name, email, password: pass, role,
        phone, address, description: desc, lat, lng
      };

      const continueBtn = form.querySelector("#btn-register-continue");
      if (continueBtn) {
        continueBtn.disabled = true;
        continueBtn.textContent = 'جاري إرسال رمز التحقق...';
      }

      try {
        // Check if email is already taken
        const checkEmailRes = await fetch(`/api/auth/check-email-available`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: 'include',
          body: JSON.stringify({ email })
        });

        const checkEmailData = await checkEmailRes.json();

        if (!checkEmailRes.ok || !checkEmailData.available) {
          showFieldError(emailInput, 'هذا البريد الإلكتروني مسجل بالفعل');
          if (continueBtn) {
            continueBtn.disabled = false;
            continueBtn.textContent = 'إنشاء حساب';
          }
          return;
        }

        // Check if phone number is already taken
        const checkPhoneRes = await fetch(`/api/auth/check-phone-available`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: 'include',
          body: JSON.stringify({ phone })
        });

        const checkPhoneData = await checkPhoneRes.json();

        if (!checkPhoneRes.ok || !checkPhoneData.available) {
          showFieldError(phoneInput, 'رقم الهاتف مستخدم بالفعل');
          if (continueBtn) {
            continueBtn.disabled = false;
            continueBtn.textContent = 'إنشاء حساب';
          }
          return;
        }

        // Send OTP
        const otpRes = await fetch(`/otp/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: 'include',
          body: JSON.stringify({ email, purpose: "signup" })
        });

        const otpData = await otpRes.json();

        if (!otpRes.ok) {
          showToast(otpData.message || "فشل إرسال رمز التحقق", "danger");
          if (continueBtn) {
            continueBtn.disabled = false;
            continueBtn.textContent = 'إنشاء حساب';
          }
          return;
        }

        showToast("تم إرسال رمز التحقق إلى بريدك الإلكتروني", "success");

        // Show OTP step
        if (step1) step1.classList.add("hidden");
        if (step2) step2.classList.remove("hidden");

        // Update note
        const note = form.querySelector(".register-otp-note");
        if (note) {
          note.innerHTML = `تم إرسال رمز التحقق إلى: <strong>${email}</strong><br>الرمز صالح لمدة 5 دقائق`;
        }

        if (continueBtn) {
          continueBtn.disabled = false;
          continueBtn.textContent = 'إنشاء حساب';
        }

      } catch (err) {
        console.error("Send OTP error:", err);
        showToast("خطأ في الاتصال بالسيرفر", "danger");
        if (continueBtn) {
          continueBtn.disabled = false;
          continueBtn.textContent = 'إنشاء حساب';
        }
      }
      return;
    }

    // RESET PASSWORD
    if (form.matches && form.matches("#form-reset")) {
      e.preventDefault();

      const step1 = form.querySelector("#reset-step-1");
      const step2 = form.querySelector("#reset-step-2");

      // Check if we're in OTP verification step (step 2)
      if (step2 && !step2.classList.contains("hidden")) {
        // Verify OTP and reset password
        const otp = (form.querySelector("#reset-token")?.value || "").trim();
        const newPass = (form.querySelector("#reset-newpass")?.value || "").trim();
        const email = window._resetEmail;

        if (!otp) {
          showToast("أدخل رمز التحقق", "warn");
          return;
        }

        if (!newPass || newPass.length < 6) {
          showToast("كلمة المرور يجب أن تكون 6 أحرف أو أكثر", "warn");
          return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'جاري التحقق...';
        }

        try {
          // Verify OTP first
          const verifyRes = await fetch(`/otp/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: 'include',
            body: JSON.stringify({ email, otp, purpose: "reset" })
          });

          const verifyData = await verifyRes.json();

          if (!verifyRes.ok) {
            showToast(verifyData.message || "رمز التحقق غير صحيح", "danger");
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = 'تغيير كلمة المرور';
            }
            return;
          }

          // OTP verified - now reset password
          const resetRes = await fetch(`/api/auth/reset-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: 'include',
            body: JSON.stringify({ email, newPassword: newPass })
          });

          const resetData = await resetRes.json();

          if (!resetRes.ok) {
            showToast(resetData.error || "فشل تغيير كلمة المرور", "danger");
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = 'تغيير كلمة المرور';
            }
            return;
          }

          showToast("تم تغيير كلمة المرور بنجاح!", "success");
          window._resetEmail = null;

          // Go back to login
          setTimeout(() => {
            const panel = document.getElementById("auth-panel");
            if (panel) {
              const reset = panel.querySelector("#reset-password");
              const login = panel.querySelector("#login");
              if (reset) reset.classList.add("hidden");
              if (login) login.classList.remove("hidden");
              if (step1) step1.classList.remove("hidden");
              if (step2) step2.classList.add("hidden");
              form.reset();
            }
            const tabs = document.querySelector('.tabs');
            if (tabs) tabs.classList.remove('hidden');
          }, 1500);

        } catch (err) {
          console.error("Reset password error:", err);
          showToast("خطأ في الاتصال بالسيرفر", "danger");
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'تغيير كلمة المرور';
          }
        }
        return;
      }

      // Default - should not reach here as step 1 uses a button click
      showToast("اضغط على زر استمرار", "info");
      return;
    }
  });

  // Reset Password - Continue Button
  const btnResetContinue = document.querySelector("#btn-reset-continue");
  if (btnResetContinue) {
    btnResetContinue.addEventListener("click", async (e) => {
      e.preventDefault();

      const email = (document.querySelector("#reset-email")?.value || "").trim();

      if (!email || !isEmail(email)) {
        showToast("أدخل بريدًا إلكترونيًا صحيحًا", "warn");
        return;
      }

      btnResetContinue.disabled = true;
      btnResetContinue.textContent = 'جاري التحقق...';

      try {
        // Check if email exists
        const checkRes = await fetch(`/api/auth/check-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: 'include',
          body: JSON.stringify({ email })
        });

        const checkData = await checkRes.json();

        if (!checkRes.ok) {
          showToast(checkData.error || "البريد الإلكتروني غير مسجل", "danger");
          btnResetContinue.disabled = false;
          btnResetContinue.textContent = 'استمرار';
          return;
        }

        // Email exists - send OTP
        const otpRes = await fetch(`/otp/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: 'include',
          body: JSON.stringify({ email, purpose: "reset" })
        });

        const otpData = await otpRes.json();

        if (!otpRes.ok) {
          showToast(otpData.message || "فشل إرسال رمز التحقق", "danger");
          btnResetContinue.disabled = false;
          btnResetContinue.textContent = 'استمرار';
          return;
        }

        showToast("تم إرسال رمز التحقق إلى بريدك الإلكتروني", "success");

        // Store email for later use
        window._resetEmail = email;

        // Show step 2
        const step1 = document.querySelector("#reset-step-1");
        const step2 = document.querySelector("#reset-step-2");
        if (step1) step1.classList.add("hidden");
        if (step2) step2.classList.remove("hidden");

        // Update note
        const note = document.querySelector(".reset-note");
        if (note) {
          note.innerHTML = `تم إرسال رمز التحقق إلى: <strong>${email}</strong><br>الرمز صالح لمدة 5 دقائق`;
        }

        btnResetContinue.disabled = false;
        btnResetContinue.textContent = 'استمرار';

      } catch (err) {
        console.error("Check email error:", err);
        showToast("خطأ في الاتصال بالسيرفر", "danger");
        btnResetContinue.disabled = false;
        btnResetContinue.textContent = 'استمرار';
      }
    });
  }

  // Register Back Button
  const btnRegisterBack = document.querySelector("#btn-register-back");
  if (btnRegisterBack) {
    btnRegisterBack.addEventListener("click", (e) => {
      e.preventDefault();
      const step1 = document.querySelector("#register-step-1");
      const step2 = document.querySelector("#register-step-2");
      if (step1) step1.classList.remove("hidden");
      if (step2) step2.classList.add("hidden");
    });
  }
}

// Map Initialization
function initRegistrationMap() {
  let instutMap, instutMarker;
  const tripoliCenter = [32.8872, 13.1913];

  const mapContainer = document.getElementById('instution-map');
  if (mapContainer && typeof L !== 'undefined') {
    instutMap = L.map('instution-map').setView(tripoliCenter, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(instutMap);

    instutMap.on('click', function (e) {
      const { lat, lng } = e.latlng;
      const latInput = document.getElementById('lat');
      const lngInput = document.getElementById('lng');
      if (latInput) latInput.value = lat.toFixed(6);
      if (lngInput) lngInput.value = lng.toFixed(6);

      if (instutMarker) {
        instutMarker.setLatLng(e.latlng);
      } else {
        instutMarker = L.marker(e.latlng).addTo(instutMap);
      }
    });

    const ro = new ResizeObserver(() => {
      if (instutMap) instutMap.invalidateSize(true);
    });
    if (mapContainer) ro.observe(mapContainer);
  }
}

// Password Toggle
function passToggle(passInput, pass2Input, pass3Input, pass4Input) {
  const map = [
    { btnId: "#toggle-pass", openId: "#eye-open", closedId: "#eye-closed", input: passInput },
    { btnId: "#toggle-pass2", openId: "#eye-open2", closedId: "#eye-closed2", input: pass2Input },
    { btnId: "#toggle-pass3", openId: "#eye-open3", closedId: "#eye-closed3", input: pass3Input },
    { btnId: "#toggle-pass4", openId: "#eye-open4", closedId: "#eye-closed4", input: pass4Input },
  ];

  map.forEach(({ btnId, openId, closedId, input }) => {
    const toggleBtn = document.querySelector(btnId);
    const eyeOpen = document.querySelector(openId);
    const eyeClosed = document.querySelector(closedId);
    if (toggleBtn && input) {
      toggleBtn.addEventListener("click", () => {
        const isShown = input.type === "text";
        input.type = isShown ? "password" : "text";
        toggleBtn.setAttribute("aria-pressed", String(!isShown));
        if (eyeOpen) eyeOpen.style.display = isShown ? "" : "none";
        if (eyeClosed) eyeClosed.style.display = isShown ? "none" : "";
        input.focus();
      });
    }
  });
}

// Forgot Password UI
const forget = document.querySelector('.small-link[data-forgot]');
if (forget) {
  forget.addEventListener('click', (e) => {
    e.preventDefault();
    const tabs = document.querySelector('.tabs');
    if (tabs) tabs.classList.add('hidden');
  });
}

const retur = document.querySelector('.small-link2');
if (retur) {
  retur.addEventListener('click', (e) => {
    e.preventDefault();
    const tabs = document.querySelector('.tabs');
    if (tabs) tabs.classList.remove('hidden');
  });
}

// DOMContentLoaded
document.addEventListener("DOMContentLoaded", async () => {
  // Check if already logged in (via cookie)
  const alreadyLoggedIn = await checkExistingSession();
  if (alreadyLoggedIn) return; // Will redirect

  setupAuth();
  initRegistrationMap();

  // Password toggle
  const passInput = document.querySelector("#rpass");
  const pass2Input = document.querySelector("#rpass2");
  const pass4Input = document.querySelector("#reset-newpass");
  const pass3Input = document.querySelector('#pwd');
  passToggle(passInput, pass2Input, pass3Input, pass4Input);
});
