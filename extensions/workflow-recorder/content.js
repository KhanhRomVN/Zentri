// Zentri Workflow Recorder - Content Script
// Handles element picking and selector generation

let isRecording = false;
let hoveredElement = null;
let overlay = null;
let actionPopup = null;

// Selector priority: id > data-testid > unique class > xpath
function generateSelector(element) {
  // 1. Try ID
  if (element.id) {
    return { type: 'id', value: `#${element.id}`, priority: 1 };
  }

  // 2. Try data-testid
  const testId = element.getAttribute('data-testid');
  if (testId) {
    return { type: 'data-testid', value: `[data-testid="${testId}"]`, priority: 2 };
  }

  // 3. Try unique class
  if (element.className && typeof element.className === 'string') {
    const classes = element.className.split(' ').filter((c) => c.trim());
    for (const cls of classes) {
      const selector = `.${cls}`;
      try {
        if (document.querySelectorAll(selector).length === 1) {
          return { type: 'class', value: selector, priority: 3 };
        }
      } catch (e) {
        // Invalid selector, skip
      }
    }
  }

  // 4. Generate XPath
  const xpath = getXPath(element);
  return { type: 'xpath', value: xpath, priority: 4 };
}

function getXPath(element) {
  if (element.id) return `//*[@id="${element.id}"]`;
  if (element === document.body) return '/html/body';

  let path = '';
  for (; element && element.nodeType === 1; element = element.parentNode) {
    let index = 0;
    for (let sibling = element.previousSibling; sibling; sibling = sibling.previousSibling) {
      if (sibling.nodeType === Node.DOCUMENT_TYPE_NODE) continue;
      if (sibling.nodeName === element.nodeName) ++index;
    }
    const tagName = element.nodeName.toLowerCase();
    const pathIndex = index ? `[${index + 1}]` : '';
    path = `/${tagName}${pathIndex}${path}`;
  }
  return path;
}

// Highlight element on hover
function highlightElement(element) {
  if (overlay) {
    const rect = element.getBoundingClientRect();
    overlay.style.top = `${rect.top + window.scrollY}px`;
    overlay.style.left = `${rect.left + window.scrollX}px`;
    overlay.style.width = `${rect.width}px`;
    overlay.style.height = `${rect.height}px`;
    overlay.style.display = 'block';
  }
}

// Start recording
function startRecording() {
  isRecording = true;
  console.log('[Zentri Recorder] Recording started');

  // Create overlay
  overlay = document.createElement('div');
  overlay.id = 'zentri-overlay';
  overlay.style.cssText = `
    position: absolute;
    border: 2px solid #3b82f6;
    background: rgba(59, 130, 246, 0.1);
    pointer-events: none;
    z-index: 999999;
    display: none;
  `;
  document.body.appendChild(overlay);

  // Add event listeners
  document.addEventListener('mousemove', handleMouseMove, true);
  document.addEventListener('click', handleClick, true);

  // Save to storage
  chrome.storage.local.set({ isRecording: true });
}

function stopRecording() {
  isRecording = false;
  console.log('[Zentri Recorder] Recording stopped');

  if (overlay) {
    overlay.remove();
    overlay = null;
  }

  if (actionPopup) {
    actionPopup.remove();
    actionPopup = null;
  }

  document.removeEventListener('mousemove', handleMouseMove, true);
  document.removeEventListener('click', handleClick, true);

  // Save to storage
  chrome.storage.local.set({ isRecording: false });
}

function handleMouseMove(e) {
  if (!isRecording) return;
  hoveredElement = e.target;
  highlightElement(hoveredElement);
}

function handleClick(e) {
  if (!isRecording) return;

  // Don't capture clicks on our own UI (backdrop or popup)
  if (e.target.closest('#zentri-modal-backdrop') || e.target.closest('#zentri-action-popup'))
    return;

  e.preventDefault();
  e.stopPropagation();

  const selector = generateSelector(e.target);

  // Show action popup
  showActionPopup(e.clientX, e.clientY, selector, e.target);
}

function showActionPopup(x, y, selector, element) {
  // Remove existing popup
  if (actionPopup) {
    actionPopup.remove();
  }

  // Generate all selector types
  const allSelectors = generateAllSelectors(element);

  // Get element raw content
  const elementContent = element.outerHTML;

  // Calculate max height based on viewport
  const maxModalHeight = Math.min(window.innerHeight * 0.85, 800);

  // Create modal backdrop
  const backdrop = document.createElement('div');
  backdrop.id = 'zentri-modal-backdrop';
  backdrop.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(4px);
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    animation: zentri-backdrop-in 0.2s ease-out;
  `;

  // Create modal container
  const popup = document.createElement('div');
  popup.id = 'zentri-action-popup';
  popup.style.cssText = `
    width: 100%;
    max-width: 560px;
    max-height: ${maxModalHeight}px;
    overflow-y: auto;
    background: linear-gradient(180deg, #171c25, #11151c);
    border: 1px solid #232a36;
    border-radius: 16px;
    box-shadow: 0 20px 60px -12px rgba(0,0,0,.9), 0 0 0 1px rgba(255,255,255,.02) inset, 0 0 40px -20px rgba(34,211,238,.3);
    font-family: 'Space Grotesk', system-ui, -apple-system, sans-serif;
    animation: zentri-modal-in 0.25s cubic-bezier(.2,.8,.2,1);
    position: relative;
  `;

  popup.innerHTML = `
    <style>
      @keyframes zentri-backdrop-in { from { opacity: 0; } to { opacity: 1; } }
      @keyframes zentri-modal-in { from { opacity: 0; transform: scale(.95) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      #zentri-action-popup * { box-sizing: border-box; }
      #zentri-action-popup::-webkit-scrollbar { width: 6px; }
      #zentri-action-popup::-webkit-scrollbar-track { background: transparent; }
      #zentri-action-popup::-webkit-scrollbar-thumb { background: #374151; border-radius: 3px; }
      #zentri-action-popup::-webkit-scrollbar-thumb:hover { background: #4b5563; }
      .zentri-action-card { transition: all 0.15s; }
      .zentri-action-card:hover { border-color: #9aa7b8; background: #1c222d; }
      .zentri-action-card.selected { border-color: #22d3ee; background: rgba(34,211,238,.14); box-shadow: 0 0 0 1px #22d3ee inset; }
      .zentri-action-card.selected .a-icon { background: #22d3ee; color: #0a0d12; }
      .zentri-switch { position: relative; width: 36px; height: 20px; background: #171c25; border: 1px solid #232a36; border-radius: 20px; cursor: pointer; transition: .15s; }
      .zentri-switch.on { background: rgba(34,211,238,.14); border-color: #22d3ee; }
      .zentri-switch::after { content: ''; position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 50%; background: #5b6675; transition: .15s; }
      .zentri-switch.on::after { background: #22d3ee; transform: translateX(16px); }
      .zentri-strategy-pill { transition: all 0.15s; }
      .zentri-strategy-pill:hover:not(.active) { color: #9aa7b8; border-color: #5b6675; }
      .zentri-strategy-pill.active { border-color: #22d3ee; color: #22d3ee; background: rgba(34,211,238,.14); }
      #zentri-element-content::-webkit-scrollbar { width: 4px; }
      #zentri-element-content::-webkit-scrollbar-track { background: transparent; }
      #zentri-element-content::-webkit-scrollbar-thumb { background: #374151; border-radius: 2px; }
    </style>
    
    <!-- Header -->
    <div style="display: flex; align-items: flex-start; gap: 12px; padding: 20px 20px 16px; border-bottom: 1px solid #1a2029;">
      <div style="width: 40px; height: 40px; border-radius: 9px; display: flex; align-items: center; justify-content: center; background: rgba(34,211,238,.14); border: 1px solid rgba(34,211,238,.3); color: #22d3ee; flex-shrink: 0;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="21" height="21"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/></svg>
      </div>
      <div style="flex: 1; min-width: 0;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <h1 style="font-size: 17px; font-weight: 600; letter-spacing: .1px; color: #e6edf3; margin: 0;">Element Selected</h1>
          <span style="font-family: 'JetBrains Mono', monospace; font-size: 12px; padding: 3px 9px; border-radius: 5px; background: rgba(167,139,250,.14); color: #a78bfa; border: 1px solid rgba(167,139,250,.3);">&lt;${element.tagName.toLowerCase()}&gt;</span>
        </div>
        <div style="margin-top: 4px; font-size: 14px; color: #5b6675;">Configure interaction step before adding to workflow</div>
      </div>
      <button class="zentri-close-btn" style="width: 30px; height: 30px; border-radius: 7px; border: 1px solid transparent; background: transparent; color: #5b6675; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>

    <!-- Element Content Preview -->
    <div style="padding: 14px 18px; border-bottom: 1px solid #1a2029;">
      <div style="font-size: 12px; text-transform: uppercase; letter-spacing: .09em; color: #5b6675; margin-bottom: 8px;">Element Content</div>
      <div id="zentri-element-content" style="max-height: 120px; overflow-y: auto; padding: 10px 12px; background: #0a0d12; border: 1px solid #1a2029; border-radius: 8px; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #9aa7b8; word-break: break-all; line-height: 1.6;">${elementContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    </div>

    <!-- Selector Strategy -->
    <div style="padding: 14px 18px; border-bottom: 1px solid #1a2029;">
      <div style="font-size: 12px; text-transform: uppercase; letter-spacing: .09em; color: #5b6675; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
        <span>Selector Strategy</span>
        <button class="zentri-copy-selector" style="display: flex; align-items: center; gap: 5px; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #5b6675; background: none; border: none; cursor: pointer; padding: 3px 6px; border-radius: 5px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/></svg>
          Copy Selector
        </button>
      </div>
      <div style="display: flex; flex-wrap: wrap; gap: 7px;">
        ${Object.keys(allSelectors)
          .map(
            (type) => `
          <span class="zentri-strategy-pill ${type === selector.type ? 'active' : ''}" data-selector-type="${type}" style="font-family: 'JetBrains Mono', monospace; font-size: 13px; padding: 7px 13px; border-radius: 20px; border: 1px solid #232a36; color: #5b6675; cursor: pointer; background: #11151c;">${type === 'xpath' ? 'XPath' : type === 'css' ? 'CSS Selector' : type === 'testid' ? 'data-testid' : type}</span>
        `,
          )
          .join('')}
      </div>
      <div style="margin-top: 10px; padding: 11px 13px; background: #0a0d12; border: 1px solid #1a2029; border-radius: 8px; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #9aa7b8; word-break: break-all; line-height: 1.6;">
        ${allSelectors[selector.type]?.value || selector.value}
      </div>
    </div>

    <!-- Actions -->
    <div style="padding: 18px 20px;">
      <div style="font-size: 13px; text-transform: uppercase; letter-spacing: .09em; color: #5b6675; margin-bottom: 11px;">Select Action</div>
      <div id="zentri-action-grid" style="display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-bottom: 18px;">
        <div class="zentri-action-card selected" data-action="click" style="display: flex; flex-direction: column; align-items: flex-start; gap: 8px; padding: 13px; border-radius: 10px; border: 1px solid #232a36; background: #11151c; cursor: pointer;">
          <div class="a-icon" style="width: 30px; height: 30px; border-radius: 7px; display: flex; align-items: center; justify-content: center; background: #171c25; color: #9aa7b8;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M9 9l6 12 2-6 6-2z"/></svg></div>
          <div style="font-size: 14px; font-weight: 500; color: #e6edf3;">Click</div>
          <div style="font-size: 12px; color: #5b6675; line-height: 1.3;">Click on element</div>
        </div>
        <div class="zentri-action-card" data-action="type" style="display: flex; flex-direction: column; align-items: flex-start; gap: 8px; padding: 13px; border-radius: 10px; border: 1px solid #232a36; background: #11151c; cursor: pointer;">
          <div class="a-icon" style="width: 30px; height: 30px; border-radius: 7px; display: flex; align-items: center; justify-content: center; background: #171c25; color: #9aa7b8;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M4 6h16M4 12h10M4 18h7"/></svg></div>
          <div style="font-size: 14px; font-weight: 500; color: #e6edf3;">Type Text</div>
          <div style="font-size: 12px; color: #5b6675; line-height: 1.3;">Enter text input</div>
        </div>
        <div class="zentri-action-card" data-action="assert" style="display: flex; flex-direction: column; align-items: flex-start; gap: 8px; padding: 13px; border-radius: 10px; border: 1px solid #232a36; background: #11151c; cursor: pointer;">
          <div class="a-icon" style="width: 30px; height: 30px; border-radius: 7px; display: flex; align-items: center; justify-content: center; background: #171c25; color: #9aa7b8;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M20 6L9 17l-5-5"/></svg></div>
          <div style="font-size: 14px; font-weight: 500; color: #e6edf3;">Assert Visible</div>
          <div style="font-size: 12px; color: #5b6675; line-height: 1.3;">Check visibility</div>
        </div>
        <div class="zentri-action-card" data-action="hover" style="display: flex; flex-direction: column; align-items: flex-start; gap: 8px; padding: 13px; border-radius: 10px; border: 1px solid #232a36; background: #11151c; cursor: pointer;">
          <div class="a-icon" style="width: 30px; height: 30px; border-radius: 7px; display: flex; align-items: center; justify-content: center; background: #171c25; color: #9aa7b8;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="3"/><path d="M12 5v2M12 17v2M5 12h2M17 12h2"/></svg></div>
          <div style="font-size: 14px; font-weight: 500; color: #e6edf3;">Hover</div>
          <div style="font-size: 12px; color: #5b6675; line-height: 1.3;">Mouse over element</div>
        </div>
        <div class="zentri-action-card" data-action="extract" style="display: flex; flex-direction: column; align-items: flex-start; gap: 8px; padding: 13px; border-radius: 10px; border: 1px solid #232a36; background: #11151c; cursor: pointer;">
          <div class="a-icon" style="width: 30px; height: 30px; border-radius: 7px; display: flex; align-items: center; justify-content: center; background: #171c25; color: #9aa7b8;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M4 4h16v6H4zM4 14h10v6H4z"/></svg></div>
          <div style="font-size: 14px; font-weight: 500; color: #e6edf3;">Extract Text</div>
          <div style="font-size: 12px; color: #5b6675; line-height: 1.3;">Extract content</div>
        </div>
        <div class="zentri-action-card" data-action="scroll" style="display: flex; flex-direction: column; align-items: flex-start; gap: 8px; padding: 13px; border-radius: 10px; border: 1px solid #232a36; background: #11151c; cursor: pointer;">
          <div class="a-icon" style="width: 30px; height: 30px; border-radius: 7px; display: flex; align-items: center; justify-content: center; background: #171c25; color: #9aa7b8;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M12 5v14M5 12l7 7 7-7"/></svg></div>
          <div style="font-size: 14px; font-weight: 500; color: #e6edf3;">Scroll To</div>
          <div style="font-size: 12px; color: #5b6675; line-height: 1.3;">Scroll to position</div>
        </div>
      </div>
      
      <!-- Config panel -->
      <div id="zentri-config-panel">
        <!-- Config content will be injected here based on selected action -->
      </div>
    </div>

    <!-- Node naming -->
    <div style="display: flex; align-items: center; gap: 10px; padding: 14px 20px; border-top: 1px solid #1a2029; background: #11151c;">
      <span style="width: 9px; height: 9px; border-radius: 50%; background: #22d3ee; box-shadow: 0 0 8px #22d3ee; flex-shrink: 0;"></span>
      <input id="zentri-node-name" type="text" value="${generateDefaultNodeName(element)}" placeholder="Node Name..." style="flex: 1; background: none; border: none; outline: none; font-weight: 600; font-size: 15px; color: #e6edf3;">
      <span style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #5b6675; background: #171c25; padding: 3px 7px; border-radius: 5px;">#${String(Date.now()).slice(-3)}</span>
    </div>

    <!-- Footer -->
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 20px 18px;">
      <button class="zentri-cancel-btn" style="font-size: 14px; font-weight: 600; border-radius: 9px; padding: 11px 20px; cursor: pointer; border: 1px solid #232a36; background: transparent; color: #9aa7b8; display: flex; align-items: center; gap: 6px;">Cancel</button>
      <button class="zentri-add-btn" style="font-size: 14px; font-weight: 600; border-radius: 9px; padding: 11px 20px; cursor: pointer; border: 1px solid transparent; background: linear-gradient(135deg, #22d3ee, #0ea5c9); color: #03222b; box-shadow: 0 4px 16px -4px rgba(34,211,238,.5); flex: 1; justify-content: center; display: flex; align-items: center; gap: 6px;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" width="15" height="15"><path d="M12 5v14M5 12h14"/></svg>
        Add to Workflow
      </button>
    </div>
  `;

  // Append modal to backdrop, then backdrop to body
  backdrop.appendChild(popup);
  document.body.appendChild(backdrop);
  actionPopup = backdrop;

  // Close modal when clicking backdrop
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) {
      backdrop.remove();
      actionPopup = null;
    }
  });

  // State management
  let currentAction = 'click';
  let currentSelectorType = selector.type;
  let currentSelector = allSelectors[currentSelectorType];
  let retryCount = 2;
  let delayMs = 500;

  // Update config panel based on action
  function updateConfigPanel() {
    const configPanel = popup.querySelector('#zentri-config-panel');

    if (currentAction === 'click') {
      configPanel.innerHTML = `
        <div style="font-size: 13px; text-transform: uppercase; letter-spacing: .09em; color: #5b6675; margin-bottom: 12px;">Configuration</div>
        <div style="margin-bottom: 14px;">
          <div style="font-size: 14px; color: #9aa7b8; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
            <span>Click Type</span>
            <span style="font-size: 13px; color: #5b6675; font-family: 'JetBrains Mono', monospace;">optional</span>
          </div>
          <select id="zentri-click-type" style="width: 100%; background: #11151c; border: 1px solid #232a36; border-radius: 8px; padding: 10px 12px; font-family: 'JetBrains Mono', monospace; font-size: 14px; color: #e6edf3; cursor: pointer;">
            <option>Left click</option>
            <option>Double click</option>
            <option>Right click</option>
          </select>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 2px; margin-bottom: 14px;">
          <div>
            <div style="font-size: 14px; color: #9aa7b8;">Wait for Element</div>
            <div style="font-size: 13px; color: #5b6675; margin-top: 3px;">Wait for element to appear before executing</div>
          </div>
          <div class="zentri-switch on" id="zentri-wait-element"></div>
        </div>
        <div>
          <div style="font-size: 14px; color: #9aa7b8; margin-bottom: 8px;">Timeout</div>
          <div style="display: flex; align-items: center; border: 1px solid #232a36; border-radius: 8px; overflow: hidden; width: fit-content;">
            <button id="zentri-timeout-minus" style="width: 32px; height: 36px; background: #11151c; border: none; color: #9aa7b8; cursor: pointer; font-size: 16px;">−</button>
            <div id="zentri-timeout-val" style="width: 90px; text-align: center; font-family: 'JetBrains Mono', monospace; font-size: 15px; background: #0a0d12; color: #e6edf3; padding: 0 4px; line-height: 36px;">3000<span style="color: #5b6675; font-size: 13px;">ms</span></div>
            <button id="zentri-timeout-plus" style="width: 32px; height: 36px; background: #11151c; border: none; color: #9aa7b8; cursor: pointer; font-size: 16px;">+</button>
          </div>
        </div>
        ${getCommonSections()}
      `;

      setupStepper('timeout', 3000, 100, 10000);
      const waitToggle = configPanel.querySelector('#zentri-wait-element');
      waitToggle?.addEventListener('click', () => waitToggle.classList.toggle('on'));
    } else if (currentAction === 'type') {
      configPanel.innerHTML = `
        <div style="font-size: 13px; text-transform: uppercase; letter-spacing: .09em; color: #5b6675; margin-bottom: 12px;">Configuration</div>
        <div style="margin-bottom: 14px;">
          <div style="font-size: 14px; color: #9aa7b8; margin-bottom: 8px;">Text to Enter</div>
          <input id="zentri-type-text" type="text" placeholder="Enter text..." style="width: 100%; background: #11151c; border: 1px solid #232a36; border-radius: 8px; padding: 10px 12px; font-family: 'JetBrains Mono', monospace; font-size: 14px; color: #e6edf3; outline: none;">
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 2px; margin-bottom: 14px;">
          <div>
            <div style="font-size: 14px; color: #9aa7b8;">Clear before typing</div>
            <div style="font-size: 13px; color: #5b6675; margin-top: 3px;">Clear field before entering text</div>
          </div>
          <div class="zentri-switch on" id="zentri-clear-before"></div>
        </div>
        <div>
          <div style="font-size: 14px; color: #9aa7b8; margin-bottom: 8px;">Typing delay</div>
          <div style="display: flex; align-items: center; border: 1px solid #232a36; border-radius: 8px; overflow: hidden; width: fit-content;">
            <button id="zentri-typing-delay-minus" style="width: 32px; height: 36px; background: #11151c; border: none; color: #9aa7b8; cursor: pointer; font-size: 16px;">−</button>
            <div id="zentri-typing-delay-val" style="width: 90px; text-align: center; font-family: 'JetBrains Mono', monospace; font-size: 15px; background: #0a0d12; color: #e6edf3; padding: 0 4px; line-height: 36px;">50<span style="color: #5b6675; font-size: 13px;">ms</span></div>
            <button id="zentri-typing-delay-plus" style="width: 32px; height: 36px; background: #11151c; border: none; color: #9aa7b8; cursor: pointer; font-size: 16px;">+</button>
          </div>
        </div>
        ${getCommonSections()}
      `;

      setupStepper('typing-delay', 50, 10, 500);
      const clearToggle = configPanel.querySelector('#zentri-clear-before');
      clearToggle?.addEventListener('click', () => clearToggle.classList.toggle('on'));
    } else if (currentAction === 'assert') {
      configPanel.innerHTML = `
        <div style="font-size: 13px; text-transform: uppercase; letter-spacing: .09em; color: #5b6675; margin-bottom: 12px;">Configuration</div>
        <div style="margin-bottom: 14px;">
          <div style="font-size: 14px; color: #9aa7b8; margin-bottom: 8px;">Assertion Type</div>
          <select id="zentri-assert-type" style="width: 100%; background: #11151c; border: 1px solid #232a36; border-radius: 8px; padding: 10px 12px; font-family: 'JetBrains Mono', monospace; font-size: 14px; color: #e6edf3; cursor: pointer;">
            <option>Is Visible</option>
            <option>Is Hidden</option>
            <option>Contains Text</option>
            <option>Has Attribute</option>
          </select>
        </div>
        <div>
          <div style="font-size: 14px; color: #9aa7b8; margin-bottom: 8px;">Timeout</div>
          <div style="display: flex; align-items: center; border: 1px solid #232a36; border-radius: 8px; overflow: hidden; width: fit-content;">
            <button id="zentri-assert-timeout-minus" style="width: 32px; height: 36px; background: #11151c; border: none; color: #9aa7b8; cursor: pointer; font-size: 16px;">−</button>
            <div id="zentri-assert-timeout-val" style="width: 90px; text-align: center; font-family: 'JetBrains Mono', monospace; font-size: 15px; background: #0a0d12; color: #e6edf3; padding: 0 4px; line-height: 36px;">5000<span style="color: #5b6675; font-size: 13px;">ms</span></div>
            <button id="zentri-assert-timeout-plus" style="width: 32px; height: 36px; background: #11151c; border: none; color: #9aa7b8; cursor: pointer; font-size: 16px;">+</button>
          </div>
        </div>
        ${getCommonSections()}
      `;

      setupStepper('assert-timeout', 5000, 100, 30000);
    } else {
      configPanel.innerHTML = `
        <div style="font-size: 13px; text-transform: uppercase; letter-spacing: .09em; color: #5b6675; margin-bottom: 12px;">Configuration</div>
        <div style="color: #5b6675; font-size: 14px; text-align: center; padding: 20px 0;">
          No special configuration for this action
        </div>
        ${getCommonSections()}
      `;
    }

    // Setup common steppers and toggles for all actions
    setupStepper('retry', 2, 1, 10);
    setupStepper('delay', 500, 100, 5000);

    // Setup all toggle switches
    configPanel.querySelectorAll('.zentri-switch').forEach((sw) => {
      sw.addEventListener('click', (e) => {
        e.stopPropagation();
        sw.classList.toggle('on');
      });
    });
  }

  // Helper function to setup stepper controls
  function setupStepper(id, initial, step, max) {
    let value = initial;
    const valEl = popup.querySelector(`#zentri-${id}-val`);
    const minusBtn = popup.querySelector(`#zentri-${id}-minus`);
    const plusBtn = popup.querySelector(`#zentri-${id}-plus`);

    if (!valEl || !minusBtn || !plusBtn) return;

    minusBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      value = Math.max(0, value - step);
      const unit = valEl.querySelector('span')?.outerHTML || '';
      valEl.innerHTML = value + unit;
    });

    plusBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      value = Math.min(max, value + step);
      const unit = valEl.querySelector('span')?.outerHTML || '';
      valEl.innerHTML = value + unit;
    });
  }

  // Common sections template (Conditions + Advanced)
  function getCommonSections() {
    return `
      <!-- Conditions Section -->
      <div style="margin-top: 18px; padding-top: 18px; border-top: 1px solid #1a2029;">
        <div style="font-size: 13px; text-transform: uppercase; letter-spacing: .09em; color: #5b6675; margin-bottom: 12px;">Conditions</div>
        <div style="margin-bottom: 14px;">
          <div style="font-size: 14px; color: #9aa7b8; margin-bottom: 8px;">Run When</div>
          <select id="zentri-condition" style="width: 100%; background: #11151c; border: 1px solid #232a36; border-radius: 8px; padding: 10px 12px; font-family: 'JetBrains Mono', monospace; font-size: 14px; color: #e6edf3; cursor: pointer;">
            <option value="always">Always</option>
            <option value="success">Previous Node Succeeded</option>
            <option value="fail">Previous Node Failed</option>
          </select>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 2px;">
          <div>
            <div style="font-size: 14px; color: #9aa7b8;">Skip if Element Not Found</div>
            <div style="font-size: 13px; color: #5b6675; margin-top: 3px;">Do not stop workflow when selector does not match</div>
          </div>
          <div class="zentri-switch" id="zentri-skip-not-found"></div>
        </div>
      </div>

      <!-- Advanced Section -->
      <div style="margin-top: 18px; padding-top: 18px; border-top: 1px solid #1a2029;">
        <div style="font-size: 13px; text-transform: uppercase; letter-spacing: .09em; color: #5b6675; margin-bottom: 12px;">Advanced</div>
        <div style="margin-bottom: 14px;">
          <div style="font-size: 14px; color: #9aa7b8; margin-bottom: 8px;">Retry Count</div>
          <div style="display: flex; align-items: center; border: 1px solid #232a36; border-radius: 8px; overflow: hidden; width: fit-content;">
            <button id="zentri-retry-minus" style="width: 32px; height: 36px; background: #11151c; border: none; color: #9aa7b8; cursor: pointer; font-size: 16px;">−</button>
            <div id="zentri-retry-val" style="width: 55px; text-align: center; font-family: 'JetBrains Mono', monospace; font-size: 15px; background: #0a0d12; color: #e6edf3; padding: 0 4px; line-height: 36px;">2</div>
            <button id="zentri-retry-plus" style="width: 32px; height: 36px; background: #11151c; border: none; color: #9aa7b8; cursor: pointer; font-size: 16px;">+</button>
          </div>
        </div>
        <div style="margin-bottom: 14px;">
          <div style="font-size: 14px; color: #9aa7b8; margin-bottom: 8px;">Delay Between Steps</div>
          <div style="display: flex; align-items: center; border: 1px solid #232a36; border-radius: 8px; overflow: hidden; width: fit-content;">
            <button id="zentri-delay-minus" style="width: 32px; height: 36px; background: #11151c; border: none; color: #9aa7b8; cursor: pointer; font-size: 16px;">−</button>
            <div id="zentri-delay-val" style="width: 90px; text-align: center; font-family: 'JetBrains Mono', monospace; font-size: 15px; background: #0a0d12; color: #e6edf3; padding: 0 4px; line-height: 36px;">500<span style="color: #5b6675; font-size: 13px;">ms</span></div>
            <button id="zentri-delay-plus" style="width: 32px; height: 36px; background: #11151c; border: none; color: #9aa7b8; cursor: pointer; font-size: 16px;">+</button>
          </div>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 2px;">
          <div>
            <div style="font-size: 14px; color: #9aa7b8;">Screenshot on Error</div>
            <div style="font-size: 13px; color: #5b6675; margin-top: 3px;">Save debug screenshot if node fails</div>
          </div>
          <div class="zentri-switch on" id="zentri-screenshot"></div>
        </div>
      </div>
    `;
  }

  // Initial config panel
  updateConfigPanel();

  // Handle action card selection
  popup.querySelectorAll('.zentri-action-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      popup.querySelectorAll('.zentri-action-card').forEach((c) => c.classList.remove('selected'));
      card.classList.add('selected');
      currentAction = card.dataset.action;
      updateConfigPanel();
    });
  });

  // Handle selector strategy switching
  popup.querySelectorAll('.zentri-strategy-pill').forEach((pill) => {
    pill.addEventListener('click', (e) => {
      e.stopPropagation();
      popup.querySelectorAll('.zentri-strategy-pill').forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      currentSelectorType = pill.dataset.selectorType;
      currentSelector = allSelectors[currentSelectorType];
      // Update selector display
      const selectorDisplay =
        popup.querySelectorAll('.zentri-strategy-pill')[0].parentElement.nextElementSibling;
      if (selectorDisplay) {
        selectorDisplay.textContent = currentSelector.value;
      }
    });
  });

  // Handle copy selector
  popup.querySelector('.zentri-copy-selector')?.addEventListener('click', (e) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(currentSelector.value);
  });

  // Handle close button
  popup.querySelector('.zentri-close-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    backdrop.remove();
    actionPopup = null;
  });

  // Handle cancel button
  popup.querySelector('.zentri-cancel-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    backdrop.remove();
    actionPopup = null;
  });

  // Handle add button
  popup.querySelector('.zentri-add-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();

    const nodeName = popup.querySelector('#zentri-node-name')?.value || '';

    // Collect all configuration data
    const config = {
      action: currentAction,
      selector: currentSelector,
      selectorType: currentSelectorType,
      nodeName,
      condition: popup.querySelector('#zentri-condition')?.value || 'always',
      skipNotFound:
        popup.querySelector('#zentri-skip-not-found')?.classList.contains('on') || false,
      retryCount: parseInt(popup.querySelector('#zentri-retry-val')?.textContent) || 2,
      delay: parseInt(popup.querySelector('#zentri-delay-val')?.textContent) || 500,
      screenshot: popup.querySelector('#zentri-screenshot')?.classList.contains('on') || true,
    };

    sendNodeToApp(currentAction, currentSelector, element, config);
    backdrop.remove();
    actionPopup = null;
  });

  // Handle keyboard shortcuts
  document.addEventListener('keydown', function handleKeyDown(e) {
    if (!actionPopup) {
      document.removeEventListener('keydown', handleKeyDown);
      return;
    }

    if (e.key === 'Escape') {
      backdrop.remove();
      actionPopup = null;
    } else if (e.key === 'Enter' && !e.target.matches('input, textarea, select')) {
      popup.querySelector('.zentri-add-btn')?.click();
    }
  });
}

// Helper function to generate all selector types
function generateAllSelectors(element) {
  const selectors = {};

  // ID
  if (element.id) {
    selectors.id = { type: 'id', value: `#${element.id}` };
  }

  // data-testid
  const testId = element.getAttribute('data-testid');
  if (testId) {
    selectors.testid = { type: 'testid', value: `[data-testid="${testId}"]` };
  }

  // CSS selector
  const cssSelector = generateCSSSelector(element);
  selectors.css = { type: 'css', value: cssSelector };

  // XPath
  selectors.xpath = { type: 'xpath', value: getXPath(element) };

  return selectors;
}

// Helper function to generate CSS selector
function generateCSSSelector(element) {
  if (element.id) return `#${element.id}`;

  const path = [];
  let current = element;

  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let selector = current.tagName.toLowerCase();

    if (current.id) {
      selector += `#${current.id}`;
      path.unshift(selector);
      break;
    }

    if (current.className && typeof current.className === 'string') {
      const classes = current.className.split(' ').filter((c) => c.trim());
      if (classes.length) {
        selector += `.${classes[0]}`;
      }
    }

    // Add nth-child if needed for uniqueness
    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (child) => child.tagName === current.tagName,
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-child(${index})`;
      }
    }

    path.unshift(selector);
    current = current.parentElement;

    if (path.length > 5) break; // Limit depth
  }

  return path.join(' > ');
}

// Helper function to generate DOM path breadcrumb
function generateDOMPath(element) {
  const path = [];
  let current = element;

  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let part = current.tagName.toLowerCase();

    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (child) => child.tagName === current.tagName,
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        part += `[${index}]`;
      }
    }

    path.unshift(part);
    current = current.parentElement;

    if (path.length > 8) break; // Limit depth
  }

  return path;
}

// Helper function to generate default node name
function generateDefaultNodeName(element) {
  const tag = element.tagName.toLowerCase();
  const text = element.textContent?.trim().substring(0, 30) || '';
  const placeholder = element.getAttribute('placeholder');

  if (text) return `${tag}: ${text}`;
  if (placeholder) return `${tag}: ${placeholder}`;
  if (element.id) return `${tag}#${element.id}`;

  return `${tag} element`;
}

function sendNodeToApp(action, selector, element, config = {}) {
  // Map action to node type
  const typeMap = {
    click: 'click_web',
    type: 'input_web',
    assert: 'element_check',
    hover: 'hover_web',
    extract: 'extract_web',
    scroll: 'scroll_web',
  };

  const titleMap = {
    click: 'Click',
    type: 'Type Text',
    assert: 'Assert Visible',
    hover: 'Hover',
    extract: 'Extract Text',
    scroll: 'Scroll To',
  };

  const nodeData = {
    type: typeMap[action] || 'click_web',
    category: 'interact',
    title: config.nodeName || titleMap[action] || 'Action',
    subtitle: selector.value,
    note: JSON.stringify(
      {
        url: window.location.href,
        element: element.tagName.toLowerCase(),
        selectorType: config.selectorType || selector.type,
        config: {
          action,
          condition: config.condition,
          skipNotFound: config.skipNotFound,
          retryCount: config.retryCount,
          delay: config.delay,
          screenshot: config.screenshot,
        },
      },
      null,
      2,
    ),
  };

  console.log('[Zentri Recorder] Sending node:', nodeData);

  // Send to background script
  chrome.runtime.sendMessage({ type: 'RECORD_NODE', data: nodeData });
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'START_RECORDING') {
    startRecording();
    sendResponse({ success: true });
  } else if (message.type === 'STOP_RECORDING') {
    stopRecording();
    sendResponse({ success: true });
  } else if (message.type === 'GET_STATUS') {
    sendResponse({ isRecording });
  }
  return true;
});

// Check if should start on page load
chrome.storage.local.get(['isRecording'], (result) => {
  if (result.isRecording) {
    startRecording();
  }
});

console.log('[Zentri Recorder] Content script loaded');
