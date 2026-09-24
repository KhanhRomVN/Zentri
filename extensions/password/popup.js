/**
 * Zentri Password Autofill — popup UI (read-only)
 * -----------------------------------------------
 * Reads credentials from `data.json`, which Zentri writes into this
 * extension folder before each browser launch. The popup is read-only:
 * add/edit/delete happens in Zentri's "Passwords" tab, which owns the
 * per-profile `passwords.db` file.
 */

/** Fetch the credentials Zentri wrote for this launch. */
async function loadPasswords() {
  try {
    const url = chrome.runtime.getURL('data.json');
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('[Zentri Password Autofill] Failed to load data.json', err);
    return [];
  }
}

/** Build one list item for a credential. */
function createItem(entry, onCopy) {
  const li = document.createElement('li');

  const info = document.createElement('div');
  info.className = 'info';

  const username = document.createElement('div');
  username.className = 'username';
  username.textContent = entry.username || '(no username)';

  const url = document.createElement('div');
  url.className = 'url';
  url.textContent = entry.url || '';

  info.appendChild(username);
  info.appendChild(url);

  const actions = document.createElement('div');
  actions.className = 'actions';

  const copyBtn = document.createElement('button');
  copyBtn.textContent = 'Copy';
  copyBtn.addEventListener('click', () => onCopy(entry, copyBtn));

  actions.appendChild(copyBtn);

  li.appendChild(info);
  li.appendChild(actions);
  return li;
}

/** Render the full list using DOM APIs. */
async function render() {
  const listEl = document.getElementById('list');
  listEl.replaceChildren();
  const passwords = await loadPasswords();

  if (passwords.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'No passwords saved in this profile yet.';
    listEl.appendChild(empty);
    return;
  }

  const handleCopy = (entry, btn) => {
    navigator.clipboard.writeText(entry.password || '').then(() => {
      btn.textContent = 'Copied';
      btn.classList.add('copied');
      window.setTimeout(() => {
        btn.textContent = 'Copy';
        btn.classList.remove('copied');
      }, 1200);
    });
  };

  for (const entry of passwords) {
    listEl.appendChild(createItem(entry, handleCopy));
  }
}

render();