// ============================================
// QRScanPro - Global Navigation & Utilities
// ============================================

document.addEventListener('DOMContentLoaded', function () {
  // --- Mobile Nav Toggle ---
  const toggle = document.getElementById('nav-toggle');
  const menu = document.getElementById('nav-menu');
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      menu.classList.toggle('open');
      const expanded = menu.classList.contains('open');
      toggle.setAttribute('aria-expanded', expanded);
    });
    document.addEventListener('click', function (e) {
      if (!toggle.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.remove('open');
      }
    });
  }

  // --- Active Nav Link ---
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-menu a').forEach(function (a) {
    const href = a.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });

  // --- FAQ Accordion ---
  document.querySelectorAll('.faq-question').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(function (i) { i.classList.remove('open'); });
      if (!isOpen) item.classList.add('open');
    });
  });
});

// --- Toast Notification ---
function showToast(message, type = 'default') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  const icons = { success: '✓', error: '✕', default: 'ℹ' };
  toast.innerHTML = '<span>' + (icons[type] || icons.default) + '</span> ' + message;
  container.appendChild(toast);
  setTimeout(function () { toast.remove(); }, 3000);
}

// --- Copy to Clipboard ---
function copyToClipboard(text, btn) {
  navigator.clipboard.writeText(text).then(function () {
    showToast('Copied to clipboard!', 'success');
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = '✓ Copied';
      setTimeout(function () { btn.textContent = orig; }, 2000);
    }
  }).catch(function () {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); showToast('Copied!', 'success'); } catch (e) { showToast('Copy failed', 'error'); }
    ta.remove();
  });
}

// --- Detect QR Type ---
function detectQRType(text) {
  if (!text) return { type: 'Unknown', icon: '❓', color: '#6b7280' };
  text = text.trim();
  if (/^https?:\/\//i.test(text)) return { type: 'URL', icon: '🔗', color: '#1a56db' };
  if (/^WIFI:/i.test(text)) return { type: 'WiFi', icon: '📶', color: '#0ea5e9' };
  if (/^BEGIN:VCARD/i.test(text)) return { type: 'vCard', icon: '👤', color: '#7c3aed' };
  if (/^smsto:/i.test(text) || /^sms:/i.test(text)) return { type: 'SMS', icon: '💬', color: '#10b981' };
  if (/^tel:/i.test(text)) return { type: 'Phone', icon: '📞', color: '#f59e0b' };
  if (/^mailto:/i.test(text)) return { type: 'Email', icon: '✉️', color: '#ef4444' };
  if (/^BEGIN:VEVENT/i.test(text)) return { type: 'Event', icon: '📅', color: '#8b5cf6' };
  if (/^geo:/i.test(text)) return { type: 'Location', icon: '📍', color: '#f97316' };
  return { type: 'Text', icon: '📄', color: '#6b7280' };
}

// --- Format QR Result ---
function formatQRResult(text) {
  const t = text.trim();
  if (/^https?:\/\//i.test(t)) {
    return '<a href="' + t + '" target="_blank" rel="noopener noreferrer">' + t + '</a>';
  }
  if (/^WIFI:(.+);$/i.test(t)) return t; // handled by wifi page
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
