export function showToast(message: string, type: 'ok' | 'err' = 'ok') {
  const stack = document.getElementById('toast-stack') || createToastStack();
  const el = document.createElement('div');
  el.style.cssText = `
    display: flex;
    align-items: center;
    gap: 9px;
    background: #1b1d22;
    border: 1px solid #26282f;
    border-left: 3px solid ${type === 'err' ? '#ff4757' : '#3ddc84'};
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 12.5px;
    color: #e8e9ed;
    min-width: 230px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  `;
  const icon = document.createElement('span');
  icon.innerHTML =
    type === 'err'
      ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff4757" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>'
      : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3ddc84" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>';
  const text = document.createElement('span');
  text.textContent = message;
  el.appendChild(icon);
  el.appendChild(text);
  stack.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity 0.3s';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

function createToastStack(): HTMLDivElement {
  const stack = document.createElement('div');
  stack.id = 'toast-stack';
  stack.style.cssText =
    'position:fixed;bottom:18px;right:18px;display:flex;flex-direction:column;gap:8px;z-index:100;';
  document.body.appendChild(stack);
  return stack;
}