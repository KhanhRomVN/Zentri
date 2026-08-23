// Zentri Workflow Recorder - Recording State Management Module
// Handles recording state, overlay creation, and event listeners

let isRecording = false;
let hoveredElement = null;
let overlay = null;
let actionPopup = null;

/**
 * Get current recording state
 */
export function getRecordingState() {
  return { isRecording, hoveredElement, overlay, actionPopup };
}

/**
 * Set action popup reference
 */
export function setActionPopup(popup) {
  actionPopup = popup;
}

/**
 * Highlight element with overlay
 */
export function highlightElement(element) {
  if (overlay) {
    const rect = element.getBoundingClientRect();
    overlay.style.top = `${rect.top + window.scrollY}px`;
    overlay.style.left = `${rect.left + window.scrollX}px`;
    overlay.style.width = `${rect.width}px`;
    overlay.style.height = `${rect.height}px`;
    overlay.style.display = 'block';
  }
}

/**
 * Handle mouse move event
 */
export function handleMouseMove(e) {
  if (!isRecording) return;
  hoveredElement = e.target;
  highlightElement(hoveredElement);
}

/**
 * Start recording mode
 */
export function startRecording(onClickHandler) {
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
  document.addEventListener('click', onClickHandler, true);

  // Save to storage
  chrome.storage.local.set({ isRecording: true });
}

/**
 * Stop recording mode
 */
export function stopRecording(onClickHandler) {
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
  document.removeEventListener('click', onClickHandler, true);

  // Save to storage
  chrome.storage.local.set({ isRecording: false });
}
