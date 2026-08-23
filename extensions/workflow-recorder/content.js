// Zentri Workflow Recorder - Content Script (Clean & Modular)
// Handles element picking, selector generation, and action configuration

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

const RecorderState = {
  isRecording: false,
  hoveredElement: null,
  overlay: null,
  actionPopup: null,
};

// ============================================================================
// SELECTOR UTILITIES
// ============================================================================

const SelectorUtils = {
  /**
   * Generate selector based on priority: id > data-testid > unique class > xpath
   */
  generateSelector(element) {
    // 1. Try ID
    if (element.id) {
      return { type: 'id', value: `#${element.id}`, priority: 1 };
    }

    // 2. Try data-testid
    const testId = element.getAttribute('data-testid');
    if (testId) {
      return { type: 'testid', value: `[data-testid="${testId}"]`, priority: 2 };
    }

    // 3. Try unique class (use css as the type since we don't have a separate class key)
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.split(' ').filter((c) => c.trim());
      for (const cls of classes) {
        const selector = `.${cls}`;
        try {
          if (document.querySelectorAll(selector).length === 1) {
            return { type: 'css', value: selector, priority: 3 };
          }
        } catch (e) {
          // Invalid selector, skip
        }
      }
    }

    // 4. Generate XPath
    const xpath = this.getXPath(element);
    return { type: 'xpath', value: xpath, priority: 4 };
  },

  /**
   * Generate XPath for an element
   */
  getXPath(element) {
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
  },

  /**
   * Generate all possible selector types
   */
  generateAllSelectors(element) {
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
    selectors.css = { type: 'css', value: this.generateCSSSelector(element) };

    // XPath
    selectors.xpath = { type: 'xpath', value: this.getXPath(element) };

    return selectors;
  },

  /**
   * Generate CSS selector path
   */
  generateCSSSelector(element) {
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
  },
};

// ============================================================================
// RECORDING CONTROLS
// ============================================================================

const RecordingControls = {
  highlightElement(element) {
    if (RecorderState.overlay) {
      const rect = element.getBoundingClientRect();
      RecorderState.overlay.style.top = `${rect.top + window.scrollY}px`;
      RecorderState.overlay.style.left = `${rect.left + window.scrollX}px`;
      RecorderState.overlay.style.width = `${rect.width}px`;
      RecorderState.overlay.style.height = `${rect.height}px`;
      RecorderState.overlay.style.display = 'block';
    }
  },

  startRecording() {
    RecorderState.isRecording = true;
    console.log('[Zentri Recorder] Recording started');

    // Create overlay
    RecorderState.overlay = document.createElement('div');
    RecorderState.overlay.id = 'zentri-overlay';
    RecorderState.overlay.style.cssText = `
      position: absolute;
      border: 2px solid #3b82f6;
      background: rgba(59, 130, 246, 0.1);
      pointer-events: none;
      z-index: 999999;
      display: none;
    `;
    document.body.appendChild(RecorderState.overlay);

    // Add event listeners
    document.addEventListener('mousemove', EventHandlers.handleMouseMove, true);
    document.addEventListener('click', EventHandlers.handleClick, true);

    // Save to storage
    chrome.storage.local.set({ isRecording: true });
  },

  stopRecording() {
    RecorderState.isRecording = false;
    console.log('[Zentri Recorder] Recording stopped');

    if (RecorderState.overlay) {
      RecorderState.overlay.remove();
      RecorderState.overlay = null;
    }

    if (RecorderState.actionPopup) {
      RecorderState.actionPopup.remove();
      RecorderState.actionPopup = null;
    }

    document.removeEventListener('mousemove', EventHandlers.handleMouseMove, true);
    document.removeEventListener('click', EventHandlers.handleClick, true);

    // Save to storage
    chrome.storage.local.set({ isRecording: false });
  },
};

// ============================================================================
// EVENT HANDLERS
// ============================================================================

const EventHandlers = {
  handleMouseMove(e) {
    if (!RecorderState.isRecording) return;

    // Don't highlight when modal is open
    if (RecorderState.actionPopup) return;

    RecorderState.hoveredElement = e.target;
    RecordingControls.highlightElement(RecorderState.hoveredElement);
  },

  handleClick(e) {
    if (!RecorderState.isRecording) return;

    // Don't capture clicks on our own UI
    if (e.target.closest('#zentri-modal-backdrop') || e.target.closest('#zentri-action-popup'))
      return;

    e.preventDefault();
    e.stopPropagation();

    const selector = SelectorUtils.generateSelector(e.target);
    ModalManager.showActionPopup(e.clientX, e.clientY, selector, e.target);
  },
};

// ============================================================================
// MODAL MANAGER
// ============================================================================

const ModalManager = {
  showActionPopup(x, y, selector, element) {
    // Remove existing popup
    if (RecorderState.actionPopup) {
      RecorderState.actionPopup.remove();
    }

    // Hide overlay while modal is open to prevent visual glitches
    if (RecorderState.overlay) {
      RecorderState.overlay.style.display = 'none';
    }

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    const allSelectors = SelectorUtils.generateAllSelectors(element);
    const elementContent = element.outerHTML;
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

    popup.innerHTML = ModalTemplates.generateHTML(element, allSelectors, selector, elementContent);

    backdrop.appendChild(popup);
    document.body.appendChild(backdrop);
    RecorderState.actionPopup = backdrop;

    // Setup interactions
    ModalInteractions.setup(popup, backdrop, selector, allSelectors, element);
  },
};

// ============================================================================
// MODAL TEMPLATES
// ============================================================================

const ModalTemplates = {
  generateHTML(element, allSelectors, selector, elementContent) {
    return `
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
        .zentri-dropdown { position: relative; }
        .zentri-dropdown-trigger:hover { border-color: #22d3ee !important; }
        .zentri-dropdown-trigger.open svg { transform: rotate(180deg); }
        .zentri-dropdown-item:hover { background: #1a2029; }
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
        <div style="max-height: 120px; overflow-y: auto; padding: 10px 12px; background: #0a0d12; border: 1px solid #1a2029; border-radius: 8px; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #9aa7b8; word-break: break-all; line-height: 1.6;">${elementContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
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
            .map((type) => {
              const isActive = type === selector.type;
              const bgColor = isActive ? 'rgba(34,211,238,.14)' : '#11151c';
              const borderColor = isActive ? '#22d3ee' : '#232a36';
              const textColor = isActive ? '#22d3ee' : '#5b6675';
              const label =
                type === 'xpath'
                  ? 'XPath'
                  : type === 'css'
                    ? 'CSS Selector'
                    : type === 'testid'
                      ? 'data-testid'
                      : type;
              return `
            <span class="zentri-strategy-pill ${isActive ? 'active' : ''}" data-selector-type="${type}" style="font-family: 'JetBrains Mono', monospace; font-size: 13px; padding: 7px 13px; border-radius: 6px; border: 1px solid ${borderColor}; color: ${textColor}; cursor: pointer; background: ${bgColor};">${label}</span>
          `;
            })
            .join('')}
        </div>
        <div style="margin-top: 10px; padding: 11px 13px; background: #0a0d12; border: 1px solid #1a2029; border-radius: 8px; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #9aa7b8; word-break: break-all; line-height: 1.6;">
          ${allSelectors[selector.type]?.value || selector.value}
        </div>
      </div>

      <!-- Actions Grid -->
      <div style="padding: 18px 20px;">
        <div style="font-size: 13px; text-transform: uppercase; letter-spacing: .09em; color: #5b6675; margin-bottom: 11px;">Select Action</div>
        <div id="zentri-action-grid" style="display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-bottom: 18px;">
          ${this.generateActionCards()}
        </div>
        
        <!-- Config panel -->
        <div id="zentri-config-panel"></div>
      </div>

      <!-- Node naming -->
      <div style="display: flex; align-items: center; gap: 10px; padding: 14px 20px; border-top: 1px solid #1a2029; background: #11151c;">
        <span style="width: 9px; height: 9px; border-radius: 50%; background: #22d3ee; box-shadow: 0 0 8px #22d3ee; flex-shrink: 0;"></span>
        <input id="zentri-node-name" type="text" value="${this.generateDefaultNodeName(element)}" placeholder="Node Name..." style="flex: 1; background: none; border: none; outline: none; font-weight: 600; font-size: 15px; color: #e6edf3;">
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
  },

  generateActionCards() {
    const actions = [
      { action: 'click', label: 'Click', desc: 'Click on element', icon: 'M9 9l6 12 2-6 6-2z' },
      {
        action: 'type',
        label: 'Type Text',
        desc: 'Enter text input',
        icon: 'M4 6h16M4 12h10M4 18h7',
      },
      {
        action: 'assert',
        label: 'Assert Visible',
        desc: 'Check visibility',
        icon: 'M20 6L9 17l-5-5',
      },
      {
        action: 'hover',
        label: 'Hover',
        desc: 'Mouse over element',
        icon: 'M12 5v2M12 17v2M5 12h2M17 12h2',
      },
      {
        action: 'extract',
        label: 'Extract Text',
        desc: 'Extract content',
        icon: 'M4 4h16v6H4zM4 14h10v6H4z',
      },
      {
        action: 'scroll',
        label: 'Scroll To',
        desc: 'Scroll to position',
        icon: 'M12 5v14M5 12l7 7 7-7',
      },
    ];

    return actions
      .map(
        (a, i) => `
      <div class="zentri-action-card ${i === 0 ? 'selected' : ''}" data-action="${a.action}" style="display: flex; flex-direction: column; align-items: flex-start; gap: 8px; padding: 13px; border-radius: 10px; border: 1px solid #232a36; background: #11151c; cursor: pointer;">
        <div class="a-icon" style="width: 30px; height: 30px; border-radius: 7px; display: flex; align-items: center; justify-content: center; background: #171c25; color: #9aa7b8;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="${a.icon}"/>${a.action === 'hover' ? '<circle cx="12" cy="12" r="3"/>' : ''}</svg></div>
        <div style="font-size: 14px; font-weight: 500; color: #e6edf3;">${a.label}</div>
        <div style="font-size: 12px; color: #5b6675; line-height: 1.3;">${a.desc}</div>
      </div>
    `,
      )
      .join('');
  },

  generateDefaultNodeName(element) {
    const tag = element.tagName.toLowerCase();
    const text = element.textContent?.trim().substring(0, 30) || '';
    const placeholder = element.getAttribute('placeholder');

    if (text) return `${tag}: ${text}`;
    if (placeholder) return `${tag}: ${placeholder}`;
    if (element.id) return `${tag}#${element.id}`;

    return `${tag} element`;
  },
};

// ============================================================================
// MODAL INTERACTIONS
// ============================================================================

const ModalInteractions = {
  setup(popup, backdrop, selector, allSelectors, element) {
    let currentAction = 'click';
    let currentSelectorType = selector.type;
    let currentSelector = allSelectors[currentSelectorType];

    // Close on backdrop click
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        backdrop.remove();
        RecorderState.actionPopup = null;
        // Restore body scroll
        document.body.style.overflow = '';
        // Show overlay again when modal closes
        if (RecorderState.overlay && RecorderState.isRecording) {
          RecorderState.overlay.style.display = 'block';
        }
      }
    });

    // Config panel updater
    const updateConfigPanel = () => {
      const configPanel = popup.querySelector('#zentri-config-panel');
      configPanel.innerHTML = ConfigTemplates.getForAction(currentAction);

      // Setup steppers and toggles
      ConfigTemplates.setupInteractions(popup, currentAction);
    };

    // Initial config
    updateConfigPanel();

    // Action card selection
    popup.querySelectorAll('.zentri-action-card').forEach((card) => {
      card.addEventListener('click', (e) => {
        e.stopPropagation();
        popup
          .querySelectorAll('.zentri-action-card')
          .forEach((c) => c.classList.remove('selected'));
        card.classList.add('selected');
        currentAction = card.dataset.action;
        updateConfigPanel();
      });
    });

    // Selector strategy switching
    popup.querySelectorAll('.zentri-strategy-pill').forEach((pill) => {
      pill.addEventListener('click', (e) => {
        e.stopPropagation();

        // Remove active state from all pills
        popup.querySelectorAll('.zentri-strategy-pill').forEach((p) => {
          p.classList.remove('active');
          // Reset to inactive styles
          p.style.background = '#11151c';
          p.style.borderColor = '#232a36';
          p.style.color = '#5b6675';
        });

        // Add active state to clicked pill
        pill.classList.add('active');
        pill.style.background = 'rgba(34,211,238,.14)';
        pill.style.borderColor = '#22d3ee';
        pill.style.color = '#22d3ee';

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

    // Copy selector
    popup.querySelector('.zentri-copy-selector')?.addEventListener('click', (e) => {
      e.stopPropagation();
      navigator.clipboard?.writeText(currentSelector.value);
    });

    // Close button
    popup.querySelector('.zentri-close-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      backdrop.remove();
      RecorderState.actionPopup = null;
      // Restore body scroll
      document.body.style.overflow = '';
      // Show overlay again when modal closes
      if (RecorderState.overlay && RecorderState.isRecording) {
        RecorderState.overlay.style.display = 'block';
      }
    });

    // Cancel button
    popup.querySelector('.zentri-cancel-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      backdrop.remove();
      RecorderState.actionPopup = null;
      // Restore body scroll
      document.body.style.overflow = '';
      // Show overlay again when modal closes
      if (RecorderState.overlay && RecorderState.isRecording) {
        RecorderState.overlay.style.display = 'block';
      }
    });

    // Add button
    popup.querySelector('.zentri-add-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();

      const nodeName = popup.querySelector('#zentri-node-name')?.value || '';

      // Get dropdown values
      const getDropdownValue = (parent, dropdownClass) => {
        const dropdown = parent.querySelector(`.${dropdownClass}`);
        return dropdown?.getAttribute('data-value') || '';
      };

      const config = {
        action: currentAction,
        selector: currentSelector,
        selectorType: currentSelectorType,
        nodeName,
        condition: getDropdownValue(popup, 'zentri-dropdown') || 'always',
        skipNotFound:
          popup.querySelector('#zentri-skip-not-found')?.classList.contains('on') || false,
        retryCount: parseInt(popup.querySelector('#zentri-retry-val')?.textContent) || 2,
        delay: parseInt(popup.querySelector('#zentri-delay-val')?.textContent) || 500,
        screenshot: popup.querySelector('#zentri-screenshot')?.classList.contains('on') || true,
      };

      Utils.sendNodeToApp(currentAction, currentSelector, element, config);
      backdrop.remove();
      RecorderState.actionPopup = null;
      // Restore body scroll
      document.body.style.overflow = '';
      // Show overlay again when modal closes
      if (RecorderState.overlay && RecorderState.isRecording) {
        RecorderState.overlay.style.display = 'block';
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function handleKeyDown(e) {
      if (!backdrop.parentElement) {
        document.removeEventListener('keydown', handleKeyDown);
        return;
      }

      if (e.key === 'Escape') {
        backdrop.remove();
        RecorderState.actionPopup = null;
        // Restore body scroll
        document.body.style.overflow = '';
        // Show overlay again when modal closes
        if (RecorderState.overlay && RecorderState.isRecording) {
          RecorderState.overlay.style.display = 'block';
        }
      } else if (e.key === 'Enter' && !e.target.matches('input, textarea, select')) {
        popup.querySelector('.zentri-add-btn')?.click();
      }
    });
  },
};

// ============================================================================
// CONFIG TEMPLATES
// ============================================================================

const ConfigTemplates = {
  getForAction(action) {
    const templates = {
      click: this.getClickConfig,
      type: this.getTypeConfig,
      assert: this.getAssertConfig,
    };

    const template = templates[action] || this.getDefaultConfig;
    return template.call(this);
  },

  getClickConfig() {
    return `
      <div style="font-size: 13px; text-transform: uppercase; letter-spacing: .09em; color: #5b6675; margin-bottom: 12px;">Configuration</div>
      <div style="margin-bottom: 14px; position: relative;">
        <div style="font-size: 14px; color: #9aa7b8; margin-bottom: 8px;">Click Type</div>
        <div class="zentri-dropdown" data-value="Left click">
          <div class="zentri-dropdown-trigger" style="width: 100%; background: #0a0d12; border: 1px solid #232a36; border-radius: 8px; padding: 10px 12px; font-family: 'JetBrains Mono', monospace; font-size: 14px; color: #e6edf3; cursor: pointer; display: flex; align-items: center; justify-content: space-between; transition: border-color 0.15s;">
            <span class="zentri-dropdown-value">Left click</span>
            <svg style="width: 12px; height: 12px; transition: transform 0.15s;" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </div>
          <div class="zentri-dropdown-content" style="display: none; position: absolute; width: 100%; background: #11151c; border: 1px solid #232a36; border-radius: 8px; margin-top: 4px; box-shadow: 0 4px 16px rgba(0,0,0,0.3); z-index: 1000; overflow: hidden;">
            <div class="zentri-dropdown-item" data-value="Left click" style="padding: 10px 12px; font-family: 'JetBrains Mono', monospace; font-size: 14px; color: #e6edf3; cursor: pointer; transition: background 0.15s;">Left click</div>
            <div class="zentri-dropdown-item" data-value="Double click" style="padding: 10px 12px; font-family: 'JetBrains Mono', monospace; font-size: 14px; color: #e6edf3; cursor: pointer; transition: background 0.15s;">Double click</div>
            <div class="zentri-dropdown-item" data-value="Right click" style="padding: 10px 12px; font-family: 'JetBrains Mono', monospace; font-size: 14px; color: #e6edf3; cursor: pointer; transition: background 0.15s;">Right click</div>
          </div>
        </div>
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
      ${this.getCommonSections()}
    `;
  },

  getTypeConfig() {
    return `
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
      ${this.getCommonSections()}
    `;
  },

  getAssertConfig() {
    return `
      <div style="font-size: 13px; text-transform: uppercase; letter-spacing: .09em; color: #5b6675; margin-bottom: 12px;">Configuration</div>
      <div style="margin-bottom: 14px; position: relative;">
        <div style="font-size: 14px; color: #9aa7b8; margin-bottom: 8px;">Assertion Type</div>
        <div class="zentri-dropdown" data-value="Is Visible">
          <div class="zentri-dropdown-trigger" style="width: 100%; background: #0a0d12; border: 1px solid #232a36; border-radius: 8px; padding: 10px 12px; font-family: 'JetBrains Mono', monospace; font-size: 14px; color: #e6edf3; cursor: pointer; display: flex; align-items: center; justify-content: space-between; transition: border-color 0.15s;">
            <span class="zentri-dropdown-value">Is Visible</span>
            <svg style="width: 12px; height: 12px; transition: transform 0.15s;" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </div>
          <div class="zentri-dropdown-content" style="display: none; position: absolute; width: 100%; background: #11151c; border: 1px solid #232a36; border-radius: 8px; margin-top: 4px; box-shadow: 0 4px 16px rgba(0,0,0,0.3); z-index: 1000; overflow: hidden;">
            <div class="zentri-dropdown-item" data-value="Is Visible" style="padding: 10px 12px; font-family: 'JetBrains Mono', monospace; font-size: 14px; color: #e6edf3; cursor: pointer; transition: background 0.15s;">Is Visible</div>
            <div class="zentri-dropdown-item" data-value="Is Hidden" style="padding: 10px 12px; font-family: 'JetBrains Mono', monospace; font-size: 14px; color: #e6edf3; cursor: pointer; transition: background 0.15s;">Is Hidden</div>
            <div class="zentri-dropdown-item" data-value="Contains Text" style="padding: 10px 12px; font-family: 'JetBrains Mono', monospace; font-size: 14px; color: #e6edf3; cursor: pointer; transition: background 0.15s;">Contains Text</div>
            <div class="zentri-dropdown-item" data-value="Has Attribute" style="padding: 10px 12px; font-family: 'JetBrains Mono', monospace; font-size: 14px; color: #e6edf3; cursor: pointer; transition: background 0.15s;">Has Attribute</div>
          </div>
        </div>
      </div>
      <div>
        <div style="font-size: 14px; color: #9aa7b8; margin-bottom: 8px;">Timeout</div>
        <div style="display: flex; align-items: center; border: 1px solid #232a36; border-radius: 8px; overflow: hidden; width: fit-content;">
          <button id="zentri-assert-timeout-minus" style="width: 32px; height: 36px; background: #11151c; border: none; color: #9aa7b8; cursor: pointer; font-size: 16px;">−</button>
          <div id="zentri-assert-timeout-val" style="width: 90px; text-align: center; font-family: 'JetBrains Mono', monospace; font-size: 15px; background: #0a0d12; color: #e6edf3; padding: 0 4px; line-height: 36px;">5000<span style="color: #5b6675; font-size: 13px;">ms</span></div>
          <button id="zentri-assert-timeout-plus" style="width: 32px; height: 36px; background: #11151c; border: none; color: #9aa7b8; cursor: pointer; font-size: 16px;">+</button>
        </div>
      </div>
      ${this.getCommonSections()}
    `;
  },

  getDefaultConfig() {
    return `
      <div style="font-size: 13px; text-transform: uppercase; letter-spacing: .09em; color: #5b6675; margin-bottom: 12px;">Configuration</div>
      <div style="color: #5b6675; font-size: 14px; text-align: center; padding: 20px 0;">
        No special configuration for this action
      </div>
      ${this.getCommonSections()}
    `;
  },

  getCommonSections() {
    return `
      <div style="margin-top: 18px; padding-top: 18px; border-top: 1px solid #1a2029;">
        <div style="font-size: 13px; text-transform: uppercase; letter-spacing: .09em; color: #5b6675; margin-bottom: 12px;">Conditions</div>
        <div style="margin-bottom: 14px; position: relative;">
          <div style="font-size: 14px; color: #9aa7b8; margin-bottom: 8px;">Run When</div>
          <div class="zentri-dropdown" data-value="always">
            <div class="zentri-dropdown-trigger" style="width: 100%; background: #0a0d12; border: 1px solid #232a36; border-radius: 8px; padding: 10px 12px; font-family: 'JetBrains Mono', monospace; font-size: 14px; color: #e6edf3; cursor: pointer; display: flex; align-items: center; justify-content: space-between; transition: border-color 0.15s;">
              <span class="zentri-dropdown-value">Always</span>
              <svg style="width: 12px; height: 12px; transition: transform 0.15s;" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            </div>
            <div class="zentri-dropdown-content" style="display: none; position: absolute; width: 100%; background: #11151c; border: 1px solid #232a36; border-radius: 8px; margin-top: 4px; box-shadow: 0 4px 16px rgba(0,0,0,0.3); z-index: 1000; overflow: hidden;">
              <div class="zentri-dropdown-item" data-value="always" style="padding: 10px 12px; font-family: 'JetBrains Mono', monospace; font-size: 14px; color: #e6edf3; cursor: pointer; transition: background 0.15s;">Always</div>
              <div class="zentri-dropdown-item" data-value="success" style="padding: 10px 12px; font-family: 'JetBrains Mono', monospace; font-size: 14px; color: #e6edf3; cursor: pointer; transition: background 0.15s;">Previous Node Succeeded</div>
              <div class="zentri-dropdown-item" data-value="fail" style="padding: 10px 12px; font-family: 'JetBrains Mono', monospace; font-size: 14px; color: #e6edf3; cursor: pointer; transition: background 0.15s;">Previous Node Failed</div>
            </div>
          </div>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 2px;">
          <div>
            <div style="font-size: 14px; color: #9aa7b8;">Skip if Element Not Found</div>
            <div style="font-size: 13px; color: #5b6675; margin-top: 3px;">Do not stop workflow when selector does not match</div>
          </div>
          <div class="zentri-switch" id="zentri-skip-not-found"></div>
        </div>
      </div>
      <div style="margin-top: 18px; padding-top: 18px; border-top: 1px solid #1a2029;">
        <div style="font-size: 13px; text-transform: uppercase; letter-spacing: .09em; color: #5b6675; margin-bottom: 12px;">Advanced</div>
        <div style="display: flex; gap: 12px; margin-bottom: 14px;">
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 14px; color: #9aa7b8; margin-bottom: 8px;">Retry Count</div>
            <div style="display: flex; align-items: center; border: 1px solid #232a36; border-radius: 8px; overflow: hidden; width: 100%;">
              <button id="zentri-retry-minus" style="width: 40px; height: 36px; background: #11151c; border: none; color: #9aa7b8; cursor: pointer; font-size: 16px; flex-shrink: 0;">−</button>
              <div id="zentri-retry-val" style="flex: 1; text-align: center; font-family: 'JetBrains Mono', monospace; font-size: 15px; background: #0a0d12; color: #e6edf3; padding: 0 8px; line-height: 36px;">2</div>
              <button id="zentri-retry-plus" style="width: 40px; height: 36px; background: #11151c; border: none; color: #9aa7b8; cursor: pointer; font-size: 16px; flex-shrink: 0;">+</button>
            </div>
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 14px; color: #9aa7b8; margin-bottom: 8px;">Delay Between Steps</div>
            <div style="display: flex; align-items: center; border: 1px solid #232a36; border-radius: 8px; overflow: hidden; width: 100%;">
              <button id="zentri-delay-minus" style="width: 40px; height: 36px; background: #11151c; border: none; color: #9aa7b8; cursor: pointer; font-size: 16px; flex-shrink: 0;">−</button>
              <div id="zentri-delay-val" style="flex: 1; text-align: center; font-family: 'JetBrains Mono', monospace; font-size: 15px; background: #0a0d12; color: #e6edf3; padding: 0 8px; line-height: 36px;">500<span style="color: #5b6675; font-size: 13px;">ms</span></div>
              <button id="zentri-delay-plus" style="width: 40px; height: 36px; background: #11151c; border: none; color: #9aa7b8; cursor: pointer; font-size: 16px; flex-shrink: 0;">+</button>
            </div>
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
  },

  setupInteractions(popup, action) {
    // Setup steppers
    const steppers = {
      click: [{ id: 'timeout', initial: 3000, step: 100, max: 10000 }],
      type: [{ id: 'typing-delay', initial: 50, step: 10, max: 500 }],
      assert: [{ id: 'assert-timeout', initial: 5000, step: 100, max: 30000 }],
    };

    const commonSteppers = [
      { id: 'retry', initial: 2, step: 1, max: 10 },
      { id: 'delay', initial: 500, step: 100, max: 5000 },
    ];

    const actionSteppers = steppers[action] || [];
    [...actionSteppers, ...commonSteppers].forEach((s) => {
      this.setupStepper(popup, s.id, s.initial, s.step, s.max);
    });

    // Setup toggles
    popup.querySelectorAll('.zentri-switch').forEach((sw) => {
      sw.addEventListener('click', (e) => {
        e.stopPropagation();
        sw.classList.toggle('on');
      });
    });

    // Setup custom dropdowns
    this.setupDropdowns(popup);
  },

  setupStepper(popup, id, initial, step, max) {
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
  },

  setupDropdowns(popup) {
    const dropdowns = popup.querySelectorAll('.zentri-dropdown');

    dropdowns.forEach((dropdown) => {
      const trigger = dropdown.querySelector('.zentri-dropdown-trigger');
      const content = dropdown.querySelector('.zentri-dropdown-content');
      const valueEl = dropdown.querySelector('.zentri-dropdown-value');
      const items = dropdown.querySelectorAll('.zentri-dropdown-item');

      if (!trigger || !content || !valueEl) return;

      // Toggle dropdown
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();

        // Close all other dropdowns
        popup.querySelectorAll('.zentri-dropdown-content').forEach((c) => {
          if (c !== content) {
            c.style.display = 'none';
            c.previousElementSibling?.classList.remove('open');
          }
        });

        // Toggle this dropdown
        const isOpen = content.style.display === 'block';
        content.style.display = isOpen ? 'none' : 'block';
        trigger.classList.toggle('open', !isOpen);
      });

      // Select item
      items.forEach((item) => {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          const value = item.getAttribute('data-value');
          const text = item.textContent;

          // Update value
          valueEl.textContent = text;
          dropdown.setAttribute('data-value', value);

          // Close dropdown
          content.style.display = 'none';
          trigger.classList.remove('open');
        });
      });
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', function closeDropdowns(e) {
      if (!popup.contains(e.target)) {
        popup.querySelectorAll('.zentri-dropdown-content').forEach((c) => {
          c.style.display = 'none';
          c.previousElementSibling?.classList.remove('open');
        });
      }
    });
  },
};

// ============================================================================
// UTILITIES
// ============================================================================

const Utils = {
  /**
   * Capture screenshot and get element bounds
   */
  async captureScreenshot(element) {
    try {
      // Get element position and dimensions
      const rect = element.getBoundingClientRect();
      const elementBounds = {
        x: rect.left + window.scrollX,
        y: rect.top + window.scrollY,
        width: rect.width,
        height: rect.height,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
      };

      // Request screenshot from background script
      const response = await chrome.runtime.sendMessage({
        type: 'CAPTURE_SCREENSHOT',
      });

      return {
        screenshot: response.screenshot,
        elementBounds,
      };
    } catch (error) {
      console.error('[Zentri Recorder] Screenshot capture failed:', error);
      return null;
    }
  },

  async sendNodeToApp(action, selector, element, config = {}) {
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

    // Capture screenshot with element bounds
    const screenshotData = await this.captureScreenshot(element);

    const nodeData = {
      type: typeMap[action] || 'click_web',
      category: 'interact',
      title: titleMap[action] || 'Action',
      subtitle: selector.value,
      note: JSON.stringify(
        {
          url: window.location.href,
          element: element.tagName.toLowerCase(),
          selectorType: config.selectorType || selector.type,
          screenshot: screenshotData?.screenshot,
          elementBounds: screenshotData?.elementBounds,
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
    chrome.runtime.sendMessage({ type: 'RECORD_NODE', data: nodeData });
  },
};

// ============================================================================
// WORKFLOW EXECUTOR (PLAYBACK)
// ============================================================================

const WorkflowExecutor = {
  /**
   * Execute a workflow node/action
   */
  async executeNode(node) {
    console.log('[Zentri Executor] Executing node:', node);

    try {
      // Parse config from note
      let config = {};
      if (node.note) {
        try {
          const parsed = JSON.parse(node.note);
          config = parsed.config || {};
        } catch (e) {
          console.warn('[Zentri Executor] Failed to parse node config:', e);
        }
      }

      // Extract selector from subtitle (format: selector value from modal)
      const selector = node.subtitle || '';
      const selectorType = config.selectorType || 'css';

      // Wait for element if needed
      const element = await this.waitForElement(selector, selectorType, config.timeout || 5000);

      if (!element) {
        if (config.skipNotFound) {
          console.log('[Zentri Executor] Element not found, skipping as configured');
          return { success: true, skipped: true };
        }
        throw new Error(`Element not found: ${selector}`);
      }

      // Execute action based on node type
      let result;
      switch (node.type) {
        case 'click_web':
          result = await this.executeClick(element, config);
          break;
        case 'input_web':
          result = await this.executeInput(element, config);
          break;
        case 'element_check':
          result = await this.executeAssert(element, config);
          break;
        case 'hover_web':
          result = await this.executeHover(element, config);
          break;
        case 'extract_web':
          result = await this.executeExtract(element, config);
          break;
        case 'scroll_web':
          result = await this.executeScroll(element, config);
          break;
        case 'go_to_url':
          result = await this.executeGoToUrl(config);
          break;
        default:
          throw new Error(`Unknown node type: ${node.type}`);
      }

      // Delay after action
      if (config.delay) {
        await this.sleep(config.delay);
      }

      console.log('[Zentri Executor] Node executed successfully:', result);
      return { success: true, result };
    } catch (error) {
      console.error('[Zentri Executor] Node execution failed:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Wait for element to appear in DOM
   */
  async waitForElement(selector, selectorType, timeout = 5000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const element = this.findElement(selector, selectorType);
      if (element) {
        return element;
      }
      await this.sleep(100);
    }

    return null;
  },

  /**
   * Find element by selector and type
   */
  findElement(selector, selectorType) {
    try {
      if (selectorType === 'xpath') {
        const result = document.evaluate(
          selector,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null,
        );
        return result.singleNodeValue;
      } else {
        // CSS selector (includes id, testid, css)
        return document.querySelector(selector);
      }
    } catch (e) {
      console.warn('[Zentri Executor] Selector error:', e);
      return null;
    }
  },

  /**
   * Execute click action
   */
  async executeClick(element, config) {
    const clickType = config.clickType || 'Left click';

    if (clickType === 'Double click') {
      element.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }));
    } else if (clickType === 'Right click') {
      element.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    } else {
      // Scroll element into view first
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await this.sleep(300);
      element.click();
    }

    return { action: 'click', clickType };
  },

  /**
   * Execute input/type action
   */
  async executeInput(element, config) {
    const text = config.text || config.textToEnter || '';
    const clearBefore = config.clearBefore !== false;
    const typingDelay = config.typingDelay || 50;

    // Focus element
    element.focus();
    await this.sleep(100);

    // Clear if needed
    if (clearBefore) {
      element.value = '';
    }

    // Type text with delay
    for (const char of text) {
      element.value += char;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      await this.sleep(typingDelay);
    }

    // Trigger change event
    element.dispatchEvent(new Event('change', { bubbles: true }));

    return { action: 'input', text };
  },

  /**
   * Execute assert/check action
   */
  async executeAssert(element, config) {
    const assertType = config.assertType || 'Is Visible';

    let passed = false;
    if (assertType === 'Is Visible') {
      passed = element && element.offsetParent !== null;
    } else if (assertType === 'Is Hidden') {
      passed = !element || element.offsetParent === null;
    } else if (assertType === 'Contains Text') {
      const expectedText = config.expectedText || '';
      passed = element.textContent.includes(expectedText);
    } else if (assertType === 'Has Attribute') {
      const attrName = config.attributeName || '';
      passed = element.hasAttribute(attrName);
    }

    if (!passed) {
      throw new Error(`Assertion failed: ${assertType}`);
    }

    return { action: 'assert', assertType, passed };
  },

  /**
   * Execute hover action
   */
  async executeHover(element, config) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await this.sleep(300);

    element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, cancelable: true }));
    element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, cancelable: true }));

    return { action: 'hover' };
  },

  /**
   * Execute extract text action
   */
  async executeExtract(element, config) {
    const text = element.textContent.trim();
    console.log('[Zentri Executor] Extracted text:', text);
    return { action: 'extract', text };
  },

  /**
   * Execute scroll action
   */
  async executeScroll(element, config) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await this.sleep(500);
    return { action: 'scroll' };
  },

  /**
   * Execute go to URL action
   */
  async executeGoToUrl(config) {
    const url = config.url || '';
    if (url) {
      window.location.href = url;
      return { action: 'go_to_url', url };
    }
    throw new Error('No URL specified');
  },

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },
};

// ============================================================================
// INITIALIZATION
// ============================================================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'START_RECORDING') {
    RecordingControls.startRecording();
    sendResponse({ success: true });
  } else if (message.type === 'STOP_RECORDING') {
    RecordingControls.stopRecording();
    sendResponse({ success: true });
  } else if (message.type === 'GET_STATUS') {
    sendResponse({ isRecording: RecorderState.isRecording });
  } else if (message.type === 'EXECUTE_NODE') {
    // Execute workflow node
    WorkflowExecutor.executeNode(message.node).then((result) => {
      sendResponse(result);
    });
    return true; // Keep channel open for async response
  } else if (message.type === 'EXECUTE_WORKFLOW') {
    // Execute entire workflow
    (async () => {
      const nodes = message.nodes || [];
      const results = [];

      for (const node of nodes) {
        const result = await WorkflowExecutor.executeNode(node);
        results.push({ node, result });

        if (!result.success && !result.skipped) {
          // Stop on error
          sendResponse({ success: false, results, error: result.error });
          return;
        }
      }

      sendResponse({ success: true, results });
    })();
    return true; // Keep channel open for async response
  }
  return true;
});

chrome.storage.local.get(['isRecording'], (result) => {
  // Always start in OFF state - never auto-start recording
  RecordingControls.stopRecording();
  console.log('[Zentri Executor] Initialized in OFF state');
  console.log('[Zentri Executor] Playback mode ready');
});

console.log('[Zentri Recorder] Content script loaded (Clean & Modular + Playback)');
