// Zentri Workflow Recorder - Modal Event Handler Module
// Handles all modal interactions and event listeners

import { generateModalHTML } from './modal-template.js';
import {
  getClickConfig,
  getTypeConfig,
  getAssertConfig,
  getDefaultConfig,
} from './config-templates.js';
import { setActionPopup } from './recorder-state.js';
import { sendNodeToApp } from './utils.js';

/**
 * Show action configuration modal
 */
export function showActionPopup(x, y, selector, element, generateAllSelectors) {
  // Remove existing popup
  const existingPopup = document.getElementById('zentri-modal-backdrop');
  if (existingPopup) {
    existingPopup.remove();
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

  popup.innerHTML = generateModalHTML(
    element,
    allSelectors,
    selector,
    elementContent,
    maxModalHeight,
  );

  // Append modal to backdrop, then backdrop to body
  backdrop.appendChild(popup);
  document.body.appendChild(backdrop);
  setActionPopup(backdrop);

  // Setup modal state and event listeners
  setupModalInteractions(popup, backdrop, selector, allSelectors, element);
}

/**
 * Setup all modal interactions and event listeners
 */
function setupModalInteractions(popup, backdrop, selector, allSelectors, element) {
  // State management
  let currentAction = 'click';
  let currentSelectorType = selector.type;
  let currentSelector = allSelectors[currentSelectorType];

  // Close modal when clicking backdrop
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) {
      backdrop.remove();
      setActionPopup(null);
    }
  });

  // Update config panel based on action
  function updateConfigPanel() {
    const configPanel = popup.querySelector('#zentri-config-panel');

    if (currentAction === 'click') {
      configPanel.innerHTML = getClickConfig();
      setupStepper(popup, 'timeout', 3000, 100, 10000);
      const waitToggle = configPanel.querySelector('#zentri-wait-element');
      waitToggle?.addEventListener('click', () => waitToggle.classList.toggle('on'));
    } else if (currentAction === 'type') {
      configPanel.innerHTML = getTypeConfig();
      setupStepper(popup, 'typing-delay', 50, 10, 500);
      const clearToggle = configPanel.querySelector('#zentri-clear-before');
      clearToggle?.addEventListener('click', () => clearToggle.classList.toggle('on'));
    } else if (currentAction === 'assert') {
      configPanel.innerHTML = getAssertConfig();
      setupStepper(popup, 'assert-timeout', 5000, 100, 30000);
    } else {
      configPanel.innerHTML = getDefaultConfig();
    }

    // Setup common steppers and toggles for all actions
    setupStepper(popup, 'retry', 2, 1, 10);
    setupStepper(popup, 'delay', 500, 100, 5000);

    // Setup all toggle switches
    configPanel.querySelectorAll('.zentri-switch').forEach((sw) => {
      sw.addEventListener('click', (e) => {
        e.stopPropagation();
        sw.classList.toggle('on');
      });
    });
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
    setActionPopup(null);
  });

  // Handle cancel button
  popup.querySelector('.zentri-cancel-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    backdrop.remove();
    setActionPopup(null);
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
    setActionPopup(null);
  });

  // Handle keyboard shortcuts
  document.addEventListener('keydown', function handleKeyDown(e) {
    if (!backdrop.parentElement) {
      document.removeEventListener('keydown', handleKeyDown);
      return;
    }

    if (e.key === 'Escape') {
      backdrop.remove();
      setActionPopup(null);
    } else if (e.key === 'Enter' && !e.target.matches('input, textarea, select')) {
      popup.querySelector('.zentri-add-btn')?.click();
    }
  });
}

/**
 * Setup stepper control (increment/decrement buttons)
 */
function setupStepper(popup, id, initial, step, max) {
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
