/**
 * ------------------------------------------------------------------
 * Zentri Password Autofill — content script
 * ------------------------------------------------------------------
 * Automatically suggests and fills credentials stored in data.json
 * when user focuses on username/password input fields.
 * ------------------------------------------------------------------
 */

(function () {
  // Avoid double-injection (manifest matches all_frames + all urls).
  if (window.__zentriPasswordExtensionLoaded) return;
  window.__zentriPasswordExtensionLoaded = true;

  console.log('[Zentri Password Autofill] content script loaded on', location.hostname);

  let credentials = [];
  let dropdownEl = null;
  let currentInput = null;

  // Load credentials from data.json
  async function loadCredentials() {
    try {
      const dataUrl = chrome.runtime.getURL('data.json');
      const response = await fetch(dataUrl);
      credentials = await response.json();
      console.log('[Zentri Password Autofill] Loaded', credentials.length, 'credentials');
    } catch (err) {
      console.error('[Zentri Password Autofill] Failed to load data.json:', err);
    }
  }

  // Match credentials to current page
  function getMatchingCredentials() {
    const currentHost = location.hostname;
    return credentials.filter((cred) => {
      try {
        const credUrl = new URL(cred.url);
        return credUrl.hostname === currentHost || currentHost.includes(credUrl.hostname);
      } catch {
        return false;
      }
    });
  }

  // Create and show dropdown
  function showDropdown(inputEl) {
    hideDropdown();

    const matches = getMatchingCredentials();
    if (matches.length === 0) return;

    currentInput = inputEl;

    // Create dropdown
    dropdownEl = document.createElement('div');
    dropdownEl.id = 'zentri-password-dropdown';
    dropdownEl.style.cssText = `
      position: absolute;
      background: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      z-index: 999999;
      max-height: 200px;
      overflow-y: auto;
      min-width: 200px;
    `;

    // Position dropdown below input
    const rect = inputEl.getBoundingClientRect();
    dropdownEl.style.top = window.scrollY + rect.bottom + 2 + 'px';
    dropdownEl.style.left = window.scrollX + rect.left + 'px';

    // Add credential items
    matches.forEach((cred) => {
      const item = document.createElement('div');
      item.style.cssText = `
        padding: 8px 12px;
        cursor: pointer;
        border-bottom: 1px solid #eee;
      `;
      item.textContent = cred.username;

      item.addEventListener('mouseenter', () => {
        item.style.backgroundColor = '#f0f0f0';
      });

      item.addEventListener('mouseleave', () => {
        item.style.backgroundColor = 'white';
      });

      item.addEventListener('click', () => {
        fillCredential(cred);
        hideDropdown();
      });

      dropdownEl.appendChild(item);
    });

    document.body.appendChild(dropdownEl);
  }

  // Hide dropdown
  function hideDropdown() {
    if (dropdownEl) {
      dropdownEl.remove();
      dropdownEl = null;
      currentInput = null;
    }
  }

  // Fill credential into form
  function fillCredential(cred) {
    // Find username and password fields
    const usernameFields = document.querySelectorAll(
      'input[type="email"], input[type="text"], input[name*="user" i], input[name*="email" i], input[id*="user" i], input[id*="email" i]',
    );
    const passwordFields = document.querySelectorAll('input[type="password"]');

    // Fill username
    if (usernameFields.length > 0) {
      const usernameField = usernameFields[0];
      usernameField.value = cred.username;
      usernameField.dispatchEvent(new Event('input', { bubbles: true }));
      usernameField.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Fill password
    if (passwordFields.length > 0) {
      const passwordField = passwordFields[0];
      passwordField.value = cred.password;
      passwordField.dispatchEvent(new Event('input', { bubbles: true }));
      passwordField.dispatchEvent(new Event('change', { bubbles: true }));
    }

    console.log('[Zentri Password Autofill] Filled credentials for', cred.username);
  }

  // Check if element is username or password field
  function isCredentialField(el) {
    if (el.tagName !== 'INPUT') return false;

    const type = el.type.toLowerCase();
    const name = (el.name || '').toLowerCase();
    const id = (el.id || '').toLowerCase();

    // Password field
    if (type === 'password') return true;

    // Username/email field
    if (type === 'email' || type === 'text') {
      return (
        name.includes('user') ||
        name.includes('email') ||
        id.includes('user') ||
        id.includes('email') ||
        name.includes('login') ||
        id.includes('login')
      );
    }

    return false;
  }

  // Listen for focus on input fields
  document.addEventListener(
    'focus',
    (e) => {
      if (isCredentialField(e.target)) {
        showDropdown(e.target);
      }
    },
    true,
  );

  // Listen for click outside dropdown
  document.addEventListener(
    'click',
    (e) => {
      if (dropdownEl && !dropdownEl.contains(e.target) && e.target !== currentInput) {
        hideDropdown();
      }
    },
    true,
  );

  // Hide dropdown on scroll
  window.addEventListener('scroll', hideDropdown, true);

  // Load credentials on startup
  loadCredentials();
})();
