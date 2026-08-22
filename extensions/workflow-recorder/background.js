// Zentri Workflow Recorder - Background Script
// Handles communication between content script and Electron app

console.log('[Zentri Recorder] Background script initializing...');

// WebSocket connection to Electron app
let ws = null;
let reconnectTimer = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 50;
let autoStarted = false; // Track if we've auto-started recording

// Toggle recording when extension icon is clicked
chrome.action.onClicked.addListener(async (tab) => {
  console.log('[Zentri Recorder] Extension icon clicked, toggling recording state');

  // Get current recording state
  const result = await chrome.storage.local.get(['isRecording']);
  const isRecording = result.isRecording || false;

  if (isRecording) {
    // Stop recording
    console.log('[Zentri Recorder] 🛑 Stopping recording via icon click');
    chrome.storage.local.set({ isRecording: false });

    // Notify all tabs
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (
          tab.url &&
          !tab.url.startsWith('chrome://') &&
          !tab.url.startsWith('chrome-extension://')
        ) {
          chrome.tabs.sendMessage(tab.id, { type: 'STOP_RECORDING' }, () => {
            if (chrome.runtime.lastError) {
              console.log(
                `[Zentri Recorder] Cannot send to tab ${tab.id}: ${chrome.runtime.lastError.message}`,
              );
            }
          });
        }
      });
    });

    // Update icon to OFF state - use badge instead of icon
    chrome.action.setBadgeText({ text: '' });
    chrome.action.setBadgeBackgroundColor({ color: '#6b7280' });
    chrome.action.setTitle({ title: 'Start Recording (OFF)' });
  } else {
    // Start recording
    console.log('[Zentri Recorder] 🎬 Starting recording via icon click');
    chrome.storage.local.set({ isRecording: true });

    // Notify all tabs
    chrome.tabs.query({}, (tabs) => {
      console.log(`[Zentri Recorder] Broadcasting START_RECORDING to ${tabs.length} tabs`);
      tabs.forEach((tab) => {
        if (
          tab.url &&
          !tab.url.startsWith('chrome://') &&
          !tab.url.startsWith('chrome-extension://')
        ) {
          chrome.tabs.sendMessage(tab.id, { type: 'START_RECORDING' }, () => {
            if (chrome.runtime.lastError) {
              console.log(
                `[Zentri Recorder] Cannot send to tab ${tab.id}: ${chrome.runtime.lastError.message}`,
              );
            }
          });
        }
      });
    });

    // Update icon to ON state - show red badge with "REC"
    chrome.action.setBadgeText({ text: 'REC' });
    chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
    chrome.action.setTitle({ title: 'Stop Recording (ON)' });
  }
});

// Connect to Electron app via WebSocket
function connectToElectron() {
  console.log(
    `[Zentri Recorder] Attempting to connect to ws://127.0.0.1:8999 (attempt ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`,
  );

  try {
    ws = new WebSocket('ws://127.0.0.1:8999?client=recorder');

    ws.onopen = () => {
      console.log('[Zentri Recorder] ✅ Connected to Electron app successfully!');
      reconnectAttempts = 0;

      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }

      // Auto-start recording when connected (only once per session)
      if (!autoStarted) {
        autoStarted = true;
        chrome.storage.local.set({ isRecording: true });
        console.log('[Zentri Recorder] 🎬 Auto-started recording mode');

        // Update icon to ON state
        chrome.action.setBadgeText({ text: 'REC' });
        chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
        chrome.action.setTitle({ title: 'Stop Recording (ON)' });

        // Notify all existing tabs
        chrome.tabs.query({}, (tabs) => {
          console.log(`[Zentri Recorder] Broadcasting START_RECORDING to ${tabs.length} tabs`);
          tabs.forEach((tab) => {
            if (
              tab.url &&
              !tab.url.startsWith('chrome://') &&
              !tab.url.startsWith('chrome-extension://')
            ) {
              chrome.tabs.sendMessage(tab.id, { type: 'START_RECORDING' }, () => {
                // Ignore errors for tabs that can't receive messages
                if (chrome.runtime.lastError) {
                  console.log(
                    `[Zentri Recorder] Cannot send to tab ${tab.id}: ${chrome.runtime.lastError.message}`,
                  );
                }
              });
            }
          });
        });
      }
    };

    ws.onclose = () => {
      console.log('[Zentri Recorder] ❌ Disconnected from Electron app');
      ws = null;

      // Reconnect with exponential backoff
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        const baseDelay = Math.min(2000 * Math.pow(1.5, reconnectAttempts), 30000);
        const delay = baseDelay + Math.floor(Math.random() * baseDelay * 0.25);
        reconnectAttempts++;

        console.log(
          `[Zentri Recorder] Will reconnect in ${Math.round(delay)}ms (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`,
        );
        reconnectTimer = setTimeout(connectToElectron, delay);
      } else {
        console.log(
          '[Zentri Recorder] Max reconnection attempts reached. Will retry in 2 minutes.',
        );
        reconnectAttempts = 0;
        reconnectTimer = setTimeout(connectToElectron, 120000);
      }
    };

    ws.onerror = (error) => {
      console.error('[Zentri Recorder] ❌ WebSocket error:', error);
      console.error(
        '[Zentri Recorder] Make sure Electron app is running and WebSocket server is started on port 8999',
      );
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('[Zentri Recorder] 📨 Received from Electron:', message);

        // Handle messages from Electron
        if (message.type === 'STOP_RECORDING') {
          console.log('[Zentri Recorder] 🛑 Stopping recording');

          // Update icon to OFF state
          chrome.action.setBadgeText({ text: '' });
          chrome.action.setBadgeBackgroundColor({ color: '#6b7280' });
          chrome.action.setTitle({ title: 'Start Recording (OFF)' });

          // Broadcast stop to all tabs
          chrome.tabs.query({}, (tabs) => {
            tabs.forEach((tab) => {
              chrome.tabs.sendMessage(tab.id, { type: 'STOP_RECORDING' });
            });
          });
          chrome.storage.local.set({ isRecording: false });
          autoStarted = false; // Reset for next session
        }
      } catch (error) {
        console.error('[Zentri Recorder] Error parsing message:', error);
      }
    };
  } catch (error) {
    console.error('[Zentri Recorder] ❌ Failed to create WebSocket:', error);
    reconnectTimer = setTimeout(connectToElectron, 2000);
  }
}

// Start connection attempt with initial delay
console.log('[Zentri Recorder] Will connect to Electron app in 1 second...');

// Initialize icon state based on stored recording state
chrome.storage.local.get(['isRecording'], (result) => {
  const isRecording = result.isRecording || false;
  if (isRecording) {
    chrome.action.setBadgeText({ text: 'REC' });
    chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
    chrome.action.setTitle({ title: 'Stop Recording (ON)' });
  } else {
    chrome.action.setBadgeText({ text: '' });
    chrome.action.setBadgeBackgroundColor({ color: '#6b7280' });
    chrome.action.setTitle({ title: 'Start Recording (OFF)' });
  }
});

setTimeout(() => {
  connectToElectron();
}, 1000);

// Auto-start recording for newly opened tabs when recording is active
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === 'complete' &&
    tab.url &&
    !tab.url.startsWith('chrome://') &&
    !tab.url.startsWith('chrome-extension://')
  ) {
    chrome.storage.local.get(['isRecording'], (result) => {
      if (result.isRecording) {
        console.log(`[Zentri Recorder] 📄 New tab loaded: ${tab.url}, starting recording`);
        // Small delay to ensure content script is loaded
        setTimeout(() => {
          chrome.tabs.sendMessage(tabId, { type: 'START_RECORDING' }, () => {
            // Ignore errors
            if (chrome.runtime.lastError) {
              console.log(
                `[Zentri Recorder] Cannot send to new tab: ${chrome.runtime.lastError.message}`,
              );
            }
          });
        }, 500);
      }
    });
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'RECORD_NODE') {
    console.log('[Zentri Recorder] 📝 Node recorded from tab:', sender.tab?.id, message.data);

    // Send to Electron app via WebSocket
    if (ws && ws.readyState === WebSocket.OPEN) {
      console.log('[Zentri Recorder] 📤 Sending node to Electron via WebSocket');
      try {
        ws.send(
          JSON.stringify({
            type: 'RECORD_NODE',
            data: message.data,
          }),
        );
        sendResponse({ success: true, method: 'websocket' });
        console.log('[Zentri Recorder] ✅ Node sent successfully');
      } catch (error) {
        console.error('[Zentri Recorder] ❌ Error sending node:', error);
        sendResponse({ success: false, error: error.message });
      }
    } else {
      console.warn('[Zentri Recorder] ⚠️ WebSocket not connected, saving to storage as fallback');
      // Fallback: save to local storage for polling
      chrome.storage.local.get(['recordedNodes'], (result) => {
        const nodes = result.recordedNodes || [];
        nodes.push(message.data);
        chrome.storage.local.set({ recordedNodes: nodes });
        sendResponse({ success: true, method: 'storage' });
      });
    }
  }
  return true;
});

// Cleanup on unload
chrome.runtime.onSuspend.addListener(() => {
  console.log('[Zentri Recorder] Extension suspending, cleaning up...');
  if (ws) {
    ws.close();
  }
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
  }
});

console.log('[Zentri Recorder] Background script loaded and ready');
